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
 *
 * 파이어베이스 묶음도 같은 이유로 미리 받지 않는다. load() 를 볼 것.
 */
export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported';

export function usePush() {
  const config = useRuntimeConfig().public.firebase;

  const permission = ref<PushPermission>('default');
  const busy = ref(false);

  /**
   * 파이어베이스는 쓰기로 정해진 다음에 받는다.
   *
   * 50KB 쯤 되는 묶음인데, 알림을 켠 적 없는 사람에게는 끝까지 한 줄도
   * 쓰이지 않는다. 홈은 로그인하면 반드시 지나는 화면이라 여기서 같이
   * 받으면 안 쓸 사람까지 값을 치른다.
   */
  async function load() {
    const [core, fcm] = await Promise.all([import('firebase/app'), import('firebase/messaging')]);
    const app = core.getApps().length ? core.getApp() : core.initializeApp({ ...config });
    return { fcm, messaging: fcm.getMessaging(app) };
  }

  /**
   * 이 브라우저에서 물어볼 가치가 있는가.
   *
   * 진짜 판정은 supported() 지만 그건 묶음을 받아야 부를 수 있다. 받을지
   * 말지를 정하는 자리라 여기서는 브라우저 기능만 본다. iOS 는 홈 화면에
   * 추가해야 serviceWorker 와 PushManager 가 생겨서 이것만으로도 갈린다.
   */
  function capable() {
    return (
      import.meta.client &&
      Boolean(config.projectId) &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    );
  }

  /**
   * 진짜 판정.
   *
   * 기능은 다 있는데 못 쓰는 경우가 있다 — 사설 모드의 파이어폭스는
   * IndexedDB 를 열어 봐야 알 수 있고, 그 검사가 파이어베이스 안에 있다.
   */
  async function supported() {
    if (!capable()) return false;
    return (await import('firebase/messaging')).isSupported();
  }

  /** 워커는 하나뿐이다. 이미 등록된 것을 그대로 쓴다. */
  function worker() {
    return navigator.serviceWorker.getRegistration('/');
  }

  /** 화면에 적을 상태 한 줄. 묶음 없이 답할 수 있는 만큼만 본다. */
  function refresh() {
    permission.value = capable() ? Notification.permission : 'unsupported';
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

      const { fcm, messaging } = await load();
      const token = await fcm.getToken(messaging, {
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
   *
   * 허락한 적 없으면 되살릴 토큰도 없다. 묶음을 받을 이유가 여기서 끝난다.
   */
  async function resync() {
    if (!capable() || Notification.permission !== 'granted') return;
    await enable();
  }

  /** 앱을 보고 있을 때는 OS 알림이 뜨지 않는다. 화면이 직접 받아 처리한다. */
  async function onForeground(handler: () => void) {
    if (!capable() || Notification.permission !== 'granted') return;
    const { fcm, messaging } = await load();
    fcm.onMessage(messaging, handler);
  }

  /** 알림을 끈다. 토큰을 지워야 백엔드가 더 보내지 않는다. */
  async function disable() {
    if (!capable()) return;
    const { fcm, messaging } = await load();
    await fcm.deleteToken(messaging);
    refresh();
  }

  onMounted(refresh);

  return { permission, busy, supported, enable, resync, disable, onForeground };
}
