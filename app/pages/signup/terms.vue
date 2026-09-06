<script setup lang="ts">
/**
 * AU-05 약관 동의.
 *
 * 필수 항목이 전부 체크돼야 다음으로 넘어간다. 선택 항목은 막지 않는다.
 * 전체 동의는 아래 항목들의 상태를 그대로 따라간다.
 */
interface Term {
  id: string;
  label: string;
  required: boolean;
}

const TERMS: Term[] = [
  { id: 'service', label: '[필수] 서비스 이용약관', required: true },
  { id: 'privacy', label: '[필수] 개인정보 수집·이용 동의', required: true },
  { id: 'identity', label: '[필수] 고유식별정보 처리 동의', required: true },
  { id: 'marketing', label: '[선택] 마케팅 정보 수신 동의', required: false },
];

const agreed = ref<Record<string, boolean>>(
  Object.fromEntries(TERMS.map((term) => [term.id, false])),
);

const allAgreed = computed({
  get: () => TERMS.every((term) => agreed.value[term.id]),
  set: (value: boolean) => {
    for (const term of TERMS) agreed.value[term.id] = value;
  },
});

const canProceed = computed(() =>
  TERMS.filter((term) => term.required).every((term) => agreed.value[term.id]),
);
</script>

<template>
  <PhoneFrame>
    <div class="h-statusbar shrink-0" />
    <TopBar title="약관 동의" />

    <div class="px-gutter flex flex-1 flex-col gap-2 py-6">
      <p class="text-body2 text-ink-body pb-2">
        서비스를 이용하기 위해 필요 약관에 동의가 필요해요.
      </p>

      <div class="border-line rounded-field h-button flex items-center px-2.5">
        <AppCheckbox v-model="allAgreed">전체 동의하기</AppCheckbox>
      </div>

      <div class="border-line rounded-field flex flex-col px-2.5 py-1">
        <div
          v-for="(term, index) in TERMS"
          :key="term.id"
          class="flex items-center gap-2.5 p-2.5"
          :class="index < TERMS.length - 1 ? 'border-line border-b' : ''"
        >
          <AppCheckbox v-model="agreed[term.id]">
            {{ term.label }}
            <template #trailing>
              <AppIcon name="arrow-right" class="text-line-arrow size-4 shrink-0" />
            </template>
          </AppCheckbox>
        </div>
      </div>
    </div>

    <footer class="px-gutter flex shrink-0 flex-col gap-3 pb-6">
      <p class="text-caption1 text-ink-subtle text-center">
        선택항목에 동의하지 않아도 서비스 이용이 가능합니다.
      </p>
      <AppButton :disabled="!canProceed" @click="navigateTo('/signup')"
        >동의하고 계속하기</AppButton
      >
    </footer>
  </PhoneFrame>
</template>
