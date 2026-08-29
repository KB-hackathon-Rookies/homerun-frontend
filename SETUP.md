# 개발 환경 세팅

## 필요한 것

| | 버전 | 비고 |
|---|---|---|
| Node.js | 22.19+ 또는 24.11+ | Nuxt 4.5 요구사항 |
| pnpm | 11.x | `corepack enable` 하면 자동으로 맞춰진다 |

pnpm 을 따로 설치할 필요는 없다. `package.json` 의 `packageManager` 필드에 버전이
박혀 있어서, corepack 이 그 버전을 알아서 받아 쓴다.

```bash
corepack enable
```

## 1. 클론과 환경변수

```bash
git clone https://github.com/KB-hackathon-Rookies/homerun-frontend.git
cd homerun-frontend
cp .env.example .env
```

`.env` 의 `NUXT_PUBLIC_API_BASE` 는 백엔드 주소다. 로컬에서 homerun-backend 를 띄웠다면
기본값(`http://localhost:8080`) 그대로 두면 된다.

## 2. 설치

```bash
pnpm install
```

`postinstall` 이 `nuxt prepare` 를 돌려 `.nuxt/` 에 타입과 ESLint 설정을 만든다.
`prepare` 는 husky 훅을 건다. 그래서 **클론 직후 `pnpm install` 을 한 번은 해야**
타입도 잡히고 커밋 검사도 걸린다.

설치되는 훅:

| 훅 | 하는 일 | 걸리는 시간 |
|---|---|---|
| pre-commit | `pnpm lint` | 몇 초 |
| commit-msg | commitlint — 커밋 메시지 형식 | 즉시 |
| pre-push | `pnpm lint && pnpm typecheck` | 수십 초 |

## 3. 실행

```bash
pnpm dev
```

http://localhost:3000 . 저장하면 바로 반영된다(HMR).

프로덕션 빌드를 확인하려면:

```bash
pnpm build && pnpm preview
```

## 4. 컨테이너로 띄우기

```bash
docker build -t homerun-frontend:local .
docker run --rm -p 3000:3000 homerun-frontend:local
```

`nuxt build` 결과물인 `.output` 은 자기 의존성을 전부 품고 있어서, 런타임 이미지에
`node_modules` 를 다시 넣지 않는다. 그래서 이미지가 작다.

## 자주 막히는 곳

**`eslint.config.mjs` 에서 `./.nuxt/eslint.config.mjs` 를 못 찾는다**
`pnpm install` 을 안 했거나 `.nuxt` 를 지운 상태다. `pnpm install` 또는 `pnpm exec nuxt prepare`.

**타입이 안 잡히고 자동완성이 죽는다**
같은 원인이다. `.nuxt/` 가 있어야 한다. `tsconfig.json` 은 `.nuxt` 안의 설정을 참조만 한다.

**pre-commit 에서 lint 에 걸림**
```bash
pnpm lint:fix && git add -A
```

**커밋 메시지가 commitlint 에 걸림**
형식은 `<이모지> <타입>: <내용>` 이고 콜론 뒤 공백이 필요하다. 예: `✨ Feat: 로그인 화면`.
타입 목록은 `commitlint.config.js` 에 있다. `pnpm commit` 으로 고르는 게 안전하다.

**포트 충돌**
```bash
pnpm dev --port 3001
```

**Tailwind 클래스가 안 먹는다**
`app/assets/css/main.css` 가 `nuxt.config.ts` 의 `css` 배열에 들어 있는지, 그리고
`@tailwindcss/vite` 플러그인이 `vite.plugins` 에 있는지 확인한다. 둘 다 있어야 한다.
Tailwind v4 에는 `tailwind.config.js` 가 없으므로 그 파일을 찾지 말 것.
