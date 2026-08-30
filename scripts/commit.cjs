// 백엔드(homerun-backend)와 같은 규칙이다.
// 한쪽을 수정하면 다른 쪽도 동일하게 수정할 것.
// 이 프로젝트는 ESM이므로 module.exports 대신 export default를 사용한다.

export default {
  extends: ['@commitlint/config-conventional'],

  parserPreset: {
    parserOpts: {
      headerPattern: /^(?<type>.+):\s+(?<subject>.+)$/,
      headerCorrespondence: ['type', 'subject'],
    },
  },

  rules: {
    'type-enum': [
      2,
      'always',
      ['✨ feat', '🚨 fix', '♻️ refactor', '⚡ perf', '✅ test', '📝 docs', '📦 chore'],
    ],

    'type-empty': [2, 'never'],
    'type-case': [0],

    'subject-empty': [2, 'never'],
    'subject-case': [0],
    'subject-full-stop': [2, 'never', '.'],
  },
};
