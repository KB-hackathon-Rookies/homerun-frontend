# HomeRun Frontend LLM Context

이 파일은 팀 루키즈 구성원이 Claude, Codex, Cursor, Gemini 등 LLM 도구로 **프론트엔드** 작업을 시작할 때 공통으로 읽히기 위한 기준 문서다.

백엔드 저장소(`homerun-backend`)에도 같은 이름의 문서가 있다. **도메인 규칙·기능ID·기준 수치는 그쪽이 단일 출처다.** 이 문서는 화면과 통신에 관한 것만 다룬다.

충돌할 때의 우선순위는 다음과 같다.

1. 사용자가 현재 작업에서 직접 전달한 지시
2. 실제 코드와 설정
3. `homerun-backend/LLM_CONTEXT.md` (도메인 규칙·기능ID)
4. 백엔드 API 실제 동작 (Swagger `http://localhost:8080/swagger-ui.html`)
5. 최신 `README.md`
6. 이 문서
7. Figma 및 Notion

충돌을 발견하면 임의로 판단해 숨기지 말고, 무엇이 어긋났고 어떤 기준을 따랐는지 사용자에게 알린다.

---

# 저장소

## 원격

- 프론트엔드 `https://github.com/KB-hackathon-Rookies/homerun-frontend`
- 백엔드 `https://github.com/KB-hackathon-Rookies/homerun-backend`

## 로컬 기준 경로

두 저장소를 **같은 상위 디렉터리에 나란히** 둔다.

```text
KB ITs Your Life 해커톤대회/
├─ homerun-backend/
└─ homerun-frontend/
```

**경로에 아포스트로피(`'`)를 넣지 않는다.** Nuxt 가 절대경로를 작은따옴표로 감싸 코드를 생성하기 때문에, 경로에 `'` 가 있으면 생성된 파일의 문자열이 끊겨 `typecheck` 와 `build` 가 모두 깨진다. 실제로 겪은 문제다.

## 현재 구현 상태

|               |                                                                      |
| ------------- | -------------------------------------------------------------------- |
| 화면          | 진입·인증 8개 — `app/pages/` (온보딩 4단계는 `onboarding.vue` 한 장) |
| 디자인 토큰   | `app/assets/css/main.css` — **색·크기 값은 여기에만 있다**           |
| 공통 컴포넌트 | `app/components/common/` 10개                                        |
| 화면 전용     | `app/components/onboarding/` 4개                                     |
| API           | `app/api/auth.ts` — **URL 은 여기에만 둔다**                         |
| 통신          | `app/plugins/api.ts` — axios 인스턴스와 인증 인터셉터                |
| 상태          | `app/stores/auth.ts`, `app/stores/signup.ts`                         |
| 라우트 가드   | `app/middleware/auth.ts`                                             |
| 타입          | `app/types/api.ts`, `app/utils/error.ts`                             |

백엔드는 컨트롤러 36개가 이미 구현돼 있다. **붙일 API 는 대부분 있다.**

---

# 기술 스택

버전은 `package.json` 이 단일 출처다. 여기에는 **알고 있어야 동작이 이해되는 것만** 둔다.

- **Nuxt 4** / Vue 3 / TypeScript strict
- 소스 디렉터리는 **`app/`** 이다 (`app/pages`, `app/components`, `app/stores`, `app/composables`)
- **Tailwind CSS 4** — PostCSS 설정도 `tailwind.config.js` 도 쓰지 않는다. Vite 플러그인 하나와 CSS 의 `@import "tailwindcss"` 가 전부다
- **Pinia** — `@pinia/nuxt` 가 `app/stores` 를 자동 임포트한다
- **axios** — `$api` 로 주입된다. 화면이나 스토어가 `axios` 를 직접 만들지 않는다
- 패키지 매니저는 **pnpm** 이다. npm 이 아니다

## SSR 을 껐다

`nuxt.config.ts` 에 `ssr: false` 다.

액세스 토큰이 `localStorage` 에 있어 **서버에서는 로그인 여부를 알 수 없다.** 그래서 인증 판단은 전부 클라이언트에서 하고(`import.meta.client`), 화면도 전부 `onMounted` 에서 데이터를 받는다. 서버가 그려 보낼 것이 "불러오는 중이에요…" 뿐이었다.

대신 모든 경로가 `index.html` 하나에서 시작한다. 그 파일 하나를 서비스워커에 구워 두면 오프라인에서도 앱이 뜬다 — PWA 가 여기 걸려 있다.

빌드 결과는 `.output/public` 이고 정적 서버가 서빙한다. 없는 경로는 전부 `index.html` 로 넘겨야 브라우저 라우터가 받는다(`nginx.conf`).

---

# 백엔드 연동

## 응답 봉투

성공 응답은 전부 이 형태로 감싸여 온다.

```ts
interface ApiResponse<T> {
  success: boolean;
  data: T; // 실제 값은 항상 여기
  timestamp: string;
}
```

`.result` 가 아니라 **`.data`** 다. 잘못 쓰면 `undefined` 가 되고, 화면에서는 "데이터 없음"으로 보인다.

## 인증

- **액세스 토큰** — `localStorage`. 요청 인터셉터가 자동으로 붙인다
- **리프레시 토큰** — **httpOnly 쿠키**(`refresh_token`). JS 가 읽을 수 없고, 읽으려 하지 않는다. `withCredentials: true` 로 브라우저가 알아서 싣는다

### 401 은 한 번만 갱신한다

화면 하나가 API 를 동시에 여러 개 부르면 만료된 토큰으로 401 이 여러 개 온다. 각자 갱신하면 갱신 요청이 그만큼 나가는데, **백엔드가 리프레시 토큰을 한 번 쓰면 폐기**하므로 뒤따르는 갱신이 전부 실패한다.

첫 요청만 갱신하고 나머지는 큐에서 기다린다. 이 로직을 우회하는 코드를 새로 만들지 않는다.

### 요청 플래그

```ts
$api.post('/api/v1/auth/login', body, { skipAuth: true, skipAuthRefresh: true });
```

- `skipAuth` — 액세스 토큰을 붙이지 않는다
- `skipAuthRefresh` — 401 을 받아도 갱신을 시도하지 않는다. **로그인·갱신 요청에 반드시 붙인다.** 없으면 로그인 실패(401)가 갱신을 부르고, 그것도 실패해서 무한히 돈다

## CORS

백엔드가 `app.cors.allowed-origins` 로 허용 origin 을 받는다. 로컬 기본값은 `http://localhost:3000` 이다. 포트를 바꾸면 백엔드 설정도 같이 바꿔야 한다.

---

# 작업 기준

## 판정은 백엔드가 한다

**화면에서 금액·자격·위험도를 다시 계산하지 않는다.** 같은 수치를 두 곳에서 계산하면 반드시 갈라지고, 사용자는 어느 쪽이 맞는지 알 수 없다.

백엔드가 판정과 근거(`factCode`)를 함께 내려준다. 화면은 그것을 보여 주기만 한다.

## 모르는 것을 아는 척하지 않는다

백엔드가 `UNKNOWN` · `provisional` · `null` 을 내려보내는 데는 이유가 있다. 근거가 없어서다.

- 값이 없다고 `0` 이나 `-` 로 채우지 않는다. 확인이 필요하다고 말한다
- `provisional` 이 붙은 수치는 바뀔 수 있다는 표시를 함께 보여 준다
- 만료·기한을 모르는 것을 "제한 없음"으로 보이게 두지 않는다

## 컴포넌트

- 신규 컴포넌트는 `<script setup lang="ts">` 를 기본으로 한다
- 공통 컴포넌트는 `app/components/common/` 에 둔다
- 화면 전용 컴포넌트는 그 화면 폴더 아래에 둔다

---

# Git 규칙

## 브랜치 흐름

```text
main
  └─ dev
      ├─ feat/#이슈번호-기능명
      ├─ fix/#이슈번호-버그명
      └─ chore/대상
```

- **기본 브랜치는 `dev` 다.**
- `dev` · `main` 직접 push 는 하지 않는다. `dev` 로 PR 을 낸다.

## 작업 하나마다 이슈와 브랜치

**순서를 지킨다 — 이슈 먼저, 그다음 브랜치, 그다음 코드.** 일을 끝내고 이슈를 사후에 파지 않는다.

한 브랜치에 여러 작업을 쌓지 않는다. 작업 중 다른 게 눈에 띄면 별도 이슈로 뺀다.

## 커밋 메시지

`pnpm commit` 으로 만든다. commitlint 가 검사한다.

```text
{이모지} {Type}: 한글 설명
```

**허용 type 은 `commitlint.config.js` 의 `type-enum` 이 단일 출처다.** 백엔드와 **같은 목록**이므로 한쪽을 고치면 다른 쪽도 같이 고친다.

- 제목 끝에 마침표를 찍지 않는다
- 한 커밋에는 하나의 논리적 변경 단위를 담는다

## Pull Request

`.github/pull_request_template.md` 를 채운다. **리뷰 요청 사항을 비워 두지 않는다** — 판단이 갈린 곳, 남이 봐 줘야 하는 곳을 적는다.

---

# 자동 검사

| 시점          | 실행                          | 걸렸을 때            |
| ------------- | ----------------------------- | -------------------- |
| `commit-msg`  | commitlint                    | 메시지 형식을 고친다 |
| `pre-commit`  | `pnpm lint:staged`            | `pnpm lint:fix`      |
| `pre-push`    | `pnpm lint && pnpm typecheck` | 원인별               |
| CI (`ci.yml`) | 위 + `pnpm build`             | 위와 같다            |

`pnpm verify` 가 셋을 한 번에 돌린다. **푸시 전에 이걸 돌리면 CI 도 통과한다.**

**CI 는 머지 결과를 검사한다.** 내 브랜치가 초록불이어도 `dev` 가 그 뒤에 움직였다면 그 초록불은 낡은 것이다. 머지 전에 리베이스하고 체크가 새로 돌아 초록불인지 보고 누른다.

---

# 코드를 쓸 때

- **응답 봉투는 `data`** — `.result` 가 아니다
- **리프레시 토큰은 httpOnly 쿠키** — JS 가 손대지 않는다
- **URL 은 `app/api/` 에만** — 스토어와 화면은 함수 이름만 안다
- **401 은 큐에 모아 한 번만 갱신한다** — 백엔드가 리프레시 토큰을 쓰고 폐기한다

## 화면을 만들 때

- **새 값이 나오면 토큰을 먼저 만든다.** 화면 코드에 hex·px·`[...]` 임의값을 쓰지 않는다
- 피그마 CSS 에는 Inter · Work Sans · Noto Sans KR 이 섞여 있다. 한글 글리프가 없어 폴백으로 떨어진 것이라 코드로 옮기지 않는다. **Work Sans 는 로고에만** 남긴다
- 피그마 레이어 이름이 `Label` · `Value` · `뱃지` 처럼 자리표시자인 곳이 있다. 그대로 쓰지 말고 실제 문구를 채운다
- 빌드가 통과해도 화면이 안 뜰 수 있다. 컴포넌트 이름이 안 잡히는 경우가 그랬다. **개발 서버로 실제 렌더를 본다**

### 정적 파일은 `public/` 아래 갈래로 나눈다

파일 이름에 갈래를 담지 않는다(`tiger-face_default.png` ✗ → `tiger/face-default.png` ✓).
평평하게 쌓으면 스무 개쯤에서 무엇이 무엇인지 알 수 없게 된다.

| 폴더      | 무엇이 들어가나                                                       |
| --------- | --------------------------------------------------------------------- |
| `pwa/`    | 설치 아이콘·애플 터치 아이콘. `nuxt.config.ts` 매니페스트가 가리킨다  |
| `brand/`  | 로고·마스코트 마크                                                    |
| `tiger/`  | 호랑이 일러스트                                                       |
| `illust/` | 그 밖의 그림·사진                                                     |
| 루트      | `favicon.ico` · `robots.txt` 만. 브라우저가 관례로 그 자리에서 찾는다 |

이름은 소문자에 하이픈만 쓴다. 밑줄은 쓰지 않는다.

---

# 링크

| 대상                   | 주소                                                  |
| ---------------------- | ----------------------------------------------------- |
| GitHub org             | `https://github.com/KB-hackathon-Rookies`             |
| 백엔드 Swagger         | `http://localhost:8080/swagger-ui.html`               |
| Figma — 1루·2루 재설계 | `https://www.figma.com/design/FQWFqiNDXkf6imyONZPrzb` |
| Figma — 팀 라이브러리  | `https://www.figma.com/design/NQpRVGehahYHxHRtWaU0of` |
