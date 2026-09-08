import type { PlanInput } from '~/api/plan';

/**
 * 1루 판정을 시작하려면 있어야 하는 값.
 *
 * "모름" 으로 넘어갈 수 있는 항목과 다르다 — 이 일곱은 계산식에 직접
 * 들어가서, 비어 있으면 판정 자체가 나오지 않는다.
 *
 * 급여근로자는 우대금리 판정에 기업규모와 재직개월이 더 필요하다.
 * (`PUT /plans/{planId}/input` 설명의 필수 조건을 그대로 옮겼다.)
 */
export interface RequiredField {
  key: string;
  label: string;
  /** 이 값을 채우러 가는 진단 STEP. */
  step: string;
}

const BASE_FIELDS: RequiredField[] = [
  { key: 'hopeDeposit', label: '희망 보증금', step: 'HOPE_DEPOSIT' },
  { key: 'regionId', label: '희망 지역', step: 'REGION' },
  { key: 'isHomeless', label: '본인 무주택 여부', step: 'HOMELESS' },
  { key: 'householderStatus', label: '세대주 여부', step: 'HOUSEHOLDER' },
  { key: 'employmentType', label: '고용 형태', step: 'EMPLOYMENT_TYPE' },
  { key: 'monthlyIncome', label: '월 소득', step: 'FINANCIAL' },
  { key: 'netAssets', label: '순자산', step: 'FINANCIAL' },
  { key: 'availableCash', label: '자기자금', step: 'FINANCIAL' },
];

const SALARIED_FIELDS: RequiredField[] = [
  { key: 'companySize', label: '기업 규모', step: 'COMPANY_SIZE' },
  { key: 'employmentMonths', label: '재직 개월', step: 'EMPLOYMENT_PERIOD' },
];

/**
 * 급여근로자만 우대금리 조건을 더 본다.
 *
 * 서버 `PlanInputCompletionValidator` 의 급여근로자 분기와 같은 목록이어야 한다.
 * 여기서 빠진 고용형태는 "빠진 항목" 이 비어 보이는데 서버는 PLAN_013 을 낸다.
 */
const SALARIED = ['FULL_TIME', 'CONTRACT', 'DAILY_WORKER', 'INTERN'];

export function missingRequired(input: PlanInput | null): RequiredField[] {
  if (!input) return [];

  const fields = SALARIED.includes(input.employmentType ?? '')
    ? [...BASE_FIELDS, ...SALARIED_FIELDS]
    : BASE_FIELDS;

  return fields.filter((field) => {
    const value = (input as unknown as Record<string, unknown>)[field.key];
    return value === null || value === undefined || value === '';
  });
}
