import type { PlanStage } from '~/api/dashboard';

/**
 * 단계 이름과 이어하기 목적지.
 *
 * 홈 진행 카드와 마이 프로필 칩이 같은 표를 본다. 화면마다 따로 적어 두면
 * 한쪽만 고쳐지고 이름이 갈린다.
 */

/** 진행 카드에 그리는 네 칸. BENCH 는 아직 1루 전이라 칸을 차지하지 않는다. */
export const STAGE_NODES: PlanStage[] = ['FIRST', 'SECOND', 'THIRD', 'HOME'];

export const STAGE_CHIP: Record<PlanStage, string> = {
  BENCH: '대기',
  FIRST: '1루',
  SECOND: '2루',
  THIRD: '3루',
  HOME: '홈',
};

/** 칸 하나의 이름. 지났는지 · 지금인지에 따라 말이 바뀐다. */
const NODE_LABEL: Record<PlanStage, { done: string; current: string; upcoming: string }> = {
  BENCH: { done: '대기', current: '대기', upcoming: '대기' },
  FIRST: { done: '1루 진단 완료', current: '1루 진단 중', upcoming: '1루 진단' },
  SECOND: { done: '2루 탐색 완료', current: '2루 탐색 중', upcoming: '2루 탐색' },
  THIRD: { done: '3루 완료', current: '3루 진행 중', upcoming: '3루 준비' },
  HOME: { done: '홈', current: '홈', upcoming: '홈' },
};

export type NodeState = 'done' | 'current' | 'upcoming';

export const nodeLabel = (stage: PlanStage, state: NodeState) => NODE_LABEL[stage][state];

/** BENCH 는 1루를 앞둔 상태다. 카드에서는 1루를 지금 칸으로 본다. */
export const displayStage = (stage: PlanStage): PlanStage => (stage === 'BENCH' ? 'FIRST' : stage);

export function nodeState(node: PlanStage, current: PlanStage): NodeState {
  const here = STAGE_NODES.indexOf(displayStage(current));
  const there = STAGE_NODES.indexOf(node);
  if (there < here) return 'done';
  return there === here ? 'current' : 'upcoming';
}

/**
 * 이어서 진행할 화면.
 *
 * 백엔드는 단계 말고 `locationCode` 도 주는데, 그 코드와 라우트를 짝지어 둔 표가
 * 아직 없다. 단계까지만 보고 그 단계의 첫 화면으로 보낸다.
 *
 * BENCH 도 1루로 보낸다. 여기까지 왔다는 건 계획이 이미 있다는 뜻인데(`planId` 가 있다),
 * 준비 문진(`/prep`)은 제출할 때마다 계획을 새로 만든다. `BENCH_ONBOARDING` 완료가 한 번
 * 실패해 단계가 BENCH 에 남은 사람을 거기로 보내면 계획이 하나 더 생긴다. 카드도
 * `displayStage` 로 BENCH 를 1루로 그리니 목적지가 같아야 말이 맞는다. 진단 화면은 서버가
 * 주는 `resumeStep` 으로 자리를 잡으므로 BENCH 계획도 처음부터 이어서 진행된다.
 */
export function resumePath(stage: PlanStage, planId: number) {
  switch (stage) {
    case 'BENCH':
    case 'FIRST':
      return `/diagnosis/${planId}`;
    case 'SECOND':
      return `/property/${planId}`;
    case 'THIRD':
      return `/contract/${planId}/schedule`;
    case 'HOME':
      return `/settle/${planId}`;
  }
}
