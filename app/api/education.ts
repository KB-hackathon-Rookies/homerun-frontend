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

export function educationCode(moduleId: string, orderedIds: string[]) {
  const index = orderedIds.indexOf(moduleId);
  return index < 0 ? null : `M${index}`;
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
