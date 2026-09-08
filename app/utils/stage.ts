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

/**
 * 칸 하나의 이름.
 *
 * 시안(메인 2~5)은 이름과 상태를 두 줄로 쌓는다 — "1루 진단" 아래 "완료".
 * 아직 오지 않은 칸에는 상태 줄이 없다. 그래서 둘을 따로 둔다.
 */
const NODE_LABEL: Record<PlanStage, string> = {
  BENCH: '대기',
  FIRST: '1루 진단',
  SECOND: '2루 검증',
  THIRD: '3루 실행',
  HOME: '홈 정착',
};

export type NodeState = 'done' | 'current' | 'upcoming';

/** 이름 아래 붙는 줄. 안 온 칸은 붙일 말이 없다. */
const NODE_STATUS: Record<NodeState, string> = {
  done: '완료',
  current: '진행 중',
  upcoming: '',
};

export const nodeLabel = (stage: PlanStage) => NODE_LABEL[stage];
export const nodeStatus = (state: NodeState) => NODE_STATUS[state];

/** BENCH 는 1루를 앞둔 상태다. 카드에서는 1루를 지금 칸으로 본다. */
export const displayStage = (stage: PlanStage): PlanStage => (stage === 'BENCH' ? 'FIRST' : stage);

export function nodeState(node: PlanStage, current: PlanStage): NodeState {
  const here = STAGE_NODES.indexOf(displayStage(current));
  const there = STAGE_NODES.indexOf(node);
  if (there < here) return 'done';
  return there === here ? 'current' : 'upcoming';
}

/**
 * 지금 화면이 어느 루인가 — `resumePath` 의 반대 방향이다.
 *
 * 코치 FAB 이 질문과 함께 보낼 단계를 여기서 읽는다. 화면마다 손으로 적으면
 * 빠뜨린 화면이 생기고, 잘못 적으면 코치가 엉뚱한 루의 자료를 뒤진다.
 *
 * 표에 없는 경로는 `null` 이다 — 로그인·회원가입·문진·오픈뱅킹처럼 계획이 아직
 * 없거나 여정 밖인 화면이라 물어볼 단계가 없다. 모르는 것을 1루로 채우지 않는다.
 * 홈·마이는 경로만으로 알 수 없어서 화면이 계획에서 읽어 직접 넘긴다.
 */
const COACH_STAGE_ROUTES: { prefix: string; stage: PlanStage }[] = [
  { prefix: '/diagnosis/', stage: 'FIRST' },
  { prefix: '/result/', stage: 'FIRST' },
  { prefix: '/property/', stage: 'SECOND' },
  { prefix: '/contract/', stage: 'THIRD' },
  { prefix: '/settle/', stage: 'HOME' },
];

export function coachStageFor(path: string): PlanStage | null {
  return COACH_STAGE_ROUTES.find((entry) => path.startsWith(entry.prefix))?.stage ?? null;
}

/**
 * 두 단계 중 더 진행된(뒤에 있는) 단계.
 *
 * 계획이 서버에서 다음 단계로 넘어갔는데(예: 1루 완료 → 2루) 사용자가 아직 그 화면에
 * 실제로 들어가지 않아 "마지막 방문 단계" 가 뒤처지는 경우가 있다. 이어하기가 이미 끝난
 * 단계로 되돌아가지 않도록, 마지막 방문 단계와 현재 단계 중 더 앞선 쪽으로 보낸다.
 */
export function laterStage(a: PlanStage, b: PlanStage): PlanStage {
  return STAGE_NODES.indexOf(displayStage(a)) >= STAGE_NODES.indexOf(displayStage(b)) ? a : b;
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
