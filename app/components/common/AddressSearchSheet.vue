<script setup lang="ts">
import { useAddressApi, type AddressResult } from '~/api/address';
import { messageFrom } from '~/utils/error';

/**
 * AU-05d~f 주소 검색.
 *
 * 본인 확인(identity) 폼의 '주소 검색'을 눌러 전체화면으로 연다. 라우트로 빼지 않고
 * 오버레이로 두는 이유는, 폼에 이미 채운 이름·생년월일·휴대전화 인증이 화면을
 * 떠나면 로컬 상태라 날아가기 때문이다. 시트로 덮으면 아래 폼은 그대로 살아 있다.
 *
 * 고른 결과는 문자열이 아니라 통째로 올려보낸다(`select`). 법정동 코드로 정책 권역을
 * 정하고 매물 조회에도 쓰므로, 주소 글자만 남기면 뒤가 막힌다.
 */
const emit = defineEmits<{ close: []; select: [AddressResult] }>();

const keyword = ref('');
const results = ref<AddressResult[]>([]);
const searching = ref(false);
const searched = ref(false);
const error = ref('');

/** 도로명주소 API가 받는 입력 형태. 헛검색을 줄이려고 검색 전에 먼저 보여준다. */
const GUIDE: [string, string][] = [
  ['도로명 + 건물번호', '월드컵북로 396'],
  ['동/읍/면/리 + 번지', '상암동 1601'],
  ['건물명 · 아파트', '누리꿈스퀘어'],
];

const field = ref<HTMLInputElement | null>(null);
onMounted(() => field.value?.focus());

async function search() {
  const text = keyword.value.trim();
  if (text.length < 2 || searching.value) return;
  searching.value = true;
  error.value = '';
  try {
    results.value = (await useAddressApi().search(text)).addresses;
    searched.value = true;
  } catch (cause) {
    error.value = messageFrom(cause, '주소를 검색하지 못했어요. 잠시 후 다시 시도해주세요.');
  } finally {
    searching.value = false;
  }
}
</script>

<template>
  <div class="bg-surface fixed inset-0 z-50 flex justify-center">
    <div class="max-w-screen flex w-full flex-col overflow-hidden">
      <div class="h-statusbar shrink-0" />

      <header class="px-gutter flex h-14 shrink-0 items-center gap-2">
        <button type="button" class="text-ink -ml-1 p-1" aria-label="뒤로" @click="emit('close')">
          <svg viewBox="0 0 24 24" class="size-6" fill="none" aria-hidden="true">
            <path
              d="M15 5l-7 7 7 7"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <h2 class="text-headline2 text-ink">주소 검색</h2>
      </header>

      <div class="bg-canvas-soft px-gutter flex flex-1 flex-col gap-4 overflow-y-auto py-4">
        <div
          class="bg-surface border-line rounded-field flex items-center gap-2 border px-3.5 py-3"
        >
          <input
            ref="field"
            v-model="keyword"
            type="search"
            placeholder="도로명, 건물명, 지번으로 검색"
            class="text-input text-ink-strong placeholder:text-ink-muted w-full bg-transparent outline-none"
            @keydown.enter.prevent="search"
          />
          <button
            type="button"
            class="text-label2 text-primary-strong shrink-0 font-bold disabled:opacity-50"
            :disabled="keyword.trim().length < 2 || searching"
            @click="search"
          >
            {{ searching ? '검색 중' : '검색' }}
          </button>
        </div>

        <p v-if="error" class="text-label2 text-danger">{{ error }}</p>

        <!-- 검색 전: 입력 형태 안내 -->
        <div v-if="!searched" class="bg-surface-info rounded-field flex flex-col gap-3 p-4">
          <p class="text-label2 text-ink-body font-bold">이렇게 검색해보세요</p>
          <div v-for="[label, example] in GUIDE" :key="label" class="flex items-baseline gap-2">
            <span class="text-caption1 text-ink-muted w-28 shrink-0">{{ label }}</span>
            <span class="text-label2 text-ink-strong">{{ example }}</span>
          </div>
        </div>

        <!-- 결과 없음 -->
        <div v-else-if="!results.length" class="flex flex-col items-center gap-2 py-10 text-center">
          <p class="text-body2 text-ink-hero font-bold">검색 결과가 없어요</p>
          <p class="text-label2 text-ink-muted">
            도로명 · 건물명 · 지번 중 하나로<br />다시 검색해보세요.
          </p>
        </div>

        <!-- 결과 -->
        <button
          v-for="result in results"
          :key="result.roadAddress + result.mainLotNumber + result.subLotNumber"
          type="button"
          class="border-line bg-surface rounded-field border p-4 text-left"
          @click="emit('select', result)"
        >
          <p class="text-body2 text-ink-hero font-bold">{{ result.roadAddress }}</p>
          <p class="text-label2 text-ink-hero-body mt-3">
            {{ result.buildingName || result.jibunAddress }}
          </p>
        </button>
      </div>
    </div>
  </div>
</template>
