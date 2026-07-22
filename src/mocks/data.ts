// 도메인 경계를 넘어 공유되는 픽스처·가변 저장소만 이 파일에 둔다.
// 한 도메인만 쓰는 픽스처는 해당 handlers/<도메인>.ts에 지역으로 선언한다.
import type { CartItem } from "@/shared/types/cart";
import type { Order } from "@/pages/mypage/types";

// 인기상품 목 — home PopularProduct 계약과 동일(P-4 응답 필드 그대로).
// catalog(목록·상세)·cart(담기 검증)·wishlist(찜 추가)가 함께 참조한다.
export const POPULAR_PRODUCTS = [
  {
    productId: 101,
    name: "Logitech MX Keys Mini 무선 키보드",
    brandName: "Logitech",
    imageUrl:
      "https://img.29cm.co.kr/item/202601/11f0ed21bafcaaeca540f7b64137d1e5.jpg?width=1440&format=webp",
    price: 119000,
    originalPrice: 149000,
    rating: 4.8,
    reviewCount: 2847,
    purchasable: true,
    // 재고 소수 상품 — 재고 부족(CART_STOCK_INSUFFICIENT) 흐름 확인용.
    stock: 0,
  },
  {
    productId: 102,
    name: "Sony WH-1000XM5 노이즈캔슬링 헤드폰",
    brandName: "Sony",
    imageUrl:
      "https://img.29cm.co.kr/item/202604/11f137b51654a49dbc92213193f65993.jpg?width=1440&format=webp",
    price: 389000,
    originalPrice: 449000,
    rating: 4.9,
    reviewCount: 5210,
    purchasable: true,
    stock: 100,
  },
  {
    productId: 103,
    name: "아이리스오야마 수납박스 6P 세트",
    brandName: "아이리스오야마",
    imageUrl:
      "https://img.29cm.co.kr/item/202606/11f1687874f0acbd9090abe3de51eb89.png?width=400&format=webp",
    price: 42900,
    originalPrice: 55000,
    rating: 4.7,
    reviewCount: 5621,
    purchasable: true,
    stock: 100,
  },
  {
    productId: 104,
    name: "브리타 마렐라 정수 물병 1.4L",
    brandName: "브리타",
    imageUrl:
      "https://img.29cm.co.kr/item/202602/11f10618d50592d0a3c0c51b729aeb9e.jpg?width=1440&format=webp",
    price: 34000,
    originalPrice: 34000,
    rating: 4.5,
    reviewCount: 3401,
    purchasable: true,
    stock: 100,
  },
  {
    productId: 105,
    name: "베이직 오버핏 코튼 셔츠",
    brandName: "데일리로브",
    imageUrl:
      "https://img.29cm.co.kr/next-product/2026/07/02/fb5e5f5674454a2e81c81b5d1b0e830a_20260702163831.jpg?width=400&format=webp",
    price: 39000,
    originalPrice: 59000,
    rating: 4.6,
    reviewCount: 1820,
    purchasable: true,
    stock: 100,
  },
  {
    productId: 106,
    name: "센텔라 수분 진정 토너 300ml",
    brandName: "라운드랩",
    imageUrl:
      "https://img.29cm.co.kr/item/202605/11f15b279fa6d9659f7f97288c3b29a9.jpg?width=400&format=webp",
    price: 18900,
    originalPrice: 25000,
    rating: 4.8,
    reviewCount: 9210,
    purchasable: true,
    stock: 100,
  },
];

// 모든 목 상품이 같은 옵션 셋을 갖는다. 상세(P-2)와 담기(C-2)가 같은 값을 봐야
// "옵션 필수/유효하지 않은 옵션" 검증이 일관되므로 상수로 공유한다.
export const MOCK_PRODUCT_OPTIONS = [
  { optionId: 10, name: "화이트/M", extraPrice: 0 },
  { optionId: 11, name: "블랙/L", extraPrice: 2000 },
];

// 장바구니 저장소 — cart(담기/수량/삭제)와 orders(결제 성공 시 차감)가 함께 갱신한다.
// ES 모듈 import 바인딩은 재할당할 수 없으므로 배열을 객체 속성으로 감싼다.
// 타입을 명시하는 이유: 픽스처만으로 추론하면 optionId/optionName이 non-null로
// 좁혀져 옵션 없는 상품을 담을 수 없다.
export const cartDb: { items: CartItem[] } = {
  items: [
    {
      cartItemId: 55,
      productId: 301,
      name: "가먼트 다잉 오버핏 반팔 티셔츠 TSOP1180",
      brandId: 1,
      brandName: "톤앤보이스",
      imageUrl:
        "https://image.msscdn.net/thumbnails/images/goods_img/20260415/6317871/6317871_17811631352969_big.jpg?w=1200",
      optionId: 10,
      optionName: "차콜/L",
      quantity: 1,
      price: 92000,
      originalPrice: 230000,
      purchasable: true,
    },
    {
      cartItemId: 56,
      productId: 306,
      name: "소프트 코튼 크루넥 반팔 티셔츠 LB-D221",
      brandId: 2,
      brandName: "리버클래시",
      imageUrl:
        "https://image.msscdn.net/thumbnails/images/goods_img/20250722/5262448/5262448_17561780734495_big.jpg?w=1200",
      optionId: 11,
      optionName: "그레이/M",
      quantity: 1,
      price: 89000,
      originalPrice: 89000,
      purchasable: true,
    },
    // 구매 불가(HIDDEN) 케이스 — 목록에는 남고 합계에서만 빠지는 동작 확인용
    {
      cartItemId: 57,
      productId: 303,
      name: "헤비웨이트 오버핏 티셔츠 TSKN1801",
      brandId: 3,
      brandName: "커스텀에이드",
      imageUrl:
        "https://image.msscdn.net/thumbnails/images/goods_img/20260618/6694104/6694104_17817540562281_big.jpg?w=1200",
      optionId: 12,
      optionName: "카키/L",
      quantity: 2,
      price: 89000,
      originalPrice: 112000,
      purchasable: false,
    },
  ],
};

// 주문 목록 (O-3) 목 — mypage/types.ts Order 계약. 8종 enum 중 대표 케이스를 담는다.
// orders(목록·상세)·claims(신청 대상 검증)·reviews(자격 검증)가 함께 참조한다.
export const MOCK_ORDER_PAGE_ITEMS: Order[] = [
  {
    orderId: 1001,
    orderNo: "ORD-20260713-1001",
    orderedAt: "2026-07-13T14:00:00+09:00",
    representativeStatus: "SHIPPING",
    totalAmount: 92000,
    items: [
      {
        orderItemId: 2001,
        productId: 301,
        productName: "가먼트 다잉 오버핏 반팔 티셔츠 TSOP1180",
        optionName: "차콜/L",
        quantity: 1,
        price: 92000,
        imageUrl:
          "https://image.msscdn.net/thumbnails/images/goods_img/20230724/3421211/3421211_17803608469427_big.jpg?w=1200",
        status: "SHIPPING",
      },
    ],
  },
  {
    orderId: 1002,
    orderNo: "ORD-20260701-1002",
    orderedAt: "2026-07-01T10:30:00+09:00",
    representativeStatus: "DELIVERED",
    totalAmount: 89000,
    items: [
      {
        orderItemId: 2002,
        productId: 306,
        productName: "소프트 코튼 크루넥 반팔 티셔츠 LB-D221",
        optionName: "그레이/M",
        quantity: 1,
        price: 89000,
        imageUrl:
          "https://image.msscdn.net/thumbnails/images/goods_img/20250722/5262448/5262448_17561780734495_big.jpg?w=1200",
        status: "DELIVERED",
      },
    ],
  },
  // 클레임 진행 중 — 반품 신청 버튼이 뜨지 않아야 하는 케이스
  {
    orderId: 1003,
    orderNo: "ORD-20260620-1003",
    orderedAt: "2026-06-20T09:15:00+09:00",
    representativeStatus: "CLAIM_IN_PROGRESS",
    totalAmount: 62000,
    items: [
      {
        orderItemId: 2003,
        productId: 305,
        productName: "릴렉스핏 하프 슬리브 니트 TSSK1402",
        optionName: "차콜/M",
        quantity: 1,
        price: 62000,
        imageUrl:
          "https://img.29cm.co.kr/item/202606/11f16f98cff926419090358d89120339.png?width=1440&format=webp",
        status: "CLAIM_IN_PROGRESS",
      },
    ],
  },
  {
    orderId: 1004,
    orderNo: "ORD-20260605-1004",
    orderedAt: "2026-06-05T16:40:00+09:00",
    representativeStatus: "COMPLETED",
    totalAmount: 198000,
    items: [
      {
        orderItemId: 2004,
        productId: 304,
        productName: "브러시드 플리스 스웨트셔츠 TSCT3301",
        optionName: "그레이/M",
        quantity: 1,
        price: 198000,
        imageUrl:
          "https://image.msscdn.net/thumbnails/images/goods_img/20251022/5625561/5625561_17610941581236_big.jpg?w=1200",
        status: "COMPLETED",
      },
    ],
  },
];
