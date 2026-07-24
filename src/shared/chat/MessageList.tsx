import { cn } from "@/lib/utils";
import type { ChatMessage } from "./store";

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  /** 분석 진행 상태(판매자 progress 이벤트). 답변 전 로딩 표시용 */
  progress?: string | null;
  onRetry: () => void;
}

function TypingIndicator() {
  return (
    <span className="flex items-center gap-1 py-1" aria-label="입력 중">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}

export function MessageList({
  messages,
  isStreaming,
  progress,
  onRetry,
}: MessageListProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* 비휴지 안내는 대화 시작 전에만 — 대화가 시작되면 공간을 비워 대화에 집중 */}
      {messages.length === 0 && (
        <p className="text-xs text-muted-foreground">
          · 이 대화는 저장되지 않아요 · 자리를 비우면 자동으로 초기화됩니다
        </p>
      )}

      {messages.map((msg, i) => {
        const isLast = i === messages.length - 1;
        const showTyping =
          isStreaming && isLast && msg.role === "assistant" && !msg.text;

        return msg.role === "user" ? (
          <div
            key={msg.id}
            className="flex animate-in items-start justify-end gap-2 duration-300 fade-in slide-in-from-bottom-2 slide-in-from-right-2"
          >
            <span className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm leading-relaxed tracking-tight text-primary-foreground">
              {msg.text}
            </span>
            <Avatar />
          </div>
        ) : (
          <div
            key={msg.id}
            className="flex animate-in items-start gap-2 duration-300 fade-in slide-in-from-bottom-2 slide-in-from-left-2"
          >
            <Avatar />
            {msg.error ? (
              <div className="flex max-w-[80%] flex-col items-start gap-2 rounded-2xl rounded-tl-sm bg-destructive/10 px-4 py-2.5">
                <span className="text-sm text-destructive">{msg.error}</span>
                <button
                  type="button"
                  onClick={onRetry}
                  className="rounded-full border border-destructive/30 px-3 py-1 text-sm text-destructive transition-all hover:bg-destructive/10 active:scale-95"
                >
                  다시 시도
                </button>
              </div>
            ) : (
              <span
                className={cn(
                  "max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm leading-relaxed",
                  showTyping && "py-3",
                )}
              >
                {showTyping ? (
                  // 진행 텍스트(analysis progress)가 있으면 로딩 문구로, 없으면 점 애니메이션
                  progress ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <TypingIndicator />
                      {progress}
                    </span>
                  ) : (
                    <TypingIndicator />
                  )
                ) : (
                  msg.text
                )}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Avatar() {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
      J
    </span>
  );
}
