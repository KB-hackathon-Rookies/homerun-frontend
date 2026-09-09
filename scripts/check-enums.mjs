/**
 * 프론트의 문자열 리터럴 유니온이 서버 enum 과 어긋났는지 본다.
 *
 * 이 저장소는 API 타입을 손으로 적는다. 그래서 서버가 값을 하나 늘리면 화면은 모른 채
 * 지나가고, 그 값이 실제로 돌아오는 순간 비교와 분기가 조용히 어긋난다. 실제로 겪은 것 —
 * 서버 `DiagnosisInputStep` 에 있는 `REVIEW` 가 `DiagnosisStep` 에 없어서, `nextStep` 이
 * 타입에 없는 값을 담고 있었다.
 *
 * 응답 타입이 서버보다 **좁은 것 자체는 문제가 아니다.** 안 읽으면 그만이다. 위험한 것은
 * 그 좁은 타입으로 값을 비교하거나 분기할 때다. 그래서 이 스크립트는 고치라고 시키지 않고
 * **어디가 어긋났는지 보여주기만 한다.** 일부러 좁혀 둔 것은 아래 ALLOWED 에 이유와 함께 적는다.
 *
 * 쓰는 법: 백엔드를 띄운 뒤 `node scripts/check-enums.mjs`
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SPEC = process.env.API_DOCS ?? 'http://localhost:8080/v3/api-docs';
const API_DIR = 'app/api';

/** 일부러 좁혀 둔 유니온. 값을 다 적을 이유가 없는 것들이다. */
const ALLOWED = {
  // 우리가 "모름" 으로 보낼 수 있는 항목만 적는다. 요청에 쓰는 타입이라 좁아도 안전하다.
  PlanInputUnknownField: '화면이 실제로 모름 처리하는 항목만 보낸다',
};

const enumsOf = (node, out = []) => {
  if (Array.isArray(node)) node.forEach((v) => enumsOf(v, out));
  else if (node && typeof node === 'object') {
    if (Array.isArray(node.enum)) out.push(new Set(node.enum.map(String)));
    Object.values(node).forEach((v) => enumsOf(v, out));
  }
  return out;
};

const UNION = /export type (\w+)\s*=\s*((?:\s*(?:\/\/[^\n]*\n)?\s*\|?\s*'[A-Z0-9_]+')+)\s*;/g;

const spec = await fetch(SPEC).then((r) => {
  if (!r.ok) throw new Error(`${SPEC} → ${r.status}. 백엔드가 떠 있어야 한다.`);
  return r.json();
});
const serverEnums = enumsOf(spec.components?.schemas ?? {});

const findings = [];
for (const file of readdirSync(API_DIR).filter((f) => f.endsWith('.ts'))) {
  const source = readFileSync(join(API_DIR, file), 'utf8');
  for (const [, name, body] of source.matchAll(UNION)) {
    if (ALLOWED[name]) continue;
    const ours = new Set([...body.matchAll(/'([A-Z0-9_]+)'/g)].map((m) => m[1]));
    // 우리 값을 전부 품으면서 더 있는 서버 enum = 빠진 값이 있다는 뜻
    const supersets = serverEnums.filter(
      (e) => e.size > ours.size && [...ours].every((v) => e.has(v)),
    );
    if (!supersets.length) continue;
    const closest = supersets.reduce((a, b) => (a.size <= b.size ? a : b));
    findings.push({ file, name, missing: [...closest].filter((v) => !ours.has(v)).sort() });
  }
}

if (!findings.length) {
  console.log('어긋난 유니온 없음');
  process.exit(0);
}
for (const { file, name, missing } of findings) {
  console.log(`${file}: ${name} — 서버에 있고 여기 없는 값: ${missing.join(', ')}`);
}
console.log('\n좁혀 둔 것이 의도라면 scripts/check-enums.mjs 의 ALLOWED 에 이유와 함께 적는다.');
process.exit(1);
