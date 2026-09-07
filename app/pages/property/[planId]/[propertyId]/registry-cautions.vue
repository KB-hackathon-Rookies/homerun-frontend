<script setup lang="ts">
/**
 * 2-2c 코치 타임 — 주의사항 4가지.
 *
 * 등기부를 처음 보는 사람이 놓치는 것만 모았다. 특히 4번 — 기본값으로 떼면
 * 해결된 사고 이력이 안 보인다. 깨끗해 보이는 게 깨끗한 게 아니다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
const propertyId = Number(route.params.propertyId);

const CAUTIONS = [
  '위에서 아래 순서가 시간순이에요. 아래에 적힌 내용일수록 최신 정보예요',
  '앱으로도 볼 수 있어요',
  '압류, 경매, 신탁, 임차권등기 문구가 있으면 한 번 더 체크하세요',
  "'말소사항 포함'으로 떼야 모든 이력이 보여요 — '현재 유효사항'으로 떼면 해결된 사항의 빨간 줄이 안 보여서 깔끔하게만 나와요",
];
</script>

<template>
  <PhoneFrame>
    <StageBar
      title="주의사항 4가지"
      base="2루"
      @back="navigateTo(`/property/${planId}/${propertyId}/registry-guide`)"
    />

    <div class="px-gutter-tight flex flex-1 flex-col gap-4 pt-5 pb-6">
      <h2 class="text-option text-ink-hero">등기부등본 볼 때 주의사항 4가지</h2>

      <div
        v-for="(caution, index) in CAUTIONS"
        :key="caution"
        class="bg-surface border-line rounded-field flex items-center gap-2.5 border p-3.5"
      >
        <span
          class="bg-primary-strong text-caption1 grid size-6 shrink-0 place-items-center rounded-full text-white"
          aria-hidden="true"
        >
          {{ index + 1 }}
        </span>
        <p class="text-body3 text-ink-hero flex-1">{{ caution }}</p>
      </div>

      <AppCard class="flex flex-col gap-1.5">
        <p class="text-body3 text-primary-strong font-semibold">"중고차 거래와 비슷해요</p>
        <p class="text-body3 text-primary-strong">
          어떤 사고가 있었고 어디를 수리했는지 알고 사는 차와 지금 깨끗해 보여서 그냥 산 차는
          다르니까"
        </p>
      </AppCard>
    </div>

    <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-cta-pad">
      <AppButton
        variant="strong"
        @click="navigateTo(`/property/${planId}/${propertyId}/registry-check`)"
      >
        확인 완료, 체크리스트로
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
