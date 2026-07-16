import { useAuthStore } from "@/shared/stores/authStore";

export function ProfileHeader() {
  const user = useAuthStore((s) => s.user);
  const nickname = user?.nickname ?? "회원";
  const initial = nickname.charAt(0);

  return (
    <div className="flex items-center gap-3.5 rounded-sm bg-muted/40 px-4 py-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
        {initial}
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-[15px] font-semibold leading-tight tracking-tight">
          {nickname}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          soy@jarvis.ai
        </span>
      </div>
    </div>
  );
}
