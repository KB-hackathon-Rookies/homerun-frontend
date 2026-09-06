import { usePolicyApi, type JeonsePolicyVerdicts, type LoanCard } from '~/api/policy';
import { messageFrom } from '~/utils/error';

/**
 * 1루 결과 두 화면이 같은 판정을 읽는다.
 *
 * 판정은 결정론이라(같은 입력이면 같은 결과) 화면을 옮길 때마다 다시 불러도
 * 값이 흔들리지 않는다. 그래서 화면 사이에 결과를 들고 다니지 않는다 —
 * 새로고침해도, 링크로 바로 들어와도 똑같이 보이는 쪽이 낫다.
 */
export function useJeonsePolicies(planId: number) {
  const verdicts = ref<JeonsePolicyVerdicts | null>(null);
  const pending = ref(true);
  const error = ref('');

  /** 정책 코드로 판정 근거를 찾는다. 카드에는 근거가 실려 오지 않는다. */
  const basisOf = (card: LoanCard) =>
    verdicts.value?.results.find((result) => result.policyCode === card.code)?.basis ?? [];

  onMounted(async () => {
    try {
      verdicts.value = await usePolicyApi().evaluateJeonse(planId);
    } catch (cause) {
      error.value = messageFrom(cause, '판정 결과를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      pending.value = false;
    }
  });

  return {
    pending,
    error,
    cards: computed(() => verdicts.value?.cards ?? []),
    basisOf,
  };
}
