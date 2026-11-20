// Pemakaian halaman ruang kerja (133-patch-pemakaian-halaman.sql, pemilik 2026-11-20): gabungkan daftar halaman di menu
// (menu.js MODUL) dengan rekap pemakaian_rekap(), supaya halaman yang tidak pernah dibuka terlihat. Fungsi murni.

export const berkasDari = href => String(href || '').split(/[?#]/)[0].split('/').pop() || 'index.html';
// Halaman di menu yang memakai kerangka publik (pasangKerangka), bukan ruang kerja: kunjungannya tidak dicatat.
export const HALAMAN_PUBLIK = new Set(['hasil-survei.html', 'keahlian.html']);
export const STATUS_PAKAI = [['aktif', 'Sering dipakai'], ['jarang', 'Jarang'], ['tidak', 'Tidak pernah dibuka'], ['publik', 'Halaman publik (tidak dicatat)']];

/** Status pakai: aktif = >= 3 pengguna atau >= 20 kunjungan; jarang = ada kunjungan; tidak = 0. */
export const statusPakai = (r, publik = false) => publik ? 'publik' : !r || !r.kunjungan ? 'tidak'
  : (r.pengguna >= 3 || r.kunjungan >= 20) ? 'aktif' : 'jarang';

/**
 * modul: [{ judul, halaman: [{ href, judul }] }] (menu.js MODUL); rekap: hasil pemakaian_rekap().
 * Hasil { menu: [{ berkas, judul: [..], modul: [..], kunjungan, pengguna, hari, terakhir, peran, jabatan, status }],
 *         lain: [baris rekap untuk halaman yang tidak ada di menu], ringkas: { aktif, jarang, tidak, publik } }.
 */
export function gabungPemakaian(modul = [], rekap = {}, publik = HALAMAN_PUBLIK){
  const per = new Map((rekap?.halaman || []).map(r => [r.halaman, r]));
  const menu = new Map();
  for (const m of modul) for (const h of m.halaman || []) {
    const b = berkasDari(h.href);
    if (!menu.has(b)) menu.set(b, { berkas: b, judul: [], modul: [] });
    const x = menu.get(b);
    if (!x.judul.includes(h.judul)) x.judul.push(h.judul);
    if (!x.modul.includes(m.judul)) x.modul.push(m.judul);
  }
  const baris = [...menu.values()].map(x => {
    const r = per.get(x.berkas);
    return { ...x, kunjungan: r?.kunjungan || 0, pengguna: r?.pengguna || 0, hari: r?.hari || 0, terakhir: r?.terakhir || null,
             peran: r?.peran || {}, jabatan: r?.jabatan || {}, status: statusPakai(r, publik.has(x.berkas)) };
  });
  const urut = { tidak: 0, jarang: 1, aktif: 2, publik: 3 };
  baris.sort((a, b) => urut[a.status] - urut[b.status] || a.kunjungan - b.kunjungan || a.berkas.localeCompare(b.berkas));
  const lain = (rekap?.halaman || []).filter(r => !menu.has(r.halaman)).sort((a, b) => b.kunjungan - a.kunjungan);
  const ringkas = { aktif: 0, jarang: 0, tidak: 0, publik: 0 };
  baris.forEach(b => { ringkas[b.status]++; });
  return { menu: baris, lain, ringkas };
}
