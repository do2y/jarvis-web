import { Link } from "react-router-dom";
import { Heart, ShoppingCart } from "lucide-react";
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

        {showMenu && (
          <nav className="flex items-center gap-1 sm:gap-2">
            {/* 찜·장바구니는 게스트에게도 노출, 클릭 시 라우트 가드가 로그인 유도 */}
            <Link
              to="/wishlist"
              aria-label="찜 목록"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "size-9",
              )}
            >
              <Heart className="size-5" />
            </Link>
            <Link
              to="/cart"
              aria-label="장바구니"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "size-9",
              )}
            >
              <ShoppingCart className="size-5" />
            </Link>

            {user ? (
              <span className="ml-1 text-sm font-medium sm:ml-2">
                {user.nickname}님
              </span>
            ) : (
              <>
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
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
