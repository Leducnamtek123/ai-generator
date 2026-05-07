import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        if (!axios.isAxiosError(error)) {
          return failureCount < 1;
        }

        const status = error.response?.status;

        if (
          status &&
          [400, 401, 403, 404, 409, 422].includes(status)
        ) {
          return false;
        }

        if (status && status >= 500) {
          return failureCount < 2;
        }

        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
