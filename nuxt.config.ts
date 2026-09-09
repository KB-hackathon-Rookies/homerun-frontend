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
  // extensions 를 vue 로 좁힌다. components 아래 데이터용 .ts(coachSheets·steps 등)까지
  // 컴포넌트로 스캔하면 파일명이 겹쳐(CoachSheets·Steps) 이름 충돌 경고가 난다. 이 .ts 들은
  // 컴포넌트가 아니라 명시적으로 import 하는 모듈이라 컴포넌트 자동등록 대상에서 뺀다.
  components: [{ path: '~/components', pathPrefix: false, extensions: ['vue'] }],

  css: ['~/assets/css/main.css'],

  /*
   * 정적 파일을 빌드할 때 미리 압축해 둔다(.gz/.br).
   *
   * 서버가 압축해 주지 않고 있었다. `pretendard.css` 를 로컬로 가져오면서 이게 드러났는데,
   * jsdelivr 는 그 CSS 를 gzip 으로 13KB 에 주던 것을 우리 서버는 무압축 55KB 로 줬다.
   * 로컬로 옮긴 것 자체는 왕복을 줄여 이득인데 압축이 빠져 되레 손해가 났다.
   */
  nitro: { compressPublicAssets: true },

  app: {
    head: {
      // 탭 제목 틀(titleTemplate)은 함수 형식이라 런타임 useHead 에서만 써서
      // app.vue 에 뒀다. 여기엔 정적인 값만 둔다.
      // 한국어 화면이므로 문서 언어를 명시한다 — 스크린 리더·번역이 이 값을 본다.
      htmlAttrs: { lang: 'ko' },
      /*
       * `viewport-fit=cover` 가 있어야 `env(safe-area-inset-*)` 이 0 이 아닌 값을
       * 준다. 설치해서 전체 화면으로 뜰 때 상태바·홈 인디케이터가 화면을 덮는데,
       * 그 두께를 이 값으로 받는다.
       */
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',

      link: [
        /*
         * Pretendard woff2 를 jsdelivr 에서 받는다. 자간 정의는 `fonts.css` 로 가져왔지만
         * 폰트 파일은 CDN 에 두므로, 미리 연결해 두면 TLS 왕복을 아낀다.
         *
         * Google Fonts 연결은 뺐다. Work Sans 를 걷어내면서 쓰는 곳이 없어졌는데,
         * 남겨 두면 아무도 안 쓰는 곳에 연결부터 맺는다.
         */
        { rel: 'preconnect', href: 'https://cdn.jsdelivr.net', crossorigin: '' },
        /*
         * 자간 정의를 첫 페인트 밖으로 뺀다.
         *
         * `media="print"` 로 걸면 브라우저가 받되 화면용으로 치지 않아 렌더를 막지 않고,
         * 다 받으면 `onload` 가 화면용으로 되돌린다. 폰트는 `font-display: swap` 이라
         * 그 전까지 시스템 폰트로 먼저 그려지고 나중에 바뀐다.
         */
        {
          rel: 'stylesheet',
          href: '/pretendard.css',
          media: 'print',
          onload: "this.onload=null;this.media='all'",
        },
        /*
         * 매니페스트 링크를 직접 건다. SPA 로 뽑을 때는 모듈이 이 링크를 넣어
         * 주지 않아서, 없으면 브라우저가 설치 가능한 앱으로 보지 않는다.
         */
        { rel: 'manifest', href: '/manifest.webmanifest' },
        // iOS 는 매니페스트의 아이콘을 보지 않는다. 이 링크로만 홈 화면 아이콘을 정한다.
        { rel: 'apple-touch-icon', href: '/pwa/apple-touch-icon.png', sizes: '180x180' },
      ],

      // JS 가 꺼져 있으면 onload 가 돌지 않는다. 그때는 그냥 차단으로 싣는다.
      noscript: [{ innerHTML: '<link rel="stylesheet" href="/pretendard.css">' }],

      meta: [
        { name: 'theme-color', content: '#3366ff' },
        // 검색결과·공유 미리보기에 쓰는 한 줄 소개. 없으면 SEO 감사에서 빠진다.
        {
          name: 'description',
          content:
            '전세·월세 계약을 1루부터 홈까지, 단계별 체크와 AI 코치로 함께 챙기는 주거 준비 도우미 홈런.',
        },
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
   * 서비스워커는 **앱 셸과 빌드 산출물만** 굽는다. 판정·상담·등기부는 개인
   * 금융 정보고, 오프라인에서 낡은 판정을 보여주면 지난 판정을 지금 사실인
   * 것처럼 내미는 셈이다. 그래서 런타임 캐시를 두지 않는다 — 연결이 없으면
   * 화면은 뜨되 값 자리에 "지금 못 가져왔다" 고 적는다.
   */
  pwa: {
    // 새 버전이 나와도 말없이 바꾸지 않는다. 쓰던 화면이 갑자기 갈아엎히면 곤란하다.
    registerType: 'prompt',

    /*
     * 워커를 직접 쓴다.
     *
     * 브라우저는 범위마다 워커를 **하나만** 등록한다. 푸시용 워커를 따로 두면
     * 둘 중 하나가 밀려나 캐싱이나 알림 중 하나가 죽는다. 그래서 굽는 일과
     * 알림 받는 일을 한 파일에서 한다(`app/sw.ts`).
     */
    strategies: 'injectManifest',
    // 이 경로는 Nuxt 소스 폴더(`app/`) 기준이다. 그래서 `app/sw.ts` 를 가리킨다.
    srcDir: '.',
    filename: 'sw.ts',

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
        { src: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/pwa/icon-512.png', sizes: '512x512', type: 'image/png' },
        // 안드로이드는 이걸 원·스퀴클 등으로 잘라 쓴다. 가장자리가 잘려도 캐릭터가 남는다.
        {
          src: '/pwa/icon-maskable-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },

    injectManifest: {
      /*
       * 구울 목록. 앱 셸(`index.html`)이 여기 들어와야 폴백이 성립한다.
       *
       * 폴백과 캐시 정리는 워커 안에서 직접 부른다 — `injectManifest` 는 굽는
       * 목록만 끼워 넣고 나머지는 우리가 쓴 코드를 그대로 쓴다.
       */
      globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest,woff2}'],
      // Firebase 를 품은 워커라 기본 한도(2MB)를 넘는다.
      maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
    },

    client: {
      // 설치 안내는 따로 만든다. 모듈이 대신 띄우지 않게 둔다.
      installPrompt: false,
    },

    devOptions: {
      // 로컬에서도 FCM 권한·토큰 등록을 검증할 수 있도록 서비스워커를 등록한다.
      enabled: true,
    },
  },

  // Tailwind v4 는 PostCSS 설정도 tailwind.config.js 도 쓰지 않는다.
  // Vite 플러그인 하나와 CSS 의 @import "tailwindcss" 가 전부다.
  vite: {
    plugins: [tailwindcss()],

    /*
     * 서비스워커에도 Firebase 설정을 넣어야 한다.
     *
     * 워커는 `useRuntimeConfig()` 를 못 쓴다 — Nuxt 앱 바깥에서 도는 별개
     * 스크립트다. 그런데 백그라운드 알림은 앱이 떠 있지 않을 때 오므로,
     * 워커가 자기 힘으로 Firebase 를 붙일 수 있어야 한다. 그래서 빌드할 때
     * 값을 박아 넣는다.
     */
    define: {
      __FIREBASE_CONFIG__: JSON.stringify({
        apiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY ?? '',
        authDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
        projectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
        storageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
        messagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
        appId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID ?? '',
      }),
    },
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

      /*
       * Firebase 웹 앱 설정. 전부 `.env` 의 NUXT_PUBLIC_FIREBASE_* 로 덮어쓴다.
       *
       * 비밀이 아니다 — 이 값들은 원래 브라우저에 실려야 동작한다. 푸시를
       * **보내는** 권한은 서비스 계정에 있고 그건 백엔드에만 있다.
       */
      firebase: {
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
        vapidKey: '',
      },
    },
  },
});
