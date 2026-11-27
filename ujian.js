// Jadwal ujian, pengawas, dan validasi soal (195-patch-ujian-validasi-soal.sql, pemilik 2026-11-27).
// Fungsi murni; dipakai ujian.html dan tugas-saya.js. Jam "HH:MM" atau "HH:MM:SS"; tanggal "YYYY-MM-DD".

export const JENIS_UJIAN = { uts: 'UTS', uas: 'UAS' };
// Daftar periksa validasi soal; kunci sama dengan soal_putuskan() di patch 195.
export const CEK_SOAL = [
  ['cpmk', 'Soal mengukur Sub-CPMK yang dijadwalkan untuk asesmen ini (RPS)'],
  ['bloom', 'Tingkat kognitif (Bloom) soal sesuai rumusan Sub-CPMK'],
  ['bobot', 'Skor/bobot tiap soal sesuai rencana asesmen RPS'],
  ['jelas', 'Bahasa jelas dan tidak ambigu; gambar, tabel, dan data terbaca'],
  ['waktu', 'Waktu pengerjaan memadai untuk jumlah dan tingkat soal'],
  ['kunci', 'Kunci jawaban atau rubrik penilaian tersedia'],
];
export const STATUS_SOAL = { belum: 'Belum diajukan', diajukan: 'Menunggu validasi', revisi: 'Perlu revisi', layak: 'Layak' };
export const HARI_AWAS = 14;   // tugas mengawas tampil 14 hari sebelumnya
export const HARI_SOAL = 21;   // soal yang belum layak diingatkan 21 hari sebelum ujian

const menit = t => { const [h, m] = String(t || '').split(':').map(Number); return h * 60 + (m || 0); };
export const jam = t => String(t || '').slice(0, 5);
/** Dua ujian bertumpang jam pada tanggal yang sama. */
export const tumpang = (a, b) => a.tanggal === b.tanggal && menit(a.mulai) < menit(b.selesai) && menit(b.mulai) < menit(a.selesai);
/** Hari ISO 1 = Senin ... 7 = Minggu (sama dengan jadwal berhalangan). */
export const hariIso = tgl => { const d = new Date(String(tgl).slice(0, 10) + 'T00:00:00Z').getUTCDay(); return d === 0 ? 7 : d; };
const ruangSama = (a, b) => a.ruang && b.ruang && String(a.ruang).trim().toLowerCase() === String(b.ruang).trim().toLowerCase();

/** Bentrok antarujian: [{jenis: 'ruang' | 'pengawas', a, b, dosen_id?}]. xs: [{id, tanggal, mulai, selesai, ruang, pengawas: [id]}] */
export function bentrok(xs = []){
  const out = [];
  for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) {
    const a = xs[i], b = xs[j];
    if (!a.tanggal || !b.tanggal || !tumpang(a, b)) continue;
    if (ruangSama(a, b)) out.push({ jenis: 'ruang', a, b });
    for (const d of (a.pengawas || [])) if ((b.pengawas || []).includes(d)) out.push({ jenis: 'pengawas', a, b, dosen_id: d });
  }
  return out;
}

/** Alasan dosen berhalangan pada jam ujian u, atau ''. B = {mingguan, tanggalan, rentang, slot: Map id -> {mulai, selesai}}.
 *  mingguan sudah disaring ke semester ujian. */
export function berhalangan(dosenId, u, B = {}){
  const { mingguan = [], tanggalan = [], rentang = [], slot = new Map() } = B;
  const kena = id => { const s = slot.get(id); return !!s && menit(s.mulai) < menit(u.selesai) && menit(u.mulai) < menit(s.selesai); };
  const h = hariIso(u.tanggal);
  if (mingguan.some(x => x.dosen_id === dosenId && x.hari === h && kena(x.slot_id))) return 'berhalangan mingguan';
  if (tanggalan.some(x => x.dosen_id === dosenId && x.tanggal === u.tanggal && (x.slot_id == null || kena(x.slot_id)))) return 'berhalangan pada tanggal itu';
  if (rentang.some(x => x.dosen_id === dosenId && x.mulai <= u.tanggal && u.tanggal <= x.selesai
      && (!x.hari || x.hari.includes(h)) && (!x.slot_ids || x.slot_ids.some(kena)))) return 'berhalangan (rentang tanggal)';
  return '';
}

/** Calon pengawas untuk ujian u: yang tersedia dulu, lalu pengampu kelas itu, lalu beban mengawas paling sedikit.
 *  Hasil [{id, nama, beban, pengampu, alasan}] (alasan berisi = tidak tersedia). */
export function saranPengawas(u, dosen = [], semua = [], B = {}, pengampu = []){
  const beban = new Map();
  for (const x of semua) for (const d of (x.pengawas || [])) beban.set(d, (beban.get(d) || 0) + 1);
  return dosen.map(d => {
    const lain = u.tanggal && semua.some(x => x.id !== u.id && (x.pengawas || []).includes(d.id) && tumpang(x, u));
    const alasan = !u.tanggal ? '' : lain ? 'mengawas ujian lain pada jam itu' : berhalangan(d.id, u, B);
    return { id: d.id, nama: d.nama_gelar || d.nama, beban: beban.get(d.id) || 0, pengampu: pengampu.includes(d.id), alasan };
  }).sort((a, b) => (!!a.alasan - !!b.alasan) || (b.pengampu - a.pengampu) || (a.beban - b.beban) || String(a.nama).localeCompare(String(b.nama), 'id'));
}

/** Berkas soal Portofolio yang cocok dengan jenis ujian: asesmen "UTS"/"Ujian Tengah Semester" untuk uts, "UAS"/"Ujian Akhir..." untuk uas. */
export function cocokAsesmen(asesmen, jenis){
  const a = String(asesmen || '').toLowerCase();
  return jenis === 'uts' ? /\buts\b|tengah semester/.test(a) : jenis === 'uas' ? /\buas\b|akhir semester/.test(a) : false;
}

const hariKe = (tgl, kini) => Math.round((Date.parse(String(tgl).slice(0, 10)) - Date.parse(new Date(kini.getTime() + 7 * 3600e3).toISOString().slice(0, 10))) / 864e5);
const fmt = (tgl, opsi = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  new Date(String(tgl).slice(0, 10) + 'T00:00:00Z').toLocaleDateString('id-ID', { ...opsi, timeZone: 'UTC' });

/** Tugas ujian untuk Tugas saya. ujian: [{id, jenis, tanggal, mulai, selesai, ruang, tahun_akademik, semester, kurikulum, kode_mk,
 *  kelas, nama_mk, pengawas: [id]}]; validasi: baris soal_validasi; mk: ref_mata_kuliah {kurikulum, kode, nama, pengampu};
 *  validator: GKM/Kaprodi/admin. Hasil [{judul, rinci, href, hari}]. */
export function tugasUjian({ saya, ujian = [], validasi = [], mk = [], validator = false } = {}, kini = new Date()){
  if (!saya) return [];
  const out = [];
  // 1. Mengawas dalam HARI_AWAS hari.
  const awas = ujian.filter(u => (u.pengawas || []).includes(saya.id)).map(u => ({ u, h: hariKe(u.tanggal, kini) }))
    .filter(x => x.h >= 0 && x.h <= HARI_AWAS).sort((a, b) => a.h - b.h || menit(a.u.mulai) - menit(b.u.mulai));
  if (awas.length) out.push({ judul: `Mengawas ujian: ${awas.length} jadwal`,
    rinci: awas.map(({ u }) => `${fmt(u.tanggal)} ${jam(u.mulai)}–${jam(u.selesai)}${u.ruang ? ` ${u.ruang}` : ''}: ${JENIS_UJIAN[u.jenis]} ${u.nama_mk || u.kode_mk} (${u.kelas})`).join('; '),
    href: 'ujian.html#saya', hari: awas[0].h });
  // 2. Soal MK saya yang belum layak menjelang ujiannya.
  const nidn = saya.nidn || '';
  const pengampu = (kur, kode) => !!nidn && (mk.find(m => m.kurikulum === kur && m.kode === kode)?.pengampu || []).includes(nidn);
  const kunciV = (u) => validasi.find(v => v.tahun_akademik === u.tahun_akademik && v.semester === u.semester && v.kurikulum === u.kurikulum
    && v.kode_mk === u.kode_mk && cocokAsesmen(v.asesmen, u.jenis));
  const perMK = new Map();
  for (const u of ujian) {
    const h = hariKe(u.tanggal, kini);
    if (h < 0 || h > HARI_SOAL || !pengampu(u.kurikulum, u.kode_mk)) continue;
    const k = `${u.tahun_akademik}|${u.semester}|${u.kurikulum}|${u.kode_mk}|${u.jenis}`;
    if (!perMK.has(k) || h < perMK.get(k).h) perMK.set(k, { u, h });
  }
  for (const { u, h } of perMK.values()) {
    const v = kunciV(u);
    if (v?.status === 'layak') continue;
    const st = v ? v.status : 'belum';
    out.push({ judul: `Soal ${JENIS_UJIAN[u.jenis]} ${u.nama_mk || u.kode_mk}: ${STATUS_SOAL[st].toLowerCase()}`,
      rinci: `Ujian ${fmt(u.tanggal, { day: 'numeric', month: 'short' })}. ` + (st === 'belum'
        ? 'Unggah soal, kunci/rubrik di Portofolio, lalu ajukan validasi.'
        : st === 'revisi' ? `Catatan validator: ${v.catatan || '-'}. Perbaiki soal di Portofolio, lalu ajukan lagi.`
        : 'Menunggu validator (GKM/Kaprodi).'),
      href: 'ujian.html#validasi', hari: h });
  }
  // 3. Antrean validasi untuk validator (bukan MK yang diampunya).
  if (validator) {
    const antre = validasi.filter(v => v.status === 'diajukan' && !pengampu(v.kurikulum, v.kode_mk));
    if (antre.length) {
      const hs = antre.map(v => ujian.filter(u => u.kurikulum === v.kurikulum && u.kode_mk === v.kode_mk && cocokAsesmen(v.asesmen, u.jenis))
        .map(u => hariKe(u.tanggal, kini)).filter(x => x >= 0)).flat();
      out.push({ judul: `Validasi soal menunggu: ${antre.length}`,
        rinci: antre.map(v => `${v.asesmen} ${mk.find(m => m.kurikulum === v.kurikulum && m.kode === v.kode_mk)?.nama || v.kode_mk}`).join('; '),
        href: 'ujian.html#validasi', hari: hs.length ? Math.min(...hs) : null });
    }
  }
  return out;
}

/** CSV jadwal ujian (pemisah titik koma, untuk Excel berbahasa Indonesia). */
export function csvUjian(xs = [], namaDosen = id => id){
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const baris = [['Jenis', 'Tanggal', 'Mulai', 'Selesai', 'Ruang', 'Kode MK', 'Mata kuliah', 'Kelas', 'Pengawas']]
    .concat([...xs].sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)) || menit(a.mulai) - menit(b.mulai))
      .map(u => [JENIS_UJIAN[u.jenis], u.tanggal, jam(u.mulai), jam(u.selesai), u.ruang || '', u.kode_mk, u.nama_mk || '', u.kelas,
        (u.pengawas || []).map(namaDosen).join(', ')]));
  return '﻿' + baris.map(r => r.map(q).join(';')).join('\r\n');
}

/** Ujian untuk Kalender saya: rows = ujian_jadwal + kelas_kuliah + ujian_pengawas (yang saya awasi atau kelas yang saya ajar).
 *  Hasil [{id, tanggal, mulai, selesai, ruang, judul, ket}] urut tanggal dan jam. */
export function ujianSaya(rows = [], sayaId, kelasSaya = [], mk = [], namaDosen = id => id){
  const nm = k => mk.find(m => m.kurikulum === k?.kurikulum && m.kode === k?.kode_mk)?.nama || k?.kode_mk || '';
  const sudah = new Set();
  return rows.filter(u => u && !sudah.has(u.id) && sudah.add(u.id)).map(u => {
    const pengawas = (u.ujian_pengawas || []).map(p => p.dosen_id), awas = pengawas.includes(sayaId);
    const ajar = kelasSaya.includes(u.kelas_id), k = u.kelas_kuliah || {};
    return { id: u.id, tanggal: u.tanggal, mulai: jam(u.mulai), selesai: jam(u.selesai), ruang: u.ruang || '',
      judul: `${awas ? 'Mengawas ' : ''}${JENIS_UJIAN[u.jenis] || u.jenis} ${nm(k)}${k.kelas ? ` (${k.kelas})` : ''}`,
      ket: [awas && ajar ? 'Anda pengawas dan pengampu kelas ini' : awas ? 'Anda pengawas' : 'Kelas yang Anda ajar',
        pengawas.length ? `Pengawas: ${pengawas.map(namaDosen).join(', ')}` : 'Pengawas belum ditetapkan'].join('\n') };
  }).filter(x => x.tanggal && (x.judul)).sort((a, b) => a.tanggal.localeCompare(b.tanggal) || menit(a.mulai) - menit(b.mulai));
}

/** Rekap ujian per semester untuk akreditasi (butir 15–16, 55). kelas: kelas_kuliah; ujian: ujian_jadwal + pengawas: [id];
 *  validasi: soal_validasi (+ riwayat). Hasil [{tahun_akademik, semester, mk, kelas, terjadwal: {uts, uas},
 *  layak: {uts, uas}, menunggu, revisi, pernahRevisi, tugasAwas, pengawas, bebanAwas: Map id -> n}]. */
export function rekapUjian({ kelas = [], ujian = [], validasi = [] } = {}){
  const per = new Map();
  const ambil = (ta, sm) => {
    const k = `${ta}|${sm}`;
    if (!per.has(k)) per.set(k, { tahun_akademik: ta, semester: sm, mkSet: new Set(), kelas: 0, terjadwal: { uts: 0, uas: 0 },
      layak: { uts: 0, uas: 0 }, menunggu: 0, revisi: 0, pernahRevisi: 0, tugasAwas: 0, bebanAwas: new Map() });
    return per.get(k);
  };
  const kelasId = new Map(kelas.map(k => [k.id, k]));
  for (const k of kelas) { const r = ambil(k.tahun_akademik, k.semester); r.kelas++; r.mkSet.add(`${k.kurikulum}|${k.kode_mk}`); }
  for (const u of ujian) {
    const k = kelasId.get(u.kelas_id); if (!k) continue;
    const r = ambil(k.tahun_akademik, k.semester);
    if (u.jenis in r.terjadwal) r.terjadwal[u.jenis]++;
    for (const d of (u.pengawas || [])) { r.tugasAwas++; r.bebanAwas.set(d, (r.bebanAwas.get(d) || 0) + 1); }
  }
  for (const v of validasi) {
    const r = ambil(v.tahun_akademik, v.semester), j = cocokAsesmen(v.asesmen, 'uts') ? 'uts' : cocokAsesmen(v.asesmen, 'uas') ? 'uas' : null;
    if (v.status === 'layak' && j) r.layak[j]++;
    if (v.status === 'diajukan') r.menunggu++;
    if (v.status === 'revisi') r.revisi++;
    if ((v.riwayat || []).some(x => x?.status === 'revisi')) r.pernahRevisi++;
  }
  const urutSm = s => (s === 'Genap' ? 2 : 1);
  return [...per.values()].map(({ mkSet, ...r }) => ({ ...r, mk: mkSet.size, pengawas: r.bebanAwas.size }))
    .sort((a, b) => a.tahun_akademik.localeCompare(b.tahun_akademik) || urutSm(a.semester) - urutSm(b.semester));
}
