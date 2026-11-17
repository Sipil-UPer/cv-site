// Isi templat nilai CPL (Template_Input_Data_CPL.xlsx, versi CPL-2026.10.09) dari struktur CPMK di website
// (pemilik 2026-11-17, OBE tahap O2). Berkas .xlsx dibuka sebagai zip (JSZip); yang diubah HANYA sel isian di
// lembar Info, Rumusan, Bobot_Butir, Bobot_Indikator, dan Nilai (dikosongkan). Rumus, dropdown, format bersyarat,
// komentar, dan petunjuk tetap identik. workbook.xml templat sudah memakai fullCalcOnLoad="1", jadi Excel
// menghitung ulang saat dibuka; run_cpl.py hanya membaca sel isian (cpl/template.py) dan menghitung sendiri.
// Tata letak slot sama dengan cpl/template.py; tests/test_templat_cpl.py memeriksa hasilnya pulang-pergi.
// Tanpa impor: dipakai peramban (cpmk.html, nilai-cpl.html) dan Node (tools/isi_templat_cpl.mjs).

export const SLOT = { item: 50, sub: 50, cpmk: 10, ind: 40, cpl: 12, mhs: 120 };
const BARIS = { cpl: 6, ind: 21, cpmk: 64, sub: 77 };      // Rumusan: baris pertama tiap blok
const BB = { judul: 4, awal: 5, kol: 3 };                  // Bobot_Butir: nama butir baris 4 mulai kolom C; Sub-CPMK baris 5..
const BI = { awal: 5, kol: 2 };                             // Bobot_Indikator: CPMK baris 5.., indikator mulai kolom B
const NL = { awal: 5, kol: 3 };                             // Nilai: mahasiswa baris 5.., NIM kolom A, nilai mulai kolom C
export const LEMBAR = ['Info', 'Rumusan', 'Bobot_Butir', 'Bobot_Indikator', 'Nilai'];

export const kolom = n => { let s = ''; for (; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + (n - 1) % 26) + s; return s; };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
const nomorKolom = ref => [...ref.replace(/\d+$/, '')].reduce((a, c) => a * 26 + c.charCodeAt(0) - 64, 0);

/** Isi satu sel. nilai: null/'' = kosong, number = angka, lainnya = teks. Gaya (s) sel templat dipertahankan. */
export function aturSel(xml, ref, nilai){
  const baris = +ref.match(/\d+$/)[0];
  const isi = s => nilai == null || nilai === '' ? `<c r="${ref}"${s}/>`
    : typeof nilai === 'number' ? `<c r="${ref}"${s}><v>${nilai}</v></c>`
    : `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${esc(nilai)}</t></is></c>`;
  const re = new RegExp(`<c r="${ref}"(\\s[^>]*?)?(?:/>|>[\\s\\S]*?</c>)`);
  const m = xml.match(re);
  if (m) {
    const s = (m[1] || '').match(/\ss="\d+"/)?.[0] || '';
    return xml.slice(0, m.index) + isi(s) + xml.slice(m.index + m[0].length);
  }
  // Sel belum ada: sisipkan di barisnya menurut urutan kolom (templat resmi menyiapkan semua slot; ini cadangan).
  const rb = new RegExp(`<row r="${baris}"(\\s[^>]*?)?(/>|>([\\s\\S]*?)</row>)`);
  const r = xml.match(rb);
  if (!r) throw new Error(`Templat tidak memuat baris ${baris} (sel ${ref}).`);
  if (r[2] === '/>') return xml.slice(0, r.index) + `<row r="${baris}"${r[1] || ''}>${isi('')}</row>` + xml.slice(r.index + r[0].length);
  const sel = [...r[3].matchAll(/<c r="([A-Z]+)\d+"[\s\S]*?(?:\/>|<\/c>)/g)];
  const n = nomorKolom(ref), sesudah = sel.find(c => nomorKolom(c[1]) > n);
  const dalam = sesudah ? r[3].slice(0, sesudah.index) + isi('') + r[3].slice(sesudah.index) : r[3] + isi('');
  const awal = r[0].slice(0, r[0].length - r[3].length - '</row>'.length);
  return xml.slice(0, r.index) + awal + dalam + '</row>' + xml.slice(r.index + r[0].length);
}

/** Baris di lembar Info yang kolom A-nya berlabel itu (Kode MK, Nama MK, ...). */
function barisLabel(xml, label){
  const m = [...xml.matchAll(/<c r="A(\d+)"[^>]*t="inlineStr"[^>]*><is><t[^>]*>([^<]*)<\/t>/g)].find(x => x[2].trim() === label);
  if (!m) throw new Error(`Lembar Info tidak memuat label "${label}".`);
  return +m[1];
}

/**
 * Periksa struktur sebelum diisi. d = { cpl: [{kode, rumusan}], indikator: [{kode, cpl, teks}],
 *   cpmk: [{kode, rumusan, indikator: {kodeIndikator: bobot}}], sub: [{kode, cpmk, rumusan}],
 *   asesmen: [{nama}], bobot: {kodeSub: {namaAsesmen: bobot}} }. Hasil: daftar galat (kosong = sah).
 */
export function periksaStruktur(d){
  const g = [], uniq = (xs, apa) => { const s = new Set(); xs.forEach(x => { if (s.has(x)) g.push(`${apa} ganda: ${x}`); s.add(x); }); };
  for (const [k, n] of [['cpl', SLOT.cpl], ['indikator', SLOT.ind], ['cpmk', SLOT.cpmk], ['sub', SLOT.sub], ['asesmen', SLOT.item]])
    if ((d[k] || []).length > n) g.push(`Paling banyak ${n} ${k === 'sub' ? 'Sub-CPMK' : k === 'asesmen' ? 'butir asesmen' : k.toUpperCase()} di templat (ada ${d[k].length}).`);
  uniq((d.cpmk || []).map(c => c.kode), 'Kode CPMK'); uniq((d.sub || []).map(s => s.kode), 'Kode Sub-CPMK');
  uniq((d.asesmen || []).map(a => a.nama), 'Nama butir asesmen'); uniq((d.indikator || []).map(i => i.kode), 'Kode indikator');
  const cpmk = new Set((d.cpmk || []).map(c => c.kode)), ind = new Set((d.indikator || []).map(i => i.kode));
  const ases = new Set((d.asesmen || []).map(a => a.nama));
  for (const s of d.sub || []) {
    if (!cpmk.has(s.cpmk)) g.push(`${s.kode}: CPMK induk "${s.cpmk}" tidak ada.`);
    const b = d.bobot?.[s.kode] || {};
    if (!Object.values(b).some(v => +v > 0)) g.push(`${s.kode}: belum punya bobot pada butir asesmen mana pun.`);
    for (const a of Object.keys(b)) if (!ases.has(a)) g.push(`${s.kode}: butir asesmen "${a}" tidak ada.`);
  }
  for (const c of d.cpmk || []) {
    if (!(d.sub || []).some(s => s.cpmk === c.kode)) g.push(`${c.kode}: belum punya Sub-CPMK.`);
    const xs = Object.entries(c.indikator || {}).filter(([, v]) => +v > 0);
    if (!xs.length) g.push(`${c.kode}: belum dipetakan ke indikator CPL.`);
    for (const [k] of xs) if (!ind.has(k)) g.push(`${c.kode}: indikator "${k}" bukan indikator CPL mata kuliah ini.`);
  }
  for (const v of [...(d.cpmk || []).flatMap(c => Object.values(c.indikator || {})), ...Object.values(d.bobot || {}).flatMap(o => Object.values(o))])
    if (v !== '' && v != null && !(Number.isFinite(+v) && +v >= 0)) { g.push(`Bobot harus angka ≥ 0 (ada "${v}").`); break; }
  return g;
}

/**
 * Isi lembar-lembar templat. xml = { Info, Rumusan, Bobot_Butir, Bobot_Indikator, Nilai } (teks XML lembar);
 * d = struktur (periksaStruktur); info = { kode_mk, nama_mk, sks, semester, tahun_akademik, kurikulum, dosen, kelas }.
 * Hasil: xml baru dengan bentuk yang sama. Contoh isian templat dikosongkan.
 */
export function isiLembar(xml, d, info){
  const galat = periksaStruktur(d);
  if (galat.length) throw new Error('Struktur CPMK belum lengkap:\n- ' + galat.join('\n- '));
  let { Info: inf, Rumusan: rum, Bobot_Butir: bb, Bobot_Indikator: bi, Nilai: nl } = xml;
  const set = (x, c, r, v) => aturSel(x, kolom(c) + r, v);
  const angka = v => (v === '' || v == null || !(+v > 0)) ? null : +v;

  for (const [label, v] of [['Kode MK', info.kode_mk], ['Nama MK', info.nama_mk], ['SKS', info.sks == null || info.sks === '' ? null : +info.sks],
      ['Semester', info.semester], ['Tahun Akademik', info.tahun_akademik], ['Kurikulum', info.kurikulum],
      ['Dosen Koordinator', info.dosen], ['Tanggal pengisian', null], ['Kelas', info.kelas]])
    inf = set(inf, 2, barisLabel(inf, label), v ?? null);

  const cpl = d.cpl || [], ind = d.indikator || [], cpmk = d.cpmk || [], sub = d.sub || [], ases = d.asesmen || [];
  for (let i = 0; i < SLOT.cpl; i++) { const c = cpl[i];
    rum = set(rum, 1, BARIS.cpl + i, c ? `CPL-${c.kode}` : null); rum = set(rum, 2, BARIS.cpl + i, c?.rumusan || null); }
  for (let i = 0; i < SLOT.ind; i++) { const x = ind[i];
    rum = set(rum, 1, BARIS.ind + i, x?.kode || null); rum = set(rum, 2, BARIS.ind + i, x ? `CPL-${x.cpl}` : null);
    rum = set(rum, 3, BARIS.ind + i, x?.teks || null); }
  for (let i = 0; i < SLOT.cpmk; i++) { const c = cpmk[i];
    rum = set(rum, 1, BARIS.cpmk + i, c?.kode || null); rum = set(rum, 2, BARIS.cpmk + i, c?.rumusan || null); }
  for (let i = 0; i < SLOT.sub; i++) { const s = sub[i];
    rum = set(rum, 1, BARIS.sub + i, s?.kode || null); rum = set(rum, 2, BARIS.sub + i, s?.rumusan || null); }

  for (let j = 0; j < SLOT.item; j++) bb = set(bb, BB.kol + j, BB.judul, ases[j]?.nama || null);
  for (let i = 0; i < SLOT.sub; i++) {
    const s = sub[i], b = s ? d.bobot?.[s.kode] || {} : {};
    bb = set(bb, 2, BB.awal + i, s?.cpmk || null);
    for (let j = 0; j < SLOT.item; j++) bb = set(bb, BB.kol + j, BB.awal + i, s && ases[j] ? angka(b[ases[j].nama]) : null);
  }
  for (let i = 0; i < SLOT.cpmk; i++) {
    const c = cpmk[i];
    for (let j = 0; j < SLOT.ind; j++) bi = set(bi, BI.kol + j, BI.awal + i, c && ind[j] ? angka(c.indikator?.[ind[j].kode]) : null);
  }
  for (let i = 0; i < SLOT.mhs; i++) {
    nl = set(nl, 1, NL.awal + i, null); nl = set(nl, 2, NL.awal + i, null);
    for (let j = 0; j < SLOT.item; j++) nl = set(nl, NL.kol + j, NL.awal + i, null);
  }
  return { Info: inf, Rumusan: rum, Bobot_Butir: bb, Bobot_Indikator: bi, Nilai: nl };
}

/** Jalur berkas XML tiap lembar dari workbook.xml dan relasinya. */
export function jalurLembar(workbookXml, relsXml){
  const rel = Object.fromEntries([...relsXml.matchAll(/<Relationship\b[^>]*>/g)].map(m => {
    const id = m[0].match(/\bId="([^"]+)"/)?.[1], t = m[0].match(/\bTarget="([^"]+)"/)?.[1] || '';
    return [id, t.replace(/^\//, '').replace(/^(?!xl\/)/, 'xl/')];
  }));
  return Object.fromEntries([...workbookXml.matchAll(/<sheet\b[^>]*>/g)].map(m =>
    [m[0].match(/\bname="([^"]+)"/)?.[1], rel[m[0].match(/\br:id="([^"]+)"/)?.[1]]]));
}

/** Isi templat di objek JSZip (peramban atau Node). Mengubah zip di tempat; hasil zip yang sama.
 *  Muat zip dengan JSZip.loadAsync(data, { createFolders: false }) supaya tidak muncul entri folder. */
export async function isiTemplat(zip, d, info){
  const jalur = jalurLembar(await zip.file('xl/workbook.xml').async('string'), await zip.file('xl/_rels/workbook.xml.rels').async('string'));
  const xml = {};
  for (const n of LEMBAR) {
    if (!jalur[n] || !zip.file(jalur[n])) throw new Error(`Templat tidak memuat lembar ${n}.`);
    xml[n] = await zip.file(jalur[n]).async('string');
  }
  const baru = isiLembar(xml, d, info);
  for (const n of LEMBAR) zip.file(jalur[n], baru[n], { createFolders: false });   // tanpa entri folder baru: isi zip sama dengan templat
  return zip;
}

/** Nama berkas unduhan: CPL_<kode>_<kelas>_<TA>_<semester>.xlsx */
export const namaBerkasTemplat = i => `CPL_${i.kode_mk}_${i.kelas || 'kelas'}_${String(i.tahun_akademik || '').replace('/', '-')}_${i.semester || ''}.xlsx`
  .replace(/[^\w.-]+/g, '_');
