// Rekap RPS tingkat kurikulum (pemilik 2026-11-19): logika halaman rps-kurikulum.html. Tanpa DOM (tests/js/rps_kurikulum.test.mjs).
// 1. Kalender asesmen per semester kurikulum: MK x pekan dari rencana pekanan RPS (versi disahkan bila ada), untuk melihat
//    penumpukan tugas/kuis di pekan yang sama.
// 2. Peta CPL dari bagian B (mk_struktur): CPL x semester berisi MK yang benar-benar menilai CPL itu (Sub-CPMK berbobot),
//    tingkat Bloom tertinggi, ranah A/P; CPL yang dibebankan di peta MK-CPL tetapi tidak dinilai; HOTS rata-rata per tahun.
import { rentangPekan, bloom, bobotSub, hots, TARGET_HOTS, KESIMPULAN_REVIEW } from './rps.js?v=2026-11-22-866c27';

const kunci = (kur, kode) => `${kur}|${kode}`;
const urutSem = s => (s === '' ? 99 : +s || 98);
const bulat = v => Math.round(v * 100) / 100;

// Kemajuan RPS per MK (pemilik 2026-11-19: Kaprodi/admin memantau yang belum dibuat/diajukan/disahkan/ditandatangani).
// 121 (pemilik 2026-11-19): bukti = RPS elektronik lengkap (ditetapkan Dekan; tanpa Dekan aktif: disahkan); unggahan hanya RPS di luar situs.
export const STATUS_KEMAJUAN = [['belum', 'Belum dibuat'], ['draf', 'Draf'], ['revisi', 'Revisi berjalan'], ['diajukan', 'Diajukan'],
  ['dikembalikan', 'Dikembalikan'], ['disahkan', 'Disahkan, menunggu penetapan Dekan'], ['ttd', 'Lengkap (bukti akreditasi)']];

/**
 * Status kemajuan satu MK. r = baris mk_rps {status, sah, revisi, tetap_pada} atau null; ttd = baris mk_rps_ttd MK itu [{revisi, waktu}];
 * dekanAktif = jabatan Dekan sedang diisi. 'ttd' (lengkap) = ditetapkan Dekan secara elektronik, atau disahkan bila tidak ada Dekan
 * aktif; RPS di luar situs (tanpa r) lengkap bila ada unggahan bertanda tangan. Hasil { kode, lama } (lama dipertahankan: selalu false).
 */
export function statusKemajuan(r, ttd = [], dekanAktif = false){
  if (!r) return { kode: ttd.length ? 'ttd' : 'belum', lama: false };
  if (r.status === 'disahkan') return { kode: r.tetap_pada || !dekanAktif ? 'ttd' : 'disahkan', lama: false };
  if (r.status === 'draf') return { kode: r.sah ? 'revisi' : 'draf', lama: false };
  return { kode: r.status, lama: false };
}

/**
 * Kemajuan RPS satu kurikulum. rps = Map "kur|kode" -> mk_rps; ttd = Map "kur|kode" -> [mk_rps_ttd]; nama(m) -> [nama penyusun].
 * Hasil { jumlah: {kode: n}, total, baris: [{ m, kode, lama, penyusun, diperbarui }] } (baris urut kode; susun per semester di halaman).
 */
export function kemajuanRps({ mk = [], rps = new Map(), ttd = new Map(), kur, nama = () => [], review = new Map(), dekanAktif = false }){
  const xs = mk.filter(m => m.kurikulum === kur && m.aktif !== false).sort((a, b) => String(a.kode).localeCompare(String(b.kode)));
  const jumlah = Object.fromEntries(STATUS_KEMAJUAN.map(([k]) => [k, 0]));
  const baris = xs.map(m => {
    const r = rps.get(kunci(kur, m.kode)) || null, s = statusKemajuan(r, ttd.get(kunci(kur, m.kode)) || [], dekanAktif);
    jumlah[s.kode] = (jumlah[s.kode] || 0) + 1;
    return { m, ...s, penyusun: nama(m), diperbarui: r?.diperbarui || '', review: review.get(kunci(kur, m.kode)) || null };
  });
  return { jumlah, total: xs.length, baris };
}

/** CSV kemajuan (bahan rapat): kode, nama, semester, status, penyusun, diperbarui. Pemisah koma, sel dikutip. */
export function csvKemajuan(h){
  const label = Object.fromEntries(STATUS_KEMAJUAN), q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rv = b => b.review || {};
  return [['kode', 'nama', 'semester', 'sifat', 'status', 'penyusun', 'diperbarui', 'review_terkirim', 'kesimpulan_review', 'rerata_review', 'ditanggapi'],
    ...h.baris.map(b => [b.m.kode, b.m.nama, b.m.semester ?? '', b.m.sifat ?? '', label[b.kode] + (b.lama ? ' (tanda tangan versi lama)' : ''),
      b.penyusun.join('; '), String(b.diperbarui).slice(0, 10), b.review ? `${rv(b).terkirim}/${rv(b).ditunjuk}` : '',
      (rv(b).kesimpulan || []).map(k => LABEL_KES[k] || k).join('; '), rv(b).rerata == null ? '' : String(rv(b).rerata).replace('.', ','),
      b.review ? `${rv(b).ditanggapi}/${rv(b).terkirim}` : ''])].map(r => r.map(q).join(',')).join('\r\n') + '\r\n';
}

/** Versi RPS yang dipakai rekap: salinan disahkan bila ada, selain itu isian terakhir. null = belum ada RPS. */
export function versiRps(r){
  if (r?.sah?.rps) return { data: r.sah.rps, versi: r.status === 'disahkan' ? 'disahkan' : 'disahkan (revisi berjalan)' };
  return r?.data ? { data: r.data, versi: r.status || 'draf' } : null;
}

/** Semester MK aktif satu kurikulum, urut; '' = MK pilihan tanpa semester (paling akhir). */
export function semesterKurikulum(mk = [], kur){
  return [...new Set(mk.filter(m => m.kurikulum === kur && m.aktif !== false).map(m => String(m.semester ?? '')))].sort((a, b) => urutSem(a) - urutSem(b));
}

/**
 * Kalender asesmen satu semester kurikulum. rps = Map "kur|kode" -> baris mk_rps {data, status, sah}.
 * Hasil { baris: [{ kode, nama, sks, versi, pekan: {n: [nama asesmen]} }], perPekan: [{ pekan, n }], maks, tanpaRps }.
 * perPekan menghitung asesmen di pekan kuliah (UTS/UAS tidak dihitung).
 */
export function kalenderAsesmen({ mk = [], rps = new Map(), kur, semester }){
  const xs = mk.filter(m => m.kurikulum === kur && m.aktif !== false && String(m.semester ?? '') === String(semester))
    .sort((a, b) => String(a.kode).localeCompare(String(b.kode)));
  const baris = xs.map(m => {
    const v = versiRps(rps.get(kunci(kur, m.kode))), pekan = {};
    for (const p of v?.data?.pekan || []) {
      const ns = p.jenis === 'kuliah' ? (p.asesmen || []) : [p.jenis === 'uts' ? 'UTS' : 'UAS'];
      if (ns.length) for (const n of rentangPekan(p.pekan)) (pekan[n] ||= []).push(...ns);
    }
    return { kode: m.kode, nama: m.nama, sks: m.sks, versi: v?.versi || 'belum ada', pekan };
  });
  const perPekan = Array.from({ length: 16 }, (_, i) => i + 1)
    .map(n => ({ pekan: n, n: baris.reduce((t, b) => t + (b.pekan[n] || []).filter(x => x !== 'UTS' && x !== 'UAS').length, 0) }));
  return { baris, perPekan, maks: Math.max(0, ...perPekan.map(x => x.n)), tanpaRps: baris.filter(b => b.versi === 'belum ada').length };
}

/**
 * Peta CPL kurikulum dari bagian B. struktur = Map "kur|kode" -> mk_struktur.data; petaMk = ref_mk_cpl.
 * Hasil { sems, baris: [{ kode, rumusan, sel: {semester: [{kode, nama, level, ranah, bobot}]}, nMk, levelMax, tanpaNilai }],
 *         belumStruktur: [kode], hotsTahun: [{ tahun, n, rata, target }] }.
 */
export function petaCplKurikulum({ mk = [], struktur = new Map(), refCpl = [], petaMk = [], kur }){
  const cpl = refCpl.filter(c => c.kurikulum === kur)
    .sort((a, b) => (a.urutan ?? 0) - (b.urutan ?? 0) || String(a.kode).localeCompare(String(b.kode)));
  const mks = mk.filter(m => m.kurikulum === kur && m.aktif !== false).sort((a, b) => String(a.kode).localeCompare(String(b.kode)));
  const baris = cpl.map(c => {
    const sel = {}, tanpaNilai = [];
    let nMk = 0, lvMax = 0;
    for (const m of mks) {
      const S = struktur.get(kunci(kur, m.kode));
      const subs = (S?.sub || []).filter(x => x.cpl === c.kode && bobotSub(S, x.kode) > 0);
      if (!subs.length) {
        if (S && petaMk.some(p => p.kurikulum === kur && p.kode_mk === m.kode && p.cpl === c.kode)) tanpaNilai.push(m.kode);
        continue;
      }
      const b = subs.map(x => bloom(x.rumusan)), lv = Math.max(0, ...b.map(x => x.c));
      (sel[String(m.semester ?? '')] ||= []).push({ kode: m.kode, nama: m.nama, level: lv ? `C${lv}` : '',
        ranah: [...new Set(b.flatMap(x => x.kode.filter(k => k[0] !== 'C')))], bobot: bulat(subs.reduce((t, x) => t + bobotSub(S, x.kode), 0)) });
      nMk += 1; lvMax = Math.max(lvMax, lv);
    }
    return { kode: c.kode, rumusan: c.rumusan || '', sel, nMk, levelMax: lvMax ? `C${lvMax}` : '', tanpaNilai };
  });
  const per = {};
  for (const m of mks) {
    const S = struktur.get(kunci(kur, m.kode));
    if (!S?.sub?.length) continue;
    const h = hots(S, m.semester);
    if (h.tahun) (per[h.tahun] ||= []).push(h.persen);
  }
  return { sems: semesterKurikulum(mk, kur), baris,
           belumStruktur: mks.filter(m => !struktur.get(kunci(kur, m.kode))?.sub?.length).map(m => m.kode),
           hotsTahun: Object.entries(per).map(([t, xs]) => ({ tahun: +t, n: xs.length, rata: bulat(xs.reduce((a, v) => a + v, 0) / xs.length), target: TARGET_HOTS[t] }))
             .sort((a, b) => a.tahun - b.tahun) };
}

// ---------- Review sejawat di Kemajuan RPS (119, pemilik 2026-11-19) ----------
// review per MK = baris rps_review_rekap {ditunjuk, terkirim, kesimpulan: [..], rerata, ditanggapi}.
const LABEL_KES = Object.fromEntries(KESIMPULAN_REVIEW);
/** Kategori saringan review: [kunci, label, cocok(baris kemajuan)]. */
export const KATEGORI_REVIEW = [
  ['direview', 'Sudah direview', b => (b.review?.terkirim || 0) > 0],
  ['menunggu', 'Reviewer belum mengirim', b => !!b.review && b.review.ditunjuk > b.review.terkirim],
  ['tanpa', 'RPS tanpa reviewer', b => b.kode !== 'belum' && !b.review],
  ['besar', 'Perlu perbaikan besar', b => (b.review?.kesimpulan || []).includes('perbaikan_besar')],
  ['belum_tanggap', 'Belum ditanggapi penyusun', b => !!b.review && b.review.terkirim > b.review.ditanggapi],
];
/** Jumlah MK per kategori review. */
export const jumlahReview = h => Object.fromEntries(KATEGORI_REVIEW.map(([k, , f]) => [k, h.baris.filter(f).length]));
/** Teks ringkas review satu MK, mis. "2/2 terkirim · rerata 3,4 · ditanggapi 1/2". */
export function teksReview(rv){
  if (!rv) return '';
  return [`${rv.terkirim}/${rv.ditunjuk} terkirim`, rv.rerata != null ? `rerata ${String(rv.rerata).replace('.', ',')}` : '',
    rv.terkirim ? `ditanggapi ${rv.ditanggapi}/${rv.terkirim}` : ''].filter(Boolean).join(' · ');
}
