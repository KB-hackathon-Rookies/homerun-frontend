<script setup lang="ts">
/**
 * 회원정보에서 가져온 값(시안 1루 1).
 *
 * 가입 때 이미 받은 이름·생년월일·병역은 다시 묻지 않고 보여만 준다. 틀렸으면
 * 회원정보에서 고치게 한다 — 여기서 고치면 두 곳의 값이 갈라진다.
 *
 * 값이 아직 안 왔거나 없으면 그 조각만 빼고 있는 것끼리 잇는다. 자리를 비워 두면
 * "· ·" 같은 빈 구분자가 남는다.
 */
defineProps<{ facts: string[] }>();
</script>

<template>
  <div class="bg-surface-active rounded-field flex w-full items-center gap-2.5 px-3 py-2.5">
    <div class="flex min-w-0 flex-1 flex-col gap-0.5">
      <p class="text-caption-tight text-primary-strong font-medium">회원정보에서 가져왔어요</p>
      <p class="text-numeric text-ink-card">{{ facts.join(' · ') }}</p>
    </div>

    <button type="button" class="text-row text-ink-label shrink-0" @click="navigateTo('/my')">
      수정 ›
    </button>
  </div>
</template>
