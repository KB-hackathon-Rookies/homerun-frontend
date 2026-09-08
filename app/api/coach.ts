import type { PlanStage } from '~/api/dashboard';
import type { ApiResponse } from '~/types/api';

/**
 * AI 코치에게 직접 묻기.
 *
 * 백엔드가 RAG 코치(문서 21종) 앞에 세운 프록시다. 화면은 여기만 부른다 —
 * 코치 서버를 직접 부르면 토큰이 붙지 않고, 주소도 배포마다 달라진다.
 *
 * ## 답은 근거와 함께 온다
 *
 * `sources` 가 이 기능의 핵심이다. 코치가 지어낸 말인지 문서에서 끌어온 말인지
 * 사용자가 직접 보고 판단할 수 있어야 한다. 근거가 비어 오면 비었다고 말한다 —
 * 빈 배열을 숨기면 근거 없는 답이 근거 있는 답처럼 보인다.
 *
 * ## 단계를 함께 보낸다
 *
 * 같은 질문이라도 1루(대출 한도를 재는 중)와 3루(계약을 앞둔 중)에서 필요한
 * 답이 다르다. 코치가 어느 문서를 볼지 고르는 데 쓴다.
 */
const BASE = '/api/v1/coach';

/**
 * 답변이 인용한 문서 한 조각.
 *
 * `source_url` 은 백엔드 응답 그대로다. 코치 서버가 스네이크 케이스로 내보내고
 * 프록시가 그 형태를 유지한다. 화면에서 예쁘게 바꿔 두면 실제 응답과 이름이
 * 갈려서, 필드가 비는 날 원인을 찾기 어려워진다.
 */
export interface CoachSource {
  /** 문서 제목. */
  title: string;
  /** 코퍼스에서의 출처 이름(파일·기관). */
  source: string;
  /** 원문 주소. 없는 문서가 있다. */
  source_url: string | null;
  /** 답변이 실제로 끌어온 대목. */
  snippet: string;
}

export interface CoachAnswer {
  answer: string;
  stage: PlanStage;
  sources: CoachSource[];
}

export function useCoachApi() {
  const { $api } = useNuxtApp();

  return {
    /**
     * 질문 하나를 보내고 답과 근거를 받는다.
     *
     * `context` 는 선택이다. 화면이 이미 알고 있는 값(예: 지금 보고 있는 매물의
     * 판정)을 붙일 자리이지, 없는 사용자 정보를 지어내 채우는 자리가 아니다.
     */
    async ask(question: string, stage: PlanStage, context?: Record<string, unknown>) {
      const { data } = await $api.post<ApiResponse<CoachAnswer>>(`${BASE}/ask`, {
        question,
        stage,
        ...(context ? { context } : {}),
      });
      return data.data;
    },
  };
}
