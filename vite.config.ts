import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// .env* 값은 process.env에 자동 주입되지 않으므로(import.meta.env는 클라이언트 전용)
// config에서 쓰려면 loadEnv로 직접 읽어야 한다
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],
    // 백엔드 CORS가 http://localhost:3000만 허용하므로 dev 서버 포트를 3000으로 고정
    server: {
      port: 3000,
      strictPort: true,
      proxy: {
        "/api": {
          target: env.VITE_API_PROXY_TARGET || "http://localhost:8080",
          changeOrigin: true,
          // 백엔드 RT 쿠키는 `Secure; SameSite=Strict`로 내려오는데, dev는 http://localhost라
          // 브라우저가 Secure 쿠키를 저장하지 않는다 → 로그인해도 RT가 안 남아
          // /api/auth/refresh가 항상 401(AUTH_REQUIRED) → 인터셉터가 /login으로 튕긴다.
          // dev 한정으로 Secure를 떼고 SameSite를 완화한다(프록시 덕에 same-origin이라 안전).
          cookieDomainRewrite: "localhost",
          configure: (proxy) => {
            proxy.on("proxyRes", (proxyRes) => {
              const setCookie = proxyRes.headers["set-cookie"];
              if (!setCookie) return;
              proxyRes.headers["set-cookie"] = setCookie.map((c) =>
                c
                  .replace(/;\s*Secure/gi, "")
                  .replace(/;\s*SameSite=\w+/gi, "; SameSite=Lax"),
              );
            });
          },
        },
        // 셀러 챗 SSE 는 프록시를 타지 않는다 — 세션 발급 응답의 llmSseUrl(AI 서버 절대 URL)로 직통.
        // 따라서 /seller 프록시·VITE_AI_SERVER_URL 은 불필요(AI 서버가 CORS 를 열어야 함).
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
