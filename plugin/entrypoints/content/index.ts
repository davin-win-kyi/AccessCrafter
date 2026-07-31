import { captureDomSnapshot } from './domSnapshot';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    browser.runtime.onMessage.addListener((message, _sender, sendResponse): true => {
      if ((message as { type?: string })?.type === 'CAPTURE_DOM_SNAPSHOT') {
        sendResponse({ domSnapshot: captureDomSnapshot() });
      }
      return true;
    });
  },
});
