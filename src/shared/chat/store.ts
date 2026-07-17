import { create } from "zustand";
import type { ChatAction, ChatResult } from "@/shared/types/chat";

// 현재 챗봇 대화 상태 — persist 안 함(새로고침 소실이 의도된 동작, CLAUDE.md)
// SHOPPING·CS·SELLER가 같은 스토어를 쓴다. 채널별로 다른 건 results 항목의 kind뿐.

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  error?: string; // 응답 실패 시 해당 말풍선에 표시할 에러 메시지
}

interface ChatState {
  sessionId: string | null;
  messages: ChatMessage[];
  results: ChatResult[]; // 최신 응답의 결과 카드(상품·지표·차트·diff…)
  conditions: string[]; // 제거 가능 조건 칩
  isStreaming: boolean;

  setSessionId: (id: string) => void;
  addMessage: (msg: ChatMessage) => void;
  appendToLastAssistant: (text: string) => void; // token 이벤트 누적
  failLastAssistant: (message: string) => void; // 마지막 assistant 말풍선을 에러 상태로
  dropLastExchange: () => string | null; // 실패한 (user, assistant) 쌍 제거하고 user 텍스트 반환
  setResults: (results: ChatResult[]) => void;
  addResult: (result: ChatResult) => void;
  settleProductDiff: (draftId: string, action: ChatAction) => void;
  dropProductDiff: (draftId: string) => void;
  setConditions: (items: string[]) => void;
  setStreaming: (v: boolean) => void;
  reset: () => void; // 새 대화
}

const initial = {
  sessionId: null,
  messages: [],
  results: [],
  conditions: [],
  isStreaming: false,
};

export const useChatStore = create<ChatState>((set, get) => ({
  ...initial,

  setSessionId: (sessionId) => set({ sessionId }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  appendToLastAssistant: (text) =>
    set((s) => {
      const messages = [...s.messages];
      const last = messages[messages.length - 1];
      if (last?.role === "assistant") {
        messages[messages.length - 1] = { ...last, text: last.text + text };
      }
      return { messages };
    }),
  failLastAssistant: (message) =>
    set((s) => {
      const messages = [...s.messages];
      const last = messages[messages.length - 1];
      if (last?.role === "assistant") {
        messages[messages.length - 1] = { ...last, error: message };
      }
      return { messages };
    }),
  dropLastExchange: () => {
    const messages = [...get().messages];
    // 마지막이 실패한 assistant면 그것과 직전 user를 제거하고 user 텍스트 반환
    const last = messages[messages.length - 1];
    if (last?.role !== "assistant") return null;
    messages.pop();
    const prev = messages[messages.length - 1];
    const userText = prev?.role === "user" ? prev.text : null;
    if (prev?.role === "user") messages.pop();
    set({ messages });
    return userText;
  },
  setResults: (results) => set({ results }),
  addResult: (result) => set((s) => ({ results: [...s.results, result] })),
  // 수정 확인/실패 결과가 오면 해당 diff 카드를 처리 완료 상태로 잠근다
  // (이미 확정된 수정에 확인 버튼이 계속 남아 중복 요청되는 것을 막음)
  settleProductDiff: (draftId, action) =>
    set((s) => ({
      results: s.results.map((r) =>
        r.kind === "productDiff" && r.diff.draftId === draftId
          ? { ...r, settled: action }
          : r,
      ),
    })),
  // 사용자가 수정을 취소하면 실패가 아니라 "없던 일" — 카드를 그냥 걷어낸다
  dropProductDiff: (draftId) =>
    set((s) => ({
      results: s.results.filter(
        (r) => !(r.kind === "productDiff" && r.diff.draftId === draftId),
      ),
    })),
  setConditions: (conditions) => set({ conditions }),
  setStreaming: (isStreaming) => set({ isStreaming }),
  reset: () => set({ ...initial }),
}));
