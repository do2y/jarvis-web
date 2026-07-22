import { lazy, Suspense, useEffect } from 'react';
import {
  createBrowserRouter,
  Outlet,
  useLocation,
  useNavigationType,
} from 'react-router-dom';
import { track } from '@/shared/analytics/track';
import { BlockSeller, RequireAuth, RequireRole } from './guards';

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
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  // 모든 라우트가 이 밑에 중첩되므로 여기 한 곳에서 page_view를 수집한다.
  // search는 쿼리스트링에 검색어가 실려 개인정보가 될 수 있어 path만 보낸다(명세).
  useEffect(() => {
    track('page_view', { properties: { path: pathname } });
  }, [pathname]);

  // 새 페이지로 이동하면 맨 위에서 시작한다. 이게 없으면 긴 페이지 하단에서 링크를 눌렀을 때
  // 다음 페이지도 하단부터 보인다(브라우저가 스크롤 위치를 유지하므로).
  // 단 POP(뒤로/앞으로 가기)은 브라우저의 스크롤 복원에 맡긴다 — 목록으로 돌아왔을 때
  // 보던 위치가 유지되어야 하므로.
  useEffect(() => {
    if (navigationType !== 'POP') {
      window.scrollTo(0, 0);
    }
  }, [pathname, navigationType]);

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
      // 로그인·가입은 판매자도 접근해야 하므로 BlockSeller 밖에 둔다.
      { path: '/login', element: <AuthPage /> },
      { path: '/signup', element: <AuthPage /> },

      // ── 쇼핑몰(구매자) 라우트 — 판매자는 격리해 /seller로 돌려보낸다 ──
      {
        element: <BlockSeller />,
        children: [
          // 공개 라우트 (게스트 접근 가능)
          { path: '/', element: <HomePage /> },
          { path: '/chat', element: <ChatPage /> }, // 챗봇: 게스트도 사용 가능
          { path: '/products/:productId', element: <ProductPage /> },
          { path: '/brands/:brandId', element: <BrandPage /> },
          { path: '/inquiry', element: <InquiryPage /> }, // 문의 챗봇: 게스트는 일반 안내만
          { path: '/cart', element: <CartPage /> }, // 장바구니: 게스트도 담기·조회 가능(구매만 로그인)
          { path: '/wishlist', element: <WishlistPage /> }, // 게스트는 로그인 유도 화면, 회원은 마이페이지 찜으로

          // 회원 전용
          {
            element: <RequireAuth />,
            children: [
              { path: '/checkout', element: <CheckoutPage /> },
              { path: '/checkout/complete', element: <OrderCompletePage /> },
              { path: '/mypage/*', element: <MyPage /> },
            ],
          },
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
