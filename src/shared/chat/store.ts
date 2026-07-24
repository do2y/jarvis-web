import { create } from "zustand";
import type {
  ChatAction,
  ChatResult,
  ConditionChip,
  SellerLane,
  SuggestionChip,
} from "@/shared/types/chat";

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
  threadId: string | null; // 판매자 챗 계약: 대화 스레드 식별자(목록 전환·패널 변경에 불변)
  messages: ChatMessage[];
  results: ChatResult[]; // 최신 응답의 결과 카드(상품·diff)
  conditions: ConditionChip[]; // AI 추출 조건 칩(구매자) — field로 제거 왕복
  suggestions: SuggestionChip[]; // 완화·되돌리기 제안 칩(구매자)
  isStreaming: boolean;
  // 판매자 챗 화면 전환 신호 — 첫 프레임 meta.lane, 진행 표시 progress
  lane: SellerLane | null;
  progress: string | null; // 분석 진행 상태(최종 답변 아님, 로딩 표시용)
  // 분석 리포트 — done{panel:replace}+lane:analysis 시 우측 패널에 표시할 리포트 본문.
  // 계약상 analysis 답변은 단일 token이라 results 카드가 아니라 이 문자열로 담는다.
  analysisReport: string | null;

  setSessionId: (id: string) => void;
  setThreadId: (id: string) => void;
  addMessage: (msg: ChatMessage) => void;
  appendToLastAssistant: (text: string) => void; // token 이벤트 누적
  failLastAssistant: (message: string) => void; // 마지막 assistant 말풍선을 에러 상태로
  dropLastExchange: () => string | null; // 실패한 (user, assistant) 쌍 제거하고 user 텍스트 반환
  setResults: (results: ChatResult[]) => void;
  addResult: (result: ChatResult) => void;
  settleDraft: (draftId: string, action: ChatAction) => void;
  dropDraft: (draftId: string) => void;
  setConditions: (chips: ConditionChip[]) => void;
  setSuggestions: (chips: SuggestionChip[]) => void;
  setStreaming: (v: boolean) => void;
  setLane: (lane: SellerLane | null) => void;
  setProgress: (text: string | null) => void;
  setAnalysisReport: (text: string | null) => void;
  reset: () => void; // 새 대화
}

const initial = {
  sessionId: null,
  threadId: null,
  messages: [],
  results: [],
  conditions: [],
  suggestions: [],
  isStreaming: false,
  lane: null,
  progress: null,
  analysisReport: null,
};

export const useChatStore = create<ChatState>((set, get) => ({
  ...initial,

  setSessionId: (sessionId) => set({ sessionId }),
  setThreadId: (threadId) => set({ threadId }),
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
  settleDraft: (draftId, action) =>
    set((s) => ({
      results: s.results.map((r) =>
        r.kind === "draft" && r.draft.draftId === draftId
          ? { ...r, settled: action }
          : r,
      ),
    })),
  // 사용자가 수정을 취소하면 실패가 아니라 "없던 일" — 카드를 그냥 걷어낸다(서버 호출 없음)
  dropDraft: (draftId) =>
    set((s) => ({
      results: s.results.filter(
        (r) => !(r.kind === "draft" && r.draft.draftId === draftId),
      ),
    })),
  setConditions: (conditions) => set({ conditions }),
  setSuggestions: (suggestions) => set({ suggestions }),
  setStreaming: (isStreaming) => set({ isStreaming }),
  setLane: (lane) => set({ lane }),
  setProgress: (progress) => set({ progress }),
  setAnalysisReport: (analysisReport) => set({ analysisReport }),
  // 새 대화 — threadId 는 유지하지 않는다(reset은 대화 자체를 새로 시작할 때만 호출)
  reset: () => set({ ...initial }),
}));
