// Rincian pemakaian Supabase (207-patch-rincian-pemakaian.sql, pemilik 2026-11-28). Fungsi murni untuk kapasitas.html:
// persen dan status terhadap batas paket (angka dari basis data, sama dengan 170), tren harian, perkiraan hari mencapai ambang.
export const HARI_MIN_TREN = 7;   // tren baru dihitung bila catatan menjangkau sedikitnya 7 hari

export const persenPakai = (pakai, batas) => (batas > 0 && pakai != null ? Math.round(+pakai / batas * 1000) / 10 : null);
/** 'baik' | 'perlu_dicek' (>= ambang, sama dengan panel Kesehatan sistem) | 'penuh' (>= 100%) | 'tidak_ada'. */
export function statusPakai(pakai, batas, ambang = 0.5){
  if (pakai == null || !(batas > 0)) return 'tidak_ada';
  return pakai >= batas ? 'penuh' : pakai >= batas * ambang ? 'perlu_dicek' : 'baik';
}

const hari = iso => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 864e5;
/** Pertumbuhan MB per hari dari riwayat [{tanggal, db_mb, storage_mb}] (catatan pertama dan terakhir); cukup = rentang >= 7 hari. */
export function trenHarian(riwayat = [], kunci = 'db_mb'){
  const xs = riwayat.filter(r => r[kunci] != null).sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)));
  if (xs.length < 2) return { cukup: false, hari: 0, mbPerHari: null };
  const a = xs[0], b = xs[xs.length - 1], h = hari(String(b.tanggal)) - hari(String(a.tanggal));
  if (h < HARI_MIN_TREN) return { cukup: false, hari: h, mbPerHari: null };
  return { cukup: true, hari: h, mbPerHari: Math.round((+b[kunci] - +a[kunci]) / h * 1000) / 1000 };
}
/** Hari sampai pemakaian mencapai target MB pada laju mbPerHari; 0 bila sudah lewat; null bila tidak tumbuh. */
export function hariMenuju(pakai, target, mbPerHari){
  if (pakai >= target) return 0;
  if (!(mbPerHari > 0)) return null;
  return Math.ceil((target - pakai) / mbPerHari);
}
/** "1,5 MB" / "820 KB". */
export const ukuran = mb => (mb == null ? '—' : mb >= 1 ? `${String(Math.round(mb * 10) / 10).replace('.', ',')} MB` : `${Math.round(mb * 1024)} KB`);
/** Tautan dasbor Usage Supabase dari alamat proyek (https://<ref>.supabase.co); null bila bukan alamat Supabase. */
export function tautanUsage(sbUrl){
  const m = String(sbUrl || '').match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return m ? `https://supabase.com/dashboard/project/${m[1]}/usage` : null;
}
