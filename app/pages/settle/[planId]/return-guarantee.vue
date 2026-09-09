<script setup lang="ts">
import { usePolicyApi } from '~/api/policy';
import { usePropertyApi, type PropertyDecision } from '~/api/property';
import { useGuaranteeApi, type GuaranteeAgency } from '~/api/guarantee';
import {
  useSettlementApi,
  type ReturnGuaranteeEnrollment,
  type ReturnGuaranteeGuide,
} from '~/api/settlement';
import {
  JOIN_ROUTES,
  RETURN_GUARANTEE_COLLATERALS,
  collateralName,
  includedInCollateral,
} from '~/components/settle/guarantee';
import { messageFrom, statusFrom } from '~/utils/error';
import { collateralLabel } from '~/utils/labels';
import { settlePath } from '~/utils/settle';
import { HOME_STEPS } from '~/components/home/steps';
import { COACH_TIME } from '~/components/home/coachSheets';

/**
 * 홈 4-1 · 반환보증 가입.
 *
 * 전세대출을 받으려면 반환보증이 있어야 하는데, 그게 담보에 딸려 오느냐
 * 따로 드느냐가 갈린다. 안심전세로 받았으면 이 화면은 건너뛰어도 된다 —
 * 그 사실을 맨 위에서 먼저 말한다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const decision = ref<PropertyDecision | null>(null);
/** 내 집 기준으로 어느 기관에 들 수 있는지. 판정을 못 받아도 표는 남는다. */
const joinable = ref<string[] | null>(null);
const guide = ref<ReturnGuaranteeGuide | null>(null);
const agencies = ref<GuaranteeAgency[]>([]);

const collateral = computed(() => decision.value?.consultation?.collateralMethod ?? null);
const included = computed(() => !!collateral.value && includedInCollateral(collateral.value));

/**
 * 가입·납부 사실.
 *
 * 정착 대시보드가 이 기록을 보고 반환보증 칸을 채운다 — 기록이 없으면 가입
 * 안 한 게 아니라 "추적 못 함" 이라, 화면이 남겨 주지 않으면 영영 미가입으로
 * 보인다. 보증료 지원(4-2)도 가입 ∧ 납부라야 열린다.
 */
const api = useSettlementApi();
const enrollment = ref<ReturnGuaranteeEnrollment | null>(null);
const enrolled = ref(false);
const feePaid = ref(false);
const enrolledAt = ref('');
const saving = ref(false);
const saveError = ref('');
const savedOnce = ref(false);

async function saveEnrollment() {
  if (saving.value) return;
  saving.value = true;
  saveError.value = '';
  try {
    enrollment.value = await api.saveReturnGuaranteeEnrollment(planId, {
      enrolled: enrolled.value,
      feePaid: feePaid.value,
      enrolledAt: enrolledAt.value || null,
    });
    savedOnce.value = true;
  } catch (cause) {
    saveError.value = messageFrom(
      cause,
      '가입 상태를 저장하지 못했어요. 잠시 후 다시 시도해주세요.',
    );
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  useSettlementApi()
    .returnGuarantee(planId)
    .then((found) => (guide.value = found))
    .catch(() => {});

  // 기록이 없으면 404 다. 처음 저장하는 것으로 보고 빈 값에서 시작한다.
  api
    .returnGuaranteeEnrollment(planId)
    .then((found) => {
      enrollment.value = found;
      enrolled.value = found.enrolled;
      feePaid.value = found.feePaid;
      enrolledAt.value = found.enrolledAt ?? '';
    })
    .catch((cause) => {
      if (statusFrom(cause) !== 404) {
        saveError.value = messageFrom(cause, '가입 상태를 불러오지 못했어요.');
      }
    });
  useGuaranteeApi()
    .agencies()
    .then((found) => (agencies.value = found))
    .catch(() => {});
  try {
    decision.value = await usePropertyApi().decision(planId);
  } catch {
    return;
  }

  const propertyId = decision.value?.property?.propertyId;
  if (!propertyId) return;

  try {
    const verdicts = await usePolicyApi().evaluateReturnGuarantees(planId, propertyId);
    joinable.value = verdicts.results
      .filter((result) => result.verdict === 'PASS')
      .map((result) => result.policyName);
  } catch {
    joinable.value = null;
  }
});

/** ⓘ 와 오른쪽 아래 FAB 이 같은 시트를 연다. */
const coachOpen = ref(false);
</script>

<template>
  <StageShell
    v-model:coach-open="coachOpen"
    :coach-sheets="[COACH_TIME.returnGuarantee]"
    brand
    base="홈"
  >
    <div class="bg-canvas-soft flex min-h-full flex-col gap-3 px-4 pt-4 pb-6">
      <SubStep :steps="HOME_STEPS" :current="0" />

      <p class="text-caption1 text-ink-label font-medium">홈 · 정착 관리</p>

      <h1 class="text-question text-ink-card">반환보증 가입</h1>

      <!--
        내 담보가 무엇이냐로 이 화면의 쓸모가 갈린다. 담보를 아직 모르면
        단정하지 않고 표만 보여준다.
      -->
      <div
        v-if="collateral"
        class="rounded-field flex flex-col gap-1 p-4"
        :class="included ? 'bg-safe' : 'bg-caution-deep'"
      >
        <p class="text-caption-tight text-on-brand font-normal">
          내 담보 · {{ collateralLabel(collateral) }}
        </p>
        <p class="text-section text-on-brand font-bold">
          {{ guide ? guide.summary : included ? '반환보증 이미 포함' : '반환보증 따로 가입 필요' }}
        </p>
        <p class="text-step text-on-brand font-normal">
          {{
            included
              ? '이 화면은 건너뛰고 바로 보증료 지원 신청으로 가세요'
              : '아래 경로로 가입한 뒤 보증료 지원을 신청하세요'
          }}
        </p>
      </div>

      <!--
        가입했다는 사실은 여기서만 남길 수 있다. 안 남기면 정착 대시보드가
        계속 "추적 못 함" 으로 두고, 보증료 지원도 열리지 않는다.
      -->
      <h2 class="text-card-title text-ink-hero font-bold">내 가입 상태</h2>

      <AppCard class="flex flex-col gap-3">
        <AppCheckbox v-model="enrolled">반환보증에 가입했어요</AppCheckbox>
        <AppCheckbox v-model="feePaid">보증료를 납부했어요</AppCheckbox>

        <div class="flex flex-col gap-1.5">
          <p class="text-label2 text-ink">가입일 (선택)</p>
          <input
            v-model="enrolledAt"
            type="date"
            class="bg-canvas rounded-chip text-body3 text-ink-hero h-11 px-3.5 outline-none"
          />
        </div>

        <AppButton :disabled="saving" @click="saveEnrollment">
          {{ saving ? '저장 중…' : '가입 상태 저장하기' }}
        </AppButton>

        <p v-if="saveError" class="text-label2 text-danger">{{ saveError }}</p>
        <p v-else-if="enrollment" class="text-micro text-ink-hero-body">
          {{
            enrollment.feeSupportApplicable
              ? '가입·납부가 모두 확인돼 보증료 지원을 신청할 수 있어요'
              : '가입과 보증료 납부가 모두 끝나야 보증료 지원을 신청할 수 있어요'
          }}{{ savedOnce ? ' · 저장했어요' : '' }}
        </p>
      </AppCard>

      <h2 class="text-card-title text-ink-hero font-bold">담보별 가입 필요 여부</h2>

      <AppCard class="flex flex-col gap-2">
        <div
          v-for="code in RETURN_GUARANTEE_COLLATERALS"
          :key="code"
          class="flex items-center gap-2 py-1.5"
        >
          <span class="text-row text-ink-hero flex-1">{{ collateralName(code) }}</span>
          <StatusBadge :tone="includedInCollateral(code) ? 'safe' : 'caution'">
            {{ includedInCollateral(code) ? '포함' : '따로 가입' }}
          </StatusBadge>
        </div>

        <p
          v-if="joinable?.length"
          class="text-step text-ink-hero-body border-line-soft border-t pt-2 font-normal"
        >
          내 집 기준으로는 {{ joinable.join(' · ') }}에 들 수 있어요
        </p>
      </AppCard>

      <AppCard v-if="agencies.length" class="flex flex-col gap-3">
        <div v-for="agency in agencies" :key="agency.code" class="flex flex-col gap-0.5">
          <p class="text-row text-ink-hero">{{ agency.name }}</p>
          <p class="text-caption2 text-ink-hero-body">{{ agency.limitBasis }}</p>
          <p v-if="agency.note" class="text-micro text-ink-muted">{{ agency.note }}</p>
        </div>
      </AppCard>

      <div class="bg-surface-brand rounded-field flex flex-col gap-1 p-3.5">
        <p class="text-caption-tight text-ink-hero font-bold">가입 경로 (해당 시)</p>
        <p v-for="line in JOIN_ROUTES" :key="line" class="text-micro text-ink-hero-body">
          {{ line }}
        </p>
      </div>

      <DetailLink @open="navigateTo(`/settle/${planId}/return-guarantee-detail`)">
        반환보증 가입 상세보기
      </DetailLink>
    </div>

    <!--
      필수 요소 넷은 반환보증 → 보증료 지원 → 사후자산심사 → 중개보수 순서다.
      시안 하단 CTA 가 `[이전][다음]` 두 칸인 이유가 이 순서인데, 앞으로 가는
      버튼만 두면 되돌아갈 길이 헤더 화살표뿐이 된다.
    -->
    <template #footer>
      <footer class="px-gutter-tight bg-surface flex shrink-0 gap-2.5 pt-2.5 pb-cta-pad">
        <div class="w-29 shrink-0">
          <AppButton variant="white" @click="navigateTo(`/settle/${planId}`)">이전</AppButton>
        </div>
        <div class="flex-1">
          <AppButton
            variant="strong"
            :disabled="!settlePath('fee-support', planId)"
            @click="navigateTo(settlePath('fee-support', planId)!)"
          >
            보증료 지원 신청
          </AppButton>
        </div>
      </footer>
    </template>
  </StageShell>
</template>
