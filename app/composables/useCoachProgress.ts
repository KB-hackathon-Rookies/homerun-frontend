import { educationCode, useEducationApi } from '~/api/education';
import { COACH_MODULES } from '~/components/coach/modules';

/**
 * 코치 교육 진행 상태.
 *
 * 서버의 교육 진행률을 진실의 원천으로 쓰고, 네트워크 장애 때만 브라우저
 * 기록을 임시 표시한다.
 *
 * 진행 상태는 화면을 꾸미는 값이지 판정이 아니다. 못 읽어도 "아직 안 함" 으로
 * 두면 되므로, 읽기·쓰기를 전부 try/catch 로 감싸고 조용히 넘어간다.
 */
const KEY = 'coachDoneModules';

function read(): Set<string> {
  if (!import.meta.client) return new Set();
  try {
    const raw = window.localStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function useCoachProgress() {
  const done = ref<Set<string>>(new Set());
  const ids = COACH_MODULES.map((module) => module.id);

  onMounted(async () => {
    done.value = read();
    try {
      const modules = await useEducationApi().list();
      done.value = new Set(
        modules
          .filter((module) => module.status === 'DONE')
          .map((module) => ids[Number(module.code.slice(1))])
          .filter((id): id is string => !!id),
      );
    } catch {
      // 오프라인이면 이 기기에 남아 있던 완료 표시를 유지한다.
    }
  });

  function isDone(moduleId: string) {
    return done.value.has(moduleId);
  }

  async function markDone(moduleId: string) {
    const code = educationCode(moduleId, ids);
    if (code) await useEducationApi().markRead(code);
    const next = new Set(done.value);
    next.add(moduleId);
    done.value = next;
    if (!import.meta.client) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify([...next]));
    } catch {
      // 못 써도 화면은 그대로다. 다음에 열면 다시 안 함으로 보일 뿐이다.
    }
  }

  return { done, isDone, markDone };
}
