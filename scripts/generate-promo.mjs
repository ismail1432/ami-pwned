// Renders the Chrome Web Store promotional images into promo/.
// Run via `npm run promo`. Sources: assets/icon.svg and the screenshots in assets/.
// Text uses system fonts (Helvetica Neue on macOS), so renders may differ slightly on other systems.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const RED = '#C62828';
const RED_LIGHT = '#D32F2F';
const RED_DARK = '#A61B1B';
const INK = '#1F2328';
const MUTED = '#59636E';
const FONT = 'Helvetica Neue, Helvetica, Arial, sans-serif';

const glyph = readFileSync('assets/icon.svg', 'utf8').replace(/^[\s\S]*?<svg[^>]*>|<\/svg>\s*$/g, '');
const dataUri = (path) => `data:image/png;base64,${readFileSync(path).toString('base64')}`;

const icon = ({ x, y, size, color = '#FFFFFF', strokeWidth = 2 }) =>
  `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}"
       stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${glyph.replaceAll('currentColor', color)}</svg>`;

const redGradient = `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="${RED_LIGHT}"/><stop offset="1" stop-color="${RED_DARK}"/></linearGradient>`;

const smallTile = () => `<svg xmlns="http://www.w3.org/2000/svg" width="440" height="280" viewBox="0 0 440 280">
  <defs>${redGradient}</defs>
  <rect width="440" height="280" fill="url(#bg)"/>
  ${icon({ x: 170, y: 34, size: 100 })}
  <text x="220" y="184" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="40" fill="#FFFFFF">Am I Pwned?</text>
  <text x="220" y="220" text-anchor="middle" font-family="${FONT}" font-size="17" fill="#FFFFFF" fill-opacity="0.9">Know if your password was in a data breach</text>
</svg>`;

const marquee = () => `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="560" viewBox="0 0 1400 560">
  <defs>${redGradient}</defs>
  <rect width="1400" height="560" fill="url(#bg)"/>
  <rect x="140" y="160" width="240" height="240" rx="53" fill="#FFFFFF" fill-opacity="0.12"/>
  ${icon({ x: 175, y: 195, size: 170 })}
  <text x="460" y="250" font-family="${FONT}" font-weight="700" font-size="84" fill="#FFFFFF">Am I Pwned?</text>
  <text x="464" y="315" font-family="${FONT}" font-size="34" fill="#FFFFFF" fill-opacity="0.92">Know if your password was in a data breach,</text>
  <text x="464" y="360" font-family="${FONT}" font-size="34" fill="#FFFFFF" fill-opacity="0.92">without ever sending it.</text>
</svg>`;

// 1280×800 screenshot: caption on top, the browser capture below with rounded corners and a shadow.
const screenshot = ({ title, subtitle, image }) => {
  const h = 600;
  const w = Math.round(h * (2364 / 1362));
  const x = (1280 - w) / 2;
  const y = 172;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1280" height="800" viewBox="0 0 1280 800">
  <defs>
    <clipPath id="shot"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14"/></clipPath>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#000" flood-opacity="0.18"/></filter>
  </defs>
  <rect width="1280" height="800" fill="#F6F7F9"/>
  <rect width="1280" height="8" fill="${RED}"/>
  <text x="640" y="82" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="44" fill="${INK}">${title}</text>
  <text x="640" y="128" text-anchor="middle" font-family="${FONT}" font-size="24" fill="${MUTED}">${subtitle}</text>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#FFFFFF" filter="url(#shadow)"/>
  <image x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#shot)" xlink:href="${dataUri(image)}"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="none" stroke="#D0D7DE"/>
</svg>`;
};

// 1280×800 explainer of the k-anonymity flow.
const privacy = () => {
  const box = (x, title, lines, accent) => `
  <rect x="${x}" y="300" width="300" height="250" rx="18" fill="#FFFFFF" stroke="${accent ? RED : '#D0D7DE'}" stroke-width="${accent ? 3 : 1.5}"/>
  <text x="${x + 150}" y="350" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="26" fill="${INK}">${title}</text>
  ${lines.map((l, i) => `<text x="${x + 150}" y="${400 + i * 38}" text-anchor="middle" font-family="${FONT}" font-size="21" fill="${MUTED}">${l}</text>`).join('')}`;
  const arrow = (x1, x2, label) => `
  <line x1="${x1}" y1="425" x2="${x2 - 14}" y2="425" stroke="${RED}" stroke-width="4" stroke-linecap="round"/>
  <path d="M ${x2 - 18} 413 L ${x2} 425 L ${x2 - 18} 437 Z" fill="${RED}"/>
  <text x="${(x1 + x2) / 2}" y="405" text-anchor="middle" font-family="Menlo, Courier New, monospace" font-weight="700" font-size="24" fill="${RED}">${label}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
  <rect width="1280" height="800" fill="#F6F7F9"/>
  <rect width="1280" height="8" fill="${RED}"/>
  <rect x="604" y="58" width="72" height="72" rx="16" fill="${RED}"/>
  ${icon({ x: 614, y: 68, size: 52 })}
  <text x="640" y="200" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="44" fill="${INK}">Your password never leaves the page</text>
  <text x="640" y="246" text-anchor="middle" font-family="${FONT}" font-size="24" fill="${MUTED}">Only the first 5 characters of its SHA-1 hash are sent (k-anonymity).</text>
  ${box(70, 'Your browser tab', ['Password hashed locally', 'SHA-1: 5BAA61E4C9…', 'Match checked locally'], true)}
  ${box(490, 'Extension', ['Receives the 5-char', 'prefix only', 'No storage, no tracking'], false)}
  ${box(910, 'Have I Been Pwned', ['Returns all known', 'hashes for the prefix', '(padded response)'], false)}
  ${arrow(378, 482, '5BAA6')}
  ${arrow(798, 902, '5BAA6')}
  <text x="640" y="650" text-anchor="middle" font-family="${FONT}" font-size="22" fill="${MUTED}">Checked once, when you leave the field: never while you type.</text>
  <text x="640" y="690" text-anchor="middle" font-family="${FONT}" font-size="22" fill="${MUTED}">No account, no API key, open source.</text>
</svg>`;
};

const outputs = [
  ['promo/small-tile-440x280.png', smallTile()],
  ['promo/marquee-1400x560.png', marquee()],
  ['promo/screenshot-1-compromised-1280x800.png', screenshot({
    title: 'Warns you when a password was leaked',
    subtitle: 'A badge shows how many times it appears in known data breaches.',
    image: 'assets/pned_pwd.png',
  })],
  ['promo/screenshot-2-safe-1280x800.png', screenshot({
    title: 'Confirms when it is not in any known breach',
    subtitle: 'Works on every site: login, sign-up and "change password" forms.',
    image: 'assets/not_pwned_pwd.png',
  })],
  ['promo/screenshot-3-privacy-1280x800.png', privacy()],
];

mkdirSync('promo', { recursive: true });
for (const [path, svg] of outputs) {
  writeFileSync(path, new Resvg(svg, { fitTo: { mode: 'original' }, font: { loadSystemFonts: true } }).render().asPng());
  console.log(`✓ ${path}`);
}
copyFileSync('public/icons/icon-128.png', 'promo/store-icon-128x128.png');
console.log('✓ promo/store-icon-128x128.png');
