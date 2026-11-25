// Tab per bagian halaman (pemilik 2026-11-25: susunan halaman TA dirapikan). Setiap <h2> anak langsung `root` beserta isi
// sesudahnya (sampai <h2> berikutnya) menjadi satu tab; isi sebelum <h2> pertama tetap di atas. Elemen tidak dibuat ulang
// (hanya dipindah), jadi getElementById dan pengisian ulang bagian tetap berjalan. Tab dibuka dari #id di alamat (id <h2> atau
// elemen di dalamnya; mis. rekap-ta.html#kuota-ta), lalu dari pilihan terakhir di halaman ini (sessionStorage), lalu tab pertama.

const GAYA = `
.tab-bar{display:flex;flex-wrap:wrap;gap:4px;border-bottom:2px solid var(--line,#d8dde6);margin:16px 0 0;position:sticky;top:0;
  background:var(--bg,#f4f6f9);z-index:5;padding-top:4px}
.tab-bar button{font:inherit;font-size:14px;font-weight:600;background:none;border:1px solid transparent;border-bottom:none;
  padding:8px 14px;margin-bottom:-2px;cursor:pointer;color:var(--muted,#5b6575);border-radius:4px 4px 0 0}
.tab-bar button:hover{color:var(--biru,#0b3d91)}
.tab-bar button[aria-selected="true"]{background:#fff;border-color:var(--line,#d8dde6);border-bottom:2px solid #fff;color:var(--biru,#0b3d91)}
.tab-bar .n{display:inline-block;min-width:18px;margin-left:6px;padding:0 5px;border-radius:9px;font-size:11.5px;background:var(--merah,#c0392b);color:#fff;text-align:center}
.tab-panel{background:#fff;border:1px solid var(--line,#d8dde6);border-top:none;padding:6px 16px 18px}
.tab-panel > h2:first-child{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
@media print{.tab-bar{display:none}.tab-panel{display:block!important;border:none}}`;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function pasangGaya(){
  if (document.getElementById('gaya-tab-seksi')) return;
  const s = document.createElement('style'); s.id = 'gaya-tab-seksi'; s.textContent = GAYA; document.head.appendChild(s);
}

/** Bagi anak `root` menjadi tab per <h2>. Kurang dari dua <h2>: tidak berubah. Mengembalikan { pilih(i), panel, bar } atau null. */
export function pasangTab(root, { kunci = 'tab:' + location.pathname } = {}){
  if (!root) return null;
  const h2 = [...root.children].filter(e => e.tagName === 'H2');
  if (h2.length < 2) return null;
  pasangGaya();
  const panel = h2.map((h, i) => {
    const s = document.createElement('section'); s.className = 'tab-panel'; s.setAttribute('role', 'tabpanel');
    s.id = 'tab-panel-' + i; s.setAttribute('aria-labelledby', 'tab-btn-' + i); return s;
  });
  let i = -1;
  for (const e of [...root.children]) { if (e.tagName === 'H2') i = h2.indexOf(e); if (i >= 0) panel[i].appendChild(e); }
  const bar = document.createElement('div'); bar.className = 'tab-bar'; bar.setAttribute('role', 'tablist');
  bar.innerHTML = h2.map((h, n) => `<button type="button" role="tab" id="tab-btn-${n}" aria-controls="tab-panel-${n}">${esc(h.textContent.trim())}</button>`).join('');
  root.append(bar, ...panel);
  const tombol = [...bar.children];
  const pilih = (n, simpan = true) => {
    n = Math.max(0, Math.min(panel.length - 1, n));
    panel.forEach((p, k) => { p.hidden = k !== n; });
    tombol.forEach((b, k) => { b.setAttribute('aria-selected', String(k === n)); b.tabIndex = k === n ? 0 : -1; });
    if (simpan) try { sessionStorage.setItem(kunci, String(n)); } catch (e) { /* tanpa penyimpanan */ }
  };
  const dariHash = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id || /[=&]/.test(id)) return -1;
    const el = document.getElementById(id);
    return el ? panel.findIndex(p => p.contains(el)) : -1;
  };
  tombol.forEach((b, n) => {
    b.onclick = () => pilih(n);
    b.onkeydown = e => { const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (d) { pilih((n + d + panel.length) % panel.length); tombol[(n + d + panel.length) % panel.length].focus(); } };
  });
  let awal = dariHash();
  if (awal < 0) { try { awal = +(sessionStorage.getItem(kunci) ?? 0); } catch (e) { awal = 0; } }
  pilih(Number.isFinite(awal) ? awal : 0, false);
  addEventListener('hashchange', () => { const n = dariHash(); if (n >= 0) pilih(n); });
  // Tautan di dalam halaman ke #id bagian lain: pindah tab dulu.
  root.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const el = document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
    const n = el ? panel.findIndex(p => p.contains(el)) : -1;
    if (n >= 0) pilih(n);
  });
  return { pilih, panel, bar, angka(n, x){ const b = tombol[n]; if (!b) return; b.querySelector('.n')?.remove(); if (x > 0) b.insertAdjacentHTML('beforeend', `<span class="n">${x}</span>`); } };
}
