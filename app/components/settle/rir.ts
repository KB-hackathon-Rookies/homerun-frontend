/**
 * 주거비 비중(RIR).
 *
 * 월 주거비를 월 소득으로 나눈 값이다. 20% 까지는 안정, 30% 를 넘으면
 * 위험으로 본다 — 이 구간은 주거 통계에서 쓰는 관행적인 기준이다.
 *
 * 1루 진단은 RIR 을 쓰지 않는다("RIR 없이 자금과 월 현금흐름으로 판정"). 그래서
 * 백엔드에 계산해 주는 곳이 없고, 4루가 확정된 대출 조건과 저장된 입력으로
 * 직접 센다. 값이 하나라도 없으면 세지 않는다.
 */
export type RirGrade = 'safe' | 'caution' | 'danger';

export const RIR_BANDS: { grade: RirGrade; range: string; label: string }[] = [
  { grade: 'safe', range: '~20%', label: '안정' },
  { grade: 'caution', range: '20~30%', label: '주의' },
  { grade: 'danger', range: '30%~', label: '위험' },
];

export function rirGrade(percent: number): RirGrade {
  if (percent < 20) return 'safe';
  return percent < 30 ? 'caution' : 'danger';
}

export const RIR_GRADE_LABEL: Record<RirGrade, string> = {
  safe: '안정',
  caution: '주의',
  danger: '위험',
};

/** 월 이자 = 대출금 × 적용금리 ÷ 12. 만기일시상환이라 원금 상환이 없다. */
export function monthlyInterestOf(principal: number | null, ratePercent: number | null) {
  if (!principal || !ratePercent) return null;
  return Math.round((principal * ratePercent) / 100 / 12);
}

export const RIR_FORMULAS = [
  '월 이자 = 대출금 × 적용금리 / 12',
  '월 주거비 = 관리비 + 월 이자',
  '월 잔여금 = 월 소득 − 월 주거비 − 생활비',
];

/** 연체하면 대출금리에 이만큼이 붙는다. 원금 전체에 걸린다. */
export const OVERDUE_SURCHARGE = { withinThreeMonths: 4, overThreeMonths: 5 };

export const FIRST_MONTH_TASKS = [
  { title: '고정지출 등록', note: '월세·관리비·상환일 · 안 등록하면 연체 알림이 안 돌아가요' },
  { title: '자동이체 등록', note: null },
  { title: '첫 달 실제 지출 입력', note: null },
  { title: '계획 대비 실제 비교', note: null },
  { title: '월 잔여자금 재계산', note: null },
];
