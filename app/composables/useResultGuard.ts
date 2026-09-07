import { usePlanApi } from '~/api/plan';
import type { PolicyVerdictDetail } from '~/api/policy';
import { missingRequired } from '~/components/my/required';

/** 자격이 끝나기까지 이만큼 남으면 알린다. 석 달이면 준비를 시작할 수 있는 기간이다. */
const ELIGIBILITY_NOTICE_DAYS = 90;

/**
 * 판정 결과를 보고 어디로 보낼지 정한다.
 *
 * 결과 화면은 "됐다/안 됐다" 만 말하면 막다른 길이 된다. 왜 막혔는지에 따라
 * 갈 곳이 다르다.
 *
 * - 판정 자체가 안 나온다 → 입력이 비었다(진단 불가)
 * - 판정은 났는데 다 떨어졌다 → 기준을 넘었다(정책 0건)
 *
 * 둘을 가르려면 입력을 봐야 하는데, 잘 된 경우에는 볼 이유가 없다. 그래서
 * 결과가 비었을 때만 입력을 읽는다 — 평소에는 요청이 한 번도 늘지 않는다.
 */
export function useResultGuard(planId: number) {
  /** 규칙 버전이 서로 다른 판정이 섞여 있는가. 개정 뒤 재판정을 안 한 것이다. */
  const ruleChanged = ref(false);
  /** 자격 기한이 다가온 조건이 있는가. */
  const eligibilityEnding = ref(false);

  async function inspect(results: PolicyVerdictDetail[]) {
    const passable = results.some((result) => result.verdict !== 'FAIL');

    if (!passable) {
      // 입력이 비어서 못 낸 것인지, 기준을 넘어 떨어진 것인지 가른다.
      let missing: number;
      try {
        missing = missingRequired(await usePlanApi().input(planId)).length;
      } catch {
        // 입력을 못 읽으면 단정하지 않는다. 결과 화면에 그대로 둔다.
        return;
      }
      const to = missing ? 'diagnosis-blocked' : 'no-policy';
      await navigateTo(`/status/${planId}/${to}`, { replace: true });
      return;
    }

    const versions = results.map((result) => result.ruleVersion).filter((v) => v !== null);
    ruleChanged.value = new Set(versions).size > 1;

    eligibilityEnding.value = results.some((result) =>
      result.basis.some(
        (condition) =>
          condition.daysRemaining !== null && condition.daysRemaining <= ELIGIBILITY_NOTICE_DAYS,
      ),
    );
  }

  return { ruleChanged, eligibilityEnding, inspect };
}
