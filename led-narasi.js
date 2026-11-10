/* =====================================================================
   led-narasi.js — teks narasi LED dan isian yang tersimpan (pemilik
   2026-11-05). Draf LED (led.js) dan halaman isian (narasi-led.html) memakai
   teks yang sama dari modul ini, jadi keduanya tidak bisa berbeda.

   Tiap [isi: label] menjadi satu isian. Kuncinya lingkup|kalimat|label|urutan
   (tabel led_narasi, 33-patch-narasi-led.sql), tidak bergantung pada fakta di
   kalimat itu: dokumen baru atau TS baru tidak menghilangkan isian lama.
     lingkup  umum, C1..C7 (kriteria), b1..b60 (butir)
   Isian tersimpan ditulis dengan token ⟪teks⟫: tampil tanpa sorot di Word.
   ===================================================================== */
import { dokumenKriteria, labelDokumenLED, tokenTautan } from './led-isi.js?v=2026-11-10-07fa96';

const rentangNo = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String(a + i));
export const KRITERIA = {
  C1: { nama: 'Diferensiasi Misi (Visi, Misi, Tujuan, dan Strategi)', butir: rentangNo(1, 3),
        contoh: 'Statuta, Renstra PT dan UPPS, SK penetapan VMTS, dokumen visi keilmuan program studi' },
  C2: { nama: 'Akuntabilitas (tata pamong, tata kelola, kerja sama, dan keuangan)', butir: rentangNo(4, 11),
        contoh: 'Statuta, peraturan organisasi dan tata kerja, pedoman kerja sama, peraturan keuangan' },
  C3: { nama: 'Relevansi Pendidikan, Penelitian, dan PkM', butir: rentangNo(12, 25),
        contoh: 'pedoman kurikulum, peraturan akademik, pedoman penelitian dan PkM, peta jalan penelitian dan PkM' },
  C4: { nama: 'Sumber Daya Manusia', butir: rentangNo(26, 37),
        contoh: 'peraturan kepegawaian, rencana pengembangan SDM, pedoman beban kerja dosen' },
  C5: { nama: 'Sarana, Prasarana, dan K3L', butir: rentangNo(38, 39),
        contoh: 'pedoman pengelolaan sarana prasarana, kebijakan dan SOP K3L, SOP laboratorium' },
  C6: { nama: 'Mahasiswa dan Luaran Mahasiswa', butir: rentangNo(40, 52),
        contoh: 'peraturan akademik, pedoman kemahasiswaan, pedoman tracer study' },
  C7: { nama: 'Sistem Penjaminan Mutu', butir: rentangNo(53, 57),
        contoh: 'kebijakan SPMI, manual mutu, standar SPMI, pedoman AMI dan RTM' },
};

// Kerangka narasi butir yang tidak dihitung dari data. Butir berkomponen
// dua memakai [[komponen I], [komponen II]]. Isinya mengikuti uraian
// subbagian template LED dan rubrik matriks; fakta prodi selalu [isi: …].
export const NARASI = {
  '1': P => [
    `Visi keilmuan ${P.ps} adalah “${P.visi('ps', 'rumusan visi keilmuan prodi')}”. Visi ini linear dengan visi ${P.pt} “${P.visi('pt', 'visi PT')}” dan visi UPPS “${P.visi('upps', 'nama UPPS dan visinya')}”.`,
    `Kekhasan VMTS terletak pada [isi: bidang kekhasan dan keunggulan kompetitif prodi], yang tertuang dalam ${P.dSemua(['renstra_upps', 'renstra_pt'], 'Renstra: nomor dan periode')} dan diwujudkan dalam kurikulum melalui [isi: CPL atau mata kuliah yang mencerminkan kekhasan].`,
    `VMTS ditinjau ulang secara berkala; peninjauan terakhir dilakukan pada [isi: tahun dan forum peninjauan].`],
  '2': P => [
    `VMTS disusun melalui [isi: tahapan penyusunan, misalnya lokakarya, rapat, survei] dengan melibatkan pemangku kepentingan internal (dosen, mahasiswa, tenaga kependidikan) dan eksternal (alumni, pengguna lulusan, pakar).`,
    `Keterlibatan tiap pihak dibuktikan dengan [isi: notulen, daftar hadir, SK tim, dan tahun pelaksanaan].`],
  '3': P => [
    `VMTS disosialisasikan kepada [isi: sasaran sosialisasi] melalui [isi: media dan kegiatan sosialisasi].`,
    `Tingkat pemahaman diukur dengan [isi: metode, misalnya survei pemahaman VMTS] pada [isi: tahun], dengan hasil [isi: persentase responden yang memahami].`,
    `Capaian jangka pendek dan menengah yang telah diraih: [isi: daftar capaian konkret beserta tahunnya].`],
  '4': P => [[
    `Struktur organisasi UPPS dan ${P.ps} ditetapkan dengan ${P.d('otk', 'nomor SK atau peraturan')} dan berpedoman pada ${P.d('statuta', 'statuta dan nomornya')}.`,
    `Kebijakan operasional, wewenang, dan tugas tiap organ diatur dalam ${P.d('otk', 'dokumen organisasi dan tata kerja atau SOP')}.`], [
    `Penerapan Good University Governance tampak pada [isi: bukti kredibilitas, transparansi, akuntabilitas, tanggung jawab, dan keadilan, misalnya laporan kinerja, rapat terbuka, mekanisme pengaduan].`]],
  '5': P => [[
    `Komitmen pimpinan UPPS ditunjukkan melalui [isi: kebijakan atau program terkait visi dan tujuan strategis], penegakan integritas dan kode etik ${P.d('kode_etik', 'dokumen kode etik')}, serta pengembangan SDM [isi: program studi lanjut, pelatihan, sertifikasi].`], [
    `Kemampuan manajerial pimpinan UPPS tampak pada [isi: contoh pengambilan keputusan dan penyelesaian konflik beserta dampaknya bagi organisasi].`]],
  '7': P => [
    `Kerja sama yang terlaksana memberikan manfaat bagi ${P.ps} dalam pembelajaran, penelitian, dan PkM, antara lain [isi: contoh manfaat konkret].`,
    `Kerja sama meningkatkan kinerja tridharma dan fasilitas pendukung, misalnya [isi: contoh].`,
    `Kepuasan mitra diukur dengan ${P.d('survei_mitra', 'instrumen survei kepuasan mitra')} dengan hasil [isi: ringkasan hasil].`],
  '8': P => [
    `Pengelolaan keuangan UPPS mengikuti ${P.d('pedoman_keuangan', 'peraturan keuangan PT')} dengan prinsip akuntabel, transparan, efektif, dan efisien.`,
    `Anggaran disusun melalui [isi: mekanisme perencanaan anggaran], diaudit oleh ${P.d('laporan_audit_keuangan', 'auditor internal atau eksternal dan tahun audit')}, dan risiko keuangan dikelola dengan [isi: mekanisme].`],
  '12': P => [
    `Kurikulum ${P.ps} dievaluasi dan dimutakhirkan secara berkala; pemutakhiran terakhir dilakukan pada ${P.tahunDok('sk_kurikulum', 'tahun')} dan ditetapkan dengan ${P.d('sk_kurikulum', 'nomor SK kurikulum')}.`,
    `Pemutakhiran melibatkan [isi: pemangku kepentingan internal dan eksternal yang terlibat] dan direviu oleh pakar [isi: nama dan instansi pakar], dengan memperhatikan perkembangan iptek dan kebutuhan pengguna.`],
  '13': P => [[
    `Profil lulusan ${P.ps} adalah [isi: daftar profil lulusan], ditetapkan dengan mempertimbangkan visi UPPS, visi keilmuan prodi, kebutuhan pengguna, sumber daya yang dimiliki, serta kepentingan lokal, nasional, dan global.`], [
    `CPL ${P.ps} berjumlah [isi: jumlah CPL] dan dipetakan ke profil lulusan seperti pada gambar berikut. CPL disusun sesuai kebutuhan pengguna, perkembangan iptek dan industri, serta daya saing global, dan diukur melalui [isi: mekanisme pengukuran CPL, misalnya laporan capaian CPL per semester].`]],
  '14': P => [[
    `CPL mencakup konsep rekayasa khas bidang teknik sipil, kemampuan teknis dan adaptasi teknologi baru, komunikasi dan kerja tim, serta etika profesi, sebagaimana tampak pada [isi: nomor CPL untuk tiap aspek].`], [
    `Pencapaian CPL ditinjau secara rutin [isi: frekuensi] melalui [isi: forum tinjauan] yang melibatkan [isi: pemangku kepentingan internal dan eksternal]; hasil tinjauan terakhir: [isi: ringkasan].`]],
  '15': P => [[
    `${P.jumlahRPS} dari ${P.jumlahMK} mata kuliah memiliki RPS yang memuat 9 komponen, dan RPS dapat diakses mahasiswa melalui [isi: sistem atau tautan].`], [
    `RPS ditinjau secara berkala [isi: frekuensi dan mekanisme]; tinjauan terakhir pada [isi: semester dan tahun].`]],
  '16': P => [[
    `Proses pembelajaran menggunakan metode [isi: metode, misalnya PBL atau studi kasus], media dan sumber belajar [isi: LMS, laboratorium], interaksi dosen dan mahasiswa [isi: bentuk], serta tugas yang meningkatkan daya analisis kritis [isi: contoh].`], [
    `Pemantauan proses pembelajaran dilakukan [isi: frekuensi] melalui [isi: instrumen, misalnya monitoring kesesuaian materi dengan RPS dan EDOM], dan temuan ditindaklanjuti dengan [isi: contoh tindakan perbaikan].`]],
  '17': P => [
    `Hasil penelitian dan PkM DTPS diintegrasikan ke dalam pembelajaran pada ${P.jumlahIntegrasi} mata kuliah (Tabel 3.a.3 LKPS), misalnya ${P.contohIntegrasi}.`,
    `Integrasi ini relevan dengan CPL, mendukung keunggulan kompetitif prodi, mengandung kebaruan ilmiah, dan berdampak sosial: [isi: uraian singkat].`],
  '18': P => [
    `Pembelajaran dalam bentuk penugasan, praktikum, praktik bengkel, atau praktik lapangan dilaksanakan pada [isi: daftar mata kuliah atau kegiatan]. Rasio jam penugasan dan praktik terhadap jam pembelajaran total disajikan pada tabel berikut.`],
  '20': P => [
    `Capstone design dilaksanakan pada mata kuliah ${P.capstone} dengan mata kuliah penunjang ${P.capstonePendukung} (Tabel 3.a.5 LKPS).`,
    `Pelaksanaannya diatur dalam ${P.d('panduan_capstone', 'panduan capstone')}, memiliki CPMK [isi: rumusan CPMK], serta menggunakan standar keteknikan [isi: standar yang dipakai, misalnya SNI] dan batasan realistis. Bukti pelaksanaan: [isi: laporan, poster, atau dokumen].`],
  '21': P => [[
    `Suasana akademik dikelola melalui kebijakan ${P.d('peraturan_akademik', 'dokumen')}, program [isi: seminar, kuliah tamu, kelompok studi], dan fasilitas [isi: ruang diskusi, laboratorium], yang dievaluasi secara berkala melalui [isi: mekanisme evaluasi].`], [
    `Kebebasan akademik, mimbar akademik, dan otonomi keilmuan dilaksanakan melalui kegiatan terjadwal seperti [isi: contoh kegiatan dan jadwalnya].`]],
  '22': P => [
    `UPPS memiliki peta jalan penelitian (${P.d('peta_jalan_penelitian', 'periode')}) yang mendukung VMTS UPPS dan visi keilmuan ${P.ps}, dengan tema ${P.tema('penelitian')}.`,
    `Peta jalan memayungi tema penelitian dosen dan mahasiswa, dievaluasi secara berkala [isi: mekanisme evaluasi], dan berdampak bagi masyarakat [isi: contoh dampak].`],
  '24': P => [
    `UPPS memiliki peta jalan PkM (${P.d('peta_jalan_pkm', 'periode')}) yang mendukung VMTS UPPS dan visi keilmuan ${P.ps}, dengan tema ${P.tema('pkm')}.`,
    `Peta jalan memayungi tema PkM dosen dan mahasiswa, dievaluasi secara berkala [isi: mekanisme evaluasi], dan berdampak bagi masyarakat [isi: contoh dampak].`],
  '29': P => [
    `Tenaga kependidikan pendukung prodi terdiri atas ${P.tendik} dengan kualifikasi [isi: pendidikan dan sertifikat kompetensi] (Tabel 4.b LKPS). Kecukupannya dinilai terhadap [isi: jumlah laboratorium dan beban layanan].`],
  '30': P => [
    `Rerata beban kerja DTPS dihitung dari data BKD (Tabel 4.c LKPS) dan disajikan pada tabel berikut. [isi: analisis sebaran beban pendidikan, penelitian, PkM, dan tugas tambahan].`],
  '38': P => [[
    `Sarana akademik meliputi ${P.ruang} (Tabel 5.a LKPS); kelayakan dan kemudahan aksesnya: [isi: uraian].`], [
    `Sarana nonakademik meliputi pusat kesehatan, layanan konseling, layanan karier, dan fasilitas ibadah: [isi: uraian, kelayakan, dan kemudahan akses].`]],
  '39': P => [
    `Kebijakan dan tata kelola K3L ditetapkan dalam ${P.d('kebijakan_k3l', 'dokumen')}, didukung sarana ${P.saranaK3L} (Tabel 5.b dan 5.c LKPS).`,
    `Pelaksanaan K3L dibuktikan dengan [isi: inspeksi, pelatihan, simulasi] dan ditinjau secara berkala [isi: frekuensi].`],
  '48': P => [
    `Tracer study dikoordinasikan oleh [isi: unit tingkat PT], dilaksanakan setiap tahun [isi: periode], memakai kuesioner yang memuat pertanyaan inti tracer study DIKTI, dan menyasar seluruh lulusan TS-2 s.d. TS-1 dengan tingkat respons ${P.responsTracer}.`,
    `Hasilnya disosialisasikan kepada [isi: sasaran] dan digunakan untuk [isi: contoh perbaikan kurikulum dan pembelajaran].`],
  '52': P => [
    `Kepuasan pengguna lulusan diukur pada tujuh aspek (Tabel 6.g.2 LKPS) melalui [isi: instrumen dan jumlah responden]; hasilnya disajikan pada tabel berikut. [isi: aspek terkuat, aspek terlemah, dan tindak lanjutnya].`],
  '53': P => [[
    `Unit penjaminan mutu UPPS dibentuk dengan ${P.d('sk_unit_pm', 'nomor SK')}; auditor bersifat independen [isi: dasar]; audit mutu internal dilaksanakan ${P.d('laporan_ami', 'tahun atau siklus')}, dan hasilnya dibahas dalam Rapat Tinjauan Manajemen ${P.d('laporan_rtm', 'tanggal RTM')}.`], [
    `Perangkat SPMI terdiri atas kebijakan SPMI, pedoman PPEPP, standar, dan tata cara pendokumentasian (${P.dSemua(['kebijakan_spmi', 'manual_spmi', 'standar_spmi', 'tata_cara_dokumentasi_spmi'], 'nomor dokumen')}). Pengakuan mutu eksternal: [isi: akreditasi, sertifikasi, atau audit eksternal].`]],
  '54': P => [
    `IKT ${P.ps} adalah ${P.daftarIKT}, disusun dari tujuan strategis, berdampak dan terukur, menunjukkan daya saing internasional, dan telah diukur pada ${P.tahunIKT} dengan hasil ${P.capaianIKT}.`],
  '55': P => [
    `Dokumen IKU dan IKT tersedia dalam ${P.d('dokumen_iku_ikt', 'dokumen')}. Siklus PPEPP terlaksana, misalnya [isi: satu siklus lengkap dari penetapan sampai peningkatan standar]. Bukti efektivitas: [isi: temuan AMI dan tindak lanjutnya].`],
  '56': P => [
    `Capaian kinerja diukur dengan [isi: metode]; indikator yang tidak tercapai dianalisis akar masalahnya [isi: contoh], ditinjau rutin dalam [isi: forum], dan hasilnya disebarluaskan melalui [isi: media].`],
  '57': P => [
    `Kepuasan pemangku kepentingan (mahasiswa, dosen, tenaga kependidikan, lulusan, pengguna, dan mitra) terhadap layanan manajemen diukur dengan ${P.d('survei_kepuasan', 'instrumen dan periode')}, dengan hasil [isi: ringkasan per kelompok] dan tindak lanjut [isi: uraian].`],
  '58': P => [[
    `Lingkungan makro yang memengaruhi pengembangan ${P.ps}: [isi: kebijakan nasional, perkembangan iptek bidang teknik sipil, isu strategis]. Lingkungan mikro: [isi: pesaing, pengguna lulusan, kebutuhan dunia usaha dan industri].`,
    `Dari analisis ini, alternatif pengembangan yang relevan adalah [isi: uraian].`], [
    `Rangkuman SWOT seluruh kriteria disajikan di bawah. Posisi UPPS dan prodi berdasarkan analisis SWOT: [isi: kuadran dan alasannya].`]],
  '59': P => [
    `Tujuan strategis pengembangan ${P.ps} untuk jangka pendek dan menengah adalah [isi: daftar tujuan strategis], diturunkan dari analisis SWOT, ${P.dSemua(['renstra_upps', 'renstra_pt'], 'Renstra: nomor dan periode')}, dan aspirasi pemangku kepentingan.`],
  '60': P => [
    `Program pengembangan berkelanjutan disusun dari tujuan strategis dengan memperhatikan alokasi sumber daya, kemampuan pelaksanaan, rencana penjaminan mutu, dan dukungan eksternal: [isi: program, target, indikator, dan tahun].`],
};

Object.entries(KRITERIA).forEach(([kode, K]) => { K.kode = kode; });

const RE_ISI = /\[isi:\s*([^\]]*)\]/g;
export const kunciTambahan = lingkup => `${lingkup}|tambahan`;

// Ganti [isi: …] dengan isian tersimpan; yang belum diisi tetap [isi: …].
export function terapkanIsian(teks, lingkup, id, simpan = {}){
  const n = {};
  return String(teks).replace(RE_ISI, (m, label) => {
    n[label] = (n[label] || 0) + 1;
    const v = simpan[`${lingkup}|${id}|${label}|${n[label]}`];
    return v ? `⟪${String(v).replace(/[⟪⟫]/g, '').replace(/\s*\n\s*/g, ' ')}⟫` : m;
  }).replace(/\.⟫\./g, '.⟫');       // isian berakhir titik di depan titik kalimat
}

// Potongan kalimat untuk halaman isian: {t} teks, {url, t} tautan, {kunci, label} isian.
export function pisahKalimat(teks, lingkup, id){
  const n = {}, out = [];
  String(teks).split(/(\[isi:[^\]]*\]|⟦[^⟧]*⟧)/).filter(Boolean).forEach(s => {
    if (s.startsWith('[isi:')) {
      const label = s.slice(5, -1).trim();
      n[label] = (n[label] || 0) + 1;
      out.push({ kunci: `${lingkup}|${id}|${label}|${n[label]}`, label });
    } else if (s.startsWith('⟦')) {
      const i = s.indexOf('|');
      out.push({ url: s.slice(1, i), t: s.slice(i + 1, -1) });
    } else out.push({ t: s });
  });
  return out;
}

const baris = xs => xs.map((teks, i) => ({ id: `n${i}`, teks }));

// Kalimat satu butir (komponen k). ada = datanya tersaji di tabel.
export function kalimatButir(no, k, C, ada){
  const nar = NARASI[no] ? NARASI[no](C.P) : null;
  const dua = Array.isArray(nar?.[0]);
  const bagian = dua ? nar[k] || [] : (k === 0 ? nar || [] : []);
  if (bagian.length) return bagian.map((teks, i) => ({ id: `k${k}.${i}`, teks }));
  if (k > 0) return [];
  const judul = (C.judulButir || {})[no] || `Butir ${no}`;
  const jd = judul.replace(/\s*\((Tabel[^)]*)\)\s*$/, '');
  const tbl = (judul.match(/\((Tabel[^)]*)\)\s*$/) || [])[1];
  return [{ id: 'u', teks: `${ada ? `Data ${jd.toLowerCase()} pada TS ${C.ta2} s.d. ${C.ta}${tbl ? ` (${tbl})` : ''} disajikan pada tabel berikut. ` : ''}[isi: uraian capaian dan maknanya bagi prodi].` }];
}
export const komponenButir = no => (NARASI[no] && Array.isArray(NARASI[no]({ d: () => '', dSemua: () => '', tahunDok: () => '', visi: () => '', tema: () => '' })?.[0]) ? [0, 1] : [0]);

export const kalimatCapaian = (C, ada, no) => ({ id: 'capaian', teks: `Capaian TS ${C.ta2} s.d. ${C.ta}: ${ada
  ? 'tersaji pada tabel di atas' : '[isi: angka per tahun]'}, dibanding ${(C.P.targetButir && C.P.targetButir(no)) || 'target [isi: target Renstra atau IKU]'}. ` +
  'Analisis: [isi: faktor pendukung dan akar masalah bila target belum tercapai]. ' +
  'Tindak lanjut: [isi: kegiatan, penanggung jawab, tenggat, indikator keberhasilan].' });

export function kalimatKriteria(K, bagian, C){
  if (bagian === 'latar') return [{ id: 'latar', teks: `Kriteria ${K.nama} bertujuan [isi: tujuan kriteria bagi UPPS dan prodi]. [isi: latar belakang dan rasional, dikaitkan dengan VMTS UPPS dan visi keilmuan ${C.P.ps}].` }];
  if (bagian === 'kebijakan') {
    const xs = dokumenKriteria(K.butir, C);
    return [{ id: 'kebijakan', teks: xs.length
      ? `Dokumen formal kebijakan yang diacu: ${xs.map(d => tokenTautan(d.url, labelDokumenLED(d))).join('; ')}. [isi: dokumen lain yang belum ada di pustaka, bila ada].`
      : `Dokumen formal kebijakan yang diacu: [isi: daftar nomor, judul, dan tahun dokumen]. Dokumen yang lazim untuk kriteria ini: ${K.contoh}.` }];
  }
  if (bagian === 'analisis') return [
    { id: 'analisis0', teks: `Capaian kriteria ${K.nama} pada TS ${C.ta2} s.d. ${C.ta} disajikan pada subbagian di atas. [isi: capaian yang menonjol dan yang belum optimal].` },
    { id: 'analisis1', teks: 'Faktor pendukung keberhasilan: [isi: uraian]. Akar masalah butir yang belum optimal: [isi: hasil analisis akar masalah, misalnya diagram tulang ikan].' }];
  return ['Kekuatan', 'Kelemahan', 'Peluang', 'Ancaman', 'Strategi perbaikan dan pengembangan (SO, WO, ST, WT)']
    .map((n, i) => ({ id: `swot${i}`, teks: `${n}: [isi: uraian].` }));
}

export const AWAL_ANGGOTA_TIM = 'Anggota tim penyusun:';

// Baris tabel Identitas Pengusul yang tidak ada sumbernya di sistem; label sama
// dengan templat. Disimpan di led_narasi seperti kotak lain. Peringkat dan SK
// akreditasi diambil dari Data prodi (daftarProdi).
export const ISIAN_IDENTITAS = ['Unit Pengelola Program Studi', 'Alamat', 'Nomor Telepon', 'E-Mail dan Website',
  'Nomor SK Pendirian PT', 'Tanggal SK Pendirian PT', 'Pejabat Penandatangan SK Pendirian PT',
  'Nomor SK Pembukaan PS', 'Tanggal SK Pembukaan PS', 'Pejabat Penandatangan SK Pembukaan PS',
  'Tahun Pertama Kali Menerima Mahasiswa'];
export const KOTA_PT = 'Kota kedudukan perguruan tinggi';
export const FOLDER_INDUK = 'nama dan tautan folder induk';
export const NARAHUBUNG = 'nama, jabatan, surel, telepon';
export const nilaiIdentitas = (narasi, label) => (narasi || {})[`umum|identitas|${label}|1`] || '';

export function kalimatUmum(bagian, C){
  const P = C.P;
  return {
    pengantar: [{ id: 'pengantar', teks: '[isi: kata pengantar dari pimpinan UPPS atau ketua program studi, termasuk ucapan terima kasih kepada tim penyusun dan pemangku kepentingan].' }],
    ringkasan: [
      { id: 'ringkasan0', teks: `Laporan Evaluasi Diri ini disusun oleh ${P.ps} ${P.pt} untuk akreditasi dengan instrumen APS-AV 2025 LAM Teknik. [isi: ringkasan proses penyusunan].` },
      { id: 'ringkasan1', teks: '[isi: capaian utama program studi pada TS ini, dikaitkan dengan VMTS dan target renstra].' },
      { id: 'ringkasan2', teks: 'Kekuatan utama: [isi: uraian]. Tantangan utama: [isi: uraian]. Rencana pengembangan: [isi: uraian].' }],
    pendahuluan: [{ id: 'pendahuluan', teks: `Bab ini menguraikan [isi: dasar penyusunan LED, tujuan, ruang lingkup, dan sistematika laporan]. Data LED ini mengacu pada TS ${C.ta}, dengan jendela tiga tahun TS-2 s.d. TS (${C.ta2} s.d. ${C.ta}).` }],
    tim: [
      { id: 'tim0', teks: `Tim penyusun LED ${P.ps} ditetapkan dengan [isi: nomor dan tanggal SK tim] dan melibatkan [isi: unit dan pemangku kepentingan internal dan eksternal].` },
      { id: 'timAnggota', teks: `${AWAL_ANGGOTA_TIM} ${P.timPenyusun}.` },
      { id: 'tim1', teks: 'Mekanisme kerja: pengumpulan data dari [isi: sumber data], verifikasi dan validasi oleh [isi: penanggung jawab], pengecekan konsistensi data LED dan LKPS, analisis data, identifikasi akar masalah, dan penetapan strategi pengembangan. Data dosen dan bukti karya dihimpun melalui sistem data dosen prodi, dengan berkas bukti di Google Drive prodi.' },
      { id: 'tim2', teks: 'Jadwal kerja tim: [isi: tahapan dan tanggal].' }],
    identitas: [...ISIAN_IDENTITAS.map(l => ({ id: 'identitas', teks: `${l}: [isi: ${l}].` })),
      { id: 'identitas', teks: `Sampul, ${KOTA_PT.toLowerCase()}: [isi: ${KOTA_PT}].` },
      { id: 'identitas', teks: `Lampiran, folder induk bukti di Drive prodi: [isi: ${FOLDER_INDUK}].` },
      { id: 'identitas', teks: `Lampiran, narahubung verifikasi bukti: [isi: ${NARAHUBUNG}].` },
      { id: 'identitasData', teks: 'Daftar program studi, peringkat, dan SK akreditasi diambil dari Data prodi, tab Prodi di UPPS.' }],
    penutup: [{ id: 'penutup', teks: '[isi: kesimpulan akhir: temuan utama, kekuatan, kelemahan yang perlu diperbaiki, serta peluang dan ancaman yang harus dikelola].' }],
  }[bagian];
}

// Susunan halaman isian: [{ lingkup, judul, kalimat:[{id, teks}], tambahan }].
export function bagianNarasi(C){
  const adaData = no => !C.manual.has(String(no));
  const butir = no => ({ lingkup: `b${no}`, judul: `Butir ${no}. ${(C.judulButir || {})[no] || ''}`, tambahan: true,
    kalimat: [...komponenButir(no).flatMap(k => kalimatButir(String(no), k, C, adaData(no))), kalimatCapaian(C, adaData(no), no)] });
  const umum = (bagian, judul) => ({ lingkup: 'umum', judul, kalimat: kalimatUmum(bagian, C) });
  // Butir 58 terbagi: Komponen I di Bab II bagian B, Komponen II (SWOT) di Bab III.
  const komponen58 = (k, judul, ekor) => ({ lingkup: 'b58', judul, tambahan: ekor,
    kalimat: [...kalimatButir('58', k, C, adaData(58)), ...(ekor ? [kalimatCapaian(C, adaData(58), 58)] : [])] });
  return [
    { id: 'identitas', pendek: 'Identitas', kelompok: 'Identitas pengusul, sampul, dan lampiran', bagian: [umum('identitas', 'Identitas pengusul')] },
    { id: 'awal', pendek: 'Bagian awal', kelompok: 'Bagian awal', bagian: [umum('pengantar', 'Kata pengantar'), umum('ringkasan', 'Ringkasan eksekutif'),
      umum('pendahuluan', 'Bab I Pendahuluan')] },
    { id: 'A', pendek: 'A. Tim penyusun', kelompok: 'A. Struktur Tim Penyusun dan Mekanisme Kerja', bagian: [umum('tim', 'Tim penyusun')] },
    { id: 'B', pendek: 'B. Lingkungan eksternal', kelompok: 'B. Analisis Lingkungan Eksternal', bagian: [komponen58(0, 'Lingkungan makro dan mikro', true)] },
    ...Object.values(KRITERIA).map(K => ({ id: K.kode, pendek: K.kode.replace('C', 'C.'),
      kelompok: `${K.kode.replace('C', 'C.')} ${K.nama}`, bagian: [
      { lingkup: K.kode, judul: 'Latar belakang dan kebijakan', kalimat: [...kalimatKriteria(K, 'latar', C), ...kalimatKriteria(K, 'kebijakan', C)] },
      ...K.butir.map(butir),
      { lingkup: K.kode, judul: 'Analisis faktor keberhasilan', kalimat: kalimatKriteria(K, 'analisis', C) },
      { lingkup: K.kode, judul: 'SWOT dan strategi', kalimat: kalimatKriteria(K, 'swot', C) }] })),
    { id: 'akhir', pendek: 'Bab III dan penutup', kelompok: 'Bab III dan penutup', bagian: [komponen58(1, 'Analisis SWOT semua kriteria', false), butir(59), butir(60), umum('penutup', 'Bab IV Penutup')] },
  ];
}

// Saring halaman isian. Teks cari kosong = semua bagian cocok.
export const judulCocok = (judul, cari = '') => String(judul).toLowerCase().includes(cari.trim().toLowerCase());

// Yang boleh menulis narasi; sama dengan boleh_narasi() di
// supabase/36-patch-tim-penyusun.sql.
export const penulisNarasi = dosen => (dosen || []).filter(d => d.aktif !== false
  && (d.peran === 'admin' || (d.tim_penyusun && d.peran !== 'asesor')));

// Yang bisa dicentang masuk tim. Admin selalu boleh menulis, jadi centangnya hanya
// menentukan namanya tertulis di LED. Asesor tidak pernah masuk tim.
export const calonTim = dosen => (dosen || []).filter(d => d.aktif !== false && d.peran !== 'asesor');

// Susunan sesudah satu anggota digeser (arah -1 naik, 1 turun); di ujung tidak berubah.
export function geserTim(ids, id, arah){
  const i = ids.indexOf(id), j = i + arah, out = [...ids];
  if (i < 0 || j < 0 || j >= ids.length) return out;
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}

// Bagian yang ditugaskan ke satu penulis; email tidak peka huruf besar.
export const bagianSaya = (tugas, email) => Object.keys(tugas || {})
  .filter(k => String(tugas[k]).toLowerCase() === String(email).toLowerCase());

// Pilihan saat halaman dibuka: yang terakhir dipakai di browser ini ([] = semua),
// kalau belum pernah memilih: bagian milik penulis itu.
export const pilihanAwal = (ids, tersimpan, saya) =>
  Array.isArray(tersimpan) ? tersimpan.filter(x => ids.includes(x)) : saya;

// Penulis lain mengubah kotak ini sesudah halaman dimuat, dan isinya berbeda
// dari yang akan disimpan.
export const bentrok = (dimuat, terkini, baru) =>
  (terkini || '') !== (dimuat || '') && (terkini || '') !== (baru || '');

// Pembagian bagian: { kelompok: email }. Tabel belum ada (patch 35) -> null.
export async function ambilPenugasan(sb){
  const { data, error } = await sb.from('led_penugasan').select('kelompok,email');
  return error ? null : Object.fromEntries((data || []).map(r => [r.kelompok, r.email]));
}

// Semua isian tersimpan: { kunci: nilai }. Tabel belum ada -> kosong.
export async function ambilNarasi(sb){
  const out = {};
  for (let awal = 0; ; awal += 1000) {
    const { data, error } = await sb.from('led_narasi').select('kunci,nilai').order('kunci').range(awal, awal + 999);
    if (error) return out;
    (data || []).forEach(r => { out[r.kunci] = r.nilai; });
    if (!data || data.length < 1000) return out;
  }
}
