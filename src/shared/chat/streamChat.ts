import { api } from '@/shared/api/client';
import type { ChatChannel, ChatEvent, ChatRequest } from '@/shared/types/chat';

export interface ChatSession {
  sessionId: string;
  streamTicket: string;
  llmSseUrl: string;
}

export class ChatHttpError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`chat request failed: ${status}`);
    this.status = status;
  }
}

export async function issueChatSession(channel: ChatChannel): Promise<ChatSession> {
  const path = channel === 'SELLER' ? '/api/chat/seller/sessions' : '/api/chat/sessions';
  const { data } = await api.post<ChatSession>(
    path,
    channel === 'SELLER' ? undefined : { channel },
  );
  return data;
}

export async function reissueChatTicket(sessionId: string): Promise<ChatSession> {
  const { data } = await api.post<ChatSession>('/api/chat/tickets', { sessionId });
  return data;
}

/**
 * 채팅 SSE 스트림 소비 유틸.
 * POST + JSON body이므로 EventSource가 아닌 fetch 스트리밍으로 파싱한다.
 * 자동 재시도 금지(중복 담기 방지) — 실패 시 호출부에서 재시도 버튼 제공.
 */
export async function streamChat(
  session: ChatSession,
  req: ChatRequest,
  onEvent: (e: ChatEvent) => void | Promise<void>,
  signal?: AbortSignal,
): Promise<void> {
  // 로그인 AT가 아니라 Spring이 발급한 단명 RS256 스트림 티켓을 FastAPI에 보낸다.
  const res = await fetch(session.llmSseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.streamTicket}`,
    },
    body: JSON.stringify(req),
    signal,
  });

  if (!res.ok || !res.body) throw new ChatHttpError(res.status);

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
      let event = 'message';
      let data = '';
      for (const line of chunk.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data += line.slice(5).trim();
      }
      if (!data) continue;
      const parsed = JSON.parse(data) as {
        type?: ChatEvent['event'];
        data?: unknown;
      };
      // FastAPI 정본은 `data: {type,data}`이고, MSW 데모는 event/data 줄을 쓴다.
      const normalized = parsed.type
        ? { event: parsed.type, data: parsed.data }
        : { event, data: parsed };
      await onEvent(normalized as ChatEvent);
    }
  }
}
