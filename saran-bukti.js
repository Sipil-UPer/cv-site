// Saran bukti yang tampil di tiap form input data (pemilik 2026-11-06).
// Isi mengikuti LKPS_TABEL dan RENCANA_BUKTI di rencana-bukti.js:
// [teks, true] = disebut panduan LKPS; [teks] = usulan kami, bukan syarat resmi.
// Kunci = kunci FORM di input.html, id tab Data prodi, 'prestasi_dosen', 'dosen'.

const P = t => [t, true], U = t => [t];
const TRACER = [P('Laporan tracer study (responden sedikitnya 30%)'), U('Instrumen kuesioner dan rekap jawaban')];

export const SARAN_BUKTI = {
  // input.html
  publikasi: { tabel: '4.d, 4.h', isi: [P('Halaman profil SINTA yang memuat karya ini'),
    P('Status penulis pertama atau korespondensi, mis. halaman artikel'), U('Naskah terbit atau tautan DOI'),
    U('Bukti indeksasi (Scopus, WoS, atau SINTA)'), U('Korespondensi dengan editor')] },
  kegiatan: { tabel: '3.b, 3.c, 6.h, 6.i', isi: [P('Tercatat di LPPM'), U('Kontrak atau SK hibah'), U('Laporan akhir'),
    U('PkM: daftar hadir dan foto kegiatan'), U('Bila melibatkan mahasiswa: SK pembimbing atau surat tugas'),
    P('Bila kerja sama: surat penugasan, SPK, dan bukti pelaksanaan. MoU/MoA saja bukan bukti realisasi')],
    catatan: 'KKN dan kegiatan kurikuler tidak dihitung sebagai PkM bersama mahasiswa (Tabel 6.i).' },
  luaran: { tabel: '4.f', isi: [P('Sertifikat paten (Kemenkum) atau sertifikat HKI'), P('Sertifikat TKT'),
    P('Halaman buku yang memuat ISBN'), P('Halaman profil SINTA yang memuat luaran ini')] },
  rekognisi: { tabel: '4.j', isi: [P('Surat undangan, SK, atau sertifikat')],
    catatan: 'Satu DTPS diakui satu rekognisi.' },
  integrasi: { tabel: '3.a.3', isi: [P('Naskah hibah, laporan akhir, atau publikasi yang diintegrasikan'),
    U('RPS yang memuat hasil penelitian atau PkM itu')] },
  prestasi_dosen: { tabel: '6.c', isi: [U('Sertifikat atau piagam (wajib di form ini)'), U('Surat tugas pembimbing'),
    U('Berita atau foto kegiatan')] },

  // data-prodi.html
  dokumen: { tabel: 'semua', isi: [P('SK pendirian PT, SK pembukaan PS, SK akreditasi terbaru'),
    U('Statuta, renstra, kurikulum, dan dokumen lain yang dirujuk banyak butir')],
    catatan: 'Isi dulu tab ini: dokumen di sini bisa ditautkan dari tab lain tanpa unggah ulang. Jenis bertanda (privat) tidak '
      + 'punya tautan publik; asesor membukanya dengan kata sandi.' },
  bkd: { tabel: '4.c', isi: [U('PDF Laporan Kinerja Dosen (LKD) SISTER tiap semester')],
    catatan: 'Berkas LKD privat, karena memuat data pribadi. Salin angka dari bagian C: SKS BKD dan SKS Lebih.' },
  tendik: { tabel: '4.b', isi: [U('Ijazah'), U('Sertifikat kompetensi')] },
  mk: { tabel: '3.a.1, 3.a.4, 3.a.5', isi: [P('Dokumen RPS tiap mata kuliah'), U('Dokumen kurikulum'),
    U('Capstone: panduan capstone dan contoh laporan')] },
  tema: { tabel: '3.b, 3.c, 6.h, 6.i', isi: [U('Peta jalan penelitian dan PkM yang disahkan')] },
  kerjasama: { tabel: '2.a', isi: [P('Surat penugasan atau SPK'), P('Bukti pelaksanaan: laporan, hasil, luaran'),
    P('Publikasi bersama bila ada')], catatan: 'MoU/MoA saja bukan bukti realisasi.' },
  mahasiswa: { tabel: '6.a, 6.b', isi: [U('Data PDDikti'), U('Data yudisium untuk IPK lulusan')],
    catatan: 'Kolom mahasiswa asing wajib diisi walaupun nol.' },
  kohort: { tabel: '6.d', isi: [U('Ekspor SIAKAD')] },
  prestasi: { tabel: '6.c', isi: [U('Sertifikat atau piagam'), U('Berita kegiatan')] },
  publikasi_mhs: { tabel: '6.e.1', isi: [U('DOI atau URL artikel')] },
  luaran_mhs: { tabel: '6.e.3', isi: [P('Surat Kemenkum, sertifikat HKI, sertifikat TKT, atau ISBN')] },
  tracer: { tabel: '6.f, 6.g.1', isi: TRACER },
  kepuasan: { tabel: '6.g.2', isi: [P('Laporan survei pengguna')] },
  vmts: { tabel: '1', isi: [P('Nomor SK dan tautan dokumen VMTS')] },
  prodi_upps: { tabel: 'PS', isi: [P('SK pembukaan PS dan SK akreditasi tiap prodi')] },
  dana: { tabel: '2.b', isi: [U('Laporan realisasi anggaran per tahun anggaran')] },
  prasarana: { tabel: '5.a', isi: [P('Daftar alat utama tiap laboratorium'), U('Foto dan inventaris')] },
  dok_k3l: { tabel: '5.b', isi: [U('Dokumen K3L yang bertanggal')] },
  fas_k3l: { tabel: '5.c', isi: [U('Foto dan inventaris fasilitas')] },
  spmi: { tabel: '7.a, 7.b', isi: [P('Nomor dan tanggal dokumen SPMI'), P('Tautan dokumen tiap tahap PPEPP'),
    U('Laporan AMI dan RTM')] },
  target: { tabel: 'butir 54–56', isi: [U('Dokumen IKU/IKT yang disahkan'), U('Laporan kinerja')] },

  // kelola-dosen.html: tidak ada kolom bukti di sana, simpan di pustaka.
  dosen: { tabel: '4.a', isi: [P('Nomor sertifikat pendidik'), U('Ijazah'), U('SK jabatan akademik')],
    catatan: 'Simpan berkasnya di Data prodi, tab Dokumen.' },
};

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Kotak saran; kosong bila kunci tidak dikenal.
export function htmlSaran(kunci){
  const s = SARAN_BUKTI[kunci];
  if (!s) return '';
  const ada = s.isi.some(x => x[1]);
  return `<details class="saran-bukti" open style="margin:0 0 14px;padding:8px 12px;font-size:13px;line-height:1.5;
      border:1px solid var(--line);border-left:3px solid var(--biru-2);background:var(--panel)">
    <summary style="cursor:pointer;font-weight:600">Bukti yang sebaiknya dimasukkan (LKPS ${esc(s.tabel)})</summary>
    <ul style="margin:6px 0 0;padding-left:18px">${s.isi.map(([t, resmi]) => `<li>${esc(t)}${resmi ? ' *' : ''}</li>`).join('')}</ul>
    ${s.catatan ? `<div style="margin-top:4px">${esc(s.catatan)}</div>` : ''}
    <div style="margin-top:4px;color:var(--muted);font-size:12px">${ada ? '* Disebut panduan LKPS. Lainnya saran, bukan syarat resmi.'
      : 'Saran, bukan syarat resmi.'}</div></details>`;
}
