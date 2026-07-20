import { Link, NavLink } from "react-router-dom";
import { ChevronDown, LogOut, MessageSquare } from "lucide-react";
import { buttonVariants } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useLogout } from "@/shared/hooks/useLogout";
import { useAuthStore } from "@/shared/stores/authStore";

const MENU = [
  { to: "/seller", label: "대시보드", end: true },
  { to: "/seller/orders", label: "주문" },
  { to: "/seller/products", label: "상품" },
  { to: "/seller/chat", label: "AI 어시스턴트" },
];

interface SellerHeaderProps {
  /** 사이드 채팅 토글 — 챗봇 전용 화면(/seller/chat)에선 전달하지 않음 */
  chatOpen?: boolean;
  onToggleChat?: () => void;
}

/**
 * 판매자 전용 헤더 — 로고·네비·계정을 한 줄에.
 * AppHeader(찜·장바구니 등 쇼핑 동선)는 판매자 업무와 무관해 쓰지 않는다.
 */
export function SellerHeader({ chatOpen, onToggleChat }: SellerHeaderProps) {
  const user = useAuthStore((s) => s.user);
  const handleLogout = useLogout();

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        {/* 로고 → 쇼핑몰 홈(판매자도 구매자 화면으로 돌아갈 수 있어야 함) */}
        <Link
          to="/"
          aria-label="Jarvis 홈"
          className="flex shrink-0 items-baseline gap-2"
        >
          <span className="text-lg font-bold tracking-tight">Jarvis</span>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Seller
          </span>
        </Link>

        {/* 데스크탑: 헤더 안 네비 / 모바일: 아래 줄로 분리 */}
        <nav className="hidden md:block">
          <ul className="flex items-center gap-1">
            {MENU.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "flex h-11 items-center whitespace-nowrap rounded-full px-3.5 text-sm transition-colors",
                      isActive
                        ? "bg-muted font-bold text-foreground"
                        : "font-medium text-muted-foreground hover:text-foreground",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          {/* 사이드 채팅 토글 — 목록을 보면서 대화하기 위한 진입점 */}
          {onToggleChat && (
            <button
              type="button"
              onClick={onToggleChat}
              aria-pressed={chatOpen}
              aria-label={chatOpen ? "AI 채팅 닫기" : "AI 채팅 열기"}
              title={chatOpen ? "AI 채팅 닫기" : "AI 채팅 열기"}
              className={cn(
                "flex h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors active:scale-95",
                chatOpen
                  ? "bg-brand text-brand-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <MessageSquare className="size-4" />
              <span className="hidden sm:inline">AI 채팅</span>
            </button>
          )}

          {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "h-11 shrink-0 gap-1.5 rounded-full px-3 text-sm font-medium",
              )}
            >
              <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {user.nickname.charAt(0)}
              </span>
              <span className="hidden sm:inline">{user.nickname}</span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={6}
              className="w-56 rounded-xl p-1.5 shadow-lg"
            >
              <div className="flex items-center gap-2.5 px-1.5 py-1.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {user.nickname.charAt(0)}
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold leading-tight">
                    {user.nickname}
                  </span>
                  <span className="text-xs text-muted-foreground">판매자</span>
                </div>
              </div>
              <DropdownMenuSeparator />
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
          ) : null}
        </div>
      </div>

      {/* 모바일 네비 — 헤더에 다 넣으면 좁아서 아래 줄로 */}
      <nav className="md:hidden">
        <ul className="flex gap-1 overflow-x-auto border-t px-4 sm:px-6">
          {MENU.map((item) => (
            <li key={item.to} className="shrink-0">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex h-11 items-center whitespace-nowrap border-b-2 px-3 text-sm transition-colors",
                    isActive
                      ? "border-foreground font-bold text-foreground"
                      : "border-transparent font-medium text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
