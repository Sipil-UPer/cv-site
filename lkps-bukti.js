/* =====================================================================
   lkps-bukti.js — Indeks Bukti LKPS (pemilik 2026-11-05): dokumen Word berisi
   No tabel LKPS, item, dan link, untuk 44 tabel wajib Sarjana. Sebagian besar
   tabel LAM tidak punya kolom link, jadi tautan buktinya dikumpulkan di sini.
   Tabel tanpa bukti tetap tampil dengan sel kosong.

   Sumber tautan: bukti karya (karya_bukti, DOI, tautan karya), bukti baris
   Data prodi (lkps_bukti, tautan_bukti), dan dokumen pustaka sesuai tabelnya.
   Pemilihan baris mengikuti lkps.js petaDaftar (jendela TS, kategori karya).
   ===================================================================== */
import { versiUntukTS } from './pustaka-dokumen.js?v=2026-11-27-50c79d';
import { JSZIP } from './lkps.js?v=2026-11-27-50c79d';
import { labelDokumenLED } from './led-isi.js?v=2026-11-27-50c79d';
import { barisKerjaSama } from './kerjasama-karya.js?v=2026-11-27-50c79d';
import { karya4i, tautanPengutip } from './sitasi.js?v=2026-11-27-50c79d';
import { POS_A5, labelPos } from './keuangan-a5.js?v=2026-11-27-50c79d';

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
  // LKPS LAMDEPILAR Magister (TABEL_LAMDEPILAR di bawah).
  'D.1': ['sk_akreditasi_prodi'], 'E.1.1': ['data_mahasiswa'], 'E.2.1': ['kurikulum', 'sk_kurikulum'],
  'E.3.1': ['monev_pembelajaran'], 'E.4.1': ['kurikulum', 'evaluasi_kurikulum'], 'E.4.2': ['kurikulum', 'laporan_cpl'],
  'P.1.3': ['rekap_bkd'], 'L.1.1': ['pedoman_sarpras'], 'L.4.1': ['laporan_tracer'], 'A.1': ['pedoman_kerjasama'],
  'A.5.1': ['laporan_keuangan', 'laporan_audit_keuangan'], 'A.5.2': ['laporan_keuangan', 'laporan_audit_keuangan'],
};
// Tabel Data prodi yang bukti barisnya langsung masuk indeks.
const TABEL_LEMBAR = {
  PS: 'lkps_prodi_upps', '2b': 'lkps_penggunaan_dana', '4b': 'lkps_tendik', '4c': 'lkps_bkd', '5a': 'lkps_prasarana',
  '5b': 'lkps_dokumen_k3l', '5c': 'lkps_fasilitas_k3l', '6a': 'lkps_mahasiswa_ta', '6b': 'lkps_mahasiswa_ta',
  '6d': 'lkps_kohort_lulusan', '6e1': 'lkps_publikasi_mahasiswa', '6f1': 'lkps_tracer_lulusan', '6f2': 'lkps_tracer_lulusan',
  '6g1': 'lkps_tracer_lulusan', '6g2': 'lkps_kepuasan_pengguna',
  'D.1': 'lkps_prodi_upps', 'E.1.1': 'lkps_mahasiswa_angkatan', 'P.1.2': 'lkps_bimbingan_utama', 'P.1.3': 'lkps_bkd',
  'P.1.7': 'lkps_tendik', 'L.4.1': 'lkps_tracer_lulusan',
};
// LKPS LAMDEPILAR (pemilik 2026-11-24): tabel yang diisi program Magister, urut templat resmi. Tidak dimuat:
// E.1.3 dan A.5.3 (rumus templat), L.4.2, A.5.4-A.5.6, R.3.2, R.6.2 (Diploma/Terapan). R.3.1/R.6.1 tabelnya
// ditunda tetapi karya terverifikasi TS-2..TS tetap dicantumkan sebagai bukti (pemilik 2026-11-24).
export const TABEL_LAMDEPILAR = [
  ['D.1', 'Tabel D.1 Daftar Program Studi di Unit Pengelola Program Studi (UPPS)'],
  ['E.1.1', 'Tabel E.1.1 Mahasiswa Penuh Waktu'], ['E.1.2', 'Tabel E.1.2 Mahasiswa Asing'],
  ['E.2.1', 'Tabel E.2.1 Rekapitulasi Rencana Pembelajaran Semester'], ['E.3.1', 'Tabel E.3.1 Rekapitulasi Kinerja Perkuliahan'],
  ['E.4.1', 'Tabel E.4.1 Kesesuaian Capaian Pembelajaran Lulusan dengan Kebutuhan Masyarakat'],
  ['E.4.2', 'Tabel E.4.2 Matrik Capaian Pembelajaran Matakuliah'], ['E.4.3', 'Tabel E.4.3 Penghargaan Eksternal Karya Mahasiswa'],
  ['P.1.1', 'Tabel P.1.1 Dosen Tetap Perguruan Tinggi'], ['P.1.2', 'Tabel P.1.2 Dosen Pembimbing Utama Tugas Akhir'],
  ['P.1.3', 'Tabel P.1.3 Ekuivalen Waktu Mengajar Penuh (EWMP) Dosen Tetap Perguruan Tinggi'],
  ['P.1.4', 'Tabel P.1.4 Dosen Tidak Tetap'], ['P.1.5', 'Tabel P.1.5 Dosen Industri/Praktisi'],
  ['P.1.6', 'Tabel P.1.6 Pengakuan/Rekognisi DTPS'], ['P.1.7', 'Tabel P.1.7 Tenaga Kependidikan'],
  ['L.1.1', 'Tabel L.1.1 Sarana dan Prasarana Belajar (Kelas)'], ['L.1.2', 'Tabel L.1.2 Sarana dan Prasarana Kerja/Praktek'],
  ['L.1.3', 'Tabel L.1.3 Sarana dan Prasarana Deseminasi'], ['L.1.4', 'Tabel L.1.4 Sarana dan Prasarana Pendukung Kesejahteraan'],
  ['L.4.1', 'Tabel L.4.1 Waktu Tunggu Lulusan Magister'], ['A.1', 'Tabel A.1 Kemitraan dan Kerjasama'],
  ['A.5.1', 'Tabel A.5.1 Realisasi Pemasukan Dana Program Magister'], ['A.5.2', 'Tabel A.5.2 Realisasi Pembiayaan Program Magister'],
  ['R.3.1', 'Tabel R.3.1 Luaran/Dampak Penelitian/Pengembangan Karya/Inovasi DTPS dan Mahasiswa'],
  ['R.6.1', 'Tabel R.6.1 Luaran/Dampak Pengabdian kepada Masyarakat DTPS dan Mahasiswa'],
].map(([nama, judul]) => ({ nama, judul }));
const SARANA_L1 = { 'L.1.1': 'belajar', 'L.1.2': 'kerja', 'L.1.3': 'diseminasi', 'L.1.4': 'kesejahteraan' };
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
    // 4.i: plus daftar karya yang mengutip pada jendela TS di OpenAlex (pemilik 2026-11-10).
    '4i': () => karya4i(X.karya, ts).map(({ k, n }) => ({ item: `${k.judul} (${k.tahun}), ${n} sitasi ${ts - 3}–${ts}`,
      tautan: unik([...tautanKarya(k), ...(tautanPengutip(k.openalex_id, ts)
        ? [{ t: `Karya pengutip ${ts - 3}–${ts} (OpenAlex)`, url: tautanPengutip(k.openalex_id, ts) }] : [])]) })),
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

  // LKPS LAMDEPILAR (pemilik 2026-11-24), sumber sama dengan lkps-lamdepilar.js.
  const ASING = ['asing_penuh_waktu', 'asing_satu_semester', 'asing_pendek_kredit', 'asing_tanpa_kredit'];
  khusus['E.1.2'] = () => (X.angkatan || []).filter(a => ASING.some(k => +a[k] > 0))
    .sort((a, b) => String(a.tahun_akademik).localeCompare(String(b.tahun_akademik)))
    .map(a => ({ item: `Angkatan ${a.tahun_akademik}`, tautan: unik(barisDari('lkps_mahasiswa_angkatan', a.id)) }));
  khusus['E.2.1'] = () => itemMK(mk);
  khusus['E.4.3'] = () => prestasi('');
  khusus['P.1.3'] = khusus['4c'];
  khusus['P.1.6'] = () => itemKarya(karya.filter(k => k.kategori === 'rekognisi'));
  Object.entries(SARANA_L1).forEach(([l, j]) => { khusus[l] = () => (X.saranaStd || []).filter(s => s.jenis === j)
    .map(s => ({ item: s.nama + (s.lokasi ? ` (${s.lokasi})` : ''), tautan: unik(barisDari('lkps_sarana_standar', s.id)) })); });
  khusus['A.1'] = () => [...itemKS('pendidikan', null), ...itemKS('penelitian', 'penelitian'), ...itemKS('pkm', 'pkm')];
  // A.5: hanya pos yang berbukti (45 pos x 3 tahun terlalu panjang bila semua dicantumkan).
  const taA5 = [ts - 2, ts - 1, ts].map(t => `${t - 1}/${t}`);
  [['A.5.1', 'A.5.1 '], ['A.5.2', 'A.5.2 ']].forEach(([l, lembar]) => { khusus[l] = () => (X.keuangan || [])
    .filter(k => taA5.includes(k.tahun_akademik) && (POS_A5.find(p => p.kode === k.pos) || {}).lembar === lembar)
    .sort((a, b) => String(a.tahun_akademik).localeCompare(String(b.tahun_akademik)) || String(a.pos).localeCompare(String(b.pos)))
    .map(k => ({ item: `${k.tahun_akademik} ${labelPos(k.pos)}`, tautan: unik(barisDari('lkps_keuangan', k.id)) }))
    .filter(x => x.tautan.length); });
  khusus['R.3.1'] = () => itemKarya(karya.filter(k => ['penelitian', 'publikasi', 'luaran'].includes(k.kategori)));
  khusus['R.6.1'] = () => itemKarya(karya.filter(k => k.kategori === 'pkm'));

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
    `<w:p><w:pPr><w:spacing w:after="160"/></w:pPr>${r(`${adaLink} dari ${indeks.length} ${C.namaTabel || 'tabel wajib Sarjana LAM Teknik'} memiliki tautan bukti. Sel kosong berarti belum ada bukti di sistem.`, { warna: '595959' })}</w:p>` +
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
  // Daftar tabel menurut mesin LKPS instrumen (dokumen.js LKPS.mesin): LAMDEPILAR dari TABEL_LAMDEPILAR,
  // LAM Teknik dari lkps-outline.json (44 tabel wajib Sarjana).
  let wajib = TABEL_LAMDEPILAR, namaTabel = 'tabel LKPS LAMDEPILAR (Magister)';
  if (C.mesin !== 'lkps-lamdepilar.js') {
    const res = await fetch(OUTLINE, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${OUTLINE} tidak terbaca (${res.status})`);
    const K = await res.json();
    if (!K.wajib) throw new Error('Halaman ini versi lama. Tekan Ctrl+Shift+R lalu unduh lagi.');
    wajib = K.wajib; namaTabel = '';
  }
  const basisUrl = new URL('.', location.href).href;
  const indeks = indeksBukti({ ...C, basisUrl, dokumen: C.daftar.dokumen }, wajib);
  const { bagian, tautan } = bagianDocx(indeks, { ...C, namaTabel });
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
