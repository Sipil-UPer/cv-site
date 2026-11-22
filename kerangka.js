// Kerangka halaman publik (pemilik 2026-11-16): kepala bergaya situs universitas (deret logo di bilah
// biru, nama prodi, menu turun) dan kaki halaman yang sama di halaman publik. Pemakaian:
//   import { pasangKerangka, isiKerangka } from './kerangka.js?v=2026-11-22-866c27';
//   pasangKerangka({ aktif: 'profil' });     // segera, sebelum data.json
//   pasangKerangka({ aktif: 'profil', muat: true });   // atau: kerangka memuat data.json sendiri
//   isiKerangka(D);                           // setelah data.json: nama prodi, kontak, media sosial
// Logo: window.LOGO_KEPALA di config.js; tanpa itu logo.png. Menu hanya memuat halaman yang ada
// dan modul yang menyala (fitur.js). Tautan relatif (situs akan pindah ke subdomain kampus).
import { halamanAktif } from './fitur.js?v=2026-11-22-866c27';
import { catatKunjunganPublik } from './kunjungan-publik.js?v=2026-11-22-866c27';

// Lima kelompok menu (pemilik 2026-11-19, tahap 2): Profil, Dosen dan riset, Mahasiswa, Kinerja, Kontak;
// Pendaftaran dan Masuk ruang kerja di baris atas. Kaki halaman disusun dari MENU yang sama.
// Butir ber-`kr` (Berita) diisi isiKerangka dari data.json dan tersembunyi bila kosong.
export const MENU = [
  { id: 'profil', judul: 'Profil', isi: [
    { judul: 'Profil program studi', href: 'profil-prodi.html' },
    { judul: 'Visi dan misi', href: 'profil-prodi.html#visi' },
    { judul: 'Kurikulum', href: 'kurikulum.html', ket: 'profil lulusan, CPL, mata kuliah' },
    { judul: 'Laboratorium', href: 'laboratorium.html' },
    { judul: 'Kerja sama', href: 'kerja-sama.html' },
    { judul: 'Berita dan kegiatan', href: '#', kr: 'berita' },
    // Galeri foto (pemilik 2026-11-22): tampil bila ada foto kabar, prestasi, atau laboratorium.
    { judul: 'Galeri foto', href: 'galeri.html', kr: 'galeri' },
  ] },
  { id: 'dosen', judul: 'Dosen dan riset', isi: [
    { judul: 'Daftar dosen', href: 'daftar.html?jenis=dosen' },
    { judul: 'Kepakaran dosen', href: 'keahlian.html' },
    { judul: 'Publikasi', href: 'daftar.html?jenis=publikasi' },
    { judul: 'Penelitian', href: 'daftar.html?jenis=penelitian' },
    { judul: 'Pengabdian kepada masyarakat', href: 'daftar.html?jenis=pkm' },
    { judul: 'Kontribusi SDGs', href: 'sdgs.html' },
  ] },
  { id: 'mahasiswa', judul: 'Mahasiswa', isi: [
    // Calon mahasiswa (pemilik 2026-11-20): halaman cerita prodi untuk calon mahasiswa, tanpa promosi berlebihan.
    { judul: 'Untuk calon mahasiswa', href: 'calon-mahasiswa.html' },
    // Selaras dengan 4 tombol utama Layanan mahasiswa (pemilik 2026-11-19).
    { judul: 'Layanan mahasiswa', href: 'layanan-mahasiswa.html' },
    { judul: 'Ekuivalensi kurikulum', href: 'ekuivalensi-kurikulum.html', ket: 'padanan mata kuliah kurikulum lama ke baru' },
    { judul: 'Ajukan KP, TA, lomba, luaran, kabar kegiatan, surat, yudisium', href: 'pengajuan.html' },
    { judul: 'Jadwal seminar/sidang TA', href: 'layanan-mahasiswa.html#jadwal-ta' },
    { judul: 'Kerja praktik dan magang', href: 'kerja-praktik.html' },
    { judul: 'Calon pembimbing TA', href: 'layanan-mahasiswa.html#pembimbing' },
    { judul: 'Tanya prodi', href: 'layanan-mahasiswa.html#kirim' },
    { judul: 'Prestasi mahasiswa', href: 'prestasi.html' },
    { judul: 'Alumni dan tracer study', href: 'alumni.html' },
  ] },
  { id: 'kinerja', judul: 'Kinerja', isi: [
    { judul: 'Kinerja program studi', href: 'kinerja.html', ket: 'angka dan grafik kinerja' },
    { judul: 'Hasil survei kepuasan', href: 'hasil-survei.html' },
  ] },
  { id: 'kontak', judul: 'Kontak', href: '#kontak', isi: [] },
];
// Nilai aktif lama (sebelum 2026-11-19) tetap dikenali, mis. halaman buatan halaman_publik.py versi lama.
const AKTIF_LAMA = { akademik: 'profil', riset: 'dosen', berita: 'profil' };

const LOGO = () => (Array.isArray(globalThis.LOGO_KEPALA) && globalThis.LOGO_KEPALA.length
  ? globalThis.LOGO_KEPALA : [{ src: 'logo.png', alt: 'Logo institusi', w: 600, h: 300 }]);

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const CSS = `
.kr-lewati{position:absolute;left:-999px;top:0;background:#fff;color:var(--biru);padding:8px 12px;z-index:50}
.kr-lewati:focus{left:8px;top:8px}
.kr-kepala{position:sticky;top:0;z-index:40;background:var(--biru);color:#fff;box-shadow:0 2px 12px rgba(var(--biru-gelap-rgb),.28)}
.kr-kepala-in{display:flex;align-items:stretch;min-height:88px}
.kr-logo{display:flex;flex:none;line-height:0;text-decoration:none}
.kr-logo img{height:88px;width:auto;display:block}
.kr-kanan{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:space-between;padding:0 24px 0 18px}
.kr-baris1{display:flex;justify-content:space-between;align-items:center;gap:16px;padding-top:9px;font-size:13px}
.kr-merek{color:#fff;text-decoration:none;font-size:13.5px;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.kr-merek b{font-family:var(--judul,var(--sans));font-size:17px;font-weight:700;letter-spacing:.01em;margin-left:4px}
.kr-tautan{display:flex;gap:16px;align-items:center;white-space:nowrap}
.kr-tautan a{color:#fff;text-decoration:none}
.kr-tautan a:hover{color:var(--aksen,#fff)}
.kr-tautan .kr-masuk{border:1px solid rgba(255,255,255,.45);padding:3px 10px;border-radius:2px}
.kr-tautan .kr-daftar{background:var(--aksen);color:var(--biru-gelap);font-weight:600;padding:3px 10px;border-radius:2px}
.kr-tautan .kr-daftar:hover{color:var(--biru-gelap);filter:brightness(1.06)}
.kr-nav{align-self:flex-end}
.kr-nav>ul{list-style:none;margin:0;padding:0;display:flex}
.kr-nav>ul>li{position:relative}
.kr-nav button,.kr-nav>ul>li>a{font:inherit;font-size:16px;font-weight:500;color:#fff;background:none;border:0;
  padding:8px 12px 13px;cursor:pointer;text-decoration:none;display:flex;align-items:center;gap:6px;border-bottom:3px solid transparent}
.kr-nav button:hover,.kr-nav>ul>li>a:hover{color:var(--aksen,#fff)}
.kr-nav .aktif>button,.kr-nav .aktif>a,.kr-nav li.buka>button{border-bottom-color:var(--aksen,var(--merah))}
.kr-nav button::after{content:'';width:6px;height:6px;border-right:1.5px solid currentColor;border-bottom:1.5px solid currentColor;transform:rotate(45deg) translateY(-2px);opacity:.7}
.kr-sub{position:absolute;top:100%;right:0;min-width:260px;background:#fff;border:1px solid var(--line);border-top:3px solid var(--aksen,var(--merah));
  box-shadow:0 12px 28px rgba(var(--biru-rgb),.16);padding:8px 0;list-style:none;margin:0;display:none}
.kr-nav>ul>li:nth-child(-n+3)>.kr-sub{right:auto;left:0}
.kr-nav li.buka>.kr-sub{display:block}
.kr-sub a{display:block;padding:8px 18px;font-size:14px;color:var(--ink);text-decoration:none}
.kr-sub a:hover{background:var(--biru-m11);color:var(--biru)}
.kr-sub small{display:block;font-size:12px;color:var(--muted)}
.kr-hp{display:none}
.kr-tautan .kr-cari-buka{background:none;border:0;font:inherit;color:#fff;cursor:pointer;padding:0;display:inline-flex;align-items:center;gap:5px}
.kr-tautan .kr-cari-buka:hover{color:var(--aksen,#fff)}
.kr-cari{background:#fff;color:var(--ink);border-bottom:1px solid var(--line);box-shadow:0 12px 24px rgba(0,0,0,.12)}
.kr-cari-in{max-width:760px;margin:0 auto;padding:14px 16px 16px}
.kr-cari input{width:100%;font:inherit;font-size:16px;padding:10px 12px;border:1px solid var(--line);border-radius:2px}
.kr-cari input:focus{outline:2px solid var(--biru-2,#06c);outline-offset:-1px}
.kr-cari-hasil{max-height:min(60vh,520px);overflow:auto;margin-top:8px}
.kr-cari-hasil h4{margin:12px 0 4px;font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.kr-cari-hasil a{display:block;padding:7px 10px;color:var(--ink);text-decoration:none;border-left:3px solid transparent}
.kr-cari-hasil a:hover,.kr-cari-hasil a.aktif{background:var(--biru-m11,#eef3fb);border-left-color:var(--aksen,var(--merah))}
.kr-cari-hasil b{display:block;font-weight:600;color:var(--biru)}
.kr-cari-hasil span{display:block;font-size:13px;color:var(--muted)}
.kr-cari-hasil p{margin:8px 0;color:var(--muted)}
.kr-burger{display:none;align-self:center;margin:0 16px 0 auto;font:inherit;font-size:14px;background:none;border:1px solid rgba(255,255,255,.55);padding:8px 12px;cursor:pointer;color:#fff;flex:none}
@media (max-width:1100px){
  .kr-kanan{justify-content:center}
  .kr-baris1{padding-top:0}
  .kr-burger{display:block}
  .kr-nav{display:none;position:absolute;left:0;right:0;top:100%;background:#fff;border-bottom:1px solid var(--line);
    box-shadow:0 12px 24px rgba(0,0,0,.12);max-height:calc(100vh - 100px);overflow:auto}
  .kr-kepala.buka .kr-nav{display:block}
  .kr-nav>ul{flex-direction:column;padding:6px 0}
  .kr-nav button,.kr-nav>ul>li>a{width:100%;padding:12px 20px;justify-content:space-between;border-bottom:0;color:var(--ink);font-size:15.5px}
  .kr-sub{position:static;box-shadow:none;border:0;border-left:3px solid var(--aksen,var(--merah));margin:0 20px 8px;padding:0}
  .kr-nav li.kr-hp{display:block;border-top:1px solid var(--line);margin-top:4px}
  .kr-nav li.kr-hp a{color:var(--biru);font-weight:600}
}
@media (max-width:760px){
  .kr-kepala-in{min-height:56px}
  .kr-logo img{height:56px}
  .kr-kanan{flex:0 0 0;padding:0}
  .kr-baris1{display:none}
  .kr-burger{margin-left:auto}
}
@media (max-width:420px){ .kr-kepala-in{min-height:46px} .kr-logo img{height:46px} .kr-burger{margin-right:10px;padding:6px 10px} }
.kr-kaki{background:var(--biru);color:var(--biru-m4);margin-top:70px;font-size:14px}
.kr-kaki-in{max-width:1180px;margin:0 auto;padding:44px 20px 28px;display:grid;grid-template-columns:1.3fr repeat(5,1fr);gap:28px}
.kr-kaki h4{border-bottom:2px solid var(--aksen,transparent);padding-bottom:6px;display:inline-block;font-family:var(--mono);font-size:11px;
  letter-spacing:.12em;text-transform:uppercase;color:#fff;margin:0 0 12px;font-weight:500}
.kr-kaki ul{list-style:none;margin:0;padding:0}
.kr-kaki li{margin:0 0 7px}
.kr-kaki a{color:var(--biru-m4);text-decoration:none}
.kr-kaki a:hover{color:#fff;text-decoration:underline}
.kr-kaki .kr-nama{font-family:var(--serif);font-size:21px;font-weight:700;color:#fff;margin:0 0 4px}
.kr-kaki address{font-style:normal;margin-top:14px;line-height:1.6}
.kr-kaki-bawah{border-top:1px solid rgba(255,255,255,.12)}
.kr-kaki-bawah div{max-width:1180px;margin:0 auto;padding:14px 20px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;font-size:12.5px}
@media (max-width:1000px){.kr-kaki-in{grid-template-columns:repeat(3,1fr)}.kr-kaki-in>div:first-child{grid-column:1/-1}}
/* Ponsel: kelompok menu tidak diulang di kaki (sudah ada di tombol Menu); identitas, kontak, media sosial, tautan tetap. */
@media (max-width:620px){.kr-kaki-in{grid-template-columns:1fr;gap:18px;padding-top:30px}.kr-kaki-grup{display:none}.kr-kaki li{margin:0 0 5px}.kr-kaki{font-size:13.5px;margin-top:48px}}
`;

const SOSIAL = { instagram: 'Instagram', instagram_himpunan: 'Instagram HMTS (himpunan mahasiswa)', youtube: 'YouTube',
  linkedin: 'LinkedIn', facebook: 'Facebook', tiktok: 'TikTok', x: 'X' };

const menuAda = () => MENU.map(m => ({ ...m, isi: m.isi.filter(x => x.kr || halamanAktif(x.href)) }))
  .filter(m => m.isi.length || m.href);
// Butir ber-kr disembunyikan sampai isiKerangka mengisi alamatnya.
const butir = x => `<li${x.kr ? ` data-kr-menu="${x.kr}" hidden` : ''}><a href="${esc(x.href)}">${esc(x.judul)}${x.ket ? `<small>${esc(x.ket)}</small>` : ''}</a></li>`;

function menuAtas(aktif){
  aktif = AKTIF_LAMA[aktif] || aktif;
  return menuAda().map(m => {
      const kls = m.id === aktif ? ' class="aktif"' : '';
      if (!m.isi.length) return `<li${kls} data-kr-menu="${m.id}"${m.id === 'kontak' ? ' hidden' : ''}><a href="${esc(m.href)}">${esc(m.judul)}</a></li>`;
      return `<li${kls}><button type="button" aria-expanded="false" aria-controls="kr-sub-${m.id}">${esc(m.judul)}</button>
        <ul class="kr-sub" id="kr-sub-${m.id}">${m.isi.map(butir).join('')}</ul></li>`;
    }).join('');
}

// Kaki halaman: kelompok menu yang sama (tanpa keterangan kecil), ditambah tautan umum.
function menuKaki(){
  return menuAda().filter(m => m.isi.length).map(m =>
    `<div class="kr-kaki-grup"><h4>${esc(m.judul)}</h4><ul>${m.isi.map(x => butir({ ...x, ket: '' })).join('')}</ul></div>`).join('');
}

export function pasangKerangka({ aktif = '', muat = false } = {}){
  // muat: halaman yang tidak memanggil isiKerangka sendiri; nama prodi, kontak, berita dari data.json.
  if (muat) fetch('data.json?v=' + Date.now()).then(r => r.ok ? r.json() : null).then(d => { if (d) isiKerangka(d); }).catch(() => {});
  const gaya = document.createElement('style');
  gaya.textContent = CSS;
  document.head.appendChild(gaya);

  // "Lewati ke isi" menuju <main> halaman, apa pun id-nya (beberapa halaman memakai id="isi").
  const utama = document.querySelector('main');
  if (utama && !utama.id) utama.id = 'utama';
  const kepala = document.createElement('div');
  kepala.innerHTML = `<a class="kr-lewati" href="#${esc(utama?.id || 'utama')}">Lewati ke isi</a>
  <header class="kr-kepala" id="krKepala"><div class="kr-kepala-in">
    <a class="kr-logo" href="index.html" aria-label="Beranda">${LOGO().map(l =>
      `<img src="${esc(l.src)}" alt="${esc(l.alt)}"${l.w ? ` width="${l.w}" height="${l.h}"` : ''}>`).join('')}</a>
    <div class="kr-kanan">
      <div class="kr-baris1"><a class="kr-merek" href="index.html">Program Studi<b data-kr="prodi"></b></a>
        <span class="kr-tautan"><button type="button" class="kr-cari-buka" aria-expanded="false" aria-controls="krCari">${IKON_CARI} Cari</button><a href="#" data-kr="daftar" class="kr-daftar" hidden>Pendaftaran</a><a href="english.html" data-kr="english" lang="en" hidden>English</a><a href="ruang-kerja.html" class="kr-masuk">Masuk ruang kerja</a></span></div>
      <nav class="kr-nav" id="krNav" aria-label="Menu utama"><ul>${menuAtas(aktif)}<li class="kr-hp"><a href="#cari" class="kr-cari-buka" role="button" aria-controls="krCari">Cari di situs</a></li><li class="kr-hp"><a href="ruang-kerja.html">Masuk ruang kerja &rarr;</a></li></ul></nav>
    </div>
    <button class="kr-burger" type="button" aria-expanded="false" aria-controls="krNav">Menu</button>
  </div>
  <div class="kr-cari" id="krCari" hidden><div class="kr-cari-in" role="search">
    <input type="search" id="krCariKotak" autocomplete="off" placeholder="Cari dosen, mata kuliah, bidang, publikasi, halaman…" aria-label="Cari di situs">
    <div class="kr-cari-hasil" id="krCariHasil" aria-live="polite"></div></div></div></header>`;
  document.body.prepend(...kepala.childNodes);

  const kaki = document.createElement('footer');
  kaki.className = 'kr-kaki';
  kaki.id = 'kontak';
  kaki.innerHTML = `<div class="kr-kaki-in">
    <div><div class="kr-nama">Program Studi <span data-kr="prodi"></span></div><div data-kr="institusi"></div><div data-kr="akreditasi" hidden style="margin-top:6px;color:#fff;font-weight:600"></div>
      <address data-kr="kontak" hidden></address></div>
    ${menuKaki()}
    <div><div data-kr="sosial" hidden></div><h4>Tautan</h4><ul>
      <li><a href="ruang-kerja.html">Ruang kerja dosen</a></li><li><a href="privasi.html">Kebijakan privasi</a></li><li><a href="peta-situs.html">Peta situs</a></li></ul></div>
  </div>
  <div class="kr-kaki-bawah"><div><span>© ${new Date().getFullYear()} Program Studi <span data-kr="prodi"></span><span data-kr="koma-institusi"></span></span>
    <span><a href="privasi.html">Kebijakan privasi</a></span></div></div>`;
  document.body.appendChild(kaki);

  // Menu turun: klik membuka satu, klik di luar / Escape menutup. Di ponsel tombol Menu membuka panel.
  const nav = document.getElementById('krNav');
  const tutupSemua = kecuali => nav.querySelectorAll('li.buka').forEach(li => {
    if (li !== kecuali) { li.classList.remove('buka'); li.querySelector('button')?.setAttribute('aria-expanded', 'false'); }
  });
  nav.querySelectorAll(':scope > ul > li > button').forEach(b => b.addEventListener('click', e => {
    const li = b.parentElement, buka = !li.classList.contains('buka');
    tutupSemua(li); li.classList.toggle('buka', buka); b.setAttribute('aria-expanded', String(buka));
    e.stopPropagation();
  }));
  document.addEventListener('click', e => { if (!nav.contains(e.target)) tutupSemua(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') tutupSemua(); });
  const kp = document.getElementById('krKepala'), burger = kp.querySelector('.kr-burger');
  burger.addEventListener('click', () => {
    const buka = !kp.classList.contains('buka');
    kp.classList.toggle('buka', buka); burger.setAttribute('aria-expanded', String(buka));
    burger.textContent = buka ? 'Tutup' : 'Menu';
  });
  pasangCariKepala(kp, burger);
  // Statistik kunjungan ramah privasi (142-patch-kunjungan-publik.sql): satu "lihat" per halaman dibuka, dan klik ke
  // laman pendaftaran (PMB). Hanya jumlah; tanpa cookie atau penanda pengunjung.
  catatKunjunganPublik('lihat');
  document.addEventListener('click', e => {
    const a = e.target.closest?.('a[href]');
    if (a && (a.classList.contains('kr-daftar') || /(^|\.)pmb\./i.test(a.hostname || ''))) catatKunjunganPublik('daftar_klik');
  });
}

export { catatKunjunganPublik };

// Pencarian dari kepala setiap halaman (pemilik 2026-11-22): indeks publik cari.js dari data.json, dimuat saat panel
// pertama kali dibuka. Data diambil dari isiKerangka bila sudah ada; selain itu data.json diambil sendiri.
const IKON_CARI = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true">'
  + '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>';
let DATA_KERANGKA = null;

function pasangCariKepala(kp, burger){
  const panel = document.getElementById('krCari'), kotak = document.getElementById('krCariKotak'),
        hasil = document.getElementById('krCariHasil'), tombol = [...kp.querySelectorAll('.kr-cari-buka')];
  let siap = null, aktif = -1;
  const muat = () => siap ??= Promise.all([
    import('./cari.js?v=2026-11-22-866c27'),
    DATA_KERANGKA ? Promise.resolve(DATA_KERANGKA) : fetch('data.json?v=' + Date.now()).then(r => r.json()),
  ]).then(([m, D]) => ({ m, idx: m.indeksPublik(D, k => !(window.FITUR_MATI || []).includes(k)) }));
  const tampil = async () => {
    const q = kotak.value.trim();
    if (!q) { hasil.innerHTML = ''; return; }
    try {
      const { m, idx } = await muat();
      if (kotak.value.trim() !== q) return;
      const g = m.kelompokkan(m.cari(idx, q));
      hasil.innerHTML = g.length ? g.map(x => `<h4>${esc(x.label)}</h4>` + x.entri.map(r =>
        `<a href="${esc(r.href)}"><b>${esc(r.judul)}</b>${r.ket ? `<span>${esc(r.ket)}</span>` : ''}</a>`).join('')).join('')
        : `<p>Tidak ada yang cocok dengan "${esc(q)}".</p>`;
      aktif = -1;
    } catch { hasil.innerHTML = '<p>Pencarian belum bisa dimuat. Coba muat ulang halaman.</p>'; }
  };
  const buka = b => {
    panel.hidden = !b;
    tombol.forEach(t => t.setAttribute('aria-expanded', String(b)));
    if (b) {
      // Di ponsel: tutup panel menu dulu (langsung, bukan burger.click(), yang akan menutup panel cari lagi).
      if (kp.classList.contains('buka')) { kp.classList.remove('buka'); burger.setAttribute('aria-expanded', 'false'); burger.textContent = 'Menu'; }
      kotak.focus(); muat().catch(() => {}); tampil();
    }
  };
  tombol.forEach(t => t.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); buka(panel.hidden); }));
  kotak.addEventListener('input', tampil);
  kotak.addEventListener('keydown', ev => {
    const xs = [...hasil.querySelectorAll('a')];
    const tandai = i => { aktif = Math.max(-1, Math.min(i, xs.length - 1)); xs.forEach((a, j) => a.classList.toggle('aktif', j === aktif));
      xs[aktif]?.scrollIntoView({ block: 'nearest' }); };
    if (ev.key === 'ArrowDown') { ev.preventDefault(); tandai(aktif + 1); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); tandai(aktif - 1); }
    else if (ev.key === 'Enter') { const a = xs[Math.max(aktif, 0)]; if (a) location.href = a.getAttribute('href'); }
    else if (ev.key === 'Escape') { buka(false); tombol[0]?.focus(); }
  });
  document.addEventListener('click', e => { if (!panel.hidden && !panel.contains(e.target)) buka(false); });
  // Hasil yang menuju anchor di halaman yang sama: tutup panel supaya isinya terlihat.
  hasil.addEventListener('click', e => { if (e.target.closest('a')) buka(false); });
}

/** Nama prodi/institusi, kontak, dan media sosial dari data.json (config.yaml public_site). */
export function isiKerangka(D){
  DATA_KERANGKA = D;   // untuk pencarian kepala (pasangCariKepala)
  const isi = (k, html) => document.querySelectorAll(`[data-kr="${k}"]`).forEach(el => { el.innerHTML = html; });
  isi('prodi', esc(D.prodi || ''));
  isi('institusi', esc(D.institusi || ''));
  isi('koma-institusi', D.institusi ? ', ' + esc(D.institusi) : '');
  const k = D.situs?.kontak || {};
  const baris = [k.address && esc(k.address),
    k.phone && `Telepon <a href="tel:${esc(k.phone.replace(/[^\d+]/g, ''))}">${esc(k.phone)}</a>`,
    k.email && `<a href="mailto:${esc(k.email)}">${esc(k.email)}</a>`,
    k.hours && `Layanan: ${esc(k.hours)}`].filter(Boolean);
  document.querySelectorAll('[data-kr="kontak"]').forEach(el => { el.innerHTML = baris.join('<br>'); el.hidden = !baris.length; });
  // Menu Kontak hanya bila kontak diisi (config.yaml public_site.contact).
  document.querySelectorAll('[data-kr-menu="kontak"]').forEach(el => { el.hidden = !baris.length; });
  // Berita prodi dan pendaftaran: tautan luar dari config.yaml public_site (news_url, admission_url).
  // Berita: kabar kegiatan prodi sendiri (kabar.html) bila ada yang terbit; selain itu laman berita universitas.
  const berita = (D.kabar || []).length ? 'kabar.html' : D.situs?.berita, daftar = D.situs?.pendaftaran;
  document.querySelectorAll('[data-kr-menu="berita"]').forEach(el => {
    el.hidden = !berita;
    if (berita) Object.assign(el.querySelector('a'), { href: berita, ...(berita.startsWith('http') ? { rel: 'noopener' } : {}) });
  });
  const nFoto = [...(D.kabar || []), ...(D.prestasi || []), ...(D.laboratorium || [])].reduce((n, x) => n + (x.foto || []).length, 0);
  document.querySelectorAll('[data-kr-menu="galeri"]').forEach(el => { el.hidden = !nFoto; });
  // Status akreditasi di kaki halaman (hanya bila masih berlaku; bangun.py akreditasi_publik).
  const ak = D.akreditasi_prodi || {};
  document.querySelectorAll('[data-kr="akreditasi"]').forEach(el => {
    el.textContent = ak.peringkat ? `Terakreditasi ${ak.peringkat}${ak.lembaga ? ' · ' + ak.lembaga : ''}` : '';
    el.hidden = !ak.peringkat;
  });
  document.querySelectorAll('[data-kr="daftar"]').forEach(el => {
    el.hidden = !daftar;
    if (daftar) Object.assign(el, { href: daftar, rel: 'noopener' });
  });
  // Ringkasan bahasa Inggris (english.html, pemilik 2026-11-21): hanya bila halamannya dibuat (programme_name_en diisi).
  document.querySelectorAll('[data-kr="english"]').forEach(el => { el.hidden = !D.situs?.prodi_en; });
  const s = Object.entries(D.situs?.sosial || {});
  document.querySelectorAll('[data-kr="sosial"]').forEach(el => {
    el.innerHTML = s.length ? `<h4>Ikuti kami</h4><ul>${s.map(([n, u]) =>
      `<li><a href="${esc(u)}" rel="noopener">${esc(SOSIAL[n] || n)}</a></li>`).join('')}</ul><br>` : '';
    el.hidden = !s.length;
  });
}
