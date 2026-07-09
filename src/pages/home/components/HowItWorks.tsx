import { SectionHeading } from "./SectionHeading";

const STEPS = [
  {
    no: "01",
    title: "필요한 걸 말하세요",
    desc: "상품명이든, 상황이든, 예산이든 — 자연어로 편하게 입력하면 됩니다.",
  },
  {
    no: "02",
    title: "AI가 맥락을 이해합니다",
    desc: "Jarvis가 의도와 조건을 파악하고 수백만 개 상품 중에서 최적의 결과를 찾아요.",
  },
  {
    no: "03",
    title: "추천 상품을 확인하세요",
    desc: "이유가 담긴 추천 카드를 확인하고, 마음에 들면 바로 구매까지 이어집니다.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-muted/30 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <SectionHeadingCentered />
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.no}
              className="rounded-xl border bg-background p-6 shadow-sm"
            >
              <p className="text-4xl font-bold text-muted-foreground/40">
                {step.no}
              </p>
              <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 이 섹션은 헤더를 가운데 정렬로 쓰므로 SectionHeading 대신 별도 구성
function SectionHeadingCentered() {
  return (
    <div className="inline-block">
      <SectionHeading eyebrow="사용 방법" title="3단계면 충분해요" />
    </div>
  );
}
