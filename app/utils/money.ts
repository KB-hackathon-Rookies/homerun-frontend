/**
 * 금액을 사람이 읽는 말로 바꾼다.
 *
 * 원 단위 그대로 보여주면 자릿수를 세게 된다. 억과 만으로 끊어 읽는다 —
 * `180000000` 은 "1억 8,000만원" 이다.
 *
 * 만 원 미만은 버린다. 보증금·대출 한도·자산은 만 원 단위로 이야기하는
 * 값이라 뒤 네 자리는 읽는 데 방해만 된다. 대신 근사치가 되므로 화면에서
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
