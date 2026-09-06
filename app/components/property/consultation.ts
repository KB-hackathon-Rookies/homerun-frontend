import type { CollateralMethod, ConsultedProduct, ConsultationResult } from '~/api/consultation';

/**
 * 상담 결과 화면이 쓰는 말.
 *
 * 창구에서 들은 말을 그대로 고르게 한다. "대출 가능 여부" 대신 "가능하대요"
 * 인 이유가 있다 — 이건 은행의 확정 답이 아니라 **들은 말**이라, 화면 문구도
 * 전해 들은 투로 둔다.
 */
export const RESULT_OPTIONS: { value: ConsultationResult; label: string }[] = [
  { value: 'POSSIBLE', label: '가능하대요' },
  { value: 'DIFFICULT', label: '어렵대요' },
  { value: 'DOCUMENT_REVIEW_REQUIRED', label: '서류를 봐야 안다고 했어요' },
  { value: 'NOT_HEARD', label: '못 들었어요' },
];

export const PRODUCT_OPTIONS: { value: ConsultedProduct; label: string }[] = [
  { value: 'YOUTH_BEOTIMMOK', label: '청년 버팀목' },
  { value: 'GENERAL_BEOTIMMOK', label: '일반 버팀목' },
  { value: 'BANK_LOAN', label: '은행 상품' },
  { value: 'UNKNOWN', label: '모름' },
];

/**
 * 보증서 이름은 창구에서 부르는 말로 둔다. HUG·HF·SGI 는 안내문에나 나오지
 * 실제 상담에서는 "안심전세 · 주신보 · 서신보" 로 말한다.
 *
 * 채권양도·기타는 안 보여준다. 창구에서 그 이름으로 안내받는 일이 없어서
 * 고를 수 없는 답이 된다 — 그런 경우는 "못 들었어요" 로 남는다.
 */
export const COLLATERAL_OPTIONS: { value: CollateralMethod; label: string }[] = [
  { value: 'HUG_SAFE_JEONSE', label: '안심전세' },
  { value: 'HF', label: '주신보' },
  { value: 'SGI', label: '서신보' },
  { value: 'UNKNOWN', label: '못 들었어요' },
];

/**
 * 고를 수 있는 은행.
 *
 * 백엔드는 `bankName` 을 자유 문자열로 받는다. 공시 금리 API 에도 은행 이름이
 * 있지만 그건 "평균금리를 공시한 은행" 이라 전세대출 취급은행과 다르다.
 * 시안 목록을 그대로 쓰고, 취급은행 목록 API 가 생기면 여기를 갈아 끼운다.
 */
export const BANKS = [
  '우리은행',
  'KB국민은행',
  '하나은행',
  '농협은행',
  '신한은행',
  'IM뱅크',
  'BNK부산은행',
];

export { collateralLabel } from '~/utils/labels';

const RESULT_LABEL = Object.fromEntries(RESULT_OPTIONS.map((o) => [o.value, o.label]));
const PRODUCT_LABEL = Object.fromEntries(PRODUCT_OPTIONS.map((o) => [o.value, o.label]));
export const resultLabel = (value: ConsultationResult) => RESULT_LABEL[value] ?? value;
export const productLabel = (value: ConsultedProduct) => PRODUCT_LABEL[value] ?? value;

export { HOUSE_TYPE_LABEL } from '~/utils/labels';
