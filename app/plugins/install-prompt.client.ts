import {
  deferredPrompt,
  justInstalled,
  type InstallPromptEvent,
} from '~/composables/useInstallPrompt';

/**
 * 설치 이벤트를 먼저 받아 둔다.
 *
 * 브라우저는 앱이 뜨자마자 `beforeinstallprompt` 를 한 번 던지고 다시 던지지
 * 않는다. 화면이 그려진 뒤에 듣기 시작하면 이미 지나간 뒤다.
 *
 * `preventDefault()` 로 브라우저 기본 안내를 막는다. 우리가 때를 골라 띄운다 —
 * 첫 화면에서 바로 물으면 대부분 거절한다.
 */
export default defineNuxtPlugin(() => {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt.value = event as InstallPromptEvent;
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt.value = null;
    justInstalled.value = true;
  });
});
