import type {
  CollateralMethod,
  Consultation,
  ConsultedProduct,
  ConsultationResult,
} from '~/api/consultation';

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

/**
 * 은행 상품은 `일반 전세대출` 이라 부른다.
 *
 * 시안(2루 11 · 상담 결과 입력)도, 매물 상세·상품 상세도 이 이름으로 적는다.
 * 여기만 "은행 상품" 이면 상담에서 고른 것과 확정 화면에 적히는 이름이 달라
 * 다른 상품을 고른 것처럼 읽힌다.
 */
export const PRODUCT_OPTIONS: { value: ConsultedProduct; label: string }[] = [
  { value: 'YOUTH_BEOTIMMOK', label: '청년 버팀목' },
  { value: 'GENERAL_BEOTIMMOK', label: '일반 버팀목' },
  { value: 'BANK_LOAN', label: '일반 전세대출' },
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
 *
 * 맨 뒤의 `기타` 가 목록의 몫을 다한다. 목록에 없는 은행을 다녀온 사람은 고를
 * 칸이 없어 상담 결과를 아예 못 남긴다 — 은행을 세 곳 돌고 온 사람에게 그건
 * 다시 다녀오라는 말이 된다.
 */
export const BANKS = [
  '우리은행',
  'KB국민은행',
  '하나은행',
  '농협은행',
  '신한은행',
  'IM뱅크',
  'BNK부산은행',
  '기타',
];

/**
 * 2루를 닫을 수 있는 상담인가.
 *
 * "가능" 만 보고 고르면 확정(`decision`)은 지나가고 완료에서 409 로 막혀,
 * 확정은 이미 기록됐는데 계획은 2루에 갇힌다. 그래서 고르는 쪽이 상품·담보·
 * 승인한도를 다 채운 상담만 최종 조건으로 본다.
 *
 * 금리는 화면에서 안 받는다(상담 결과 입력에 금리 문항이 없다) — 그래서 여기
 * 조건에도 넣지 않는다. 상담을 저장할 때는 "못 들었어요" 를 그대로 받는 게
 * 맞고(안 들은 걸 지어내면 안 된다), 그중 무엇으로 2루를 닫을지는 여기서
 * 가른다 — 저장 규칙과 확정 규칙은 다른 문제다.
 */
export const isFinalTerms = (item: Consultation) =>
  item.resultStatus === 'POSSIBLE' &&
  item.loanProduct !== 'UNKNOWN' &&
  item.collateralMethod !== 'UNKNOWN' &&
  item.approvedLimit !== null;

/**
 * 이 상담이 2루를 닫기에 무엇이 모자란가. 화면에 그대로 나열한다.
 *
 * "조건이 부족해요" 만 띄우면 은행을 다시 가야 하는지 입력만 고치면 되는지
 * 모른다. 빠진 항목 이름을 그대로 보여줘야 무엇을 물어보고 와야 하는지 안다.
 */
export function missingFinalTerms(item: Consultation): string[] {
  const missing: string[] = [];
  if (item.loanProduct === 'UNKNOWN') missing.push('상품');
  if (item.collateralMethod === 'UNKNOWN') missing.push('담보');
  if (item.approvedLimit === null) missing.push('승인한도');
  return missing;
}

export { collateralLabel } from '~/utils/labels';

const RESULT_LABEL = Object.fromEntries(RESULT_OPTIONS.map((o) => [o.value, o.label]));
const PRODUCT_LABEL = Object.fromEntries(PRODUCT_OPTIONS.map((o) => [o.value, o.label]));
export const resultLabel = (value: ConsultationResult) => RESULT_LABEL[value] ?? value;
export const productLabel = (value: ConsultedProduct) => PRODUCT_LABEL[value] ?? value;

export { HOUSE_TYPE_LABEL } from '~/utils/labels';
