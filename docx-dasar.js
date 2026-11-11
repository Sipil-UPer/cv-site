// Pembuat Word (.docx) bersama, tanpa templat (pemilik 2026-11-11): dipakai laporan
// tahunan (laporan-tahunan.js) dan CV dosen (cv-dosen.js). Dipindah apa adanya dari
// laporan-tahunan.js; JSZip dimuat saat dokumen dibuat.

export const JSZIP = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';
export const LEBAR = 9360;   // A4, margin 1440/1106 twip

export const xe = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const run = (t, o = {}) => {
  const pr = [o.b ? '<w:b/>' : '', o.i ? '<w:i/>' : '', o.warna ? `<w:color w:val="${o.warna}"/>` : '',
    o.sz ? `<w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/>` : ''].join('');
  return `<w:r>${pr ? `<w:rPr>${pr}</w:rPr>` : ''}<w:t xml:space="preserve">${xe(t)}</w:t></w:r>`;
};
export const para = (isi, o = {}) => `<w:p><w:pPr>${o.gaya ? `<w:pStyle w:val="${o.gaya}"/>` : ''}${o.keep ? '<w:keepNext/>' : ''}` +
  `<w:spacing w:before="${o.before ?? 40}" w:after="${o.after ?? 100}"/><w:jc w:val="${o.jc || 'both'}"/></w:pPr>${isi}</w:p>`;
export const judul = (t, n) => para(run(t), { gaya: `Heading${n}`, keep: true, jc: 'left' });
export const teks = (t, o) => para(run(t), o);

export function tabel(baris){
  const n = Math.max(...baris.map(r => r.length));
  const pj = Array(n).fill(10);   // kolom sempit tidak memotong kata seperti "Penelitian"
  baris.forEach(r => r.forEach((c, k) => { pj[k] = Math.max(pj[k], Math.min(45, String(c ?? '').length)); }));
  const tot = pj.reduce((a, b) => a + b, 0);
  const w = pj.map(x => Math.floor(LEBAR * x / tot));
  w[n - 1] += LEBAR - w.reduce((a, b) => a + b, 0);
  const garis = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']
    .map(s => `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="808080"/>`).join('');
  const rows = baris.map((r, i) => `<w:tr>${i === 0 ? '<w:trPr><w:tblHeader/></w:trPr>' : ''}${
    Array.from({ length: n }, (_, k) => `<w:tc><w:tcPr><w:tcW w:w="${w[k]}" w:type="dxa"/>${
      i === 0 ? '<w:shd w:val="clear" w:color="auto" w:fill="DCE6F1"/>' : ''}</w:tcPr><w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr>${
      run(r[k] ?? '', { b: i === 0, sz: 18 })}</w:p></w:tc>`).join('')}</w:tr>`).join('');
  return `<w:tbl><w:tblPr><w:tblW w:w="${LEBAR}" w:type="dxa"/><w:tblBorders>${garis}</w:tblBorders>` +
    `<w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr>` +
    `<w:tblGrid>${w.map(x => `<w:gridCol w:w="${x}"/>`).join('')}</w:tblGrid>${rows}</w:tbl>` + para('', { before: 0, after: 80 });
}

export const GAYA = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="id-ID"/></w:rPr></w:rPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/>
<w:pPr><w:keepNext/><w:spacing w:before="280" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="1F3864"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/>
<w:pPr><w:keepNext/><w:spacing w:before="200" w:after="80"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:style>
</w:styles>`;

// Berkas .docx (Blob) dari isi <w:body> (paragraf dan tabel), kertas A4.
export async function buatDocx(isiBody){
  const { default: JSZip } = await import(JSZIP);
  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`);
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);
  zip.file('word/styles.xml', GAYA);
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<w:body>${isiBody}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1106" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`);
  return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}
