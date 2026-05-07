import axios, { AxiosError, AxiosHeaders, AxiosRequestConfig } from "axios";

// Use relative path for proxying through Next.js proxy.ts
export const api = axios.create({
  baseURL: '/api',
  timeout: 30_000, // Increased timeout for heavy tasks like video/image gen
  headers: {
    Accept: "application/json"
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const requestId = globalThis.crypto?.randomUUID?.();

  config.headers = AxiosHeaders.from(config.headers);

  if (requestId) {
    config.headers.set("x-request-id", requestId);
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (axios.isAxiosError(err)) {
      const requestId = err.response?.headers?.["x-request-id"];

      if (requestId) {
        const headers = AxiosHeaders.from(err.config?.headers);
        headers.set("x-request-id", requestId);

        err.config = {
          ...err.config,
          headers,
        };
      }

      return Promise.reject(err);
    }

    return Promise.reject(new AxiosError("Unknown error"));
  }
);

type Cfg = AxiosRequestConfig & { signal?: AbortSignal };

export const get = async <T>(url: string, config?: Cfg) => (await api.get<T>(url, config)).data;

export const post = async <T, B = unknown>(url: string, body?: B, config?: Cfg) =>
  (await api.post<T>(url, body, config)).data;

export const put = async <T, B = unknown>(url: string, body?: B, config?: Cfg) =>
  (await api.put<T>(url, body, config)).data;

export const patch = async <T, B = unknown>(url: string, body?: B, config?: Cfg) =>
  (await api.patch<T>(url, body, config)).data;

export const del = async <T>(url: string, config?: Cfg) => (await api.delete<T>(url, config)).data;
