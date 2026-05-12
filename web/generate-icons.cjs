/**
 * Generates PNG icons for the PWA using Canvas API.
 * Run: node generate-icons.js
 * Requires: npm install canvas (dev only)
 */

// Inline SVG → PNG via canvas if available, otherwise generate placeholder HTML
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'public/icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

// Generate a simple SVG icon and save as .svg (browsers can use SVG icons too)
function genSVG(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0a0a0a"/>
  <rect x="${size*0.06}" y="${size*0.06}" width="${size*0.88}" height="${size*0.88}"
        fill="none" stroke="#00ff41" stroke-width="${size*0.025}" rx="${size*0.08}"/>
  <text x="${size/2}" y="${size*0.48}"
        font-family="Courier New, monospace"
        font-size="${size*0.28}"
        font-weight="bold"
        fill="#00ff41"
        text-anchor="middle"
        dominant-baseline="middle">HT</text>
  <rect x="${size*0.53}" y="${size*0.61}" width="${size*0.1}" height="${size*0.07}" fill="#00ff41"/>
  <text x="${size/2}" y="${size*0.82}"
        font-family="Courier New, monospace"
        font-size="${size*0.07}"
        fill="#005511"
        text-anchor="middle">HACKTERM</text>
</svg>`;
}

// Save SVG icons
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), genSVG(512));
fs.writeFileSync(path.join(iconsDir, 'icon-192.svg'), genSVG(192));

// Try to use canvas to generate PNGs
try {
  const { createCanvas } = require('canvas');

  function drawIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, size, size);

    // Border
    ctx.strokeStyle = '#00ff41';
    ctx.lineWidth = size * 0.025;
    const r = size * 0.08;
    const m = size * 0.06;
    ctx.beginPath();
    ctx.roundRect(m, m, size - m*2, size - m*2, r);
    ctx.stroke();

    // Glow effect
    ctx.shadowColor = '#00ff41';
    ctx.shadowBlur = size * 0.03;

    // HT text
    ctx.fillStyle = '#00ff41';
    ctx.font = `bold ${size * 0.28}px "Courier New"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HT', size / 2, size * 0.44);

    // Cursor block
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00ff41';
    ctx.fillRect(size * 0.53, size * 0.61, size * 0.1, size * 0.065);

    // Subtitle
    ctx.fillStyle = '#005511';
    ctx.font = `${size * 0.07}px "Courier New"`;
    ctx.fillText('HACKTERM', size / 2, size * 0.82);

    return canvas;
  }

  const sizes = [16, 32, 48, 72, 96, 120, 144, 152, 180, 192, 384, 512];
  for (const size of sizes) {
    const canvas = drawIcon(size);
    const buf = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), buf);
    console.log(`Generated icon-${size}.png`);
  }

  // Splash screen (828x1792 = iPhone 11/12/13 portrait)
  const splash = createCanvas(828, 1792);
  const sctx = splash.getContext('2d');
  sctx.fillStyle = '#0a0a0a';
  sctx.fillRect(0, 0, 828, 1792);

  // Center icon
  const iconSize = 200;
  const iconCanvas = drawIcon(iconSize);
  sctx.drawImage(iconCanvas, (828 - iconSize) / 2, (1792 - iconSize) / 2 - 60);

  // Text
  sctx.fillStyle = '#00ff41';
  sctx.font = 'bold 28px "Courier New"';
  sctx.textAlign = 'center';
  sctx.fillText('HACKTERM', 414, 1792/2 + 100);
  sctx.fillStyle = '#005511';
  sctx.font = '16px "Courier New"';
  sctx.fillText('iOS Linux Terminal v1.0.0', 414, 1792/2 + 130);

  fs.writeFileSync(path.join(iconsDir, 'splash.png'), splash.toBuffer('image/png'));
  console.log('Generated splash.png');

  console.log('\n✓ All icons generated in public/icons/');
} catch (e) {
  console.log('canvas not available. Saving SVG icons only.');
  console.log('To generate PNG icons: npm install canvas && node generate-icons.js');
  console.log('Or use any tool to convert icon.svg to PNG at 192x192 and 512x512');
  console.log('\nSVG icons saved to public/icons/ - rename to .png for basic PWA support');

  // Create placeholder PNGs via data URI encoding trick
  // (minimal 1px transparent PNG as placeholder)
  const placeholder192 = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), placeholder192);
  fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), placeholder192);
  fs.writeFileSync(path.join(iconsDir, 'splash.png'), placeholder192);
  console.log('\nPlaceholder PNGs created. Replace with real icons for production.');
}
