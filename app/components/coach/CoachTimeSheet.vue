<script setup lang="ts">
import type { CoachSheet } from '~/components/coach/sheet';

/**
 * `Sheet/코치 TIME`.
 *
 * FAB 이나 문항의 ⓘ 를 누르면 딤 위로 올라오는 시트다. 화면이 미리 준비해 둔
 * 코치 문구를 편다 — 여기 있는 말은 전부 시안에서 옮긴 것이고, 화면이 지어내지 않는다.
 *
 * 한 화면에 시트가 둘인 자리가 있다(매물 등록은 "미리 거르기" 와 "임대인 협조").
 * 예전에는 이 둘을 한 시트에 이어 붙여 스크롤로 봤는데, 그러면 뒤엣것이 앞엣것에
 * 묻혀 스크롤을 안 내리면 있는 줄도 모른다. 지금은 한 번에 하나씩, "1 / 2" 를
 * 보여주며 페이지를 넘기게 한다 — 시트를 두 개로 띄워 뒤엣것을 잃어버리는 것도,
 * 하나로 뭉쳐 묻히는 것도 아닌 절충이다.
 *
 * ## 코치에게 직접 묻는 길
 *
 * 시안(1루 1~3 코치 TIME)의 머리 오른쪽에는 배트·공 아이콘이 하나 있고, 아래에는
 * `확인했어요` 버튼 하나뿐이다. 예전에는 그 자리에 흰 버튼("코치에게 직접 물어보기")을
 * 하나 더 세워 뒀는데, 시안에 없는 버튼이라 걷어내고 **그 아이콘을 직접 묻기 자리로
 * 삼았다.** 준비된 문구가 사용자의 질문과 어긋날 때 여기서 막히면 안 되기 때문에,
 * 길 자체를 없애지는 않는다.
 */
const { sheets } = defineProps<{ sheets: CoachSheet[] }>();

defineEmits<{ close: []; chat: [] }>();

/** 지금 보고 있는 시트. 열 때마다 이 컴포넌트가 새로 만들어져 항상 0부터 시작한다. */
const page = ref(0);
const current = computed(() => sheets[page.value]);
const isLast = computed(() => page.value >= sheets.length - 1);

function next() {
  if (!isLast.value) page.value += 1;
}
</script>

<template>
  <DimOverlay @close="$emit('close')">
    <!-- 손잡이. 끌어내려 닫는 시트라는 표시다(시안 `Icon/shape`). -->
    <div class="bg-line-list mx-auto mb-3.5 h-1 w-10 rounded-sm" />

    <div v-if="current" class="flex max-h-[70vh] flex-col gap-3.5 overflow-y-auto">
      <section :key="current.title" class="flex flex-col gap-3.5">
        <!-- 시안 head. 말을 거는 쪽이 코치라 얼굴을 세운다. -->
        <div class="flex items-start gap-2.5">
          <!-- 시안 `Tiger/안내 중` — 손가락을 세워 설명하는 포즈다. 이미 있는 에셋을 쓴다. -->
          <img
            src="/tiger/face-coach.webp"
            alt=""
            class="size-10 shrink-0 rounded-full object-cover"
          />

          <div class="flex min-w-0 flex-1 flex-col gap-0.5">
            <div class="flex items-center gap-1.5">
              <p class="text-coach-title text-primary-strong">코치 TIME</p>
              <!-- 시트가 둘 이상일 때만 몇 번째인지 보여준다. 하나뿐이면 셀 것도 없다. -->
              <span v-if="sheets.length > 1" class="text-micro text-ink-muted">
                {{ page + 1 }} / {{ sheets.length }}
              </span>
            </div>
            <h2 class="text-label2 text-ink-card-body text-balance break-keep">
              {{ current.title }}
            </h2>
          </div>

          <button
            type="button"
            class="mt-1 shrink-0"
            aria-label="코치에게 직접 물어보기"
            @click="$emit('chat')"
          >
            <img src="/icon/batball.png" alt="" width="28" height="28" class="size-7" />
          </button>
        </div>

        <p
          class="bg-surface-muted rounded-field text-note-body text-ink-card text-pretty break-keep px-3 py-2.5"
        >
          {{ current.intro }}
        </p>

        <!-- 시안의 qa 는 상자 없이 글줄로만 선다. 상자에 넣으면 훑는 흐름이 끊긴다. -->
        <div v-for="item in current.qa" :key="item.q" class="flex flex-col gap-0.5">
          <p class="text-label2 text-ink-card text-pretty break-keep font-bold">{{ item.q }}</p>
          <p class="text-caption2 text-ink-card-body text-pretty break-keep">{{ item.a }}</p>
        </div>

        <!-- 더 알아보기. 모듈이 실제로 있는 것만 칩으로 낸다. -->
        <div v-if="current.related?.length" class="flex flex-col gap-1.5">
          <p class="text-micro text-ink-label font-medium">더 알아보기</p>

          <div class="flex flex-wrap gap-1.5">
            <NuxtLink
              v-for="link in current.related"
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

    <!-- 페이지 점. 눌러서 바로 그 시트로 건너뛸 수 있다. 하나뿐이면 안 보인다. -->
    <div v-if="sheets.length > 1" class="flex items-center justify-center gap-1.5 pt-3.5">
      <button
        v-for="(sheet, index) in sheets"
        :key="sheet.title"
        type="button"
        :aria-label="`${index + 1}번째 코치 TIME 보기`"
        class="size-1.5 rounded-full transition-colors"
        :class="index === page ? 'bg-primary-strong' : 'bg-line'"
        @click="page = index"
      />
    </div>

    <div class="pt-3.5">
      <AppButton variant="strong" @click="isLast ? $emit('close') : next()">
        {{ isLast ? '확인했어요' : '다음' }}
      </AppButton>
    </div>
  </DimOverlay>
</template>
