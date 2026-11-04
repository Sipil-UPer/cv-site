/* =====================================================================
   DRAF LED — Laporan Evaluasi Diri Program Studi (LAM Teknik)
   ---------------------------------------------------------------------
   Mengisi template resmi `led-template.docx` (LEDPS LAM Teknik, instrumen
   2025 ver. 2, "pasca akreditasi pertama dan unggul") di browser, dari
   angka yang sudah dihitung halaman skor. Dipanggil dari tombol "Unduh
   draf LED" di skor.html (keputusan pemilik 2026-11-03: tombol di halaman
   skor, narasi = kalimat + angka + [isi]).

   Cara kerja: tiap SLOT mencari judul subbagian di template (berurutan,
   dari atas ke bawah), lalu kalimat petunjuk biru "(… disampaikan oleh
   pengusul …)" sesudahnya, lalu menyisipkan draf SETELAH petunjuk dan
   kotak isiannya. Petunjuk resmi LAM tidak dihapus.

   Penandaan di dokumen:
     sorot kuning        = narasi buatan mesin, harus diperiksa
     [isi: …] merah      = fakta yang hanya diketahui prodi, wajib diisi
     tanpa sorot         = tabel data, grafik, dan tautan bukti yang diambil
                           langsung dari sistem
   LED adalah dokumen yang diserahkan ke LAM Teknik (pemilik 2026-11-04):
   skor, bobot, NA, status, dan acuan matriks hasil penilaian sendiri TIDAK
   ditulis; semuanya tetap di halaman skor. Dosen tinggal melengkapi narasi.
   Peta subbagian LED ke butir: docs/led-peta-butir.md.
   ===================================================================== */

import { RENCANA_BUKTI, LKPS_TABEL, kelompokDokumen, buktiButir, saranDokumen } from './rencana-bukti.js?v=2026-11-05-c87389';
import { grafikButir, tabelGrafik, tabelPendukung } from './led-data.js?v=2026-11-05-c87389';
import { gambarGrafik } from './led-grafik.js?v=2026-11-05-c87389';

const NS = {
  w:  'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
  r:  'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
  wp: 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
  pr: 'http://schemas.openxmlformats.org/package/2006/relationships',
};
const TEMPLATE = 'led-template.docx';
const LOGO = 'logo-uper.png';
const JSZIP = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';
// Template sendiri (tools/make_led_template.py): A4 11906 twip, margin
// kiri 1440, kanan 1106; isi rata dengan kolom teks, lebar 9360.
const INDEN = 0;
const LEBAR = 9360;
const LOGO_LEBAR_EMU = 1800000;       // 5 cm

// ---------------------------------------------------------------------
//  Pembangun XML WordprocessingML (string)
// ---------------------------------------------------------------------
const xe = s => String(s ?? '').replace(/[&<>"]/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function run(t, o = {}){
  const pr = [
    o.gaya ? `<w:rStyle w:val="${o.gaya}"/>` : '',
    o.b ? '<w:b/>' : '', o.i ? '<w:i/>' : '',
    o.warna ? `<w:color w:val="${o.warna}"/>` : '',
    o.sz ? `<w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/>` : '',
    o.sorot ? `<w:highlight w:val="${o.sorot}"/>` : '',
  ].join('');
  return `<w:r>${pr ? `<w:rPr>${pr}</w:rPr>` : ''}<w:t xml:space="preserve">${xe(t)}</w:t></w:r>`;
}

// Narasi mesin: sorot kuning; potongan [isi: …] merah tebal.
function auto(t, o = {}){
  return String(t).split(/(\[isi:[^\]]*\])/).filter(Boolean).map(s =>
    s.startsWith('[isi:')
      ? run(s, { ...o, b: true, warna: 'C00000', sorot: 'yellow' })
      : run(s, { ...o, sorot: 'yellow' })).join('');
}

function para(isi, o = {}){
  const kotak = ['top', 'left', 'bottom', 'right'].map(s =>
    `<w:${s} w:val="dashed" w:sz="4" w:space="4" w:color="808080"/>`).join('');
  const pr = [
    o.keep ? '<w:keepNext/>' : '',
    o.kotak ? `<w:pBdr>${kotak}</w:pBdr><w:shd w:val="clear" w:color="auto" w:fill="${o.kotak}"/>` : '',
    `<w:spacing w:before="${o.before ?? 60}" w:after="${o.after ?? 120}"/>`,
    `<w:ind w:left="${o.ind ?? INDEN}"/>`,
    `<w:jc w:val="${o.jc || 'both'}"/>`,
  ].join('');
  return `<w:p><w:pPr>${pr}</w:pPr>${isi}</w:p>`;
}
const paraAuto = (t, o) => para(auto(t), o);

function tautan(P, url, label, o = {}){
  return `<w:hyperlink r:id="${P.link(url)}" w:history="1">${
    run(label || url, { ...o, gaya: 'Hyperlink' })}</w:hyperlink>`;
}

const gambar = ket => para(run(`[Gambar: ${ket} — sisipkan gambar di sini]`,
  { i: true, warna: '7F7F7F' }), { kotak: 'F2F2F2', jc: 'center', before: 120, after: 160 });

// baris: [[sel]], sel = teks | {t, url, span}. o.kepala = jumlah baris kepala.
function tabel(P, baris, o = {}){
  const B = baris.map(r => r.map(c => c && typeof c === 'object' ? c : { t: String(c ?? '') }));
  const n = Math.max(1, ...B.map(r => r.reduce((a, c) => a + (c.span || 1), 0)));
  // Lebar kolom sebanding panjang teks terpanjang (7–40 karakter); di bawah
  // 7 kolom angka seperti "2,90" atau judul "Butir" terpotong.
  const pj = Array(n).fill(7);
  B.forEach(r => { let k = 0; r.forEach(c => {
    if ((c.span || 1) === 1)
      pj[k] = Math.max(pj[k], Math.min(40, (c.url ? (c.t || 'buka') : c.t || '').length));
    k += c.span || 1; }); });
  const tot = pj.reduce((a, b) => a + b, 0);
  const w = pj.map(x => Math.floor(LEBAR * x / tot));
  w[n - 1] += LEBAR - w.reduce((a, b) => a + b, 0);
  const nKepala = o.kepala ?? 1;
  const garis = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(s =>
    `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="808080"/>`).join('');
  const rows = B.map((r, i) => {
    const kepala = i < nKepala;
    let k = 0;
    const sel = r.map(c => {
      const sp = c.span || 1;
      const cw = w.slice(k, k + sp).reduce((a, b) => a + b, 0);
      k += sp;
      const isi = c.links ? c.links.map(l => tautan(P, l.url, l.t, { sz: 18 })).join(run('; ', { sz: 18 }))
                : c.url ? tautan(P, c.url, c.t || 'buka', { sz: 18 })
                : c.auto ? auto(c.t, { sz: 18 })
                : run(c.t, { b: kepala, sz: 18 });
      return `<w:tc><w:tcPr><w:tcW w:w="${cw}" w:type="dxa"/>${
        sp > 1 ? `<w:gridSpan w:val="${sp}"/>` : ''}${
        kepala ? '<w:shd w:val="clear" w:color="auto" w:fill="DCE6F1"/>' : ''}</w:tcPr>` +
        `<w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr>${isi}</w:p></w:tc>`;
    });
    for (; k < n; k++)
      sel.push(`<w:tc><w:tcPr><w:tcW w:w="${w[k]}" w:type="dxa"/></w:tcPr><w:p/></w:tc>`);
    return `<w:tr>${kepala ? '<w:trPr><w:tblHeader/></w:trPr>' : ''}${sel.join('')}</w:tr>`;
  }).join('');
  return `<w:tbl><w:tblPr><w:tblW w:w="${LEBAR}" w:type="dxa"/>` +
    `<w:tblInd w:w="${INDEN}" w:type="dxa"/><w:tblBorders>${garis}</w:tblBorders>` +
    `<w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="80" w:type="dxa"/>` +
    `<w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr>` +
    `<w:tblGrid>${w.map(x => `<w:gridCol w:w="${x}"/>`).join('')}</w:tblGrid>${rows}</w:tbl>` +
    para('', { before: 0, after: 60 });
}

function paraLogo(cx, cy){
  return `<w:p><w:pPr><w:spacing w:before="0" w:after="240"/><w:jc w:val="center"/></w:pPr>` +
    `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="9001" name="Logo Universitas Pertamina"/>` +
    `<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
    `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:nvPicPr><pic:cNvPr id="0" name="${LOGO}"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="rIdLedLogo"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>` +
    `</a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

// Grafik data (led-grafik.js) sebagai gambar sebaris, rata tengah.
const GRAFIK_LEBAR_EMU = 5400000;     // 15 cm
function paraGrafik(rid, cx, cy, id, nama){
  return `<w:p><w:pPr><w:keepNext/><w:spacing w:before="120" w:after="0"/><w:jc w:val="center"/></w:pPr>` +
    `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="${xe(nama)}"/>` +
    `<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
    `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:nvPicPr><pic:cNvPr id="0" name="${xe(nama)}.png"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>` +
    `</a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

// Butir yang mendapat grafik data (satu grafik per butir; 7 dan 41 memakai
// grafik butir 6 dan 40).
const BUTIR_GRAFIK = ['6', '23', '25', '31', '32', '33', '34', '40', '42', '43',
                      '46', '47', '49', '50', '51', '52'];

// Tabel pendukung, dan grafik + tabel datanya.
function blokData(C, P, no){
  const out = [];
  const tp = tabelPendukung(no, C.D, C.ts);
  if (tp){
    out.push(para(run(tp.judul, { b: true }), { keep: true }));
    out.push(tabel(P, tp.baris));
  }
  const g = C.grafik && C.grafik[no];
  if (g){
    const n = ++C.nomorGambar;
    out.push(paraGrafik(g.rid, g.cx, g.cy, 9100 + n, `Grafik butir ${no}`));
    out.push(para(run(`Gambar ${n}. ${g.spec.judul}`, { i: true, sz: 18 }), { jc: 'center', before: 40 }));
    out.push(para(run(`Data Gambar ${n} (${g.spec.satuan})`, { b: true, sz: 18 }), { keep: true }));
    out.push(tabel(P, tabelGrafik(g.spec)));
  }
  return out.join('');
}

// ---------------------------------------------------------------------
//  Isi: kriteria, narasi butir kualitatif, gambar
// ---------------------------------------------------------------------
const rentangNo = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String(a + i));
const KRITERIA = {
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
const NARASI = {
  '1': P => [
    `Visi keilmuan ${P.ps} adalah “[isi: rumusan visi keilmuan prodi]”. Visi ini linear dengan visi ${P.pt} “[isi: visi PT]” dan visi UPPS “[isi: nama UPPS dan visinya]”.`,
    `Kekhasan VMTS terletak pada [isi: bidang kekhasan dan keunggulan kompetitif prodi], yang tertuang dalam Renstra [isi: nomor dan periode Renstra] dan diwujudkan dalam kurikulum melalui [isi: CPL atau mata kuliah yang mencerminkan kekhasan].`,
    `VMTS ditinjau ulang secara berkala; peninjauan terakhir dilakukan pada [isi: tahun dan forum peninjauan].`],
  '2': P => [
    `VMTS disusun melalui [isi: tahapan penyusunan, misalnya lokakarya, rapat, survei] dengan melibatkan pemangku kepentingan internal (dosen, mahasiswa, tenaga kependidikan) dan eksternal (alumni, pengguna lulusan, pakar).`,
    `Keterlibatan tiap pihak dibuktikan dengan [isi: notulen, daftar hadir, SK tim, dan tahun pelaksanaan].`],
  '3': P => [
    `VMTS disosialisasikan kepada [isi: sasaran sosialisasi] melalui [isi: media dan kegiatan sosialisasi].`,
    `Tingkat pemahaman diukur dengan [isi: metode, misalnya survei pemahaman VMTS] pada [isi: tahun], dengan hasil [isi: persentase responden yang memahami].`,
    `Capaian jangka pendek dan menengah yang telah diraih: [isi: daftar capaian konkret beserta tahunnya].`],
  '4': P => [[
    `Struktur organisasi UPPS dan ${P.ps} ditetapkan dengan [isi: nomor SK atau peraturan] dan berpedoman pada Statuta ${P.pt} [isi: nomor statuta].`,
    `Kebijakan operasional, wewenang, dan tugas tiap organ diatur dalam [isi: dokumen organisasi dan tata kerja atau SOP].`], [
    `Penerapan Good University Governance tampak pada [isi: bukti kredibilitas, transparansi, akuntabilitas, tanggung jawab, dan keadilan, misalnya laporan kinerja, rapat terbuka, mekanisme pengaduan].`]],
  '5': P => [[
    `Komitmen pimpinan UPPS ditunjukkan melalui [isi: kebijakan atau program terkait visi dan tujuan strategis], penegakan integritas dan kode etik [isi: dokumen kode etik], serta pengembangan SDM [isi: program studi lanjut, pelatihan, sertifikasi].`], [
    `Kemampuan manajerial pimpinan UPPS tampak pada [isi: contoh pengambilan keputusan dan penyelesaian konflik beserta dampaknya bagi organisasi].`]],
  '7': P => [
    `Kerja sama yang terlaksana memberikan manfaat bagi ${P.ps} dalam pembelajaran, penelitian, dan PkM, antara lain [isi: contoh manfaat konkret].`,
    `Kerja sama meningkatkan kinerja tridharma dan fasilitas pendukung, misalnya [isi: contoh].`,
    `Kepuasan mitra diukur dengan [isi: instrumen survei kepuasan mitra] dengan hasil [isi: ringkasan hasil].`],
  '8': P => [
    `Pengelolaan keuangan UPPS mengikuti [isi: peraturan keuangan PT] dengan prinsip akuntabel, transparan, efektif, dan efisien.`,
    `Anggaran disusun melalui [isi: mekanisme perencanaan anggaran], diaudit oleh [isi: auditor internal atau eksternal dan tahun audit], dan risiko keuangan dikelola dengan [isi: mekanisme].`],
  '12': P => [
    `Kurikulum ${P.ps} dievaluasi dan dimutakhirkan secara berkala; pemutakhiran terakhir dilakukan pada [isi: tahun] dan ditetapkan dengan [isi: nomor SK kurikulum].`,
    `Pemutakhiran melibatkan [isi: pemangku kepentingan internal dan eksternal yang terlibat] dan direviu oleh pakar [isi: nama dan instansi pakar], dengan memperhatikan perkembangan iptek dan kebutuhan pengguna.`],
  '13': P => [[
    `Profil lulusan ${P.ps} adalah [isi: daftar profil lulusan], ditetapkan dengan mempertimbangkan visi UPPS, visi keilmuan prodi, kebutuhan pengguna, sumber daya yang dimiliki, serta kepentingan lokal, nasional, dan global.`], [
    `CPL ${P.ps} berjumlah [isi: jumlah CPL] dan dipetakan ke profil lulusan seperti pada gambar berikut. CPL disusun sesuai kebutuhan pengguna, perkembangan iptek dan industri, serta daya saing global, dan diukur melalui [isi: mekanisme pengukuran CPL, misalnya laporan capaian CPL per semester].`]],
  '14': P => [[
    `CPL mencakup konsep rekayasa khas bidang teknik sipil, kemampuan teknis dan adaptasi teknologi baru, komunikasi dan kerja tim, serta etika profesi, sebagaimana tampak pada [isi: nomor CPL untuk tiap aspek].`], [
    `Pencapaian CPL ditinjau secara rutin [isi: frekuensi] melalui [isi: forum tinjauan] yang melibatkan [isi: pemangku kepentingan internal dan eksternal]; hasil tinjauan terakhir: [isi: ringkasan].`]],
  '15': P => [[
    `[isi: jumlah] dari [isi: jumlah] mata kuliah memiliki RPS yang memuat 9 komponen, dan RPS dapat diakses mahasiswa melalui [isi: sistem atau tautan].`], [
    `RPS ditinjau secara berkala [isi: frekuensi dan mekanisme]; tinjauan terakhir pada [isi: semester dan tahun].`]],
  '16': P => [[
    `Proses pembelajaran menggunakan metode [isi: metode, misalnya PBL atau studi kasus], media dan sumber belajar [isi: LMS, laboratorium], interaksi dosen dan mahasiswa [isi: bentuk], serta tugas yang meningkatkan daya analisis kritis [isi: contoh].`], [
    `Pemantauan proses pembelajaran dilakukan [isi: frekuensi] melalui [isi: instrumen, misalnya monitoring kesesuaian materi dengan RPS dan EDOM], dan temuan ditindaklanjuti dengan [isi: contoh tindakan perbaikan].`]],
  '17': P => [
    `Hasil penelitian dan PkM DTPS diintegrasikan ke dalam pembelajaran pada [isi: jumlah] mata kuliah (Tabel 3.a.3 LKPS), misalnya [isi: contoh mata kuliah dan topik].`,
    `Integrasi ini relevan dengan CPL, mendukung keunggulan kompetitif prodi, mengandung kebaruan ilmiah, dan berdampak sosial: [isi: uraian singkat].`],
  '18': P => [
    `Pembelajaran dalam bentuk penugasan, praktikum, praktik bengkel, atau praktik lapangan dilaksanakan pada [isi: daftar mata kuliah atau kegiatan]. Rasio jam penugasan dan praktik terhadap jam pembelajaran total disajikan pada tabel berikut.`],
  '20': P => [
    `Capstone design dilaksanakan pada mata kuliah [isi: nama mata kuliah dan SKS] dengan mata kuliah penunjang [isi: daftar mata kuliah] (Tabel 3.a.5 LKPS).`,
    `Pelaksanaannya diatur dalam [isi: panduan capstone], memiliki CPMK [isi: rumusan CPMK], serta menggunakan standar keteknikan [isi: standar yang dipakai, misalnya SNI] dan batasan realistis. Bukti pelaksanaan: [isi: laporan, poster, atau dokumen].`],
  '21': P => [[
    `Suasana akademik dikelola melalui kebijakan [isi: dokumen], program [isi: seminar, kuliah tamu, kelompok studi], dan fasilitas [isi: ruang diskusi, laboratorium], yang dievaluasi secara berkala melalui [isi: mekanisme evaluasi].`], [
    `Kebebasan akademik, mimbar akademik, dan otonomi keilmuan dilaksanakan melalui kegiatan terjadwal seperti [isi: contoh kegiatan dan jadwalnya].`]],
  '22': P => [
    `UPPS memiliki peta jalan penelitian [isi: periode] yang mendukung VMTS UPPS dan visi keilmuan ${P.ps}, dengan tema [isi: tema utama].`,
    `Peta jalan memayungi tema penelitian dosen dan mahasiswa, dievaluasi secara berkala [isi: mekanisme evaluasi], dan berdampak bagi masyarakat [isi: contoh dampak].`],
  '24': P => [
    `UPPS memiliki peta jalan PkM [isi: periode] yang mendukung VMTS UPPS dan visi keilmuan ${P.ps}, dengan tema [isi: tema utama].`,
    `Peta jalan memayungi tema PkM dosen dan mahasiswa, dievaluasi secara berkala [isi: mekanisme evaluasi], dan berdampak bagi masyarakat [isi: contoh dampak].`],
  '29': P => [
    `Tenaga kependidikan pendukung prodi terdiri atas [isi: jumlah laboran, teknisi, dan administrator] dengan kualifikasi [isi: pendidikan dan sertifikat kompetensi] (Tabel 4.b LKPS). Kecukupannya dinilai terhadap [isi: jumlah laboratorium dan beban layanan].`],
  '30': P => [
    `Rerata beban kerja DTPS dihitung dari data BKD (Tabel 4.c LKPS) dan disajikan pada tabel berikut. [isi: analisis sebaran beban pendidikan, penelitian, PkM, dan tugas tambahan].`],
  '38': P => [[
    `Sarana akademik meliputi [isi: ruang kelas, laboratorium sesuai panduan asosiasi, perpustakaan, media pembelajaran, perangkat lunak] (Tabel 5.a LKPS); kelayakan dan kemudahan aksesnya: [isi: uraian].`], [
    `Sarana nonakademik meliputi pusat kesehatan, layanan konseling, layanan karier, dan fasilitas ibadah: [isi: uraian, kelayakan, dan kemudahan akses].`]],
  '39': P => [
    `Kebijakan dan tata kelola K3L ditetapkan dalam [isi: dokumen], didukung sarana [isi: APAR, jalur evakuasi, P3K, APD laboratorium] (Tabel 5.b dan 5.c LKPS).`,
    `Pelaksanaan K3L dibuktikan dengan [isi: inspeksi, pelatihan, simulasi] dan ditinjau secara berkala [isi: frekuensi].`],
  '48': P => [
    `Tracer study dikoordinasikan oleh [isi: unit tingkat PT], dilaksanakan setiap tahun [isi: periode], memakai kuesioner yang memuat pertanyaan inti tracer study DIKTI, dan menyasar seluruh lulusan TS-2 s.d. TS-1 dengan tingkat respons [isi: persentase].`,
    `Hasilnya disosialisasikan kepada [isi: sasaran] dan digunakan untuk [isi: contoh perbaikan kurikulum dan pembelajaran].`],
  '52': P => [
    `Kepuasan pengguna lulusan diukur pada tujuh aspek (Tabel 6.g.2 LKPS) melalui [isi: instrumen dan jumlah responden]; hasilnya disajikan pada tabel berikut. [isi: aspek terkuat, aspek terlemah, dan tindak lanjutnya].`],
  '53': P => [[
    `Unit penjaminan mutu UPPS dibentuk dengan [isi: nomor SK]; auditor bersifat independen [isi: dasar]; audit mutu internal dilaksanakan [isi: tahun atau siklus], dan hasilnya dibahas dalam Rapat Tinjauan Manajemen [isi: tanggal RTM].`], [
    `Perangkat SPMI terdiri atas kebijakan SPMI, pedoman PPEPP, standar, dan tata cara pendokumentasian [isi: nomor dokumen]. Pengakuan mutu eksternal: [isi: akreditasi, sertifikasi, atau audit eksternal].`]],
  '54': P => [
    `IKT ${P.ps} adalah [isi: daftar IKT beserta target], disusun dari tujuan strategis, berdampak dan terukur, menunjukkan daya saing internasional, dan telah diukur pada [isi: tahun] dengan hasil [isi: capaian].`],
  '55': P => [
    `Dokumen IKU dan IKT tersedia dalam [isi: dokumen]. Siklus PPEPP terlaksana, misalnya [isi: satu siklus lengkap dari penetapan sampai peningkatan standar]. Bukti efektivitas: [isi: temuan AMI dan tindak lanjutnya].`],
  '56': P => [
    `Capaian kinerja diukur dengan [isi: metode]; indikator yang tidak tercapai dianalisis akar masalahnya [isi: contoh], ditinjau rutin dalam [isi: forum], dan hasilnya disebarluaskan melalui [isi: media].`],
  '57': P => [
    `Kepuasan pemangku kepentingan (mahasiswa, dosen, tenaga kependidikan, lulusan, pengguna, dan mitra) terhadap layanan manajemen diukur dengan [isi: instrumen dan periode], dengan hasil [isi: ringkasan per kelompok] dan tindak lanjut [isi: uraian].`],
  '58': P => [[
    `Lingkungan makro yang memengaruhi pengembangan ${P.ps}: [isi: kebijakan nasional, perkembangan iptek bidang teknik sipil, isu strategis]. Lingkungan mikro: [isi: pesaing, pengguna lulusan, kebutuhan dunia usaha dan industri].`,
    `Dari analisis ini, alternatif pengembangan yang relevan adalah [isi: uraian].`], [
    `Rangkuman SWOT seluruh kriteria disajikan di bawah. Posisi UPPS dan prodi berdasarkan analisis SWOT: [isi: kuadran dan alasannya].`]],
  '59': P => [
    `Tujuan strategis pengembangan ${P.ps} untuk jangka pendek dan menengah adalah [isi: daftar tujuan strategis], diturunkan dari analisis SWOT, Renstra [isi: nomor dan periode], dan aspirasi pemangku kepentingan.`],
  '60': P => [
    `Program pengembangan berkelanjutan disusun dari tujuan strategis dengan memperhatikan alokasi sumber daya, kemampuan pelaksanaan, rencana penjaminan mutu, dan dukungan eksternal: [isi: program, target, indikator, dan tahun].`],
};

const GAMBAR = {
  '2': [0, 'Alur penyusunan VMTS'],
  '4': [0, 'Struktur organisasi UPPS dan program studi'],
  '12': [0, 'Alur evaluasi dan pemutakhiran kurikulum'],
  '13': [1, 'Pemetaan CPL terhadap profil lulusan'],
  '22': [0, 'Peta jalan penelitian'],
  '24': [0, 'Peta jalan PkM'],
  '53': [0, 'Struktur unit penjaminan mutu'],
  '55': [0, 'Siklus PPEPP'],
};

// ---------------------------------------------------------------------
//  Blok per butir dan per kriteria
// ---------------------------------------------------------------------
const bersih = s => String(s || '').replace(/\s+/g, ' ').trim();

function tabelDariHtml(t, maks = 40){
  const rows = [...t.rows].map(tr => [...tr.cells].map(c => ({
    t: bersih(c.textContent.replace(/kunci:\s*\S+/g, '')), span: c.colSpan || 1 })));
  const kepala = t.tHead ? t.tHead.rows.length : 0;
  if (rows.length > kepala + maks){
    const sisa = rows.length - kepala - maks;
    rows.splice(kepala + maks);
    rows.push([{ t: `… ${sisa} baris lagi; daftar lengkap pada LKPS`, span: 99 }]);
  }
  return { rows, kepala };
}

function dariKartu(el){
  if (!el) return { tabel: [], rumus: [], syarat: '' };
  const luar = x => !x.closest('details.rinci');
  return {
    tabel: [...el.querySelectorAll('table')].filter(luar).map(t => tabelDariHtml(t)),
    rumus: [...el.querySelectorAll('.rumus')].filter(luar).map(x => bersih(x.textContent)).filter(Boolean),
    syarat: bersih(el.querySelector('.syarat-ket')?.textContent),
  };
}

// Buang kolom berjudul "Skor"/"Bobot" (faktor rumus skor) dan baris yang
// diawali "Skor" dari tabel kartu.
function tanpaSkor(t){
  const kepala = t.rows.slice(0, t.kepala);
  const isSkor = s => /^skor\b/i.test(s || '');
  const isKolomSkor = s => /^(skor|bobot)\b/i.test(s || '');
  const buang = new Set();
  kepala.forEach(r => { let k = 0; r.forEach(c => { if (isKolomSkor(c.t) && (c.span || 1) === 1) buang.add(k); k += c.span || 1; }); });
  const rows = t.rows.filter((r, i) => i < t.kepala || !isSkor(r[0]?.t)).map(r => {
    let k = 0;
    return r.filter(c => { const ok = !buang.has(k); k += c.span || 1; return ok; });
  });
  return { rows, kepala: t.kepala };
}

function blokButir(C, P, no, k = 0){
  const s = C.skorButir[no] || { n: 0, ada: false };
  const judul = C.judulButir[no] || `Butir ${no}`;
  const jd = judul.replace(/\s*\((Tabel[^)]*)\)\s*$/, '');
  const tbl = (judul.match(/\((Tabel[^)]*)\)\s*$/) || [])[1];
  const nar = NARASI[no] ? NARASI[no](C.P) : null;
  const dua = Array.isArray(nar?.[0]);
  const bagian = dua ? nar[k] || [] : (k === 0 ? nar || [] : []);
  const gb = GAMBAR[no] && GAMBAR[no][0] === k ? gambar(GAMBAR[no][1]) : '';
  const out = [];

  if (k > 0){
    out.push(paraAuto('Data dan bukti untuk bagian ini disajikan pada bagian sebelumnya.'));
    bagian.forEach(t => out.push(paraAuto(t)));
    return out.join('') + gb;
  }

  if (dua) out.push(paraAuto('Komponen I.'));
  if (bagian.length) bagian.forEach(t => out.push(paraAuto(t)));
  else out.push(paraAuto(s.ada
    ? `Data ${jd.toLowerCase()} pada TS ${C.ta2} s.d. ${C.ta}${tbl ? ` (${tbl})` : ''} disajikan pada tabel berikut. [isi: uraian capaian dan maknanya bagi ${C.P.ps}].`
    : `[isi: uraian ${jd.toLowerCase()}${tbl ? `, dengan data ${tbl}` : ''}, beserta capaiannya].`));

  // Tabel data dari kartu skor, tanpa kolom/baris skor. Butir yang dinilai
  // dengan matriks (manual) hanya berisi isian skor, jadi tidak disalin.
  if (!C.manual.has(no)) dariKartu(C.kartu(no)).tabel.map(tanpaSkor)
    .forEach(t => { if (t.rows.length > t.kepala) out.push(tabel(P, t.rows, { kepala: t.kepala })); });
  out.push(blokData(C, P, no));

  const u = C.buktiButir(no);
  out.push(para(run('Bukti butir: ', { b: true }) +
    (u ? tautan(P, u) : auto('[isi: tautan folder bukti butir di Drive prodi]'))));
  const rk = C.rekapKarya(no);
  if (rk && rk.n) out.push(para(
    run(`Bukti karya: ${rk.ada} dari ${rk.n} karya memiliki tautan bukti; tautan tiap karya ada pada Lampiran B.`)));

  // Daftar periksa bukti (rencana-bukti.js) dengan kolom tautan untuk diisi,
  // lalu kerangka capaian–analisis–tindak lanjut (pola narasi 6 langkah).
  const rb = RENCANA_BUKTI[no];
  if (rb){
    // Dokumen induk terkait lebih dulu (tautan terisi bila sudah diunggah),
    // lalu butir daftar periksa lainnya.
    const tautanSel = u => u ? { url: u, t: 'buka' } : { t: '[isi: tautan]', auto: true };
    // Bukti tertaut di butir (tabel butir_bukti: pustaka versi berlaku,
    // entri pustaka, unggahan di butir), lalu saran pustaka yang belum
    // ditautkan, lalu daftar bukti yang dianjurkan matriks.
    const opsi = { dokumen: C.dokumen, butirBukti: C.butirBukti, ts: C.ts };
    const baris = [];
    buktiButir(no, opsi).forEach(x => baris.push([
      x.label + (x.lain.length ? `; versi lain: ${x.lain.map(v => v.tahun).join(', ')}` : ''),
      tautanSel(x.url)]));
    saranDokumen(no, C.butirBukti).forEach(j => baris.push([`${j.nama} (saran dari pustaka)`, tautanSel('')]));
    rb.bukti.forEach(b => baris.push([b, tautanSel('')]));
    out.push(para(run('Daftar bukti sahih', { b: true }), { keep: true }));
    out.push(tabel(P, [['No', 'Bukti sahih', 'Tautan'],
      ...baris.map((r, i) => [String(i + 1), ...r])]));
  }
  out.push(paraAuto(`Capaian TS ${C.ta2} s.d. ${C.ta}: [isi: angka per tahun dibanding target]. ` +
    'Analisis: [isi: faktor pendukung dan akar masalah bila target belum tercapai]. ' +
    'Tindak lanjut: [isi: kegiatan, penanggung jawab, tenggat, indikator keberhasilan].'));
  return out.join('') + gb;
}


const latar = K => (C, P) => paraAuto(
  `Kriteria ${K.nama} bertujuan [isi: tujuan kriteria bagi UPPS dan prodi]. [isi: latar belakang dan rasional, dikaitkan dengan VMTS UPPS dan visi keilmuan ${C.P.ps}].`);

const kebijakan = K => (C, P) => paraAuto(
  `Dokumen formal kebijakan yang diacu: [isi: daftar nomor, judul, dan tahun dokumen]. Dokumen yang lazim untuk kriteria ini: ${K.contoh}.`);

const analisis = K => (C, P) =>
    paraAuto(`Capaian kriteria ${K.nama} pada TS ${C.ta2} s.d. ${C.ta} disajikan pada subbagian di atas. [isi: capaian yang menonjol dan yang belum optimal].`) +
    paraAuto('Faktor pendukung keberhasilan: [isi: uraian]. Akar masalah butir yang belum optimal: [isi: hasil analisis akar masalah, misalnya diagram tulang ikan].');

const swot = K => (C, P) => {
  return [
    'Kekuatan: [isi: uraian].',
    'Kelemahan: [isi: uraian].',
    'Peluang: [isi: uraian].',
    'Ancaman: [isi: uraian].',
    'Strategi perbaikan dan pengembangan (SO, WO, ST, WT): [isi: uraian].',
  ].map(t => paraAuto(t)).join('');
};


const blokRingkasan = (C, P) => [
  `Laporan Evaluasi Diri ini disusun oleh ${C.P.ps} ${C.P.pt} untuk akreditasi dengan instrumen APS-AV 2025 LAM Teknik. [isi: ringkasan proses penyusunan].`,
  '[isi: capaian utama program studi pada TS ini, dikaitkan dengan VMTS dan target renstra].',
  'Kekuatan utama: [isi: uraian]. Tantangan utama: [isi: uraian]. Rencana pengembangan: [isi: uraian].',
].map(t => paraAuto(t)).join('');


// Lampiran untuk asesor: semua tautan langsung ke Drive (situs prodi perlu
// login, jadi tidak dipakai di sini). A = per butir, B = per karya,
// C = per tabel LKPS.
const judulLampiran = t => para(run(t, { b: true, warna: '1F3864' }), { keep: true, before: 240 });
function blokLampiran(C, P){
  const out = [];
  out.push(paraAuto(`Seluruh bukti sahih LED dan LKPS ${C.P.ps} disimpan di Google Drive akun prodi, folder induk [isi: nama dan tautan folder induk]. ` +
    'Folder disusun mengikuti struktur penilaian: (1) bukti tingkat butir di subfolder butir-NN sesuai no urut 1–60 matriks APS-AV 2025; ' +
    '(2) bukti karya dosen dan mahasiswa (penelitian, PkM, publikasi, luaran, rekognisi) di subfolder per tahun dan per dosen, satu subfolder atau berkas per karya; ' +
    '(3) dokumen bernama (statuta, renstra, kurikulum, SK, perangkat SPMI, laporan, dan sebagainya) di subfolder per jenis dan tahun; dokumen tahun berbeda disimpan sebagai versi tersendiri, dan versi yang diganti pada tahun yang sama dipindah ke subfolder _arsip. ' +
    'Setiap folder bukti dan berkasnya dibagikan dengan akses "siapa pun yang memiliki tautan: Viewer", sehingga dapat dibuka asesor tanpa masuk akun. ' +
    'Rekapitulasi disajikan pada Lampiran A (per butir LED), Lampiran B (per karya), Lampiran C (per tabel LKPS), dan Lampiran D (dokumen). ' +
    'Narahubung verifikasi bukti: [isi: nama, jabatan, surel, telepon].'));

  out.push(judulLampiran('Lampiran A. Indeks bukti per butir LED'));
  out.push(tabel(P, [['Butir', 'Judul', 'Bukti butir', 'Bukti karya'],
    ...Object.keys(C.skorButir).sort((a, b) => a - b).map(no => {
      const u = C.buktiButir(no), rk = C.rekapKarya(no);
      const tertaut = buktiButir(no, { dokumen: C.dokumen, butirBukti: C.butirBukti, ts: C.ts })
        .filter(x => x.url).map(x => ({ url: x.url, t: x.label }));
      const sel = u ? [{ url: u, t: 'folder butir' }, ...tertaut] : tertaut;
      return [no, C.judulButir[no] || '',
        sel.length ? { links: sel, t: sel.map(l => l.t).join('; ') } : { t: '[isi: tautan]', auto: true },
        rk && rk.n ? `${rk.ada}/${rk.n} karya (Lampiran B)` : '—'];
    })]));

  out.push(judulLampiran('Lampiran B. Bukti karya per butir'));
  out.push(para(run(`Karya mengikuti jendela TS yang sama dengan LKPS (TS ${C.ta}). Karya yang dihitung pada lebih dari satu butir hanya dicantumkan pada butir pertama.`,
    { sz: 18, warna: '595959' })));
  const sudah = new Set();
  Object.keys(C.skorButir).sort((a, b) => a - b).forEach(no => {
    const xs = C.daftarKarya(no);
    if (!xs || !xs.length) return;
    const baru = xs.filter(x => { const k = `${x.tahun}|${x.judul}`;
      if (sudah.has(k)) return false; sudah.add(k); return true; });
    out.push(para(run(`Butir ${no} · ${C.judulButir[no] || ''}`, { b: true }), { keep: true, before: 160 }));
    if (!baru.length){
      out.push(para(run(`Seluruh ${xs.length} karya butir ini sudah tercantum pada butir sebelumnya.`, { sz: 18 })));
      return;
    }
    out.push(tabel(P, [['Th', 'Karya', 'Bukti'],
      ...baru.map(x => [String(x.tahun ?? ''), x.judul || '',
        x.bukti && x.bukti.length
          ? { links: x.bukti.map(b => ({ url: b.url, t: b.label })), t: x.bukti.map(b => b.label).join('; ') }
          : { t: '[isi: tautan]', auto: true }])]));
    if (baru.length < xs.length)
      out.push(para(run(`${xs.length - baru.length} karya lain butir ini sudah tercantum pada butir sebelumnya.`, { sz: 18 })));
  });

  out.push(judulLampiran('Lampiran C. Indeks bukti LKPS per tabel'));
  out.push(tabel(P, [['Tabel LKPS', 'Bukti per baris', 'Butir', 'Tautan folder'],
    ...LKPS_TABEL.map(t => [t.tabel, t.bukti, t.butir, { t: '[isi: tautan]', auto: true }])]));

  out.push(judulLampiran('Lampiran D. Dokumen'));
  const dok = [];
  kelompokDokumen(C.dokumen, null, C.ts).forEach(g => {
    const semua = g.utama ? [g.utama, ...g.lain] : g.lain;
    semua.forEach(r => dok.push([g.nama, String(r.tahun), r.judul || '—',
      g.tunggal ? (r === g.utama ? 'berlaku' : 'versi lain') : '—',
      [...new Set((C.butirBukti || []).filter(b => b.dokumen_id === r.id || b.jenis_dokumen === r.jenis)
        .map(b => b.butir))].sort((a, b) => a - b).join(', ') || '—',
      { url: r.url, t: 'buka' }]));
  });
  out.push(dok.length
    ? tabel(P, [['Jenis', 'Tahun', 'Judul/nomor', 'Status', 'Butir', 'Tautan'], ...dok])
    : paraAuto('[isi: belum ada dokumen yang diunggah di halaman isi butir, bagian Dokumen].'));
  return out.join('');
}

// ---------------------------------------------------------------------
//  Titik sisip, berurutan seperti di template. `cari` = awal teks judul
//  subbagian; `k` = komponen butir (0 = I, 1 = II); `penanda` mengganti
//  kalimat petunjuk bila subbagian tidak memilikinya.
// ---------------------------------------------------------------------
const B = (cari, no, k = 0) => ({ cari, isi: (C, P) => blokButir(C, P, no, k) });
const KR = (kode) => {
  const K = KRITERIA[kode];
  return [
    { cari: 'Latar Belakang', isi: latar(K) },
    { cari: 'Kebijakan', isi: kebijakan(K) },
  ];
};
const AKHIR = kode => [
  { cari: 'Analisis Faktor Keberhasilan', isi: analisis(KRITERIA[kode]) },
  { cari: 'Strategi perbaikan dan pengembangan', isi: swot(KRITERIA[kode]) },
];

const SLOT = [
  { cari: 'KATA PENGANTAR', isi: () => paraAuto('[isi: kata pengantar dari pimpinan UPPS atau ketua program studi, termasuk ucapan terima kasih kepada tim penyusun dan pemangku kepentingan].') },
  { cari: 'RINGKASAN EKSEKUTIF', isi: blokRingkasan },
  { cari: 'BAB I PENDAHULUAN', isi: C => paraAuto(`Bab ini menguraikan [isi: dasar penyusunan LED, tujuan, ruang lingkup, dan sistematika laporan]. Data LED ini mengacu pada TS ${C.ta}, dengan jendela tiga tahun TS-2 s.d. TS (${C.ta2} s.d. ${C.ta}).`) },
  { cari: 'Struktur Tim Penyusun dan Mekanisme Kerja', isi: C => [
      `Tim penyusun LED ${C.P.ps} ditetapkan dengan [isi: nomor dan tanggal SK tim] dan melibatkan [isi: unit dan pemangku kepentingan internal dan eksternal].`,
      'Mekanisme kerja: pengumpulan data dari [isi: sumber data], verifikasi dan validasi oleh [isi: penanggung jawab], pengecekan konsistensi data LED dan LKPS, analisis data, identifikasi akar masalah, dan penetapan strategi pengembangan. Data dosen dan bukti karya dihimpun melalui sistem data dosen prodi, dengan berkas bukti di Google Drive prodi.',
      'Jadwal kerja tim: [isi: tahapan dan tanggal].'].map(t => paraAuto(t)).join('') + gambar('Struktur tim penyusun LED') },
  B('Analisis Lingkungan Eksternal dalam Pengembangan', '58', 0),
  // C.1
  ...KR('C1'),
  B('Kekhasan VMTS', '1'), B('Mekanisme Penyusunan VMTS', '2'),
  B('Tingkat pemahaman dan pencapaian VMTS', '3'),
  ...AKHIR('C1'),
  // C.2
  ...KR('C2'),
  B('Sistem Tata Pamong', '4', 0), B('Bagian ini menjelaskan perwujudan Good University', '4', 1),
  B('Komitmen pimpinan dan kemampuan', '5', 0), B('Bagian ini menjelaskan kemampuan manajerial', '5', 1),
  B('Relevansi kerja sama', '6'), B('Pelaksanaan kerja sama', '7'),
  B('Pengelolaan Keuangan', '8'), B('Biaya Operasional Pendidikan', '9'),
  B('Dana Penelitian', '10'), B('Dana PkM', '11'),
  ...AKHIR('C2'),
  // C.3
  ...KR('C3'),
  B('Pemutakhiran kurikulum', '12'),
  B('Profil lulusan', '13', 0), B('Kesesuaian CPL dengan profil lulusan', '13', 1),
  B('Kesesuaian CPL dengan standar kompetensi', '14', 0), B('Proses tinjauan rutin CPL', '14', 1),
  B('Ketersediaan dan kelengkapan dokumen RPS', '15', 0), B('Proses tinjauan rutin RPS', '15', 1),
  B('Proses pembelajaran untuk memastikan', '16', 0), B('Proses tinjauan rutin proses pembelajaran', '16', 1),
  B('Integrasi penelitian dan PkM dalam pembelajaran', '17'),
  B('Pembelajaran yang dilaksanakan dalam bentuk penugasan', '18'),
  B('Basic Sciences dan matematika', '19'),
  B('Proyek Rekayasa Penciri', '20'),
  B('Pengelolaan suasana akademik', '21', 0), B('Integritas dan kebebasan ilmiah', '21', 1),
  B('Kesesuaian penelitian dalam mendukung VMTS', '22'),
  B('Penelitian DTPS yang sesuai dengan Peta jalan', '23'),
  B('Kesesuaian PkM dalam mendukung VMTS', '24'),
  B('PkM DTPS yang sesuai dengan Peta jalan', '25'),
  ...AKHIR('C3'),
  // C.4
  ...KR('C4'),
  B('Kecukupan jumlah dosen tetap yang ditugaskan', '26'),
  B('Kualifikasi akademik DTPS', '27'), B('Jabatan akademik DTPS', '28'),
  B('Tenaga Kependidikan', '29'), B('Beban kerja DTPS', '30'),
  B('Kegiatan Penelitian', '31'), B('Kegiatan PkM', '32'),
  B('Publikasi ilmiah DTPS', '33'), B('Luaran penelitian dan PkM DTPS', '34'),
  B('Kinerja DTPS dalam mendukung keunggulan', '35'),
  B('Karya ilmiah DTPS yang disitasi', '36'),
  B('Pengakuan / rekognisi atas prestasi', '37'),
  ...AKHIR('C4'),
  // C.5
  ...KR('C5'),
  B('Sarana dan Prasarana', '38', 0),
  B('Bagian ini berisi deskripsi kecukupan serta mutu sarana dan prasarana untuk mendukung kegiatan non akademik', '38', 1),
  B('Keselamatan, Kesehatan Kerja', '39'),
  ...AKHIR('C5'),
  // C.6
  ...KR('C6'),
  B('Rasio jumlah mahasiswa terhadap jumlah DTPS', '40'), B('Persentase mahasiswa asing', '41'),
  B('IPK lulusan', '42'), B('Prestasi mahasiswa', '43'), B('Masa studi', '44'),
  B('Lulusan tepat waktu', '45'), B('Publikasi ilmiah mahasiswa', '46'),
  B('Luaran penelitian dan PkM yang dihasilkan mahasiswa', '47'),
  B('Tracer study', '48'), B('Waktu tunggu', '49'), B('Kesesuaian bidang kerja', '50'),
  B('Tingkat dan ukuran tempat kerja', '51'), B('Tingkat kepuasan pengguna lulusan', '52'),
  ...AKHIR('C6'),
  // C.7
  ...KR('C7'),
  B('Keberadaan unit penjaminan', '53', 0), B('Ketersediaan Perangkat SPMI', '53', 1),
  B('Indikator Kinerja Tambahan (IKT)', '54'),
  B('Keterlaksanaan penjaminan mutu', '55'), B('Evaluasi capaian kinerja', '56'),
  B('Kepuasan Pemangku kepentingan', '57'),
  ...AKHIR('C7'),
  // Bab III, IV, lampiran
  { cari: 'Analisis SWOT Semua', isi: (C, P) => blokButir(C, P, '58', 1) +
      Object.values(KRITERIA).map(K => para(run(K.nama, { b: true }), { keep: true }) + swot(K)(C, P)).join('') },
  B('Tujuan Strategis Pengembangan', '59'),
  B('Program Pengembangan Keberlanjutan', '60'),
  { cari: 'BAB IV. PENUTUP', isi: C =>
      paraAuto('[isi: kesimpulan akhir: temuan utama, kekuatan, kelemahan yang perlu diperbaiki, serta peluang dan ancaman yang harus dikelola].') },
  { cari: 'LAMPIRAN', penanda: /dari LKPS/, isi: blokLampiran },
];

// ---------------------------------------------------------------------
//  Penelusuran dokumen
// ---------------------------------------------------------------------
const norm = s => String(s || '').replace(/\s+/g, ' ').replace(/\s*\/\s*/g, '/').trim()
  .replace(/^([ivx]+|[a-z]|\d+)\.\s+/i, '').toLowerCase();
const teks = p => [...p.getElementsByTagNameNS(NS.w, 't')].map(t => t.textContent).join('');
const adalahP = n => n.namespaceURI === NS.w && n.localName === 'p';
const gayaP = p => p.getElementsByTagNameNS(NS.w, 'pStyle')[0]?.getAttributeNS(NS.w, 'val') || '';
const adalahKotak = n => adalahP(n) && !teks(n).trim() &&
  (n.getElementsByTagNameNS(NS.w, 'drawing').length || n.getElementsByTagNameNS(NS.w, 'pict').length);
const PETUNJUK = /disampaikan oleh pengusul|diisi oleh pengusul/i;

function cari(mulai, uji, maks = Infinity){
  for (let n = mulai, i = 0; n && i < maks; n = n.nextElementSibling){
    if (!adalahP(n) || /^TOC/i.test(gayaP(n))) continue;
    i++;
    if (uji(n)) return n;
  }
  return null;
}

function fragmen(doc, xml){
  const f = new DOMParser().parseFromString(
    `<x xmlns:w="${NS.w}" xmlns:r="${NS.r}" xmlns:wp="${NS.wp}">${xml}</x>`, 'application/xml');
  if (f.getElementsByTagName('parsererror').length)
    throw new Error('XML sisipan tidak sah: ' + f.getElementsByTagName('parsererror')[0].textContent);
  return [...f.documentElement.childNodes].map(n => doc.importNode(n, true));
}

function sisipSetelah(doc, ref, xml){
  for (const n of fragmen(doc, xml)){ ref.parentNode.insertBefore(n, ref.nextSibling); ref = n; }
  return ref;
}

// Sorot kuning pada run yang sudah ada (isian sampul dan identitas).
// Urutan anak w:rPr diatur skema; highlight sebelum u … oMath.
const SESUDAH_SOROT = ['u', 'effect', 'bdr', 'shd', 'fitText', 'vertAlign', 'rtl', 'cs', 'em',
                       'lang', 'eastAsianLayout', 'specVanish', 'oMath'];
function sorotRun(r){
  const doc = r.ownerDocument;
  let pr = [...r.children].find(n => n.localName === 'rPr');
  if (!pr){ pr = doc.createElementNS(NS.w, 'w:rPr'); r.insertBefore(pr, r.firstChild); }
  if ([...pr.children].some(n => n.localName === 'highlight')) return;
  const h = doc.createElementNS(NS.w, 'w:highlight');
  h.setAttributeNS(NS.w, 'w:val', 'yellow');
  pr.insertBefore(h, [...pr.children].find(n => SESUDAH_SOROT.includes(n.localName)) || null);
}

function gantiTeksParagraf(p, isi){
  const ts = [...p.getElementsByTagNameNS(NS.w, 't')];
  if (!ts.length) return;
  ts.forEach((t, i) => { t.textContent = i ? '' : isi; });
  sorotRun(ts[0].parentNode);
}

function isiSampul(doc, C){
  const semua = [...doc.getElementsByTagNameNS(NS.w, 'p')];
  const prodi = C.D.prodi || '', pt = C.D.institusi || '';
  for (const p of semua){
    const n = norm(teks(p));
    if (prodi && n === 'program dan nama program studi')
      gantiTeksParagraf(p, `PROGRAM SARJANA ${prodi.toUpperCase()}`);
    else if (pt && n.startsWith('universitas/institut/'))
      gantiTeksParagraf(p, pt.toUpperCase());
    else if (/^tahun \.{3,}/.test(n))
      gantiTeksParagraf(p, `TAHUN ${new Date().getFullYear()}`);
  }
  // Identitas pengusul: hanya fakta yang ada di data.json.
  const isian = [['Perguruan Tinggi', pt], ['Jenis Program', 'Sarjana'], ['Nama Program Studi', prodi]];
  // Template sendiri: tabel label | : | nilai.
  const barisTabel = [...doc.getElementsByTagNameNS(NS.w, 'tr')];
  for (const [label, nilai] of isian){
    if (!nilai) continue;
    const tr = barisTabel.find(r => {
      const tc = r.getElementsByTagNameNS(NS.w, 'tc');
      return tc.length === 3 && teks(tc[0]).trim() === label;
    });
    if (tr){
      const p = tr.getElementsByTagNameNS(NS.w, 'tc')[2].getElementsByTagNameNS(NS.w, 'p')[0];
      const rr = doc.createElementNS(NS.w, 'w:r'), t = doc.createElementNS(NS.w, 'w:t');
      t.textContent = nilai; rr.appendChild(t); p.appendChild(rr); sorotRun(rr);
      continue;
    }
    // Template LAM lama: "Perguruan Tinggi : ......"
    const p = semua.find(p => teks(p).startsWith(label) && /\.{5,}/.test(teks(p)));
    const t = p && [...p.getElementsByTagNameNS(NS.w, 't')].find(t => /\.{5,}/.test(t.textContent));
    if (!t) continue;
    t.textContent = t.textContent.replace(/\.{5,}/, nilai);
    sorotRun(t.parentNode);
  }
}

function ukuranPng(buf){
  const dv = new DataView(buf);
  return { w: dv.getUint32(16), h: dv.getUint32(20) };
}

// ---------------------------------------------------------------------
//  Utama
// ---------------------------------------------------------------------
export async function buatLED(C, opsi = {}){
  const { default: JSZip } = await import(JSZIP);
  const [tR, lR] = await Promise.all([fetch(TEMPLATE, { cache: 'no-cache' }), fetch(LOGO)]);
  if (!tR.ok) throw new Error(`${TEMPLATE} tidak terbaca (HTTP ${tR.status})`);
  const zip = await JSZip.loadAsync(await tR.arrayBuffer());
  const doc = new DOMParser().parseFromString(
    await zip.file('word/document.xml').async('string'), 'application/xml');
  const relsPath = 'word/_rels/document.xml.rels';
  const rels = new DOMParser().parseFromString(await zip.file(relsPath).async('string'), 'application/xml');
  if (doc.getElementsByTagName('parsererror').length || rels.getElementsByTagName('parsererror').length)
    throw new Error('Template LED tidak bisa dibaca sebagai XML.');

  C = { ...C,
    angka: v => C.f2(v).replace('.', ','),
    ta: C.taDari(C.ts), ta2: C.taDari(C.ts - 2),
    P: { ps: `Program Studi ${C.D.prodi || '[isi: nama program studi]'}`,
         pt: C.D.institusi || '[isi: nama perguruan tinggi]' } };
  const P = { daftar: [], link(url){ const id = `rIdLed${this.daftar.length + 1}`;
    this.daftar.push({ id, url }); return id; } };
  const body = doc.getElementsByTagNameNS(NS.w, 'body')[0];

  isiSampul(doc, C);

  // Logo di sampul menggantikan kotak "Logo Perguruan Tinggi".
  let logoOk = false;
  if (lR.ok){
    const buf = await lR.arrayBuffer();
    const kotak = [...body.children].find(n => adalahP(n) && teks(n).includes('Logo Perguruan Tinggi'));
    if (kotak){
      const { w, h } = ukuranPng(buf);
      const [baru] = fragmen(doc, paraLogo(LOGO_LEBAR_EMU, Math.round(LOGO_LEBAR_EMU * h / w)));
      body.replaceChild(baru, kotak);
      zip.file('word/media/logo_uper_led.png', buf);
      logoOk = true;
    }
  }

  // Grafik data dibuat lebih dulu (PNG asinkron), disisipkan oleh blokData.
  C.grafik = {}; C.nomorGambar = 0;
  for (const no of BUTIR_GRAFIK){
    const spec = grafikButir(no, C.D, C.ts);
    if (!spec) continue;
    const { buf, w, h } = await gambarGrafik(spec);
    zip.file(`word/media/led_grafik_${no}.png`, buf);
    C.grafik[no] = { spec, rid: `rIdLedG${no}`, cx: GRAFIK_LEBAR_EMU, cy: Math.round(GRAFIK_LEBAR_EMU * h / w) };
  }

  const gagal = [];
  let kursor = body.firstElementChild;
  for (const s of SLOT){
    const kunci = norm(s.cari);
    const h = cari(kursor, p => norm(teks(p)).startsWith(kunci));
    if (!h){ gagal.push(s.cari); continue; }
    let a = cari(h, p => (s.penanda || PETUNJUK).test(teks(p)), 30);
    if (!a){ gagal.push(`${s.cari} (kalimat petunjuk)`); kursor = h.nextElementSibling; continue; }
    // Petunjuk yang terpecah dua paragraf ("… Doktor Terapan" lalu
    // "/ Program Profesi Insinyur).") dilewati sampai habis, lalu kotak isian.
    while (a.nextElementSibling && adalahP(a.nextElementSibling) &&
           teks(a.nextElementSibling).trim().startsWith('/')) a = a.nextElementSibling;
    while (a.nextElementSibling && adalahKotak(a.nextElementSibling)) a = a.nextElementSibling;
    const xml = s.isi(C, P);
    kursor = (xml ? sisipSetelah(doc, a, xml) : a).nextElementSibling;
  }

  // Catatan draf di halaman pertama.
  const catatan = para(
    run('DRAF OTOMATIS — hapus paragraf ini sebelum dikirim. ', { b: true, warna: 'C00000' }) +
    run(`Dibuat ${new Date().toLocaleString('id-ID')} dari halaman skor (versi ${C.versi}), TS ${C.ta}. ` +
      'Teks bersorot kuning adalah draf yang wajib diperiksa; [isi: …] merah wajib diisi prodi; ' +
      'tabel data, grafik, dan tautan bukti diambil langsung dari sistem; skor penilaian sendiri tidak dimuat (lihat halaman skor). ' +
      'Perbarui daftar isi lewat klik kanan > Update Field.' +
      (gagal.length ? ` Subbagian yang tidak ditemukan di template dan belum terisi: ${gagal.join('; ')}.` : '') +
      (logoOk ? '' : ' Logo belum terpasang.'), { sz: 18 }),
    { kotak: 'FDE9E7', ind: 0 });
  for (const n of fragmen(doc, catatan).reverse()) body.insertBefore(n, body.firstChild);

  // Relasi: tautan luar dan logo.
  const akar = rels.documentElement;
  const tambahRel = (id, type, target, luar) => {
    const e = rels.createElementNS(NS.pr, 'Relationship');
    e.setAttribute('Id', id); e.setAttribute('Type', type); e.setAttribute('Target', target);
    if (luar) e.setAttribute('TargetMode', 'External');
    akar.appendChild(e);
  };
  const RT = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
  P.daftar.forEach(x => tambahRel(x.id, RT + 'hyperlink', x.url, true));
  if (logoOk) tambahRel('rIdLedLogo', RT + 'image', 'media/logo_uper_led.png', false);
  Object.entries(C.grafik).forEach(([no, g]) => tambahRel(g.rid, RT + 'image', `media/led_grafik_${no}.png`, false));

  const ser = new XMLSerializer();
  zip.file('word/document.xml', ser.serializeToString(doc));
  zip.file(relsPath, ser.serializeToString(rels));
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

  const tgl = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const nama = `LED-draf-${(C.D.prodi || 'prodi').replace(/\s+/g, '-')}-TS${C.ts}-${tgl}.docx`;
  if (opsi.unduh === false) return { nama, gagal, logoOk, blob };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = nama;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  return { nama, gagal, logoOk };
}
