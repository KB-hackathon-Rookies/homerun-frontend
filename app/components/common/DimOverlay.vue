<script setup lang="ts">
/**
 * 딤 오버레이.
 *
 * 화면을 덮고 아래에서 카드를 올린다. 준비 중 안내·안착 축하처럼 흐름을 잠깐
 * 멈추고 한 가지만 말하는 자리에서 쓴다. 바깥을 누르면 닫힌다 — 실수로 열렸을
 * 때 되돌아갈 길을 막지 않는다. 닫기를 막아야 하는 자리는 dismissible 을 끈다.
 */
const { dismissible = true } = defineProps<{ dismissible?: boolean }>();

const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <div
    class="bg-scrim fixed inset-0 z-40 flex items-end justify-center"
    @click.self="dismissible && emit('close')"
  >
    <div class="bg-surface rounded-t-screen w-full max-w-screen px-gutter pt-6 pb-cta-pad">
      <slot />
    </div>
  </div>
</template>
