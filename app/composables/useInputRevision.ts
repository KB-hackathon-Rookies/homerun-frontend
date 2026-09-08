import axios from 'axios';

import { type DiagnosisStep, type DiagnosisStepPatch, usePlanApi } from '~/api/plan';
import type { ApiErrorBody } from '~/types/api';

/**
 * 문진 저장의 `expectedRevision` 을 관리한다.
 *
 * 서버는 입력이 바뀔 때마다 `revision` 을 올리고, 저장할 때 그 값이 맞아야
 * 받아 준다. 두 화면이 같은 입력을 나눠 채우는 데다 `prep` 이 계획을 만들면서
 * 이미 한 번 저장하기 때문에, **화면이 0 에서 시작하면 첫 답부터 어긋난다.**
 *
 * 그래서 서버가 들고 있는 값에서 시작하고, 그래도 어긋나면 다시 읽어 한 번
 * 더 보낸다 — 서버가 주는 문구도 "최신 입력을 다시 불러와 주세요" 다.
 */
export function useInputRevision(planId: number) {
  const revision = ref(0);

  /**
   * 서버 값을 읽어 온다.
   *
   * 입력이 아직 하나도 없으면 404 다. 그때는 0 이 맞으므로 조용히 넘어간다.
   */
  async function load() {
    try {
      revision.value = (await usePlanApi().input(planId)).revision;
    } catch {
      revision.value = 0;
    }
  }

  /**
   * `revision` 이 어긋났다는 뜻인가.
   *
   * 409 는 여러 이유로 난다. 다시 읽어 보내야 풀리는 것은 **오직 revision 충돌
   * (PLAN_018)** 뿐이다. 예컨대 소득 출처 불일치(PLAN_017)는 값을 다시 읽어도
   * 그대로 실패하므로, 재시도하면 같은 실패만 한 번 더 반복한다. 그래서 코드로
   * 좁혀 본다.
   */
  function isRevisionConflict(cause: unknown) {
    return (
      axios.isAxiosError<ApiErrorBody>(cause) &&
      cause.response?.status === 409 &&
      cause.response.data?.code === 'PLAN_018'
    );
  }

  /**
   * 한 단계를 저장하고 새 `revision` 을 물려받는다.
   *
   * revision 이 어긋났을 때 다시 읽고 보내는 것은 **한 번뿐이다.** 계속 어긋난다면
   * 다른 곳에서 정말로 고치고 있는 것이라, 조용히 덮어쓰기보다 실패를 알리는 게 맞다.
   * revision 충돌이 아닌 409 는 재시도하지 않고 화면이 문구를 띄우도록 그대로 던진다.
   */
  async function saveStep(step: DiagnosisStep, patch: DiagnosisStepPatch) {
    const put = usePlanApi().saveStep;

    try {
      const result = await put(planId, step, revision.value, patch);
      revision.value = result.revision;
      return result;
    } catch (cause) {
      if (!isRevisionConflict(cause)) throw cause;

      await load();
      const result = await put(planId, step, revision.value, patch);
      revision.value = result.revision;
      return result;
    }
  }

  return { revision, load, saveStep };
}
