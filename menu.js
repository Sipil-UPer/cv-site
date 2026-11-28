import { dosenLogin } from './dosen-login.js?v=2026-11-28-44f629';
import { aktifPada } from './koordinator.js?v=2026-11-28-44f629';
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
// Pimpinan yang bukan DTPS prodi ini (mis. Dekan) = hanya-baca (157-patch-pimpinan-hanya-baca.sql, pemilik 2026-11-22):
// menu hanya halaman pantauan; basis data menolak semua tulisan kecuali penetapan oleh Dekan aktif.
export const hanyaBaca = s => s?.peran === 'pimpinan' && !(s.dtps === true || ['ya', 'y', 'true', '1'].includes(String(s.dtps ?? '').toLowerCase()));
const PANTAUAN = ['dasbor.html', 'monitoring.html', 'skor.html', 'grafik.html', 'hasil-survei.html', 'kalender.html', 'panduan.html'];
// Dekan aktif (Penugasan koordinator) tetap menetapkan RPS dan ekuivalensi (116, 134).
// Surat dan SK (201, pemilik 2026-11-28): Dekan menandatangani SK prodi.
const PENETAPAN_DEKAN = ['rps.html', 'ekuivalensi.html', 'surat.html'];
const pantauanBoleh = (s, href) => PANTAUAN.includes(berkas(href)) || ((s.koordinator || []).includes('dekan') && PENETAPAN_DEKAN.includes(berkas(href)));
// Asesor dan pimpinan hanya-baca tidak mengisi karya.
const isiKarya = s => s.peran !== 'asesor' && !hanyaBaca(s);
// Menu per peran (pemilik 2026-11-26): dosen biasa hanya melihat pekerjaannya sendiri; fitur koordinator dan pengelola tampil
// untuk jabatannya dan admin. `tampil` hanya mengatur menu (juga pintasan dan pencarian); halamannya tetap bisa dibuka lewat
// tautan bila `boleh` mengizinkan (mis. Rekap TA dari Tugas saya untuk revisi, peringatan dini, dan Metopen).
const punyaJ = (s, ...js) => (s.koordinator || []).some(j => js.includes(j));
const kaprodi = s => punyaJ(s, 'kaprodi');
const pengelola = s => admin(s) || kaprodi(s) || s.peran === 'pimpinan';
const pemantau = s => pengelola(s) || mutu(s) || s.peran === 'asesor';
const akreditasi = s => pemantau(s) || penyusun(s);
const koorTA = s => pengelola(s) || mutu(s) || punyaJ(s, 'koordinator_ta');
const koorKP = s => pemantau(s) || punyaJ(s, 'koordinator_kp');
const koorLayanan = s => pengelola(s) || punyaJ(s, 'koordinator_ta', 'koordinator_kp', 'pembina_kemahasiswaan');

import { halamanAktif } from './fitur.js?v=2026-11-28-44f629';
import { BUTIR_LAM_TEKNIK } from './bobot.js?v=2026-11-28-44f629';
import { pasangPemicuBangun } from './pemicu-bangun.js?v=2026-11-28-44f629';
// Tinggi kotak teks mengikuti isi (pemilik 2026-11-25); bentuk "from" agar dicap stamp_versions.py.
import { pasSemua as pasKotakTeks } from './kotak-teks.js?v=2026-11-28-44f629';

export const MODUL = [
  { judul: 'Data saya', ket: 'Profil, karya, target kinerja, jadwal berhalangan, dan kalender Anda.', halaman: [
  // Susunan menu mengikuti alur kerja (pemilik 2026-11-23): Data saya (milik dosen), Pengajaran (urut alur MK:
  // koordinator dan tim -> silabus -> CPMK -> RPS -> kelas dan jadwal -> nilai CPL -> portofolio -> evaluasi -> tinjauan),
  // Kurikulum dan CPL prodi, Kemahasiswaan, Penelitian dan PkM, Kegiatan, Mutu dan akreditasi (termasuk Grafik untuk LED),
  // Pemantauan, Pengelolaan (termasuk Kelengkapan situs publik), Bantuan. Alamat halaman tidak berubah.
  // Susunan modul (pemilik 2026-11-17): mengikuti pembagian tugas koordinator prodi (kemahasiswaan,
  // laboratorium, mutu & akreditasi/GKM) dan pemantauan oleh koordinator prodi; admin prodi terpisah.
  // Tahap 3 (pemilik 2026-11-20): "Pembelajaran dan CPL" dipecah jadi Mata kuliah saya (pekerjaan dosen per MK) dan
  // Kurikulum dan CPL prodi (rekap prodi); halaman admin, profil prodi, dan laboratorium dikumpulkan di Pengelolaan.
    { href: 'profil.html', judul: 'Profil saya',
      ket: 'Nama, SINTA, Scopus, ORCID, pendidikan, jabatan; perubahan disetujui admin.' },
    { href: 'karya.html', judul: 'Karya dosen', boleh: isiKarya,
      ket: 'Publikasi, penelitian, PkM, luaran, rekognisi, dan buktinya.' },
    // Target kinerja per dosen (66-patch-target-dosen.sql, pemilik 2026-11-12): dosen melihat miliknya.
    { href: 'target.html', judul: 'Target kinerja dosen', boleh: s => s.peran !== 'asesor',
      ket: 'Target tahunan per dosen (publikasi, penelitian, PkM, luaran, rekognisi, hibah) dibandingkan capaiannya.' },
    // Rencana pengembangan dosen dan tendik (198, pemilik 2026-11-27).
    { href: 'rencana-pengembangan.html', judul: 'Rencana pengembangan', boleh: s => s.peran !== 'asesor',
      ket: 'Rencana dan realisasi studi lanjut, sertifikasi, pelatihan, dan kenaikan jabatan per tahun; admin/Kaprodi juga untuk tendik, dengan rekap.' },
    // Surat dan SK yang menyebut dosen (201, pemilik 2026-11-28); pengelola membuka halaman yang sama dari Pengelolaan.
    { href: 'surat.html#saya', judul: 'Surat dan SK saya', boleh: s => s.peran !== 'asesor', tampil: s => !(pengelola(s) || punyaJ(s, 'dekan')),
      ket: 'SK prodi dan surat tugas yang menyebut nama Anda, dengan Word bertanda tangan elektronik (QR) untuk BKD/SISTER.' },
    // Jadwal berhalangan (132-patch-jadwal-berhalangan.sql, pemilik 2026-11-20): dosen mengisi slot yang tidak bisa; pengatur jadwal mencari slot kosong.
    { href: 'jadwal-berhalangan.html', judul: 'Jadwal berhalangan', boleh: isiKarya,
      ket: 'Slot jam kuliah yang tidak bisa Anda pakai (termasuk jadwal di luar prodi); admin, Kaprodi, dan koordinator TA/KP mencari slot kosong untuk sidang dan rapat.' },
    // Kalender saya (162, pemilik 2026-11-24): kalender.html dalam mode pribadi.
    { href: 'kalender.html?saya=1', judul: 'Kalender saya', boleh: s => s.peran !== 'asesor',
      ket: 'Hanya yang menyangkut Anda: jadwal mengajar, rapat yang mengundang Anda, agenda dari admin, tenggat Anda, berhalangan, hari libur; unduh .ics.' },
  ]},
  { judul: 'Pengajaran', ket: 'Alur mata kuliah (silabus, CPMK, RPS, nilai CPL, portofolio, evaluasi), penyusunan kelas dan jadwal, serta kurikulum dan CPL prodi.', halaman: [
    // Mata kuliah saya (pemilik 2026-11-23): MK yang saya koordinasikan/ikut timnya dan kelas semester ini, urut alur kerja.
    { sub: 'Mata kuliah', href: 'mk-saya.html', judul: 'Mata kuliah saya', boleh: isiKarya,
      ket: 'MK yang Anda koordinasikan atau ikut timnya dan kelas Anda semester ini: status silabus, CPMK, RPS, dan tautan ke tiap langkah.' },
    // Silabus (129-patch-silabus.sql, pemilik 2026-11-20): lampiran dokumen kurikulum, disahkan Kaprodi.
    { sub: 'Mata kuliah', href: 'silabus.html', judul: 'Silabus', boleh: isiKarya,
      ket: 'Silabus per mata kuliah dalam bahasa Indonesia dan Inggris, disahkan Kaprodi; unduh Word lampiran silabus dokumen kurikulum.' },
    // CPMK dan RPS per MK (102-patch-cpmk-rps.sql, pemilik 2026-11-17, OBE O2): templat nilai CPL terisi per kelas.
    { sub: 'Mata kuliah', href: 'cpmk.html', judul: 'CPMK dan penilaian', boleh: isiKarya,
      ket: 'CPMK, Sub-CPMK, butir asesmen, bobot, dan RPS per mata kuliah; unduh templat nilai CPL yang sudah terisi per kelas.' },
    // RPS K26 (111-patch-rps-k26.sql, pemilik 2026-11-18): dosen mengisi RPS di situs, unduh Word Formulir RPS K26.
    { sub: 'Mata kuliah', href: 'rps.html', judul: 'RPS', boleh: isiKarya,
      ket: 'Susun RPS per mata kuliah dan kurikulum (K21, K26, …; bagian B dari CPMK dan penilaian), periksa otomatis menurut Panduan, unduh Word formulir RPS.' },
    { sub: 'Mata kuliah', href: 'nilai-cpl.html', judul: 'Berkas nilai CPL', boleh: isiKarya,
      ket: 'Unggah Template_Input_Data_CPL per kelas (diperiksa sebelum dikirim, disimpan privat); admin: daftar kelas dan pengingat.' },
    // Portofolio MK (103-patch-portofolio-mk.sql, pemilik 2026-11-17, OBE O3): isi disaring basis data (koordinator MK, pengampu,
    // GKM, admin, pimpinan, asesor aktif).
    { sub: 'Mata kuliah', href: 'portofolio.html', judul: 'Portofolio mata kuliah',
      ket: 'Per MK per semester dan per kelas: materi, soal, kunci/rubrik, contoh jawaban, presensi, BAP; kelengkapan dan indeks DOCX.' },
    // Evaluasi pembelajaran (68-patch-evaluasi-pembelajaran.sql): dosen miliknya, admin/pimpinan semua, asesor rekap prodi.
    { sub: 'Mata kuliah', href: 'evaluasi-pembelajaran.html', judul: 'Evaluasi pembelajaran',
      ket: 'EDOM, capaian CPL kelas, refleksi RPS per mata kuliah tiap semester, dan tindak lanjutnya.' },
    // Tinjauan RPS (115-patch-tinjauan-rps.sql, pemilik 2026-11-19): butir 15 unsur 5-8 setelah nilai akhir keluar.
    { sub: 'Mata kuliah', href: 'tinjauan-rps.html', judul: 'Tinjauan RPS', boleh: isiKarya,
      ket: 'Tinjau RPS tiap MK setelah nilai akhir keluar: analisis CPL, materi dan metode, penilaian, pembaruan materi; disetujui Kaprodi, revisi jadi tindak lanjut.' },
    // Koordinator dan tim MK (158, pemilik 2026-11-23): langkah pertama; Kaprodi aktif atau admin menetapkan, lainnya melihat.
    { sub: 'Penyusunan', href: 'koordinator-mk.html', judul: 'Koordinator dan tim MK', boleh: s => s.peran !== 'asesor', tampil: s => pengelola(s) || mutu(s),
      ket: 'Satu koordinator dan tim dosen per mata kuliah per kurikulum, status silabus/CPMK/RPS, beban per dosen, usulan dari kurikulum lama.' },
    // Penyusunan kelas (136, pemilik 2026-11-21): admin/Kaprodi menyusun, dosen melihat kelasnya.
    { sub: 'Penyusunan', href: 'kelas.html', judul: 'Penyusunan kelas', boleh: s => s.peran !== 'asesor', tampil: pengelola,
      ket: 'Kelas per semester: satu MK beberapa kelas, dosen pengampu dan team teaching; isi manual atau impor CSV, unduh CSV untuk penyusunan jadwal.' },
    // Jadwal kuliah (150, pemilik 2026-11-22): admin/Kaprodi menyusun (run_jadwal.py), Kaprodi mengesahkan, lalu dosen melihat.
    { sub: 'Penyusunan', href: 'jadwal-kuliah.html', judul: 'Jadwal kuliah', boleh: s => s.peran !== 'asesor',
      ket: 'Hari, jam, dan ruang tiap kelas: disusun dengan run_jadwal.py atau manual, diperiksa bentroknya, disahkan Kaprodi, lalu tampil untuk semua dosen.' },
    // Ujian dan validasi soal (195, pemilik 2026-11-27).
    { sub: 'Penyusunan', href: 'ujian.html', judul: 'Ujian dan validasi soal', boleh: s => s.peran !== 'asesor',
      ket: 'Jadwal UTS/UAS per kelas, ruang, dan pengawas (saran dari Jadwal berhalangan); validasi soal oleh GKM/Kaprodi yang bukan pengampu.' },
    { sub: 'Kurikulum dan CPL', href: 'data-prodi.html?tab=mk', judul: 'Mata kuliah dan CPL', boleh: admin,
      ket: 'Data prodi › Kurikulum & CPL: mata kuliah, CPL per kurikulum, peta MK–CPL, korelasi CPL antar kurikulum.' },
    // Rekap RPS kurikulum (pemilik 2026-11-19): kalender asesmen lintas MK dan peta CPL dari bagian B.
    { sub: 'Kurikulum dan CPL', href: 'rps-kurikulum.html', judul: 'Rekap RPS kurikulum', boleh: isiKarya, tampil: s => pengelola(s) || mutu(s),
      ket: 'Kalender asesmen semua MK per semester (penumpukan tugas per pekan), peta CPL dari CPMK berbobot, dan HOTS per tahun.' },
    { sub: 'Kurikulum dan CPL', href: 'monitoring.html#cpl', judul: 'Capaian CPL', tampil: pemantau,
      ket: 'Ketercapaian CPL: grafik per angkatan, progres per semester, peta MK × CPL, kelas yang belum tercapai.' },
    // Simulasi PJP butir 18 (pemilik 2026-11-19): sks praktikum/praktik/penugasan per MK, di peramban saja.
    { sub: 'Kurikulum dan CPL', href: 'pjp.html', judul: 'Simulasi PJP', lam: true, boleh: s => mutu(s) || s.peran === 'pimpinan' || (s.koordinator || []).includes('kaprodi'),
      ket: 'Butir 18 LAM Teknik: PJP sekarang dan simulasi bila sks praktikum/praktik/penugasan beberapa MK diubah; unduh CSV untuk rapat kurikulum.' },
    // Ekuivalensi MK kurikulum lama -> baru (134, pemilik 2026-11-21): semua membaca (Dosen Wali); Kaprodi sahkan, Dekan tetapkan.
    { sub: 'Kurikulum dan CPL', href: 'ekuivalensi.html', judul: 'Ekuivalensi mata kuliah',
      ket: 'Tabel padanan MK kurikulum lama ke baru (1:1, 1:2, 2:1): disahkan Kaprodi, ditetapkan Dekan, lalu terbit di halaman publik.' },
  ]},
  { judul: 'Mahasiswa', ket: 'Pengajuan mahasiswa, Tugas Akhir, perwalian, dan koordinasi TA, KP, serta layanan mahasiswa.', halaman: [
  // Kemahasiswaan dipecah per peran (pemilik 2026-11-26): pekerjaan dosen (pembimbing, penguji, wali) dan koordinasi.
    // Pengajuan KP dan laporan lomba (90, pemilik 2026-11-17): pembimbing lalu admin; mahasiswa tanpa masuk akun.
    { sub: 'Bimbingan', href: 'pengajuan-mahasiswa.html', judul: 'Pengajuan mahasiswa', boleh: s => s.peran !== 'asesor',
      ket: 'KP, laporan lomba, dan permohonan surat dari mahasiswa: pembimbing lalu admin; surat pengantar dan surat bertanda tangan.' },
    // Rekap SDGs dengan bukti (pemilik 2026-11-16); halaman publik sdgs.html tanpa bukti.
    // Tugas Akhir (pemilik 2026-11-25: susunan dirapikan): satu pintu ke halaman TA menurut alur, lalu halaman TA urut alur.
    { sub: 'Bimbingan', href: 'ruang-ta.html', judul: 'Tugas Akhir', boleh: s => s.peran !== 'asesor',
      ket: 'Alur TA, pekerjaan saya yang menunggu, dan tautan ke bimbingan, penilaian, rekap, serta halaman mahasiswa.' },
    // Penilaian seminar/sidang TA dan berita acara (173-patch-penilaian-ta.sql, pemilik 2026-11-25).
    // Catatan bimbingan TA dengan konfirmasi pembimbing (175-patch-bimbingan-ta.sql, pemilik 2026-11-25).
    { sub: 'Bimbingan', href: 'bimbingan-ta.html', judul: 'Bimbingan TA', boleh: s => s.peran !== 'asesor',
      ket: 'Konfirmasi catatan bimbingan mahasiswa, riwayat dan rekap bimbingan per mahasiswa, minimal bimbingan per tahap.' },
    { sub: 'Bimbingan', href: 'penilaian-ta.html', judul: 'Penilaian seminar dan sidang TA', boleh: s => s.peran !== 'asesor',
      ket: 'Pembimbing dan penguji mengisi nilai menurut form penilaian; koordinator TA menetapkan dan mencetak berita acara.' },
    // Perwalian (186-patch-perwalian.sql, pemilik 2026-11-26): dosen wali mencatat pertemuan (minimal 2 per semester); rekap untuk
    // admin, Kaprodi, pimpinan; admin mengunggah daftar mahasiswa aktif dari SIAKAD dan menetapkan wali.
    { sub: 'Bimbingan', href: 'perwalian.html', judul: 'Perwalian', boleh: s => s.peran !== 'asesor',
      ket: 'Mahasiswa perwalian dan catatan pertemuan per semester; rekap per dosen wali; unggah daftar mahasiswa aktif dan tetapkan wali.' },
    // Daftar mahasiswa (pemilik 2026-11-26): aktif + lulusan, IPK/SKS, email, wali, TA; akses = RLS mahasiswa (186).
    { sub: 'Bimbingan', href: 'daftar-mahasiswa.html', judul: 'Daftar mahasiswa', boleh: s => s.peran !== 'asesor',
      ket: 'Mahasiswa aktif dan lulusan: cari, saring per angkatan/status/tahun lulus, IPK dan SKS terakhir, wali, TA; unduh Excel (sasaran tracer).' },
    // Rekap seminar/sidang TA dan beban dosen (94-patch-jadwal-ta.sql, pemilik 2026-11-17).
    { sub: 'Koordinasi', href: 'rekap-ta.html', judul: 'Rekap seminar/sidang TA', boleh: s => s.peran !== 'asesor', tampil: koorTA,
      ket: 'Jadwal mendatang, revisi berjalan, beban dosen, kuota pembimbing per semester, berkas per tahap.' },
    // Rekap KP dan magang (105-patch-ruang-kp.sql, pemilik 2026-11-18): angka untuk semua staf; bukti untuk koordinator/admin/asesor.
    { sub: 'Koordinasi', href: 'rekap-kp.html', judul: 'Rekap KP dan magang', boleh: () => true, tampil: koorKP,
      ket: 'Per tahun dan instansi, mitra kerja sama, beban bimbingan KP per dosen, bukti KP selesai untuk asesor.' },
    // Layanan mahasiswa (77, 78; pemilik 2026-11-16): pengumuman teks, tanya-jawab, kotak masuk pertanyaan/masukan.
    // Email alternatif mahasiswa (104): juga koordinator KP/TA dan pembina kemahasiswaan (hanya bagian itu).
    { sub: 'Koordinasi', href: 'kelola-layanan-mahasiswa.html', judul: 'Kelola layanan mahasiswa',
      boleh: s => admin(s) || (s.koordinator || []).some(j => ['koordinator_kp', 'koordinator_ta', 'pembina_kemahasiswaan', 'kaprodi', 'gkm'].includes(j)), tampil: s => koorLayanan(s) || mutu(s),
      ket: 'Pengumuman, tanya-jawab, kotak masuk pertanyaan/masukan/pengaduan mahasiswa (pengaduan: Kaprodi dan GKM), dan email alternatif mahasiswa.' },
    // Karier dan rekrutmen asisten (202, pemilik 2026-11-28): lowongan (admin/Kaprodi/pembina), asisten (kepala lab, PJ, Kaprodi).
    { sub: 'Koordinasi', href: 'kelola-karier.html', judul: 'Kelola karier dan asisten', boleh: s => s.peran !== 'asesor', tampil: s => pengelola(s) || kalab(s) || punyaJ(s, 'pembina_kemahasiswaan'),
      ket: 'Lowongan kerja/magang (moderasi usulan alumni dan mitra) dan rekrutmen asisten praktikum/MK: lamaran, IPK SIAKAD, keputusan, SK asisten.' },
  ]},
  { judul: 'Riset dan kegiatan', ket: 'Hibah, insentif, kepakaran, SDGs, kalender kegiatan, kabar kegiatan, dan rapat.', halaman: [
    // Sama dengan boleh_hibah() di supabase/58-patch-hibah.sql.
    { sub: 'Penelitian dan PkM', href: 'hibah.html', judul: 'Pengajuan hibah', boleh: s => s.peran !== 'asesor',
      ket: 'Panggilan hibah dan proposal tim: tenggat, status, dana; didanai menjadi draf karya.' },
    // Insentif publikasi (163, pemilik 2026-11-24): klaim dibuat di Karya saya; admin/Kaprodi memeriksa dan mengajukan ke fakultas.
    { sub: 'Penelitian dan PkM', href: 'insentif.html', judul: 'Insentif publikasi', boleh: s => s.peran !== 'asesor',
      ket: 'Klaim insentif publikasi tahun berjalan: status dan berkas; admin/Kaprodi memeriksa, mengajukan ke fakultas (rekap Excel), mencatat hasil.' },
    { sub: 'Penelitian dan PkM', href: 'keahlian.html', judul: 'Kepakaran dosen',
      ket: 'Cari pakar, peta topik, dan usulan pembimbing/penguji TA dari keahlian dosen; halaman publik.' },
    { sub: 'Penelitian dan PkM', href: 'sdgs-bukti.html', judul: 'Rekap SDGs dan bukti', tampil: s => pengelola(s) || mutu(s),
      ket: 'Karya dosen per SDG beserta berkas bukti dan DOI-nya; karya tanpa bukti ditandai.' },
    // Kalender (64-patch-kegiatan.sql): semua pengguna terdaftar; kegiatan manual diisi admin (pemilik 2026-11-12).
    { sub: 'Kegiatan', href: 'kalender.html', judul: 'Kalender kegiatan',
      ket: 'Rapat, kegiatan prodi, tenggat hibah, tindak lanjut, dan temuan AMI dalam satu kalender; unduh .ics.' },
    // Kabar kegiatan (81-patch-kabar-kegiatan.sql, pemilik 2026-11-16): dosen mengajukan, admin menerbitkan.
    { sub: 'Kegiatan', href: 'kabar-kegiatan.html', judul: 'Kabar kegiatan', boleh: s => s.peran !== 'asesor',
      ket: 'Kuliah tamu, kunjungan lapangan, seminar, pengabdian, kompetisi: kabar dan foto untuk situs publik.' },
    // Rapat dan notulen (62-patch-rapat.sql): admin dan dosen mencatat; semua terdaftar membaca.
    { sub: 'Kegiatan', href: 'rapat.html', judul: 'Rapat dan notulen', boleh: s => s.peran !== 'asesor',
      ket: 'Agenda, peserta, keputusan, tindak lanjut ber-PJ, notulen Word, daftar hadir daring (QR).' },
  ]},
  { judul: 'Mutu dan pemantauan', ket: 'Skor LAM, LED dan grafiknya, siklus mutu, survei kepuasan, mutu data, dan pemantauan kinerja.', halaman: [
    { sub: 'Akreditasi', href: 'skor.html', judul: 'Skor akreditasi dan LED', tampil: akreditasi,
      ket: 'Perkiraan skor per butir, rekap bukti, unduh draf LED.' },
    { sub: 'Akreditasi', href: 'rincian.html?butir=23', judul: 'Rincian butir', tampil: akreditasi,
      ket: 'Data di balik angka tiap butir kuantitatif.' },
    { sub: 'Akreditasi', href: 'narasi-led.html', judul: 'Narasi LED', boleh: s => penyusun(s) || mutu(s),
      ket: 'Isian narasi per butir; tersimpan dan masuk draf LED saat diunduh.' },
    { sub: 'Akreditasi', href: 'kelengkapan.html', judul: 'Kelengkapan LED', boleh: s => penyusun(s) || mutu(s),
      ket: 'Daftar periksa otomatis: tim, narasi, data prodi, dokumen, dan bukti.' },
    { sub: 'Akreditasi', href: 'input-butir.html', judul: 'Isian butir dan dokumen', boleh: mutu,
      ket: 'Butir kualitatif, pustaka dokumen, bukti per butir.' },
    { sub: 'Akreditasi', href: 'grafik.html', judul: 'Grafik untuk LED', tampil: akreditasi,
      ket: 'Gambar yang sama dengan draf LED beserta kalimat narasinya, dan grafik tambahan untuk laporan.' },
    // Kegiatan prodi sebagai bukti pendukung akreditasi (88-patch-kegiatan-akreditasi.sql, pemilik 2026-11-17).
    { sub: 'Akreditasi', href: 'kegiatan-akreditasi.html', judul: 'Kegiatan untuk akreditasi', tampil: akreditasi,
      ket: 'Kuliah tamu, kuliah lapangan, seminar: keterkaitan butir, bukti, dan agenda suasana akademik per bulan.' },
    // Siklus PPEPP (67-patch-standar-spmi.sql): semua terdaftar membaca, admin mengisi (pemilik 2026-11-12).
    // Nama diperjelas (pemilik 2026-11-23): "Siklus PPEPP" kurang dipahami.
    { sub: 'Siklus mutu', href: 'siklus-ppepp.html', judul: 'Siklus mutu (PPEPP)', tampil: akreditasi,
      ket: 'Catatan siklus mutu per standar SPMI dan per TS: target (Penetapan), capaian dan bukti (Pelaksanaan), hasil AMI '
        + '(Evaluasi), rencana perbaikan (Pengendalian), revisi standar (Peningkatan).' + (BUTIR_LAM_TEKNIK ? ' Bukti butir 53 dan 55, Tabel 7b LKPS.' : '') },
    { sub: 'Siklus mutu', href: 'kelola-survei.html', judul: 'Kelola survei kepuasan', boleh: mutu,
      ket: 'Survei anonim mahasiswa, dosen, tendik, mitra, pengguna lulusan: buat, bagikan tautan, baca hasil.' },
    { sub: 'Siklus mutu', href: 'hasil-survei.html', judul: 'Hasil survei kepuasan', tampil: akreditasi,
      ket: 'Rekap survei kepuasan per kelompok dan aspek; halaman publik.' },
    // Forum pemangku kepentingan (200, pemilik 2026-11-27).
    { sub: 'Siklus mutu', href: 'forum-pemangku.html', judul: 'Forum pemangku kepentingan', boleh: s => s.peran !== 'asesor', tampil: s => pengelola(s) || mutu(s),
      ket: 'Anggota forum/IAB, pertemuan (Rapat), masukan industri dan alumni beserta tindak lanjutnya; rekap butir 2, 12, 58.' },
    { sub: 'Siklus mutu', href: 'mutu-data.html', judul: 'Mutu data', boleh: mutu,
      ket: 'Data yang perlu diperbaiki: karya tanpa bukti, DOI ganda, judul mirip, ID dosen, RPS, tracer.' },
    // Dasbor operasional (pemilik 2026-11-17): antrean dan keterlambatan per bidang dan penanggung jawabnya.
    { sub: 'Pemantauan', href: 'dasbor.html', judul: 'Dasbor operasional', boleh: s => admin(s) || s.peran === 'pimpinan',
      ket: 'Per bidang (TA, KP, kemahasiswaan, mutu, lab, administrasi): penanggung jawab, antrean, dan yang terlambat.' },
    { sub: 'Pemantauan', href: 'monitoring.html', judul: 'Pemantauan kinerja', tampil: pemantau,
      ket: 'Rekap per tahun atau TS, per dosen, dan syarat unggul.' },
  ]},
  { judul: 'Pengelolaan', ket: 'Verifikasi, data prodi, dosen, koordinator, pengingat, jejak, profil prodi, laboratorium, situs publik, dan pemakaian.', halaman: [
    { href: 'verifikasi.html', judul: 'Verifikasi data', boleh: admin,
      ket: 'Karya dosen, profil dosen, BKD, dan prestasi mahasiswa yang menunggu keputusan admin.' },
    { href: 'data-prodi.html', judul: 'Data prodi', boleh: dataProdi,
      ket: 'Mahasiswa, lulusan, tracer, kerja sama, BKD, prestasi mahasiswa.' },
    { href: 'kelola-dosen.html', judul: 'Kelola dosen', boleh: admin,
      ket: 'Daftar dosen dan staf: peran, akses masuk, tugas belajar, dan hitungan DTPS/DT/DTT per TS.' },
    { href: 'koordinator.html', judul: 'Penugasan koordinator', boleh: admin,
      ket: 'Penugasan koordinator TA, KP/magang, kemahasiswaan, kepala lab, GKM: periode dan SK; wewenang per bidang.' },
    { href: 'pengingat.html', judul: 'Pengingat', boleh: admin,
      ket: 'Kirim pengingat email (templat bisa disimpan): pembaruan karya dan profil, BKD, karya perlu diperbaiki, bukti, hibah, tindak lanjut.' },
    // Jejak perubahan (65-patch-jejak.sql, pemilik 2026-11-12): khusus admin, termasuk paket akreditasi.
    { href: 'jejak.html', judul: 'Jejak perubahan', boleh: admin,
      ket: 'Siapa mengubah apa dan kapan pada data penting (karya, dosen, LKPS, bukti, LED); disimpan 3 tahun.' },
    // Profil prodi (84-patch-profil-prodi.sql, pemilik 2026-11-16): sambutan, sejarah, pengelola.
    { href: 'kelola-profil.html', judul: 'Kelola profil prodi', boleh: admin,
      ket: 'Sambutan, sejarah, dan pengelola program studi untuk halaman publik Profil.' },
    // Laboratorium (82-patch-laboratorium.sql, pemilik 2026-11-16): profil lab untuk situs publik; kepala lab miliknya.
    { href: 'kelola-laboratorium.html', judul: 'Kelola laboratorium', boleh: kalab,
      ket: 'Profil laboratorium untuk situs publik: ringkasan, koordinator, praktikum, layanan pengujian, foto.' },
    // Inventaris, perawatan, peminjaman alat, dan induksi K3 (199, pemilik 2026-11-27): dosen membaca inventaris.
    { href: 'lab-inventaris.html', judul: 'Inventaris dan K3 laboratorium', boleh: s => s.peran !== 'asesor', tampil: s => kalab(s) || pengelola(s) || mutu(s),
      ket: 'Alat per laboratorium (kondisi, kalibrasi), riwayat perawatan, peminjaman, dan induksi K3 mahasiswa; rekap butir 38–39.' },
    // Surat dan SK prodi (201, pemilik 2026-11-28): admin/Kaprodi menyusun; SK disahkan Dekan, lainnya Kaprodi; nomor otomatis, QR.
    { href: 'surat.html', judul: 'Surat dan SK', boleh: s => s.peran !== 'asesor', tampil: s => pengelola(s) || punyaJ(s, 'dekan'),
      ket: 'Agenda surat prodi: susun, ajukan, tanda tangan elektronik ber-QR (SK oleh Dekan, surat lain oleh Kaprodi), nomor otomatis, arsip.' },
    { href: 'kelengkapan-situs.html', judul: 'Kelengkapan situs publik', boleh: admin,
      ket: 'Bagian situs publik yang masih kosong atau sebagian (profil, akreditasi, laboratorium, kerja sama, kabar, foto dosen) dan tempat mengisinya.' },
    // Pemakaian ruang kerja (133-patch-pemakaian-halaman.sql, pemilik 2026-11-20): dasar memutuskan fitur yang dipertahankan/dibuang.
    { href: 'pemakaian.html', judul: 'Pemakaian ruang kerja', boleh: admin,
      ket: 'Halaman mana yang dibuka, oleh berapa pengguna dan peran apa; halaman yang tidak pernah dibuka sebagai calon dibuang.' },
    // Kelengkapan situs publik (pemilik 2026-11-21): bagian publik yang kosong dan tempat mengisinya.
    // Kunjungan situs publik (142-patch-kunjungan-publik.sql, pemilik 2026-11-21): jumlah saja, tanpa data pengunjung.
    { href: 'kunjungan-situs.html', judul: 'Kunjungan situs publik', boleh: admin,
      ket: 'Berapa kali halaman publik dibuka, dari mana pengunjung datang (Google, Instagram, WhatsApp), kuis minat yang selesai, dan klik ke pendaftaran.' },
  ]},
  { judul: 'Bantuan', atas: false, ket: 'Cara memakai ruang kerja.', halaman: [
    { href: 'panduan.html', judul: 'Panduan pengguna',
      ket: 'Langkah untuk dosen; bagian admin tampil untuk admin.' },
  ]},
];

const berkas = href => String(href).split(/[?#]/)[0].split('/').pop() || 'index.html';
const berkasIni = () => berkas(location.pathname);
/** [[subjudul atau '', halaman]]: subjudul hanya pada halaman pertama tiap sub (sesudah penyaringan hak akses). */
export const denganSub = hs => hs.map((h, i) => [h.sub && h.sub !== hs[i - 1]?.sub ? h.sub : '', h]);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Halaman ruang kerja yang boleh dibuka `saya` (baris tabel dosen).
// Pimpinan hanya-baca: hanya halaman pantauan (aturan boleh halaman itu dilewati, karena isinya hanya dibaca).
const bolehHalaman = (s, h) => hanyaBaca(s) ? pantauanBoleh(s, h.href) : (!h.boleh || h.boleh(s));

export function halamanBoleh(saya){
  // Modul yang dimatikan di config.js (FITUR_MATI, fitur.js) tidak tampil.
  // lam: true = halaman khusus butir LAM Teknik (2026-11-25), tidak tampil untuk instrumen lain.
  // tampil (pemilik 2026-11-26): halaman yang boleh dibuka tetapi tidak ditawarkan di menu untuk peran ini (lihat koorTA dst.).
  return MODUL.map(m => ({ ...m, halaman: m.halaman.filter(h => halamanAktif(h.href) && bolehHalaman(saya, h) && (!h.lam || BUTIR_LAM_TEKNIK)
      && (!h.tampil || hanyaBaca(saya) || h.tampil(saya))) }))
    .filter(m => m.halaman.length);
}

// true bila `href` halaman ruang kerja yang boleh dibuka; null bila bukan
// halaman ruang kerja (dipakai ruang-kerja.html untuk menolak ?ke= asing).
export function bolehBuka(saya, href){
  const b = berkas(href);
  const h = MODUL.flatMap(m => m.halaman).find(x => berkas(x.href) === b);
  if (!h) return null;
  return halamanAktif(h.href) && bolehHalaman(saya, h) && (!h.lam || BUTIR_LAM_TEKNIK);
}

// Pintasan di halaman depan ruang kerja (pemilik 2026-11-20, tahap 3): per peran/jabatan, jabatan lebih dulu,
// "Dosen" terakhir; halaman yang sudah tampil di kelompok sebelumnya tidak diulang. href harus ada di MODUL.
const jab = j => s => (s.koordinator || []).includes(j);
export const PINTASAN = [
  { label: 'Admin prodi', cocok: admin, href: ['verifikasi.html', 'pengajuan-mahasiswa.html', 'data-prodi.html', 'pengingat.html', 'dasbor.html', 'kelola-dosen.html'] },
  { label: 'Kaprodi', cocok: s => jab('kaprodi')(s) || s.peran === 'pimpinan', href: ['dasbor.html', 'koordinator-mk.html', 'tinjauan-rps.html', 'silabus.html', 'ekuivalensi.html', 'kelas.html', 'jadwal-kuliah.html', 'ujian.html', 'rps-kurikulum.html', 'monitoring.html', 'pjp.html'] },
  { label: 'Dekan', cocok: jab('dekan'), href: ['rps.html', 'ekuivalensi.html', 'monitoring.html'] },
  { label: 'Gugus kendali mutu (GKM)', cocok: jab('gkm'), href: ['skor.html', 'mutu-data.html', 'siklus-ppepp.html', 'kelola-survei.html', 'monitoring.html#cpl', 'evaluasi-pembelajaran.html', 'ujian.html'] },
  { label: 'Koordinator KP/Magang', cocok: jab('koordinator_kp'), href: ['pengajuan-mahasiswa.html', 'rekap-kp.html', 'kelola-layanan-mahasiswa.html'] },
  { label: 'Koordinator TA', cocok: jab('koordinator_ta'), href: ['ruang-ta.html', 'pengajuan-mahasiswa.html', 'bimbingan-ta.html', 'penilaian-ta.html', 'rekap-ta.html', 'jadwal-berhalangan.html', 'kelola-layanan-mahasiswa.html'] },
  { label: 'Pembina kemahasiswaan', cocok: jab('pembina_kemahasiswaan'), href: ['pengajuan-mahasiswa.html', 'kelola-layanan-mahasiswa.html', 'data-prodi.html'] },
  { label: 'Kepala laboratorium', cocok: jab('kepala_lab'), href: ['kelola-laboratorium.html'] },
  { label: 'Asesor', cocok: s => s.peran === 'asesor', href: ['skor.html', 'rincian.html?butir=23', 'portofolio.html', 'monitoring.html#cpl', 'rekap-kp.html'] },
  { label: 'Dosen', cocok: s => s.peran !== 'asesor', href: ['profil.html', 'karya.html', 'mk-saya.html', 'rps.html', 'nilai-cpl.html', 'pengajuan-mahasiswa.html', 'ruang-ta.html', 'kalender.html', 'jadwal-berhalangan.html'] },
];

/** Kelompok pintasan untuk `saya`: [{label, halaman: [{href, judul, ket}]}]; hanya halaman yang boleh dan aktif. */
export function pintasanUntuk(saya){
  const semua = halamanBoleh(saya).flatMap(m => m.halaman), sudah = new Set();
  return PINTASAN.filter(p => p.cocok(saya)).map(p => ({ label: p.label, halaman: p.href.map(h => semua.find(x => x.href === h))
    .filter(x => x && !sudah.has(x.href) && sudah.add(x.href)) })).filter(p => p.halaman.length);
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
.rk-sub{display:block;padding:10px 10px 3px;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--muted)}
.rk-sub:first-child{padding-top:4px}
.rk-menu .rk-isi a:hover{background:var(--line-soft);color:var(--biru)}
.rk-menu .rk-isi a[aria-current="page"]{background:var(--biru);color:#fff}
.rk-user{margin-left:auto;display:flex;align-items:center;gap:10px;color:var(--biru-m3)}
.rk-user button{font:inherit;color:var(--biru-m6);background:none;border:1px solid rgba(255,255,255,.3);
  border-radius:3px;padding:2px 10px;cursor:pointer}
.rk-user button:hover{background:rgba(255,255,255,.12)}
@media(max-width:760px){.rk-in{padding:8px 16px}.rk-user{margin-left:0;width:100%;flex-wrap:wrap;row-gap:8px}
  .rk-isi{min-width:210px}}
.rk-cari{position:relative}
.rk-cari input{font:inherit;width:230px;padding:3px 9px;border-radius:3px;border:1px solid rgba(255,255,255,.3);
  background:rgba(255,255,255,.1);color:#fff}
.rk-cari input::placeholder{color:var(--biru-m3)}
.rk-cari input:focus{outline:none;background:#fff;color:var(--ink)}
@media(max-width:760px){.rk-cari{width:100%}.rk-cari input{width:100%}}
/* Ponsel (pemilik 2026-11-20, tahap 3): kelompok menu dilipat di balik tombol Menu supaya isi halaman langsung terlihat. */
.rk-burger{display:none;font:inherit;color:#fff;background:none;border:1px solid rgba(255,255,255,.4);border-radius:3px;padding:3px 10px;cursor:pointer}
@media(max-width:760px){
  .rk-burger{display:inline-block;margin-left:auto}
  .rk-grup{display:none;width:100%}
  .rk-menu.buka .rk-grup{display:block}
  .rk-isi{position:static;margin:4px 0 6px;box-shadow:none}
}
@media print{.rk-menu{display:none}}`;

// Menu atas untuk pengguna terdaftar; tidak tampil bila belum login atau
// belum terdaftar (halaman menampilkan layar masuknya sendiri).
// Pemakaian halaman ruang kerja (133-patch-pemakaian-halaman.sql, pemilik 2026-11-20): sekali per pemuatan halaman, di latar;
// hanya nama berkas halaman yang dikirim (bukan isi atau parameter). Gagal (mis. patch belum dijalankan) diabaikan.
let SUDAH_CATAT = false;
function catatKunjungan(sb, halaman){
  if (SUDAH_CATAT) return;
  SUDAH_CATAT = true;
  try { sb.rpc('catat_kunjungan', { p_halaman: halaman }).then(() => {}, () => {}); } catch { /* abaikan */ }
}

export async function pasangMenu(sb){
  let u = await pengguna(sb);
  if (!u?.saya) u = await pengguna(sb, true);   // mis. dipanggil lagi setelah SIGNED_IN
  if (!u?.saya) return null;
  const ini = berkasIni();
  catatKunjungan(sb, ini);
  const { prodi, institusi } = await identitas();
  // Diperiksa SETELAH semua await: halaman bisa memanggil pasangMenu dua kali
  // hampir bersamaan (muat awal + SIGNED_IN); tanpa ini menu terpasang dua kali.
  if (document.querySelector('.rk-menu')) return u.saya;
  pasangJudul();
  // Satu menu tarik-turun per modul, supaya menu tetap satu baris.
  // Satu berkas, dua entri (mis. kalender.html dan kalender.html?saya=1, 162): yang cocok persis dengan alamat ini yang aktif.
  const semua = halamanBoleh(u.saya);
  const sama = semua.flatMap(m => m.halaman).filter(h => berkas(h.href) === ini);
  const persis = sama.some(h => h.href.includes('?') && h.href === ini + location.search);
  const tanpaQ = sama.filter(h => !h.href.includes('?'));
  const aktif = h => persis ? h.href === ini + location.search : tanpaQ.length ? tanpaQ.includes(h) : berkas(h.href) === ini;
  // Menu ruang kerja ringkas (pemilik 2026-11-27): 6 kelompok di bilah atas, subjudul (h.sub) di dalam tiap kelompok;
  // kelompok atas: false (Bantuan) tidak di bilah, tautannya di sisi kanan.
  const grup = semua.filter(m => m.atas !== false).map(m => {
    const diSini = m.halaman.some(aktif);
    return `<details class="rk-grup${diSini ? ' rk-ini' : ''}"><summary>${esc(m.judul)}</summary>
      <div class="rk-isi">${denganSub(m.halaman).map(([sub, h]) => (sub ? `<span class="rk-sub">${esc(sub)}</span>` : '')
        + `<a href="${esc(h.href)}"${aktif(h) ? ' aria-current="page"' : ''}>${esc(h.judul)}</a>`).join('')}</div></details>`;
  }).join('');
  const bantuan = semua.filter(m => m.atas === false).flatMap(m => m.halaman)
    .map(h => `<a href="${esc(h.href)}"${aktif(h) ? ' aria-current="page"' : ''}>${esc(h.judul)}</a>`).join('');
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
    <button type="button" class="rk-burger" aria-expanded="false">Menu</button>
    ${grup}
    <div class="rk-user"><div class="rk-cari"><input type="search" placeholder="Cari… (tekan /)" aria-label="Cari di situs"
        autocomplete="off"></div>${bantuan}${halamanAktif('index.html') ? '<a href="index.html">Beranda umum</a>' : ''}
      <span>${esc(u.saya.nama)}</span><button type="button" title="Mengakhiri sesi akun ini di semua perangkat dan tab">Keluar</button></div></div>`;
  nav.querySelector('.rk-user button').onclick = async () => {
    await sb.auth.signOut();
    location.href = halamanAktif('index.html') ? 'index.html' : 'ruang-kerja.html';
  };
  const burger = nav.querySelector('.rk-burger');
  burger.onclick = () => {
    const buka = nav.classList.toggle('buka');
    burger.setAttribute('aria-expanded', String(buka)); burger.textContent = buka ? 'Tutup' : 'Menu';
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
  // Terakhir aktif (123, pemilik 2026-11-20): email pemeriksa yang tertunda (kuota habis) tidak dikirim ke dosen yang
  // sudah membuka ruang kerja, karena pengajuannya tampil di Tugas saya. Paling sering 30 menit sekali; galat diabaikan.
  let catat = true;
  try {
    const lalu = +localStorage.getItem('rk-aktif') || 0;
    catat = Date.now() - lalu > 30 * 60e3;
    if (catat) localStorage.setItem('rk-aktif', String(Date.now()));
  } catch { /* penyimpanan peramban diblokir: tetap dicatat */ }
  if (catat) sb.rpc('catat_aktif').then(() => {}, () => {});
  // Pencarian menyeluruh (pemilik 2026-11-12; cari-ui.js, cari.js): dimuat saat pertama dipakai.
  const kotak = nav.querySelector('.rk-cari input');
  let siapCari = null;
  const muatCari = () => siapCari || (siapCari = import('./cari-ui.js?v=2026-11-28-44f629').then(m =>
    m.pasangCari(kotak, { sb, saya: u.saya, modul: halamanBoleh(u.saya), boleh: h => bolehBuka(u.saya, h) !== false })));
  kotak.addEventListener('focus', muatCari);
  document.addEventListener('keydown', e => {
    if (e.key === '/' && !e.target.closest?.('input,textarea,select,[contenteditable]')) { e.preventDefault(); kotak.focus(); }
  });
  // Keluar otomatis khusus admin (pemilik 2026-11-20): komputer yang ditinggal atau tercuri sesinya tidak terbuka terus.
  if (u.saya.peran === 'admin') pasangKeluarOtomatis(sb);
  return u.saya;
}

// ---------- Keluar otomatis admin (pemilik 2026-11-20) ----------
// Aktivitas (klik, ketik, gulir, sentuh) di tab ruang kerja mana pun dicatat di penyimpanan peramban; lewat
// KELUAR_OTOMATIS_JAM tanpa aktivitas = keluar di perangkat ini saja, lalu ke ruang-kerja.html?habis=1.
export const KELUAR_OTOMATIS_JAM = 2;   // default Claude 2026-11-20
export const perluKeluarOtomatis = (terakhir, kini = Date.now(), jam = KELUAR_OTOMATIS_JAM) =>
  !!terakhir && kini - terakhir > jam * 3600e3;
let keluarOtomatisTerpasang = false;
function pasangKeluarOtomatis(sb){
  if (keluarOtomatisTerpasang) return;
  keluarOtomatisTerpasang = true;
  const KUNCI = 'rk-aktivitas';
  let cadangan = Date.now(), lalu = 0, masuk = 0;   // cadangan: tanpa penyimpanan peramban (per tab saja)
  // Waktu masuk (login) terakhir ikut dihitung: catatan aktivitas lama di peramban tidak mengeluarkan admin yang baru masuk.
  const baca = () => { let x; try { x = +localStorage.getItem(KUNCI) || cadangan; } catch { x = cadangan; } return Math.max(x, masuk); };
  let periksaDulu = null;
  const catat = () => {
    const kini = Date.now();
    // Sudah lewat batas: aktivitas pertama sesudah lama ditinggal tidak memperpanjang sesi, langsung diperiksa.
    if (perluKeluarOtomatis(baca(), kini)) { periksaDulu ||= periksa(); return; }
    if (kini - lalu < 30e3) return;   // paling sering tiap 30 detik
    lalu = kini; cadangan = kini;
    try { localStorage.setItem(KUNCI, String(kini)); } catch { /* diblokir: cadangan per tab */ }
  };
  const periksa = async () => {
    if (!perluKeluarOtomatis(baca())) return;
    try { await sb.auth.signOut({ scope: 'local' }); } catch { /* tetap pindah ke layar masuk */ }
    location.href = 'ruang-kerja.html?habis=1';
  };
  // Halaman yang dibuka setelah lama ditinggal: periksa dulu, baru dicatat.
  sb.auth.getSession().then(({ data }) => { masuk = Date.parse(data?.session?.user?.last_sign_in_at || '') || 0; },
    () => {}).then(periksa).then(() => catat());
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(e => addEventListener(e, catat, { passive: true, capture: true }));
  setInterval(periksa, 60e3);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) periksa(); });
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
  pasangPemicuBangun(sb);   // build situs otomatis setelah data publik berubah (pemilik 2026-11-19)
  return pasangMenu(sb);
}
