import type { ChatEvent, StreamChatBody } from '@/shared/types/chat';

/**
 * SSE 연결 시작 실패(스트림 시작 전 거부). status 를 담아 호출부가 분기할 수 있게 한다.
 * 특히 401(티켓 만료·무효)은 호출부가 티켓 재발급 후 1회 재시도한다(계약 CH-2).
 * 스트림이 시작된 뒤(토큰 수신 중)의 오류는 이 에러가 아니라 SSE `error` 이벤트로 온다.
 */
export class StreamStartError extends Error {
  status: number;
  constructor(status: number) {
    super(`chat request failed: ${status}`);
    this.name = 'StreamStartError';
    this.status = status;
  }
}

/**
 * 채팅 SSE 스트림 소비 유틸.
 * POST + JSON body이므로 EventSource가 아닌 fetch 스트리밍으로 파싱한다.
 * 자동 재시도 금지(중복 담기 방지) — 실패 시 호출부에서 재시도 버튼 제공.
 * 예외: 401(티켓 만료)만 스트림 시작 전이라 재발급 후 1회 재시도 안전(호출부 처리).
 *
 * 인증은 로그인 AT 가 아니라 세션 발급으로 받은 단명 streamTicket 을 싣는다.
 * URL 도 세션 발급 응답의 llmSseUrl 을 그대로 쓴다(BE 설정값) — 여기서 URL 을 만들지 않는다.
 */
export async function streamChat(
  sseUrl: string,
  ticket: string,
  body: StreamChatBody,
  onEvent: (e: ChatEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(sseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      Authorization: `Bearer ${ticket}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok || !res.body) throw new StreamStartError(res.status);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() ?? ''; // 미완성 조각 보류

    for (const chunk of chunks) {
      // 와이어 포맷: `data: {"type":..., "data":{...}}` 한 줄(구매자·판매자 공통).
      // event: 라인은 없다 — payload 의 type 으로 이벤트를 구분한다.
      let data = '';
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data:')) data += line.slice(5).trim();
      }
      if (data) onEvent(JSON.parse(data) as ChatEvent);
    }
  }
}
