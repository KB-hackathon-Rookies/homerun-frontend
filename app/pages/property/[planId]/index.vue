<script setup lang="ts">
import { usePropertyApi, type PropertyCandidate, type PropertyPolicyVerdict } from '~/api/property';
import { KB_LAND_URL } from '~/components/property/links';
import { acceptsConsultation } from '~/components/property/trafficLight';
import { messageFrom } from '~/utils/error';
import { COACH_TIME } from '~/components/property/coachSheets';

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

const properties = ref<PropertyCandidate[]>([]);
/** 매물 번호 → 상품 판정. 목록 API 에 판정이 실려 오지 않아 카드마다 따로 읽는다. */
const verdicts = ref<Record<number, PropertyPolicyVerdict[]>>({});
const pending = ref(true);
const error = ref('');

const ALPHABET = 'ABCDEFGHIJ';
const labelOf = (index: number) => `${ALPHABET[index] ?? index + 1}매물`;

/**
 * 한 계획에 담을 수 있는 매물 수.
 *
 * 시안 `2루 8 · 매물 목록 (5개 · 등록 마감)` 이 다섯 번째 카드에서 등록 버튼을
 * 잠근다. 잠그지 않으면 여섯 번째 등록 화면까지 들어가 주소를 다 고른 뒤
 * 서버에서 거절당한다 — 되돌릴 수 없는 헛수고다.
 */
const MAX_PROPERTIES = 5;

const full = computed(() => properties.value.length >= MAX_PROPERTIES);

/**
 * 초록·파랑은 등기부 확인을 마쳐 은행 상담으로 갈 수 있다는 신호다. 목록에서
 * 다시 진단 허브를 거치면 오래된 resume 단계가 등기부 화면으로 되돌릴 수 있어,
 * 이 상태는 상담 목록으로 바로 보낸다. 상담 화면도 같은 신호등을 재검사한다.
 */
function openProperty(property: PropertyCandidate) {
  const destination = acceptsConsultation(property.trafficLight)
    ? `/property/${planId}/${property.propertyId}/consultations`
    : `/property/${planId}/${property.propertyId}`;
  return navigateTo(destination);
}

/**
 * 상담까지 끝난 매물. 신호등 BLUE 가 "상담 완료" 다.
 *
 * 시안 `2루 13 · 매물 목록 (상담 완료)` 은 이때 하단에 `다음` 을 하나 더 세워
 * 최종 확정으로 보낸다. 목록에서 나갈 길이 등록뿐이면 상담을 다 끝낸 사람이
 * 카드를 다시 열어 들어가야 한다.
 */
const settled = computed(() => properties.value.find((item) => item.trafficLight === 'BLUE'));

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
  <StageShell
    :coach-sheets="[COACH_TIME.preContract]"
    title="매물"
    base="2루"
    @back="navigateTo(`/result/${planId}/spec`)"
  >
    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <p v-if="pending" class="text-label2 text-ink-muted">매물을 불러오는 중이에요…</p>
      <p v-else-if="error" class="text-label2 text-danger">{{ error }}</p>

      <template v-else>
        <p class="text-caption1 text-ink-label font-medium">2루 · 진단 결과</p>
        <div class="flex items-center justify-between">
          <h1 class="text-section text-ink-card font-bold">매물 목록</h1>
          <span class="text-headline2 text-ink-muted"
            >{{ properties.length }}/{{ MAX_PROPERTIES }}</span
          >
        </div>
        <div class="text-caption2 text-ink-muted flex flex-wrap items-center gap-x-2 gap-y-1">
          <span><i class="bg-danger mr-1 inline-block size-2.5 rounded-full" />불가</span>
          <span
            ><i class="bg-warning-strong mr-1 inline-block size-2.5 rounded-full" />등기부 확인
            필요</span
          >
          <span
            ><i class="bg-success mr-1 inline-block size-2.5 rounded-full" />은행 상담 가능</span
          >
          <span
            ><i class="bg-primary-strong mr-1 inline-block size-2.5 rounded-full" />상담 완료</span
          >
        </div>

        <div
          v-if="!properties.length"
          class="border-line rounded-field flex flex-col items-center gap-3 border px-4 pt-9 pb-10 text-center"
        >
          <h2 class="text-headline1 text-ink-strong">아직 등록한 매물이 없어요</h2>
          <p class="text-body3 text-ink-hero-body font-bold">
            KB 부동산에서 마음에 드는 매물을 찾아 등록하면 여기에 카드로 쌓여요
          </p>

          <!-- 어디서 찾는지를 글자로만 적으면 2루가 첫 화면에서 멈춘다. 나갈 길을 준다. -->
          <button
            type="button"
            class="text-label2 text-primary-strong font-bold"
            @click="navigateTo(KB_LAND_URL, { external: true })"
          >
            KB부동산에서 매물 찾기 ↗
          </button>
        </div>

        <!-- 초록·파랑 매물은 은행 상담으로, 나머지는 현재 진단 단계로 보낸다. -->
        <button
          v-for="(property, index) in properties"
          :key="property.propertyId"
          type="button"
          class="text-left"
          @click="openProperty(property)"
        >
          <PropertyCard
            :property="property"
            :label="labelOf(index)"
            :verdicts="verdicts[property.propertyId] ?? []"
          />
        </button>
      </template>
    </div>

    <template #footer>
      <footer class="px-gutter-tight flex shrink-0 flex-col gap-2.5 pt-2.5 pb-cta-pad">
        <!-- 잠긴 버튼만 두면 왜 안 눌리는지 모른다. 이유를 버튼 위에 적는다. -->
        <p v-if="full" class="text-caption2 text-ink-muted text-center">
          매물은 최대 {{ MAX_PROPERTIES }}개까지 등록할 수 있어요
        </p>

        <AppButton
          :variant="settled ? 'white' : 'strong'"
          :disabled="full"
          @click="navigateTo(`/property/${planId}/new`)"
        >
          + 매물 등록하기
        </AppButton>

        <AppButton
          v-if="settled"
          variant="strong"
          @click="navigateTo(`/property/${planId}/${settled.propertyId}/confirm`)"
        >
          다음 — 최종 확정
        </AppButton>
      </footer>
    </template>
  </StageShell>
</template>
