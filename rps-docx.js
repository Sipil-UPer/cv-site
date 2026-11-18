// Ekspor RPS K26 ke Word (.docx), tata letak mengikuti Formulir RPS K26 UP-SPMI/FR008/R05 (pemilik 2026-11-18):
// A4 lanskap, enam bagian A-F, lebar kolom dan warna judul tabel seperti formulir. Dibuat oleh situs sendiri (bukan
// menyalin berkas formulir); logo di header = site/logo-uper.png. Masukan = modelRps (rps.js).
// Tanpa DOM: dokumenRps menghasilkan XML; buatRpsDocx menerima JSZip (peramban: CDN; Node: tools/node_modules) dan logo.

const xe = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const HURUF = 'Aptos';   // formulir K26: Aptos 9 pt di tabel, judul bagian Aptos 14 pt tebal (dibaca dari berkas formulir 2026-11-18)
const BIRU_TUA = '001F5F', BIRU_JUDUL = '1F3863', BIRU = '006FC0', BIRU_MUDA = 'E0EBF7', BIRU_PUCAT = 'DCE6F0', ABU = 'F1F1F1';
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const tanggalPanjang = iso => { const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? `${+m[3]} ${BULAN[+m[2] - 1]} ${m[1]}` : String(iso || ''); };

const rn = (t, o = {}) => `<w:r><w:rPr><w:rFonts w:ascii="${HURUF}" w:hAnsi="${HURUF}" w:cs="${HURUF}"/>${o.b ? '<w:b/>' : ''}${o.i ? '<w:i/>' : ''}${
  o.warna ? `<w:color w:val="${o.warna}"/>` : ''}<w:sz w:val="${o.sz || 18}"/><w:szCs w:val="${o.sz || 18}"/></w:rPr><w:t xml:space="preserve">${xe(t)}</w:t></w:r>`;
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

// Judul bagian A-F seperti gaya Heading1 formulir: "A." + tab, indentasi menggantung 357, Aptos 14 pt tebal biru tua.
const judulBagian = (huruf, t) => `<w:p><w:pPr><w:keepNext/><w:tabs><w:tab w:val="left" w:pos="357"/></w:tabs><w:spacing w:before="240" w:after="120"/>` +
  `<w:ind w:left="357" w:hanging="357"/><w:outlineLvl w:val="0"/></w:pPr>${rn(`${huruf}.`, { b: true, sz: 28, warna: BIRU_JUDUL })}` +
  `<w:r><w:rPr><w:sz w:val="28"/></w:rPr><w:tab/></w:r>${rn(t, { b: true, sz: 28, warna: BIRU_JUDUL })}</w:p>`;
// Gambar sebaris (logo di header, Peta Analisis di tabel B). cx/cy dalam EMU.
const gambarXml = (rid, cx, cy, id, nama) => `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/>` +
  `<wp:docPr id="${id}" name="${nama}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
  `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
  `<pic:nvPicPr><pic:cNvPr id="${id}" name="${nama}.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
  `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
/** Ukuran peta (px, 96 dpi) -> EMU, diperkecil agar muat lebar tabel (13 800 twip) dan tinggi ~12 cm. */
export function ukuranPeta(w, h){
  const px = 9525, maksW = 13800 * 635, maksH = 4320000;
  const k = Math.min(1, maksW / (w * px), maksH / (h * px));
  return { cx: Math.round(w * px * k), cy: Math.round(h * px * k) };
}
const kodeCpl = k => (/^cpl/i.test(String(k)) ? String(k) : `CPL-${k}`);
const ya = v => (v === true ? 'Ada' : v === false ? 'Tidak ada' : '');

/** Isi <w:body> RPS dari modelRps (tanpa sectPr). o.peta = {w, h} (px) bila gambar Peta Analisis disertakan (rIdPeta). */
export function dokumenRps(M, o = {}){
  const I = M.identitas || {}, sks = I.sks || {};
  const out = [];
  // A. Identitas dan pengesahan (lebar kolom formulir).
  out.push(judulBagian('A', 'Identitas Mata Kuliah dan Lembar Pengesahan'));
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
  // 114 (pemilik 2026-11-19): Kaprodi pemeriksa sekaligus penyusun RPS -> boleh, ditandai.
  if (M.kaprodi_penyusun) out.push(pg(rn('Catatan: Ketua Program Studi yang memeriksa juga penyusun RPS ini (koordinator/pengampu mata kuliah); '
    + 'ditandai oleh sistem.', { i: true, sz: 16 }), { before: 40, after: 60 }));
  // B. Capaian pembelajaran.
  out.push(judulBagian('B', 'Capaian Pembelajaran'));
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
    o.peta ? [sel({ xml: pg(gambarXml('rIdPeta', ukuranPeta(o.peta.w, o.peta.h).cx, ukuranPeta(o.peta.w, o.peta.h).cy, 2, 'Peta'), { jc: 'center', before: 60, after: 60 }) },
                  { span: lebarB.length })]
      : { tinggi: 900, sel: [sel('(Peta Analisis belum tersedia: isi hubungan antar-Sub-CPMK di halaman RPS.)', { span: lebarB.length, i: true, jc: 'center', va: 'center' })] },
  ]));
  // C. Tujuan dan deskripsi.
  out.push(judulBagian('C', 'Tujuan dan Deskripsi Mata Kuliah'));
  const lbl = t => sel(t, { fill: BIRU_MUDA, b: true });
  const pustaka = M.pustaka.map(p => (p.kode ? `${p.kode}: ${p.teks}` : p.teks)).join('\n');
  const sy = M.syarat || {};
  out.push(tabelK([1560, 4819, 1701, 5954], [
    [judulSel('TUJUAN DAN DESKRIPSI', BIRU_TUA, { span: 4 })],
    [sel('Tujuan MK', { vm: 'restart', fill: BIRU_MUDA, b: true }), sel(M.tujuan, { vm: 'restart' }), lbl('Dosen Pengampu'), sel(M.pengampu)],
    [sel('', { vm: 'lanjut', fill: BIRU_MUDA }), sel('', { vm: 'lanjut' }), lbl('Mata Kuliah Syarat'), sel(`Prasyarat: ${sy.prasyarat || '-'}\nBersamaan: ${sy.bersamaan || '-'}`)],
    [sel('Deskripsi dan Bahan Kajian', { vm: 'restart', fill: BIRU_MUDA, b: true }), sel(M.deskripsi, { vm: 'restart' }), lbl('Integrasi Penelitian/PkM'),
     sel([ya(M.integrasi.ada), M.integrasi_teks ?? M.integrasi.teks].filter(Boolean).join(' - '))],
    [sel('', { vm: 'lanjut', fill: BIRU_MUDA }), sel('', { vm: 'lanjut' }), lbl('Kriteria Ketercapaian CPMK'), sel(M.kriteria)],
    [sel('Pustaka', { vm: 'restart', fill: BIRU_MUDA, b: true }), sel(pustaka, { vm: 'restart' }), lbl('Metode SCL'), sel([ya(M.scl.ada), M.scl.teks].filter(Boolean).join(' - '))],
    [sel('', { vm: 'lanjut', fill: BIRU_MUDA }), sel('', { vm: 'lanjut' }), lbl('Direktori Kompetensi Teknis Pertamina'),
     sel([{ ada: 'Ada', tidak_langsung: 'Pendukung tidak langsung', tidak_tersedia: 'Tidak tersedia' }[M.direktori.status] || '', M.direktori.teks].filter(Boolean).join(' - '))],
  ]));
  // D. Rencana pembelajaran.
  out.push(judulBagian('D', 'Rencana Pembelajaran'));
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
  out.push(judulBagian('E', 'EVALUASI PELAKSANAAN MATA KULIAH PADA PENYELENGGARAAN SEBELUMNYA'));
  const E = M.evaluasi || {}, belum = 'belum pernah diselenggarakan';
  out.push(tabelK([3678, 2002, 2552, 3685, 1921], [
    [judulSel('NAMA MATA KULIAH'), judulSel('KODE'), judulSel('Semester/Tahun Akademik'), judulSel('Jumlah Mahasiswa dan Persentase Lulus'), judulSel('Rerata Nilai Akhir')],
    E.baru ? [sel(belum), sel(belum), sel(belum), sel(belum), sel(belum)]
      : [sel(E.mk || M.mk.nama), sel(E.kode || M.mk.kode), sel(E.semester), sel(E.jumlah), sel(E.rerata)],
    [sel('Rekomendasi/Tindak Lanjut dari Portofolio Sebelumnya', { fill: BIRU_PUCAT, b: true }), sel(E.baru ? belum : E.rekomendasi, { span: 4 })],
  ]));
  // F. Daftar revisi (tahap 2: otomatis dari pengesahan Kaprodi).
  out.push(judulBagian('F', 'Daftar Revisi RPS'));
  out.push(tabelK([1004, 1599, 2339, 4111, 2268, 2491], [
    [judulSel('No. Revisi', BIRU_JUDUL), judulSel('Tanggal Revisi', BIRU_JUDUL), judulSel('Pengusul Revisi', BIRU_JUDUL),
     judulSel('Deskripsi Penambahan/Pengurangan/Perubahan RPS', BIRU_JUDUL), judulSel('Tanggal/Paraf Validasi Program Studi', BIRU_JUDUL),
     judulSel('Catatan Validator Program Studi', BIRU_JUDUL)],
    ...((M.revisi || []).length ? M.revisi.map((r, i) => [sel(String(i + 1), { jc: 'center' }), sel(tanggalPanjang(r.tanggal)), sel(r.pengusul), sel(r.deskripsi),
      sel(tanggalPanjang(r.validasi)), sel(r.catatan)])
      : [[sel('1', { jc: 'center' }), sel('-'), sel('-'), sel('Belum ada revisi'), sel('-'), sel('-')]]),
  ]));
  if (M.rekap) out.push(lampiranRekap(M.rekap));
  return out.join('');
}

// Lampiran rekap untuk akreditasi (pemilik 2026-11-19): di bawah bagian F, bukan bagian formulir.
// Angka lampiran: dua desimal, koma (pemilik 2026-11-19, sama dengan Simulasi PJP); teks dibiarkan.
const koma = v => (v == null || v === '' ? '' : Number.isFinite(+v) ? (+v).toFixed(2).replace('.', ',') : String(v));
export function lampiranRekap(X){
  const out = [pg(rn('Lampiran: Rekapitulasi Beban Belajar, Bentuk Pembelajaran, dan Penilaian', { b: true, sz: 28, warna: BIRU_JUDUL }),
    { before: 360, after: 60, keep: true }),
    pg(rn('Untuk keperluan akreditasi (tabel kurikulum LKPS: bobot kredit per bentuk pembelajaran dan konversi kredit ke jam). Dihitung otomatis dari isian RPS.',
      { i: true }), { after: 120 })];
  const B = X.beban;
  out.push(pg(rn('1. Beban belajar per bentuk pembelajaran', { b: true, sz: 20 }), { before: 120, after: 60, keep: true }));
  out.push(tabelK([3300, 900, 3134, 1500, 1500, 1500, 1200, 1000], [
    { kepala: true, sel: ['Bentuk pembelajaran', 'sks', 'Per pekan', 'Tatap muka / PB (jam)', 'Penugasan terstruktur / PT (jam)', 'Belajar mandiri / KM (jam)',
      'Kegiatan praktikum/ lapangan/ simulasi (jam)', 'Jumlah (jam/ semester)'].map(t => judulSel(t, BIRU_JUDUL)) },
    ...B.baris.map(r => [sel(r.bentuk), sel(koma(r.sks), { jc: 'center' }), sel(r.menit, { jc: 'center' }), sel(koma(r.pb), { jc: 'center' }),
      sel(koma(r.pt), { jc: 'center' }), sel(koma(r.km), { jc: 'center' }), sel(koma(r.kegiatan), { jc: 'center' }), sel(koma(r.jam), { jc: 'center' })]),
    [sel('Jumlah', { b: true, fill: BIRU_MUDA }), ...[B.jumlah.sks, '', B.jumlah.pb, B.jumlah.pt, B.jumlah.km, B.jumlah.kegiatan, B.jumlah.jam]
      .map(v => sel(koma(v), { b: true, jc: 'center', fill: BIRU_MUDA }))],
  ]));
  const J = X.butir18;
  if (J) out.push(tabelK([9034, 5000], [
    [sel('Butir 18 LAM Teknik (Tabel 3.a.1 LKPS): sks praktikum/praktik lapangan/penugasan', { b: true, fill: BIRU_MUDA }),
     sel(`${koma(J.sks_praktik)} dari ${koma(J.sks)} sks`, { b: true, jc: 'center', fill: BIRU_MUDA })],
    [sel('JP = sks praktikum/praktik × 50 menit;  JB = sks × 50 menit'), sel(`JP ${J.jp_menit}′ ; JB ${J.jb_menit}′ ; JP/JB = ${koma(J.persen)}%`, { jc: 'center' })],
  ]));
  out.push(pg(rn('1 sks = 45 jam per semester (Panduan Pengisian RPS). Kuliah/responsi/tutorial: 50′ proses belajar (PB), 60′ penugasan terstruktur (PT), '
    + '60′ kegiatan mandiri (KM) per pekan per sks; praktikum, praktik lapangan, dan simulasi: kegiatan 170′ per pekan per sks, tidak dibagi PB/PT/KM. '
    + 'Butir 18 hanya menghitung sks praktikum/praktik lapangan/penugasan (P+PL+S); penugasan terstruktur (PT) di dalam sks kuliah tidak dihitung.', { i: true, sz: 16 }),
    { before: 40, after: 120 }));
  const baris = xs => xs.map(x => [sel(x.label), sel(x.pekan), sel(String(x.jumlah), { jc: 'center' })]);
  out.push(pg(rn('2. Bentuk pembelajaran dan metode SCL dalam rencana pekanan', { b: true, sz: 20 }), { before: 120, after: 60, keep: true }));
  out.push(tabelK([4300, 7234, 2500], [
    { kepala: true, sel: [judulSel('Bentuk/metode', BIRU_JUDUL), judulSel('Pekan', BIRU_JUDUL), judulSel('Jumlah pekan', BIRU_JUDUL)] },
    [sel('Bentuk pembelajaran', { span: 3, b: true, fill: BIRU_MUDA })],
    ...(X.bentuk.length ? baris(X.bentuk) : [[sel('Belum dicentang di rencana pekanan', { span: 3, i: true })]]),
    [sel('Metode pembelajaran berpusat pada mahasiswa (SCL)', { span: 3, b: true, fill: BIRU_MUDA })],
    ...(X.scl.length ? baris(X.scl) : [[sel('Tidak ada', { span: 3, i: true })]]),
    [sel('Ujian', { span: 3, b: true, fill: BIRU_MUDA })],
    ...X.ujian.map(u => [sel(u.label), sel(u.pekan), sel('1', { jc: 'center' })]),
  ]));
  out.push(pg(rn('3. Penugasan mahasiswa dan asesmen sumatif per pekan', { b: true, sz: 20 }), { before: 240, after: 60, keep: true }));
  out.push(tabelK([1500, 8534, 4000], [
    { kepala: true, sel: [judulSel('Pekan', BIRU_JUDUL), judulSel('Penugasan mahasiswa', BIRU_JUDUL), judulSel('Asesmen sumatif', BIRU_JUDUL)] },
    ...(X.penugasan.length ? X.penugasan.map(t => [sel(t.pekan, { jc: 'center' }), sel(t.penugasan || '-'), sel(t.sumatif || '-')])
      : [[sel('Belum ada penugasan', { span: 3, i: true })]]),
  ]));
  const N = X.penilaian;
  out.push(pg(rn('4. Komposisi penilaian', { b: true, sz: 20 }), { before: 240, after: 60, keep: true }));
  out.push(tabelK([9034, 5000], [
    { kepala: true, sel: [judulSel('Komponen', BIRU_JUDUL), judulSel('Bobot (%)', BIRU_JUDUL)] },
    ...N.jenis.map(j => [sel(j.label), sel(koma(j.persen), { jc: 'center' })]),
    [sel('Jumlah', { b: true, fill: BIRU_MUDA }), sel(koma(N.total), { b: true, jc: 'center', fill: BIRU_MUDA })],
    [sel('Proporsi penilaian HOTS (Sub-CPMK berkode C4-C6)'), sel(koma(N.hots), { jc: 'center' })],
    [sel('Asesmen non-tes (tugas, proyek, laporan, presentasi, dan sejenisnya)'), sel(koma(N.nontes), { jc: 'center' })],
  ]));
  return out.join('');
}

// Header: logo | judul | kode formulir. Logo 1,9 x 1,4 cm (EMU).
const CX = 646430, CY = 469265;   // ukuran logo di header formulir
function header(adaLogo){
  const logo = adaLogo ? gambarXml('rIdLogo', CX, CY, 1, 'Logo') : '';
  const isi = tabelK([1818, 9639, 2471], [[sel({ xml: pg(logo, { jc: 'center' }) }, { va: 'center' }),
    sel('RENCANA PEMBELAJARAN SEMESTER', { b: true, sz: 36, jc: 'center', va: 'center' }), sel('UP-SPMI/FR008/R05', { b: true, jc: 'center', va: 'center' })]]);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">${isi}${pg('')}</w:hdr>`;
}

/**
 * Berkas .docx. opsi: { JSZip (kelas), logo (ArrayBuffer/Uint8Array PNG atau null), peta ({png, w, h} atau null; PNG Peta Analisis,
 * w/h px tampilan), type ('blob' di peramban, 'nodebuffer' di Node) }.
 */
export async function buatRpsDocx(M, { JSZip, logo = null, peta = null, type = 'blob' } = {}){
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
<Relationship Id="rIdH1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>${
  peta ? '\n<Relationship Id="rIdPeta" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/peta.png"/>' : ''}
</Relationships>`);
  if (peta) zip.file('word/media/peta.png', peta.png);
  zip.file('word/header1.xml', header(!!logo));
  if (logo) {
    zip.file('word/media/logo.png', logo);
    zip.file('word/_rels/header1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.png"/>
</Relationships>`);
  }
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
<w:body>${dokumenRps(M, { peta: peta ? { w: peta.w, h: peta.h } : null })}<w:sectPr><w:headerReference w:type="default" r:id="rIdH1"/><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>` +
`<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`);
  return zip.generateAsync({ type, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}
