<script setup lang="ts">
import { usePropertyApi, type PropertyPolicyVerdict } from '~/api/property';
import { KB_LAND_URL } from '~/components/property/links';
import { messageFrom } from '~/utils/error';
import { COACH_TIME } from '~/components/property/coachSheets';
import { SECOND_BASE_STEPS } from '~/components/property/steps';

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

/** ⓘ 와 오른쪽 아래 FAB 이 같은 시트를 연다. */
const coachOpen = ref(false);
</script>

<template>
  <StageShell :coach-sheets="[COACH_TIME.preContract]" brand base="2루">
    <div class="bg-canvas-soft flex min-h-full flex-col gap-3 px-4 pt-4 pb-6">
      <SubStep :steps="SECOND_BASE_STEPS" :current="0" />

      <p class="text-caption1 text-ink-label font-medium">2루 · 매물 등록</p>

      <div class="flex w-full items-center gap-2">
        <h1 class="text-question text-ink-card flex-1">매물 목록</h1>
        <span class="text-label2 text-ink-label">{{ properties.length }}/{{ MAX_PROPERTIES }}</span>
      </div>

      <!--
        신호등 네 색의 뜻을 목록 머리에 한 줄로 적는다(시안 `687:14221`). 카드마다
        글자가 붙어 있긴 하지만, 색이 무슨 순서인지는 여기서만 알 수 있다.
      -->
      <p v-if="properties.length" class="text-micro text-ink-label">
        🔴 불가 · 🟡 등기부 확인 필요 · 🟢 은행 상담 가능 · 🔵 상담 완료
      </p>

      <p v-if="pending" class="text-label2 text-ink-muted">매물을 불러오는 중이에요…</p>
      <p v-else-if="error" class="text-label2 text-danger">{{ error }}</p>

      <div
        v-else-if="!properties.length"
        class="bg-surface border-line rounded-field flex flex-col items-center gap-3 border px-4 pt-9 pb-10 text-center"
      >
        <h2 class="text-section text-ink-strong font-bold">아직 등록한 매물이 없어요</h2>
        <!--
          시안은 이 줄을 노란색(#fbd773)으로 칠했다. 흰 바탕에 노란 14px 은 읽히지
          않아서 본문색으로 둔다 — 색만 바꿔도 뜻이 달라지지 않는 자리다.
        -->
        <p class="text-body3 text-ink-card-body font-bold">
          KB 부동산에서 마음에 드는 매물을 찾아 등록하면 여기에 카드로 쌓여요
        </p>

        <!-- 어디서 찾는지를 글자로만 적으면 2루가 첫 화면에서 멈춘다. 나갈 길을 준다. -->
        <button
          type="button"
          class="bg-kb text-kb-ink rounded-field text-body3 w-full px-4 py-2.5 font-bold"
          @click="navigateTo(KB_LAND_URL, { external: true })"
        >
          KB부동산에서 매물 찾기 ↗
        </button>
      </div>

      <!--
        카드는 STEP 1 허브로 보낸다. 매물 상세로 바로 보내면 아직 STEP 2 에 머문
        매물까지 뒷 화면으로 들어가 입력을 다 하고 저장에서 409 로 막힌다.

        목록 응답에는 단계가 실려 오지 않는다. 여기서 카드마다 `resume` 을 따로
        물어 보낼 수도 있지만, 그러면 탭과 이동 사이에 왕복이 하나 끼고 그 요청이
        실패하면 눌러도 아무 일이 없는 카드가 된다. 허브는 어차피 열리면서 단계를
        묻고 하단 버튼을 그 단계에 맞춰 세운다 — 묻는 자리를 하나로 둔다.
      -->
      <button
        v-for="(property, index) in properties"
        :key="property.propertyId"
        type="button"
        class="text-left"
        @click="navigateTo(`/property/${planId}/${property.propertyId}`)"
      >
        <PropertyCard
          :property="property"
          :label="labelOf(index)"
          :verdicts="verdicts[property.propertyId] ?? []"
        />
      </button>
    </div>

    <template #footer>
      <footer
        class="px-gutter-tight border-line pt-2.5 pb-cta-pad flex shrink-0 flex-col gap-2.5 border-t"
      >
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
