const fs = require('fs');
const path = require('path');

// Configuration
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'icons');
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const APPLE_SIZE = 180;

// Alumni theme colors
const ALUMNI_BLUE = '#2563eb';
const ALUMNI_GRAY = '#64748b';

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

function generateSvgIcon(size, color = ALUMNI_BLUE) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="${color}" rx="${size * 0.1}"/>
    <g transform="translate(${size * 0.2}, ${size * 0.2})">
      <circle cx="${size * 0.3}" cy="${size * 0.25}" r="${size * 0.08}" fill="white"/>
      <path d="M${size * 0.15} ${size * 0.4} Q${size * 0.3} ${size * 0.35} ${size * 0.45} ${size * 0.4} 
               Q${size * 0.45} ${size * 0.5} ${size * 0.3} ${size * 0.55} 
               Q${size * 0.15} ${size * 0.5} ${size * 0.15} ${size * 0.4}Z" fill="white"/>
      <rect x="${size * 0.1}" y="${size * 0.6}" width="${size * 0.4}" height="${size * 0.02}" fill="white"/>
      <rect x="${size * 0.1}" y="${size * 0.65}" width="${size * 0.3}" height="${size * 0.02}" fill="white"/>
    </g>
    <text x="${size/2}" y="${size * 0.9}" font-family="Arial, sans-serif" font-size="${size * 0.08}" 
          fill="white" text-anchor="middle" font-weight="bold">ALUMNI</text>
  </svg>`;
}

async function createPwaIcons() {
  console.log('🔧 Creating Alumni PWA icons (fallback method)...');

  await ensureDir(OUTPUT_DIR);

  // Generate standard icons
  for (const size of SIZES) {
    const svgContent = generateSvgIcon(size);
    const iconPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
    
    // Write SVG to temp file and convert to PNG using Node.js
    const tempSvgPath = path.join(OUTPUT_DIR, `temp-${size}.svg`);
    await fs.promises.writeFile(tempSvgPath, svgContent);
    
    // For now, create an SVG version (can be converted to PNG later with sharp)
    const svgIconPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.svg`);
    await fs.promises.writeFile(svgIconPath, svgContent);
    
    // Clean up temp file
    await fs.promises.unlink(tempSvgPath);
    
    console.log(`✅ Generated ${svgIconPath}`);
  }

  // Generate maskable versions
  for (const size of [192, 512]) {
    const svgContent = generateSvgIcon(size, ALUMNI_BLUE);
    const maskablePath = path.join(OUTPUT_DIR, `icon-${size}x${size}-maskable.svg`);
    await fs.promises.writeFile(maskablePath, svgContent);
    console.log(`✅ Generated maskable ${maskablePath}`);
  }

  // Apple touch icon
  const appleSvg = generateSvgIcon(APPLE_SIZE);
  const applePath = path.join(OUTPUT_DIR, 'apple-touch-icon.svg');
  await fs.promises.writeFile(applePath, appleSvg);
  console.log(`✅ Generated ${applePath}`);

  // Favicons
  for (const size of [16, 32]) {
    const faviconSvg = generateSvgIcon(size);
    const faviconPath = path.join(OUTPUT_DIR, `favicon-${size}x${size}.svg`);
    await fs.promises.writeFile(faviconPath, faviconSvg);
    console.log(`✅ Generated ${faviconPath}`);
  }

  console.log('\n🎉 Alumni PWA icons created successfully (SVG format)');
  console.log('💡 To convert to PNG, install sharp: npm install sharp');
  console.log('💡 Then run: node scripts/generate-icons-from-logo.js');
}

createPwaIcons().catch(err => {
  console.error('❌ Error creating alumni icons:', err);
  process.exit(1);
});
