<script setup lang="ts">
/**
 * AU-05a 생년월일 선택.
 *
 * 화면 정의서의 3열(년·월·일) 휠 바텀시트다. 생년월일은 연령 판정의 기준값이라
 * 오타가 그대로 판정 오류가 된다. 자유 입력 대신 고르게 해서 틀린 날짜가
 * 애초에 만들어지지 않게 한다.
 *
 * 휠은 CSS 스크롤 스냅으로 굴린다. 라이브러리를 쓰지 않는다 — 필요한 건
 * "한 칸씩 멈추고 가운데를 고른다" 뿐이고 그건 `snap-y snap-mandatory` 가
 * 그대로 해 준다.
 *
 * **일 목록은 년·월에 따라 줄어든다.** 31일을 고정으로 두면 1998.02.31 같은
 * 값이 만들어지고, 백엔드는 그걸 파싱하다 터진다. 윤년도 여기서 걸러진다.
 */
const model = defineModel<string>({ default: '' });

const emit = defineEmits<{ close: [] }>();

/** 한 칸 높이(px). 창은 다섯 칸이고 가운데가 선택 자리다. */
const ROW = 40;
const RADIUS = 2;

/**
 * 고를 수 있는 해.
 *
 * 끝을 올해로 잡는다. 정의서에는 2010 으로 적혀 있는데 그대로 박아 두면 해가
 * 바뀔 때마다 낡는다. 시작은 정의서의 1960 을 쓴다.
 */
const FIRST_YEAR = 1960;
const lastYear = new Date().getFullYear();

const years = Array.from({ length: lastYear - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i);
const months = Array.from({ length: 12 }, (_, i) => i + 1);

/** 들어온 값에서 숫자만 뽑는다. `1998. 05. 14` 도 `1998-05-14` 도 받는다. */
function parse(value?: string) {
  const digits = (value ?? '').replace(/\D/g, '');
  if (digits.length !== 8) return null;
  return {
    year: Number(digits.slice(0, 4)),
    month: Number(digits.slice(4, 6)),
    day: Number(digits.slice(6, 8)),
  };
}

const initial = parse(model.value);
const year = ref(initial?.year ?? 1998);
const month = ref(initial?.month ?? 5);
const day = ref(initial?.day ?? 14);

/** 그 달의 마지막 날. 0일은 전달 마지막 날이라 이 한 줄로 윤년까지 맞는다. */
const lastDay = computed(() => new Date(year.value, month.value, 0).getDate());
const days = computed(() => Array.from({ length: lastDay.value }, (_, i) => i + 1));

const pad = (n: number) => String(n).padStart(2, '0');

/** 2월을 고르면 31일이 사라진다. 고르고 있던 날이 없어졌으면 마지막 날로 당긴다. */
watch(lastDay, (last) => {
  if (day.value > last) day.value = last;
});

function confirm() {
  model.value = `${year.value}. ${pad(month.value)}. ${pad(day.value)}`;
  emit('close');
}
</script>

<template>
  <DimOverlay @close="emit('close')">
    <div class="flex flex-col gap-5">
      <header class="flex items-center">
        <h2 class="text-headline2 text-ink">생년월일</h2>
        <button
          type="button"
          class="text-ink-muted ml-auto"
          aria-label="닫기"
          @click="emit('close')"
        >
          <svg viewBox="0 0 20 20" class="size-5" fill="currentColor" aria-hidden="true">
            <path
              d="m10 8.6 4.3-4.3 1.4 1.4-4.3 4.3 4.3 4.3-1.4 1.4-4.3-4.3-4.3 4.3-1.4-1.4 4.3-4.3-4.3-4.3 1.4-1.4L10 8.6Z"
            />
          </svg>
        </button>
      </header>

      <div class="relative" :style="{ height: `${ROW * (RADIUS * 2 + 1)}px` }">
        <!--
          선택 자리. 숫자 뒤에 깔린다.

          절대배치는 일반 흐름보다 위에 그려지므로, 이것만 absolute 로 두면 불투명한
          회색 띠가 가운데 숫자를 덮어 버린다. 휠 쪽에도 relative 를 줘서 나중에
          오는 휠이 위로 오게 한다.
        -->
        <div
          class="rounded-field bg-canvas pointer-events-none absolute inset-x-0"
          :style="{ top: `${ROW * RADIUS}px`, height: `${ROW}px` }"
        />

        <div class="relative flex h-full">
          <DateWheel
            v-model="year"
            :items="years"
            unit="년"
            label="년"
            :row="ROW"
            :radius="RADIUS"
          />
          <DateWheel
            v-model="month"
            :items="months"
            unit="월"
            label="월"
            :row="ROW"
            :radius="RADIUS"
          />
          <DateWheel v-model="day" :items="days" unit="일" label="일" :row="ROW" :radius="RADIUS" />
        </div>
      </div>

      <AppButton variant="strong" @click="confirm">확인</AppButton>
    </div>
  </DimOverlay>
</template>
