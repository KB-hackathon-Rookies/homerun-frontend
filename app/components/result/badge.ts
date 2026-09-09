import type { LoanCard } from '~/api/policy';

export type BadgeTone = 'positive' | 'cautionary' | 'negative' | 'informative';

export interface Badge {
  tone: BadgeTone;
  label: string;
}

/**
 * 1-3 매칭 확인 — 조건을 통과했는가.
 *
 * 상담 안내에는 판정이 없다. "항상 매칭" 은 자격을 통과했다는 말이 아니라
 * 조건을 보지 않는 상품이라는 뜻이라, 통과 뱃지와 색을 나눈다.
 */
export function matchBadge(card: LoanCard): Badge {
  if (card.type === 'CONSULTATION') return { tone: 'informative', label: '항상 매칭' };
  if (card.verdict === 'NEED_INFO') return { tone: 'cautionary', label: '확인 필요' };
  return { tone: 'positive', label: '매칭 성공' };
}

/**
 * 1-4 내 스펙 — 지금 가진 돈으로 실행할 수 있는가.
 *
 * 조건을 통과했어도 자기자금이 모자라면 당장은 못 쓴다. 그 차이를 뱃지로
 * 드러낸다 — 통과한 카드가 넷이어도 오늘 쓸 수 있는 건 둘일 수 있다.
 *
 * 상담 안내에는 금액이 없어 이 잣대를 댈 수 없다. matchBadge 와 같이
 * "항상 매칭" 을 붙인다 — 조건을 안 보는 상품이라는 뜻이지, 비교 결과가 아니다.
 */
export function specBadge(card: LoanCard): Badge | null {
  // matchBadge 와 같은 처리 — 상담 안내는 조건을 안 보는 상품이라 "항상 매칭" 이다.
  if (card.type === 'CONSULTATION') return { tone: 'informative', label: '항상 매칭' };
  if (card.ownFundsShortfall === null) return null;
  return card.ownFundsShortfall > 0
    ? { tone: 'negative', label: '부족' }
    : { tone: 'informative', label: '추천' };
}
