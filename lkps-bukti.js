/* =====================================================================
   lkps-bukti.js — Indeks Bukti LKPS (pemilik 2026-11-05): dokumen Word berisi
   No tabel LKPS, item, dan link, untuk 44 tabel wajib Sarjana. Sebagian besar
   tabel LAM tidak punya kolom link, jadi tautan buktinya dikumpulkan di sini.
   Tabel tanpa bukti tetap tampil dengan sel kosong.

   Sumber tautan: bukti karya (karya_bukti, DOI, tautan karya), bukti baris
   Data prodi (lkps_bukti, tautan_bukti), dan dokumen pustaka sesuai tabelnya.
   Pemilihan baris mengikuti lkps.js petaDaftar (jendela TS, kategori karya).
   ===================================================================== */
import { versiUntukTS } from './pustaka-dokumen.js?v=2026-11-10-7efbdb';
import { JSZIP } from './lkps.js?v=2026-11-10-7efbdb';
import { labelDokumenLED } from './led-isi.js?v=2026-11-10-7efbdb';
import { barisKerjaSama } from './kerjasama-karya.js?v=2026-11-10-7efbdb';
import { karya4i } from './sitasi.js?v=2026-11-10-7efbdb';

const OUTLINE = 'lkps-outline.json';
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

// Dokumen pustaka yang menjadi bukti tiap tabel.
const JENIS_LEMBAR = {
  PS: ['sk_akreditasi_prodi'], 1: ['sk_vmts', 'statuta', 'renstra_pt', 'renstra_upps'],
  '2a1': ['pedoman_kerjasama'], '2b': ['laporan_keuangan', 'laporan_audit_keuangan'],
  '3a1': ['kurikulum', 'sk_kurikulum'], '3a3': ['pedoman_integrasi'], '3a5': ['panduan_capstone'],
  '3b': ['peta_jalan_penelitian'], '3c': ['peta_jalan_pkm'], '4c': ['rekap_bkd'], '5a': ['pedoman_sarpras'],
  '5b': ['kebijakan_k3l', 'dokumen_k3l'], '6f1': ['laporan_tracer'], '6f2': ['laporan_tracer'], '6g1': ['laporan_tracer'],
  '6g2': ['survei_pengguna'],
  '7a': ['kebijakan_spmi', 'manual_spmi', 'standar_spmi', 'tata_cara_dokumentasi_spmi'],
};
// Tabel Data prodi yang bukti barisnya langsung masuk indeks.
const TABEL_LEMBAR = {
  PS: 'lkps_prodi_upps', '2b': 'lkps_penggunaan_dana', '4b': 'lkps_tendik', '4c': 'lkps_bkd', '5a': 'lkps_prasarana',
  '5b': 'lkps_dokumen_k3l', '5c': 'lkps_fasilitas_k3l', '6a': 'lkps_mahasiswa_ta', '6b': 'lkps_mahasiswa_ta',
  '6d': 'lkps_kohort_lulusan', '6e1': 'lkps_publikasi_mahasiswa', '6f1': 'lkps_tracer_lulusan', '6f2': 'lkps_tracer_lulusan',
  '6g1': 'lkps_tracer_lulusan', '6g2': 'lkps_kepuasan_pengguna',
};
const LUARAN = { '4f-1': ['paten', 'paten_sederhana'], '4f-2': ['hak_cipta', 'desain_industri', 'merek'],
                 '4f-3': ['ttg', 'produk'], '4f-4': ['buku_isbn', 'book_chapter'] };
const LUARAN_MHS = { '6e3-1': ['paten', 'paten_sederhana'], '6e3-2': ['hak_cipta', 'desain_industri', 'merek'],
                     '6e3-3': ['ttg', 'produk'], '6e3-4': ['buku_isbn', 'book_chapter'] };
const TAHAP = [['penetapan', 'Penetapan'], ['pelaksanaan', 'Pelaksanaan'], ['evaluasi', 'Evaluasi'],
               ['pengendalian', 'Pengendalian'], ['peningkatan', 'Peningkatan']];

const idDrive = u => (String(u || '').match(/\/d\/([A-Za-z0-9_-]{20,})/) || [])[1] || '';
const catatanPrivat = C => 'Berkas privat, dibuka dengan kata sandi' + (C.sandiLkd ? `: ${C.sandiLkd}` : ' yang diberikan terpisah.');
const unik = xs => { const s = new Set(); return xs.filter(x => x.url && !s.has(x.url) && s.add(x.url)); };

export function indeksBukti(C, wajib){
  const X = C.daftar || {}, ts = C.ts, dok = C.dokumen || X.dokumen || [];
  const tsKarya = k => (+k.bulan >= 9 ? +k.tahun + 1 : +k.tahun);
  const karya = (X.karya || []).filter(k => tsKarya(k) >= ts - 2 && tsKarya(k) <= ts)
    .sort((a, b) => tsKarya(a) - tsKarya(b) || String(a.judul).localeCompare(String(b.judul)));
  const buktiBaris = X.buktiBaris || [];
  const urlBaris = b => b.url || (b.dokumen && b.dokumen.url) || '';
  const labelBaris = b => b.dokumen && b.dokumen.jenis ? labelDokumenLED(b.dokumen) : (b.judul || 'Bukti');
  const barisDari = (t, id) => buktiBaris.filter(b => b.tabel === t && (id == null || b.baris_id === id))
    .map(b => ({ t: labelBaris(b), url: urlBaris(b) }));
  const perId = new Map((X.karya || []).map(k => [k.id, k]));
  const tautanKarya = k => {
    const kb = (X.buktiKarya || []).filter(b => b.karya_id === k.id).map(b => ({ t: b.judul || 'Bukti', url: b.url }));
    const induk = k.induk_id && perId.get(k.induk_id);
    return unik([...kb, ...(k.doi ? [{ t: 'DOI', url: `https://doi.org/${String(k.doi).replace(/^https?:\/\/doi\.org\//, '')}` }] : []),
      ...(k.url ? [{ t: 'Tautan', url: k.url }] : []), ...(k.bukti_url ? [{ t: 'Bukti', url: k.bukti_url }] : []),
      ...(induk ? (X.buktiKarya || []).filter(b => b.karya_id === induk.id).map(b => ({ t: b.judul || 'Bukti induk', url: b.url })) : [])]);
  };
  const itemKarya = xs => xs.map(k => ({ item: `${k.judul} (${k.tahun})`, tautan: tautanKarya(k) }));
  const mk = (X.mk || []).filter(m => m.aktif !== false)
    .sort((a, b) => ((a.semester ?? 99) - (b.semester ?? 99)) || String(a.kode).localeCompare(String(b.kode)));
  const itemMK = xs => xs.map(m => ({ item: `${m.kode} ${m.nama}`, tautan: unik([
    ...dok.filter(d => d.jenis === 'rps' && String(d.judul || '').includes(m.kode)).map(d => ({ t: 'RPS', url: d.url })),
    ...(m.rps_url ? [{ t: 'RPS', url: m.rps_url }] : []), ...barisDari('ref_mata_kuliah', m.id)]) }));
  const unggul = k => (k.kategori === 'publikasi' && ['jurnal', 'prosiding'].includes(k.jenis) && /^(scopus|wos)/.test(k.indeksasi || ''))
    || (k.kategori === 'luaran' && k.sub_jenis === 'paten');
  const urlDok = id => { const d = dok.find(x => x.id === id); return d ? d.url : ''; };
  const itemKS = (jenis, kat) => [
    ...(X.kerjasama || []).filter(k => k.jenis === jenis && (!k.tahun_selesai || +k.tahun_selesai >= ts - 2))
      .map(k => ({ item: `${k.mitra}${k.kegiatan ? ` — ${k.kegiatan}` : ''}`, tautan: unik([
        ...(k.tautan_bukti ? [{ t: 'Bukti', url: k.tautan_bukti }] : []), ...barisDari('lkps_kerjasama', k.id)]) })),
    ...(kat ? itemKSKarya(kat) : [])];
  // Kerja sama dari karya (kerjasama-karya.js, pemilik 2026-11-10): satu item
  // per kegiatan atau per publikasi tanpa payung; publikasi/luaran berpayung
  // menjadi bukti luaran kegiatannya.
  const itemKSKarya = kat => {
    const kelompok = new Map();
    barisKerjaSama((X.karya || []).filter(k => k.status === 'terverifikasi'), new Map((X.kerjasama || []).map(k => [k.id, k])))
      .filter(b => b.kategori === kat && b.ts >= ts - 2 && b.ts <= ts)
      .forEach(b => {
        const g = kelompok.get(b.karya.id) || kelompok.set(b.karya.id, { b, mitra: [] }).get(b.karya.id);
        if (!g.mitra.includes(b.mitra)) g.mitra.push(b.mitra);
      });
    return [...kelompok.values()].map(({ b, mitra }) => ({ item: `${mitra.join(', ') || 'Mitra'} — ${b.judul}`,
      tautan: unik([...tautanKarya(b.karya),
        ...b.luaran.flatMap(l => tautanKarya(l).map(x => ({ t: `Luaran: ${x.t}`, url: x.url })))]) }));
  };
  const prestasi = awal => (X.prestasi || []).filter(p => (p.bidang || '').startsWith(awal))
    .filter(p => { const t = +p.bulan >= 9 ? +p.tahun + 1 : +p.tahun; return t >= ts - 4 && t <= ts; })
    .map(p => ({ item: `${p.nama_kegiatan} (${p.tahun})`, tautan: unik([
      ...(p.tautan_bukti ? [{ t: 'Bukti', url: p.tautan_bukti }] : []), ...barisDari('lkps_prestasi_mahasiswa', p.id)]) }));

  const khusus = {
    1: () => (X.vmts || []).map(r => ({ item: { pt: 'VMTS perguruan tinggi', upps: 'VMTS UPPS', ps: 'Visi keilmuan PS' }[r.jenis] || r.jenis,
      tautan: unik([...(r.tautan ? [{ t: r.nomor_sk || 'Dokumen', url: r.tautan }] : []), ...barisDari('lkps_vmts', r.id)]) })),
    '2a1': () => itemKS('pendidikan', null), '2a2': () => itemKS('penelitian', 'penelitian'), '2a3': () => itemKS('pkm', 'pkm'),
    '3a1': () => itemMK(mk), '3a4': () => itemMK(mk.filter(m => m.basic_science)), '3a5': () => itemMK(mk.filter(m => m.capstone)),
    '3a3': () => itemKarya(karya.filter(k => k.kategori === 'integrasi')),
    '3b': () => itemKarya(karya.filter(k => k.kategori === 'penelitian')), '3c': () => itemKarya(karya.filter(k => k.kategori === 'pkm')),
    '4d': () => itemKarya(karya.filter(k => k.kategori === 'publikasi')), '4h': () => itemKarya(karya.filter(unggul)),
    '4i': () => itemKarya(karya4i(X.karya, ts).map(x => x.k)),
    '4j': () => itemKarya(karya.filter(k => k.kategori === 'rekognisi')),
    '6c1': () => prestasi('akademik'), '6c2': () => prestasi('non'),
    '6h1': () => itemKarya(karya.filter(k => k.kategori === 'penelitian' && (k.karya_mahasiswa || []).length)),
    '6i': () => itemKarya(karya.filter(k => k.kategori === 'pkm' && (k.karya_mahasiswa || []).length)),
    '7b': () => TAHAP.map(([k, n]) => [(X.ppepp || []).find(r => r.tahap === k), n]).filter(([r]) => r).map(([r, n]) => ({ item: n, tautan: unik([
      { t: 'Dokumen', url: urlDok(r.dokumen_id) }, { t: 'Laporan audit', url: urlDok(r.audit_dokumen_id) },
      { t: 'Laporan RTM', url: urlDok(r.rtm_dokumen_id) }, { t: 'Peningkatan', url: urlDok(r.peningkatan_dokumen_id) }]) })),
  };
  Object.entries(LUARAN).forEach(([l, js]) => { khusus[l] = () => itemKarya(karya.filter(k => k.kategori === 'luaran' && js.includes(k.sub_jenis))); });
  Object.entries(LUARAN_MHS).forEach(([l, js]) => { khusus[l] = () => (X.luaranMhs || []).filter(x => js.includes(x.jenis) && +x.tahun >= ts - 2 && +x.tahun <= ts)
    .map(x => ({ item: `${x.judul || 'Luaran'} (${x.tahun})`, tautan: unik([...(x.bukti_url ? [{ t: 'Bukti', url: x.bukti_url }] : []), ...barisDari('lkps_luaran_mahasiswa', x.id)]) })); });

  // 4.c: LKD privat, dibuka asesor di lkd.html dengan kata sandi (pemilik 2026-11-06).
  // Kata sandi diketik saat mengunduh dan hanya tertulis di berkas ini.
  const namaDosen = n => ((X.dosen || []).find(d => d.nidn === n) || {}).nama || n;
  const catatanLKD = catatanPrivat(C);
  khusus['4c'] = () => (X.bkd || []).filter(b => b.tahun_akademik === `${ts - 1}/${ts}` && idDrive(b.bukti_url))
    .sort((a, b) => namaDosen(a.nidn).localeCompare(namaDosen(b.nidn)) || String(a.semester).localeCompare(String(b.semester)))
    .map(b => ({ item: `${namaDosen(b.nidn)}, ${b.tahun_akademik} ${b.semester}`, catatan: catatanLKD,
      tautan: [{ t: 'LKD (berkas privat)', url: `${C.basisUrl ?? ''}lkd.html?f=${idDrive(b.bukti_url)}` }] }));

  return wajib.map(w => {
    const dokumen = (JENIS_LEMBAR[w.nama] || []).map(j => versiUntukTS(dok, j, ts)).filter(d => d && d.url)
      .map(d => ({ item: labelDokumenLED(d), tautan: [{ t: 'Dokumen', url: d.url }] }));
    const baris = TABEL_LEMBAR[w.nama]
      ? unik(barisDari(TABEL_LEMBAR[w.nama])).map(x => ({ item: x.t, tautan: [{ t: 'Bukti', url: x.url }] })) : [];
    const items = [...dokumen, ...baris, ...(khusus[w.nama] ? khusus[w.nama]() : [])];
    return { nama: w.nama, judul: w.judul, items };
  });
}

const xe = s => String(s ?? '').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r = (t, o = {}) => `<w:r><w:rPr>${o.b ? '<w:b/>' : ''}${o.link ? '<w:color w:val="0563C1"/><w:u w:val="single"/>' : ''}${o.warna ? `<w:color w:val="${o.warna}"/>` : ''}<w:sz w:val="${o.sz || 18}"/></w:rPr><w:t xml:space="preserve">${xe(t)}</w:t></w:r>`;
const p = isi => `<w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr>${isi}</w:p>`;
const LEBAR = [2500, 4600, 2500];
const sel = (i, isi, o = {}) => `<w:tc><w:tcPr><w:tcW w:w="${LEBAR[i]}" w:type="dxa"/>${o.gabung ? `<w:vMerge${o.gabung === 'awal' ? ' w:val="restart"' : ''}/>` : ''}${o.kepala ? '<w:shd w:val="clear" w:color="auto" w:fill="1F3864"/>' : ''}</w:tcPr>${isi}</w:tc>`;

// document.xml dan relasinya.
export function dokumenXml(indeks, C){
  const rels = [];
  const tautan = (url, t) => {
    const id = `rId${rels.length + 10}`;
    rels.push(`<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${xe(url)}" TargetMode="External"/>`);
    return `<w:hyperlink r:id="${id}" w:history="1">${r(t, { link: true })}</w:hyperlink>`;
  };
  const kepala = `<w:tr><w:trPr><w:tblHeader/></w:trPr>${['No tabel LKPS', 'Item', 'Link'].map((t, i) => sel(i, p(r(t, { b: true, warna: 'FFFFFF' })), { kepala: true })).join('')}</w:tr>`;
  const baris = indeks.flatMap(x => {
    const items = x.items.length ? x.items : [{ item: '', tautan: [] }];
    return items.map((it, i) => `<w:tr><w:trPr><w:cantSplit/></w:trPr>${
      sel(0, p(i ? '' : r(x.judul, { b: true })), items.length > 1 ? { gabung: i ? 'lanjut' : 'awal' } : {})}${
      sel(1, p(r(it.item)))}${
      sel(2, (it.tautan.length ? it.tautan.map(l => p(tautan(l.url, l.t))).join('') : p('')) + (it.catatan || it.tautan.some(l => /lkd\.html\?f=/.test(l.url)) ? p(r(it.catatan || catatanPrivat(C))) : ''))}</w:tr>`);
  }).join('');
  const garis = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(s => `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="808080"/>`).join('');
  const judul = `Indeks Bukti LKPS ${C.prodi || ''} TS ${C.ts}`.replace(/\s+/g, ' ');
  const adaLink = indeks.filter(x => x.items.some(i => i.tautan.length)).length;
  const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>` +
    `<w:p><w:pPr><w:spacing w:after="60"/></w:pPr>${r(judul, { b: true, sz: 28, warna: '1F3864' })}</w:p>` +
    `<w:p><w:pPr><w:spacing w:after="160"/></w:pPr>${r(`${adaLink} dari ${indeks.length} tabel wajib Sarjana LAM Teknik memiliki tautan bukti. Sel kosong berarti belum ada bukti di sistem.`, { warna: '595959' })}</w:p>` +
    `<w:tbl><w:tblPr><w:tblW w:w="9600" w:type="dxa"/><w:tblBorders>${garis}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr>` +
    `<w:tblGrid>${LEBAR.map(w => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${kepala}${baris}</w:tbl>` +
    `<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  return { xml, rels: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels.join('')}</Relationships>`, tautan: rels.length };
}

export function bagianDocx(indeks, C){
  const { xml, rels, tautan } = dokumenXml(indeks, C);
  return { tautan, bagian: {
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
    'word/document.xml': xml, 'word/_rels/document.xml.rels': rels } };
}

export async function buatIndeksBukti(C, opsi = {}){
  const { default: JSZip } = await import(JSZIP);
  const res = await fetch(OUTLINE, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${OUTLINE} tidak terbaca (${res.status})`);
  const K = await res.json();
  if (!K.wajib) throw new Error('Halaman ini versi lama. Tekan Ctrl+Shift+R lalu unduh lagi.');
  const basisUrl = new URL('.', location.href).href;
  const indeks = indeksBukti({ ...C, basisUrl, dokumen: C.daftar.dokumen }, K.wajib);
  const { bagian, tautan } = bagianDocx(indeks, C);
  const zip = new JSZip();
  for (const [f, isi] of Object.entries(bagian)) zip.file(f, isi);
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', mimeType: DOCX });
  const nama = `Indeks-Bukti-LKPS-${(C.prodi || 'prodi').replace(/[^\w-]+/g, '_')}-TS${C.ts}.docx`;
  if (opsi.unduh !== false) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nama;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }
  return { nama, sel: tautan, lembar: indeks.map(x => x.nama), blob };
}
