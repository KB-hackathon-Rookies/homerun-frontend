import { usePlanApi } from '~/api/plan';
import type { LoanCard, PolicyVerdictDetail } from '~/api/policy';
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
 *
 * 정책이 다 떨어져도 백엔드는 일반 은행 상담(CONSULTATION) 카드를 늘 붙여,
 * 매물·상담으로 이어갈 길을 남긴다. 이 길이 있으면 no-policy 로 밀어내지
 * 않는다 — no-policy 의 "판정 결과 보러 가기" 가 다시 이 화면으로 돌아오고,
 * 같은 판정으로 또 no-policy 로 튕겨 무한 루프가 되기 때문이다. 대신 탈락을
 * 알리는 신호(allPoliciesFailed)만 켜고 결과 화면에 상담 카드를 그대로 둔다.
 */
export function useResultGuard(planId: number) {
  /**
   * no-policy 에서 "판정 결과 보러 가기" 로 넘어온 길인가(`?from=no-policy`).
   *
   * 상담 카드조차 없을 때는 여기서 no-policy 로 밀어내는데, no-policy 는 다시
   * 이 화면으로 돌아온다. 표시가 없으면 같은 판정으로 또 밀어내 무한 루프가 된다.
   * 사용자가 스스로 결과를 보러 온 것이므로 그때는 밀어내지 않는다.
   */
  const route = useRoute();
  const cameFromNoPolicy = computed(() => route.query.from === 'no-policy');

  /** 규칙 버전이 서로 다른 판정이 섞여 있는가. 개정 뒤 재판정을 안 한 것이다. */
  const ruleChanged = ref(false);
  /** 자격 기한이 다가온 조건이 있는가. */
  const eligibilityEnding = ref(false);
  /** 정책이 전부 떨어졌지만 은행 상담 경로는 남아 있는가. 결과 화면에 안내만 띄운다. */
  const allPoliciesFailed = ref(false);

  async function inspect(results: PolicyVerdictDetail[], cards: LoanCard[] = []) {
    // 같은 화면에서 판정 결과가 다시 들어올 수 있으므로, 이전 판단을 남겨 두지 않는다.
    ruleChanged.value = false;
    eligibilityEnding.value = false;
    allPoliciesFailed.value = false;

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

      // 입력이 비었으면 진단 자체가 불가라 상담 카드로도 못 이어간다 — 여기부터 막는다.
      if (missing) {
        await navigateTo(`/status/${planId}/diagnosis-blocked`, { replace: true });
        return;
      }

      // 입력은 다 있는데 다 떨어졌다. 은행 상담 카드가 있으면 밀어내지 않고
      // 결과 화면에서 상담·매물 경로로 이어가게 둔다(루프 차단).
      if (cards.some((card) => card.type === 'CONSULTATION')) {
        allPoliciesFailed.value = true;
        return;
      }

      // 이어갈 상담 카드조차 없을 때만 막다른 안내 화면으로 보낸다.
      // 단, 그 화면에서 결과를 보려고 되돌아온 길이면 다시 밀어내지 않는다(루프 차단).
      if (cameFromNoPolicy.value) {
        allPoliciesFailed.value = true;
        return;
      }
      await navigateTo(`/status/${planId}/no-policy`, { replace: true });
      return;
    }

    /*
     * `ruleVersion`은 전역 지침 버전이 아니라 정책별 규칙 번호다. 정책마다 번호가
     * 다른 것은 정상이라, 값이 섞였다는 이유로 재판정 안내를 띄우면 오탐이 된다.
     * 현재 evaluate API는 이미 최신 규칙으로 판정한 결과만 주며, 오래된 결과 여부를
     * 나타내는 필드가 없다. 그 신호를 백엔드가 명시하기 전까지는 추측해 안내하지 않는다.
     */
    ruleChanged.value = false;

    eligibilityEnding.value = results.some((result) =>
      result.basis.some(
        (condition) =>
          condition.daysRemaining !== null && condition.daysRemaining <= ELIGIBILITY_NOTICE_DAYS,
      ),
    );
  }

  return { ruleChanged, eligibilityEnding, allPoliciesFailed, inspect };
}
