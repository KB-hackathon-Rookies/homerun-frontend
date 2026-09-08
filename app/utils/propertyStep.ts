import type { PropertyStep } from '~/api/property';

/**
 * 매물 워크플로의 단계와 화면을 잇는 표.
 *
 * 각 STEP 저장은 그 단계일 때만 받아준다 — 백엔드가 현재 단계를 `verifyWorkflow` 로
 * 강제하고, 어긋나면 409(`PROPERTY_WORKFLOW_STEP_INVALID`)로 막는다. 그런데 단계는
 * 서버만 안다. 자동조회가 전용면적을 못 채우면(0 으로 채우면 85㎡ 상한을 잘못 통과하므로
 * `null` 로 둔다) 워크플로가 STEP 2 에 머무는데, 목록의 매물 카드나 신호등 색으로는
 * 그걸 알 길이 없다.
 *
 * 그래서 **모든 진입점이 서버에 단계를 묻고 이 표 하나만 본다**. 표가 화면마다 흩어져
 * 있으면 한쪽만 고쳐져 다시 어긋난다.
 */

/** 워크플로에 걸리는 화면. 이름은 라우트 파일명과 같게 둔다. */
export type PropertyStepScreen =
  'building' | 'violation' | 'detail' | 'registry' | 'registry-check';

/**
 * 화면 하나가 열려도 되는 STEP.
 *
 * 저장하는 화면은 딱 그 단계에서만 열린다. 읽기만 하는 화면(매물 상세·등기부 발급
 * 안내)은 그 단계와 그 뒤에서도 열린다 — 다 끝낸 매물의 판정을 다시 볼 길은 있어야
 * 하고, 읽기만 하니 409 로 막힐 저장도 없다.
 */
const ALLOWED: Record<PropertyStepScreen, readonly PropertyStep[]> = {
  building: ['BUILDING'],
  violation: ['VIOLATION'],
  detail: ['REGISTRY', 'COMPLETE'],
  registry: ['REGISTRY', 'COMPLETE'],
  'registry-check': ['REGISTRY'],
};

/**
 * 지금 단계에서 사람이 할 일이 있는 화면.
 *
 * STEP 4(REGISTRY)는 화면이 둘인데 **발급 안내(`registry`)** 로 보낸다. 체크리스트로
 * 바로 떨어뜨리면 등기부를 아직 떼지도 않은 사람에게 등기부를 보고 답하라고 묻는
 * 꼴이다. 발급 안내는 저장이 없어 잘못 들어와도 잃는 게 없고, 한 번 눌러 체크리스트로
 * 간다.
 *
 * COMPLETE 는 매물 상세로 보낸다. 진단이 끝난 매물에 남은 일은 결과를 보는 것이고,
 * 은행 상담은 거기서 이어진다.
 */
export function propertyStepRoute(planId: number, propertyId: number, step: PropertyStep): string {
  const base = `/property/${planId}/${propertyId}`;
  switch (step) {
    case 'BUILDING':
      return `${base}/building`;
    case 'VIOLATION':
      return `${base}/violation`;
    case 'REGISTRY':
      return `${base}/registry`;
    case 'COMPLETE':
      return `${base}/detail`;
  }
}

/** 허브의 다음 버튼에 적을 말. 경로와 같은 표에서 나와야 둘이 어긋나지 않는다. */
export function propertyStepLabel(step: PropertyStep): string {
  switch (step) {
    case 'BUILDING':
      return 'STEP 2 주택정보 입력하기';
    case 'VIOLATION':
      return 'STEP 3 위반건축물 확인하기';
    case 'REGISTRY':
      return 'STEP 4 등기부등본 확인하기';
    case 'COMPLETE':
      return '매물 상세 보기';
  }
}

/**
 * 이 화면을 지금 단계에서 열어도 되는가.
 *
 * 두 표가 지켜야 하는 약속이 하나 있다 — **`propertyStepRoute(step)` 가 가리키는
 * 화면은 그 `step` 을 반드시 허용해야 한다**. 그래야 리다이렉트가 한 번으로 끝난다.
 * 도착한 화면이 다시 튕겨내면 두 화면이 서로를 가리키며 무한히 오간다.
 * 아래 네 쌍이 그 약속이고, 표를 고칠 때 같이 봐야 한다:
 *
 * - BUILDING → `building` ∈ {BUILDING} ✓
 * - VIOLATION → `violation` ∈ {VIOLATION} ✓
 * - REGISTRY → `registry` ∈ {REGISTRY, COMPLETE} ✓
 * - COMPLETE → `detail` ∈ {REGISTRY, COMPLETE} ✓
 */
export function propertyStepAllows(screen: PropertyStepScreen, step: PropertyStep): boolean {
  return ALLOWED[screen].includes(step);
}
