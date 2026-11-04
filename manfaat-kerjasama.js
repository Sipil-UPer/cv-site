/* =====================================================================
   manfaat-kerjasama.js — bantuan isian LKPS 2.a (pemilik 2026-11-05): contoh
   kalimat manfaat, jenis bukti, dan durasi kerja sama. Dipakai form dosen
   (input.html) dan form admin (data-prodi.html).

   Contoh hanya kerangka: bagian [..] wajib diganti fakta kegiatan.
   ===================================================================== */

export const CONTOH_MANFAAT = {
  pendidikan: [
    'Menyediakan tempat magang/MBKM bagi [jumlah] mahasiswa per tahun pada [unit mitra], diakui sebagai [jumlah] SKS mata kuliah [nama mata kuliah].',
    'Praktisi mitra mengajar [jumlah] jam pada mata kuliah [nama mata kuliah], sehingga materi sesuai praktik industri terkini.',
    'Masukan mitra dipakai dalam pemutakhiran kurikulum [tahun], terutama CPL [nomor CPL] tentang [kompetensi].',
  ],
  penelitian: [
    'Mendukung topik tugas akhir [jumlah] mahasiswa dan memperkaya materi mata kuliah [nama mata kuliah] dengan data lapangan dari mitra.',
    'Menghasilkan [jumlah] publikasi bersama pada [nama jurnal/prosiding] dan membuka akses prodi ke [data/laboratorium/alat] milik mitra.',
    'Meningkatkan kompetensi dosen dalam [bidang] dan menjadi dasar usulan penelitian lanjutan pada skema [nama skema].',
  ],
  pkm: [
    'Menerapkan hasil penelitian prodi untuk [masalah di masyarakat/mitra] dan menjadi studi kasus mata kuliah [nama mata kuliah].',
    'Memberi pengalaman lapangan bagi [jumlah] mahasiswa melalui [kegiatan], yang diakui sebagai [SKS/MBKM/tugas akhir].',
    'Menghasilkan [modul/TTG/HKI] yang dipakai mitra dan meningkatkan rekognisi prodi di [wilayah/sektor].',
  ],
};
const NAMA = { pendidikan: 'Pendidikan', penelitian: 'Penelitian', pkm: 'PkM' };

// Nilai sah sama dengan daftar pilihan kolom Bukti Kerjasama templat LAM.
export const JENIS_BUKTI_KS = [['surat_penugasan', 'Surat Penugasan'], ['spk', 'Surat Perjanjian Kerjasama (SPK)'],
  ['bukti_pelaksanaan', 'Bukti-bukti Pelaksanaan (Laporan, Hasil Kerjasama, Luaran Kerjasama)'],
  ['lainnya', 'Bukti lain yang relevan']];

const esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Daftar contoh yang bisa diklik; idSasaran = id textarea yang diisi.
export function htmlContoh(idSasaran, jenis = ['pendidikan', 'penelitian', 'pkm']){
  return `<details class="contoh-manfaat"><summary>Lihat contoh isian manfaat</summary>
    <p>Klik contoh untuk menyalinnya, lalu ganti bagian [..] dengan fakta kegiatan. Tulis manfaat nyata bagi
      <b>program studi</b> (pembelajaran, mahasiswa, dosen, fasilitas), bukan tujuan kegiatan.</p>
    ${jenis.map(j => `<b>${esc(NAMA[j])}</b><ul>${CONTOH_MANFAAT[j].map(t =>
      `<li><button type="button" data-contoh-manfaat="${esc(idSasaran)}">${esc(t)}</button></li>`).join('')}</ul>`).join('')}
  </details>`;
}

// Sekali per halaman: klik contoh mengisi textarea sasarannya.
export function pasangContoh(){
  if (document.getElementById('gaya-contoh-manfaat')) return;
  const g = document.createElement('style');
  g.id = 'gaya-contoh-manfaat';
  g.textContent = `.contoh-manfaat{margin-top:6px;font-size:13px}.contoh-manfaat summary{cursor:pointer;color:var(--biru-2)}
    .contoh-manfaat p{margin:6px 0}.contoh-manfaat ul{margin:4px 0 8px;padding-left:18px}
    .contoh-manfaat button{all:unset;cursor:pointer;color:var(--biru-2);text-decoration:underline;display:inline}`;
  document.head.appendChild(g);
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-contoh-manfaat]');
    if (!b) return;
    const el = document.getElementById(b.dataset.contohManfaat);
    if (!el) return;
    if (el.value.trim() && !confirm('Ganti isian manfaat dengan contoh ini?')) return;
    el.value = b.textContent;
    el.focus();
  });
}

// Durasi dan status seperti rumus Tabel 2.a templat: DATEDIF tahun penuh; Valid bila
// masa kerja sama beririsan dengan 4 tahun sebelum akhir TS (31 Agustus).
export function durasiKS(mulai, selesai, ts){
  if (!mulai || !selesai) return null;
  const a = new Date(`${mulai}T00:00:00Z`), z = new Date(`${selesai}T00:00:00Z`);
  if (Number.isNaN(+a) || Number.isNaN(+z) || z < a) return null;
  let tahun = z.getUTCFullYear() - a.getUTCFullYear();
  const lewat = z.getUTCMonth() > a.getUTCMonth() || (z.getUTCMonth() === a.getUTCMonth() && z.getUTCDate() >= a.getUTCDate());
  if (!lewat) tahun--;
  const akhir = new Date(Date.UTC(ts, 7, 31)), awal = new Date(Date.UTC(ts - 4, 7, 31));
  const valid = (a > awal && a < akhir) || (z > awal && z < akhir) || (a < awal && z > akhir);
  return { tahun, valid };
}
