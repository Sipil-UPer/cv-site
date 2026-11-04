/* =====================================================================
   lkps-tabel.js — workbook LKPS sendiri untuk disalin ke templat LAM
   (pemilik 2026-11-04: "buat tabel excel saja, nanti tinggal copy paste").

   Isinya peta yang sama dengan LKPS terisi (lkps.js petaLKPS), ditulis pada
   ALAMAT SEL YANG SAMA dengan templat, jadi tiap blok ditempel ke alamat
   yang sama. Workbook tidak punya rumus dan daftar pilihan. Kerangka
   (judul, kepala tabel, rumus, sel gabungan) dari lkps-outline.json, dibuat
   tools/make_lkps_outline.py.

   Blok salin tidak pernah menutup sel rumus templat: menempel di atas rumus
   merusak hitungan LKPS. Sel kosong di dalam blok aman bila ditempel dengan
   Skip Blanks.
   ===================================================================== */
import { petaLKPS, indeksKolom, JSZIP } from './lkps.js?v=2026-11-05-cb1d94';

const OUTLINE = 'lkps-outline.json';
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Gaya sel, indeks cellXfs di gayaXml.
const G = { biasa: 0, judul: 1, label: 2, isi: 3, tanggal: 4, teks: 5, kepala: 6 };

export const hurufKolom = n => {
  let s = '';
  for (; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + (n - 1) % 26) + s;
  return s;
};
const pisahRef = ref => ({ k: indeksKolom(ref), b: +/\d+$/.exec(ref)[0] });
function pisahRentang(r){
  const [a, z = a] = r.split(':');
  const p = pisahRef(a), q = pisahRef(z);
  return { k1: p.k, b1: p.b, k2: q.k, b2: q.b };
}

// Rentang blok salin untuk satu lembar. Baris berurutan yang berisi nilai
// menjadi satu pita; kolom pita digabung selama celah di antaranya tidak
// memuat rumus atau sel gabungan. Sel gabungan yang berisi nilai ikut utuh.
export function blokSalin(sel, rumus = [], gabung = []){
  const F = new Set(rumus);
  const M = gabung.map(pisahRentang);
  const dalam = (k, b) => M.find(m => k >= m.k1 && k <= m.k2 && b >= m.b1 && b <= m.b2);
  const isi = new Map();                      // baris -> Set kolom
  const tandai = (k, b) => { if (!isi.has(b)) isi.set(b, new Set()); isi.get(b).add(k); };
  for (const ref of Object.keys(sel)) {
    const { k, b } = pisahRef(ref), m = dalam(k, b);
    if (!m) { tandai(k, b); continue; }
    for (let y = m.b1; y <= m.b2; y++) for (let x = m.k1; x <= m.k2; x++) tandai(x, y);
  }
  const baris = [...isi.keys()].sort((a, b) => a - b);
  const pita = [];
  for (const b of baris) {
    const akhir = pita[pita.length - 1];
    if (akhir && akhir.at(-1) === b - 1) akhir.push(b); else pita.push([b]);
  }
  const hasil = [];
  for (const bs of pita) {
    const kol = [...new Set(bs.flatMap(b => [...isi.get(b)]))].sort((a, b) => a - b);
    const penghalang = k => bs.some(b => !isi.get(b).has(k) && (F.has(hurufKolom(k) + b) || dalam(k, b)));
    let awal = kol[0], lalu = kol[0];
    const tutup = () => {
      const a = hurufKolom(awal) + bs[0], z = hurufKolom(lalu) + bs.at(-1);
      hasil.push(a === z ? a : `${a}:${z}`);
    };
    for (const k of kol.slice(1)) {
      let lolos = true;
      for (let x = lalu + 1; x < k; x++) if (penghalang(x)) lolos = false;
      if (!lolos) { tutup(); awal = k; }
      lalu = k;
    }
    tutup();
  }
  return hasil;
}

const escXml = s => String(s).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function selXml(ref, v, gaya){
  if (typeof v === 'number') return `<c r="${ref}" s="${gaya}"><v>${v}</v></c>`;
  if (v && typeof v === 'object' && 'tanggal' in v) return `<c r="${ref}" s="${G.tanggal}"><v>${v.tanggal}</v></c>`;
  return `<c r="${ref}" s="${gaya}" t="inlineStr"><is><t xml:space="preserve">${escXml(v)}</t></is></c>`;
}

// Satu lembar: { sel: {ref: [nilai, gaya]}, gabung: [], lebar: {kolom: lebar}, tinggi: {baris: tinggi} }.
// tinggi perlu untuk teks panjang di sel gabungan: Excel tidak menyesuaikannya sendiri.
export function lembarXml({ sel, gabung = [], lebar = {}, tinggi = {} }){
  const per = new Map();
  for (const ref of Object.keys(sel)) {
    const { k, b } = pisahRef(ref);
    if (!per.has(b)) per.set(b, []);
    per.get(b).push({ ref, k });
  }
  const baris = [...per.keys()].sort((a, b) => a - b).map(b =>
    `<row r="${b}"${tinggi[b] ? ` ht="${tinggi[b]}" customHeight="1"` : ''}>${per.get(b).sort((x, y) => x.k - y.k).map(({ ref }) => selXml(ref, ...sel[ref])).join('')}</row>`);
  const kolom = Object.entries(lebar).map(([h, w]) => [indeksKolom(h), w]).sort((a, b) => a[0] - b[0])
    .map(([i, w]) => `<col min="${i}" max="${i}" width="${w}" customWidth="1"/>`).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`
    + (kolom ? `<cols>${kolom}</cols>` : '') + `<sheetData>${baris.join('')}</sheetData>`
    + (gabung.length ? `<mergeCells count="${gabung.length}">${gabung.map(g => `<mergeCell ref="${g}"/>`).join('')}</mergeCells>` : '')
    + '</worksheet>';
}

const gayaXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/></numFmts>
<fonts count="3"><font><sz val="10"/><name val="Calibri"/></font><font><b/><sz val="13"/><name val="Calibri"/></font><font><b/><sz val="10"/><name val="Calibri"/></font></fonts>
<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFE7ECF3"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFFF6CC"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color rgb="FFBFC7D1"/></left><right style="thin"><color rgb="FFBFC7D1"/></right><top style="thin"><color rgb="FFBFC7D1"/></top><bottom style="thin"><color rgb="FFBFC7D1"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="7">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="164" fontId="0" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
</cellXfs></styleSheet>`;

const LANGKAH = [
  'Buka templat LKPS resmi LAM Teknik di samping berkas ini. Isi dulu sel "Ketik langsung" (lembar Menu): Excel menolak tempel di sana.',
  'Untuk tiap baris tabel di bawah: buka lembar bernama sama, pilih rentang "Blok salin", lalu salin (Ctrl+C).',
  'Di templat LAM, klik sel kiri atas rentang yang SAMA, lalu Tempel Spesial (Ctrl+Alt+V): pilih Values dan centang Skip blanks.',
  'Jangan menempel seluruh lembar: blok sengaja melewati sel rumus templat, dan tempel biasa menghapus daftar pilihannya.',
  'Sel kuning adalah data dari situs; kepala tabel hanya pengenal. Lembar yang tidak terdaftar belum punya data dan diisi langsung di templat.',
];

// Nilai untuk dibaca di Petunjuk; tanggal Excel menjadi dd/mm/yyyy.
function teksNilai(v){
  if (!v || typeof v !== 'object') return String(v);
  const d = new Date(Date.UTC(1899, 11, 30) + v.tanggal * 86400000);
  return [d.getUTCDate(), d.getUTCMonth() + 1].map(n => String(n).padStart(2, '0')).join('/') + '/' + d.getUTCFullYear();
}

function lembarPetunjuk(C, daftar){
  const sel = { A1: [`Tabel LKPS ${C.prodi || ''} TS ${C.ts}`.replace(/\s+/g, ' '), G.judul] };
  const gabung = [], tinggi = {};
  let b = 3;
  LANGKAH.forEach((t, i) => { sel[`A${b}`] = [`${i + 1}. ${t}`, G.teks]; gabung.push(`A${b}:E${b}`); tinggi[b] = 28; b++; });
  b++;
  ['Lembar', 'Tabel', 'Blok salin', 'Ketik langsung', 'Sel terisi'].forEach((t, i) => { sel[`${'ABCDE'[i]}${b}`] = [t, G.kepala]; });
  for (const x of daftar) {
    b++;
    sel[`A${b}`] = [x.nama, G.teks]; sel[`B${b}`] = [x.judul, G.teks];
    sel[`C${b}`] = [x.blok.join(', '), G.teks];
    sel[`D${b}`] = [x.ketik.map(([ref, v]) => `${ref}: ${teksNilai(v)}`).join('; '), G.teks];
    sel[`E${b}`] = [x.sel, G.teks];
  }
  return { sel, gabung, tinggi, lebar: { A: 10, B: 58, C: 40, D: 40, E: 10 } };
}

// peta {lembar: {ref: nilai}} + kerangka -> berkas-berkas di dalam xlsx.
export function susunBagian(peta, kerangka, C){
  const daftar = Object.entries(peta).filter(([, s]) => Object.keys(s).length).map(([nama, s]) => {
    const K = kerangka[nama] || { judul: nama, label: {}, rumus: [], gabung: [], ketik: [], lebar: {} };
    const tempel = Object.fromEntries(Object.entries(s).filter(([ref]) => !K.ketik.includes(ref)));
    return { nama, K, isi: s, judul: K.judul, sel: Object.keys(s).length, blok: blokSalin(tempel, K.rumus, K.gabung),
             ketik: Object.entries(s).filter(([ref]) => K.ketik.includes(ref)) };
  });
  const lembar = [{ nama: 'Petunjuk', ...lembarPetunjuk(C, daftar) }, ...daftar.map(x => {
    const sel = {};
    for (const [ref, t] of Object.entries(x.K.label)) sel[ref] = [t, ref === 'A1' ? G.judul : G.label];
    for (const [ref, v] of Object.entries(x.isi)) sel[ref] = [v, G.isi];
    return { nama: x.nama, sel, gabung: x.K.gabung, lebar: x.K.lebar };
  })];
  const bagian = {
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${lembar.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${lembar.map((l, i) => `<sheet name="${escXml(l.nama)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${lembar.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${lembar.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    'xl/styles.xml': gayaXml,
  };
  lembar.forEach((l, i) => { bagian[`xl/worksheets/sheet${i + 1}.xml`] = lembarXml(l); });
  return { bagian, daftar };
}

export async function buatTabelLKPS(C, opsi = {}){
  const { default: JSZip } = await import(JSZIP);
  const r = await fetch(OUTLINE, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`${OUTLINE} tidak terbaca (${r.status})`);
  const { bagian, daftar } = susunBagian(petaLKPS(C), await r.json(), C);
  const zip = new JSZip();
  for (const [p, isi] of Object.entries(bagian)) zip.file(p, isi);
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', mimeType: XLSX_MIME });
  const nama = `Tabel-LKPS-${(C.prodi || 'prodi').replace(/[^\w-]+/g, '_')}-TS${C.ts}.xlsx`;
  if (opsi.unduh !== false) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nama;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }
  return { nama, sel: daftar.reduce((n, x) => n + x.sel, 0), lembar: daftar.map(x => x.nama), blob };
}
