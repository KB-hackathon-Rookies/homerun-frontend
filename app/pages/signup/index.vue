<script setup lang="ts">
import { useAuthApi } from '~/api/auth';
import { emailSchema, messageOf, passwordSchema, passes } from '~/schemas/signup';
import { useSignupStore } from '~/stores/signup';
import { messageFrom } from '~/utils/error';

/**
 * AU-04 회원가입 · 이메일과 비밀번호.
 *
 * 여기서 가입이 끝나지 않는다. 인증번호를 확인해 받은 토큰만 챙겨 두고, 실제 가입은
 * 다음 화면(본인 확인)에서 한 번에 보낸다. 백엔드가 그 토큰을 요구하기 때문이다.
 */
const signup = useSignupStore();
const router = useRouter();
const { sendVerification, confirmVerification } = useAuthApi();

const email = ref(signup.email);
const code = ref('');
const password = ref('');
const passwordConfirm = ref('');

const sent = ref(false);
const error = ref('');
const pending = ref(false);

const emailError = computed(() => messageOf(emailSchema, email.value));
const passwordError = computed(() => messageOf(passwordSchema, password.value));

/**
 * 확인값은 **비어 있어도 오류**다.
 *
 * 전에는 `!!passwordConfirm && 서로 다름` 이라 확인칸을 비워 두면 오류가 아니었고 다음
 * 버튼이 열렸다. 확인칸은 오타를 걸러내려고 있는 것이라 안 적으면 제 역할을 못 한다.
 */
const passwordConfirmError = computed(() => {
  if (!password.value) return '';
  if (!passwordConfirm.value) return '비밀번호를 한 번 더 입력해주세요';
  return password.value === passwordConfirm.value ? '' : '비밀번호가 서로 달라요';
});

/**
 * 인증을 끝낸 이메일과 지금 칸에 적힌 이메일이 같은가.
 *
 * A 로 인증하고 칸만 B 로 바꾸면 화면은 B 를 보여주는데 저장된 토큰과 `signup.email` 은
 * A 였다. 서버는 A 로 가입시킨다 — 사용자가 본 것과 다른 계정이 만들어진다.
 */
const verifiedEmailMatches = computed(
  () => signup.isEmailVerified && signup.email === email.value.trim(),
);

/**
 * 인증한 뒤 이메일을 고치면 그 인증은 더 이상 이 이메일의 것이 아니다.
 *
 * 되돌려 적으면 다시 인증해야 한다 — 토큰은 한 번 쓰면 사라지므로 남겨 둘 이유가 없다.
 */
watch(email, (value) => {
  if (signup.isEmailVerified && signup.email !== value.trim()) {
    signup.email = '';
    signup.verificationToken = '';
    sent.value = false;
    code.value = '';
  }
});

const canSubmit = computed(
  () =>
    verifiedEmailMatches.value &&
    passes(passwordSchema, password.value) &&
    !passwordConfirmError.value &&
    !pending.value,
);

async function send() {
  pending.value = true;
  error.value = '';
  try {
    await sendVerification(email.value);
    sent.value = true;
  } catch (cause) {
    error.value = messageFrom(cause, '인증번호를 보내지 못했어요.');
  } finally {
    pending.value = false;
  }
}

async function confirm() {
  pending.value = true;
  error.value = '';
  try {
    const { verificationToken } = await confirmVerification(email.value, code.value);
    signup.email = email.value;
    signup.verificationToken = verificationToken;
  } catch (cause) {
    error.value = messageFrom(cause, '인증번호가 맞지 않아요.');
  } finally {
    pending.value = false;
  }
}

function next() {
  // 버튼 상태에만 맡기지 않는다. 엔터 제출·자동완성처럼 버튼을 거치지 않는 길이 있다.
  if (!canSubmit.value) return;
  signup.password = password.value;
  navigateTo('/signup/identity');
}
</script>

<template>
  <PhoneFrame>
    <div class="h-statusbar shrink-0" />
    <TopBar title="회원가입" />

    <form class="px-gutter flex flex-1 flex-col gap-6 py-6" @submit.prevent="next">
      <p class="text-body2 text-ink-body">계정을 만들기 위해 이메일과 비밀번호를 입력해주세요.</p>

      <div class="flex flex-col gap-3.5">
        <AppInput
          v-model="email"
          label="이메일"
          type="email"
          placeholder="이메일을 입력해주세요"
          autocomplete="email"
          :error="emailError"
        >
          <template #action>
            <InputAction :disabled="!passes(emailSchema, email) || pending" @click="send">
              인증번호 받기
            </InputAction>
          </template>
        </AppInput>

        <AppInput
          v-model="code"
          label="인증번호"
          placeholder="6자리를 입력해주세요"
          autocomplete="one-time-code"
        >
          <template #action>
            <InputAction :disabled="!sent || code.length !== 6 || pending" @click="confirm">
              확인
            </InputAction>
          </template>
          <template v-if="signup.isEmailVerified" #hint>인증이 완료됐어요.</template>
        </AppInput>

        <AppInput
          v-model="password"
          label="비밀번호"
          type="password"
          placeholder="영문·숫자·특수문자를 섞어 8자 이상"
          autocomplete="new-password"
          :error="passwordError"
        />

        <AppInput
          v-model="passwordConfirm"
          label="비밀번호 확인"
          type="password"
          placeholder="비밀번호를 다시 입력해주세요"
          autocomplete="new-password"
          :error="passwordConfirmError"
        />
      </div>

      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>

      <div class="flex flex-1 flex-col justify-end gap-3">
        <p class="text-caption1 text-ink-subtle text-center">
          이메일 인증을 완료해야 다음 단계로 진행할 수 있어요.
        </p>
        <!-- 피그마의 하단은 `[이전] [다음]` 두 칸이다. 상단 뒤로가기와 같은 곳으로 간다. -->
        <div class="flex gap-2.5">
          <div class="shrink-0 basis-1/3">
            <AppButton variant="white" @click="router.back()">이전</AppButton>
          </div>
          <div class="flex-1">
            <AppButton type="submit" variant="strong" :disabled="!canSubmit">다음</AppButton>
          </div>
        </div>
      </div>
    </form>
  </PhoneFrame>
</template>
