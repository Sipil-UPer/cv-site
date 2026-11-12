/* =====================================================================
   Menggambar spesifikasi grafik (led-data.js) menjadi PNG untuk LED.
   Canvas di browser; 1600 x 800 px supaya tajam saat dicetak 15 cm.
   Warna sama dengan situs (biru tua, biru muda, merah, hijau); kepuasan
   memakai urutan bermakna: hijau (sangat baik) sampai merah (kurang).
   ===================================================================== */
import { warna as warnaTema } from './tema.js?v=2026-11-12-713f9b';

const W = 1600, H = 800;
const PALET = () => [warnaTema('--biru'), warnaTema('--biru-3'), warnaTema('--merah'), warnaTema('--hijau'), warnaTema('--emas')];
const PALET_KEPUASAN = () => [warnaTema('--hijau'), warnaTema('--biru-3'), warnaTema('--emas'), warnaTema('--merah')];
const HURUF = "'Segoe UI', 'IBM Plex Sans', Arial, sans-serif";

function skalaRapi(maks){
  if (maks <= 0) return { atas: 1, langkah: 1 };
  const kasar = maks / 5;
  const p = 10 ** Math.floor(Math.log10(kasar));
  const langkah = [1, 2, 2.5, 5, 10].map(m => m * p).find(x => x >= kasar);
  return { atas: Math.ceil(maks / langkah) * langkah, langkah };
}

function pecah(ctx, teks, lebar){
  const kata = String(teks).split(' ');
  const baris = [''];
  for (const k of kata){
    const coba = baris[baris.length - 1] ? baris[baris.length - 1] + ' ' + k : k;
    if (ctx.measureText(coba).width > lebar && baris[baris.length - 1]) baris.push(k);
    else baris[baris.length - 1] = coba;
  }
  return baris.slice(0, 2);
}

export async function gambarGrafik(g){
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  const warna = g.satuan === '%' && g.seri.length === 4 ? PALET_KEPUASAN() : PALET();
  const fmt = v => g.desimal ? v.toFixed(g.desimal).replace('.', ',') : String(Math.round(v * 100) / 100);
  c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, W, H);

  // judul dan legenda
  c.fillStyle = warnaTema('--ink'); c.font = `600 36px ${HURUF}`; c.textBaseline = 'top';
  c.fillText(g.judul, 60, 34);
  let lx = 60;
  c.font = `26px ${HURUF}`;
  g.seri.forEach((s, i) => {
    c.fillStyle = warna[i % warna.length]; c.fillRect(lx, 96, 26, 26);
    c.fillStyle = '#3F4A55'; c.fillText(s.nama, lx + 36, 95);
    lx += 36 + c.measureText(s.nama).width + 40;
  });

  // area plot
  const kiri = 130, kanan = W - 50, atas = 160, bawah = H - 120;
  const n = g.kategori.length;
  const total = i => g.seri.reduce((a, s) => a + s.nilai[i], 0);
  const maks = g.maks ?? (g.mode === 'tumpuk'
    ? Math.max(...g.kategori.map((_, i) => total(i)))
    : Math.max(...g.seri.flatMap(s => s.nilai)));
  const { atas: yMax, langkah } = g.maks ? { atas: g.maks, langkah: 20 } : skalaRapi(maks);
  const y = v => bawah - (v / yMax) * (bawah - atas);

  c.font = `24px ${HURUF}`; c.textBaseline = 'middle'; c.textAlign = 'right';
  for (let v = 0; v <= yMax + 1e-9; v += langkah){
    c.strokeStyle = v ? '#E3E8EC' : '#9AA5B1'; c.lineWidth = v ? 1.5 : 2;
    c.beginPath(); c.moveTo(kiri, y(v)); c.lineTo(kanan, y(v)); c.stroke();
    c.fillStyle = warnaTema('--muted'); c.fillText(fmt(v) + (g.satuan === '%' ? '%' : ''), kiri - 14, y(v));
  }

  const lebarKat = (kanan - kiri) / n;
  const lebarBatang = g.mode === 'tumpuk' ? lebarKat * 0.5 : lebarKat * 0.7 / g.seri.length;
  c.textAlign = 'center';
  g.kategori.forEach((kat, i) => {
    const x0 = kiri + i * lebarKat;
    if (g.mode === 'tumpuk'){
      let dasar = 0;
      const xb = x0 + (lebarKat - lebarBatang) / 2;
      g.seri.forEach((s, j) => {
        const v = s.nilai[i]; if (!v) return;
        c.fillStyle = warna[j % warna.length];
        c.fillRect(xb, y(dasar + v), lebarBatang, y(dasar) - y(dasar + v));
        if (y(dasar) - y(dasar + v) > 30){
          c.fillStyle = '#FFFFFF'; c.font = `600 22px ${HURUF}`;
          c.fillText(fmt(v), xb + lebarBatang / 2, (y(dasar) + y(dasar + v)) / 2);
        }
        dasar += v;
      });
      if (g.satuan !== '%'){
        c.fillStyle = warnaTema('--ink'); c.font = `600 26px ${HURUF}`;
        c.fillText(fmt(dasar), xb + lebarBatang / 2, y(dasar) - 20);
      }
    } else {
      const x1 = x0 + (lebarKat - lebarBatang * g.seri.length) / 2;
      g.seri.forEach((s, j) => {
        const v = s.nilai[i], xb = x1 + j * lebarBatang;
        c.fillStyle = warna[j % warna.length];
        c.fillRect(xb + 4, y(v), lebarBatang - 8, bawah - y(v));
        c.fillStyle = warnaTema('--ink'); c.font = `600 24px ${HURUF}`;
        c.fillText(fmt(v), xb + lebarBatang / 2, y(v) - 18);
      });
    }
    c.fillStyle = '#3F4A55'; c.font = `24px ${HURUF}`;
    pecah(c, kat, lebarKat - 10).forEach((b, k) => c.fillText(b, x0 + lebarKat / 2, bawah + 32 + k * 30));
  });

  const blob = await new Promise(ok => cv.toBlob(ok, 'image/png'));
  return { buf: await blob.arrayBuffer(), w: W, h: H };
}
