// Simulasi PJP butir 18 LAM Teknik (pemilik 2026-11-19): logika halaman pjp.html. Tanpa DOM (tests/js/pjp.test.mjs).
// PJP = JP / JB dengan JP = sks praktikum/praktik lapangan/penugasan x 50 dan JB = sks x 50 dari Tabel 3.a.1 LKPS
// (docs/analisis-instrumen-lam-teknik-2025.md:103); skor memakai rumus butir 18 di butir-manual.js (satu sumber).
// Data = ref_mata_kuliah (sks, sks_kuliah, sks_seminar, sks_praktikum). Simulasi tidak mengubah data.
import { BUTIR_MANUAL } from './butir-manual.js?v=2026-11-22-866c27';

const angka = v => { const x = +String(v ?? '').replace(',', '.'); return Number.isFinite(x) ? x : 0; };
const bulat = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
const B18 = BUTIR_MANUAL.find(b => b.no === '18');
/** Skor butir 18 dari JP dan JB (menit atau sks; yang dipakai rasionya). null bila JB 0. */
export const skor18 = (jp, jb) => B18.hitung.f(jp, jb);

export const BASIS = [['wajib', 'MK wajib'], ['semua', 'Semua MK aktif']];
export const praktikSaatIni = m => angka(m.sks_praktikum);

/** Tanda data yang perlu diperiksa di Data prodi › Mata kuliah. */
export function catatanMK(m){
  const out = [], sks = angka(m.sks), pecah = angka(m.sks_kuliah) + angka(m.sks_seminar) + angka(m.sks_praktikum);
  if (/praktikum|praktik\b|studio|bengkel/i.test(m.nama || '') && !praktikSaatIni(m)) out.push('namanya praktikum/praktik, tetapi sks praktikum 0');
  if ((m.sks_kuliah != null || m.sks_praktikum != null) && bulat(pecah) !== bulat(sks)) out.push(`sebaran ${bulat(pecah)} sks ≠ ${bulat(sks)} sks MK`);
  return out;
}

/**
 * mks = baris ref_mata_kuliah satu kurikulum; sim = {kode: sks praktik simulasi}; basis 'wajib' | 'semua'.
 * Hasil { baris: [{...mk, praktik, simulasi, ubah, catatan}], jb, jp, jpSim, pjp, pjpSim, skor, skorSim, kurang20, kurang20Sim }.
 * jp/jb dalam sks (menit = x 50; rasionya sama). kurang20 = sks praktik yang masih kurang untuk PJP 20%.
 */
export function hitungPjp(mks = [], sim = {}, basis = 'wajib'){
  const xs = mks.filter(m => m.aktif !== false && (basis === 'semua' || m.sifat !== 'pilihan'));
  const baris = xs.map(m => {
    const praktik = praktikSaatIni(m), s = sim[m.kode];
    const simulasi = s == null || s === '' ? praktik : Math.min(angka(m.sks), Math.max(0, angka(s)));
    return { ...m, praktik, simulasi, ubah: bulat(simulasi - praktik), catatan: catatanMK(m) };
  });
  const jb = bulat(baris.reduce((a, r) => a + angka(r.sks), 0)), jp = bulat(baris.reduce((a, r) => a + r.praktik, 0));
  const jpSim = bulat(baris.reduce((a, r) => a + r.simulasi, 0));
  const persen = v => (jb ? bulat(100 * v / jb) : 0);
  return { baris, jb, jp, jpSim, pjp: persen(jp), pjpSim: persen(jpSim), skor: jb ? bulat(skor18(jp, jb)) : null,
           skorSim: jb ? bulat(skor18(jpSim, jb)) : null, kurang20: bulat(Math.max(0, 0.2 * jb - jp)), kurang20Sim: bulat(Math.max(0, 0.2 * jb - jpSim)) };
}

// ---------- Kalkulator per MK (pemilik 2026-11-19): tugas besar/penugasan hanya di sebagian pekan ----------
// 1 sks = 45 jam = 2700 menit kegiatan per semester (Panduan Pengisian RPS K26); untuk sks praktik/penugasan boleh tidak
// dibagi rata per pekan. Dua tafsiran (instrumen tidak merinci): hanya kegiatan terjadwal/terdampingi, atau termasuk kerja
// di luar kelas yang berlogbook. Pekan 8 (UTS) dan 16 (UAS) tidak dihitung bila masuk rentang.
export const MENIT_PER_SKS = 2700;
export function hitungPekan({ mulai = 12, akhir = 15, terjadwal = 50, luar = 0, target = 1 } = {}){
  const a = Math.max(1, Math.min(16, Math.round(angka(mulai)))), z = Math.max(a, Math.min(16, Math.round(angka(akhir))));
  const pekan = Array.from({ length: z - a + 1 }, (_, i) => a + i).filter(p => p !== 8 && p !== 16);
  const n = pekan.length, t = Math.max(0, angka(terjadwal)), l = Math.max(0, angka(luar)), tg = Math.max(0, angka(target));
  const menitTerjadwal = n * t, menitLuar = n * l, total = menitTerjadwal + menitLuar, perlu = tg * MENIT_PER_SKS;
  return { pekan, n, menitTerjadwal, menitLuar, total, perlu,
           sksTerjadwal: bulat(menitTerjadwal / MENIT_PER_SKS), sksTotal: bulat(total / MENIT_PER_SKS),
           perluPerPekan: n ? Math.ceil(perlu / n) : null,
           cukupTerjadwal: perlu > 0 && menitTerjadwal >= perlu, cukupTotal: perlu > 0 && total >= perlu };
}

/** CSV hasil simulasi (pemisah titik koma, desimal koma) untuk rapat kurikulum. */
export function csvPjp(H){
  const k = v => (v == null || v === '' || !Number.isFinite(+v) ? '' : (+v).toFixed(2).replace('.', ','));   // dua desimal, koma
  const sel = v => (/[;"\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v ?? ''));
  return ['kode;nama;semester;sifat;sks;sks praktik sekarang;sks praktik simulasi;perubahan;catatan',
    ...H.baris.map(r => [r.kode, r.nama, r.semester ?? '', r.sifat ?? '', k(r.sks), k(r.praktik), k(r.simulasi), k(r.ubah), r.catatan.join('; ')].map(sel).join(';')),
    '', `JB (sks);${k(H.jb)}`, `JP sekarang (sks);${k(H.jp)}`, `PJP sekarang (%);${k(H.pjp)}`, `Skor butir 18 sekarang;${k(H.skor)}`,
    `JP simulasi (sks);${k(H.jpSim)}`, `PJP simulasi (%);${k(H.pjpSim)}`, `Skor butir 18 simulasi;${k(H.skorSim)}`].join('\n');
}
