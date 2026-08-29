import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/eslint'],

  css: ['~/assets/css/main.css'],

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
})
