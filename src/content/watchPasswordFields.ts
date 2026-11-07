export interface PasswordFieldHandlers {
  /** The value is being edited (fires on every keystroke). Must not trigger a lookup. */
  readonly onEdit: (field: HTMLInputElement) => void;
  /** The value was committed (`change`: field left, or form submitted with Enter). */
  readonly onCommit: (field: HTMLInputElement) => void;
}

/**
 * Driving adapter: reports edits and commits in any password field of the page,
 * including fields added later (SPAs) and fields inside open shadow roots,
 * through capturing listeners on the document — no MutationObserver needed.
 */
export function watchPasswordFields(root: Document, handlers: PasswordFieldHandlers): () => void {
  const passwordField = (event: Event): HTMLInputElement | undefined => {
    const target = event.composedPath()[0];
    return target instanceof HTMLInputElement && target.type === 'password' ? target : undefined;
  };
  const onInput = (event: Event) => {
    const field = passwordField(event);
    if (field) handlers.onEdit(field);
  };
  const onChange = (event: Event) => {
    const field = passwordField(event);
    if (field) handlers.onCommit(field);
  };

  root.addEventListener('input', onInput, true);
  root.addEventListener('change', onChange, true);
  return () => {
    root.removeEventListener('input', onInput, true);
    root.removeEventListener('change', onChange, true);
  };
}
