"use client";

export type AsyncOperationStatus =
  | "idle"
  | "loading"
  | "retrying"
  | "success"
  | "error"
  | "cancelled";

export interface AsyncOperationState<T> {
  status: AsyncOperationStatus;
  data: T | null;
  error: string | null;
}

export function createAsyncOperationState<T>(data: T | null = null): AsyncOperationState<T> {
  return {
    status: "idle",
    data,
    error: null,
  };
}

export function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    name?: string;
    code?: string;
    message?: string;
  };

  return (
    candidate.name === "AbortError" ||
    candidate.code === "ERR_CANCELED" ||
    candidate.code === "ECONNABORTED" ||
    candidate.message === "canceled"
  );
}

export function getUserFacingErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }

  if (isAbortError(error)) {
    return "Operation cancelled";
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  if (error && typeof error === "object") {
    const candidate = error as {
      response?: { data?: { message?: string | string[] } };
      message?: string;
    };

    const responseMessage = candidate.response?.data?.message;
    if (typeof responseMessage === "string" && responseMessage.trim()) {
      return responseMessage.trim();
    }

    if (Array.isArray(responseMessage) && responseMessage.length > 0) {
      const first = responseMessage.find((entry) => typeof entry === "string" && entry.trim());
      if (first) {
        return first.trim();
      }
    }

    if (typeof candidate.message === "string" && candidate.message.trim()) {
      return candidate.message.trim();
    }
  }

  return fallback;
}

export async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const cleanup = () => {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", onAbort);
    };

    const onAbort = () => {
      cleanup();
      reject(new DOMException("The operation was aborted.", "AbortError"));
    };

    if (signal?.aborted) {
      cleanup();
      reject(new DOMException("The operation was aborted.", "AbortError"));
      return;
    }

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export interface PollUntilOptions<T> {
  fetcher: (signal: AbortSignal) => Promise<T>;
  shouldStop: (value: T) => boolean;
  intervalMs: number;
  timeoutMs: number;
  signal?: AbortSignal;
}

export async function pollUntil<T>({
  fetcher,
  shouldStop,
  intervalMs,
  timeoutMs,
  signal,
}: PollUntilOptions<T>): Promise<T> {
  const controller = signal ? null : new AbortController();
  const activeSignal = signal ?? controller!.signal;
  const startedAt = Date.now();

  const run = async (): Promise<T> => {
    if (activeSignal.aborted) {
      throw new DOMException("The operation was aborted.", "AbortError");
    }

    const value = await fetcher(activeSignal);
    if (shouldStop(value)) {
      return value;
    }

    if (Date.now() - startedAt >= timeoutMs) {
      throw new Error("Polling timed out");
    }

    await sleep(intervalMs, activeSignal);
    return run();
  };

  return run();
}
