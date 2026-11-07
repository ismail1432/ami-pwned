// Renders assets/icon.svg (a 24×24 Lucide glyph) into the PNG icons the extension needs.
// Run via `npm run icons`; the PNGs in public/icons/ are committed, the build does not need this script.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const TILE_COLOR = '#C62828'; // same red as the "compromised" badge
const GLYPH_COLOR = '#FFFFFF';

// Toolbar sizes use a full-bleed tile. The 128px Store icon follows Google's
// guideline: 96×96 artwork centered with 16px of transparent padding.
const SIZES = [
  { size: 16, tile: 16, offset: 0 },
  { size: 32, tile: 32, offset: 0 },
  { size: 48, tile: 48, offset: 0 },
  { size: 128, tile: 96, offset: 16 },
];

const source = readFileSync('assets/icon.svg', 'utf8');
const glyph = source.replace(/^[\s\S]*?<svg[^>]*>|<\/svg>\s*$/g, '').replaceAll('currentColor', GLYPH_COLOR);

function compose({ size, tile, offset }) {
  const radius = tile * 0.22;
  const glyphSize = tile * 0.72;
  const glyphOffset = offset + (tile - glyphSize) / 2;
  // Thicker strokes at tiny sizes so the glyph survives downscaling.
  const strokeWidth = size <= 16 ? 2.6 : size <= 32 ? 2.3 : 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect x="${offset}" y="${offset}" width="${tile}" height="${tile}" rx="${radius}" fill="${TILE_COLOR}"/>
  <svg x="${glyphOffset}" y="${glyphOffset}" width="${glyphSize}" height="${glyphSize}" viewBox="0 0 24 24"
       fill="none" stroke="${GLYPH_COLOR}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${glyph}</svg>
</svg>`;
}

mkdirSync('public/icons', { recursive: true });
for (const spec of SIZES) {
  const png = new Resvg(compose(spec), { fitTo: { mode: 'original' } }).render().asPng();
  writeFileSync(`public/icons/icon-${spec.size}.png`, png);
  console.log(`✓ public/icons/icon-${spec.size}.png`);
}
