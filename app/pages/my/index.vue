<script setup lang="ts">
import { useDashboardApi, type Dashboard } from '~/api/dashboard';
import { usePlanApi } from '~/api/plan';
import { usePropertyApi } from '~/api/property';
import { useRegionApi } from '~/api/region';
import { useAuthStore } from '~/stores/auth';
import { currentPlan } from '~/utils/currentPlan';
import { messageFrom } from '~/utils/error';
import { STAGE_CHIP, displayStage } from '~/utils/stage';

// 브라우저 탭 제목.
useHead({ title: '마이 홈' });

/**
 * MY-01 마이.
 *
 * 프로필 한 장과 줄 목록 두 묶음이다. 여기서 값을 고치지는 않는다 —
 * 고치는 화면은 이미 각 루에 있고, 여기는 그리로 보내는 문 역할만 한다.
 */
definePageMeta({ middleware: 'auth' });

const auth = useAuthStore();
const planId = ref<number | null>(null);
const dashboard = ref<Dashboard | null>(null);
const regionName = ref('');
const propertyCount = ref<number | null>(null);
const pending = ref(true);
const error = ref('');

const name = computed(() => auth.user?.name ?? '루키');
const chip = computed(() => STAGE_CHIP[displayStage(dashboard.value?.currentStage ?? 'FIRST')]);

/** "2026년 12월 · 서울 강남구". 지역을 못 읽으면 날짜만 보여준다. */
const goal = computed(() => {
  const date = dashboard.value?.targetMoveDate;
  const month = date ? `${date.slice(0, 4)}년 ${Number(date.slice(5, 7))}월` : '';
  return [month, regionName.value].filter(Boolean).join(' · ') || '아직 정하지 않았어요';
});

const progress = computed(() => {
  const found = dashboard.value?.progress;
  if (!found) return '—';
  return `준비 ${found.progressPercent}% · 할 일 ${found.completedTasks}/${found.totalTasks}`;
});

const materials = computed(() => [
  { label: '진단 결과', value: '스펙 매칭', to: `/result/${planId.value}/spec` },
  {
    label: '등록한 매물',
    value: propertyCount.value === null ? '' : `${propertyCount.value}건`,
    to: `/property/${planId.value}`,
  },
  { label: '저장함', value: '정책 목록', to: '/my/saved' },
]);

onMounted(async () => {
  if (!auth.user) auth.fetchMe().catch(() => {});

  planId.value = await currentPlan.resolve();
  if (!planId.value) {
    pending.value = false;
    return;
  }

  const id = planId.value;
  try {
    dashboard.value = await useDashboardApi().get(id);
  } catch (cause) {
    error.value = messageFrom(cause, '내 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    pending.value = false;
  }

  // 목표 지역과 매물 수는 프로필을 채우는 곁가지다. 실패해도 화면은 남는다.
  usePlanApi()
    .input(id)
    .then(async ({ regionId }) => {
      if (!regionId) return;
      const options = await useRegionApi().jeonseOptions();
      regionName.value = options.find((option) => option.id === regionId)?.name ?? '';
    })
    .catch(() => {});

  usePropertyApi()
    .candidates(id)
    .then((list) => (propertyCount.value = list.length))
    .catch(() => {});
});
</script>

<template>
  <PhoneFrame>
    <div class="h-statusbar bg-surface shrink-0" />

    <header
      class="h-topbar px-gutter-tight border-line bg-surface flex shrink-0 items-center gap-2.5 border-b"
    >
      <button
        type="button"
        class="text-ink -ml-1 p-1"
        aria-label="뒤로"
        @click="navigateTo('/home')"
      >
        <AppIcon name="chevron-left" class="size-icon" />
      </button>
      <h1 class="text-headline2 text-ink">마이</h1>
    </header>

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 pt-4 pb-6">
      <p v-if="pending" class="text-label2 text-ink-muted">내 정보를 불러오는 중이에요…</p>
      <p v-else-if="error" class="text-label2 text-danger">{{ error }}</p>

      <div v-else class="rounded-card border-line bg-surface flex flex-col gap-3 border p-4">
        <div class="flex items-center gap-2">
          <span class="text-headline2 text-ink flex-1">{{ name }}</span>
          <span
            v-if="planId"
            class="bg-surface-info rounded-pill text-caption1 text-primary-deep px-2 py-1"
          >
            {{ chip }}
          </span>
        </div>

        <div class="flex gap-2.5">
          <span class="text-label2 text-ink-muted shrink-0">목표</span>
          <span class="text-numeric text-ink">{{ goal }}</span>
        </div>

        <div class="flex gap-2.5">
          <span class="text-label2 text-ink-muted shrink-0">진행</span>
          <span class="text-numeric text-ink">{{ progress }}</span>
        </div>
      </div>

      <div v-if="planId" class="rounded-card border-line bg-surface flex flex-col border p-4">
        <h2 class="text-headline2 text-ink pb-1">내 자료</h2>
        <RowChevron
          v-for="(row, index) in materials"
          :key="row.label"
          :label="row.label"
          :value="row.value"
          :last="index === materials.length - 1"
          @select="navigateTo(row.to)"
        />
      </div>

      <div class="rounded-card border-line bg-surface flex flex-col border p-4">
        <h2 class="text-headline2 text-ink pb-1">내 정보</h2>
        <RowChevron label="입력값 수정" value="소득·자산" @select="navigateTo('/my/inputs')" />
        <RowChevron label="연결 관리" value="오픈뱅킹" @select="navigateTo('/my/connections')" />
        <RowChevron label="설정" value="알림·약관" last @select="navigateTo('/my/settings')" />
      </div>
    </div>
  </PhoneFrame>
</template>
