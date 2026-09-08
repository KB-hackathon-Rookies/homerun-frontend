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
    <PageBar :title="serverModule?.title ?? module?.title ?? '코치 교육'" />

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
      <div class="px-gutter-tight flex flex-1 flex-col gap-4 overflow-y-auto py-4">
        <p class="text-step text-ink-muted px-1">{{ module.base }} · {{ module.minutes }}분</p>

        <AppCard v-if="serverModule" class="text-caption2 text-ink-hero-body whitespace-pre-wrap">
          {{ serverModule.body }}
        </AppCard>

        <template v-for="(block, i) in serverModule ? [] : module.body" :key="i">
          <CoachTip v-if="block.kind === 'coach'" label="코치 TIME" tone="plain">
            {{ block.text }}
          </CoachTip>

          <AppCard v-else-if="block.kind === 'steps'" class="flex flex-col gap-3">
            <h2 class="text-body3 text-ink-hero font-bold">{{ block.heading }}</h2>
            <div v-for="(item, n) in block.items" :key="n" class="flex items-start gap-2.5">
              <span
                class="bg-primary-soft text-primary-strong rounded-pill text-micro flex size-5 shrink-0 items-center justify-center font-bold"
              >
                {{ n + 1 }}
              </span>
              <span class="text-caption2 text-ink-hero-body">{{ item }}</span>
            </div>
          </AppCard>

          <AppCard v-else-if="block.kind === 'cases'" class="flex flex-col gap-3">
            <div v-for="(item, n) in block.items" :key="n" class="flex flex-col gap-1">
              <span class="text-row text-ink-hero">{{ item.title }}</span>
              <span class="text-caption2 text-ink-hero-body">{{ item.body }}</span>
            </div>
          </AppCard>

          <div
            v-else-if="block.kind === 'note'"
            class="bg-surface-caution rounded-field flex flex-col gap-1.5 p-3.5"
          >
            <p class="text-caption1 text-ink-hero">{{ block.heading }}</p>
            <p v-for="(item, n) in block.items" :key="n" class="text-caption2 text-ink-hero-body">
              · {{ item }}
            </p>
          </div>
        </template>
      </div>

      <p v-if="error" class="text-label2 text-danger px-gutter-tight">{{ error }}</p>

      <footer class="px-gutter-tight bg-surface flex shrink-0 pt-2.5 pb-cta-pad">
        <AppButton variant="strong" @click="afterRead">
          {{ quizTotal ? '퀴즈 풀고 완료하기' : '완료하기' }}
        </AppButton>
      </footer>
    </template>

    <!-- 퀴즈 -->
    <template v-else-if="phase === 'quiz' && question">
      <div class="px-gutter-tight flex flex-1 flex-col gap-4 overflow-y-auto py-4">
        <p class="text-step text-ink-muted px-1">{{ quizAt + 1 }} / {{ quizTotal }}</p>

        <AppCard class="flex flex-col gap-1.5">
          <h2 class="text-body3 text-ink-hero font-bold">{{ question.statement }}</h2>
          <p class="text-caption2 text-ink-muted">맞으면 O, 틀리면 X를 골라주세요.</p>
        </AppCard>

        <div class="flex gap-2.5">
          <button
            v-for="opt in ['O', 'X'] as const"
            :key="opt"
            type="button"
            class="rounded-field text-hero h-20 flex-1 border font-bold"
            :class="{
              'border-primary-strong bg-primary-soft text-primary-strong':
                picked === opt && opt === question.answer,
              'border-danger bg-danger-soft text-danger': picked === opt && opt !== question.answer,
              'border-line text-ink-hero': !picked,
              'border-line text-ink-disabled': picked && picked !== opt,
            }"
            :disabled="!!picked"
            @click="pick(opt)"
          >
            {{ opt }}
          </button>
        </div>

        <AppCard v-if="picked" class="flex flex-col gap-1.5">
          <span
            class="text-card-title"
            :class="picked === question.answer ? 'text-success' : 'text-danger'"
          >
            {{ picked === question.answer ? '정답' : `아쉬워요 · 정답은 ${question.answer}` }} ·
            코치 설명
          </span>
          <p class="text-caption2 text-ink-hero-body">{{ question.explanation }}</p>
        </AppCard>
      </div>

      <footer v-if="picked" class="px-gutter-tight bg-surface flex shrink-0 pt-2.5 pb-cta-pad">
        <AppButton variant="strong" @click="nextQuestion">
          {{ isLastQuestion ? '완료하기' : '다음 문제' }}
        </AppButton>
      </footer>
    </template>

    <!-- 완료 -->
    <template v-else>
      <div class="px-gutter flex flex-1 flex-col items-center gap-4 py-10 text-center">
        <p class="text-hero text-ink-hero">
          <template v-if="quizTotal && correctCount === quizTotal">
            {{ quizTotal }}문제 다 맞혔어요!
          </template>
          <template v-else-if="quizTotal">
            {{ quizTotal }}문제 중 {{ correctCount }}개 맞혔어요
          </template>
          <template v-else>모듈을 끝냈어요!</template>
        </p>
        <p class="text-caption2 text-ink-hero-body">
          {{ module.title }} 모듈을 끝냈어요. 헷갈리면 여기로 다시 돌아와요.
        </p>

        <span class="bg-surface-brand text-primary-strong rounded-chip text-caption1 px-3 py-1.5">
          🏅 {{ module.base }} 모듈 완료
        </span>
      </div>

      <footer class="px-gutter-tight bg-surface flex shrink-0 flex-col gap-2 pt-2.5 pb-cta-pad">
        <AppButton
          v-if="nextModule"
          variant="strong"
          @click="navigateTo(`/coach/${nextModule.id}`)"
        >
          다음 모듈 · {{ nextModule.title }}
        </AppButton>
        <AppButton variant="white" @click="navigateTo('/coach')">교육 목록으로</AppButton>
      </footer>
    </template>
  </PhoneFrame>
</template>
