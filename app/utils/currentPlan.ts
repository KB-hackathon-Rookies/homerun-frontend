/**
 * 지금 보고 있는 계획 번호.
 *
 * 대시보드도 마이도 `planId` 를 받아야 하는데, 로그인 직후에는 그 값을 알 방법이
 * 없다. 백엔드에 "내 계획 목록" 이 없어서 `GET /plans/{id}` 하나로만 조회된다.
 *
 * 그래서 계획을 만들 때 브라우저에 적어 두고 홈이 그걸 읽는다. 목록 API 가 생기면
 * 이 파일은 지운다 — 기기를 바꾸면 계획을 잃어버리는 임시방편이다.
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
