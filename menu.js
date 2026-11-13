import { dosenLogin } from './dosen-login.js?v=2026-11-13-0ac654';
// Menu bersama ruang kerja (pemilik 2026-11-04).
//
// Situs dibagi dua:
// - tampilan umum, tanpa login: index.html (rekap), dosen.html, mitra.html, sdgs.html, keahlian.html;
// - ruang kerja, khusus email terdaftar di tabel `dosen`: modul di MODUL.
//
// Akses (pemilik 2026-11-04): semua email terdaftar membuka Monitoring dan
// Akreditasi. Halaman `boleh: admin` khusus peran admin (RLS di Supabase
// tetap penjaga sebenarnya; menu hanya menyembunyikan). Karya dosen untuk
// peran yang mengisi karya, sama dengan gerbang di input.html.
//
// Modul baru: tambahkan satu entri ke MODUL. Menu, kartu di
// ruang-kerja.html, dan gerbang ikut membacanya.

const admin = s => s.peran === 'admin';
// Sama dengan boleh_narasi() di supabase/36-patch-tim-penyusun.sql.
const penyusun = s => admin(s) || (!!s.tim_penyusun && s.peran !== 'asesor');
// Asesor, dan pimpinan yang bukan DTPS prodi ini (aktif=false), tidak mengisi karya.
const isiKarya = s => s.peran !== 'asesor' && !(s.peran === 'pimpinan' && !s.aktif);

import { halamanAktif } from './fitur.js?v=2026-11-13-0ac654';

export const MODUL = [
  // Susunan modul (pemilik 2026-11-12): isian dosen, operasional prodi, dan fungsi admin dipisah.
  { judul: 'Data saya', ket: 'Profil dan karya dosen, serta berkas yang diisi dosen.', halaman: [
    { href: 'profil.html', judul: 'Profil saya',
      ket: 'Nama, SINTA, Scopus, ORCID, pendidikan, jabatan; perubahan disetujui admin.' },
    { href: 'input.html', judul: 'Karya dosen', boleh: isiKarya,
      ket: 'Publikasi, penelitian, PkM, luaran, rekognisi, dan buktinya.' },
    { href: 'nilai-cpl.html', judul: 'Berkas nilai CPL', boleh: isiKarya,
      ket: 'Unggah Template_Input_Data_CPL per kelas (diperiksa sebelum dikirim, disimpan privat); admin: daftar kelas dan pengingat.' },
  ]},
  { judul: 'Operasional', ket: 'Kegiatan prodi sehari-hari.', halaman: [
    // Kalender (64-patch-kegiatan.sql): semua pengguna terdaftar; kegiatan manual diisi admin (pemilik 2026-11-12).
    { href: 'kalender.html', judul: 'Kalender kegiatan',
      ket: 'Rapat, kegiatan prodi, tenggat hibah, tindak lanjut, dan temuan AMI dalam satu kalender; unduh .ics.' },
    // Rapat dan notulen (62-patch-rapat.sql): admin dan dosen mencatat; semua terdaftar membaca.
    { href: 'rapat.html', judul: 'Rapat dan notulen', boleh: s => s.peran !== 'asesor',
      ket: 'Agenda, peserta, keputusan, tindak lanjut ber-PJ, notulen Word, daftar hadir daring (QR).' },
    // Evaluasi pembelajaran (68-patch-evaluasi-pembelajaran.sql): dosen miliknya, admin/pimpinan semua, asesor rekap prodi.
    { href: 'evaluasi-pembelajaran.html', judul: 'Evaluasi pembelajaran',
      ket: 'EDOM, capaian CPL kelas, refleksi RPS per mata kuliah tiap semester, dan tindak lanjutnya.' },
    // Sama dengan boleh_hibah() di supabase/58-patch-hibah.sql.
    { href: 'hibah.html', judul: 'Pengajuan hibah', boleh: s => s.peran !== 'asesor',
      ket: 'Panggilan hibah dan proposal tim: tenggat, status, dana; didanai menjadi draf karya.' },
    { href: 'kelola-survei.html', judul: 'Survei kepuasan', boleh: admin,
      ket: 'Survei anonim mahasiswa, dosen, tendik, mitra, pengguna lulusan: buat, bagikan tautan, baca hasil.' },
    { href: 'pengingat.html', judul: 'Pengingat', boleh: admin,
      ket: 'Kirim pengingat email (templat bisa disimpan): pembaruan karya dan profil, BKD, karya perlu diperbaiki, bukti, hibah, tindak lanjut.' },
  ]},
  { judul: 'Admin prodi', ket: 'Verifikasi, data prodi, dosen, dan mutu data (khusus admin).', halaman: [
    { href: 'verifikasi.html', judul: 'Verifikasi', boleh: admin,
      ket: 'Karya dosen, profil dosen, BKD, dan prestasi mahasiswa yang menunggu keputusan admin.' },
    { href: 'data-prodi.html', judul: 'Data prodi', boleh: admin,
      ket: 'Mahasiswa, lulusan, tracer, kerja sama, BKD, prestasi mahasiswa.' },
    { href: 'kelola-dosen.html', judul: 'Kelola dosen', boleh: admin,
      ket: 'Email yang terdaftar dan perannya.' },
    // Jejak perubahan (65-patch-jejak.sql, pemilik 2026-11-12): khusus admin, termasuk paket akreditasi.
    { href: 'jejak.html', judul: 'Jejak perubahan', boleh: admin,
      ket: 'Siapa mengubah apa dan kapan pada data penting (karya, dosen, LKPS, bukti, LED); disimpan 3 tahun.' },
    { href: 'mutu-data.html', judul: 'Mutu data', boleh: admin,
      ket: 'Data yang perlu diperbaiki: karya tanpa bukti, DOI ganda, judul mirip, ID dosen, RPS, tracer.' },
  ]},
  { judul: 'Monitoring', ket: 'Kinerja prodi dan dosen dari waktu ke waktu.', halaman: [
    { href: 'monitoring.html', judul: 'Monitoring kinerja',
      ket: 'Rekap per tahun atau TS, per dosen, dan syarat unggul.' },
    // Target kinerja per dosen (66-patch-target-dosen.sql, pemilik 2026-11-12): dosen melihat miliknya.
    { href: 'target.html', judul: 'Target kinerja dosen', boleh: s => s.peran !== 'asesor',
      ket: 'Target tahunan per dosen (publikasi, penelitian, PkM, luaran, rekognisi, hibah) dibandingkan capaiannya.' },
    // Langsung ke seksi Capaian CPL di Monitoring (pemilik 2026-11-13).
    { href: 'monitoring.html#cpl', judul: 'Capaian CPL',
      ket: 'Ketercapaian CPL: grafik per angkatan, progres per semester, peta MK × CPL, kelas yang belum tercapai.' },
    { href: 'grafik.html', judul: 'Grafik',
      ket: 'Grafik siap pakai untuk laporan dan LED.' },
    { href: 'sdgs.html', judul: 'Rekap SDGs',
      ket: 'Karya dosen per Tujuan Pembangunan Berkelanjutan (SDGs); halaman publik.' },
    { href: 'keahlian.html', judul: 'Kepakaran dosen',
      ket: 'Cari pakar, peta topik, dan usulan pembimbing/penguji TA dari keahlian dosen; halaman publik.' },
    { href: 'hasil-survei.html', judul: 'Hasil survei kepuasan',
      ket: 'Rekap survei kepuasan per kelompok dan aspek; halaman publik.' },
  ]},
  { judul: 'Akreditasi', ket: 'Skor LAM, bukti, dan draf LED.', halaman: [
    { href: 'skor.html', judul: 'Skor & LED',
      ket: 'Perkiraan skor per butir, rekap bukti, unduh draf LED.' },
    { href: 'rincian.html?butir=23', judul: 'Rincian butir',
      ket: 'Data di balik angka tiap butir kuantitatif.' },
    { href: 'narasi-led.html', judul: 'Narasi LED', boleh: penyusun,
      ket: 'Isian narasi per butir; tersimpan dan masuk draf LED saat diunduh.' },
    // Siklus PPEPP (67-patch-standar-spmi.sql): semua terdaftar membaca, admin mengisi (pemilik 2026-11-12).
    { href: 'siklus-ppepp.html', judul: 'Siklus PPEPP',
      ket: 'Butir standar SPMI per TS: target, capaian, bukti, rencana perbaikan, dan revisi standar.' },
    { href: 'kelengkapan.html', judul: 'Kelengkapan LED', boleh: penyusun,
      ket: 'Daftar periksa otomatis: tim, narasi, data prodi, dokumen, dan bukti.' },
    { href: 'input-butir.html', judul: 'Isian butir & dokumen', boleh: admin,
      ket: 'Butir kualitatif, pustaka dokumen, bukti per butir.' },
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
    return { email: session.user.email, saya: data || null };
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

// "Skor & LED — Kinerja Program Studi" -> "Skor & LED — Teknik Sipil Universitas Pertamina"
export async function pasangJudul(){
  const { prodi, institusi } = await identitas();
  const nama = [prodi, institusi].filter(Boolean).join(' ');
  if (nama) document.title = document.title.split(' — ')[0] + ' — ' + nama;
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
  const muatCari = () => siapCari || (siapCari = import('./cari-ui.js?v=2026-11-13-0ac654').then(m =>
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
