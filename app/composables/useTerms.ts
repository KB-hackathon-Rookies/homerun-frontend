import type { Term } from '~/components/common/TermsAgreement.vue';

/**
 * 약관 동의 상태.
 *
 * 항목 목록을 주면 전부 미동의로 시작하는 상태와, 필수를 다 채웠는지 알려주는
 * 값을 돌려준다. 화면마다 같은 코드를 다시 쓰지 않으려고 뺐다.
 */
export function useTerms(terms: Term[]) {
  const agreed = ref<Record<string, boolean>>(
    Object.fromEntries(terms.map((term) => [term.id, false])),
  );

  const canProceed = computed(() =>
    terms.filter((term) => term.required).every((term) => agreed.value[term.id]),
  );

  return { agreed, canProceed };
}
