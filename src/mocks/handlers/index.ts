// 도메인별 목 핸들러 결합 — MSW는 배열 순서대로 매칭하므로 순서가 의미를 가진다.
// (catalog 내부: /api/products/popular·recommended·recent 고정 경로가
//  /api/products/:productId 캐치올보다 앞 — catalog.ts 안에서 보장)
// 구 /api/mypage/orders 목은 백엔드에 없는 경로라 분할 시 제거함(/api/orders가 정본).
import { authHandlers } from "./auth";
import { catalogHandlers } from "./catalog";
import { chatHandlers } from "./chat";
import { claimHandlers } from "./claims";
import { reviewHandlers } from "./reviews";
import { inquiryHandlers } from "./inquiries";
import { cartHandlers } from "./cart";
import { addressHandlers } from "./addresses";
import { orderHandlers } from "./orders";
import { wishlistHandlers } from "./wishlist";
import { sellerHandlers } from "./seller";

export const handlers = [
  ...authHandlers,
  ...catalogHandlers,
  ...chatHandlers,
  ...claimHandlers,
  ...reviewHandlers,
  ...inquiryHandlers,
  ...cartHandlers,
  ...addressHandlers,
  ...orderHandlers,
  ...wishlistHandlers,
  ...sellerHandlers,
];
