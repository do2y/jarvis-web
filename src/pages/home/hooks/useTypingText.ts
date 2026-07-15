import { useEffect, useState } from "react";

interface Options {
  typingMs?: number; //입력 속도
  deletingMs?: number; //삭제 속도
  holdMs?: number; //대기시간
  paused?: boolean;
}

export function useTypingText(
  texts: string[],
  {
    typingMs = 80,
    deletingMs = 40,
    holdMs = 1500,
    paused = false,
  }: Options = {},
) {
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentText = texts[textIndex] ?? "";
  const typedText = currentText.slice(0, charIndex);

  useEffect(() => {
    if (paused || texts.length === 0) return;

    let delay = typingMs;

    // 한 글자씩 입력
    if (!isDeleting && charIndex < currentText.length) {
      delay = typingMs;
    }

    // 문장을 모두 입력한 뒤 잠시 대기
    if (!isDeleting && charIndex === currentText.length) {
      delay = holdMs;
    }

    // 한 글자씩 삭제
    if (isDeleting) {
      delay = deletingMs;
    }

    const timer = window.setTimeout(() => {
      if (!isDeleting && charIndex < currentText.length) {
        setCharIndex((prev) => prev + 1);
        return;
      }

      if (!isDeleting && charIndex === currentText.length) {
        setIsDeleting(true);
        return;
      }

      if (isDeleting && charIndex > 0) {
        setCharIndex((prev) => prev - 1);
        return;
      }

      // 전부 삭제했으면 다음 문장으로 이동
      setIsDeleting(false);
      setTextIndex((prev) => (prev + 1) % texts.length);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [
    paused,
    texts.length,
    currentText,
    charIndex,
    isDeleting,
    typingMs,
    deletingMs,
    holdMs,
  ]);

  return {
    text: typedText,
    textIndex,
    isDeleting,
  };
}
