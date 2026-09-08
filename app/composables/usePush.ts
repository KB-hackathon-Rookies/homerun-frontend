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

/**
 * 다시 켜기 시도의 결과.
 *
 * - `unsupported` 이 브라우저는 웹 푸시를 못 받는다.
 * - `blocked` 권한이 거부돼 있다 — 우리가 다시 물을 수 없으니 브라우저 설정으로 안내해야 한다.
 * - `dismissed` 방금 물었는데 허락하지 않았다.
 * - `enabled` 토큰을 재발급·재등록했다.
 * - `error` 허락은 돼 있는데 토큰을 받지 못했다.
 */
export type ReactivateResult = 'unsupported' | 'blocked' | 'dismissed' | 'enabled' | 'error';

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
   * 토큰을 받아 백엔드에 등록한다. 권한이 이미 granted 라는 전제.
   *
   * 파이어베이스 12(모듈러 SDK)에는 onTokenRefresh 가 없다. 갱신은 getToken 이
   * 알아서 하고, 우리는 앱을 열 때마다 다시 받아 재등록한다.
   *
   * 다만 서버가 등록을 폐기했거나 토큰이 죽었을 때 getToken 은 손에 쥔 값을
   * 그대로 돌려줄 수 있다. 그때는 forceRefresh 로 먼저 지우고 새로 받는다.
   */
  async function register({ forceRefresh = false } = {}) {
    const registration = await worker();
    if (!registration) return false;

    const { fcm, messaging } = await load();
    if (forceRefresh) await fcm.deleteToken(messaging).catch(() => {});

    const token = await fcm.getToken(messaging, {
      vapidKey: config.vapidKey,
      serviceWorkerRegistration: registration,
    });
    if (!token) return false;

    await useNotificationApi().registerToken(token);
    return true;
  }

  /**
   * 권한을 묻고 토큰을 등록한다.
   *
   * 이미 거절했으면 다시 묻지 않는다 — 브라우저가 어차피 창을 띄우지 않고,
   * 물었다는 사실만 남는다. 거부 상태에서 다시 켜려면 reactivate() 를 쓴다.
   */
  async function enable() {
    if (busy.value || !(await supported())) return false;

    busy.value = true;
    try {
      const granted = await Notification.requestPermission();
      permission.value = granted;
      if (granted !== 'granted') return false;
      return await register();
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

  /**
   * 알림을 다시 켜는 경로.
   *
   * 한 번 거부했거나 토큰이 만료·폐기된 뒤 사용자가 다시 켜려 할 때 부른다.
   * 상태별로 갈린다 — 결과를 돌려주니 호출부가 그에 맞는 안내를 띄운다.
   *
   * - denied 는 우리가 되돌릴 수 없다. 다시 묻지 않고 `blocked` 로 알려
   *   브라우저 설정으로 안내하게 한다.
   * - default 면 처음처럼 물어 켠다.
   * - granted 인데 알림이 조용하면 죽은 토큰이 원인이다. 지우고 새로 받아
   *   재등록한다.
   */
  async function reactivate(): Promise<ReactivateResult> {
    if (!(await supported())) return 'unsupported';

    const current = Notification.permission;
    permission.value = current;
    if (current === 'denied') return 'blocked';
    if (current === 'default') return (await enable()) ? 'enabled' : 'dismissed';

    if (busy.value) return 'error';
    busy.value = true;
    try {
      return (await register({ forceRefresh: true })) ? 'enabled' : 'error';
    } catch {
      return 'error';
    } finally {
      busy.value = false;
    }
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
    // 등록된 토큰이 없으면 deleteToken 이 던진다. 이미 꺼진 셈이니 삼킨다.
    await fcm.deleteToken(messaging).catch(() => {});
    refresh();
  }

  onMounted(refresh);

  return { permission, busy, supported, enable, resync, reactivate, disable, onForeground };
}
