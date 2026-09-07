<script setup lang="ts">
import { MOVING_SUPPORT_CHECKS } from '~/components/settle/aftercare';

/**
 * 홈 4-4 상세 · 중개보수·이사비 지원.
 *
 * 이 사업은 "내 지역이 올해 하느냐" 가 먼저다. 조건을 아무리 맞춰도 시행하지
 * 않는 지자체면 신청할 곳이 없다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
</script>

<template>
  <GuideFrame title="중개보수·이사비 상세" @back="navigateTo(`/settle/${planId}/moving-support`)">
    <h2 class="text-section text-ink-hero px-1 pt-2">청년 부동산 중개보수 · 이사비 지원사업</h2>

    <AppCard class="flex flex-col gap-2">
      <p class="text-caption-tight text-ink-hero font-normal">
        지자체별로 운영하는 청년 대상 지원사업이에요. 서울·경기 등 각 지자체가 별도 예산으로
        운영해서 조건·금액이 지역마다 달라요.
      </p>

      <div class="bg-surface-info rounded-cta flex flex-col gap-1 px-3 py-2.5">
        <p class="text-caption-tight text-primary-strong font-semibold">
          대상이라면 알림으로 안내드려요
        </p>
        <p class="text-caption-tight text-ink-hero font-normal">
          해당 기간에 배너·알림으로 안내해요. 신청 링크와 필요 서류도 함께 표시됩니다.
        </p>
      </div>
    </AppCard>

    <h2 class="text-section text-ink-hero px-1 pt-2">공통 확인 사항</h2>

    <AppCard class="flex flex-col gap-1.5">
      <p
        v-for="line in MOVING_SUPPORT_CHECKS"
        :key="line"
        class="text-caption-tight text-ink-hero font-normal"
      >
        {{ line }}
      </p>
    </AppCard>

    <h2 class="text-section text-ink-hero px-1 pt-2">놓치지 않기</h2>

    <div class="bg-surface-caution rounded-field flex flex-col gap-1.5 p-3.5">
      <p class="text-row text-caution-deep">예산 선착순 사업</p>
      <p class="text-caption-tight text-ink-hero font-normal">
        모집 공고가 뜨면 바로 신청하세요. 지자체 홈페이지 · 정부24 · 홈런 알림 모두 확인 대상이에요.
      </p>
    </div>

    <template #cta>
      <AppButton variant="strong" @click="navigateTo(`/settle/${planId}/moving-support`)">
        화면으로 돌아가기
      </AppButton>
    </template>
  </GuideFrame>
</template>
