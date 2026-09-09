<script setup lang="ts">
import { useSettlementApi, type PostAssetReview } from '~/api/settlement';
import { MISSED_ASSETS } from '~/components/settle/aftercare';
import { statusFrom } from '~/utils/error';
import { HOME_STEPS } from '~/components/home/steps';
import { COACH_TIME } from '~/components/home/coachSheets';

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

const guide = ref<PostAssetReview | null>(null);
const checked = ref<Record<string, boolean>>({});
/** 대출이 아직 등록되지 않았는가(404). 대상 여부가 실행된 상품에서 나온다. */
const needsLoan = ref(false);

/** 기금대출(버팀목)만 대상이다. 못 읽었으면 단정하지 않는다. */
const applies = computed(() => guide.value?.applicable ?? null);

onMounted(() => {
  useSettlementApi()
    .postAssetReview(planId)
    .then((found) => (guide.value = found))
    .catch((cause) => {
      // 대출 미등록이면 404 다. 대상인지 아닌지 지어내지 않고 등록부터 안내한다.
      if (statusFrom(cause) === 404) needsLoan.value = true;
    });
});

/** ⓘ 와 오른쪽 아래 FAB 이 같은 시트를 연다. */
const coachOpen = ref(false);
</script>

<template>
  <StageShell
    v-model:coach-open="coachOpen"
    :coach-sheets="[COACH_TIME.assetReview]"
    brand
    base="홈"
  >
    <div class="bg-canvas-soft flex min-h-full flex-col gap-3 px-4 pt-4 pb-6">
      <SubStep :steps="HOME_STEPS" :current="2" />

      <h1 class="text-question text-ink-card">사후자산심사</h1>
      <!-- 대상 여부는 실행된 대출 상품이 정한다. 없으면 어느 쪽으로도 단정하지 않는다. -->
      <div v-if="needsLoan" class="bg-surface-info rounded-field flex flex-col gap-2 p-4">
        <p class="text-card-title text-primary-strong font-bold">대출 정보를 먼저 등록해주세요</p>
        <p class="text-step text-ink-hero-body font-normal">
          실행된 대출 상품을 알아야 사후자산심사 대상인지 알려드릴 수 있어요
        </p>
        <button
          type="button"
          class="bg-surface rounded-chip text-label2 text-primary-strong self-start px-3.5 py-2.5 font-semibold"
          @click="navigateTo(`/settle/${planId}/loan-account`)"
        >
          실행 대출 등록하러 가기 →
        </button>
      </div>

      <div v-else-if="applies !== false" class="bg-caution rounded-field flex flex-col gap-1 p-4">
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

      <h2 class="text-card-title text-ink-hero font-bold">빠뜨리기 쉬운 항목</h2>

      <CheckItem
        v-for="asset in guide?.easyToMiss.length ? guide.easyToMiss : MISSED_ASSETS"
        :key="asset"
        v-model="checked[asset]"
      >
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

    <template #footer>
      <footer class="px-gutter-tight bg-surface flex shrink-0 gap-2.5 pt-2.5 pb-cta-pad">
        <!-- 필수 요소 3번. 앞 단계는 보증료 지원 신청이다. -->
        <div class="w-29 shrink-0">
          <AppButton variant="white" @click="navigateTo(`/settle/${planId}/fee-support`)">
            이전
          </AppButton>
        </div>
        <div class="flex-1">
          <AppButton variant="strong" @click="navigateTo(`/settle/${planId}`)">확인</AppButton>
        </div>
      </footer>
    </template>
  </StageShell>
</template>
