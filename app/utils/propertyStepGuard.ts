import { usePropertyApi, type PropertyStep } from '~/api/property';
import { messageFrom, statusFrom } from '~/utils/error';
import {
  propertyStepAllows,
  propertyStepRoute,
  type PropertyStepScreen,
} from '~/utils/propertyStep';

/**
 * 지금 화면이 서버의 현재 단계에 맞는지 보고, 아니면 맞는 화면으로 돌려보낸다.
 *
 * 단계는 서버만 안다. 그래서 화면마다 열릴 때 `resume` 을 한 번 물어보고, 이 화면이
 * 그 단계에서 열려도 되는 화면인지 `propertyStepAllows` 로 판단한다. 아니면 조용히
 * 지금 단계의 화면으로 `replace` 한다 — 경고창을 띄우면 사용자가 뭘 잘못했다는
 * 뜻이 되는데, 잘못한 건 여기까지 들여보낸 우리 쪽이다. `replace` 라서 뒤로 가기가
 * 방금 튕겨 나온 화면으로 되돌아가지도 않는다.
 *
 * 리다이렉트는 한 번으로 끝난다. `propertyStepRoute` 가 가리키는 화면은 그 단계를
 * 반드시 허용하기 때문이다(`propertyStep.ts` 의 약속). 도착한 화면의 가드는 통과만
 * 하고 다시 보내지 않는다.
 *
 * `revision` 도 여기서 같이 들고 온다 — 저장할 때 실어 보내야 하는 값이라 어차피
 * 같은 응답에서 나온다.
 */
export function usePropertyStepGuard(
  planId: number,
  propertyId: number,
  screen: PropertyStepScreen,
) {
  const step = ref<PropertyStep | null>(null);
  const revision = ref(0);
  const pending = ref(true);
  const error = ref('');
  /** 저장이 409 로 막혔다. 다른 탭이 워크플로를 먼저 넘겼을 때 이렇게 된다. */
  const conflict = ref(false);

  /** 서버에 단계를 다시 묻는다. 어긋나 있으면 맞는 화면으로 보내고 `false` 를 준다. */
  async function sync(): Promise<boolean> {
    pending.value = true;
    error.value = '';
    conflict.value = false;
    try {
      const workflow = await usePropertyApi().resume(planId, propertyId);
      step.value = workflow.currentStep;
      revision.value = workflow.revision;

      if (!propertyStepAllows(screen, workflow.currentStep)) {
        await navigateTo(propertyStepRoute(planId, propertyId, workflow.currentStep), {
          replace: true,
        });
        return false;
      }
      return true;
    } catch (cause) {
      error.value = messageFrom(cause, '진행 상태를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
      return false;
    } finally {
      pending.value = false;
    }
  }

  /**
   * 저장 실패를 화면 문구로 바꾼다.
   *
   * 409 는 다른 실패와 다르다. 다시 눌러도 영영 안 되고, 서버는 이미 다음 단계로
   * 가 있다. 그래서 이때만 "지금 단계로 이동하기" 를 띄워 `sync()` 로 되돌린다 —
   * 막다른 길 대신 나갈 문을 준다.
   */
  function reportSaveError(cause: unknown, fallback: string) {
    error.value = messageFrom(cause, fallback);
    conflict.value = statusFrom(cause) === 409;
  }

  onMounted(sync);

  return { step, revision, pending, error, conflict, sync, reportSaveError };
}
