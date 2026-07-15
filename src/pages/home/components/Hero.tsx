import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SendHorizontal } from "lucide-react";
import { useTypingText } from "../hooks/useTypingText";

// 예시 질문 칩 — 클릭 시 해당 문장으로 채팅 시작
const EXAMPLE_CHIPS = [
  "자취 시작템 추천",
  "유럽 여행 준비물",
  "2만원 이하 선물",
  "집들이 선물 추천",
  "무선 키보드 추천",
];

// placeholder 예시 질문
const PLACEHOLDER_PHRASES = [
  "자취 시작하는데 필요한 물건 알려줘.",
  "유럽여행 준비물 한 번에 골라줘.",
  "10만원 안에서 필요한 상품 추천해줘.",
  "후기 좋은 샤워기 필터 찾아줘.",
];

export function Hero() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const { text } = useTypingText(PLACEHOLDER_PHRASES, {
    typingMs: 70,
    deletingMs: 35,
    holdMs: 1800,
    paused: isFocused || message.length > 0,
  });

  // 입력 내용을 첫 메시지로 채팅 화면에 전달
  const startChat = (message: string) => {
    const q = message.trim();
    if (q) navigate(`/chat?q=${encodeURIComponent(q)}`);
  };

  return (
    <section className="px-6 pt-20 pb-36 sm:pt-28 sm:pb-44">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium tracking-widest text-muted-foreground">
          AI SHOPPING AGENT
        </p>
        <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          원하는 걸 말하면
          <br />
          <span className="text-brand">Jarvis</span>가 찾아드립니다
        </h1>

        {/* 입력 내용을 첫 메시지로 채팅 화면에 전달 */}
        <form
          className="mt-15 flex items-center gap-3 rounded-full border bg-background px-5 py-3 shadow-sm transition-shadow focus-within:shadow-md focus-within:ring-1 focus-within:ring-ring"
          onSubmit={(e) => {
            e.preventDefault();
            startChat(message);
          }}
          aria-label="Jarvis에게 요청하기"
        >
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <input
            value={message}
            placeholder={isFocused ? "" : text}
            onChange={(event) => setMessage(event.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="min-w-0 flex-1 bg-transparent text-base leading-6 outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            aria-label="보내기"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground transition hover:opacity-90 active:scale-90"
          >
            <SendHorizontal className="size-4" />
          </button>
        </form>

        <ul className="mt-6 flex flex-wrap justify-center gap-2.5">
          {EXAMPLE_CHIPS.map((chip) => (
            <li key={chip}>
              <button
                type="button"
                onClick={() => startChat(chip)}
                className="rounded-full border bg-background px-4 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-95"
              >
                {chip}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
