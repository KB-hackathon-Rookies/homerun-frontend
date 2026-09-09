<script setup lang="ts">
/**
 * `FAB/코치`.
 *
 * 시안이 여정 화면 66곳에 같은 자리로 띄우는 동그란 버튼이다. 52 원, 흰 바탕,
 * 브랜드 파랑 테두리 2, 파랑이 번지는 그림자. 오른쪽 16, 아래 92 — 92 는 탭바
 * (74)와 하단 CTA(58+여백) 위로 손가락이 닿을 자리를 남긴 값이다.
 *
 * ## 왜 뷰포트를 덮는 껍데기를 한 겹 두는가
 *
 * `fixed` 는 뷰포트를 기준으로 붙는다. 그런데 화면은 `PhoneFrame` 이 390 폭으로
 * 가운데 세운 것이라, 그냥 `fixed right-4` 로 두면 넓은 창에서 버튼만 프레임
 * 바깥 오른쪽 끝으로 떨어져 나간다.
 *
 * 그래서 뷰포트를 덮는 껍데기를 두고 그 안에서 프레임과 같은 폭으로 다시 가운데를
 * 잡는다. 껍데기는 클릭을 통과시키고(`pointer-events-none`) 버튼만 받는다 —
 * 안 그러면 보이지 않는 판이 화면 전체를 덮어 아무것도 눌리지 않는다.
 *
 * 본문 흐름 안의 `sticky` 로 두지 않는 이유는, 시안의 이 버튼이 자리를 차지하지
 * 않고 내용 위에 떠 있기 때문이다. 흐름에 두면 스크롤 끝에서 빈 줄이 생긴다.
 *
 * ## 캐릭터
 *
 * 시안이 원 안에 넣는 호랑이가 AI 코치 백호다(`Tiger/기본`, 44). 버튼에 `aria-label`
 * 이 있으므로 이미지는 장식으로 둔다 — 둘 다 읽히면 스크린리더가 같은 말을 두 번 한다.
 */
defineProps<{
  /** 이전·다음과 안내문이 있는 고정 푸터를 넘겨 띄운다. */
  aboveFooter?: boolean | 'compact';
}>();

defineEmits<{ open: [] }>();
</script>

<template>
  <div class="pointer-events-none fixed inset-0 z-30 flex justify-center">
    <div class="max-w-screen relative w-full">
      <button
        type="button"
        aria-label="코치에게 물어보기"
        class="bg-surface border-primary-strong shadow-fab rounded-pill size-fab-coach right-gutter-tight pointer-events-auto absolute flex items-center justify-center border-2 transition-colors outline-none active:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus"
        :class="
          aboveFooter === 'compact'
            ? 'bottom-fab-footer-compact'
            : aboveFooter
              ? 'bottom-fab-footer-lift'
              : 'bottom-fab-lift'
        "
        @click="$emit('open')"
      >
        <img src="/tiger/face-default.webp" alt="" class="size-11 rounded-full object-cover" />
      </button>
    </div>
  </div>
</template>
