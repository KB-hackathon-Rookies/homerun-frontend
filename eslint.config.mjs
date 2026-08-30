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
  },
});
