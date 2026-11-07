import type { FieldIndicator, FieldState } from './PasswordFieldMonitor';

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const full = new Intl.NumberFormat('en-US');

const STYLE = `
  :host { all: initial; position: absolute; z-index: 2147483647; }
  .badge {
    display: inline-block; padding: 2px 8px; border-radius: 10px;
    font: 600 11px/1.6 system-ui, -apple-system, sans-serif;
    box-shadow: 0 1px 3px rgba(0,0,0,.25); white-space: nowrap;
  }
  .checking { background: #eceff3; color: #3b4350; }
  .compromised { background: #c62828; color: #fff; }
  .safe { background: #2e7d32; color: #fff; }
  .error { background: #f9a825; color: #2b2100; }
`;

function describe(state: FieldState): { className: string; text: string; title: string } {
  switch (state.status) {
    case 'checking':
      return { className: 'checking', text: 'Checking…', title: 'Checking with Have I Been Pwned' };
    case 'error':
      return {
        className: 'error',
        text: 'Check unavailable',
        title: 'Could not reach Have I Been Pwned',
      };
    case 'done':
      return state.verdict.kind === 'compromised'
        ? {
            className: 'compromised',
            text: `⚠ Compromised password (seen ${compact.format(state.verdict.occurrences)} times)`,
            title: `This password appears ${full.format(state.verdict.occurrences)} times in data breaches.`,
          }
        : { className: 'safe', text: '✓ Not found in known breaches', title: 'No known breach (Have I Been Pwned)' };
  }
}

/**
 * Renders a badge under each password field. Lives in a Shadow DOM so the
 * host page's CSS cannot alter it (and vice versa).
 */
export class DomFieldIndicator implements FieldIndicator<HTMLInputElement> {
  private readonly hosts = new Map<HTMLInputElement, { host: HTMLElement; badge: HTMLElement }>();

  constructor(private readonly doc: Document = document) {
    const view = doc.defaultView;
    const reposition = () => this.repositionAll();
    view?.addEventListener('scroll', reposition, { capture: true, passive: true });
    view?.addEventListener('resize', reposition, { passive: true });
  }

  show(field: HTMLInputElement, state: FieldState): void {
    const { host, badge } = this.hosts.get(field) ?? this.create(field);
    const { className, text, title } = describe(state);
    badge.className = `badge ${className}`;
    badge.textContent = text;
    badge.title = title;
    this.position(field, host);
  }

  hide(field: HTMLInputElement): void {
    this.hosts.get(field)?.host.remove();
    this.hosts.delete(field);
  }

  private create(field: HTMLInputElement) {
    const host = this.doc.createElement('ami-pwned-badge');
    const root = host.attachShadow({ mode: 'open' });
    const style = this.doc.createElement('style');
    style.textContent = STYLE;
    const badge = this.doc.createElement('span');
    badge.setAttribute('role', 'status');
    badge.setAttribute('aria-live', 'polite');
    root.append(style, badge);
    this.doc.documentElement.append(host);

    const entry = { host, badge };
    this.hosts.set(field, entry);
    return entry;
  }

  private position(field: HTMLInputElement, host: HTMLElement): void {
    const rect = field.getBoundingClientRect();
    const view = this.doc.defaultView;
    host.style.top = `${rect.bottom + (view?.scrollY ?? 0) + 4}px`;
    host.style.left = `${rect.left + (view?.scrollX ?? 0)}px`;
  }

  private repositionAll(): void {
    for (const [field, { host }] of this.hosts) {
      if (field.isConnected) this.position(field, host);
      else this.hide(field);
    }
  }
}
