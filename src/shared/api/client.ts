import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/shared/stores/authStore";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string> | null = null;

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        refreshing ??= axios
          // TODO: 백엔드 refresh 스펙 확정 시 엔드포인트/필드 반영
          .post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh`, {
            refreshToken: useAuthStore.getState().refreshToken,
          })
          .then((r) => {
            const token: string = r.data.accessToken;
            useAuthStore.getState().setAccessToken(token);
            return token;
          })
          .finally(() => {
            refreshing = null;
          });

        const token = await refreshing;
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        useAuthStore.getState().clearAuth();
        const returnUrl = encodeURIComponent(
          window.location.pathname + window.location.search,
        );
        window.location.href = `/login?returnUrl=${returnUrl}`;
      }
    }
    return Promise.reject(error);
  },
);
