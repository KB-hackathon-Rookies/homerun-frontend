import { useNotificationApi } from '~/api/notification';

/**
 * 헤더 종(bell) 위의 안 읽음 표시.
 *
 * 개수는 필요 없다 — 점 하나면 되므로 "하나라도 있나"만 본다(`unreadOnly`, limit 1).
 * 값은 `useState` 로 화면 사이에 공유하고, 헤더가 뜰 때 새로 고친다. 실패해도
 * 헤더가 멈추면 안 되므로 조용히 삼킨다(배지가 안 켜질 뿐이다).
 */
export function useUnreadNotifications() {
  const hasUnread = useState('notifications:has-unread', () => false);
  const { list } = useNotificationApi();

  async function refresh() {
    try {
      hasUnread.value = (await list(true, 1)).length > 0;
    } catch {
      // 배지는 조용히 실패한다.
    }
  }

  return { hasUnread, refresh };
}
