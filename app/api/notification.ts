import type { ApiResponse } from '~/types/api';

/**
 * 알림 인박스.
 *
 * 홈 상단의 개수는 읽지 않은 것만 센다. 목록 화면은 아직 없어서 지금은 개수만 쓴다.
 */
const BASE = '/api/v1/notifications';

export type NotificationType =
  | 'CONTRACT_DEADLINE'
  | 'CONTRACT_MILESTONE'
  | 'APPLICATION_RESULT_PENDING'
  | 'RETURN_GUARANTEE_REMINDER'
  | 'LEASE_RENEWAL_WINDOW';

/** 토큰이 어느 기기에서 왔는가. 통계·관리용이고 전송 방식은 같다. */
export type DevicePlatform = 'ANDROID' | 'IOS' | 'WEB';

export interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  /** 딥링크용 값. 어떤 키가 오는지는 알림 종류마다 다르다. */
  data: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
  readAt: string | null;
}

export function useNotificationApi() {
  const { $api } = useNuxtApp();

  return {
    async list(unreadOnly = false, limit = 20) {
      const { data } = await $api.get<ApiResponse<NotificationItem[]>>(BASE, {
        params: { unreadOnly, limit },
      });
      return data.data;
    },

    /**
     * 이 브라우저로 알림을 보내 달라고 등록한다.
     *
     * 토큰은 브라우저가 갱신하거나 폐기한다. 그래서 등록은 한 번이 아니라
     * 앱을 열 때마다 다시 보낸다 — 백엔드가 같은 토큰을 멱등하게 받는다.
     */
    async registerToken(token: string, platform: DevicePlatform = 'WEB') {
      await $api.post<ApiResponse<void>>(`${BASE}/tokens`, { token, platform });
    },
  };
}
