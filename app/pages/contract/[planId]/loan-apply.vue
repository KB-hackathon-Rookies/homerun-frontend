<script setup lang="ts">
/**
 * 3루 9 · 대출 신청 (D-10).
 *
 * **신청이 두 개**라는 걸 먼저 말한다. 대출과 보증이 따로 심사되는데
 * 하나만 낸 줄 알고 기다리다 잔금일을 넘기는 일이 있다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const DOCS = [
  '확정일자부 임대차계약서 원본',
  '계약금 이체확인증',
  '임대인 통장 사본',
  '신분증',
  '주민등록등본, 가족관계증명서',
  '건강보험 자격득실확인서, 재직증명서, 원천징수영수증',
  '등기사항전부증명서, 건축물대장',
  '우대금리 서류 3종 (청년버팀목만)',
];

const checked = ref<Record<string, boolean>>({});
</script>

<template>
  <PhoneFrame>
    <StageBar
      title="D-10 대출 신청"
      base="3루"
      @back="navigateTo(`/contract/${planId}/resident-cert`)"
    />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <CoachTip>
        이제 은행에 가서 정식으로 신청. 은행은 두 번 가게 돼 — 사전상담 1번, 대출 신청 1번
      </CoachTip>

      <h2 class="text-body3 text-ink-hero font-bold">신청은 두 개</h2>

      <AppCard class="flex flex-col gap-2">
        <p class="text-caption2 text-ink-hero font-semibold">
          ① 대출 신청 → 수탁은행 ② 보증 신청 → HF 또는 HUG
        </p>
        <p class="text-micro text-ink-hero-body">
          · 기금e든든 비대면 : 대출 온라인, 보증 신청은 영업점 방문
        </p>
        <p class="text-micro text-ink-hero-body">· 은행 창구 대면 : 대출과 보증을 한 번에</p>
      </AppCard>

      <h2 class="text-body3 text-ink-hero font-bold">챙길 것</h2>

      <CheckItem v-for="doc in DOCS" :key="doc" v-model="checked[doc]">{{ doc }}</CheckItem>

      <p class="bg-warning-strong rounded-chip text-micro p-3 font-bold text-white">
        💡 질권설정 통지가 임대인에게 도달하지 않으면 대출이 진행 안 될 수 있어요. 미리 알려두세요
      </p>

      <DetailLink @open="navigateTo(`/contract/${planId}/documents`)">
        서류 발급 방법 보기
      </DetailLink>

      <DetailLink @open="navigateTo(`/contract/${planId}/loan-apply-detail`)">
        신청 두 갈래·서류·질권설정 상세보기
      </DetailLink>
    </div>

    <footer class="px-gutter-tight flex shrink-0 gap-2 pt-2.5 pb-cta-pad">
      <div class="w-28 shrink-0">
        <AppButton variant="white" @click="navigateTo(`/contract/${planId}/resident-cert`)">
          이전
        </AppButton>
      </div>
      <AppButton variant="strong" @click="navigateTo(`/contract/${planId}/review`)">
        신청 완료
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
