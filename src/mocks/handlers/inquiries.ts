import { http, HttpResponse } from "msw";
import { BASE } from "../shared";

// 문의 내역 목 — mypage/types.ts Inquiry 계약. createdAt 내림차순(최신순).
// 답변완료(ANSWERED)만 answer·answeredAt 포함, 처리중(PENDING)은 null.
const MOCK_INQUIRIES = [
  {
    inquiryId: "INQ-20250602",
    title: "환불 처리 기간이 얼마나 걸리나요?",
    status: "PENDING",
    content:
      "지난주에 반품 신청한 니트 환불이 아직 안 됐어요. 보통 며칠 정도 걸리나요?",
    answer: null,
    createdAt: "2025-06-02",
    answeredAt: null,
  },
  {
    inquiryId: "INQ-20250518",
    title: "배송이 너무 늦어요",
    status: "ANSWERED",
    content: "주문한 지 일주일이 지났는데 아직 배송 시작 안내가 없어요.",
    answer:
      "고객님, 주문하신 상품은 현재 물류센터에서 출고 준비 중이며 1~2일 내 발송될 예정입니다. 배송이 지연되어 불편을 드려 죄송합니다.",
    createdAt: "2025-05-18",
    answeredAt: "2025-05-19",
  },
  {
    inquiryId: "INQ-20250430",
    title: "사이즈가 안 맞는데 어떻게 하나요?",
    status: "ANSWERED",
    content: "구매한 코트가 조금 커서 한 사이즈 작은 걸로 다시 사고 싶어요.",
    answer:
      "마이페이지 > 주문 내역에서 해당 상품의 [반품 신청]을 눌러 환불받으신 뒤 원하는 사이즈로 다시 주문해주세요. 반품 배송비는 단순 변심의 경우 고객 부담인 점 참고 부탁드립니다.",
    createdAt: "2025-04-30",
    answeredAt: "2025-05-02",
  },
];

export const inquiryHandlers = [
  // 문의 내역 — 읽기 전용(문의 챗봇에서 접수, 답변은 관리자가 등록).
  // ⚠ /api/mypage/* 중 유일하게 살아있는 경로 — 백엔드 계약 확정 시 재점검.
  http.get(`${BASE}/api/mypage/inquiries`, () =>
    HttpResponse.json({ inquiries: MOCK_INQUIRIES }),
  ),
];
