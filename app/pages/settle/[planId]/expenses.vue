<script setup lang="ts">
import { useSettlementApi, type ExpenseCategory, type FixedExpense } from '~/api/settlement';
import { messageFrom } from '~/utils/error';
import { formatKoreanMoney } from '~/utils/money';

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
const toWon = (value: string) => Number(value.replace(/\D/g, '') || 0) * 10_000;

async function load() {
  const result = await api.fixedExpenses(planId);
  items.value = result.items;
  monthlyTotal.value = result.monthlyTotal;
}

onMounted(() =>
  load().catch((cause) => (error.value = messageFrom(cause, '고정지출을 불러오지 못했어요.'))),
);

async function add() {
  if (!name.value.trim() || !amount.value.trim() || busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    await api.addFixedExpense(planId, {
      name: name.value.trim(),
      category: category.value,
      amount: toWon(amount.value),
      dueDay: dueDay.value ? Number(dueDay.value) : null,
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
  <PhoneFrame>
    <StageBar title="고정지출 등록" base="홈" @back="navigateTo(`/settle/${planId}/checkin`)" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3.5 py-4">
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
        <AppInput v-model="amount" label="월 금액 (만 원)" type="tel" placeholder="숫자만 입력" />
        <AppInput v-model="dueDay" label="납부일 (선택)" type="tel" placeholder="1~31" />
        <AppCheckbox v-model="autopay">자동이체를 등록했어요</AppCheckbox>
        <AppButton :disabled="!name.trim() || !amount.trim() || busy" @click="add">
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
  </PhoneFrame>
</template>
