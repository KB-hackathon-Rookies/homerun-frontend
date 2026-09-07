<script setup lang="ts">
/**
 * 2루-2 등기부등본 발급 안내.
 *
 * 등기부는 자동으로 못 가져온다. 열람에 돈이 들고 본인 인증이 필요해서
 * 사람이 직접 뗀다. 그래서 이 화면은 저장하는 값이 없다 — 어디서 어떻게
 * 떼는지만 알려준다.
 *
 * '말소사항 포함' 을 굵게 두는 이유가 있다. 기본값인 '현재 유효사항' 으로
 * 떼면 해결된 사고 이력이 안 보여서 깨끗한 집처럼 읽힌다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
const propertyId = Number(route.params.propertyId);

const STEPS = [
  '1. 부동산 등기사항증명서 열람·발급 신청 (부동산 > 열람·발급)',
  "2. '말소사항 포함' 선택 / '현재 유효사항' 선택 X",
  '3. 우선은 열람만 하기 (700원 비용 발생)',
  '4. 저장하고 인쇄해두기',
];

const TIPS = [
  '💡 집합건물(빌라·아파트·오피스텔)은 동호수까지 정확히 입력하세요',
  '💡 단독주택은 건물과 토지를 따로 떼야 해요',
  '💡 은행 사전상담 시 지참해야 하니 미리 인쇄해두세요',
];

const PARTS = [
  '① 표제부 — 집의 기본 정보(소재지·면적·용도)',
  '② 갑구 — 소유권, 압류·가처분·신탁·임차권등기',
  '③ 을구 — 근저당권 설정, 채권최고액',
];
</script>

<template>
  <PhoneFrame>
    <StageBar
      title="등기부등본 발급"
      base="2루"
      @back="navigateTo(`/property/${planId}/${propertyId}/detail`)"
    />

    <div class="px-gutter-tight flex flex-1 flex-col gap-4 py-4">
      <h2 class="text-headline1 text-ink-hero">등기부등본은 직접 확인해야 해요</h2>

      <AppCard class="flex flex-col gap-3">
        <p class="text-body2 text-primary-strong font-bold">인터넷 등기소 (iros.go.kr)</p>
        <p v-for="step in STEPS" :key="step" class="text-label2 text-ink-hero-body">{{ step }}</p>
      </AppCard>

      <AppCard class="flex flex-col gap-3">
        <p v-for="tip in TIPS" :key="tip" class="text-label2 text-ink-hero-body">{{ tip }}</p>
      </AppCard>

      <!-- 셋이 무엇인지까지 여기서 다 풀면 화면이 길어진다. 자세한 건 코치 타임으로 넘긴다. -->
      <button
        type="button"
        class="bg-surface border-line rounded-field flex flex-col gap-3 border p-4 text-left"
        @click="navigateTo(`/property/${planId}/${propertyId}/registry-guide`)"
      >
        <span class="text-body3 text-ink-hero font-bold">등기부등본에서 확인해야 하는 것</span>
        <span v-for="part in PARTS" :key="part" class="text-label2 text-ink-hero-body">
          {{ part }}
        </span>
        <span class="text-label2 text-primary-strong font-bold">각각 무엇인지 보기 →</span>
      </button>
    </div>

    <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-cta-pad">
      <AppButton
        variant="strong"
        @click="navigateTo(`/property/${planId}/${propertyId}/registry-check`)"
      >
        발급 완료, 체크리스트로
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
