<script setup lang="ts">
import {
  useOpenBankingConnectionApi,
  type OpenBankingConnection,
} from '~/api/openbanking-connection';
import { useVerificationApi, type PendingCondition } from '~/api/verification';
import { currentPlan } from '~/utils/currentPlan';
import { formatDotDate } from '~/utils/date';

/**
 * MY-04 연결 관리.
 *
 * 연결을 끊어도 진단은 돌아간다. 값의 출처가 자동에서 직접 입력으로 바뀔
 * 뿐이라, 해제 버튼 옆에 그 말을 같이 둔다 — "끊으면 못 쓴다" 고 겁주는
 * 화면이 아니다.
 */
definePageMeta({ middleware: 'auth' });

const planId = ref<number | null>(null);
const connection = ref<OpenBankingConnection | null>(null);
const conditions = ref<PendingCondition[]>([]);

const status = computed(() => {
  const found = connection.value;
  if (!found) return '확인하는 중';
  if (!found.connected) return '연결 안 됨';
  return found.lastConnectedAt ? `${formatDotDate(found.lastConnectedAt)} 연결` : '연결됨';
});

/** 확인 방법이 적힌 조건만 링크를 걸 수 있다. 근거가 없으면 링크를 만들지 않는다. */
const withSource = computed(() => conditions.value.filter((condition) => condition.sourceUrl));

onMounted(async () => {
  planId.value = await currentPlan.resolve();

  useOpenBankingConnectionApi()
    .status()
    .then((found) => (connection.value = found))
    .catch(() => {});

  if (planId.value) {
    useVerificationApi()
      .pending(planId.value)
      .then((found) => (conditions.value = found))
      .catch(() => {});
  }
});
</script>

<template>
  <PhoneFrame>
    <StatusBar title="연결 관리" @back="navigateTo('/my')" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <SectionCard title="오픈뱅킹">
        <RowChevron label="연결 상태" :value="status" @select="navigateTo('/openbanking')" />
        <RowChevron
          label="계좌 관리"
          :value="connection?.connected ? '금융결제원에서' : '먼저 연결해주세요'"
          last
          :disabled="!connection?.connected"
          @select="navigateTo('/openbanking')"
        />
      </SectionCard>

      <SectionCard title="기관 확인">
        <RowChevron
          label="추가 확인 필요"
          :value="`${conditions.length}건`"
          :disabled="!conditions.length"
          @select="navigateTo(`/result/${planId}/match`)"
        />
        <RowChevron
          label="확인 방법 안내"
          :value="withSource.length ? `${withSource.length}건 링크 있음` : '안내 링크 없음'"
          last
          :disabled="!withSource.length"
          @select="navigateTo(withSource[0]!.sourceUrl!, { external: true })"
        />
      </SectionCard>

      <!--
        해제하면 무엇이 달라지는지. 판정이 사라지는 게 아니라 값을 직접
        적게 되는 것뿐이다.
      -->
      <SectionCard title="연결을 해제하면" tone="warn">
        <FactRow label="자동 채움" value="중단 · 직접 입력으로 전환" tone="warn" />
        <FactRow label="기존 판정" value="유지 · 재계산할 때 값 확인 필요" />
      </SectionCard>
    </div>

    <TabBar active="my" :plan-id="planId" />
  </PhoneFrame>
</template>
