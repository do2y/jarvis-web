import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SendHorizontal } from "lucide-react";
import { useRotatingIndex } from "../hooks/useRotatingIndex";

// 예시 질문 칩 — 클릭 시 해당 문장으로 채팅 시작
const EXAMPLE_CHIPS = [
  "자취 시작템 추천",
  "유럽 여행 준비물",
  "2만원 이하 선물",
  "집들이 선물 추천",
  "무선 키보드 추천",
];

// placeholder에 롤링될 예시 질문(문장형) — 입력 힌트 역할
const PLACEHOLDER_PHRASES = [
  "자취 시작하는데 필요한 물건 알려줘",
  "유럽여행 준비물 한 번에 골라줘",
  "10만원 안에서 필요한 상품 추천해줘",
  "후기 좋은 샤워기 필터 찾아줘",
];

export function Hero() {
  const navigate = useNavigate();
  // 포커스되거나 입력값이 있으면 롤링 멈추고 가짜 placeholder도 숨김 (입력 방해 방지)
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState("");
  const showRolling = !focused && value.length === 0;
  const count = PLACEHOLDER_PHRASES.length;
  const { index, animate, onSlideEnd } = useRotatingIndex(count, {
    paused: !showRolling,
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
          className="mt-15 flex items-center gap-3 rounded-full border bg-background px-5 py-3 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            startChat(value);
          }}
          aria-label="Jarvis에게 요청하기"
        >
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <div className="relative min-w-0 flex-1">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              aria-label="Jarvis에게 요청 입력"
              className="w-full bg-transparent text-base outline-none"
              // TODO: 채팅 화면 구현 시 제출 → /chat?q= 이동 연결
            />

            {/* 가짜 placeholder — 위로 슬라이드되는 롤링 효과. 입력 시 숨김.
                클리핑 창 높이(h-6)를 한 줄 높이와 정확히 맞춰 한 줄만 보이게 함 */}
            {showRolling && (
              <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center">
                <div aria-hidden className="h-6 w-full overflow-hidden">
                  <div
                    className={
                      "text-base leading-6 text-muted-foreground" +
                      // 리셋 순간에만 transition 제거(0으로 순간이동 → 역주행 숨김)
                      (animate
                        ? " transition-transform duration-500 ease-out"
                        : "")
                    }
                    // 각 문구 줄 높이(h-6 = 1.5rem)만큼 위로 밀어 한 줄씩 롤링
                    style={{ transform: `translateY(-${index * 1.5}rem)` }}
                    onTransitionEnd={onSlideEnd}
                  >
                    {PLACEHOLDER_PHRASES.map((phrase) => (
                      <div
                        key={phrase}
                        className="h-6 truncate text-left leading-6"
                      >
                        {phrase}
                      </div>
                    ))}
                    {/* 무한 루프용: 첫 문구를 끝에 복제 */}
                    <div className="h-6 truncate text-left leading-6">
                      {PLACEHOLDER_PHRASES[0]}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button
            type="submit"
            aria-label="보내기"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground transition-opacity hover:opacity-90"
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
                className="rounded-full border bg-background px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
