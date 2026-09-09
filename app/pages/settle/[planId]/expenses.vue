<script setup lang="ts">
import { useSettlementApi, type ExpenseCategory, type FixedExpense } from '~/api/settlement';
import { parseManwon, parseDay } from '~/utils/amount';
import { messageFrom } from '~/utils/error';
import { formatKoreanMoney } from '~/utils/money';
import { HOME_STEPS } from '~/components/home/steps';

definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
const items = ref<FixedExpense[]>([]);
const monthlyTotal = ref(0);
const name = ref('');
const category = ref<ExpenseCategory>('MGMT');
const amount = ref('');
const dueDay = ref('');
const autopay = ref(false);
const busy = ref(false);
const error = ref('');

const api = useSettlementApi();
/**
 * 검사한 뒤에 단위를 바꾼다. 숫자가 아닌 글자를 지워서 값을 만들면 `abc` 가 0원이 되고
 * `-100` 이 100만 원으로 뒤집힌다.
 */
const parsedAmount = computed(() => parseManwon(amount.value));
/** 납부일(선택). 비면 null, 적었으면 1~31 정수여야 한다. */
const parsedDay = computed(() => parseDay(dueDay.value));

async function load() {
  const result = await api.fixedExpenses(planId);
  items.value = result.items;
  monthlyTotal.value = result.monthlyTotal;
}

onMounted(() =>
  load().catch((cause) => (error.value = messageFrom(cause, '고정지출을 불러오지 못했어요.'))),
);

async function add() {
  // 버튼뿐 아니라 함수에서도 다시 본다. 금액은 유효값이 있어야 하고(0 대체 금지),
  // 납부일은 비었거나(선택) 1~31 정수여야 한다.
  if (
    !name.value.trim() ||
    parsedAmount.value.value === null ||
    parsedDay.value.error !== null ||
    busy.value
  ) {
    return;
  }
  busy.value = true;
  error.value = '';
  try {
    await api.addFixedExpense(planId, {
      name: name.value.trim(),
      category: category.value,
      amount: parsedAmount.value.value,
      dueDay: parsedDay.value.value,
      autopay: autopay.value,
    });
    name.value = '';
    amount.value = '';
    dueDay.value = '';
    autopay.value = false;
    await load();
  } catch (cause) {
    error.value = messageFrom(cause, '고정지출을 저장하지 못했어요.');
  } finally {
    busy.value = false;
  }
}

async function remove(expenseId: number) {
  if (busy.value) return;
  busy.value = true;
  try {
    await api.deleteFixedExpense(planId, expenseId);
    await load();
  } catch (cause) {
    error.value = messageFrom(cause, '고정지출을 삭제하지 못했어요.');
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <StageShell coach-above-footer="compact" brand base="홈">
    <div class="bg-canvas-soft flex min-h-full flex-col gap-3 px-4 pt-4 pb-6">
      <SubStep :steps="HOME_STEPS" :current="4" />

      <HomeBackLink :plan-id="planId" title="고정지출 등록" />
      <AppCard class="flex flex-col gap-3">
        <AppInput v-model="name" label="항목 이름" placeholder="예: 관리비" />
        <label class="text-label2 text-ink flex flex-col gap-1.5">
          종류
          <select v-model="category" class="border-line rounded-field h-12 border px-3.5">
            <option value="INTEREST">대출 이자</option>
            <option value="MGMT">관리비</option>
            <option value="OTHER">기타</option>
          </select>
        </label>
        <AppInput
          v-model="amount"
          label="월 금액 (만 원)"
          type="tel"
          placeholder="숫자만 입력"
          :error="parsedAmount.error ?? ''"
        />
        <AppInput
          v-model="dueDay"
          label="납부일 (선택)"
          type="tel"
          placeholder="1~31"
          :error="parsedDay.error ?? ''"
        />
        <AppCheckbox v-model="autopay">자동이체를 등록했어요</AppCheckbox>
        <AppButton
          :disabled="
            !name.trim() || parsedAmount.value === null || parsedDay.error !== null || busy
          "
          @click="add"
        >
          {{ busy ? '저장 중…' : '고정지출 추가' }}
        </AppButton>
      </AppCard>

      <p class="text-body3 text-ink-hero font-bold">
        월 합계 {{ formatKoreanMoney(monthlyTotal) }}
      </p>

      <AppCard v-for="item in items" :key="item.id" class="flex items-center gap-3">
        <span class="flex flex-1 flex-col gap-0.5">
          <span class="text-row text-ink-hero">{{ item.name }}</span>
          <span class="text-caption2 text-ink-muted">
            {{ formatKoreanMoney(item.amount) }}{{ item.dueDay ? ` · 매월 ${item.dueDay}일` : '' }}
          </span>
        </span>
        <button
          type="button"
          class="text-caption2 text-danger"
          :disabled="busy"
          @click="remove(item.id)"
        >
          삭제
        </button>
      </AppCard>

      <p v-if="!items.length" class="text-caption2 text-ink-muted">등록한 고정지출이 없어요.</p>
      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>
    </div>

    <!--
      입력 화면인데 하단 CTA 가 없어 헤더의 뒤로가기 화살표가 유일한 출구였다.
      푸터가 없는 나머지 화면은 전부 `*-detail`(상세·딤)이라 뒤로가기만으로 충분하지만,
      여기는 값을 넣는 화면이라 등록을 마치고 돌아가는 길이 눈에 보여야 한다.
    -->
    <template #footer>
      <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-cta-pad">
        <AppButton variant="strong" @click="navigateTo(`/settle/${planId}/checkin`)">
          등록 마치고 돌아가기
        </AppButton>
      </footer>
    </template>
  </StageShell>
</template>
