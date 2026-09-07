<script setup lang="ts">
import { useInstallPrompt } from '~/composables/useInstallPrompt';

/**
 * 홈 화면에 추가 안내.
 *
 * 첫 화면에서 바로 묻지 않는다 — 대부분 거절한다. 계획이 생겨 돌아올 이유가
 * 있는 사람에게만 보인다.
 *
 * iOS 는 브라우저가 대신 물어봐 주지 않는다. 공유 버튼을 눌러 직접 추가하는
 * 길밖에 없어서, 그 순서를 글로 적어 준다.
 *
 * 한 번 닫으면 다시 묻지 않는다. 필요하면 사용자가 브라우저 메뉴에서 한다.
 */
const { shouldOffer, isIos, install, dismiss } = useInstallPrompt();
</script>

<template>
  <div v-if="shouldOffer" class="bg-surface-info rounded-card flex flex-col gap-3 p-4">
    <div class="flex items-center gap-2">
      <AppIcon name="home" class="text-primary-strong size-5 shrink-0" />
      <p class="text-headline2 text-ink flex-1">홈 화면에 추가해두면</p>
    </div>

    <div class="flex flex-col gap-1">
      <p class="text-label2 text-ink-body">· 주소창 없이 앱처럼 열려요</p>
      <p class="text-label2 text-ink-body">· 인터넷이 끊겨도 화면은 열려요</p>
    </div>

    <!--
      iOS 는 설치 이벤트가 없다. 버튼을 만들어 둬도 누를 것이 없어서 순서만
      적어 준다.
    -->
    <div v-if="isIos" class="bg-surface rounded-cta flex flex-col gap-1.5 px-3 py-2.5">
      <span class="flex items-center gap-1.5">
        <AppIcon name="share" class="text-primary-strong size-4 shrink-0" />
        <span class="text-caption-tight text-ink font-semibold"> 아래 공유 버튼을 누르고 </span>
      </span>
      <span class="text-caption-tight text-ink-hero-body font-normal">
        "홈 화면에 추가" 를 고르면 끝이에요
      </span>
    </div>

    <!--
      iOS 는 누를 것이 없다. 버튼 둘을 두면 둘 다 닫기만 하는 꼴이라 하나로 둔다.
    -->
    <div class="flex gap-2">
      <template v-if="isIos">
        <AppButton variant="white" @click="dismiss">알겠어요</AppButton>
      </template>
      <template v-else>
        <AppButton variant="white" @click="dismiss">다음에</AppButton>
        <AppButton @click="install">추가하기</AppButton>
      </template>
    </div>
  </div>
</template>
