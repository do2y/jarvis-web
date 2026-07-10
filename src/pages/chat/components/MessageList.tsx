import type { ChatMessage } from "../store";

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onRetry: () => void;
}

export function MessageList({
  messages,
  isStreaming,
  onRetry,
}: MessageListProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        · 이 대화는 저장되지 않아요 · 자리를 비우면 자동으로 초기화됩니다
      </p>

      {messages.map((msg, i) => {
        const isLast = i === messages.length - 1;
        const showTyping =
          isStreaming && isLast && msg.role === "assistant" && !msg.text;

        return msg.role === "user" ? (
          <div key={msg.id} className="flex items-start justify-end gap-2">
            <span className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
              {msg.text}
            </span>
            <Avatar />
          </div>
        ) : (
          <div key={msg.id} className="flex items-start gap-2">
            <Avatar />
            {msg.error ? (
              // 응답 실패 — 말풍선 안에서 에러 + 재시도 (자동 재시도 금지, CLAUDE.md)
              <div className="flex max-w-[80%] flex-col items-start gap-2 rounded-2xl rounded-tl-sm bg-destructive/10 px-4 py-2.5">
                <span className="text-sm text-destructive">{msg.error}</span>
                <button
                  type="button"
                  onClick={onRetry}
                  className="rounded-full border border-destructive/30 px-3 py-1 text-sm text-destructive hover:bg-destructive/10"
                >
                  다시 시도
                </button>
              </div>
            ) : (
              <span className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm">
                {showTyping ? (
                  <span className="text-muted-foreground">입력 중…</span>
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
