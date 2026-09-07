<script setup lang="ts">
import { ASSET_REVIEW_FLOW, MISSED_ASSETS } from '~/components/settle/aftercare';

/**
 * 홈 4-3 상세 · 사후자산심사.
 *
 * 왜 실행 뒤에 또 보는지, 무엇이 빠지기 쉬운지, 그리고 안심해도 되는 경우가
 * 무엇인지. 마지막 카드는 되돌릴 수 없다는 말이다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
</script>

<template>
  <GuideFrame title="사후자산심사 상세" @back="navigateTo(`/settle/${planId}/asset-review`)">
    <h2 class="text-section text-ink-hero px-1 pt-2">사후자산심사가 뭐예요?</h2>

    <AppCard class="flex flex-col gap-1.5">
      <p class="text-row text-ink-hero">기금대출은 실행 뒤에도 심사가 남아요</p>
      <p class="text-caption-tight text-ink-hero font-normal">
        대출 신청할 때 심사받은 소득·자산·무주택 요건을 대출 실행 이후에 한 번 더 검증해요.
      </p>
    </AppCard>

    <h2 class="text-section text-ink-hero px-1 pt-2">흐름</h2>

    <div class="bg-surface-info rounded-field p-3.5">
      <p class="text-caption-tight text-ink-hero font-normal">{{ ASSET_REVIEW_FLOW }}</p>
    </div>

    <h2 class="text-section text-ink-hero px-1 pt-2">빠뜨리기 쉬운 항목</h2>

    <AppCard class="flex flex-col gap-1.5">
      <p
        v-for="asset in MISSED_ASSETS"
        :key="asset"
        class="text-caption-tight text-ink-hero font-normal"
      >
        • {{ asset }}
      </p>
    </AppCard>

    <h2 class="text-section text-ink-hero px-1 pt-2">안심해도 되는 경우</h2>

    <AppCard class="flex flex-col gap-1.5">
      <p class="text-row text-ink-hero">입주 후에 자산이 늘어난 건 상관없어요</p>
      <p class="text-caption-tight text-ink-hero font-normal">
        신청 시점 기준이라, 그 이후 저축·급여로 자산이 늘어도 문제 없어요.
      </p>
    </AppCard>

    <h2 class="text-section text-ink-hero px-1 pt-2">되돌릴 수 없어요</h2>

    <div class="bg-surface border-danger-deep rounded-field flex flex-col gap-1.5 border p-3.5">
      <p class="text-row text-danger-deep">가산금리 부과 후엔 취소 불가</p>
      <p class="text-caption-tight text-ink-hero font-normal">
        신청 시점에 자산을 정확히 신고했는지 다시 한번 점검하세요.
      </p>
    </div>

    <template #cta>
      <AppButton variant="strong" @click="navigateTo(`/settle/${planId}/asset-review`)">
        화면으로 돌아가기
      </AppButton>
    </template>
  </GuideFrame>
</template>
