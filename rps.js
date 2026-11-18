// RPS K26 (111-patch-rps-k26.sql, pemilik 2026-11-18): logika halaman rps.html dan ekspor Word (rps-docx.js).
// Tanpa impor dan tanpa DOM, supaya bisa dites di Node (tests/js/rps.test.mjs).
//
// Acuan: Formulir RPS K26 (UP-SPMI/FR008/R05) dan Panduan Pengisian RPS (Lampiran III Peraturan Rektor), bagian A-F.
// Bagian B (CPL, CPMK, Sub-CPMK, asesmen, bobot) = mk_struktur.data (102, halaman CPMK), ditambah:
//   sub[].cpl        kode CPL yang didukung Sub-CPMK (1 Sub-CPMK -> 1 CPMK -> 1 CPL)
//   asesmen[].jenis  'kuis' | 'tugas' | 'uts' | 'uas' | 'lainnya' (kolom Rencana Asesmen Sumatif)
// Bagian lain = mk_rps.data (versi '1'):
//   identitas  { jenis_mk, sks: {t, p, pl, s}, semester, tanggal, penyelenggara }
//   pengembang dosen id (Disiapkan oleh Dosen Pengembang RPS)
//   pengampu   teks dosen pengampu (team teaching, kelas paralel, praktisi)
//   tujuan, deskripsi, kriteria          teks (baris baru = poin baru)
//   pustaka    [{ kode, teks }]           kode dipakai di rencana pekanan, mis. [BREW Bab 2]
//   syarat     { prasyarat, bersamaan }
//   scl        { ada, teks }    integrasi { ada, teks }    direktori { status: ada|tidak_langsung|tidak_tersedia, teks }
//   pekan      [{ pekan: '1-2', jenis: 'kuliah'|'uts'|'uas', sub: [kode], asesmen: [nama], materi, pustaka, indikator,
//                 bentuk, luring, daring }]
//   evaluasi   { baru, mk, kode, semester, jumlah, rerata, rekomendasi }

export const VERSI_DATA = '1';   // BUKAN bernama VERSI: stamp_versions.py menimpa konstanta bernama VERSI dengan cap versi situs.

export const JENIS_ASESMEN = [['kuis', 'Kuis'], ['tugas', 'Tugas'], ['uts', 'UTS'], ['uas', 'UAS'], ['lainnya', 'Lainnya']];
export const JENIS_MK = [['MKPT', 'MKPT (wajib nasional)'], ['MKU', 'MKU (wajib universitas)'], ['MKPS', 'MKPS (wajib program studi)'],
                         ['MKP', 'MKP (pilihan)']];
export const DIREKTORI = [['ada', 'Ada'], ['tidak_langsung', 'Pendukung tidak langsung'], ['tidak_tersedia', 'Tidak tersedia']];
// Target HOTS (C4-C6) yang disarankan per tahun MK dalam kurikulum (Panduan 4.4); saran, bukan syarat.
export const TARGET_HOTS = { 1: 0, 2: 10, 3: 30, 4: 50 };
// Metode SCL (Panduan 5.2), untuk mengenali metode SCL di kolom Luring/Daring.
export const METODE_SCL = ['Small Group Discussion', 'Role-Play', 'Simulation', 'Discovery Learning', 'Self-Directed Learning',
  'Cooperative Learning', 'Collaborative Learning', 'Contextual Learning', 'Project Based Learning', 'Problem Based Learning',
  'Case Method', 'Case-Based', 'Flipped'];

const teks = v => String(v ?? '').trim();
const angka = v => { const x = +String(v ?? '').replace(',', '.'); return Number.isFinite(x) ? x : 0; };
const bulat = v => Math.round(v * 100) / 100;

/** Jenis asesmen dari nama butir: "Kuis 1" -> kuis, "UTS" -> uts, "Tugas 2"/"Laporan" -> tugas; lainnya. */
export function tebakJenis(nama){
  const s = teks(nama).toLowerCase();
  if (/\b(uts|ujian tengah|mid)/.test(s)) return 'uts';
  if (/\b(uas|ujian akhir|final)/.test(s)) return 'uas';
  if (/\b(kuis|quiz)/.test(s)) return 'kuis';
  if (/\b(tugas|pr|laporan|proyek|project|makalah|presentasi|praktikum|responsi)/.test(s)) return 'tugas';
  return 'lainnya';
}
export const jenisAsesmen = a => (JENIS_ASESMEN.some(j => j[0] === a?.jenis) ? a.jenis : tebakJenis(a?.nama));

/** Jenis MK dari digit ke-3 kode 5 digit K26 (Panduan 3.1): 1 MKPT, 2 MKU, 3 MKPS, 4 MKP; '' bila tidak dikenali. */
export const jenisDariKode = kode => ({ 1: 'MKPT', 2: 'MKU', 3: 'MKPS', 4: 'MKP' }[(String(kode || '').match(/^\d{2}(\d)\d{2}$/) || [])[1]] || '');

/** Kode Bloom di akhir rumusan, mis. "(C4, HOTS)" atau "(C3, A2)": { kode: ['C4'], c: 4 } (c = level kognitif tertinggi). */
export function bloom(rumusan){
  const kode = [...new Set([...teks(rumusan).matchAll(/\b([CAP])([1-6])\b/g)].map(m => m[1] + m[2]))]
    .filter(k => k[0] === 'C' || +k[1] <= 5);
  const c = Math.max(0, ...kode.filter(k => k[0] === 'C').map(k => +k[1]));
  return { kode, c };
}

/** Tahun MK dalam kurikulum dari semester 1-8 (Ganjil/Genap atau kosong: null). */
export const tahunMK = semester => (/^[1-8]$/.test(teks(semester)) ? Math.ceil(+semester / 2) : null);

/** Bobot penilaian per Sub-CPMK = jumlah bobot butir asesmennya (mk_struktur.bobot). */
export const bobotSub = (struktur, kode) => bulat(Object.values(struktur?.bobot?.[kode] || {}).reduce((a, v) => a + angka(v), 0));

/** HOTS = bobot Sub-CPMK berkode C4-C6 / total bobot (Panduan 4.4). */
export function hots(struktur, semester){
  const sub = struktur?.sub || [];
  const total = sub.reduce((a, s) => a + bobotSub(struktur, s.kode), 0);
  const hotsSub = sub.filter(s => bloom(s.rumusan).c >= 4);
  const nilai = hotsSub.reduce((a, s) => a + bobotSub(struktur, s.kode), 0);
  const tahun = tahunMK(semester);
  return { persen: total ? bulat(100 * nilai / total) : 0, sub: hotsSub.map(s => s.kode), tahun,
           target: tahun ? TARGET_HOTS[tahun] : null };
}

/** "1-2" -> [1, 2]; "11 - 13" -> [11, 12, 13]; "8" -> [8]; tidak sah -> []. */
export function rentangPekan(s){
  const m = teks(s).match(/^(\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?$/);
  if (!m) return [];
  const a = +m[1], b = m[2] ? +m[2] : a;
  return a >= 1 && b >= a && b <= 20 ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : [];
}

const barisPekan = (pekan, jenis = 'kuliah') => ({ pekan: String(pekan), jenis, sub: [], asesmen: [], materi: '', pustaka: '', indikator: '',
  bentuk: '', luring: '', daring: '' });
/** Kerangka 16 pekan: 1-7 kuliah, 8 UTS, 9-15 kuliah, 16 UAS (Panduan 3.4). Pekan bisa digabung kemudian. */
export const kerangkaPekan = () => [...[1, 2, 3, 4, 5, 6, 7].map(p => barisPekan(p)), barisPekan(8, 'uts'),
  ...[9, 10, 11, 12, 13, 14, 15].map(p => barisPekan(p)), barisPekan(16, 'uas')];
export { barisPekan };

/**
 * Isian awal RPS dari data MK (ref_mata_kuliah) dan situs. mk: {kode, nama, sks, sks_kuliah, sks_praktikum, semester, sifat},
 * situs: {prodi}. Pengampu dan pengembang diisi halaman (nama dosen).
 */
export function rpsKosong(mk = {}, situs = {}, kini = new Date()){
  const jenis = jenisDariKode(mk.kode) || (mk.sifat === 'pilihan' ? 'MKP' : '');
  const t = mk.sks_kuliah ?? (mk.sks_praktikum ? null : mk.sks);
  return {
    versi: VERSI_DATA,
    identitas: { jenis_mk: jenis, sks: { t: t ?? '', p: mk.sks_praktikum ?? 0, pl: 0, s: 0 },
                 semester: jenis === 'MKP' ? '' : teks(mk.semester), tanggal: kini.toISOString().slice(0, 10),
                 penyelenggara: ['MKPT', 'MKU'].includes(jenis) ? 'Universitas Pertamina' : (situs.prodi ? `Program Studi ${situs.prodi}` : '') },
    pengembang: '', pengampu: '', tujuan: '', deskripsi: '',
    kriteria: 'CPMK dinyatakan tercapai bila mahasiswa memperoleh capaian minimal 45% pada CPMK terkait; target kinerja: minimal 60% '
      + 'peserta mata kuliah mencapai ketercapaian tersebut. Sistem penilaian (konversi nilai angka ke nilai huruf dan ketentuan kelulusan) '
      + 'mengacu pada Peraturan Akademik Universitas Pertamina yang berlaku.',
    pustaka: [], syarat: { prasyarat: '', bersamaan: '' },
    scl: { ada: null, teks: '' }, integrasi: { ada: null, teks: '' }, direktori: { status: '', teks: '' },
    pekan: kerangkaPekan(),
    evaluasi: { baru: false, mk: '', kode: '', semester: '', jumlah: '', rerata: '', rekomendasi: '' },
  };
}

/**
 * Penyusun RPS (112, pemilik 2026-11-18): koordinator MK (ref_mata_kuliah.pengampu, NIDN) dan pengampu kelas MK itu pada
 * semester terakhir di cpl_kelas (email). Sama dengan public.boleh_rps; GKM dan admin hanya melihat. Hasil: dosen [{id, nama, ...}].
 */
export function penyusunMK(mk = {}, dosen = [], kelas = []){
  const urut = k => `${k.tahun_akademik}|${k.semester === 'Genap' ? 2 : 1}`;
  const akhir = kelas.reduce((a, k) => (urut(k) > a ? urut(k) : a), '');
  const email = new Set(kelas.filter(k => urut(k) === akhir && String(k.kode_mk).toUpperCase() === String(mk.kode).toUpperCase())
    .map(k => String(k.dosen_email || '').toLowerCase()));
  return dosen.filter(d => (mk.pengampu || []).includes(d.nidn) || email.has(String(d.email || '').toLowerCase()));
}

/**
 * Daftar revisi (bagian F) dari mk_rps_pengesahan [{aksi, oleh_nama, catatan, waktu}] urut waktu: pengesahan pertama =
 * "Belum ada revisi" (Panduan 3.6); tiap pengesahan berikutnya satu baris: tanggal dan pengusul dari pengajuan sebelumnya,
 * deskripsi = ringkasan perubahan, validasi = tanggal pengesahan dan catatan Kaprodi.
 */
export function revisiDariLog(log = []){
  const out = [];
  let aju = null, sah = 0;
  for (const r of [...log].sort((a, b) => String(a.waktu).localeCompare(String(b.waktu)))) {
    if (r.aksi === 'ajukan') aju = r;
    else if (r.aksi === 'sahkan') {
      sah++;
      if (sah > 1) out.push({ tanggal: String(aju?.waktu || '').slice(0, 10), pengusul: aju?.oleh_nama || '', deskripsi: aju?.catatan || '',
                              validasi: String(r.waktu).slice(0, 10), catatan: [r.oleh_nama, r.catatan].filter(Boolean).join(': ') });
      aju = null;
    }
  }
  return out;
}

/** Lengkapi RPS tersimpan dengan kunci yang belum ada (data lama tetap). */
export function rapikanRps(d, mk, situs){
  const k = rpsKosong(mk, situs);
  if (!d || typeof d !== 'object') return k;
  return { ...k, ...d, versi: VERSI_DATA, identitas: { ...k.identitas, ...(d.identitas || {}), sks: { ...k.identitas.sks, ...(d.identitas?.sks || {}) } },
           syarat: { ...k.syarat, ...(d.syarat || {}) }, scl: { ...k.scl, ...(d.scl || {}) }, integrasi: { ...k.integrasi, ...(d.integrasi || {}) },
           direktori: { ...k.direktori, ...(d.direktori || {}) }, evaluasi: { ...k.evaluasi, ...(d.evaluasi || {}) },
           pustaka: Array.isArray(d.pustaka) ? d.pustaka : [], pekan: Array.isArray(d.pekan) && d.pekan.length ? d.pekan.map(p => ({ ...barisPekan(p.pekan, p.jenis), ...p })) : k.pekan };
}

/**
 * Pemeriksaan otomatis (Panduan bagian 6). ctx: { mk, struktur, rps, cpl: [{kode, rumusan}], pengembang: {nama, nama_gelar, nip},
 * kaprodi: {...}|null }. Hasil [{ bagian, tingkat: 'galat'|'saran', pesan }]; kosong = lengkap.
 */
export function periksaRps({ mk = {}, struktur, rps, cpl = [], pengembang = null, kaprodi = null, penyusun = null } = {}){
  const out = [], g = (bagian, pesan) => out.push({ bagian, tingkat: 'galat', pesan }), s = (bagian, pesan) => out.push({ bagian, tingkat: 'saran', pesan });
  const S = struktur || { cpmk: [], sub: [], asesmen: [], bobot: {} }, R = rps || rpsKosong(mk);
  const I = R.identitas || {};
  // A
  if (!I.jenis_mk) g('A', 'Pilih jenis MK (MKPT/MKU/MKPS/MKP).');
  const sks = ['t', 'p', 'pl', 's'].reduce((a, k) => a + angka(I.sks?.[k]), 0);
  if (mk.sks != null && sks !== angka(mk.sks)) g('A', `Jumlah bobot T+P+PL+S (${sks}) tidak sama dengan sks MK (${mk.sks}).`);
  if (!teks(I.semester)) g('A', 'Isi semester (angka 1-8, atau Ganjil/Genap untuk MKP).');
  if (!teks(I.penyelenggara)) g('A', 'Isi penyelenggara.');
  if (!R.pengembang) g('A', 'Pilih dosen pengembang RPS.');
  else if (penyusun && !penyusun.some(d => d.id === R.pengembang)) g('A', 'Dosen pengembang harus koordinator MK atau dosen pengampu MK ini.');
  else if (pengembang && (!teks(pengembang.nama_gelar) || !teks(pengembang.nip))) s('A', 'Nama dengan gelar atau NIP dosen pengembang belum diisi (Profil / Kelola dosen).');
  if (!kaprodi) s('A', 'Kaprodi belum ditetapkan di Penugasan koordinator; kolom pemeriksa di Word dibiarkan kosong.');
  // B
  if (!cpl.length) g('B', 'MK ini belum dipetakan ke CPL (Data prodi › Kurikulum & CPL).');
  if (!S.cpmk.length) g('B', 'Belum ada CPMK (halaman CPMK).');
  if (S.cpmk.length > 2 && !mk.capstone) s('B', `CPMK ${S.cpmk.length}; disarankan paling banyak 2 kecuali MK kulminasi.`);
  for (const c of S.cpmk) {
    if (!teks(c.rumusan)) g('B', `${c.kode}: rumusan kosong.`);
    else if (!bloom(c.rumusan).kode.length) g('B', `${c.kode}: akhiri rumusan dengan kode Bloom, mis. (C4) atau (C3, A2).`);
  }
  if (S.cpmk.length && !S.sub.length) g('B', 'Belum ada Sub-CPMK.');
  const kodeCpl = new Set(cpl.map(c => c.kode));
  for (const x of S.sub) {
    if (!teks(x.rumusan)) g('B', `${x.kode}: rumusan kosong.`);
    else if (!bloom(x.rumusan).kode.length) g('B', `${x.kode}: akhiri rumusan dengan kode Bloom, mis. (C2).`);
    if (!x.cpl) g('B', `${x.kode}: pilih CPL yang didukung (1 Sub-CPMK, 1 CPMK, 1 CPL).`);
    else if (!kodeCpl.has(x.cpl)) g('B', `${x.kode}: CPL ${x.cpl} tidak dibebankan pada MK ini.`);
    if (!bobotSub(S, x.kode)) g('B', `${x.kode}: belum ada bobot penilaian.`);
  }
  const total = S.sub.reduce((a, x) => a + bobotSub(S, x.kode), 0);
  if (S.sub.length && bulat(total) !== 100) g('B', `Total bobot penilaian ${bulat(total)}%, harus 100%.`);
  const H = hots(S, I.semester || mk.semester);
  if (H.target != null && S.sub.length && H.persen < H.target) s('B', `HOTS ${H.persen}%; disarankan ≥ ${H.target}% untuk MK tahun ke-${H.tahun}.`);
  // C
  if (!teks(R.tujuan)) g('C', 'Isi tujuan MK (3-5 poin, sesuai silabus K26).');
  if (!teks(R.deskripsi)) g('C', 'Isi deskripsi dan bahan kajian.');
  if (!teks(R.pengampu)) g('C', 'Isi dosen pengampu.');
  if (!(R.pustaka || []).some(p => teks(p.teks))) g('C', 'Isi minimal satu pustaka.');
  if (!teks(R.kriteria)) g('C', 'Isi kriteria ketercapaian CPMK.');
  if (R.scl?.ada == null) g('C', 'Nyatakan ada/tidak metode SCL.');
  if (R.integrasi?.ada == null) g('C', 'Nyatakan ada/tidak integrasi penelitian/PkM.');
  if (!R.direktori?.status) g('C', 'Isi Direktori Kompetensi Teknis Pertamina (ada, pendukung tidak langsung, atau tidak tersedia).');
  // D
  const P = R.pekan || [], dipakai = new Map();
  for (const p of P) {
    const r = rentangPekan(p.pekan);
    if (!r.length) { g('D', `Pekan "${teks(p.pekan) || '?'}" tidak sah (tulis 3 atau 5-7).`); continue; }
    for (const n of r) dipakai.set(n, (dipakai.get(n) || 0) + 1);
    if (p.jenis === 'uts' && !r.includes(8)) s('D', 'UTS lazimnya pekan ke-8.');
    if (p.jenis === 'uas' && !r.includes(16)) s('D', 'UAS lazimnya pekan ke-16.');
    if (p.jenis !== 'kuliah') continue;
    const lbl = `Pekan ${teks(p.pekan)}`;
    if (!(p.sub || []).length) g('D', `${lbl}: pilih Sub-CPMK.`);
    if (!teks(p.materi)) g('D', `${lbl}: isi materi pembelajaran.`);
    if (!teks(p.indikator)) g('D', `${lbl}: isi indikator.`);
    else if (!/\d/.test(p.indikator)) s('D', `${lbl}: indikator sebaiknya memuat ambang terukur (skor/persen minimal).`);
    if (!teks(p.luring) && !teks(p.daring)) g('D', `${lbl}: isi bentuk/modalitas pembelajaran (luring atau daring).`);
    for (const a of p.asesmen || []) if (!(p.sub || []).some(k => angka(S.bobot?.[k]?.[a]))) s('D', `${lbl}: ${a} tidak berbobot pada Sub-CPMK pekan ini (bagian B).`);
  }
  const kurang = Array.from({ length: 16 }, (_, i) => i + 1).filter(n => !dipakai.has(n));
  if (kurang.length) g('D', `Pekan belum terisi: ${kurang.join(', ')}.`);
  const ganda = [...dipakai].filter(([, n]) => n > 1).map(([k]) => k);
  if (ganda.length) g('D', `Pekan tercantum lebih dari sekali: ${ganda.join(', ')}.`);
  if (!P.some(p => p.jenis === 'uts')) g('D', 'Tambahkan baris UTS.');
  if (!P.some(p => p.jenis === 'uas')) g('D', 'Tambahkan baris UAS.');
  const sumatif = S.asesmen.filter(a => !['uts', 'uas'].includes(jenisAsesmen(a))).map(a => a.nama);
  const diD = new Set(P.flatMap(p => p.asesmen || []));
  for (const a of sumatif) if (!diD.has(a)) s('D', `${a} (bagian B) belum dijadwalkan di rencana pekanan.`);
  const adaScl = P.some(p => METODE_SCL.some(m => `${p.luring} ${p.daring}`.toLowerCase().includes(m.toLowerCase())));
  if (!adaScl && R.scl?.ada !== true) g('D', 'Gunakan minimal satu metode SCL (mis. Case Method, Project Based Learning) di kolom Luring/Daring.');
  for (const x of S.sub) if (!P.some(p => (p.sub || []).includes(x.kode))) s('D', `${x.kode} belum muncul di rencana pekanan.`);
  // E
  const E = R.evaluasi || {};
  if (!E.baru && !(teks(E.semester) && teks(E.jumlah) && teks(E.rekomendasi))) g('E', 'Isi evaluasi penyelenggaraan sebelumnya, atau centang "belum pernah diselenggarakan".');
  return out;
}

/**
 * Model siap cetak untuk rps-docx.js. ctx seperti periksaRps + situs {prodi}. Kolom asesmen = jenis yang dipakai
 * (urutan Kuis, Tugas, UTS, UAS, Lainnya); sel = nama butir yang berbobot pada Sub-CPMK itu.
 */
export function modelRps({ mk = {}, struktur, rps, cpl = [], pengembang = null, kaprodi = null, revisi = [] } = {}){
  const S = struktur || { cpmk: [], sub: [], asesmen: [], bobot: {} }, R = rps || rpsKosong(mk);
  const kolom = JENIS_ASESMEN.filter(([j]) => S.asesmen.some(a => jenisAsesmen(a) === j));
  const isi = x => Object.fromEntries(kolom.map(([j]) => [j, S.asesmen.filter(a => jenisAsesmen(a) === j && angka(S.bobot?.[x.kode]?.[a.nama])).map(a => a.nama)]));
  const totalJenis = Object.fromEntries(kolom.map(([j]) => [j, bulat(S.sub.reduce((t, x) => t + S.asesmen
    .filter(a => jenisAsesmen(a) === j).reduce((u, a) => u + angka(S.bobot?.[x.kode]?.[a.nama]), 0), 0))]));
  const H = hots(S, R.identitas?.semester || mk.semester);
  const orang = o => (o ? { nama: teks(o.nama_gelar) || teks(o.nama), nip: teks(o.nip) } : { nama: '', nip: '' });
  return {
    mk: { kode: teks(mk.kode), nama: teks(mk.nama), kurikulum: teks(mk.kurikulum) },
    identitas: R.identitas, pengembang: orang(pengembang), kaprodi: orang(kaprodi),
    cpl: cpl.filter(c => S.sub.some(x => x.cpl === c.kode) || !S.sub.some(x => x.cpl)),
    cpmk: S.cpmk.map(c => ({ kode: c.kode, rumusan: teks(c.rumusan) })),
    kolom: kolom.map(([j, l]) => ({ jenis: j, label: l, total: totalJenis[j] })),
    sub: S.sub.map(x => ({ kode: x.kode, cpmk: x.cpmk, cpl: x.cpl || '', rumusan: teks(x.rumusan), asesmen: isi(x), bobot: bobotSub(S, x.kode) })),
    total: bulat(S.sub.reduce((a, x) => a + bobotSub(S, x.kode), 0)), hots: H,
    tujuan: teks(R.tujuan), deskripsi: teks(R.deskripsi), pengampu: teks(R.pengampu), kriteria: teks(R.kriteria),
    pustaka: (R.pustaka || []).filter(p => teks(p.teks)), syarat: R.syarat || {}, scl: R.scl || {}, integrasi: R.integrasi || {},
    direktori: R.direktori || {}, pekan: R.pekan || [], evaluasi: R.evaluasi || {}, revisi,
  };
}

/** Nama berkas Word, mis. "RPS_K26_13301_Mekanika_Teknik.docx". */
export const namaBerkasRps = mk => `RPS_${teks(mk.kurikulum)}_${teks(mk.kode)}_${teks(mk.nama).replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_|_$/g, '')}.docx`;
