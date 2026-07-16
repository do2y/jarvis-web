import { useAuthStore } from "@/shared/stores/authStore";

export function ProfileHeader() {
  const user = useAuthStore((s) => s.user);
  const nickname = user?.nickname ?? "회원";
  const initial = nickname.charAt(0);

  return (
    <div className="flex items-center gap-3 rounded-sm bg-muted/50 px-3 py-3 lg:px-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
        {initial}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold leading-tight">
          {nickname}
        </span>
        <span className="truncate text-xs text-muted-foreground">
          soy@jarvis.ai
        </span>
      </div>
    </div>
  );
}
