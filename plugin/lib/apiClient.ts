// Thin fetch wrapper for the local FastAPI backend. Only ever called from
// the background service worker -- see docs/architecture.md ("Two
// processes, one contract"): the plugin never calls an LLM directly, and
// no other plugin surface talks to the backend directly either.

import type { ModelPageRequest, PageModel } from './types';

const BACKEND_BASE_URL = 'http://localhost:8787';

async function postJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const res = await fetch(`${BACKEND_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Backend request to ${path} failed (${res.status}): ${detail}`);
  }
  return res.json() as Promise<TResponse>;
}

export const apiClient = {
  modelPage(request: ModelPageRequest): Promise<PageModel> {
    return postJson<PageModel>('/model-page', request);
  },
};
