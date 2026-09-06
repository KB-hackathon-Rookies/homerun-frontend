<script setup lang="ts">
/**
 * 화면 하단 CTA.
 *
 * 오픈뱅킹·가입 완료 화면이 쓴다. 앞서 만든 `AppButton` 과 높이(56 대 58)와
 * 반경(12 대 14)이 다르다. 피그마가 두 벌로 그려 놓았고, 한쪽에 맞추면 다른
 * 쪽이 틀어지므로 그대로 둔다.
 */
const { disabled = false } = defineProps<{ disabled?: boolean }>();
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    class="bg-primary-deep rounded-field h-cta disabled:bg-disabled-soft disabled:text-ink-on-disabled w-full text-base font-semibold text-white transition-colors"
  >
    <slot />
  </button>
</template>
