import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { ChatLayout } from "@/shared/chat/ChatLayout";
import { useChatStore } from "@/shared/chat/store";
import { useChat } from "@/shared/chat/useChat";
import { AppHeader } from "@/shared/ui/AppHeader";
import { useCategories } from "@/pages/home/useHomeData";
import { fetchPopularAsCards } from "./api";
import { ConditionChips } from "./components/ConditionChips";
import { ProductPanel } from "./components/ProductPanel";

export default function ChatPage() {
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();

  const { send, retry, startNewChat, isStreaming } = useChat({
    channel: "SHOPPING",
    // 챗봇 장바구니 담기 → 헤더 뱃지 전역 동기화 (CLAUDE.md)
    onAction: (action) => {
      if (action.type === "CART_ADDED") {
        queryClient.invalidateQueries({ queryKey: ["cart"] });
      }
    },
  });

  const { messages, results, setResults, conditions } = useChatStore();
  const hasResults = results.length > 0;

  const q = params.get("q");
  const categoryIdParam = params.get("categoryId");
  const categoryId = categoryIdParam ? Number(categoryIdParam) : undefined;

  // 초기 인기상품 — 카테고리 있으면 해당 카테고리, 없으면 전체
  const { data: popularCards } = useQuery({
    queryKey: ["chat", "popular", categoryId ?? null],
    queryFn: () => fetchPopularAsCards(categoryId),
    staleTime: 30 * 60 * 1000,
  });

  // 카테고리 진입 시 제목에 카테고리명 반영 ("패션 인기 상품")
  const { data: categories } = useCategories();
  const categoryName = categoryId
    ? categories?.find((c) => c.categoryId === categoryId)?.name
    : undefined;
  const popularTitle = categoryName
    ? `${categoryName} 인기 상품`
    : "지금 인기 상품";

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
      /* AI가 추출한 조건 표시 (표시 전용). 조건 완화는 suggestions가 담당 */
      aboveInput={<ConditionChips conditions={conditions} />}
      resultPanel={<ProductPanel results={results} isStreaming={isStreaming} />}
    />
  );
}
