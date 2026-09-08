import { useContractApi } from '~/api/contract';
import { usePlanApi } from '~/api/plan';
import type { DocSituation } from './labels';

/**
 * 서류 판정에 쓸 내 상황을 모은다.
 *
 * 계약(2루 초안)과 진단 입력 두 곳을 읽는다. 서류 화면 두 개가 같은 값을 같은
 * 방식으로 읽어야 해서 여기 한 번만 둔다 — 한쪽만 고치면 같은 사람에게 두
 * 화면이 다른 목록을 준다.
 *
 * **실패하면 `null` 을 준다. 던지지 않는다.** 서류 목록은 읽기 전용 안내지
 * 판정이 아니다. 못 불러왔다고 화면을 막으면 사용자는 서류 이름조차 못 본다.
 * `null` 이면 화면은 거르지 않고 전부 보여준다.
 */
export async function loadDocSituation(planId: number): Promise<DocSituation | null> {
  try {
    const [contract, input] = await Promise.all([
      useContractApi().prefill(planId),
      usePlanApi().input(planId),
    ]);

    return {
      houseType: contract.houseType,
      collateral: contract.collateralMethod,
      product: contract.loanProductKind,
      employmentType: input.employmentType,
      companySize: input.companySize,
    };
  } catch {
    return null;
  }
}
