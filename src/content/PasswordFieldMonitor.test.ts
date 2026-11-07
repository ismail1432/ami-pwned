import { describe, expect, it, vi } from 'vitest';
import type { Verdict } from '../domain/Verdict';
import { type FieldIndicator, type FieldState, PasswordFieldMonitor } from './PasswordFieldMonitor';

interface Field {
  value: string;
}

class FakeFieldIndicator implements FieldIndicator<Field> {
  readonly states = new Map<Field, FieldState>();
  show(field: Field, state: FieldState) {
    this.states.set(field, state);
  }
  hide(field: Field) {
    this.states.delete(field);
  }
}

/** Lets pending promise callbacks run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('PasswordFieldMonitor', () => {
  function setup(checkPassword: (password: string) => Promise<Verdict>) {
    const indicator = new FakeFieldIndicator();
    const check = vi.fn(checkPassword);
    const monitor = new PasswordFieldMonitor(check, indicator);
    const field: Field = { value: '' };
    const type = (value: string) => {
      field.value = value;
      monitor.onEdit(field);
    };
    const commit = () => monitor.onCommit(field);
    return { indicator, field, type, commit, check, monitor };
  }

  it('never checks while the value is being typed, however slowly (k-anonymity)', async () => {
    const { type, check } = setup(async () => ({ kind: 'not-compromised' }));

    // Each check would send SHA1(value)[:5]: one prefix per extra character
    // is enough to rebuild the password offline.
    for (const value of ['passw', 'passwo', 'passwor', 'password']) {
      type(value);
      await settle();
    }

    expect(check).not.toHaveBeenCalled();
  });

  it('checks the committed value once', async () => {
    const { indicator, field, type, commit, check } = setup(async () => ({ kind: 'compromised', occurrences: 9 }));

    type('passw');
    type('password');
    commit();
    await settle();

    expect(check).toHaveBeenCalledTimes(1);
    expect(check).toHaveBeenCalledWith('password');
    expect(indicator.states.get(field)).toEqual({ status: 'done', verdict: { kind: 'compromised', occurrences: 9 } });
  });

  it('does not check a committed value below 5 characters', async () => {
    const { indicator, field, type, commit, check } = setup(async () => ({ kind: 'not-compromised' }));

    type('pass');
    commit();
    await settle();

    expect(check).not.toHaveBeenCalled();
    expect(indicator.states.has(field)).toBe(false);
  });

  it('hides the badge as soon as the value is edited again, without checking', async () => {
    const { indicator, field, type, commit, check } = setup(async () => ({ kind: 'compromised', occurrences: 1 }));

    type('password');
    commit();
    await settle();
    expect(indicator.states.has(field)).toBe(true);

    type('password1');
    await settle();

    expect(indicator.states.has(field)).toBe(false);
    expect(check).toHaveBeenCalledTimes(1);
  });

  it('shows "checking" while the request is in flight', () => {
    const { indicator, field, type, commit } = setup(() => new Promise(() => {}));

    type('password');
    commit();

    expect(indicator.states.get(field)).toEqual({ status: 'checking' });
  });

  it('ignores the answer to a check made stale by a later edit or commit', async () => {
    const pending: Array<(verdict: Verdict) => void> = [];
    const { indicator, field, type, commit } = setup(() => new Promise((resolve) => pending.push(resolve)));

    type('password');
    commit();
    type('passw0rd-unique');
    commit();

    pending[1]?.({ kind: 'not-compromised' });
    pending[0]?.({ kind: 'compromised', occurrences: 1 }); // late answer for the old value
    await settle();

    expect(indicator.states.get(field)).toEqual({ status: 'done', verdict: { kind: 'not-compromised' } });
  });

  it('drops an in-flight answer when the user starts editing again', async () => {
    let resolve: (verdict: Verdict) => void = () => {};
    const { indicator, field, type, commit } = setup(() => new Promise((r) => (resolve = r)));

    type('password');
    commit();
    type('password1');
    resolve({ kind: 'compromised', occurrences: 1 });
    await settle();

    expect(indicator.states.has(field)).toBe(false);
  });

  it('shows an error state when the check fails', async () => {
    const { indicator, field, type, commit } = setup(async () => Promise.reject(new Error('down')));

    type('password');
    commit();
    await settle();

    expect(indicator.states.get(field)).toEqual({ status: 'error' });
  });

  it('hides the badge on a skipped verdict', async () => {
    const { indicator, field, type, commit } = setup(async () => ({ kind: 'skipped', reason: 'empty-password' }));

    type('password');
    commit();
    await settle();

    expect(indicator.states.has(field)).toBe(false);
  });

  it('tracks fields independently', async () => {
    const indicator = new FakeFieldIndicator();
    const monitor = new PasswordFieldMonitor(
      async (p): Promise<Verdict> => (p === 'password' ? { kind: 'compromised', occurrences: 2 } : { kind: 'not-compromised' }),
      indicator,
    );
    const a: Field = { value: 'password' };
    const b: Field = { value: 'x9!Kq#2zLm' };

    monitor.onCommit(a);
    monitor.onCommit(b);
    await settle();

    expect(indicator.states.get(a)).toMatchObject({ verdict: { kind: 'compromised' } });
    expect(indicator.states.get(b)).toMatchObject({ verdict: { kind: 'not-compromised' } });
  });
});
