<script setup lang="ts">
import { usePlanApi, type PlanInput } from '~/api/plan';
import { useVerificationApi, type PendingCondition } from '~/api/verification';
import { currentPlan } from '~/utils/currentPlan';
import { messageFrom, statusFrom } from '~/utils/error';
import { manwonFromWon, parseManwon } from '~/utils/amount';
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

/**
 * 화면은 만 원 단위로 받고 백엔드는 원 단위로 저장한다. 1루 문진과 같은 파서를 쓴다 —
 * 거기서 만 원을 배운 사용자가 여기서 300 을 넣어도 300원이 되지 않는다.
 *
 * 전에는 이 화면만 규칙이 달랐다. 숫자가 아닌 글자를 **지워서** 값을 만들고(`abc` → 0원,
 * `-100` → 100만 원, `1.5` → 15만 원), 되돌릴 때는 `Math.floor` 로 만 원 미만을 **버렸다.**
 * 3,456,789원이 `345` 로 보이고, 소득 한 칸만 고쳐 저장해도 순자산에서 6,789원이 조용히
 * 사라졌다. 이 화면은 저장할 때 두 값을 함께 보내므로 건드리지 않은 칸도 같이 깎였다.
 */
const parsedIncome = computed(() => parseManwon(monthlyIncome.value));
const parsedAssets = computed(() => parseManwon(netAssets.value));

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

/*
 * 원 단위 그대로 비교한다. 되돌릴 때 값을 버리지 않으므로, 아무것도 고치지 않았으면
 * 파싱 결과가 저장값과 정확히 같다 — 만 원 단위로 뭉개서 비교할 이유가 없어졌다.
 */
const changed = computed(
  () =>
    !!input.value &&
    (parsedIncome.value.value !== input.value.monthlyIncome ||
      parsedAssets.value.value !== input.value.netAssets),
);

/** 형식이 틀린 값은 저장하지 않는다. 지워서 통과시키면 틀린 숫자가 판정까지 간다. */
const canSave = computed(
  () => changed.value && !parsedIncome.value.error && !parsedAssets.value.error,
);

async function save() {
  if (!planId.value || !input.value || saving.value || !canSave.value) return;

  const nextIncome = parsedIncome.value.value;
  const nextAssets = parsedAssets.value.value;
  // 빈 칸은 "0원 확인함" 이 아니라 미입력이다. 여기서 0 으로 채우면 판정이 통째로 어긋난다.
  if (nextIncome === null || nextAssets === null) {
    error.value = '월 소득과 순자산을 모두 입력해주세요.';
    return;
  }

  saving.value = true;
  saved.value = false;
  error.value = '';
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
    monthlyIncome.value = manwonFromWon(found.monthlyIncome);
    netAssets.value = manwonFromWon(found.netAssets);
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
            :error="parsedIncome.error ?? ''"
            label="월 소득 (만 원)"
            type="tel"
            placeholder="숫자만 입력해주세요"
          />
          <AppInput
            v-model="netAssets"
            :error="parsedAssets.error ?? ''"
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
      <AppButton :disabled="!canSave || saving" @click="save">
        {{ saving ? '저장 중…' : '영향 확인하고 저장' }}
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
