import type { ApplicationMethod, ContractCollateral, LoanProductKind } from '~/api/contract';

/** 3루 화면이 쓰는 이름. 백엔드는 코드로 준다. */
export const PRODUCT_LABEL: Record<LoanProductKind, string> = {
  FUND_YOUTH: '청년 버팀목',
  FUND_GENERAL: '일반 버팀목',
  BANK: '은행 전세대출',
};

/** 창구에서 부르는 이름으로 둔다. HUG·HF·SGI 는 안내문에나 나온다. */
export const COLLATERAL_LABEL: Record<ContractCollateral, string> = {
  HUG_SAFE_JEONSE: '안심전세 (HUG)',
  HF: '주신보 (HF)',
  SGI: '서신보 (SGI)',
  CLAIM_TRANSFER: '채권양도',
  OTHER: '기타',
  NONE: '없음',
};

export const APPLICATION_LABEL: Record<ApplicationMethod, string> = {
  BANK_VISIT: '은행 창구 대면',
  ONLINE: '기금e든든 비대면',
};

export const HOUSE_LABEL: Record<string, string> = {
  APARTMENT: '아파트',
  OFFICETEL: '오피스텔',
  VILLA: '연립·다세대',
  MULTI_FAMILY: '다가구',
  DETACHED: '단독',
  OTHER: '기타',
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
