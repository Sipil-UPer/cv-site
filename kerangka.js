// Kerangka halaman publik (pemilik 2026-11-16): kepala bergaya situs universitas (deret logo di bilah
// biru, nama prodi, menu turun) dan kaki halaman yang sama di halaman publik. Pemakaian:
//   import { pasangKerangka, isiKerangka } from './kerangka.js?v=2026-11-17-b30e65';
//   pasangKerangka({ aktif: 'akademik' });   // segera, sebelum data.json
//   isiKerangka(D);                           // setelah data.json: nama prodi, kontak, media sosial
// Logo: window.LOGO_KEPALA di config.js; tanpa itu logo.png. Menu hanya memuat halaman yang ada
// dan modul yang menyala (fitur.js). Tautan relatif (situs akan pindah ke subdomain kampus).
import { halamanAktif } from './fitur.js?v=2026-11-17-b30e65';

export const MENU = [
  { id: 'profil', judul: 'Profil', isi: [
    { judul: 'Profil program studi', href: 'profil-prodi.html' },
    { judul: 'Visi dan misi', href: 'profil-prodi.html#visi' },
    { judul: 'Kinerja program studi', href: 'kinerja.html', ket: 'angka dan grafik kinerja' },
    { judul: 'Kerja sama', href: 'kerja-sama.html' },
  ] },
  { id: 'akademik', judul: 'Akademik', isi: [
    { judul: 'Kurikulum', href: 'kurikulum.html' },
    { judul: 'Laboratorium', href: 'laboratorium.html' },
    { judul: 'Layanan mahasiswa', href: 'berkas-mahasiswa.html', ket: 'pengumuman, berkas, tanya-jawab' },
  ] },
  { id: 'dosen', judul: 'Dosen', isi: [
    { judul: 'Daftar dosen', href: 'daftar.html?jenis=dosen' },
    { judul: 'Kepakaran dosen', href: 'keahlian.html' },
  ] },
  { id: 'riset', judul: 'Riset & PkM', isi: [
    { judul: 'Publikasi', href: 'daftar.html?jenis=publikasi' },
    { judul: 'Penelitian', href: 'daftar.html?jenis=penelitian' },
    { judul: 'Pengabdian kepada masyarakat', href: 'daftar.html?jenis=pkm' },
    { judul: 'Kontribusi SDGs', href: 'sdgs.html' },
  ] },
  { id: 'mahasiswa', judul: 'Mahasiswa', isi: [
    { judul: 'Pengumuman', href: 'berkas-mahasiswa.html#pengumuman' },
    { judul: 'Prestasi mahasiswa', href: 'prestasi.html' },
    { judul: 'Calon pembimbing TA', href: 'berkas-mahasiswa.html#pembimbing' },
    { judul: 'Tanya-jawab', href: 'berkas-mahasiswa.html#tanya-jawab' },
    { judul: 'Kirim pertanyaan / masukan', href: 'berkas-mahasiswa.html#kirim' },
  ] },
  // Berita: tautan ke halaman berita prodi (config.yaml public_site.news_url), muncul setelah data dimuat.
  { id: 'berita', judul: 'Berita', href: '#', isi: [] },
  { id: 'kontak', judul: 'Kontak', href: '#kontak', isi: [] },
];

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
.kr-kaki-in{max-width:1180px;margin:0 auto;padding:44px 20px 28px;display:grid;grid-template-columns:1.4fr repeat(4,1fr);gap:28px}
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
@media (max-width:820px){.kr-kaki-in{grid-template-columns:1fr 1fr}}
@media (max-width:520px){.kr-kaki-in{grid-template-columns:1fr}}
`;

const SOSIAL = { instagram: 'Instagram', instagram_himpunan: 'Instagram HMTS (himpunan mahasiswa)', youtube: 'YouTube',
  linkedin: 'LinkedIn', facebook: 'Facebook', tiktok: 'TikTok', x: 'X' };

function menuAtas(aktif){
  return MENU.map(m => ({ ...m, isi: m.isi.filter(x => halamanAktif(x.href)) }))
    .filter(m => m.isi.length || m.href)
    .map(m => {
      const kls = m.id === aktif ? ' class="aktif"' : '';
      if (!m.isi.length) return `<li${kls} data-kr-menu="${m.id}"${m.id === 'kontak' || m.id === 'berita' ? ' hidden' : ''}><a href="${esc(m.href)}">${esc(m.judul)}</a></li>`;
      return `<li${kls}><button type="button" aria-expanded="false" aria-controls="kr-sub-${m.id}">${esc(m.judul)}</button>
        <ul class="kr-sub" id="kr-sub-${m.id}">${m.isi.map(x =>
          `<li><a href="${esc(x.href)}">${esc(x.judul)}${x.ket ? `<small>${esc(x.ket)}</small>` : ''}</a></li>`).join('')}</ul></li>`;
    }).join('');
}

export function pasangKerangka({ aktif = '' } = {}){
  const gaya = document.createElement('style');
  gaya.textContent = CSS;
  document.head.appendChild(gaya);

  const kepala = document.createElement('div');
  kepala.innerHTML = `<a class="kr-lewati" href="#utama">Lewati ke isi</a>
  <header class="kr-kepala" id="krKepala"><div class="kr-kepala-in">
    <a class="kr-logo" href="index.html" aria-label="Beranda">${LOGO().map(l =>
      `<img src="${esc(l.src)}" alt="${esc(l.alt)}"${l.w ? ` width="${l.w}" height="${l.h}"` : ''}>`).join('')}</a>
    <div class="kr-kanan">
      <div class="kr-baris1"><a class="kr-merek" href="index.html">Program Studi<b data-kr="prodi"></b></a>
        <span class="kr-tautan"><a href="#" data-kr="daftar" class="kr-daftar" hidden>Pendaftaran</a><a href="berkas-mahasiswa.html">Mahasiswa</a><a href="ruang-kerja.html" class="kr-masuk">Masuk ruang kerja</a></span></div>
      <nav class="kr-nav" id="krNav" aria-label="Menu utama"><ul>${menuAtas(aktif)}<li class="kr-hp"><a href="ruang-kerja.html">Masuk ruang kerja &rarr;</a></li></ul></nav>
    </div>
    <button class="kr-burger" type="button" aria-expanded="false" aria-controls="krNav">Menu</button>
  </div></header>`;
  document.body.prepend(...kepala.childNodes);

  const kaki = document.createElement('footer');
  kaki.className = 'kr-kaki';
  kaki.id = 'kontak';
  kaki.innerHTML = `<div class="kr-kaki-in">
    <div><div class="kr-nama">Program Studi <span data-kr="prodi"></span></div><div data-kr="institusi"></div><div data-kr="akreditasi" hidden style="margin-top:6px;color:#fff;font-weight:600"></div>
      <address data-kr="kontak" hidden></address></div>
    <div><h4>Program studi</h4><ul>
      <li><a href="profil-prodi.html">Profil program studi</a></li><li><a href="kurikulum.html">Kurikulum</a></li>
      <li><a href="laboratorium.html">Laboratorium</a></li><li><a href="kerja-sama.html">Kerja sama</a></li></ul></div>
    <div><h4>Mahasiswa</h4><ul>
      <li><a href="berkas-mahasiswa.html">Layanan mahasiswa</a></li><li><a href="prestasi.html">Prestasi mahasiswa</a></li>
      <li><a href="berkas-mahasiswa.html#pembimbing">Calon pembimbing TA</a></li></ul></div>
    <div><h4>Riset</h4><ul>
      <li><a href="daftar.html?jenis=dosen">Dosen</a></li><li><a href="daftar.html?jenis=publikasi">Publikasi</a></li>
      <li><a href="kinerja.html">Kinerja program studi</a></li></ul></div>
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
}

/** Nama prodi/institusi, kontak, dan media sosial dari data.json (config.yaml public_site). */
export function isiKerangka(D){
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
  const s = Object.entries(D.situs?.sosial || {});
  document.querySelectorAll('[data-kr="sosial"]').forEach(el => {
    el.innerHTML = s.length ? `<h4>Ikuti kami</h4><ul>${s.map(([n, u]) =>
      `<li><a href="${esc(u)}" rel="noopener">${esc(SOSIAL[n] || n)}</a></li>`).join('')}</ul><br>` : '';
    el.hidden = !s.length;
  });
}
