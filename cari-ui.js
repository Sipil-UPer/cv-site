// Kotak cari di menu ruang kerja (pemilik 2026-11-12; logika di cari.js). Dimuat menu.js saat
// kotak pertama kali difokuskan, supaya halaman lain tidak ikut memuat indeks.
import { cari, kelompokkan, indeksHalaman, indeksButir, indeksPublik, cariSupabase } from './cari.js?v=2026-11-13-715ba1';
import { fiturAktif, halamanAktif } from './fitur.js?v=2026-11-13-715ba1';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const CSS = `
.rk-hasil{position:absolute;top:calc(100% + 6px);right:0;z-index:60;width:min(520px,92vw);max-height:70vh;overflow:auto;
  background:#fff;color:var(--ink);border:1px solid var(--line);border-radius:4px;box-shadow:0 8px 24px rgba(0,0,0,.18);padding:6px;text-align:left}
.rk-hasil h4{margin:8px 8px 2px;font:600 11px/1.4 'IBM Plex Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.rk-hasil a{display:block;padding:6px 8px;border-radius:3px;color:var(--ink);text-decoration:none}
.rk-hasil a b{display:block;font-weight:600;color:var(--biru-2)}
.rk-hasil a span{display:block;font-size:12px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rk-hasil a.aktif,.rk-hasil a:hover{background:var(--line-soft)}
.rk-hasil p{margin:8px;color:var(--muted);font-size:13px}`;

/** Pasang perilaku cari pada kotak input. o = { sb, saya, modul, boleh(href) }. */
export function pasangCari(kotak, o){
  if (kotak.dataset.siap) return;
  kotak.dataset.siap = '1';
  const gaya = document.createElement('style'); gaya.textContent = CSS; document.head.appendChild(gaya);
  const panel = document.createElement('div');
  panel.className = 'rk-hasil'; panel.hidden = true; panel.setAttribute('role', 'listbox');
  kotak.parentElement.appendChild(panel);

  let indeks = null, nomor = 0, aktif = -1;
  const siapIndeks = (async () => {
    const [D, man, dat] = await Promise.all([
      fetch('data.json').then(r => r.ok ? r.json() : {}).catch(() => ({})),
      import('./butir-manual.js?v=2026-11-13-715ba1').then(m => m.BUTIR_MANUAL).catch(() => []),
      import('./butir-data.js?v=2026-11-13-715ba1').then(m => m.BUTIR_DATA).catch(() => [])]);
    indeks = [...indeksHalaman(o.modul, o.boleh), ...indeksButir(man, dat), ...indeksPublik(D, fiturAktif)]
      .filter(e => e.jenis !== 'halaman' || halamanAktif(e.href));
  })();

  const tautan = () => [...panel.querySelectorAll('a')];
  const tandai = i => { const xs = tautan(); aktif = Math.max(-1, Math.min(i, xs.length - 1)); xs.forEach((a, j) => a.classList.toggle('aktif', j === aktif)); xs[aktif]?.scrollIntoView({ block: 'nearest' }); };
  const gambar = (hasil, q, memuat) => {
    const g = kelompokkan(hasil);
    panel.innerHTML = g.length ? g.map(x => `<h4>${esc(x.label)}</h4>${x.entri.map(e =>
      `<a href="${esc(e.href)}"${e.luar ? ' target="_blank" rel="noopener"' : ''} role="option"><b>${esc(e.judul)}</b>${e.ket ? `<span>${esc(e.ket)}</span>` : ''}</a>`).join('')}`).join('')
      + (memuat ? '<p>Mencari dokumen, rapat, dan temuan…</p>' : '')
      : `<p>${memuat ? 'Mencari…' : `Tidak ada yang cocok dengan "${esc(q)}".`}</p>`;
    panel.hidden = false; aktif = -1;
  };
  let jeda = null;
  const jalankan = async () => {
    const q = kotak.value.trim(), ke = ++nomor;
    if (!q) { panel.hidden = true; return; }
    if (!indeks) { gambar([], q, true); await siapIndeks; if (ke !== nomor) return; }
    const lokal = cari(indeks, q);
    const lanjut = q.length >= 3 && o.sb;
    gambar(lokal, q, lanjut);
    if (!lanjut) return;
    const jauh = await cariSupabase(o.sb, q, { rapat: fiturAktif('rapat'), admin: o.saya?.peran === 'admin' }).catch(() => []);
    if (ke === nomor) gambar([...lokal, ...jauh], q, false);
  };
  kotak.addEventListener('input', () => { clearTimeout(jeda); jeda = setTimeout(jalankan, 150); });
  kotak.addEventListener('focus', () => { if (kotak.value.trim()) jalankan(); });
  kotak.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); tandai(aktif + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); tandai(aktif - 1); }
    else if (e.key === 'Enter') { const a = tautan()[Math.max(aktif, 0)]; if (a) { e.preventDefault(); a.click(); } }
    else if (e.key === 'Escape') { panel.hidden = true; kotak.blur(); }
  });
  document.addEventListener('click', e => { if (!kotak.parentElement.contains(e.target)) panel.hidden = true; });
  if (kotak.value.trim()) jalankan();
}
