<script setup lang="ts">
import { usePropertyApi } from '~/api/property';
import type { PillOption } from '~/components/prep/PillGroup.vue';
import { useProperty } from '~/composables/useProperty';
import { HOUSE_TYPE_LABEL } from '~/utils/labels';
import { usePropertyStepGuard } from '~/utils/propertyStepGuard';

/**
 * 2루 매물 진단 STEP 2 — 주택유형·전용면적.
 *
 * 실거래·건축물대장 자동조회로 채워지면 이 화면은 건너뛴다(등록 시 바로 STEP 3).
 * 자동으로 못 가져온 매물만 여기서 사람이 직접 입력한다. 저장하면 워크플로가
 * STEP 3(위반건축물)으로 넘어간다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
const propertyId = Number(route.params.propertyId);

const { property } = useProperty(planId, propertyId);

const HOUSE_TYPE_OPTIONS: PillOption[] = Object.entries(HOUSE_TYPE_LABEL).map(([value, label]) => ({
  value,
  label,
}));

const houseType = ref<string | null>(null);
const area = ref('');
const saving = ref(false);

/** STEP 2 는 워크플로가 BUILDING 일 때만 저장된다. 어긋나 있으면 지금 단계 화면으로 보낸다. */
const { revision, pending, error, conflict, sync, reportSaveError } = usePropertyStepGuard(
  planId,
  propertyId,
  'building',
);

/** 자동조회로 일부라도 들어온 값이 있으면 채워 둔다. */
watchEffect(() => {
  if (property.value) {
    houseType.value ??= property.value.houseType;
    if (!area.value && property.value.exclusiveArea !== null) {
      area.value = String(property.value.exclusiveArea);
    }
  }
});

const areaValue = computed(() => Number(area.value.replace(/[^0-9.]/g, '')) || 0);
const canSave = computed(() => !!houseType.value && areaValue.value > 0 && !saving.value);

async function next() {
  if (!canSave.value) return;

  saving.value = true;
  error.value = '';
  conflict.value = false;
  try {
    await usePropertyApi().saveBuilding(
      planId,
      propertyId,
      revision.value,
      houseType.value!,
      areaValue.value,
    );
    await navigateTo(`/property/${planId}/${propertyId}/violation`);
  } catch (cause) {
    reportSaveError(cause, '저장하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <PhoneFrame>
    <StageBar
      title="매물 등록"
      base="2루"
      @back="navigateTo(`/property/${planId}/${propertyId}`)"
    />

    <div class="px-gutter-tight flex flex-1 flex-col gap-4 py-4">
      <h2 class="text-headline1 text-ink-hero">이 매물의 주택유형과 전용면적을 확인해주세요</h2>

      <AppCard>
        <p class="text-label2 text-ink-hero-body">
          자동조회로 확인되지 않아 직접 입력이 필요해요. 건축물대장·계약서의 전용면적을 적어주세요.
        </p>
      </AppCard>

      <div class="flex flex-col gap-2">
        <span class="text-label2 text-ink-body">주택유형</span>
        <PillGroup v-model="houseType" :options="HOUSE_TYPE_OPTIONS" />
      </div>

      <AppInput
        v-model="area"
        label="전용면적"
        type="text"
        inputmode="decimal"
        placeholder="㎡ (예: 44.2)"
      />

      <StepNotice :message="error" :conflict="conflict" @retry="sync" />
    </div>

    <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-cta-pad">
      <AppButton variant="strong" :disabled="!canSave || pending" @click="next">
        {{ saving ? '저장 중…' : '확인 완료, 다음 단계로' }}
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
