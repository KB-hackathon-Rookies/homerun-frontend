<script setup lang="ts">
/**
 * 입력 상자 오른쪽에 붙는 인라인 버튼. "인증번호 받기", "확인" 자리다.
 *
 * 테두리는 바깥 상자가 이미 그렸으므로 여기서는 그리지 않는다. 두 겹이 된다.
 */
const { disabled = false } = defineProps<{ disabled?: boolean }>();
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    class="text-headline2 text-primary-action h-field shrink-0 px-4 disabled:opacity-40"
  >
    <slot />
  </button>
</template>
