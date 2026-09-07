# SSR 을 끄면서 Node 런타임이 필요 없어졌다. 정적 파일만 서빙한다.
FROM node:24-alpine AS build
WORKDIR /app

RUN corepack enable
# 의존성만 먼저 받아 레이어로 굳힌다. 소스만 바뀐 빌드는 이 레이어를 재사용한다.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .
# generate 는 앱 셸(index.html)과 자산을 .output/public 에 떨군다.
RUN pnpm generate

FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/.output/public /usr/share/nginx/html

EXPOSE 3000
