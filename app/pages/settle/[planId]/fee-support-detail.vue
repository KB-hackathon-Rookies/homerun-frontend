<script setup lang="ts">
import {
  FEE_SUPPORT_APPLY_ROUTES,
  FEE_SUPPORT_DOCS_AGREED,
  FEE_SUPPORT_DOCS_REFUSED,
  FEE_SUPPORT_EXCLUDED,
  FEE_SUPPORT_TIERS,
} from '~/components/settle/guarantee';

/**
 * 홈 4-2 상세 · 보증료 지원 신청.
 *
 * 금액이 왜 그렇게 나오는지, 서류가 왜 둘이었다가 아홉이 되는지, 그리고
 * 아무리 자격이 돼도 못 받는 경우가 무엇인지.
 *
 * 청년 연령 기준은 지자체 조례가 정한다 — 서울과 경기가 다르다. 하나로
 * 단정하지 않고 둘 다 적어 둔다.
 */
definePageMeta({ middleware: 'auth' });

const route = useRoute();
const planId = Number(route.params.planId);
</script>

<template>
  <GuideFrame title="보증료 지원 상세" @back="navigateTo(`/settle/${planId}/fee-support`)">
    <h2 class="text-section text-ink-hero px-1 pt-2">지원 금액 · 청년만 전액</h2>

    <AppCard class="flex flex-col gap-0 p-2.5">
      <div
        v-for="(tier, index) in FEE_SUPPORT_TIERS"
        :key="tier.badge"
        class="flex items-center gap-2.5 px-2.5 py-3"
        :class="index ? 'border-line-soft border-t' : ''"
      >
        <StatusBadge :tone="tier.tone" fill="soft">{{ tier.badge }}</StatusBadge>
        <span class="flex flex-1 flex-col gap-0.5">
          <span class="text-caption-tight text-ink-hero font-semibold">{{ tier.headline }}</span>
          <span class="text-step text-ink-meta font-normal">{{ tier.note }}</span>
        </span>
      </div>
    </AppCard>

    <div class="bg-surface-info rounded-field flex flex-col gap-1 px-3.5 py-3">
      <p class="text-caption-tight text-primary-strong font-semibold">
        가입 시점에 따라 한도가 달라요
      </p>
      <p class="text-caption-tight text-ink-hero font-normal">
        • 2025. 3. 31. 이후 가입 · 최대 40만원
      </p>
      <p class="text-caption-tight text-ink-hero font-normal">
        • 2025. 3. 30. 이전 가입 · 최대 30만원
      </p>
    </div>

    <AppCard class="flex flex-col gap-1.5">
      <p class="text-row text-ink-hero">청년 연령은 지자체별로 달라요</p>
      <p class="text-caption-tight text-ink-hero font-normal">
        • 서울 · 1985. 4. 1. ~ 2006. 3. 31. 출생자
      </p>
      <p class="text-caption-tight text-ink-hero font-normal">• 경기 · 만 19~39세</p>
      <p class="text-step text-ink-meta font-normal">다른 지자체는 각 조례로 정해져 있어요.</p>
    </AppCard>

    <h2 class="text-section text-ink-hero px-1 pt-2">공통 조건</h2>

    <AppCard class="flex flex-col gap-1.5">
      <p class="text-caption-tight text-ink-hero font-normal">
        • 신청일 기준 유효한 반환보증 가입 (HUG · HF · SGI 모두 인정)
      </p>
      <p class="text-caption-tight text-ink-hero font-normal">• 보증료 납부 완료</p>
      <p class="text-caption-tight text-ink-hero font-normal">• 전세보증금 3억원 이하</p>
      <p class="text-caption-tight text-ink-hero font-normal">
        • 무주택 임차인 (본인·배우자, 분양권·입주권 포함)
      </p>
    </AppCard>

    <h2 class="text-section text-ink-hero px-1 pt-2">신청 경로 · 처리</h2>

    <AppCard class="flex flex-col gap-2">
      <p class="text-row text-ink-hero">신청 경로</p>
      <p
        v-for="line in FEE_SUPPORT_APPLY_ROUTES"
        :key="line"
        class="text-caption-tight text-ink-hero font-normal"
      >
        {{ line }}
      </p>

      <div class="bg-surface-info rounded-cta flex flex-col gap-1 px-3 py-2.5">
        <p class="text-caption-tight text-primary-strong font-semibold">처리 기간</p>
        <p class="text-caption-tight text-ink-hero font-normal">
          신청일부터 30일 이내 (연장 시 45일), 결과 통지 후 15일 이내 입금
        </p>
      </div>
    </AppCard>

    <h2 class="text-section text-ink-hero px-1 pt-2">필요 서류 · 동의 여부에 따라</h2>

    <AppCard class="flex flex-col gap-1.5">
      <div class="flex items-center gap-1.5">
        <StatusBadge tone="safe" fill="soft">동의함</StatusBadge>
        <span class="text-row text-ink-hero">서류 2개만</span>
      </div>
      <p
        v-for="line in FEE_SUPPORT_DOCS_AGREED"
        :key="line"
        class="text-caption-tight text-ink-hero font-normal"
      >
        {{ line }}
      </p>
    </AppCard>

    <AppCard class="flex flex-col gap-1.5">
      <div class="flex items-center gap-1.5">
        <StatusBadge tone="caution">동의 안 함</StatusBadge>
        <span class="text-row text-ink-hero">서류 9개 전부 다시</span>
      </div>
      <p
        v-for="line in FEE_SUPPORT_DOCS_REFUSED"
        :key="line"
        class="text-caption-tight text-ink-hero font-normal"
      >
        {{ line }}
      </p>

      <div class="bg-surface-caution rounded-cta flex flex-col gap-1 px-3 py-2.5">
        <p class="text-caption-tight text-caution-deep font-semibold">주의</p>
        <p class="text-caption-tight text-ink-hero font-normal">
          • 서류 유효기간 3개월 (대출용 1개월과 기준이 다름)
        </p>
        <p class="text-caption-tight text-ink-hero font-normal">
          • 등본은 "전체공개" 옵션이라 다시 떼야 할 수 있어요
        </p>
      </div>
    </AppCard>

    <h2 class="text-section text-ink-hero px-1 pt-2">이런 경우는 지원 못 받아요</h2>

    <div class="bg-surface border-danger-deep rounded-field flex flex-col gap-1.5 border p-3.5">
      <p class="text-row text-danger-deep">제외 대상</p>
      <p
        v-for="line in FEE_SUPPORT_EXCLUDED"
        :key="line"
        class="text-caption-tight text-ink-hero font-normal"
      >
        {{ line }}
      </p>

      <div class="bg-surface-info rounded-cta flex flex-col gap-1 px-3 py-2.5">
        <p class="text-caption-tight text-primary-strong font-semibold">
          등록임대사업자 주택이라면
        </p>
        <p class="text-caption-tight text-ink-hero font-normal">
          사업자에게 보증 가입 의무가 있어요. 임차인이 직접 가입했다면 임대인에게 보증료를 청구할 수
          있어요 (민간임대주택법 제49조 제7항 제3호).
        </p>
      </div>
    </div>

    <h2 class="text-section text-ink-hero px-1 pt-2">예산 소진 시 조기 마감</h2>

    <div class="bg-surface border-danger-deep rounded-field flex flex-col gap-1.5 border p-3.5">
      <p class="text-row text-danger-deep">지자체별 예산 · 선착순</p>
      <p class="text-caption-tight text-ink-hero font-normal">
        반환보증에 가입하자마자 바로 신청하세요. 늦으면 최대 40만원을 못 받아요.
      </p>
    </div>

    <template #cta>
      <AppButton variant="strong" @click="navigateTo(`/settle/${planId}/fee-support`)">
        화면으로 돌아가기
      </AppButton>
    </template>
  </GuideFrame>
</template>
