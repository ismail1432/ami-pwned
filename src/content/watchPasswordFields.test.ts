import { afterEach, describe, expect, it, vi } from 'vitest';
import { watchPasswordFields } from './watchPasswordFields';

const fire = (input: HTMLInputElement, type: 'input' | 'change') =>
  input.dispatchEvent(new Event(type, { bubbles: true, composed: true }));

describe('watchPasswordFields', () => {
  let unwatch: () => void = () => {};
  afterEach(() => unwatch());

  function watch() {
    const handlers = { onEdit: vi.fn(), onCommit: vi.fn() };
    unwatch = watchPasswordFields(document, handlers);
    return handlers;
  }

  it('reports input as an edit and change as a commit, including on fields added after install', () => {
    const { onEdit, onCommit } = watch();

    document.body.innerHTML = '<input type="password" id="pwd" />';
    const field = document.getElementById('pwd') as HTMLInputElement;

    fire(field, 'input');
    expect(onEdit).toHaveBeenCalledWith(field);
    expect(onCommit).not.toHaveBeenCalled();

    fire(field, 'change');
    expect(onCommit).toHaveBeenCalledWith(field);
  });

  it('ignores non-password fields', () => {
    const { onEdit, onCommit } = watch();

    document.body.innerHTML = '<input type="text" id="login" />';
    const field = document.getElementById('login') as HTMLInputElement;
    fire(field, 'input');
    fire(field, 'change');

    expect(onEdit).not.toHaveBeenCalled();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('reaches password fields inside open shadow roots', () => {
    const { onEdit, onCommit } = watch();

    const host = document.createElement('div');
    document.body.replaceChildren(host);
    const field = document.createElement('input');
    field.type = 'password';
    host.attachShadow({ mode: 'open' }).append(field);
    fire(field, 'input');
    fire(field, 'change');

    expect(onEdit).toHaveBeenCalledWith(field);
    expect(onCommit).toHaveBeenCalledWith(field);
  });

  it('stops reporting once uninstalled', () => {
    const { onEdit, onCommit } = watch();
    unwatch();

    document.body.innerHTML = '<input type="password" id="pwd" />';
    const field = document.getElementById('pwd') as HTMLInputElement;
    fire(field, 'input');
    fire(field, 'change');

    expect(onEdit).not.toHaveBeenCalled();
    expect(onCommit).not.toHaveBeenCalled();
  });
});
