import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { ChatLayout } from "@/shared/chat/ChatLayout";
import { SuggestedQuestions } from "@/shared/chat/SuggestedQuestions";
import { useChatStore } from "@/shared/chat/store";
import { useChat } from "@/shared/chat/useChat";
import { SellerHeader } from "./components/SellerHeader";
import { SellerResultPanel } from "./components/SellerResultPanel";

// 주문·상품 관리 관련 추천 질문 — 첫 진입 시 사용법 안내 역할
const SELLER_QUESTIONS = [
  "이번주 판매 전략 알려줘",
  "전환율 낮은 상품 진단해줘",
  "재고 부족 상품 정리해줘",
  "오늘 주문 요약해줘",
];

export default function SellerChatPage() {
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const q = params.get("q");

  const { send, retry, startNewChat, isStreaming } = useChat({
    channel: "SELLER",
    onAction: (action) => {
      // 상품 수정이 반영되면 해당 상품 캐시를 무효화해 다른 화면과 동기화
      if (action.type === "PRODUCT_UPDATED") {
        queryClient.invalidateQueries({
          queryKey: ["products", action.productId],
        });
      }
    },
  });

  const { messages, results, dropProductDiff } = useChatStore();

  // 진입 시 새 대화로 시작 — 스토어가 채널 공용이라 이전 쇼핑 대화가 남아있을 수 있음.
  // 대시보드 히어로에서 넘어온 첫 메시지(?q=)가 있으면 초기화 직후 이어서 전송한다
  // (두 동작을 한 이펙트에 두어 초기화가 첫 메시지를 지우는 순서 문제를 막음).
  useEffect(() => {
    startNewChat();
    if (q) {
      send(q);
      params.delete("q");
      setParams(params, { replace: true });
    }
    // 마운트 시 1회 + q 변화에만 반응 (params/setParams는 매 렌더 재생성)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // 수정 확인 = 후속 메시지로 전달 (별도 API 없음, 조건 칩과 동일 패턴)
  const confirmDiff = (draftId: string) => send(`[수정 확인] ${draftId}`);

  // 취소는 카드를 즉시 걷어내고 AI에도 알린다(맥락 유지 — 이후 "아까 그거" 대화가 이어짐)
  const cancelDiff = (draftId: string) => {
    dropProductDiff(draftId);
    send(`[수정 취소] ${draftId}`);
  };

  return (
    <ChatLayout
      onSend={send}
      onRetry={retry}
      isStreaming={isStreaming}
      header={<SellerHeader />}
      /* 판매자 헤더는 네비·계정으로 이미 빽빽해 "새 대화"는 대화 컬럼 상단에 둔다 */
      conversationHeader={
        <div className="flex justify-end border-b px-2 py-2">
          <button
            type="button"
            onClick={startNewChat}
            className="flex h-9 items-center gap-1 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
          >
            <Plus className="size-4" />새 대화
          </button>
        </div>
      }
      placeholder="상품 상세정보 수정, 판매 전략 등 무엇이든 물어보세요."
      aboveInput={
        // 대화 시작 전에만 노출 — 이후엔 입력창 주변을 비워 결과에 집중
        messages.length === 0 ? (
          <SuggestedQuestions
            questions={SELLER_QUESTIONS}
            onSelect={send}
            disabled={isStreaming}
          />
        ) : null
      }
      resultPanel={
        <SellerResultPanel
          results={results}
          isStreaming={isStreaming}
          onConfirmDiff={confirmDiff}
          onCancelDiff={cancelDiff}
        />
      }
    />
  );
}
