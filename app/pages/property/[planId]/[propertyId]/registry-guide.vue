<script setup lang="ts">
/**
 * 2-2b 코치 타임 — 등기부등본이란.
 *
 * 발급 안내에서 셋의 이름만 보고 넘어가면 정작 뭘 봐야 하는지 모른다.
 * 여기서 표제부·갑구·을구가 각각 무엇인지 푼다. 읽기만 하는 화면이다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
const propertyId = Number(route.params.propertyId);

interface Part {
  title: string;
  bullets: string[];
}

const PARTS: Part[] = [
  {
    title: '① 표제부 — 집의 기본 정보 (소재지, 면적, 구조, 용도)',
    bullets: [
      '계약서에 적힌 주소와 표제부의 주소가 정확히 일치하는지',
      '집합건물은 동호수까지 확인',
      "건축물의 용도가 '주거용'인지. 근린생활시설 같은 비주거용이면 전세자금대출 X",
      '대지권이 등기되어 있는지. 없으면 경매 시 회수액이 줄어들어요',
    ],
  },
  {
    title: "② 갑구 — '소유권', 집의 주인이 누구인지",
    bullets: [
      '가장 아래에 적힌 소유주가 현재 집주인이에요',
      '이 사람이 나와 계약하는 사람과 같은 사람인지 신분증으로 대조해야 해요',
      '가압류, 가처분, 압류, 경매, 신탁 확인',
      '임차권등기도 확인 — 이전 임차인이 보증금을 못 돌려받아 남긴 기록이에요',
      '소유권 이전이 최근에 잦았는지도 봐요. 무자본 갭투자일 수 있어요',
    ],
  },
  {
    title: "③ 을구 — '소유권 외의 권리사항', 근저당 확인",
    bullets: [
      '집주인이 이 집을 담보로 은행에서 빌린 돈',
      '근저당권 설정, 채권최고액 확인 (실제 빌린 돈의 110~130%로 잡혀 있어요)',
      '근저당 설정일도 확인하세요. 소액임차인 최우선변제 판정 기준이 이 날짜예요',
      '선순위 근저당이 과하면 전세대출과 보증보험 가입 자체가 안 될 수 있어요',
      '을구는 기재된 순서대로 권리 순서가 결정돼요. 경매로 넘어갔을 때 나보다 선순위 채권자가 있으면 내 몫이 없을 수도 있어요',
    ],
  },
];
</script>

<template>
  <PhoneFrame>
    <StageBar
      title="등기부등본이란?"
      base="2루"
      @back="navigateTo(`/property/${planId}/${propertyId}/registry`)"
    />

    <div class="px-gutter-tight flex flex-1 flex-col gap-4 pt-5 pb-6">
      <div class="bg-surface-info rounded-field flex flex-col gap-1.5 p-3.5 text-center">
        <p class="text-caption1 text-primary-strong">코치 팁</p>
        <p class="text-body2 text-ink-hero font-bold">등기부등본(등기사항 전부증명서)이란?</p>
        <p class="text-caption2 text-ink-hero-body">부동산의 권리관계가 담긴 장부예요</p>
      </div>

      <h2 class="text-body2 text-ink-hero font-semibold">등기부등본에서 확인해야 하는 것</h2>

      <AppCard v-for="part in PARTS" :key="part.title" class="flex flex-col gap-2.5">
        <p class="text-body3 text-ink-hero font-bold">{{ part.title }}</p>
        <div class="flex flex-col gap-1.5">
          <p
            v-for="bullet in part.bullets"
            :key="bullet"
            class="text-label2 text-ink-hero-body flex gap-1.5"
          >
            <span aria-hidden="true">•</span>
            <span class="flex-1">{{ bullet }}</span>
          </p>
        </div>
      </AppCard>
    </div>

    <footer class="px-gutter-tight flex shrink-0 pt-2.5 pb-cta-pad">
      <AppButton
        variant="strong"
        @click="navigateTo(`/property/${planId}/${propertyId}/registry-cautions`)"
      >
        다음 — 주의사항 보기
      </AppButton>
    </footer>
  </PhoneFrame>
</template>
