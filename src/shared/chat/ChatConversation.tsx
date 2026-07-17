import { useEffect, useRef } from "react";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { useChatStore } from "./store";

interface ChatConversationProps {
  onSend: (message: string) => void;
  onRetry: () => void;
  isStreaming: boolean;
  placeholder?: string;
  /** 대화 입력창 위 영역(조건 칩·추천 질문 등) — 채널별 주입 */
  aboveInput?: React.ReactNode;
  /**
   * 대화 영역 상단 바 — 없으면 렌더하지 않는다.
   * "새 대화" 버튼 위치가 화면마다 달라서(사용자 챗봇은 헤더) 부모가 정한다.
   */
  headerSlot?: React.ReactNode;
}

/**
 * 대화 컬럼 — 메시지 목록 + 입력창.
 * 전체 화면(ChatLayout)과 사이드 패널이 이걸 공유한다. 배치는 부모가 정한다.
 */
export function ChatConversation({
  onSend,
  onRetry,
  isStreaming,
  placeholder,
  aboveInput,
  headerSlot,
}: ChatConversationProps) {
  const messages = useChatStore((s) => s.messages);

  // 새 메시지·스트리밍 시 대화 영역 하단으로 스크롤
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, isStreaming]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {headerSlot}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          onRetry={onRetry}
        />
      </div>

      <div className="flex flex-col gap-3 border-t p-4">
        {aboveInput}
        <ChatInput
          onSend={onSend}
          disabled={isStreaming}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
