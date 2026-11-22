// Tenggat RPS dan review (120, pemilik 2026-11-19): dipakai halaman Pengingat (admin mengirim manual), Tugas saya, dan RPS.
// Keputusan pemilik: tenggat RPS per semester ganjil/genap = RPS sudah DIAJUKAN ke Kaprodi; tenggat review = N hari sejak
// reviewer ditunjuk (pengaturan rps_review_hari, bawaan 14). Tanpa DOM.
import { paritas, penyusunMK } from './rps.js?v=2026-11-22-866c27';
import { tanggalPanjang } from './rps-docx.js?v=2026-11-22-866c27';

export const HARI_REVIEW_BAWAAN = 14;
export { tanggalPanjang };
// Tenggat RPS tampil (Tugas saya, Pengingat) bila tinggal <= 30 hari, atau sudah lewat <= 60 hari (tenggat semester lalu tidak).
export const HARI_TAMPIL = 30, HARI_LEWAT_MAKS = 60;
const SUDAH_DIAJUKAN = new Set(['diajukan', 'disahkan']);
const dua = n => String(n).padStart(2, '0');
const tglLokal = d => `${d.getFullYear()}-${dua(d.getMonth() + 1)}-${dua(d.getDate())}`;
/** Angka pengaturan TTTTBBHH -> 'TTTT-BB-HH' ('' bila kosong/tidak sah). */
export const isoDari = n => { const m = String(n ?? '').match(/^(\d{4})(\d{2})(\d{2})$/); return m ? `${m[1]}-${m[2]}-${m[3]}` : ''; };
/** Selisih hari dari hari ini (tanggal lokal) ke tanggal ISO; null bila kosong. Negatif = lewat. */
export const hariKe = (iso, kini = new Date()) => (iso ? Math.round((Date.parse(String(iso).slice(0, 10) + 'T00:00:00Z')
  - Date.parse(tglLokal(kini) + 'T00:00:00Z')) / 864e5) : null);
export const teksHari = h => (h == null ? '' : h < 0 ? `lewat ${-h} hari` : h === 0 ? 'hari ini' : `${h} hari lagi`);
/** Tenggat review satu penunjukan: v.tenggat dari basis data (120) bila ada, selain itu tanggal tunjuk + hari. */
export function tenggatReview(v, hari = HARI_REVIEW_BAWAAN){
  if (v?.tenggat) return String(v.tenggat).slice(0, 10);
  if (!v?.ditunjuk_pada) return '';
  const d = new Date(v.ditunjuk_pada); d.setDate(d.getDate() + (+hari || HARI_REVIEW_BAWAAN));
  return tglLokal(d);
}
const smtRps = r => r?.smt ?? r?.data?.identitas?.semester ?? '';
const teksStatus = r => (!r ? 'belum dibuat' : r.status === 'dikembalikan' ? 'dikembalikan, perlu diajukan ulang'
  : r.status === 'draf' && (r.sah || r.revisi > 0) ? 'revisi belum diajukan' : 'draf, belum diajukan');

/**
 * MK aktif yang RPS-nya belum diajukan padahal tenggat semesternya dekat/lewat. mk = ref_mata_kuliah; rps = Map 'kur|kode' ->
 * {status, sah|revisi, smt|data}; tenggat = {Ganjil: iso, Genap: iso}. Semester MK pilihan dari RPS-nya (identitas.semester).
 * Hasil [{ m, paritas, tenggat, hari, status }].
 */
export function mkTenggatRps({ mk = [], rps = new Map(), tenggat = {}, kini = new Date() } = {}){
  const out = [];
  for (const m of mk) {
    if (m.aktif === false) continue;
    const r = rps.get(`${m.kurikulum}|${m.kode}`), p = paritas(m.semester) || paritas(smtRps(r)), t = tenggat[p];
    if (!t || SUDAH_DIAJUKAN.has(r?.status)) continue;
    const hari = hariKe(t, kini);
    if (hari > HARI_TAMPIL || hari < -HARI_LEWAT_MAKS) continue;
    out.push({ m, paritas: p, tenggat: t, hari, status: teksStatus(r) });
  }
  return out;
}

const tambahKe = (peta, d, baris) => {
  if (!d?.email) return false;
  if (!peta.has(d.email)) peta.set(d.email, { nama: d.nama_gelar || d.nama, email: d.email, baris: [] });
  peta.get(d.email).baris.push(baris);
  return true;
};
const hasil = peta => [...peta.values()].map(p => ({ nama: p.nama, email: p.email, rinci: p.baris.join('\n') }));

/** Pengingat RPS belum diajukan, ke penyusun (koordinator MK dan pengampu kelas semester terakhir). */
export function penerimaTenggatRps({ mk = [], rps = new Map(), tenggat = {}, dosen = [], kelas = [], kini = new Date() } = {}){
  const per = new Map(), tanpaPenyusun = [];
  for (const x of mkTenggatRps({ mk, rps, tenggat, kini })) {
    const b = `- ${x.m.kode} ${x.m.nama}: ${x.status} (tenggat ${tanggalPanjang(x.tenggat)}, ${teksHari(x.hari)})`;
    const ps = penyusunMK(x.m, dosen, kelas).filter(d => tambahKe(per, d, b));
    if (!ps.length) tanpaPenyusun.push(x.m);
  }
  return { penerima: hasil(per), tanpaPenyusun };
}

/** Pengingat review belum dikirim, ke reviewer. review = baris mk_rps_review (admin membaca semua). */
export function penerimaReviewBelum({ review = [], mk = [], dosen = [], hari = HARI_REVIEW_BAWAAN, kini = new Date() } = {}){
  const per = new Map(), nm = new Map(mk.map(m => [`${m.kurikulum}|${m.kode}`, m.nama]));
  for (const v of review.filter(v => !v.kirim_pada)) {
    const t = tenggatReview(v, hari), d = dosen.find(x => x.id === v.reviewer_id);
    tambahKe(per, d, `- ${v.kode_mk} ${nm.get(`${v.kurikulum}|${v.kode_mk}`) || ''} (${v.kurikulum}): tenggat ${tanggalPanjang(t)}, ${teksHari(hariKe(t, kini))}`);
  }
  return hasil(per);
}

/** Pengingat review belum ditanggapi, ke penyusun RPS MK itu. */
export function penerimaTanggapBelum({ review = [], mk = [], dosen = [], kelas = [] } = {}){
  const per = new Map(), n = new Map();
  for (const v of review) if (v.kirim_pada && !(v.tanggapan_pada && v.tanggapan_pada >= v.kirim_pada)) {
    const k = `${v.kurikulum}|${v.kode_mk}`; n.set(k, (n.get(k) || 0) + 1);
  }
  for (const [k, j] of n) {
    const m = mk.find(x => `${x.kurikulum}|${x.kode}` === k);
    if (!m) continue;
    for (const d of penyusunMK(m, dosen, kelas)) tambahKe(per, d, `- ${m.kode} ${m.nama} (${m.kurikulum}): ${j} review belum ditanggapi`);
  }
  return hasil(per);
}

/** Tugas saya untuk Dekan (pemilik 2026-11-19): RPS disahkan Kaprodi yang belum ditetapkan. rps = Map 'kur|kode' -> {status, tetap_pada}. */
export function tugasTetapDekan({ rps = new Map(), mkNama = new Map() } = {}){
  const xs = [...rps].filter(([, r]) => r && r.status === 'disahkan' && 'tetap_pada' in r && !r.tetap_pada).map(([k]) => k);
  if (!xs.length) return [];
  const nm = k => `${k.split('|')[1]} ${mkNama.get(k) || ''}`.trim();
  return [{ jenis: 'rps', judul: `Tetapkan RPS: ${xs.length} mata kuliah menunggu penetapan Anda`,
    rinci: xs.slice(0, 5).map(nm).join('; ') + (xs.length > 5 ? `; dan ${xs.length - 5} lainnya` : '') + '. Sudah disahkan Kaprodi.',
    href: 'rps.html?tetap=1' }];
}

/** Tugas saya: satu tugas per semester bertenggat untuk MK yang boleh saya susun (rps_boleh_saya). */
export function tugasTenggatRps({ mk = [], rps = new Map(), bolehRps = [], tenggat = {}, kini = new Date() } = {}){
  const saya = new Set(bolehRps.map(b => `${b.kurikulum}|${b.kode_mk}`));
  const xs = mkTenggatRps({ mk: mk.filter(m => saya.has(`${m.kurikulum}|${m.kode}`)), rps, tenggat, kini });
  return ['Ganjil', 'Genap'].map(p => xs.filter(x => x.paritas === p)).filter(g => g.length).map(g => ({
    jenis: 'rps', judul: `Ajukan RPS semester ${g[0].paritas.toLowerCase()} sebelum ${tanggalPanjang(g[0].tenggat)}: ${g.length} mata kuliah`,
    rinci: g.map(x => `${x.m.kode} ${x.m.nama} (${x.status})`).join('; '),
    href: g.length === 1 ? `rps.html?kur=${encodeURIComponent(g[0].m.kurikulum)}&kode=${encodeURIComponent(g[0].m.kode)}` : 'rps.html',
    hari: g[0].hari }));
}
