<script setup lang="ts">
import { COACH_MODULES } from '~/components/coach/modules';
import { educationCode, useEducationApi, type EducationModuleDetail } from '~/api/education';
import { useCoachProgress } from '~/composables/useCoachProgress';

/**
 * 메인 7~10 · 코치 학습 · 퀴즈 · 완료.
 *
 * 한 화면에서 단계가 넘어간다. 본문을 읽고(read) → 문제가 있으면 풀고(quiz) →
 * 완료(done). 본문이 없는 모듈은 준비 중만 보여준다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const { markDone } = useCoachProgress();

const module = computed(() => COACH_MODULES.find((item) => item.id === route.params.moduleId));
const index = computed(() => COACH_MODULES.findIndex((item) => item.id === route.params.moduleId));
const nextModule = computed(() => (index.value >= 0 ? COACH_MODULES[index.value + 1] : undefined));
const serverModule = ref<EducationModuleDetail | null>(null);
const error = ref('');

const phase = ref<'read' | 'quiz' | 'done'>('read');
const quizAt = ref(0);
const picked = ref<'O' | 'X' | null>(null);
const correctCount = ref(0);

const quizTotal = computed(() => module.value?.quiz?.length ?? 0);

/** 상단 제목. 퀴즈로 넘어가면 무엇을 푸는 중인지 밝힌다(시안 메인 9). */
const pageTitle = computed(() => {
  if (!module.value) return '코치 교육';
  if (phase.value === 'quiz') return `퀴즈 · ${module.value.title}`;
  if (phase.value === 'done') return '모듈 완료';
  return module.value.title;
});

/** 다음 모듈이 목록에서 몇 번째인가. 허브와 같은 전체 통번호를 쓴다. */
const nextOrder = computed(() => index.value + 2);

/**
 * 완료 화면 그림.
 *
 * 많이 틀렸을 때까지 활짝 웃는 얼굴을 띄우면 남의 일 같다. 1개 이하로 맞히면
 * 머쓱해하는 쪽으로 바꾼다. 문제가 아예 없는 모듈은 성적이랄 게 없으니 기본.
 */
const doneImage = computed(() =>
  quizTotal.value && correctCount.value <= 1 ? '/tiger/done-low.webp' : '/tiger/done.webp',
);
const question = computed(() => module.value?.quiz?.[quizAt.value]);
const isLastQuestion = computed(() => quizTotal.value > 0 && quizAt.value === quizTotal.value - 1);

/** 본문을 다 읽었다. 문제가 있으면 풀고, 없으면 바로 끝낸다. */
async function afterRead() {
  if (quizTotal.value) phase.value = 'quiz';
  else await finish();
}

function pick(choice: 'O' | 'X') {
  if (picked.value || !question.value) return;
  picked.value = choice;
  if (choice === question.value.answer) correctCount.value += 1;
}

async function nextQuestion() {
  if (isLastQuestion.value) {
    await finish();
    return;
  }
  quizAt.value += 1;
  picked.value = null;
}

async function finish() {
  if (!module.value) return;
  try {
    await markDone(module.value.id);
    phase.value = 'done';
  } catch {
    error.value = '교육 완료를 저장하지 못했어요. 잠시 후 다시 시도해주세요.';
  }
}

onMounted(async () => {
  const id = String(route.params.moduleId);
  const code = educationCode(
    id,
    COACH_MODULES.map((item) => item.id),
  );
  if (!code) return;
  try {
    serverModule.value = await useEducationApi().detail(code);
  } catch {
    // 배포 데이터 조회가 안 되면 번들에 포함된 콘텐츠를 대신 보여준다.
  }
});
</script>

<template>
  <PhoneFrame>
    <div class="h-statusbar bg-surface shrink-0" />
    <BrandBar />
    <PageBar :title="pageTitle" />

    <!-- 없는 모듈: 목록에서 지운 뒤에도 주소로 들어올 수 있다. -->
    <div v-if="!module" class="px-gutter flex flex-1 flex-col items-center justify-center gap-3">
      <p class="text-label2 text-ink-muted">찾을 수 없는 모듈이에요.</p>
      <AppButton variant="strong" @click="navigateTo('/coach')">교육 목록으로</AppButton>
    </div>

    <!-- 준비 중: 제목·시간만 있고 본문이 없는 모듈. -->
    <div
      v-else-if="!module.body && !serverModule"
      class="px-gutter flex flex-1 flex-col items-center justify-center gap-3 text-center"
    >
      <p class="text-headline2 text-ink-hero">준비 중이에요</p>
      <p class="text-caption2 text-ink-hero-body">
        이 모듈은 내용을 준비하고 있어요. 먼저 열려 있는 모듈부터 살펴보세요.
      </p>
      <AppButton variant="strong" @click="navigateTo('/coach')">교육 목록으로</AppButton>
    </div>

    <!-- 학습 -->
    <template v-else-if="phase === 'read'">
      <div class="bg-canvas-soft flex flex-1 flex-col gap-3 px-4 pt-4 pb-6">
        <p class="text-caption-tight text-ink-label font-medium">
          {{ module.base }} · 모듈 {{ index + 1 }}/{{ COACH_MODULES.length }} ·
          {{ module.minutes }}분
        </p>

        <AppCard v-if="serverModule">
          <MarkdownContent :content="serverModule.body" />
        </AppCard>

        <template v-else>
          <template v-for="(block, i) in module.body" :key="i">
            <!-- 코치가 말하는 자리. 아바타와 함께 파란 말풍선으로 띄운다. -->
            <div
              v-if="block.kind === 'coach'"
              class="bg-surface-active rounded-button flex gap-3 p-4"
            >
              <img
                src="/tiger/face-coach.webp"
                alt=""
                width="44"
                height="44"
                class="rounded-pill size-11 shrink-0 object-cover select-none"
              />
              <div class="flex flex-1 flex-col gap-1">
                <p class="text-caption-tight text-primary-strong font-bold">코치 TIME</p>
                <p class="text-label2 text-ink-card font-normal">{{ block.text }}</p>
              </div>
            </div>

            <div
              v-else-if="block.kind === 'steps'"
              class="bg-surface border-line-list rounded-button flex flex-col gap-2.5 border p-4"
            >
              <h2 class="text-stage text-ink-card font-bold">{{ block.heading }}</h2>
              <div v-for="(item, n) in block.items" :key="n" class="flex items-start gap-2.5">
                <span
                  class="bg-surface-active text-primary-strong rounded-pill text-step flex size-5.5 shrink-0 items-center justify-center font-bold"
                >
                  {{ n + 1 }}
                </span>
                <span class="text-label2 text-ink-card font-bold">{{ item }}</span>
              </div>
            </div>

            <div
              v-else-if="block.kind === 'cases'"
              class="bg-surface border-line-list rounded-button flex flex-col gap-2.5 border p-4"
            >
              <div v-for="(item, n) in block.items" :key="n" class="flex items-start gap-2.5">
                <span
                  class="bg-surface-active text-primary-strong rounded-pill text-step flex size-5.5 shrink-0 items-center justify-center font-bold"
                >
                  {{ n + 1 }}
                </span>
                <span class="flex flex-1 flex-col gap-0.5">
                  <span class="text-label2 text-ink-card font-bold">{{ item.title }}</span>
                  <span class="text-caption-tight text-ink-card-body">{{ item.body }}</span>
                </span>
              </div>
            </div>

            <div
              v-else-if="block.kind === 'note'"
              class="bg-surface-note text-ink-note rounded-button flex flex-col gap-2.5 p-4"
            >
              <p class="text-label2 font-bold">{{ block.heading }}</p>
              <p v-for="(item, n) in block.items" :key="n" class="text-caption-tight">
                · {{ item }}
              </p>
            </div>
          </template>
        </template>
      </div>

      <p v-if="error" class="text-label2 text-danger px-4">{{ error }}</p>

      <footer
        class="border-line bg-surface pb-cta-pad flex shrink-0 flex-col gap-2.5 border-t px-4 pt-3"
      >
        <p v-if="quizTotal" class="text-caption-tight text-ink-label text-center font-medium">
          {{ quizTotal }}문제 · 1분이면 끝나
        </p>
        <AppButton variant="strong" @click="afterRead">
          {{ quizTotal ? '퀴즈 풀기' : '완료하기' }}
        </AppButton>
      </footer>
    </template>

    <!-- 퀴즈 -->
    <template v-else-if="phase === 'quiz' && question">
      <div class="bg-canvas-soft flex flex-1 flex-col gap-3 px-4 pt-4 pb-6">
        <!-- 문제 수만큼 칸을 나눈다. 지금까지 온 칸이 파랗다. -->
        <div class="flex items-center gap-1.5">
          <span
            v-for="n in quizTotal"
            :key="n"
            class="rounded-pill h-1.5 flex-1"
            :class="n <= quizAt + 1 ? 'bg-primary-strong' : 'bg-track'"
          />
        </div>

        <p class="text-caption-tight text-ink-label font-medium">
          {{ quizAt + 1 }} / {{ quizTotal }}
        </p>

        <div
          class="bg-surface border-line-list rounded-button flex flex-col items-center gap-3.5 border px-4 py-6"
        >
          <img
            src="/tiger/face-quiz.webp"
            alt=""
            width="56"
            height="56"
            class="rounded-pill size-14 object-cover select-none"
          />
          <h2 class="text-option text-ink-card text-center">{{ question.statement }}</h2>
          <p class="text-caption-tight text-ink-label">맞으면 O, 틀리면 X를 골라</p>
        </div>

        <!--
          고른 뒤에는 잠근다. 맞으면 파랑, 틀리면 빨강 — 시안에는 정답을 고른
          모습만 있어서 틀린 경우는 기존 색 규칙을 이어 쓴다.
        -->
        <div class="flex gap-3">
          <button
            v-for="opt in ['O', 'X'] as const"
            :key="opt"
            type="button"
            class="rounded-card text-title1 flex h-24 flex-1 items-center justify-center border-2"
            :class="{
              'border-primary-strong bg-primary-strong text-on-brand':
                picked === opt && opt === question.answer,
              'border-danger bg-danger text-on-brand': picked === opt && opt !== question.answer,
              'border-line-list bg-surface text-ink-card': !picked,
              'border-line-list bg-surface text-ink-subtle': picked && picked !== opt,
            }"
            :disabled="!!picked"
            @click="pick(opt)"
          >
            {{ opt }}
          </button>
        </div>

        <div v-if="picked" class="bg-surface-active rounded-button flex flex-col gap-2.5 p-4">
          <p class="text-caption-tight text-primary-strong font-bold">
            정답 {{ question.answer }} · 코치 설명
          </p>
          <p class="text-label2 text-ink-card font-normal">{{ question.explanation }}</p>
        </div>
      </div>

      <footer
        v-if="picked"
        class="border-line bg-surface pb-cta-pad flex shrink-0 border-t px-4 pt-3"
      >
        <AppButton variant="strong" @click="nextQuestion">
          {{ isLastQuestion ? '완료하기' : '다음 문제' }}
        </AppButton>
      </footer>
    </template>

    <!-- 완료 -->
    <template v-else>
      <div
        class="bg-canvas-soft flex flex-1 flex-col items-center justify-center gap-4 px-4 pt-4 pb-6"
      >
        <img
          :src="doneImage"
          alt=""
          width="120"
          height="120"
          class="rounded-pill size-30 object-cover select-none"
        />

        <p class="text-hero text-ink-card">
          <template v-if="quizTotal && correctCount === quizTotal">
            {{ quizTotal }}문제 다 맞혔어!
          </template>
          <template v-else-if="quizTotal">
            {{ quizTotal }}문제 중 {{ correctCount }}개 맞혔어
          </template>
          <template v-else>모듈을 끝냈어!</template>
        </p>

        <p class="text-label2 text-ink-card-body text-center font-normal">
          {{ module.title }} 모듈을 끝냈어.<br />
          <template v-if="module.featured">{{ module.featured }}, </template>헷갈리면 여기로 돌아와
        </p>

        <span
          class="bg-surface-active text-primary-strong rounded-pill text-caption-tight px-3 py-1.5 font-bold"
        >
          🏅 {{ module.base }} 모듈 완료 · {{ index + 1 }}/{{ COACH_MODULES.length }}
        </span>

        <!-- 다음 모듈로 바로 넘어가는 자리. 마지막 모듈이면 보여줄 게 없다. -->
        <button
          v-if="nextModule"
          type="button"
          class="bg-surface border-line-list rounded-button flex w-full items-center gap-3 border p-4 text-left"
          @click="navigateTo(`/coach/${nextModule.id}`)"
        >
          <span
            class="bg-surface-active text-primary-strong rounded-pill text-caption-tight flex size-7 shrink-0 items-center justify-center font-bold"
          >
            {{ nextOrder }}
          </span>
          <span class="flex flex-1 flex-col gap-0.5">
            <span class="text-micro text-ink-label font-medium">다음 모듈</span>
            <span class="text-card-title text-ink-card font-bold">
              {{ nextModule.title }} · {{ nextModule.minutes }}분
            </span>
          </span>
          <AppIcon name="chevron-right" class="text-ink-chevron size-4 shrink-0" />
        </button>
      </div>

      <footer
        class="border-line bg-surface pb-cta-pad flex shrink-0 flex-col gap-2.5 border-t px-4 pt-3"
      >
        <button
          type="button"
          class="text-caption-tight text-ink-label text-center font-medium"
          @click="navigateTo('/coach')"
        >
          허브로 돌아가기
        </button>
        <AppButton
          v-if="nextModule"
          variant="strong"
          @click="navigateTo(`/coach/${nextModule.id}`)"
        >
          다음 모듈
        </AppButton>
        <AppButton v-else variant="strong" @click="navigateTo('/coach')">교육 목록으로</AppButton>
      </footer>
    </template>
  </PhoneFrame>
</template>
