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
//   scl        { ada, teks }    direktori { status: ada|tidak_langsung|tidak_tersedia, teks }
//   integrasi  { ada, teks, karya: [{ id, kategori, judul, tahun, pelaksana, bentuk, ket }] }   karya = penelitian/PkM tersimpan
//              (tabel karya), judul/tahun/pelaksana disalin saat dipilih supaya Word tidak salah judul (pemilik 2026-11-19)
//   pekan      [{ pekan: '1-2', jenis: 'kuliah'|'uts'|'uas', sub: [kode], asesmen: [nama], materi, pustaka, indikator,
//                 bentuk, luring, daring, bentuk_pb: [BENTUK], scl: [SCL], penugasan }]
//              bentuk = teks "Bentuk & Kriteria" asesmen; bentuk_pb dan scl = centang untuk lampiran rekap (pemilik 2026-11-19)
//   evaluasi   { baru, mk, kode, semester, jumlah, rerata, rekomendasi }
//   peta       { sub: { <kode Sub-CPMK>: { ke, jenis } }, entry }   Peta Analisis (rps-peta.js, tahap 3)

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

// Lampiran rekap untuk akreditasi (pemilik 2026-11-19): bentuk pembelajaran (Panduan 2: metode pembelajaran) dan metode SCL
// (Panduan 5.2) dicentang per pekan.
export const BENTUK = [['kuliah', 'Kuliah'], ['responsi', 'Responsi'], ['tutorial', 'Tutorial'], ['seminar', 'Seminar'], ['praktikum', 'Praktikum'],
  ['praktik_lapangan', 'Praktik lapangan'], ['studio', 'Praktik studio/bengkel'], ['simulasi', 'Simulasi'],
  ['penugasan', 'Penugasan (tugas besar/proyek)']];   // pemilik 2026-11-19; terhitung butir 18 hanya bila ber-sks P/PL/S
export const SCL = [['sgd', 'Small Group Discussion'], ['roleplay', 'Role-Play & Simulation'], ['discovery', 'Discovery Learning'],
  ['sdl', 'Self-Directed Learning'], ['cooperative', 'Cooperative Learning'], ['collaborative', 'Collaborative Learning'],
  ['contextual', 'Contextual Learning'], ['pjbl', 'Project Based Learning'], ['pbl', 'Problem Based Learning'], ['case', 'Case Method']];

// Bentuk integrasi penelitian/PkM ke pembelajaran = pilihan karya "Integrasi ke pembelajaran" (form-karya.js, LKPS 3.a.3).
export const BENTUK_INTEGRASI = [['bahan_kajian', 'bahan kajian'], ['studi_kasus', 'studi kasus'], ['bab_buku_ajar', 'bab buku ajar'],
  ['modul_praktikum', 'modul praktikum'], ['tugas_proyek', 'tugas/proyek mahasiswa'], ['lainnya', 'lainnya']];

const teks = v => String(v ?? '').trim();
// Tanggal/waktu menurut zona waktu peramban (WIB), bukan potongan teks UTC dari basis data (pemilik 2026-11-19).
const dua = n => String(n).padStart(2, '0');
export const tanggalLokal = v => { const d = new Date(v); return v && !isNaN(d) ? `${d.getFullYear()}-${dua(d.getMonth() + 1)}-${dua(d.getDate())}` : ''; };
export const waktuLokal = v => { const d = new Date(v); return v && !isNaN(d) ? `${tanggalLokal(v)} ${dua(d.getHours())}:${dua(d.getMinutes())}` : ''; };
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

// Komposisi asesmen (pemilik 2026-11-19; Simulator Pemetaan Sub-CPMK UP, Pedoman Perencanaan Pembelajaran Lampiran I dan III).
export const KELOMPOK_ASESMEN = [['ujian', 'Ujian/kuis'], ['penugasan', 'Penugasan']];
/** Kelompok butir: isian a.kelompok; bawaan tugas/lainnya = penugasan, kuis/UTS/UAS = ujian. */
export const kelompokAsesmen = a => (['ujian', 'penugasan'].includes(a?.kelompok) ? a.kelompok
  : ['tugas', 'lainnya'].includes(jenisAsesmen(a)) ? 'penugasan' : 'ujian');
export const JENIS_KULIAH = [['reguler', 'Reguler sarjana'], ['praktikum', 'Praktikum'], ['kulminasi', 'Kulminasi (KP, TA, capstone)']];
/** Jenis perkuliahan dari data MK: kulminasi = capstone; praktikum = seluruh sks praktikum; selain itu reguler sarjana. */
export function jenisKuliah(mk = {}){
  if (mk.capstone === true || mk.capstone === 'true') return 'kulminasi';
  const p = angka(mk.sks_praktikum), t = mk.sks_kuliah != null && mk.sks_kuliah !== '' ? angka(mk.sks_kuliah) : angka(mk.sks) - p;
  return p > 0 && t <= 0 ? 'praktikum' : 'reguler';
}
/**
 * Aturan komposisi (galat): reguler sarjana memuat UTS dan UAS berbobot dan kelompok Penugasan paling rendah 20%;
 * praktikum memuat Laporan Akhir berbobot; kulminasi dinilai tersendiri. Hasil [{bagian:'B', tingkat:'galat', pesan}].
 */
export function periksaKomposisi({ struktur, mk = {} } = {}){
  const S = struktur || {}, out = [], g = pesan => out.push({ bagian: 'B', tingkat: 'galat', pesan });
  if (!S.sub?.length || !S.asesmen?.length) return out;
  const kol = a => S.sub.reduce((t, x) => t + angka(S.bobot?.[x.kode]?.[a.nama]), 0);
  const per = j => S.asesmen.filter(a => jenisAsesmen(a) === j).reduce((t, a) => t + kol(a), 0);
  const jk = jenisKuliah(mk);
  if (jk === 'reguler') {
    if (!(per('uts') > 0 && per('uas') > 0)) g(`Perkuliahan reguler sarjana wajib memuat UTS dan UAS dengan bobot (Pedoman, Lampiran I dan III); sekarang UTS ${bulat(per('uts'))}%, UAS ${bulat(per('uas'))}%.`);
    const pen = S.asesmen.filter(a => kelompokAsesmen(a) === 'penugasan').reduce((t, a) => t + kol(a), 0);
    if (pen < 20 - 1e-9) g(`Bobot kelompok Penugasan ${bulat(pen)}%; perkuliahan reguler mensyaratkan paling rendah 20% (Pedoman, Lampiran I dan III).`);
  } else if (jk === 'praktikum') {
    if (!S.asesmen.some(a => /laporan\s+akhir/i.test(a.nama) && kol(a) > 0)) g('Praktikum wajib memuat butir "Laporan Akhir" dengan bobot (Pedoman, Lampiran I dan III).');
  }
  return out;
}

/** Jenis MK dari digit ke-3 kode 5 digit K26 (Panduan 3.1): 1 MKPT, 2 MKU, 3 MKPS, 4 MKP; '' bila tidak dikenali. */
export const jenisDariKode = kode => ({ 1: 'MKPT', 2: 'MKU', 3: 'MKPS', 4: 'MKP' }[(String(kode || '').match(/^\d{2}(\d)\d{2}$/) || [])[1]] || '');
/** Jenis MK untuk daftar: dari kode; MK pilihan tanpa pola kode = MKP; selain itu '' (tidak ditebak). */
export const jenisMK = m => jenisDariKode(m.kode) || (m.sifat === 'pilihan' ? 'MKP' : '');
export const paritas = s => (/^[1-8]$/.test(teks(s)) ? (+s % 2 ? 'Ganjil' : 'Genap') : /^(Ganjil|Genap)$/i.test(teks(s)) ? teks(s)[0].toUpperCase() + teks(s).slice(1).toLowerCase() : '');

/**
 * Ringkasan jumlah MK dan sks per semester (pemilik 2026-11-19). Hasil { kolom: [{ label, mk, sks, sksP }], ganjil, genap, total }:
 * kolom = Smt 1..8 (yang ada), lalu "Pilihan" (MK pilihan tanpa semester) dan "Tanpa smt" (bukan pilihan); ganjil/genap/total
 * = { mk, sks } (pilihan masuk total saja). sksP = sks praktikum.
 */
export function ringkasSemester(mk = []){
  const isi = xs => ({ mk: xs.length, sks: +xs.reduce((a, m) => a + angka(m.sks), 0).toFixed(2), sksP: +xs.reduce((a, m) => a + angka(m.sks_praktikum), 0).toFixed(2) });
  const smt = m => (/^[1-8]$/.test(String(m.semester ?? '')) ? +m.semester : 0);
  const kolom = [];
  for (let s = 1; s <= 8; s++) { const xs = mk.filter(m => smt(m) === s); if (xs.length) kolom.push({ label: `Smt ${s}`, semester: s, ...isi(xs) }); }
  const pil = mk.filter(m => !smt(m) && m.sifat === 'pilihan'), lain = mk.filter(m => !smt(m) && m.sifat !== 'pilihan');
  if (pil.length) kolom.push({ label: 'Pilihan', semester: null, ...isi(pil) });
  if (lain.length) kolom.push({ label: 'Tanpa smt', semester: null, ...isi(lain) });
  const ambil = f => { const xs = mk.filter(f); const r = isi(xs); return { mk: r.mk, sks: r.sks }; };
  return { kolom, ganjil: ambil(m => smt(m) % 2 === 1), genap: ambil(m => smt(m) && smt(m) % 2 === 0), total: ambil(() => true) };
}
/** Tabel ringkas (HTML) dari ringkasSemester; label dan angka dibuat sendiri, jadi tanpa teks pengguna. */
export function htmlRingkasSemester(r){
  if (!r.kolom.length) return '';
  const k = v => String(v).replace('.', ',');
  return `<div class="gulir"><table class="ds ringkas-smt"><thead><tr><th></th>${r.kolom.map(c => `<th>${c.label}</th>`).join('')}<th>Total</th></tr></thead><tbody>
    <tr><th>MK</th>${r.kolom.map(c => `<td>${c.mk}</td>`).join('')}<td><b>${r.total.mk}</b></td></tr>
    <tr><th>sks</th>${r.kolom.map(c => `<td>${k(c.sks)}${c.sksP ? `<div class="ket">P ${k(c.sksP)}</div>` : ''}</td>`).join('')}<td><b>${k(r.total.sks)}</b></td></tr>
    </tbody></table></div>`;
}

/** Kelompok susunanMK dibagi dua kolom (pemilik 2026-11-19): kiri Ganjil (1, 3, 5, 7, MK pilihan Ganjil), kanan Genap;
 *  lain = MK pilihan yang semesternya belum ditetapkan di RPS dan MK tanpa semester (selebar halaman). */
export const bagiParitas = grup => ({ ganjil: grup.filter(g => g.paritas === 'Ganjil'), genap: grup.filter(g => g.paritas === 'Genap'),
                                      lain: grup.filter(g => !g.paritas) });
/** Saringan daftar MK: cari (kode/nama/teks tambahan), jenis, sifat, status; fungsi jenis/status/teks dari halaman. */
export const saringMK = (xs, f = {}, { status = () => '', jenis = jenisMK, teksCari = () => '' } = {}) => {
  const q = teks(f.cari).toLowerCase();
  return xs.filter(m => (!q || `${m.kode} ${m.nama} ${teksCari(m)}`.toLowerCase().includes(q)) && (!f.jenis || jenis(m) === f.jenis)
    && (!f.sifat || m.sifat === f.sifat) && (!f.status || status(m) === f.status));
};

/**
 * Susunan daftar MK satu kurikulum (pemilik 2026-11-19): per semester 1-8 (Ganjil/Genap), lalu MK pilihan dikelompokkan
 * Ganjil / Genap / belum ditetapkan menurut semester di RPS-nya (semPilihan: kode -> 'Ganjil'|'Genap'|'').
 * Hasil [{ judul, semester, paritas, pilihan, xs, sks }]; xs urut kode. MK tanpa semester yang bukan pilihan masuk "Tanpa semester".
 */
export function susunanMK(mk = [], semPilihan = {}){
  const sks = xs => xs.reduce((a, m) => a + angka(m.sks), 0), urut = xs => [...xs].sort((a, b) => String(a.kode).localeCompare(String(b.kode)));
  const out = [];
  for (let s = 1; s <= 8; s++) {
    const xs = mk.filter(m => String(m.semester ?? '') === String(s));
    if (xs.length) out.push({ judul: `Semester ${s}`, semester: s, paritas: paritas(s), pilihan: false, xs: urut(xs), sks: sks(xs) });
  }
  const tanpa = mk.filter(m => !/^[1-8]$/.test(String(m.semester ?? '')));
  for (const [p, judul] of [['Ganjil', 'MK pilihan · Ganjil'], ['Genap', 'MK pilihan · Genap'], ['', 'MK pilihan · semester belum ditetapkan']]) {
    const xs = tanpa.filter(m => m.sifat === 'pilihan' && paritas(semPilihan[m.kode]) === p);
    if (xs.length) out.push({ judul, semester: null, paritas: p, pilihan: true, xs: urut(xs), sks: sks(xs) });
  }
  const lain = tanpa.filter(m => m.sifat !== 'pilihan');
  if (lain.length) out.push({ judul: 'Tanpa semester', semester: null, paritas: '', pilihan: false, xs: urut(lain), sks: sks(lain) });
  return out;
}

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
  bentuk: '', luring: '', daring: '', bentuk_pb: [], scl: [], penugasan: '' });
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
                 semester: jenis === 'MKP' ? '' : teks(mk.semester), tanggal: tanggalLokal(kini),
                 penyelenggara: ['MKPT', 'MKU'].includes(jenis) ? 'Universitas Pertamina' : (situs.prodi ? `Program Studi ${situs.prodi}` : '') },
    pengembang: '', pengampu: '', tujuan: '', deskripsi: '',
    kriteria: 'CPMK dinyatakan tercapai bila mahasiswa memperoleh capaian minimal 45% pada CPMK terkait; target kinerja: minimal 60% '
      + 'peserta mata kuliah mencapai ketercapaian tersebut. Sistem penilaian (konversi nilai angka ke nilai huruf dan ketentuan kelulusan) '
      + 'mengacu pada Peraturan Akademik Universitas Pertamina yang berlaku.',
    pustaka: [], syarat: { prasyarat: '', bersamaan: '' },
    scl: { ada: null, teks: '' }, integrasi: { ada: null, teks: '', karya: [] }, direktori: { status: '', teks: '' },
    pekan: kerangkaPekan(),
    evaluasi: { baru: false, mk: '', kode: '', semester: '', jumlah: '', rerata: '', rekomendasi: '' },
    peta: { sub: {}, entry: '' },
    rubrik: {},   // { [nama asesmen non-tes]: { tingkat: [label], kriteria: [{ nama, bobot, deskriptor: [per tingkat] }] } }
  };
}

// Rubrik penilaian (Panduan: Bentuk & Kriteria = rubrik/kunci jawaban; ranah A/P berpedoman rubrik), pemilik 2026-11-19.
export const TINGKAT_RUBRIK = ['Sangat baik', 'Baik', 'Cukup', 'Kurang'];
export const ASESMEN_TES = ['kuis', 'uts', 'uas'];
export const kriteriaKosong = n => ({ nama: '', bobot: '', deskriptor: Array(n).fill('') });
export const rubrikKosong = () => ({ tingkat: [...TINGKAT_RUBRIK], kriteria: [kriteriaKosong(TINGKAT_RUBRIK.length)] });
/** Nama asesmen yang punya rubrik berisi (minimal satu kriteria bernama) di data RPS. */
export const rubrikRps = d => new Set(Object.entries(d?.rubrik || {}).filter(([, r]) => (r?.kriteria || []).some(k => teks(k.nama))).map(([n]) => n));

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
      if (sah > 1) out.push({ tanggal: tanggalLokal(aju?.waktu), pengusul: aju?.oleh_nama || '', deskripsi: aju?.catatan || '',
                              validasi: tanggalLokal(r.waktu), catatan: [r.oleh_nama, r.catatan].filter(Boolean).join(': ') });
      aju = null;
    }
  }
  return out;
}

/**
 * Bagian E dari data prodi (tahap 3, pemilik 2026-11-18). ringkasan = cpl_ringkasan.data terbaru ({kelas: [{course_code, class_name,
 * cpl, counted, above_threshold, share, status, term, term_order}]}); evaluasi = evaluasi_mk {id, tahun_akademik, semester, kode_mk,
 * rps_sesuai, rps_catatan, metode_catatan} yang terbaca; tindak = evaluasi_tindak {evaluasi_id, masalah, rencana}.
 * Persentase lulus dan rerata nilai akhir TIDAK ada di data prodi (ringkasan memuat capaian CPL, bukan nilai akhir):
 * dibiarkan "…" untuk diisi dosen dari SIAKAD. Hasil null bila MK itu belum punya data.
 */
export function evaluasiDariData({ ringkasan, evaluasi = [], tindak = [], kode } = {}){
  const K = String(kode || '').toUpperCase();
  const xs = (ringkasan?.kelas || []).filter(r => String(r.course_code || '').toUpperCase() === K);
  if (!xs.length) return null;
  const akhir = Math.max(...xs.map(r => +r.term_order || 0)), di = xs.filter(r => (+r.term_order || 0) === akhir);
  const m = String(di[0].term || '').match(/(\d{4})\s*\/\s*(\d{4})\s*(ganjil|genap)/i);
  const ta = m ? `${m[1]}/${m[2]}` : '', sm = m ? m[3][0].toUpperCase() + m[3].slice(1).toLowerCase() : '';
  const perKelas = new Map();
  for (const r of di) perKelas.set(r.class_name, Math.max(perKelas.get(r.class_name) || 0, +r.counted || 0));
  const n = [...perKelas.values()].reduce((a, v) => a + v, 0);
  const perCpl = new Map();
  for (const r of di) {
    const x = perCpl.get(r.cpl) || { n: 0, atas: 0, belum: false };
    x.n += +r.counted || 0; x.atas += +r.above_threshold || 0; x.belum ||= r.status === 'BELUM';
    perCpl.set(r.cpl, x);
  }
  const bahan = [`Capaian CPL ${sm} ${ta} (${perKelas.size} kelas): ` + [...perCpl].map(([c, x]) =>
    `CPL ${c} ${x.n ? Math.round(100 * x.atas / x.n) : 0}% mahasiswa di atas ambang${x.belum ? ' (belum tercapai)' : ''}`).join('; ') + '.'];
  const ev = evaluasi.filter(e => String(e.kode_mk || '').toUpperCase() === K && e.tahun_akademik === ta && e.semester === sm);
  for (const e of ev) {
    if (e.rps_sesuai && e.rps_sesuai !== 'sesuai') bahan.push(`Pelaksanaan ${e.rps_sesuai === 'tidak' ? 'tidak' : 'sebagian'} sesuai RPS${e.rps_catatan ? ': ' + e.rps_catatan : '.'}`);
    if (e.metode_catatan) bahan.push(`Catatan metode: ${e.metode_catatan}`);
    for (const t of tindak.filter(t => t.evaluasi_id === e.id)) bahan.push(`Tindak lanjut: ${t.rencana}${t.masalah ? ` (masalah: ${t.masalah})` : ''}`);
  }
  return { semester: ta ? `${sm} ${ta}` : String(di[0].term || ''), jumlah: `${n} mahasiswa; lulus …%`, rerata: '…', bahan };
}

/** Lengkapi RPS tersimpan dengan kunci yang belum ada (data lama tetap). */
export function rapikanRps(d, mk, situs){
  const k = rpsKosong(mk, situs);
  if (!d || typeof d !== 'object') return k;
  return { ...k, ...d, versi: VERSI_DATA, identitas: { ...k.identitas, ...(d.identitas || {}), sks: { ...k.identitas.sks, ...(d.identitas?.sks || {}) } },
           syarat: { ...k.syarat, ...(d.syarat || {}) }, scl: { ...k.scl, ...(d.scl || {}) },
           direktori: { ...k.direktori, ...(d.direktori || {}) }, evaluasi: { ...k.evaluasi, ...(d.evaluasi || {}) },
           peta: { sub: { ...(d.peta?.sub || {}) }, entry: d.peta?.entry || '' },
           integrasi: { ...k.integrasi, ...(d.integrasi || {}), karya: Array.isArray(d.integrasi?.karya) ? d.integrasi.karya : [] },
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
  // Tabel 3.a.1 LKPS dan butir 18 (PJP) memakai sebaran sks di data MK (Data prodi), bukan RPS: keduanya harus sama.
  if (mk.sks_kuliah != null || mk.sks_praktikum != null) {
    const praktik = angka(I.sks?.p) + angka(I.sks?.pl) + angka(I.sks?.s);
    if (angka(I.sks?.t) !== angka(mk.sks_kuliah) + angka(mk.sks_seminar) || praktik !== angka(mk.sks_praktikum))
      s('A', `Sebaran sks RPS (kuliah ${angka(I.sks?.t)}, praktikum/praktik ${praktik}) berbeda dengan data MK (kuliah ${angka(mk.sks_kuliah) + angka(mk.sks_seminar)}, `
        + `praktikum ${angka(mk.sks_praktikum)}) yang dipakai Tabel 3.a.1 LKPS dan butir 18; samakan (Data prodi › Mata kuliah).`);
  }
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
    // Ranah A (sikap) / P (keterampilan) dinilai dengan observasi atau unjuk kerja berpedoman rubrik (Panduan).
    const ranah = [...new Set(bloom(x.rumusan).kode.filter(k => k[0] !== 'C').map(k => k[0]))];
    const dinilai = S.asesmen.filter(a => angka(S.bobot?.[x.kode]?.[a.nama]));
    if (ranah.length && dinilai.length && dinilai.every(a => ASESMEN_TES.includes(jenisAsesmen(a))))
      s('B', `${x.kode} memuat ranah ${ranah.map(r => (r === 'A' ? 'A (sikap)' : 'P (keterampilan)')).join(' dan ')}, tetapi hanya dinilai lewat kuis/UTS/UAS; `
        + 'nilai dengan observasi atau unjuk kerja berpedoman rubrik (mis. tugas, praktikum, proyek).');
  }
  const total = S.sub.reduce((a, x) => a + bobotSub(S, x.kode), 0);
  if (S.sub.length && bulat(total) !== 100) g('B', `Total bobot penilaian ${bulat(total)}%, harus 100%.`);
  for (const p of periksaKomposisi({ struktur: S, mk })) out.push(p);
  const H = hots(S, I.semester || mk.semester);
  if (H.target != null && S.sub.length && H.persen < H.target) s('B', `HOTS ${H.persen}%; disarankan ≥ ${H.target}% untuk MK tahun ke-${H.tahun}.`);
  if (S.sub.length > 1 && !Object.keys(R.peta?.sub || {}).some(k => S.sub.some(x => x.kode === k)))
    s('B', 'Peta Analisis: tandai hubungan antar-Sub-CPMK (sekarang semua langsung menuju CPMK).');
  // C
  if (!teks(R.tujuan)) g('C', 'Isi tujuan MK (3-5 poin, sesuai silabus K26).');
  if (!teks(R.deskripsi)) g('C', 'Isi deskripsi dan bahan kajian.');
  if (!teks(R.pengampu)) g('C', 'Isi dosen pengampu.');
  if (!(R.pustaka || []).some(p => teks(p.teks))) g('C', 'Isi minimal satu pustaka.');
  if (!teks(R.kriteria)) g('C', 'Isi kriteria ketercapaian CPMK.');
  if (R.scl?.ada == null) g('C', 'Nyatakan ada/tidak metode SCL.');
  if (R.integrasi?.ada == null) g('C', 'Nyatakan ada/tidak integrasi penelitian/PkM.');
  else if (R.integrasi.ada && !(R.integrasi.karya || []).length && !teks(R.integrasi.teks))
    g('C', 'Integrasi penelitian/PkM: pilih penelitian/PkM yang sudah tersimpan (atau uraikan).');
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
    if (!(p.bentuk_pb || []).length) g('D', `${lbl}: centang bentuk pembelajaran (kuliah, praktikum, dll.) untuk lampiran rekap.`);
    for (const a of p.asesmen || []) if (!(p.sub || []).some(k => angka(S.bobot?.[k]?.[a]))) s('D', `${lbl}: ${a} tidak berbobot pada Sub-CPMK pekan ini (bagian B).`);
  }
  const kurang = Array.from({ length: 16 }, (_, i) => i + 1).filter(n => !dipakai.has(n));
  if (kurang.length) g('D', `Pekan belum terisi: ${kurang.join(', ')}.`);
  const ganda = [...dipakai].filter(([, n]) => n > 1).map(([k]) => k);
  if (ganda.length) g('D', `Pekan tercantum lebih dari sekali: ${ganda.join(', ')}.`);
  if (!P.some(p => p.jenis === 'uts')) g('D', 'Tambahkan baris UTS.');
  if (!P.some(p => p.jenis === 'uas')) g('D', 'Tambahkan baris UAS.');
  // Keselarasan (pemilik 2026-11-19): tiap Sub-CPMK diajarkan di pekan tertentu; asesmen yang menilai Sub-CPMK dijadwalkan di
  // pekan yang memuat Sub-CPMK itu.
  const kuliah = P.filter(p => p.jenis === 'kuliah');
  if (kuliah.length) {
    const diPekan = new Set(kuliah.flatMap(p => p.sub || []));
    for (const x of S.sub) {
      if (!diPekan.has(x.kode)) { g('D', `${x.kode} belum dijadwalkan di pekan mana pun; pilih di rencana pekanan.`); continue; }
      for (const a of S.asesmen) {
        if (['uts', 'uas'].includes(jenisAsesmen(a)) || !angka(S.bobot?.[x.kode]?.[a.nama])) continue;
        const pk = kuliah.filter(p => (p.asesmen || []).includes(a.nama));
        if (pk.length && !pk.some(p => (p.sub || []).includes(x.kode)))
          s('D', `${x.kode} dinilai lewat ${a.nama}, tetapi ${a.nama} dijadwalkan di pekan yang tidak memuat ${x.kode}.`);
      }
    }
  }
  const sumatif = S.asesmen.filter(a => !['uts', 'uas'].includes(jenisAsesmen(a))).map(a => a.nama);
  const diD = new Set(P.flatMap(p => p.asesmen || []));
  for (const a of sumatif) if (!diD.has(a)) s('D', `${a} (bagian B) belum dijadwalkan di rencana pekanan.`);
  // Rubrik untuk asesmen non-tes yang berbobot (Panduan: rubrik penilaian/kunci jawaban).
  for (const a of S.asesmen.filter(a => !ASESMEN_TES.includes(jenisAsesmen(a)) && S.sub.some(x => angka(S.bobot?.[x.kode]?.[a.nama])))) {
    const ks = (R.rubrik?.[a.nama]?.kriteria || []).filter(k => teks(k.nama));
    if (!ks.length) { s('D', `Rubrik ${a.nama} belum disusun (bagian Rubrik penilaian); Panduan meminta rubrik untuk asesmen non-tes.`); continue; }
    if (ks.some(k => (k.deskriptor || []).some(x => !teks(x)))) s('D', `Rubrik ${a.nama}: lengkapi deskriptor tiap tingkat.`);
    const tot = ks.reduce((t, k) => t + angka(k.bobot), 0);
    if (ks.some(k => teks(k.bobot)) && bulat(tot) !== 100) s('D', `Rubrik ${a.nama}: total bobot kriteria ${bulat(tot)}%, seharusnya 100%.`);
  }
  const adaScl = P.some(p => (p.scl || []).length || METODE_SCL.some(m => `${p.luring} ${p.daring}`.toLowerCase().includes(m.toLowerCase())));
  // Penugasan (tugas besar/proyek) dicentang tetapi tanpa sks praktik/penugasan: tetap PT kuliah, tidak menambah butir 18.
  if (P.some(p => (p.bentuk_pb || []).includes('penugasan')) && !(angka(I.sks?.p) + angka(I.sks?.pl) + angka(I.sks?.s)))
    s('D', 'Penugasan (tugas besar/proyek) dicentang, tetapi sks P/PL/S di bagian A 0: penugasan ini masih penugasan terstruktur kuliah dan '
      + 'tidak terhitung di butir 18 (PJP). Bila tugas besar diberi sks sendiri, ubah sebaran sks di bagian A dan data MK.');
  if (!adaScl && R.scl?.ada !== true) g('D', 'Gunakan minimal satu metode SCL (mis. Case Method, Project Based Learning) di kolom Luring/Daring.');
  for (const x of S.sub) if (!P.some(p => (p.sub || []).includes(x.kode))) s('D', `${x.kode} belum muncul di rencana pekanan.`);
  // E
  const E = R.evaluasi || {};
  if (!E.baru && !(teks(E.semester) && teks(E.jumlah) && teks(E.rerata) && teks(E.rekomendasi))) g('E', 'Isi evaluasi penyelenggaraan sebelumnya, atau centang "belum pernah diselenggarakan".');
  if (!E.baru && ['semester', 'jumlah', 'rerata', 'rekomendasi'].some(k => String(E[k] || '').includes('…'))) g('E', 'Ganti tanda "…" (persentase lulus, rerata nilai akhir) dengan angka dari SIAKAD.');
  return out;
}

/**
 * Model siap cetak untuk rps-docx.js. ctx seperti periksaRps + situs {prodi}. Kolom asesmen = jenis yang dipakai
 * (urutan Kuis, Tugas, UTS, UAS, Lainnya); sel = nama butir yang berbobot pada Sub-CPMK itu.
 */
export function modelRps({ mk = {}, struktur, rps, cpl = [], pengembang = null, kaprodi = null, revisi = [], kaprodi_penyusun = false } = {}){
  const S = struktur || { cpmk: [], sub: [], asesmen: [], bobot: {} }, R = rps || rpsKosong(mk);
  const kolom = JENIS_ASESMEN.filter(([j]) => S.asesmen.some(a => jenisAsesmen(a) === j));
  const isi = x => Object.fromEntries(kolom.map(([j]) => [j, S.asesmen.filter(a => jenisAsesmen(a) === j && angka(S.bobot?.[x.kode]?.[a.nama])).map(a => a.nama)]));
  const totalJenis = Object.fromEntries(kolom.map(([j]) => [j, bulat(S.sub.reduce((t, x) => t + S.asesmen
    .filter(a => jenisAsesmen(a) === j).reduce((u, a) => u + angka(S.bobot?.[x.kode]?.[a.nama]), 0), 0))]));
  const H = hots(S, R.identitas?.semester || mk.semester);
  const orang = o => (o ? { nama: teks(o.nama_gelar) || teks(o.nama), nip: teks(o.nip) } : { nama: '', nip: '' });
  return {
    mk: { kode: teks(mk.kode), nama: teks(mk.nama), kurikulum: teks(mk.kurikulum) },
    identitas: R.identitas, pengembang: orang(pengembang), kaprodi: orang(kaprodi), kaprodi_penyusun: !!kaprodi_penyusun,   // 114
    cpl: cpl.filter(c => S.sub.some(x => x.cpl === c.kode) || !S.sub.some(x => x.cpl)),
    cpmk: S.cpmk.map(c => ({ kode: c.kode, rumusan: teks(c.rumusan) })),
    kolom: kolom.map(([j, l]) => ({ jenis: j, label: l, total: totalJenis[j] })),
    sub: S.sub.map(x => ({ kode: x.kode, cpmk: x.cpmk, cpl: x.cpl || '', rumusan: teks(x.rumusan), asesmen: isi(x), bobot: bobotSub(S, x.kode) })),
    total: bulat(S.sub.reduce((a, x) => a + bobotSub(S, x.kode), 0)), hots: H,
    tujuan: teks(R.tujuan), deskripsi: teks(R.deskripsi), pengampu: teks(R.pengampu), kriteria: teks(R.kriteria),
    pustaka: (R.pustaka || []).filter(p => teks(p.teks)), syarat: R.syarat || {}, scl: R.scl || {}, integrasi: R.integrasi || {},
    direktori: R.direktori || {}, pekan: R.pekan || [], evaluasi: R.evaluasi || {}, revisi,
    rekap: rekapRps({ mk, struktur: S, rps: R }), integrasi_teks: teksIntegrasi(R.integrasi),
    rubrik: Object.entries(R.rubrik || {}).filter(([n]) => S.asesmen.some(a => a.nama === n)).map(([n, rb]) => ({ asesmen: n, tingkat: (rb.tingkat || []).map(teks),
      kriteria: (rb.kriteria || []).filter(k => teks(k.nama)).map(k => ({ nama: teks(k.nama), bobot: teks(k.bobot), deskriptor: (k.deskriptor || []).map(teks) })) }))
      .filter(x => x.kriteria.length),
  };
}

// ---------- Lampiran rekap untuk akreditasi (pemilik 2026-11-19) ----------
/** [1, 2, 3, 5, 9, 10] -> "1-3, 5, 9-10". */
export function ringkasPekan(xs){
  const n = [...new Set(xs)].sort((a, b) => a - b), out = [];
  for (let i = 0; i < n.length; i++) {
    let j = i;
    while (j + 1 < n.length && n[j + 1] === n[j] + 1) j++;
    out.push(i === j ? String(n[i]) : `${n[i]}-${n[j]}`);
    i = j;
  }
  return out.join(', ');
}

/**
 * Beban belajar per bentuk dari sks T/P/PL/S (Panduan Pengisian RPS K26 UPER, pemilik 2026-11-19): 1 sks = 45 jam per semester.
 * Kuliah/responsi/tutorial (T) per pekan 50' PB + 60' PT + 60' KM per sks -> jam semester dibagi menurut 50:60:60.
 * Praktikum (P), praktik lapangan (PL), simulasi (S): kegiatan 170' per pekan per sks, tidak dibagi PB/PT/KM.
 */
export function bebanBelajar(sks = {}){
  const baris = [['t', 'Kuliah/Responsi/Tutorial'], ['p', 'Praktikum'], ['pl', 'Praktik lapangan'], ['s', 'Simulasi']].map(([k, l]) => {
    const n = angka(sks[k]), jam = n * 45;
    return k === 't'
      ? { kode: k, bentuk: l, sks: n, menit: n ? `${50 * n}′ PB + ${60 * n}′ PT + ${60 * n}′ KM` : '-', pb: bulat(jam * 50 / 170),
          pt: bulat(jam * 60 / 170), km: bulat(jam * 60 / 170), kegiatan: 0, jam }
      : { kode: k, bentuk: l, sks: n, menit: n ? `${170 * n}′ kegiatan` : '-', pb: 0, pt: 0, km: 0, kegiatan: jam, jam };
  });
  const jumlah = k => bulat(baris.reduce((a, r) => a + r[k], 0));
  return { baris, jumlah: { sks: jumlah('sks'), pb: jumlah('pb'), pt: jumlah('pt'), km: jumlah('km'), kegiatan: jumlah('kegiatan'), jam: jumlah('jam') } };
}

/**
 * Rekap untuk lampiran: beban belajar, rencana pekanan (bentuk pembelajaran, metode SCL, penugasan), komposisi penilaian.
 * ctx seperti periksaRps.
 */
export function rekapRps({ mk = {}, struktur, rps } = {}){
  const S = struktur || { cpmk: [], sub: [], asesmen: [], bobot: {} }, R = rps || rpsKosong(mk), P = R.pekan || [];
  const perKode = (daftar, ambil) => daftar.map(([k, l]) => {
    const pk = P.flatMap(p => ((ambil(p) || []).includes(k) ? rentangPekan(p.pekan) : []));
    return { kode: k, label: l, pekan: ringkasPekan(pk), jumlah: new Set(pk).size };
  }).filter(x => x.jumlah);
  const jenis = Object.fromEntries(JENIS_ASESMEN.map(([j]) => [j, 0]));
  for (const x of S.sub) for (const a of S.asesmen) jenis[jenisAsesmen(a)] += angka(S.bobot?.[x.kode]?.[a.nama]);
  const total = Object.values(jenis).reduce((a, v) => a + v, 0);
  const persen = v => (total ? bulat(100 * v / total) : 0);
  return {
    beban: bebanBelajar(R.identitas?.sks), butir18: butir18(R.identitas?.sks),
    bentuk: perKode(BENTUK, p => p.bentuk_pb),
    scl: perKode(SCL, p => p.scl),
    ujian: P.filter(p => p.jenis !== 'kuliah').map(p => ({ pekan: teks(p.pekan), label: p.jenis === 'uts' ? 'UTS' : 'UAS' })),
    penugasan: P.filter(p => p.jenis === 'kuliah' && (teks(p.penugasan) || (p.asesmen || []).length))
      .map(p => ({ pekan: teks(p.pekan), penugasan: teks(p.penugasan), sumatif: (p.asesmen || []).join(', ') })),
    penilaian: { jenis: JENIS_ASESMEN.filter(([j]) => jenis[j]).map(([j, l]) => ({ jenis: j, label: l, persen: persen(jenis[j]) })),
                 hots: hots(S, R.identitas?.semester || mk.semester).persen, nontes: persen(jenis.tugas + jenis.lainnya), total: bulat(total) },
  };
}

/**
 * Kalimat integrasi untuk Word: "Penelitian "Judul" (pelaksana, tahun), sebagai studi kasus pada Sub-CPMK 2." per karya, lalu uraian bebas.
 */
export function teksIntegrasi(I = {}){
  const bentuk = k => (BENTUK_INTEGRASI.find(b => b[0] === k) || [, ''])[1];
  const xs = (I.karya || []).map(k => `${k.kategori === 'pkm' ? 'PkM' : 'Penelitian'} "${teks(k.judul)}" (${[teks(k.pelaksana), teks(k.tahun)].filter(Boolean).join(', ')})`
    + `${k.bentuk ? `, sebagai ${bentuk(k.bentuk)}` : ''}${teks(k.ket) ? ` pada ${teks(k.ket)}` : ''}.`);
  return [...xs, teks(I.teks)].filter(Boolean).join('\n');
}

/**
 * Butir 18 LAM Teknik (Tabel 3.a.1 LKPS): PJP = JP / JB; Excel LKPS menghitung JP = sks praktikum x 50 dan JB = sks x 50
 * (docs/analisis-instrumen-lam-teknik-2025.md). Kolom praktikum/praktik lapangan/penugasan = P + PL + S formulir RPS;
 * penugasan terstruktur (PT) di dalam sks kuliah TIDAK dihitung.
 */
export function butir18(sks = {}){
  const t = angka(sks.t), jp = angka(sks.p) + angka(sks.pl) + angka(sks.s), n = t + jp;
  return { sks_praktik: jp, sks: n, jp_menit: jp * 50, jb_menit: n * 50, persen: n ? bulat(100 * jp / n) : 0 };
}

/** Nama berkas Word, mis. "RPS_K26_13301_Mekanika_Teknik.docx". */
export const namaBerkasRps = mk => `RPS_${teks(mk.kurikulum)}_${teks(mk.kode)}_${teks(mk.nama).replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_|_$/g, '')}.docx`;

// ---------- Perubahan dibanding versi disahkan dan salin dari RPS lain (pemilik 2026-11-19) ----------
const ISIAN_BEDA = [['A', 'identitas.jenis_mk', 'Jenis MK'], ['A', 'identitas.sks', 'Bobot sks T/P/PL/S'], ['A', 'identitas.semester', 'Semester'],
  ['A', 'identitas.penyelenggara', 'Penyelenggara'], ['A', 'pengembang', 'Dosen pengembang'], ['C', 'tujuan', 'Tujuan'],
  ['C', 'deskripsi', 'Deskripsi dan bahan kajian'], ['C', 'pengampu', 'Pengampu'], ['C', 'syarat', 'MK syarat'], ['C', 'pustaka', 'Pustaka'],
  ['C', 'kriteria', 'Kriteria ketercapaian'], ['C', 'scl', 'Metode SCL'], ['C', 'integrasi', 'Integrasi penelitian/PkM'],
  ['C', 'direktori', 'Direktori Kompetensi Teknis'], ['Peta', 'peta', 'Peta Analisis'], ['E', 'evaluasi', 'Evaluasi penyelenggaraan sebelumnya'],
  ['Rubrik', 'rubrik', 'Rubrik penilaian']];
const KOLOM_PEKAN = [['sub', 'Sub-CPMK'], ['asesmen', 'Asesmen sumatif'], ['materi', 'Materi'], ['pustaka', 'Pustaka'], ['indikator', 'Indikator'],
  ['bentuk', 'Bentuk dan kriteria asesmen'], ['luring', 'Luring'], ['daring', 'Daring'], ['bentuk_pb', 'Bentuk pembelajaran'], ['scl', 'Metode SCL'],
  ['penugasan', 'Penugasan']];
const ambil = (o, jalur) => jalur.split('.').reduce((x, k) => x?.[k], o);
/** Nilai isian sebagai teks ringkas untuk tabel perubahan. */
export function teksNilai(v){
  if (v == null || v === '') return '';
  if (Array.isArray(v)) return v.map(teksNilai).filter(Boolean).join('; ');
  if (typeof v === 'object') {
    if ('kode' in v && 'teks' in v) return [teks(v.kode), teks(v.teks)].filter(Boolean).join(': ');
    if ('judul' in v) return teks(v.judul);
    if ('t' in v && 'p' in v) return ['t', 'p', 'pl', 's'].map(k => `${k.toUpperCase()}=${teks(v[k]) || 0}`).join(' ');
    return Object.entries(v).map(([k, x]) => [k, teksNilai(x)]).filter(([, x]) => x !== '').map(([k, x]) => `${k}: ${x}`).join(', ');
  }
  return teks(v);
}

/**
 * Perubahan RPS (dan bagian B) dibanding versi yang disahkan: [{ bagian, label, lama, baru }]. Tanggal penyusunan diabaikan.
 * lama/baru = data mk_rps; sLama/sBaru = struktur CPMK (mk_rps.sah.struktur dan mk_struktur sekarang).
 */
export function bedaRps(lama = {}, baru = {}, sLama = null, sBaru = null){
  const out = [], catat = (bagian, label, a, b) => { const x = teksNilai(a), y = teksNilai(b); if (x !== y) out.push({ bagian, label, lama: x, baru: y }); };
  for (const [bagian, jalur, label] of ISIAN_BEDA) catat(bagian, label, ambil(lama, jalur), ambil(baru, jalur));
  const kunciP = p => `${p.jenis}|${teks(p.pekan)}`, label = p => (p.jenis === 'kuliah' ? `Pekan ${teks(p.pekan)}` : `${p.jenis.toUpperCase()} (pekan ${teks(p.pekan)})`);
  const pl = new Map((lama.pekan || []).map(p => [kunciP(p), p])), pb = new Map((baru.pekan || []).map(p => [kunciP(p), p]));
  for (const [k, p] of pb) {
    const q = pl.get(k);
    if (!q) { out.push({ bagian: 'D', label: `${label(p)} (baris baru)`, lama: '', baru: teksNilai(p.materi) || '(baris baru)' }); continue; }
    for (const [kol, l] of KOLOM_PEKAN) catat('D', `${label(p)} · ${l}`, q[kol], p[kol]);
  }
  for (const [k, q] of pl) if (!pb.has(k)) out.push({ bagian: 'D', label: `${label(q)} (dihapus)`, lama: teksNilai(q.materi) || '(baris)', baru: '' });
  if (sLama || sBaru) {
    const A = sLama || {}, B = sBaru || {};
    const per = (xs, f) => new Map((xs || []).map(x => [x.kode, f(x)]));
    const cL = per(A.cpmk, c => teks(c.rumusan)), cB = per(B.cpmk, c => teks(c.rumusan));
    for (const k of new Set([...cL.keys(), ...cB.keys()])) catat('B', k, cL.get(k), cB.get(k));
    const sub = x => `${teks(x.rumusan)}${x.cpl ? ` [CPL ${x.cpl}]` : ''}`;
    const xL = per(A.sub, sub), xB = per(B.sub, sub);
    for (const k of new Set([...xL.keys(), ...xB.keys()])) catat('B', k, xL.get(k), xB.get(k));
    catat('B', 'Butir asesmen', (A.asesmen || []).map(a => a.nama), (B.asesmen || []).map(a => a.nama));
    for (const k of new Set([...Object.keys(A.bobot || {}), ...Object.keys(B.bobot || {})])) {
      const f = o => Object.entries(o || {}).filter(([, v]) => angka(v)).map(([a, v]) => `${a} ${v}`).sort().join(', ');
      catat('B', `Bobot ${k}`, f(A.bobot?.[k]), f(B.bobot?.[k]));
    }
  }
  const urut = { A: 1, B: 2, Peta: 3, C: 4, D: 5, Rubrik: 6, E: 7 };
  return out.sort((a, b) => urut[a.bagian] - urut[b.bagian]);
}

/**
 * Salin dari RPS lain sebagai titik awal: bagian C (kecuali pengampu) dan rencana pekanan. Identitas, pengembang, pengampu,
 * evaluasi, dan peta tetap milik MK ini. Sub-CPMK dan asesmen di pekan dipertahankan hanya bila ada di struktur MK ini.
 */
export function salinRps(R, sumber, struktur){
  const S = struktur || { sub: [], asesmen: [] }, sub = new Set(S.sub.map(x => x.kode)), ases = new Set(S.asesmen.map(a => a.nama));
  const c = JSON.parse(JSON.stringify(sumber || {}));
  const hasil = { ...R };
  for (const k of ['tujuan', 'deskripsi', 'syarat', 'pustaka', 'kriteria', 'scl', 'integrasi', 'direktori']) if (c[k] !== undefined) hasil[k] = c[k];
  if (Array.isArray(c.pekan) && c.pekan.length)
    hasil.pekan = c.pekan.map(p => ({ ...p, sub: (p.sub || []).filter(k => sub.has(k)), asesmen: (p.asesmen || []).filter(a => ases.has(a)) }));
  return hasil;
}
