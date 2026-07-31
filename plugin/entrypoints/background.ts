import { apiClient } from '../lib/apiClient';
import type { ModelCurrentPageResponse } from '../lib/messaging';
import type { DomSnapshot } from '../lib/types';

export default defineBackground(() => {
  // Open the side panel when the toolbar icon is clicked (MV3 requires this
  // opt-in explicitly; it isn't the default behavior). sidePanel is a
  // Chrome-only API not covered by the webextension-polyfill types `browser`
  // is typed against, so we go through the native `chrome` global instead.
  (globalThis as any).chrome?.sidePanel
    ?.setPanelBehavior?.({ openPanelOnActionClick: true })
    ?.catch(() => {
      // Not available on every browser target; safe to ignore.
    });

  browser.runtime.onMessage.addListener((message, _sender, sendResponse): true => {
    if ((message as { type?: string })?.type === 'MODEL_CURRENT_PAGE') {
      handleModelCurrentPage().then(sendResponse);
    }
    return true; // keep the message channel open for the async response
  });
});

async function handleModelCurrentPage(): Promise<ModelCurrentPageResponse> {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab found.');

    const contentResponse = (await browser.tabs.sendMessage(tab.id, {
      type: 'CAPTURE_DOM_SNAPSHOT',
    })) as { domSnapshot?: DomSnapshot } | undefined;

    if (!contentResponse?.domSnapshot) {
      throw new Error('Content script did not return a DOM snapshot. Reload the page and try again.');
    }

    const pageModel = await apiClient.modelPage({
      url: tab.url ?? '',
      pageTitle: tab.title ?? '',
      domSnapshot: contentResponse.domSnapshot,
    });

    return { ok: true, pageModel };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
