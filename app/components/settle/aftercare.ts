/**
 * 사후자산심사와 중개보수·이사비 지원의 고정 사실.
 *
 * 둘 다 붙일 API 가 없다. 제도 설명이라 사람마다 달라지지 않아 화면이 들고
 * 있어도 되지만, 값이 바뀌면 여기 한 곳만 고치면 되게 모아 둔다.
 */

/** 신청서에 안 적기 쉬운 자산들. 여기서 빠지면 사후심사에서 부적격이 난다. */
export const MISSED_ASSETS = [
  '청약통장 잔액',
  '자동차 (시가 기준)',
  '기존 거주지 전세보증금',
  '부모님과 공동명의 자산',
];

export const ASSET_REVIEW_FLOW =
  '사전심사 적격 → 대출 실행 → 사후심사에서 부적격이 나올 수 있음 → 가산금리 부과';

/** 지자체가 각자 운영해서 금액도 조건도 지역마다 다르다. 서울 기준을 예로 든다. */
export const MOVING_SUPPORT_CONDITIONS = [
  { label: '대상', value: '만 19~39세 청년 (지자체별 상이)' },
  { label: '거주요건', value: '해당 지자체 관내 이사' },
  { label: '보증금 상한', value: '2~3억원 이하 (지자체별)' },
  { label: '신청기한', value: '이사·계약일 기준 30~90일 이내' },
];

export const MOVING_SUPPORT_ROUTES = [
  '• 서울주거포털 (housing.seoul.go.kr)',
  '• 거주지 관할 구청·군청 청년정책과',
];

export const MOVING_SUPPORT_CHECKS = [
  '• 거주지 지자체 사업 시행 여부',
  '• 청년 연령 기준 (지자체별 상이)',
  '• 소득·세대 조건',
  '• 예산 소진 시 조기 마감 가능',
];

/** 지자체 사업 안내는 정부24가 모아 준다. 지역별 깊은 주소는 해마다 바뀐다. */
export const GOV24_URL = 'https://www.gov.kr';
