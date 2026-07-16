import { Link, Navigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { AppHeader } from "@/shared/ui/AppHeader";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/shared/stores/authStore";

// 찜 목록은 마이페이지로 통합 — 회원은 /mypage/wishlist로 리다이렉트.
// 게스트는 로그인 유도 빈 화면을 보여준다(헤더 하트는 항상 노출되므로 진입 자체는 허용).
export default function WishlistPage() {
  const user = useAuthStore((s) => s.user);

  if (user) return <Navigate to="/mypage/wishlist" replace />;

  // 로그인 후 찜 목록으로 복귀
  const returnUrl = encodeURIComponent("/mypage/wishlist");

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 p-4 pb-20 sm:p-6">
        <h1 className="text-2xl font-bold sm:text-3xl">찜</h1>

        <div className="mt-6 flex flex-col items-center gap-3 rounded-sm border border-dashed bg-background py-16 text-center">
          <Heart className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium">아직 찜한 상품이 없어요</p>
          <p className="text-sm text-muted-foreground">
            로그인하고 관심 상품의 할인 소식을 받아보세요.
          </p>
          <Link
            to={`/login?returnUrl=${returnUrl}`}
            className={cn(buttonVariants(), "mt-1 h-11 rounded-full px-6")}
          >
            로그인하기
          </Link>
        </div>
      </main>
    </div>
  );
}
