# homerun-frontend

Nuxt 4 / Vue 3 / TypeScript / Tailwind CSS 4 기반 프론트엔드. 패키지 매니저는 pnpm.

## 빠르게 시작하기

```bash
corepack enable            # pnpm 준비 (한 번만)
cp .env.example .env
pnpm install
pnpm dev                   # http://localhost:3000
```

자세한 건 [SETUP.md](SETUP.md).

## 자주 쓰는 명령

| 명령 | 하는 일 |
|---|---|
| `pnpm dev` | 개발 서버 (HMR) |
| `pnpm verify` | lint + 타입체크 + 빌드. CI 가 도는 것과 같다 |
| `pnpm lint:fix` | lint 에 걸렸을 때 고치는 명령 |
| `pnpm typecheck` | 타입만 확인 |
| `pnpm build` → `pnpm preview` | 프로덕션 빌드를 로컬에서 확인 |
| `pnpm commit` | 커밋 타입을 골라서 컨벤션에 맞는 메시지로 커밋 |

## 구조

```
app/
  app.vue                  진입점 (지우고 여기서부터 시작)
  assets/css/main.css      Tailwind 진입 CSS
public/                    그대로 서빙되는 정적 파일
nuxt.config.ts             Tailwind Vite 플러그인, ESLint 모듈, runtimeConfig
eslint.config.mjs          .nuxt 가 만들어 준 설정을 감싼다
Dockerfile                 SSR 런타임 이미지
```

## 규칙

- **Tailwind v4 는 설정 파일이 없다.** `tailwind.config.js` 도 PostCSS 설정도 만들지 않는다.
  Vite 플러그인 하나와 `app/assets/css/main.css` 의 `@import "tailwindcss"` 가 전부다.
  테마를 바꾸려면 그 CSS 안에서 `@theme` 을 쓴다.
- **백엔드 주소는 하드코딩하지 않는다.** `useRuntimeConfig().public.apiBase` 를 쓰고,
  값은 `.env` 의 `NUXT_PUBLIC_API_BASE` 로 넣는다.
- **커밋 메시지는 commitlint 가 검사한다.** 백엔드와 같은 규칙이다: `✨ Feat: 내용`.
  `pnpm commit` 이 편하다.
- **lint 는 커밋할 때 걸린다.** 어긋나면 `pnpm lint:fix`.

## 브랜치와 CI

- 기능 브랜치 → `dev` PR → 리뷰 후 머지. 백엔드와 같다.
- `main`, `dev` push 와 모든 PR 에서 CI 가 lint · 타입체크 · 빌드를 돌린다.
- 배포 파이프라인은 아직 없다. 백엔드와 같은 이유로 배포 대상이 정해지지 않았다.
  `Dockerfile` 은 준비돼 있으니 대상이 정해지면 CD 만 붙이면 된다.
