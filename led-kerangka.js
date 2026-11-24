/* =====================================================================
   DRAF LED — KERANGKA PER ELEMEN (instrumen selain LAM Teknik, 2026-11-24)
   ---------------------------------------------------------------------
   Untuk templat LED yang menaruh satu paragraf pengisi ("Lorem ipsum")
   di bawah tiap judul elemen, mis. templat resmi LAMDEPILAR (IAPS DEPILAR
   1.0). Dipilih lewat site/instrumen/<id>/dokumen.js (LED.mesin); LAM Teknik
   tetap memakai led.js.

   Per judul elemen di templat, paragraf pengisi diganti dengan:
     - catatan petunjuk (abu-abu miring) dan pengantar indikator (sorot kuning);
     - tiap unsur butir (unsur-butir.js): aspek 1-4, dokumen pendukung (5),
       data kuantitatif (6) — masing-masing dengan [isi: …] merah dan daftar
       bukti tertaut dari kartu butir (butir_bukti, per unsur);
     - bukti butir tanpa nomor unsur.
   Skor, bobot, dan NA TIDAK ditulis (LED diserahkan ke LAM; pemilik 2026-11-04).

   Judul templat dipetakan ke elemen lewat BUTIR_MANUAL[i].led (kode judul di
   templat), atau kode elemen bila `led` tidak ada. Satu judul boleh memuat
   beberapa elemen (LAMDEPILAR: judul A.1 = elemen A.1 dan A.2).
   Sampul, bab 1-2, dan bab 4-5 templat tidak diubah.
   ===================================================================== */

const JSZIP = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';
const REL_LINK = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink';
const FONT = '<w:rFonts w:ascii="Open Sans" w:eastAsia="Open Sans" w:hAnsi="Open Sans" w:cs="Open Sans"/><w:sz w:val="21"/><w:szCs w:val="21"/>';

const xe = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const teksXML = s => s.replace(/<w:tab\/>/g, ' ').match(/<w:t(?: [^>]*)?>[^<]*<\/w:t>/g)?.map(t => t.replace(/<[^>]+>/g, ''))
  .join('').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') ?? '';

// Kode elemen di awal judul: "D.1 Legalitas", "L2. Sumber", "I.1Sistem" -> "D.1", "L.2", "I.1".
export function kodeJudul(teks){
  const m = /^\s*([A-Z])\s*\.?\s*([1-9])(?![0-9])/.exec(teks || '');
  return m ? `${m[1]}.${m[2]}` : null;
}

// Paragraf tingkat atas w:body: [{awal, akhir, xml}] (paragraf di dalam kotak teks
// atau tabel ikut induknya, jadi batasnya tidak terpotong).
export function paragrafAtas(xml){
  const body0 = xml.indexOf('<w:body>');
  // Paragraf kosong boleh tertutup sendiri: <w:p w14:paraId="…"/> (templat LAMDEPILAR).
  const re = /<w:p(?:\s[^>]*?)?(\/?)>|<\/w:p>|<w:tbl>|<\/w:tbl>/g;
  re.lastIndex = body0;
  const out = [];
  let d = 0, awal = -1, m;
  while ((m = re.exec(xml))) {
    if (m[1] === '/') {   // <w:p …/>: paragraf utuh
      if (d === 0) out.push({ awal: m.index, akhir: m.index + m[0].length, xml: m[0] });
      continue;
    }
    const buka = m[0] !== '</w:p>' && m[0] !== '</w:tbl>';
    if (buka) { if (d === 0) awal = m.index; d++; }
    else { d--; if (d === 0) { const akhir = m.index + m[0].length; out.push({ awal, akhir, xml: xml.slice(awal, akhir) }); } }
  }
  return out;
}

const gaya = p => (/<w:pStyle w:val="([^"]+)"/.exec(p) || [])[1] || '';
const judulTingkat = p => { const m = /^Heading([1-9])$/i.exec(gaya(p)); return m ? +m[1] : 0; };

// Pembangun paragraf. bagian = [{t, b, i, warna, sorot, url}]
function paragraf(bagian, rel, opsi = {}){
  const run = x => {
    const pr = FONT + (x.b ? '<w:b/><w:bCs/>' : '') + (x.i ? '<w:i/><w:iCs/>' : '')
      + (x.url ? '<w:color w:val="0563C1"/><w:u w:val="single"/>' : x.warna ? `<w:color w:val="${x.warna}"/>` : '')
      + (x.sorot ? `<w:highlight w:val="${x.sorot}"/>` : '');
    const r = `<w:r><w:rPr>${pr}</w:rPr><w:t xml:space="preserve">${xe(x.t)}</w:t></w:r>`;
    return x.url ? `<w:hyperlink r:id="${rel(x.url)}" w:history="1">${r}</w:hyperlink>` : r;
  };
  const ind = opsi.inden ? `<w:ind w:left="${opsi.inden}"/>` : '';
  return `<w:p><w:pPr><w:spacing w:after="${opsi.setelah ?? 80}"/>${ind}<w:jc w:val="both"/></w:pPr>${bagian.map(run).join('')}</w:p>`;
}

const ISI = t => ({ t: `[isi: ${t}]`, b: true, warna: 'C00000' });

function daftarBukti(xs){
  if (!xs.length) return [{ t: 'belum ada bukti tertaut di kartu butir.', i: true, warna: '7F7F7F' }];
  const out = [];
  xs.forEach((x, i) => {
    if (i) out.push({ t: '; ' });
    out.push(x.url ? { t: x.label || 'Berkas bukti', url: x.url } : { t: `${x.label || 'Bukti'} (${x.ket || 'tanpa tautan'})`, i: true });
  });
  return out;
}

// Kerangka satu elemen.
function kerangkaElemen(b, C, rel, beberapa){
  const d = (C.unsurButir || {})[b.no];
  const bukti = (C.bukti ? C.bukti(b.no) : []) || [];
  const per = n => bukti.filter(x => +x.unsur === +n);
  const ps = [];
  if (beberapa) ps.push(paragraf([{ t: `Elemen ${b.judul || b.no}`, b: true }], rel, { setelah: 60 }));
  if (b.ket) ps.push(paragraf([{ t: b.ket, sorot: 'yellow' }], rel));
  const unsur = d ? Object.entries(d.unsur).map(([n, l]) => [+n, l]).sort((x, y) => x[0] - y[0]) : [];
  for (const [n, label] of unsur) {
    const judul = n <= 4 ? `(${n}) ${label}` : n === 5 ? `Dokumen pendukung: ${label}` : `Data kuantitatif: ${label}`;
    ps.push(paragraf([{ t: judul, b: true }], rel, { setelah: 40 }));
    ps.push(paragraf([ISI(n === 6 ? 'ringkas data Laporan Kinerja Program Studi dan targetnya'
      : n === 5 ? 'jelaskan keabsahan, kelengkapan, dan pengelolaan dokumen bukti'
      : 'uraikan pemenuhan aspek ini oleh program studi, dengan data dan contoh')], rel, { inden: 360, setelah: 40 }));
    ps.push(paragraf([{ t: 'Bukti: ', b: true }, ...daftarBukti(per(n))], rel, { inden: 360 }));
  }
  const lain = bukti.filter(x => !x.unsur);
  if (lain.length) ps.push(paragraf([{ t: 'Bukti lain untuk elemen ini: ', b: true }, ...daftarBukti(lain)], rel));
  if (!unsur.length) ps.push(paragraf([ISI('uraian analitis elemen ini')], rel));
  return ps.join('');
}

/* Isi kerangka ke document.xml. Murni (tanpa DOM, tanpa jaringan), diuji di Node.
   C = { butirManual, unsurButir, bukti(no) -> [{label, url, unsur, ket}] }
   rels = isi word/_rels/document.xml.rels.
   Hasil {xml, rels, terisi: [kode judul], gagal: [kode elemen tanpa judul], tanpaPengisi: [kode judul]}. */
export function isiKerangka(xml, rels, C){
  const ada = new Set([...rels.matchAll(/Id="rId(\d+)"/g)].map(m => +m[1]));
  let nomor = Math.max(1000, ...ada);
  const relBaru = [];
  const rel = url => { const id = `rId${++nomor}`; relBaru.push(`<Relationship Id="${id}" Type="${REL_LINK}" Target="${xe(url)}" TargetMode="External"/>`); return id; };

  const elemen = new Map();
  for (const b of C.butirManual || []) {
    const k = b.led || b.kode;
    if (k) (elemen.get(k) || elemen.set(k, []).get(k)).push(b);
  }
  const ps = paragrafAtas(xml);
  const ganti = [];   // [awal, akhir, xmlBaru]
  const terisi = [], tanpaPengisi = [];
  ps.forEach((p, i) => {
    const t = judulTingkat(p.xml);
    if (!t) return;
    const kode = kodeJudul(teksXML(p.xml));
    const xs = kode && elemen.get(kode);
    if (!xs || terisi.includes(kode)) return;
    let j = i + 1;
    while (j < ps.length && !judulTingkat(ps[j].xml) && !/Lorem ipsum/.test(teksXML(ps[j].xml))) j++;
    const isi = paragraf([{ t: 'Draf dari sistem, periksa dan lengkapi sebelum diserahkan. Petunjuk templat: uraian tidak lebih '
      + 'dari 500 kata, lengkapi dengan tabel; uraikan secara analitis berdasarkan Pernyataan Standar (Kriteria Akreditasi).',
      i: true, warna: '7F7F7F' }], rel) + xs.map(b => kerangkaElemen(b, C, rel, xs.length > 1)).join('');
    if (j < ps.length && !judulTingkat(ps[j].xml)) ganti.push([ps[j].awal, ps[j].akhir, isi]);
    else { ganti.push([p.akhir, p.akhir, isi]); tanpaPengisi.push(kode); }
    terisi.push(kode);
  });
  let out = xml;
  for (const [a, z, s] of ganti.sort((x, y) => y[0] - x[0])) out = out.slice(0, a) + s + out.slice(z);
  const gagal = [...elemen.keys()].filter(k => !terisi.includes(k));
  return { xml: out, rels: rels.replace('</Relationships>', relBaru.join('') + '</Relationships>'), terisi, gagal, tanpaPengisi };
}

/* Unduh draf LED. C dari skor.html unduhLED(): templat, butirManual, unsurButir,
   bukti(no), D, ts. opsi.unduh === false -> kembalikan blob tanpa mengunduh. */
export async function buatLED(C, opsi = {}){
  const JSZip = (await import(JSZIP)).default;
  const res = await fetch(C.templat);
  if (!res.ok) throw new Error(`templat LED tidak terbaca: ${C.templat} (${res.status})`);
  const zip = await JSZip.loadAsync(await res.arrayBuffer());
  const xml = await zip.file('word/document.xml').async('string');
  const rels = await zip.file('word/_rels/document.xml.rels').async('string');
  const h = isiKerangka(xml, rels, C);
  zip.file('word/document.xml', h.xml);
  zip.file('word/_rels/document.xml.rels', h.rels);
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const tgl = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const nama = `LED-draf-${((C.D && C.D.prodi) || 'prodi').replace(/\s+/g, '-')}-TS${C.ts}-${tgl}.docx`;
  const gagal = [...h.gagal, ...h.tanpaPengisi];
  if (opsi.unduh === false) return { nama, gagal, blob, terisi: h.terisi };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = nama;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  return { nama, gagal, terisi: h.terisi };
}
