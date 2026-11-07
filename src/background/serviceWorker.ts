import { HibpRangeClient } from '../infrastructure/HibpRangeClient';
import { handleRangeRequest } from '../infrastructure/messaging/handleRangeRequest';
import { isRangeRequest } from '../infrastructure/messaging/rangeMessages';

const registry = new HibpRangeClient();

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  // Only our own content scripts, only our message type.
  if (sender.id !== chrome.runtime.id || !isRangeRequest(message)) return false;

  void handleRangeRequest(registry, message).then(sendResponse);
  return true; // keep the channel open for the async response
});
