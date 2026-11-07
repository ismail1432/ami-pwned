// Zips dist/ into release/ami-pwned-<version>.zip, ready for the Chrome Web Store.
// Run via `npm run package` (which builds first).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const fail = (message) => {
  console.error(`✗ ${message}`);
  process.exit(1);
};

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

if (!existsSync('dist/manifest.json')) fail('dist/manifest.json not found, run `npm run build` first.');

const manifest = readJson('dist/manifest.json');
const pkg = readJson('package.json');

if (manifest.version !== pkg.version) {
  fail(`Version mismatch: manifest.json is ${manifest.version}, package.json is ${pkg.version}. Bump both.`);
}

const icon128 = manifest.icons?.['128'];
if (!icon128 || !existsSync(join('dist', icon128))) {
  fail('The Chrome Web Store requires a 128×128 icon: declare "icons" in public/manifest.json.');
}

const out = join('release', `ami-pwned-${manifest.version}.zip`);
mkdirSync('release', { recursive: true });
rmSync(out, { force: true });

try {
  // -X: no extra file attributes; zip from inside dist/ so manifest.json sits at the archive root.
  execFileSync('zip', ['-r', '-X', '-q', join('..', out), '.', '-x', '*.DS_Store'], { cwd: 'dist', stdio: 'inherit' });
} catch {
  fail('`zip` failed (is the zip CLI installed?).');
}

console.log(`✓ ${out}`);
