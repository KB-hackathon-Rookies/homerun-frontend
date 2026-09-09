<script setup lang="ts">
import {
  useOpenBankingConnectionApi,
  type OpenBankingConnection,
} from '~/api/openbanking-connection';

// 브라우저 탭 제목.
useHead({ title: '오픈뱅킹 연결 실패' });

/**
 * ST-03 계좌를 연결하지 못했습니다.
 *
 * 연결 실패는 막힘이 아니다. 값의 출처가 자동에서 직접 입력으로 바뀔 뿐이고
 * **판정 정확도는 같다** — 그 말을 안 하면 연결이 안 됐으니 진단도 못 한다고
 * 오해한다.
 *
 * 어느 기관이 왜 실패했는지는 금융결제원 쪽 상태라 우리가 알 수 없다.
 * 연결이 남아 있는지 여부까지만 말한다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const connection = ref<OpenBankingConnection | null>(null);
const checked = ref(false);

onMounted(() => {
  useOpenBankingConnectionApi()
    .status()
    .then((found) => (connection.value = found))
    .catch(() => {})
    .finally(() => (checked.value = true));
});
</script>

<template>
  <PhoneFrame>
    <StatusBar
      title="계좌를 연결하지 못했습니다"
      badge="연결 실패"
      base="1루"
      @back="navigateTo('/openbanking')"
    />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <SectionCard title="연결이 끝나지 않았어요" tone="bad">
        <template #badge>
          <AppBadge tone="negative">연결 실패</AppBadge>
        </template>
        <FactRow label="원인" value="금융기관 점검·동의 중단 등 · 우리 쪽에서는 알 수 없어요" />
        <FactRow
          label="현재 연결"
          :value="
            !checked
              ? '확인하는 중'
              : connection?.connected
                ? '일부 기관은 연결돼 있어요'
                : '연결된 기관이 없어요'
          "
          :tone="connection?.connected ? 'good' : 'plain'"
        />
      </SectionCard>

      <SectionCard title="연결 없이도 진행됩니다">
        <FactRow label="직접 입력" value="소득·자산 두 항목" />
        <FactRow label="판정 정확도" value="동일 · 값의 출처만 달라요" tone="good" />
        <FactRow label="나중에 연결" value="마이 > 연결 관리에서 언제든" />
      </SectionCard>
    </div>

    <footer class="px-gutter-tight bg-surface flex shrink-0 flex-col gap-2 pt-2.5 pb-cta-pad">
      <AppButton @click="navigateTo('/openbanking')">다시 시도</AppButton>
      <AppButton variant="white" @click="navigateTo(`/diagnosis/${planId}/finance`)">
        직접 입력할게요
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
