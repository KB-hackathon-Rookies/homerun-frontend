<script setup lang="ts">
import { useCoachApi, type CoachSource } from '~/api/coach';
import type { PlanStage } from '~/api/dashboard';
import { messageFrom } from '~/utils/error';

/**
 * 코치에게 직접 묻는 시트.
 *
 * 준비된 코치 TIME 문구가 사용자의 질문과 어긋날 때 여기서 묻는다. 답은 문서
 * 21종을 뒤진 결과라 **근거가 함께 온다** — 그 근거를 보여 주는 것이 이 화면의
 * 목적이다. 답만 띄우면 지어낸 말과 구분이 안 된다.
 *
 * ## 실패는 실패라고 말한다
 *
 * 요청이 깨지면 미리 적어 둔 답으로 때우지 않는다. 못 물어봤다고 말하고 다시
 * 시도할 길을 준다. 질문은 목록에 남겨 둔다 — 다시 치게 하지 않는다.
 *
 * ## 대화는 남기지 않는다
 *
 * 시트를 닫으면 사라진다. 서버에 대화 기록 API 가 없고, 브라우저에 쌓아 두면
 * 물어본 내용(사는 곳·돈 사정이 섞인다)이 기기에 남는다.
 */
const { stage } = defineProps<{ stage: PlanStage }>();

const emit = defineEmits<{ close: [] }>();

interface Turn {
  who: 'me' | 'coach';
  text: string;
  /** 코치 차례에만 있다. 빈 배열이면 근거 없이 답한 것이고, 그렇게 보여 준다. */
  sources?: CoachSource[];
}

const turns = ref<Turn[]>([]);
const question = ref('');
const pending = ref(false);
const error = ref('');
/** 실패했을 때 다시 보낼 질문. 목록에 이미 올라간 것을 두 번 올리지 않는다. */
const lastAsked = ref('');
const list = ref<HTMLElement | null>(null);

/** 새 말풍선은 아래에 쌓인다. 스크롤을 따라가지 않으면 방금 온 답이 안 보인다. */
async function scrollToEnd() {
  await nextTick();
  const el = list.value;
  if (el) el.scrollTop = el.scrollHeight;
}

async function ask(text: string) {
  pending.value = true;
  error.value = '';
  await scrollToEnd();
  try {
    const reply = await useCoachApi().ask(text, stage);
    turns.value.push({ who: 'coach', text: reply.answer, sources: reply.sources ?? [] });
    lastAsked.value = '';
  } catch (cause) {
    error.value = messageFrom(cause, '코치에게 묻지 못했어요. 잠시 후 다시 시도해주세요.');
    lastAsked.value = text;
  } finally {
    pending.value = false;
    await scrollToEnd();
  }
}

function send() {
  const asked = question.value.trim();
  if (!asked || pending.value) return;
  question.value = '';
  turns.value.push({ who: 'me', text: asked });
  void ask(asked);
}

function retry() {
  if (!lastAsked.value || pending.value) return;
  void ask(lastAsked.value);
}
</script>

<template>
  <DimOverlay @close="emit('close')">
    <div class="flex max-h-[76vh] flex-col gap-3">
      <!-- 머리. 캐릭터 자리에 브랜드 마름모를 세웠다(에셋 없음). -->
      <div class="flex items-center gap-2.5">
        <BrandMark tilted :wordmark="false" />
        <div class="flex flex-1 flex-col gap-0.5">
          <p class="text-caption1 text-primary-strong">코치에게 직접 물어보기</p>
          <p class="text-caption2 text-ink-hero-body">
            코치 답변은 안내예요. 판정이 아니라서 최종 확인은 은행·기관에서 해야 해요
          </p>
        </div>
      </div>

      <div ref="list" class="flex flex-1 flex-col gap-3 overflow-y-auto">
        <p v-if="!turns.length" class="text-caption2 text-ink-muted py-6 text-center">
          궁금한 걸 그대로 물어봐. 코치가 가진 자료에서 찾아 근거와 함께 알려줄게
        </p>

        <div
          v-for="(turn, index) in turns"
          :key="index"
          class="flex flex-col gap-2"
          :class="turn.who === 'me' ? 'items-end' : 'items-start'"
        >
          <p
            class="rounded-field text-label2 max-w-[85%] px-3.5 py-3"
            :class="
              turn.who === 'me'
                ? 'bg-primary-strong text-on-brand'
                : 'bg-canvas text-ink-hero-body whitespace-pre-line'
            "
          >
            {{ turn.text }}
          </p>

          <!--
            근거. 이 기능의 핵심이라 접어 두지 않는다. 원문이 있으면 그리로
            나갈 수 있게 하고, 없으면 출처 이름만 남긴다.
          -->
          <div v-if="turn.who === 'coach'" class="w-full">
            <div
              v-if="turn.sources?.length"
              class="border-line rounded-field flex flex-col gap-3 border p-3.5"
            >
              <p class="text-caption1 text-ink-hero">코치가 본 자료</p>

              <div
                v-for="(source, order) in turn.sources"
                :key="`${source.source}-${order}`"
                class="flex flex-col gap-1"
              >
                <p class="text-label2 text-ink-hero font-bold">{{ source.title }}</p>
                <p class="text-caption2 text-ink-hero-body">{{ source.snippet }}</p>

                <a
                  v-if="source.sourceUrl"
                  :href="source.sourceUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-caption2 text-primary-strong font-semibold"
                >
                  {{ source.source }} 원문 보기 ↗
                </a>
                <p v-else class="text-micro text-ink-meta">{{ source.source }}</p>
              </div>
            </div>

            <!-- 근거가 안 붙은 답이 근거 있는 답처럼 보이면 안 된다. -->
            <p v-else class="text-caption2 text-ink-muted">
              이 답에는 근거 자료가 붙지 않았어요. 그대로 믿지 말고 은행·기관에 한 번 더 확인해
              주세요
            </p>
          </div>
        </div>

        <p v-if="pending" class="text-caption2 text-ink-muted">코치가 자료를 찾는 중이에요…</p>

        <div v-if="error" class="flex flex-col items-start gap-1.5">
          <p class="text-label2 text-danger">{{ error }}</p>
          <button type="button" class="text-caption2 text-primary-strong font-bold" @click="retry">
            다시 시도하기
          </button>
        </div>
      </div>

      <form class="flex shrink-0 items-center gap-2" @submit.prevent="send">
        <input
          v-model="question"
          type="text"
          enterkeyhint="send"
          placeholder="궁금한 걸 물어보세요"
          class="bg-surface border-line rounded-field h-field text-input text-ink placeholder:text-ink-placeholder min-w-0 flex-1 border px-4 outline-none"
        />
        <button
          type="submit"
          :disabled="!question.trim() || pending"
          class="rounded-field text-label2 h-field shrink-0 px-4 font-bold text-white"
          :class="!question.trim() || pending ? 'bg-disabled' : 'bg-primary-strong'"
        >
          보내기
        </button>
      </form>
    </div>
  </DimOverlay>
</template>
