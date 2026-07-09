import { Search, SendHorizontal } from "lucide-react";

// 예시 질문 칩 — 클릭 시 채팅 시작(미구현). 지금은 표시 + TODO
const EXAMPLE_CHIPS = [
  "자취 시작템 추천",
  "유럽 여행 준비물",
  "2만원 이하 선물",
  "무선 키보드 추천",
  "집들이 선물 추천",
  "비 오는 날 운동화",
  "남자친구 생일선물",
  "샤워기 필터 추천",
];

export function Hero() {
  return (
    <section className="px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium tracking-widest text-muted-foreground">
          AI SHOPPING AGENT
        </p>
        <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          원하는 걸 말하면
          <br />
          <span className="text-muted-foreground">Jarvis가 찾아드립니다</span>
        </h1>

        {/* 표시용 입력창 — 채팅 화면 생기면 제출 연결 (지금은 동작 없음) */}
        <form
          className="mt-15 flex items-center gap-3 rounded-full border bg-background px-5 py-3 shadow-sm"
          onSubmit={(e) => e.preventDefault()}
          aria-label="Jarvis에게 요청하기"
        >
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder="자취 시작하는데 필요한 물건 알려줘"
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
            // TODO: 채팅 화면 구현 시 제출 → /chat?q= 이동 연결
          />
          <button
            type="submit"
            aria-label="보내기"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <SendHorizontal className="size-5" />
          </button>
        </form>

        <ul className="mt-6 flex flex-wrap justify-center gap-2.5">
          {EXAMPLE_CHIPS.map((chip) => (
            <li key={chip}>
              {/* TODO: 클릭 시 해당 문장으로 채팅 시작 */}
              <button
                type="button"
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
