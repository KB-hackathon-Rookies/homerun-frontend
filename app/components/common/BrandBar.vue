<script setup lang="ts">
/**
 * 워드마크와 알림·마이가 있는 상단 바.
 *
 * 시안 메인 1~10 이 전부 이 줄로 시작한다. 홈은 이것만 쓰고, 하위 화면은
 * 아래에 제목 줄(`PageBar`)을 한 겹 더 얹는다 — 그때는 아래 선을 제목 줄이
 * 가지므로 이 줄에는 긋지 않는다.
 *
 * 뒤로가기가 붙는 `TopBar`·`PageBar` 와는 다른 물건이라 따로 둔다.
 */
const { bordered = false } = defineProps<{
  /** 아래 구분선. 이 줄로 상단이 끝날 때만 켠다. */
  bordered?: boolean;
}>();

const { hasUnread, refresh } = useUnreadNotifications();
onMounted(refresh);
</script>

<template>
  <header
    class="h-topbar-tall px-gutter bg-surface flex shrink-0 items-center gap-1"
    :class="bordered ? 'border-line border-b' : ''"
  >
    <!-- 워드마크 자체가 홈이다. 별도 홈 아이콘을 두지 않는다. -->
    <button type="button" class="-ml-1 p-1" aria-label="홈으로 이동" @click="navigateTo('/home')">
      <span class="text-hero text-primary-strong italic">HomeRun</span>
    </button>
    <span class="flex-1" />

    <!-- 오른쪽엔 알림·마이 둘만. 둘 다 flex-center 로 두어 아이콘 높이를 맞춘다
         (한쪽만 span 으로 감싸면 baseline 이 어긋난다). 클릭 영역 40px(p-2 + 24px). -->
    <button
      type="button"
      class="relative flex items-center justify-center p-2"
      aria-label="알림"
      @click="navigateTo('/notifications')"
    >
      <AppIcon name="bell" class="text-ink-hero size-6" />
      <!-- 안 읽은 알림이 있을 때만. 상태가 없으면(0건) 안 켠다. -->
      <span
        v-if="hasUnread"
        class="bg-danger-deep ring-surface absolute top-1 right-1 size-2 rounded-full ring-2"
      />
    </button>
    <button
      type="button"
      class="-mr-2 flex items-center justify-center p-2"
      aria-label="마이페이지"
      @click="navigateTo('/my')"
    >
      <AppIcon name="user" class="text-ink-hero size-6" />
    </button>
  </header>
</template>
