// Portofolio mata kuliah (103-patch-portofolio-mk.sql, pemilik 2026-11-17, OBE tahap O3): logika halaman portofolio.html.
// Tanpa impor dan tanpa DOM (tests/js/portofolio.test.mjs).
//
// Per MK per semester (koordinator MK): materi; per butir asesmen O2: soal, kunci atau rubrik.
// Per kelas (pengampu kelas): contoh jawaban tinggi/sedang/rendah, presensi, BAP.
// Otomatis: RPS dan CPMK (O2), refleksi evaluasi pembelajaran (68), berkas nilai CPL per kelas (57).

export const KOMPONEN = {
  materi: { label: 'Materi kuliah', tingkat: 'mk' },
  soal: { label: 'Soal / lembar tugas', tingkat: 'mk', asesmen: true },
  kunci: { label: 'Kunci jawaban', tingkat: 'mk', asesmen: true },
  rubrik: { label: 'Rubrik penilaian', tingkat: 'mk', asesmen: true },
  contoh_tinggi: { label: 'Contoh jawaban nilai tinggi', tingkat: 'kelas', asesmen: true },
  contoh_sedang: { label: 'Contoh jawaban nilai sedang', tingkat: 'kelas', asesmen: true },
  contoh_rendah: { label: 'Contoh jawaban nilai rendah', tingkat: 'kelas', asesmen: true },
  presensi: { label: 'Rekap presensi', tingkat: 'kelas' },
  bap: { label: 'Berita acara perkuliahan (BAP)', tingkat: 'kelas' },
  lainnya: { label: 'Lainnya', tingkat: 'keduanya' },
};
export const komponenUntuk = tingkat => Object.entries(KOMPONEN).filter(([, k]) => k.tingkat === tingkat || k.tingkat === 'keduanya').map(([id]) => id);

const URUT_SM = { Ganjil: 1, Genap: 2 };
/** Semester unik terbaru dulu dari baris {tahun_akademik, semester}; kini ikut bila belum ada. */
export function daftarSemester(rows, kini){
  const m = new Map([...(kini ? [kini] : []), ...(rows || []).map(r => ({ ta: r.tahun_akademik, sm: r.semester }))]
    .filter(x => x.ta && x.sm).map(x => [`${x.ta}|${x.sm}`, x]));
  return [...m.values()].sort((a, b) => b.ta.localeCompare(a.ta) || URUT_SM[b.sm] - URUT_SM[a.sm]);
}

/**
 * MK yang punya kelas (daftar kelas CPL) atau berkas portofolio pada satu semester.
 * Kurikulum MK dari daftar kelas: kurikulum terbaru di ref_mata_kuliah yang memuat kodenya.
 * Hasil [{kurikulum, kode, nama, kelas: [{id, kelas, dosen_email, nilai?}]}] urut kode.
 */
export function mkSemester(kelasCpl, berkas, mkRef, ta, sm){
  const ref = kode => (mkRef || []).filter(m => m.kode.toUpperCase() === String(kode).toUpperCase())
    .sort((a, b) => b.kurikulum.localeCompare(a.kurikulum))[0];
  const per = new Map();
  const ambil = (kur, kode, nama) => {
    const k = `${kur}|${kode}`;
    if (!per.has(k)) per.set(k, { kurikulum: kur, kode, nama, kelas: [] });
    return per.get(k);
  };
  for (const k of (kelasCpl || []).filter(k => k.tahun_akademik === ta && k.semester === sm)) {
    const m = ref(k.kode_mk);
    if (!m) continue;
    ambil(m.kurikulum, m.kode, m.nama).kelas.push({ id: k.id, kelas: k.kelas, dosen_email: k.dosen_email, nilai: k.nilai });
  }
  for (const b of (berkas || []).filter(b => b.tahun_akademik === ta && b.semester === sm)) {
    const m = (mkRef || []).find(x => x.kurikulum === b.kurikulum && x.kode === b.kode_mk);
    const x = ambil(b.kurikulum, b.kode_mk, m?.nama || b.kode_mk);
    if (b.kelas && !x.kelas.some(k => k.kelas === b.kelas)) x.kelas.push({ id: null, kelas: b.kelas });
  }
  for (const x of per.values()) x.kelas.sort((a, b) => String(a.kelas).localeCompare(String(b.kelas), 'id', { numeric: true }));
  return [...per.values()].sort((a, b) => a.kode.localeCompare(b.kode));
}

/**
 * Kelengkapan satu MK semester. o = { rps: bool, cpmkLengkap: bool, asesmen: [nama], berkas: [baris MK itu],
 *   kelas: [{kelas, nilai: bool}], refleksi: bool }.
 * Hasil { mk: [{label, ada, komponen?, asesmen?}], kelas: [{kelas, item: [...]}], ada, total }.
 */
export function kelengkapan(o){
  const ada = (komponen, kelas = null, asesmen) => (o.berkas || []).some(b => b.komponen === komponen && (b.kelas || null) === kelas
    && (asesmen === undefined || b.asesmen === asesmen));
  const mk = [
    { label: 'RPS', ada: !!o.rps },
    { label: 'CPMK, butir asesmen, dan bobot lengkap', ada: !!o.cpmkLengkap },
    { label: 'Refleksi evaluasi pembelajaran', ada: !!o.refleksi },
    { label: KOMPONEN.materi.label, ada: ada('materi'), komponen: 'materi' },
    ...(o.asesmen || []).flatMap(a => [
      { label: `Soal: ${a}`, ada: ada('soal', null, a), komponen: 'soal', asesmen: a },
      // Rubrik yang disusun di RPS (pemilik 2026-11-19) memenuhi komponen ini; berkas unggahan tetap diterima.
      { label: `Kunci atau rubrik: ${a}${o.rubrikRps?.has(a) ? ' (rubrik di RPS)' : ''}`,
        ada: ada('kunci', null, a) || ada('rubrik', null, a) || !!o.rubrikRps?.has(a), komponen: 'kunci', asesmen: a }]),
  ];
  const kelas = (o.kelas || []).map(k => ({ kelas: k.kelas, item: [
    ...['contoh_tinggi', 'contoh_sedang', 'contoh_rendah'].map(c => ({ label: KOMPONEN[c].label, ada: ada(c, k.kelas), komponen: c })),
    { label: KOMPONEN.presensi.label, ada: ada('presensi', k.kelas), komponen: 'presensi' },
    // Jurnal perkuliahan (206, pemilik 2026-11-28): jurnal yang lengkap (semua pertemuan rencana RPS tercatat) memenuhi BAP;
    // k.jurnal = {isi, rencana, lengkap} (rekapJurnal) atau tidak ada (berkas unggahan saja).
    { label: `${KOMPONEN.bap.label}${k.jurnal ? ` (jurnal ${k.jurnal.isi}${k.jurnal.rencana ? `/${k.jurnal.rencana}` : ''} pertemuan)` : ''}`,
      ada: ada('bap', k.kelas) || !!k.jurnal?.lengkap, komponen: 'bap' },
    { label: 'Berkas nilai CPL', ada: !!k.nilai }] }));
  const semua = [...mk, ...kelas.flatMap(k => k.item)];
  return { mk, kelas, ada: semua.filter(x => x.ada).length, total: semua.length };
}

export const persen = k => k.total ? Math.round(100 * k.ada / k.total) : 0;

/** Label satu berkas: "Soal / lembar tugas (UTS)". */
export const labelBerkas = b => `${KOMPONEN[b.komponen]?.label || b.komponen}${b.asesmen ? ` (${b.asesmen})` : ''}`;
