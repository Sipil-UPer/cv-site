/* ====================================================================
   SYARAT DAN STATUS — IAPS DEPILAR 1.0, perolehan status
   IAPS DEPILAR 1.0 (Peraturan LAMDEPILAR No. 10/2026), Program Magister
   akademik, instrumen Perolehan Status Terakreditasi. Dibangkitkan
   2026-11-24 dari dokumen resmi (lamdepilar.or.id); lihat instrumen.json.
   Id butir 101-130 = elemen D.1 ... R.6 (pemilik 2026-11-24): nomor butir
   LAM Teknik (1-60) tertulis langsung di modul umum, jadi id ini sengaja
   tidak bertabrakan dengan nomor itu.

   Buku 4 Tabel 7 (Skor, Pemenuhan Syarat Perlu, dan Status Akreditasi):
     0-200   Tidak Terakreditasi (pembinaan 1 tahun)
     201-280 Terakreditasi 5 tahun: semua kriteria punya elemen yang
             memenuhi, dan sebagian besar elemen (80%) memenuhi standar
     281-400 Terakreditasi Unggul: perlu pelampauan (skor 4) dan syarat
             kunci; tidak dapat diperoleh lewat instrumen perolehan status
             (skor maksimum 3, NA paling tinggi 300).
   "Memenuhi" = skor 3 (Buku 4 Tabel 2: 2 = memenuhi namun ada kelemahan;
   dipilih 3 agar penilaian sendiri tidak terlalu optimistis, usulan Claude
   2026-11-24). Sasaran u3/u5 tidak disyaratkan (selalu true).
   Syarat Tabel 7 berbentuk agregat, jadi dinyatakan sebagai SYARAT_RERATA
   dengan `jenis`; statusRerata di bawah menghitungnya. indikator = semua
   elemen, ambangIndikator = skor yang dianggap memenuhi.
   ==================================================================== */

export const SYARAT_UNGGUL = {};

const MEMENUHI = 3;
const KRITERIA = {
  D: ['101', '102', '103'],
  E: ['104', '105', '106', '107', '108'],
  P: ['109', '110', '111', '112'],
  I: ['113', '114', '115'],
  L: ['116', '117', '118', '119'],
  A: ['120', '121', '122', '123', '124'],
  R: ['125', '126', '127', '128', '129', '130'],
};
const SEMUA = [{butir: '101'}, {butir: '102'}, {butir: '103'}, {butir: '104'}, {butir: '105'}, {butir: '106'}, {butir: '107'}, {butir: '108'}, {butir: '109'}, {butir: '110'}, {butir: '111'}, {butir: '112'}, {butir: '113'}, {butir: '114'}, {butir: '115'}, {butir: '116'}, {butir: '117'}, {butir: '118'}, {butir: '119'}, {butir: '120'}, {butir: '121'}, {butir: '122'}, {butir: '123'}, {butir: '124'}, {butir: '125'}, {butir: '126'}, {butir: '127'}, {butir: '128'}, {butir: '129'}, {butir: '130'}];

export const SYARAT_RERATA = [
  { syarat: 1, id: 'kriteria_memenuhi', jenis: 'tiap_kriteria',
    label: 'Kriteria yang punya elemen memenuhi (skor 3), dari 7',
    t: 7, u3: null, u5: null, ambangIndikator: MEMENUHI, indikator: SEMUA },
  { syarat: 2, id: 'elemen_memenuhi', jenis: 'persen_elemen',
    label: 'Elemen yang memenuhi standar (skor 3), persen',
    t: 80, u3: null, u5: null, ambangIndikator: MEMENUHI, indikator: SEMUA },
];

// Perolehan status: hanya Terakreditasi yang dapat dicapai (skala berhenti di 3, tanpa pelampauan), jadi
// tabel penghalang dan potret skor hanya memakai sasaran 't' (2026-11-25). statusRerata() tetap mengisi
// u3ok/u5ok = true (tidak disyaratkan) agar bentuk hasil sama dengan instrumen lain.
export const SASARAN = ['t'];
export const NAMA_SASARAN = { t: 'Terakreditasi' };
export const JUDUL_JALAN = 'Jalan menuju Terakreditasi';
export const BATAS_NA = [[200, 'Terakreditasi (> 200)']];
const TOL = 0.005;

export const syaratButir = no => SYARAT_UNGGUL[String(no)] || null;
export function statusSyarat(no, skor){
  const s = syaratButir(no);
  if (!s) return null;
  return { ...s, tok: true, u3ok: true, u5ok: true, tahu: skor != null };
}

/** Syarat agregat Tabel 7. ambil(ind) -> skor elemen atau null (kosong).
 *  rerata = angka yang dibandingkan dengan ambang t (jumlah kriteria, atau
 *  persen elemen). tok: true / false / null (belum tahu karena ada elemen kosong). */
export function statusRerata(def, ambil){
  const nilai = def.indikator.map(ambil);
  const skor = Object.fromEntries(def.indikator.map((ind, i) => [ind.butir, nilai[i]]));
  const ok = v => v != null && Number.isFinite(v) && v >= MEMENUHI - TOL;
  let rerata, tok;
  if (def.jenis === 'tiap_kriteria') {
    const per = Object.values(KRITERIA).map(xs =>
      xs.some(no => ok(skor[no])) ? true : xs.some(no => skor[no] == null) ? null : false);
    rerata = per.filter(x => x === true).length;
    tok = per.includes(false) ? false : per.includes(null) ? null : true;
  } else {
    const n = nilai.length, nOk = nilai.filter(ok).length, nKosong = nilai.filter(v => v == null).length;
    rerata = 100 * nOk / n;
    tok = rerata >= def.t - TOL ? true : 100 * (nOk + nKosong) / n < def.t - TOL ? false : null;
  }
  return { ...def, nilai, rerata, tok, u3ok: true, u5ok: true };
}

export function gabungSyarat(daftar){
  if (daftar.some(x => x === false)) return false;
  if (daftar.some(x => x == null)) return null;
  return true;
}

/** Ringkasan batas NA di bawah status pada halaman Skor. */
export const TEKS_BATAS = 'Terakreditasi > 200 (perolehan status; Unggul tidak dapat diperoleh lewat instrumen ini)';
/** Rujukan syarat dan status di bawah ringkasan halaman Skor. */
export const SUMBER_STATUS = 'Buku 4 Tabel 7 (perolehan status)';

/** Status menurut Tabel 7 untuk perolehan status. u3/u5 diabaikan. */
export function statusAkreditasi(NA, t, u3, u5){
  const hasil = (status, durasi, pasti, catatan) => ({status, durasi, pasti, catatan});
  if (t === false)
    return hasil('Tidak Terakreditasi', null, true,
      'Syarat Tabel 7 tidak terpenuhi: ada kriteria tanpa elemen yang memenuhi, atau kurang dari 80% elemen memenuhi.');
  if (NA <= 200)
    return hasil('Tidak Terakreditasi', null, true, 'NA 200 atau kurang (Tabel 7: 0-200).');
  if (t == null)
    return hasil('Belum dapat disimpulkan', null, false,
      'NA di atas 200, tetapi syarat Tabel 7 belum dapat dipastikan karena masih ada elemen kosong.');
  return hasil('Terakreditasi', 5, true, 'Tabel 7: NA 201-280 (perolehan status, skor maksimum 3).');
}

/** Status bila sebagian elemen belum dinilai: batas atas = elemen kosong bernilai 3. */
export function statusRentang(NAmin, NAmax, t, u3, u5){
  const a = statusAkreditasi(NAmin, t, u3, u5);
  const b = statusAkreditasi(NAmax, t, u3, u5);
  if (a.status === b.status && a.durasi === b.durasi)
    return { ...a, pasti: a.pasti && b.pasti, NAmin, NAmax };
  const nama = s => s.status + (s.durasi ? ` ${s.durasi} tahun` : '');
  return { status: 'Belum dapat disimpulkan', durasi: null, pasti: false, NAmin, NAmax,
    catatan: `Dengan elemen yang belum dinilai, NA bisa ${NAmin.toFixed(2)}-${NAmax.toFixed(2)}, ` +
             `jadi status bisa ${nama(a)} sampai ${nama(b)}.` };
}

export const JUMLAH_SYARAT_TERPETAKAN = SYARAT_RERATA.length;
