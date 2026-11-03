// Menu bersama ruang kerja (pemilik 2026-11-04).
//
// Situs dibagi dua:
// - tampilan umum, tanpa login: index.html (rekap), dosen.html, mitra.html;
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
// Asesor, dan pimpinan yang bukan DTPS prodi ini (aktif=false), tidak mengisi karya.
const isiKarya = s => s.peran !== 'asesor' && !(s.peran === 'pimpinan' && !s.aktif);

export const MODUL = [
  { judul: 'Input data', ket: 'Karya dosen dan data prodi yang dipakai semua modul.', halaman: [
    { href: 'input.html', judul: 'Karya dosen', boleh: isiKarya,
      ket: 'Publikasi, penelitian, PkM, luaran, rekognisi, dan buktinya. Admin juga memverifikasi di sini.' },
    { href: 'data-prodi.html', judul: 'Data prodi', boleh: admin,
      ket: 'Mahasiswa, lulusan, tracer, kerja sama, BKD, prestasi mahasiswa.' },
    { href: 'kelola-dosen.html', judul: 'Kelola dosen', boleh: admin,
      ket: 'Email yang terdaftar dan perannya.' },
  ]},
  { judul: 'Monitoring', ket: 'Kinerja prodi dan dosen dari waktu ke waktu.', halaman: [
    { href: 'monitoring.html', judul: 'Monitoring kinerja',
      ket: 'Rekap per tahun atau TS, per dosen, dan syarat unggul.' },
    { href: 'grafik.html', judul: 'Grafik',
      ket: 'Grafik siap pakai untuk laporan dan LED.' },
  ]},
  { judul: 'Akreditasi', ket: 'Skor LAM, bukti, dan draf LED.', halaman: [
    { href: 'skor.html', judul: 'Skor & LED',
      ket: 'Perkiraan skor per butir, rekap bukti, unduh draf LED.' },
    { href: 'rincian.html?butir=23', judul: 'Rincian butir',
      ket: 'Data di balik angka tiap butir kuantitatif.' },
    { href: 'input-butir.html', judul: 'Isian butir & dokumen', boleh: admin,
      ket: 'Butir kualitatif, pustaka dokumen, bukti per butir.' },
  ]},
];

const berkas = href => String(href).split(/[?#]/)[0].split('/').pop() || 'index.html';
const berkasIni = () => berkas(location.pathname);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Halaman ruang kerja yang boleh dibuka `saya` (baris tabel dosen).
export function halamanBoleh(saya){
  return MODUL.map(m => ({ ...m, halaman: m.halaman.filter(h => !h.boleh || h.boleh(saya)) }))
    .filter(m => m.halaman.length);
}

// true bila `href` halaman ruang kerja yang boleh dibuka; null bila bukan
// halaman ruang kerja (dipakai ruang-kerja.html untuk menolak ?ke= asing).
export function bolehBuka(saya, href){
  const b = berkas(href);
  const h = MODUL.flatMap(m => m.halaman).find(x => berkas(x.href) === b);
  if (!h) return null;
  return !h.boleh || h.boleh(saya);
}

// { email, saya }: saya = baris dosen atau null (belum terdaftar);
// null bila belum login. Disimpan supaya menu dan halaman tidak membaca ulang;
// segar=true membaca ulang (setelah SIGNED_IN).
let PENGGUNA = null;
export function pengguna(sb, segar = false){
  if (!PENGGUNA || segar) PENGGUNA = (async () => {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return null;
    const { data } = await sb.from('dosen').select('nama,email,peran,aktif')
      .ilike('email', session.user.email).maybeSingle();
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

// "Skor & LED — Kinerja Program Studi" -> "Skor & LED — Teknik Sipil Universitas Pertamina"
export async function pasangJudul(){
  const { prodi, institusi } = await identitas();
  const nama = [prodi, institusi].filter(Boolean).join(' ');
  if (nama) document.title = document.title.split(' — ')[0] + ' — ' + nama;
}

const CSS = `
.rk-menu{background:#081D36;color:#DCE6F0;font:13px/1.4 'IBM Plex Sans',system-ui,sans-serif;
  border-bottom:1px solid rgba(255,255,255,.08)}
.rk-in{max-width:1180px;margin:0 auto;padding:8px 24px;display:flex;flex-wrap:wrap;
  align-items:center;gap:6px 22px}
.rk-menu a{color:#DCE6F0;text-decoration:none;padding:3px 7px;border-radius:3px}
.rk-menu a:hover{background:rgba(255,255,255,.1);color:#fff}
.rk-menu a.rk-merek{display:flex;align-items:center;gap:9px;padding:2px 4px 2px 0}
.rk-menu a.rk-merek:hover{background:none}
.rk-merek img{height:30px;background:#fff;border-radius:3px;padding:2px 5px}
.rk-merek span{display:flex;flex-direction:column;line-height:1.2}
.rk-merek b{color:#fff;font-weight:700;letter-spacing:.01em}
.rk-merek small{color:#A9C0D6;font-size:11px}
.rk-menu a[aria-current="page"]{background:#fff;color:#0C2A4D;font-weight:600}
.rk-grup{display:flex;flex-wrap:wrap;align-items:center;gap:2px}
.rk-grup>span{font:10.5px 'IBM Plex Mono',ui-monospace,monospace;letter-spacing:.09em;
  text-transform:uppercase;color:#7F9BB8;margin-right:4px}
.rk-user{margin-left:auto;display:flex;align-items:center;gap:10px;color:#A9C0D6}
.rk-user button{font:inherit;color:#DCE6F0;background:none;border:1px solid rgba(255,255,255,.3);
  border-radius:3px;padding:2px 10px;cursor:pointer}
.rk-user button:hover{background:rgba(255,255,255,.12)}
@media(max-width:760px){.rk-in{padding:8px 16px}.rk-user{margin-left:0;width:100%}}
@media print{.rk-menu{display:none}}`;

// Menu atas untuk pengguna terdaftar; tidak tampil bila belum login atau
// belum terdaftar (halaman menampilkan layar masuknya sendiri).
export async function pasangMenu(sb){
  let u = await pengguna(sb);
  if (!u?.saya) u = await pengguna(sb, true);   // mis. dipanggil lagi setelah SIGNED_IN
  if (!u?.saya || document.querySelector('.rk-menu')) return u?.saya || null;
  const ini = berkasIni();
  const { prodi, institusi } = await identitas();
  pasangJudul();
  const grup = halamanBoleh(u.saya).map(m => `<div class="rk-grup"><span>${esc(m.judul)}</span>${
    m.halaman.map(h => `<a href="${esc(h.href)}"${berkas(h.href) === ini ? ' aria-current="page"' : ''}>${
      esc(h.judul)}</a>`).join('')}</div>`).join('');
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
    <div class="rk-user"><a href="index.html">Beranda umum</a>
      <span>${esc(u.saya.nama)}</span><button type="button">Keluar</button></div></div>`;
  nav.querySelector('button').onclick = async () => {
    await sb.auth.signOut();
    location.href = 'index.html';
  };
  document.body.prepend(nav);
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
