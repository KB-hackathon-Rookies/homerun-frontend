<script setup lang="ts">
/**
 * 라벨이 붙은 입력.
 *
 * 피그마에 세 형태가 나온다. 셋 다 라벨 13/500 + 상자 h54 · r12 로 같고,
 * 상자 오른쪽에 무엇이 붙는지만 다르다.
 *
 * 1. 그냥 입력 (이름, 생년월일)
 * 2. 비밀번호 — 오른쪽에 보기 토글
 * 3. 인증 — 오른쪽에 "인증번호 받기" 버튼. 이때는 바깥 테두리가 r14 로 감싼다
 */
const {
  label,
  type = 'text',
  placeholder = '',
  autocomplete,
} = defineProps<{
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel';
  placeholder?: string;
  autocomplete?: string;
}>();

const model = defineModel<string>({ default: '' });
const slots = useSlots();

/** 비밀번호는 눈 아이콘으로 잠깐 볼 수 있어야 한다. */
const revealed = ref(false);
const inputType = computed(() => (type === 'password' && revealed.value ? 'text' : type));

/** 오른쪽에 버튼이 붙으면 테두리를 바깥이 갖는다. 두 겹으로 그려지지 않게 한다. */
const hasAction = computed(() => !!slots.action);
</script>

<template>
  <div class="flex w-full flex-col gap-1.5">
    <label class="text-label2 text-ink">{{ label }}</label>

    <div
      class="flex items-center"
      :class="hasAction ? 'rounded-button border-line h-14 border' : ''"
    >
      <div
        class="bg-surface rounded-field h-field flex flex-1 items-center gap-2 px-4"
        :class="hasAction ? '' : 'border-line border'"
      >
        <input
          v-model="model"
          :type="inputType"
          :placeholder="placeholder"
          :autocomplete="autocomplete"
          class="text-input text-ink placeholder:text-ink-placeholder w-full bg-transparent outline-none"
        />

        <button
          v-if="type === 'password'"
          type="button"
          class="text-ink-placeholder shrink-0"
          :aria-label="revealed ? '비밀번호 숨기기' : '비밀번호 보기'"
          @click="revealed = !revealed"
        >
          <svg viewBox="0 0 20 20" class="size-5" fill="currentColor" aria-hidden="true">
            <path
              v-if="revealed"
              d="M10 4c-4 0-7.3 2.6-9 6 1.7 3.4 5 6 9 6s7.3-2.6 9-6c-1.7-3.4-5-6-9-6Zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
            />
            <path
              v-else
              d="M2.3 2.3 1 3.6l3 3A11 11 0 0 0 1 10c1.7 3.4 5 6 9 6 1.5 0 3-.4 4.3-1l2.1 2.1 1.3-1.3L2.3 2.3ZM10 14a4 4 0 0 1-3.5-6l1.5 1.5a2 2 0 0 0 2.5 2.5L12 13.5c-.6.3-1.3.5-2 .5Zm9-4c-1.2-2.4-3.3-4.3-5.9-5.3l1.6 1.6c1.4.8 2.6 2 3.4 3.4-.5.9-1.1 1.6-1.9 2.3l1.2 1.2c1-.9 1.8-2 2.4-3.2h-.8Z"
            />
          </svg>
        </button>
      </div>

      <slot name="action" />
    </div>

    <p v-if="$slots.hint" class="text-label2 text-ink-muted"><slot name="hint" /></p>
  </div>
</template>
