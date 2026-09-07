/**
 * 인터넷에 붙어 있는가.
 *
 * `navigator.onLine` 은 "랜선이 꽂혀 있는가" 에 가깝다 — 공용 와이파이에 붙어
 * 로그인 페이지에 갇혀 있어도 참을 준다. 그래서 이 값만으로 화면을 막지 않는다.
 * 값을 못 가져온 건 각 화면이 이미 자기 말로 알려 준다.
 *
 * 여기서 하는 일은 **왜 안 되는지 짐작할 실마리**를 한 줄 얹는 것뿐이다.
 */
export function useConnection() {
  const online = ref(true);
  /** 한 번이라도 끊겼는가. 돌아왔을 때 다시 불러오라고 말해 주려면 알아야 한다. */
  const wasOffline = ref(false);

  onMounted(() => {
    online.value = navigator.onLine;

    const goOnline = () => (online.value = true);
    const goOffline = () => {
      online.value = false;
      wasOffline.value = true;
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    onUnmounted(() => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    });
  });

  return { online, wasOffline };
}
