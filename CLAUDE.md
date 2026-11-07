# Am I Pwned? — browser extension

Chrome extension (Manifest V3) that checks whether a password appears in [Have I Been Pwned](https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange) breaches, using the **k-anonymity** model. A port of Symfony's `NotCompromisedPasswordValidator` to TypeScript, with a hexagonal architecture.

Single entry point: the **content script**. On every page it watches `type="password"` fields and, when a value of at least 5 characters is **committed** (`change` event: field left or Enter), checks it once and shows a badge under the field. Editing only hides the badge. There is no popup (removed on purpose: checks happen only in password inputs).

## Commands

```bash
npm test               # Vitest (jsdom), all unit tests
npm run test:contract  # calls the REAL HIBP API (opt-in, needs network)
npm run typecheck      # tsc --noEmit
npm run build          # clean + typecheck + 2 Vite builds → dist/
npm run dev            # both builds in --watch
npm run package        # build + zip dist/ into release/ (Store format)
npm run icons          # regenerate public/icons/*.png from assets/icon.svg
npx vitest run src/content/PasswordFieldMonitor.test.ts   # a single file
```

Before considering a task done: `npm test && npm run typecheck && npm run build`.

## Hexagonal architecture

```
src/domain/            Core logic. NO dependencies (no DOM, no fetch, no chrome.*).
  CheckPasswordCompromise.ts   the use case: empty → skipped; SHA-1; range(prefix); suffix present → compromised
  Sha1Hash.ts                  value object (prefix 5 / suffix 35, uppercase)
  Verdict.ts                   compromised | not-compromised | skipped
  errors.ts
  ports/CheckPassword.ts             driving port
  ports/PasswordHasher.ts            driven port
  ports/BreachedPasswordRegistry.ts  driven port: occurrencesByPrefix(prefix) → Map<suffix, count>

src/infrastructure/    Driven adapters + composition
  WebCryptoSha1Hasher.ts       PasswordHasher via crypto.subtle
  HibpRangeClient.ts           Registry → HIBP over HTTP (injected fetch, Add-Padding header, drops :0 lines)
  messaging/                   Registry for the content script → background via chrome.runtime messaging
    rangeMessages.ts             message contract (JSON-safe) + type guards
    handleRangeRequest.ts        background side: registry → RangeResponse (never throws)
    ExtensionMessagingRegistry.ts content script side
  container.ts                 the ONLY place where concrete adapters are instantiated

src/content/           Driving adapter: content script (plain DOM, no framework)
  watchPasswordFields.ts   capturing `input` (edit) + `change` (commit) listeners + composedPath (SPAs, open shadow DOM)
  PasswordFieldMonitor.ts  edit → hide badge, commit → check (5-char min), "latest request wins", FieldIndicator port
  DomFieldIndicator.ts     badge in a Shadow DOM
  main.ts                  entry point (inactive without crypto.subtle, i.e. on http pages)
src/background/serviceWorker.ts   receives the prefix, calls HibpRangeClient
```

Content script flow: `page (SHA-1) ──prefix──► background ──► api.pwnedpasswords.com/range/{prefix}`.

## Invariants — do not break

- **The password never leaves the page.** Only the first 5 hex chars of the SHA-1 cross a boundary (message to the background, then HTTP). Never put the password or the full hash in a message, a log, or a request.
- **Never check while typing.** Prefixes of successive values (`passw`, `passwo`, …) let whoever sees the requests rebuild the password character by character, which defeats k-anonymity. Only committed values are checked: no `input`-triggered lookup, no debounce-based lookup.
- **The domain stays pure.** A new I/O need = a new port in `domain/ports/` + an adapter in `infrastructure/`, wired in `container.ts`.
- **Errors**: every `BreachedPasswordRegistry` adapter turns its I/O failures into `BreachRegistryUnavailableError`. The use case catches **only** that error type and turns it into `CompromiseCheckFailedError`. Any other error (a bug) must propagate.
- `chrome.runtime` messages are serialized: never put a `Map`, an `Error`, or a class instance in a payload. The background checks `sender.id === chrome.runtime.id`.
- The 5-character threshold applies to the **committed value**; it is unrelated to HIBP's 5-character prefix, which is a prefix of the hash.

## Build gotchas

- **Two Vite configs**:
  - `vite.config.ts`: `background.js` as an ES module. The name is fixed because the manifest references it.
  - `vite.content.config.ts`: `content.js` as an **IIFE**. A content script cannot be an ES module, so `dist/content.js` must contain no `import`.
- Both configs write to `dist/` with `emptyOutDir: false`; cleaning is done by `npm run clean`.
- Code imported by the background must not touch `document` or `window` (it runs in a service worker).
- No framework in the content script: it is injected into every page and must stay light (~6 kB).
- `public/manifest.json` is copied as is. A new permission goes in the manifest and in the `connect-src` CSP.

## Release

- **Never commit a zip** (nor `dist/`, nor `release/`). The Store zip is built by CI (`.github/workflows/release.yml`) when a `vX.Y.Z` tag is pushed, and attached to the GitHub Release.
- A new version = bump `version` in `package.json` **and** `public/manifest.json`. CI fails if the tag does not match both.
- Icons: the source is `assets/icon.svg`. `npm run icons` regenerates `public/icons/*.png` (committed files).

## Test conventions

- Domain: **in-memory fakes** (`test/doubles.ts`) rather than mocks. Fixtures are real SHA-1 digests (`password` = `5BAA61E4…FD8`). Verify any new vector with `printf '%s' '…' | shasum -a 1`.
- HTTP and messaging adapters: inject `fetch` / `sendMessage`. Never hit the network in `npm test`. The only network test is `*.contract.test.ts` (`describe.runIf(process.env.HIBP_CONTRACT)`).
- Tests using `crypto.subtle` must run in the node environment: add `// @vitest-environment node` at the top of the file.
- Numbers are formatted with `Intl.NumberFormat('en-US')` (`3,730,471`, compact `3.7M`). If you switch locales, beware that some (e.g. fr-FR) use non-breaking spaces: assert with `\s` in a regex, not a literal space.

## Testing the extension for real

1. `npm run build`.
2. In `chrome://extensions`, turn on Developer mode, then "Load unpacked" on `dist/`.
3. After each rebuild: ↻ on the extension card, **then reload open tabs** (otherwise the old content script keeps running).
4. Background logs and network: the "service worker" link on the card.

## Misc

- Everything is in **English**: UI, user-facing messages, code, identifiers, comments, docs.
- `.env*` files are not readable by Claude (permissions), and the HIBP range API needs no key: don't introduce one.
