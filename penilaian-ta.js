// Penilaian seminar/sidang TA dan berita acara (173-patch-penilaian-ta.sql, pemilik 2026-11-25). Logika murni, tanpa DOM:
// dipakai penilaian-ta.html, tiruan situs coba (tools/coba/mock-sb.js), dan diuji tests/js/penilaian_ta.test.mjs.
// Aturan hitung SAMA dengan ta_nilai_hitung di SQL (yang berlaku saat menetapkan berita acara):
//   total penilai  = Σ(nilai × bobot) / Σ bobot, dibulatkan 2 desimal;
//   tiga bagian    = penguji (nilai seminar/sidang), pembimbing (nilai seminar/sidang), proses bimbingan (form tersendiri,
//                    hanya pembimbing); rata-rata tiap bagian dibulatkan 2 desimal; dua pembimbing dirata-rata;
//   bobot bagian   = bobot_penguji, bobot_bimbingan, dan sisanya untuk pembimbing (pemilik 2026-11-25: sidang akhir 40/50/10,
//                    seminar 40/0/60);
//   nilai akhir    = Σ(rata-rata bagian × bobot) / Σ bobot bagian yang sudah ada nilainya;
//   nilai akhir < batas lulus -> mengulang (otomatis), selain itu lulus / lulus dengan revisi (dipilih koordinator).

import { statusBimbingan, labelCara } from './bimbingan-ta.js?v=2026-11-27-e02e4a';

export const TAHAP_NILAI = [['seminar_proposal', 'Seminar proposal'], ['seminar_kemajuan', 'Seminar kemajuan'], ['sidang_akhir', 'Sidang akhir']];
export const labelTahap = t => (TAHAP_NILAI.find(x => x[0] === t) || [, t || ''])[1];
export const PERAN_NILAI = { pembimbing: 'Pembimbing', penguji: 'Penguji' };
export const BAGIAN_NILAI = { seminar: 'Nilai seminar/sidang', bimbingan: 'Nilai proses bimbingan' };
export const HASIL_LABEL = { lulus: 'Lulus', lulus_revisi: 'Lulus dengan revisi', mengulang: 'Mengulang' };
export const TINGKAT_AWAL = [85, 70, 55, 0];

// Draf awal versi 1: salinan blok rubrik_awal di supabase/173-patch-penilaian-ta.sql (diperiksa sama oleh uji).
export const RUBRIK_AWAL = {
 "seminar_proposal": {
  "bobot_penguji": 40,
  "bobot_bimbingan": 0,
  "komponen_bimbingan": [],
  "komponen": [
   {
    "kode": "masalah",
    "label": "Latar belakang dan rumusan masalah",
    "bobot": 20,
    "uraian": [
     "Masalah jelas, penting, dan didukung data; rumusan, tujuan, dan batasan tegas serta saling sesuai.",
     "Masalah dan tujuan jelas; dukungan data atau batasan masih kurang di beberapa bagian.",
     "Masalah cukup dipahami, tetapi rumusan, tujuan, atau batasan kurang tegas atau kurang sesuai.",
     "Masalah tidak jelas atau rumusan tidak sesuai dengan tujuan."
    ]
   },
   {
    "kode": "pustaka",
    "label": "Tinjauan pustaka",
    "bobot": 20,
    "uraian": [
     "Pustaka mutakhir dan relevan (jurnal, standar); teori dan penelitian terdahulu dirangkum kritis menjadi dasar metode.",
     "Pustaka relevan dan cukup; rangkuman lebih banyak memaparkan daripada membandingkan.",
     "Pustaka terbatas atau kurang mutakhir; kaitannya dengan masalah lemah.",
     "Pustaka sangat kurang atau tidak relevan."
    ]
   },
   {
    "kode": "metode",
    "label": "Metodologi dan rencana kerja",
    "bobot": 30,
    "uraian": [
     "Metode tepat dan terperinci (data, alat, langkah analisis); rencana kerja dan jadwal realistis.",
     "Metode tepat; beberapa langkah atau kebutuhan data belum terperinci.",
     "Metode kurang sesuai atau banyak langkah belum jelas; jadwal kurang realistis.",
     "Metode tidak sesuai dengan tujuan atau tidak dapat dijalankan."
    ]
   },
   {
    "kode": "penulisan",
    "label": "Penulisan naskah",
    "bobot": 15,
    "uraian": [
     "Sistematis, bahasa baku dan runtut; gambar, tabel, sitasi, dan daftar pustaka sesuai pedoman.",
     "Sistematis; ada kesalahan kecil bahasa atau format.",
     "Banyak kesalahan bahasa, format, atau sitasi.",
     "Tidak mengikuti pedoman; sulit dipahami."
    ]
   },
   {
    "kode": "presentasi",
    "label": "Presentasi dan tanya jawab",
    "bobot": 15,
    "uraian": [
     "Penyajian jelas dan tepat waktu; menjawab pertanyaan dengan tepat dan menguasai materi.",
     "Penyajian jelas; sebagian jawaban kurang tepat.",
     "Penyajian kurang runtut; banyak pertanyaan tidak terjawab dengan baik.",
     "Tidak menguasai materi."
    ]
   }
  ]
 },
 "seminar_kemajuan": {
  "bobot_penguji": 40,
  "bobot_bimbingan": 0,
  "komponen_bimbingan": [],
  "komponen": [
   {
    "kode": "tindak_lanjut",
    "label": "Kesesuaian dengan proposal dan tindak lanjut revisi",
    "bobot": 20,
    "uraian": [
     "Pekerjaan sesuai rencana proposal; semua masukan seminar proposal ditindaklanjuti; perubahan dijelaskan.",
     "Sebagian besar sesuai rencana dan masukan ditindaklanjuti.",
     "Banyak bagian menyimpang dari rencana atau masukan belum ditindaklanjuti.",
     "Tidak sesuai rencana dan masukan diabaikan."
    ]
   },
   {
    "kode": "data",
    "label": "Data, pengolahan, dan analisis awal",
    "bobot": 35,
    "uraian": [
     "Data lengkap dan terverifikasi; pengolahan benar dan terdokumentasi; analisis awal menjawab sebagian tujuan.",
     "Data cukup; pengolahan benar dengan kekurangan kecil.",
     "Data belum lengkap atau pengolahan mengandung kesalahan.",
     "Data dan pengolahan belum ada atau salah."
    ]
   },
   {
    "kode": "pembahasan",
    "label": "Pembahasan sementara",
    "bobot": 20,
    "uraian": [
     "Hasil sementara ditafsirkan dengan benar dan dibandingkan dengan pustaka; langkah lanjutan jelas.",
     "Tafsiran benar; perbandingan dengan pustaka atau langkah lanjutan kurang.",
     "Tafsiran dangkal atau kurang tepat.",
     "Belum ada pembahasan."
    ]
   },
   {
    "kode": "penulisan",
    "label": "Penulisan naskah",
    "bobot": 10,
    "uraian": [
     "Sistematis, bahasa baku dan runtut; gambar, tabel, sitasi, dan daftar pustaka sesuai pedoman.",
     "Sistematis; ada kesalahan kecil bahasa atau format.",
     "Banyak kesalahan bahasa, format, atau sitasi.",
     "Tidak mengikuti pedoman; sulit dipahami."
    ]
   },
   {
    "kode": "presentasi",
    "label": "Presentasi dan tanya jawab",
    "bobot": 15,
    "uraian": [
     "Penyajian jelas dan tepat waktu; menjawab pertanyaan dengan tepat dan menguasai materi.",
     "Penyajian jelas; sebagian jawaban kurang tepat.",
     "Penyajian kurang runtut; banyak pertanyaan tidak terjawab dengan baik.",
     "Tidak menguasai materi."
    ]
   }
  ]
 },
 "sidang_akhir": {
  "bobot_penguji": 40,
  "bobot_bimbingan": 50,
  "komponen": [
   {
    "kode": "materi",
    "label": "Penguasaan materi dan dasar teori",
    "bobot": 20,
    "uraian": [
     "Menguasai teori dan konteks rekayasa; mampu mengaitkannya dengan standar dan praktik.",
     "Menguasai sebagian besar teori yang dipakai.",
     "Penguasaan teori terbatas.",
     "Tidak menguasai dasar teori."
    ]
   },
   {
    "kode": "metode",
    "label": "Metodologi dan analisis",
    "bobot": 25,
    "uraian": [
     "Metode dan analisis benar, terverifikasi, dan dapat diulang; asumsi dan batasan dijelaskan.",
     "Metode dan analisis benar dengan kekurangan kecil.",
     "Ada kesalahan analisis atau asumsi tidak dijelaskan.",
     "Analisis salah atau tidak sesuai metode."
    ]
   },
   {
    "kode": "hasil",
    "label": "Hasil, pembahasan, dan kesimpulan",
    "bobot": 25,
    "uraian": [
     "Hasil menjawab semua tujuan; pembahasan kritis dan dibandingkan dengan pustaka; kesimpulan dan saran didukung data.",
     "Hasil menjawab tujuan; pembahasan atau saran kurang mendalam.",
     "Sebagian tujuan belum terjawab atau kesimpulan kurang didukung hasil.",
     "Hasil tidak menjawab tujuan."
    ]
   },
   {
    "kode": "penulisan",
    "label": "Penulisan naskah",
    "bobot": 15,
    "uraian": [
     "Sistematis, bahasa baku dan runtut; gambar, tabel, sitasi, dan daftar pustaka sesuai pedoman.",
     "Sistematis; ada kesalahan kecil bahasa atau format.",
     "Banyak kesalahan bahasa, format, atau sitasi.",
     "Tidak mengikuti pedoman; sulit dipahami."
    ]
   },
   {
    "kode": "presentasi",
    "label": "Presentasi dan tanya jawab",
    "bobot": 15,
    "uraian": [
     "Penyajian jelas dan tepat waktu; menjawab pertanyaan dengan tepat dan menguasai materi.",
     "Penyajian jelas; sebagian jawaban kurang tepat.",
     "Penyajian kurang runtut; banyak pertanyaan tidak terjawab dengan baik.",
     "Tidak menguasai materi."
    ]
   }
  ],
  "komponen_bimbingan": [
   {
    "kode": "keaktifan",
    "label": "Keaktifan dan keteraturan bimbingan",
    "bobot": 30,
    "uraian": [
     "Bimbingan teratur sesuai jadwal; selalu membawa kemajuan dan pertanyaan yang siap dibahas.",
     "Bimbingan cukup teratur; sesekali tanpa kemajuan berarti.",
     "Bimbingan jarang atau tidak teratur.",
     "Hampir tidak pernah bimbingan."
    ]
   },
   {
    "kode": "kemandirian",
    "label": "Kemandirian dan inisiatif",
    "bobot": 25,
    "uraian": [
     "Mencari solusi sendiri, mengusulkan langkah, dan memakai sumber dengan tepat.",
     "Cukup mandiri; sesekali menunggu arahan.",
     "Banyak bergantung pada arahan pembimbing.",
     "Tidak menunjukkan inisiatif."
    ]
   },
   {
    "kode": "ketepatan",
    "label": "Ketepatan waktu dan kemajuan sesuai rencana",
    "bobot": 25,
    "uraian": [
     "Tahapan selesai sesuai atau lebih cepat dari rencana.",
     "Terlambat sedikit dengan alasan yang wajar.",
     "Sering terlambat dari rencana.",
     "Jauh tertinggal dari rencana."
    ]
   },
   {
    "kode": "sikap",
    "label": "Sikap, etika, dan tindak lanjut arahan",
    "bobot": 20,
    "uraian": [
     "Santun, jujur secara akademik, dan menindaklanjuti semua arahan.",
     "Baik; sebagian kecil arahan belum ditindaklanjuti.",
     "Banyak arahan tidak ditindaklanjuti.",
     "Ada pelanggaran etika atau arahan diabaikan."
    ]
   }
  ]
 }
};

export const bulat = x => Math.round((+x + Number.EPSILON) * 100) / 100;
/** Angka gaya Indonesia, 2 desimal: 78.5 -> "78,50"; null -> "–". */
export const angka = x => x == null || x === '' || !Number.isFinite(+x) ? '–'
  : (+x).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const persen = x => String(bulat(x)).replace('.', ',');

/**
 * Tanda CPL awal komponen form sidang akhir (181, pemilik 2026-11-25; MK Tugas Akhir K26 memikul CPL C, E, F, H, I, J).
 * Salinan sama persis dengan blok cpl_awal di supabase/181-patch-cpl-penilaian-ta.sql (diperiksa tests/js/penilaian_ta.test.mjs).
 * Capaian CPL hanya dari sidang akhir; tanda bisa diubah koordinator TA di editor form (kunci cpl tiap komponen).
 */
export const CPL_AWAL = {
  sidang_akhir: {
    komponen: { materi: ['C', 'F'], metode: ['H', 'J'], hasil: ['C', 'I'], penulisan: ['E'], presentasi: ['E'] },
    komponen_bimbingan: { keaktifan: ['F'], kemandirian: ['F'], ketepatan: ['F'], sikap: ['F'] }
  }
};
export const TAHAP_CPL = 'sidang_akhir';
const KODE_CPL = /^[A-Za-z0-9.-]{1,10}$/;
const urutCpl = (a, b) => String(a).localeCompare(String(b), 'id', { numeric: true });

/** Bobot tiga bagian dari form: { penguji, pembimbing, bimbingan } (jumlah 100). */
export function bobotBagian(r){
  const penguji = +(r?.bobot_penguji ?? 40), bimbingan = +(r?.bobot_bimbingan ?? 0);
  return { penguji, bimbingan, pembimbing: bulat(100 - penguji - bimbingan) };
}

/** Galat isian nilai satu penilai, atau null bila sah. nilai = {kode: angka}. */
export function cekNilai(komponen, nilai){
  for (const k of komponen || []) {
    const v = nilai?.[k.kode];
    if (typeof v !== 'number' || !Number.isFinite(v)) return `Isi nilai "${k.label}" (0–100).`;
    if (v < 0 || v > 100) return `Nilai "${k.label}" harus 0–100.`;
  }
  const kode = new Set((komponen || []).map(k => k.kode));
  if (Object.keys(nilai || {}).some(x => !kode.has(x))) return 'Ada nilai untuk komponen yang tidak ada di form penilaian; muat ulang halaman.';
  return null;
}

/** Total satu penilai, atau null bila isian belum lengkap/sah. */
export function totalNilai(komponen, nilai){
  if (!(komponen || []).length || cekNilai(komponen, nilai)) return null;
  let t = 0, b = 0;
  for (const k of komponen) { t += bulat(nilai[k.kode]) * +k.bobot; b += +k.bobot; }
  return bulat(t / b);
}

const rata = xs => xs.length ? bulat(xs.reduce((a, b) => a + +b, 0) / xs.length) : null;

/**
 * Rekap satu jadwal. r = { rubrik: {bobot_penguji, bobot_bimbingan, batas_lulus}, panel: [{peran, nidn, nama}],
 * nilai: [{bagian, nidn, nama, total}], penguji_luar }. Peran dibaca dari panel sekarang; nilai penguji luar (nidn null)
 * dihitung bila jadwal punya penguji luar. Hasil { rataPenguji, rataPembimbing, rataBimbingan, akhir,
 * kurang: [{peran, bagian, nidn, nama}], saran: 'mengulang'|'lulus'|null }.
 */
export function rekapNilai({ rubrik, panel = [], nilai = [], penguji_luar = null }){
  const luar = !!String(penguji_luar || '').trim();
  const w = bobotBagian(rubrik);
  const nidnPeran = p => new Set(panel.filter(x => x.peran === p).map(x => x.nidn));
  const pg = nidnPeran('penguji'), pb = nidnPeran('pembimbing');
  const sem = nilai.filter(n => (n.bagian || 'seminar') === 'seminar'), bim = nilai.filter(n => n.bagian === 'bimbingan');
  const rataPenguji = rata(sem.filter(n => (n.nidn && pg.has(n.nidn)) || (!n.nidn && luar)).map(n => n.total));
  const rataPembimbing = rata(sem.filter(n => n.nidn && pb.has(n.nidn)).map(n => n.total));
  const rataBimbingan = w.bimbingan > 0 ? rata(bim.filter(n => n.nidn && pb.has(n.nidn)).map(n => n.total)) : null;
  let jml = 0, sw = 0;
  for (const [x, b] of [[rataPenguji, w.penguji], [rataPembimbing, w.pembimbing], [rataBimbingan, w.bimbingan]])
    if (x != null && b > 0) { jml += x * b; sw += b; }
  const akhir = sw > 0 ? bulat(jml / sw) : null;
  const sudah = (xs, nidn) => xs.some(n => n.nidn === nidn);
  const kurang = [
    ...panel.filter(x => x.peran === 'pembimbing' && !sudah(sem, x.nidn)).map(({ peran, nidn, nama }) => ({ peran, bagian: 'seminar', nidn, nama })),
    ...panel.filter(x => x.peran === 'penguji' && !sudah(sem, x.nidn)).map(({ peran, nidn, nama }) => ({ peran, bagian: 'seminar', nidn, nama })),
    ...(w.bimbingan > 0 ? panel.filter(x => x.peran === 'pembimbing' && !sudah(bim, x.nidn))
      .map(({ peran, nidn, nama }) => ({ peran, bagian: 'bimbingan', nidn, nama })) : [])];
  if (luar && !nilai.some(n => !n.nidn)) kurang.push({ peran: 'penguji', bagian: 'seminar', nidn: null, nama: String(penguji_luar).trim() });
  const saran = akhir == null ? null : akhir < +(rubrik?.batas_lulus ?? 55) ? 'mengulang' : 'lulus';
  return { rataPenguji, rataPembimbing, rataBimbingan, akhir, kurang, saran };
}

function cekKomponen(komponen, awalan, g){
  if (komponen.length < 1 || komponen.length > 12) g.push(`${awalan}Form penilaian berisi 1 sampai 12 komponen.`);
  const kode = new Set();
  for (const k of komponen) {
    const nama = String(k.label || '').trim() || k.kode || '(tanpa nama)';
    if (!/^[a-z0-9_]{1,20}$/.test(k.kode || '')) g.push(`${awalan}Kode komponen "${nama}" hanya huruf kecil, angka, dan garis bawah (paling banyak 20).`);
    else if (kode.has(k.kode)) g.push(`${awalan}Kode komponen ${k.kode} dipakai dua kali.`);
    kode.add(k.kode);
    const l = String(k.label || '').trim().length;
    if (l < 3 || l > 200) g.push(`${awalan}Nama komponen ${k.kode || ''} harus 3–200 huruf.`.replace('  ', ' '));
    if (typeof k.bobot !== 'number' || !(k.bobot > 0) || k.bobot > 100) g.push(`${awalan}Bobot komponen "${nama}" harus lebih dari 0 dan paling besar 100.`);
    if (!Array.isArray(k.uraian) || k.uraian.length !== 4 || k.uraian.some(u => typeof u !== 'string' || u.length > 600))
      g.push(`${awalan}Uraian rubrik "${nama}" harus 4 tingkat, masing-masing paling banyak 600 huruf.`);
    if (k.cpl != null && (!Array.isArray(k.cpl) || k.cpl.length > 12 || k.cpl.some(c => typeof c !== 'string' || !KODE_CPL.test(c))
        || new Set(k.cpl).size !== k.cpl.length))
      g.push(`${awalan}Tanda CPL komponen "${nama}" harus daftar kode CPL berbeda (paling banyak 12).`);
  }
  const jumlah = bulat(komponen.reduce((a, k) => a + (+k.bobot || 0), 0));
  if (komponen.length && jumlah !== 100) g.push(`${awalan}Jumlah bobot komponen harus 100 (sekarang ${persen(jumlah)}).`);
}

/** Galat form penilaian (aturan sama dengan ta_rubrik_simpan); [] = sah. */
export function cekRubrik({ komponen = [], komponen_bimbingan = [], bobot_penguji, bobot_bimbingan = 0, batas_lulus, tingkat = TINGKAT_AWAL } = {}){
  const g = [];
  cekKomponen(komponen, '', g);
  if (typeof bobot_penguji !== 'number' || !(bobot_penguji >= 0 && bobot_penguji <= 100)) g.push('Bobot penguji 0–100 %.');
  if (typeof bobot_bimbingan !== 'number' || !(bobot_bimbingan >= 0 && bobot_bimbingan <= 100)) g.push('Bobot proses bimbingan 0–100 %.');
  else if (bobot_penguji + bobot_bimbingan > 100) g.push('Bobot penguji + proses bimbingan paling besar 100 % (sisanya bobot pembimbing saat seminar/sidang).');
  if (bobot_bimbingan > 0 || (komponen_bimbingan || []).length) cekKomponen(komponen_bimbingan || [], 'Proses bimbingan: ', g);
  if (typeof batas_lulus !== 'number' || batas_lulus < 1 || batas_lulus > 100) g.push('Batas lulus 1–100.');
  const t = tingkat || [];
  if (t.length !== 4 || t.some(x => typeof x !== 'number') || t[3] !== 0 || t[0] > 100 || !(t[0] > t[1] && t[1] > t[2] && t[2] > 0))
    g.push('Batas bawah 4 tingkat rubrik harus menurun dan tingkat terendah 0 (mis. 85, 70, 55, 0).');
  return g;
}

/** Indeks tingkat rubrik (0 = tertinggi) untuk satu nilai; null bila bukan angka. */
export function tingkatDari(v, tingkat = TINGKAT_AWAL){
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  const i = tingkat.findIndex(b => v >= b);
  return i < 0 ? tingkat.length - 1 : i;
}

/** Label rentang tiap tingkat: [85,70,55,0] -> ['≥ 85', '70–84', '55–69', '< 55']. */
export function labelTingkat(tingkat = TINGKAT_AWAL){
  const f = x => String(x).replace('.', ',');
  const bulatSemua = tingkat.every(Number.isInteger);
  return tingkat.map((b, i) => i === 0 ? `≥ ${f(b)}` : i === tingkat.length - 1 ? `< ${f(tingkat[i - 1])}`
    : bulatSemua ? `${f(b)}–${f(tingkat[i - 1] - 1)}` : `${f(b)} – < ${f(tingkat[i - 1])}`);
}

/**
 * Capaian CPL satu jadwal (181): rata-rata berbobot nilai komponen yang bertanda CPL itu. Tiap bagian (penguji, pembimbing saat
 * sidang, proses bimbingan) memakai rata-rata penilainya per komponen; bobot = bobot bagian x bobot komponen. Penilai yang dihitung
 * sama dengan rekapNilai (panel sekarang; penguji luar bila jadwal punya). Hasil [{cpl, nilai, komponen: [label]}] urut kode;
 * [] bila tidak ada komponen bertanda CPL atau belum ada nilai.
 */
export function capaianCPL({ rubrik, panel = [], nilai = [], penguji_luar = null }){
  const luar = !!String(penguji_luar || '').trim(), w = bobotBagian(rubrik);
  const nidnPeran = p => new Set(panel.filter(x => x.peran === p).map(x => x.nidn));
  const pg = nidnPeran('penguji'), pb = nidnPeran('pembimbing');
  const sem = nilai.filter(n => (n.bagian || 'seminar') === 'seminar'), bim = nilai.filter(n => n.bagian === 'bimbingan');
  const bagian = [[sem.filter(n => (n.nidn && pg.has(n.nidn)) || (!n.nidn && luar)), rubrik?.komponen, w.penguji],
                  [sem.filter(n => n.nidn && pb.has(n.nidn)), rubrik?.komponen, w.pembimbing],
                  [bim.filter(n => n.nidn && pb.has(n.nidn)), rubrik?.komponen_bimbingan, w.bimbingan]];
  const C = new Map();
  for (const [xs, komponen, b] of bagian) {
    if (!(b > 0) || !xs.length) continue;
    for (const k of komponen || []) {
      if (!(k.cpl || []).length) continue;
      const v = xs.map(n => n.nilai?.[k.kode]).filter(x => typeof x === 'number' && Number.isFinite(x));
      if (!v.length) continue;
      const r = v.reduce((a, x) => a + x, 0) / v.length, bb = b * +k.bobot;
      for (const c of k.cpl) {
        const t = C.get(c) || { jml: 0, bobot: 0, komponen: new Set() };
        t.jml += r * bb; t.bobot += bb; t.komponen.add(k.label); C.set(c, t);
      }
    }
  }
  return [...C.entries()].sort(([a], [b]) => urutCpl(a, b))
    .map(([cpl, t]) => ({ cpl, nilai: bulat(t.jml / t.bobot), komponen: [...t.komponen] }));
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tglPanjang = s => s ? new Date(String(s).slice(0, 10) + 'T00:00:00Z').toLocaleDateString('id-ID',
  { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '';
const tglWaktu = s => s ? new Date(s).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit',
  minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB' : '';

function tabelNilai(komponen, xs){
  return `<table class="garis"><thead><tr><th>Komponen</th><th class="n">Bobot</th>${xs.map(n =>
      `<th class="n">${esc(n.nama)}<br><span class="ket">${esc(PERAN_NILAI[n.peran] || n.peran)}</span></th>`).join('')}</tr></thead>
<tbody>${(komponen || []).map(k => `<tr><td>${esc(k.label)}</td><td class="n">${esc(persen(k.bobot))} %</td>${xs.map(n =>
      `<td class="n">${angka(n.nilai?.[k.kode])}</td>`).join('')}</tr>`).join('')}
<tr><th>Total</th><th class="n">100 %</th>${xs.map(n => `<th class="n">${angka(n.total)}</th>`).join('')}</tr></tbody></table>`;
}

/** Tabel capaian CPL untuk berita acara/rekap; rumusan = {kode: rumusan CPL} (opsional). '' bila kosong. */
export function capaianHtml(xs, rumusan = {}, kelas = 'garis'){
  if (!(xs || []).length) return '';
  return `<h2>Capaian CPL (sidang akhir)</h2>
<table class="${kelas}"><thead><tr><th>CPL</th><th class="n">Capaian</th><th>Dari komponen</th></tr></thead>
<tbody>${xs.map(c => `<tr><td><b>${esc(c.cpl)}</b>${rumusan?.[c.cpl] ? `<br><span class="ket">${esc(rumusan[c.cpl])}</span>` : ''}</td>
<td class="n">${angka(c.nilai)}</td><td>${esc(c.komponen.join('; '))}</td></tr>`).join('')}</tbody></table>`;
}

/**
 * Berita acara siap cetak (dokumen HTML utuh). x = hasil ta_nilai_rekap; info = { prodi, institusi }.
 * Belum ditetapkan -> tanda DRAF. Ditandatangani basah; pindaiannya diunggah sebagai bukti jadwal.
 */
export function htmlBA(x, info = {}){
  const j = x.jadwal || {}, r = x.rubrik || { komponen: [], bobot_penguji: 40, batas_lulus: 55 };
  const w = bobotBagian(r);
  const nilai = (x.nilai || []).filter(n => n.di_panel !== false);
  const h = rekapNilai({ rubrik: r, panel: x.panel || [], nilai, penguji_luar: j.penguji_luar });
  const akhir = j.ba_ditetapkan ? j.nilai_akhir : h.akhir;
  const draf = !j.ba_ditetapkan;
  const urutkan = xs => [...xs].sort((a, b) => (a.peran === b.peran ? 0 : a.peran === 'pembimbing' ? -1 : 1) || String(a.nama).localeCompare(String(b.nama)));
  const sem = urutkan(nilai.filter(n => (n.bagian || 'seminar') === 'seminar')), bim = urutkan(nilai.filter(n => n.bagian === 'bimbingan'));
  const penandatangan = [...(x.panel || []).map(p => ({ nama: p.nama, peran: p.peran })),
    ...(String(j.penguji_luar || '').trim() ? sem.filter(n => !n.nidn).map(n => ({ nama: n.nama, peran: 'penguji' })) : [])];
  const baris = (k, v) => `<tr><th>${esc(k)}</th><td>${v}</td></tr>`;
  const catatan = nilai.filter(n => n.catatan);
  return `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8">
<title>Berita acara ${esc(labelTahap(j.tahap).toLowerCase())} — ${esc(j.nama_mahasiswa)}</title>
<style>
  @page{size:A4;margin:18mm 16mm}
  :root{color-scheme:light} html{background:#fff}
  body{font-family:"Times New Roman",Times,serif;font-size:11.5pt;color:#000;background:#fff;margin:0;line-height:1.4}
  .kop{text-align:center;border-bottom:2px solid #000;padding-bottom:6px;margin-bottom:12px}
  .kop b{display:block;font-size:13pt} h1{font-size:13.5pt;text-align:center;margin:10px 0 12px;letter-spacing:.5px}
  table{border-collapse:collapse;width:100%;margin:6px 0 12px} td,th{padding:4px 6px;vertical-align:top;text-align:left}
  table.garis td,table.garis th{border:1px solid #000} table.garis th{background:#eee;font-weight:bold}
  table.id th{width:150px;font-weight:normal} td.n,th.n{text-align:right;white-space:nowrap}
  .ttd{display:grid;grid-template-columns:repeat(2,1fr);gap:18px 30px;margin-top:14px;page-break-inside:avoid}
  .ttd div{min-height:92px;display:flex;flex-direction:column;justify-content:space-between}
  .draf{position:fixed;top:40%;left:0;right:0;text-align:center;font-size:64pt;color:rgba(200,0,0,.13);transform:rotate(-24deg);pointer-events:none}
  .ket{font-size:9.5pt;color:#333} h2{font-size:11.5pt;margin:14px 0 4px}
  @media screen{body{max-width:800px;margin:20px auto;padding:0 16px}}
</style></head><body>
${draf ? '<div class="draf" aria-hidden="true">DRAF</div>' : ''}
<div class="kop"><b>${esc([info.prodi ? 'Program Studi ' + info.prodi : '', info.institusi].filter(Boolean).join(' · ') || 'Program Studi')}</b></div>
<h1>BERITA ACARA ${esc(labelTahap(j.tahap).toUpperCase())} TUGAS AKHIR</h1>
${draf ? '<p class="ket"><b>Draf:</b> berita acara belum ditetapkan koordinator TA; nilai masih bisa berubah.</p>' : ''}
<table class="id">
${baris('Nama mahasiswa', esc(j.nama_mahasiswa))}${baris('NIM', esc(j.nim || '–'))}${baris('Judul', esc(j.judul))}
${baris('Hari, tanggal', esc(tglPanjang(j.tanggal)))}${baris('Waktu', esc(j.jam || '–'))}${baris('Tempat', esc(j.ruang || '–'))}
</table>
<h2>Nilai ${esc(labelTahap(j.tahap).toLowerCase())} per penilai</h2>
${tabelNilai(r.komponen, sem)}
${w.bimbingan > 0 ? `<h2>Nilai proses bimbingan</h2>${tabelNilai(r.komponen_bimbingan, bim)}` : ''}
<table class="garis" style="width:auto;min-width:60%"><tbody>
${w.penguji > 0 ? `<tr><td>Rata-rata penguji (bobot ${esc(persen(w.penguji))} %)</td><td class="n">${angka(h.rataPenguji)}</td></tr>` : ''}
${w.pembimbing > 0 ? `<tr><td>Rata-rata pembimbing saat ${esc(j.tahap === 'sidang_akhir' ? 'sidang' : 'seminar')} (bobot ${esc(persen(w.pembimbing))} %)</td><td class="n">${angka(h.rataPembimbing)}</td></tr>` : ''}
${w.bimbingan > 0 ? `<tr><td>Rata-rata proses bimbingan (bobot ${esc(persen(w.bimbingan))} %)</td><td class="n">${angka(h.rataBimbingan)}</td></tr>` : ''}
<tr><th>Nilai akhir</th><th class="n">${angka(akhir)}</th></tr>
<tr><td>Batas lulus</td><td class="n">${angka(r.batas_lulus)}</td></tr>
<tr><th>Hasil</th><th class="n">${esc(j.hasil ? HASIL_LABEL[j.hasil] : (h.saran === 'mengulang' ? 'Mengulang' : '(belum ditetapkan)'))}</th></tr>
${j.hasil === 'lulus_revisi' ? `<tr><td>Tenggat revisi</td><td class="n">${esc(tglPanjang(j.batas_revisi))}</td></tr>` : ''}
</tbody></table>
${j.hasil === 'lulus_revisi' && j.catatan_revisi ? `<h2>Catatan revisi</h2><p>${esc(j.catatan_revisi).replace(/\n/g, '<br>')}</p>` : ''}
${capaianHtml(j.tahap === TAHAP_CPL ? capaianCPL({ rubrik: r, panel: x.panel || [], nilai, penguji_luar: j.penguji_luar }) : [], info.cpl)}
${catatan.length ? `<h2>Catatan penilai</h2>${catatan.map(n => `<p><b>${esc(n.nama)}</b>${n.bagian === 'bimbingan' ? ' (proses bimbingan)' : ''}: ${esc(n.catatan).replace(/\n/g, '<br>')}</p>`).join('')}` : ''}
<p class="ket">Form penilaian ${esc(labelTahap(j.tahap).toLowerCase())} versi ${esc(r.versi ?? '–')}. Nilai resmi diisikan ke SIUP.
${j.ba_ditetapkan ? ` Ditetapkan ${esc(tglWaktu(j.ba_ditetapkan))}${j.ba_oleh ? ' oleh ' + esc(j.ba_oleh) : ''}.` : ''}</p>
<div class="ttd">${penandatangan.map(p => `<div><span>${esc(PERAN_NILAI[p.peran] || p.peran)},</span><span><b>${esc(p.nama)}</b></span></div>`).join('')}
<div><span>Mengetahui, Koordinator TA,</span><span>(..............................................)</span></div></div>
</body></html>`;
}

/**
 * Lembar Excel nilai akhir untuk disalin ke SIUP (177, pemilik 2026-11-25): satu baris per seminar/sidang yang berita acaranya
 * sudah ditetapkan. rows = jadwal_ta [{tanggal, tahap, nim, nama_mahasiswa, judul, nilai_akhir, hasil, pembimbing, penguji,
 * penguji_luar, ba_ditetapkan, siup_diunggah}]; dosen = {nidn: nama}. Nilai akhir tetap angka (bukan teks) supaya bisa dihitung.
 */
export function lembarSiup(rows, dosen = {}){
  const nm = xs => (xs || []).map(n => dosen[n] || n).join('; ');
  const tgl = s => s ? String(s).slice(0, 10) : '';
  return [['No', 'NIM', 'Nama', 'Tahap', 'Tanggal', 'Nilai akhir', 'Hasil', 'Judul', 'Pembimbing', 'Penguji', 'Berita acara ditetapkan', 'Diunggah ke SIUP'],
    ...[...rows].filter(r => r.ba_ditetapkan).sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)) || String(a.nim).localeCompare(String(b.nim)))
      .map((r, i) => [i + 1, r.nim || '', r.nama_mahasiswa || '', labelTahap(r.tahap), tgl(r.tanggal), r.nilai_akhir == null ? '' : +r.nilai_akhir,
        HASIL_LABEL[r.hasil] || '', r.judul || '', nm(r.pembimbing), [nm(r.penguji), r.penguji_luar].filter(Boolean).join('; '),
        tgl(r.ba_ditetapkan), r.siup_diunggah ? tgl(r.siup_diunggah) : 'belum'])];
}

/**
 * Arsip TA satu mahasiswa (178, pemilik 2026-11-25): dokumen HTML utuh untuk dijadikan PDF oleh Apps Script (ta_arsip_simpan)
 * atau dicetak. a = { nim, nama, judul, lulus, pembimbing: 'nama; nama', jadwal: jadwal_ta mahasiswa itu,
 * rekap: hasil ta_nilai_rekap untuk jadwal yang berita acaranya ditetapkan, bimbingan: ta_bimbingan [+ pembimbing (nama)] };
 * info = { prodi, institusi, oleh, kini }. Berita acara memakai isi htmlBA yang sama (tiap tahap di halaman baru).
 */
export function htmlArsipTA(a, info = {}){
  const urutT = { seminar_proposal: 1, seminar_kemajuan: 2, sidang_akhir: 3 };
  const jadwal = [...(a.jadwal || [])].filter(j => j.status !== 'batal')
    .sort((x, y) => (urutT[x.tahap] - urutT[y.tahap]) || String(x.tanggal).localeCompare(String(y.tanggal)));
  const rekap = [...(a.rekap || [])].sort((x, y) => (urutT[x.jadwal.tahap] - urutT[y.jadwal.tahap]) || String(x.jadwal.tanggal).localeCompare(String(y.jadwal.tanggal)));
  const ba = rekap.map(r => htmlBA(r, info));
  const gaya = (ba[0] || htmlBA({ jadwal: {}, rubrik: { komponen: [] } }, info)).match(/<style>([\s\S]*?)<\/style>/)[1];
  const badan = h => h.match(/<body>([\s\S]*?)<\/body>/)[1].replace(/<div class="draf"[^>]*>DRAF<\/div>/, '');
  const kini = info.kini ? new Date(info.kini) : new Date();
  const bim = [...(a.bimbingan || [])].sort((x, y) => String(x.tanggal).localeCompare(String(y.tanggal)) || x.id - y.id);
  const baris = (k, v) => `<tr><th>${esc(k)}</th><td>${v}</td></tr>`;
  return `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8">
<title>Arsip TA — ${esc(a.nim)} ${esc(a.nama)}</title>
<style>${gaya}
  .halaman{page-break-before:always;break-before:page}
  table.kecil td,table.kecil th{font-size:10pt}
</style></head><body>
<div class="kop"><b>${esc([info.prodi ? 'Program Studi ' + info.prodi : '', info.institusi].filter(Boolean).join(' · ') || 'Program Studi')}</b></div>
<h1>ARSIP TUGAS AKHIR</h1>
<table class="id">${baris('Nama mahasiswa', esc(a.nama))}${baris('NIM', esc(a.nim))}${baris('Judul', esc(a.judul || '–'))}
${baris('Pembimbing', esc(a.pembimbing || '–'))}${baris('Lulus sidang akhir', esc(tglPanjang(a.lulus) || '–'))}</table>
<h2>Seminar dan sidang</h2>
<table class="garis kecil"><thead><tr><th>Tahap</th><th>Tanggal</th><th>Status</th><th>Hasil</th><th class="n">Nilai akhir</th><th>Berita acara</th></tr></thead>
<tbody>${jadwal.map(j => `<tr><td>${esc(labelTahap(j.tahap))}</td><td>${esc(tglPanjang(j.tanggal))}</td><td>${esc(j.status || '')}</td>
  <td>${esc(HASIL_LABEL[j.hasil] || '–')}${j.hasil === 'lulus_revisi' ? (j.revisi_selesai ? `; revisi selesai ${esc(tglPanjang(j.revisi_selesai))}` : '; revisi belum selesai') : ''}</td>
  <td class="n">${angka(j.nilai_akhir)}</td><td>${j.ba_ditetapkan ? `ditetapkan ${esc(tglPanjang(j.ba_ditetapkan))}` : 'tanpa penilaian di situs'}</td></tr>`).join('')
  || '<tr><td colspan="6">Tidak ada catatan seminar/sidang.</td></tr>'}</tbody></table>
<h2>Riwayat bimbingan (${bim.length})</h2>
<table class="garis kecil"><thead><tr><th class="n">No</th><th>Tanggal</th><th>Cara</th><th>Pembimbing</th><th>Topik dan arahan</th><th>Konfirmasi</th></tr></thead>
<tbody>${bim.map((b, i) => { const st = statusBimbingan(b, kini); return `<tr><td class="n">${i + 1}</td><td>${esc(tglPanjang(b.tanggal))}</td>
  <td>${esc(labelCara(b.cara))}</td><td>${esc(b.pembimbing || '')}</td><td>${esc(b.topik)}${b.arahan ? `<br><span class="ket">Arahan: ${esc(b.arahan)}</span>` : ''}</td>
  <td>${esc(st.label)}${b.catatan_pembimbing ? `<br><span class="ket">${esc(b.catatan_pembimbing)}</span>` : ''}</td></tr>`; }).join('')
  || '<tr><td colspan="6">Belum ada catatan bimbingan di situs.</td></tr>'}</tbody></table>
<p class="ket">Arsip dibuat ${esc(tglWaktu(kini.toISOString()))}${info.oleh ? ' oleh ' + esc(info.oleh) : ''} dari situs prodi.
  Berita acara bertanda tangan basah disimpan terpisah (pindaian di Data prodi › Jadwal seminar/sidang TA). Nilai resmi ada di SIUP.</p>
${ba.map(h => `<div class="halaman">${badan(h)}</div>`).join('\n')}
</body></html>`;
}

/**
 * Lembar Excel nilai per komponen untuk SIUP (179, pemilik 2026-11-25: "nilai per komponen yang diinput dosen pembimbing
 * dan penguji; dosen pembimbing yang upload"): satu baris per penilai per komponen, lalu baris total penilai itu.
 * rows = jadwal_ta yang berita acaranya ditetapkan; nilai = ta_nilai [{jadwal_id, rubrik_id, bagian, peran, penilai_nama,
 * nilai, total}]; rubrik = ta_rubrik [{id, komponen, komponen_bimbingan}].
 */
export function lembarKomponenSiup(rows, nilai = [], rubrik = []){
  const out = [['No', 'NIM', 'Nama', 'Tahap', 'Tanggal', 'Penilai', 'Peran', 'Bagian', 'Komponen', 'Bobot (%)', 'Nilai']];
  const urutPeran = { pembimbing: 0, penguji: 1 }, urutBagian = { seminar: 0, bimbingan: 1 };
  let no = 0;
  for (const j of [...rows].filter(r => r.ba_ditetapkan)
    .sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)) || String(a.nim).localeCompare(String(b.nim)))) {
    const xs = nilai.filter(n => n.jadwal_id === j.id).sort((a, b) => (urutBagian[a.bagian || 'seminar'] - urutBagian[b.bagian || 'seminar'])
      || (urutPeran[a.peran] - urutPeran[b.peran]) || String(a.penilai_nama).localeCompare(String(b.penilai_nama)));
    for (const n of xs) {
      const r = rubrik.find(x => x.id === n.rubrik_id) || {}, bimb = n.bagian === 'bimbingan';
      const awal = [j.nim || '', j.nama_mahasiswa || '', labelTahap(j.tahap), String(j.tanggal || '').slice(0, 10), n.penilai_nama,
        PERAN_NILAI[n.peran] || n.peran, bimb ? 'Proses bimbingan' : labelTahap(j.tahap)];
      for (const k of (bimb ? r.komponen_bimbingan : r.komponen) || [])
        out.push([++no, ...awal, k.label, +k.bobot, n.nilai?.[k.kode] == null ? '' : +n.nilai[k.kode]]);
      out.push([++no, ...awal, 'Total (rata-rata berbobot)', 100, n.total == null ? '' : +n.total]);
    }
  }
  return out;
}

/**
 * Lembar unggah SIUP (pemilik 2026-11-25, tangkapan layar "Daftar Komponen Kelas - Tugas Akhir-<pembimbing> 2026-1"): kelas TA
 * di SIUP per pembimbing, tiga komponen tetap untuk SIDANG AKHIR:
 *   Sidang (72273) 40 % "Penguji - Sidang"; Sidang (72274) 10 % "Pembimbing - Sidang"; Bimbingan (72275) 50 % "Pembimbing - Bimbingan".
 * Nilai komponen = rata-rata dosen peran itu (dua penguji = rata-rata keduanya; sama dengan membagi bobot ke jumlah dosen,
 * keinginan pemilik); penguji luar dihitung penguji. Judul kolom mengikuti ekspor SIUP yang pernah diunggah pemilik
 * ("<nama komponen> (<detail>) (xx.00%)", mis. "Bimbingan (Institusi) (40.00%)"); bobot dari form penilaian sidang (harus sama
 * dengan SIUP). Seminar proposal/kemajuan tidak punya komponen di SIUP (tidak masuk lembar ini).
 * Satu lembar per kelas = pembimbing 1. rows = jadwal_ta (berita acara ditetapkan); nilai = ta_nilai; rubrik = ta_rubrik;
 * dosen = {nidn: nama}. Hasil { lembar: [{nama, baris}], keterangan: [[...]] }.
 */
export function lembarSiupPeran(rows, nilai = [], rubrik = [], dosen = {}){
  const persen = w => (Math.round(w * 100) / 100).toFixed(2);
  const rata = xs => xs.length ? bulat(xs.reduce((a, n) => a + +n.total, 0) / xs.length) : '';
  const kelas = new Map(), ket = [['Kelas (pembimbing 1)', 'NIM', 'Nama', 'Komponen', 'Dosen yang dirata-rata']];
  for (const j of [...rows].filter(r => r.ba_ditetapkan && r.tahap === 'sidang_akhir')
    .sort((a, b) => String(a.nim).localeCompare(String(b.nim)))) {
    const xs = nilai.filter(n => n.jadwal_id === j.id);
    const w = bobotBagian(rubrik.find(x => x.id === (j.rubrik_id ?? xs[0]?.rubrik_id)) || {});
    const pg = xs.filter(n => (n.bagian || 'seminar') === 'seminar' && n.peran === 'penguji');
    const pb = xs.filter(n => (n.bagian || 'seminar') === 'seminar' && n.peran === 'pembimbing');
    const bm = xs.filter(n => n.bagian === 'bimbingan');
    const kolom = [['Sidang (Penguji - Sidang)', w.penguji, pg], ['Sidang (Pembimbing - Sidang)', w.pembimbing, pb],
                   ['Bimbingan (Pembimbing - Bimbingan)', w.bimbingan, bm]];
    const p1 = (j.pembimbing || [])[0], nmKelas = String(dosen[p1] || p1 || 'Tanpa pembimbing');
    const judul = kolom.map(([k, b]) => `${k} (${persen(b)}%)`);
    const kunci = nmKelas + '|' + judul.join('|');
    if (!kelas.has(kunci)) kelas.set(kunci, { nama: ('TA ' + nmKelas).replace(/[\/?*[\]:]/g, ' ').slice(0, 31), baris: [['No', 'NIM', 'Nama', ...judul, 'Nilai Akhir']] });
    const g = kelas.get(kunci);
    g.baris.push([g.baris.length, j.nim || '', j.nama_mahasiswa || '', ...kolom.map(([, , d]) => rata(d)), j.nilai_akhir == null ? '' : +j.nilai_akhir]);
    for (const [k, , d] of kolom) ket.push([nmKelas, j.nim || '', j.nama_mahasiswa || '', k, d.map(n => n.penilai_nama).join('; ')]);
  }
  // Nama lembar unik (maks. 31 huruf): pembimbing sama dengan bobot form berbeda mendapat akhiran.
  const lembar = [...kelas.values()], dipakai = new Map();
  for (const l of lembar) { const n = (dipakai.get(l.nama) || 0) + 1; dipakai.set(l.nama, n); if (n > 1) l.nama = `${l.nama.slice(0, 26)} (${n})`; }
  return { lembar, keterangan: ket };
}

/**
 * Isi CSV unggah SIUP dari satu lembar lembarSiupPeran (pemilik 2026-11-25), meniru ekspor SIUP yang pernah diunggah:
 * pemisah ';', UTF-8 tanpa BOM, baris diakhiri LF; judul dikutip bila memuat spasi/tanda baca (No;NIM;Nama tidak);
 * data: No dan NIM tanpa kutip, Nama dikutip, nilai 2 desimal bertitik (85.00); sel kosong tetap kosong.
 */
export function csvSiup(baris){
  const kutip = s => `"${String(s).replace(/"/g, '""')}"`;
  const judul = baris[0].map(h => /^[A-Za-z0-9_]+$/.test(String(h)) ? String(h) : kutip(h)).join(';');
  const data = baris.slice(1).map(r => r.map((v, i) => i === 0 || i === 1 ? String(v ?? '') : i === 2 ? kutip(v ?? '')
    : v === '' || v == null ? '' : (+v).toFixed(2)).join(';'));
  return [judul, ...data].join('\n') + '\n';
}
