// Isi RPS untuk akreditasi (pemilik 2026-11-19). Tanpa DOM.
// Keputusan pemilik 2026-11-19: tabel LKPS 3.a.3 (integrasi penelitian/PkM dalam pembelajaran) TETAP bersumber dari catatan karya
// "Integrasi ke pembelajaran" (ada bukti sahih dan verifikasi admin). RPS yang DISAHKAN dipakai untuk (1) mengisi otomatis kolom
// "Sudah tercantum di RPS" bila RPS MK itu memuat penelitian/PkM yang sama, dan (2) menandai yang tidak cocok: ada di RPS tetapi
// belum dicatat sebagai karya, atau dicatat tetapi tidak ada di RPS disahkan. Rekap SCL/integrasi prodi untuk narasi LED.
import { BENTUK_INTEGRASI, SCL } from './rps.js?v=2026-11-22-866c27';

const norm = s => String(s ?? '').trim().toLowerCase();
/** Kunci pencocokan: kegiatan induk (id karya penelitian/PkM) + nama MK (karya integrasi menyimpan nama MK). */
export const kunciIntegrasi = (induk, namaMK) => `${induk}|${norm(namaMK)}`;
const label = (xs, k) => (xs.find(x => x[0] === k) || [, k || ''])[1];

/**
 * Integrasi penelitian/PkM di RPS yang disahkan. rps = baris mk_rps {kurikulum, kode_mk, integ | sah, ref_mata_kuliah: {nama}};
 * integ = sah.rps.integrasi (PostgREST "integ:sah->rps->integrasi"). mk = ref_mata_kuliah (cadangan nama per kode).
 * Hasil [{ kurikulum, kode_mk, nama_mk, induk, judul, kategori, bentuk }].
 */
export function integrasiDisahkan(rps = [], mk = []){
  const out = [];
  for (const r of rps) {
    const I = r.integ ?? r.sah?.rps?.integrasi;
    if (!I || I.ada !== true) continue;
    const nama = r.ref_mata_kuliah?.nama || (mk.find(m => (!m.kurikulum || m.kurikulum === r.kurikulum) && m.kode === r.kode_mk) || {}).nama || '';
    for (const k of I.karya || []) out.push({ kurikulum: r.kurikulum, kode_mk: r.kode_mk, nama_mk: nama, induk: k.id, judul: k.judul || '',
      kategori: k.kategori || '', bentuk: k.bentuk || '' });
  }
  return out;
}

/**
 * Cocokkan RPS disahkan dengan catatan karya integrasi (yang tidak ditolak). Hasil { diRps, belumDicatat, tidakDiRps, sesuai: Set kunci }.
 * belumDicatat = ada di RPS disahkan, belum ada karya integrasi; tidakDiRps = karya integrasi tanpa padanan di RPS disahkan.
 */
export function cocokIntegrasi({ rps = [], mk = [], karya = [] } = {}){
  const diRps = integrasiDisahkan(rps, mk), catat = karya.filter(k => k.kategori === 'integrasi' && k.status !== 'ditolak');
  const sesuai = new Set(diRps.map(x => kunciIntegrasi(x.induk, x.nama_mk))), ada = new Set(catat.map(k => kunciIntegrasi(k.induk_id, k.mata_kuliah)));
  return { diRps, sesuai, belumDicatat: diRps.filter(x => !ada.has(kunciIntegrasi(x.induk, x.nama_mk))),
    tidakDiRps: catat.filter(k => !sesuai.has(kunciIntegrasi(k.induk_id, k.mata_kuliah))) };
}

/**
 * Rekap pembelajaran dari RPS disahkan satu kurikulum: MK aktif ber-RPS disahkan, yang mengintegrasikan penelitian/PkM, yang
 * memakai metode SCL (dicentang di rencana pekanan, atau dinyatakan Ada), metode SCL terbanyak, bentuk integrasi.
 */
export function rekapPembelajaran({ mk = [], rps = new Map(), kur } = {}){
  const xs = mk.filter(m => m.kurikulum === kur && m.aktif !== false).map(m => ({ m, d: rps.get(`${kur}|${m.kode}`)?.sah?.rps })).filter(x => x.d);
  const metode = new Map(), bentuk = new Map();
  let integrasi = 0, scl = 0;
  for (const { d } of xs) {
    const pk = d.pekan || [], kodeScl = new Set(pk.flatMap(p => p.scl || []));
    if (kodeScl.size || d.scl?.ada === true) scl++;
    for (const k of kodeScl) metode.set(k, (metode.get(k) || 0) + 1);
    if (d.integrasi?.ada === true && ((d.integrasi.karya || []).length || String(d.integrasi.teks || '').trim())) {
      integrasi++;
      for (const k of d.integrasi.karya || []) if (k.bentuk) bentuk.set(k.bentuk, (bentuk.get(k.bentuk) || 0) + 1);
    }
  }
  const n = xs.length, pct = v => (n ? Math.round(100 * v / n) : 0);
  const urut = (peta, daftar) => [...peta].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))).map(([k, j]) => ({ label: label(daftar, k), jumlah: j }));
  return { aktif: mk.filter(m => m.kurikulum === kur && m.aktif !== false).length, disahkan: n, integrasi, scl,
    pIntegrasi: pct(integrasi), pScl: pct(scl), metode: urut(metode, SCL), bentuk: urut(bentuk, BENTUK_INTEGRASI) };
}

/** Kalimat ringkas untuk narasi LED (bahan; disunting prodi). */
export function teksLedPembelajaran(R, kur){
  if (!R.disahkan) return `Belum ada RPS kurikulum ${kur} yang disahkan di sistem.`;
  const daftar = xs => xs.slice(0, 3).map(x => `${x.label} (${x.jumlah} MK)`).join(', ');
  return `Dari ${R.disahkan} mata kuliah kurikulum ${kur} yang RPS-nya sudah disahkan (dari ${R.aktif} mata kuliah aktif), `
    + `${R.scl} mata kuliah (${R.pScl}%) menerapkan metode pembelajaran berpusat pada mahasiswa${R.metode.length ? `, terutama ${daftar(R.metode)}` : ''}, `
    + `dan ${R.integrasi} mata kuliah (${R.pIntegrasi}%) mengintegrasikan hasil penelitian/PkM dosen${R.bentuk.length ? ` sebagai ${daftar(R.bentuk)}` : ''}.`;
}
