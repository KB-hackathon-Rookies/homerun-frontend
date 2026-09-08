<script setup lang="ts">
import type { CoachSheet } from '~/components/coach/sheet';

/**
 * `Sheet/코치 TIME`.
 *
 * FAB 을 누르면 딤 위로 올라오는 시트다. 화면이 미리 준비해 둔 코치 문구를
 * 편다 — 여기 있는 말은 전부 시안에서 옮긴 것이고, 화면이 지어내지 않는다.
 *
 * 한 화면에 시트가 둘인 자리가 있다(매물 등록은 "미리 거르기" 와 "임대인 협조").
 * 시트를 두 개로 띄우면 뒤엣것을 못 보고 닫으므로, 하나로 열고 이어 읽게 둔다.
 *
 * 아래에 코치에게 직접 묻는 길을 낸다. 준비된 문구가 사용자의 질문과 어긋날
 * 때 여기서 막히지 않게 한다 — 대신 이 시트를 대신하지는 않는다.
 */
defineProps<{ sheets: CoachSheet[] }>();

defineEmits<{ close: []; chat: [] }>();
</script>

<template>
  <DimOverlay @close="$emit('close')">
    <div class="flex max-h-[70vh] flex-col gap-5 overflow-y-auto">
      <section v-for="sheet in sheets" :key="sheet.title" class="flex flex-col gap-3">
        <!-- 시안 head. 말을 거는 쪽이 코치라 얼굴을 세운다. -->
        <div class="flex items-center gap-2.5">
          <img src="/mascot-mark.png" alt="" class="size-8 shrink-0" />
          <div class="flex flex-col gap-0.5">
            <p class="text-caption1 text-primary-strong">코치 TIME</p>
            <h2 class="text-headline1 text-ink-hero">{{ sheet.title }}</h2>
          </div>
        </div>

        <p class="bg-surface-brand rounded-field text-label2 text-ink-hero-body p-3.5">
          {{ sheet.intro }}
        </p>

        <div
          v-for="item in sheet.qa"
          :key="item.q"
          class="bg-canvas rounded-field flex flex-col gap-1 p-3.5"
        >
          <p class="text-label2 text-ink-hero font-bold">{{ item.q }}</p>
          <p class="text-caption2 text-ink-hero-body">{{ item.a }}</p>
        </div>

        <!-- 더 알아보기. 모듈이 실제로 있는 것만 칩으로 낸다. -->
        <div v-if="sheet.related?.length" class="flex flex-col gap-2">
          <p class="text-caption1 text-ink-hero font-bold">더 알아보기</p>
          <div class="flex flex-wrap gap-2">
            <NuxtLink
              v-for="link in sheet.related"
              :key="link.id"
              :to="`/coach/${link.id}`"
              class="bg-surface-info rounded-pill text-caption2 text-primary-strong px-3.5 py-2 font-semibold"
            >
              {{ link.label }}
            </NuxtLink>
          </div>
        </div>
      </section>
    </div>

    <div class="flex flex-col gap-2.5 pt-4">
      <AppButton variant="white" @click="$emit('chat')">코치에게 직접 물어보기</AppButton>
      <AppButton variant="strong" @click="$emit('close')">확인했어요</AppButton>
    </div>
  </DimOverlay>
</template>
