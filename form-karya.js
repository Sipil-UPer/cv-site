// Definisi formulir karya dosen (FORM) dan isiannya. Dipindah dari input.html
// supaya verifikasi.html memakai label isian yang sama (pemilik 2026-11-08).

import { htmlContoh, JENIS_BUKTI_KS } from './manfaat-kerjasama.js?v=2026-11-13-e2f2f8';

const rapi = s => s ? String(s).replace(/_/g,' ') : '';

export const TH = new Date().getFullYear();
export const TAHUN = Array.from({length:12},(_,i)=>String(TH+1-i));
// Bulan opsional: memetakan karya ke tahun akademik (TS, Sep-Agu).
export const BULAN = [['1','Januari'],['2','Februari'],
  ['3','Maret'],['4','April'],['5','Mei'],['6','Juni'],['7','Juli'],
  ['8','Agustus'],['9','September'],['10','Oktober'],['11','November'],
  ['12','Desember']];
// Dropdown "berasal dari kegiatan": diisi saat form dibuka dengan
// kegiatan penelitian/PkM milik dosen ini yang sudah tersimpan.
export const F_INDUK = {n:'induk_id', l:'Berasal dari penelitian / PkM', t:'select',
  o:[['', '— tidak ada / mandiri —']],
  sub:'Payung penelitian: pilih kegiatan yang menghasilkan karya ini. Hanya kegiatan '
    + 'yang mencantumkan Anda yang tampil. Dengan payung, karya ini menjadi bukti luaran '
    + 'kerja sama kegiatan itu (LKPS 2.a). Tanpa payung, karya bermitra dicatat sebagai '
    + 'kerja sama tersendiri, dan admin prodi dapat membantu mencatat penelitiannya.'};

// Kerja sama induk (MoU/PKS/IA) yang dicatat admin di Data prodi
// (supabase/24-patch-kerjasama-induk.sql). Diisi saat form dibuka;
// dihapus dari form bila daftarnya belum bisa dibaca (patch belum jalan).
export const F_KERJASAMA = {n:'kerjasama_id', l:'Kerja sama induk (MoU/PKS/IA)', t:'select', full:1,
  o:[['', '— tidak terkait kerja sama yang tercatat —']],
  sub:'Pilih bila kegiatan ini dilaksanakan dalam kerja sama yang sudah dicatat admin prodi. '
    + 'Di LKPS 2.a kegiatan ini tampil dengan tanggal, manfaat, dan bukti kerja sama itu. '
    + 'Kerja sama belum ada di daftar? Minta admin menambahkannya di Data prodi.'};

// Isian LKPS 2.a dari dosen (supabase/32-patch-isian-kerjasama.sql). Durasi dan
// status tidak diisi: dihitung rumus templat dari kedua tanggal.
export const ISIAN_32 = ['manfaat_ks', 'mulai_ks', 'selesai_ks', 'jenis_bukti_ks'];
export const F_MANFAAT_KS = {n:'manfaat_ks', l:'Manfaat kerja sama bagi program studi', t:'textarea', full:1,
  ph:'Mis. Mendukung topik tugas akhir 3 mahasiswa dan memperkaya materi mata kuliah Hidrologi dengan data lapangan dari mitra.',
  sub:'LKPS 2.a kolom 7. Isi bila kegiatan ini bersama mitra. Sebutkan manfaat nyata bagi prodi, bukan tujuan kegiatan; '
    + 'kosong = memakai isian kerja sama induk.' + htmlContoh('f_manfaat_ks', ['penelitian', 'pkm'])};
export const F_MULAI_KS = {n:'mulai_ks', l:'Tanggal awal kerja sama', t:'date', sub:'Sesuai surat penugasan atau perjanjian.'};
export const F_SELESAI_KS = {n:'selesai_ks', l:'Tanggal akhir kerja sama', t:'date', sub:'<span id="durasi_ks">Durasi dan status dihitung dari kedua tanggal.</span>'};
export const F_BUKTI_KS = {n:'jenis_bukti_ks', l:'Bukti kerja sama', t:'select', full:1, o:JENIS_BUKTI_KS,
  sub:'LKPS 2.a kolom 12. Unggah berkasnya di bagian bukti, atau tautkan yang sudah ada.'};

// Isian LKPS tambahan (supabase/25-patch-isian-karya.sql). Nilai sah sama
// dengan daftar pilihan templat LKPS. Dibuang dari form bila kolomnya
// belum ada (siapkanIsian25), supaya simpan tidak gagal.
export const ISIAN_25 = ['jumlah_sitasi', 'tema_id', 'keterlibatan_mhs', 'tkt', 'nomor_tkt', 'bukti_integrasi', 'sesuai_rps'];
// Sejak 42-patch-sitasi-tahunan.sql (pemilik 2026-11-10) formulir memakai sitasi
// per tahun; isian total ini tidak lagi ditampilkan, angkanya jadi cadangan.
export const F_SITASI = {n:'jumlah_sitasi', l:'Jumlah sitasi (3 tahun terakhir)', t:'number', ph:'0',
  // Tafsiran 4.i (pemilik 2026-11-04): artikel tahun berapa pun, yang dihitung
  // sitasi yang DITERIMA dalam tiga tahun terakhir (TS-2 s.d. TS).
  sub:'LKPS 4.i: sitasi yang <b>diterima</b> artikel ini dalam tiga tahun terakhir (TS-2 s.d. TS), '
    + 'bukan total sepanjang masa. Artikel lama boleh, asal disitasi dalam tiga tahun itu. '
    + 'Hanya jurnal/prosiding terindeks <b>Scopus atau WoS</b> yang masuk tabel. '
    + 'Kolom LKPS meminta angka <b>Google Scholar</b>: jumlahkan batang grafik sitasi tiga tahun itu di halaman artikel; '
    + 'pembanding di Scopus: <i>Citation overview</i> dengan rentang tahun. '
    + 'Simpan tangkapan layarnya sebagai bukti (jenis Lainnya); perbarui tiap tahun.'};
export const F_TEMA = {n:'tema_id', l:'Tema peta jalan', t:'select', o:[['', '— belum dipilih —']],
  sub:'Tema peta jalan penelitian/PkM prodi (daftar diisi admin di Data prodi). LKPS 6.h.1, 6.i, dan 3.a.3.'};
export const F_KETERLIBATAN = {n:'keterlibatan_mhs', l:'Bentuk keterlibatan mahasiswa', t:'select',
  o:[['tugas_akhir','Tugas akhir'], ['perancangan','Perancangan'],
     ['pengembangan_produk','Pengembangan produk/jasa'], ['lainnya','Kegiatan lain yang relevan']],
  sub:'Untuk penelitian yang melibatkan mahasiswa (LKPS 6.h.1).'};
export const F_TKT = {n:'tkt', l:'Tingkat kesiapan teknologi (TKT)', t:'select',
  o:[...Array.from({length:9}, (_, i) => [String(i+1), 'TKT ' + (i+1)])],
  sub:'Untuk teknologi tepat guna dan produk (LKPS 4.f.3).'};
export const F_NOMOR_TKT = {n:'nomor_tkt', l:'Nomor sertifikat TKT', t:'text',
  sub:'Untuk teknologi tepat guna dan produk (LKPS 4.f.3).'};
export const F_BUKTI_INTEGRASI = {n:'bukti_integrasi', l:'Bukti sahih integrasi', t:'select',
  o:[['naskah_hibah','Naskah hibah'], ['laporan_akhir','Laporan akhir'], ['publikasi','Publikasi'],
     ['lainnya','Bukti sahih lainnya']]};
export const F_RPS = {n:'sesuai_rps', l:'Sudah tercantum di RPS', t:'select', o:[['true','Ya'], ['false','Belum']]};

export const F_BULAN = {n:'bulan', l:'Bulan', t:'select', w:1, o:BULAN,
  sub:'Menentukan tahun akademik (TS): September ke atas masuk TS berikutnya'};
export const TINGKAT = [['internasional','Internasional'],['nasional','Nasional'],
                 ['wilayah_lokal','Wilayah / lokal']];

// ---------------------------------------------------------------------
//  Definisi form
//  Tipe field khusus:
//    'skema'  → dua dropdown bertingkat: kelompok, lalu skema
// ---------------------------------------------------------------------
export const FORM = {
  publikasi: {
    judul:'Publikasi',
    hint:'Artikel jurnal, prosiding, buku, dan HKI. Isi DOI bila ada — itu yang mencegah entri ganda.',
    peran:[['penulis_pertama','Penulis pertama'],['anggota','Anggota']],
    korespondensi:true, mitra:true, mahasiswa:'publikasi',
    f:[
      {n:'judul', l:'Judul karya', t:'text', w:1, full:1},
      {n:'jenis', l:'Jenis', t:'select', w:1, o:[['jurnal','Artikel jurnal'],
        ['prosiding','Prosiding'],['buku','Buku'],['bab_buku','Bab dalam buku'],
        ['haki_paten','HKI / paten'],['lainnya','Lainnya']]},
      {n:'tahun', l:'Tahun terbit', t:'select', w:1, o:TAHUN.map(y=>[y,y])},
      F_BULAN,
      F_INDUK,
      {n:'nama_terbitan', l:'Nama jurnal / penerbit', t:'text'},
      {n:'tingkat', l:'Tingkat', t:'select', w:1, o:TINGKAT},
      {n:'indeksasi', l:'Indeksasi', t:'select', o:[['scopus_q1','Scopus Q1'],
        ['scopus_q2','Scopus Q2'],['scopus_q3','Scopus Q3'],['scopus_q4','Scopus Q4'],
        ['wos','Web of Science'],['sinta_1_2','SINTA 1–2'],['sinta_3_4','SINTA 3–4'],
        ['sinta_5_6','SINTA 5–6'],['tidak_terindeks','Tidak terindeks']]},
      {n:'doi', l:'DOI', t:'text', ph:'10.1016/j.jhydrol.2025.132000'},
      // Sitasi: kotak per tahun di input.html (htmlSitasi), bukan F_SITASI (pemilik 2026-11-10).
      {n:'url', l:'Tautan', t:'url', full:1, ph:'https://'},
    ]
  },
  kegiatan: {
    judul:'Penelitian & pengabdian',
    hint:'Satu entri untuk satu kegiatan, bukan per anggota. Agar tidak ganda, sebaiknya hanya ketua yang menginput; anggota mendaftarkan diri lewat tab Karya prodi.',
    peran:[['ketua','Ketua'],['anggota','Anggota']],
    mitra:true, mahasiswa:'kegiatan',
    f:[
      {n:'judul', l:'Judul kegiatan', t:'text', w:1, full:1},
      {n:'kategori', l:'Jenis', t:'select', w:1,
        o:[['penelitian','Penelitian'],['pkm','Pengabdian kepada masyarakat']]},
      {n:'tahun', l:'Tahun pelaksanaan', t:'select', w:1, o:TAHUN.map(y=>[y,y])},
      F_BULAN,
      {n:'skema', t:'skema', full:1},
      {n:'tingkat', l:'Tingkat kegiatan', t:'select', w:1, o:TINGKAT},
      F_KERJASAMA,
      F_MANFAAT_KS,
      F_MULAI_KS,
      F_SELESAI_KS,
      F_BUKTI_KS,
      F_TEMA,
      F_KETERLIBATAN,
      {n:'nama_pemberi_dana', l:'Nama pemberi dana', t:'text',
        sub:'Contoh: DPPM Kemendiktisaintek, LPPM Universitas, PT ABC'},
      {n:'besaran_dana', l:'Besaran dana (Rp)', t:'number', ph:'25000000'},
      {n:'keterangan', l:'Keterangan tambahan', t:'text', full:1,
        sub:'Wajib diisi bila memilih skema "lainnya": tuliskan nama skema sebenarnya'},
    ]
  },
  luaran: {
    judul:'Luaran & HKI',
    hint:'Paten, hak cipta, teknologi tepat guna, produk, dan buku (LKPS 4.f). Lampirkan sertifikat atau bukti pendaftaran.',
    peran:[['ketua','Pemilik utama'],['anggota','Anggota']],
    mitra:true, mahasiswa:'kegiatan',
    f:[
      {n:'judul', l:'Judul luaran', t:'text', w:1, full:1},
      {n:'sub_jenis', l:'Jenis', t:'select', w:1, o:[
        ['paten','Paten'],['paten_sederhana','Paten sederhana'],
        ['hak_cipta','Hak cipta'],['desain_industri','Desain produk industri'],
        ['merek','Merek'],['ttg','Teknologi tepat guna'],['produk','Produk'],
        ['buku_isbn','Buku ber-ISBN'],['book_chapter','Book chapter']]},
      {n:'tahun', l:'Tahun', t:'select', w:1, o:TAHUN.map(y=>[y,y])},
      F_BULAN,
      F_INDUK,
      {n:'nama_terbitan', l:'Nomor pendaftaran / penerbit', t:'text',
        sub:'Nomor paten/hak cipta, atau nama penerbit untuk buku'},
      F_TKT,
      F_NOMOR_TKT,
      {n:'url', l:'Tautan', t:'url', full:1, ph:'https://'},
      {n:'keterangan', l:'Keterangan', t:'text', full:1},
    ]
  },
  rekognisi: {
    judul:'Rekognisi',
    hint:'Pengakuan atas kepakaran Anda (LKPS 4.j): pembicara undangan, editor, mitra bestari, penghargaan, dan sejenisnya.',
    peran:[['ketua','Penerima']],
    f:[
      {n:'judul', l:'Nama kegiatan / pengakuan', t:'text', w:1, full:1,
        sub:'Contoh: Invited speaker Seminar Nasional HATHI 2026'},
      {n:'sub_jenis', l:'Bentuk', t:'select', w:1, o:[
        ['invited_speaker','Pembicara undangan'],['narasumber','Narasumber'],
        ['editor','Editor jurnal/buku'],['mitra_bestari','Mitra bestari / reviewer'],
        ['penghargaan','Penghargaan'],['visiting','Visiting scholar/lecturer'],
        ['juri','Juri / asesor'],['lainnya','Lainnya']]},
      {n:'tahun', l:'Tahun', t:'select', w:1, o:TAHUN.map(y=>[y,y])},
      F_BULAN,
      {n:'tingkat', l:'Tingkat', t:'select', w:1, o:TINGKAT},
      {n:'keterangan', l:'Keterangan', t:'text', full:1},
    ]
  },
  integrasi: {
    judul:'Integrasi ke pembelajaran',
    hint:'Penelitian atau PkM yang dimasukkan ke mata kuliah: sebagai bahan kajian, studi kasus, bab buku ajar, atau modul.',
    peran:[['ketua','Pengampu']],
    f:[
      {n:'mata_kuliah', l:'Mata kuliah', t:'select', w:1, o:[],
       sub:'Diambil dari daftar mata kuliah prodi. Hubungi admin bila '
         + 'mata kuliah Anda belum terdaftar.'},
      {n:'induk_id', l:'Penelitian / PkM yang diintegrasikan', t:'select',
       w:1, full:1, o:[],
       sub:'Dipilih dari kegiatan Anda yang sudah tersimpan. Bila belum ada, '
         + 'input kegiatannya lebih dulu di tab Penelitian &amp; PkM.'},
      {n:'sub_jenis', l:'Bentuk integrasi', t:'select', w:1, o:[
        ['bahan_kajian','Bahan kajian'],['studi_kasus','Studi kasus'],
        ['bab_buku_ajar','Bab buku ajar'],['modul_praktikum','Modul praktikum'],
        ['tugas_proyek','Tugas / proyek mahasiswa'],['lainnya','Lainnya']]},
      {n:'tahun', l:'Tahun ajaran (mulai)', t:'select', w:1, o:TAHUN.map(y=>[y,y])},
      F_BUKTI_INTEGRASI,
      F_RPS,
      {n:'keterangan', l:'Keterangan', t:'text', full:1},
    ]
  }
};

// Label isian untuk tabel perbandingan admin.
// SDGs (47-patch-sdgs.sql, pemilik 2026-11-11): dosen memilih satu atau lebih
// Tujuan Pembangunan Berkelanjutan bila karyanya terkait.
export const SDGS = [
  // Nama resmi PBB (bahasa Inggris, pemilik 2026-11-11).
  [1, 'No Poverty'], [2, 'Zero Hunger'], [3, 'Good Health and Well-being'], [4, 'Quality Education'],
  [5, 'Gender Equality'], [6, 'Clean Water and Sanitation'], [7, 'Affordable and Clean Energy'],
  [8, 'Decent Work and Economic Growth'], [9, 'Industry, Innovation and Infrastructure'],
  [10, 'Reduced Inequalities'], [11, 'Sustainable Cities and Communities'],
  [12, 'Responsible Consumption and Production'], [13, 'Climate Action'], [14, 'Life Below Water'],
  [15, 'Life on Land'], [16, 'Peace, Justice and Strong Institutions'], [17, 'Partnerships for the Goals']];
export const F_SDGS = {n:'sdgs', l:'Terkait SDGs', t:'sdgs', full:1,
  sub:'Centang bila karya ini mendukung Tujuan Pembangunan Berkelanjutan, lalu pilih SDG-nya (boleh lebih dari satu).'};
for (const k of ['publikasi', 'kegiatan', 'luaran']) if (FORM[k]) FORM[k].f.push(F_SDGS);
export const teksSDGs = v => (v || []).map(n => `SDG ${n}`).join(', ');

export function labelKolom(c){
  const khusus = { kategori: 'Jenis kegiatan', skema_kode: 'Skema', judul: 'Judul' };
  if(khusus[c]) return khusus[c];
  for(const F of Object.values(FORM)){
    const f = F.f.find(x => x.n === c);
    if(f?.l) return f.l;
  }
  return rapi(c);
}
