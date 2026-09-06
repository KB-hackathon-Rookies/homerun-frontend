<script setup lang="ts">
import { useDocumentApi, type DocumentGuide, type DocumentSummary } from '~/api/document';
import { messageFrom } from '~/utils/error';

/**
 * 상세 · 서류 발급.
 *
 * **어디서 떼는지를 서버가 안다.** 같은 서류라도 방법마다 수수료와 챙길
 * 것이 다르고, 온라인으로 되면 온라인을 먼저 권한다 — 주민센터를 두 번
 * 가는 게 제일 아깝다.
 *
 * 유효기간이 있는 서류는 너무 일찍 떼면 다시 떼야 한다. 그래서 목록에
 * 인정 기간을 같이 보여준다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

const documents = ref<DocumentSummary[]>([]);
const opened = ref<Record<string, DocumentGuide>>({});
/** 지금 펼쳐 둔 서류. 받은 안내는 남겨 두고 여닫기만 여기서 관리한다. */
const open = ref<string[]>([]);
const pending = ref(true);
const error = ref('');

async function toggle(code: string) {
  if (opened.value[code]) {
    // 한 번 받은 안내는 지우지 않고 접기만 한다 — 다시 열 때 또 부르지 않는다.
    open.value = open.value.filter((item) => item !== code);
    return;
  }
  try {
    if (!opened.value[code]) opened.value[code] = await useDocumentApi().guide(code);
    open.value = [...open.value, code];
  } catch (cause) {
    error.value = messageFrom(cause, '발급 안내를 불러오지 못했어요.');
  }
}

/** 수수료는 천 원 단위라 만 원 표기를 쓰지 않는다. */
const fee = (won: number) => (won === 0 ? '무료' : `${won.toLocaleString('ko-KR')}원`);

onMounted(async () => {
  try {
    documents.value = await useDocumentApi().list();
  } catch (cause) {
    error.value = messageFrom(cause, '서류 목록을 불러오지 못했어요.');
  } finally {
    pending.value = false;
  }
});
</script>

<template>
  <GuideFrame title="서류 발급 상세" @back="navigateTo(`/contract/${planId}/loan-apply`)">
    <div class="bg-badge-warning rounded-field flex flex-col gap-1.5 p-3.5">
      <p class="text-label2 text-warning-strong font-semibold">
        대출 제출용 = 1개월 이내 발급분만 인정
      </p>
      <p class="text-caption2 text-ink-hero">
        너무 미리 떼면 재발급이 필요해요. D-14 전후에 한번에 몰아서 발급.
      </p>
    </div>

    <p v-if="pending" class="text-label2 text-ink-muted">서류 목록을 불러오는 중이에요…</p>
    <p v-else-if="error" class="text-label2 text-danger">{{ error }}</p>

    <template v-else>
      <h2 class="text-option text-ink-hero px-1 pt-2">서류별 발급 경로</h2>

      <AppCard v-for="doc in documents" :key="doc.code" class="flex flex-col gap-2">
        <button type="button" class="flex items-center gap-2 text-left" @click="toggle(doc.code)">
          <span class="flex-1">
            <span class="text-body3 text-ink-hero block font-semibold">{{ doc.name }}</span>
            <span class="text-micro text-ink-muted block">
              {{ doc.issuer }}
              <template v-if="doc.validityDays"> · {{ doc.validityDays }}일 인정</template>
              <template v-if="!doc.onlineAvailable"> · 온라인 불가</template>
            </span>
          </span>
          <span class="text-caption2 text-primary-strong shrink-0 font-semibold">
            {{ open.includes(doc.code) ? '접기' : '발급 방법' }}
          </span>
        </button>

        <template v-if="open.includes(doc.code)">
          <div
            v-for="method in opened[doc.code]!.methods"
            :key="method.label"
            class="bg-surface-info rounded-chip flex flex-col gap-1 px-3 py-2.5"
          >
            <span class="flex items-center gap-2">
              <span class="text-caption2 text-ink-hero font-semibold">{{ method.label }}</span>
              <span
                v-if="method.recommended"
                class="bg-primary-strong rounded-chip text-micro px-1.5 py-0.5 font-semibold text-white"
              >
                권장
              </span>
            </span>
            <span class="text-micro text-ink-hero-body">
              {{ method.agency }} · {{ method.feeNote ?? fee(method.fee) }}
            </span>
            <span v-if="method.requirements" class="text-micro text-ink-hero-body">
              챙길 것 · {{ method.requirements }}
            </span>
            <span v-if="method.note" class="text-micro text-ink-muted">{{ method.note }}</span>
          </div>

          <p v-if="opened[doc.code]!.note" class="text-micro text-ink-hero-body">
            {{ opened[doc.code]!.note }}
          </p>
          <p v-if="opened[doc.code]!.validityNote" class="text-micro text-warning-strong">
            {{ opened[doc.code]!.validityNote }}
          </p>
        </template>
      </AppCard>
    </template>

    <h2 class="text-option text-ink-hero px-1 pt-2">옵션 주의사항</h2>

    <AppCard class="flex flex-col gap-2">
      <p class="text-label2 text-ink-hero font-semibold">주민등록번호 마스킹은 전부 제거</p>
      <p class="text-caption2 text-ink-hero">
        대출용은 마스킹 없이 발급해야 해요. 발급 옵션에서 "주민등록번호 표시" 체크.
      </p>
      <div class="bg-surface-info rounded-field flex flex-col gap-1 px-3 py-2.5">
        <p class="text-caption2 text-primary-strong font-semibold">
          대출용 vs 보증료 지원용은 옵션이 달라요
        </p>
        <p class="text-caption2 text-ink-hero">
          주민등록등본: 대출용은 주소변동 포함 · 보증료 지원용은 전체공개. 같은 서류라도 옵션이
          다르면 별개로 관리해요.
        </p>
      </div>
    </AppCard>

    <template #cta>
      <AppButton variant="strong" @click="navigateTo(`/contract/${planId}/loan-apply`)">
        대출 신청 화면으로
      </AppButton>
    </template>
  </GuideFrame>
</template>
