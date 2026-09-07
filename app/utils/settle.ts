/**
 * 4루(홈)에서 챙기는 것들.
 *
 * 열한 가지가 있고 화면이 하나씩 붙어 있다. 대시보드와 각 화면이 같은 표를
 * 봐야 이름이 갈리지 않는다.
 *
 * `ready` 는 화면을 아직 안 만들었다는 표시다. 갈 곳 없는 줄을 눌리게 두면
 * 눌러 놓고 아무 일도 안 일어난다.
 */
export interface SettleTopic {
  code: string;
  title: string;
  ready: boolean;
}

export const SETTLE_TOPICS: SettleTopic[] = [
  { code: 'return-guarantee', title: '반환보증 가입', ready: true },
  { code: 'fee-support', title: '보증료 지원 신청', ready: true },
  { code: 'asset-review', title: '사후자산심사', ready: true },
  { code: 'moving-support', title: '중개보수·이사비 지원', ready: true },
  { code: 'checkin', title: '월간 정착 체크인', ready: true },
  { code: 'rate-cut', title: '금리인하요구권', ready: false },
  { code: 'education', title: '교육과 예방', ready: false },
  { code: 'tax-deduction', title: '연말정산 소득공제', ready: false },
  { code: 'renewal', title: '갱신 판정', ready: false },
  { code: 'move-out', title: '퇴거 준비', ready: false },
  { code: 'deposit-unreturned', title: '보증금 미반환 대응', ready: false },
];

export function settlePath(code: string, planId: number) {
  const topic = SETTLE_TOPICS.find((item) => item.code === code);
  return topic?.ready ? `/settle/${planId}/${code}` : null;
}

/**
 * 백엔드 할 일 코드 → 화면.
 *
 * 홈 관문의 할 일은 셋뿐이다(`GUARANTEE_CHECK` · `REGISTER_FIXED_EXPENSE` ·
 * `FIRST_MONTH_CHECKIN`). 시안의 "중개보수 지원 확인" 이나 "연말정산 준비" 는
 * 할 일로 등록되지 않아 대시보드에 뜨지 않는다.
 */
export const TASK_TOPIC: Record<string, string> = {
  GUARANTEE_CHECK: 'fee-support',
  REGISTER_FIXED_EXPENSE: 'checkin',
  FIRST_MONTH_CHECKIN: 'checkin',
};

/** 남은 날을 D-표기로. 백엔드가 세어 준 값을 그대로 옮긴다. */
export function ddayLabel(days: number | null) {
  if (days === null) return null;
  if (days === 0) return 'D-day';
  return days > 0 ? `D-${days}` : `D+${-days}`;
}

export type Urgency = 'danger' | 'caution' | 'info';

/** 지났거나 오늘이면 빨강, 이번 주면 주황, 나머지는 파랑. */
export function urgencyOf(days: number | null): Urgency {
  if (days === null) return 'info';
  if (days <= 0) return 'danger';
  return days <= 7 ? 'caution' : 'info';
}
