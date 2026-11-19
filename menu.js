import { dosenLogin } from './dosen-login.js?v=2026-11-19-52202c';
import { aktifPada } from './koordinator.js?v=2026-11-19-52202c';
// Menu bersama ruang kerja (pemilik 2026-11-04).
//
// Situs dibagi dua:
// - tampilan umum, tanpa masuk akun: index.html (rekap), dosen.html, kerja-sama.html (mitra.html pengalih), sdgs.html, keahlian.html;
// - ruang kerja, khusus email terdaftar di tabel `dosen`: modul di MODUL.
//
// Akses (pemilik 2026-11-04): semua email terdaftar membuka Monitoring dan
// Akreditasi. Halaman `boleh: admin` khusus peran admin (RLS di Supabase
// tetap penjaga sebenarnya; menu hanya menyembunyikan). Karya dosen untuk
// peran yang mengisi karya, sama dengan gerbang di karya.html.
//
// Modul baru: tambahkan satu entri ke MODUL. Menu, kartu di
// ruang-kerja.html, dan gerbang ikut membacanya.

const admin = s => s.peran === 'admin';
// Koordinator prodi (97-patch-koordinator.sql): Data prodi untuk tab bidangnya.
const dataProdi = s => admin(s) || (s.koordinator || []).some(j => ['koordinator_ta', 'pembina_kemahasiswaan', 'gkm'].includes(j));
// GKM (98): modul mutu dan akreditasi; kepala lab: halaman Laboratorium (lab miliknya).
const mutu = s => admin(s) || (s.koordinator || []).includes('gkm');
const kalab = s => admin(s) || (s.koordinator || []).includes('kepala_lab');
// Sama dengan boleh_narasi() di supabase/36-patch-tim-penyusun.sql.
const penyusun = s => admin(s) || (!!s.tim_penyusun && s.peran !== 'asesor');
// Asesor, dan pimpinan yang bukan DTPS prodi ini (aktif=false), tidak mengisi karya.
const isiKarya = s => s.peran !== 'asesor' && !(s.peran === 'pimpinan' && !s.aktif);

import { halamanAktif } from './fitur.js?v=2026-11-19-52202c';

export const MODUL = [
  // Susunan modul (pemilik 2026-11-17): mengikuti pembagian tugas koordinator prodi (kemahasiswaan,
  // laboratorium, mutu & akreditasi/GKM) dan pemantauan oleh koordinator prodi; admin prodi terpisah.
  { judul: 'Data saya', ket: 'Profil dan karya dosen.', halaman: [
    { href: 'profil.html', judul: 'Profil saya',
      ket: 'Nama, SINTA, Scopus, ORCID, pendidikan, jabatan; perubahan disetujui admin.' },
    { href: 'karya.html', judul: 'Karya dosen', boleh: isiKarya,
      ket: 'Publikasi, penelitian, PkM, luaran, rekognisi, dan buktinya.' },
  ]},
  { judul: 'Pembelajaran dan CPL', ket: 'Berkas nilai CPL, capaian CPL, evaluasi pembelajaran, dan data kurikulum.', halaman: [
    { href: 'nilai-cpl.html', judul: 'Berkas nilai CPL', boleh: isiKarya,
      ket: 'Unggah Template_Input_Data_CPL per kelas (diperiksa sebelum dikirim, disimpan privat); admin: daftar kelas dan pengingat.' },
    // CPMK dan RPS per MK (102-patch-cpmk-rps.sql, pemilik 2026-11-17, OBE O2): templat nilai CPL terisi per kelas.
    { href: 'cpmk.html', judul: 'CPMK dan penilaian', boleh: isiKarya,
      ket: 'CPMK, Sub-CPMK, butir asesmen, bobot, dan RPS per mata kuliah; unduh templat nilai CPL yang sudah terisi per kelas.' },
    // RPS K26 (111-patch-rps-k26.sql, pemilik 2026-11-18): dosen mengisi RPS di situs, unduh Word Formulir RPS K26.
    { href: 'rps.html', judul: 'RPS', boleh: isiKarya,
      ket: 'Susun RPS per mata kuliah dan kurikulum (K21, K26, …; bagian B dari CPMK dan penilaian), periksa otomatis menurut Panduan, unduh Word formulir RPS.' },
    // Tinjauan RPS (115-patch-tinjauan-rps.sql, pemilik 2026-11-19): butir 15 unsur 5-8 setelah nilai akhir keluar.
    { href: 'tinjauan-rps.html', judul: 'Tinjauan RPS', boleh: isiKarya,
      ket: 'Tinjau RPS tiap MK setelah nilai akhir keluar: analisis CPL, materi dan metode, penilaian, pembaruan materi; disetujui Kaprodi, revisi jadi tindak lanjut.' },
    // Rekap RPS kurikulum (pemilik 2026-11-19): kalender asesmen lintas MK dan peta CPL dari bagian B.
    { href: 'rps-kurikulum.html', judul: 'Rekap RPS kurikulum', boleh: isiKarya,
      ket: 'Kalender asesmen semua MK per semester (penumpukan tugas per pekan), peta CPL dari CPMK berbobot, dan HOTS per tahun.' },
    // Simulasi PJP butir 18 (pemilik 2026-11-19): sks praktikum/praktik/penugasan per MK, di peramban saja.
    { href: 'pjp.html', judul: 'Simulasi PJP', boleh: s => mutu(s) || s.peran === 'pimpinan' || (s.koordinator || []).includes('kaprodi'),
      ket: 'Butir 18 LAM Teknik: PJP sekarang dan simulasi bila sks praktikum/praktik/penugasan beberapa MK diubah; unduh CSV untuk rapat kurikulum.' },
    // Portofolio MK (103-patch-portofolio-mk.sql, pemilik 2026-11-17, OBE O3): isi disaring basis data (koordinator MK, pengampu,
    // GKM, admin, pimpinan, asesor aktif).
    { href: 'portofolio.html', judul: 'Portofolio mata kuliah',
      ket: 'Per MK per semester dan per kelas: materi, soal, kunci/rubrik, contoh jawaban, presensi, BAP; kelengkapan dan indeks DOCX.' },
    { href: 'monitoring.html#cpl', judul: 'Capaian CPL',
      ket: 'Ketercapaian CPL: grafik per angkatan, progres per semester, peta MK × CPL, kelas yang belum tercapai.' },
    // Evaluasi pembelajaran (68-patch-evaluasi-pembelajaran.sql): dosen miliknya, admin/pimpinan semua, asesor rekap prodi.
    { href: 'evaluasi-pembelajaran.html', judul: 'Evaluasi pembelajaran',
      ket: 'EDOM, capaian CPL kelas, refleksi RPS per mata kuliah tiap semester, dan tindak lanjutnya.' },
    { href: 'data-prodi.html?tab=mk', judul: 'Mata kuliah dan CPL', boleh: admin,
      ket: 'Data prodi › Kurikulum & CPL: mata kuliah, CPL per kurikulum, peta MK–CPL, korelasi CPL antar kurikulum.' },
  ]},
  { judul: 'Kemahasiswaan', ket: 'Pengajuan mahasiswa (KP, TA, lomba, luaran, surat), seminar/sidang TA, dan layanan mahasiswa.', halaman: [
    // Pengajuan KP dan laporan lomba (90, pemilik 2026-11-17): pembimbing lalu admin; mahasiswa tanpa masuk akun.
    { href: 'pengajuan-mahasiswa.html', judul: 'Pengajuan mahasiswa', boleh: s => s.peran !== 'asesor',
      ket: 'KP, laporan lomba, dan permohonan surat dari mahasiswa: pembimbing lalu admin; surat pengantar dan surat bertanda tangan.' },
    // Rekap SDGs dengan bukti (pemilik 2026-11-16); halaman publik sdgs.html tanpa bukti.
    // Rekap seminar/sidang TA dan beban dosen (94-patch-jadwal-ta.sql, pemilik 2026-11-17).
    { href: 'rekap-ta.html', judul: 'Rekap seminar/sidang TA', boleh: s => s.peran !== 'asesor',
      ket: 'Seminar proposal, seminar kemajuan, sidang akhir per periode; beban membimbing dan menguji per dosen.' },
    // Rekap KP dan magang (105-patch-ruang-kp.sql, pemilik 2026-11-18): angka untuk semua staf; bukti untuk koordinator/admin/asesor.
    { href: 'rekap-kp.html', judul: 'Rekap KP dan magang', boleh: () => true,
      ket: 'Per tahun dan instansi, mitra kerja sama, beban bimbingan KP per dosen, bukti KP selesai untuk asesor.' },
    // Layanan mahasiswa (77, 78; pemilik 2026-11-16): pengumuman teks, tanya-jawab, kotak masuk pertanyaan/masukan.
    // Email alternatif mahasiswa (104): juga koordinator KP/TA dan pembina kemahasiswaan (hanya bagian itu).
    { href: 'kelola-layanan-mahasiswa.html', judul: 'Kelola layanan mahasiswa',
      boleh: s => admin(s) || (s.koordinator || []).some(j => ['koordinator_kp', 'koordinator_ta', 'pembina_kemahasiswaan'].includes(j)),
      ket: 'Pengumuman, tanya-jawab, kotak masuk pertanyaan/masukan mahasiswa, dan email alternatif mahasiswa.' },
  ]},
  { judul: 'Penelitian dan PkM', ket: 'Hibah, kepakaran dosen, dan SDGs.', halaman: [
    // Sama dengan boleh_hibah() di supabase/58-patch-hibah.sql.
    { href: 'hibah.html', judul: 'Pengajuan hibah', boleh: s => s.peran !== 'asesor',
      ket: 'Panggilan hibah dan proposal tim: tenggat, status, dana; didanai menjadi draf karya.' },
    { href: 'keahlian.html', judul: 'Kepakaran dosen',
      ket: 'Cari pakar, peta topik, dan usulan pembimbing/penguji TA dari keahlian dosen; halaman publik.' },
    { href: 'sdgs-bukti.html', judul: 'Rekap SDGs dan bukti',
      ket: 'Karya dosen per SDG beserta berkas bukti dan DOI-nya; karya tanpa bukti ditandai.' },
  ]},
  { judul: 'Kegiatan dan laboratorium', ket: 'Kalender, kabar kegiatan, rapat, laboratorium, dan profil prodi.', halaman: [
    // Kalender (64-patch-kegiatan.sql): semua pengguna terdaftar; kegiatan manual diisi admin (pemilik 2026-11-12).
    { href: 'kalender.html', judul: 'Kalender kegiatan',
      ket: 'Rapat, kegiatan prodi, tenggat hibah, tindak lanjut, dan temuan AMI dalam satu kalender; unduh .ics.' },
    // Kabar kegiatan (81-patch-kabar-kegiatan.sql, pemilik 2026-11-16): dosen mengajukan, admin menerbitkan.
    { href: 'kabar-kegiatan.html', judul: 'Kabar kegiatan', boleh: s => s.peran !== 'asesor',
      ket: 'Kuliah tamu, kunjungan lapangan, seminar, pengabdian, kompetisi: kabar dan foto untuk situs publik.' },
    // Rapat dan notulen (62-patch-rapat.sql): admin dan dosen mencatat; semua terdaftar membaca.
    { href: 'rapat.html', judul: 'Rapat dan notulen', boleh: s => s.peran !== 'asesor',
      ket: 'Agenda, peserta, keputusan, tindak lanjut ber-PJ, notulen Word, daftar hadir daring (QR).' },
    // Laboratorium (82-patch-laboratorium.sql, pemilik 2026-11-16): profil lab untuk situs publik.
    { href: 'kelola-laboratorium.html', judul: 'Kelola laboratorium', boleh: kalab,
      ket: 'Profil laboratorium untuk situs publik: ringkasan, koordinator, praktikum, layanan pengujian, foto.' },
    // Profil prodi (84-patch-profil-prodi.sql, pemilik 2026-11-16): sambutan, sejarah, pengelola.
    { href: 'kelola-profil.html', judul: 'Kelola profil prodi', boleh: admin,
      ket: 'Sambutan, sejarah, dan pengelola program studi untuk halaman publik Profil.' },
  ]},
  { judul: 'Mutu dan akreditasi', ket: 'Skor LAM, LED, bukti, SPMI, survei kepuasan, dan mutu data (GKM).', halaman: [
    { href: 'skor.html', judul: 'Skor akreditasi dan LED',
      ket: 'Perkiraan skor per butir, rekap bukti, unduh draf LED.' },
    { href: 'rincian.html?butir=23', judul: 'Rincian butir',
      ket: 'Data di balik angka tiap butir kuantitatif.' },
    { href: 'narasi-led.html', judul: 'Narasi LED', boleh: s => penyusun(s) || mutu(s),
      ket: 'Isian narasi per butir; tersimpan dan masuk draf LED saat diunduh.' },
    { href: 'kelengkapan.html', judul: 'Kelengkapan LED', boleh: s => penyusun(s) || mutu(s),
      ket: 'Daftar periksa otomatis: tim, narasi, data prodi, dokumen, dan bukti.' },
    { href: 'input-butir.html', judul: 'Isian butir dan dokumen', boleh: mutu,
      ket: 'Butir kualitatif, pustaka dokumen, bukti per butir.' },
    // Siklus PPEPP (67-patch-standar-spmi.sql): semua terdaftar membaca, admin mengisi (pemilik 2026-11-12).
    { href: 'siklus-ppepp.html', judul: 'Siklus PPEPP',
      ket: 'Butir standar SPMI per TS: target, capaian, bukti, rencana perbaikan, dan revisi standar.' },
    { href: 'kelola-survei.html', judul: 'Kelola survei kepuasan', boleh: mutu,
      ket: 'Survei anonim mahasiswa, dosen, tendik, mitra, pengguna lulusan: buat, bagikan tautan, baca hasil.' },
    { href: 'hasil-survei.html', judul: 'Hasil survei kepuasan',
      ket: 'Rekap survei kepuasan per kelompok dan aspek; halaman publik.' },
    // Kegiatan prodi sebagai bukti pendukung akreditasi (88-patch-kegiatan-akreditasi.sql, pemilik 2026-11-17).
    { href: 'kegiatan-akreditasi.html', judul: 'Kegiatan untuk akreditasi',
      ket: 'Kuliah tamu, kuliah lapangan, seminar: keterkaitan butir, bukti, dan agenda suasana akademik per bulan.' },
    { href: 'mutu-data.html', judul: 'Mutu data', boleh: mutu,
      ket: 'Data yang perlu diperbaiki: karya tanpa bukti, DOI ganda, judul mirip, ID dosen, RPS, tracer.' },
  ]},
  { judul: 'Pemantauan', ket: 'Kinerja prodi dan dosen dari waktu ke waktu.', halaman: [
    // Dasbor operasional (pemilik 2026-11-17): antrean dan keterlambatan per bidang dan penanggung jawabnya.
    { href: 'dasbor.html', judul: 'Dasbor operasional', boleh: s => admin(s) || s.peran === 'pimpinan',
      ket: 'Per bidang (TA, KP, kemahasiswaan, mutu, lab, administrasi): penanggung jawab, antrean, dan yang terlambat.' },
    { href: 'monitoring.html', judul: 'Pemantauan kinerja',
      ket: 'Rekap per tahun atau TS, per dosen, dan syarat unggul.' },
    { href: 'grafik.html', judul: 'Grafik untuk LED',
      ket: 'Grafik siap pakai untuk laporan dan LED.' },
    // Target kinerja per dosen (66-patch-target-dosen.sql, pemilik 2026-11-12): dosen melihat miliknya.
    { href: 'target.html', judul: 'Target kinerja dosen', boleh: s => s.peran !== 'asesor',
      ket: 'Target tahunan per dosen (publikasi, penelitian, PkM, luaran, rekognisi, hibah) dibandingkan capaiannya.' },
  ]},
  { judul: 'Admin prodi', ket: 'Verifikasi, data prodi, dosen, penugasan koordinator, pengingat (khusus admin).', halaman: [
    { href: 'verifikasi.html', judul: 'Verifikasi data', boleh: admin,
      ket: 'Karya dosen, profil dosen, BKD, dan prestasi mahasiswa yang menunggu keputusan admin.' },
    { href: 'data-prodi.html', judul: 'Data prodi', boleh: dataProdi,
      ket: 'Mahasiswa, lulusan, tracer, kerja sama, BKD, prestasi mahasiswa.' },
    { href: 'kelola-dosen.html', judul: 'Kelola dosen', boleh: admin,
      ket: 'Email yang terdaftar dan perannya.' },
    { href: 'koordinator.html', judul: 'Penugasan koordinator', boleh: admin,
      ket: 'Penugasan koordinator TA, KP/magang, kemahasiswaan, kepala lab, GKM: periode dan SK; wewenang per bidang.' },
    { href: 'pengingat.html', judul: 'Pengingat', boleh: admin,
      ket: 'Kirim pengingat email (templat bisa disimpan): pembaruan karya dan profil, BKD, karya perlu diperbaiki, bukti, hibah, tindak lanjut.' },
    // Jejak perubahan (65-patch-jejak.sql, pemilik 2026-11-12): khusus admin, termasuk paket akreditasi.
    { href: 'jejak.html', judul: 'Jejak perubahan', boleh: admin,
      ket: 'Siapa mengubah apa dan kapan pada data penting (karya, dosen, LKPS, bukti, LED); disimpan 3 tahun.' },
  ]},
  { judul: 'Bantuan', ket: 'Cara memakai ruang kerja.', halaman: [
    { href: 'panduan.html', judul: 'Panduan pengguna',
      ket: 'Langkah untuk dosen; bagian admin tampil untuk admin.' },
  ]},
];

const berkas = href => String(href).split(/[?#]/)[0].split('/').pop() || 'index.html';
const berkasIni = () => berkas(location.pathname);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Halaman ruang kerja yang boleh dibuka `saya` (baris tabel dosen).
export function halamanBoleh(saya){
  // Modul yang dimatikan di config.js (FITUR_MATI, fitur.js) tidak tampil.
  return MODUL.map(m => ({ ...m, halaman: m.halaman.filter(h => halamanAktif(h.href) && (!h.boleh || h.boleh(saya))) }))
    .filter(m => m.halaman.length);
}

// true bila `href` halaman ruang kerja yang boleh dibuka; null bila bukan
// halaman ruang kerja (dipakai ruang-kerja.html untuk menolak ?ke= asing).
export function bolehBuka(saya, href){
  const b = berkas(href);
  const h = MODUL.flatMap(m => m.halaman).find(x => berkas(x.href) === b);
  if (!h) return null;
  return halamanAktif(h.href) && (!h.boleh || h.boleh(saya));
}

// { email, saya }: saya = baris dosen atau null (belum terdaftar);
// null bila belum login. Disimpan supaya menu dan halaman tidak membaca ulang;
// segar=true membaca ulang (setelah SIGNED_IN).
let PENGGUNA = null;
export function pengguna(sb, segar = false){
  if (!PENGGUNA || segar) PENGGUNA = (async () => {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return null;
    // Semua kolom: kolom yang belum ada (patch belum dijalankan) tidak menggagalkan menu.
    const { data } = await dosenLogin(sb, session, '*');
    // Jabatan koordinator yang aktif hari ini (97); tabel belum ada = tanpa jabatan.
    let koor = [];
    if (data?.id) {
      const r = await sb.from('koordinator').select('jabatan,laboratorium_id,mulai,selesai').eq('dosen_id', data.id);
      koor = r.error ? [] : aktifPada(r.data);
    }
    return { email: session.user.email, saya: data ? { ...data, koordinator: koor.map(k => k.jabatan),
      koordinatorLab: koor.filter(k => k.jabatan === 'kepala_lab').map(k => k.laboratorium_id) } : null };
  })();
  return PENGGUNA;
}

// Nama prodi dan institusi dari data.json (bangun.py, variabel NAMA_PRODI dan
// NAMA_INSTITUSI), supaya prodi lain cukup mengganti pengaturan, bukan halaman.
// Merek institusi didahulukan: situs milik prodi (pemilik 2026-11-04).
let IDENTITAS = null;
export function identitas(){
  if (!IDENTITAS) IDENTITAS = fetch('data.json')
    .then(r => r.ok ? r.json() : {})
    .then(d => ({ prodi: d.prodi || '', institusi: d.institusi || '' }))
    .catch(() => ({ prodi: '', institusi: '' }));
  return IDENTITAS;
}

// Baris institusi di kepala halaman (kepala.css, elemen [data-identitas]),
// diisi saat modul dimuat, jadi tampil juga di layar masuk.
identitas().then(({ prodi, institusi }) => {
  const teks = [prodi && 'Program Studi ' + prodi, institusi].filter(Boolean).join(' · ');
  document.querySelectorAll('[data-identitas]').forEach(el => { el.textContent = teks; });
  if (document.querySelector('[data-identitas]')) pasangJudul();
});

// Judul tab ruang kerja (pemilik 2026-11-19): "Skor akreditasi dan LED — Ruang kerja" ->
// "Skor akreditasi dan LED — Ruang kerja Teknik Sipil"; halaman Ruang kerja sendiri: "Ruang kerja Teknik Sipil".
export const judulRuangKerja = (depan, prodi) => {
  const rk = prodi ? 'Ruang kerja ' + prodi : 'Ruang kerja';
  // pasangJudul bisa terpanggil dua kali: judul yang sudah "Ruang kerja <prodi>" tidak diberi akhiran lagi.
  return !depan || depan === 'Ruang kerja' || depan === rk ? rk : depan + ' — ' + rk;
};
export async function pasangJudul(){
  const { prodi } = await identitas();
  if (prodi) document.title = judulRuangKerja(document.title.split(' — ')[0], prodi);
}

const CSS = `
.rk-menu{background:var(--biru-gelap);color:var(--biru-m6);font:13px/1.4 'IBM Plex Sans',system-ui,sans-serif;
  border-bottom:1px solid rgba(255,255,255,.08)}
.rk-in{padding:7px 24px;display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px}
.rk-menu a{color:var(--biru-m6);text-decoration:none;padding:3px 7px;border-radius:3px}
.rk-menu a:hover{background:rgba(255,255,255,.1);color:#fff}
.rk-menu a.rk-merek{display:flex;align-items:center;gap:9px;padding:2px 4px 2px 0}
.rk-menu a.rk-merek:hover{background:none}
.rk-merek img{height:30px;background:#fff;border-radius:3px;padding:2px 5px}
.rk-merek span{display:flex;flex-direction:column;line-height:1.2}
.rk-merek b{color:#fff;font-weight:700;letter-spacing:.01em}
.rk-merek small{color:var(--biru-m3);font-size:11px}
.rk-menu a[aria-current="page"]{background:#fff;color:var(--biru);font-weight:600}
.rk-grup{position:relative}
.rk-grup>summary{list-style:none;cursor:pointer;padding:3px 9px;border-radius:3px;color:var(--biru-m6)}
.rk-grup>summary::-webkit-details-marker{display:none}
.rk-grup>summary::after{content:'';display:inline-block;margin-left:7px;vertical-align:2px;
  border:4px solid transparent;border-top-color:currentColor;border-bottom:0}
.rk-grup>summary:hover,.rk-grup[open]>summary{background:rgba(255,255,255,.1);color:#fff}
.rk-grup.rk-ini>summary{color:#fff;font-weight:600;box-shadow:inset 0 -2px 0 var(--merah)}
.rk-isi{position:absolute;top:calc(100% + 6px);left:0;z-index:50;min-width:240px;background:#fff;
  border:1px solid var(--line);border-radius:4px;box-shadow:0 8px 24px rgba(var(--biru-gelap-rgb),.18);padding:6px}
.rk-menu .rk-isi a{display:block;color:var(--ink);padding:7px 10px}
.rk-menu .rk-isi a:hover{background:var(--line-soft);color:var(--biru)}
.rk-menu .rk-isi a[aria-current="page"]{background:var(--biru);color:#fff}
.rk-user{margin-left:auto;display:flex;align-items:center;gap:10px;color:var(--biru-m3)}
.rk-user button{font:inherit;color:var(--biru-m6);background:none;border:1px solid rgba(255,255,255,.3);
  border-radius:3px;padding:2px 10px;cursor:pointer}
.rk-user button:hover{background:rgba(255,255,255,.12)}
@media(max-width:760px){.rk-in{padding:8px 16px}.rk-user{margin-left:0;width:100%}
  .rk-isi{min-width:210px}}
.rk-cari{position:relative}
.rk-cari input{font:inherit;width:230px;padding:3px 9px;border-radius:3px;border:1px solid rgba(255,255,255,.3);
  background:rgba(255,255,255,.1);color:#fff}
.rk-cari input::placeholder{color:var(--biru-m3)}
.rk-cari input:focus{outline:none;background:#fff;color:var(--ink)}
@media(max-width:760px){.rk-cari{width:100%}.rk-cari input{width:100%}}
@media print{.rk-menu{display:none}}`;

// Menu atas untuk pengguna terdaftar; tidak tampil bila belum login atau
// belum terdaftar (halaman menampilkan layar masuknya sendiri).
export async function pasangMenu(sb){
  let u = await pengguna(sb);
  if (!u?.saya) u = await pengguna(sb, true);   // mis. dipanggil lagi setelah SIGNED_IN
  if (!u?.saya) return null;
  const ini = berkasIni();
  const { prodi, institusi } = await identitas();
  // Diperiksa SETELAH semua await: halaman bisa memanggil pasangMenu dua kali
  // hampir bersamaan (muat awal + SIGNED_IN); tanpa ini menu terpasang dua kali.
  if (document.querySelector('.rk-menu')) return u.saya;
  pasangJudul();
  // Satu menu tarik-turun per modul, supaya menu tetap satu baris.
  const grup = halamanBoleh(u.saya).map(m => {
    const diSini = m.halaman.some(h => berkas(h.href) === ini);
    return `<details class="rk-grup${diSini ? ' rk-ini' : ''}"><summary>${esc(m.judul)}</summary>
      <div class="rk-isi">${m.halaman.map(h => `<a href="${esc(h.href)}"${
        berkas(h.href) === ini ? ' aria-current="page"' : ''}>${esc(h.judul)}</a>`).join('')}</div></details>`;
  }).join('');
  const gaya = document.createElement('style');
  gaya.textContent = CSS;
  document.head.appendChild(gaya);
  const nav = document.createElement('nav');
  nav.className = 'rk-menu';
  nav.setAttribute('aria-label', 'Menu ruang kerja');
  nav.innerHTML = `<div class="rk-in">
    <a class="rk-merek" href="ruang-kerja.html"><img src="logo-uper.png" alt="${esc(institusi)}">
      <span><b>${esc(prodi || 'Program studi')}</b><small>${esc(institusi)}</small></span></a>
    <a href="ruang-kerja.html"${ini === 'ruang-kerja.html' ? ' aria-current="page"' : ''}>Ruang kerja</a>
    ${grup}
    <div class="rk-user"><div class="rk-cari"><input type="search" placeholder="Cari… (tekan /)" aria-label="Cari di situs"
        autocomplete="off"></div><a href="index.html">Beranda umum</a>
      <span>${esc(u.saya.nama)}</span><button type="button">Keluar</button></div></div>`;
  nav.querySelector('button').onclick = async () => {
    await sb.auth.signOut();
    location.href = 'index.html';
  };
  // Satu menu terbuka sekaligus; klik di luar menu menutupnya.
  const grupEl = [...nav.querySelectorAll('.rk-grup')];
  grupEl.forEach(d => d.addEventListener('toggle', () => {
    if (d.open) grupEl.forEach(x => { if (x !== d) x.open = false; });
  }));
  document.addEventListener('click', e => {
    if (!nav.contains(e.target)) grupEl.forEach(x => { x.open = false; });
  });
  document.body.prepend(nav);
  // Pencarian menyeluruh (pemilik 2026-11-12; cari-ui.js, cari.js): dimuat saat pertama dipakai.
  const kotak = nav.querySelector('.rk-cari input');
  let siapCari = null;
  const muatCari = () => siapCari || (siapCari = import('./cari-ui.js?v=2026-11-19-52202c').then(m =>
    m.pasangCari(kotak, { sb, saya: u.saya, modul: halamanBoleh(u.saya), boleh: h => bolehBuka(u.saya, h) !== false })));
  kotak.addEventListener('focus', muatCari);
  document.addEventListener('keydown', e => {
    if (e.key === '/' && !e.target.closest?.('input,textarea,select,[contenteditable]')) { e.preventDefault(); kotak.focus(); }
  });
  return u.saya;
}

// Untuk halaman ruang kerja tanpa layar masuk sendiri (monitoring, grafik):
// belum login, belum terdaftar, atau tidak berhak -> ke ruang-kerja.html,
// yang mengembalikan ke halaman ini setelah masuk. Selain itu memasang menu
// dan mengembalikan baris dosen.
export async function gerbang(sb){
  const u = await pengguna(sb);
  const ke = berkasIni() + location.search;
  if (!u?.saya || bolehBuka(u.saya, ke) === false){
    const q = u?.saya ? 'tolak=' : 'ke=';
    location.replace('ruang-kerja.html?' + q + encodeURIComponent(ke));
    return new Promise(() => {});   // halaman berhenti di sini
  }
  return pasangMenu(sb);
}
