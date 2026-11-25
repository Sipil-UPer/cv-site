// Tinggi semua kotak teks (<textarea>) mengikuti isinya (pemilik 2026-11-25: "setiap pengisian teks
// seluruhnya bisa mengikuti untuk ukuran kotak", termasuk notulen rapat). Cukup diimpor sekali:
// menu.js (ruang kerja), kerangka.js (halaman publik) dan survei.html memuatnya.
//
//  - rows="n" tetap menjadi tinggi minimum (height:auto lalu scrollHeight tidak pernah di bawah rows);
//  - kotak kosong mengikuti petunjuknya (placeholder) agar terbaca utuh, cara narasi-led.html;
//  - isi yang diisi skrip (el.value = ...) ikut: setter value dibungkus, karena tidak memicu 'input';
//  - kotak tersembunyi (tab, <details> tertutup, display:none) tidak punya ukuran; ResizeObserver
//    memberi tahu saat lebarnya berubah (mis. tampil), lalu diukur ulang;
//  - posisi gulir halaman dijaga, karena height:auto sesaat memendekkan halaman;
//  - kotak bertanda data-tinggi-tetap tidak diubah (pilihan per halaman bila kelak perlu).

// Di luar browser (uji Node mengimpor menu.js) modul ini tidak berbuat apa-apa.
const ADA_DOM = typeof HTMLTextAreaElement === 'function' && typeof document !== 'undefined';
const desk = ADA_DOM ? Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value') : null;
const antre = new Set();
let dijadwalkan = false;
const lebarTerakhir = new WeakMap();

export function pas(el) {
  if (!ADA_DOM || !(el instanceof HTMLTextAreaElement) || el.hasAttribute('data-tinggi-tetap')) return;
  if (!el.isConnected || el.offsetWidth === 0) return;          // tersembunyi: tunggu ResizeObserver
  const kosong = desk.get.call(el) === '' && el.placeholder;
  const gx = window.scrollX, gy = window.scrollY;
  if (kosong) desk.set.call(el, el.placeholder);
  el.style.height = 'auto';
  // scrollHeight = isi + padding. border-box: + border; content-box (bawaan, tema.css tidak mengaturnya): - padding.
  const g = getComputedStyle(el);
  const tambah = g.boxSizing === 'border-box'
    ? el.offsetHeight - el.clientHeight
    : -(parseFloat(g.paddingTop) + parseFloat(g.paddingBottom));
  el.style.height = (el.scrollHeight + tambah) + 'px';
  if (kosong) desk.set.call(el, '');
  if (window.scrollX !== gx || window.scrollY !== gy) window.scrollTo(gx, gy);
  lebarTerakhir.set(el, el.offsetWidth);
}

function jadwalkan(el) {
  antre.add(el);
  if (dijadwalkan) return;
  dijadwalkan = true;
  requestAnimationFrame(() => {
    dijadwalkan = false;
    const semua = [...antre];
    antre.clear();
    semua.forEach(pas);
  });
}

export function pasSemua(akar = ADA_DOM ? document : null) {
  if (!ADA_DOM || !akar) return;
  if (akar instanceof HTMLTextAreaElement) { amati(akar); jadwalkan(akar); return; }
  akar.querySelectorAll?.('textarea').forEach(el => { amati(el); jadwalkan(el); });
}

// Lebar berubah = tampil dari tersembunyi atau jendela diubah ukurannya; tinggi yang kita ubah sendiri diabaikan.
const pengamat = typeof ResizeObserver === 'function'
  ? new ResizeObserver(entri => entri.forEach(e => {
      if (e.target.offsetWidth !== lebarTerakhir.get(e.target)) jadwalkan(e.target);
    }))
  : null;
const diamati = new WeakSet();
function amati(el) {
  if (!pengamat || diamati.has(el)) return;
  diamati.add(el);
  pengamat.observe(el);
}

function pasang() {
  if (window.__kotakTeks) return;                                // diimpor dua kali (menu.js + kerangka.js)
  window.__kotakTeks = true;
  Object.defineProperty(HTMLTextAreaElement.prototype, 'value', {
    configurable: true, enumerable: desk.enumerable, get: desk.get,
    set(v) { desk.set.call(this, v); jadwalkan(this); },
  });
  document.addEventListener('input', e => { if (e.target instanceof HTMLTextAreaElement) jadwalkan(e.target); }, true);
  document.addEventListener('toggle', e => pasSemua(e.target), true);   // <details> dibuka
  new MutationObserver(daftar => daftar.forEach(m => {
    if (m.type === 'childList') m.addedNodes.forEach(n => { if (n.nodeType === 1) pasSemua(n); });
    else if (m.target instanceof HTMLTextAreaElement) jadwalkan(m.target);   // placeholder/rows berubah
  })).observe(document.documentElement, { childList: true, subtree: true, attributes: true,
                                           attributeFilter: ['placeholder', 'rows'] });
  pasSemua();
  document.fonts?.ready?.then(() => pasSemua());                 // huruf web dimuat: lebar baris berubah
}

if (ADA_DOM) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pasang, { once: true });
  else pasang();
}
