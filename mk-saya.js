// "MK saya" di kelompok menu Mata kuliah saya (pemilik 2026-11-21): dosen hanya melihat MK yang ditugaskan kepadanya, supaya
// tidak sulit mencari. Ditugaskan = sama dengan boleh_mk di basis data (102): NIDN dosen ada di ref_mata_kuliah.pengampu
// (koordinator/pengampu, Data prodi) atau dosen itu mengajar kelas MK itu pada semester terakhir (cpl_kelas; lewat
// mk_boleh_saya()). Hanya tampilan: hak isi tetap diperiksa basis data. Peninjau (admin, pimpinan, asesor, Kaprodi, Dekan,
// GKM) bawaannya melihat semua MK. Pilihan centang diingat per halaman di peramban (localStorage, opsional).

const JABATAN_PENINJAU = ['kaprodi', 'dekan', 'gkm'];

/** Pengguna yang memeriksa semua MK; bawaan mereka = semua MK. */
export const peninjauMK = s => !s || ['admin', 'pimpinan', 'asesor'].includes(s.peran)
  || (s.koordinator || []).some(j => JABATAN_PENINJAU.includes(j));

const kunciSimpan = halaman => `mk-saya:${halaman}`;

/** Bawaan centang "Hanya MK saya" untuk halaman ini: pilihan tersimpan, selain itu ya untuk dosen, tidak untuk peninjau. */
export function bawaanHanyaSaya(halaman, saya, simpanan = null){
  let v = simpanan;
  if (v == null) { try { v = localStorage.getItem(kunciSimpan(halaman)); } catch { v = null; } }
  if (v === '1') return true;
  if (v === '0') return false;
  return !peninjauMK(saya);
}

/** Simpan pilihan centang (gagal diam-diam bila penyimpanan peramban diblokir). */
export function ingatHanyaSaya(halaman, nilai){
  try { localStorage.setItem(kunciSimpan(halaman), nilai ? '1' : '0'); } catch { /* tidak apa-apa */ }
}

/**
 * Himpunan kunci MK milik pengguna: pengampu memuat NIDN-nya, ditambah baris mk_boleh_saya() bila pengguna bukan admin/GKM
 * (untuk admin/GKM fungsi itu mengembalikan semua MK). kunci(kurikulum, kode) mengikuti halaman pemanggil.
 */
export function mkMilikSaya(mk = [], boleh = [], saya = null, kunci = (k, c) => `${k}|${c}`){
  const out = new Set();
  const nidn = saya?.nidn ? String(saya.nidn) : '';
  if (nidn) for (const m of mk) if ((m.pengampu || []).map(String).includes(nidn)) out.add(kunci(m.kurikulum, m.kode));
  const semuaBoleh = saya?.peran === 'admin' || (saya?.koordinator || []).includes('gkm');
  if (!semuaBoleh) for (const b of boleh) out.add(kunci(b.kurikulum, b.kode_mk));
  return out;
}

/** Pesan bila "Hanya MK saya" membuat daftar kosong padahal ada MK lain (nSemua = jumlah tanpa penyaring ini). */
export const pesanKosongSaya = nSemua => nSemua
  ? `<p class="kosong">Tidak ada MK yang ditugaskan kepada Anda di daftar ini (koordinator/pengampu di Data prodi, atau kelas yang
      Anda ajar semester terakhir). Hilangkan centang <b>Hanya MK saya</b> untuk melihat semua MK, atau minta admin menetapkan
      Anda sebagai koordinator/pengampu MK.</p>`
  : '';

/**
 * Kelas tempat saya mengajar menurut Penyusunan kelas (136/137), termasuk anggota team teaching:
 * [{ tahun_akademik, semester, kurikulum, kode_mk, kelas, peran }]. Sebelum patch 136 atau tanpa data: [].
 * Dua kueri sederhana (tanpa embed) supaya juga jalan di situs contoh.
 */
export async function kelasMengajarSaya(sb, saya){
  if (!saya?.id) return [];
  try {
    const kd = await sb.from('kelas_dosen').select('kelas_id,peran').eq('dosen_id', saya.id);
    if (kd.error || !kd.data?.length) return [];
    const k = await sb.from('kelas_kuliah').select('id,tahun_akademik,semester,kurikulum,kode_mk,kelas').in('id', kd.data.map(x => x.kelas_id));
    if (k.error) return [];
    const peran = new Map(kd.data.map(x => [x.kelas_id, x.peran]));
    return (k.data || []).map(x => ({ tahun_akademik: x.tahun_akademik, semester: x.semester, kurikulum: x.kurikulum, kode_mk: x.kode_mk,
      kelas: x.kelas, peran: peran.get(x.id) }));
  } catch { return []; }
}

/** Kunci 'TA|semester|KODE|kelas' (kode huruf besar) dari kelas yang saya ajar, untuk pemeriksaan hak di halaman. */
export const kunciKelasSaya = tim => new Set((tim || []).map(k => `${k.tahun_akademik}|${k.semester}|${String(k.kode_mk).toUpperCase()}|${k.kelas}`));
