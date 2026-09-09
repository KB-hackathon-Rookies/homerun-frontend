<script setup lang="ts">
import { usePropertyApi } from '~/api/property';
import { usePropertyStepGuard } from '~/utils/propertyStepGuard';
import { COACH_TIME } from '~/components/property/coachSheets';
import { SECOND_BASE_STEPS } from '~/components/property/steps';

/**
 * 2루 매물 진단 STEP 3 — 위반건축물 확인.
 *
 * 이 값은 자동으로 못 가져온다. 정부24에서 건축물대장을 열람해야 나오고,
 * 열람은 사람이 직접 한다. 그래서 화면이 "가서 보고 오세요" 를 먼저 말한 뒤에
 * 결과를 받는다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
const propertyId = Number(route.params.propertyId);

const violation = ref<boolean | null>(null);
const saving = ref(false);

/** STEP 3 은 워크플로가 VIOLATION 일 때만 저장된다. 앞 STEP 이거나 이미 지났으면 지금 단계로 보낸다. */
const { revision, pending, error, conflict, sync, reportSaveError } = usePropertyStepGuard(
  planId,
  propertyId,
  'violation',
);

async function next() {
  if (violation.value === null || saving.value) return;

  saving.value = true;
  error.value = '';
  conflict.value = false;
  try {
    await usePropertyApi().saveViolation(planId, propertyId, revision.value, violation.value);
    await navigateTo(`/property/${planId}/${propertyId}/detail`);
  } catch (cause) {
    reportSaveError(cause, '저장하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    saving.value = false;
  }
}

/** 안내 줄의 ⓘ 와 오른쪽 아래 FAB 이 같은 시트를 연다. */
const coachOpen = ref(false);
</script>

<template>
  <StageShell
    v-model:coach-open="coachOpen"
    :coach-sheets="[COACH_TIME.buildingLedger]"
    brand
    base="2루"
    @back="navigateTo(`/property/${planId}/${propertyId}`)"
  >
    <div class="bg-canvas-soft flex min-h-full flex-col gap-4 px-4 pt-4 pb-6">
      <SubStep :steps="SECOND_BASE_STEPS" :current="0" />

      <p class="text-caption1 text-ink-label font-medium">2루 · 매물 등록</p>
      <h1 class="text-question text-ink-card">
        정부24에서 건축물대장을 열람해서 위반건축물 여부를 확인해주세요
      </h1>

      <AppCard>
        <p class="text-label2 text-ink-card-body">
          정부24(gov.kr)에서 건축물대장 열람 → 표제부 상단의 위반건축물 표시를 확인하세요
        </p>
      </AppCard>

      <!--
        시안(`687:14055`)의 확인 줄. 체크 동그라미 없이 글자만 있고, 14px 한 줄이다.

        ⓘ 는 이 줄에 붙인다. `확인했다` 를 읽는 순간이 "그래서 뭘 보라는 거지" 가
        떠오르는 때라, 거기서 `건축물대장 보는 법` 을 편다.
      -->
      <AppCard>
        <div class="flex items-center gap-1.5">
          <p class="text-body3 text-ink-strong font-medium">
            표제부 상단의 위반건축물 표시를 확인했다
          </p>
          <InfoDot @click="coachOpen = true" />
        </div>
      </AppCard>

      <div class="flex gap-2">
        <button
          v-for="option in [
            { value: false, label: '정상' },
            { value: true, label: '위반' },
          ]"
          :key="option.label"
          type="button"
          class="rounded-field text-body2 h-12 flex-1 font-bold transition-colors disabled:opacity-50"
          :class="
            violation === option.value
              ? 'bg-primary-strong text-white'
              : 'bg-canvas text-ink-hero-body'
          "
          @click="violation = option.value"
        >
          {{ option.label }}
        </button>
      </div>

      <StepNotice :message="error" :conflict="conflict" @retry="sync" />
    </div>

    <template #footer>
      <StepFooter
        :disabled="violation === null || pending || saving"
        @back="navigateTo(`/property/${planId}/${propertyId}`)"
        @next="next"
      >
        {{ saving ? '저장 중…' : '확인 완료, 다음 단계로' }}
      </StepFooter>
    </template>
  </StageShell>
</template>
