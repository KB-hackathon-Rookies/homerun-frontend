<script setup lang="ts">
import { usePlanApi, type PlanInput } from '~/api/plan';
import { useVerificationApi, type PendingCondition } from '~/api/verification';
import { currentPlan } from '~/utils/currentPlan';
import { messageFrom, statusFrom } from '~/utils/error';
import { formatKoreanMoney } from '~/utils/money';

// 브라우저 탭 제목.
useHead({ title: '입력 정보' });

/**
 * MY-03 입력값 수정.
 *
 * 여기서 고친 값이 판정을 다시 굴린다. 그래서 저장 버튼이 "저장" 이 아니라
 * 무엇이 바뀌는지를 먼저 말한다.
 *
 * 저장은 STEP 병합 저장(`/input/steps/FINANCIAL`)을 쓴다. 전체 스냅샷 저장은
 * 보내지 않은 값을 지우기 때문에, 두 칸만 고치러 들어온 화면에서 쓰면 안 된다.
 */
definePageMeta({ middleware: 'auth' });

const planId = ref<number | null>(null);
const input = ref<PlanInput | null>(null);
const conditions = ref<PendingCondition[]>([]);

const monthlyIncome = ref('');
const netAssets = ref('');

const pending = ref(true);
const saving = ref(false);
const error = ref('');
const saved = ref(false);

const onlyDigits = (text: string) => Number(text.replace(/[^0-9]/g, '')) || 0;

/**
 * 화면은 만 원 단위로 받고 백엔드는 원 단위로 저장한다. 1루 문진(`diagnosis/[planId]/finance.vue`)
 * 과 같은 규칙이라, 거기서 만 원을 배운 사용자가 여기서 300 을 넣어도 300원이 되지 않는다.
 */
const toWon = (text: string) => onlyDigits(text) * 10_000;

/** 저장된 원 단위 값을 편집용 만 원 단위로 되돌린다. 이걸 빼면 열 때마다 값이 만 배씩 커진다. */
const toMan = (won: number | null | undefined) =>
  won === null || won === undefined ? 0 : Math.floor(won / 10_000);

/** 아직 답하지 않은 값은 0 이 아니라 빈 칸으로 둔다. */
const toManText = (won: number | null | undefined) =>
  won === null || won === undefined ? '' : String(toMan(won));

/** 부모와 시·군이 다른지만 저장한다. 주소를 받지 않으므로 "같은 세대" 는 추정이 아니라 그 값의 반대다. */
const household = computed(() => {
  const apart = input.value?.livesApartFromParents;
  if (apart === null || apart === undefined) return '아직 답하지 않았어요';
  return apart ? '따로 세대' : '같은 세대';
});

/** 부모 가구 소득은 계획 입력이 아니라 가구원 확인으로 채워진다. */
const parentIncome = computed(() => {
  const found = conditions.value.find((condition) => condition.conditionLabel.includes('가구'));
  return found ? '모름 · 확인 과제 진행 중' : '확인 과제 없음';
});

/** 조회값을 아직 확인하지 않았으면 판정에 쓰이지 않는다. 그 사실을 카드로 띄운다. */
const unconfirmed = computed(
  () =>
    input.value?.incomeSource === 'OPEN_BANKING' && input.value?.financialDataConfirmed === false,
);

// 비교도 만 원 단위로 한다. 원 단위로 비교하면 만 원 미만이 잘린 값 때문에
// 아무것도 고치지 않았는데 저장 버튼이 열린다.
const changed = computed(
  () =>
    !!input.value &&
    (onlyDigits(monthlyIncome.value) !== toMan(input.value.monthlyIncome) ||
      onlyDigits(netAssets.value) !== toMan(input.value.netAssets)),
);

async function save() {
  if (!planId.value || !input.value || saving.value) return;

  saving.value = true;
  saved.value = false;
  error.value = '';
  const nextIncome = toWon(monthlyIncome.value);
  const nextAssets = toWon(netAssets.value);
  try {
    // `unknownFields` 를 보내지 않는다. 이 화면은 자기자금을 편집하지 않으므로 "모름" 이라고
    // 말할 자격이 없다. 항목을 생략하면 서버 `PlanInputStepService.value()` 가 "현재 값 유지"
    // 로 떨어져 자기자금이 보존된다. `AVAILABLE_CASH` 를 모름으로 보내면 값이 null 이 되고
    // 1루가 NEEDS_CONFIRMATION 에 영구히 갇힌다.
    const result = await usePlanApi().saveStep(planId.value, 'FINANCIAL', input.value.revision, {
      monthlyIncome: nextIncome,
      netAssets: nextAssets,
      incomeSource: 'MANUAL',
      assetSource: 'MANUAL',
    });
    // 서버가 돌려준 새 revision 과 방금 보낸 값을 화면 상태에 반영한다. 이걸 빼먹으면
    // 다음 저장이 옛 revision 으로 나가 충돌하고, `changed` 가 계속 참이라 버튼도 안 잠긴다.
    input.value = {
      ...input.value,
      monthlyIncome: nextIncome,
      netAssets: nextAssets,
      incomeSource: 'MANUAL',
      revision: result.revision,
    };
    saved.value = true;
  } catch (cause) {
    // 409 는 다른 기기가 먼저 고쳤다는 뜻이라, 덮어쓰지 말고 다시 불러오라고 안내한다.
    error.value =
      statusFrom(cause) === 409
        ? '다른 곳에서 입력이 먼저 바뀌었어요. 화면을 새로고침해 최신 값을 불러온 뒤 다시 저장해주세요.'
        : messageFrom(cause, '저장하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  planId.value = await currentPlan.resolve();
  if (!planId.value) {
    pending.value = false;
    return;
  }

  try {
    const found = await usePlanApi().input(planId.value);
    input.value = found;
    monthlyIncome.value = toManText(found.monthlyIncome);
    netAssets.value = toManText(found.netAssets);
  } catch (cause) {
    error.value = messageFrom(cause, '입력값을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    pending.value = false;
  }

  useVerificationApi()
    .pending(planId.value)
    .then((found) => (conditions.value = found))
    .catch(() => {});
});
</script>

<template>
  <PhoneFrame>
    <StatusBar title="입력값 수정" @back="navigateTo('/my')" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <p class="bg-badge-warning rounded-cta text-label2 text-warning-strong px-3 py-2.5">
        값을 고치면 판정과 준비 항목이 다시 계산돼요.
      </p>

      <p v-if="pending" class="text-label2 text-ink-muted">입력값을 불러오는 중이에요…</p>
      <p v-else-if="error" class="text-label2 text-danger">{{ error }}</p>

      <AppCard v-else-if="!planId" radius="button">
        <p class="text-label2 text-ink-muted">아직 시작한 계획이 없어요.</p>
      </AppCard>

      <template v-else>
        <SectionCard title="소득과 자산">
          <AppInput
            v-model="monthlyIncome"
            label="월 소득 (만 원)"
            type="tel"
            placeholder="숫자만 입력해주세요"
          />
          <AppInput
            v-model="netAssets"
            label="순자산 (만 원)"
            type="tel"
            placeholder="숫자만 입력해주세요"
          />
        </SectionCard>

        <SectionCard title="가구">
          <FactRow label="부모 동거 여부" :value="household" />
          <FactRow
            label="부모 가구 연 소득"
            :value="parentIncome"
            :tone="parentIncome.startsWith('모름') ? 'warn' : 'plain'"
          />
        </SectionCard>

        <!--
          오픈뱅킹이 읽어온 값은 사용자가 확인하기 전까지 판정에 쓰지 않는다.
          그 상태를 그냥 두면 왜 판정이 안 바뀌는지 알 수 없다.
        -->
        <SectionCard v-if="unconfirmed" title="확인 대기 1건" tone="warn">
          <FactRow
            label="월 소득"
            :value="`${formatKoreanMoney(input?.monthlyIncome)} · 조회값`"
            tone="warn"
          />
          <FactRow label="영향" value="확인해야 판정에 반영됩니다" tone="bad" />
        </SectionCard>

        <p v-if="saved" class="text-label2 text-success">저장했어요. 판정이 다시 계산됩니다.</p>
      </template>
    </div>

    <footer class="px-gutter-tight bg-surface flex shrink-0 pt-2.5 pb-cta-pad">
      <AppButton :disabled="!changed || saving" @click="save">
        {{ saving ? '저장 중…' : '영향 확인하고 저장' }}
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
