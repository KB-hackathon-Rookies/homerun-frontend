<script setup lang="ts">
import { useAgreementApi, type Term as ServerTerm } from '~/api/terms-status';
import type { Term } from '~/components/common/TermsAgreement.vue';
import { messageFrom } from '~/utils/error';
import { safeRedirect } from '~/utils/redirect';
import { REQUIRED_TERMS_PATH } from '~/utils/requiredTerms';

// 브라우저 탭 제목.
useHead({ title: '필수 약관 동의' });

/**
 * 이미 가입한 사람이 필수 약관에 다시 동의하는 화면.
 *
 * 백엔드 `RequiredTermsAgreementFilter` 가 동의 기록이 없으면 **모든** 요청을 403
 * `TERMS_005` 로 끊는다. 약관이 개정되면 기존 사용자 전원이 동시에 그렇게 되고,
 * 가입 중 동의 저장이 한 번 실패해도 같다(`useRequiredTerms.ensure` 는 실패해도
 * 가입을 되돌리지 않는다 — 계정은 이미 만들어졌다). 그러면 로그인만 되고 그 다음이
 * 통째로 죽는데, 지금까지는 동의하러 갈 길이 앱 어디에도 없었다.
 *
 * ## `/signup/terms` 로는 안 된다
 *
 * 그쪽은 가입 흐름의 한 걸음이다. 동의를 남긴 뒤 본인 확인(`/signup/identity`)으로
 * 보내므로 이미 가입을 마친 사람을 거기로 밀어 넣으면 본인 확인을 다시 시키게 된다.
 * 약관 목록도 화면에 박아 둔 네 줄이라 개정으로 늘거나 줄면 어긋난다.
 *
 * ## 그래서 목록은 서버가 기준이다
 *
 * `GET /terms` 가 지금 유효한 약관이고 버전이 붙어 온다. 화면이 들고 있는 줄로
 * 동의를 남기면 사용자가 보지 않은 약관에 동의한 것이 된다.
 */
definePageMeta({ middleware: 'auth' });

const api = useAgreementApi();
const route = useRoute();

const terms = ref<ServerTerm[]>([]);
const agreed = ref<Record<string, boolean>>({});
const pending = ref(true);
const saving = ref(false);
const error = ref('');
/** 들어와 보니 이미 다 동의돼 있는 경우. 다른 탭에서 끝냈거나 링크로 들어온 것이다. */
const alreadyDone = ref(false);

/** 체크박스 묶음이 쓰는 형태로. `id` 는 약관 코드다 — 개정돼도 코드는 그대로다. */
const checkList = computed<Term[]>(() =>
  terms.value.map((term) => ({
    id: term.code,
    label: `[${term.required ? '필수' : '선택'}] ${term.title}`,
    required: term.required,
  })),
);

/** 필수를 하나라도 빼면 어차피 서버가 거절한다(TERMS_003). 여기서 먼저 막는다. */
const canProceed = computed(
  () =>
    !!terms.value.length &&
    terms.value.filter((term) => term.required).every((term) => agreed.value[term.code]),
);

/**
 * 동의를 마치고 돌아갈 곳.
 *
 * 주소창에 실려 오니 남이 심을 수 있어 `safeRedirect` 로 앱 안의 경로만 받는다.
 * 이 화면 자신이면 홈으로 바꾼다 — 동의하고도 제자리에 남으면 막힌 것과 같다.
 */
const destination = computed(() => {
  const target = safeRedirect(route.query.redirect);
  return target && !target.startsWith(REQUIRED_TERMS_PATH) ? target : '/home';
});

/**
 * 이미 동의한 것은 미리 체크해 둔다.
 *
 * 개정된 한 줄 때문에 막힌 사람에게 나머지를 다시 고르게 할 이유가 없다. 버전까지
 * 맞을 때만 체크한다 — 코드만 보면 지난 버전에 한 동의가 새 버전 동의로 둔갑한다.
 */
async function load() {
  const [list, mine] = await Promise.all([api.list(), api.mine()]);

  const done = new Set(
    mine.agreements.filter((item) => item.agreed).map((item) => `${item.code}@${item.version}`),
  );

  terms.value = list;
  agreed.value = Object.fromEntries(
    list.map((term) => [term.code, done.has(`${term.code}@${term.version}`)]),
  );
  alreadyDone.value = mine.allRequiredAgreed;
}

onMounted(() =>
  load()
    .catch((cause) => {
      error.value = messageFrom(cause, '약관을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
    })
    .finally(() => {
      pending.value = false;
    }),
);

async function submit() {
  if (!canProceed.value || saving.value) return;
  saving.value = true;
  error.value = '';
  try {
    // 선택 약관은 사용자가 실제로 고른 값을 그대로 남긴다. 코드가 참으로 채우지 않는다.
    await api.agree(
      terms.value.map((term) => ({
        code: term.code,
        version: term.version,
        agreed: !!agreed.value[term.code],
      })),
    );
    // 뒤로가기로 이 화면에 다시 서지 않게 기록을 바꿔치기한다.
    await navigateTo(destination.value, { replace: true });
  } catch (cause) {
    error.value = messageFrom(cause, '약관 동의를 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <PhoneFrame>
    <div class="h-statusbar shrink-0" />

    <!--
      뒤로가기를 두지 않는다. 돌아갈 곳이 바로 그 막혀 있던 화면이라, 열자마자 같은
      403 을 받고 이 화면으로 되돌아온다. 나가는 길은 아래 '동의하고 계속하기' 하나다.
    -->
    <header class="h-topbar px-gutter flex shrink-0 items-center">
      <h1 class="text-question text-ink">필수 약관 동의</h1>
    </header>

    <div class="px-gutter flex flex-1 flex-col gap-2 py-6">
      <p class="text-body2 text-ink-body pb-2">
        약관이 새로 바뀌었어요. 필수 항목에 동의해야 서비스를 이어서 이용할 수 있어요.
      </p>

      <p v-if="pending" class="text-label2 text-ink-muted">약관을 불러오는 중이에요…</p>

      <template v-else-if="terms.length">
        <TermsAgreement v-model="agreed" :terms="checkList" />

        <!--
          다시 동의를 받는 자리라 전문을 볼 길이 있어야 한다. `TermsAgreement` 는
          링크를 받지 않아서 아래에 따로 둔다.
        -->
        <div class="flex flex-col gap-1 pt-1">
          <a
            v-for="term in terms"
            :key="term.code"
            :href="term.contentUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-caption1 text-ink-muted underline"
          >
            {{ term.title }} 전문 보기
          </a>
        </div>
      </template>

      <p v-else-if="!error" class="text-label2 text-ink-muted">
        받아야 할 약관이 없어요. 잠시 후 다시 열어봐 주세요.
      </p>

      <p v-if="alreadyDone" class="text-label2 text-ink-muted">
        이미 필수 약관에 동의돼 있어요. 그대로 계속하면 돼요.
      </p>

      <p v-if="error" class="text-label2 text-danger">{{ error }}</p>
    </div>

    <footer class="px-gutter flex shrink-0 flex-col gap-3 pb-cta-pad">
      <p class="text-caption1 text-ink-subtle text-center">
        선택항목에 동의하지 않아도 서비스 이용이 가능합니다.
      </p>
      <AppButton :disabled="!canProceed || pending || saving" @click="submit">
        {{ saving ? '저장 중…' : '동의하고 계속하기' }}
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
