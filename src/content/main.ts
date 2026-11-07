import { createContentScriptCheck } from '../infrastructure/container';
import { DomFieldIndicator } from './DomFieldIndicator';
import { PasswordFieldMonitor } from './PasswordFieldMonitor';
import { watchPasswordFields } from './watchPasswordFields';

// SHA-1 is computed in the page so the password never leaves it; Web Crypto
// is only exposed in secure contexts (https, localhost).
if (globalThis.crypto?.subtle) {
  const checkPassword = createContentScriptCheck((message) => chrome.runtime.sendMessage(message));
  const monitor = new PasswordFieldMonitor(checkPassword, new DomFieldIndicator());
  watchPasswordFields(document, {
    onEdit: (field) => monitor.onEdit(field),
    onCommit: (field) => monitor.onCommit(field),
  });
}
