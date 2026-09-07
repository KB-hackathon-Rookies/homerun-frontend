/**
 * 홈 화면에 추가.
 *
 * 브라우저마다 방식이 다르다.
 *
 * - 안드로이드·데스크톱 크롬 — `beforeinstallprompt` 를 잡아 뒀다가 우리가 원할 때 띄운다
 * - iOS 사파리 — 그런 이벤트가 없다. 공유 버튼을 눌러 직접 추가하라고 알려주는 수밖에 없다
 *
 * 이벤트는 앱이 뜨자마자 한 번 날아오고 다시 오지 않는다. 그래서 화면이
 * 아니라 플러그인에서 먼저 받아 두고(`plugins/install-prompt.client.ts`)
 * 화면은 여기 담긴 것을 꺼내 쓴다.
 */

/** 브라우저가 주는 설치 이벤트. 표준 타입이 아직 없어 쓰는 것만 적는다. */
export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** 플러그인이 잡아 둔 이벤트. 화면이 준비되기 전에 날아오므로 여기 담아 둔다. */
export const deferredPrompt = shallowRef<InstallPromptEvent | null>(null);

/** 이번에 설치를 마쳤는가. 설치 직후에는 안내를 지운다. */
export const justInstalled = ref(false);

const DISMISS_KEY = 'installPromptDismissed';

/** 이미 앱으로 열려 있는가. 설치한 사람에게 설치하라고 하면 안 된다. */
function standalone() {
  if (!import.meta.client) return false;
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
  return window.matchMedia('(display-mode: standalone)').matches || iosStandalone;
}

/** iOS 는 설치 이벤트가 없다. 아이패드는 맥으로 보고하므로 터치 지원까지 본다. */
function ios() {
  if (!import.meta.client) return false;
  const ua = navigator.userAgent;
  const iPadOnMac = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod/.test(ua) || iPadOnMac;
}

export function useInstallPrompt() {
  const dismissed = ref(true);
  const isStandalone = ref(true);
  const isIos = ref(false);

  onMounted(() => {
    dismissed.value = window.localStorage.getItem(DISMISS_KEY) === 'true';
    isStandalone.value = standalone();
    isIos.value = ios();
  });

  /** 안내를 띄울 자리인가. 이미 앱이거나 한 번 닫았으면 다시 묻지 않는다. */
  const shouldOffer = computed(() => {
    if (isStandalone.value || dismissed.value || justInstalled.value) return false;
    // 크롬은 이벤트를 받았을 때만, iOS 는 이벤트가 없으므로 항상 안내한다.
    return isIos.value || !!deferredPrompt.value;
  });

  async function install() {
    const event = deferredPrompt.value;
    if (!event) return;

    await event.prompt();
    const { outcome } = await event.userChoice;
    // 이벤트는 한 번만 쓸 수 있다. 거절했어도 다시 띄우지 못한다.
    deferredPrompt.value = null;
    if (outcome === 'dismissed') dismiss();
  }

  function dismiss() {
    dismissed.value = true;
    window.localStorage.setItem(DISMISS_KEY, 'true');
  }

  return { shouldOffer, isIos, install, dismiss };
}
