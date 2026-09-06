/**
 * 도메인 값의 한글 이름.
 *
 * 2루와 3루가 같은 값을 다른 이름으로 부르던 것을 여기로 모았다 — 담보를
 * 2루에선 "안심전세", 3루에선 "안심전세 (HUG)" 로 쓰고 있었다. 사용자에게는
 * 같은 담보인데 화면마다 이름이 달라 보인다.
 *
 * 창구에서 부르는 말을 앞에 두고 기관 약칭을 괄호에 넣는다. HUG·HF·SGI 는
 * 안내문에나 나오지 상담에서는 "안심전세 · 주신보 · 서신보" 로 말한다.
 */
export const COLLATERAL_LABEL: Record<string, string> = {
  HUG_SAFE_JEONSE: '안심전세 (HUG)',
  HF: '주신보 (HF)',
  SGI: '서신보 (SGI)',
  CLAIM_TRANSFER: '채권양도',
  OTHER: '기타',
  UNKNOWN: '보증서 미확인',
  NONE: '없음',
};

export const HOUSE_TYPE_LABEL: Record<string, string> = {
  APARTMENT: '아파트',
  OFFICETEL: '오피스텔',
  VILLA: '연립·다세대',
  MULTI_FAMILY: '다가구',
  DETACHED: '단독',
  OTHER: '기타',
};

export const collateralLabel = (value: string | null) =>
  value ? (COLLATERAL_LABEL[value] ?? value) : '—';

export const houseTypeLabel = (value: string | null) =>
  value ? (HOUSE_TYPE_LABEL[value] ?? value) : '—';
