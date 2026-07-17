import { ChatConversation } from "./ChatConversation";

interface ChatLayoutProps {
  onSend: (message: string) => void;
  onRetry: () => void;
  isStreaming: boolean;
  placeholder?: string;
  /** 화면 최상단 헤더 — 채널별 주입(쇼핑=AppHeader, 판매자=SellerHeader) */
  header: React.ReactNode;
  /** 대화 컬럼 상단 바 — "새 대화" 버튼 위치가 화면마다 달라 부모가 정한다 */
  conversationHeader?: React.ReactNode;
  /** 대화 입력창 위 영역(조건 칩·추천 질문 등) — 채널별 주입 */
  aboveInput?: React.ReactNode;
  /** 우측(모바일에선 하단) 결과 패널 — 채널별 주입 */
  resultPanel: React.ReactNode;
}

/**
 * 채팅 전용 화면 골격 — 좌측 대화 / 우측 결과 2단.
 * 도메인을 모른다. 헤더·결과 렌더링을 주입받는다(SHOPPING·SELLER 공용).
 * 대화 컬럼은 ChatConversation을 그대로 쓴다(사이드 패널과 공유).
 */
export function ChatLayout({
  onSend,
  onRetry,
  isStreaming,
  placeholder,
  header,
  conversationHeader,
  aboveInput,
  resultPanel,
}: ChatLayoutProps) {
  return (
    <div className="flex h-screen flex-col bg-background">
      {header}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* 좌측: 대화 */}
        <div className="flex min-h-0 flex-col border-b lg:w-[420px] lg:shrink-0 lg:border-b-0 lg:border-r">
          <ChatConversation
            onSend={onSend}
            onRetry={onRetry}
            isStreaming={isStreaming}
            placeholder={placeholder}
            headerSlot={conversationHeader}
            aboveInput={aboveInput}
          />
        </div>

        {/* 우측: 결과 */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-muted/30">
          {resultPanel}
        </div>
      </div>
    </div>
  );
}
