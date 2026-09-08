import type { ApplicationMethod, ContractCollateral, LoanProductKind } from '~/api/contract';

/** 담보·주택유형 이름은 2루와 함께 쓴다. 같은 값이 화면마다 다르게 보이면 안 된다. */
export { COLLATERAL_LABEL, HOUSE_TYPE_LABEL as HOUSE_LABEL } from '~/utils/labels';

/** 3루 화면이 쓰는 이름. 백엔드는 코드로 준다. */
export const PRODUCT_LABEL: Record<LoanProductKind, string> = {
  FUND_YOUTH: '청년 버팀목',
  FUND_GENERAL: '일반 버팀목',
  BANK: '은행 전세대출',
};

export const APPLICATION_LABEL: Record<ApplicationMethod, string> = {
  BANK_VISIT: '은행 창구 대면',
  ONLINE: '기금e든든 비대면',
};

/**
 * 반환보증이 담보에 이미 들어 있는가.
 *
 * 안심전세만 포함이고 나머지는 따로 가입해야 한다. 이 구분이 3루 마지막
 * 단계의 할 일을 가른다.
 */
export const includesReturnGuarantee = (collateral: ContractCollateral | null) =>
  collateral === 'HUG_SAFE_JEONSE';

/**
 * 전입세대확인서가 필요한가.
 *
 * 다가구·단독 + 안심전세일 때만이다. 다세대면 이 단계를 통째로 건너뛴다 —
 * 한 건물에 세대가 여럿인 집만 앞선 임차인을 확인해야 하기 때문이다.
 */
export const needsResidentCert = (
  houseType: string | null,
  collateral: ContractCollateral | null,
) => (houseType === 'MULTI_FAMILY' || houseType === 'DETACHED') && collateral === 'HUG_SAFE_JEONSE';

/**
 * 회사 서류를 떼야 하는가.
 *
 * 청년 버팀목 + 중소·중견기업 재직으로 우대금리 0.3%p 를 받을 사람만이다.
 * 아니면 이 단계가 통째로 없다.
 */
export const needsCompanyDocs = (product: LoanProductKind | null, companySize: string | null) =>
  product === 'FUND_YOUTH' && (companySize === 'SMALL' || companySize === 'MID_SIZE');

/**
 * 서류가 나에게 해당하는지를 가르는 값들.
 *
 * 계약(2루가 넘겨준 초안)과 진단 입력에서 온다. **못 불러왔으면 통째로 `null`**
 * 이고, 그때 화면은 거르지 않고 전부 보여준다 — 잘못 거른 목록보다 긴 목록이 낫다.
 */
export interface DocSituation {
  houseType: string | null;
  collateral: ContractCollateral | null;
  product: LoanProductKind | null;
  employmentType: string | null;
  companySize: string | null;
}

/**
 * 기준시가가 필요한가.
 *
 * 오피스텔만이다. 오피스텔은 부동산공시가격 알리미에 안 나와서 홈택스 기준시가를
 * 대신 쓴다. 반환보증 126% 룰 판정이 이 값을 읽는다.
 */
export const needsStandardPrice = (houseType: string | null) => houseType === 'OFFICETEL';

/**
 * 확정일자 부여현황이 필요한가.
 *
 * 다가구만이다. 다가구는 건물 전체가 하나의 등기라 다른 호실 보증금이 등기부에
 * 안 나온다. 선순위 보증금 총액을 알아야 내 순위를 계산할 수 있다.
 */
export const needsFixedDateStatus = (houseType: string | null) => houseType === 'MULTI_FAMILY';

/**
 * 급여근로자인가.
 *
 * 서버 `PlanInputCompletionValidator` 의 급여근로자 분기와 같은 목록이어야 한다.
 * (`~/components/my/required.ts` 의 `SALARIED` 와 같다. 한쪽만 고치면 어긋난다.)
 */
const SALARIED = ['FULL_TIME', 'CONTRACT', 'DAILY_WORKER', 'INTERN'];

/**
 * 근로소득 원천징수영수증이 필요한가.
 *
 * 이름 그대로 **근로소득**이 있어야 나온다. 프리랜서·사업소득자에게는 아예
 * 발급되지 않는 서류다.
 */
export const needsWithholdingReceipt = (employmentType: string | null) =>
  SALARIED.includes(employmentType ?? '');

/**
 * 소득금액증명원이 필요한가.
 *
 * 프리랜서·사업소득자 자리다. 다만 은행이 따로 요청하면 급여근로자도 낸다 —
 * 그래서 해당하지 않는 사람에게도 목록에서 지우지 않고 접어 둔다.
 */
export const needsIncomeCert = (employmentType: string | null) => employmentType === 'FREELANCER';
