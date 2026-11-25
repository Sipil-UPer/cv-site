/* =====================================================================
   BUTIR MANUAL — fungsi umum (kunci pengaturan, skor butir manual)
   ---------------------------------------------------------------------
   Daftar butir (BUTIR_MANUAL, SEKSI_MANUAL) dan rumus kepuasan pengguna khusus instrumen, ada di
   site/instrumen/<id>/butir-manual.js; diekspor ulang dari sini supaya
   pengimpor tidak berubah. <id> ditulis tools/pilih_instrumen.py dari
   config.yaml accreditation.instrument (pemilik 2026-11-24).
   ===================================================================== */

export { BUTIR_MANUAL, SEKSI_MANUAL, SEKSI_KARTU, ASPEK_KEPUASAN, cekKepuasan, tkKepuasan }
  from './instrumen/lam-teknik-s1/butir-manual.js?v=2026-11-25-448835';

// Kunci pengaturan untuk satu butir.
export function kunciButir(b){
  if (b.hitung) return b.hitung.kunci;
  if (b.komponen) return [`b${b.no}_i`, `b${b.no}_ii`];
  return [`b${b.no}`];
}
export function kunciBuktiButir(b){ return `bukti_b${b.no}`; }

// Menghitung skor satu butir manual dari peta pengaturan.
// Mengembalikan {skor, nilai[], lengkap} — skor null bila belum lengkap.
export function skorManual(b, ambil){
  const kunci = kunciButir(b);
  const nilai = kunci.map(k => ambil(k));
  const lengkap = nilai.every(v => v != null && Number.isFinite(v));
  if (!lengkap) return {skor: null, nilai, lengkap: false};
  let skor;
  if (b.hitung) skor = b.hitung.f(...nilai);
  else if (b.komponen) skor = b.gabung(nilai[0], nilai[1]);
  else skor = nilai[0];
  if (skor == null || !Number.isFinite(skor)) return {skor: null, nilai, lengkap: true};
  return {skor: Math.max(0, Math.min(4, skor)), nilai, lengkap: true};
}
