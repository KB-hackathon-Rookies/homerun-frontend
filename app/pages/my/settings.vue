<script setup lang="ts">
import { usePlanApi } from '~/api/plan';
import { useAgreementApi, type AgreementItem } from '~/api/terms-status';
import { currentPlan } from '~/utils/currentPlan';
import { formatDotDate } from '~/utils/date';
import { messageFrom } from '~/utils/error';

/**
 * MY-05 설정.
 *
 * 되돌릴 수 없는 것 둘(계획 초기화·회원 탈퇴)이 여기 있다. 한 번 더 묻고
 * 실행한다 — 줄을 누르자마자 지워지면 실수를 되돌릴 방법이 없다.
 *
 * 알림 네 줄은 저장할 API 가 없다. 자리는 시안대로 두되 눌리지 않게 한다.
 */
definePageMeta({ middleware: 'auth' });

const auth = useAuthStore();

const planId = ref<number | null>(null);
const agreements = ref<AgreementItem[]>([]);
const confirming = ref<'reset' | 'withdraw' | null>(null);
const busy = ref(false);
const error = ref('');
const done = ref('');

const NOTIFICATIONS = ['마감 알림', '정책 소식', '방해 금지 시간', '알림 전체'];

const agreedCount = computed(() => agreements.value.filter((item) => item.agreed).length);
const latestAgreedAt = computed(() => {
  const dates = agreements.value.map((item) => item.agreedAt).filter(Boolean) as string[];
  return dates.length ? formatDotDate(dates.sort().at(-1)!) : '기록 없음';
});

async function resetPlan() {
  if (!planId.value || busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    await usePlanApi().reset(planId.value);
    done.value = '계획을 처음 상태로 돌렸어요.';
    confirming.value = null;
  } catch (cause) {
    error.value = messageFrom(cause, '초기화하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    busy.value = false;
  }
}

async function logout() {
  await auth.logout();
  currentPlan.clear();
  await navigateTo('/welcome', { replace: true });
}

onMounted(() => {
  planId.value = currentPlan.get();

  useAgreementApi()
    .mine()
    .then((found) => (agreements.value = found.agreements))
    .catch(() => {});
});
</script>

<template>
  <PhoneFrame>
    <StatusBar title="설정" @back="navigateTo('/my')" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <!-- 알림 설정을 저장할 API 가 없다. 켜고 끈 값을 어디에도 남길 수 없다. -->
      <SectionCard title="알림">
        <RowChevron
          v-for="(item, index) in NOTIFICATIONS"
          :key="item"
          :label="item"
          value="준비 중"
          disabled
          :last="index === NOTIFICATIONS.length - 1"
        />
      </SectionCard>

      <SectionCard title="약관과 정책">
        <RowChevron label="서비스 이용약관" @select="navigateTo('/signup/terms')" />
        <RowChevron label="개인정보 처리방침" @select="navigateTo('/signup/terms')" />
        <RowChevron
          label="동의 내역"
          :value="`${agreedCount}건 · ${latestAgreedAt}`"
          last
          disabled
        />
      </SectionCard>

      <SectionCard title="데이터">
        <RowChevron label="로그아웃" @select="logout" />
        <RowChevron
          label="계획 초기화"
          value="처음 상태로"
          :disabled="!planId"
          @select="confirming = 'reset'"
        />
        <RowChevron label="회원 탈퇴" value="계정 삭제" last @select="confirming = 'withdraw'" />
      </SectionCard>

      <!--
        되돌릴 수 없는 것은 한 번 더 묻는다. 탈퇴는 이 화면에서 실행하지
        않는다 — 계정을 지우는 일이라 확인 절차를 따로 둬야 한다.
      -->
      <SectionCard v-if="confirming === 'reset'" title="계획을 초기화할까요?" tone="bad">
        <p class="text-label2 text-ink-body">
          진행 상태와 완료한 관문이 처음으로 돌아가요. 입력한 값은 남습니다.
        </p>
        <div class="flex gap-2">
          <AppButton variant="white" @click="confirming = null">그만두기</AppButton>
          <AppButton :disabled="busy" @click="resetPlan">
            {{ busy ? '되돌리는 중…' : '초기화' }}
          </AppButton>
        </div>
      </SectionCard>

      <SectionCard v-if="confirming === 'withdraw'" title="회원 탈퇴" tone="bad">
        <p class="text-label2 text-ink-body">
          계정을 지우면 계획·판정·상담 기록이 모두 사라지고 되돌릴 수 없어요. 고객센터를 통해
          진행해주세요.
        </p>
        <AppButton variant="white" @click="confirming = null">닫기</AppButton>
      </SectionCard>

      <p v-if="done" class="text-label2 text-success">{{ done }}</p>
      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>
    </div>

    <TabBar active="my" :plan-id="planId" />
  </PhoneFrame>
</template>
