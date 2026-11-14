// Survei kepuasan daring (pemilik 2026-11-11; 54-patch-survei-kepuasan.sql).
// Butir 57 (kepuasan pemangku), butir 7 unsur 3 (mitra), butir 52 (pengguna
// lulusan, Tabel 6.g.2). Skala 1–4 sama dengan 6.g.2: 1 kurang, 2 cukup,
// 3 baik, 4 sangat baik. Templat bawaan adalah draf (2026-11-11) yang bisa
// disunting admin per survei; pengguna lulusan memakai 7 aspek resmi 6.g.2.
// 2026-11-13 (pemilik): templat per kelompok menjawab butir LAM (bagian + butir per pertanyaan),
// tracer memuat pertanyaan inti DIKTI, dan semua teks bisa dwibahasa (72-patch-survei-dwibahasa.sql).
import { ASPEK_KEPUASAN } from './butir-manual.js?v=2026-11-14-350ed7';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const KELOMPOK_SURVEI = [['mahasiswa', 'Mahasiswa'], ['dosen', 'Dosen'], ['tendik', 'Tenaga kependidikan'],
  ['mitra', 'Mitra kerja sama'], ['pengguna', 'Pengguna lulusan'], ['alumni', 'Alumni (tracer)']];
export const labelKelompok = k => (KELOMPOK_SURVEI.find(x => x[0] === k) || [, k])[1];
export const SKALA = [[4, 'Sangat baik'], [3, 'Baik'], [2, 'Cukup'], [1, 'Kurang']];
export const SKALA_EN = [[4, 'Excellent'], [3, 'Good'], [2, 'Fair'], [1, 'Poor']];
// Jenis pertanyaan ala Google Form (pemilik 2026-11-11); aturan sama dengan survei_kirim di SQL.
export const JENIS_PERTANYAAN = [['skala', 'Skala 1–4'], ['pilihan', 'Pilihan (satu)'], ['centang', 'Kotak centang (banyak)'],
  ['angka', 'Angka'], ['singkat', 'Isian singkat'], ['teks', 'Isian panjang']];
export const IDENTITAS = [['tidak', 'Anonim (tanpa identitas)'], ['opsional', 'Identitas opsional'], ['wajib', 'Identitas wajib (nama + NIM atau email)']];
export const wajibQ = q => q.wajib ?? ['skala', 'pilihan'].includes(q.jenis);
/** Pertanyaan berlaku bila tanpa syarat, atau jawaban pertanyaan acuannya termasuk nilai syarat. */
export const aktifQ = (q, jawaban) => !q.syarat || (q.syarat.nilai || []).includes(jawaban?.[q.syarat.q]);
// Penyunting admin: opsi "a; b; c" dan syarat "status=bekerja|wirausaha".
export const teksOpsi = xs => (xs || []).join('; ');
export const bacaOpsi = s => [...new Set(String(s || '').split(';').map(x => x.trim()).filter(Boolean))];
export const teksSyarat = sy => sy ? `${sy.q}=${(sy.nilai || []).join('|')}` : '';
export function bacaSyarat(s){
  const m = String(s || '').trim().match(/^([a-z0-9_]{1,40})\s*=\s*(.+)$/);
  return m ? { q: m[1], nilai: m[2].split('|').map(x => x.trim()).filter(Boolean) } : null;
}
export const LABEL_ASPEK = {
  keandalan: 'Keandalan', daya_tanggap: 'Daya tanggap', kepastian: 'Kepastian', empati: 'Empati', sarana: 'Sarana dan prasarana',
  tata_kelola: 'Kepemimpinan dan tata kelola', administrasi: 'Layanan administrasi', pengembangan: 'Pengembangan diri dan karier',
  tridharma: 'Dukungan tridharma', kesejahteraan: 'Kesejahteraan dan suasana kerja', manfaat: 'Manfaat kerja sama',
  komunikasi_mitra: 'Komunikasi dan koordinasi', pelaksanaan: 'Pelaksanaan kegiatan', kompetensi: 'Kompetensi pelaksana',
  keberlanjutan: 'Keberlanjutan', saran: 'Saran', kurikulum: 'Kurikulum', tahun_lulus: 'Tahun lulus', status: 'Status',
  waktu_tunggu: 'Waktu tunggu', kesesuaian: 'Kesesuaian bidang', tingkat_kerja: 'Tingkat tempat kerja', instansi: 'Instansi',
  pengguna: 'Pengguna lulusan', vmts: 'Visi, misi, tujuan, dan strategi', pembelajaran: 'Proses pembelajaran',
  suasana: 'Suasana akademik', nonakademik: 'Layanan nonakademik', k3l: 'Keselamatan dan kesehatan kerja (K3L)',
  kerja_sama: 'Kerja sama', profil: 'Profil lulusan', pendapatan: 'Pendapatan', lokasi: 'Lokasi kerja',
  studi_lanjut: 'Studi lanjut', kompetensi_lulus: 'Kompetensi saat lulus', kompetensi_kerja: 'Kompetensi yang diperlukan',
  ...Object.fromEntries(ASPEK_KEPUASAN),
};
export const labelAspek = a => LABEL_ASPEK[a] || String(a || '').replace(/_/g, ' ');

// ---------------------------------------------------------------------------------------------
// Templat per kelompok (pemilik 2026-11-13: satu kuesioner per kelompok, menjawab kebutuhan LAM Teknik;
// dwibahasa untuk responden asing). Kunci tambahan per pertanyaan, semuanya opsional:
//   bagian    kode bagian (BAGIAN); pertanyaan berurutan dengan bagian sama tampil sebagai satu langkah.
//   butir     butir LAM yang dijawab, mis. ['16', '57'] (rencana-bukti.js). Bukan pilihan responden.
//   teks_en, opsi_en (berpasangan satu-satu dengan opsi), ket / ket_en (petunjuk di bawah pertanyaan),
//   ujung / ujung_en (label ujung untuk opsi angka 1–5).
// Nilai jawaban yang tersimpan selalu opsi bahasa Indonesia, apa pun bahasa yang dipilih responden.
// Sumber butir (skor 4 di rencana-bukti.js): 2 pelibatan pemangku dalam VMTS; 3 pemahaman VMTS;
// 5 kepuasan terhadap kepemimpinan; 7 kepuasan mitra; 12 dan 13 masukan kurikulum dan kebutuhan
// pengguna; 16 EDOM/proses pembelajaran; 21 suasana akademik; 38 sarana akademik dan layanan
// nonakademik; 39 K3L; 48–51 tracer (pertanyaan inti DIKTI); 52 kepuasan pengguna; 57 kepuasan
// seluruh pemangku.
// ---------------------------------------------------------------------------------------------
export const BAGIAN = {
  profil: ['Data lulusan', 'Graduate profile'],
  pekerjaan: ['Pekerjaan', 'Employment'],
  studi_lanjut: ['Studi lanjut', 'Further study'],
  kompetensi: ['Kompetensi', 'Competencies'],
  vmts: ['Visi, misi, tujuan, dan strategi', 'Vision, mission, objectives and strategy'],
  tata_kelola: ['Kepemimpinan dan tata kelola', 'Leadership and governance'],
  pembelajaran: ['Proses pembelajaran', 'Teaching and learning'],
  suasana: ['Suasana akademik', 'Academic atmosphere'],
  layanan: ['Mutu layanan', 'Service quality'],
  sarana: ['Sarana, prasarana, dan keselamatan', 'Facilities and safety'],
  sdm: ['Pengembangan dan kesejahteraan', 'Development and welfare'],
  kerja_sama: ['Kerja sama', 'Partnership'],
  instansi: ['Profil instansi', 'About your organisation'],
  kinerja_lulusan: ['Kinerja lulusan', 'Graduate performance'],
  kurikulum: ['Kurikulum dan kompetensi', 'Curriculum and competencies'],
  masukan: ['Masukan', 'Feedback'],
};
export const labelBagian = (b, en = false) => BAGIAN[b] ? BAGIAN[b][en ? 1 : 0] : String(b || '').replace(/_/g, ' ');
/** Teks pertanyaan, opsi tampilan, dan petunjuk dalam bahasa terpilih (jatuh ke bahasa Indonesia). */
export const teksQ = (q, en = false) => (en && String(q.teks_en || '').trim()) || q.teks;
export const ketQ = (q, en = false) => (en && String(q.ket_en || '').trim()) || q.ket || '';
export const opsiQ = (q, en = false) => (q.opsi || []).map((o, i) => [o, (en && q.opsi_en?.[i]) || o]);
export const ujungQ = (q, en = false) => (en && q.ujung_en?.length === 2 ? q.ujung_en : q.ujung) || null;
/** Butir LAM yang tercakup oleh daftar pertanyaan, terurut angka. */
export const butirSurvei = xs => [...new Set((xs || []).flatMap(q => q.butir || []).map(String))].sort((a, b) => +a - +b);

// Q: skala 1–4. P: pilihan satu. C: centang. A: angka. I: isian singkat. T: isian panjang.
const Q = (id, aspek, teks, teks_en, x = {}) => ({ id, aspek, teks, teks_en, jenis: 'skala', ...x });
const P = (id, aspek, teks, teks_en, opsi, opsi_en, x = {}) => ({ id, aspek, teks, teks_en, jenis: 'pilihan', opsi, opsi_en, ...x });
const C = (id, aspek, teks, teks_en, opsi, opsi_en, x = {}) => ({ id, aspek, teks, teks_en, jenis: 'centang', opsi, opsi_en, wajib: false, ...x });
const A = (id, aspek, teks, teks_en, x = {}) => ({ id, aspek, teks, teks_en, jenis: 'angka', ...x });
const I = (id, aspek, teks, teks_en, x = {}) => ({ id, aspek, teks, teks_en, jenis: 'singkat', ...x });
const T = (id, aspek, teks, teks_en, x = {}) => ({ id, aspek, teks, teks_en, jenis: 'teks', ...x });
/** Tandai sederet pertanyaan dengan bagian dan butir (butir per pertanyaan boleh menimpa). */
const bag = (bagian, butir, xs) => xs.map(q => ({ bagian, butir, ...q }));

// Tracer (DIKTI 2021, kuesioner wajib; Tabel 6.g.1 untuk tingkat tempat kerja).
// Nilai lama ('bekerja', 'wirausaha', 'studi lanjut', 'belum bekerja') tetap dibaca keTabelTracer.
export const STATUS_ALUMNI = ['Bekerja (full time/part time)', 'Wiraswasta', 'Melanjutkan pendidikan',
  'Tidak kerja tetapi sedang mencari kerja', 'Belum memungkinkan bekerja'];
const STATUS_ALUMNI_EN = ['Employed (full time/part time)', 'Self-employed', 'Continuing education',
  'Not employed, looking for work', 'Not yet able to work'];
const KERJA_BARU = STATUS_ALUMNI.slice(0, 2);
/** Status yang dihitung bekerja/berwirausaha di Tabel 6.f/6.g (nilai baru dan lama). */
export const BEKERJA = [...KERJA_BARU, 'bekerja', 'wirausaha'];
export const TINGKAT_KERJA = { wilayah: 'wilayah/lokal', nasional: 'nasional atau wirausaha berizin', internasional: 'multinasional/internasional' };
const TINGKAT_EN = ['Local/regional', 'National, or licensed own business', 'Multinational/international'];
// f14 DIKTI (5 tingkat) -> kategori Tabel 6.f.2 (rendah/sedang/tinggi), disetujui pemilik 2026-11-13:
// sangat erat dan erat = tinggi, cukup erat = sedang, kurang erat dan tidak sama sekali = rendah.
// Nilai lama (tinggi/sedang/rendah) dibaca apa adanya.
export const KESESUAIAN = ['Sangat erat', 'Erat', 'Cukup erat', 'Kurang erat', 'Tidak sama sekali'];
const KESESUAIAN_EN = ['Very closely', 'Closely', 'Fairly closely', 'Loosely', 'Not at all'];
export const KESESUAIAN_LKPS = { 'Sangat erat': 'tinggi', 'Erat': 'tinggi', 'Cukup erat': 'sedang', 'Kurang erat': 'rendah',
  'Tidak sama sekali': 'rendah', tinggi: 'tinggi', sedang: 'sedang', rendah: 'rendah' };
const JENIS_INSTANSI = ['Instansi pemerintah', 'BUMN/BUMD', 'Institusi/organisasi multilateral', 'Organisasi non-profit/LSM',
  'Perusahaan swasta', 'Wiraswasta/perusahaan sendiri', 'Lainnya'];
const JENIS_INSTANSI_EN = ['Government agency', 'State/regional-owned enterprise', 'Multilateral institution/organisation',
  'Non-profit organisation/NGO', 'Private company', 'Self-employed/own company', 'Other'];
const SUMBER_DANA = ['Biaya sendiri/keluarga', 'Beasiswa ADIK', 'Beasiswa BIDIKMISI', 'Beasiswa PPA', 'Beasiswa AFIRMASI',
  'Beasiswa perusahaan/swasta', 'Lainnya'];
const SUMBER_DANA_EN = ['Self/family funded', 'ADIK scholarship', 'BIDIKMISI scholarship', 'PPA scholarship', 'AFIRMASI scholarship',
  'Company/private scholarship', 'Other'];
const TINGKAT_PENDIDIKAN = ['Setingkat lebih tinggi', 'Tingkat yang sama', 'Setingkat lebih rendah', 'Tidak perlu pendidikan tinggi'];
const TINGKAT_PENDIDIKAN_EN = ['A higher level', 'The same level', 'A lower level', 'No higher education needed'];
// f17 DIKTI: tujuh kompetensi, sama dengan tujuh aspek Tabel 6.g.2.
const KOMPETENSI = [['etika', 'Etika', 'Ethics'], ['bidang', 'Keahlian berdasarkan bidang ilmu', 'Expertise in your field of study'],
  ['inggris', 'Bahasa Inggris', 'English language'], ['ti', 'Penggunaan teknologi informasi', 'Use of information technology'],
  ['komunikasi', 'Komunikasi', 'Communication'], ['tim', 'Kerja sama tim', 'Teamwork'], ['diri', 'Pengembangan diri', 'Self-development']];
const LIMA = ['1', '2', '3', '4', '5'];
const sy = (q, nilai) => ({ syarat: { q, nilai } });
const KERJA = sy('status', KERJA_BARU);

// Tujuh aspek Tabel 6.g.2 dalam bahasa Inggris (kode tetap kunci lkps_kepuasan_pengguna).
const ASPEK_EN = { etika: 'ethics', keahlian_bidang_ilmu: 'expertise in their field (core competence)', bahasa_asing: 'foreign language skills',
  teknologi_informasi: 'use of information technology', komunikasi: 'communication skills', kerja_sama_tim: 'teamwork',
  pengembangan_diri: 'self-development' };

const SARAN = T('saran', 'saran', 'Saran atau masukan untuk perbaikan (boleh dikosongkan).',
  'Suggestions or feedback for improvement (optional).', { bagian: 'masukan', butir: ['57'] });
const VMTS_TAHU = C('vmts_sumber', 'vmts', 'Dari mana Anda mengetahui visi dan misi prodi? (boleh lebih dari satu)',
  'Where did you learn about the programme\'s vision and mission? (select all that apply)',
  ['Sosialisasi atau perkuliahan', 'Situs web', 'Media sosial', 'Dokumen, poster, atau spanduk', 'Belum pernah mengetahui'],
  ['Briefings or classes', 'Website', 'Social media', 'Documents, posters or banners', 'I have not heard of it']);
const vmtsPaham = id => Q(id, 'vmts', 'Pemahaman Anda tentang visi, misi, tujuan, dan strategi prodi',
  'Your understanding of the programme\'s vision, mission, objectives and strategy');

const TEMPLAT = {
  mahasiswa: [
    ...bag('vmts', ['3'], [vmtsPaham('mv1'),
      Q('mv2', 'vmts', 'Kesesuaian kegiatan prodi dengan visi dan misinya', 'Consistency of programme activities with its vision and mission'),
      VMTS_TAHU]),
    ...bag('pembelajaran', ['16'], [
      Q('m1', 'keandalan', 'Perkuliahan dilaksanakan sesuai RPS dan jadwal', 'Classes follow the course plan (RPS) and timetable', { butir: ['16', '57'] }),
      Q('m5', 'kepastian', 'Penguasaan materi oleh dosen serta penilaian yang adil dan transparan',
        'Lecturers\' command of the subject and fair, transparent assessment', { butir: ['16', '57'] }),
      Q('pb1', 'pembelajaran', 'Variasi metode pembelajaran (diskusi, studi kasus, proyek, praktikum)',
        'Variety of teaching methods (discussion, case studies, projects, lab work)'),
      Q('pb2', 'pembelajaran', 'Ketersediaan media dan sumber belajar (bahan kuliah, LMS, buku, rekaman)',
        'Availability of learning media and resources (course notes, LMS, books, recordings)'),
      Q('pb3', 'pembelajaran', 'Interaksi dengan dosen di dalam dan di luar kelas', 'Interaction with lecturers inside and outside class'),
      Q('pb4', 'pembelajaran', 'Dorongan untuk berpikir kritis dan analitis dalam perkuliahan', 'Encouragement of critical and analytical thinking'),
      Q('pb5', 'pembelajaran', 'Umpan balik dosen atas tugas dan ujian', 'Lecturer feedback on assignments and exams')]),
    ...bag('suasana', ['21'], [
      Q('sa1', 'suasana', 'Kesempatan mengikuti seminar, kuliah tamu, dan diskusi ilmiah', 'Opportunities to attend seminars, guest lectures and scientific discussions'),
      Q('sa2', 'suasana', 'Kebebasan menyampaikan pendapat akademik', 'Freedom to express academic opinions'),
      Q('sa3', 'suasana', 'Kesempatan terlibat dalam penelitian dan pengabdian kepada masyarakat bersama dosen',
        'Opportunities to join lecturers\' research and community service', { butir: ['21', '23', '25'] })]),
    ...bag('layanan', ['57'], [
      Q('m2', 'keandalan', 'Ketepatan waktu dan ketepatan layanan administrasi akademik (KRS, nilai, surat)',
        'Timeliness and accuracy of academic administration (registration, grades, letters)'),
      Q('m3', 'daya_tanggap', 'Kecepatan dosen dan tenaga kependidikan menanggapi pertanyaan atau keluhan',
        'How quickly lecturers and staff respond to questions or complaints'),
      Q('m4', 'daya_tanggap', 'Tindak lanjut keluhan mahasiswa dalam waktu yang wajar', 'Follow-up of student complaints within a reasonable time'),
      Q('m6', 'kepastian', 'Kejelasan informasi akademik (kalender, aturan, persyaratan) dan kemudahan memperolehnya',
        'Clarity and accessibility of academic information (calendar, rules, requirements)'),
      Q('m7', 'empati', 'Ketersediaan dan perhatian dosen pembimbing akademik', 'Availability and attention of your academic advisor'),
      Q('m8', 'empati', 'Perhatian prodi terhadap kebutuhan dan aspirasi mahasiswa', 'The programme\'s attention to student needs and aspirations')]),
    ...bag('sarana', ['38'], [
      Q('m9', 'sarana', 'Kondisi ruang kuliah, laboratorium, dan peralatan', 'Condition of classrooms, laboratories and equipment', { butir: ['38', '57'] }),
      Q('m10', 'sarana', 'Akses pustaka, internet, dan sistem informasi akademik', 'Access to the library, internet and academic information systems', { butir: ['38', '57'] }),
      Q('sr1', 'sarana', 'Kemudahan memakai fasilitas di luar jam kuliah', 'Ease of using facilities outside class hours'),
      Q('sr2', 'nonakademik', 'Layanan kesehatan, konseling, bimbingan karier, dan sarana ibadah',
        'Health, counselling, career guidance and prayer facilities'),
      Q('sr3', 'k3l', 'Keselamatan kerja di laboratorium dan lapangan (APD, prosedur, rambu, jalur evakuasi)',
        'Safety in laboratories and field work (PPE, procedures, signs, evacuation routes)', { butir: ['39'] })]),
    ...bag('kurikulum', ['12'], [
      Q('mk1', 'kurikulum', 'Relevansi mata kuliah dengan perkembangan ilmu dan kebutuhan dunia kerja',
        'Relevance of courses to current knowledge and industry needs'),
      T('mk2', 'kurikulum', 'Mata kuliah atau topik yang perlu ditambah, diperbarui, atau dikurangi (boleh dikosongkan).',
        'Courses or topics that should be added, updated or reduced (optional).')]),
    SARAN],
  dosen: [
    ...bag('vmts', ['3'], [vmtsPaham('dv1'),
      Q('dv2', 'vmts', 'Keterlibatan dosen dalam penyusunan dan peninjauan visi, misi, tujuan, dan strategi',
        'Involvement of lecturers in drafting and reviewing the vision, mission, objectives and strategy', { butir: ['2', '3'] })]),
    ...bag('tata_kelola', ['5'], [
      Q('d1', 'tata_kelola', 'Keterlibatan dosen dalam perencanaan dan pengambilan keputusan', 'Involvement of lecturers in planning and decision-making'),
      Q('d2', 'tata_kelola', 'Kejelasan dan konsistensi kebijakan serta prosedur kerja', 'Clarity and consistency of policies and procedures'),
      Q('dt1', 'tata_kelola', 'Komitmen pimpinan pada visi dan tujuan, integritas, dan transparansi',
        'Leaders\' commitment to the vision and goals, integrity and transparency'),
      Q('dt2', 'tata_kelola', 'Kemampuan pimpinan mengambil keputusan dan mengelola perbedaan pendapat secara positif',
        'Leaders\' decision-making and constructive handling of disagreement')]),
    ...bag('suasana', ['21'], [
      Q('ds1', 'suasana', 'Kebebasan akademik, mimbar akademik, dan otonomi keilmuan', 'Academic freedom, freedom of expression and scholarly autonomy'),
      Q('ds2', 'suasana', 'Kegiatan ilmiah rutin di prodi (seminar, diskusi, kuliah tamu)', 'Regular academic events in the programme (seminars, discussions, guest lectures)')]),
    ...bag('sdm', ['57'], [
      Q('d3', 'administrasi', 'Kecepatan dan ketepatan layanan administrasi (keuangan, kepegawaian, akademik)',
        'Speed and accuracy of administrative services (finance, HR, academic)'),
      Q('d4', 'pengembangan', 'Dukungan untuk studi lanjut, pelatihan, dan kenaikan jabatan akademik', 'Support for further study, training and promotion'),
      Q('d5', 'tridharma', 'Dukungan dana dan fasilitas untuk penelitian dan pengabdian kepada masyarakat', 'Funding and facilities for research and community service'),
      Q('d6', 'tridharma', 'Keadilan pembagian beban kerja tridharma', 'Fairness of the teaching, research and service workload'),
      Q('d8', 'kesejahteraan', 'Kesesuaian remunerasi dan penghargaan dengan kinerja', 'Pay and recognition relative to performance'),
      Q('d9', 'kesejahteraan', 'Suasana kerja yang kondusif dan kolegial', 'A supportive and collegial working atmosphere')]),
    ...bag('sarana', ['38'], [
      Q('d7', 'sarana', 'Sarana, prasarana, dan peralatan untuk mengajar dan meneliti', 'Facilities and equipment for teaching and research', { butir: ['38', '57'] }),
      Q('dk3', 'k3l', 'Keselamatan dan kesehatan kerja di laboratorium dan lapangan', 'Occupational health and safety in laboratories and field work', { butir: ['39'] })]),
    ...bag('kurikulum', ['12'], [
      Q('dk1', 'kurikulum', 'Kesesuaian kurikulum prodi dengan perkembangan iptek di bidang Anda', 'Fit of the curriculum with developments in your field'),
      T('dk2', 'kurikulum', 'Usulan perubahan kurikulum, CPL, atau mata kuliah (boleh dikosongkan).',
        'Suggested changes to the curriculum, learning outcomes or courses (optional).')]),
    SARAN],
  tendik: [
    ...bag('vmts', ['3'], [vmtsPaham('tv1')]),
    ...bag('tata_kelola', ['5'], [
      Q('t1', 'tata_kelola', 'Kejelasan arahan kerja dari pimpinan', 'Clarity of work direction from leaders'),
      Q('tt1', 'tata_kelola', 'Keterbukaan pimpinan dan kejelasan pembagian tugas', 'Openness of leaders and clarity of task allocation')]),
    ...bag('sdm', ['57'], [
      Q('t2', 'administrasi', 'Dukungan prosedur dan sistem informasi bagi pekerjaan Anda', 'How well procedures and information systems support your work'),
      Q('t3', 'pengembangan', 'Kesempatan pelatihan dan pengembangan karier', 'Training and career development opportunities'),
      Q('t5', 'kesejahteraan', 'Kesesuaian remunerasi dan penghargaan dengan kinerja', 'Pay and recognition relative to performance'),
      Q('t6', 'kesejahteraan', 'Suasana kerja yang kondusif dan saling mendukung', 'A supportive working atmosphere')]),
    ...bag('sarana', ['38'], [
      Q('t4', 'sarana', 'Peralatan dan ruang kerja', 'Equipment and workspace', { butir: ['38', '57'] }),
      Q('tk3', 'k3l', 'Keselamatan dan kesehatan di tempat kerja', 'Health and safety at work', { butir: ['39'] })]),
    SARAN],
  mitra: [
    ...bag('instansi', ['7'], [
      P('jenis_instansi', 'instansi', 'Jenis instansi Anda', 'Type of your organisation', JENIS_INSTANSI, JENIS_INSTANSI_EN),
      C('bentuk', 'kerja_sama', 'Bentuk kerja sama dengan prodi (boleh lebih dari satu)', 'Forms of partnership with the programme (select all that apply)',
        ['Pembelajaran', 'Penelitian', 'Pengabdian kepada masyarakat', 'Magang atau kerja praktik', 'Rekrutmen lulusan', 'Lainnya'],
        ['Teaching', 'Research', 'Community service', 'Internships', 'Graduate recruitment', 'Other'])]),
    ...bag('kerja_sama', ['7', '57'], [
      Q('k1', 'manfaat', 'Manfaat nyata kerja sama bagi institusi Anda', 'Tangible benefits of the partnership for your organisation'),
      Q('km1', 'manfaat', 'Kontribusi kerja sama pada pembelajaran, penelitian, dan pengabdian kepada masyarakat',
        'Contribution of the partnership to teaching, research and community service'),
      Q('k2', 'komunikasi_mitra', 'Kelancaran komunikasi dan koordinasi dengan prodi', 'Communication and coordination with the programme'),
      Q('k3', 'pelaksanaan', 'Pelaksanaan kegiatan sesuai kesepakatan dan jadwal', 'Delivery of activities as agreed and on schedule'),
      Q('k4', 'kompetensi', 'Kompetensi dan profesionalitas dosen dan mahasiswa yang terlibat', 'Competence and professionalism of the lecturers and students involved'),
      Q('k5', 'keberlanjutan', 'Kesediaan institusi Anda melanjutkan atau memperluas kerja sama', 'Willingness of your organisation to continue or expand the partnership')]),
    ...bag('vmts', ['3'], [Q('kv1', 'vmts', 'Pemahaman Anda tentang visi dan misi prodi', 'Your understanding of the programme\'s vision and mission')]),
    ...bag('kurikulum', ['13'], [
      Q('kk2', 'kurikulum', 'Kesesuaian kompetensi mahasiswa dan lulusan prodi dengan kebutuhan bidang Anda',
        'Fit of our students\' and graduates\' competencies with the needs of your sector'),
      T('kk1', 'kurikulum', 'Kompetensi lulusan atau topik yang menurut Anda perlu diperkuat dalam kurikulum (boleh dikosongkan).',
        'Graduate competencies or topics you think the curriculum should strengthen (optional).', { butir: ['12', '13'] })]),
    { ...SARAN, butir: ['2', '57'] }],
  // Tabel 6.g.2: id = kunci aspek di lkps_kepuasan_pengguna, supaya hasil bisa disalin.
  pengguna: [
    // Nama institusi dan lulusan yang dinilai (pemilik 2026-11-14): bukti bahwa responden benar
    // pengguna lulusan kita dan untuk mencocokkan dengan undangan dari tracer. Isian singkat hanya
    // dibaca admin; rekap publik (survei_rekap) tidak memuatnya.
    ...bag('instansi', ['52'], [
      I('nama_instansi', 'instansi', 'Nama institusi atau perusahaan Anda', 'Name of your organisation', { wajib: true }),
      P('jenis_instansi', 'instansi', 'Jenis instansi Anda', 'Type of your organisation', JENIS_INSTANSI, JENIS_INSTANSI_EN),
      I('nama_lulusan', 'instansi', 'Nama lulusan kami yang Anda nilai', 'Name of our graduate you are assessing',
        { wajib: true, ket: 'Bila lebih dari satu, tulis semuanya dipisah koma; penilaian di bawah berlaku untuk mereka secara umum.',
          ket_en: 'If more than one, separate the names with commas; the ratings below apply to them in general.' }),
      I('jabatan', 'instansi', 'Jabatan Anda (boleh dikosongkan)', 'Your position (optional)')]),
    ...bag('kinerja_lulusan', ['52'], ASPEK_KEPUASAN.map(([a, nama]) => Q(a, a, `Penilaian Anda atas lulusan kami dalam hal: ${nama.toLowerCase()}`,
      `Your rating of our graduates in: ${ASPEK_EN[a] || nama}`))),
    ...bag('kurikulum', ['13'], [
      C('pk2', 'kurikulum', 'Kompetensi yang paling dibutuhkan di institusi Anda (boleh lebih dari satu)',
        'Competencies most needed in your organisation (select all that apply)', KOMPETENSI.map(k => k[1]), KOMPETENSI.map(k => k[2])),
      T('pk1', 'kurikulum', 'Kompetensi yang perlu diperkuat agar lulusan kami lebih siap bekerja di institusi Anda (boleh dikosongkan).',
        'Competencies we should strengthen so our graduates are better prepared for your organisation (optional).', { butir: ['12', '13'] })]),
    ...bag('vmts', ['3'], [Q('uv1', 'vmts', 'Pemahaman Anda tentang visi dan misi prodi', 'Your understanding of the programme\'s vision and mission')]),
    { ...SARAN, butir: ['2', '57'] }],
  // Tracer (55-patch-survei-alumni.sql), memuat pertanyaan inti DIKTI 2021 (butir 48 aspek 3).
  // Kode tahun_lulus, status, bulan, kesesuaian, tingkat, instansi, izin_atasan, email_atasan dipakai
  // keTabelTracer dan undanganPengguna: jangan diubah. Opsi f5c (posisi wiraswasta) dan f18a (sumber
  // biaya studi lanjut) tidak tercantum di instrumen DIKTI yang dibaca, jadi diisi bebas.
  alumni: [
    ...bag('profil', ['48'], [
      A('tahun_lulus', 'tahun_lulus', 'Tahun lulus', 'Year of graduation', { min: 1990, max: 2100, wajib: true }),
      I('hp', 'profil', 'Nomor HP atau WhatsApp (boleh dikosongkan)', 'Mobile or WhatsApp number (optional)'),
      P('sumber_dana', 'profil', 'Sumber dana pembiayaan kuliah S1 Anda (bukan studi lanjut)', 'How was your undergraduate study funded? (not further study)',
        SUMBER_DANA, SUMBER_DANA_EN)]),
    ...bag('pekerjaan', ['48', '49', '50', '51'], [
      P('status', 'status', 'Status Anda saat ini', 'Your current status', STATUS_ALUMNI, STATUS_ALUMNI_EN),
      P('kerja_6bulan', 'waktu_tunggu', 'Apakah Anda mendapat pekerjaan dalam 6 bulan setelah lulus, atau sudah bekerja sebelum lulus?',
        'Did you find work within 6 months of graduating, or were you already working before graduating?', ['Ya', 'Tidak'], ['Yes', 'No'],
        { ...KERJA, butir: ['48', '49'] }),
      A('bulan', 'waktu_tunggu', 'Dalam berapa bulan setelah lulus Anda mendapat pekerjaan pertama atau memulai usaha?',
        'How many months after graduating did you get your first job or start your business?',
        { min: 0, max: 240, wajib: true, ket: 'Tulis 0 bila sudah bekerja sebelum lulus.', ket_en: 'Enter 0 if you were working before graduating.', ...KERJA, butir: ['48', '49'] }),
      A('pendapatan', 'pendapatan', 'Rata-rata pendapatan per bulan (take home pay), dalam rupiah', 'Average monthly take-home pay, in rupiah',
        { min: 0, max: 1000000000, wajib: true, ket: 'Angka saja, tanpa titik (mis. 7500000). Bila tidak tetap, tulis perkiraan rata-ratanya.',
          ket_en: 'Numbers only, no separators (e.g. 7500000). If it varies, enter your estimated average.', ...KERJA }),
      I('provinsi', 'lokasi', 'Provinsi tempat Anda bekerja', 'Province (or country, if abroad) where you work', { wajib: true, ...KERJA }),
      I('kabkota', 'lokasi', 'Kabupaten/kota tempat Anda bekerja', 'Regency/city where you work', { wajib: true, ...KERJA }),
      P('jenis_instansi', 'instansi', 'Jenis perusahaan/instansi tempat Anda bekerja', 'Type of organisation you work for', JENIS_INSTANSI, JENIS_INSTANSI_EN, KERJA),
      I('jenis_instansi_lain', 'instansi', 'Jenis instansi lainnya', 'Other type of organisation', sy('jenis_instansi', ['Lainnya'])),
      I('instansi', 'instansi', 'Nama perusahaan/instansi tempat Anda bekerja, atau nama usaha Anda (boleh dikosongkan)',
        'Name of your employer or your business (optional)', KERJA),
      I('posisi_wirausaha', 'instansi', 'Posisi atau jabatan Anda dalam usaha Anda', 'Your position in your business', sy('status', ['Wiraswasta'])),
      P('tingkat', 'tingkat_kerja', 'Tingkat tempat kerja Anda', 'Level of your workplace',
        [TINGKAT_KERJA.wilayah, TINGKAT_KERJA.nasional, TINGKAT_KERJA.internasional], TINGKAT_EN, { ...KERJA, butir: ['48', '51'] }),
      P('kesesuaian', 'kesesuaian', 'Seberapa erat hubungan bidang studi Anda dengan pekerjaan Anda?', 'How closely is your field of study related to your job?',
        KESESUAIAN, KESESUAIAN_EN, { ...KERJA, butir: ['48', '50'] }),
      P('tingkat_pendidikan', 'kesesuaian', 'Tingkat pendidikan apa yang paling sesuai untuk pekerjaan Anda?', 'What level of education best fits your job?',
        TINGKAT_PENDIDIKAN, TINGKAT_PENDIDIKAN_EN, KERJA)]),
    ...bag('studi_lanjut', ['48'], [
      I('sl_biaya', 'studi_lanjut', 'Sumber biaya studi lanjut', 'Funding source for your further study', { wajib: true, ...sy('status', ['Melanjutkan pendidikan']) }),
      I('sl_pt', 'studi_lanjut', 'Perguruan tinggi', 'University', { wajib: true, ...sy('status', ['Melanjutkan pendidikan']) }),
      I('sl_prodi', 'studi_lanjut', 'Program studi', 'Study programme', { wajib: true, ...sy('status', ['Melanjutkan pendidikan']) }),
      I('sl_masuk', 'studi_lanjut', 'Bulan dan tahun masuk (mis. 09/2025)', 'Month and year of entry (e.g. 09/2025)', sy('status', ['Melanjutkan pendidikan']))]),
    ...bag('kompetensi', ['48', '52'], [
      ...KOMPETENSI.map(([k, id, en], i) => P(`f17_${k}_a`, 'kompetensi_lulus', `Saat lulus, seberapa besar kompetensi ini Anda kuasai: ${id.toLowerCase()}`,
        `At graduation, how well did you master this competency: ${en.toLowerCase()}`, LIMA, LIMA,
        { ujung: ['Sangat rendah', 'Sangat tinggi'], ujung_en: ['Very low', 'Very high'],
          ...(i ? {} : { ket: 'Skala 1 (sangat rendah) sampai 5 (sangat tinggi).', ket_en: 'Scale 1 (very low) to 5 (very high).' }) })),
      ...KOMPETENSI.map(([k, id, en], i) => P(`f17_${k}_b`, 'kompetensi_kerja', `Dalam pekerjaan Anda saat ini, seberapa besar kompetensi ini diperlukan: ${id.toLowerCase()}`,
        `In your current job, how much is this competency required: ${en.toLowerCase()}`, LIMA, LIMA,
        { ujung: ['Sangat rendah', 'Sangat tinggi'], ujung_en: ['Very low', 'Very high'], ...KERJA })) ]),
    ...bag('masukan', ['48'], [
      Q('av1', 'vmts', 'Pemahaman Anda tentang visi dan misi prodi', 'Your understanding of the programme\'s vision and mission', { butir: ['3'] }),
      Q('ak1', 'kurikulum', 'Relevansi kurikulum yang Anda pelajari dengan pekerjaan Anda saat ini', 'Relevance of the curriculum you studied to your current job',
        { ...KERJA, butir: ['12', '48'] }),
      T('ak2', 'kurikulum', 'Kompetensi atau mata kuliah yang perlu ditambah agar lulusan lebih siap bekerja (boleh dikosongkan).',
        'Competencies or courses that should be added so graduates are better prepared for work (optional).', { butir: ['12', '48'] }),
      P('izin_atasan', 'pengguna', 'Bolehkah kami mengirim survei kepuasan pengguna lulusan kepada atasan Anda?',
        'May we send an employer satisfaction survey to your supervisor?', ['ya', 'tidak'], ['yes', 'no'], { wajib: false, ...KERJA, butir: ['52'] }),
      I('email_atasan', 'pengguna', 'Email atasan Anda', 'Your supervisor\'s email', { wajib: true, ...sy('izin_atasan', ['ya']), butir: ['52'] }),
      { ...SARAN, butir: ['2', '48'] }])],
};
export const templatSurvei = k => (TEMPLAT[k] || []).map(q => JSON.parse(JSON.stringify(q)));
/** Identitas bawaan per kelompok: tracer perlu bisa ditindaklanjuti, survei kepuasan anonim. */
// Alumni wajib (nama + NIM, survei.html) agar tracer bisa dicocokkan dengan daftar lulusan (pemilik 2026-11-14).
export const identitasBawaan = k => k === 'alumni' ? 'wajib' : 'tidak';

/** '' bila daftar pertanyaan sah, selain itu pesan galat. */
export function cekPertanyaan(xs){
  if (!Array.isArray(xs) || !xs.length) return 'Isi paling sedikit satu pertanyaan.';
  if (xs.length > 60) return 'Paling banyak 60 pertanyaan.';
  const ids = new Set();
  for (const [i, q] of xs.entries()) {
    if (!/^[a-z0-9_]{1,40}$/.test(q.id || '')) return `Pertanyaan ${i + 1}: kode hanya huruf kecil, angka, garis bawah.`;
    if (ids.has(q.id)) return `Kode pertanyaan "${q.id}" dipakai dua kali.`;
    ids.add(q.id);
    if (!String(q.teks || '').trim()) return `Pertanyaan ${i + 1}: teks kosong.`;
    if (!JENIS_PERTANYAAN.some(([j]) => j === q.jenis)) return `Pertanyaan ${i + 1}: jenis tidak dikenal.`;
    if (['pilihan', 'centang'].includes(q.jenis)) {
      const o = q.opsi || [];
      if (o.length < 2) return `Pertanyaan ${i + 1}: isi paling sedikit dua opsi (pisahkan dengan titik koma).`;
      if (new Set(o).size !== o.length || o.some(x => !String(x).trim() || String(x).length > 100)) return `Pertanyaan ${i + 1}: opsi kosong, kembar, atau lebih dari 100 karakter.`;
      const e = q.opsi_en;
      if (e?.length && (e.length !== o.length || e.some(x => !String(x).trim() || String(x).length > 100)))
        return `Pertanyaan ${i + 1}: opsi bahasa Inggris harus ${o.length} butir (sama dengan opsi), tidak kosong, paling panjang 100 karakter.`;
    }
    if (q.jenis === 'angka' && q.min != null && q.max != null && +q.min > +q.max) return `Pertanyaan ${i + 1}: batas bawah lebih besar dari batas atas.`;
    if (q.syarat) {
      const acuan = xs.slice(0, i).find(x => x.id === q.syarat.q);
      if (!acuan || acuan.jenis !== 'pilihan') return `Pertanyaan ${i + 1}: syarat harus mengacu ke pertanyaan pilihan sebelumnya (kode=nilai).`;
      if (!q.syarat.nilai?.length || q.syarat.nilai.some(v => !(acuan.opsi || []).includes(v))) return `Pertanyaan ${i + 1}: nilai syarat harus salah satu opsi "${acuan.id}".`;
    }
  }
  return '';
}

/** '' bila jawaban sah terhadap pertanyaan (cerminan survei_kirim), selain itu pesan (en = bahasa Inggris). */
export function cekJawaban(xs, j, en = false){
  for (const q of xs || []) {
    let v = j?.[q.id];
    const t = teksQ(q, en);
    if (v === '' || (Array.isArray(v) && !v.length)) v = undefined;
    if (!aktifQ(q, j)) { if (v !== undefined) return en ? `Question "${t}" does not apply to your earlier answers.` : `Pertanyaan "${t}" tidak berlaku untuk jawaban Anda sebelumnya.`; continue; }
    if (v === undefined) { if (wajibQ(q)) return en ? `Required question not answered: ${t}` : `Pertanyaan wajib belum dijawab: ${t}`; continue; }
    if (q.jenis === 'skala' && ![1, 2, 3, 4].includes(v)) return en ? `The answer to "${t}" must be 1–4.` : `Jawaban "${t}" harus 1–4.`;
    if ((q.jenis === 'pilihan' && !(q.opsi || []).includes(v)) || (q.jenis === 'centang' && (!Array.isArray(v) || v.some(x => !(q.opsi || []).includes(x)))))
      return en ? `Unknown option for "${t}".` : `Pilihan untuk "${t}" tidak dikenal.`;
    if (q.jenis === 'angka' && (typeof v !== 'number' || !Number.isFinite(v) || (q.min != null && v < +q.min) || (q.max != null && v > +q.max))) {
      const r = q.min != null || q.max != null ? ` (${q.min ?? '…'}–${q.max ?? '…'})` : '';
      return en ? `The number for "${t}" is out of range${r}.` : `Angka untuk "${t}" di luar rentang${r}.`;
    }
    if (q.jenis === 'singkat' && String(v).length > 200) return en ? `"${t}": at most 200 characters.` : `Isian "${t}" paling panjang 200 karakter.`;
    if (q.jenis === 'teks' && String(v).length > 2000) return en ? `"${t}": at most 2000 characters.` : `Isian "${t}" paling panjang 2000 karakter.`;
  }
  return '';
}

/** Sebaran [n1, n2, n3, n4] per pertanyaan berskala dari baris survei_jawaban. */
export function hitungDariJawaban(pertanyaan, rows){
  const out = {};
  (pertanyaan || []).filter(q => q.jenis === 'skala').forEach(q => { out[q.id] = [0, 0, 0, 0]; });
  (rows || []).forEach(r => Object.entries(r.jawaban || {}).forEach(([k, v]) => {
    if (out[k] && [1, 2, 3, 4].includes(v)) out[k][v - 1]++;
  }));
  return out;
}

const r2 = x => Math.round(x * 100) / 100;
/** Rekap per pertanyaan dan per aspek dari sebaran. Sama untuk admin dan halaman publik. */
export function rekapSurvei(pertanyaan, hitung){
  const per = (pertanyaan || []).filter(q => q.jenis === 'skala').map(q => {
    const h = hitung?.[q.id] || [0, 0, 0, 0], n = h.reduce((a, b) => a + b, 0);
    return { ...q, hitung: h, n, rerata: n ? r2((h[0] + 2 * h[1] + 3 * h[2] + 4 * h[3]) / n) : null,
      puas: n ? r2((h[2] + h[3]) / n * 100) : null };
  });
  const aspek = [...new Set(per.map(q => q.aspek))].map(a => {
    const xs = per.filter(q => q.aspek === a && q.n);
    return { aspek: a, label: labelAspek(a), butir: butirSurvei(per.filter(q => q.aspek === a)),
      rerata: xs.length ? r2(xs.reduce((s, q) => s + q.rerata, 0) / xs.length) : null,
      puas: xs.length ? r2(xs.reduce((s, q) => s + q.puas, 0) / xs.length) : null };
  });
  const ada = per.filter(q => q.n);
  return { per, aspek, rerata: ada.length ? r2(ada.reduce((s, q) => s + q.rerata, 0) / ada.length) : null,
    puas: ada.length ? r2(ada.reduce((s, q) => s + q.puas, 0) / ada.length) : null };
}

/** Isian teks dan singkat per pertanyaan (khusus admin; tidak pernah ditampilkan publik).
 *  Nama responden ikut bila survei meminta identitas. */
export function komentarSurvei(pertanyaan, rows){
  return (pertanyaan || []).filter(q => q.jenis === 'teks' || q.jenis === 'singkat').map(q => ({ ...q,
    isi: (rows || []).map(r => { const t = String(r.jawaban?.[q.id] ?? '').trim(); return t && r.nama ? `${t} — ${r.nama}` : t; }).filter(Boolean) }));
}

/** Sebaran opsi (pilihan/centang) dan [n, rerata] angka, bentuknya sama dengan survei_rekap(). */
export function ringkasLain(pertanyaan, rows){
  const opsi = {}, angka = {};
  (pertanyaan || []).forEach(q => {
    if (q.jenis === 'pilihan' || q.jenis === 'centang') {
      const c = {};
      (rows || []).forEach(r => { const v = r.jawaban?.[q.id]; (Array.isArray(v) ? v : v != null ? [v] : []).forEach(x => { c[x] = (c[x] || 0) + 1; }); });
      opsi[q.id] = c;
    } else if (q.jenis === 'angka') {
      const xs = (rows || []).map(r => r.jawaban?.[q.id]).filter(v => typeof v === 'number');
      angka[q.id] = [xs.length, xs.length ? r2(xs.reduce((a, b) => a + b, 0) / xs.length) : null];
    }
  });
  return { opsi, angka };
}

/** Aspek di bawah ambang (pemilik 2026-11-11: % puas < ambang_puas ATAU rerata < ambang_rerata). */
export function aspekTindakLanjut(rk, { ambang_puas = 75, ambang_rerata = 3 } = {}){
  return (rk.aspek || []).filter(a => a.rerata != null).map(a => ({ ...a,
    alasan: [a.puas < ambang_puas ? `% puas ${a.puas.toFixed(2).replace('.', ',')} < ${ambang_puas}` : '',
      a.rerata < ambang_rerata ? `rerata ${a.rerata.toFixed(2).replace('.', ',')} < ${String(ambang_rerata).replace('.', ',')}` : ''].filter(Boolean) }))
    .filter(a => a.alasan.length);
}
/** Kode temuan unik per survei dan aspek, supaya tombol tidak membuat baris ganda. */
export const kodeTemuanSurvei = (s, aspek) => `SV${s.id}-${aspek}`.slice(0, 30);
/** Baris ami_temuan (51-patch-temuan-ami.sql) dari satu aspek survei di bawah ambang.
 *  Butir: butir pertama pertanyaan aspek itu bila ditandai (templat 2026-11-13), selain itu aturan lama. */
export function temuanDariAspek(s, a, n){
  const kur = a.aspek === 'kurikulum';
  const lama = kur ? 12 : s.kelompok === 'mitra' ? 7 : s.kelompok === 'pengguna' ? 52 : 57;
  return { siklus: s.judul.slice(0, 120), tahun_ts: s.tahun_ts, kode: kodeTemuanSurvei(s, a.aspek),
    standar: kur ? 'Kurikulum' : 'Kepuasan pemangku kepentingan',
    butir: a.butir?.length ? +a.butir[0] : lama, kategori: 'peluang',
    uraian: `Survei kepuasan ${labelKelompok(s.kelompok).toLowerCase()}, aspek ${a.label}: ${a.alasan.join('; ')} (${n} responden).`,
    pihak: 'P', status: 'terbuka' };
}

// Persen dua desimal yang berjumlah tepat 100 (sisa terbesar).
function persen100(h){
  const n = h.reduce((a, b) => a + b, 0);
  if (!n) return null;
  const mentah = h.map(x => x / n * 10000), bulat = mentah.map(Math.floor);
  let sisa = 10000 - bulat.reduce((a, b) => a + b, 0);
  mentah.map((x, i) => [x - bulat[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (sisa > 0) { bulat[i]++; sisa--; } });
  return bulat.map(x => x / 100);
}
/** Baris lkps_kepuasan_pengguna (Tabel 6.g.2) dari survei pengguna lulusan. */
export function keTabel62(hitung, tahunTs){
  return ASPEK_KEPUASAN.map(([a]) => {
    const p = persen100(hitung?.[a] || [0, 0, 0, 0]);
    return p ? { tahun_akademik: `${tahunTs - 1}/${tahunTs}`, aspek: a, kurang: p[0], cukup: p[1], baik: p[2], sangat_baik: p[3] } : null;
  }).filter(Boolean);
}

/** CSV jawaban mentah (admin), pemisah ; dan BOM UTF-8. */
export function csvJawaban(pertanyaan, rows){
  const q = s => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const kol = pertanyaan || [];
  const idn = (rows || []).some(r => r.nama || r.nim || r.email);
  const nilai = v => Array.isArray(v) ? v.join('; ') : v ?? '';
  return String.fromCharCode(0xFEFF) + [['Diisi', ...(idn ? ['Nama', 'NIM', 'Email'] : []), ...kol.map(x => `${x.id} ${x.teks}`)].map(q).join(';'),
    ...(rows || []).map(r => [String(r.diisi || '').slice(0, 16).replace('T', ' '), ...(idn ? [r.nama, r.nim, r.email] : []),
      ...kol.map(x => nilai(r.jawaban?.[x.id]))].map(q).join(';'))
  ].join('\r\n');
}

const f2 = x => x == null ? '—' : (+x).toFixed(2).replace('.', ',');
const WARNA = ['#C0392B', '#E59866', '#5DADE2', '#1E8449'];   // kurang, cukup, baik, sangat baik
/** Tabel rekap per pertanyaan dengan bilah sebaran, dan ringkasan per aspek. */
export function htmlRekap(rk, n){
  if (!n) return '<p class="ket">Belum ada responden.</p>';
  const bilah = h => { const t = h.reduce((a, b) => a + b, 0) || 1;
    return `<span class="sv-bilah">${h.map((x, i) => x ? `<i style="width:${x / t * 100}%;background:${WARNA[i]}" title="${SKALA[3 - i][1]}: ${x}"></i>` : '').join('')}</span>`; };
  return `<p class="ket"><b>${n} responden</b> · rerata ${f2(rk.rerata)} dari 4 · ${f2(rk.puas)}% menjawab baik atau sangat baik.
      <span class="sv-leg">${SKALA.slice().reverse().map(([v, l]) => `<i style="background:${WARNA[v - 1]}"></i>${l}`).join(' ')}</span></p>
    <div class="gulir"><table class="sv"><thead><tr><th>Aspek</th><th>Rerata</th><th>% puas</th></tr></thead><tbody>
      ${rk.aspek.map(a => `<tr><td>${esc(a.label)}</td><td>${f2(a.rerata)}</td><td>${f2(a.puas)}</td></tr>`).join('')}</tbody></table></div>
    <div class="gulir"><table class="sv"><thead><tr><th>Pertanyaan</th><th>Sebaran</th><th>n</th><th>Rerata</th><th>% puas</th></tr></thead><tbody>
      ${rk.per.map(q => `<tr><td>${esc(q.teks)}<br><small class="ket">${esc(labelAspek(q.aspek))}</small></td><td>${bilah(q.hitung)}</td>
        <td>${q.n}</td><td>${f2(q.rerata)}</td><td>${f2(q.puas)}</td></tr>`).join('')}</tbody></table></div>`;
}

/**
 * Rekap tracer per tahun lulus untuk lkps_tracer_lulusan (Tabel 6.f.1, 6.f.2, 6.g.1).
 * Terlacak = responden tahun itu. Waktu tunggu, kesesuaian, dan tingkat dihitung dari yang
 * bekerja/berwirausaha (nilai status DIKTI atau lama, lihat BEKERJA). Kesesuaian f14 dipetakan
 * dengan KESESUAIAN_LKPS. Pita waktu tunggu Sarjana: < 3, 3–18, > 18 bulan.
 * jumlah_lulusan dan bukti tidak diisi di sini (data prodi).
 * Hasil: { baris: [...], kurang: [kode pertanyaan yang tidak ada di survei] }.
 */
export function keTabelTracer(pertanyaan, rows){
  const ada = new Set((pertanyaan || []).map(q => q.id));
  const kurang = ['tahun_lulus', 'status', 'bulan', 'kesesuaian', 'tingkat'].filter(k => !ada.has(k));
  const per = new Map();
  (rows || []).forEach(r => {
    const t = r.jawaban?.tahun_lulus;
    if (!Number.isInteger(t)) return;
    if (!per.has(t)) per.set(t, []);
    per.get(t).push(r.jawaban);
  });
  const baris = [...per.entries()].sort((a, b) => a[0] - b[0]).map(([t, js]) => {
    const kerja = js.filter(j => BEKERJA.includes(j.status));
    const bln = kerja.map(j => j.bulan).filter(v => typeof v === 'number');
    const hit = (xs, f) => xs.filter(f).length;
    return { tahun_lulus: t, jumlah_terlacak: js.length,
      rata_rata_waktu_tunggu_bulan: bln.length ? r2(bln.reduce((a, b) => a + b, 0) / bln.length) : null,
      wt_kurang_3: hit(bln, v => v < 3), wt_3_18: hit(bln, v => v >= 3 && v <= 18), wt_lebih_18: hit(bln, v => v > 18),
      kesesuaian_rendah: hit(kerja, j => KESESUAIAN_LKPS[j.kesesuaian] === 'rendah'),
      kesesuaian_sedang: hit(kerja, j => KESESUAIAN_LKPS[j.kesesuaian] === 'sedang'),
      kesesuaian_tinggi: hit(kerja, j => KESESUAIAN_LKPS[j.kesesuaian] === 'tinggi'),
      kerja_wilayah: hit(kerja, j => j.tingkat === TINGKAT_KERJA.wilayah), kerja_nasional: hit(kerja, j => j.tingkat === TINGKAT_KERJA.nasional),
      kerja_internasional: hit(kerja, j => j.tingkat === TINGKAT_KERJA.internasional) };
  });
  return { baris, kurang };
}

/** Atasan yang boleh dihubungi (izin "ya" dan email sah), tanpa duplikat. */
export function undanganPengguna(rows){
  const per = new Map();
  (rows || []).forEach(r => {
    const e = String(r.jawaban?.email_atasan || '').trim().toLowerCase();
    if (r.jawaban?.izin_atasan !== 'ya' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) || per.has(e)) return;
    per.set(e, { email: e, alumni: r.nama || '', instansi: String(r.jawaban?.instansi || '').trim() });
  });
  return [...per.values()];
}

// Pemangku internal dan eksternal (butir 12 unsur 2 dan 3).
export const INTERNAL = new Set(['mahasiswa', 'dosen', 'tendik']);
/**
 * Masukan kurikulum lintas survei: pertanyaan beraspek "kurikulum".
 * surveis = baris survei; jawabanPer = Map(survei_id -> baris jawaban).
 * Hasil per survei: { s, internal, skala: [{teks, n, rerata, puas}], isian: [{teks, isi: []}] }.
 */
export function masukanKurikulum(surveis, jawabanPer){
  return (surveis || []).map(s => {
    const xs = (s.pertanyaan || []).filter(q => q.aspek === 'kurikulum');
    if (!xs.length) return null;
    const rows = jawabanPer.get(s.id) || [];
    const rk = rekapSurvei(xs, hitungDariJawaban(xs, rows));
    return { s, internal: INTERNAL.has(s.kelompok), n: rows.length,
      skala: rk.per.map(q => ({ teks: q.teks, n: q.n, rerata: q.rerata, puas: q.puas })),
      isian: komentarSurvei(xs, rows).map(q => ({ teks: q.teks, isi: q.isi })) };
  }).filter(Boolean);
}
/** CSV masukan kurikulum (bahan rapat evaluasi kurikulum). */
export function csvKurikulum(daftar){
  const q = s => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const baris = [['Survei', 'Kelompok', 'Pemangku', 'TS', 'Pertanyaan', 'Rerata (1-4)', '% puas', 'Masukan'].map(q).join(';')];
  daftar.forEach(m => {
    const kol = [m.s.judul, labelKelompok(m.s.kelompok), m.internal ? 'internal' : 'eksternal', `${m.s.tahun_ts - 1}/${m.s.tahun_ts}`];
    m.skala.forEach(x => baris.push([...kol, x.teks, x.rerata ?? '', x.puas ?? '', ''].map(q).join(';')));
    m.isian.forEach(x => x.isi.forEach(t => baris.push([...kol, x.teks, '', '', t].map(q).join(';'))));
  });
  return String.fromCharCode(0xFEFF) + baris.join('\r\n');
}

/** Sebaran pilihan/centang dan rerata angka (dipakai admin dan halaman publik). */
export function htmlLain(pertanyaan, { opsi = {}, angka = {} } = {}, n = 0){
  const xs = (pertanyaan || []).filter(q => ['pilihan', 'centang', 'angka'].includes(q.jenis));
  if (!xs.length || !n) return '';
  return `<div class="gulir"><table class="sv"><thead><tr><th>Pertanyaan</th><th>Jawaban</th></tr></thead><tbody>${xs.map(q => {
    if (q.jenis === 'angka') { const [m, rata] = angka[q.id] || [0, null];
      return `<tr><td>${esc(q.teks)}</td><td>${m ? `rerata ${f2(rata)} (${m} jawaban)` : '—'}</td></tr>`; }
    const c = opsi[q.id] || {}, total = Object.values(c).reduce((a, b) => a + b, 0) || 1;
    return `<tr><td>${esc(q.teks)}${q.jenis === 'centang' ? '<br><small class="ket">boleh lebih dari satu</small>' : ''}</td><td>${(q.opsi || []).map(o =>
      `<div class="sv-opsi"><span>${esc(o)}</span><span class="sv-bilah"><i style="width:${(c[o] || 0) / total * 100}%;background:var(--biru)"></i></span><b>${c[o] || 0}</b></div>`).join('')}</td></tr>`;
  }).join('')}</tbody></table></div>`;
}

export const CSS_SURVEI = `
  .sv-opsi{display:grid;grid-template-columns:minmax(90px,1fr) 180px 36px;gap:8px;align-items:center;font-size:13px;margin:2px 0}
  .sv-opsi b{font-family:var(--mono);font-weight:400;text-align:right}
  table.sv{width:100%;border-collapse:collapse;font-size:13.5px;margin:8px 0 14px}
  table.sv th{text-align:left;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--line);padding:5px 8px}
  table.sv td{padding:6px 8px;border-bottom:1px solid var(--line-soft);vertical-align:top}
  .sv-bilah{display:flex;width:180px;max-width:40vw;height:12px;background:var(--line-soft);border-radius:3px;overflow:hidden}
  .sv-bilah i{display:block;height:100%}
  .sv-leg{display:inline-flex;gap:10px;margin-left:8px;flex-wrap:wrap}
  .sv-leg i{display:inline-block;width:10px;height:10px;margin-right:4px;vertical-align:middle;border-radius:2px}
  .gulir{overflow-x:auto}`;
