// Impor kerja sama dari Excel (pemilik 2026-11-24): templat Templat_Kerja_Sama.xlsx (tools/buat_templat_kerjasama.py)
// diisi admin, diunggah di Data prodi › Kerja sama, diperiksa (pratinjau dan galat per baris), lalu disimpan sekaligus ke
// lkps_kerjasama. Aturan sama dengan formulir tab itu (data-prodi.html): mitra, jenis, tingkat wajib; tahun dari tanggal;
// tanggal awal atau tahun mulai wajib; tanggal akhir tidak lebih awal. Logika murni, diuji di tests/js/impor_kerjasama.test.mjs.
import { JENIS_BUKTI_KS } from './manfaat-kerjasama.js?v=2026-11-25-9d4f29';

// Pilihan sama dengan formulir tab Kerja sama (data-prodi.html: jenis, TINGKAT_3) dan cek basis data (16-patch-data-lkps.sql).
export const JENIS_KS = [['pendidikan', 'Pendidikan'], ['penelitian', 'Penelitian'], ['pkm', 'PkM']];
export const TINGKAT_KS = [['internasional', 'Internasional'], ['nasional', 'Nasional'], ['wilayah', 'Wilayah/lokal']];
export { JENIS_BUKTI_KS };
export const YA_TIDAK = [['ya', 'Ya'], ['tidak', 'Tidak']];

// Kolom templat: [kunci, judul kolom di Excel, wajib]. Judul dipakai templat dan pencocokan saat impor.
export const KOLOM_KS = [
  ['mitra', 'Lembaga mitra', true],
  ['jenis', 'Jenis', true],
  ['tingkat', 'Tingkat', true],
  ['kegiatan', 'Judul kegiatan kerja sama', false],
  ['manfaat', 'Manfaat bagi program studi', false],
  ['tanggal_mulai', 'Tanggal awal', false],
  ['tanggal_selesai', 'Tanggal akhir', false],
  ['tahun_mulai', 'Tahun mulai', false],
  ['tahun_selesai', 'Tahun selesai', false],
  ['jenis_bukti', 'Jenis bukti utama', false],
  ['tautan_bukti', 'Tautan bukti', false],
  ['sembunyikan_publik', 'Sembunyikan dari situs publik', false],
];
export const LEMBAR_KS = 'Kerja sama';

const rapat = s => String(s ?? '').replace(/\s+/g, ' ').trim();
const kecil = s => rapat(s).toLowerCase();
// Judul kolom: tanpa tanda wajib (*), tanpa keterangan dalam kurung, huruf kecil.
const normJudul = s => kecil(String(s ?? '').replace(/\*/g, '').replace(/\(.*?\)/g, ''));

/** Nilai pilihan dari kode atau label (tanpa beda huruf besar-kecil); '' bila kosong, null bila tidak dikenali. */
export function pilihan(v, opsi, sinonim = {}){
  const s = kecil(v);
  if (!s) return '';
  const o = opsi.find(([k, l]) => s === k || s === kecil(l));
  return o ? o[0] : (sinonim[s] ?? null);
}
const SINONIM_JENIS = { 'pengabdian kepada masyarakat': 'pkm', 'pengabdian masyarakat': 'pkm', 'pengabdian': 'pkm' };
const SINONIM_TINGKAT = { 'wilayah': 'wilayah', 'lokal': 'wilayah' };
const SINONIM_BUKTI = { 'surat perjanjian kerjasama': 'spk', 'surat perjanjian kerja sama': 'spk', 'bukti pelaksanaan': 'bukti_pelaksanaan',
  'bukti lain': 'lainnya' };

const dua = n => String(n).padStart(2, '0');
const isoTanggal = (y, m, d) => {
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d ? `${y}-${dua(m)}-${dua(d)}` : null;
};
/**
 * Tanggal sel Excel -> 'YYYY-MM-DD'; '' bila kosong, null bila tidak terbaca. Menerima Date (SheetJS cellDates), nomor seri
 * Excel, '2025-01-31', '31/01/2025', '31-01-2025', '31.01.2025'.
 */
export function tanggalSel(v){
  if (v == null || v === '') return '';
  if (v instanceof Date) {
    if (isNaN(v)) return null;
    const t = new Date(v.getTime() + 12 * 3600e3);   // SheetJS bisa memberi tengah malam lokal kurang beberapa detik
    return isoTanggal(t.getFullYear(), t.getMonth() + 1, t.getDate());
  }
  if (typeof v === 'number') {
    if (!(v > 20000 && v < 80000)) return null;   // kira-kira 1954-2119
    const t = new Date(Math.round((v - 25569) * 86400e3));
    return isoTanggal(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
  }
  const s = rapat(v);
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return isoTanggal(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) return isoTanggal(+m[3], +m[2], +m[1]);
  return null;
}
const tahunSel = v => {
  const s = rapat(v);
  if (!s) return '';
  return /^\d{4}$/.test(s) && +s >= 1990 && +s <= 2100 ? +s : null;
};

/** Baris judul: baris pertama (dari 10 teratas) yang memuat kolom "Lembaga mitra". */
function cariJudul(rows){
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const j = (rows[i] || []).map(normJudul);
    if (j.includes('lembaga mitra') || j.includes('mitra')) return i;
  }
  return -1;
}

/**
 * Baca lembar (array baris, SheetJS sheet_to_json header:1, cellDates) -> { baris: [{ no, data, galat }], hilang, takDikenal }.
 * no = nomor baris di Excel; data = isian siap simpan (kunci kolom lkps_kerjasama); galat = daftar pesan baris itu.
 * Baris kosong dilewati.
 */
export function bacaKerjasama(rows = []){
  const ij = cariJudul(rows);
  if (ij < 0) return { baris: [], hilang: KOLOM_KS.filter(k => k[2]).map(k => k[1]), takDikenal: [], tanpaJudul: true };
  const judul = (rows[ij] || []).map(normJudul);
  const posisi = new Map();
  const takDikenal = [];
  judul.forEach((j, i) => {
    if (!j) return;
    const k = KOLOM_KS.find(([kunci, l]) => j === normJudul(l) || j === kunci || (kunci === 'mitra' && j === 'mitra'));
    if (k && !posisi.has(k[0])) posisi.set(k[0], i); else if (!k) takDikenal.push(rapat(rows[ij][i]));
  });
  const hilang = KOLOM_KS.filter(([k, , w]) => w && !posisi.has(k)).map(k => k[1]);
  const baris = [];
  rows.slice(ij + 1).forEach((r, n) => {
    const sel = k => (posisi.has(k) ? (r || [])[posisi.get(k)] : null);
    if (KOLOM_KS.every(([k]) => sel(k) == null || rapat(sel(k) instanceof Date ? 'x' : sel(k)) === '')) return;
    const galat = [], d = {};
    d.mitra = rapat(sel('mitra'));
    if (!d.mitra) galat.push('Lembaga mitra kosong');
    for (const [k, opsi, sin, nama] of [['jenis', JENIS_KS, SINONIM_JENIS, 'Jenis'], ['tingkat', TINGKAT_KS, SINONIM_TINGKAT, 'Tingkat']]) {
      const v = pilihan(sel(k), opsi, sin);
      if (v === '') galat.push(`${nama} kosong`); else if (v == null) galat.push(`${nama} "${rapat(sel(k))}" tidak dikenali`); else d[k] = v;
    }
    for (const k of ['kegiatan', 'manfaat']) { const v = rapat(sel(k)); if (v) d[k] = v; }
    for (const [k, nama] of [['tanggal_mulai', 'Tanggal awal'], ['tanggal_selesai', 'Tanggal akhir']]) {
      const v = tanggalSel(sel(k));
      if (v == null) galat.push(`${nama} "${rapat(sel(k))}" bukan tanggal`); else if (v) d[k] = v;
    }
    for (const [k, nama] of [['tahun_mulai', 'Tahun mulai'], ['tahun_selesai', 'Tahun selesai']]) {
      const v = tahunSel(sel(k));
      if (v == null) galat.push(`${nama} "${rapat(sel(k))}" bukan tahun 1990–2100`); else if (v) d[k] = v;
    }
    // Sama dengan formulir (data-prodi.html olah): tanggal menentukan tahunnya bila diisi.
    if (d.tanggal_mulai) d.tahun_mulai = +d.tanggal_mulai.slice(0, 4);
    if (d.tanggal_selesai) d.tahun_selesai = +d.tanggal_selesai.slice(0, 4);
    if (!d.tahun_mulai && !galat.some(g => g.startsWith('Tanggal awal') || g.startsWith('Tahun mulai'))) galat.push('Isi tanggal awal (atau tahun mulai)');
    if (d.tanggal_mulai && d.tanggal_selesai && d.tanggal_selesai < d.tanggal_mulai) galat.push('Tanggal akhir lebih awal dari tanggal awal');
    else if (d.tahun_mulai && d.tahun_selesai && d.tahun_selesai < d.tahun_mulai) galat.push('Tahun selesai lebih awal dari tahun mulai');
    const jb = pilihan(sel('jenis_bukti'), JENIS_BUKTI_KS, SINONIM_BUKTI);
    if (jb == null) galat.push(`Jenis bukti "${rapat(sel('jenis_bukti'))}" tidak dikenali`); else if (jb) d.jenis_bukti = jb;
    const url = rapat(sel('tautan_bukti'));
    if (url) { if (/^https?:\/\/\S+$/i.test(url)) d.tautan_bukti = url; else galat.push('Tautan bukti harus diawali http:// atau https:// dan tanpa spasi'); }
    const sp = pilihan(sel('sembunyikan_publik'), YA_TIDAK);
    if (sp == null) galat.push(`Sembunyikan dari situs publik "${rapat(sel('sembunyikan_publik'))}": isi Ya atau Tidak`);
    else d.sembunyikan_publik = sp === 'ya';
    baris.push({ no: ij + 2 + n, data: d, galat });
  });
  return { baris, hilang, takDikenal };
}

/** Kunci kembar: mitra (tanpa beda huruf/spasi) + jenis + tanggal awal (atau tahun mulai). */
export const kunciKS = r => [kecil(r.mitra), r.jenis || '', r.tanggal_mulai || r.tahun_mulai || ''].join('|');

/**
 * Rencana impor: baris tanpa galat yang belum ada di `ada` (baris lkps_kerjasama yang tersimpan) dan tidak kembar di berkas.
 * -> { baru: [data], lewat: [{ no, mitra, alasan }], galat: [{ no, mitra, galat }] }.
 */
export function rencanaImporKS(hasil, ada = []){
  const sudah = new Set(ada.map(kunciKS));
  const dipakai = new Set();
  const out = { baru: [], lewat: [], galat: [] };
  for (const b of hasil.baris || []) {
    if (b.galat.length) { out.galat.push({ no: b.no, mitra: b.data.mitra || '', galat: b.galat }); continue; }
    const k = kunciKS(b.data);
    if (sudah.has(k)) { out.lewat.push({ no: b.no, mitra: b.data.mitra, alasan: 'sudah ada di situs' }); continue; }
    if (dipakai.has(k)) { out.lewat.push({ no: b.no, mitra: b.data.mitra, alasan: 'kembar dengan baris sebelumnya di berkas' }); continue; }
    dipakai.add(k);
    out.baru.push(b.data);
  }
  return out;
}
