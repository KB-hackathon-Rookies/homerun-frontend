<script setup lang="ts">
import { useContractApi } from '~/api/contract';
import { COACH_TIME } from '~/components/contract/coachSheets';
import { THIRD_BASE_STEPS } from '~/components/contract/steps';
import {
  OWNER_OPTIONS,
  PRESENCE_NOW_OPTIONS,
  useRegistrySnapshot,
} from '~/composables/useRegistrySnapshot';
import { messageFrom } from '~/utils/error';

/**
 * 3루 계약 당시 등기부 기록.
 *
 * 잔금일에는 오늘 등기부를 계약 당시 것과 비교해야 한다. 이 기준값이 없으면
 * 서버는 안전을 추측하지 않고 NEED_INFO 를 돌려준다. 계약을 막 끝낸 지금
 * 일곱 항목을 남겨 두면 잔금일에는 다시 확인만 하면 된다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
const fromSettlement = computed(() => route.query.from === 'settlement');
const { owner, seizure, leasehold, auction, trust, seniorDebt, mortgageCount, answered, facts } =
  useRegistrySnapshot();

const saving = ref(false);
const error = ref('');

const backPath = computed(() =>
  fromSettlement.value ? `/contract/${planId}/settlement` : `/contract/${planId}/sign`,
);
const nextPath = computed(() =>
  fromSettlement.value ? `/contract/${planId}/settlement` : `/contract/${planId}/fixed-date`,
);

async function save() {
  if (!answered.value || saving.value) return;

  saving.value = true;
  error.value = '';
  try {
    const api = useContractApi();
    // 계약이 아직 없으면 registry-snapshots 가 404(PRP_001) 다. 계약 당시 등기부를 붙일
    // 대상이 있어야 하므로, 계약을 만드는(있으면 그대로 두는 멱등) prefill 을 먼저 부른다.
    // sign 까지 왔어도 계약 레코드는 prefill 로만 생기는데, sign·registry 는 prefill 을
    // 안 거쳐 여기서 처음 계약이 필요해진다.
    await api.prefill(planId);
    await api.recordRegistry(
      planId,
      'CONTRACT_SIGNING',
      new Date().toISOString().slice(0, 10),
      facts.value,
    );
    await navigateTo(nextPath.value);
  } catch (cause) {
    error.value = messageFrom(
      cause,
      '계약 당시 등기부를 저장하지 못했어요. 잠시 후 다시 시도해주세요.',
    );
  } finally {
    saving.value = false;
  }
}

const coachOpen = ref(false);
</script>

<template>
  <StageShell
    v-model:coach-open="coachOpen"
    :coach-sheets="[COACH_TIME.registryTrap]"
    brand
    base="3루"
  >
    <div class="bg-canvas-soft flex min-h-full flex-col gap-3 px-4 pt-4 pb-6">
      <SubStep :steps="THIRD_BASE_STEPS" :current="0" />

      <h1 class="text-question text-ink-card">계약 당시 등기부 기록</h1>
      <div class="bg-surface-info rounded-field flex flex-col gap-1 p-3.5">
        <p class="text-label2 text-primary-strong font-bold">잔금일 비교 기준이에요</p>
        <p class="text-caption2 text-ink-hero-body">
          계약 직전에 발급한 등기부를 보고 기록해주세요. 모르면 ‘모르겠어요’를 고르면 돼요.
        </p>
      </div>

      <QuestionBlock question="소유자가 계약 당사자와 같나요?">
        <PillGroup v-model="owner" :options="OWNER_OPTIONS" />
      </QuestionBlock>

      <QuestionBlock question="채권최고액은 얼마인가요?" hint="없으면 0을 입력해주세요">
        <input
          v-model="seniorDebt"
          inputmode="numeric"
          placeholder="만 원 단위"
          class="border-line rounded-chip text-body3 text-ink-hero placeholder:text-ink-muted h-12 w-full border px-3.5 outline-none"
        />
      </QuestionBlock>

      <QuestionBlock question="근저당은 몇 건인가요?" hint="없으면 0을 입력해주세요">
        <input
          v-model="mortgageCount"
          inputmode="numeric"
          placeholder="건수 입력"
          class="border-line rounded-chip text-body3 text-ink-hero placeholder:text-ink-muted h-12 w-full border px-3.5 outline-none"
        />
      </QuestionBlock>

      <QuestionBlock question="압류·가압류가 있나요?">
        <PillGroup v-model="seizure" :options="PRESENCE_NOW_OPTIONS" />
      </QuestionBlock>
      <QuestionBlock question="임차권등기가 있나요?">
        <PillGroup v-model="leasehold" :options="PRESENCE_NOW_OPTIONS" />
      </QuestionBlock>
      <QuestionBlock question="경매가 진행 중인가요?">
        <PillGroup v-model="auction" :options="PRESENCE_NOW_OPTIONS" />
      </QuestionBlock>
      <QuestionBlock question="신탁등기가 있나요?">
        <PillGroup v-model="trust" :options="PRESENCE_NOW_OPTIONS" />
      </QuestionBlock>

      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>
    </div>

    <template #footer>
      <footer class="px-gutter-tight flex shrink-0 gap-2 pt-2.5 pb-cta-pad">
        <div class="w-28 shrink-0">
          <AppButton variant="white" :disabled="saving" @click="navigateTo(backPath)"
            >이전</AppButton
          >
        </div>
        <AppButton variant="strong" :disabled="!answered || saving" @click="save">
          {{ saving ? '저장 중…' : '기준값 저장하고 계속' }}
        </AppButton>
      </footer>
    </template>
  </StageShell>
</template>
