/* =====================================================================
   sidik-berkas.js — satu berkas tersimpan satu kali (pemilik 2026-11-04,
   supabase/31-patch-sidik-berkas.sql).

   Sebelum mengunggah, browser menghitung sidik isi berkas (SHA-256) dan
   menanyakan ke database apakah berkas yang sama persis sudah tersimpan:
   di pustaka dokumen, bukti butir, bukti baris Data prodi, atau bukti
   karya. Bila ada, tautan yang sudah ada dipakai ulang dan tidak ada
   unggahan baru. Nama berkas tidak berpengaruh: yang dibandingkan isinya.

   Patch 31 belum dijalankan (fungsi cari_sha256 tidak ada) atau browser
   tanpa crypto.subtle: periksaBerkas mengembalikan { sha256: null, temuan:
   null } dan unggahan berjalan seperti sebelumnya. Pemanggil hanya
   mengirim kolom sha256 bila nilainya ada (lihat kolomSidik).
   ===================================================================== */

const NAMA_SUMBER = { dokumen: 'pustaka dokumen', butir_bukti: 'bukti butir',
                      lkps_bukti: 'bukti baris Data prodi', karya_bukti: 'bukti karya' };

// SHA-256 isi berkas (Blob/File) sebagai 64 huruf hex kecil; null bila tidak bisa.
export async function sidikBerkas(berkas){
  const subtle = globalThis.crypto && globalThis.crypto.subtle;
  if (!subtle || !berkas || typeof berkas.arrayBuffer !== 'function') return null;
  const h = await subtle.digest('SHA-256', await berkas.arrayBuffer());
  return [...new Uint8Array(h)].map(x => x.toString(16).padStart(2, '0')).join('');
}

// Catatan yang sudah menyimpan berkas dengan sidik h (pustaka dulu), atau [].
// null bila fungsi database belum ada (patch 31 belum dijalankan).
export async function cariSidik(sb, h){
  if (!h) return null;
  const { data, error } = await sb.rpc('cari_sha256', { h });
  if (error) return null;
  return data || [];
}

// { sha256, temuan }: temuan = catatan pertama yang menyimpan berkas yang sama
// (pustaka didahulukan), atau null bila berkas ini belum pernah tersimpan.
export async function periksaBerkas(sb, berkas){
  const sha256 = await sidikBerkas(berkas).catch(() => null);
  const xs = await cariSidik(sb, sha256);
  if (xs === null) return { sha256: null, temuan: null };
  return { sha256, temuan: xs.find(x => x.sumber === 'dokumen') || xs[0] || null };
}

// Kolom sidik untuk insert/upsert: kosong bila patch 31 belum ada.
export const kolomSidik = sha256 => (sha256 ? { sha256 } : {});

// Kalimat untuk pemakai: "sudah tersimpan di pustaka dokumen (...)".
export const teksTemuan = t => t
  ? `sudah tersimpan di ${NAMA_SUMBER[t.sumber] || t.sumber}${t.keterangan ? ' (' + t.keterangan + ')' : ''}` : '';

// Berapa catatan memakai tautan u; null bila fungsi belum ada. Dipakai
// hapus-berkas.js: berkas yang masih dirujuk catatan lain tidak dibuang.
export async function jumlahRujukan(sb, u){
  const { data, error } = await sb.rpc('jumlah_rujukan', { u });
  return error ? null : +data;
}
