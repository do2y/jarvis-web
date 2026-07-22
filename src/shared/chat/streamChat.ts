import { useAuthStore } from '@/shared/stores/authStore';
import type { ChatEvent, ChatRequest } from '@/shared/types/chat';

/**
 * 채팅 SSE 스트림 소비 유틸.
 * POST + JSON body이므로 EventSource가 아닌 fetch 스트리밍으로 파싱한다.
 * 자동 재시도 금지(중복 담기 방지) — 실패 시 호출부에서 재시도 버튼 제공.
 */
export async function streamChat(
  req: ChatRequest,
  onEvent: (e: ChatEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const token = useAuthStore.getState().accessToken;

  // TODO: 엔드포인트는 백엔드 확정 시 반영
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(req),
    signal,
  });

  if (!res.ok || !res.body) throw new Error(`chat request failed: ${res.status}`);

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
      if (data) onEvent({ event, data: JSON.parse(data) } as ChatEvent);
    }
  }
}
