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
 *
 * 값이 차면 지우기(X)가 붙는다. 모바일에서 긴 입력을 한 글자씩 지우는 건 고통이고,
 * 특히 오타 난 이메일·휴대전화처럼 통째로 다시 쓰는 자리가 많다.
 */
const {
  label,
  type = 'text',
  placeholder = '',
  // 기본값을 두지 않으면 vue/require-default-prop 이 잡는다. 빈 문자열이나
  // 'off' 로 채우면 브라우저 자동완성 동작이 바뀌므로 undefined 그대로 둔다 —
  // 이때만 Vue 가 속성 자체를 렌더링하지 않는다.
  autocomplete = undefined,
  readonly = false,
  error = '',
} = defineProps<{
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel';
  placeholder?: string;
  autocomplete?: string;
  /** 직접 칠 수 없는 입력. 값을 시트나 검색으로 고르는 자리에 쓴다. */
  readonly?: boolean;
  /**
   * 이 입력이 무엇 때문에 거절됐는지. 비어 있으면 오류가 아니다.
   *
   * 화면 아래 한 줄로 몰아 보여주면 어느 칸을 고쳐야 하는지 알 수 없다. 그래서 칸에
   * 직접 붙이고 `aria-describedby` 로 이어 스크린리더도 그 칸의 오류로 읽게 한다.
   */
  error?: string;
}>();

const model = defineModel<string>({ default: '' });
const slots = useSlots();

const field = ref<HTMLInputElement | null>(null);

/** 오류 문구를 입력과 이어 주기 위한 id. 한 화면에 같은 라벨이 둘 있어도 안 겹친다. */
const errorId = useId();

/**
 * 지우기를 보일 것인가.
 *
 * 값이 없으면 지울 것도 없다. 읽기 전용은 시트나 검색으로 값을 정하는 자리라
 * 여기서 비우면 화면이 들고 있는 선택과 어긋난다 — 그쪽에서 다시 고르게 둔다.
 */
const clearable = computed(() => !!model.value && !readonly);

function clear() {
  model.value = '';
  // 지운 뒤엔 바로 다시 칠 수 있어야 한다. 키보드가 닫혔다 열리면 흐름이 끊긴다.
  field.value?.focus();
}

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
      :class="[
        hasAction ? 'rounded-button h-14 border' : '',
        hasAction ? (error ? 'border-danger' : 'border-line') : '',
      ]"
    >
      <div
        class="bg-surface rounded-field h-field flex flex-1 items-center gap-2 px-4"
        :class="hasAction ? '' : error ? 'border-danger border' : 'border-line border'"
      >
        <input
          ref="field"
          v-model="model"
          :type="inputType"
          :placeholder="placeholder"
          :autocomplete="autocomplete"
          :readonly="readonly"
          :aria-invalid="error ? 'true' : undefined"
          :aria-describedby="error ? errorId : undefined"
          class="text-input text-ink placeholder:text-ink-placeholder w-full bg-transparent outline-none"
          :class="readonly ? 'cursor-pointer' : ''"
        />

        <button
          v-if="clearable"
          type="button"
          class="text-ink-placeholder shrink-0"
          aria-label="입력 내용 지우기"
          @click.stop="clear"
        >
          <svg viewBox="0 0 20 20" class="size-5" aria-hidden="true">
            <circle cx="10" cy="10" r="8" fill="currentColor" />
            <path
              d="m10 8.9 2.1-2.1.9.9-2.1 2.1 2.1 2.1-.9.9-2.1-2.1-2.1 2.1-.9-.9 2.1-2.1-2.1-2.1.9-.9L10 8.9Z"
              fill="#fff"
            />
          </svg>
        </button>

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
              d="M2.3 2.3 1 3.6l3 3A11 11 0 0 0 1 10c1.7 3.4 5 6 9 6 1.5 0 3-.4 4.3-1l2.1 2.1 1.3-1.3L2.3 2.3ZM10 14a4 4 0 0 1-3.5-6l1.5 1.5a2 2 0 0 0 2.5 2.5L12 13.5c-.6.3-1.3.5-2 .5Zm9-4c-1.2-2.4-3.3-4.3-5.9-5.3l1.6 1.6c1.4.8 2.6 2 3.4 3.4-.5.9-1.1 1.6-1.9 2.3l1.2 1.2c1-.9 1.8-2 2.4-3.2h-.8Z"
            />
            <path
              v-else
              d="M10 4c-4 0-7.3 2.6-9 6 1.7 3.4 5 6 9 6s7.3-2.6 9-6c-1.7-3.4-5-6-9-6Zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
            />
          </svg>
        </button>
      </div>

      <slot name="action" />
    </div>

    <p v-if="error" :id="errorId" class="text-label2 text-danger">{{ error }}</p>
    <p v-else-if="$slots.hint" class="text-label2 text-ink-muted"><slot name="hint" /></p>
  </div>
</template>
