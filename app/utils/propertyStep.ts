import type { PropertyStep } from '~/api/property';

/**
 * 매물 워크플로 단계별 정규 화면.
 *
 * 각 STEP 화면은 그 단계일 때만 저장할 수 있다 — 백엔드가 현재 단계를 `verifyWorkflow`
 * 로 강제하고, 어긋나면 409(`PROPERTY_WORKFLOW_STEP_INVALID`)로 막는다. URL 로 다른 STEP
 * 화면에 바로 들어오면 입력을 다 하고 저장에서야 막히는 막다른 길이 된다. 그래서 각 STEP
 * 화면이 진입 시 지금 단계의 화면으로 돌려보내는 데 이 표를 쓴다.
 */
export function propertyStepRoute(planId: number, propertyId: number, step: PropertyStep): string {
  const base = `/property/${planId}/${propertyId}`;
  switch (step) {
    case 'BUILDING':
      return `${base}/building`;
    case 'VIOLATION':
      return `${base}/violation`;
    case 'REGISTRY':
      return `${base}/registry-check`;
    case 'COMPLETE':
      return `${base}/consultations`;
  }
}
