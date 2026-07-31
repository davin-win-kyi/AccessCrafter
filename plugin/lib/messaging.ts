// Typed helpers for chrome.runtime messaging between the side panel and the
// background service worker. The background worker is the only surface that
// calls the backend (see lib/apiClient.ts) or the content script directly.

import type { PageModel } from './types';

export type ModelCurrentPageMessage = { type: 'MODEL_CURRENT_PAGE' };
export type ModelCurrentPageResponse =
  | { ok: true; pageModel: PageModel }
  | { ok: false; error: string };

export type PluginMessage = ModelCurrentPageMessage;

export async function modelCurrentPage(): Promise<ModelCurrentPageResponse> {
  return browser.runtime.sendMessage({ type: 'MODEL_CURRENT_PAGE' } satisfies ModelCurrentPageMessage);
}
