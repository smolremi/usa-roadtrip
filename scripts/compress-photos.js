/*
 * Kompresja zdjęć z relacji z podróży.
 *
 *  1. Kopiuje CAŁY folder assets/photos -> assets/photos-original (backup).
 *     Jeśli backup już istnieje, krok jest pomijany (nie nadpisujemy kopii).
 *  2. Przechodzi przez assets/photos/dzien-01 ... dzien-12 i dla każdego
 *     pliku .jpg / .jpeg:
 *       - zmniejsza do maks. szerokości 1800 px (bez powiększania mniejszych),
 *       - zapisuje jako JPEG jakości 78,
 *       - nadpisuje oryginalny plik.
 *     .rotate() bez argumentu "wypala" orientację z EXIF w piksele, więc po
 *     usunięciu metadanych zdjęcie wygląda tak samo jak przed kompresją.
 *  3. Wypisuje łączną wagę przed / po oraz procent oszczędności.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const PHOTOS_DIR = path.join(ROOT, 'assets/photos');
const BACKUP_DIR = path.join(ROOT, 'assets/photos-original');

const MAX_WIDTH = 1800;
const JPEG_QUALITY = 78;

const isJpeg = (name) => /\.jpe?g$/i.test(name);
const toMB = (bytes) => (bytes / (1024 * 1024));

function dirSizeOfJpegs(dir) {
  let total = 0;
  for (const day of fs.readdirSync(dir)) {
    const dayPath = path.join(dir, day);
    if (!fs.statSync(dayPath).isDirectory()) continue;
    for (const file of fs.readdirSync(dayPath)) {
      if (isJpeg(file)) total += fs.statSync(path.join(dayPath, file)).size;
    }
  }
  return total;
}

function backupPhotos() {
  if (fs.existsSync(BACKUP_DIR)) {
    console.log('Backup assets/photos-original już istnieje — pomijam kopiowanie.');
    return;
  }
  console.log('Kopiuję assets/photos -> assets/photos-original ...');
  fs.cpSync(PHOTOS_DIR, BACKUP_DIR, { recursive: true });
  console.log('Backup gotowy.\n');
}

async function compressAll() {
  let processed = 0;
  for (let d = 1; d <= 12; d++) {
    const dayDir = path.join(PHOTOS_DIR, 'dzien-' + String(d).padStart(2, '0'));
    if (!fs.existsSync(dayDir)) {
      console.log('  (brak folderu ' + path.basename(dayDir) + ' — pomijam)');
      continue;
    }
    const files = fs.readdirSync(dayDir).filter(isJpeg).sort();
    for (const file of files) {
      const filePath = path.join(dayDir, file);
      const input = fs.readFileSync(filePath);
      const output = await sharp(input)
        .rotate()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: JPEG_QUALITY })
        .toBuffer();
      fs.writeFileSync(filePath, output);
      processed++;
    }
    console.log('  dzien-' + String(d).padStart(2, '0') + ': ' + files.length + ' zdjęć');
  }
  return processed;
}

(async () => {
  backupPhotos();

  const before = dirSizeOfJpegs(PHOTOS_DIR);
  const count = await compressAll();
  const after = dirSizeOfJpegs(PHOTOS_DIR);

  const savedPct = before > 0 ? ((before - after) / before) * 100 : 0;

  console.log('\n========== PODSUMOWANIE ==========');
  console.log('Przetworzonych zdjęć:  ' + count);
  console.log('Waga PRZED kompresją:  ' + toMB(before).toFixed(2) + ' MB');
  console.log('Waga PO kompresji:     ' + toMB(after).toFixed(2) + ' MB');
  console.log('Zaoszczędzono:         ' + toMB(before - after).toFixed(2) + ' MB  (' + savedPct.toFixed(1) + '%)');
  console.log('==================================');
})().catch((err) => {
  console.error('BŁĄD:', err);
  process.exit(1);
});
