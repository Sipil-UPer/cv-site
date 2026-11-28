// Aksesibilitas Ruang kerja (pemeriksaan axe-core 2026-11-28, pemilik "kerjakan nomor 1"). Halaman ruang kerja dibangun ulang oleh
// skripnya masing-masing, dengan banyak pembuat formulir; modul ini menambal semuanya di satu tempat, setiap kali isi halaman berubah:
//   * kolom isian (input/select/textarea) yang belum bernama mendapat nama dari, berurutan: <label> tepat di depannya (dihubungkan
//     lewat for), judul kolom tabel (thead) untuk kolom di dalam tabel, lalu title atau placeholder (aria-label);
//   * area tabel bergulir (kelas ...gulir) yang memang bisa digulir dibuat bisa dicapai papan ketik (tabindex=0; tanpa role region,
//     supaya tidak ada landmark kembar).
// Kolom yang sudah bernama (label terhubung, label pembungkus, aria-label/aria-labelledby) tidak diubah. Dipasang dari menu.js pasangMenu() (semua halaman ruang kerja).

const BUKAN_ISIAN = new Set(['hidden', 'submit', 'button', 'reset', 'image']);
const teks = n => (n?.textContent || '').replace(/\s+/g, ' ').trim();
const sudahBernama = el => (el.labels && el.labels.length) || el.closest('label')
  || (el.getAttribute('aria-label') || '').trim() || el.getAttribute('aria-labelledby');
let nomor = 0;

/** Nama yang bisa dipakai untuk satu kolom tanpa nama: { label } (elemen label di depannya) atau { nama } (teks), atau null. */
export function namaKolom(el){
  const p = el.previousElementSibling;
  if (p && p.tagName === 'LABEL' && !p.htmlFor && teks(p)) return { label: p };
  const td = el.closest('td,th'), tabel = td?.closest('table');
  if (td && tabel) {
    const i = [...td.parentElement.children].indexOf(td), th = tabel.tHead?.rows[0]?.cells[i];
    if (teks(th)) return { nama: teks(th) };
  }
  const t = (el.getAttribute('title') || el.getAttribute('placeholder') || '').trim();
  return t ? { nama: t } : null;
}

/** Tambal satu akar dokumen; mengembalikan jumlah kolom yang diberi nama (untuk uji). */
export function tambalAksesibilitas(akar = document){
  let n = 0;
  for (const el of akar.querySelectorAll('input, select, textarea')) {
    if (el.tagName === 'INPUT' && BUKAN_ISIAN.has((el.getAttribute('type') || '').toLowerCase())) continue;
    if (sudahBernama(el)) continue;
    const x = namaKolom(el);
    if (!x) continue;
    if (x.label) { if (!el.id) el.id = `kolom-${++nomor}`; x.label.htmlFor = el.id; }
    else el.setAttribute('aria-label', x.nama);
    n++;
  }
  for (const g of akar.querySelectorAll('[class*="gulir"]')) {
    if (g.hasAttribute('tabindex') || g.scrollWidth <= g.clientWidth + 1) continue;
    g.tabIndex = 0;
  }
  return n;
}

let terpasang = false;
/** Jalankan sekarang dan setiap kali isi halaman berubah (paling sering sekali per bingkai layar). */
export function pasangAksesibilitas(){
  if (terpasang || typeof MutationObserver === 'undefined') return;
  terpasang = true;
  let tunda = null;
  const jalan = () => { tunda = null; try { tambalAksesibilitas(document); } catch { /* tidak boleh menghentikan halaman */ } };
  jalan();
  new MutationObserver(() => { if (!tunda) tunda = requestAnimationFrame(jalan); }).observe(document.body, { childList: true, subtree: true });
  addEventListener('resize', () => { if (!tunda) tunda = requestAnimationFrame(jalan); });
}
