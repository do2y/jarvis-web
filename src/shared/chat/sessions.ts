import { api } from "@/shared/api/client";
import type { ChatChannel, ChatSession } from "@/shared/types/chat";

/**
 * 챗 스트림 진입 티켓 발급.
 * SSE 연결 전에 로그인 AT 를 단명 streamTicket 으로 교환한다(신원·brandId 는 서버가 도출).
 * 이 요청은 Spring REST(공통 api 인스턴스: AT 자동 첨부 + 401 refresh)로 나간다.
 * SSE 요청과 달리 fetch 스트리밍이 아니므로 axios 를 쓴다.
 */

/**
 * 판매자 챗 세션·티켓 발급 — POST /api/chat/seller/sessions.
 * 입구 자체가 SELLER 전용(body 없음). brandId 는 JWT→DB 로 서버가 도출해 티켓 claim 에 박는다.
 * 실패: 401(미인증) / 403(SELLER 아님) / 404 SELLER_BRAND_NOT_FOUND(연결 브랜드 없음) → ApiError 로 전파.
 */
export async function openSellerSession(): Promise<ChatSession> {
  const res = await api.post<ChatSession>("/api/chat/seller/sessions");
  return res.data;
}

/**
 * 구매자 챗 세션·티켓 발급 — POST /api/chat/sessions.
 * channel(SHOPPING|CS) 선택, 생략 시 SHOPPING. 게스트는 guest_id 쿠키로 식별(AT 없어도 됨).
 * (셀러 흐름 우선 구현 — 구매자 연결은 후속. 시그니처만 맞춰 둔다)
 */
export async function openChatSession(
  channel: Exclude<ChatChannel, "SELLER"> = "SHOPPING",
): Promise<ChatSession> {
  const res = await api.post<ChatSession>("/api/chat/sessions", { channel });
  return res.data;
}
