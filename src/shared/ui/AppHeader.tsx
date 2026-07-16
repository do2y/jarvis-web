import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Heart, MessageSquare, ShoppingCart } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/shared/stores/authStore";

interface AppHeaderProps {
  showMenu?: boolean;
  leftSlot?: React.ReactNode;
}

// 헤더 아이콘 링크 — 44px 터치 타깃, 활성 경로 강조, title 툴팁 + aria-label 병행.
// active 판단은 NavLink의 isActive에 위임(경로 일치 시 배경·색으로 현재 위치 표시).
function NavIconLink({
  to,
  label,
  children,
}: {
  to: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      aria-label={label}
      title={label}
      className={({ isActive }) =>
        cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          // 최소 44px 클릭 영역 (터치 안정성)
          "size-11 rounded-full",
          isActive && "bg-muted text-foreground",
        )
      }
    >
      {children}
    </NavLink>
  );
}

export function AppHeader({ showMenu = true, leftSlot }: AppHeaderProps) {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  // 채팅 진입점이 이미 있는 곳에선 헤더 채팅 버튼을 숨김:
  //  - 홈(/): 히어로에 채팅 입력창이 있음
  //  - 채팅(/chat): 이미 그 페이지임
  // 그 외 페이지에선 상시 채팅 진입점으로 유지.
  const pathname = useLocation().pathname;
  const hasChatEntry = pathname === "/" || pathname.startsWith("/chat");

  const handleLogout = () => {
    clearAuth();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            aria-label="Jarvis 홈"
            className="flex items-center gap-2 rounded-full"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              J
            </span>
            <span className="text-lg font-bold tracking-tight">Jarvis</span>
          </Link>
          {leftSlot}
        </div>

        {showMenu && (
          <nav className="flex items-center gap-0.5 sm:gap-1">
            {/* 채팅: 핵심 기능 진입점 — 홈·채팅 화면엔 이미 진입점이 있어 숨김 */}
            {!hasChatEntry && (
              <NavIconLink to="/chat" label="채팅">
                <MessageSquare className="size-5" />
              </NavIconLink>
            )}

            {/* 찜·장바구니는 로그인 필요(RequireAuth) → 게스트에겐 숨겨 헛클릭 방지 */}
            {user && (
              <>
                <NavIconLink to="/wishlist" label="찜 목록">
                  <Heart className="size-5" />
                </NavIconLink>
                <NavIconLink to="/cart" label="장바구니">
                  <ShoppingCart className="size-5" />
                </NavIconLink>
              </>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "ml-1 h-11 gap-1 rounded-full px-3 text-sm font-medium",
                  )}
                >
                  {user.nickname}님
                  <ChevronDown className="size-4 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem render={<Link to="/mypage" />}>
                    마이페이지
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleLogout}
                  >
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link
                  to="/login"
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "ml-1 h-11 rounded-full px-3",
                  )}
                >
                  로그인
                </Link>
                <Link
                  to="/signup"
                  className={cn(
                    buttonVariants(),
                    "h-11 rounded-full px-4",
                  )}
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
