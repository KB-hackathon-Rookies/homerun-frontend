<script setup lang="ts">
import { COACH_MODULES, MODULE_BASES, type CoachModule } from '~/components/coach/modules';
import { educationCode, useEducationApi } from '~/api/education';
import { useCoachProgress } from '~/composables/useCoachProgress';

/**
 * 메인 6 · 코치 교육 허브.
 *
 * 모듈을 루별로 묶어 보여준다. 번호는 그룹 안에서 다시 세지 않고 **전체를 통으로**
 * 센다 — 시안이 3루 첫 항목을 7번, 홈 첫 항목을 10번으로 적어 두었다. 사용자에게
 * 열세 개짜리 한 묶음이지 그룹마다 처음부터인 게 아니다.
 *
 * '준비 중' 은 로컬 번들에 본문이 없고 **백엔드에도 본문이 없을 때만** 붙인다.
 * 백엔드(GET /education/modules)가 모듈별 hasContent 를 주므로, 번들에 아직 안 담긴
 * 모듈이라도 서버에 콘텐츠가 있으면 열 수 있다(상세는 서버 본문을 그대로 렌더한다).
 */
definePageMeta({ middleware: 'auth' });

const { isDone } = useCoachProgress();

/** 백엔드에 본문이 있는 code 집합. 목록을 못 불러오면 비어 있어 로컬 본문만으로 판단한다. */
const serverContentCodes = ref<Set<string>>(new Set());

onMounted(async () => {
  try {
    const modules = await useEducationApi().list();
    serverContentCodes.value = new Set(modules.filter((m) => m.hasContent).map((m) => m.code));
  } catch {
    // 목록 조회가 안 되면 로컬 본문만으로 '준비 중'을 정한다. 화면은 그대로 뜬다.
  }
});

/** 열 수 있는 모듈인가 — 번들에 본문이 있거나 백엔드에 콘텐츠가 있으면. */
function hasContent(module: CoachModule) {
  if (module.body) return true;
  const code = educationCode(module.id, COACH_MODULES);
  return code !== null && serverContentCodes.value.has(code);
}

/** 전체 통번호. 그룹으로 나누기 전에 순서를 먼저 매긴다. */
const numbered = computed(() =>
  COACH_MODULES.map((module, index) => ({ module, order: index + 1 })),
);

const groups = computed(() =>
  MODULE_BASES.map((base) => ({
    base,
    rows: numbered.value.filter((row) => row.module.base === base),
  })).filter((group) => group.rows.length > 0),
);

const doneCount = computed(() => COACH_MODULES.filter((module) => isDone(module.id)).length);
const percent = computed(() => Math.round((doneCount.value / COACH_MODULES.length) * 100));
</script>

<template>
  <PhoneFrame fill>
    <div class="h-statusbar bg-surface shrink-0" />
    <BrandBar />
    <PageBar title="코치 교육" />

    <div class="bg-canvas-soft flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pt-4 pb-6">
      <div class="bg-primary-strong rounded-button flex flex-col gap-2.5 p-4">
        <p class="text-caption-tight text-on-brand-body font-medium">전세 코치 교육 모듈</p>
        <p class="text-metric text-on-brand">
          {{ COACH_MODULES.length }}개 중 {{ doneCount }}개 완료
        </p>

        <div class="bg-on-brand-line rounded-pill h-1.5 overflow-hidden">
          <div class="bg-on-brand rounded-pill h-full" :style="{ width: `${percent}%` }" />
        </div>

        <p class="text-caption-tight text-on-brand-body">
          루마다 필요한 순간에 코치가 알려주는 내용을 미리 볼 수 있어
        </p>
      </div>

      <template v-for="group in groups" :key="group.base">
        <h2 class="text-row text-ink-label font-bold">{{ group.base }}</h2>

        <div class="bg-surface border-line-list rounded-button flex flex-col border px-4 py-1">
          <button
            v-for="(row, index) in group.rows"
            :key="row.module.id"
            type="button"
            class="border-surface-muted flex items-center gap-3 py-3 text-left"
            :class="index === group.rows.length - 1 ? '' : 'border-b'"
            @click="navigateTo(`/coach/${row.module.id}`)"
          >
            <!-- 다 읽은 항목은 번호 대신 체크. 파란 원이라 눈에 먼저 들어온다. -->
            <span
              class="rounded-pill flex size-7 shrink-0 items-center justify-center"
              :class="isDone(row.module.id) ? 'bg-primary-strong' : 'bg-surface-muted'"
            >
              <AppIcon v-if="isDone(row.module.id)" name="check" class="text-on-brand size-3.5" />
              <span v-else class="text-caption-tight text-ink-label font-bold">
                {{ row.order }}
              </span>
            </span>

            <!-- 다 읽은 줄은 제목까지 흐려진다. 남은 것이 먼저 보여야 한다. -->
            <span class="flex flex-1 flex-col gap-0.5">
              <span
                class="text-card-title font-bold"
                :class="isDone(row.module.id) ? 'text-ink-label' : 'text-ink-card'"
              >
                {{ row.module.title }}
              </span>
              <span class="text-micro text-ink-label font-medium">
                {{ row.module.minutes }}분<template v-if="isDone(row.module.id)"> · 완료</template>
                <template v-else-if="!hasContent(row.module)"> · 준비 중</template>
              </span>
            </span>

            <AppIcon name="chevron-right" class="text-ink-chevron size-4 shrink-0" />
          </button>
        </div>
      </template>
    </div>
  </PhoneFrame>
</template>
