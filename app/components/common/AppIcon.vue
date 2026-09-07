<script setup lang="ts">
/**
 * 선 아이콘.
 *
 * 피그마는 아이콘을 아이코니파이 이름(`famicons:eye-off-outline`,
 * `akar-icons:circle-check`, `ep:arrow-right-bold`)으로 적어 두었다. 그 라이브러리를
 * 통째로 들이는 대신 실제로 쓰는 것만 여기에 모았다. 열 개 남짓이라 의존성을
 * 하나 더 늘릴 이유가 없다.
 *
 * 모두 24 격자에 굵기 2 로 그렸고 `currentColor` 를 따른다. 크기는 쓰는 쪽에서
 * `class="size-5"` 처럼 정한다.
 */
export type IconName =
  | 'chevron-left'
  | 'chevron-right'
  | 'arrow-right'
  | 'check'
  | 'lock'
  | 'user'
  | 'coin'
  | 'home'
  | 'document'
  | 'building'
  | 'shield'
  | 'bell'
  | 'search'
  | 'persons'
  | 'bolt'
  | 'share';

const { name } = defineProps<{ name: IconName }>();

const PATHS: Record<IconName, string> = {
  'chevron-left': 'm15 4-7 8 7 8',
  'chevron-right': 'm9 4 7 8-7 8',
  'arrow-right': 'M4 12h15m-6-6 6 6-6 6',
  check: 'm5 12 5 5L19 8',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v9H5z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20a8 8 0 0 1 16 0',
  coin: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm2.5-11.5A2.5 2.5 0 0 0 12 8c-1.5 0-2.5.9-2.5 2s1 1.9 2.5 2 2.5.9 2.5 2-1 2-2.5 2a2.5 2.5 0 0 1-2.5-1.5M12 6.5v11',
  home: 'M4 10.5 12 4l8 6.5V20H4z',
  document: 'M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6',
  building: 'M4 21V6l7-3v18M11 21V9l9 3v9M7 9h1m-1 3h1m-1 3h1m7 0h1m-1 3h1',
  shield: 'M12 3.5 20 6v6c0 4.5-3.2 7.6-8 9-4.8-1.4-8-4.5-8-9V6zm-3 8.5 2.5 2.5L16 10',
  bell: 'M6 9a6 6 0 1 1 12 0v5l2 3H4l2-3zm4 11h4',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 4 4',
  persons:
    'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9a6 6 0 0 1 12 0m1.5-15.7a3.5 3.5 0 0 1 0 6.9M17 20h4a5 5 0 0 0-3-4.6',
  bolt: 'M13 3 5 13.5h6L11 21l8-10.5h-6z',
  /* iOS 공유 버튼. 위로 향한 화살표가 상자에서 나가는 모양이다. */
  share: 'M12 15V3m0 0L8 7m4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7',
};
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="PATHS[name]" />
  </svg>
</template>
