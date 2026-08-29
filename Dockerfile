# Nuxt 는 SSR 이라 정적 파일만 올려서는 돌지 않는다. Node 런타임이 필요하다.
FROM node:24-alpine AS build
WORKDIR /app

RUN corepack enable
# 의존성만 먼저 받아 레이어로 굳힌다. 소스만 바뀐 빌드는 이 레이어를 재사용한다.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .
RUN pnpm build

# nuxt build 의 결과물 .output 은 자기 의존성을 전부 품고 있다.
# 그래서 런타임 이미지에 node_modules 를 다시 넣을 필요가 없다.
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup -S nuxt && adduser -S -G nuxt -u 10001 nuxt
COPY --from=build --chown=nuxt:nuxt /app/.output ./.output

USER nuxt
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
