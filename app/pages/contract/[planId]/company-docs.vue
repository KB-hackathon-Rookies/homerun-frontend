<script setup lang="ts">
import { useContractApi, type ContractEntry } from '~/api/contract';
import { usePlanApi } from '~/api/plan';
import { needsCompanyDocs } from '~/components/contract/labels';
import { messageFrom } from '~/utils/error';

/**
 * 3루 5 · 회사 서류 요청 (D-30).
 *
 * **모두에게 필요한 단계가 아니다.** 청년 버팀목 + 중소·중견기업 재직으로
 * 우대금리 0.3%p 를 받을 사람만 해당한다. 아니면 통째로 건너뛴다.
 *
 * 이걸 D-30 에 두는 이유는 주업종코드 확인서가 제일 오래 걸려서다.
 * 담당자가 바로 못 뽑아주는 일이 흔하다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const DOCS = [
  '재직증명서',
  '사업자등록증 사본',
  '소속기업 주업종코드 확인서 (제일 오래 걸림)',
  '고용보험 자격이력내역서 (근로복지공단)',
];

const entry = ref<ContractEntry | null>(null);
const companySize = ref<string | null>(null);
const pending = ref(true);
const error = ref('');
const checked = ref<Record<string, boolean>>({});

const applies = computed(() =>
  needsCompanyDocs(entry.value?.loanProductKind ?? null, companySize.value),
);

const next = () => navigateTo(`/contract/${planId}/bank-visit`);

onMounted(async () => {
  try {
    const [contract, input] = await Promise.all([
      useContractApi().prefill(planId),
      usePlanApi().input(planId),
    ]);
    entry.value = contract;
    companySize.value = (input as { companySize?: string }).companySize ?? null;
  } catch (cause) {
    error.value = messageFrom(cause, '계약 정보를 불러오지 못했어요.');
  } finally {
    pending.value = false;
  }
});
</script>

<template>
  <PhoneFrame>
    <StageBar
      title="D-30 회사 서류"
      base="3루"
      @back="navigateTo(`/contract/${planId}/schedule`)"
    />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <p v-if="pending" class="text-label2 text-ink-muted">불러오는 중이에요…</p>
      <p v-else-if="error" class="text-label2 text-danger">{{ error }}</p>

      <!-- 해당 없는 사람에게 서류 넷을 보여주면 안 떼도 되는 걸 떼러 간다. -->
      <template v-else-if="!applies">
        <div class="bg-surface-brand rounded-field flex flex-col gap-1.5 p-4">
          <p class="text-label2 text-ink-hero font-semibold">이 단계는 건너뛰어도 돼요</p>
          <p class="text-caption2 text-ink-hero-body">
            회사 서류는 청년 버팀목을 중소·중견기업 재직 우대금리로 받을 때만 필요해요.
          </p>
        </div>
      </template>

      <template v-else>
        <div class="bg-badge-warning rounded-field flex flex-col gap-2.5 p-4">
          <p class="text-label2 text-warning-strong font-semibold">중소기업 우대금리 대상만</p>
          <p class="text-caption2 text-ink-hero">
            청년 버팀목 + 중소기업 재직으로 우대금리 0.3%p 받을 사람만 해당돼요. 아니면 이 단계
            통째로 건너뛰기.
          </p>
          <span
            class="bg-surface rounded-chip text-micro text-warning-strong self-start px-2 py-0.5 font-semibold"
          >
            청년 버팀목만 해당
          </span>
        </div>

        <h2 class="text-body3 text-ink-hero font-bold">회사에 요청할 것</h2>

        <CheckItem v-for="doc in DOCS" :key="doc" v-model="checked[doc]">{{ doc }}</CheckItem>

        <CoachTip label="이렇게 말하세요">
          "전세자금대출 중소기업 우대금리를 받으려면 회사 주업종코드가 적힌 서류가 필요해요.
          사업자등록증과 함께 부탁드립니다"
        </CoachTip>

        <DetailLink @open="navigateTo(`/contract/${planId}/company-docs-detail`)">
          서류 4종·요청 대본 상세보기
        </DetailLink>
      </template>
    </div>

    <footer class="px-gutter-tight flex shrink-0 gap-2 pt-2.5 pb-cta-pad">
      <div class="w-28 shrink-0">
        <AppButton variant="white" @click="navigateTo(`/contract/${planId}/schedule`)">
          이전
        </AppButton>
      </div>
      <AppButton variant="strong" :disabled="pending" @click="next">
        {{ applies ? '일정 확인' : '다음 단계로' }}
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
