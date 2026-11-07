import { beforeEach, describe, expect, it } from 'vitest';
import { DomFieldIndicator } from './DomFieldIndicator';

const badgeOf = () => document.querySelector('ami-pwned-badge')?.shadowRoot?.querySelector('[role="status"]');

describe('DomFieldIndicator', () => {
  let field: HTMLInputElement;
  let indicator: DomFieldIndicator;

  beforeEach(() => {
    document.documentElement.querySelectorAll('ami-pwned-badge').forEach((el) => el.remove());
    document.body.innerHTML = '<input type="password" />';
    field = document.querySelector('input')!;
    indicator = new DomFieldIndicator(document);
  });

  it('renders a compromised badge with a compact count and the full count in the tooltip', () => {
    indicator.show(field, { status: 'done', verdict: { kind: 'compromised', occurrences: 3_730_471 } });

    expect(badgeOf()?.textContent).toBe('⚠ Compromised password (seen 3.7M times)');
    expect(badgeOf()?.getAttribute('title')).toBe('This password appears 3,730,471 times in data breaches.');
    expect(badgeOf()?.className).toContain('compromised');
  });

  it.each([
    [{ status: 'checking' } as const, 'Checking…'],
    [{ status: 'error' } as const, 'Check unavailable'],
    [{ status: 'done', verdict: { kind: 'not-compromised' } } as const, '✓ Not found in known breaches'],
  ])('renders %j', (state, text) => {
    indicator.show(field, state);

    expect(badgeOf()?.textContent).toBe(text);
  });

  it('reuses a single badge per field across updates', () => {
    indicator.show(field, { status: 'checking' });
    indicator.show(field, { status: 'error' });

    expect(document.querySelectorAll('ami-pwned-badge')).toHaveLength(1);
  });

  it('removes the badge on hide', () => {
    indicator.show(field, { status: 'checking' });
    indicator.hide(field);

    expect(document.querySelector('ami-pwned-badge')).toBeNull();
  });

  it('drops badges of fields removed from the page on scroll', () => {
    indicator.show(field, { status: 'checking' });
    field.remove();

    window.dispatchEvent(new Event('scroll'));

    expect(document.querySelector('ami-pwned-badge')).toBeNull();
  });
});
