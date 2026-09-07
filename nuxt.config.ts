import tailwindcss from '@tailwindcss/vite';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/eslint', '@pinia/nuxt'],

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
