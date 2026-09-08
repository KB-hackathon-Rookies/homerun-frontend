<script setup lang="ts">
/**
 * 딤 오버레이.
 *
 * 화면을 덮고 카드 하나를 띄운다. 준비 중 안내·안착 축하처럼 흐름을 잠깐 멈추고
 * 한 가지만 말하는 자리에서 쓴다. 바깥을 누르면 닫힌다 — 실수로 열렸을 때
 * 되돌아갈 길을 막지 않는다. 닫기를 막아야 하는 자리는 dismissible 을 끈다.
 *
 * 카드가 붙는 자리가 둘이다.
 *
 * - `sheet` — 아래에서 올라와 폭을 다 쓴다. 고를 것이 여럿이거나 길 때(생년월일 휠,
 *   코치 대화). 대부분이 이쪽이라 기본값이다.
 * - `center` — 가운데 뜬다. 말이 짧고 답이 하나뿐일 때. 시안 벤치 4 가 이 형태다.
 */
const { dismissible = true, placement = 'sheet' } = defineProps<{
  dismissible?: boolean;
  placement?: 'sheet' | 'center';
}>();

const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <div
    class="bg-scrim fixed inset-0 z-40 flex justify-center"
    :class="placement === 'center' ? 'px-gutter items-center' : 'items-end'"
    @click.self="dismissible && emit('close')"
  >
    <div
      v-if="placement === 'center'"
      class="bg-surface rounded-modal w-modal flex max-w-full flex-col items-center gap-2.5 px-6 pt-7 pb-6"
    >
      <slot />
    </div>
    <div v-else class="bg-surface rounded-t-screen max-w-screen px-gutter pt-6 pb-cta-pad w-full">
      <slot />
    </div>
  </div>
</template>
