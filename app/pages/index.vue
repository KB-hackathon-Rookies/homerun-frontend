<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

// 브라우저 탭 제목.
useHead({ title: '홈런' });

/**
 * AU-01 스플래시.
 *
 * 잠깐 보여주고 웰컴으로 넘어간다. 이미 로그인해 둔 사람은 여기서 멈출 이유가 없다.
 */
const DURATION_MS = 1600;

const auth = useAuthStore();

/**
 * 로그인해 둔 사람은 홈으로 보낸다.
 *
 * 계획이 있는지 여기서 묻지 않는다. 홈이 `/plans/active` 로 서버에서 계획을 되살리고,
 * 정말 없을 때만 시작하기를 안내한다. 스플래시에서 한 번 더 물으면 같은 조회가 두 번
 * 나가고, 조회가 잠깐 실패하면 계획이 있는 사람도 온보딩으로 밀려 계획이 새로 만들어진다.
 */
const destination = () => (auth.isAuthenticated ? '/home' : '/welcome');

onMounted(() => {
  auth.restore();

  const timer = setTimeout(async () => {
    await navigateTo(destination(), { replace: true });
  }, DURATION_MS);

  onUnmounted(() => clearTimeout(timer));
});
</script>

<template>
  <PhoneFrame>
    <div class="pt-statusbar shrink-0" />

    <!--
      화면 정의서 AU-01 (Figma 104:1652).

      시안은 브랜드·제목·부제를 절대좌표로 놓고 그 아래 일러스트를 깔았다. 좌표를 그대로 옮기지
      않고 흐름으로 쌓는다 — 글자가 한 줄 늘어도 겹치지 않는다.

      일러스트는 853×1844 원본을 390×400 상자에 object-cover 로 넣는다. 시안의 비율이 그것이라
      이미지를 미리 자르지 않는다. 자르는 일은 CSS 가 한다.
    -->
    <div class="flex flex-1 flex-col overflow-clip">
      <div class="px-gutter flex flex-col pt-7">
        <BrandMark tilted />

        <h1 class="text-title1 text-ink-strong mt-3.5 whitespace-pre-line">
          {{ '첫 독립,\n홈런이\n함께할게요' }}
        </h1>

        <p class="text-ink-placeholder mt-4 text-xl leading-tight font-bold whitespace-pre-line">
          {{ '청년의 첫 독립을 위한\n맞춤 자립 코치, 홈런' }}
        </p>
      </div>

      <!--
        이미지 비율(780×800)을 컨테이너 비율(39/40)에 맞춰 두었다. 전에는 780×1686 을
        실어 놓고 object-cover 로 세로 886px 을 잘라 버렸다 — 화면에 나오지도 않는 절반을
        내려받은 셈이라 크기가 155KB 였다. 잘려 나가던 만큼을 잘라 78KB 가 됐고 보이는
        그림은 같다. object-cover 는 비율이 어긋날 때를 위해 남겨 둔다.
      -->
      <div class="relative mt-4 aspect-[39/40] w-full shrink-0">
        <img
          src="/illust/intro.jpg"
          alt=""
          width="780"
          height="800"
          class="absolute inset-0 size-full object-cover"
        />
      </div>
    </div>

    <footer class="flex shrink-0 items-center justify-center pb-8">
      <p class="text-caption1 text-ink-subtle">첫 독립을 위한 준비</p>
    </footer>
  </PhoneFrame>
</template>
