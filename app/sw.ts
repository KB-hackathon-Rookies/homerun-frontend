/// <reference lib="webworker" />
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

/**
 * 서비스워커.
 *
 * 두 가지 일을 한 파일에서 한다 — 앱을 굽는 일과 알림을 받는 일이다.
 * 브라우저가 범위마다 워커를 하나만 등록하기 때문에, 나누면 둘 중 하나가
 * 밀려나 캐싱이나 알림 중 하나가 죽는다.
 *
 * 굽는 것은 앱 셸과 빌드 산출물뿐이다. 판정·상담·등기부는 개인 금융 정보라
 * 캐시하지 않는다 — 오프라인에서 낡은 판정을 보여주면 지난 판정을 지금
 * 사실인 것처럼 내미는 셈이다.
 */
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

/** 빌드할 때 박히는 Firebase 웹 설정(`nuxt.config.ts` 의 `vite.define`). */
declare const __FIREBASE_CONFIG__: {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

// 새 버전으로 갈아탈 때 앱이 신호를 보낸다. 말없이 바꾸지 않는다.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

/*
 * 라우팅은 브라우저가 한다. 서버에 없는 주소는 전부 앱 셸이 받는다.
 * 백엔드로 가는 요청까지 앱 셸로 돌리면 안 된다.
 */
registerRoute(new NavigationRoute(createHandlerBoundToURL('/'), { denylist: [/^\/api\//] }));

/*
 * 앱이 떠 있지 않을 때 오는 알림.
 *
 * 설정이 비어 있으면 붙지 않는다 — 환경변수 없이 빌드한 경우다. 그때도
 * 캐싱은 그대로 돌아야 하므로 여기서 멈추지 않는다.
 */
if (__FIREBASE_CONFIG__.projectId) {
  const messaging = getMessaging(initializeApp(__FIREBASE_CONFIG__));

  onBackgroundMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? '홈런';
    const body = payload.notification?.body ?? '';
    // 눌렀을 때 어디로 갈지. 백엔드가 딥링크를 data 로 함께 보낸다.
    const link = payload.data?.link ?? '/';

    self.registration.showNotification(title, {
      body,
      icon: '/pwa/icon-192.png',
      badge: '/pwa/icon-192.png',
      // 같은 마감으로 두 번 오면 덮어쓴다. 알림창이 같은 말로 쌓이지 않게 한다.
      tag: payload.data?.dedupKey,
      data: { link },
    });
  });
}

/** 알림을 누르면 이미 열린 창을 찾아 그리로 보낸다. 창을 또 띄우지 않는다. */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = (event.notification.data?.link as string) ?? '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const opened = clients.find((client) => 'focus' in client);
      if (opened) {
        void opened.navigate(link);
        return opened.focus();
      }
      return self.clients.openWindow(link);
    }),
  );
});
