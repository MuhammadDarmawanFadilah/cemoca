const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configuration
const SOURCE_SVG = path.join(__dirname, '..', 'public', 'logo.svg');
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'icons');
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const APPLE_SIZE = 180;

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

async function generateIcons() {
  console.log('🔧 Generating Alumni PWA icons from logo.svg...');
  console.log('📍 Source logo:', SOURCE_SVG);

  if (!fs.existsSync(SOURCE_SVG)) {
    console.error('❌ Source logo.svg not found at', SOURCE_SVG);
    process.exit(1);
  }

  await ensureDir(OUTPUT_DIR);

  // Read SVG content
  const svgContent = await fs.promises.readFile(SOURCE_SVG);
  console.log('✅ Alumni logo.svg loaded successfully');

  // Generate SVG icons for better scalability and performance
  console.log('🎨 Generating SVG icons for alumni system...');
  for (const size of SIZES) {
    const svgPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.svg`);
    await fs.promises.copyFile(SOURCE_SVG, svgPath);
    console.log(`✅ Generated SVG ${svgPath}`);
  }

  // Generate maskable SVG versions
  for (const size of [192, 512]) {
    const svgPath = path.join(OUTPUT_DIR, `icon-${size}x${size}-maskable.svg`);
    await fs.promises.copyFile(SOURCE_SVG, svgPath);
    console.log(`✅ Generated maskable SVG ${svgPath}`);
  }

  // Apple touch icon SVG
  const appleSvgPath = path.join(OUTPUT_DIR, 'apple-touch-icon.svg');
  await fs.promises.copyFile(SOURCE_SVG, appleSvgPath);
  console.log(`✅ Generated Apple SVG ${appleSvgPath}`);

  // Generate PNG icons using sharp
  for (const size of SIZES) {
    const outPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
    await sharp(svgContent)
      .resize(size, size, { fit: 'contain', background: { r: 37, g: 99, b: 235, alpha: 1 } })
      .png()
      .toFile(outPath);
    console.log(`✅ Generated ${outPath}`);
  }

  // Generate maskable versions (with padding for safe zone)
  for (const size of [192, 512]) {
    const outPath = path.join(OUTPUT_DIR, `icon-${size}x${size}-maskable.png`);
    const padding = Math.round(size * 0.1); // 10% padding
    const paddedSize = size - padding * 2;

    const compositeBuffer = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 37, g: 99, b: 235, alpha: 1 }
      }
    })
      .composite([
        {
          input: await sharp(svgContent)
            .resize(paddedSize, paddedSize, { fit: 'contain' })
            .png()
            .toBuffer(),
          top: padding,
          left: padding
        }
      ])
      .png()
      .toBuffer();

    await sharp(compositeBuffer).toFile(outPath);
    console.log(`✅ Generated maskable ${outPath}`);
  }

  // Apple touch icon
  const applePath = path.join(OUTPUT_DIR, 'apple-touch-icon.png');
  await sharp(svgContent)
    .resize(APPLE_SIZE, APPLE_SIZE, { fit: 'contain', background: { r: 37, g: 99, b: 235, alpha: 1 } })
    .png()
    .toFile(applePath);
  console.log(`✅ Generated ${applePath}`);

  // Favicons 16 and 32
  for (const size of [16, 32]) {
    const favPath = path.join(OUTPUT_DIR, `favicon-${size}x${size}.png`);
    await sharp(svgContent)
      .resize(size, size, { fit: 'contain', background: { r: 37, g: 99, b: 235, alpha: 1 } })
      .png()
      .toFile(favPath);
    console.log(`✅ Generated ${favPath}`);
  }

  console.log('\n🎉 All Alumni PWA icons generated successfully from logo.svg');
  console.log('✅ SVG Icons: Better scalability and performance');
  console.log('✅ PNG Icons: Fallback compatibility');
  console.log('✅ Maskable Icons: Android adaptive support');
  console.log('✅ Apple Icons: iOS optimization');
  console.log('➡️  Icons ready for Alumni System PWA deployment');
}

generateIcons().catch(err => {
  console.error('❌ Error generating alumni icons:', err);
  process.exit(1);
});