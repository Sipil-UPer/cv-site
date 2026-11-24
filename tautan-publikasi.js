// Tautan publikasi yang bisa diklik (pemilik 2026-11-24): DOI (https://doi.org/...) atau URL terbitan.
// Dipakai halaman publik (dosen.html, daftar.html) dan daftar Karya di ruang kerja (karya-tampil.js). Tautan Google Drive
// (bukti privat) tidak pernah ditampilkan; bangun.py url_publik sudah membuangnya dari data.json, di sini dijaga lagi.

const escT = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** DOI baku tanpa awalan: '10.1/AB' dari '10.1/AB', 'doi:10.1/AB', 'https://dx.doi.org/10.1/AB'; '' bila kosong. */
export const doiBaku = d => String(d ?? '').trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '');

/** URL tujuan publikasi: DOI lebih dulu, lalu URL http(s) yang bukan Google Drive/Docs; '' bila tidak ada. */
export function urlPublikasi(p){
  const doi = doiBaku(p?.doi);
  if (doi) return `https://doi.org/${doi}`;
  const u = String(p?.url ?? '').trim();
  return /^https?:\/\/\S+$/i.test(u) && !/(drive|docs|script)\.google\./i.test(u) ? u : '';
}

/** <a> ke `url` (tab baru) dengan teks `teks` (sudah teks biasa, di-escape di sini); teks saja bila url kosong. */
export const aTautan = (url, teks) => url
  ? `<a href="${escT(url)}" target="_blank" rel="noopener">${escT(teks)}</a>` : escT(teks);

/** "DOI 10.x/…" sebagai tautan; '' bila tanpa DOI. */
export const htmlDoi = p => { const d = doiBaku(p?.doi); return d ? 'DOI ' + aTautan(`https://doi.org/${d}`, d) : ''; };
