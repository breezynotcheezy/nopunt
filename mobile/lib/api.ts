import { apiBaseUrl } from './config';

export type ApiError = {
  status: number;
  body: unknown;
};

async function readJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest<T>(params: {
  path: string;
  method?: 'GET' | 'POST';
  token?: string | null;
  body?: unknown;
}): Promise<T> {
  const res = await fetch(`${apiBaseUrl()}${params.path}`, {
    method: params.method ?? 'GET',
    headers: {
      'content-type': 'application/json',
      ...(params.token ? { authorization: `Bearer ${params.token}` } : {}),
    },
    body: params.body ? JSON.stringify(params.body) : undefined,
  });

  const body = await readJsonSafe(res);
  if (!res.ok) {
    const err: ApiError = { status: res.status, body };
    throw err;
  }

  return body as T;
}
