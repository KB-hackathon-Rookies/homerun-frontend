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
 * 상세 · 서류별 발급 방법.
 *
 * **묶음이 사이트 단위다.** 서류 이름순으로 늘어놓으면 정부24를 세 번 들어가게
 * 된다. 같은 사이트에서 뗄 것을 붙여 두면 한 번 로그인해서 다 끝난다.
 *
 * 줄을 누르면 시트가 올라온다. 발급 경로보다 **설정 옵션이 중요하다** —
 * 등본을 주소변동 미포함으로 떼면 반려되고, 등기부를 열람본으로 떼면 대출
 * 신청에 못 쓴다. 그 옵션이 화면에 없으면 한 번 더 떼러 가야 한다.
 *
 * **19종이 다 내 것은 아니다.** 오피스텔이 아니면 기준시가를, 다가구가 아니면
 * 확정일자 부여현황을 뗄 일이 없다. 그래서 내 계약·진단 값으로 갈라서 해당하는
 * 것만 위에 두고, 나머지는 아래 접힌 자리에 남긴다 — **지우지는 않는다.** 앱이
 * 상황을 잘못 짚었을 때 정작 필요한 서류를 못 찾는 쪽이 더 나쁘다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const router = useRouter();
const planId = Number(route.params.planId);

/** 발급 경로 한 줄. 왼쪽이 어디서, 오른쪽이 어떻게·얼마다. */
interface Way {
  label: string;
  text: string;
}

interface Doc {
  code: string;
  name: string;
  /** 줄과 시트 머리에 같이 붙는 꼬리표. */
  badge?: string;
  ways: Way[];
  /** 발급할 때 눌러야 하는 것. 이걸 놓치면 다시 떼야 한다. */
  options?: string[];
  tip?: string;
  /** 경고는 팁과 색이 다르다. 온라인 발급이 아예 안 되는 자리다. */
  tipTone?: 'info' | 'warn';
  /** 이 서류가 나에게 해당하는가. 없으면 누구에게나 해당한다. */
  when?: (situation: DocSituation) => boolean;
  /** 해당하지 않을 때 적어 주는 한 줄. 왜 빠졌는지 모르면 사용자가 불안해한다. */
  whyNot?: string;
}

interface DocGroup {
  title: string;
  docs: Doc[];
}

const GROUPS: DocGroup[] = [
  {
    title: '1 · 정부24 gov.kr',
    docs: [
      {
        code: 'resident-copy',
        name: '주민등록등본',
        badge: '가장 중요',
        ways: [
          {
            label: '온라인',
            text: '정부24 → 검색 "주민등록표등본" → 발급 → 온라인 출력 또는 전자문서지갑 · 무료',
          },
          {
            label: '무인발급기',
            text: '"주민등록표 등본" → 지문 또는 신분증 → 옵션 선택 → 출력 · 200원',
          },
          { label: '방문', text: '전국 어느 주민센터 · 신분증 · 400원' },
          { label: '유효기간', text: '1개월' },
        ],
        options: [
          '과거의 주소 변동사항 포함 → "포함"',
          '주민등록번호 뒷자리 → "모두 공개"',
          '세대주 성명과 관계 → "포함"',
        ],
        tip: '은행은 최근 5년 주소 이력을 봐요. 기본값이 미포함이라 그냥 발급하면 반려돼요. 창구에서는 "은행 제출용이라 주소변동 포함으로 부탁드려요"',
      },
      {
        code: 'building-ledger',
        name: '건축물대장',
        ways: [
          {
            label: '온라인',
            text: '정부24 → "건축물대장" → 등초본 발급(열람) → 주소 입력 → 대장 구분 · 무료 · 로그인 없이 열람 가능',
          },
          { label: '무인발급기', text: '약 500원' },
          { label: '방문', text: '시군구청 주택과·건축과, 주민센터' },
        ],
        options: [
          '집합건물(빌라·아파트·오피스텔) → 대장 구분 "집합", 종류 "전유부"',
          '단독주택 → 대장 구분 "일반"',
        ],
        tip: '볼 곳: 상단 [위반건축물] 표시, 주용도가 주택인지(제2종근린생활시설이면 대출 불가), 전용면적이 계약서와 같고 85㎡ 이하인지',
      },
      {
        code: 'family-relation',
        name: '가족관계증명서',
        ways: [
          {
            label: '온라인',
            text: '대법원 전자가족관계등록시스템 efamily.scourt.go.kr 또는 정부24 · 무료',
          },
          { label: '무인발급기', text: '약 500원' },
          { label: '방문', text: '주민센터 또는 법원 민원실 · 1,000원 · 신분증' },
        ],
        options: ['종류는 "상세"로 (일반은 정보가 적어요)'],
        tip: '단독세대주인 경우, 세대 분리 확인이 필요할 때 필요해요',
      },
    ],
  },
  {
    title: '2 · 인터넷등기소 iros.go.kr',
    docs: [
      {
        code: 'registry',
        name: '등기사항전부증명서 (등기부등본)',
        badge: '발급본',
        ways: [
          {
            label: '온라인',
            text: 'iros.go.kr → 부동산 등기 → 발급하기 → 간편검색 주소 입력 → 결제 → 출력 · 앱도 가능',
          },
          { label: '무인발급기', text: '일부 기기 · 1,000원' },
          { label: '방문', text: '전국 어느 등기소 · 1,200원' },
          {
            label: '열람 vs 발급',
            text: '열람 700원(내가 확인할 때) / 발급 1,000원(은행 제출용). 대출 신청에는 반드시 발급본',
          },
        ],
        options: [
          '등기 종류: 집합건물 (단독주택은 건물·토지 따로)',
          '말소사항 포함 (현재유효사항 X)',
          '주민등록번호 공개 여부: 공개',
          '집합건물은 동호수까지 정확히',
        ],
        tip: '총 세 번 떼요: ① 2루 매물 검증·사전상담 열람 700원 ② 3루 D-14 발급 1,000원(은행마다 달라 사전상담 때 "제가 떼 가야 하나요? 열람본인가요 발급본인가요?" 확인) ③ 잔금일 아침 송금 전 열람 700원',
      },
      {
        code: 'fixed-date',
        name: '확정일자',
        ways: [
          {
            label: '온라인',
            text: '인터넷등기소 → 확정일자 → 신청 → 계약정보 입력 → 계약서 스캔본 첨부 → 결제 · 600원 · 당일',
          },
          { label: '방문', text: '주민센터 또는 등기소 · 신분증 + 계약서 원본 · 600원 · 즉시' },
          {
            label: '자동 부여',
            text: '임대차 신고(rtms.molit.go.kr 또는 주민센터) · 보증금 6천만원 초과면 30일 이내 신고 의무 · 무료',
          },
        ],
        tip: '온라인은 스캔본, 방문은 원본이에요',
      },
    ],
  },
  {
    title: '3 · 홈택스 hometax.go.kr',
    docs: [
      {
        code: 'withholding',
        name: '근로소득 원천징수영수증',
        when: (s) => needsWithholdingReceipt(s.employmentType),
        whyNot: '근로소득이 있을 때 나오는 서류예요',
        ways: [
          {
            label: '온라인',
            text: '홈택스 → My홈택스 → 연말정산·지급명세서 → 제출내역 → 근로소득 지급명세서 조회 · 무료',
          },
          { label: '방문', text: '전국 세무서 · 무료 · 신분증' },
          { label: '회사', text: '인사팀에서 바로 뽑아줘요' },
        ],
        tip: '회사가 연말정산을 신고해야 조회돼요. 재직 1년 미만이면 작년 자료가 없을 수 있어 급여통장 거래내역으로 대체해요',
      },
      {
        code: 'income-cert',
        name: '소득금액증명원',
        when: (s) => needsIncomeCert(s.employmentType),
        whyNot: '프리랜서·사업소득자 자리예요. 은행이 따로 요청하면 그때 떼면 돼요',
        ways: [
          {
            label: '온라인',
            text: '홈택스 → 증명·등록·신청 → 증명신청 → 소득금액증명 → 과세기간 선택 · 무료 · 정부24도 가능',
          },
          { label: '무인발급기', text: '가능 · 수수료 있음' },
          { label: '방문', text: '세무서 · 무료 · 신분증' },
        ],
        tip: '프리랜서, 사업소득자, 은행이 요청한 경우에 필요해요',
      },
      {
        code: 'standard-price',
        name: '기준시가 (오피스텔일 때)',
        when: (s) => needsStandardPrice(s.houseType),
        whyNot: '오피스텔일 때만 필요해요',
        ways: [
          {
            label: '온라인',
            text: '홈택스 → 조회·발급 → 기준시가 조회 → 오피스텔 및 상업용 건물 → 주소 입력 · 무료 · 로그인 없이',
          },
        ],
        tip: '오피스텔은 공시가격 알리미에 안 나와요. 반환보증 126% 룰 판정에 이 값을 써요',
      },
    ],
  },
  {
    title: '4 · 국민건강보험공단 nhis.or.kr',
    docs: [
      {
        code: 'health-insurance',
        name: '건강보험 자격득실확인서',
        badge: '무조건 필요',
        ways: [
          {
            label: '온라인',
            text: 'nhis.or.kr → 민원여기요 → 증명서 발급·확인 → 자격득실확인서 · 무료',
          },
          { label: '앱', text: 'The건강보험 · 무료 · 제일 빨라요' },
          { label: '정부24', text: '검색 "건강보험 자격득실확인서" · 무료' },
          { label: '무인발급기', text: '가능' },
          { label: '방문·전화', text: '공단 지사(신분증) · 1577-1000 팩스 수령' },
        ],
        tip: '소득의 종류(직장·지역가입자)를 확인하는 서류예요. 재직 회사가 이 서류로 확인되면 재직증명서를 생략할 수도 있어요',
      },
    ],
  },
  {
    title: '5 · 은행 앱',
    docs: [
      {
        code: 'deposit-transfer',
        name: '계약금 이체확인증',
        ways: [
          {
            label: '앱',
            text: '은행 앱 → 조회 → 거래내역 → 해당 이체 건 → 이체확인증 발급 · 무료 · PDF 저장',
          },
          { label: '인터넷뱅킹', text: '무료' },
          { label: '방문', text: '은행 창구 · 무료 · 신분증' },
        ],
        tip: '계약금을 보낸 즉시 발급받아 보관하세요. 입금자명과 수취인이 등기부상 소유자와 일치해야 해요',
      },
      {
        code: 'salary-statement',
        name: '급여통장 거래내역서',
        badge: '재직 1년 미만 필수',
        ways: [
          {
            label: '앱',
            text: '은행 앱 → 거래내역 조회 → 기간 선택(입사일~현재) → PDF 또는 입출금거래내역확인서 · 무료',
          },
          { label: '방문', text: '은행 창구 · 무료 · 신분증 · 직인이 찍혀 더 확실' },
        ],
        tip: '급여가 들어오는 내역이 보이게. 회사명과 금액이 나와야 해요',
      },
    ],
  },
  {
    title: '6 · 회사와 근로복지공단 (청년 버팀목 우대금리용)',
    docs: [
      {
        code: 'company-docs',
        name: '재직증명서 · 사업자등록증 사본 · 주업종코드 확인서',
        when: (s) => needsCompanyDocs(s.product, s.companySize),
        whyNot: '청년 버팀목 + 중소·중견기업 재직일 때 받는 우대금리용이에요',
        ways: [
          { label: '회사', text: '인사팀 또는 그룹웨어 셀프 발급 · 무료' },
          {
            label: '주업종코드',
            text: '회사에 요청 · 제일 오래 걸려요 · 담당자가 잘 모를 수 있어 계약하자마자 요청',
          },
        ],
        tip: '이 세 개가 우대금리 0.3%p(2년 약 86만원)를 결정해요. 청년 버팀목에만 해당. 사행성 업종·대기업·공기업은 우대 대상이 아니에요',
      },
      {
        code: 'employment-history',
        name: '고용보험 자격이력내역서',
        ways: [
          {
            label: '온라인',
            text: '고용·산재보험 토탈서비스 total.comwel.or.kr → 개인 로그인 → 증명원 신청·발급 · 무료 · 본인 직접 발급',
          },
          { label: '정부24', text: '검색 "고용보험 자격이력내역서" · 무료' },
          { label: '방문·전화', text: '근로복지공단 지사(신분증) · 1588-0075' },
        ],
      },
    ],
  },
  {
    title: '7 · 주민센터 (유일하게 방문이 필요해요)',
    docs: [
      {
        code: 'resident-cert',
        name: '전입세대확인서',
        badge: '온라인 불가',
        when: (s) => needsResidentCert(s.houseType, s.collateral),
        whyNot: '다가구·단독주택을 안심전세(HUG) 담보로 받을 때만 필요해요',
        ways: [
          {
            label: '사전 신청',
            text: '정부24 "전입세대확인서" 검색 → 사전 신청 → 주민센터 방문 수령 (대기 없이)',
          },
          { label: '지참물', text: '신분증 · 임대차계약서 원본 (사본 불가)' },
          { label: '비용·소요', text: '300원 · 5분 · 이해관계인만 발급' },
        ],
        options: [
          '"은행 제출용이라 성명 가림 없이 부탁드립니다"',
          '"지번 주소와 도로명 주소 두 버전 모두 조회해주세요"',
        ],
        tip: '다가구·단독주택 + 안심전세 담보일 때만 필요해요. 다세대·오피스텔이면 건너뛰어도 돼요. 무인발급기로도 안 돼요',
      },
      {
        code: 'fixed-date-status',
        name: '확정일자 부여현황 (다가구일 때)',
        when: (s) => needsFixedDateStatus(s.houseType),
        whyNot: '다가구일 때만 필요해요',
        ways: [{ label: '방문', text: '주민센터 · 임대차계약서 지참 · 방문만 가능' }],
        tip: '다가구는 건물 전체가 하나의 등기라 다른 호실 보증금이 등기부에 안 나와요. 선순위 보증금 총액을 알아야 내 순위를 계산할 수 있어요. 전입세대확인서와 같이 받으면 한 번에 끝나요',
      },
      {
        code: 'move-in-report',
        name: '전입신고 (잔금일 당일)',
        ways: [
          {
            label: '온라인',
            text: '정부24 → "전입신고" → 신청 · 무료 · 오후 6시 이후 신청은 다음 근무일 처리라 오전에',
          },
          { label: '방문', text: '주민센터 · 무료 · 신분증 · 당일 처리 확인이 돼서 더 확실' },
        ],
        tip: '대항력은 전입신고 다음날 0시부터 생겨요. 잔금일 당일에 꼭 하세요',
      },
    ],
  },
  {
    title: '그 밖에 필요할 수 있는 것',
    docs: [
      {
        code: 'public-price',
        name: '공시가격 · 실거래가',
        ways: [
          {
            label: '빌라·아파트',
            text: '부동산공시가격 알리미 realtyprice.kr → 공동주택 공시가격 → 열람 → 동·호수 · 무료',
          },
          { label: '단독·다가구', text: '알리미 → 개별단독주택 공시가격' },
          { label: '오피스텔', text: '홈택스 기준시가' },
          {
            label: '실거래가',
            text: '국토교통부 실거래가 공개시스템 rt.molit.go.kr → 전월세 · 무료',
          },
        ],
        tip: '빌라는 도로명으로 안 잡히면 지번 주소로. 공시가격은 매년 4월 말 공시라 기준연도를 함께 기록해요. 거래가 적어 시세가 없으면 공시가격으로 판단',
      },
      {
        code: 'landlord-docs',
        name: '임대인에게 요청할 서류',
        ways: [
          { label: '국세 완납증명서', text: '임대인이 홈택스 또는 세무서에서 발급' },
          {
            label: '지방세 완납증명서',
            text: '임대인이 위택스 wetax.go.kr, 정부24, 주민센터에서 발급',
          },
          { label: '통장 사본', text: '대출금을 받을 계좌 · 등기부상 소유자 명의' },
        ],
        tip: '임대인이 세금을 체납했으면 조세채권이 내 보증금보다 우선해요. 보증금 1천만원 초과면 계약 후 임대인 동의 없이도 세무서에서 열람할 수 있어요',
      },
    ],
  },
  {
    title: '프린터가 없다면',
    docs: [
      {
        code: 'no-printer',
        name: '프린터 없이 서류 내는 법',
        ways: [
          {
            label: 'KB스타뱅킹',
            text: '국민지갑 → 전자증명서 → 서류 발급 → 창구에서 바로 제출. 출력 필요 없음 (등본·초본 등 민원 문서)',
          },
          { label: '정부24', text: '수령 방법에서 전자문서지갑 선택 → QR이나 링크로 제출' },
          {
            label: '무인발급기',
            text: '등본·가족관계증명서·건축물대장 · 수수료 있음 · 24시간 가능한 곳도',
          },
          { label: '편의점 출력', text: 'PDF로 받아 복합기 출력 · 장당 100~200원' },
        ],
        tip: '전입세대확인서와 확정일자 부여현황은 어떤 방법으로도 온라인 발급이 안 돼요. 임대차계약서 원본을 들고 주민센터로',
        tipTone: 'warn',
      },
    ],
  },
];

/** 발급 방법 자체가 세 가지다. 서류마다 다시 설명하지 않으려고 맨 위에 한 번 둔다. */
const HOW: Way[] = [
  {
    label: '온라인',
    text: '집에 프린터가 있을 때 가장 빠름 · 공동인증서 또는 간편인증 · 대부분 무료',
  },
  {
    label: '무인발급기',
    text: '프린터가 없을 때 · 24시간 가능한 곳도 · 신분증 또는 지문 · 수수료 있음',
  },
  { label: '방문', text: '온라인이 안 되는 서류, 인증 문제 있을 때 · 신분증 + 서류별 준비물' },
];

const openDoc = ref<Doc | null>(null);

const situation = ref<DocSituation | null>(null);
const pending = ref(true);
/** 계약·진단을 못 불러왔는가. 걸러내지 않았다는 사실을 화면이 밝혀야 한다. */
const unfiltered = ref(false);
const skippedOpen = ref(false);

/** 상황을 모르면 전부 해당한다. 잘못 거른 목록보다 긴 목록이 낫다. */
const applies = (doc: Doc) => !doc.when || !situation.value || doc.when(situation.value);

/** 해당하는 것만 남긴다. 그룹이 통째로 비면 그 사이트는 갈 일이 없다. */
const myGroups = computed(() =>
  GROUPS.map((group) => ({ ...group, docs: group.docs.filter(applies) })).filter(
    (group) => group.docs.length > 0,
  ),
);

/** 해당하지 않는 것. 지우지 않고 접어 두기만 한다. 어느 묶음에 있던 건지 같이 적는다. */
const skipped = computed(() =>
  GROUPS.flatMap((group) =>
    group.docs.filter((doc) => !applies(doc)).map((doc) => ({ group: group.title, doc })),
  ),
);

onMounted(async () => {
  situation.value = await loadDocSituation(planId);
  unfiltered.value = situation.value === null;
  pending.value = false;
});

/**
 * 여기는 서류 화면과 대출 신청 화면 양쪽에서 들어온다. 어느 쪽으로 들어왔든
 * 온 자리로 돌려보낸다 — 주소로 바로 들어왔을 때만 서류 화면으로 보낸다.
 */
const back = () => {
  if (window.history.length > 1) router.back();
  else navigateTo(`/contract/${planId}/docs`);
};
</script>

<template>
  <GuideFrame title="서류별 발급 방법" @back="back">
    <AppCard class="flex flex-col gap-2">
      <p class="text-body3 text-ink-hero font-semibold">발급 방법은 세 가지예요</p>
      <div
        v-for="way in HOW"
        :key="way.label"
        class="bg-surface-info rounded-chip flex flex-col gap-0.5 px-3 py-2.5"
      >
        <span class="text-caption2 text-primary-strong font-semibold">{{ way.label }}</span>
        <span class="text-micro text-ink-hero-body">{{ way.text }}</span>
      </div>
      <p class="text-micro text-ink-muted">
        무인발급기는 지하철역 · 주민센터 입구 · 구청 · 대형마트 · 일부 은행. 정부24 "무인민원발급기
        안내"로 찾을 수 있어요
      </p>
    </AppCard>

    <p v-if="pending" class="text-label2 text-ink-muted px-1">내 상황에 맞춰 고르는 중이에요…</p>

    <template v-else>
      <p v-if="unfiltered" class="bg-badge-warning rounded-field text-caption2 text-ink-hero p-3.5">
        계약 정보를 불러오지 못해서 전체 목록을 그대로 보여드려요. 해당하지 않는 서류가 섞여 있을 수
        있어요.
      </p>

      <template v-for="group in myGroups" :key="group.title">
        <h2 class="text-option text-ink-hero px-1 pt-2">{{ group.title }}</h2>

        <AppCard class="flex flex-col p-2.5">
          <button
            v-for="doc in group.docs"
            :key="doc.code"
            type="button"
            class="border-line-soft flex items-center gap-2 border-b p-2.5 text-left last:border-b-0"
            @click="openDoc = doc"
          >
            <span class="text-label2 text-ink-hero flex-1 font-medium">{{ doc.name }}</span>
            <span
              v-if="doc.badge"
              class="bg-surface-info rounded-chip text-micro text-primary-deep shrink-0 px-1.5 py-0.5 font-semibold"
            >
              {{ doc.badge }}
            </span>
            <AppIcon name="chevron-right" class="text-ink-muted size-4 shrink-0" />
          </button>
        </AppCard>
      </template>

      <!-- 지우지 않고 접어 둔다. 앱이 상황을 잘못 짚었어도 여기서 찾을 수 있어야 한다. -->
      <template v-if="skipped.length">
        <button
          type="button"
          class="bg-surface border-line rounded-field mt-2 flex items-center gap-2 border px-3.5 py-3 text-left"
          :aria-expanded="skippedOpen"
          @click="skippedOpen = !skippedOpen"
        >
          <span class="text-label2 text-ink-hero-body flex-1">
            내 상황에는 해당하지 않는 서류 {{ skipped.length }}개
          </span>
          <AppIcon
            name="chevron-right"
            class="text-ink-muted size-4 shrink-0 transition-transform"
            :class="skippedOpen && 'rotate-90'"
          />
        </button>

        <AppCard v-if="skippedOpen" class="flex flex-col p-2.5">
          <button
            v-for="item in skipped"
            :key="item.doc.code"
            type="button"
            class="border-line-soft flex items-start gap-2 border-b p-2.5 text-left last:border-b-0"
            @click="openDoc = item.doc"
          >
            <span class="flex flex-1 flex-col gap-0.5">
              <span class="text-label2 text-ink-hero-body">{{ item.doc.name }}</span>
              <span class="text-micro text-ink-muted">
                {{ item.group }} · {{ item.doc.whyNot }}
              </span>
            </span>
            <AppIcon name="chevron-right" class="text-ink-muted mt-0.5 size-4 shrink-0" />
          </button>
        </AppCard>

        <p class="text-micro text-ink-muted px-1">
          계약·진단에 적어 둔 값으로 갈랐어요. 필요한 서류가 여기 들어가 있으면 그대로 열어서 발급
          방법을 볼 수 있어요.
        </p>
      </template>
    </template>

    <DimOverlay v-if="openDoc" @close="openDoc = null">
      <div class="flex max-h-[70dvh] flex-col gap-3 overflow-y-auto">
        <div class="flex items-start gap-2">
          <h2 class="text-headline2 text-ink-hero flex-1">{{ openDoc.name }}</h2>
          <span
            v-if="openDoc.badge"
            class="bg-surface-info rounded-chip text-micro text-primary-deep shrink-0 px-1.5 py-0.5 font-semibold"
          >
            {{ openDoc.badge }}
          </span>
          <button
            type="button"
            class="text-ink-muted text-caption2 shrink-0 p-1"
            aria-label="닫기"
            @click="openDoc = null"
          >
            닫기
          </button>
        </div>

        <p
          v-if="!applies(openDoc)"
          class="bg-surface-brand rounded-field text-caption2 text-ink-hero-body p-3.5"
        >
          내 상황에는 해당하지 않는 서류예요 — {{ openDoc.whyNot }}
        </p>

        <AppCard class="flex flex-col gap-2">
          <div
            v-for="way in openDoc.ways"
            :key="way.label"
            class="bg-surface-info rounded-chip flex flex-col gap-0.5 px-3 py-2.5"
          >
            <span class="text-caption2 text-primary-strong font-semibold">{{ way.label }}</span>
            <span class="text-micro text-ink-hero-body">{{ way.text }}</span>
          </div>
        </AppCard>

        <div
          v-if="openDoc.options"
          class="bg-surface-brand rounded-field flex flex-col gap-1 p-3.5"
        >
          <p class="text-caption1 text-ink-hero">설정 · 옵션</p>
          <p
            v-for="option in openDoc.options"
            :key="option"
            class="text-caption2 text-ink-hero-body"
          >
            ☐ {{ option }}
          </p>
        </div>

        <p
          v-if="openDoc.tip"
          class="rounded-field text-caption2 p-3.5"
          :class="
            openDoc.tipTone === 'warn'
              ? 'bg-badge-warning text-ink-hero'
              : 'bg-surface-info text-ink-hero-body'
          "
        >
          {{ openDoc.tipTone === 'warn' ? '⚠️' : '💡' }} {{ openDoc.tip }}
        </p>

        <AppButton variant="strong" @click="openDoc = null">확인</AppButton>
      </div>
    </DimOverlay>

    <template #cta>
      <AppButton variant="strong" @click="back">돌아가기</AppButton>
    </template>
  </GuideFrame>
</template>
