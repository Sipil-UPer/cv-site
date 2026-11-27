// Peminatan dan mata kuliah pilihan K26 (pemilik 2026-11-27). Fungsi murni; dipakai peminatan.html.
// Aturan dari Dokumen Kurikulum K26 (versi perbaikan Ditdik 2026-11-27), Bab 4: MK pilihan 12 sks menurut kelompok
// keahlian mulai semester VI (VI 3 sks, VII 6 sks, VIII 3 sks); setiap mahasiswa wajib mengambil 2 MK sesuai bidang
// peminatan topik TA. Pemilik 2026-11-27: kedua MK itu boleh yang telah, sedang, atau akan diambil (patch 196-197).

export const SKS_PILIHAN = 12;
export const SEBARAN_PILIHAN = [['VI', 3], ['VII', 6], ['VIII', 3]];
export const MK_BIDANG_TA = 2;
export const KODE_UMUM = 'UMUM';

/** Data per bidang dari data.json: [{kode, nama, cakupan, berkas, mk: [...], dosen}] urut bidang di situs,
 *  ditambah umum: MK pilihan Sipil Umum (boleh untuk semua bidang, tidak dihitung syarat TA). */
export function susunPeminatan(D = {}){
  const mk = ((D.kurikulum || []).find(k => k.kode === 'K26')?.mk || []).filter(m => m.sifat === 'pilihan');
  const urut = xs => [...xs].sort((a, b) => String(a.nama).localeCompare(String(b.nama), 'id'));
  const bidang = (D.situs?.kelompok_keahlian || []).map(k => ({
    kode: k.kode, nama: k.nama, cakupan: k.cakupan || '', berkas: k.berkas || '',
    mk: urut(mk.filter(m => m.peminatan === k.kode)),
    dosen: (D.dosen || []).filter(d => d.kelompok === k.kode).length }));
  return { bidang, umum: urut(mk.filter(m => m.peminatan === KODE_UMUM)), semua: mk };
}

/** Periksa rencana MK pilihan: kode MK terpilih + bidang topik TA. */
export function cekRencana(pilih = [], bidang = '', semua = []){
  const xs = semua.filter(m => pilih.includes(m.kode));
  const sks = xs.reduce((a, m) => a + (+m.sks || 0), 0);
  const nBidang = xs.filter(m => bidang && m.peminatan === bidang).length;
  return { sks, nBidang, cukupSks: sks >= SKS_PILIHAN, syaratTA: !!bidang && nBidang >= MK_BIDANG_TA,
    kurangSks: Math.max(0, SKS_PILIHAN - sks), kurangBidang: Math.max(0, MK_BIDANG_TA - nBidang) };
}
