const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

async function generateLogoMen() {
  const srcPath = 'apps/customer-web/src/assets/logo-transparent.png';
  const img = await Jimp.read(srcPath);
  const w = img.bitmap.width;
  const h = img.bitmap.height;

  // Let's identify each connected component as before
  const visited = new Uint8Array(w * h);
  const pixelToComp = new Int32Array(w * h).fill(-1);
  const components = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (img.bitmap.data[idx + 3] < 20 || visited[y * w + x]) continue;

      let minX = x, maxX = x, minY = y, maxY = y;
      let count = 0;
      const compPixels = [];
      const queue = [x, y];
      visited[y * w + x] = 1;

      while (queue.length > 0) {
        const cy = queue.pop();
        const cx = queue.pop();
        compPixels.push(cy * w + cx);
        count++;

        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        const neighbors = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1]
        ];

        for (const [nx, ny] of neighbors) {
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const npos = ny * w + nx;
            if (!visited[npos]) {
              const nidx = npos * 4;
              if (img.bitmap.data[nidx + 3] >= 20) {
                visited[npos] = 1;
                queue.push(nx, ny);
              }
            }
          }
        }
      }

      const compId = components.length;
      for (const p of compPixels) {
        pixelToComp[p] = compId;
      }
      components.push({ id: compId, minX, maxX, minY, maxY, count, width: maxX - minX + 1, height: maxY - minY + 1 });
    }
  }

  // Classify each component
  for (const c of components) {
    if (c.minY < 55) {
      c.type = '3-DASHES'; // 3 dashes above scissor -> WHITE
    } else if (c.minY >= 50 && c.maxY <= 210 && c.minX >= 420 && c.maxX <= 580 && c.count > 1000) {
      c.type = 'SCISSOR'; // Scissor -> BLACK
    } else if (c.minX < 185 && c.minY >= 100 && c.maxY < 335) {
      c.type = 'S'; // S -> BLACK
    } else if (c.minX >= 185 && c.maxX <= 330 && c.minY >= 100 && c.maxY < 335) {
      c.type = 'L'; // L -> BLACK
    } else if (c.minX >= 680 && c.minY >= 100 && c.maxY < 335) {
      c.type = 'N'; // N -> BLACK
    } else if (c.minY >= 335) {
      c.type = 'TAGLINE'; // Tagline -> BLACK
    } else {
      c.type = 'OO'; // OO infinity ribbon, faces, silhouettes -> WHITE
    }
    console.log(`Comp ${c.id}: type=${c.type}, count=${c.count}, x=[${c.minX}..${c.maxX}], y=[${c.minY}..${c.maxY}]`);
  }

  // Create new image for logo-men
  // Pure black: 18, 18, 18 (rich pitch black)
  // Pure white: 255, 255, 255
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ppos = y * w + x;
      const idx = ppos * 4;
      const a = img.bitmap.data[idx + 3];
      if (a < 15) {
        img.bitmap.data[idx + 3] = 0;
        continue;
      }

      const compId = pixelToComp[ppos];
      const comp = compId >= 0 ? components[compId] : null;
      const type = comp ? comp.type : 'OO';

      if (type === 'S' || type === 'L' || type === 'N' || type === 'SCISSOR' || type === 'TAGLINE') {
        // BLACK
        img.bitmap.data[idx] = 18;
        img.bitmap.data[idx + 1] = 18;
        img.bitmap.data[idx + 2] = 18;
      } else {
        // WHITE (OO infinity + faces + 3 dashes above scissor)
        img.bitmap.data[idx] = 255;
        img.bitmap.data[idx + 1] = 255;
        img.bitmap.data[idx + 2] = 255;
      }
    }
  }

  // Save to target locations
  const targets = [
    'apps/customer-web/src/assets/logo-men.png',
    'apps/customer-web/public/logo-men.png',
    'public/logo-men.png',
    'apps/partner-web/src/assets/logo-men.png',
    'apps/partner-web/public/logo-men.png',
    'apps/admin-web/src/assets/logo-men.png',
    'apps/admin-web/public/logo-men.png'
  ];

  for (const t of targets) {
    const full = path.join(__dirname, '..', t);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    await img.write(full);
    console.log('Saved:', t);
  }

  console.log('Done generating logo-men.png!');
}

generateLogoMen().catch(console.error);
