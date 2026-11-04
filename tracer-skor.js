/* =====================================================================
   tracer-skor.js — tracer study untuk butir 49 dan 50 (matriks APS-AV 2025
   Sarjana; site/skor.html). Satu baris = satu tahun lulus dari data.json
   (bangun.py tracer_pub). Keputusan pemilik 2026-11-05:
     butir 49  WT = rata-rata waktu tunggu dari laporan tracer; pita Tabel
               6.f.1 hanya memeriksa kecocokan rata-rata itu.
     butir 50  sesuai = kesesuaian Sedang ("cukup sesuai") + Tinggi
               (Tabel 6.f.2); tahun lulus tanpa tingkat kesesuaian memakai
               isian lama "Bekerja sesuai bidang".
   ===================================================================== */

// Pita waktu tunggu Tabel 6.f.1 Sarjana (< 3, 3-18, > 18 bulan). Matriks butir 49
// memakai satu angka WT; pemilik 2026-11-05: WT = rata-rata dari laporan tracer,
// pita hanya memeriksa kecocokannya. Dari pita, rata-rata yang mungkin terletak
// antara (3b + 18c)/N dan (3a + 18b)/N (tanpa batas atas bila ada yang > 18 bulan).
export function cekPitaWT(tr, WT){
  if (!tr.some(t => t.wt_kurang_3 != null || t.wt_3_18 != null || t.wt_lebih_18 != null)) return null;
  const n = k => tr.reduce((s, t) => s + (t[k] || 0), 0);
  const a = n('wt_kurang_3'), b = n('wt_3_18'), c = n('wt_lebih_18'), N = a + b + c;
  if (!N) return null;
  const bawah = (3 * b + 18 * c) / N, atas = c ? Infinity : (3 * a + 18 * b) / N;
  return { a, b, c, bawah, atas, cocok: WT >= bawah - 1e-9 && WT <= atas + 1e-9 };
}
export const adaTingkat = t => t.kesesuaian_rendah != null || t.kesesuaian_sedang != null || t.kesesuaian_tinggi != null;
export const sesuaiTracer = t => adaTingkat(t) ? (t.kesesuaian_sedang || 0) + (t.kesesuaian_tinggi || 0) : (t.sesuai_bidang || 0);
