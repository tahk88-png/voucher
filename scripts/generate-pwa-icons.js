const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Create a simple colored square as placeholder icon
async function generateIcon(size, filename) {
  try {
    // Create a simple gradient background (FFC857 to darker shade)
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#FFC857;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#E6A845;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${size}" height="${size}" fill="url(#grad)"/>
        <circle cx="${size/2}" cy="${size/2}" r="${size/4}" fill="#2D2721" opacity="0.1"/>
        <text x="${size/2}" y="${size/2 + size/16}" font-family="Arial, sans-serif" font-size="${size/8}" fill="#2D2721" text-anchor="middle" font-weight="bold">V</text>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .png()
      .toFile(path.join(__dirname, '..', 'public', filename));

    console.log(`Generated ${filename}`);
  } catch (error) {
    console.error(`Error generating ${filename}:`, error);
  }
}

async function main() {
  await generateIcon(192, 'icon-192.png');
  await generateIcon(512, 'icon-512.png');
  console.log('PWA icons generated successfully!');
}

main().catch(console.error);