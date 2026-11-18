// Ekspor RPS K26 ke Word (.docx), tata letak mengikuti Formulir RPS K26 UP-SPMI/FR008/R05 (pemilik 2026-11-18):
// A4 lanskap, enam bagian A-F, lebar kolom dan warna judul tabel seperti formulir. Dibuat oleh situs sendiri (bukan
// menyalin berkas formulir); logo di header = site/logo-uper.png. Masukan = modelRps (rps.js).
// Tanpa DOM: dokumenRps menghasilkan XML; buatRpsDocx menerima JSZip (peramban: CDN; Node: tools/node_modules) dan logo.

const xe = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const HURUF = 'Times New Roman';
const BIRU_TUA = '001F5F', BIRU_JUDUL = '1F3863', BIRU = '006FC0', BIRU_MUDA = 'E0EBF7', BIRU_PUCAT = 'DCE6F0', ABU = 'F1F1F1';
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const tanggalPanjang = iso => { const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? `${+m[3]} ${BULAN[+m[2] - 1]} ${m[1]}` : String(iso || ''); };

const rn = (t, o = {}) => `<w:r><w:rPr><w:rFonts w:ascii="${HURUF}" w:hAnsi="${HURUF}" w:cs="${HURUF}"/>${o.b ? '<w:b/>' : ''}${o.i ? '<w:i/>' : ''}${
  o.warna ? `<w:color w:val="${o.warna}"/>` : ''}<w:sz w:val="${o.sz || 20}"/><w:szCs w:val="${o.sz || 20}"/></w:rPr><w:t xml:space="preserve">${xe(t)}</w:t></w:r>`;
const pg = (isi, o = {}) => `<w:p><w:pPr>${o.keep ? '<w:keepNext/>' : ''}<w:spacing w:before="${o.before ?? 0}" w:after="${o.after ?? 0}"/>${
  o.jc ? `<w:jc w:val="${o.jc}"/>` : ''}</w:pPr>${isi}</w:p>`;
/** Teks sel: baris baru = paragraf baru. */
const paragraf = (t, o) => String(t ?? '').split(/\r?\n/).map(b => pg(rn(b, o), o)).join('');

/**
 * Sel tabel. isi: teks atau XML siap pakai ({xml}); o: span (gridSpan), vm ('restart'|'lanjut'), fill, warna, b, i, sz, jc.
 * Lebar sel dihitung tabelK dari lebar kolom grid.
 */
export const sel = (isi = '', o = {}) => ({ isi, ...o });
const judulSel = (isi, fill = BIRU_TUA, o = {}) => sel(isi, { fill, warna: 'FFFFFF', b: true, jc: 'center', ...o });

/** Tabel dengan lebar kolom tetap (twip). baris: [{sel...}] atau {sel: [...], tinggi, kepala}. */
export function tabelK(lebar, baris){
  const garis = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(s => `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="000000"/>`).join('');
  const total = lebar.reduce((a, b) => a + b, 0);
  const rows = baris.map(r => {
    const cells = Array.isArray(r) ? r : r.sel;
    let k = 0;
    const tcs = cells.map(c => {
      const span = c.span || 1, w = lebar.slice(k, k + span).reduce((a, b) => a + b, 0); k += span;
      const isi = c.vm === 'lanjut' ? pg('') : (typeof c.isi === 'object' && c.isi?.xml ? c.isi.xml : paragraf(c.isi, c));
      return `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${span > 1 ? `<w:gridSpan w:val="${span}"/>` : ''}${
        c.vm ? `<w:vMerge${c.vm === 'restart' ? ' w:val="restart"' : ''}/>` : ''}${c.fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${c.fill}"/>` : ''}<w:vAlign w:val="${c.va || 'top'}"/></w:tcPr>${isi}</w:tc>`;
    }).join('');
    const pr = !Array.isArray(r) && (r.tinggi || r.kepala) ? `<w:trPr>${r.kepala ? '<w:tblHeader/>' : ''}${r.tinggi ? `<w:trHeight w:val="${r.tinggi}"/>` : ''}</w:trPr>` : '';
    return `<w:tr>${pr}${tcs}</w:tr>`;
  }).join('');
  return `<w:tbl><w:tblPr><w:tblW w:w="${total}" w:type="dxa"/><w:tblBorders>${garis}</w:tblBorders><w:tblLayout w:type="fixed"/>` +
    `<w:tblCellMar><w:left w:w="70" w:type="dxa"/><w:right w:w="70" w:type="dxa"/></w:tblCellMar></w:tblPr>` +
    `<w:tblGrid>${lebar.map(x => `<w:gridCol w:w="${x}"/>`).join('')}</w:tblGrid>${rows}</w:tbl>`;
}

const judulBagian = t => pg(rn(t, { b: true, sz: 24, warna: BIRU_JUDUL }), { before: 240, after: 120, keep: true });
const kodeCpl = k => (/^cpl/i.test(String(k)) ? String(k) : `CPL-${k}`);
const ya = v => (v === true ? 'Ada' : v === false ? 'Tidak ada' : '');

/** Isi <w:body> RPS dari modelRps (tanpa sectPr). */
export function dokumenRps(M){
  const I = M.identitas || {}, sks = I.sks || {};
  const out = [];
  // A. Identitas dan pengesahan (lebar kolom formulir).
  out.push(judulBagian('Identitas Mata Kuliah dan Lembar Pengesahan'));
  out.push(tabelK([3640, 1382, 2289, 916, 916, 921, 916, 1410, 1644], [
    { kepala: true, sel: [judulSel('NAMA MATA KULIAH (MK)'), judulSel('KODE'), judulSel('JENIS MK'), judulSel('BOBOT (sks)', BIRU_TUA, { span: 4 }),
      judulSel('SEMESTER'), judulSel('TGL PENYUSUNAN')] },
    [sel(M.mk.nama, { b: true }), sel(M.mk.kode, { jc: 'center' }), sel(I.jenis_mk, { jc: 'center' }), sel(`T=${sks.t ?? 0}`, { jc: 'center' }),
     sel(`P=${sks.p ?? 0}`, { jc: 'center' }), sel(`PL=${sks.pl ?? 0}`, { jc: 'center' }), sel(`S=${sks.s ?? 0}`, { jc: 'center' }),
     sel(I.semester, { jc: 'center' }), sel(tanggalPanjang(I.tanggal), { jc: 'center' })],
    [judulSel('PENYELENGGARA'), judulSel('PENGESAHAN', BIRU_TUA, { span: 8 })],
    [sel(I.penyelenggara, { vm: 'restart', va: 'center', jc: 'center' }), sel('DISIAPKAN OLEH DOSEN PENGEMBANG RPS', { span: 2, fill: BIRU_PUCAT, b: true, jc: 'center' }),
     sel('DIPERIKSA OLEH KETUA PROGRAM STUDI', { span: 4, fill: BIRU_PUCAT, b: true, jc: 'center' }),
     sel('DISETUJUI/DITETAPKAN OLEH DEKAN', { span: 2, fill: BIRU_PUCAT, b: true, jc: 'center' })],
    { tinggi: 1100, sel: [sel('', { vm: 'lanjut' }), sel('', { span: 2 }), sel('', { span: 4 }), sel('', { span: 2 })] },
    [sel('', { vm: 'lanjut' }), sel(M.pengembang.nama || 'Nama dan Gelar', { span: 2, jc: 'center', b: true }),
     sel(M.kaprodi.nama || 'Nama dan Gelar', { span: 4, jc: 'center', b: true }), sel('Nama dan Gelar', { span: 2, jc: 'center', b: true })],
    [sel('', { vm: 'lanjut' }), sel(`NIP ${M.pengembang.nip}`.trim(), { span: 2, jc: 'center' }), sel(`NIP ${M.kaprodi.nip}`.trim(), { span: 4, jc: 'center' }),
     sel('NIP', { span: 2, jc: 'center' })],
  ]));
  // B. Capaian pembelajaran.
  out.push(judulBagian('Capaian Pembelajaran'));
  out.push(tabelK([2205, 11829], [
    [judulSel('CPL YANG DIBEBANKAN PADA MK', BIRU_JUDUL, { span: 2 })],
    ...(M.cpl.length ? M.cpl.map(c => [sel(kodeCpl(c.kode), { fill: BIRU_MUDA, b: true }), sel(c.rumusan, { fill: BIRU_MUDA })]) : [[sel('—', { span: 2 })]]),
    [judulSel('CAPAIAN PEMBELAJARAN MATA KULIAH (CPMK)', BIRU_JUDUL, { span: 2 })],
    ...(M.cpmk.length ? M.cpmk.map(c => [sel(c.kode, { b: true }), sel(c.rumusan)]) : [[sel('—', { span: 2 })]]),
  ]));
  out.push(pg('', { after: 120 }));
  const k = Math.max(1, M.kolom.length), area = 5103, wA = Math.floor(area / k);
  const lebarB = [1057, 1195, 1103, 4442, ...Array.from({ length: k }, (_, i) => (i === k - 1 ? area - wA * (k - 1) : wA)), 1134];
  const kolom = M.kolom.length ? M.kolom : [{ jenis: '', label: '—', total: 0 }];
  const target = M.hots.target != null ? ` (target disarankan tahun ke-${M.hots.tahun}: ${M.hots.tahun === 1 ? '0%' : '≥ ' + M.hots.target + '%'})` : '';
  out.push(tabelK(lebarB, [
    [judulSel('SUB-CPMK DAN PEMETAAN KORELASI CAPAIAN PEMBELAJARAN', BIRU_TUA, { span: lebarB.length })],
    { kepala: true, sel: [judulSel('CPL', BIRU, { vm: 'restart' }), judulSel('CPMK', BIRU, { vm: 'restart' }), judulSel('Sub-CPMK', BIRU, { vm: 'restart' }),
      judulSel('Deskripsi Sub-CPMK (Formula ABCD)', BIRU, { vm: 'restart' }), judulSel('Rencana Asesmen Sumatif', BIRU, { span: k }),
      judulSel('Bobot Penilaian (%)', BIRU, { vm: 'restart' })] },
    { kepala: true, sel: [sel('', { vm: 'lanjut', fill: BIRU }), sel('', { vm: 'lanjut', fill: BIRU }), sel('', { vm: 'lanjut', fill: BIRU }), sel('', { vm: 'lanjut', fill: BIRU }),
      ...kolom.map(c => judulSel(c.label, BIRU)), sel('', { vm: 'lanjut', fill: BIRU })] },
    ...M.sub.map(x => [sel(x.cpl ? kodeCpl(x.cpl) : ''), sel(x.cpmk), sel(x.kode), sel(x.rumusan),
      ...kolom.map(c => sel((x.asesmen[c.jenis] || []).join('\n'), { jc: 'center' })), sel(`${x.bobot}%`, { jc: 'center' })]),
    [sel(`TOTAL BOBOT PENILAIAN · HOTS = ${M.hots.persen}%${target}${M.hots.sub.length ? `; Sub-CPMK HOTS: ${M.hots.sub.join(', ')}` : ''}`, { span: 4, b: true }),
     ...kolom.map(c => sel(`${c.total}%`, { jc: 'center', b: true })), sel(`${M.total}%`, { jc: 'center', b: true })],
    [judulSel('Peta Analisis Capaian Pembelajaran', BIRU_PUCAT, { span: lebarB.length, warna: '000000' })],
    { tinggi: 900, sel: [sel('(Peta digambar otomatis dari hubungan antar-Sub-CPMK pada tahap berikutnya.)', { span: lebarB.length, i: true, jc: 'center', va: 'center' })] },
  ]));
  // C. Tujuan dan deskripsi.
  out.push(judulBagian('Tujuan dan Deskripsi Mata Kuliah'));
  const lbl = t => sel(t, { fill: BIRU_MUDA, b: true });
  const pustaka = M.pustaka.map(p => (p.kode ? `${p.kode}: ${p.teks}` : p.teks)).join('\n');
  const sy = M.syarat || {};
  out.push(tabelK([1560, 4819, 1701, 5954], [
    [judulSel('TUJUAN DAN DESKRIPSI', BIRU_TUA, { span: 4 })],
    [sel('Tujuan MK', { vm: 'restart', fill: BIRU_MUDA, b: true }), sel(M.tujuan, { vm: 'restart' }), lbl('Dosen Pengampu'), sel(M.pengampu)],
    [sel('', { vm: 'lanjut', fill: BIRU_MUDA }), sel('', { vm: 'lanjut' }), lbl('Mata Kuliah Syarat'), sel(`Prasyarat: ${sy.prasyarat || '-'}\nBersamaan: ${sy.bersamaan || '-'}`)],
    [sel('Deskripsi dan Bahan Kajian', { vm: 'restart', fill: BIRU_MUDA, b: true }), sel(M.deskripsi, { vm: 'restart' }), lbl('Integrasi Penelitian/PkM'),
     sel([ya(M.integrasi.ada), M.integrasi.teks].filter(Boolean).join(' - '))],
    [sel('', { vm: 'lanjut', fill: BIRU_MUDA }), sel('', { vm: 'lanjut' }), lbl('Kriteria Ketercapaian CPMK'), sel(M.kriteria)],
    [sel('Pustaka', { vm: 'restart', fill: BIRU_MUDA, b: true }), sel(pustaka, { vm: 'restart' }), lbl('Metode SCL'), sel([ya(M.scl.ada), M.scl.teks].filter(Boolean).join(' - '))],
    [sel('', { vm: 'lanjut', fill: BIRU_MUDA }), sel('', { vm: 'lanjut' }), lbl('Direktori Kompetensi Teknis Pertamina'),
     sel([{ ada: 'Ada', tidak_langsung: 'Pendukung tidak langsung', tidak_tersedia: 'Tidak tersedia' }[M.direktori.status] || '', M.direktori.teks].filter(Boolean).join(' - '))],
  ]));
  // D. Rencana pembelajaran.
  out.push(judulBagian('Rencana Pembelajaran'));
  const lebarD = [851, 1134, 2835, 2268, 2268, 2410, 2268];
  out.push(tabelK(lebarD, [
    { kepala: true, sel: [judulSel('Pekan ke-', BIRU_JUDUL, { vm: 'restart' }), judulSel('Sub-CPMK', BIRU_JUDUL, { vm: 'restart' }),
      judulSel('Materi Pembelajaran [Pustaka]', BIRU_JUDUL, { vm: 'restart' }), judulSel('Asesmen', BIRU_JUDUL, { span: 2 }),
      judulSel('Bentuk, Modalitas Pembelajaran, dan Penugasan Mahasiswa [Estimasi Waktu]', BIRU_JUDUL, { span: 2 })] },
    { kepala: true, sel: [sel('', { vm: 'lanjut', fill: BIRU_JUDUL }), sel('', { vm: 'lanjut', fill: BIRU_JUDUL }), sel('', { vm: 'lanjut', fill: BIRU_JUDUL }),
      judulSel('Indikator', BIRU_JUDUL), judulSel('Bentuk & Kriteria', BIRU_JUDUL), judulSel('Luring', BIRU_JUDUL), judulSel('Daring', BIRU_JUDUL)] },
    lebarD.map((_, i) => sel(`[${i + 1}]`, { fill: ABU, jc: 'center' })),
    ...M.pekan.map(p => (p.jenis === 'uts' || p.jenis === 'uas')
      ? [sel(p.pekan, { jc: 'center', b: true, fill: ABU }), sel(p.jenis === 'uts' ? 'Ujian Tengah Semester (UTS)' : 'Ujian Akhir Semester (UAS)', { span: 6, b: true, jc: 'center', fill: ABU })]
      : [sel(p.pekan, { jc: 'center' }), sel((p.sub || []).join('\n')), sel([p.materi, p.pustaka ? `[Pustaka: ${p.pustaka}]` : ''].filter(Boolean).join('\n')),
         sel(p.indikator), sel([p.bentuk, (p.asesmen || []).length ? `Sumatif: ${p.asesmen.join(', ')}` : ''].filter(Boolean).join('\n')), sel(p.luring), sel(p.daring)]),
  ]));
  // E. Evaluasi penyelenggaraan sebelumnya.
  out.push(judulBagian('Evaluasi Pelaksanaan Mata Kuliah pada Penyelenggaraan Sebelumnya'));
  const E = M.evaluasi || {}, belum = 'belum pernah diselenggarakan';
  out.push(tabelK([3678, 2002, 2552, 3685, 1921], [
    [judulSel('NAMA MATA KULIAH'), judulSel('KODE'), judulSel('Semester/Tahun Akademik'), judulSel('Jumlah Mahasiswa dan Persentase Lulus'), judulSel('Rerata Nilai Akhir')],
    E.baru ? [sel(belum), sel(belum), sel(belum), sel(belum), sel(belum)]
      : [sel(E.mk || M.mk.nama), sel(E.kode || M.mk.kode), sel(E.semester), sel(E.jumlah), sel(E.rerata)],
    [sel('Rekomendasi/Tindak Lanjut dari Portofolio Sebelumnya', { fill: BIRU_PUCAT, b: true }), sel(E.baru ? belum : E.rekomendasi, { span: 4 })],
  ]));
  // F. Daftar revisi (tahap 2: otomatis dari pengesahan Kaprodi).
  out.push(judulBagian('Daftar Revisi RPS'));
  out.push(tabelK([1004, 1599, 2339, 4111, 2268, 2491], [
    [judulSel('No. Revisi', BIRU_JUDUL), judulSel('Tanggal Revisi', BIRU_JUDUL), judulSel('Pengusul Revisi', BIRU_JUDUL),
     judulSel('Deskripsi Penambahan/Pengurangan/Perubahan RPS', BIRU_JUDUL), judulSel('Tanggal/Paraf Validasi Program Studi', BIRU_JUDUL),
     judulSel('Catatan Validator Program Studi', BIRU_JUDUL)],
    ...((M.revisi || []).length ? M.revisi.map((r, i) => [sel(String(i + 1), { jc: 'center' }), sel(tanggalPanjang(r.tanggal)), sel(r.pengusul), sel(r.deskripsi),
      sel(tanggalPanjang(r.validasi)), sel(r.catatan)])
      : [[sel('1', { jc: 'center' }), sel('-'), sel('-'), sel('Belum ada revisi'), sel('-'), sel('-')]]),
  ]));
  return out.join('');
}

// Header: logo | judul | kode formulir. Logo 1,9 x 1,4 cm (EMU).
const CX = 684000, CY = 496000;
function header(adaLogo){
  const logo = adaLogo ? `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${CX}" cy="${CY}"/><wp:docPr id="1" name="Logo"/>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="logo.png"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="rIdLogo"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${CX}" cy="${CY}"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>` : '';
  const isi = tabelK([2200, 9634, 2200], [[sel({ xml: pg(logo, { jc: 'center' }) }, { va: 'center' }),
    sel('RENCANA PEMBELAJARAN SEMESTER', { b: true, sz: 28, jc: 'center', va: 'center' }), sel('UP-SPMI/FR008/R05', { b: true, jc: 'center', va: 'center' })]]);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">${isi}${pg('')}</w:hdr>`;
}

/**
 * Berkas .docx. opsi: { JSZip (kelas), logo (ArrayBuffer/Uint8Array PNG atau null), type ('blob' di peramban, 'nodebuffer' di Node) }.
 */
export async function buatRpsDocx(M, { JSZip, logo = null, type = 'blob' } = {}){
  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Default Extension="png" ContentType="image/png"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
</Types>`);
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rIdH1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>
</Relationships>`);
  zip.file('word/header1.xml', header(!!logo));
  if (logo) {
    zip.file('word/media/logo.png', logo);
    zip.file('word/_rels/header1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.png"/>
</Relationships>`);
  }
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>${dokumenRps(M)}<w:sectPr><w:headerReference w:type="default" r:id="rIdH1"/><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>` +
`<w:pgMar w:top="1440" w:right="1402" w:bottom="1440" w:left="1402" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`);
  return zip.generateAsync({ type, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}
