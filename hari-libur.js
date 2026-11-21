// Hari libur (139-patch-hari-libur.sql, pemilik 2026-11-21): logika murni untuk kalender.html, jadwal-berhalangan.html, dan
// rapat.html; dites di Node (tests/js/hari_libur.test.mjs). Satu baris per tanggal: { tanggal 'YYYY-MM-DD', nama, jenis }.

export const JENIS_LIBUR = { nasional: 'Libur nasional', cuti_bersama: 'Cuti bersama', kampus: 'Libur kampus' };
export const RENTANG_MAKS = 31;   // hari: satu isian rentang (mis. libur akhir tahun kampus)

const dua = n => String(n).padStart(2, '0');
const sahIso = t => {
  const m = String(t || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
};
const tambah = (t, n) => new Date(Date.UTC(+t.slice(0, 4), +t.slice(5, 7) - 1, +t.slice(8, 10) + n)).toISOString().slice(0, 10);

/** Map 'YYYY-MM-DD' -> { nama, jenis }. */
export const petaLibur = rows => new Map((rows || []).map(r => [String(r.tanggal).slice(0, 10), { nama: r.nama, jenis: r.jenis || 'nasional' }]));

/** Tanggal yang bukan hari libur (urutan tetap). */
export const tanpaLibur = (tanggal, peta) => (tanggal || []).filter(t => !peta?.has(t));

/** Semua tanggal dari..sampai (inklusif); galat bila tidak sah atau lebih dari RENTANG_MAKS hari. */
export function tanggalAntara(dari, sampai = ''){
  const s = sampai || dari;
  if (!sahIso(dari) || !sahIso(s)) return { tanggal: [], galat: 'Tanggal tidak sah.' };
  if (s < dari) return { tanggal: [], galat: 'Tanggal sampai sebelum tanggal mulai.' };
  const out = [];
  for (let t = dari; t <= s; t = tambah(t, 1)) { out.push(t); if (out.length > RENTANG_MAKS) return { tanggal: [], galat: `Rentang paling lama ${RENTANG_MAKS} hari.` }; }
  return { tanggal: out, galat: '' };
}

// 'YYYY-MM-DD', 'DD/MM/YYYY', 'DD-MM-YYYY' -> ISO; '' bila tidak dikenali.
export function isoDariTeks(s){
  const t = String(s || '').trim();
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const iso = m ? `${m[1]}-${dua(m[2])}-${dua(m[3])}` : (m = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)) ? `${m[3]}-${dua(m[2])}-${dua(m[1])}` : '';
  return sahIso(iso) ? iso : '';
}
// 'cuti bersama' / 'Cuti_Bersama' / 'Libur kampus' -> kunci JENIS_LIBUR; kosong -> nasional; lain -> ''.
export function jenisDariTeks(s){
  const t = String(s || '').trim().toLowerCase().replace(/[\s_-]+/g, ' ');
  if (!t) return 'nasional';
  if (/cuti/.test(t)) return 'cuti_bersama';
  if (/kampus|universitas|prodi/.test(t)) return 'kampus';
  if (/nasional/.test(t)) return 'nasional';
  return '';
}
function pecahBaris(baris, sep){
  const out = []; let cur = '', kutip = false;
  for (let i = 0; i < baris.length; i++) {
    const c = baris[i];
    if (kutip) { if (c === '"' && baris[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') kutip = false; else cur += c; }
    else if (c === '"') kutip = true; else if (c === sep) { out.push(cur); cur = ''; } else cur += c;
  }
  out.push(cur);
  return out.map(x => x.trim());
}

/**
 * CSV hari libur: kolom tanggal;nama;jenis (pemisah ; atau ,; baris judul boleh ada). Tanggal sama dua kali = yang terakhir.
 * -> { baris: [{ tanggal, nama, jenis }], galat: ['baris n: ...'] }
 */
export function bacaCsvLibur(teks){
  const L = String(teks || '').replace(/^﻿/, '').split(/\r?\n/).filter(x => x.trim());
  if (!L.length) return { baris: [], galat: ['Berkas kosong.'] };
  const sep = (L[0].match(/;/g) || []).length >= (L[0].match(/,/g) || []).length ? ';' : ',';
  const peta = new Map(), galat = [];
  L.forEach((b, i) => {
    const [tg, nama = '', jenis = ''] = pecahBaris(b, sep);
    if (i === 0 && /tanggal/i.test(tg)) return;
    const t = isoDariTeks(tg), j = jenisDariTeks(jenis);
    if (!t) return galat.push(`baris ${i + 1}: tanggal "${tg}" tidak dikenali (pakai TTTT-BB-HH atau HH/BB/TTTT)`);
    if (nama.length < 2 || nama.length > 200) return galat.push(`baris ${i + 1}: nama libur 2-200 huruf`);
    if (!j) return galat.push(`baris ${i + 1}: jenis "${jenis}" (nasional, cuti bersama, atau kampus)`);
    peta.set(t, { tanggal: t, nama, jenis: j });
  });
  return { baris: [...peta.values()].sort((a, b) => a.tanggal.localeCompare(b.tanggal)), galat };
}

/** CSV ';' untuk diunduh (dan diimpor ulang). */
export function csvLibur(rows){
  const sel = v => /[;"\r\n]/.test(String(v ?? '')) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? '');
  return [['tanggal', 'nama', 'jenis'], ...[...(rows || [])].sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)))
    .map(r => [String(r.tanggal).slice(0, 10), r.nama, r.jenis])].map(r => r.map(sel).join(';')).join('\r\n') + '\r\n';
}
