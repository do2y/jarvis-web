import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/shared/stores/authStore";

export function HomeHeader() {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            J
          </span>
          <span className="text-lg font-bold tracking-tight">Jarvis</span>
        </Link>

        {user ? (
          <span className="text-sm font-medium">{user.nickname}님</span>
        ) : (
          <nav className="flex items-center gap-2">
            <Link
              to="/login"
              className={cn(buttonVariants({ variant: "ghost" }), "h-9")}
            >
              로그인
            </Link>
            <Link
              to="/signup"
              className={cn(buttonVariants(), "h-9 rounded-full px-4")}
            >
              시작하기
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
