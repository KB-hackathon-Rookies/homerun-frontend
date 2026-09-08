/**
 * 지금 보고 있는 계획 번호.
 *
 * 대시보드도 마이도 `planId` 를 받아야 하는데, 매번 서버에 물으면 화면이 느리다.
 * 그래서 계획을 만들 때 브라우저에 적어 두고 홈이 그걸 먼저 읽는다 — 어디까지나
 * 캐시다.
 *
 * 재로그인·기기 변경으로 이 값이 없거나(다른 브라우저) 남의 것이라 막히면,
 * 홈이 `GET /plans/active` 로 서버에서 계획을 되살린다. 그러니 이 값을 잃어도
 * 계획을 잃지는 않는다.
 */
const KEY = 'currentPlanId';

export const currentPlan = {
  get(): number | null {
    if (!import.meta.client) return null;
    const raw = window.localStorage.getItem(KEY);
    const id = Number(raw);
    return raw && Number.isInteger(id) && id > 0 ? id : null;
  },
  set(planId: number) {
    if (!import.meta.client) return;
    window.localStorage.setItem(KEY, String(planId));
  },
  clear() {
    if (!import.meta.client) return;
    window.localStorage.removeItem(KEY);
  },
};
