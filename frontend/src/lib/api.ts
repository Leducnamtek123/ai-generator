import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { env } from "@/env";
import { getSession } from "next-auth/react";

// FIXME: Set your API base URL and global headers
export const api = axios.create({
  baseURL: `${env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1`,
  timeout: 10_000,
  headers: {
    Accept: "application/json"
  }
});

api.interceptors.request.use(async (config) => {
  // Inject auth token from NextAuth session
  const session = await getSession();
  const token = (session as any)?.accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (axios.isAxiosError(err)) return Promise.reject(err);

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
