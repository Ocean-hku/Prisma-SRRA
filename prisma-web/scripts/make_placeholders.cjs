const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../public/images');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

for (let i = 1; i <= 40; i++) {
  const dest = path.join(dir, `type_${i}.svg`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
    <rect width="100%" height="100%" fill="hsl(${i * 9}, 70%, 20%)" />
    <circle cx="200" cy="200" r="100" fill="hsl(${i * 9 + 45}, 80%, 60%)" />
    <text x="50%" y="50%" font-family="sans-serif" font-size="30" font-weight="bold" fill="white" text-anchor="middle" dy=".3em">Type ${i}</text>
  </svg>`;
  fs.writeFileSync(dest, svg);
}
console.log('SVG Placeholders created.');
