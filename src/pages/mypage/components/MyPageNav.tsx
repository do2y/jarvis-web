import { NavLink } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const MENU = [
  { to: "/mypage/orders", label: "주문 내역" },
  { to: "/mypage/claims", label: "취소·반품·교환" },
  { to: "/mypage/recent", label: "최근 본 상품" },
  { to: "/mypage/wishlist", label: "찜" },
  { to: "/mypage/addresses", label: "배송지 관리" },
  { to: "/mypage/inquiries", label: "문의 내역" },
];

export function MyPageNav() {
  return (
    <nav>
      {/* 모바일: 가로 스크롤 필 / 데스크탑: 세로 리스트 (Apple 설정앱 스타일 셀) */}
      <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:px-0 lg:pb-0">
        {MENU.map((item) => (
          <li key={item.to} className="shrink-0 lg:shrink">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "group flex h-11 items-center whitespace-nowrap rounded-full px-4 text-sm font-medium transition-all duration-200 active:scale-[0.98] lg:justify-between lg:rounded-sm lg:px-3.5",
                  isActive
                    ? "bg-primary text-primary-foreground lg:bg-muted lg:text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="tracking-tight">{item.label}</span>
                  <ChevronRight
                    className={cn(
                      "hidden size-4 shrink-0 transition-colors lg:block",
                      isActive
                        ? "text-muted-foreground"
                        : "text-muted-foreground/40 group-hover:text-muted-foreground",
                    )}
                  />
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
