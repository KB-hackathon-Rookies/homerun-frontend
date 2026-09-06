/**
 * 금액을 사람이 읽는 말로 바꾼다.
 *
 * 원 단위 그대로 보여주면 자릿수를 세게 된다. 화면은 전부 "만 원" 으로 말한다.
 * 만 원 미만은 버린다 — 보증금·자산 규모에서 천 원 단위는 읽는 데 방해만 된다.
 */
export function formatManwon(won: number | null | undefined) {
  if (won === null || won === undefined) return '—';
  const manwon = Math.floor(won / 10_000);
  return `${manwon.toLocaleString('ko-KR')}만 원`;
}
