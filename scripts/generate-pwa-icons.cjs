const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'public');
const assetsDir = path.join(__dirname, '..', 'assets');

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

/**
 * Generates an SVG string for the FitTrack icon.
 * @param {number} size Output size in pixels
 * @param {boolean} fullBleed True for maskable and standard full-bleed app tiles
 * @param {number} rx Corner radius if fullBleed is false
 */
function getIconSvg(size, fullBleed = true, rx = 0) {
  const bg = fullBleed
    ? `<rect width="96" height="96" fill="#151A1F"/>`
    : `<rect width="96" height="96" rx="${rx}" fill="#151A1F"/>`;

  return Buffer.from(`
    <svg width="${size}" height="${size}" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
      ${bg}
      <g transform="translate(23, 23) scale(2.083)" fill="none" stroke="#C7F000" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z"/>
        <path d="m2.5 21.5 1.4-1.4"/>
        <path d="m20.1 3.9 1.4-1.4"/>
        <path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z"/>
        <path d="m9.6 14.4 4.8-4.8"/>
      </g>
    </svg>
  `);
}

async function run() {
  console.log('Generating pristine PWA and mobile assets...');

  // 1. Maskable Icons (Must be 100% full-bleed so Android adaptive mask cuts clean edges)
  await sharp(getIconSvg(512, true))
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-512.png'));
  console.log('✓ Created public/icon-maskable-512.png (512x512 full-bleed)');

  await sharp(getIconSvg(192, true))
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-192.png'));
  console.log('✓ Created public/icon-maskable-192.png (192x192 full-bleed)');

  // 2. Standard Any Icons (Full-bleed #151A1F prevents any black notches or clipping artifacts)
  await sharp(getIconSvg(512, true))
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✓ Created public/icon-512.png (512x512 full-bleed)');

  await sharp(getIconSvg(192, true))
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✓ Created public/icon-192.png (192x192 full-bleed)');

  // 3. Apple Touch Icon (180x180 full-bleed required by iOS Safari)
  await sharp(getIconSvg(180, true))
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Created public/apple-touch-icon.png (180x180 full-bleed)');

  // 4. Favicon (48x48)
  await sharp(getIconSvg(48, false, 14))
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('✓ Created public/favicon.png (48x48)');

  // 5. Assets for Expo/Native mobile
  await sharp(getIconSvg(1024, true))
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));
  console.log('✓ Created assets/icon.png (1024x1024 full-bleed)');

  await sharp(getIconSvg(1024, true))
    .png()
    .toFile(path.join(assetsDir, 'adaptive-icon.png'));
  console.log('✓ Created assets/adaptive-icon.png (1024x1024 full-bleed)');

  await sharp(getIconSvg(1024, false, 280))
    .png()
    .toFile(path.join(assetsDir, 'splash-icon.png'));
  console.log('✓ Created assets/splash-icon.png (1024x1024 badge)');

  await sharp(getIconSvg(48, false, 14))
    .png()
    .toFile(path.join(assetsDir, 'favicon.png'));
  console.log('✓ Created assets/favicon.png (48x48)');

  console.log('All icons generated successfully!');
}

run().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
