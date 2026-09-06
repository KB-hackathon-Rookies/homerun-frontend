<script setup lang="ts">
import { messageFrom } from '~/utils/error';

/**
 * AU-04 회원가입 · 본인 확인.
 *
 * 마지막 단계다. 여기서 실제 가입 요청이 나간다.
 *
 * 백엔드가 받는 건 이메일·비밀번호·닉네임·인증토큰 넷뿐이다(`EmailSignupRequest`).
 * 이름은 닉네임으로 보내고, 생년월일·연락처·주소는 아직 받는 API 가 없다.
 * 화면에는 두되 서버로 보내지는 않는다. 없는 API 를 있는 척하지 않는다.
 *
 * 휴대폰 인증도 같은 이유로 아직 백엔드가 없다. 버튼은 화면 안에서만 동작한다.
 */
const signup = useSignupStore();

const name = ref(signup.name);
const birthDate = ref(signup.birthDate);
const phone = ref(signup.phone);
const phoneCode = ref('');
const address = ref('');
const addressDetail = ref('');

const codeSent = ref(false);
const error = ref('');
const pending = ref(false);

const canSubmit = computed(
  () => !!name.value && !!birthDate.value && !!phone.value && !pending.value,
);

/** 앞 단계를 건너뛰고 들어오면 보낼 것이 없다. 처음으로 돌려보낸다. */
onMounted(() => {
  if (!signup.isEmailVerified) navigateTo('/signup', { replace: true });
});

async function submit() {
  if (!canSubmit.value) return;

  pending.value = true;
  error.value = '';
  try {
    signup.name = name.value;
    signup.birthDate = birthDate.value;
    signup.phone = phone.value;
    await signup.submit();
    await navigateTo('/signup/complete', { replace: true });
  } catch (cause) {
    error.value = messageFrom(cause, '가입에 실패했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <PhoneFrame>
    <div class="h-statusbar shrink-0" />
    <TopBar title="본인 확인" />

    <form class="px-gutter flex flex-1 flex-col gap-6 py-6" @submit.prevent="submit">
      <p class="text-body2 text-ink-body">서비스를 이용하기 위한 필수 정보예요.</p>

      <div class="flex flex-col gap-3.5">
        <AppInput v-model="name" label="이름" placeholder="이름" autocomplete="name" />
        <AppInput v-model="birthDate" label="생년월일" placeholder="YYYY.MM.DD" />

        <AppInput
          v-model="phone"
          label="휴대폰번호"
          type="tel"
          placeholder="숫자만 입력해주세요"
          autocomplete="tel"
        >
          <template #action>
            <InputAction :disabled="!phone" @click="codeSent = true">인증번호 받기</InputAction>
          </template>
        </AppInput>

        <AppInput
          v-model="phoneCode"
          label="인증번호"
          placeholder="6자리를 입력해주세요"
          autocomplete="one-time-code"
        >
          <template v-if="codeSent" #hint>문자로 보낸 6자리를 입력해주세요.</template>
        </AppInput>

        <AppInput v-model="address" label="주소" placeholder="도로명 주소를 입력해주세요" />
        <AppInput v-model="addressDetail" label="상세주소" placeholder="상세주소" />
      </div>

      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>

      <div class="flex flex-1 flex-col justify-end">
        <AppButton type="submit" variant="strong" :disabled="!canSubmit">
          {{ pending ? '가입 중…' : '완료' }}
        </AppButton>
      </div>
    </form>
  </PhoneFrame>
</template>
