import type { CheckPassword } from '../domain/ports/CheckPassword';
import type { Verdict } from '../domain/Verdict';

export type FieldState =
  | { readonly status: 'checking' }
  | { readonly status: 'done'; readonly verdict: Exclude<Verdict, { kind: 'skipped' }> }
  | { readonly status: 'error' };

/** Output port of the content script: how a field's state is shown to the user. */
export interface FieldIndicator<F> {
  show(field: F, state: FieldState): void;
  hide(field: F): void;
}

export interface PasswordFieldMonitorOptions {
  /** Minimum length of the committed value before it is checked. Default 5. */
  readonly minLength?: number;
}

/**
 * Checks password values once they are committed, never while they are typed.
 *
 * Why: each check sends SHA1(value)[:5]. Checking successive prefixes of what is
 * being typed ("passw", "passwo", …) would hand the API one prefix per extra
 * character, which is enough to rebuild the password offline character by
 * character and defeats k-anonymity. So editing only hides the badge and
 * invalidates any in-flight check; the lookup happens on commit, and only the
 * answer to the latest request for each field is shown.
 */
export class PasswordFieldMonitor<F extends { readonly value: string }> {
  private readonly requests = new WeakMap<F, number>();
  private readonly minLength: number;

  constructor(
    private readonly checkPassword: CheckPassword,
    private readonly indicator: FieldIndicator<F>,
    options: PasswordFieldMonitorOptions = {},
  ) {
    this.minLength = options.minLength ?? 5;
  }

  /** The value is being edited: the current verdict is stale. No lookup. */
  onEdit(field: F): void {
    this.nextRequest(field);
    this.indicator.hide(field);
  }

  /** The value was committed: check it. */
  onCommit(field: F): void {
    const request = this.nextRequest(field);
    const password = field.value;
    if (password.length < this.minLength) {
      this.indicator.hide(field);
      return;
    }
    void this.run(field, request, password);
  }

  private async run(field: F, request: number, password: string): Promise<void> {
    const isCurrent = () => this.requests.get(field) === request;

    this.indicator.show(field, { status: 'checking' });
    try {
      const verdict = await this.checkPassword(password);
      if (!isCurrent()) return;
      if (verdict.kind === 'skipped') this.indicator.hide(field);
      else this.indicator.show(field, { status: 'done', verdict });
    } catch {
      if (isCurrent()) this.indicator.show(field, { status: 'error' });
    }
  }

  /** Invalidates any in-flight check for this field and returns the new request id. */
  private nextRequest(field: F): number {
    const request = (this.requests.get(field) ?? 0) + 1;
    this.requests.set(field, request);
    return request;
  }
}
