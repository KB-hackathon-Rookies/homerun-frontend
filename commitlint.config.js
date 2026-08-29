// 백엔드(homerun-backend)와 같은 규칙이다. 한쪽을 고치면 다른 쪽도 같이 고칠 것.
// 이 프로젝트는 ESM 이라 module.exports 가 아니라 export default 를 쓴다.
export default {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      headerPattern: /^(?<type>.+):\s+(?<subject>.+)$/,
      headerCorrespondence: ['type', 'subject']
    }
  },
  rules: {
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'type-case': [0],
    'subject-case': [0],
    'type-empty': [2, 'never'],
    'type-enum': [2, 'always', [
      '✨ Feat', ':sparkles: Feat',
      '📦 Chore', '📦️ Chore', ':package: Chore',
      '💄 Design', ':lipstick: Design',
      '🚨 Fix', ':rotating_light: Fix',
      '🎨 Style', ':art: Style',
      '⚡ Perf', ':zap: Perf',
      '🔥 Remove', ':fire: Remove', '➖ Remove', ':heavy_minus_sign: Remove',
      '🚀 Release', ':rocket: Release', '🔖 Release', ':bookmark: Release',
      '🎉 Init', ':tada: Init',
      '✅ Test', '🧪 Test', ':white_check_mark: Test', ':test_tube: Test',
      '🔒 Security', '🔐 Security', ':lock: Security', ':closed_lock_with_key: Security',
      '♻ Refactor', '♻️ Refactor', ':recycle: Refactor', '🔨 Modify', ':hammer: Modify',
      '🚚 Rename', ':truck: Rename',
      '📝 Docs', ':memo: Docs',
      '🚑 Hotfix', '🚑️ Hotfix', ':ambulance: Hotfix'
    ]]
  }
};
