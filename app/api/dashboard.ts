import type { ApiResponse } from '~/types/api';

/**
 * 계획 대시보드.
 *
 * 홈이 읽는 유일한 요약이다. 단계·이어하기 위치·진행률·급한 할 일이 한 번에 온다.
 *
 * 진행률은 관문이 아니라 할 일 기준이다. 관문은 다섯 개뿐이라 하나 끝낼 때마다
 * 20% 씩 튀는데, 그건 사용자가 느끼는 진척과 다르다.
 */
const BASE = '/api/v1/plans';

/** 야구 비유 그대로다. BENCH 는 아직 1루에 들어서기 전. */
export type PlanStage = 'BENCH' | 'FIRST' | 'SECOND' | 'THIRD' | 'HOME';

export interface DashboardProgress {
  completedTasks: number;
  totalTasks: number;
  progressPercent: number;
}

export interface DashboardResume {
  stage: PlanStage;
  /** 단계 안에서 마지막으로 머문 화면. 아직 라우트와 짝지어 두지 않았다. */
  locationCode: string | null;
}

export interface DashboardTask {
  stepCode: string;
  taskCode: string;
  taskName: string;
  status: string;
  irreversible: boolean;
  deadlineLabel: string | null;
  dueDate: string | null;
  /** 음수면 이미 지났다. */
  daysUntilDue: number | null;
}

export interface Dashboard {
  planId: number;
  leaseType: string;
  currentStage: PlanStage;
  planStatus: string;
  lastLocationCode: string | null;
  resume: DashboardResume;
  targetMoveDate: string | null;
  progress: DashboardProgress;
  prioritizedTasks: DashboardTask[];
}

export function useDashboardApi() {
  const { $api } = useNuxtApp();

  return {
    async get(planId: number) {
      const { data } = await $api.get<ApiResponse<Dashboard>>(`${BASE}/${planId}/dashboard`);
      return data.data;
    },
  };
}
