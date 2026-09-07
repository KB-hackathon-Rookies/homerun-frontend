<script setup lang="ts">
import { usePolicyApi, type JeonsePolicyVerdicts } from '~/api/policy';
import { formatDotDate } from '~/utils/date';
import { messageFrom } from '~/utils/error';

/**
 * ST-05 자격이 끝나기까지.
 *
 * 나이 상한이 다가오는 화면이다. 조건마다 언제까지인지가 판정 응답에
 * 실려 오므로(`eligibleUntil`·`daysRemaining`), 가장 가까운 것을 머리에 세운다.
 *
 * 끝나는 것만 말하면 겁주는 화면이 된다. 나이와 상관없이 계속 쓸 수 있는
 * 것도 함께 둔다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const verdicts = ref<JeonsePolicyVerdicts | null>(null);
const pending = ref(true);
const error = ref('');

/** 기한이 붙은 조건만 모은다. 없으면 이 화면을 띄울 이유가 없다. */
const expiring = computed(() => {
  const rows = (verdicts.value?.results ?? []).flatMap((result) =>
    result.basis
      .filter((condition) => condition.eligibleUntil && condition.daysRemaining !== null)
      .map((condition) => ({
        policyCode: result.policyCode,
        policyName: result.policyName,
        label: condition.label,
        until: condition.eligibleUntil!,
        daysRemaining: condition.daysRemaining!,
      })),
  );
  return rows.sort((left, right) => left.daysRemaining - right.daysRemaining);
});

const nearest = computed(() => expiring.value[0] ?? null);

/** 같은 기한에 걸린 정책 수. 중복을 걷어낸다. */
const affectedPolicies = computed(() => new Set(expiring.value.map((row) => row.policyCode)).size);

onMounted(async () => {
  try {
    verdicts.value = await usePolicyApi().evaluateJeonse(planId);
  } catch (cause) {
    error.value = messageFrom(cause, '자격 기한을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    pending.value = false;
  }
});
</script>

<template>
  <PhoneFrame>
    <StatusBar
      title="자격이 끝나기까지"
      badge="자격 시계"
      base="2루"
      @back="navigateTo(`/result/${planId}/match`)"
    />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <p v-if="pending" class="text-label2 text-ink-muted">자격 기한을 확인하는 중이에요…</p>
      <p v-else-if="error" class="text-label2 text-danger">{{ error }}</p>

      <AppCard v-else-if="!nearest" radius="button">
        <p class="text-label2 text-ink-muted">기한이 걸린 조건이 없어요.</p>
      </AppCard>

      <template v-else>
        <SectionCard :title="`${nearest.label} · ${formatDotDate(nearest.until)}`" tone="bad">
          <template #badge>
            <AppBadge tone="negative">D-{{ nearest.daysRemaining }}</AppBadge>
          </template>
          <p class="text-label2 text-ink-body">
            이 날짜가 지나면 정책 {{ affectedPolicies }}건의 자격이 끝나요. 병역 기간을 입력해 두면
            그만큼 뒤로 밀립니다.
          </p>
        </SectionCard>

        <SectionCard title="기한 내 가능한 정책">
          <RowChevron
            v-for="(row, index) in expiring"
            :key="`${row.policyCode}-${row.label}`"
            :label="row.policyName"
            :value="`${formatDotDate(row.until)}까지`"
            :last="index === expiring.length - 1"
            @select="navigateTo(`/result/${planId}/match`)"
          />
        </SectionCard>

        <!-- 끝나는 것만 세우면 겁주는 화면이 된다. 계속 쓸 수 있는 것도 같이 둔다. -->
        <SectionCard title="이후에도 쓸 수 있는 것">
          <FactRow label="주거급여" value="연령 무관 · 소득 기준" tone="good" />
          <FactRow label="일반 전세대출" value="연령 무관" tone="good" />
        </SectionCard>
      </template>
    </div>

    <footer class="px-gutter-tight bg-surface flex shrink-0 pt-2.5 pb-6">
      <AppButton @click="navigateTo(`/result/${planId}/spec`)">기한 안에 신청 준비하기</AppButton>
    </footer>
  </PhoneFrame>
</template>
