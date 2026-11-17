// Periode dan unduhan Excel untuk Monitoring > Rekap SDGs dan bukti (sdgs-bukti.html, pemilik 2026-11-17).
// TS = tahun akademik 1 September s.d. 31 Agustus, ditulis sebagai tahun ujung (2026 = TS 2025/2026).
// Karya dipetakan ke TS seperti bangun.py _ts (08-patch-bulan.sql): bulan >= 9 -> tahun + 1; bulan kosong -> tahun.

export const tsKarya = k => {
  const th = +k.tahun || 0;
  return th && +k.bulan >= 9 ? th + 1 : th;
};
export const taTeks = ts => `${ts - 1}/${ts}`;
export const tsBerjalan = (kini = new Date()) => kini.getMonth() >= 8 ? kini.getFullYear() + 1 : kini.getFullYear();

// Pilihan periode: '' (semua), 'th:<tahun>', 'ts:<ts>', 'ts3:<ts>' (TS-2 s.d. TS). TS setelah TS berjalan tidak ditawarkan.
export function opsiPeriode(karya, kini = new Date()){
  const batas = tsBerjalan(kini);
  const tahun = [...new Set(karya.map(k => +k.tahun).filter(Boolean))].sort((a, b) => b - a);
  const ts = [...new Set([batas, ...karya.map(tsKarya).filter(Boolean)])].filter(t => t <= batas).sort((a, b) => b - a);
  return [
    { grup: 'Tahun akademik (TS)', opsi: ts.map(t => [`ts:${t}`, `TS ${taTeks(t)}${t === batas ? ' (berjalan)' : ''}`]) },
    { grup: '3 TS (jendela akreditasi)', opsi: ts.map(t => [`ts3:${t}`, `TS ${taTeks(t - 2)} s.d. ${taTeks(t)}`]) },
    { grup: 'Tahun kalender', opsi: tahun.map(t => [`th:${t}`, String(t)]) },
  ];
}

export function cocokPeriode(k, periode){
  if (!periode) return true;
  const [jenis, nilai] = periode.split(':'), n = +nilai;
  if (jenis === 'th') return +k.tahun === n;
  const ts = tsKarya(k);
  if (jenis === 'ts') return ts === n;
  if (jenis === 'ts3') return ts >= n - 2 && ts <= n;
  return true;
}

export function labelPeriode(periode){
  if (!periode) return 'Semua tahun';
  const [jenis, nilai] = periode.split(':'), n = +nilai;
  return jenis === 'th' ? `Tahun ${n}` : jenis === 'ts' ? `TS ${taTeks(n)}` : `TS ${taTeks(n - 2)} s.d. ${taTeks(n)}`;
}

// Nama berkas: rekap-sdgs-TS2025-2026.xlsx, rekap-sdgs-2025.xlsx, rekap-sdgs-semua.xlsx (+ -sdg11 bila disaring).
export function namaBerkas(periode, sdg){
  const [jenis, nilai] = (periode || '').split(':'), n = +nilai;
  const p = !periode ? 'semua' : jenis === 'th' ? `${n}` : jenis === 'ts' ? `TS${n - 1}-${n}` : `TS${n - 3}-${n}`;
  return `rekap-sdgs-${p}${sdg ? '-sdg' + sdg : ''}.xlsx`;
}

// Isi tiga lembar. xs: karya yang sudah disaring ({judul, kategori, tahun, bulan, status, doi, tautan, dosen[], sdgs[], bukti[]}).
// Sel tautan berbentuk { t, l } (teks, alamat) supaya pemanggil bisa memasang hyperlink.
export function lembarUnduh(xs, { sdgs, kat = {}, jenisBukti = {} }){
  const namaSdg = n => (sdgs.find(x => x[0] === n) || [, ''])[1];
  const tautan = (t, l) => l ? { t, l } : t;
  const daftar = [['No', 'Judul', 'Kategori', 'Tahun', 'Bulan', 'TS', 'Dosen', 'SDG', 'Nama SDG', 'DOI/tautan', 'Status', 'Jumlah bukti']];
  const bukti = [['No karya', 'Judul karya', 'TS', 'Jenis bukti', 'Keterangan', 'Tautan bukti']];
  xs.forEach((k, i) => {
    const ts = tsKarya(k);
    daftar.push([i + 1, k.judul, kat[k.kategori] || k.kategori || '', +k.tahun || '', +k.bulan || '', ts ? taTeks(ts) : '',
      k.dosen.join(', '), k.sdgs.join(', '), k.sdgs.map(namaSdg).join('; '),
      tautan(k.doi ? `DOI ${k.doi}` : k.tautan || '', k.tautan), k.status === 'terverifikasi' ? 'terverifikasi' : 'menunggu verifikasi',
      k.bukti.length]);
    if (!k.bukti.length) bukti.push([i + 1, k.judul, ts ? taTeks(ts) : '', '(belum ada bukti)', '', '']);
    k.bukti.forEach(b => bukti.push([i + 1, k.judul, ts ? taTeks(ts) : '', jenisBukti[b.jenis] || b.jenis || '', b.judul || '',
      tautan(b.url, b.url)]));
  });
  const rekap = [['SDG', 'Nama SDG', 'Jumlah karya', 'Karya dengan bukti', 'Karya tanpa bukti']];
  sdgs.forEach(([n, nama]) => {
    const ks = xs.filter(k => k.sdgs.includes(n));
    rekap.push([n, nama, ks.length, ks.filter(k => k.bukti.length).length, ks.filter(k => !k.bukti.length).length]);
  });
  return { Daftar: daftar, Bukti: bukti, 'Rekap SDG': rekap };
}
