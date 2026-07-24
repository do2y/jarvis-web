import { useCallback, useEffect, useRef } from "react";
import { track } from "@/shared/analytics/track";
import { ApiError } from "@/shared/api/client";
import { streamChat, StreamStartError } from "@/shared/chat/streamChat";
import {
  openChatSession,
  openSellerSession,
  reissueTicket,
} from "@/shared/chat/sessions";
import { fetchChatListCards } from "@/shared/chat/lists";
import type {
  ChatAction,
  ChatChannel,
  ChatEvent,
  ChatScreenContext,
  ChatSession,
  SellerPanel,
  StreamChatBody,
} from "@/shared/types/chat";
import { useChatStore } from "./store";

function newId(): string {
  return crypto.randomUUID();
}

interface UseChatOptions {
  channel: ChatChannel;
  /** 채널별 액션 후처리(장바구니 invalidate 등). 안내 문구 표시는 공통 처리. */
  onAction?: (action: ChatAction) => void;
  /**
   * 스트림 종료 시 우측 패널 조치(판매자 전용). done.panel 을 그대로 전달한다.
   * replace(패널 교체) / keep(유지) / refresh(목록 재조회). error 로 끝나면 호출되지 않는다.
   */
  onDone?: (panel: SellerPanel | undefined) => void;
  /**
   * 전송 시점의 화면 맥락을 반환하는 함수(사이드 채팅 전용).
   * 값이 아닌 함수로 받는 이유: 사용자가 목록을 이동하며 대화하므로
   * 훅 초기화 시점이 아니라 매 전송 시점의 화면을 실어야 한다.
   */
  getScreenContext?: () => ChatScreenContext | undefined;
}

export function useChat({
  channel,
  onAction,
  onDone,
  getScreenContext,
}: UseChatOptions) {
  const {
    isStreaming,
    addMessage,
    appendToLastAssistant,
    failLastAssistant,
    setResults,
    addResult,
    settleDraft,
    setConditions,
    setSuggestions,
    setSessionId,
    setStreaming,
    setLane,
    setProgress,
    setAnalysisReport,
    reset,
  } = useChatStore();

  // 진행 중 요청 취소용
  const abortRef = useRef<AbortController | null>(null);

  // 콜백들은 매 렌더 갱신되도록 ref로 보관(send의 deps를 안정적으로 유지)
  const onActionRef = useRef(onAction);
  const onDoneRef = useRef(onDone);
  const getScreenContextRef = useRef(getScreenContext);
  useEffect(() => {
    onActionRef.current = onAction;
    onDoneRef.current = onDone;
    getScreenContextRef.current = getScreenContext;
  });

  // 채널별 세션 발급(CH-6/CH-1) — 새 대화 시작 시 세션 생성 + 첫 티켓.
  const createSession = useCallback((): Promise<ChatSession> => {
    return channel === "SELLER"
      ? openSellerSession()
      : openChatSession(channel);
  }, [channel]);

  // 스트림 진입 티켓 확보 — 티켓 TTL 이 30~60초로 짧아 매 전송 직전에 확보한다.
  // 기존 sessionId 가 있으면 재발급(CH-1b)으로 세션·맥락을 유지하고, 없으면 새로 발급한다.
  // 재발급이 404(SESSION_NOT_FOUND: 만료·미존재)면 새 세션으로 폴백한다.
  // sessionId 는 항상 발급 응답값을 쓴다(BE·Redis 발급, sliding TTL) — 클라이언트가 만들지 않는다.
  const acquireTicket = useCallback((): Promise<ChatSession> => {
    const existing = useChatStore.getState().sessionId;
    if (!existing) return createSession();
    return reissueTicket(existing).catch((err: unknown) => {
      if (err instanceof ApiError && err.code === "SESSION_NOT_FOUND") {
        return createSession(); // 만료된 세션 → 새 세션으로 시작
      }
      throw err;
    });
  }, [createSession]);

  /**
   * 스트림 실행 공통부 — 일반 발화(send)와 승인(confirm)이 공유한다.
   * userText 가 있으면 사용자 말풍선을 추가하고(발화), confirm 은 말풍선 없이 실행만 한다.
   * buildBody 는 발급받은 sessionId·threadId 를 받아 SSE body 를 만든다(신원은 티켓에 있음).
   */
  const run = useCallback(
    async (
      buildBody: (base: {
        sessionId: string;
        threadId: string;
      }) => StreamChatBody,
      userText: string | null,
    ) => {
      if (useChatStore.getState().isStreaming) return;

      if (userText !== null) {
        addMessage({ id: newId(), role: "user", text: userText });
      }
      // 스트리밍으로 채워질 빈 assistant 메시지 선 추가
      addMessage({ id: newId(), role: "assistant", text: "" });
      setStreaming(true);
      setLane(null);
      setProgress(null);
      // 이전 리포트는 유지(새 스트림이 analysis+replace로 끝날 때만 교체) — done에서 갱신

      // 한 응답 안에서 여러 결과 이벤트가 올 수 있다. 첫 결과가 도착할 때
      // 이전 턴의 결과를 비우고, 그 뒤부터는 누적한다.
      let replacedResults = false;
      const pushResult: typeof addResult = (result) => {
        if (!replacedResults) {
          replacedResults = true;
          setResults([result]);
          return;
        }
        addResult(result);
      };

      // products.ready(경로 B)의 CH-5 조회는 비동기다. 스트림 종료(finally) 전에
      // 완료를 보장하려고 promise 를 모아 두고 스트림 소비 후 함께 기다린다.
      const pendingFetches: Promise<void>[] = [];

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // 1) 티켓 확보(Spring REST) — 기존 세션이면 재발급(CH-1b), 아니면 새 발급(CH-6/CH-1).
        //    sessionId 는 서버 발급값을 저장·사용(재발급도 같은 sessionId 를 돌려준다).
        const session = await acquireTicket();
        setSessionId(session.sessionId);

        // threadId(계약 CH-2): 대화 스레드(방) 식별자, 필수. **MVP 는 sessionId 와 동일 값**을 싣는다
        // (post-MVP 에 방이 분리되면 방마다 고유 값으로 분화 — 계약은 지금부터 이 필드를 유지).
        const threadId = session.sessionId;
        useChatStore.getState().setThreadId(threadId);

        const body = buildBody({ sessionId: session.sessionId, threadId });

        const onEvent = (e: ChatEvent) => {
          switch (e.type) {
            case "meta":
              // 첫 프레임 — 레인으로 즉시 레이아웃·로딩 준비
              setLane(e.data.lane);
              // 새 분석이 시작되면 이전 리포트를 비운다(스켈레톤부터 다시 시작)
              if (e.data.lane === "analysis") setAnalysisReport(null);
              break;
            case "progress":
              // 분석 진행 상태(최종 답변 아님)
              setProgress(e.data.text);
              break;
            case "token":
              setProgress(null); // 실제 답변이 시작되면 진행 표시 제거
              appendToLastAssistant(e.data.text);
              break;
            case "conditions":
              // AI 추출 조건 칩(제거 가능). 새 턴이 오면 이전 칩을 덮어쓴다.
              setConditions(e.data.chips);
              break;
            case "suggestions":
              // 완화·되돌리기 제안 칩. estCount==0 은 방어적으로 제외.
              setSuggestions(e.data.chips.filter((c) => c.estCount > 0));
              break;
            case "products.ready": {
              // 경로 B — 카드는 SSE에 없다. listId 로 CH-5 목록을 조회해 패널에 넣는다.
              // 조회 실패(404 등)는 재시도 버튼이 아니라 안내만 — 답변 자체는 정상 종료됐으므로.
              const { listId } = e.data;
              pendingFetches.push(
                fetchChatListCards(listId)
                  .then((items) => {
                    if (items.length) {
                      pushResult({
                        kind: "products",
                        groups: [{ title: "추천 상품", items }],
                      });
                    }
                  })
                  .catch(() => {
                    appendToLastAssistant(
                      "\n\n추천 목록을 불러오지 못했어요. 다시 시도해 주세요.",
                    );
                  }),
              );
              break;
            }
            case "products":
              pushResult({ kind: "products", groups: e.data.groups });
              break;
            case "draft":
              pushResult({ kind: "draft", draft: e.data });
              break;
            case "action": {
              // CART_ADDED·PRODUCT_UPDATED 등 — 안내 문구를 대화에 덧붙임
              const action = e.data;
              appendToLastAssistant(`\n\n${action.message}`);
              // 수정 결과면 해당 draft 카드를 확정 상태로 잠금
              if (
                action.type === "PRODUCT_UPDATED" ||
                action.type === "PRODUCT_UPDATE_FAILED"
              ) {
                const pending = useChatStore
                  .getState()
                  .results.find(
                    (r) =>
                      r.kind === "draft" &&
                      !r.settled &&
                      r.draft.productId === action.productId,
                  );
                if (pending?.kind === "draft") {
                  settleDraft(pending.draft.draftId, action);
                }
              }
              if (action.type === "CART_ADDED") {
                track("add_to_cart", {
                  properties: { source: "chat", cartItemId: action.cartItemId },
                });
              }
              onActionRef.current?.(action);
              break;
            }
            case "done": {
              setProgress(null);
              // zero_result: 결과 0건(에러 아님). AI token 안내가 없었으면 기본 문구로 채운다.
              if (e.data.finishReason === "zero_result") {
                const last = useChatStore.getState().messages.slice(-1)[0];
                if (last?.role === "assistant" && !last.text) {
                  appendToLastAssistant(
                    "조건에 맞는 상품을 찾지 못했어요. 조건을 바꿔 다시 시도해 주세요.",
                  );
                }
              }
              // 분석 리포트(analysis+replace)는 우측 패널로 교체된다. 계약상 리포트는
              // 단일 token이라 마지막 assistant 텍스트를 그대로 리포트 본문으로 승계한다.
              const st = useChatStore.getState();
              if (st.lane === "analysis" && e.data.panel === "replace") {
                const last = st.messages[st.messages.length - 1];
                if (last?.role === "assistant" && last.text) {
                  setAnalysisReport(last.text);
                }
              }
              onDoneRef.current?.(e.data.panel);
              break;
            }
            case "error":
              // 종결 이벤트 — 해당 말풍선에 에러 표시(재시도 버튼). code별 분기는 불필요,
              // message가 사용자 노출 문구다(계약 §error).
              failLastAssistant(e.data.message);
              break;
          }
        };

        // 2) llmSseUrl + streamTicket 으로 SSE 스트림 소비.
        //    티켓 만료 401(스트림 시작 전 거부)이면 재발급 후 1회만 재시도한다(계약 CH-2).
        //    토큰 수신이 시작된 뒤의 오류는 SSE error 이벤트로 오므로 여기서 재시도하지 않는다
        //    (중복 담기 방지). 재발급도 실패하면 catch 로 떨어진다.
        try {
          await streamChat(
            session.llmSseUrl,
            session.streamTicket,
            body,
            onEvent,
            controller.signal,
          );
        } catch (err) {
          if (err instanceof StreamStartError && err.status === 401) {
            const fresh = await reissueTicket(session.sessionId);
            setSessionId(fresh.sessionId);
            await streamChat(
              fresh.llmSseUrl,
              fresh.streamTicket,
              body,
              onEvent,
              controller.signal,
            );
          } else {
            throw err;
          }
        }

        // 스트림이 끝나도 products.ready 의 CH-5 조회가 남아 있을 수 있다 — 함께 기다린다.
        // (각 조회는 내부에서 catch 하므로 여기서 예외로 실패 처리되지 않는다.)
        if (pendingFetches.length) await Promise.all(pendingFetches);
      } catch {
        // 자동 재시도 금지 — 해당 말풍선에 에러 표시, 재시도 버튼 제공.
        // 세션 발급 실패(401/403/404)·티켓 재발급 실패도 여기로 떨어진다(스트림 시작 전 거부).
        failLastAssistant("응답을 받지 못했어요. 다시 시도해 주세요.");
      } finally {
        setStreaming(false);
        setProgress(null);
        abortRef.current = null;
      }
    },
    [
      addMessage,
      appendToLastAssistant,
      failLastAssistant,
      setConditions,
      setSuggestions,
      setResults,
      addResult,
      settleDraft,
      setSessionId,
      setStreaming,
      setLane,
      setProgress,
      setAnalysisReport,
      acquireTicket,
    ],
  );

  const send = useCallback(
    (message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;

      // 이 앱의 상품 검색은 챗봇이다. 단 "[조건 제거]"·"[수정 확인]" 같은 제어 메시지는
      // 사용자의 검색 의도가 아니므로 제외한다. 검색어 자체는 개인정보가 섞일 수 있어
      // 보내지 않고 채널·길이만 싣는다(명세: properties에 개인정보 금지).
      if (!trimmed.startsWith("[")) {
        track("search", {
          properties: { channel, queryLength: trimmed.length },
        });
      }

      // 전송 시점의 화면을 싣는다(사이드 채팅에서 목록을 옮겨다니며 대화하므로)
      const screen = getScreenContextRef.current?.();

      return run(
        ({ sessionId, threadId }) => ({
          sessionId,
          threadId,
          message: trimmed,
          ...(screen ? { screen } : {}),
        }),
        trimmed,
      );
    },
    [channel, run],
  );

  // draft 승인 — 발화가 아니라 최상위 action/draftId 로 확정한다(발화≠동의, 계약 v2).
  const confirm = useCallback(
    (draftId: string) => {
      return run(
        ({ sessionId, threadId }) => ({
          sessionId,
          threadId,
          action: "confirm",
          draftId,
        }),
        null, // 승인은 사용자 말풍선을 남기지 않는다
      );
    },
    [run],
  );

  // 실패한 응답 재시도 — 에러난 (user, assistant) 쌍을 제거하고 같은 메시지로 다시 전송
  const retry = useCallback(() => {
    const userText = useChatStore.getState().dropLastExchange();
    if (userText) send(userText);
  }, [send]);

  // 조건 칩 제거 = 후속 메시지 왕복(별도 API 없음, 계약 CH-2 §conditions).
  // 규약 문자열에 칩의 field 를 실어 서버가 해당 조건을 빼고 재분해하게 한다.
  const removeCondition = useCallback(
    (field: string) => {
      send(`[조건 제거] ${field}`);
    },
    [send],
  );

  // 제안 칩(완화·되돌리기) 적용 = 칩 label 을 다음 턴 message 로 보내는 왕복(계약 §suggestions).
  // label 이 사용자 발화 형태("6만원대까지 볼까요?")라 그대로 실으면 LLM 이 완화를 트리거한다.
  const applySuggestion = useCallback(
    (label: string) => {
      send(label);
    },
    [send],
  );

  // 새 대화 — 세션·티켓은 다음 전송 때 새로 발급하므로 여기선 로컬 상태만 비운다.
  // sessionId 는 BE 발급값이라 클라이언트가 미리 만들지 않는다(reset 이 null 로 되돌림).
  const startNewChat = useCallback(() => {
    abortRef.current?.abort();
    reset();
  }, [reset]);

  return {
    send,
    confirm,
    retry,
    removeCondition,
    applySuggestion,
    startNewChat,
    isStreaming,
  };
}
