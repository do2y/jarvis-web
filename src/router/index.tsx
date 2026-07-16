import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import { RequireAuth, RequireRole } from './guards';

// 페이지 단위 코드 스플리팅 (lazy)
const AuthPage = lazy(() => import('@/pages/auth'));
const HomePage = lazy(() => import('@/pages/home'));
const ChatPage = lazy(() => import('@/pages/chat'));
const ProductPage = lazy(() => import('@/pages/product'));
const BrandPage = lazy(() => import('@/pages/brand'));
const CartPage = lazy(() => import('@/pages/cart'));
const WishlistPage = lazy(() => import('@/pages/wishlist'));
const CheckoutPage = lazy(() => import('@/pages/checkout'));
const OrderCompletePage = lazy(() => import('@/pages/checkout/OrderComplete'));
const MyPage = lazy(() => import('@/pages/mypage'));
const InquiryPage = lazy(() => import('@/pages/inquiry'));
const SellerPage = lazy(() => import('@/pages/seller'));
const AdminPage = lazy(() => import('@/pages/admin'));

function Root() {
  // TODO: 공통 레이아웃(헤더 등)을 여기에 배치
  return (
    <Suspense fallback={null}>
      <Outlet />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      // ── 공개 라우트 (게스트 접근 가능) ──
      { path: '/', element: <HomePage /> },
      { path: '/chat', element: <ChatPage /> }, // 챗봇: 게스트도 사용 가능
      { path: '/login', element: <AuthPage /> },
      { path: '/signup', element: <AuthPage /> },
      { path: '/products/:productId', element: <ProductPage /> },
      { path: '/brands/:brandId', element: <BrandPage /> },
      { path: '/inquiry', element: <InquiryPage /> }, // 문의 챗봇: 게스트는 일반 안내만
      { path: '/cart', element: <CartPage /> }, // 장바구니: 게스트도 담기·조회 가능(구매만 로그인)
      { path: '/wishlist', element: <WishlistPage /> }, // 게스트는 로그인 유도 화면, 회원은 마이페이지 찜으로

      // ── 회원 전용 ──
      {
        element: <RequireAuth />,
        children: [
          { path: '/checkout', element: <CheckoutPage /> },
          { path: '/checkout/complete', element: <OrderCompletePage /> },
          { path: '/mypage/*', element: <MyPage /> },
        ],
      },

      // ── 판매자 전용 ──
      {
        element: <RequireRole role="SELLER" />,
        children: [{ path: '/seller/*', element: <SellerPage /> }],
      },

      // ── 관리자 전용 ──
      {
        element: <RequireRole role="ADMIN" />,
        children: [{ path: '/admin/*', element: <AdminPage /> }],
      },
    ],
  },
]);
