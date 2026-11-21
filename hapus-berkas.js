/* =====================================================================
   HAPUS BERKAS — admin membuang berkas bukti ke Sampah Drive prodi
   (keputusan pemilik 2026-11-03). Dipakai karya.html (bukti karya),
   input-butir.html (pustaka dokumen), panel-bukti.js (bukti butir), dan
   data-prodi.html (bukti per baris).

   Apps Script (Code.gs, kind 'hapus') memeriksa peran admin dan hanya
   membuang berkas di dalam folder bukti prodi; tautan lain (DOI, halaman
   jurnal, folder) dilewati tanpa galat. Berkas Drive di luar folder prodi
   ditolak Apps Script; di sini penolakan itu diperlakukan sebagai "tidak
   dibuang", jadi catatannya tetap terhapus (pemilik 2026-11-15). Berkas di Sampah masih bisa
   dipulihkan 30 hari dari Google Drive akun prodi.

   Urutan pemakaian: buang berkas DULU, baru hapus catatannya; bila
   pembuangan gagal, catatan dibiarkan supaya bisa dicoba lagi.

   Berkas yang dipakai bersama (31-patch-sidik-berkas.sql: berkas yang sama
   ditautkan, tidak diunggah ulang) TIDAK dibuang selama tautannya masih
   dirujuk lebih dari satu catatan: hanya catatan pemanggil yang dihapus.
   ===================================================================== */
import { jumlahRujukan } from './sidik-berkas.js?v=2026-11-21-204437';

export async function buangBerkas(sb, url){
  const U = String(window.UPLOAD_URL || '').trim();
  if (!U || !url) return { ok: true, dibuang: false };
  // > 1: catatan pemanggil + catatan lain. null: patch 31 belum ada.
  const n = await jumlahRujukan(sb, url);
  if (n !== null && n > 1) return { ok: true, dibuang: false, alasan: 'masih dipakai di tempat lain' };
  const { data: { session } } = await sb.auth.getSession();
  if (!session) throw new Error('Sesi masuk habis. Muat ulang halaman lalu masuk lagi.');
  // text/plain: tanpa preflight CORS (tidak dilayani Apps Script).
  const res = await fetch(U, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ token: session.access_token, kind: 'hapus', url }) });
  const out = await res.json();
  // Berkas Drive di luar folder bukti prodi (mis. Drive pribadi dosen): Apps Script sengaja tidak
  // menyentuhnya. Bukan galat bagi pemanggil: berkas dibiarkan, catatannya tetap boleh dihapus.
  if (!out.ok && /di luar folder bukti/i.test(out.error || ''))
    return { ok: true, dibuang: false, alasan: 'di luar folder bukti prodi' };
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

// Bukti profil yang lepas (pemilik 2026-11-13: berkas yang diganti ikut dibuang). Hanya berkas yang
// tidak dirujuk catatan lain (jumlah_rujukan 0; tidak diketahui = tidak dibuang), karena bukti profil
// bisa memakai ulang berkas bukti karya. Admin: kind 'hapus'; pemilik: 'buang_milik'. Kegagalan
// diabaikan: berkas yang tertinggal tetap terlihat di Rapikan berkas.
export async function buangBuktiLepas(sb, urls, { milik = false } = {}){
  const U = String(window.UPLOAD_URL || '').trim();
  const xs = [...new Set((urls || []).map(u => String(u || '').trim()).filter(Boolean))];
  if (!U || !xs.length) return 0;
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return 0;
  let n = 0;
  for (const url of xs) {
    const r = await jumlahRujukan(sb, url);
    if (r === null || r > 0) continue;
    try {
      const res = await fetch(U, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ token: session.access_token, kind: milik ? 'buang_milik' : 'hapus', url }) });
      const out = await res.json();
      if (out.ok && out.dibuang) n++;
    } catch (e) { /* dibiarkan: Rapikan berkas menemukannya nanti */ }
  }
  return n;
}

export const PESAN_SAMPAH = 'Berkas dipindah ke Sampah Drive prodi (bisa dipulihkan 30 hari).';

// Foto prestasi yang tampil di situs publik (pemilik 2026-11-21: foto prestasi mahasiswa sempat hilang dari situs karena
// baris buktinya terhapus di Data prodi). Sama dengan syarat halaman_publik.prestasi_publik: prestasi terverifikasi, tidak
// disembunyikan, bukti berjenis 'foto'.
export const fotoPrestasiPublik = (tabel, baris, bukti) => tabel === 'lkps_prestasi_mahasiswa' && bukti?.jenis === 'foto'
  && (baris?.status ?? 'terverifikasi') === 'terverifikasi' && !baris?.sembunyikan_publik;
export const PERINGATAN_FOTO = 'PERHATIAN: foto ini sedang tampil di halaman publik Prestasi. Bila dilanjutkan, foto hilang dari '
  + 'situs pada pembangunan berikutnya (paling lama sejam) dan baru tampil lagi setelah diunggah ulang sebagai "Foto kegiatan".';
