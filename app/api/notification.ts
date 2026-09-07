import type { ApiResponse } from '~/types/api';

/**
 * 알림 인박스.
 *
 * 홈 상단의 개수는 읽지 않은 것만 센다. 목록 화면은 아직 없어서 지금은 개수만 쓴다.
 */
const BASE = '/api/v1/notifications';

export type NotificationType = 'CONTRACT_DEADLINE' | 'APPLICATION_RESULT_PENDING';

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
  };
}
