import { Navigate } from "react-router-dom";

// 찜 목록은 마이페이지로 통합. 헤더 하트 아이콘(/wishlist)은 마이페이지 찜 탭으로 리다이렉트.
// (라우트 가드가 로그인 유도 후 이 경로로 복귀 → 다시 /mypage/wishlist로)
export default function WishlistPage() {
  return <Navigate to="/mypage/wishlist" replace />;
}
