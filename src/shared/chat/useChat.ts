import { useCallback, useEffect, useRef } from "react";
import {
  ChatHttpError,
  issueChatSession,
  reissueChatTicket,
  streamChat,
  type ChatSession,
} from "@/shared/chat/streamChat";
import { api } from "@/shared/api/client";
import { track } from "@/shared/analytics/track";
import type {
  ChatAction,
  ChatChannel,
  ChatEvent,
  ChatRequest,
  ChatScreenContext,
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
   * 전송 시점의 화면 맥락을 반환하는 함수(사이드 채팅 전용).
   * 값이 아닌 함수로 받는 이유: 사용자가 목록을 이동하며 대화하므로
   * 훅 초기화 시점이 아니라 매 전송 시점의 화면을 실어야 한다.
   */
  getScreenContext?: () => ChatScreenContext | undefined;
}

export function useChat({
  channel,
  onAction,
}: UseChatOptions) {
  const {
    sessionId,
    isStreaming,
    addMessage,
    appendToLastAssistant,
    failLastAssistant,
    setResults,
    addResult,
    settleProductDiff,
    setConditions,
    setSessionId,
    setStreaming,
    reset,
  } = useChatStore();

  // 진행 중 요청 취소용
  const abortRef = useRef<AbortController | null>(null);
  const sessionRef = useRef<ChatSession | null>(null);

  // 콜백들은 매 렌더 갱신되도록 ref로 보관(send의 deps를 안정적으로 유지)
  const onActionRef = useRef(onAction);
  useEffect(() => {
    onActionRef.current = onAction;
  });

  const send = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed || useChatStore.getState().isStreaming) return;

      // 제어 메시지는 검색 이벤트에서 제외하고, 원문 대신 채널·길이만 기록한다.
      if (!trimmed.startsWith("[")) {
        track("search", {
          properties: { channel, queryLength: trimmed.length },
        });
      }

      addMessage({ id: newId(), role: "user", text: trimmed });
      // 스트리밍으로 채워질 빈 assistant 메시지 선 추가
      addMessage({ id: newId(), role: "assistant", text: "" });
      setStreaming(true);

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

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const session = sessionRef.current ?? (await issueChatSession(channel));
        sessionRef.current = session;
        setSessionId(session.sessionId);
        const req: ChatRequest = {
          sessionId: session.sessionId,
          threadId: session.sessionId,
          message: trimmed,
        };

        const handleEvent = async (e: ChatEvent) => {
          switch (e.event) {
            case "token":
              appendToLastAssistant(e.data.text);
              break;
            case "conditions":
              setConditions(e.data.chips.map((chip) => chip.label));
              break;
            case "products.ready": {
              const { data } = await api.get<{
                items: Array<{
                  productId: number;
                  name: string;
                  brandName: string;
                  price: number;
                  originalPrice: number;
                  imageUrl: string;
                  rating: number;
                  reviewCount: number;
                  reason: string | null;
                }>;
              }>(`/api/chat/lists/${e.data.listId}`);
              pushResult({
                kind: "products",
                groups: [
                  {
                    title: "추천 상품",
                    items: data.items.map((item) => ({
                      ...item,
                      reason: item.reason ?? "추천 상품",
                    })),
                  },
                ],
              });
              break;
            }
            case "products":
              pushResult({ kind: "products", groups: e.data.groups });
              break;
            case "metrics":
              pushResult({ kind: "metrics", items: e.data.items });
              break;
            case "analysis":
              pushResult({ kind: "analysis", analysis: e.data });
              break;
            case "productStats":
              pushResult({ kind: "productStats", stats: e.data });
              break;
            case "productDiff":
              pushResult({ kind: "productDiff", diff: e.data });
              break;
            case "draft":
              pushResult({
                kind: "productDiff",
                diff: {
                  draftId: e.data.draftId,
                  productId: e.data.productId ?? 0,
                  productName: e.data.productId
                    ? `상품 #${e.data.productId}`
                    : "새 상품",
                  fields: e.data.changes.map((change) => ({
                    ...change,
                    label: change.field,
                  })),
                  confirmMessage: e.data.summary,
                },
              });
              break;
            case "action": {
              // CART_ADDED·PRODUCT_UPDATED 등 — 안내 문구를 대화에 덧붙임
              const action = e.data;
              appendToLastAssistant(`\n\n${action.message}`);
              // 수정 결과면 해당 diff 카드를 확정 상태로 잠금
              if (
                action.type === "PRODUCT_UPDATED" ||
                action.type === "PRODUCT_UPDATE_FAILED"
              ) {
                const pending = useChatStore
                  .getState()
                  .results.find(
                    (r) =>
                      r.kind === "productDiff" &&
                      !r.settled &&
                      r.diff.productId === action.productId,
                  );
                if (pending?.kind === "productDiff") {
                  settleProductDiff(pending.diff.draftId, action);
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
            case "done":
              break;
            case "error":
              failLastAssistant(e.data.message);
              break;
          }
        };

        try {
          await streamChat(session, req, handleEvent, controller.signal);
        } catch (error) {
          if (!(error instanceof ChatHttpError) || error.status !== 401) throw error;
          const refreshed = await reissueChatTicket(session.sessionId);
          sessionRef.current = refreshed;
          await streamChat(refreshed, req, handleEvent, controller.signal);
        }
      } catch {
        // 자동 재시도 금지 — 해당 말풍선에 에러 표시, 재시도 버튼 제공
        failLastAssistant("응답을 받지 못했어요. 다시 시도해 주세요.");
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [
      channel,
      addMessage,
      appendToLastAssistant,
      failLastAssistant,
      setConditions,
      setResults,
      addResult,
      settleProductDiff,
      setSessionId,
      setStreaming,
    ],
  );

  // 실패한 응답 재시도 — 에러난 (user, assistant) 쌍을 제거하고 같은 메시지로 다시 전송
  const retry = useCallback(() => {
    const userText = useChatStore.getState().dropLastExchange();
    if (userText) send(userText);
  }, [send]);

  // 조건 칩 제거 = 후속 메시지로 전달 (별도 API 없음, CLAUDE.md)
  const removeCondition = useCallback(
    (name: string) => {
      send(`[조건 제거] ${name}`);
    },
    [send],
  );

  const startNewChat = useCallback(() => {
    abortRef.current?.abort();
    sessionRef.current = null;
    reset();
  }, [reset]);

  return {
    send,
    retry,
    removeCondition,
    startNewChat,
    isStreaming,
    sessionId,
  };
}
