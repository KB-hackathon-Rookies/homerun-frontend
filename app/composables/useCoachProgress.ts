/**
 * 코치 교육 진행 상태.
 *
 * 어느 모듈을 끝냈는지 기록한다. **저장할 API 가 아직 없어서 브라우저에 둔다** —
 * 기기를 바꾸면 초기화된다. 서버가 생기면 이 파일만 갈아 끼운다.
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

  onMounted(() => {
    done.value = read();
  });

  function isDone(moduleId: string) {
    return done.value.has(moduleId);
  }

  function markDone(moduleId: string) {
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
