// Pengelompokan dosen dan hitungan akreditasi per TS (154-patch-dosen-mengampu-ts.sql, pemilik 2026-11-22): logika murni
// untuk kelola-dosen.html dan skor.html, dites di Node (tests/js/dosen_hitung.test.mjs). Aturan sama dengan bangun.py
// (masuk_dtps + nidn_mengampu):
//   * staf admin (bukan dosen) = tanpa kategori dosen: tidak pernah dihitung; asesor juga tidak;
//   * DTPS = kategori tetap + centang homebase prodi (dtps) + tidak tugas belajar + aktif + mengampu MK pada TS;
//   * DT = kategori tetap, aktif, mengampu pada TS (termasuk DTPS); DTT = tidak tetap atau industri, aktif, mengampu pada TS;
//   * mengampu = punya kelas di Penyusunan kelas pada tahun akademik TS, atau dicentang manual admin (dosen_ampu_ts);
//   * pengaman: bila untuk TS itu belum ada data mengampu sama sekali, syarat mengampu tidak diterapkan;
//   * tugas belajar (87 + 156, pemilik 2026-11-22): keterangan terisi = dosen homebase yang tugas belajar; tidak dihitung
//     pada TS yang beririsan dengan masa tugas belajarnya (mulai s/d selesai; selesai kosong = masih), pada TS lain DTPS.
//     Tanpa tanggal mulai: tugas belajar di semua TS (perilaku lama).

export const KELOMPOK = {
  dtps: 'DTPS (dosen tetap, homebase prodi ini)',
  dt: 'Dosen tetap (DT) bukan DTPS',
  tb: 'Dosen tetap sedang tugas belajar',
  dtt: 'Dosen tidak tetap (DTT)',
  industri: 'Dosen industri/praktisi (dihitung DTT)',
  staf: 'Staf (bukan dosen)',
  pimpinan: 'Pimpinan (bukan dosen prodi)',
  asesor: 'Asesor',
};
export const URUT_KELOMPOK = ['dtps', 'dt', 'tb', 'dtt', 'industri', 'pimpinan', 'staf', 'asesor'];

const ya = v => v === true || ['ya', 'y', 'true', '1'].includes(String(v ?? '').toLowerCase());
const tglKini = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/** Batas tahun akademik 'YYYY/YYYY' -> ['YYYY-09-01', 'YYYY-08-31'], atau null bila formatnya lain. */
export function batasTA(ta){
  const m = /^(\d{4})\/(\d{4})$/.exec(String(ta || ''));
  return m ? [`${m[1]}-09-01`, `${m[2]}-08-31`] : null;
}

/** Tercatat tugas belajar (keterangan terisi): dosen homebase, apa pun periodenya. */
export const catatTB = d => !!String(d.tugas_belajar || '').trim();

/**
 * Sedang tugas belajar pada TS ta (beririsan, pemilik 2026-11-22) atau, tanpa ta, pada tanggal hari (bawaan hari ini).
 * Tanpa tanggal mulai: selalu (perilaku sebelum patch 156).
 */
export function sedangTB(d, ta = null, hari = null){
  if (!catatTB(d)) return false;
  const mulai = String(d.tugas_belajar_mulai || '').slice(0, 10), selesai = String(d.tugas_belajar_selesai || '').slice(0, 10);
  if (!mulai) return true;
  const b = ta ? batasTA(ta) : null;
  const [awal, akhir] = b || [hari || tglKini(), hari || tglKini()];
  return mulai <= akhir && (!selesai || selesai >= awal);
}

/** Masa tugas belajar sudah lewat (selesai < hari ini) tetapi keterangan masih terisi: admin perlu mengosongkannya. */
export const tbLewat = (d, hari = null) => catatTB(d) && !!d.tugas_belajar_selesai && String(d.tugas_belajar_selesai).slice(0, 10) < (hari || tglKini());

/** Kelompok satu baris dosen (lihat KELOMPOK) pada TS ta (tanpa ta: hari ini). */
export function kelompokDosen(d, ta = null){
  if (d.peran === 'asesor') return 'asesor';
  if (catatTB(d)) return sedangTB(d, ta) ? 'tb' : 'dtps';   // homebase: di luar masa tugas belajar = DTPS
  if (d.kategori === 'tetap') return ya(d.dtps) ? 'dtps' : 'dt';
  if (d.kategori === 'tidak_tetap') return 'dtt';
  if (d.kategori === 'industri') return 'industri';
  if (ya(d.dtps)) return 'dtps';                       // baris lama DTPS tanpa kategori (= Dosen Tetap, patch 154 mengisinya)
  return d.peran === 'pimpinan' ? 'pimpinan' : 'staf';
}

/** Map tahun akademik -> Set id dosen yang mengampu: kelas (kelas_kuliah + kelas_dosen) dan centang manual (dosen_ampu_ts). */
export function ampuPerTA({ kelas = [], kd = [], manual = [] } = {}){
  const taKelas = new Map(kelas.map(k => [k.id, k.tahun_akademik])), out = new Map();
  const tambah = (ta, id) => { if (!ta || !id) return; if (!out.has(ta)) out.set(ta, new Set()); out.get(ta).add(id); };
  for (const r of kd) tambah(taKelas.get(r.kelas_id), r.dosen_id);
  for (const r of manual) tambah(r.tahun_akademik, r.dosen_id);
  return out;
}

/**
 * Status satu dosen pada tahun akademik ta. -> { kelompok, dtps, dt, dtt, alasan, diterapkan, sumber }
 * (dtps/dt/dtt = dihitung pada TS itu). sumberAmpu: Map ta -> Map id -> 'kelas' | 'manual' (opsional, untuk keterangan).
 */
export function statusTS(d, ta, ampu, sumberAmpu = null){
  const kelompok = kelompokDosen(d, ta), set = ampu.get(ta), diterapkan = !!(set && set.size);
  const mengampu = !diterapkan || set.has(d.id);
  const out = { kelompok, dtps: false, dt: false, dtt: false, alasan: '', diterapkan, sumber: sumberAmpu?.get(ta)?.get(d.id) || null };
  if (['staf', 'pimpinan', 'asesor'].includes(kelompok)) { out.alasan = 'bukan dosen prodi'; return out; }
  if (d.aktif === false) { out.alasan = 'tidak aktif'; return out; }
  if (kelompok === 'tb') { out.alasan = 'tugas belajar'; return out; }
  if (!mengampu) { out.alasan = `tidak mengampu MK pada ${ta}`; return out; }
  out.dt = ['dtps', 'dt'].includes(kelompok);
  out.dtps = kelompok === 'dtps';
  out.dtt = ['dtt', 'industri'].includes(kelompok);
  return out;
}

/** Hitungan satu TS: { ndtps, ndt, ndtt, industri, diterapkan, tidakMengampu: [nama] }. */
export function hitungTS(dosen = [], ta, ampu){
  const s = dosen.map(d => ({ d, st: statusTS(d, ta, ampu) }));
  return {
    ndtps: s.filter(x => x.st.dtps).length, ndt: s.filter(x => x.st.dt).length, ndtt: s.filter(x => x.st.dtt).length,
    industri: s.filter(x => x.st.dtt && x.st.kelompok === 'industri').length,
    diterapkan: !!(ampu.get(ta) && ampu.get(ta).size),
    tidakMengampu: s.filter(x => /tidak mengampu/.test(x.st.alasan)).map(x => x.d.nama),
  };
}

/**
 * Dosen yang dihitung pada TS ta (pemilik 2026-11-22): { dtps, hitung } = baris DTPS dan semua yang masuk NDTPS/NDT/NDTT
 * (statusTS). Dipakai LKPS 4.a/4.c/4.h/4.i, draf LED, dan rincian butir supaya sama dengan Kelola dosen dan Skor.
 */
export function dosenTS(dosen = [], ta, ampu = new Map()){
  const s = (dosen || []).map(d => [d, statusTS(d, ta, ampu)]);
  return { dtps: s.filter(([, x]) => x.dtps).map(([d]) => d), hitung: s.filter(([, x]) => x.dtps || x.dt || x.dtt).map(([d]) => d) };
}

/** Data mengampu dari Supabase untuk ampuPerTA(): tabel yang belum ada atau tidak boleh dibaca = kosong. */
export async function bacaAmpu(sb){
  const baca = q => q.then(r => (r.error ? [] : (r.data || [])), () => []);
  const [kelas, kd, manual] = await Promise.all([baca(sb.from('kelas_kuliah').select('id,tahun_akademik')),
    baca(sb.from('kelas_dosen').select('kelas_id,dosen_id')), baca(sb.from('dosen_ampu_ts').select('dosen_id,tahun_akademik'))]);
  return { kelas, kd, manual };
}
