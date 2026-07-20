import { Link, NavLink, useLocation } from "react-router-dom";
import {
  ChevronDown,
  Heart,
  LogOut,
  MessageSquare,
  ShoppingCart,
  User,
} from "lucide-react";
import { buttonVariants } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useCartItemCount } from "@/shared/hooks/useCart";
import { useLogout } from "@/shared/hooks/useLogout";
import { useAuthStore, type UserRole } from "@/shared/stores/authStore";

interface AppHeaderProps {
  showMenu?: boolean;
  leftSlot?: React.ReactNode;
}

// 역할 한글 라벨 — 드롭다운 계정 헤더의 배지에 사용
const ROLE_LABEL: Record<UserRole, string> = {
  USER: "일반 회원",
  SELLER: "판매자",
  ADMIN: "관리자",
};

// 헤더 아이콘 링크 — 44px 터치 타깃, 활성 경로 강조, title 툴팁 + aria-label 병행.
// active 판단은 NavLink의 isActive에 위임(경로 일치 시 배경·색으로 현재 위치 표시).
function NavIconLink({
  to,
  label,
  badge,
  children,
}: {
  to: string;
  label: string;
  badge?: number;
  children: React.ReactNode;
}) {
  // 0(빈 장바구니)이면 뱃지를 숨긴다. 99를 넘으면 자릿수가 늘어 아이콘을 가리므로 99+로 절삭.
  const badgeText = !badge ? undefined : badge > 99 ? "99+" : String(badge);

  return (
    <NavLink
      to={to}
      // 뱃지 수를 라벨에 포함해 스크린리더에도 개수가 전달되게 한다
      aria-label={badge ? `${label} (${badge}개)` : label}
      title={label}
      className={({ isActive }) =>
        cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          // 최소 44px 클릭 영역 (터치 안정성)
          "relative size-11 rounded-full",
          isActive && "bg-muted text-foreground",
        )
      }
    >
      {/* 뱃지가 있으면 아이콘을 살짝 내려 우상단에 뱃지 자리를 비운다.
          (아이콘 간격이 gap-0.5로 좁아 뱃지를 버튼 밖으로 빼면 옆 아이콘과 닿는다) */}
      <span className={cn(badgeText && "translate-y-0.5")}>{children}</span>
      {badgeText && (
        <span
          aria-hidden
          className="absolute right-0.5 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground ring-2 ring-background"
        >
          {badgeText}
        </span>
      )}
    </NavLink>
  );
}

export function AppHeader({ showMenu = true, leftSlot }: AppHeaderProps) {
  const user = useAuthStore((s) => s.user);
  // 게스트도 장바구니를 쓰므로 로그인 여부와 무관하게 조회 (CLAUDE.md)
  const cartCount = useCartItemCount();

  // 채팅 진입점이 이미 있는 곳에선 헤더 채팅 버튼을 숨김:
  //  - 홈(/): 히어로에 채팅 입력창이 있음
  //  - 채팅(/chat): 이미 그 페이지임
  // 그 외 페이지에선 상시 채팅 진입점으로 유지.
  const pathname = useLocation().pathname;
  const hasChatEntry = pathname === "/" || pathname.startsWith("/chat");

  const handleLogout = useLogout();

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

            {/* 찜·장바구니: 항상 노출. 게스트는 각 페이지에서 로그인 유도/담기 처리 */}
            <NavIconLink to="/wishlist" label="찜 목록">
              <Heart className="size-5" />
            </NavIconLink>
            <NavIconLink to="/cart" label="장바구니" badge={cartCount}>
              <ShoppingCart className="size-5" />
            </NavIconLink>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "ml-1 h-11 gap-1.5 rounded-full px-3 text-sm font-medium",
                  )}
                >
                  {user.nickname}님
                  {/* 열림 상태를 chevron 회전으로 피드백 */}
                  <ChevronDown className="size-4 text-muted-foreground transition-transform group-aria-expanded/button:rotate-180" />
                </DropdownMenuTrigger>
                {/* 페이지가 각진 카드(rounded-sm)로 가득 → 메뉴는 더 둥글고(rounded-xl)
                    그림자 깊은(shadow-lg) 떠 있는 층위로 구분해 '카드 하나 더'처럼 안 보이게(§12).
                    트리거 폭 고정(w-anchor-width) 해제, 오른쪽 끝 정렬 */}
                <DropdownMenuContent
                  align="end"
                  sideOffset={6}
                  className="w-56 rounded-xl p-1.5 shadow-lg"
                >
                  {/* 계정 헤더 — 배경·박스 없이 가볍게. "지금 누구로 로그인했는지" 재확인 */}
                  <div className="flex items-center gap-2.5 px-1.5 py-1.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {user.nickname.charAt(0)}
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-semibold leading-tight">
                        {user.nickname}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {ROLE_LABEL[user.role]}
                      </span>
                    </div>
                  </div>
                  {/* 구분선 1개만 — 정체성 ↔ 메뉴. 항목끼리는 이어 붙여 칸 분할감 줄임 */}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    render={<Link to="/mypage" />}
                    className="rounded-lg py-2"
                  >
                    <User />
                    마이페이지
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleLogout}
                    className="rounded-lg py-2"
                  >
                    <LogOut />
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
