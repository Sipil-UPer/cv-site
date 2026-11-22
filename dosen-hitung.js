// Pengelompokan dosen dan hitungan akreditasi per TS (154-patch-dosen-mengampu-ts.sql, pemilik 2026-11-22): logika murni
// untuk kelola-dosen.html dan skor.html, dites di Node (tests/js/dosen_hitung.test.mjs). Aturan sama dengan bangun.py
// (masuk_dtps + nidn_mengampu):
//   * staf admin (bukan dosen) = tanpa kategori dosen: tidak pernah dihitung; asesor juga tidak;
//   * DTPS = kategori tetap + centang homebase prodi (dtps) + tidak tugas belajar + aktif + mengampu MK pada TS;
//   * DT = kategori tetap, aktif, mengampu pada TS (termasuk DTPS); DTT = tidak tetap atau industri, aktif, mengampu pada TS;
//   * mengampu = punya kelas di Penyusunan kelas pada tahun akademik TS, atau dicentang manual admin (dosen_ampu_ts);
//   * pengaman: bila untuk TS itu belum ada data mengampu sama sekali, syarat mengampu tidak diterapkan.

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

/** Kelompok satu baris dosen (lihat KELOMPOK). */
export function kelompokDosen(d){
  if (d.peran === 'asesor') return 'asesor';
  if (String(d.tugas_belajar || '').trim()) return 'tb';
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
  const kelompok = kelompokDosen(d), set = ampu.get(ta), diterapkan = !!(set && set.size);
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
