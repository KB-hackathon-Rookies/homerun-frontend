import tailwindcss from '@tailwindcss/vite';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  /*
   * 서버에서 그리지 않는다.
   *
   * 토큰이 `localStorage` 에 있어 서버는 로그인 여부를 모른다(`middleware/auth.ts`
   * 가 서버에서 바로 손을 뗀다). 화면도 전부 `onMounted` 에서 데이터를 받는다.
   * 그래서 SSR 이 그려 보내던 건 "불러오는 중이에요…" 뿐이었다.
   *
   * 대신 얻는 게 있다. 모든 경로가 `index.html` 하나에서 시작하므로 그 파일
   * 하나를 서비스워커에 구워 두면 오프라인에서도 앱이 뜬다 — 경로마다 HTML 이
   * 달라지는 SSR 로는 구워 둘 파일이 없다.
   *
   * 잃는 건 검색 노출인데, 로그인해야 쓰는 앱이라 색인될 페이지가 웰컴·로그인
   * 정도다.
   */
  ssr: false,

  modules: ['@nuxt/eslint', '@pinia/nuxt', '@vite-pwa/nuxt'],

  // 폴더로 묶되 이름에는 접두사를 붙이지 않는다. common/AppButton.vue 가
  // <CommonAppButton /> 이 아니라 <AppButton /> 으로 쓰인다.
  components: [{ path: '~/components', pathPrefix: false }],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      /*
       * `viewport-fit=cover` 가 있어야 `env(safe-area-inset-*)` 이 0 이 아닌 값을
       * 준다. 설치해서 전체 화면으로 뜰 때 상태바·홈 인디케이터가 화면을 덮는데,
       * 그 두께를 이 값으로 받는다.
       */
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',

      link: [
        /*
         * 매니페스트 링크를 직접 건다. SPA 로 뽑을 때는 모듈이 이 링크를 넣어
         * 주지 않아서, 없으면 브라우저가 설치 가능한 앱으로 보지 않는다.
         */
        { rel: 'manifest', href: '/manifest.webmanifest' },
        // iOS 는 매니페스트의 아이콘을 보지 않는다. 이 링크로만 홈 화면 아이콘을 정한다.
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180' },
      ],

      meta: [
        { name: 'theme-color', content: '#3366ff' },
        /*
         * iOS 에서 주소창 없이 뜨게 한다. `black-translucent` 는 상태바를 화면
         * 위에 겹치는데, 그 두께는 `env(safe-area-inset-top)` 이 받는다.
         */
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: '홈런' },
      ],
    },
  },

  /*
   * 설치되는 앱으로서의 자기 소개.
   *
   * 서비스워커는 아직 등록하지 않는다. 기본값으로 나온 `sw.js` 가 앱 셸을 굽지
   * 않은 채 모든 이동을 `/` 로 넘기게 되어 있어, 그대로 켜면 오프라인은커녕
   * 평소 이동까지 깨진다. 굽는 목록과 폴백은 서비스워커 작업에서 정한다.
   */
  pwa: {
    // 매니페스트만 먼저 세운다. 등록은 서비스워커 작업에서 켠다.
    injectRegister: false,
    client: { registerPlugin: false },

    manifest: {
      name: '홈런 — 청년 첫 독립 코치',
      short_name: '홈런',
      description: '전세 계약을 1루부터 홈까지, 놓치는 것 없이 함께 도는 코치',
      lang: 'ko',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      // 세로 고정 디자인이다. 가로로 돌리면 390 폭 기준이 다 어긋난다.
      orientation: 'portrait',
      background_color: '#ffffff',
      theme_color: '#3366ff',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        // 안드로이드는 이걸 원·스퀴클 등으로 잘라 쓴다. 가장자리가 잘려도 캐릭터가 남는다.
        { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
  },

  // Tailwind v4 는 PostCSS 설정도 tailwind.config.js 도 쓰지 않는다.
  // Vite 플러그인 하나와 CSS 의 @import "tailwindcss" 가 전부다.
  vite: {
    plugins: [tailwindcss()],
  },

  typescript: {
    // 빌드마다 타입체크를 돌리면 느려진다. CI 와 pre-push 에서 pnpm typecheck 로 따로 돈다.
    typeCheck: false,
    strict: true,
  },

  runtimeConfig: {
    public: {
      // 백엔드 주소. .env 의 NUXT_PUBLIC_API_BASE 로 덮어쓴다.
      apiBase: 'http://localhost:8080',
    },
  },
});
