/**
 * 주택임차차입금 원리금상환액 소득공제.
 *
 * 매년 1월. 만기일시상환이라 원금 상환이 없으면 **이자만** 공제 대상이다.
 *
 * 처음 전세를 하는 사람이 제도를 몰라 놓치는 일이 많은데, 경정청구로 최대
 * 5년까지 소급된다.
 */
export const DEDUCTION_LIMIT = 4_000_000;
export const DEDUCTION_RATE = 0.4;
/** 과세표준 구간에 따라 다르지만, 사회초년생 구간의 지방소득세 포함 세율. */
export const ASSUMED_TAX_RATE = 0.165;

export const TAX_CONDITIONS = [
  { label: '공제한도', value: '연 400만원' },
  { label: '공제율', value: '40%' },
  { label: '대상', value: '만기일시상환이면 이자만 (원금 없음)' },
];

export const TAX_DOCUMENTS = [
  '• 대출 원리금 상환 증명서 (은행 발급, 연말정산 간소화에서도 조회)',
  '• 주민등록등본',
  '• 임대차계약서 사본',
];

export const HOMETAX_URL = 'https://www.hometax.go.kr';

/** 연 이자에서 예상 환급액까지. 값이 없으면 세지 않는다. */
export function estimateRefund(yearlyInterest: number | null) {
  if (!yearlyInterest) return null;
  const deductible = Math.min(yearlyInterest * DEDUCTION_RATE, DEDUCTION_LIMIT);
  return { deductible: Math.round(deductible), refund: Math.round(deductible * ASSUMED_TAX_RATE) };
}
