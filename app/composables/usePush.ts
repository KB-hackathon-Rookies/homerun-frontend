import { deleteToken, getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { useNotificationApi } from '~/api/notification';

/**
 * 웹 푸시.
 *
 * 마감이 걸린 일은 앱을 열어 봐야 알 수 있으면 놓친다. 잔금일은 하루만
 * 밀려도 되돌릴 수 없어서, 알림이 이 서비스에서는 곁가지가 아니다.
 *
 * 다만 **권한은 아무 때나 묻지 않는다.** 첫 화면에서 물으면 대부분 거절하고,
 * 한 번 거절하면 브라우저 설정에 들어가야 되돌릴 수 있다. 그래서 마감이
 * 실제로 생기는 순간(3루 일정 저장)에만 묻는다.
 */
export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported';

export function usePush() {
  const config = useRuntimeConfig().public.firebase;

  const permission = ref<PushPermission>('default');
  const busy = ref(false);

  /** 이 브라우저가 웹 푸시를 하는가. iOS 는 홈 화면에 추가해야 지원으로 잡힌다. */
  async function supported() {
    if (!import.meta.client || !config.projectId) return false;
    if (!('Notification' in window)) return false;
    return isSupported();
  }

  function app() {
    return getApps().length ? getApp() : initializeApp({ ...config });
  }

  /** 워커는 하나뿐이다. 이미 등록된 것을 그대로 쓴다. */
  async function worker() {
    return navigator.serviceWorker.getRegistration('/');
  }

  async function refresh() {
    permission.value = (await supported()) ? Notification.permission : 'unsupported';
  }

  /**
   * 권한을 묻고 토큰을 등록한다.
   *
   * 이미 거절했으면 다시 묻지 않는다 — 브라우저가 어차피 창을 띄우지 않고,
   * 물었다는 사실만 남는다.
   */
  async function enable() {
    if (busy.value || !(await supported())) return false;

    busy.value = true;
    try {
      const granted = await Notification.requestPermission();
      permission.value = granted;
      if (granted !== 'granted') return false;

      const registration = await worker();
      if (!registration) return false;

      const token = await getToken(getMessaging(app()), {
        vapidKey: config.vapidKey,
        serviceWorkerRegistration: registration,
      });
      if (!token) return false;

      await useNotificationApi().registerToken(token);
      return true;
    } catch {
      return false;
    } finally {
      busy.value = false;
    }
  }

  /**
   * 이미 허락한 브라우저의 토큰을 다시 등록한다.
   *
   * 토큰은 브라우저가 갱신하거나 폐기한다. 등록해 둔 것이 죽어 있으면
   * 알림이 조용히 안 온다 — 앱을 열 때마다 다시 보내는 이유다.
   */
  async function resync() {
    if (!(await supported()) || Notification.permission !== 'granted') return;
    await enable();
  }

  /** 앱을 보고 있을 때는 OS 알림이 뜨지 않는다. 화면이 직접 받아 처리한다. */
  async function onForeground(handler: () => void) {
    if (!(await supported()) || Notification.permission !== 'granted') return;
    onMessage(getMessaging(app()), handler);
  }

  /** 알림을 끈다. 토큰을 지워야 백엔드가 더 보내지 않는다. */
  async function disable() {
    if (!(await supported())) return;
    await deleteToken(getMessaging(app()));
    await refresh();
  }

  onMounted(refresh);

  return { permission, busy, supported, enable, resync, disable, onForeground };
}
