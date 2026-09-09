/**
 * 돌아갈 곳으로 받아도 되는 값인가.
 *
 * `redirect` 는 주소창에 실려 오니 남이 심을 수 있다. 이 앱 안의 경로만 받는다 —
 * `/` 하나로 시작하고 그다음이 `/` 나 `\` 가 아니어야 한다. `//evil.example` 과
 * `https://evil.example` 은 브라우저가 바깥 주소로 읽으므로 여기서 걸러 낸다.
 *
 * 로그인과 약관 동의가 같은 판단을 한다. 검사를 두 벌 두면 한쪽만 고쳐지는 날이 온다.
 */
export function safeRedirect(value: unknown): string | null {
  return typeof value === 'string' && /^\/(?![/\\])/.test(value) ? value : null;
}
