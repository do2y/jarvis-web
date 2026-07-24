import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { ChatLayout } from "@/shared/chat/ChatLayout";
import { useChatStore } from "@/shared/chat/store";
import { useChat } from "@/shared/chat/useChat";
import { AppHeader } from "@/shared/ui/AppHeader";
import { fetchPopularAsCards } from "./api";
import { ConditionChips } from "./components/ConditionChips";
import { ProductPanel } from "./components/ProductPanel";
import { SuggestionChips } from "./components/SuggestionChips";

export default function ChatPage() {
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();

  const { send, retry, removeCondition, applySuggestion, startNewChat, isStreaming } =
    useChat({
      channel: "SHOPPING",
      // 챗봇 장바구니 담기 → 헤더 뱃지 전역 동기화 (CLAUDE.md)
      onAction: (action) => {
        if (action.type === "CART_ADDED") {
          queryClient.invalidateQueries({ queryKey: ["cart"] });
        }
      },
    });

  const { messages, results, setResults, conditions, suggestions } =
    useChatStore();
  const hasResults = results.length > 0;

  const q = params.get("q");

  // 초기 인기상품 — 명세(P-4)에 카테고리 필터가 없어 항상 전체 인기상품이다.
  // (카테고리별로 보여주려면 백엔드에 categoryId 파라미터 추가가 선행되어야 함)
  const { data: popularCards } = useQuery({
    queryKey: ["chat", "popular"],
    queryFn: () => fetchPopularAsCards(),
    staleTime: 30 * 60 * 1000,
  });

  const popularTitle = "지금 인기 상품";

  // 대화 시작 전(메시지 없음)에는 인기상품을 표시.
  // hasResults에 의존해야 "새 대화"로 패널이 비워졌을 때도 다시 시딩된다
  // (messages.length는 새 대화 전후 모두 0이라 deps가 변하지 않음).
  useEffect(() => {
    if (messages.length === 0 && !hasResults && popularCards?.length) {
      setResults([
        {
          kind: "products",
          groups: [{ title: popularTitle, items: popularCards }],
        },
      ]);
    }
  }, [messages.length, hasResults, popularCards, popularTitle, setResults]);

  // 홈에서 넘어온 첫 메시지(?q=)는 "새 질문" → 기존 대화 초기화 후 시작.
  useEffect(() => {
    if (!q) return;
    startNewChat();
    send(q);
    params.delete("q");
    setParams(params, { replace: true });
    // q 변화에만 반응 (params/setParams는 매 렌더 재생성)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <ChatLayout
      onSend={send}
      onRetry={retry}
      isStreaming={isStreaming}
      /* "새 대화"는 헤더 로고 옆에 — 대화 영역을 차지하지 않게(기존 배치 유지) */
      header={
        <AppHeader
          leftSlot={
            <button
              type="button"
              onClick={startNewChat}
              className="flex items-center gap-1 border-l pl-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground active:scale-95"
            >
              <Plus className="size-4" />새 대화
            </button>
          }
        />
      }
      /* AI 추출 조건 칩(제거 가능) + 완화·되돌리기 제안 칩. 스트리밍 중엔 왕복 비활성 */
      aboveInput={
        (conditions.length > 0 || suggestions.length > 0) && (
          <div className="flex flex-col gap-2">
            <ConditionChips
              conditions={conditions}
              onRemove={removeCondition}
              disabled={isStreaming}
            />
            <SuggestionChips
              suggestions={suggestions}
              onApply={applySuggestion}
              disabled={isStreaming}
            />
          </div>
        )
      }
      resultPanel={<ProductPanel results={results} isStreaming={isStreaming} />}
    />
  );
}
