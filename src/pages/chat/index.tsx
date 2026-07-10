import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { AppHeader } from "@/shared/ui/AppHeader";
import { useChatStore } from "./store";
import { useChat } from "./useChat";
import { MessageList } from "./components/MessageList";
import { ChatInput } from "./components/ChatInput";
import { ProductPanel } from "./components/ProductPanel";

export default function ChatPage() {
  const [params, setParams] = useSearchParams();
  const { send, retry, startNewChat, isStreaming } = useChat();
  const { messages, productGroups } = useChatStore();

  // 홈에서 넘어온 첫 메시지(?q=)는 "새 질문" → 기존 대화 초기화 후 시작.
  // 재진입마다 새로 처리되도록 q 값 자체를 의존성으로 사용
  const q = params.get("q");
  useEffect(() => {
    if (!q) return;
    startNewChat();
    send(q);
    params.delete("q");
    setParams(params, { replace: true });
    // params/setParams는 매 렌더 재생성되므로 의존성에서 제외 (q 변화에만 반응)
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
            className="flex items-center gap-1 border-l pl-4 text-sm font-medium text-muted-foreground hover:text-foreground"
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

          <div className="border-t p-4">
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
