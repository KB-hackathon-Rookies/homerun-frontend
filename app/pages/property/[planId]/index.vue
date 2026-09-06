<script setup lang="ts">
import { usePropertyApi, type PropertyPolicyVerdict } from '~/api/property';
import { messageFrom } from '~/utils/error';

/**
 * 2루 매물 목록.
 *
 * 빈 화면과 채워진 화면이 한 페이지다. 카드가 없을 때만 안내로 바뀐다 —
 * 빈 상태를 따로 만들면 첫 매물을 등록한 순간 다른 화면으로 튄 것처럼 보인다.
 *
 * 카드 이름은 서버에 없다. 매물마다 "A매물 · B매물" 로 등록 순서를 붙인다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const { candidates, policyVerdicts } = usePropertyApi();

const properties = ref<Awaited<ReturnType<typeof candidates>>>([]);
/** 매물 번호 → 상품 판정. 목록 API 에 판정이 실려 오지 않아 카드마다 따로 읽는다. */
const verdicts = ref<Record<number, PropertyPolicyVerdict[]>>({});
const pending = ref(true);
const error = ref('');

const ALPHABET = 'ABCDEFGHIJ';
const labelOf = (index: number) => `${ALPHABET[index] ?? index + 1}매물`;

onMounted(async () => {
  try {
    properties.value = await candidates(planId);
  } catch (cause) {
    error.value = messageFrom(cause, '매물을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
    return;
  } finally {
    pending.value = false;
  }

  // 판정은 카드마다 따로 온다. 하나가 실패해도 나머지 카드는 그려야 한다.
  await Promise.all(
    properties.value.map(async (property) => {
      try {
        const result = await policyVerdicts(planId, property.propertyId);
        verdicts.value[property.propertyId] = result.results;
      } catch {
        verdicts.value[property.propertyId] = [];
      }
    }),
  );
});
</script>

<template>
  <PhoneFrame>
    <StageBar title="매물" base="2루" @back="navigateTo(`/result/${planId}/spec`)" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <p v-if="pending" class="text-label2 text-ink-muted">매물을 불러오는 중이에요…</p>
      <p v-else-if="error" class="text-label2 text-danger">{{ error }}</p>

      <div
        v-else-if="!properties.length"
        class="border-line rounded-field flex flex-col items-center gap-3 border px-4 pt-9 pb-10 text-center"
      >
        <h2 class="text-headline1 text-ink-strong">아직 등록한 매물이 없어요</h2>
        <p class="text-body3 text-ink-hero-body font-bold">
          KB 부동산에서 마음에 드는 매물을 찾아 등록하면 여기에 카드로 쌓여요
        </p>
      </div>

      <PropertyCard
        v-for="(property, index) in properties"
        :key="property.propertyId"
        :property="property"
        :label="labelOf(index)"
        :verdicts="verdicts[property.propertyId] ?? []"
      />
    </div>

    <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-6">
      <AppButton variant="strong" @click="navigateTo(`/property/${planId}/new`)">
        + 매물 등록하기
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
