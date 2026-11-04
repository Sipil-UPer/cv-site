/* =====================================================================
   LKPS — Laporan Kinerja Program Studi (LAM Teknik, APS Akademik/Vokasi,
   "pasca akreditasi pertama dan unggul"), templat resmi lkps-template.xlsx.
   ---------------------------------------------------------------------
   Dipanggil dari tombol "Unduh LKPS (.xlsx)" di skor.html, khusus admin
   (pemilik 2026-11-04). Berkas disusun di browser admin, jadi data yang
   tidak publik tidak pernah masuk data.json.

   Templat TIDAK diubah lewat pustaka spreadsheet (openpyxl membuang daftar
   pilihan berformat x14): nilai ditulis langsung ke XML sel, gaya sel
   dipertahankan, sel berumus tidak pernah ditimpa, dan Excel diminta
   menghitung ulang rumus saat berkas dibuka.

   Tahap 1 mengisi Menu, 3b, 3c, 4d, 6a, 6b, 6e1, 6f1, 6f2, 6g1, 6g2 dari
   angka yang sama dengan halaman skor. Lembar lain dibiarkan untuk diisi
   prodi; kolom yang tidak disimpan situs (mis. pita waktu tunggu) kosong.
   ===================================================================== */
const TEMPLATE = 'lkps-template.xlsx';
const JSZIP = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';

// Urutan baris 6.g.2 di templat (B7..B13), kunci = ASPEK_KEPUASAN.
const BARIS_KEPUASAN = ['etika', 'keahlian_bidang_ilmu', 'bahasa_asing', 'teknologi_informasi',
                        'komunikasi', 'kerja_sama_tim', 'pengembangan_diri'];
const KOLOM_TS = ['C', 'D', 'E'];                 // TS-2, TS-1, TS pada 3b, 3c, 4d, 6e1
const NA = ['na1', 'na2', 'na3', 'na4', 'nb1', 'nb2', 'nb3'];

// Tanggal Excel (serial, sistem 1900) untuk 31 Agustus tahun TS.
export function serialTS(ts){
  return Math.round((Date.UTC(ts, 7, 31) - Date.UTC(1899, 11, 30)) / 86400000);
}

/* ---------------------------------------------------------------------
   Peta isian: { namaLembar: { 'C9': nilai, ... } }. Murni, tanpa DOM.
   C = { D (data.json), ts, prodi, institusi, rencanaKepuasan: {aspek: teks} }
   --------------------------------------------------------------------- */
export function petaLKPS(C){
  const { D, ts } = C;
  const A = (D && D.akreditasi) || {};
  const peta = {};
  const set = (lembar, ref, v) => {
    if (v == null || v === '' || (typeof v === 'number' && !Number.isFinite(v))) return;
    (peta[lembar] ||= {})[ref] = v;
  };
  const tsKe = [ts - 2, ts - 1, ts];

  // Menu: identitas dan TS (acuan semua rumus TS-2/TS-1/TS)
  set('Menu', 'H7', C.institusi);
  set('Menu', 'H11', 'Sarjana');
  set('Menu', 'H23', C.prodi);
  set('Menu', 'S73', { tanggal: serialTS(ts) });

  // 3.b / 3.c: jumlah judul per sumber pembiayaan (baris PT+mandiri, DN, LN)
  for (const [lembar, kategori, baris0] of [['3b', 'penelitian', 9], ['3c', 'pkm', 10]]){
    const rows = (A.sumber_dana || []).filter(r => r.kategori === kategori);
    tsKe.forEach((t, i) => {
      const r = rows.find(x => x.tahun === t) || {};
      set(lembar, `${KOLOM_TS[i]}${baris0}`, r.pt_mandiri || 0);
      set(lembar, `${KOLOM_TS[i]}${baris0 + 1}`, r.dalam_negeri || 0);
      set(lembar, `${KOLOM_TS[i]}${baris0 + 2}`, r.luar_negeri || 0);
    });
  }

  // 4.d / 6.e.1: publikasi per jenis NA1..NB3 (baris 7..13)
  for (const [lembar, kunci] of [['4d', 'publikasi_dtps'], ['6e1', 'publikasi_mhs']]){
    const rows = A[kunci] || [];
    tsKe.forEach((t, i) => {
      const r = rows.find(x => x.tahun === t) || {};
      NA.forEach((k, j) => set(lembar, `${KOLOM_TS[i]}${7 + j}`, r[k] || 0));
    });
  }

  // 6.a: satu baris prodi yang diakreditasi; asing dicatat penuh waktu
  // (situs tidak membedakan penuh/paruh waktu).
  const ta = A.ta || [];
  set('6a', 'B7', C.prodi);
  set('6a', 'C7', 'V');
  tsKe.forEach((t, i) => {
    const r = ta.find(x => x.tahun_ts === t);
    if (!r) return;
    set('6a', `${'DEF'[i]}7`, r.mahasiswa_aktif);
    set('6a', `${'GHI'[i]}7`, r.mahasiswa_asing);
  });

  // 6.b: lulusan dan rerata IPK per TS (min/maks tidak disimpan situs)
  tsKe.forEach((t, i) => {
    const r = ta.find(x => x.tahun_ts === t);
    if (!r || !r.lulusan) return;
    set('6b', `C${6 + i}`, r.lulusan);
    set('6b', `E${6 + i}`, r.rerata_ipk);
  });

  // 6.f.1 (bagian Sarjana, baris 31-32), 6.f.2, 6.g.1: tahun lulus TS-2, TS-1
  const tracer = D.tracer || [];
  [ts - 2, ts - 1].forEach((t, i) => {
    const r = tracer.find(x => x.tahun_lulus === t);
    if (!r) return;
    set('6f1', `B${31 + i}`, r.lulusan);
    set('6f1', `C${31 + i}`, r.terlacak);
    set('6f2', `B${7 + i}`, r.lulusan);
    set('6f2', `C${7 + i}`, r.terlacak);
    set('6g1', `B${7 + i}`, r.lulusan);
    set('6g1', `D${7 + i}`, r.terlacak);
    set('6g1', `E${7 + i}`, r.kerja_wilayah);
    set('6g1', `F${7 + i}`, r.kerja_nasional);
    set('6g1', `G${7 + i}`, r.kerja_internasional);
  });

  // 6.g.2: tujuh aspek untuk TS, beserta rencana tindak lanjut
  const kp = (A.kepuasan || []).filter(r => r.tahun_ts === ts);
  BARIS_KEPUASAN.forEach((a, j) => {
    const r = kp.find(x => x.aspek === a);
    if (!r) return;
    const b = 7 + j;
    set('6g2', `C${b}`, r.sangat_baik);
    set('6g2', `D${b}`, r.baik);
    set('6g2', `E${b}`, r.cukup);
    set('6g2', `F${b}`, r.kurang);
    set('6g2', `G${b}`, (C.rencanaKepuasan || {})[a]);
  });
  return peta;
}

/* ---------------------------------------------------------------------
   Penulis sel pada XML worksheet (string, tanpa DOM; diuji di Node).
   --------------------------------------------------------------------- */
const escXml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function indeksKolom(ref){
  const huruf = /^[A-Z]+/.exec(ref)[0];
  return [...huruf].reduce((n, h) => n * 26 + h.charCodeAt(0) - 64, 0);
}

function selBaru(ref, s, v){
  const gaya = s ? ` s="${s}"` : '';
  if (typeof v === 'number') return `<c r="${ref}"${gaya}><v>${v}</v></c>`;
  if (v && typeof v === 'object' && 'tanggal' in v) return `<c r="${ref}"${gaya}><v>${v.tanggal}</v></c>`;
  return `<c r="${ref}"${gaya} t="inlineStr"><is><t xml:space="preserve">${escXml(v)}</t></is></c>`;
}

export function tulisSel(xml, ref, v){
  const baris = +/\d+$/.exec(ref)[0];
  const reBaris = new RegExp(`<row r="${baris}"(?=[\\s>/])[^>]*?(?:/>|>[\\s\\S]*?</row>)`);
  const m = reBaris.exec(xml);
  if (!m){
    // baris belum ada: sisipkan menurut urutan nomor baris
    const baru = `<row r="${baris}">${selBaru(ref, null, v)}</row>`;
    const reSemua = /<row r="(\d+)"/g;
    let x, pos = -1;
    while ((x = reSemua.exec(xml))) if (+x[1] > baris){ pos = x.index; break; }
    if (pos < 0) pos = xml.indexOf('</sheetData>');
    if (pos < 0) throw new Error('sheetData tidak ditemukan');
    return xml.slice(0, pos) + baru + xml.slice(pos);
  }
  let row = m[0];
  if (row.endsWith('/>')) row = row.slice(0, -2) + '></row>';
  const reSel = new RegExp(`<c r="${ref}"(?=[\\s>/])[^>]*?(?:/>|>[\\s\\S]*?</c>)`);
  const c = reSel.exec(row);
  let rowBaru;
  if (c){
    if (/<f[\s>]/.test(c[0])) throw new Error(`${ref} berisi rumus; tidak ditimpa`);
    const s = (/\ss="(\d+)"/.exec(c[0]) || [])[1];
    rowBaru = row.slice(0, c.index) + selBaru(ref, s, v) + row.slice(c.index + c[0].length);
  } else {
    // sel belum ada: sisipkan menurut urutan kolom
    const k = indeksKolom(ref);
    const reSemua = /<c r="([A-Z]+)\d+"/g;
    let x, pos = -1;
    while ((x = reSemua.exec(row))) if (indeksKolom(x[1]) > k){ pos = x.index; break; }
    if (pos < 0) pos = row.lastIndexOf('</row>');
    rowBaru = row.slice(0, pos) + selBaru(ref, null, v) + row.slice(pos);
  }
  return xml.slice(0, m.index) + rowBaru + xml.slice(m.index + m[0].length);
}

// Excel menghitung ulang semua rumus saat berkas dibuka.
export function hitungUlangSaatBuka(workbookXml){
  if (/<calcPr\b/.test(workbookXml))
    return workbookXml.replace(/<calcPr\b([^>]*?)(\/?)>/, (m, a, tutup) =>
      `<calcPr${a.replace(/\sfullCalcOnLoad="[^"]*"/, '')} fullCalcOnLoad="1"${tutup}>`);
  return workbookXml.replace('</workbook>', '<calcPr fullCalcOnLoad="1"/></workbook>');
}

// nama lembar -> path XML di dalam zip
export function petaLembar(workbookXml, relsXml){
  const rels = {};
  for (const m of relsXml.matchAll(/<Relationship\b[^>]*>/g)){
    const id = /\bId="([^"]+)"/.exec(m[0])?.[1], t = /\bTarget="([^"]+)"/.exec(m[0])?.[1];
    if (id && t) rels[id] = t.startsWith('/') ? t.slice(1) : 'xl/' + t.replace(/^\.\//, '');
  }
  const out = {};
  for (const m of workbookXml.matchAll(/<sheet\b[^>]*>/g)){
    const nama = /\bname="([^"]+)"/.exec(m[0])?.[1];
    const rid = /\br:id="([^"]+)"/.exec(m[0])?.[1];
    if (nama && rels[rid]) out[nama.replace(/&amp;/g, '&')] = rels[rid];
  }
  return out;
}

/* ---------------------------------------------------------------------
   Susun berkas: templat -> isi -> unduh.
   --------------------------------------------------------------------- */
export async function buatLKPS(C, opsi = {}){
  const { default: JSZip } = await import(JSZIP);
  const r = await fetch(TEMPLATE, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`templat ${TEMPLATE} tidak terbaca (${r.status})`);
  const zip = await JSZip.loadAsync(await r.arrayBuffer());
  const wb = await zip.file('xl/workbook.xml').async('string');
  const lembar = petaLembar(wb, await zip.file('xl/_rels/workbook.xml.rels').async('string'));
  const peta = petaLKPS(C);
  let n = 0;
  for (const [nama, sel] of Object.entries(peta)){
    const path = lembar[nama];
    if (!path) throw new Error(`lembar ${nama} tidak ada di templat`);
    let xml = await zip.file(path).async('string');
    for (const [ref, v] of Object.entries(sel)){ xml = tulisSel(xml, ref, v); n++; }
    zip.file(path, xml);
  }
  zip.file('xl/workbook.xml', hitungUlangSaatBuka(wb));
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const nama = `LKPS-${(C.prodi || 'prodi').replace(/[^\w-]+/g, '_')}-TS${C.ts}.xlsx`;
  if (opsi.unduh !== false){
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nama;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }
  return { nama, sel: n, lembar: Object.keys(peta), blob };
}
