// Rekap RPS tingkat kurikulum (pemilik 2026-11-19): logika halaman rps-kurikulum.html. Tanpa DOM (tests/js/rps_kurikulum.test.mjs).
// 1. Kalender asesmen per semester kurikulum: MK x pekan dari rencana pekanan RPS (versi disahkan bila ada), untuk melihat
//    penumpukan tugas/kuis di pekan yang sama.
// 2. Peta CPL dari bagian B (mk_struktur): CPL x semester berisi MK yang benar-benar menilai CPL itu (Sub-CPMK berbobot),
//    tingkat Bloom tertinggi, ranah A/P; CPL yang dibebankan di peta MK-CPL tetapi tidak dinilai; HOTS rata-rata per tahun.
import { rentangPekan, bloom, bobotSub, hots, TARGET_HOTS } from './rps.js?v=2026-11-19-1cfd97';

const kunci = (kur, kode) => `${kur}|${kode}`;
const urutSem = s => (s === '' ? 99 : +s || 98);
const bulat = v => Math.round(v * 100) / 100;

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
