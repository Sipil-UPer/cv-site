// Peta Analisis Capaian Pembelajaran untuk RPS K26 (pemilik 2026-11-18, tahap 3): digambar otomatis dari hubungan
// antar-Sub-CPMK yang ditandai dosen (Panduan Pengisian RPS 3.2.1). Tanpa DOM: menghasilkan SVG (teks) dan dites di Node.
//
// rps.peta = { sub: { <kode Sub-CPMK>: { ke: <kode Sub-CPMK atau CPMK>, jenis } }, entry: 'kemampuan awal' }
//   jenis 'hierarkikal'  ke = Sub-CPMK/CPMK di atasnya; ia prasyarat mutlak (vertikal, panah ke atas)
//         'prosedural'   ke = langkah berikutnya, setingkat (mendatar, panah ke kanan)
//         'kelompok'     setara dengan Sub-CPMK lain yang menuju ke tempat yang sama (garis tanpa panah)
// Tanpa isian: Sub-CPMK menuju CPMK induknya (hierarkikal).

export const JENIS_PETA = [['hierarkikal', 'Hierarkikal (prasyarat)'], ['prosedural', 'Prosedural (urutan)'], ['kelompok', 'Pengelompokan (setara)']];
const L = 176, T = 64, GX = 22, GY = 46, TEPI = 16;   // lebar, tinggi kotak, jarak antarkotak, tepi (px)
const xe = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Hubungan yang sah per Sub-CPMK: {kode: {ke, jenis}}; tujuan tidak dikenal atau melingkar -> CPMK induk (hierarkikal). */
export function relasiPeta(struktur, peta = {}){
  const S = struktur?.sub || [], C = new Set((struktur?.cpmk || []).map(c => c.kode)), kodeSub = new Set(S.map(s => s.kode));
  const out = {}, melingkar = [];
  for (const s of S) {
    const r = peta?.sub?.[s.kode] || {};
    let ke = r.ke, jenis = JENIS_PETA.some(j => j[0] === r.jenis) ? r.jenis : 'hierarkikal';
    if (!(kodeSub.has(ke) || C.has(ke)) || ke === s.kode) { ke = s.cpmk; jenis = 'hierarkikal'; }
    if (C.has(ke) && jenis === 'prosedural') jenis = 'hierarkikal';   // langkah terakhir menuju CPMK = di bawahnya
    out[s.kode] = { ke, jenis };
  }
  for (const s of S) {   // putus lingkaran: telusuri tujuan sampai CPMK
    const lihat = new Set([s.kode]);
    for (let k = out[s.kode].ke; kodeSub.has(k); k = out[k].ke) {
      if (lihat.has(k)) { melingkar.push(s.kode); out[s.kode] = { ke: s.cpmk, jenis: 'hierarkikal' }; break; }
      lihat.add(k);
    }
  }
  return { relasi: out, melingkar };
}

/**
 * Usulan hubungan (pemilik 2026-11-19, tombol "Usulkan hubungan"), per CPMK:
 *  - tingkat Bloom C lebih rendah = prasyarat (hierarkikal) bagi Sub-CPMK pertama di tingkat berikutnya;
 *  - setingkat: urut pekan pertama di rencana pekanan; pekan lebih awal = prosedural menuju langkah berikutnya,
 *    mulai di pekan yang sama (atau belum dijadwalkan) = pengelompokan dengan anggota pertama langkah itu;
 *  - tingkat tertinggi menuju CPMK; Sub-CPMK tanpa kode C1-C6 menuju CPMK (dilaporkan di tanpaBloom).
 * bloomC(rumusan) -> 0..6 dan rentang(teks pekan) -> [n] dari rps.js (disuntikkan supaya modul ini tetap mandiri).
 * Hasil { sub: {kode: {ke, jenis}}, tanpaBloom: [kode] }; panah hanya naik tingkat atau maju pekan, jadi tanpa lingkaran.
 */
export function usulPeta(struktur, pekan = [], { bloomC, rentang }){
  const S = struktur?.sub || [], sub = {}, tanpaBloom = [];
  const awal = {};
  for (const p of pekan || []) {
    if (p.jenis && p.jenis !== 'kuliah') continue;
    const n = Math.min(...rentang(p.pekan));
    if (!Number.isFinite(n)) continue;
    for (const k of p.sub || []) awal[k] = Math.min(awal[k] ?? Infinity, n);
  }
  for (const c of struktur?.cpmk || []) {
    const xs = S.map((s, i) => ({ s, i, lv: bloomC(s.rumusan), pk: awal[s.kode] ?? Infinity })).filter(x => x.s.cpmk === c.kode);
    for (const x of xs.filter(x => !x.lv)) { tanpaBloom.push(x.s.kode); sub[x.s.kode] = { ke: c.kode, jenis: 'hierarkikal' }; }
    const tingkat = [...new Set(xs.filter(x => x.lv).map(x => x.lv))].sort((a, b) => a - b);
    // langkah per tingkat: [[x, ...] per pekan pertama], urut pekan lalu urutan Sub-CPMK
    const langkah = tingkat.map(lv => {
      const ys = xs.filter(x => x.lv === lv).sort((a, b) => a.pk - b.pk || a.i - b.i), out = [];
      for (const y of ys) (out.length && out.at(-1)[0].pk === y.pk ? out.at(-1) : out[out.push([]) - 1]).push(y);
      return out;
    });
    langkah.forEach((ls, t) => ls.forEach((grup, j) => {
      const [tuju, jenis] = j < ls.length - 1 ? [ls[j + 1][0].s.kode, 'prosedural']
        : t < langkah.length - 1 ? [langkah[t + 1][0][0].s.kode, 'hierarkikal'] : [c.kode, 'hierarkikal'];
      grup.forEach((y, m) => { sub[y.s.kode] = { ke: tuju, jenis: m ? 'kelompok' : jenis }; });
    }));
  }
  return { sub, tanpaBloom };
}

const potong = (t, n) => (t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t);
/** Rumusan pendek dua baris (tanpa "Mahasiswa mampu", kode Bloom tetap). */
function ringkas(rumusan){
  const t = String(rumusan || '').replace(/^\s*mahasiswa\s+mampu\s+/i, '').replace(/\s+/g, ' ').trim();
  const kata = t.split(' '), b = ['', ''];
  let i = 0;
  for (const w of kata) { if ((b[i] + ' ' + w).trim().length > 30 && i === 0) i = 1; b[i] = (b[i] + ' ' + w).trim(); }
  return [b[0], potong(b[1], 30)];
}

/**
 * Tata letak dan SVG. Hasil { svg, w, h, simpul: {kode: {x, y}} }. CPMK di puncak; Sub-CPMK di bawah tujuannya
 * (hierarkikal/kelompok) atau di kiri tujuannya pada tingkat yang sama (prosedural).
 */
export function petaSvg(struktur, peta = {}, entry = ''){
  const S = struktur?.sub || [], C = struktur?.cpmk || [];
  const { relasi } = relasiPeta(struktur, peta);
  const anak = k => S.filter(s => relasi[s.kode].ke === k && relasi[s.kode].jenis !== 'prosedural').map(s => s.kode);
  const pendahulu = k => S.filter(s => relasi[s.kode].ke === k && relasi[s.kode].jenis === 'prosedural').map(s => s.kode);
  const tingkat = {};
  const aturTingkat = (k, t) => { tingkat[k] = t; for (const p of pendahulu(k)) aturTingkat(p, t); for (const a of anak(k)) aturTingkat(a, t + 1); };
  C.forEach(c => aturTingkat(c.kode, 0));
  const lebarSendiri = k => Math.max(L, anak(k).reduce((a, c, i) => a + lebar(c) + (i ? GX : 0), 0));
  const lebar = k => pendahulu(k).reduce((a, p) => a + lebar(p) + GX, 0) + lebarSendiri(k);
  const pos = {};
  const tempat = (k, x0) => {
    let x = x0;
    for (const p of pendahulu(k)) { tempat(p, x); x += lebar(p) + GX; }
    const own = lebarSendiri(k), ws = anak(k).reduce((a, c, i) => a + lebar(c) + (i ? GX : 0), 0);
    let cx = x + (own - ws) / 2;
    for (const c of anak(k)) { tempat(c, cx); cx += lebar(c) + GX; }
    pos[k] = { x: x + own / 2, y: TEPI + tingkat[k] * (T + GY) };
  };
  let x = TEPI;
  for (const c of C) { tempat(c.kode, x); x += lebar(c.kode) + GX * 2; }
  const dalam = Math.max(0, ...Object.values(tingkat));
  const w = Math.max(L + 2 * TEPI, x - GX * 2 + TEPI), garisY = TEPI + (dalam + 1) * (T + GY) - GY / 2;
  const h = garisY + 22 + (entry ? 44 : 0);
  const kotak = (k, judul, rum, cp) => {
    const p = pos[k]; if (!p) return '';
    const [b1, b2] = ringkas(rum), x0 = p.x - L / 2;
    return `<rect x="${x0}" y="${p.y}" width="${L}" height="${T}" rx="5" fill="${cp ? '#DCE6F0' : '#FFFFFF'}" stroke="${cp ? '#1F3863' : '#006FC0'}" stroke-width="1.4"/>` +
      `<text x="${p.x}" y="${p.y + 17}" text-anchor="middle" font-size="11.5" font-weight="bold" fill="#1F3863">${xe(judul)}</text>` +
      `<text x="${p.x}" y="${p.y + 34}" text-anchor="middle" font-size="10" fill="#222">${xe(b1)}</text>` +
      `<text x="${p.x}" y="${p.y + 48}" text-anchor="middle" font-size="10" fill="#222">${xe(b2)}</text>`;
  };
  const garis = [];
  for (const s of S) {
    const r = relasi[s.kode], a = pos[s.kode], b = pos[r.ke];
    if (!a || !b) continue;
    if (r.jenis === 'prosedural') garis.push(`<line x1="${a.x + L / 2}" y1="${a.y + T / 2}" x2="${b.x - L / 2 - 2}" y2="${b.y + T / 2}" stroke="#333" stroke-width="1.3" marker-end="url(#panah)"/>`);
    else {
      const my = (a.y + b.y + T) / 2;
      garis.push(`<path d="M${a.x},${a.y} V${my} H${b.x} V${b.y + T + (r.jenis === 'kelompok' ? 0 : 2)}" fill="none" stroke="#333" stroke-width="1.3"${
        r.jenis === 'kelompok' ? '' : ' marker-end="url(#panah)"'}/>`);
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="Arial, Helvetica, sans-serif">` +
    `<defs><marker id="panah" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="#333"/></marker></defs>` +
    `<rect width="${w}" height="${h}" fill="#FFFFFF"/>${garis.join('')}` +
    C.map(c => kotak(c.kode, c.kode, c.rumusan, true)).join('') + S.map(s => kotak(s.kode, s.kode, s.rumusan, false)).join('') +
    `<line x1="${TEPI}" y1="${garisY}" x2="${w - TEPI}" y2="${garisY}" stroke="#C00000" stroke-width="1.2" stroke-dasharray="6 4"/>` +
    `<text x="${TEPI}" y="${garisY + 15}" font-size="10" fill="#C00000">Garis entry behaviour (kemampuan awal)</text>` +
    (entry ? `<text x="${w / 2}" y="${garisY + 36}" text-anchor="middle" font-size="10.5" fill="#222">${xe(potong(String(entry), 140))}</text>` : '') + '</svg>';
  return { svg, w: Math.round(w), h: Math.round(h), simpul: pos };
}
