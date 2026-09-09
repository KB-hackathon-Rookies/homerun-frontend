/**
 * 오픈뱅킹 약관에 동의했는가.
 *
 * 서버에 이 동의를 기록하는 곳이 없다. 그래서 화면을 나갔다 오면 이미 동의한 사람에게
 * 같은 약관을 다시 묻고, 연동을 마친 사람도 처음부터 다시 밟게 된다.
 *
 * **회원별로 적는다.** 동의는 사람이 한 것이라 브라우저 단위로 뭉뚱그리면 같은 기기를 쓰는
 * 다른 계정이 남의 동의를 물려받는다 — 동의한 적 없는 사람의 화면을 건너뛰는 셈이다.
 *
 * 어디까지나 **화면을 건너뛰기 위한 캐시**다. 동의 이력 자체는 서버가 남겨야 하고(`COM`),
 * 그 API 가 생기면 이 파일은 지운다. 그 전까지는 기기를 바꾸면 한 번 더 묻는다 — 다시
 * 묻는 쪽이 안 물어보는 쪽보다 안전하다.
 */
const KEY = 'openBankingTermsAgreedMemberIds';

function ids(): number[] {
  if (!import.meta.client) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is number => typeof v === 'number') : [];
  } catch {
    // 값이 깨졌으면 동의한 적 없는 것으로 본다. 건너뛰는 쪽으로 기울면 안 된다.
    return [];
  }
}

export const openBankingTerms = {
  /** 이 회원이 동의했는가. 회원을 모르면(비로그인·조회 실패) 동의하지 않은 것으로 본다. */
  agreedBy(memberId: number | null | undefined): boolean {
    return typeof memberId === 'number' && ids().includes(memberId);
  },

  remember(memberId: number | null | undefined) {
    if (!import.meta.client || typeof memberId !== 'number') return;
    const next = ids();
    if (next.includes(memberId)) return;
    next.push(memberId);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // 저장에 실패해도 흐름은 막지 않는다. 다음에 한 번 더 물을 뿐이다.
    }
  },
};
