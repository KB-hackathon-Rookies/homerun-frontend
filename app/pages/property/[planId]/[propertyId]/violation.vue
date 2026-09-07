<script setup lang="ts">
import { usePropertyApi } from '~/api/property';
import { messageFrom } from '~/utils/error';

/**
 * 2루 매물 진단 STEP 3 — 위반건축물 확인.
 *
 * 이 값은 자동으로 못 가져온다. 정부24에서 건축물대장을 열람해야 나오고,
 * 열람은 사람이 직접 한다. 그래서 화면이 "가서 보고 오세요" 를 먼저 말하고,
 * 봤다는 확인을 받은 뒤에야 결과를 고를 수 있게 한다 — 안 보고 찍으면
 * 뒤 단계 판정이 통째로 어긋난다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
const propertyId = Number(route.params.propertyId);

const checked = ref(false);
const violation = ref<boolean | null>(null);
const revision = ref(0);
const pending = ref(true);
const saving = ref(false);
const error = ref('');

onMounted(async () => {
  try {
    revision.value = (await usePropertyApi().resume(planId, propertyId)).revision;
  } catch (cause) {
    error.value = messageFrom(cause, '진행 상태를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    pending.value = false;
  }
});

async function next() {
  if (violation.value === null || saving.value) return;

  saving.value = true;
  error.value = '';
  try {
    await usePropertyApi().saveViolation(planId, propertyId, revision.value, violation.value);
    await navigateTo(`/property/${planId}/${propertyId}/detail`);
  } catch (cause) {
    error.value = messageFrom(cause, '저장하지 못했어요. 잠시 후 다시 시도해주세요.');
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
      <h2 class="text-headline1 text-ink-hero">
        정부24에서 건축물대장을 열람해서 위반건축물 여부를 확인해주세요
      </h2>

      <AppCard>
        <p class="text-label2 text-ink-hero-body">
          정부24(gov.kr)에서 건축물대장 열람 → 표제부 상단의 위반건축물 표시를 확인하세요
        </p>
      </AppCard>

      <AppCard>
        <AppCheckbox v-model="checked">표제부 상단의 위반건축물 표시를 확인했다</AppCheckbox>
      </AppCard>

      <!-- 확인했다고 눌러야 결과를 고를 수 있다. 순서가 뒤집히면 확인이 형식이 된다. -->
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
          :disabled="!checked"
          @click="violation = option.value"
        >
          {{ option.label }}
        </button>
      </div>

      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>
    </div>

    <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-cta-pad">
      <AppButton variant="strong" :disabled="violation === null || pending || saving" @click="next">
        {{ saving ? '저장 중…' : '확인 완료, 다음 단계로' }}
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
