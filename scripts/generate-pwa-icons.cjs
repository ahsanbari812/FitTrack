const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '..', 'public');
const sourceIcon = path.join(__dirname, '..', 'assets', 'icon.png');
const sourceLogo = path.join(__dirname, '..', 'assets', 'app-logo.png');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function generateIcons() {
  console.log('Generating PWA icons from:', sourceIcon);
  const src = fs.existsSync(sourceIcon) ? sourceIcon : sourceLogo;

  // 1. icon-192.png
  await sharp(src)
    .resize(192, 192)
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('Created icon-192.png');

  // 2. icon-512.png
  await sharp(src)
    .resize(512, 512)
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('Created icon-512.png');

  // 3. apple-touch-icon.png (180x180)
  await sharp(src)
    .resize(180, 180)
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // 4. favicon.png (48x48)
  await sharp(src)
    .resize(48, 48)
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Created favicon.png');

  // 5. Maskable icons (192 & 512 with safe zone padding)
  await sharp(src)
    .resize(154, 154) // 80% of 192 for safe zone
    .extend({
      top: 19,
      bottom: 19,
      left: 19,
      right: 19,
      background: '#020617'
    })
    .toFile(path.join(publicDir, 'icon-maskable-192.png'));
  console.log('Created icon-maskable-192.png');

  await sharp(src)
    .resize(410, 410) // 80% of 512 for safe zone
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: '#020617'
    })
    .toFile(path.join(publicDir, 'icon-maskable-512.png'));
  console.log('Created icon-maskable-512.png');

  console.log('All PWA icons generated successfully!');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
