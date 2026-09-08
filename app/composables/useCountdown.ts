/**
 * 남은 시간을 세는 카운트다운.
 *
 * 인증번호 유효시간과 재발송 대기시간이 같은 화면에서 따로 돈다. 같은 타이머 코드를 두 번 쓰지
 * 않으려고 뺐다.
 *
 * **끝나는 시각을 들고 세지, 남은 초를 1씩 빼지 않는다.** 브라우저가 백그라운드 탭의 타이머를
 * 늦추거나 건너뛰기 때문에, 빼는 방식은 화면을 잠깐 가렸다 돌아오면 실제보다 오래 남은 것처럼
 * 보인다. 그러면 이미 죽은 인증번호를 아직 살아 있다고 말하게 된다.
 */
export function useCountdown() {
  /** 끝나는 시각(ms). 아직 시작하지 않았으면 null. */
  const endsAt = ref<number | null>(null);
  const now = ref(Date.now());

  let ticker: ReturnType<typeof setInterval> | undefined;

  const remaining = computed(() => {
    if (endsAt.value === null) return 0;
    return Math.max(0, Math.ceil((endsAt.value - now.value) / 1000));
  });

  /** 세는 중인가. 시작조차 안 했으면 false, 다 세었어도 false. */
  const running = computed(() => remaining.value > 0);

  /** `2:05` 꼴. 분이 없으면 초만 쓴다 — 재발송 대기는 1분 이하라 `0:45` 보다 `45초` 가 읽힌다. */
  const label = computed(() => {
    const total = remaining.value;
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}` : `${seconds}초`;
  });

  function stop() {
    clearInterval(ticker);
    ticker = undefined;
  }

  function start(seconds: number) {
    stop();
    endsAt.value = Date.now() + seconds * 1000;
    now.value = Date.now();
    ticker = setInterval(() => {
      now.value = Date.now();
      if (remaining.value === 0) stop();
    }, 1000);
  }

  /** 다 센 것으로 만든다. 인증에 성공해 더 셀 이유가 없어졌을 때 쓴다. */
  function clear() {
    stop();
    endsAt.value = null;
  }

  onBeforeUnmount(stop);

  return { remaining, running, label, start, clear };
}
