<script setup lang="ts">
/**
 * OB-1 오픈뱅킹 안내.
 *
 * 무엇을 가져가는지 먼저 밝히고 동의를 받는다. 피그마의 `무엇을 보나요?` 카드가
 * 조회 · 계산 · 저장 안 함 세 줄로 되어 있다. 세 번째 줄이 핵심이다 — 상세 거래
 * 내역은 남기지 않는다는 말을 여기서 하지 않으면 어디서도 하지 않는다.
 *
 * 피그마의 `연결할 기관` 목록에는 은행 두 곳과 `직접 입력으로 진행` 이 나란히 있다.
 * 은행 이름은 옮기지 않는다 — 실제 연결은 금융결제원 인가 페이지에서 사용자가 고르는
 * 것이라, 화면에 박아 두면 우리가 미리 정해 둔 것처럼 보인다. 대신 연동을 원하지
 * 않는 사람이 나갈 길은 반드시 둔다.
 */
definePageMeta({ middleware: 'auth' });

interface Scope {
  /** 이 줄이 무엇에 대한 것인지. 피그마의 조회 · 계산 · 저장 안 함. */
  label: string;
  detail: string;
}

const SCOPES: Scope[] = [
  { label: '조회', detail: '은행별 예금·적금 잔액, 최근 3개월 입금 내역' },
  { label: '계산', detail: '순자산, 월 평균 소득(급여성 입금 기준)' },
  { label: '저장 안 함', detail: '상세 거래 내역은 저장하지 않아요' },
];
</script>

<template>
  <PhoneFrame>
    <div class="h-statusbar shrink-0" />
    <PageBar title="오픈뱅킹 연동" />

    <div class="px-gutter-tight flex flex-1 flex-col gap-5 py-6">
      <div class="flex flex-col gap-2">
        <h2 class="text-title2 text-ink-hero whitespace-pre-line">
          {{ '자산·소득을\n자동으로 채워드릴게요' }}
        </h2>
        <p class="text-body3 text-ink-hero-body">입력 시간이 3분 → 30초로 줄어들어요</p>
      </div>

      <AppCard class="flex flex-col gap-3">
        <span class="text-numeric text-ink-hero">무엇을 보나요?</span>
        <div v-for="scope in SCOPES" :key="scope.label" class="flex items-start gap-2.5">
          <span
            class="text-micro text-primary-strong bg-surface-info rounded-chip shrink-0 px-2 py-0.5"
          >
            {{ scope.label }}
          </span>
          <span class="text-caption2 text-ink-hero-body">{{ scope.detail }}</span>
        </div>
      </AppCard>

      <div class="bg-canvas rounded-field flex items-start gap-2 p-3.5">
        <AppIcon name="shield" class="text-ink-hero-body size-4 shrink-0" />
        <p class="text-micro text-ink-hero-body">
          오픈뱅킹은 금융결제원이 운영하는 안전한 서비스예요. 정보는 암호화되어 조회 목적으로만
          쓰고, 마이페이지에서 언제든 연결을 해제할 수 있어요.
        </p>
      </div>
    </div>

    <footer class="px-gutter-tight flex shrink-0 flex-col items-center gap-3 py-2.5">
      <AppButton variant="strong" @click="navigateTo('/openbanking/terms')">
        약관 동의하고 연결하기
      </AppButton>
      <!--
        연동하지 않고도 갈 길이 있어야 한다. 직접 입력해도 판정 정확도는 같고,
        연동 실패 화면(`progress.vue`)도 같은 곳으로 내보낸다.
      -->
      <button
        type="button"
        class="text-label2 text-ink-muted underline"
        @click="navigateTo('/home')"
      >
        연결 없이 직접 입력할게요
      </button>
    </footer>
  </PhoneFrame>
</template>
