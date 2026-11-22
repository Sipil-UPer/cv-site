// Berkas review sejawat RPS (Word), bukti tinjauan sejawat untuk akreditasi (119, pemilik 2026-11-19): identitas MK, lalu tiap
// review terkirim: skor per butir, catatan reviewer, tanggapan penyusun, catatan/tanggapan umum, rerata, kesimpulan, waktu
// yang dicatat sistem. Tanpa DOM: modelBerkasReview -> dokumenReview (XML) -> buatReviewDocx (JSZip). A4 tegak.
import { tabelK, sel, tanggalPanjang, rn, pg } from './rps-docx.js?v=2026-11-22-866c27';
import { BUTIR_REVIEW, SKALA_REVIEW, KESIMPULAN_REVIEW, STATUS_TANGGAPAN, rerataReview, sudahDitanggapi } from './rps.js?v=2026-11-22-866c27';

const teks = v => String(v ?? '').trim();
const tgl = v => tanggalPanjang(teks(v).slice(0, 10));
const koma = v => (v == null ? '—' : String(v).replace('.', ','));
const LABEL = (xs, k) => (xs.find(x => String(x[0]) === String(k)) || [, ''])[1];

/**
 * Model berkas. mk = ref_mata_kuliah; rps = baris mk_rps (status, revisi) atau null; review = hasil rps_review_mk (yang terkirim
 * saja dipakai); prodi = nama prodi; pengembang = nama dosen pengembang; kini = tanggal cetak.
 */
export function modelBerkasReview({ mk = {}, rps = null, review = [], prodi = '', pengembang = '', kini = new Date() } = {}){
  const terkirim = review.filter(v => v.kirim_pada);
  return {
    judul: 'LEMBAR REVIEW SEJAWAT RENCANA PEMBELAJARAN SEMESTER (RPS)',
    identitas: [['Program studi', prodi], ['Mata kuliah', `${teks(mk.kode)} ${teks(mk.nama)}`], ['Kurikulum / sks', `${teks(mk.kurikulum)} / ${teks(mk.sks)} sks`],
      ['Dosen pengembang RPS', pengembang || '—'],
      ['Status RPS saat dicetak', rps ? `${teks(rps.status)}${rps.revisi > 1 ? ` (revisi ${rps.revisi - 1})` : ''}` : 'belum disimpan'],
      ['Jumlah review terkirim', String(terkirim.length)]],
    review: terkirim.map((v, i) => ({
      no: i + 1, nama: teks(v.nama), kirim: tgl(v.kirim_pada), rpsRevisi: v.revisi > 1 ? `revisi ${v.revisi - 1}` : 'versi sebelum pengesahan pertama',
      sama: !!v.sama, kesimpulan: LABEL(KESIMPULAN_REVIEW, v.kesimpulan), rerata: koma(rerataReview(v.skor)),
      baris: BUTIR_REVIEW.map(b => { const t = v.tanggapan?.[b.kode];
        return { kode: b.kode, teks: b.teks, skor: v.skor?.[b.kode] ? `${v.skor[b.kode]} (${LABEL(SKALA_REVIEW, v.skor[b.kode])})` : '—',
          catatan: teks(v.catatan?.[b.kode]), tanggapan: t ? `${LABEL(STATUS_TANGGAPAN, t.status)}${teks(t.teks) ? `: ${teks(t.teks)}` : ''}` : '' }; }),
      umum: teks(v.umum), tanggapanUmum: teks(v.tanggapan_umum),
      tanggapan: v.tanggapan_pada ? `${teks(v.tanggapan_oleh) || 'penyusun'}, ${tgl(v.tanggapan_pada)}${sudahDitanggapi(v) ? '' : ' (sebelum kiriman review terakhir)'}` : 'belum ditanggapi',
    })),
    dicetak: tgl(kini.toISOString()),
  };
}

const ABU = 'DCE6F0';
/** Isi <w:body> berkas review (tanpa sectPr). Lebar isi A4 tegak dengan margin 2 cm = 9638 twip. */
export function dokumenReview(M){
  const out = [pg(rn(M.judul, { b: true, sz: 26 }), { jc: 'center', after: 160 })];
  out.push(tabelK([2800, 6838], M.identitas.map(([k, v]) => [sel(k, { fill: ABU, b: true }), sel(v)])));
  if (!M.review.length) out.push(pg(rn('Belum ada review yang dikirim.', { i: true }), { before: 200 }));
  for (const r of M.review) {
    out.push(pg(rn(`Review ${r.no}: ${r.nama}`, { b: true, sz: 22 }), { before: 280, after: 60, keep: true }));
    out.push(pg(rn(`Dikirim ${r.kirim} untuk RPS ${r.rpsRevisi}${r.sama ? '' : '; RPS sudah diubah sesudah review ini'}. Tanggapan penyusun: ${r.tanggapan}.`, { sz: 16, i: true }), { after: 80, keep: true }));
    out.push(tabelK([2700, 1180, 2879, 2879], [
      { kepala: true, sel: ['Butir penilaian', 'Skor', 'Catatan reviewer', 'Tanggapan penyusun'].map(t => sel(t, { fill: ABU, b: true })) },
      ...r.baris.map(b => [sel(`${b.kode}. ${b.teks}`), sel(b.skor, { jc: 'center' }), sel(b.catatan), sel(b.tanggapan)]),
    ]));
    out.push(pg('', { after: 60 }));
    out.push(tabelK([2800, 6838], [[sel('Catatan umum reviewer', { fill: ABU, b: true }), sel(r.umum || '—')],
      [sel('Tanggapan umum penyusun', { fill: ABU, b: true }), sel(r.tanggapanUmum || '—')],
      [sel('Rerata skor (1-4)', { fill: ABU, b: true }), sel(r.rerata)], [sel('Kesimpulan', { fill: ABU, b: true }), sel(r.kesimpulan, { b: true })]]));
  }
  out.push(pg(rn(`Skala skor: ${SKALA_REVIEW.map(([n, l]) => `${n} ${l}`).join(', ')}. Butir penilaian disusun dari Panduan Pengisian RPS bagian 6. `
    + `Dicetak dari sistem program studi pada ${M.dicetak}; isian dan waktu kiriman/tanggapan dicatat sistem.`, { sz: 16, i: true }), { before: 240 }));
  return out.join('');
}

export async function buatReviewDocx(M, { JSZip, type = 'blob' } = {}){
  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>${dokumenReview(M)}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>` +
`<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`);
  return zip.generateAsync({ type, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

/** Nama berkas, mis. "Review_RPS_K26_13301.docx". */
export const namaBerkasReview = mk => `Review_RPS_${teks(mk.kurikulum)}_${teks(mk.kode)}.docx`;
