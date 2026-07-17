import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { AppHeader } from "@/shared/ui/AppHeader";
import { useCategories } from "@/pages/home/useHomeData";
import { fetchPopularAsCards } from "./api";
import { useChatStore } from "./store";
import { useChat } from "./useChat";
import { MessageList } from "./components/MessageList";
import { ChatInput } from "./components/ChatInput";
import { ConditionChips } from "./components/ConditionChips";
import { ProductPanel } from "./components/ProductPanel";

export default function ChatPage() {
  const [params, setParams] = useSearchParams();
  const { send, retry, startNewChat, isStreaming } = useChat();
  const { messages, productGroups, setProductGroups, conditions } =
    useChatStore();
  const hasProducts = productGroups.length > 0;

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
  // hasProducts에 의존해야 "새 대화"로 패널이 비워졌을 때도 다시 시딩된다
  // (messages.length는 새 대화 전후 모두 0이라 deps가 변하지 않음).
  useEffect(() => {
    if (messages.length === 0 && !hasProducts && popularCards?.length) {
      setProductGroups([{ title: popularTitle, items: popularCards }]);
    }
  }, [
    messages.length,
    hasProducts,
    popularCards,
    popularTitle,
    setProductGroups,
  ]);

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

  // 새 메시지·스트리밍 시 대화 영역 하단으로 스크롤
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, isStreaming]);

  return (
    <div className="flex h-screen flex-col bg-background">
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

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* 좌측: 대화 */}
        <div className="flex min-h-0 flex-col border-b lg:w-[420px] lg:shrink-0 lg:border-b-0 lg:border-r">
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            <MessageList
              messages={messages}
              isStreaming={isStreaming}
              onRetry={retry}
            />
          </div>

          <div className="flex flex-col gap-3 border-t p-4">
            {/* AI가 추출한 조건 표시 (표시 전용). 조건 완화는 suggestions가 담당 */}
            <ConditionChips conditions={conditions} />
            <ChatInput onSend={send} disabled={isStreaming} />
          </div>
        </div>

        {/* 우측: 상품 */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/30">
          <ProductPanel groups={productGroups} isStreaming={isStreaming} />
        </div>
      </div>
    </div>
  );
}
