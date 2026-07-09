import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/shared/stores/authStore";

interface AppHeaderProps {
  // 로그인/회원가입 화면처럼 우측 메뉴가 중복되는 곳에서는 false
  showMenu?: boolean;
}

// 앱 공통 헤더 — 로고(홈 링크) + 우측 메뉴(로그인/시작하기 또는 닉네임)
export function AppHeader({ showMenu = true }: AppHeaderProps) {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            J
          </span>
          <span className="text-lg font-bold tracking-tight">Jarvis</span>
        </Link>

        {showMenu &&
          (user ? (
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
          ))}
      </div>
    </header>
  );
}
