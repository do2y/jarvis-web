# syntax=docker/dockerfile:1
# JARVIS 프론트엔드 컨테이너 이미지. Vite 빌드 결과물을 nginx로 서빙한다.

# --- build: vite 빌드 (환경변수는 빌드 시점에 번들에 박힌다) ---
FROM node:20-alpine AS build
WORKDIR /app

# 의존성 레이어 캐시를 살리기 위해 lock 파일 먼저 복사
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# VITE_API_BASE_URL 빈 값 = 상대경로(/api/...) → nginx가 8080으로 프록시
ENV VITE_API_BASE_URL=""
ENV VITE_ENABLE_MOCKS="false"
RUN npm run build

# --- runtime: nginx로 정적 파일 서빙 + /api 프록시 ---
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
