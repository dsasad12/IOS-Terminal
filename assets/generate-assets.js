/**
 * Run this script to generate placeholder PNG assets for development.
 * In production, replace with proper 1024x1024 icon and 1284x2778 splash.
 *
 * Usage: node assets/generate-assets.js
 */
const { createCanvas } = require('canvas');
const fs = require('fs');

function createIcon(size, outPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, size, size);

  // Green border
  ctx.strokeStyle = '#00ff41';
  ctx.lineWidth = size * 0.02;
  ctx.strokeRect(size * 0.05, size * 0.05, size * 0.9, size * 0.9);

  // HT text
  ctx.fillStyle = '#00ff41';
  ctx.font = `bold ${size * 0.4}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('HT', size / 2, size / 2);

  // Blinking cursor
  ctx.fillStyle = '#00ff41';
  ctx.fillRect(size * 0.55, size * 0.62, size * 0.1, size * 0.06);

  fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
  console.log(`Generated: ${outPath}`);
}

try {
  createIcon(1024, 'assets/icon.png');
  createIcon(1024, 'assets/adaptive-icon.png');
  createIcon(48, 'assets/favicon.png');
  createIcon(1024, 'assets/splash.png');
} catch (e) {
  console.log('canvas not available - assets need to be created manually');
}
