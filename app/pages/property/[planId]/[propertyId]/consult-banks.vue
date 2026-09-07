<script setup lang="ts">
import { BANKS } from '~/components/property/consultation';

/**
 * 2루-6a 방문한 은행 선택.
 *
 * 고른 은행 수만큼 결과를 하나씩 받는다. 은행을 한 번에 고르게 하는 이유는,
 * 창구를 돌고 온 사람이 어디를 갔는지부터 정리해야 각 은행에서 들은 말이
 * 섞이지 않기 때문이다.
 *
 * 고른 목록은 주소에 실어 다음 화면으로 넘긴다. 새로고침해도 이어서 적을 수
 * 있어야 한다 — 세 곳을 돌고 왔는데 두 번째에서 날아가면 다시 못 적는다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
const propertyId = Number(route.params.propertyId);

const chosen = ref<string[]>([]);

const toggle = (bank: string) => {
  chosen.value = chosen.value.includes(bank)
    ? chosen.value.filter((item) => item !== bank)
    : [...chosen.value, bank];
};

const start = () =>
  navigateTo({
    path: `/property/${planId}/${propertyId}/consult-result`,
    query: { banks: chosen.value.join(','), at: 0 },
  });
</script>

<template>
  <PhoneFrame>
    <StageBar
      title="상담 결과 입력"
      base="2루"
      @back="navigateTo(`/property/${planId}/${propertyId}/consult-guide`)"
    />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <AppCard class="flex flex-col gap-2.5">
        <h2 class="text-body2 text-ink-hero font-bold">방문한 은행을 모두 선택해주세요</h2>
        <p class="text-caption2 text-ink-hero-body">선택한 은행 수만큼 상담 결과 카드가 생겨요</p>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="bank in BANKS"
            :key="bank"
            type="button"
            class="rounded-pill text-label2 px-4 py-2.5 font-semibold transition-colors"
            :class="
              chosen.includes(bank)
                ? 'bg-primary-strong text-white'
                : 'bg-surface border-line text-ink-hero border'
            "
            :aria-pressed="chosen.includes(bank)"
            @click="toggle(bank)"
          >
            {{ bank }}
          </button>
        </div>
      </AppCard>

      <p class="bg-surface-brand rounded-chip text-caption2 text-ink-hero-body p-3">
        은행 상담은 매물당 여러 번 가능해요. 한 곳이라도 "가능" 판정을 받으면 상담 완료 처리돼요.
      </p>
    </div>

    <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-cta-pad">
      <AppButton variant="strong" :disabled="!chosen.length" @click="start">
        {{ chosen.length ? `선택한 ${chosen.length}곳으로 계속` : '은행을 선택해주세요' }}
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
