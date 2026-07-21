import { http, HttpResponse } from "msw";
import { BASE, fail, ok } from "../shared";

// 배송지 목 (M-8) — shared/types/address.ts Address 계약.
// 결제·마이페이지가 같은 /api/addresses를 쓰므로 배열도 하나만 둔다.
// let: 추가·수정·삭제·기본설정이 갱신.
let mockAddresses: {
  addressId: number;
  label: string;
  recipient: string;
  phone: string;
  zipCode: string;
  address1: string;
  address2?: string;
  isDefault?: boolean;
}[] = [
  {
    addressId: 3,
    label: "집",
    recipient: "김소이",
    phone: "010-1234-5678",
    zipCode: "06292",
    address1: "서울특별시 강남구 테헤란로 123",
    address2: "101동 302호",
    isDefault: true,
  },
  {
    addressId: 4,
    label: "회사",
    recipient: "김소이",
    phone: "010-1234-5678",
    zipCode: "04799",
    address1: "서울특별시 성동구 왕십리로 50",
    address2: "센터포인트빌딩 8층",
    isDefault: false,
  },
];
let nextAddressSeq = 5;

export const addressHandlers = [
  // 목록 — 결제·마이페이지가 공유하는 단일 계약. 로그인 필요.
  http.get(`${BASE}/api/addresses`, ({ request }) => {
    if (!request.headers.get("Authorization")) {
      return HttpResponse.json(fail("AUTH_REQUIRED", "로그인이 필요합니다."), {
        status: 401,
      });
    }
    return HttpResponse.json(ok({ addresses: mockAddresses }));
  }),

  // 배송지 추가 (M-8a) — 응답은 저장된 전체 주소 객체. 로그인 필요.
  http.post(`${BASE}/api/addresses`, async ({ request }) => {
    if (!request.headers.get("Authorization")) {
      return HttpResponse.json(fail("AUTH_REQUIRED", "로그인이 필요합니다."), {
        status: 401,
      });
    }
    const input = (await request.json()) as Omit<
      (typeof mockAddresses)[number],
      "addressId" | "isDefault"
    > & { isDefault?: boolean };
    // address2만 선택, 나머지는 필수
    const missing = (
      ["label", "recipient", "phone", "zipCode", "address1"] as const
    ).filter((f) => !input[f]?.trim());
    if (missing.length > 0) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "입력값을 확인해주세요.",
            fields: missing.map((f) => ({
              field: f,
              message: "필수 입력 항목입니다.",
            })),
          },
        },
        { status: 400 },
      );
    }

    const created = {
      ...input,
      addressId: nextAddressSeq++,
      // 첫 배송지는 자동 기본. 명시적 기본 지정 시 기존 기본은 해제된다.
      isDefault: input.isDefault ?? mockAddresses.length === 0,
    };
    if (created.isDefault) {
      mockAddresses = mockAddresses.map((a) => ({
        ...a,
        isDefault: false,
      }));
    }
    mockAddresses = [...mockAddresses, created];
    // 응답은 저장된 전체 주소 객체 (2026-07-18 확정)
    return HttpResponse.json(ok(created));
  }),

  // 배송지 수정 (M-8b) — 보낸 필드만 부분 반영. { isDefault: true }로 기본 지정도 겸한다.
  // 응답은 수정 반영된 전체 주소 객체. 없는/타인 배송지는 404로 존재 은닉.
  http.patch(`${BASE}/api/addresses/:addressId`, async ({ params, request }) => {
    if (!request.headers.get("Authorization")) {
      return HttpResponse.json(fail("AUTH_REQUIRED", "로그인이 필요합니다."), {
        status: 401,
      });
    }
    const id = Number(params.addressId);
    if (!mockAddresses.some((a) => a.addressId === id)) {
      return HttpResponse.json(
        fail("ADDRESS_NOT_FOUND", "배송지를 찾을 수 없습니다."),
        { status: 404 },
      );
    }
    const patch = (await request.json()) as Partial<
      (typeof mockAddresses)[number]
    >;

    // 기본으로 지정하면 기존 기본은 같은 트랜잭션에서 해제된다
    if (patch.isDefault) {
      mockAddresses = mockAddresses.map((a) => ({
        ...a,
        isDefault: false,
      }));
    }
    mockAddresses = mockAddresses.map((a) =>
      a.addressId === id ? { ...a, ...patch, addressId: id } : a,
    );
    const updated = mockAddresses.find((a) => a.addressId === id)!;
    return HttpResponse.json(ok(updated));
  }),

  // 배송지 삭제 (M-8c) — 유일한 배송지는 삭제 불가.
  // 기본 배송지를 지우면 가장 오래된 주소가 자동 승격된다.
  http.delete(`${BASE}/api/addresses/:addressId`, ({ params, request }) => {
    if (!request.headers.get("Authorization")) {
      return HttpResponse.json(fail("AUTH_REQUIRED", "로그인이 필요합니다."), {
        status: 401,
      });
    }
    const id = Number(params.addressId);
    const target = mockAddresses.find((a) => a.addressId === id);
    if (!target) {
      return HttpResponse.json(
        fail("ADDRESS_NOT_FOUND", "배송지를 찾을 수 없습니다."),
        { status: 404 },
      );
    }
    if (mockAddresses.length <= 1) {
      return HttpResponse.json(
        fail("ADDRESS_LAST_UNDELETABLE", "배송지가 1개일 때는 삭제할 수 없습니다."),
        { status: 400 },
      );
    }
    mockAddresses = mockAddresses.filter((a) => a.addressId !== id);
    // 기본을 지웠으면 남은 첫 항목(가장 오래된 주소)을 기본으로 승격
    if (target.isDefault) {
      mockAddresses = mockAddresses.map((a, i) => ({
        ...a,
        isDefault: i === 0,
      }));
    }
    return HttpResponse.json(ok(null));
  }),
];
