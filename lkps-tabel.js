/* =====================================================================
   lkps-tabel.js — workbook LKPS sendiri untuk disalin ke templat LAM
   (pemilik 2026-11-04: "buat tabel excel saja, nanti tinggal copy paste").

   Memuat SEMUA tabel wajib Sarjana (kolom S lembar Daftar Tabel templat), yang
   kosong juga. Isinya peta yang sama dengan LKPS terisi (lkps.js petaLKPS),
   ditulis pada ALAMAT SEL YANG SAMA dengan templat, jadi tiap blok ditempel ke
   alamat yang sama. Tidak ada rumus dan daftar pilihan. Kerangka dari
   lkps-outline.json, dibuat tools/make_lkps_outline.py.

   Blok salin tidak pernah menutup sel rumus templat: menempel di atas rumus
   merusak hitungan LKPS. Sel kosong di dalam blok aman bila ditempel dengan
   Skip Blanks.
   ===================================================================== */
import { petaLKPS, indeksKolom, JSZIP } from './lkps.js?v=2026-11-06-3c33e6';

const OUTLINE = 'lkps-outline.json';
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Gaya sel, indeks cellXfs di gayaXml.
const G = { biasa: 0, judul: 1, kepala: 2, label: 3, nomor: 4, isi: 5, tanggal: 6, kosong: 7, rumus: 8,
            catatan: 9, teks: 10, sel: 11, tautan: 12, ada: 13, belum: 14, catatanBaris: 15 };

// Tab Data prodi / halaman tempat data tiap tabel diisi.
const KARYA = 'Input karya';
const SUMBER = {
  PS: 'Data prodi › Prodi di UPPS', 1: 'Data prodi › VMTS',
  '2a1': 'Data prodi › Kerja sama + Input karya', '2a2': 'Data prodi › Kerja sama + Input karya',
  '2a3': 'Data prodi › Kerja sama + Input karya', '2b': 'Data prodi › Penggunaan dana',
  '3a1': 'Data prodi › Mata kuliah', '3a3': `${KARYA} (integrasi)`, '3a4': 'Data prodi › Mata kuliah',
  '3a5': 'Data prodi › Mata kuliah', '3b': `${KARYA} (penelitian)`, '3c': `${KARYA} (PkM)`,
  '4a': 'Profil dosen', '4b': 'Data prodi › Tenaga kependidikan', '4c': 'Data prodi › BKD',
  '4d': `${KARYA} (publikasi)`, '4f-1': `${KARYA} (luaran)`, '4f-2': `${KARYA} (luaran)`,
  '4f-3': `${KARYA} (luaran)`, '4f-4': `${KARYA} (luaran)`, '4h': `${KARYA} (publikasi, paten)`,
  '4i': `${KARYA} (jumlah sitasi)`, '4j': `${KARYA} (rekognisi)`,
  '5a': 'Data prodi › Prasarana & alat', '5b': 'Data prodi › Dokumen K3L', '5c': 'Data prodi › Fasilitas K3L',
  '6a': 'Data prodi › Mahasiswa', '6b': 'Data prodi › Mahasiswa', '6c1': 'Data prodi › Prestasi',
  '6c2': 'Data prodi › Prestasi', '6d': 'Data prodi › Kohort', '6e1': 'Data prodi › Publikasi mahasiswa',
  '6e3-1': 'Data prodi › Luaran mahasiswa', '6e3-2': 'Data prodi › Luaran mahasiswa',
  '6e3-3': 'Data prodi › Luaran mahasiswa', '6e3-4': 'Data prodi › Luaran mahasiswa',
  '6f1': 'Data prodi › Tracer study', '6f2': 'Data prodi › Tracer study', '6g1': 'Data prodi › Tracer study',
  '6g2': 'Data prodi › Kepuasan pengguna', '6h1': `${KARYA} (penelitian)`, '6i': `${KARYA} (PkM)`,
  '7a': 'Data prodi › Dokumen', '7b': 'Data prodi › SPMI (PPEPP)',
};

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
  if (v === '' || v == null) return `<c r="${ref}" s="${gaya}"/>`;
  if (typeof v === 'number') return `<c r="${ref}" s="${gaya}"><v>${v}</v></c>`;
  if (typeof v === 'object' && 'tanggal' in v) return `<c r="${ref}" s="${G.tanggal}"><v>${v.tanggal}</v></c>`;
  return `<c r="${ref}" s="${gaya}" t="inlineStr"><is><t xml:space="preserve">${escXml(v)}</t></is></c>`;
}

// Satu lembar: { sel: {ref: [nilai, gaya]}, gabung, lebar: {kolom: lebar, 0 = sembunyi},
// tinggi: {baris: tinggi}, sembunyi: [[awal, akhir]], tab: warna tab, tautan: {ref: tujuan} }.
export function lembarXml({ sel, gabung = [], lebar = {}, tinggi = {}, sembunyi = [], tab = '', tautan = {} }){
  const per = new Map();
  for (const ref of Object.keys(sel)) {
    const { k, b } = pisahRef(ref);
    if (!per.has(b)) per.set(b, []);
    per.get(b).push({ ref, k });
  }
  const tutup = new Set();
  sembunyi.forEach(([a, z]) => { for (let b = a; b <= z; b++) { tutup.add(b); if (!per.has(b)) per.set(b, []); } });
  const baris = [...per.keys()].sort((a, b) => a - b).map(b => {
    const atr = (tutup.has(b) ? ' hidden="1"' : '') + (tinggi[b] ? ` ht="${tinggi[b]}" customHeight="1"` : '');
    return `<row r="${b}"${atr}>${per.get(b).sort((x, y) => x.k - y.k).map(({ ref }) => selXml(ref, ...sel[ref])).join('')}</row>`;
  });
  const kolom = Object.entries(lebar).map(([h, w]) => [indeksKolom(h), w]).sort((a, b) => a[0] - b[0])
    .map(([i, w]) => `<col min="${i}" max="${i}" width="${w || 1}"${w ? '' : ' hidden="1"'} customWidth="1"/>`).join('');
  const tt = Object.entries(tautan);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`
    + (tab ? `<sheetPr><tabColor rgb="FF${tab}"/></sheetPr>` : '')
    + '<sheetViews><sheetView showGridLines="0" workbookViewId="0"/></sheetViews>'
    + (kolom ? `<cols>${kolom}</cols>` : '') + `<sheetData>${baris.join('')}</sheetData>`
    + (gabung.length ? `<mergeCells count="${gabung.length}">${gabung.map(g => `<mergeCell ref="${g}"/>`).join('')}</mergeCells>` : '')
    + (tt.length ? `<hyperlinks>${tt.map(([r, l]) => `<hyperlink ref="${r}" location="${escXml(l)}"/>`).join('')}</hyperlinks>` : '')
    + '</worksheet>';
}

const GARIS = 'FFBFC7D1';
const sisi = n => `<${n} style="thin"><color rgb="${GARIS}"/></${n}>`;
const xf = (font, fill, border, align = '', num = 0) => `<xf numFmtId="${num}" fontId="${font}" fillId="${fill}" borderId="${border}" xfId="0"`
  + `${num ? ' applyNumberFormat="1"' : ''} applyFont="1" applyFill="1" applyBorder="1"${align ? ` applyAlignment="1">${align}</xf>` : '/>'}`;
const AL = (h, v = 'center', w = 1) => `<alignment${h ? ` horizontal="${h}"` : ''} vertical="${v}"${w ? ' wrapText="1"' : ''}/>`;
const gayaXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/></numFmts>
<fonts count="8"><font><sz val="10"/><name val="Calibri"/></font>
<font><b/><sz val="13"/><color rgb="FF1F3864"/><name val="Calibri"/></font>
<font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
<font><b/><sz val="10"/><name val="Calibri"/></font>
<font><sz val="8"/><color rgb="FF7F8A94"/><name val="Calibri"/></font>
<font><i/><sz val="9"/><color rgb="FF5D6B78"/><name val="Calibri"/></font>
<font><u/><sz val="10"/><color rgb="FF17436F"/><name val="Calibri"/></font>
<font><b/><sz val="10"/><color rgb="FF00703A"/><name val="Calibri"/></font></fonts>
<fills count="7"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF1F3864"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFE7ECF3"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFFF6CC"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFECEFF2"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF5F7F9"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>
<border>${sisi('left')}${sisi('right')}${sisi('top')}${sisi('bottom')}<diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="16">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
${xf(1, 0, 0)}
${xf(2, 2, 1, AL('center'))}
${xf(3, 3, 1, AL('left'))}
${xf(4, 6, 1, AL('center'))}
${xf(0, 4, 1, AL('left', 'top'))}
${xf(0, 4, 1, AL('center', 'top', 0), 164)}
${xf(0, 0, 1, AL('left', 'top'))}
${xf(0, 5, 1)}
${xf(5, 0, 0, AL('left', 'top'))}
${xf(0, 0, 0, AL('left', 'top'))}
${xf(0, 0, 1, AL('left', 'top'))}
${xf(6, 0, 1, AL('left', 'top'))}
${xf(7, 0, 1, AL('left', 'top'))}
${xf(5, 0, 1, AL('left', 'top'))}
${xf(5, 0, 0, AL('left', 'center', 0))}
</cellXfs></styleSheet>`;

const LANGKAH = [
  'Buka templat LKPS resmi LAM Teknik di samping berkas ini. Ketik dulu isian lembar Menu di bawah: Excel menolak tempel di sana.',
  'Untuk tiap tabel: klik judulnya untuk membuka lembarnya, pilih rentang "Blok salin", lalu salin (Ctrl+C).',
  'Di templat LAM, klik sel kiri atas rentang yang SAMA, lalu Tempel Spesial (Ctrl+Alt+V): pilih Values dan centang Skip blanks.',
  'Jangan menempel seluruh lembar: blok sengaja melewati sel rumus templat, dan tempel biasa menghapus daftar pilihannya.',
  'Di lembar tabel: kuning = data dari situs, putih = belum ada data, abu-abu = dihitung rumus templat. Tab hijau = tabel berisi data.',
];

// Nilai untuk dibaca di Petunjuk; tanggal Excel menjadi dd/mm/yyyy.
function teksNilai(v){
  if (!v || typeof v !== 'object') return String(v);
  const d = new Date(Date.UTC(1899, 11, 30) + v.tanggal * 86400000);
  return [d.getUTCDate(), d.getUTCMonth() + 1].map(n => String(n).padStart(2, '0')).join('/') + '/' + d.getUTCFullYear();
}

function lembarPetunjuk(C, daftar, ketik){
  const terisi = daftar.filter(x => x.sel).length;
  const sel = { A1: [`Tabel LKPS Sarjana ${C.prodi || ''} TS ${C.ts}`.replace(/\s+/g, ' '), G.judul],
                A2: [`${terisi} dari ${daftar.length} tabel wajib sudah berisi data situs.`, G.catatan] };
  const gabung = ['A2:E2'], tinggi = {}, tautan = {};
  let b = 4;
  LANGKAH.forEach((t, i) => { sel[`A${b}`] = [`${i + 1}. ${t}`, G.teks]; gabung.push(`A${b}:E${b}`); tinggi[b] = 16; b++; });
  if (ketik.length) {
    b++;
    sel[`A${b}`] = ['Ketik di lembar Menu templat', G.kepala]; gabung.push(`A${b}:B${b}`); sel[`B${b}`] = ['', G.kepala];
    sel[`C${b}`] = ['Sel', G.kepala]; sel[`D${b}`] = ['Nilai', G.kepala]; gabung.push(`D${b}:E${b}`); sel[`E${b}`] = ['', G.kepala];
    for (const [ref, v, nama] of ketik) {
      b++;
      sel[`A${b}`] = [nama, G.sel]; sel[`B${b}`] = ['', G.sel]; gabung.push(`A${b}:B${b}`);
      sel[`C${b}`] = [ref, G.sel]; sel[`D${b}`] = [teksNilai(v), G.sel]; sel[`E${b}`] = ['', G.sel]; gabung.push(`D${b}:E${b}`);
    }
  }
  b += 2;
  ['No', 'Tabel', 'Status', 'Sumber data di situs', 'Blok salin'].forEach((t, i) => { sel[`${'ABCDE'[i]}${b}`] = [t, G.kepala]; });
  daftar.forEach((x, i) => {
    b++;
    sel[`A${b}`] = [i + 1, G.sel]; sel[`B${b}`] = [`${x.judulDaftar} (lembar ${x.nama})`, G.tautan];
    tautan[`B${b}`] = `'${x.nama}'!A1`;
    sel[`C${b}`] = x.sel ? [`Terisi (${x.sel} sel)`, G.ada] : ['Belum ada data', G.belum];
    sel[`D${b}`] = [SUMBER[x.nama] || '', G.sel]; sel[`E${b}`] = [x.blok.join(', '), G.sel];
  });
  return { sel, gabung, tinggi, tautan, tab: '1F3864', lebar: { A: 6, B: 62, C: 16, D: 34, E: 26 } };
}

// Isian lembar Menu: nama isian dibaca dari label sebelah kirinya di templat.
const NAMA_MENU = { H7: 'Perguruan tinggi', H11: 'Jenjang program', H23: 'Program studi', S73: 'Tanggal TS' };

// Lembar tabel dengan alamat sel templat.
function lembarTabel(x){
  const K = x.K, sel = {};
  const kotak = (K.grid || []).map(pisahRentang);
  const nilai = Object.keys(x.isi).map(pisahRef);
  let maks = 0;
  const tergambar = new Set();
  for (const r of kotak) {
    const isi = nilai.filter(v => v.b >= r.b1 && v.b <= r.b2).map(v => v.b);
    const akhir = r.b2 - r.b1 < 12 ? r.b2 : Math.min(r.b2, Math.max(r.b1 + 4, ...isi));
    maks = Math.max(maks, akhir);
    for (let b = r.b1; b <= akhir; b++) {
      tergambar.add(b);
      for (let k = r.k1; k <= r.k2; k++) sel[hurufKolom(k) + b] = ['', G.kosong];
    }
  }
  const barisIsian = b => kotak.some(r => b >= r.b1 && b <= r.b2);
  const tersembunyi = b => (K.sembunyi || []).some(([a, z]) => b >= a && b <= z);
  // Nomor baris templat di baris isian yang tidak digambar (sampai ratusan) dilewati.
  const label = Object.entries(K.label).filter(([r, t]) => !(/^\d+$/.test(t) && barisIsian(pisahRef(r).b) && !tergambar.has(pisahRef(r).b)));
  const barisLabel = new Set(label.map(([r]) => pisahRef(r).b));
  const perBaris = {};
  label.forEach(([r]) => { const b = pisahRef(r).b; perBaris[b] = (perBaris[b] || 0) + 1; });
  const anchorGabung = new Set(K.gabung.map(g => g.split(':')[0]));
  const barisPertama = Math.min(...kotak.map(r => r.b1), 1e9);
  for (const ref of K.rumus) {
    const { k, b } = pisahRef(ref);
    if (k <= K.batas && !tersembunyi(b) && (b <= maks || barisLabel.has(b))) sel[ref] = ['', G.rumus];
  }
  for (const [ref, t] of label) {
    const { b } = pisahRef(ref);
    // Teks satu baris tanpa gabungan meluber ke kanan seperti di templat, tidak dibungkus.
    const catatan = /^Diisi oleh/.test(t) || (perBaris[b] === 1 && !barisIsian(b) && t !== 'Jumlah');
    const gaya = ref === 'A1' ? G.judul : /^\d+$/.test(t) ? G.nomor
      : catatan ? (anchorGabung.has(ref) ? G.catatan : G.catatanBaris)
      : barisIsian(b) || (t === 'Jumlah' && b > barisPertama) ? G.label : G.kepala;
    sel[ref] = [gaya === G.nomor ? +t : t, gaya];
  }
  const gabung = K.gabung.filter(g => {
    const m = pisahRentang(g);
    return !tersembunyi(m.b1) && m.k1 <= K.batas;
  });
  for (const g of gabung) {          // garis dan warna sel gabungan mengikuti sel kiri atasnya
    const m = pisahRentang(g), a = sel[hurufKolom(m.k1) + m.b1];
    if (!a) continue;
    for (let b = m.b1; b <= m.b2; b++) for (let k = m.k1; k <= m.k2; k++)
      if (k !== m.k1 || b !== m.b1) sel[hurufKolom(k) + b] = ['', a[1]];
  }
  // Kolom No.: templat mengisinya sendiri; di sini nomor urut baris tabel.
  if (Object.entries(K.label).some(([r, t]) => /^A\d+$/.test(r) && /^No\.?$/.test(t))) {
    let n = 0, lalu = 0;
    Object.keys(sel).filter(r => /^B\d+$/.test(r) && sel[r][1] === G.kosong).map(r => pisahRef(r).b).sort((a, b) => a - b).forEach(b => {
      n = b === lalu + 1 ? n + 1 : 1; lalu = b;
      if (!sel[`A${b}`] || sel[`A${b}`][1] === G.rumus) sel[`A${b}`] = [n, G.nomor];
    });
  }
  const bersih = new Set();
  for (const [ref, v] of Object.entries(x.isi)) { sel[ref] = [v, G.isi]; bersih.add(pisahRef(ref).b); }
  const tinggi = Object.fromEntries(Object.entries(K.tinggi || {}).filter(([b]) => !bersih.has(+b)));
  // Kepala yang tidak muat di tinggi baris templat: perkiraan baris teks x 13,5 pt.
  const digabung = new Set(gabung.map(g => g.split(':')[0]));
  for (const [ref, [v, g]] of Object.entries(sel)) {
    if (g !== G.kepala || !v || digabung.has(ref)) continue;
    const { b } = pisahRef(ref), kol = ref.replace(/\d+$/, '');
    const baris = Math.ceil(String(v).length * 1.25 / (K.lebar[kol] || 9));
    if (baris * 13.5 > (tinggi[b] || 15)) tinggi[b] = baris * 13.5;
  }
  return { nama: x.nama, sel, gabung, lebar: K.lebar, tinggi, sembunyi: K.sembunyi || [], tab: x.sel ? '00954E' : 'B8C0C8' };
}

// peta {lembar: {ref: nilai}} + kerangka -> berkas-berkas di dalam xlsx.
export function susunBagian(peta, kerangka, C){
  const wajib = kerangka.wajib.map(w => w.nama);
  const lain = Object.keys(peta).filter(n => n !== 'Menu' && !wajib.includes(n) && Object.keys(peta[n]).length);
  const judul = Object.fromEntries(kerangka.wajib.map(w => [w.nama, w.judul]));
  const daftar = [...wajib, ...lain].map(nama => {
    const s = peta[nama] || {};
    const K = kerangka.lembar[nama];
    return { nama, K, isi: s, judul: K.judul, judulDaftar: judul[nama] || K.judul, sel: Object.keys(s).length,
             blok: blokSalin(s, K.rumus, K.gabung) };
  });
  const ketik = Object.entries(peta.Menu || {}).map(([ref, v]) => [ref, v, NAMA_MENU[ref] || ref]);
  const lembar = [{ nama: 'Petunjuk', ...lembarPetunjuk(C, daftar, ketik) }, ...daftar.map(lembarTabel)];
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
  return { bagian, daftar, ketik };
}

export async function buatTabelLKPS(C, opsi = {}){
  const { default: JSZip } = await import(JSZIP);
  const r = await fetch(OUTLINE, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`${OUTLINE} tidak terbaca (${r.status})`);
  const kerangka = await r.json();
  // Halaman lama yang masih terbuka + kerangka baru menghasilkan berkas tanpa kepala tabel.
  if (kerangka.versi !== 2) throw new Error('Halaman ini versi lama. Tekan Ctrl+Shift+R lalu unduh lagi.');
  const { bagian, daftar } = susunBagian(petaLKPS(C), kerangka, C);
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
