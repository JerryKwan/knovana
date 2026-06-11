// API wrapper for Knovana backend

const DEV_API_URL = "http://localhost:8000";

export const getBaseUrl = (): string => {
  // If running on Vite dev server (port 5173 usually), redirect to Hono backend port (8000)
  if (import.meta.env.DEV) {
    return DEV_API_URL;
  }
  return window.location.origin;
};

export const getApiUrl = (path: string): string => {
  const base = getBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

export const getToken = (): string | null => {
  return localStorage.getItem("knovana_token");
};

export const setToken = (token: string): void => {
  localStorage.setItem("knovana_token", token);
};

export const removeToken = (): void => {
  localStorage.removeItem("knovana_token");
};

export interface ApiResponse<T> {
  data: T | null;
  error: { code: string; message: string } | null;
  status: number;
}

export const request = async <T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const url = getApiUrl(path);
  const token = getToken();

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, fetchOptions);
    const status = response.status;

    if (status === 204) {
      return { data: null, error: null, status };
    }

    const json = await response.json();

    if (response.ok) {
      return { data: json as T, error: null, status };
    } else {
      return {
        data: null,
        error: json.error || {
          code: "API_ERROR",
          message: json.message || response.statusText || "Request failed",
        },
        status,
      };
    }
  } catch (err: any) {
    return {
      data: null,
      error: {
        code: "NETWORK_ERROR",
        message: err.message || "Network request failed. Is the backend server running?",
      },
      status: 500,
    };
  }
};

export interface ParsedSseData {
  raw: string;
  json?: any;
}

export async function readSseStream(
  response: Response,
  onData: (data: ParsedSseData) => void | Promise<void>,
  signal?: AbortSignal
): Promise<void> {
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(body || `Request failed with ${response.status}`);
  }

  if (!response.body) {
    throw new Error("The response did not include a readable stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      if (signal?.aborted) {
        throw new DOMException("The user aborted a request.", "AbortError");
      }
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const raw = trimmed.slice(5).trimStart();
        if (!raw || raw === "[DONE]") continue;

        let parsedJson: any = undefined;
        try {
          parsedJson = JSON.parse(raw);
        } catch {
          // Ignore parsing issues for raw chunks
        }

        await onData({ raw, json: parsedJson });
      }
    }

    const tail = buffer.trim();
    if (tail.startsWith("data:")) {
      const raw = tail.slice(5).trimStart();
      if (raw && raw !== "[DONE]") {
        let parsedJson: any = undefined;
        try {
          parsedJson = JSON.parse(raw);
        } catch {}
        await onData({ raw, json: parsedJson });
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function requestStream(
  path: string,
  body: unknown,
  onData: (data: ParsedSseData) => void | Promise<void>,
  signal?: AbortSignal
): Promise<void> {
  const url = getApiUrl(path);
  const token = getToken();

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal,
  });

  await readSseStream(response, onData, signal);
}

