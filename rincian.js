/* =====================================================================
   RINCIAN PER BUTIR — sumber tunggal daftar karya pembentuk tiap skor.
   ---------------------------------------------------------------------
   Berkas ini dipakai DUA halaman: kartu di skor.html dan halaman penuh
   rincian.html. Penyaringnya hanya ditulis di sini supaya keduanya tidak
   bisa menyimpang — kartu yang menampilkan angka lain dari daftarnya
   adalah bug yang mahal ditemukan.

   Tiap entri BUTIR:
     judul          judul blok rincian
     kolom          [{th, kunci, kelas}] — kunci diambil dari objek baris
     baris(D, TS)   daftar baris apa adanya, sudah tersaring jendela
     penyebut(D,TS) angka pembanding dari agregat, atau null bila memang
                    tidak seharusnya sama (mis. butir 37 menghitung dosen,
                    bukan rekognisi)
     labelPenyebut  nama angka itu pada kartu

   Baris WAJIB memuat: tahun, judul. Opsional: kategori (untuk mencari
   bukti), mhs, dana, ket1, ket2.
   ===================================================================== */

import { namaJenisBukti } from './rencana-bukti.js?v=2026-11-10-cfe13d';

const rapi = s => String(s ?? '').replace(/_/g, ' ');

export function jumlahJendela(baris, kunci, n, TS){
  const t0 = TS - n + 1;
  const out = {}; kunci.forEach(k => out[k] = 0);
  (baris || []).filter(r => r.tahun >= t0 && r.tahun <= TS)
    .forEach(r => kunci.forEach(k => out[k] += (r[k] || 0)));
  return out;
}

const dalamJendela = (x, TS, n = 3) =>
  x.tahun_ts >= TS - n + 1 && x.tahun_ts <= TS;

// Karya penelitian/PkM yang membentuk butir 23, 25, 31, 32. Penyaringnya
// sama persis dengan bangun.py: terverifikasi, relevan_visi, dalam jendela.
// relevan_visi dan ember_dana dibawa apa adanya dari data.json dan tidak
// dihitung ulang di sini.
function karyaKategori(D, TS, kategori){
  return (D.kegiatan || [])
    .filter(k => k.kategori === kategori
              && k.relevan_visi !== false
              && dalamJendela(k, TS))
    .sort((a, b) => (b.tahun_ts - a.tahun_ts)
                    || String(a.judul).localeCompare(String(b.judul)))
    .map(k => ({
      tahun: k.tahun, judul: k.judul, kategori: k.kategori,
      mhs: k.mahasiswa || 0,
      dana: EMBER[k.ember_dana] || '—',
      bukti_cadangan: k.bukti || '',
    }));
}

export const EMBER = {
  luar_negeri: 'Luar negeri', dalam_negeri: 'Dalam negeri',
  pt_mandiri: 'PT / mandiri', tanpa_sumber: 'tidak tercatat',
};

const KOLOM_KARYA = [
  {th: 'Th', kunci: 'tahun', kelas: 'th'},
  {th: 'Judul', kunci: 'judul'},
  {th: 'Mhs', kunci: 'mhs', kelas: 'mhs'},
  {th: 'Sumber dana', kunci: 'dana', kelas: 'dana'},
];

// Butir 6: satu baris per MITRA, bukan per karya. Satu karya dengan tiga
// mitra menyumbang tiga hitungan — itu memang yang dikehendaki instrumen.
//
// PENTING: mitra dari PUBLIKASI ikut terhitung, bukan hanya penelitian dan
// PkM. Itu mengikuti bangun.py, di mana loop mitra berada di luar penyaring
// kategori. Kolom "Dari" memperlihatkan asal tiap baris supaya porsinya
// terlihat dan bisa ditimbang terhadap definisi Tabel 2.a LKPS.
function mitraKerjasama(D, TS){
  const out = [];
  // Bukti melekat pada KARYA, bukan pada nama mitra. Tiap baris membawa
  // identitas karya induknya di `sumber` supaya cariBukti() mencari dengan
  // kunci yang benar; tanpa ini seluruh baris butir 6 tampil "tanpa bukti"
  // padahal karyanya punya.
  const tambah = (x, asal, kategori) => (x.mitra || []).forEach(m => {
    if (!(m.nama || '').trim()) return;
    out.push({
      tahun: x.tahun, judul: m.nama, asal,
      tingkat: rapi(m.tingkat || 'tanpa tingkat'),
      dari: x.judul,
      sumber: { kategori, tahun: x.tahun, judul: x.judul },
      doi: x.doi || '',
    });
  });
  (D.kegiatan || []).filter(x => dalamJendela(x, TS))
    .forEach(x => tambah(x, x.kategori === 'pkm' ? 'PkM' : 'Penelitian',
                         x.kategori));
  (D.publikasi || []).filter(x => dalamJendela(x, TS))
    .forEach(x => tambah(x, 'Publikasi', 'publikasi'));
  return out.sort((a, b) => (b.tahun - a.tahun)
                            || String(a.judul).localeCompare(String(b.judul)));
}

export const BUTIR = {
  '6': {
    judul: 'Mitra kerja sama',
    kolom: [
      {th: 'Th', kunci: 'tahun', kelas: 'th'},
      {th: 'Mitra', kunci: 'judul'},
      {th: 'Tingkat', kunci: 'tingkat', kelas: 'dana'},
      {th: 'Dari', kunci: 'asal', kelas: 'dana'},
      {th: 'Karya', kunci: 'dari', bukti: true},
    ],
    baris: (D, TS) => mitraKerjasama(D, TS),
    penyebut: (D, TS) => {
      const j = jumlahJendela(((D.akreditasi || {}).kerjasama) || [],
        ['internasional', 'nasional', 'wilayah', 'tanpa_tingkat'], 3, TS);
      return j.internasional + j.nasional + j.wilayah + j.tanpa_tingkat;
    },
    labelPenyebut: 'jumlah N1+N2+N3',
    catatan: 'Kerja sama dari Data prodi (pendidikan dan MoU payung) tidak ' +
      'tercantum per baris di sini. Kalau data itu terisi, daftar ini akan ' +
      'lebih sedikit daripada angka kartu.',
  },

  '23': {
    judul: 'Penelitian DTPS', kolom: KOLOM_KARYA,
    baris: (D, TS) => karyaKategori(D, TS, 'penelitian'),
    penyebut: (D, TS) => jumlahJendela(
      (((D.akreditasi || {}).kegiatan_mhs) || []).filter(r => r.kategori === 'penelitian'),
      ['total'], 3, TS).total,
    labelPenyebut: 'seluruh judul',
  },
  '25': {
    judul: 'PkM DTPS', kolom: KOLOM_KARYA,
    baris: (D, TS) => karyaKategori(D, TS, 'pkm'),
    penyebut: (D, TS) => jumlahJendela(
      (((D.akreditasi || {}).kegiatan_mhs) || []).filter(r => r.kategori === 'pkm'),
      ['total'], 3, TS).total,
    labelPenyebut: 'seluruh judul',
  },
  '31': {
    judul: 'Penelitian DTPS per sumber dana', kolom: KOLOM_KARYA,
    baris: (D, TS) => karyaKategori(D, TS, 'penelitian'),
    penyebut: (D, TS) => {
      const j = jumlahJendela(
        (((D.akreditasi || {}).sumber_dana) || []).filter(r => r.kategori === 'penelitian'),
        ['luar_negeri', 'dalam_negeri', 'pt_mandiri', 'tanpa_sumber'], 3, TS);
      return j.luar_negeri + j.dalam_negeri + j.pt_mandiri + j.tanpa_sumber;
    },
    labelPenyebut: 'jumlah seluruh sumber dana',
  },
  '32': {
    judul: 'PkM DTPS per sumber dana', kolom: KOLOM_KARYA,
    baris: (D, TS) => karyaKategori(D, TS, 'pkm'),
    penyebut: (D, TS) => {
      const j = jumlahJendela(
        (((D.akreditasi || {}).sumber_dana) || []).filter(r => r.kategori === 'pkm'),
        ['luar_negeri', 'dalam_negeri', 'pt_mandiri', 'tanpa_sumber'], 3, TS);
      return j.luar_negeri + j.dalam_negeri + j.pt_mandiri + j.tanpa_sumber;
    },
    labelPenyebut: 'jumlah seluruh sumber dana',
  },

  '33': {
    judul: 'Publikasi DTPS',
    kolom: [
      {th: 'Th', kunci: 'tahun', kelas: 'th'},
      {th: 'Judul', kunci: 'judul'},
      {th: 'Jenis', kunci: 'jenis', kelas: 'dana'},
      {th: 'Indeksasi', kunci: 'indeksasi', kelas: 'dana'},
    ],
    baris: (D, TS) => (D.publikasi || []).filter(p => dalamJendela(p, TS))
      .sort((a, b) => b.tahun_ts - a.tahun_ts)
      .map(p => ({tahun: p.tahun, judul: p.judul, kategori: 'publikasi',
                  jenis: rapi(p.jenis), indeksasi: rapi(p.indeksasi || p.tingkat || '—'),
                  doi: p.doi || ''})),
    penyebut: (D, TS) => {
      const j = jumlahJendela(((D.akreditasi || {}).publikasi_dtps) || [],
        ['na1', 'na2', 'na3', 'na4', 'nb1', 'nb2', 'nb3'], 3, TS);
      return Object.values(j).reduce((a, b) => a + b, 0);
    },
    labelPenyebut: 'jumlah seluruh kategori NA/NB',
  },

  '34': {
    judul: 'Luaran penelitian dan PkM',
    kolom: [
      {th: 'Th', kunci: 'tahun', kelas: 'th'},
      {th: 'Judul', kunci: 'judul'},
      {th: 'Jenis', kunci: 'jenis', kelas: 'dana'},
      {th: 'Bagian', kunci: 'bagian', kelas: 'dana'},
    ],
    baris: (D, TS) => (D.luaran_dosen || []).filter(x => dalamJendela(x, TS))
      .sort((a, b) => b.tahun_ts - a.tahun_ts)
      .map(x => ({tahun: x.tahun, judul: x.judul, jenis: rapi(x.jenis),
                  bagian: x.nama_bagian || x.bagian || '—'})),
    penyebut: (D, TS) => {
      const j = jumlahJendela(((D.akreditasi || {}).luaran_dtps) || [],
        ['paten', 'ttg', 'bc', 'hki', 'lainnya'], 3, TS);
      return Object.values(j).reduce((a, b) => a + b, 0);
    },
    labelPenyebut: 'jumlah seluruh komponen',
  },

  '37': {
    judul: 'Rekognisi DTPS',
    kolom: [
      {th: 'Th', kunci: 'tahun', kelas: 'th'},
      {th: 'Kegiatan', kunci: 'judul'},
      {th: 'Bentuk', kunci: 'bentuk', kelas: 'dana'},
      {th: 'Tingkat', kunci: 'tingkat', kelas: 'dana'},
    ],
    baris: (D, TS) => (D.rekognisi || []).filter(x => dalamJendela(x, TS))
      .sort((a, b) => b.tahun_ts - a.tahun_ts)
      .map(x => ({tahun: x.tahun, judul: x.nama_kegiatan, kategori: 'rekognisi',
                  bentuk: rapi(x.bentuk), tingkat: rapi(x.tingkat)})),
    // Sengaja null: skor butir 37 menghitung JUMLAH DOSEN, sedangkan daftar
    // ini memuat setiap rekognisi. Satu dosen dengan dua rekognisi tetap
    // dihitung sekali, jadi kedua angka memang tidak seharusnya sama.
    penyebut: () => null,
    labelPenyebut: '',
    catatan: 'Skor menghitung jumlah dosen yang punya minimal satu ' +
      'rekognisi, bukan jumlah baris di daftar ini.',
  },
};

// Bukti dari Supabase; kosong selama belum login. Kunci kategori|tahun|judul
// karena judul di data.json dan di tabel karya berasal dari kolom yang sama.
// Nilai: daftar tautan [{url, label}] — sejak 2026-11-03 satu karya bisa
// punya banyak bukti (tabel karya_bukti), ditambah bukti karya induknya
// (karya.induk_id: publikasi/luaran/integrasi yang berasal dari penelitian
// atau PkM ikut menampilkan bukti penelitian/PkM itu tanpa disalin).
export const BUKTI = new Map();
export function kunciBukti(kategori, tahun, judul){
  return `${kategori}|${tahun}|${String(judul || '').trim().toLowerCase()}`;
}
// karya: baris tabel karya (kategori, tahun, judul, bukti_url; id dan
// induk_id bila ada). buktiKarya: baris tabel karya_bukti.
export function isiPetaBukti(karya, buktiKarya = []){
  BUKTI.clear();
  const perId = new Map((karya || []).filter(r => r.id).map(r => [r.id, r]));
  const ekstra = new Map();
  (buktiKarya || []).forEach(b => {
    if (!ekstra.has(b.karya_id)) ekstra.set(b.karya_id, []);
    ekstra.get(b.karya_id).push(b);
  });
  const milik = (r, awalan) => {
    const xs = [];
    const u = (r.bukti_url || '').trim();
    if (u) xs.push({ url: u, label: awalan + 'Bukti' });
    (ekstra.get(r.id) || []).forEach(b =>
      xs.push({ url: b.url, label: awalan + namaJenisBukti(b.jenis) + (b.judul ? ': ' + b.judul : '') }));
    return xs;
  };
  (karya || []).forEach(r => {
    const xs = milik(r, '');
    const induk = r.induk_id && perId.get(r.induk_id);
    if (induk) xs.push(...milik(induk, `dari ${induk.kategori === 'pkm' ? 'PkM' : 'penelitian'}: `));
    if (!xs.length) return;
    const k = kunciBukti(r.kategori, r.tahun, r.judul);
    if (BUKTI.has(k)) console.warn('Dua karya berbagi kunci bukti yang sama:', k);
    BUKTI.set(k, xs);
  });
}
// Semua tautan bukti satu baris rincian.
export function daftarBukti(baris){
  // `sumber` dipakai bila baris ini bukan karyanya sendiri — misalnya baris
  // mitra pada butir 6, yang buktinya melekat pada karya induknya.
  const s = baris.sumber;
  const cad = baris.bukti_cadangan ? [{ url: baris.bukti_cadangan, label: 'Bukti' }] : [];
  if (s) return BUKTI.get(kunciBukti(s.kategori, s.tahun, s.judul)) || [];
  if (!baris.kategori) return cad;
  return BUKTI.get(kunciBukti(baris.kategori, baris.tahun, baris.judul)) || cad;
}
// Tautan pertama (kompatibel dengan pemakai lama yang butuh satu tautan).
export function cariBukti(baris){
  const xs = daftarBukti(baris);
  return xs.length ? xs[0].url : '';
}

// Kolom mana yang membawa tombol bukti. Default kolom `judul`; butir 6
// menandai kolom `dari` karena judul barisnya adalah nama mitra.
export const kolomBukti = def =>
  (def.kolom.find(c => c.bukti) || def.kolom.find(c => c.kunci === 'judul')
   || {}).kunci;
