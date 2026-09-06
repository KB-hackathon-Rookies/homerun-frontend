<script setup lang="ts">
import { useOpenBankingApi } from '~/api/openbanking';
import { messageFrom } from '~/utils/error';

/**
 * OB-4 조회 진행.
 *
 * 연동은 금융결제원 인가 페이지에서 이뤄진다. 그 페이지는 우리 화면이 아니라
 * 언제 끝났는지 알 수 없으므로, 새 창으로 띄워 두고 이 화면에서 `connection` 을
 * 되풀이해 물어본다. 연결이 확인되면 자산·소득 요약까지 받아 두고 버튼을 연다.
 *
 * 다 끝나기 전에 넘어가면 다음 화면에 보여줄 값이 없다. 그래서 대기 중에는
 * 버튼을 잠근다.
 */
definePageMeta({ middleware: 'auth' });

/** 인가 페이지에서 계좌를 고르는 데 걸리는 시간을 생각하면 2초면 충분하다. */
const POLL_INTERVAL_MS = 2000;
/** 3분이 넘으면 사용자가 창을 닫았거나 중간에 그만둔 것으로 본다. */
const POLL_TIMEOUT_MS = 180_000;

const { connect, connection, financialSummary } = useOpenBankingApi();

const done = ref(false);
const error = ref('');
let timer: ReturnType<typeof setTimeout> | undefined;

onMounted(async () => {
  try {
    window.open(await connect(), '_blank', 'noopener');
  } catch (cause) {
    error.value = messageFrom(cause, '연동을 시작하지 못했어요.');
    return;
  }
  poll(Date.now());
});

onUnmounted(() => clearTimeout(timer));

async function poll(startedAt: number) {
  try {
    if ((await connection()).connected) {
      await financialSummary();
      done.value = true;
      return;
    }
  } catch (cause) {
    error.value = messageFrom(cause, '연동 상태를 확인하지 못했어요.');
    return;
  }

  if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
    error.value = '연동이 끝나지 않았어요. 다시 시도해주세요.';
    return;
  }
  timer = setTimeout(() => poll(startedAt), POLL_INTERVAL_MS);
}
</script>

<template>
  <PhoneFrame>
    <div class="h-statusbar shrink-0" />
    <PageBar title="오픈뱅킹 연동" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-4 py-5">
      <h2 class="text-heading text-ink-hero whitespace-pre-line">
        {{ done ? '은행 정보를 다 가져왔어요' : '은행 정보를\n가져오는 중이에요' }}
      </h2>
      <p class="text-label2 text-ink-hero-body">
        {{ done ? '이제 다음으로 넘어갈 수 있어요' : '보통 30초~1분 정도 걸려요' }}
      </p>

      <div class="bg-canvas rounded-chip p-3">
        <p class="text-micro text-ink-hero-body">
          실패한 은행은 나중에 다시 시도할 수 있어요. 마이페이지에서 재연동 가능합니다
        </p>
      </div>

      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>
    </div>

    <footer class="px-gutter-tight flex shrink-0 py-2.5">
      <AppButton variant="deep" :disabled="!done" @click="navigateTo('/openbanking/complete')">
        {{ done ? '다음' : '모든 조회 완료까지 기다려주세요' }}
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
