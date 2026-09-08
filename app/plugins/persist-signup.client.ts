import { useSignupStore } from '~/stores/signup';

/**
 * 회원가입 진행값을 새로고침에도 유지한다.
 *
 * Pinia 스토어는 메모리라서 가입 도중 새로고침하면 모아둔 값이 사라진다. 그러면
 * 본인 확인(2단계)에서 이메일 인증 상태가 비어 `/signup` 으로 튕겨 나가고, 처음부터
 * 다시 해야 한다. sessionStorage 에 스냅샷을 남겨 같은 탭에서 새로고침해도 이어서
 * 진행할 수 있게 한다.
 *
 * localStorage 가 아니라 sessionStorage 를 쓰는 이유: 가입값(비밀번호 포함)을 오래
 * 남기지 않기 위해서다. 탭 세션 동안만 유지되고 다른 탭과도 공유하지 않으며, 가입을
 * 마치면 스토어가 `$reset()` 되어 스냅샷도 빈 값으로 덮인다.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const STORAGE_KEY = 'homerun.signup';
  const store = useSignupStore(nuxtApp.$pinia);

  // 저장된 스냅샷이 있으면 먼저 복원한다(가입 페이지가 그려지기 전에 실행된다).
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      store.$patch(JSON.parse(saved));
    }
  } catch {
    // 파싱 실패나 스토리지 접근 불가(프라이빗 모드 등)는 무시하고 빈 상태로 시작한다.
  }

  // 값이 바뀔 때마다 스냅샷을 남긴다. $reset() 도 이 콜백으로 들어와 빈 값으로 덮인다.
  store.$subscribe(
    (_mutation, state) => {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // 저장 실패는 무시한다.
      }
    },
    { detached: true },
  );
});
