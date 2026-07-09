interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  aside?: React.ReactNode; // 우측 보조 영역 ("더 보기" 링크, 안내 문구 등)
}

// 홈 섹션 공통 헤더 — 작은 라벨(eyebrow) + 제목 + 우측 보조
export function SectionHeading({ eyebrow, title, aside }: SectionHeadingProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">{title}</h2>
      </div>
      {aside && (
        <div className="shrink-0 text-sm text-muted-foreground">{aside}</div>
      )}
    </div>
  );
}
