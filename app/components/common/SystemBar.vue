<script setup lang="ts">
import { useConnection } from '~/composables/useConnection';

/**
 * 화면 맨 위에 붙는 알림 줄.
 *
 * 앱 전체에 걸린 일만 여기서 말한다 — 인터넷이 끊겼는지, 새 버전이 나왔는지.
 * 화면 하나의 실패는 그 화면이 자기 자리에서 말한다.
 *
 * 덮지 않고 **밀어낸다.** 위에 겹쳐 두면 뒤로가기 버튼을 가리는데, 연결이
 * 끊긴 채로 돌아갈 수도 없게 만드는 셈이다.
 */
const { online, wasOffline } = useConnection();

/**
 * 새 버전 감지.
 *
 * 말없이 갈아엎지 않는다(`registerType: 'prompt'`). 쓰던 화면이 갑자기 바뀌면
 * 방금 적던 값이 어디로 갔는지 알 수 없다.
 */
const { $pwa } = useNuxtApp();

const needRefresh = computed(() => !!$pwa?.needRefresh);

/** 끊겼다 돌아온 직후. 화면에 남은 값이 끊기기 전 것이라 다시 받아야 한다. */
const reconnected = computed(() => online.value && wasOffline.value);

function reload() {
  window.location.reload();
}

function update() {
  $pwa?.updateServiceWorker();
}
</script>

<template>
  <div v-if="!online" class="bg-warning-strong px-gutter-tight py-2 text-center">
    <p class="text-label2 text-white">
      인터넷 연결이 없어요. 저장된 화면은 볼 수 있지만 값은 못 가져와요.
    </p>
  </div>

  <button
    v-else-if="reconnected"
    type="button"
    class="bg-success px-gutter-tight w-full py-2 text-center"
    @click="reload"
  >
    <span class="text-label2 text-white">다시 연결됐어요 · 눌러서 새로 불러오기</span>
  </button>

  <button
    v-else-if="needRefresh"
    type="button"
    class="bg-primary-strong px-gutter-tight w-full py-2 text-center"
    @click="update"
  >
    <span class="text-label2 text-white">새 버전이 있어요 · 눌러서 바꾸기</span>
  </button>
</template>
