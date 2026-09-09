<script setup lang="ts">
import { usePolicyApi, type PreferentialRateChange } from '~/api/policy';
import { usePropertyApi } from '~/api/property';
import { useSettlementApi, type RateCutRight } from '~/api/settlement';
import { statusFrom } from '~/utils/error';
import { HOME_STEPS } from '~/components/home/steps';
import { COACH_TIME } from '~/components/home/coachSheets';

/**
 * 홈 4-6 · 금리인하요구권.
 *
 * 은행 자체 대출을 받은 사람만 해당된다. 버팀목은 국토부 고시 금리라
 * 은행이 깎아 줄 권한 자체가 없다 — 대신 연장 시점에 우대금리 조건을
 * 더 채웠는지를 본다.
 *
 * 그래서 이 화면은 내 상품이 무엇이냐를 먼저 말하고 시작한다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const product = ref<string | null>(null);
/** 새로 채운 우대금리 조건. 기금대출 쪽의 대안이다. */
const changes = ref<PreferentialRateChange[]>([]);
const guide = ref<RateCutRight | null>(null);
/** 대출이 아직 등록되지 않았는가(404). 판정이 실행된 대출 상품에서 나온다. */
const needsLoan = ref(false);
/** 조회가 실패했는가. 대출을 안 넣은 것(404)과 못 읽은 것을 섞으면 안 된다. */
const guideFailed = ref(false);
const decisionFailed = ref(false);

const eligible = computed(() => guide.value?.applicable ?? null);

const TRIGGERS = [
  '취업 (무직에서 재직으로)',
  '승진·이직으로 소득 증가',
  '신용점수 상승',
  '다른 대출 상환으로 부채 감소',
];

const METHODS = [
  { name: '기금대출 (버팀목)', how: '우대금리 조건 추가 충족 (연장 시)' },
  { name: '은행 자체 대출', how: '금리인하요구권 신청' },
];

onMounted(() => {
  usePropertyApi()
    .decision(planId)
    .then((found) => (product.value = found.consultation?.loanProduct ?? null))
    .catch(() => (decisionFailed.value = true));

  useSettlementApi()
    .rateCutRight(planId)
    .then((found) => (guide.value = found))
    .catch((cause) => {
      // 대출 미등록이면 404 다. 판정을 지어내지 않고 등록부터 안내한다.
      // 그 밖의 실패는 "안 넣었다" 가 아니라 "못 읽었다" 라 따로 말한다 — 전에는
      // 아무것도 띄우지 않아서, 화면이 비어 있는 이유를 알 길이 없었다.
      if (statusFrom(cause) === 404) needsLoan.value = true;
      else guideFailed.value = true;
    });

  usePolicyApi()
    .preferentialRateChanges(planId)
    .then((found) => (changes.value = found))
    .catch(() => {});
});

/** ⓘ 와 오른쪽 아래 FAB 이 같은 시트를 연다. */
const coachOpen = ref(false);
</script>

<template>
  <StageShell v-model:coach-open="coachOpen" :coach-sheets="[COACH_TIME.rateCut]" brand base="홈">
    <div class="bg-canvas-soft flex min-h-full flex-col gap-3 px-4 pt-4 pb-6">
      <SubStep :steps="HOME_STEPS" :current="4" />

      <h1 class="text-question text-ink-card">금리인하요구권</h1>

      <!-- 판정은 실행된 대출 상품에서 나온다. 없으면 대상 여부를 단정하지 않는다. -->
      <div v-if="needsLoan" class="bg-surface-info rounded-field flex flex-col gap-2 p-4">
        <p class="text-card-title text-primary-strong font-bold">대출 정보를 먼저 등록해주세요</p>
        <p class="text-step text-ink-hero-body font-normal">
          실행된 대출 상품을 알아야 금리인하요구권 대상인지 판단할 수 있어요
        </p>
        <button
          type="button"
          class="bg-surface rounded-chip text-label2 text-primary-strong self-start px-3.5 py-2.5 font-semibold"
          @click="navigateTo(`/settle/${planId}/loan-account`)"
        >
          실행 대출 등록하러 가기 →
        </button>
      </div>

      <!--
        못 읽었을 뿐인데 화면이 비면 대상이 아닌 것으로 읽힌다. 그래서 이유를 적는다.
        다만 대출 등록 안내가 먼저다 — 그건 지금 할 수 있는 일이고 이건 기다리는 일이다.
      -->
      <div
        v-else-if="guideFailed || decisionFailed"
        class="bg-badge-warning rounded-field flex flex-col gap-2 p-4"
      >
        <p class="text-card-title text-warning-strong font-bold">정보를 불러오지 못했어요</p>
        <p class="text-step text-ink-hero-body font-normal">
          금리인하요구권 대상인지 아직 판단하지 못했어요. 대상이 아니라는 뜻은 아니에요 — 잠시 후
          다시 열어봐 주세요.
        </p>
      </div>

      <div
        v-if="eligible !== null"
        class="bg-surface-brand rounded-field flex flex-col gap-1 p-3.5"
      >
        <p class="text-caption-tight text-ink-hero-body font-normal">
          내 상품 · {{ eligible ? '은행 자체 대출' : '기금대출 (버팀목)' }}
        </p>
        <p class="text-card-title font-bold" :class="eligible ? 'text-safe' : 'text-danger-deep'">
          {{ eligible ? '금리인하요구권 대상' : '금리인하요구권 비대상' }}
        </p>
        <p class="text-step text-ink-hero-body font-normal">
          {{
            eligible
              ? '아래 사유가 생겼다면 은행에 바로 신청하세요'
              : '대신 연장 시점에 우대금리 항목 추가 충족을 확인해드려요'
          }}
        </p>
      </div>

      <!-- 기금대출 쪽 대안. 새로 채운 조건이 있을 때만 뜬다. -->
      <AppCard v-if="changes.length" class="flex flex-col gap-1.5">
        <p class="text-row text-ink-hero">새로 채운 우대금리 조건</p>
        <p
          v-for="change in changes"
          :key="change.code"
          class="text-caption-tight text-ink-hero font-normal"
        >
          • {{ change.label }} · {{ change.rateBonus }}%p
        </p>
      </AppCard>

      <h2 class="text-card-title text-ink-hero font-bold">상품별 금리 인하 방법</h2>

      <AppCard class="flex flex-col gap-2">
        <div v-for="row in METHODS" :key="row.name" class="flex flex-col gap-0.5">
          <p class="text-caption-tight text-ink-hero font-bold">{{ row.name }}</p>
          <p class="text-step text-ink-hero-body font-normal">→ {{ row.how }}</p>
        </div>
      </AppCard>

      <h2 class="text-card-title text-ink-hero font-bold">은행 대출 · 요구권 신청 시점</h2>

      <p
        v-for="trigger in TRIGGERS"
        :key="trigger"
        class="bg-surface border-line rounded-chip text-caption-tight text-ink-hero border px-3.5 py-2.5 font-normal"
      >
        · {{ trigger }}
      </p>

      <p class="bg-surface-info rounded-chip text-micro text-ink-hero-body p-2.5">
        영업점·인터넷뱅킹·앱으로 신청해요. 횟수 제한은 없지만 심사에 따라 반영되지 않을 수도 있어요
      </p>

      <DetailLink @open="navigateTo(`/settle/${planId}/rate-cut-detail`)">
        금리인하요구권 상세보기
      </DetailLink>
    </div>

    <!--
      시안의 주 버튼은 "은행에 신청" 이다. 다만 비대상(기금대출)에게 그 말을
      띄우면 헛걸음을 시킨다 -- 대상일 때만 신청 방법으로 보내고, 그 밖에는
      확인으로 둔다.
    -->
    <template #footer>
      <footer class="px-gutter-tight bg-surface flex shrink-0 gap-2.5 pt-2.5 pb-cta-pad">
        <div class="w-29 shrink-0">
          <AppButton variant="white" @click="navigateTo(`/settle/${planId}`)">이전</AppButton>
        </div>
        <div class="flex-1">
          <AppButton
            v-if="eligible"
            variant="strong"
            @click="navigateTo(`/settle/${planId}/rate-cut-detail`)"
          >
            은행에 신청
          </AppButton>
          <AppButton v-else variant="strong" @click="navigateTo(`/settle/${planId}`)"
            >확인</AppButton
          >
        </div>
      </footer>
    </template>
  </StageShell>
</template>
