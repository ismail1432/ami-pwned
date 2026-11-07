# Privacy Policy — Am I Pwned?

_Last updated: November 7, 2026_

Am I Pwned? is a browser extension that warns you when a password you enter has appeared in a known data breach. It is built so that your password never leaves the page.

## Data we collect

**None.** The extension does not collect, store, sell or share any personal data. It has no account, no analytics, no tracking, no ads and no server of its own.

## What happens when a password is checked

When you leave a password field (or press Enter) and the value has at least 5 characters:

1. The password is hashed with SHA-1 **locally, inside the page**.
2. Only the **first 5 characters of that hash** (for example `5BAA6`) are sent to the [Pwned Passwords](https://haveibeenpwned.com/Passwords) range API of Have I Been Pwned, at `https://api.pwnedpasswords.com/range/{prefix}`. Hundreds of thousands of different passwords share any given prefix, so it does not reveal your password.
3. The service returns every known breached hash that starts with this prefix, padded with fake entries. The extension compares them with your hash **locally** and shows the result under the field.

Neither your password nor its full hash is ever sent anywhere: not to Have I Been Pwned, not to the developer, not to anyone else. Nothing is checked while you type, only the value you commit.

## Data stored on your device

None. The extension does not keep any history of passwords, hashes, results or visited websites. Each check exists only in memory and is forgotten when the page is closed.

## Third-party service

The only external service contacted is the Pwned Passwords API of [Have I Been Pwned](https://haveibeenpwned.com/), operated by Troy Hunt. Like any web request, it receives your IP address and standard browser headers. See [its privacy policy](https://haveibeenpwned.com/Privacy) for how it handles requests.

## Permissions

- **Access to all websites (content script)**: needed to detect password fields on any site you visit. The extension only reacts to password fields (`<input type="password">`) and only adds a badge under them; it does not read or change any other content.
- **Access to `api.pwnedpasswords.com`**: needed to query the breach database with the 5-character hash prefix.

## Open source

The full source code is public: <https://github.com/ismail1432/ami-pwned>. You can check everything above for yourself.

## Changes

Any change to this policy will be published in this file, with a new "Last updated" date.

## Contact

Questions or concerns: open an issue at <https://github.com/ismail1432/ami-pwned/issues>.
