import { useState } from "react";
import { ArrowUp } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-center gap-2 rounded-full border bg-background/80 px-4 py-2 shadow-sm backdrop-blur transition-shadow focus-within:shadow-md focus-within:ring-1 focus-within:ring-brand/40"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder ?? "특별히 바꾸고 싶은 점이 있으신가요?"}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="전송"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground transition-all duration-150 hover:opacity-90 active:scale-90 disabled:scale-100 disabled:opacity-40"
      >
        <ArrowUp className="size-4" />
      </button>
    </form>
  );
}
