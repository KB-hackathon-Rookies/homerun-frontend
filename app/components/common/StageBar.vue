<script setup lang="ts">
import type { Base } from '~/components/common/StepIndicator.vue';
import { useUnreadNotifications } from '~/composables/useUnreadNotifications';

/**
 * 진단 화면의 머리.
 *
 * 상단 바와 진행 표시가 한 몸으로 붙어 다닌다. 1루·2루의 모든 화면이 같은
 * 모양이라 한 곳에 둔다 — 화면마다 베껴 두면 어느 한 곳만 어긋난다.
 *
 * 뒤로가기는 화면이 정한다. 브라우저 기록을 되감으면 방금 저장한 단계로
 * 돌아가 버리는 자리가 있어서다.
 */
defineProps<{ title: string; base: Base }>();

defineEmits<{ back: [] }>();

const { hasUnread, refresh } = useUnreadNotifications();
onMounted(refresh);
</script>

<template>
  <div class="h-statusbar shrink-0" />

  <header
    class="h-topbar px-gutter-tight border-line bg-surface flex shrink-0 items-center gap-2.5 border-b"
  >
    <button type="button" class="text-ink -ml-1 p-1" aria-label="뒤로" @click="$emit('back')">
      <AppIcon name="chevron-left" class="size-icon" />
    </button>

    <!-- 상세 화면에서도 로고를 홈으로 쓰면, 여러 단계 뒤로 갈 필요가 없다. -->
    <button
      type="button"
      class="text-primary-strong shrink-0 italic"
      aria-label="홈으로 이동"
      @click="navigateTo('/home')"
    >
      <span class="text-headline2 font-bold">HomeRun</span>
    </button>

    <h1 class="text-label2 text-ink-hero min-w-0 flex-1 truncate font-semibold">{{ title }}</h1>

    <!--
      상단 바 오른쪽엔 알림·마이가 늘 붙어 있다. 이게 빠져 있으면 여정 화면에서
      나가려면 뒤로가기를 단계 수만큼 눌러야 한다 — 3루 안쪽에서는 열다섯 번을
      눌러도 못 나갔다. 마이가 홈으로 가는 문(마이 상단의 홈런 워드마크)까지 잇는다.
      45개 화면이 이 머리를 함께 쓰므로 여기 한 번만 두면 어디서든 한 번에 나간다.
    -->
    <button
      type="button"
      class="text-ink relative flex items-center justify-center p-1"
      aria-label="알림"
      @click="navigateTo('/notifications')"
    >
      <AppIcon name="bell" class="size-icon" />
      <span
        v-if="hasUnread"
        class="bg-danger-deep ring-surface absolute top-0.5 right-0.5 size-2 rounded-full ring-2"
      />
    </button>
    <button
      type="button"
      class="text-ink -mr-1 flex items-center justify-center p-1"
      aria-label="마이페이지"
      @click="navigateTo('/my')"
    >
      <AppIcon name="user" class="size-icon" />
    </button>
  </header>

  <BaseStrip :base="base" />
</template>
