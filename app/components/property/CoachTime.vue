<script setup lang="ts">
import type { CoachTimeSheet } from '~/components/property/coachSheets';

/**
 * 코치 TIME 버튼과 시트.
 *
 * 시안은 2루 화면마다 오른쪽 아래에 `FAB/코치` 를 띄우고, 누르면 딤 위로
 * 시트가 올라온다. 화면 위 코치 팁 한 줄과는 다른 자리다 — 팁은 지금 뭘
 * 하라는 말이고, 시트는 왜 그래야 하는지를 푼다.
 *
 * 버튼을 `fixed` 로 띄우지 않는다. PhoneFrame 은 폭을 잡아 가운데 세우는 껍데기라
 * 뷰포트에 붙이면 넓은 화면에서 프레임 바깥에 떨어진다. 본문 흐름 안에서
 * `sticky` 로 오른쪽 아래에 붙인다.
 *
 * 한 화면에 시트가 둘인 자리가 있다(매물 등록은 "미리 거르기" 와 "임대인 협조").
 * 버튼을 둘 세우면 서로 겹쳐서, 하나로 열고 안에서 이어 읽게 둔다.
 */
const { sheets } = defineProps<{ sheets: CoachTimeSheet[] }>();

const open = ref(false);
</script>

<template>
  <!-- 본문 맨 끝, 오른쪽 아래. 스크롤을 따라오되 하단 CTA 는 가리지 않는다. -->
  <button
    type="button"
    class="bg-primary-strong rounded-pill text-label2 sticky bottom-3 z-30 self-end px-4 py-3 font-bold text-white shadow-lg"
    @click="open = true"
  >
    코치 TIME
  </button>

  <DimOverlay v-if="open" @close="open = false">
    <div class="flex max-h-[70vh] flex-col gap-5 overflow-y-auto">
      <section v-for="sheet in sheets" :key="sheet.title" class="flex flex-col gap-3">
        <div class="flex flex-col gap-1">
          <p class="text-caption1 text-primary-strong">코치 TIME</p>
          <h2 class="text-headline1 text-ink-hero">{{ sheet.title }}</h2>
        </div>

        <p class="bg-surface-brand rounded-field text-label2 text-ink-hero-body p-3.5">
          {{ sheet.intro }}
        </p>

        <div v-for="item in sheet.qa" :key="item.q" class="flex flex-col gap-1.5">
          <p class="text-body3 text-ink-hero font-bold">{{ item.q }}</p>
          <p class="text-label2 text-ink-hero-body">{{ item.a }}</p>
        </div>

        <!-- 더 알아보기. 모듈이 실제로 있는 것만 칩으로 낸다. -->
        <div v-if="sheet.related?.length" class="flex flex-col gap-2">
          <p class="text-caption1 text-ink-hero font-bold">더 알아보기</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="link in sheet.related"
              :key="link.id"
              type="button"
              class="bg-surface-info rounded-pill text-caption2 text-primary-strong px-3.5 py-2 font-semibold"
              @click="navigateTo(`/coach/${link.id}`)"
            >
              {{ link.label }}
            </button>
          </div>
        </div>
      </section>
    </div>

    <AppButton variant="strong" class="mt-4" @click="open = false">확인했어요</AppButton>
  </DimOverlay>
</template>
