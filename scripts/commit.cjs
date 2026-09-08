const { spawnSync } = require('node:child_process');
const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');

// 백엔드 scripts/commit.js 와 같은 목록이다. commitlint 의 type-enum 이 단일 출처이므로
// 거기에 없는 타입을 여기에 넣으면 훅에서 걸린다.
const commitTypes = [
  '✨ Feat',
  '📦 Chore',
  '💄 Design',
  '🚨 Fix',
  '🎨 Style',
  '⚡ Perf',
  '🔥 Remove',
  '🚀 Release',
  '🎉 Init',
  '✅ Test',
  '🔒 Security',
  '♻ Refactor',
  '🔨 Modify',
  '🚚 Rename',
  '📝 Docs',
  '➖ Remove',
  '🔖 Release',
  '🧪 Test',
  '🚑 Hotfix',
];

function hasStagedChanges() {
  const result = spawnSync('git', ['diff', '--cached', '--quiet']);
  if (result.error) throw new Error('Git 저장소에서 실행해주세요.');
  return result.status === 1;
}

async function main() {
  if (!hasStagedChanges()) {
    console.error('스테이징된 변경 사항이 없습니다.');
    process.exitCode = 1;
    return;
  }
  const rl = readline.createInterface({ input, output });
  try {
    output.write(`${commitTypes.map((type, index) => `  ${index + 1}. ${type}`).join('\n')}\n`);
    const selected = Number.parseInt(await rl.question('번호: '), 10) - 1;
    if (!commitTypes[selected]) throw new Error('올바른 번호를 입력해주세요.');
    const subject = (await rl.question('커밋 제목: ')).trim();
    if (!subject) throw new Error('커밋 제목은 비워둘 수 없습니다.');
    const body = (await rl.question('상세 설명 (선택): ')).trim();
    const args = ['commit', '-m', `${commitTypes[selected]}: ${subject}`];
    if (body) args.push('-m', body);
    process.exitCode = spawnSync('git', args, { stdio: 'inherit' }).status ?? 1;
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
