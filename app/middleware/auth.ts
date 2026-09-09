import { useAuthStore } from '~/stores/auth';

/**
 * 로그인이 필요한 화면에 붙인다.
 *
 * ```ts
 * definePageMeta({ middleware: 'auth' });
 * ```
 *
 * 토큰이 `localStorage` 에 있어 서버에서는 로그인 여부를 알 수 없다. 서버에서
 * 막아 버리면 로그인한 사용자도 새로고침할 때마다 로그인 화면을 본다. 판단은
 * 브라우저에서만 한다.
 */
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return;

  const auth = useAuthStore();
  if (!auth.isAuthenticated) auth.restore();
  if (auth.isAuthenticated) return;

  // 로그인 뒤 원래 가려던 곳으로 돌려보내기 위해 남긴다.
  return navigateTo({ path: '/login', query: { redirect: to.fullPath } });
});
