<script setup lang="ts">
import {
  needsCompanyDocs,
  needsFixedDateStatus,
  needsIncomeCert,
  needsResidentCert,
  needsStandardPrice,
  needsWithholdingReceipt,
  type DocSituation,
} from '~/components/contract/labels';
import { loadDocSituation } from '~/components/contract/situation';

/**
 * 3루 7 · 서류 일괄 발급 (D-14).
 *
 * **사이트 단위로 묶어서 하루에 끝낸다.** 서류가 열 개가 넘어 보이지만
 * 실제로 들어가는 곳은 다섯 군데뿐이고, 발로 가야 하는 건 주민센터
 * 하나다. 서류 이름순으로 하면 같은 사이트를 세 번 들어가게 된다.
 *
 * 너무 일찍 떼면 안 된다 — 대출 제출용은 1개월 이내 발급분만 인정한다.
 * 그래서 D-14 에 몰아서 뗀다. 회사 서류만 예외로 D-30 에 미리 요청한다.
 *
 * **동선은 사람마다 다르다.** 오피스텔이 아니면 홈택스에서 기준시가를 뗄 일이
 * 없고, 다가구·단독이 아니면 주민센터에 갈 일 자체가 없다. 그래서 계약·진단
 * 값으로 갈라서 해당하는 것만 번호를 매기고, 나머지는 `해당 없음` 으로 자리에
 * 남긴다 — **지우지 않는다.** 잘못 짚었을 때 사용자가 서류를 못 찾는 쪽이 더 나쁘다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);

/** 조건이 붙는 한 줄. `when` 이 없으면 누구에게나 해당한다. */
interface Conditional {
  text: string;
  when?: (situation: DocSituation) => boolean;
}

interface Errand {
  site: string;
  minutes: string;
  docs: Conditional[];
}

/** 하루 안에 도는 순서. 순서가 뜻을 갖는다 — 마지막 주민센터만 발로 간다. */
const ORDER: Errand[] = [
  {
    site: '정부24',
    minutes: '10분',
    docs: [{ text: '주민등록등본' }, { text: '가족관계증명서' }, { text: '건축물대장' }],
  },
  { site: '인터넷등기소', minutes: '5분', docs: [{ text: '등기부등본 발급본' }] },
  {
    site: '홈택스',
    minutes: '10분',
    docs: [
      { text: '원천징수영수증', when: (s) => needsWithholdingReceipt(s.employmentType) },
      { text: '소득금액증명원', when: (s) => needsIncomeCert(s.employmentType) },
      { text: '기준시가', when: (s) => needsStandardPrice(s.houseType) },
    ],
  },
  { site: '건강보험공단', minutes: '5분', docs: [{ text: '자격득실확인서' }] },
  {
    site: '은행 앱',
    minutes: '5분',
    docs: [{ text: '계약금 이체확인증' }, { text: '급여통장 거래내역서' }],
  },
  {
    site: '주민센터',
    minutes: '30분',
    docs: [
      { text: '전입세대확인서', when: (s) => needsResidentCert(s.houseType, s.collateral) },
      { text: '확정일자 부여현황', when: (s) => needsFixedDateStatus(s.houseType) },
    ],
  },
];

/** 다 떼고 나서 짚는 것. 하나라도 어긋나면 창구에서 되돌아온다. */
const CHECKS: Conditional[] = [
  { text: '모든 서류가 1개월 이내 발급인가' },
  { text: '주민등록번호가 마스킹 없이 나오는가' },
  { text: '주민등록등본에 주소변동 이력이 나오는가' },
  { text: '등기부등본이 열람본이 아니라 발급본인가' },
  { text: '등기부등본에 말소사항이 포함되어 있는가' },
  { text: '계약서와 등기부 주소가 정확히 일치하는가' },
  {
    text: '전입세대확인서에 성명이 가려지지 않았는가',
    when: (s) => needsResidentCert(s.houseType, s.collateral),
  },
];

const checked = ref<Record<string, boolean>>({});
const situation = ref<DocSituation | null>(null);
const pending = ref(true);
/** 계약·진단을 못 불러왔는가. 걸러내지 않았다는 사실을 화면이 밝혀야 한다. */
const unfiltered = ref(false);

/** 상황을 모르면 전부 해당한다. 잘못 거른 동선보다 긴 동선이 낫다. */
const applies = (item: Conditional) => !item.when || !situation.value || item.when(situation.value);

/**
 * 번호는 실제로 가는 곳에만 붙인다.
 *
 * 해당 없는 사이트를 지우지 않고 자리에 두되 번호를 건너뛰면, 오늘 몇 군데를
 * 도는지가 첫눈에 보인다.
 */
const errands = computed(() => {
  let step = 0;
  return ORDER.map((errand) => {
    const mine = errand.docs.filter(applies);
    return {
      ...errand,
      mine,
      skipped: errand.docs.filter((doc) => !applies(doc)),
      index: mine.length ? ++step : null,
    };
  });
});

const myChecks = computed(() => CHECKS.filter(applies));
const skippedChecks = computed(() => CHECKS.filter((check) => !applies(check)));

/** 주민센터에 갈 일이 남았는가. 없으면 오늘 발로 뛸 곳이 하나도 없다. */
const needsVisit = computed(() =>
  errands.value.some((errand) => errand.site === '주민센터' && errand.mine.length > 0),
);

/** 회사 서류(D-30)를 안내할 사람인가. */
const companyDocs = computed(
  () => !situation.value || needsCompanyDocs(situation.value.product, situation.value.companySize),
);

onMounted(async () => {
  situation.value = await loadDocSituation(planId);
  unfiltered.value = situation.value === null;
  pending.value = false;
});
</script>

<template>
  <PhoneFrame>
    <StageBar
      title="D-14 서류 일괄 발급"
      base="3루"
      @back="navigateTo(`/contract/${planId}/bank-visit`)"
    />

    <div class="px-gutter-tight flex flex-1 flex-col gap-3 py-4">
      <CoachTip v-if="pending || needsVisit">
        서류가 열 개 넘어서 막막하죠? 사이트별로 묶으면 다섯 군데서 끝나요. 온라인이 안 되는 건
        전입세대확인서 하나뿐이에요
      </CoachTip>
      <CoachTip v-else>
        서류가 열 개 넘어서 막막하죠? 사이트별로 묶으면 몇 군데서 끝나요. 게다가 이번엔 주민센터에
        갈 일이 없어서 전부 온라인으로 끝나요
      </CoachTip>

      <p v-if="unfiltered" class="bg-badge-warning rounded-field text-caption2 text-ink-hero p-3.5">
        계약 정보를 불러오지 못해서 전체 목록을 그대로 보여드려요. 해당하지 않는 서류가 섞여 있을 수
        있어요.
      </p>

      <div class="bg-badge-warning rounded-field flex flex-col gap-1.5 p-3.5">
        <p class="text-label2 text-warning-strong font-semibold">
          대출 제출용 = 1개월 이내 발급분만 인정
        </p>
        <p class="text-caption2 text-ink-hero">
          너무 미리 떼면 재발급이 필요해요. D-14 전후에 한번에 몰아서 발급.
        </p>
      </div>

      <h2 class="text-body3 text-ink-hero font-bold">하루 만에 끝내기 · 이 순서대로</h2>

      <!--
        내 계약·진단 값이 오기 전까지는 동선을 그리지 않는다. 전부 그렸다가 접으면
        줄이 튄다. 값을 못 받으면 `situation` 이 null 이라 전부 해당하는 것으로 그린다.
      -->
      <p v-if="pending" class="text-label2 text-ink-muted px-1">내 상황에 맞춰 고르는 중이에요…</p>

      <AppCard v-else class="flex flex-col gap-2.5">
        <!-- 해당 없는 사이트도 자리에 남긴다. 번호만 건너뛴다. -->
        <div v-for="errand in errands" :key="errand.site" class="flex items-start gap-2.5">
          <span
            class="text-micro mt-0.5 grid size-5.5 shrink-0 place-items-center rounded-full font-bold"
            :class="
              errand.index ? 'bg-primary-strong text-white' : 'bg-surface-info text-ink-muted'
            "
            aria-hidden="true"
          >
            {{ errand.index ?? '–' }}
          </span>
          <span class="flex flex-1 flex-col gap-0.5">
            <span class="flex items-center gap-1.5">
              <span
                class="text-label2 font-semibold"
                :class="errand.index ? 'text-ink-hero' : 'text-ink-muted'"
              >
                {{ errand.site }}
              </span>
              <span
                v-if="errand.index"
                class="bg-surface-info rounded-chip text-micro text-primary-strong px-1.5 py-0.5 font-semibold"
              >
                {{ errand.minutes }}
              </span>
              <span
                v-else
                class="bg-surface-brand rounded-chip text-micro text-ink-muted px-1.5 py-0.5 font-semibold"
              >
                해당 없음
              </span>
            </span>
            <span v-if="errand.mine.length" class="text-micro text-ink-hero-body">
              {{ errand.mine.map((doc) => doc.text).join(' · ') }}
            </span>
            <span v-if="errand.skipped.length" class="text-micro text-ink-muted">
              해당 없음 · {{ errand.skipped.map((doc) => doc.text).join(' · ') }}
            </span>
          </span>
        </div>

        <p
          v-if="companyDocs"
          class="bg-surface-brand rounded-chip text-micro text-ink-hero-body p-3"
        >
          회사 서류(D-30)는 이보다 훨씬 먼저 요청해 두세요
        </p>
      </AppCard>

      <template v-if="!pending">
        <h2 class="text-body3 text-ink-hero font-bold">떼고 나서 확인할 것</h2>

        <CheckItem v-for="item in myChecks" :key="item.text" v-model="checked[item.text]">
          {{ item.text }}
        </CheckItem>

        <!-- 체크할 수는 없지만 지우지도 않는다. 왜 빠졌는지 보이게 둔다. -->
        <div
          v-for="item in skippedChecks"
          :key="item.text"
          class="bg-surface border-line rounded-chip flex items-center gap-2.5 border px-3.5 py-3"
        >
          <span class="text-label2 text-ink-muted flex-1 line-through">{{ item.text }}</span>
          <span
            class="bg-surface-brand rounded-chip text-micro text-ink-muted shrink-0 px-1.5 py-0.5 font-semibold"
          >
            해당 없음
          </span>
        </div>
      </template>

      <DetailLink @open="navigateTo(`/contract/${planId}/documents`)">
        서류별 발급 방법 상세보기
      </DetailLink>
    </div>

    <footer class="px-gutter-tight flex shrink-0 gap-2 pt-2.5 pb-cta-pad">
      <div class="w-28 shrink-0">
        <AppButton variant="white" @click="navigateTo(`/contract/${planId}/bank-visit`)">
          이전
        </AppButton>
      </div>
      <AppButton variant="strong" @click="navigateTo(`/contract/${planId}/resident-cert`)">
        다음
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
