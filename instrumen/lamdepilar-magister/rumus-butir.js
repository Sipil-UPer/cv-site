/* ====================================================================
   RUMUS BUTIR — tidak ada untuk IAPS DEPILAR 1.0
   IAPS DEPILAR 1.0 (Peraturan LAMDEPILAR No. 10/2026), Program Magister
   akademik, instrumen Perolehan Status Terakreditasi. Dibangkitkan
   2026-11-24 dari dokumen resmi (lamdepilar.or.id); lihat instrumen.json.
   Id butir 101-130 = elemen D.1 ... R.6 (pemilik 2026-11-24): nomor butir
   LAM Teknik (1-60) tertulis langsung di modul umum, jadi id ini sengaja
   tidak bertabrakan dengan nomor itu.

   Semua elemen dinilai asesor dari rubrik (Buku 4 bab 3.2); di situs
   dinilai dari bukti per unsur. Kontrak sama dengan instrumen acuan:
     buatRumus(h) -> { daftar(): [],  fungsi: {} }
   PEMBANTU_RUMUS sama dengan acuan karena skor.html mengirim pembantu yang
   sama untuk semua instrumen.
   ==================================================================== */

export const PEMBANTU_RUMUS = [
  'esc', 'f2', 'taDari', 'kartuButir', 'kartuManualKosong', 'rincianButir', 'tabelNA', 'IS', 'hitungBOP',
  'hitungDosen', 'hitungMK', 'cekPitaWT', 'adaTingkat', 'sesuaiTracer', 'karya4i', 'tautanPengutip',
];

export function buatRumus(h) {
  const kurang = ['keadaan', ...PEMBANTU_RUMUS].filter(n => typeof h?.[n] !== 'function');
  if (kurang.length) throw new Error(`buatRumus: pembantu tidak dikirim: ${kurang.join(', ')}`);
  return { daftar: () => [], fungsi: {} };
}
