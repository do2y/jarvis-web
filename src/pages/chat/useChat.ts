import { useCallback, useRef } from "react";
import { streamChat } from "@/shared/chat/streamChat";
import { useAuthStore } from "@/shared/stores/authStore";
import type { ChatRequest } from "@/shared/types/chat";
import { useChatStore } from "./store";

function newId(): string {
  return crypto.randomUUID();
}

// 게스트 식별자 — 세션 동안 유지(대화 맥락용). 로그인 사용자는 userId 사용
function getGuestId(): string {
  const KEY = "jarvis-guest-id";
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

export function useChat() {
  const user = useAuthStore((s) => s.user);
  const {
    sessionId,
    isStreaming,
    addMessage,
    appendToLastAssistant,
    failLastAssistant,
    setProductGroups,
    setConditions,
    setSessionId,
    setStreaming,
    reset,
  } = useChatStore();

  // 진행 중 요청 취소용
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed || useChatStore.getState().isStreaming) return;

      addMessage({ id: newId(), role: "user", text: trimmed });
      // 스트리밍으로 채워질 빈 assistant 메시지 선 추가
      addMessage({ id: newId(), role: "assistant", text: "" });
      setStreaming(true);

      const req: ChatRequest = {
        sessionId: useChatStore.getState().sessionId ?? "",
        channel: "SHOPPING",
        message: trimmed,
        ...(user ? { userId: user.id } : { guestId: getGuestId() }),
      };

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamChat(
          req,
          (e) => {
            switch (e.event) {
              case "token":
                appendToLastAssistant(e.data.text);
                break;
              case "conditions":
                setConditions(e.data.items);
                break;
              case "products":
                setProductGroups(e.data.groups);
                break;
              case "action":
                // CART_ADDED 등 — 안내 문구를 대화에 덧붙임
                appendToLastAssistant(`\n\n${e.data.message}`);
                break;
              case "done":
                break;
              case "error":
                failLastAssistant(e.data.message);
                break;
            }
          },
          controller.signal,
        );
      } catch {
        // 자동 재시도 금지 — 해당 말풍선에 에러 표시, 재시도 버튼 제공
        failLastAssistant("응답을 받지 못했어요. 다시 시도해 주세요.");
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [
      user,
      addMessage,
      appendToLastAssistant,
      failLastAssistant,
      setConditions,
      setProductGroups,
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
    reset();
    setSessionId(newId());
  }, [reset, setSessionId]);

  return {
    send,
    retry,
    removeCondition,
    startNewChat,
    isStreaming,
    sessionId,
  };
}
