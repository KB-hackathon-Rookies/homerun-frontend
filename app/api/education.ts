import type { ApiResponse } from '~/types/api';

const BASE = '/api/v1/education/modules';

export interface EducationModuleSummary {
  code: string;
  title: string;
  estimatedMinutes: number | null;
  status: string;
  quizScore: number | null;
  /** 백엔드에 본문이 있는가. 목록의 '준비 중' 여부를 이 값으로 정한다. */
  hasContent: boolean;
}

export interface EducationQuizQuestion {
  id: number;
  question: string;
  options: string[];
  sortOrder: number;
}

export interface EducationModuleDetail {
  code: string;
  title: string;
  body: string;
  status: string;
  progressPct: number;
  quiz: EducationQuizQuestion[];
}

/**
 * 백엔드 교육 모듈 코드. V71 시드가 심은 M0~M12 열세 개가 전부다.
 *
 * 유니온으로 좁혀 두면 `M13` 같은 오타가 타입체크에서 걸린다. 서버 code 는 자바 enum 이
 * 아니라 education_content 의 문자열 컬럼이라 OpenAPI 스펙에 enum 으로 안 나온다 —
 * `check:enums` 가 대신 잡아 줄 수 없으니 여기서 손으로 좁혀 둔다.
 */
export type EducationCode =
  'M0' | 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6' | 'M7' | 'M8' | 'M9' | 'M10' | 'M11' | 'M12';

/** 코드를 들고 다니는 모듈의 최소 모양. 화면 계층(COACH_MODULES)을 import 하지 않으려고 구조로만 받는다. */
type CodedModule = { id: string; code: EducationCode | null };

/**
 * 프론트 모듈 슬러그 → 백엔드 code.
 *
 * 예전에는 목록에서의 **순서**로 `M${index}` 를 만들었다. 프론트와 백엔드 시드의 순서가
 * 우연히 겹치는 동안만 맞는 방식이라, 마지막 칸에서 '2026년 달라진 것'(백엔드에 없음)이
 * M12 '도움받을 곳' 을 끌어와 남의 본문을 제 제목으로 보여줬다. 목록에 하나만 끼워 넣어도
 * 그 뒤 전부가 조용히 밀리므로, 이제는 모듈마다 code 를 직접 적고 그대로 읽기만 한다.
 *
 * 짝이 없는 모듈은 null 이다. 호출부는 null 이면 서버 조회를 건너뛰고 번들 본문을 쓴다.
 */
export function educationCode(
  moduleId: string,
  modules: readonly CodedModule[],
): EducationCode | null {
  return modules.find((module) => module.id === moduleId)?.code ?? null;
}

/**
 * 백엔드 code → 프론트 모듈 슬러그. 진행률 응답을 화면 모듈에 되돌릴 때 쓴다.
 *
 * 위와 같은 이유로 `ids[Number(code.slice(1))]` 같은 역산을 쓰지 않는다.
 * 프론트에 짝이 없는 code(M12 등)는 null 이고, 호출부가 걸러 낸다.
 */
export function educationModuleId(code: string, modules: readonly CodedModule[]): string | null {
  return modules.find((module) => module.code === code)?.id ?? null;
}

export function useEducationApi() {
  const { $api } = useNuxtApp();

  return {
    async list() {
      const { data } = await $api.get<ApiResponse<EducationModuleSummary[]>>(BASE);
      return data.data;
    },

    async detail(code: string) {
      const { data } = await $api.get<ApiResponse<EducationModuleDetail>>(`${BASE}/${code}`);
      return data.data;
    },

    async markRead(code: string) {
      await $api.post<ApiResponse<void>>(`${BASE}/${code}/read`);
    },

    async submitQuiz(code: string, answers: { questionId: number; choiceIndex: number }[]) {
      const { data } = await $api.post<ApiResponse<unknown>>(`${BASE}/${code}/quiz/submit`, {
        answers,
      });
      return data.data;
    },
  };
}
