<script setup lang="ts">
import { useAddressApi, type AddressResult } from '~/api/address';
import { useAuthApi } from '~/api/auth';
import { useRegionApi, type RegionOption } from '~/api/region';
import type { Term } from '~/components/common/TermsAgreement.vue';
import { useRequiredTerms } from '~/composables/useRequiredTerms';
import { useTerms } from '~/composables/useTerms';
import { useAuthStore } from '~/stores/auth';
import { useSignupStore } from '~/stores/signup';
import { messageFrom } from '~/utils/error';

/**
 * AU-04 회원가입 · 본인 확인.
 *
 * 마지막 단계다. 여기서 실제 가입 요청이 나간다.
 *
 * 백엔드(`LocalSignupRequest`)는 이메일·비밀번호·이름·생년월일·휴대전화·지역(regionId)과
 * **이메일·휴대전화 인증 토큰 둘 다**를 받아 원자적으로 가입한다. 그래서 이 화면에서
 * 휴대전화 인증을 실제로 마치고(토큰 획득), 도로명 주소를 검색해 골라야 완료가 열린다.
 *
 * 지역은 따로 고르지 않는다. 고른 주소의 법정동 코드 앞 두 자리(시도)로 정책 권역
 * (서울·인천·경기·그 외)을 자동으로 정한다. 주소·상세주소는 detailAddress 로 보낸다.
 *
 * 들어오는 길이 둘이다. **이메일**은 위 그대로다. **소셜**은 콜백(`/auth/callback`)에서 계정과
 * 세션이 이미 만들어져 있어서, 제공자가 주지 않는 값만 채워 `POST /auth/social/signup` 으로
 * 가입을 끝낸다. 화면에서 받는 값은 둘이 같고 보내는 곳만 다르다.
 *
 * 소셜은 약관 화면을 거치지 않고 여기로 곧장 온다. 그래서 필수 동의를 이 화면에서 함께 받는다 —
 * 백엔드에 `RequiredTermsAgreementFilter` 가 있어 동의 기록이 없으면 가입 직후 모든 요청이 403
 * 이 된다. 동의는 가입 요청 직전에 서버로 남긴다.
 */
const signup = useSignupStore();
const auth = useAuthStore();
const { sendPhoneVerification, confirmPhoneVerification, socialSignup } = useAuthApi();
const { jeonseOptions } = useRegionApi();

/** 소셜로 들어왔는가. 콜백에서 세션이 이미 걸려 있으면 소셜이다. */
const isSocial = computed(() => auth.isAuthenticated);

/** 소셜만 여기서 동의를 받는다. 이메일은 앞의 약관 화면에서 이미 받았다. */
const TERMS: Term[] = [
  { id: 'service', label: '[필수] 서비스 이용약관', required: true },
  { id: 'privacy', label: '[필수] 개인정보 수집·이용 동의', required: true },
  { id: 'identity', label: '[필수] 고유식별정보 처리 동의', required: true },
  { id: 'marketing', label: '[선택] 마케팅 정보 수신 동의', required: false },
];
const { agreed, canProceed: termsAgreed } = useTerms(TERMS);

/** 선택 약관을 사용자가 실제로 체크했는가. 코드가 대신 정하지 않는다. */
const optionalAgreed = computed(() =>
  TERMS.filter((term) => !term.required).every((term) => agreed.value[term.id]),
);

/** 법정동 코드 시도 앞자리 → 정책 권역 코드. 나머지는 전부 그 외 지역이다. */
const SIDO_TO_REGION: Record<string, string> = {
  '11': 'JEONSE_SEOUL',
  '28': 'JEONSE_INCHEON',
  '41': 'JEONSE_GYEONGGI',
};

const name = ref(signup.name || auth.user?.name || '');
const birthDate = ref(signup.birthDate);
const phone = ref(signup.phone);
const phoneCode = ref('');
const addressDetail = ref('');

const keyword = ref('');
const results = ref<AddressResult[]>([]);
const chosen = ref<AddressResult | null>(null);
const searching = ref(false);
const notice = ref('');

const regionOptions = ref<RegionOption[]>([]);

const phoneSent = ref(false);
const error = ref('');
const pending = ref(false);

/** 숫자만 남긴 휴대전화. send·confirm·가입에 같은 값을 써야 백엔드 해시가 맞는다. */
const phoneDigits = computed(() => phone.value.replace(/\D/g, ''));

/** "19990719" · "1999.07.19" · "1999-07-19" 를 모두 yyyy-MM-dd 로 맞춘다. */
const birthDateIso = computed(() => {
  const d = birthDate.value.replace(/\D/g, '');
  return d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : '';
});

/** 고른 주소의 법정동 코드로 정한 정책 권역. 주소를 고르기 전에는 없다. */
const region = computed<RegionOption | null>(() => {
  if (!chosen.value) return null;
  const sido = (chosen.value.legalDistrictCode ?? '').slice(0, 2);
  const code = SIDO_TO_REGION[sido] ?? 'JEONSE_OTHER';
  return regionOptions.value.find((option) => option.code === code) ?? null;
});

const canSubmit = computed(
  () =>
    !!name.value &&
    !!birthDateIso.value &&
    phoneDigits.value.length >= 9 &&
    signup.isPhoneVerified &&
    !!region.value &&
    (!isSocial.value || termsAgreed.value) &&
    !pending.value,
);

/**
 * 앞 단계(이메일 인증)를 건너뛰고 들어오면 보낼 것이 없다. 처음으로 돌려보낸다.
 *
 * 소셜은 이메일 인증을 거치지 않으므로 이 가드에 걸리면 안 된다.
 */
onMounted(async () => {
  if (!isSocial.value && !signup.isEmailVerified) {
    navigateTo('/signup', { replace: true });
    return;
  }
  try {
    regionOptions.value = await jeonseOptions();
  } catch (cause) {
    error.value = messageFrom(cause, '지역 정보를 불러오지 못했어요.');
  }
});

async function search() {
  const text = keyword.value.trim();
  if (text.length < 2 || searching.value) return;
  searching.value = true;
  error.value = '';
  chosen.value = null;
  try {
    results.value = (await useAddressApi().search(text)).addresses;
    notice.value = results.value.length ? '' : '찾는 주소가 없어요. 도로명으로 다시 검색해보세요.';
  } catch (cause) {
    error.value = messageFrom(cause, '주소를 검색하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    searching.value = false;
  }
}

async function sendPhone() {
  if (phoneDigits.value.length < 9 || pending.value) return;
  pending.value = true;
  error.value = '';
  try {
    await sendPhoneVerification(phoneDigits.value);
    phoneSent.value = true;
  } catch (cause) {
    error.value = messageFrom(cause, '인증번호를 보내지 못했어요.');
  } finally {
    pending.value = false;
  }
}

async function confirmPhone() {
  if (phoneCode.value.length !== 6 || pending.value) return;
  pending.value = true;
  error.value = '';
  try {
    const { verificationToken } = await confirmPhoneVerification(
      phoneDigits.value,
      phoneCode.value,
    );
    signup.phoneVerificationToken = verificationToken;
  } catch (cause) {
    error.value = messageFrom(cause, '인증번호가 맞지 않아요.');
  } finally {
    pending.value = false;
  }
}

async function submit() {
  if (!canSubmit.value || !region.value || !chosen.value) return;

  pending.value = true;
  error.value = '';
  const detailAddress = [chosen.value.roadAddress, addressDetail.value]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ');
  try {
    if (isSocial.value) {
      // 동의를 먼저 남긴다. 가입만 되고 동의가 없으면 다음 화면부터 전부 403 이다.
      // 사용자가 화면에서 직접 고른 값을 그대로 넘긴다.
      await useRequiredTerms().ensure({
        requiredAgreed: termsAgreed.value,
        optionalAgreed: optionalAgreed.value,
      });
      auth.user = await socialSignup({
        name: name.value,
        birthDate: birthDateIso.value,
        phone: phoneDigits.value,
        phoneVerificationToken: signup.phoneVerificationToken,
        regionId: region.value.id,
        detailAddress: detailAddress || undefined,
      });
    } else {
      signup.name = name.value;
      signup.birthDate = birthDateIso.value;
      signup.phone = phoneDigits.value;
      signup.regionId = region.value.id;
      signup.detailAddress = detailAddress;
      await signup.submit();
    }
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
            <InputAction :disabled="phoneDigits.length < 9 || pending" @click="sendPhone">
              {{ phoneSent ? '재발송' : '인증번호 받기' }}
            </InputAction>
          </template>
        </AppInput>

        <AppInput
          v-model="phoneCode"
          label="인증번호"
          placeholder="6자리를 입력해주세요"
          autocomplete="one-time-code"
        >
          <template #action>
            <InputAction
              :disabled="!phoneSent || phoneCode.length !== 6 || pending || signup.isPhoneVerified"
              @click="confirmPhone"
            >
              확인
            </InputAction>
          </template>
          <template v-if="signup.isPhoneVerified" #hint>인증이 완료됐어요.</template>
          <template v-else-if="phoneSent" #hint>문자로 보낸 6자리를 입력해주세요.</template>
        </AppInput>

        <div class="flex flex-col gap-2">
          <span class="text-label2 text-ink-body">주소</span>
          <div
            class="bg-surface border-line rounded-field flex items-center gap-2 border px-3.5 py-3"
          >
            <input
              v-model="keyword"
              type="search"
              placeholder="도로명 주소를 검색하세요"
              class="text-input text-ink-strong placeholder:text-ink-muted w-full bg-transparent outline-none"
              @keydown.enter.prevent="search"
            />
            <button
              type="button"
              class="text-label2 text-primary-strong shrink-0 font-bold disabled:opacity-50"
              :disabled="keyword.trim().length < 2 || searching"
              @click="search"
            >
              {{ searching ? '검색 중' : '검색' }}
            </button>
          </div>

          <p v-if="notice" class="text-label2 text-ink-muted">{{ notice }}</p>

          <button
            v-for="result in results"
            :key="result.roadAddress + result.mainLotNumber + result.subLotNumber"
            type="button"
            class="rounded-field border p-4 text-left transition-colors"
            :class="
              chosen === result ? 'border-primary-strong bg-surface-info' : 'border-line bg-surface'
            "
            @click="chosen = result"
          >
            <p class="text-body2 text-ink-hero font-bold">{{ result.roadAddress }}</p>
            <p class="text-label2 text-ink-hero-body mt-3">
              {{ result.buildingName || result.jibunAddress }}
            </p>
          </button>

          <p v-if="chosen && region" class="text-label2 text-primary-strong">
            선택한 지역: {{ region.name }}
          </p>
        </div>

        <AppInput
          v-model="addressDetail"
          label="상세주소"
          placeholder="동·호수 등 상세주소"
          :disabled="!chosen"
        />

        <div v-if="isSocial" class="flex flex-col gap-2 pt-2">
          <span class="text-label2 text-ink-body">약관 동의</span>
          <TermsAgreement v-model="agreed" :terms="TERMS" />
          <p class="text-caption1 text-ink-subtle">
            선택항목에 동의하지 않아도 서비스 이용이 가능합니다.
          </p>
        </div>
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
