// Sitasi per tahun (supabase/42-patch-sitasi-tahunan.sql, pemilik 2026-11-10).
// "Sitasi 3 tahun terakhir" LKPS 4.i untuk TS yang dipilih = jumlah sitasi
// per tahun kalender yang beririsan dengan TS-2 s.d. TS, yaitu tahun awal
// TS-2 sampai tahun akhir TS (empat tahun kalender). Karya tanpa sitasi per
// tahun memakai angka total lama karya.jumlah_sitasi (cadangan).
// Dipakai lkps.js (4.i), lkps-bukti.js, led-isi.js, input.html.

export const SUMBER_SITASI = { openalex: 'OpenAlex', google_scholar: 'Google Scholar', scopus: 'Scopus', manual: 'manual' };

// TS dinamai menurut tahun akhirnya: TS 2026 = 2025/2026 -> tahun kalender 2023..2026.
// Daftar karya yang mengutip di OpenAlex pada jendela sitasi TS (publik, tanpa
// login; pemilik 2026-11-10). oa = karya.openalex_id; '' bila belum dicocokkan.
export const tautanPengutip = (oa, ts) => /^W\d+$/.test(String(oa || ''))
  ? `https://openalex.org/works?filter=cites:${oa},publication_year:${ts - 3}-${ts}` : '';

export const tahunJendela = ts => [ts - 3, ts];

// k.karya_sitasi: [{tahun, jumlah, sumber}]. Hasil {n, asal: 'tahunan' | 'lama' | null}.
export function sitasiTS(k, ts) {
  const rows = k.karya_sitasi || [];
  if (rows.length) {
    const [a, b] = tahunJendela(ts);
    return { n: rows.filter(r => r.tahun >= a && r.tahun <= b).reduce((s, r) => s + (+r.jumlah || 0), 0), asal: 'tahunan' };
  }
  if (k.jumlah_sitasi != null && k.jumlah_sitasi !== '') return { n: +k.jumlah_sitasi, asal: 'lama' };
  return { n: 0, asal: null };
}

// Publikasi yang masuk Tabel 4.i untuk TS itu, urut sitasi terbanyak.
// Hasil: [{k, n, asal}].
export function karya4i(karya, ts) {
  return (karya || []).filter(k => k.kategori === 'publikasi' && ['jurnal', 'prosiding'].includes(k.jenis)
      && /^(scopus|wos)/.test(k.indeksasi || '') && k.relevan_visi !== false)
    .map(k => ({ k, ...sitasiTS(k, ts) })).filter(x => x.n > 0)
    .sort((a, b) => b.n - a.n || (a.k.tahun - b.k.tahun) || String(a.k.judul).localeCompare(String(b.k.judul)));
}
