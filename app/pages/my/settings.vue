<script setup lang="ts">
import { usePlanApi } from '~/api/plan';
import { useMemberApi } from '~/api/member';
import { useAgreementApi, type AgreementItem } from '~/api/terms-status';
import { usePush } from '~/composables/usePush';
import { useAuthStore } from '~/stores/auth';
import { currentPlan } from '~/utils/currentPlan';
import { formatDotDate } from '~/utils/date';
import { messageFrom } from '~/utils/error';

// 브라우저 탭 제목.
useHead({ title: '설정' });

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
const profileName = ref(auth.user?.name ?? '');

const push = usePush();

/**
 * 알림 상태 한 줄.
 *
 * 브라우저가 한 번 거절하면 우리가 다시 물을 수 없다 — 설정에서 직접
 * 풀어야 한다. 그 사실을 값으로 적어 준다.
 */
const pushLabel = computed(() => {
  if (push.permission.value === 'unsupported') return '이 브라우저는 못 받아요';
  if (push.permission.value === 'granted') return '받는 중';
  if (push.permission.value === 'denied') return '차단됨 · 브라우저 설정에서';
  return '꺼짐';
});

/** 알림 종류별 설정은 저장할 API 가 없다. 자리만 둔다. */
const PENDING_NOTIFICATIONS = ['정책 소식', '방해 금지 시간'];

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

async function withdraw() {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    await useMemberApi().withdraw();
    auth.clear();
    currentPlan.clear();
    await navigateTo('/welcome', { replace: true });
  } catch (cause) {
    error.value = messageFrom(cause, '회원 탈퇴를 처리하지 못했어요.');
  } finally {
    busy.value = false;
  }
}

async function saveProfile() {
  const name = profileName.value.trim();
  if (!name || busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    const profile = await useMemberApi().updateName(name);
    if (auth.user) auth.user.name = profile.name ?? name;
    done.value = '이름을 변경했어요.';
  } catch (cause) {
    error.value = messageFrom(cause, '이름을 변경하지 못했어요.');
  } finally {
    busy.value = false;
  }
}

onMounted(async () => {
  planId.value = await currentPlan.resolve();

  useAgreementApi()
    .mine()
    .then((found) => (agreements.value = found.agreements))
    .catch(() => {});

  useMemberApi()
    .profile()
    .then((profile) => (profileName.value = profile.name ?? ''))
    .catch(() => {});
});
</script>

<template>
  <PhoneFrame>
    <StatusBar title="설정" @back="navigateTo('/my')" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <SectionCard title="프로필">
        <AppInput v-model="profileName" label="이름" autocomplete="name" />
        <AppButton :disabled="!profileName.trim() || busy" @click="saveProfile">
          이름 저장
        </AppButton>
      </SectionCard>

      <SectionCard title="알림">
        <!--
          마감 알림만 실제로 켜고 끈다. 종류별 설정은 저장할 API 가 없어
          자리만 둔다.
        -->
        <RowChevron
          label="마감 알림"
          :value="pushLabel"
          :disabled="push.permission.value === 'denied' || push.permission.value === 'unsupported'"
          @select="push.permission.value === 'granted' ? push.disable() : push.enable()"
        />
        <RowChevron
          v-for="(item, index) in PENDING_NOTIFICATIONS"
          :key="item"
          :label="item"
          value="준비 중"
          disabled
          :last="index === PENDING_NOTIFICATIONS.length - 1"
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
          계정을 지우면 더 이상 로그인할 수 없고 되돌릴 수 없어요.
        </p>
        <div class="flex gap-2">
          <AppButton variant="white" @click="confirming = null">그만두기</AppButton>
          <AppButton :disabled="busy" @click="withdraw">
            {{ busy ? '탈퇴 처리 중…' : '회원 탈퇴' }}
          </AppButton>
        </div>
      </SectionCard>

      <p v-if="done" class="text-label2 text-success">{{ done }}</p>
      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>
    </div>

    <TabBar active="my" :plan-id="planId" />
  </PhoneFrame>
</template>
