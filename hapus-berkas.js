/* =====================================================================
   HAPUS BERKAS — admin membuang berkas bukti ke Sampah Drive prodi
   (keputusan pemilik 2026-11-03). Dipakai input.html (bukti karya),
   input-butir.html (pustaka dokumen), panel-bukti.js (bukti butir), dan
   data-prodi.html (bukti per baris).

   Apps Script (Code.gs, kind 'hapus') memeriksa peran admin dan hanya
   membuang berkas di dalam folder bukti prodi; tautan lain (DOI, halaman
   jurnal, folder) dilewati tanpa galat. Berkas di Sampah masih bisa
   dipulihkan 30 hari dari Google Drive akun prodi.

   Urutan pemakaian: buang berkas DULU, baru hapus catatannya; bila
   pembuangan gagal, catatan dibiarkan supaya bisa dicoba lagi.

   Berkas yang dipakai bersama (31-patch-sidik-berkas.sql: berkas yang sama
   ditautkan, tidak diunggah ulang) TIDAK dibuang selama tautannya masih
   dirujuk lebih dari satu catatan: hanya catatan pemanggil yang dihapus.
   ===================================================================== */
import { jumlahRujukan } from './sidik-berkas.js?v=2026-11-06-7f40da';

export async function buangBerkas(sb, url){
  const U = String(window.UPLOAD_URL || '').trim();
  if (!U || !url) return { ok: true, dibuang: false };
  // > 1: catatan pemanggil + catatan lain. null: patch 31 belum ada.
  const n = await jumlahRujukan(sb, url);
  if (n !== null && n > 1) return { ok: true, dibuang: false, alasan: 'masih dipakai di tempat lain' };
  const { data: { session } } = await sb.auth.getSession();
  if (!session) throw new Error('Sesi login habis. Muat ulang halaman lalu masuk lagi.');
  // text/plain: tanpa preflight CORS (tidak dilayani Apps Script).
  const res = await fetch(U, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ token: session.access_token, kind: 'hapus', url }) });
  const out = await res.json();
  if (!out.ok) {
    if (/tidak dikenal|Pilih tahun/.test(out.error || ''))
      throw new Error('Apps Script di akun prodi belum diperbarui untuk menghapus berkas. ' +
                      'Lihat apps-script/README.md, bagian "Memperbarui kode".');
    throw new Error(out.error || 'Berkas gagal dibuang.');
  }
  return out;
}

// Buang beberapa berkas berurutan; berhenti pada galat pertama.
export async function buangSemua(sb, urls){
  let n = 0;
  for (const u of urls.filter(Boolean)) {
    const out = await buangBerkas(sb, u);
    if (out.dibuang) n++;
  }
  return n;
}

export const PESAN_SAMPAH = 'Berkas dipindah ke Sampah Drive prodi (bisa dipulihkan 30 hari).';
