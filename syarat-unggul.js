/* =====================================================================
   SYARAT PERLU DAN STATUS AKREDITASI — Program Sarjana, APS-AV 2025 1.0
   ---------------------------------------------------------------------
   Sumber: Pedoman Penilaian Instrumen LAM Teknik 2025
     - Tabel 3 (hlm. 12): status akreditasi menurut Nilai Akreditasi (NA)
       dan syarat perlu;
     - Tabel 4.3.1 (hlm. 25–26): syarat perlu Terakreditasi dan
       Terakreditasi Unggul, Program Sarjana / PJJ Sarjana. Nomor `syarat`
       di bawah mengikuti tabel ini (1–9).
   Diverifikasi dari PDF dengan pdftotext -enc UTF-8 (tanda ≥/≤ utuh),
   2026-10-12. Ringkasan: docs/analisis-instrumen-lam-teknik-2025.md §2.

   Tiga sasaran:
     t  = syarat perlu Terakreditasi (tanda *)
     u3 = Terakreditasi Unggul, masa berlaku 3 tahun (tanda **)
     u5 = Terakreditasi Unggul, masa berlaku 5 tahun (tanda ***)
   Ambang null = tidak disyaratkan untuk sasaran itu (tanda x di tabel).

   Syarat berupa satuan asli (%, sks, bulan) diterjemahkan ke SKOR MINIMUM
   butir matriks yang setara. Rumusnya naik monoton terhadap capaian, jadi
   "skor ≥ skorMin" setara dengan "capaian ≥ ambang". Penurunannya ditulis
   di tiap entri supaya bisa diperiksa ulang dengan tangan.
   ===================================================================== */

export const SYARAT_UNGGUL = {
  // syarat 3 — sks basic sciences dan matematika
  '19': {
    syarat: 3, label: 'Basic sciences dan matematika',
    t: 15, u3: 25, u5: 25, satuan: 'sks', arah: 'min',
    skorMin: { t: 2, u3: 4, u5: 4 },
    turunan: 'matriks butir 19: 15–19 sks → skor 2, ≥ 25 sks → skor 4. ' +
             'Terakreditasi tercetak "15 ≤ SKS ≤ 24", dibaca sebagai minimal 15',
  },
  // syarat 4 — DTPS berpendidikan doktor
  '27': {
    syarat: 4, label: 'DTPS berpendidikan doktor',
    t: null, u3: 30, u5: 40, satuan: '%', arah: 'min',
    skorMin: { t: null, u3: 3.2, u5: 3.6 },
    turunan: 'skor = 2 + (4 × PDS3) · PDS3 30% → 3,20 · 40% → 3,60',
  },
  // syarat 5 — DTPS berjabatan Lektor ke atas
  '28': {
    syarat: 5, label: 'DTPS berjabatan Lektor ke atas',
    t: null, u3: 40, u5: 50, satuan: '%', arah: 'min',
    skorMin: { t: null, u3: 2 + (20 * 0.40) / 7, u5: 2 + (20 * 0.50) / 7 },
    turunan: 'skor = 2 + (20 × PGBLKL)/7 · 40% → 3,14 · 50% → 3,43',
  },
  // syarat 6 — DTPS dengan karya utama internasional, 3 tahun terakhir
  '35': {
    syarat: 6, label: 'DTPS dengan karya utama internasional',
    t: null, u3: 25, u5: 50, satuan: '%', arah: 'min',
    skorMin: { t: null, u3: 2.5, u5: 4 },
    turunan: 'skor = 1 + (6 × PKDTPS) · 25% → 2,50 · 50% → 4,00',
  },
  // syarat 7 — waktu tunggu lulusan, 2 tahun terakhir
  '49': {
    syarat: 7, label: 'Waktu tunggu lulusan',
    t: null, u3: 6, u5: 6, satuan: 'bulan', arah: 'max',
    skorMin: { t: null, u3: 3.4, u5: 3.4 },
    turunan: 'skor = (23 − WT)/5 · WT 6 bulan → 3,40 · ambang ini BATAS ATAS, '
           + 'jadi waktu tunggu lebih pendek memberi skor lebih tinggi',
  },
  // syarat 8 — kesesuaian bidang kerja lulusan
  '50': {
    syarat: 8, label: 'Kesesuaian bidang kerja lulusan',
    t: null, u3: 50, u5: 50, satuan: '%', arah: 'min',
    skorMin: { t: null, u3: (20 * 0.50) / 3, u5: (20 * 0.50) / 3 },
    turunan: 'skor = (20 × KBK)/3 · 50% → 3,33',
  },
};

/* Syarat berupa RERATA skor beberapa indikator matriks (syarat 1, 2, 9).
   Pemetaan indikator a–e ke butir dan "rerata = rata-rata biasa":
   keputusan pemilik 2026-10-12 (docs/analisis-instrumen-lam-teknik-2025.md
   §2.2). Tiap indikator: {butir, komponen} untuk satu komponen butir
   berkomponen dua ('i' / 'ii'), atau {butir} untuk skor butir utuh. */
export const SYARAT_RERATA = [
  { syarat: 1, id: 'tata_pamong', label: 'Sistem tata pamong (rerata)',
    t: 2.00, u3: 3.00, u5: 3.50,
    indikator: [{butir: '4', komponen: 'i'}, {butir: '4', komponen: 'ii'},
                {butir: '5', komponen: 'i'}, {butir: '5', komponen: 'ii'}] },
  { syarat: 2, id: 'kurikulum', label: 'Kurikulum (rerata)',
    t: 2.00, u3: 3.00, u5: 3.50,
    indikator: [{butir: '12'}, {butir: '13', komponen: 'i'},
                {butir: '13', komponen: 'ii'}, {butir: '16', komponen: 'i'},
                {butir: '16', komponen: 'ii'}] },
  { syarat: 9, id: 'penjaminan_mutu', label: 'Penjaminan mutu (rerata)',
    t: 2.00, u3: 3.00, u5: 3.50,
    indikator: [{butir: '53'}, {butir: '54'}, {butir: '55'},
                {butir: '56'}, {butir: '57'}] },
];

export const SASARAN = ['t', 'u3', 'u5'];
const TOL = 0.005;  // pembulatan dua desimal di layar tidak boleh menggagalkan

export const syaratButir = no => SYARAT_UNGGUL[String(no)] || null;

/** Status satu butir terhadap ketiga sasaran. skor null = belum terhitung.
 *  Hasil per sasaran: true / false / null (null = belum tahu, atau tidak
 *  disyaratkan bila ambangnya null; lihat `syaratkan`). */
export function statusSyarat(no, skor){
  const s = syaratButir(no);
  if (!s) return null;
  const nilai = sa => {
    const m = s.skorMin[sa];
    if (m == null) return true;            // tidak disyaratkan
    if (skor == null) return null;
    return skor >= m - TOL;
  };
  return { ...s, tok: nilai('t'), u3ok: nilai('u3'), u5ok: nilai('u5'),
           tahu: skor != null };
}

/** Rerata satu syarat rerata. ambil(ind) -> skor 0..4 atau null.
 *  Semua indikator harus terisi; kalau tidak, rerata null. */
export function statusRerata(def, ambil){
  const nilai = def.indikator.map(ambil);
  const lengkap = nilai.every(v => v != null && Number.isFinite(v));
  const rerata = lengkap ? nilai.reduce((a, b) => a + b, 0) / nilai.length : null;
  const cek = sa => (rerata == null ? null : rerata >= def[sa] - TOL);
  return { ...def, nilai, rerata, tok: cek('t'), u3ok: cek('u3'), u5ok: cek('u5') };
}

/** Gabungan tiga nilai: false bila ada yang false, null bila ada yang
 *  belum tahu, true bila semuanya true. */
export function gabungSyarat(daftar){
  if (daftar.some(x => x === false)) return false;
  if (daftar.some(x => x == null)) return null;
  return true;
}

/** Status akreditasi menurut Tabel 3 (hlm. 12).
 *  NA = Σ(bobot × skor), skala 0–400. t/u3/u5 = true/false/null.
 *  Mengembalikan {status, durasi, pasti, catatan}. `pasti` false bila
 *  kesimpulan bergantung pada syarat yang belum terhitung. */
export function statusAkreditasi(NA, t, u3, u5){
  const hasil = (status, durasi, pasti, catatan) => ({status, durasi, pasti, catatan});
  if (t === false)
    return hasil('Tidak Terakreditasi', null, true,
      'Ada syarat perlu Terakreditasi yang tidak terpenuhi (Tabel 3 baris 6): ' +
      'status ini berlaku berapa pun NA-nya.');
  if (NA < 200)
    return hasil('Tidak Terakreditasi', null, true, 'NA di bawah 200 (Tabel 3 baris 7).');
  if (t == null)
    return hasil('Belum dapat disimpulkan', null, false,
      'NA ≥ 200, tetapi syarat perlu Terakreditasi belum seluruhnya terhitung.');

  // t terpenuhi dan NA ≥ 200.
  if (NA >= 331 && u3 === true){
    if (NA >= 361 && u5 === true)
      return hasil('Terakreditasi Unggul', 5, true, 'Tabel 3 baris 1.');
    if (NA >= 361 && u5 == null)
      return hasil('Terakreditasi Unggul', 3, false,
        'Minimal Unggul 3 tahun; Unggul 5 tahun bila syarat Unggul 5 tahun terpenuhi ' +
        '(sebagian belum terhitung).');
    return hasil('Terakreditasi Unggul', 3, true,
      NA >= 361 ? 'Tabel 3 baris 2.' : 'Tabel 3 baris 3 (331 ≤ NA < 361).');
  }
  if (NA >= 331 && u3 == null)
    return hasil('Terakreditasi', 5, false,
      'Minimal Terakreditasi 5 tahun; Unggul bila syarat Unggul terpenuhi ' +
      '(sebagian belum terhitung).');
  // NA ≥ 361 dengan syarat Unggul 3 tahun tidak terpenuhi tidak tercantum di
  // Tabel 3; diperlakukan seperti baris 4 (analisis §2.1).
  return hasil('Terakreditasi', 5, true,
    NA >= 331 ? 'Syarat perlu Unggul tidak terpenuhi (Tabel 3 baris 4).'
              : 'Tabel 3 baris 5 (200 ≤ NA < 331).');
}

/** Status bila sebagian butir belum dinilai. NA yang terhitung hanyalah
 *  batas bawah (butir kosong = 0); batas atasnya NA bila semua butir kosong
 *  bernilai 4. Status dinyatakan hanya bila kedua batas memberi status yang
 *  sama; selain itu "Belum dapat disimpulkan" beserta rentangnya. */
export function statusRentang(NAmin, NAmax, t, u3, u5){
  const a = statusAkreditasi(NAmin, t, u3, u5);
  const b = statusAkreditasi(NAmax, t, u3, u5);
  if (a.status === b.status && a.durasi === b.durasi)
    return { ...a, pasti: a.pasti && b.pasti, NAmin, NAmax };
  const nama = s => s.status + (s.durasi ? ` ${s.durasi} tahun` : '');
  return { status: 'Belum dapat disimpulkan', durasi: null, pasti: false, NAmin, NAmax,
    catatan: `Dengan butir yang belum dinilai, NA bisa ${NAmin.toFixed(2)}–${NAmax.toFixed(2)}, ` +
             `jadi status bisa ${nama(a)} sampai ${nama(b)}.` };
}

export const JUMLAH_SYARAT_TERPETAKAN =
  Object.keys(SYARAT_UNGGUL).length + SYARAT_RERATA.length;
