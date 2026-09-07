/**
 * 날짜 표기.
 *
 * 3루는 D-day 로 말한다. "11월 20일" 보다 "D-10" 이 지금 급한지를 바로
 * 알려준다 — 남은 날이 곧 할 일의 순서다.
 */
const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 백엔드가 날짜(`2026-11-20`)와 시각(`2026-11-20T09:00:00Z`)을 둘 다 준다.
 *
 * 날짜만 오면 그날 자정으로 읽고, 시각이 붙어 있으면 그대로 넘긴다 — 시각에
 * `T00:00:00` 을 덧붙이면 `Invalid Date` 가 되어 "NaN. NaN. NaN." 이 찍힌다.
 */
const asDate = (value: string) => new Date(value.includes('T') ? value : `${value}T00:00:00`);

/** "11.20 목" */
export function formatShortDate(value: string) {
  const date = asDate(value);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}.${day} ${WEEKDAY[date.getDay()]}`;
}

/** "2026년 11월 20일 (금)" */
export function formatLongDate(value: string) {
  const date = asDate(value);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAY[date.getDay()]})`;
}

/** "2026. 11. 20." */
export function formatDotDate(value: string) {
  const date = asDate(value);
  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
}

/**
 * 기준일까지 며칠 남았는가. 당일은 "D-day".
 *
 * 기준일이 지난 칸은 `D+N` 이 된다 — 늦었다는 걸 감추지 않는다.
 */
export function dday(due: string, base: string) {
  const days = Math.round((asDate(base).getTime() - asDate(due).getTime()) / 86_400_000);
  if (days === 0) return 'D-day';
  return days > 0 ? `D-${days}` : `D+${-days}`;
}
