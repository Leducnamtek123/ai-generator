import { api } from "@/lib/api";

// Matches: POST /auth/email/login
export const authApi = {
  login: async (data: { email: string; password: string }) => {
    const res = await api.post("/auth/email/login", data);
    return res.data; // { token, refreshToken, tokenExpires, user }
  },

  // Matches: POST /auth/email/register
  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    const res = await api.post("/auth/email/register", data);
    return res.data;
  },

  // Matches: GET /auth/me
  getProfile: async () => {
    const res = await api.get("/auth/me");
    return res.data;
  },

  // Matches: PATCH /auth/me
  updateProfile: async (data: Record<string, unknown>) => {
    const res = await api.patch("/auth/me", data);
    return res.data;
  },

  // Matches: POST /auth/forgot/password
  forgotPassword: async (email: string) => {
    const res = await api.post("/auth/forgot/password", { email });
    return res.data;
  },

  // Matches: POST /auth/reset/password
  resetPassword: async (data: { hash: string; password: string }) => {
    const res = await api.post("/auth/reset/password", data);
    return res.data;
  },

  // Matches: POST /auth/refresh
  refresh: async (refreshToken: string) => {
    const res = await api.post(
      "/auth/refresh",
      {},
      { headers: { Authorization: `Bearer ${refreshToken}` } }
    );
    return res.data;
  },

  // Matches: POST /auth/logout
  logout: async () => {
    const res = await api.post("/auth/logout");
    return res.data;
  },
};
