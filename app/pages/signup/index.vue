<script setup lang="ts">
import { useAuthApi } from '~/api/auth';
import { messageFrom } from '~/utils/error';

/**
 * AU-04 회원가입 · 이메일과 비밀번호.
 *
 * 여기서 가입이 끝나지 않는다. 인증번호를 확인해 받은 토큰만 챙겨 두고, 실제 가입은
 * 다음 화면(본인 확인)에서 한 번에 보낸다. 백엔드가 그 토큰을 요구하기 때문이다.
 */
const signup = useSignupStore();
const { sendVerification, confirmVerification } = useAuthApi();

const email = ref(signup.email);
const code = ref('');
const password = ref('');
const passwordConfirm = ref('');

const sent = ref(false);
const error = ref('');
const pending = ref(false);

const passwordMismatch = computed(
  () => !!passwordConfirm.value && password.value !== passwordConfirm.value,
);

/** 백엔드가 8자 이상을 요구한다(`EmailSignupRequest`). 보내기 전에 걸러준다. */
const passwordTooShort = computed(() => !!password.value && password.value.length < 8);

const canSubmit = computed(
  () =>
    signup.isEmailVerified &&
    password.value.length >= 8 &&
    !passwordMismatch.value &&
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
        >
          <template #action>
            <InputAction :disabled="!email || pending" @click="send">인증번호 받기</InputAction>
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
          placeholder="8자 이상 입력해주세요"
          autocomplete="new-password"
        >
          <template v-if="passwordTooShort" #hint>8자 이상이어야 해요.</template>
        </AppInput>

        <AppInput
          v-model="passwordConfirm"
          label="비밀번호 확인"
          type="password"
          placeholder="비밀번호를 다시 입력해주세요"
          autocomplete="new-password"
        >
          <template v-if="passwordMismatch" #hint>비밀번호가 서로 달라요.</template>
        </AppInput>
      </div>

      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>

      <div class="flex flex-1 flex-col justify-end gap-3">
        <p class="text-caption1 text-ink-subtle text-center">
          이메일 인증을 완료해야 다음 단계로 진행할 수 있어요.
        </p>
        <AppButton type="submit" variant="strong" :disabled="!canSubmit">다음</AppButton>
      </div>
    </form>
  </PhoneFrame>
</template>
