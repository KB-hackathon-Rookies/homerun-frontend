<script setup lang="ts">
/**
 * STEP 화면의 오류 한 줄.
 *
 * 대부분의 실패는 문구만 보여주면 된다 — 잠시 뒤 다시 누르면 된다. 그런데 409 는
 * 다르다. 다른 탭이나 다른 기기가 워크플로를 먼저 넘겨 버린 것이라 여기서 아무리
 * 다시 눌러도 저장되지 않는다. 그 경우에만 나갈 문을 하나 붙인다 — 서버에 단계를
 * 다시 묻고 맞는 화면으로 옮겨 준다.
 */
defineProps<{ message: string; conflict?: boolean }>();

defineEmits<{ retry: [] }>();
</script>

<template>
  <div v-if="message" class="flex flex-col items-start gap-1.5">
    <p class="text-label2 text-danger">{{ message }}</p>

    <button
      v-if="conflict"
      type="button"
      class="text-label2 text-primary-strong font-bold"
      @click="$emit('retry')"
    >
      지금 단계로 이동하기 →
    </button>
  </div>
</template>
