<script setup lang="ts">
/**
 * 3루 7 · 전입세대확인서 상세.
 *
 * 창구에서 할 말을 그대로 둔다. **성명 가림 없이** 를 안 말하면 마스킹된
 * 게 나오고 은행이 안 받는다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const STEPS = [
  { title: '정부24에서 사전 신청', note: '대기 없이 받으려면' },
  { title: '주민센터 방문', note: '' },
  { title: '지참물: 신분증 + 임대차계약서 원본', note: '' },
  { title: '수수료 300원, 5분 소요', note: '' },
];

const SCRIPTS = [
  '"은행 제출용이라 성명 가림 없이 부탁드립니다"',
  '"지번 주소와 도로명 주소 두 버전 모두 조회해주세요"',
];

const checked = ref<Record<string, boolean>>({});
</script>

<template>
  <GuideFrame title="전입세대확인서 상세" @back="navigateTo(`/contract/${planId}/resident-cert`)">
    <div class="bg-badge-warning rounded-field flex flex-col gap-1.5 p-3.5">
      <p class="text-label2 text-warning-strong font-semibold">해당하는 경우에만 필요해요</p>
      <p class="text-caption2 text-ink-hero">
        다가구·단독주택 + 안심전세(HUG) 담보일 때만 발급. 다세대주택이면 이 단계는 건너뛰어도 돼요.
      </p>
    </div>

    <h2 class="text-option text-ink-hero px-1 pt-2">발급 방법 · 온라인 안 됨</h2>

    <AppCard class="flex flex-col gap-2">
      <CheckItem
        v-for="step in STEPS"
        :key="step.title"
        v-model="checked[step.title]"
        tone="filled"
      >
        {{ step.title }}
        <template v-if="step.note" #note>{{ step.note }}</template>
      </CheckItem>
    </AppCard>

    <h2 class="text-option text-ink-hero px-1 pt-2">창구에서 이렇게 말해요</h2>

    <p
      v-for="line in SCRIPTS"
      :key="line"
      class="bg-surface-info rounded-field text-caption2 text-ink-hero px-3.5 py-3 font-medium"
    >
      {{ line }}
    </p>

    <div class="bg-surface-info rounded-field flex flex-col gap-1.5 p-3.5">
      <p class="text-label2 text-primary-strong font-semibold">다가구면 확정일자 부여현황도 함께</p>
      <p class="text-caption2 text-ink-hero">주민센터에서 같이 발급받으세요.</p>
    </div>

    <template #cta>
      <AppButton variant="strong" @click="navigateTo(`/contract/${planId}/resident-cert`)">
        화면으로 돌아가기
      </AppButton>
    </template>
  </GuideFrame>
</template>
