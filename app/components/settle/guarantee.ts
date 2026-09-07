import { COLLATERAL_LABEL } from '~/utils/labels';

/**
 * 반환보증과 보증료 지원의 고정 사실.
 *
 * 사람마다 달라지는 값이 아니라 제도 그 자체다 — 담보 넷 중 안심전세만
 * 반환보증을 품고 있고, 나머지는 따로 든다. 판정 API 가 이 구분을 내려주지
 * 않아 화면이 들고 있는다.
 */
export const RETURN_GUARANTEE_COLLATERALS = [
  'HUG_SAFE_JEONSE',
  'HF',
  'SGI',
  'CLAIM_TRANSFER',
] as const;

export type GuaranteeCollateral = (typeof RETURN_GUARANTEE_COLLATERALS)[number];

export const collateralName = (code: GuaranteeCollateral) => COLLATERAL_LABEL[code] ?? code;

/** 안심전세만 반환보증이 들어 있다. */
export const includedInCollateral = (code: string) => code === 'HUG_SAFE_JEONSE';

/** 담보별로 4-1 화면에서 무엇이 갈리는지. */
export const COLLATERAL_EFFECT: Record<GuaranteeCollateral, string> = {
  HUG_SAFE_JEONSE: '이미 포함 → 보증료 지원 신청으로 바로',
  HF: '반환보증 따로 가입 필요',
  SGI: '반환보증 따로 가입 필요',
  CLAIM_TRANSFER: '반환보증 따로 가입 필요',
};

export const JOIN_ROUTES = [
  '• 모바일 · 안심전세App / 네이버부동산 금융상품 / 카카오페이 간편보험 / 토스 부동산',
  '• 방문 · HUG 지사, 위탁은행',
  '• 콜센터 · HUG 1566-9009',
];

export const JOIN_DOCUMENTS = [
  '• 임대차계약서 사본',
  '• 주민등록등본',
  '• 등기사항전부증명서',
  '• 전입세대확인서 (일부 경우)',
];

/** 보증료 지원 조건. 지자체 예산 사업이라 지역마다 세부가 다르다. */
export const FEE_SUPPORT_CONDITIONS = [
  { label: '대상', value: '청년 (연소득 5,000만원 이하) / 신혼부부 (합산 7,500)' },
  { label: '지원비율', value: '청년 100% · 청년 외 90%' },
  { label: '보증금', value: '3억원 이하' },
  { label: '조건', value: '무주택 · 유효한 반환보증 가입' },
];

/** 대상 구분별 지원 한도. 한도는 40만원으로 같고 소득 기준이 갈린다. */
export const FEE_SUPPORT_TIERS = [
  { tone: 'safe', badge: '청년', headline: '전액 · 한도 40만', note: '연 5,000만 이하' },
  { tone: 'meta', badge: '청년 외', headline: '90% · 한도 40만', note: '연 6,000만 이하' },
  { tone: 'safe', badge: '신혼부부', headline: '전액 · 한도 40만', note: '합산 7,500만 이하' },
] as const;

export const FEE_SUPPORT_APPLY_ROUTES = [
  '• 온라인 · 정부24 "국토교통부 전세보증금반환보증 보증료 지원"',
  '• 온라인 · HUG 안심전세포털 → 보증료 지원사업 배너',
  '• 방문 · 주소지 관할 구청·군청 (본인 신청 원칙)',
];

export const FEE_SUPPORT_DOCS_AGREED = ['• 지원 신청서', '• 서약서'];

export const FEE_SUPPORT_DOCS_REFUSED = [
  '• 신청서 · 서약서 (정부24)',
  '• 통장 사본 (은행 앱, 본인 명의)',
  '• 반환보증 보증서 (기관 날인 필수)',
  '• 보증료 납부 증빙',
  '• 임대차계약서 사본',
  '• 등기사항전부증명서 (3개월 이내)',
  '• 주민등록등본 (전체공개)',
  '• 혼인관계증명서 (대법원·정부24)',
  '• 소득금액증빙 (홈택스, 전년도)',
];

export const FEE_SUPPORT_EXCLUDED = [
  '• 등록임대사업자의 임대주택 거주자',
  '• 법인 임차인',
  '• 외국인·재외국민',
  '• 동일 보증서번호로 재신청',
  '• 서울시 신혼부부 이자지원 보증료 기수혜자',
];

/** 정부24. 사업 페이지 주소는 해마다 바뀌어 첫 화면으로 보낸다. */
export const GOV24_URL = 'https://www.gov.kr';
