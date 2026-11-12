// Target kinerja per dosen (pemilik 2026-11-12; 66-patch-target-dosen.sql). Dipakai target.html
// dan Tugas saya (ruang-kerja.html). Target baku per jabatan, bisa ditimpa per dosen; capaian
// dihitung dari karya (terverifikasi = capaian, diajukan = menunggu) dan proposal hibah tim.
// Periode: tahun kalender.

export const JABATAN = [
  ['tenaga_pengajar', 'Tenaga pengajar'], ['asisten_ahli', 'Asisten ahli'], ['lektor', 'Lektor'],
  ['lektor_kepala', 'Lektor kepala'], ['guru_besar', 'Guru besar'],
];
const BEREPUTASI = new Set(['scopus_q1', 'scopus_q2', 'scopus_q3', 'scopus_q4', 'wos']);
const SINTA = new Set(['sinta_1_2', 'sinta_3_4', 'sinta_5_6']);
// Hibah eksternal: kelompok dana di luar kampus (ref_kelompok_dana, 01-skema.sql).
export const KELOMPOK_EKSTERNAL = new Set(['nasional', 'pemerintah', 'industri', 'internasional']);
const DIAJUKAN = new Set(['diajukan', 'didanai', 'ditolak']);

/** Indikator: kode (disimpan di tabel), label, satuan, dan penyaring karya (null = dari hibah). */
export const INDIKATOR = [
  { kode: 'publikasi', label: 'Publikasi', satuan: 'judul', karya: k => k.kategori === 'publikasi' },
  { kode: 'publikasi_bereputasi', label: 'Publikasi bereputasi (Scopus/WoS)', satuan: 'judul', karya: k => k.kategori === 'publikasi' && BEREPUTASI.has(k.indeksasi) },
  { kode: 'publikasi_sinta', label: 'Publikasi nasional terakreditasi (SINTA 1–6)', satuan: 'judul', karya: k => k.kategori === 'publikasi' && SINTA.has(k.indeksasi) },
  { kode: 'penelitian', label: 'Penelitian (ketua/anggota)', satuan: 'judul', karya: k => k.kategori === 'penelitian' },
  { kode: 'pkm', label: 'Pengabdian (ketua/anggota)', satuan: 'kegiatan', karya: k => k.kategori === 'pkm' },
  { kode: 'luaran', label: 'Luaran/HKI', satuan: 'luaran', karya: k => k.kategori === 'luaran' },
  { kode: 'rekognisi', label: 'Rekognisi', satuan: 'rekognisi', karya: k => k.kategori === 'rekognisi' },
  { kode: 'hibah_eksternal', label: 'Proposal hibah eksternal diajukan', satuan: 'proposal', karya: null },
];
export const labelIndikator = kode => INDIKATOR.find(i => i.kode === kode)?.label || kode;

/**
 * Target berlaku per indikator untuk satu dosen: target_dosen menimpa target_baku jabatannya.
 * Hasil { kode: { target, sumber: 'dosen'|'jabatan' } }; indikator tanpa target tidak ada.
 */
export function targetEfektif(dosen, tahun, baku, khusus){
  const out = {};
  for (const b of baku || []) if (+b.tahun === +tahun && b.jabatan === dosen.jabatan) out[b.indikator] = { target: +b.target, sumber: 'jabatan' };
  for (const t of khusus || []) if (+t.tahun === +tahun && t.dosen_id === dosen.id) out[t.indikator] = { target: +t.target, sumber: 'dosen', catatan: t.catatan || '' };
  return out;
}

const tahunHibah = a => +(String(a.tanggal_ajuan || '').slice(0, 4)) || +a.tahun_usulan;

/**
 * Capaian satu dosen pada satu tahun: { kode: { sah, menunggu } }.
 * karya: baris {kategori, indeksasi, tahun, status, karya_penulis: [{dosen_id}]};
 * hibah: hibah_ajuan dengan hibah_tim [{dosen_id}] dan skema {kelompok}.
 */
export function capaianDosen(dosenId, tahun, karya, hibah){
  const out = Object.fromEntries(INDIKATOR.map(i => [i.kode, { sah: 0, menunggu: 0 }]));
  for (const k of karya || []) {
    if (+k.tahun !== +tahun || !(k.karya_penulis || []).some(p => p.dosen_id === dosenId)) continue;
    const kunci = k.status === 'terverifikasi' ? 'sah' : k.status === 'diajukan' ? 'menunggu' : null;
    if (!kunci) continue;
    for (const i of INDIKATOR) if (i.karya && i.karya(k)) out[i.kode][kunci] += 1;
  }
  for (const a of hibah || []) {
    if (!DIAJUKAN.has(a.status) || tahunHibah(a) !== +tahun) continue;
    if (!KELOMPOK_EKSTERNAL.has(a.skema?.kelompok)) continue;
    if ((a.hibah_tim || []).some(t => t.dosen_id === dosenId)) out.hibah_eksternal.sah += 1;
  }
  return out;
}

/** tercapai | hampir (>= 80% target, sama dengan capaian IKU) | belum. Target 0 = tercapai. */
export function statusTarget(target, sah){
  if (!(target > 0)) return 'tercapai';
  return sah >= target ? 'tercapai' : sah >= 0.8 * target ? 'hampir' : 'belum';
}

/**
 * Baris tabel satu dosen: [{ kode, label, target, sumber, sah, menunggu, status }] untuk indikator
 * yang punya target, urut INDIKATOR.
 */
export function barisDosen(dosen, tahun, { baku, khusus, karya, hibah }){
  const t = targetEfektif(dosen, tahun, baku, khusus), c = capaianDosen(dosen.id, tahun, karya, hibah);
  return INDIKATOR.filter(i => t[i.kode]).map(i => ({ kode: i.kode, label: i.label, satuan: i.satuan, target: t[i.kode].target,
    sumber: t[i.kode].sumber, catatan: t[i.kode].catatan || '', sah: c[i.kode].sah, menunggu: c[i.kode].menunggu,
    status: statusTarget(t[i.kode].target, c[i.kode].sah) }));
}

/** Ringkasan untuk Tugas saya: indikator tahun berjalan yang belum tercapai. */
export const belumTercapai = baris => (baris || []).filter(b => b.status !== 'tercapai');

/** Angka target untuk tampilan: tanpa ,00. */
export const angka = v => (v == null || v === '' ? '' : String(+(+v).toFixed(2)).replace('.', ','));

/**
 * Pengingat email (pengingat.html; pemilik 2026-11-12): dosen aktif yang punya indikator belum tercapai tahun itu.
 * D = { baku, khusus, karya, hibah } seperti barisDosen. Hasil [{ nama, email, rinci }].
 */
export function penerimaTarget(dosen, tahun, D){
  return (dosen || []).filter(d => d.email && d.aktif !== false && d.peran !== 'asesor' && d.dtps !== false)
    .map(d => ({ d, xs: belumTercapai(barisDosen(d, tahun, D)) })).filter(x => x.xs.length)
    .map(({ d, xs }) => ({ nama: d.nama, email: d.email, rinci: xs.map(b => `- ${b.label}: ${b.sah} dari target ${angka(b.target)} ${b.satuan}`
      + (b.menunggu ? ` (+${b.menunggu} menunggu verifikasi)` : '')).join('\n') }));
}
