interface SuggestedQuestionsProps {
  questions: string[];
  onSelect: (question: string) => void;
  disabled?: boolean;
}

/** 추천 질문 칩 — 클릭 시 해당 문장으로 대화 시작. 채널별 문구는 주입받는다. */
export function SuggestedQuestions({
  questions,
  onSelect,
  disabled,
}: SuggestedQuestionsProps) {
  if (questions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {questions.map((q) => (
        <button
          key={q}
          type="button"
          onClick={() => onSelect(q)}
          disabled={disabled}
          className="animate-in rounded-full border px-3 py-1.5 text-sm text-muted-foreground transition-all duration-200 fade-in zoom-in-95 hover:bg-muted hover:text-foreground active:scale-95 disabled:pointer-events-none disabled:opacity-40"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
