<script setup lang="ts">
import { usePlanApi, type PlanInput } from '~/api/plan';
import { missingRequired } from '~/components/my/required';
import { messageFrom } from '~/utils/error';

/**
 * ST-01 진단할 수 없습니다.
 *
 * 막다른 길이 아니라 **몇 칸이 비었다**는 화면이다. 채운 값은 그대로 있고
 * 빠진 것만 채우면 이어서 진단한다는 말을 아래에 둔다.
 *
 * "모름" 으로 넘어갈 수 있는 항목과 다르다. 여기 나오는 것들은 계산식에
 * 직접 들어가서, 비어 있으면 판정 자체가 나오지 않는다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const input = ref<PlanInput | null>(null);
const pending = ref(true);
const error = ref('');

const missing = computed(() => missingRequired(input.value));

onMounted(async () => {
  try {
    input.value = await usePlanApi().input(planId);
  } catch (cause) {
    error.value = messageFrom(cause, '입력값을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    pending.value = false;
  }
});
</script>

<template>
  <PhoneFrame>
    <StatusBar
      title="진단할 수 없습니다"
      badge="입력 부족"
      base="1루"
      @back="navigateTo(`/diagnosis/${planId}`)"
    />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <p v-if="pending" class="text-label2 text-ink-muted">입력값을 확인하는 중이에요…</p>
      <p v-else-if="error" class="text-label2 text-danger">{{ error }}</p>

      <template v-else>
        <SectionCard title="이 값이 없으면 판정이 나오지 않습니다" tone="bad">
          <template #badge>
            <AppBadge tone="negative">필수 {{ missing.length }}건</AppBadge>
          </template>
          <p class="text-label2 text-ink-body">
            '모름'으로도 진행할 수 있는 항목과 달리, 아래 {{ missing.length }}건은 계산 자체에
            필요합니다.
          </p>
        </SectionCard>

        <SectionCard v-if="missing.length" title="부족한 항목">
          <RowChevron
            v-for="(field, index) in missing"
            :key="field.key"
            :label="field.label"
            value="채우러 가기"
            :last="index === missing.length - 1"
            @select="navigateTo(`/diagnosis/${planId}`)"
          />
        </SectionCard>

        <p class="bg-surface-info rounded-cta text-label2 text-primary-strong px-3 py-2.5">
          채운 값은 그대로 보관되어 있어요. {{ missing.length }}건만 채우면 이어서 진단합니다.
        </p>
      </template>
    </div>

    <footer class="px-gutter-tight bg-surface flex shrink-0 pt-2.5 pb-cta-pad">
      <AppButton @click="navigateTo(`/diagnosis/${planId}`)">부족한 값 채우러 가기</AppButton>
    </footer>
  </PhoneFrame>
</template>
