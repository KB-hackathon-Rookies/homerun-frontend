/**
 * 금액 표기.
 *
 * 백엔드는 원 단위 정수를 준다. 화면은 억·만 원으로 끊어 읽는다 —
 * `180000000` 을 그대로 두면 사람이 자릿수를 센다.
 *
 * 만 원 미만은 버린다. 보증금·대출 한도는 만 원 단위로 이야기하는 값이라
 * 뒤 네 자리를 붙이면 오히려 읽기 어렵다. 대신 근사치가 되므로 화면에서
 * 필요하면 "약" 을 함께 쓴다.
 */
export function formatKoreanMoney(won: number | null | undefined) {
  if (won === null || won === undefined) return '—';

  const sign = won < 0 ? '-' : '';
  const abs = Math.abs(won);
  const eok = Math.floor(abs / 100_000_000);
  const man = Math.floor((abs % 100_000_000) / 10_000);

  const parts: string[] = [];
  if (eok) parts.push(`${eok.toLocaleString('ko-KR')}억`);
  if (man) parts.push(`${man.toLocaleString('ko-KR')}만`);

  return `${sign}${parts.join(' ') || '0'}원`;
}

/** 연 이율. 백엔드가 소수로 준다 — `2.20` 은 연 2.2% 다. */
export function formatRate(rate: number | null | undefined) {
  if (rate === null || rate === undefined) return '—';
  return `연 ${Number(rate)}%`;
}
