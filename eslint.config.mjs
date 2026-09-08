// @nuxt/eslint 가 .nuxt/eslint.config.mjs 를 만들어 준다.
// 그래서 이 파일을 고치기 전에 pnpm install(→ nuxt prepare)이 한 번은 돌아야 한다.
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt({
  rules: {
    // Catch common correctness issues while keeping Nuxt defaults intact.
    eqeqeq: ['error', 'always'],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'prefer-const': 'error',

    // 서식은 prettier 가 정한다. prettier 는 void 요소를 `<input />` 로 닫는데
    // 이 규칙은 닫지 말라고 해서, 켜 두면 저장할 때마다 둘이 서로 되돌린다.
    'vue/html-self-closing': 'off',
  },
}).append({
  // CLI 스크립트는 표준출력이 곧 화면이다. 메뉴를 console.error 로 찍으면
  // stderr 로 새 나가서 파이프로 넘길 때 사라진다.
  files: ['scripts/**'],
  rules: { 'no-console': 'off' },
});
