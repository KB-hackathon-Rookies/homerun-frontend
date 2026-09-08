<script setup lang="ts">
/**
 * 굴려서 고르는 한 줄. 년·월·일이 같은 것을 세 번 쓴다.
 *
 * 스크롤 스냅이 칸을 맞추고, 우리는 `scrollTop` 을 칸 높이로 나눠 지금 가운데에
 * 무엇이 있는지만 읽는다. 위아래에 빈 칸을 반지름만큼 깔아 두어야 첫 항목과 마지막
 * 항목도 가운데까지 올라온다.
 *
 * 글자는 가운데에서 멀어질수록 옅어진다. 그래서 스크롤 위치를 정수가 아니라 소수로
 * 들고 있는다 — 굴리는 중간에도 농도가 따라 움직인다.
 */
const { items, row, radius } = defineProps<{
  items: number[];
  unit: string;
  label: string;
  row: number;
  radius: number;
}>();

const model = defineModel<number>({ required: true });

const track = ref<HTMLElement | null>(null);
/** 지금 가운데에 있는 위치. 굴리는 중에는 소수가 된다. */
const offset = ref(0);

/** 굴림이 멈춘 뒤에만 값을 확정한다. 지나가는 칸마다 바꾸면 값이 요동친다. */
let settle: ReturnType<typeof setTimeout> | undefined;

function onScroll() {
  const element = track.value;
  if (!element) return;

  offset.value = element.scrollTop / row;

  clearTimeout(settle);
  settle = setTimeout(() => {
    const picked = items[Math.round(element.scrollTop / row)];
    if (picked !== undefined) model.value = picked;
  }, 120);
}

/** 고른 값 자리로 옮긴다. 열릴 때와, 밖에서 값이 바뀌었을 때 부른다. */
function scrollToModel() {
  const element = track.value;
  const index = items.indexOf(model.value);
  if (!element || index < 0) return;

  offset.value = index;
  element.scrollTop = index * row;
}

onMounted(scrollToModel);

/*
 * 2월을 고르면 일 목록이 짧아지고, 고르고 있던 날이 잘려 나갈 수 있다. 목록이
 * 바뀌면 자리를 다시 잡아 준다. 안 그러면 화면은 31일에 멈춰 있는데 값만 28일이
 * 되어 둘이 어긋난다.
 */
watch([() => items.length, model], async () => {
  await nextTick();
  scrollToModel();
});

onBeforeUnmount(() => clearTimeout(settle));

/** 가운데에서 몇 칸 떨어졌는지. 0 이 가장 진하고 멀수록 옅다. */
function toneOf(index: number) {
  const distance = Math.min(Math.abs(index - offset.value), radius);
  if (distance < 0.5) return 'text-headline2 text-ink';
  if (distance < 1.5) return 'text-body2 text-ink-body';
  return 'text-label2 text-ink-muted';
}
</script>

<template>
  <div
    ref="track"
    class="flex-1 snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    role="listbox"
    :aria-label="label"
    @scroll="onScroll"
  >
    <!-- 위아래 빈 칸. 첫 항목과 마지막 항목도 가운데 자리까지 올라와야 한다. -->
    <div :style="{ height: `${row * radius}px` }" />

    <div
      v-for="(item, index) in items"
      :key="item"
      class="flex snap-center items-center justify-center text-center"
      :class="toneOf(index)"
      :style="{ height: `${row}px` }"
      role="option"
      :aria-selected="item === model"
    >
      {{ item }}{{ unit }}
    </div>

    <div :style="{ height: `${row * radius}px` }" />
  </div>
</template>
