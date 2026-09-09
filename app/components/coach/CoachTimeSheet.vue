<script setup lang="ts">
import type { CoachSheet } from '~/components/coach/sheet';

/**
 * `Sheet/코치 TIME`.
 *
 * FAB 이나 문항의 ⓘ 를 누르면 딤 위로 올라오는 시트다. 화면이 미리 준비해 둔
 * 코치 문구를 편다 — 여기 있는 말은 전부 시안에서 옮긴 것이고, 화면이 지어내지 않는다.
 *
 * 한 화면에 시트가 둘인 자리가 있다(매물 등록은 "미리 거르기" 와 "임대인 협조").
 * 시트를 두 개로 띄우면 뒤엣것을 못 보고 닫으므로, 하나로 열고 이어 읽게 둔다.
 *
 * ## 코치에게 직접 묻는 길
 *
 * 시안(1루 1~3 코치 TIME)의 머리 오른쪽에는 배트·공 아이콘이 하나 있고, 아래에는
 * `확인했어요` 버튼 하나뿐이다. 예전에는 그 자리에 흰 버튼("코치에게 직접 물어보기")을
 * 하나 더 세워 뒀는데, 시안에 없는 버튼이라 걷어내고 **그 아이콘을 직접 묻기 자리로
 * 삼았다.** 준비된 문구가 사용자의 질문과 어긋날 때 여기서 막히면 안 되기 때문에,
 * 길 자체를 없애지는 않는다.
 */
defineProps<{ sheets: CoachSheet[] }>();

defineEmits<{ close: []; chat: [] }>();
</script>

<template>
  <DimOverlay @close="$emit('close')">
    <!-- 손잡이. 끌어내려 닫는 시트라는 표시다(시안 `Icon/shape`). -->
    <div class="bg-line-list mx-auto mb-3.5 h-1 w-10 rounded-sm" />

    <div class="flex max-h-[70vh] flex-col gap-3.5 overflow-y-auto">
      <section v-for="sheet in sheets" :key="sheet.title" class="flex flex-col gap-3.5">
        <!-- 시안 head. 말을 거는 쪽이 코치라 얼굴을 세운다. -->
        <div class="flex items-center gap-2.5">
          <!-- 시안 `Tiger/안내 중` — 손가락을 세워 설명하는 포즈다. 이미 있는 에셋을 쓴다. -->
          <img
            src="/tiger/face-coach.webp"
            alt=""
            class="size-10 shrink-0 rounded-full object-cover"
          />

          <div class="flex min-w-0 flex-1 flex-col gap-0.5">
            <p class="text-coach-title text-primary-strong">코치 TIME</p>
            <h2 class="text-label2 text-ink-card-body">{{ sheet.title }}</h2>
          </div>

          <button
            type="button"
            class="shrink-0"
            aria-label="코치에게 직접 물어보기"
            @click="$emit('chat')"
          >
            <img src="/icon/batball.png" alt="" width="28" height="28" class="size-7" />
          </button>
        </div>

        <p class="bg-surface-muted rounded-field text-note-body text-ink-card px-3 py-2.5">
          {{ sheet.intro }}
        </p>

        <!-- 시안의 qa 는 상자 없이 글줄로만 선다. 상자에 넣으면 훑는 흐름이 끊긴다. -->
        <div v-for="item in sheet.qa" :key="item.q" class="flex flex-col gap-0.5">
          <p class="text-label2 text-ink-card font-bold">{{ item.q }}</p>
          <p class="text-caption2 text-ink-card-body">{{ item.a }}</p>
        </div>

        <!-- 더 알아보기. 모듈이 실제로 있는 것만 칩으로 낸다. -->
        <div v-if="sheet.related?.length" class="flex flex-col gap-1.5">
          <p class="text-micro text-ink-label font-medium">더 알아보기</p>

          <div class="flex flex-wrap gap-1.5">
            <NuxtLink
              v-for="link in sheet.related"
              :key="link.id"
              :to="`/coach/${link.id}`"
              class="bg-surface border-line-chip rounded-pill text-micro text-ink-chip border px-2.5 py-1 font-medium"
            >
              {{ link.label }}
            </NuxtLink>
          </div>
        </div>
      </section>
    </div>

    <div class="pt-3.5">
      <AppButton variant="strong" @click="$emit('close')">확인했어요</AppButton>
    </div>
  </DimOverlay>
</template>
