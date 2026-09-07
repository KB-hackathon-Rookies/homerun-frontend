<script setup lang="ts">
import { usePropertyApi } from '~/api/property';
import { MISSED_ASSETS } from '~/components/settle/aftercare';

/**
 * 홈 4-3 · 사후자산심사.
 *
 * 대출이 나왔다고 끝이 아니다. 기금대출은 실행 뒤에 소득·자산·무주택 요건을
 * 한 번 더 본다. 여기서 부적격이 나오면 가산금리가 붙고 **되돌릴 수 없다**.
 *
 * 은행 자체 대출은 이 심사가 없다. 내 상품을 알면 그 말을 먼저 한다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const product = ref<string | null>(null);
const checked = ref<Record<string, boolean>>({});

/** 기금대출(버팀목)만 대상이다. 못 읽었으면 단정하지 않는다. */
const applies = computed(() => (product.value === null ? null : product.value !== 'BANK_LOAN'));

onMounted(() => {
  usePropertyApi()
    .decision(planId)
    .then((found) => (product.value = found.consultation?.loanProduct ?? null))
    .catch(() => {});
});
</script>

<template>
  <PhoneFrame>
    <StageBar title="사후자산심사" base="홈" @back="navigateTo(`/settle/${planId}`)" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <div v-if="applies !== false" class="bg-caution rounded-field flex flex-col gap-1 p-4">
        <p class="text-card-title font-bold text-white">대출 실행 후에도 심사가 남아 있어요</p>
        <p class="text-step font-normal text-white">
          기금대출은 사후자산심사를 해요. 부적격이 나오면 가산금리가 붙어요
        </p>
      </div>

      <div v-else class="bg-safe rounded-field flex flex-col gap-1 p-4">
        <p class="text-card-title font-bold text-white">내 상품은 대상이 아니에요</p>
        <p class="text-step font-normal text-white">
          은행 자체 대출은 사후자산심사가 없어요. 참고로만 봐 두세요
        </p>
      </div>

      <CoachTip>
        가산금리는 되돌릴 수 없어. 신청 시점에 자산을 정확히 신고했는지 확인해봐
      </CoachTip>

      <h2 class="text-card-title text-ink-hero font-bold">빠뜨리기 쉬운 항목</h2>

      <CheckItem v-for="asset in MISSED_ASSETS" :key="asset" v-model="checked[asset]">
        {{ asset }}
      </CheckItem>

      <div class="bg-surface-info rounded-field flex flex-col gap-1 p-3.5">
        <p class="text-caption-tight text-primary-strong font-bold">
          입주 후에 자산이 늘어난 것은 상관없어요
        </p>
        <p class="text-micro text-ink-hero-body">
          신청 시점 기준이라 지금부터 저축·투자해도 문제 없어요
        </p>
      </div>

      <DetailLink @open="navigateTo(`/settle/${planId}/asset-review-detail`)">
        사후자산심사 상세보기
      </DetailLink>
    </div>

    <footer class="px-gutter-tight bg-surface flex shrink-0 pt-2.5 pb-6">
      <AppButton variant="strong" @click="navigateTo(`/settle/${planId}`)">확인</AppButton>
    </footer>
  </PhoneFrame>
</template>
