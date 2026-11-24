/* =====================================================================
   LKPS LAMDEPILAR — templat resmi IAPS DEPILAR 1.0 diisi langsung (2026-11-24)
   ---------------------------------------------------------------------
   Dipilih lewat site/instrumen/<id>/dokumen.js (LKPS.mesin). LAM Teknik tetap
   memakai lkps-tabel.js (workbook salin-tempel, pemilik 2026-11-04).

   Langkah (pemilik 2026-11-24: contoh fiktif templat dihapus semua):
     1. semua sel contoh di LKPS.contoh (lkps-contoh.json, dibuat dari templat
        dan ditinjau; sel berumus tidak termasuk) dikosongkan, gaya dipertahankan;
     2. lembar yang datanya ada di situs diisi: Cover (prodi, PT), D.1 prodi di
        UPPS, E.2.1 mata kuliah, E.4.3 prestasi mahasiswa, P.1.1 dosen tetap,
        L.4.1 waktu tunggu (kolom yang cocok), A.1 kerja sama;
     3. Excel menghitung ulang rumus saat berkas dibuka.
   Lembar lain (E.1, E.3, E.4.1-E.4.2, P.1.2-P.1.7, L.1, A.5, R.3, R.6) tinggal
   kosong untuk diisi prodi. R.3/R.6 ditunda sampai pemetaan karya -> program
   diputuskan (pemilik 2026-11-24).
   Kolom yang tidak disimpan situs dibiarkan kosong (tanpa tebakan).
   ===================================================================== */
import { JSZIP, tulisSel, petaLembar, hitungUlangSaatBuka } from './lkps.js?v=2026-11-24-264694';
import { daftarProdi, STATUS_PS, tglTeks } from './pustaka-dokumen.js?v=2026-11-24-264694';
import { nidnNuptk, masaBerlaku } from './profil-dosen.js?v=2026-11-24-264694';
import { ampuPerTA, dosenTS } from './dosen-hitung.js?v=2026-11-24-264694';

const JABATAN = { tenaga_pengajar: 'Tenaga Pengajar', asisten_ahli: 'Asisten Ahli', lektor: 'Lektor',
  lektor_kepala: 'Lektor Kepala', guru_besar: 'Profesor' };

// Kosongkan nilai satu sel tanpa mengubah gayanya. Sel berumus tidak disentuh.
export function kosongkanSel(xml, ref){
  const re = new RegExp(`<c r="${ref}"(?=[\\s>/])[^>]*?(?:/>|>[\\s\\S]*?</c>)`);
  const m = re.exec(xml);
  if (!m || /<f[\s>]/.test(m[0])) return xml;
  const s = (/\ss="(\d+)"/.exec(m[0]) || [])[1];
  return xml.slice(0, m.index) + `<c r="${ref}"${s ? ` s="${s}"` : ''}/>` + xml.slice(m.index + m[0].length);
}

const tingkatKe = t => /internasional/i.test(t || '') ? 'D' : /nasional/i.test(t || '') ? 'E'
  : /lokal|wilayah|regional/i.test(t || '') ? 'F' : null;

/* Peta isian { lembar: { ref: nilai } }. Murni, tanpa DOM (diuji di Node).
   C = { daftar (ambilDaftarLKPS), ts, prodi, institusi, jenjang, kini } */
export function petaLKPSLamdepilar(C){
  const { ts } = C;
  const X = C.daftar || {};
  const peta = {};
  const set = (l, ref, v) => { if (v != null && v !== '') (peta[l] ||= {})[ref] = v; };

  // Cover: baris 23 Program Studi, 25 Perguruan Tinggi (label templat diganti isinya).
  if (C.prodi) set('Cover', 'B23', `Program Studi ${C.jenjang ? C.jenjang + ' ' : ''}${C.prodi}`);
  if (C.institusi) set('Cover', 'B25', C.institusi);

  // D.1 Program studi di UPPS (Data prodi › Prodi di UPPS). Tanpa isian, daftarProdi() memakai prodi
  // ini dengan jenis "Sarjana" bawaan; di sini jenisnya jenjang instrumen.
  const tanpaUpps = !(X.prodiUpps || []).length;
  daftarProdi(X, C.prodi, ts).forEach((x, i) => {
    const r = 8 + i;
    set('D.1', `B${r}`, i + 1);
    set('D.1', `C${r}`, tanpaUpps && x.diakreditasi && C.jenjang ? C.jenjang : x.jenis_program);
    set('D.1', `D${r}`, x.nama_prodi);
    set('D.1', `G${r}`, STATUS_PS[x.status_akreditasi]);
    set('D.1', `H${r}`, [x.nomor_sk, tglTeks(x.tanggal_sk)].filter(Boolean).join(', '));
    set('D.1', `I${r}`, tglTeks(x.tanggal_kedaluwarsa));
  });

  // E.2.1 Rekapitulasi rencana pembelajaran: MK aktif urut semester.
  const mk = (X.mk || []).filter(m => m.aktif !== false)
    .sort((a, b) => ((a.semester ?? 99) - (b.semester ?? 99)) || ((a.urutan ?? 100) - (b.urutan ?? 100))
      || String(a.kode).localeCompare(String(b.kode)));
  mk.forEach((m, i) => {
    const r = 7 + i;
    set('E.2', `B${r}`, m.nama); set('E.2', `C${r}`, m.kode); set('E.2', `D${r}`, m.semester);
    set('E.2', `E${r}`, m.sks);
    set('E.2', `I${r}`, m.rps_url || (m.rps_ada === true ? 'Ada' : m.rps_ada === false ? 'Tidak ada' : null));
  });

  // P.1.1 Dosen tetap: dosen yang dihitung pada TS (dosen-hitung.js, sama dengan Kelola dosen dan Skor),
  // kategori tetap. Sertifikat: yang masih berlaku pada hari LKPS dibuat.
  const diTS = dosenTS(X.dosen || [], `${ts - 1}/${ts}`, ampuPerTA(X.ampu || {}));
  const tetap = diTS.hitung.filter(d => (d.kategori || 'tetap') === 'tetap').sort((a, b) => a.nama.localeCompare(b.nama));
  tetap.forEach((d, i) => {
    const r = 8 + i;
    const srt = (d.sertifikat || []).filter(s => !masaBerlaku(s, C.kini || new Date())?.lewat);
    set('P.1', `B${r}`, i + 1); set('P.1', `C${r}`, d.nama); set('P.1', `D${r}`, nidnNuptk(d));
    if (d.pendidikan === 'S3') set('P.1', `F${r}`, 'V'); else if (d.pendidikan === 'S2') set('P.1', `E${r}`, 'V');
    set('P.1', `G${r}`, d.bidang_keahlian);
    if (d.sesuai_kompetensi_inti === true) set('P.1', `H${r}`, 'V');
    set('P.1', `I${r}`, JABATAN[d.jabatan]);
    set('P.1', `J${r}`, d.nomor_serdos);
    set('P.1', `K${r}`, srt.map(s => [s.bidang, s.lembaga].filter(Boolean).join(', ')).filter(Boolean).join('; '));
    set('P.1', `L${r}`, mk.filter(m => (m.pengampu || []).includes(d.nidn)).map(m => m.nama).join('; '));
    if (d.sesuai_keahlian_mk === true) set('P.1', `M${r}`, 'V');
    set('P.1', `N${r}`, d.mk_ps_lain);
  });

  // E.4.3 Penghargaan eksternal karya mahasiswa (Data prodi › Prestasi mahasiswa), TS-4 s.d. TS
  // (pemilik 2026-11-24; sama dengan rentang E.1). TS prestasi seperti lkps.js: bulan >= 9 masuk TS berikutnya.
  // X/Y/Z wilayah/nasional/internasional; AA capaian; AB/AC kompetitif tidak disimpan situs.
  const tsBaris = p => (+p.bulan >= 9 ? +p.tahun + 1 : +p.tahun);
  const KOL_TINGKAT = { wilayah_lokal: 'X', nasional: 'Y', internasional: 'Z' };
  (X.prestasi || []).filter(p => tsBaris(p) >= ts - 4 && tsBaris(p) <= ts)
    .sort((a, b) => (tsBaris(a) - tsBaris(b)) || String(a.nama_kegiatan).localeCompare(String(b.nama_kegiatan)))
    .forEach((p, i) => {
      const r = 8 + i;
      set('E.4', `T${r}`, p.nama_mahasiswa); set('E.4', `U${r}`, p.nim);
      set('E.4', `V${r}`, p.nama_kegiatan); set('E.4', `W${r}`, p.penyelenggara);
      if (KOL_TINGKAT[p.tingkat]) set('E.4', `${KOL_TINGKAT[p.tingkat]}${r}`, 'V');
      set('E.4', `AA${r}`, p.capaian);
    });

  // L.4.1 Waktu tunggu lulusan (Data prodi › Tracer study), baris TS-2, TS-1, TS = tahun lulus ts-2..ts
  // (sama dengan lkps.js). Pita situs <3 / 3-18 / >18 bulan: hanya <3 bulan (F) yang sama dengan templat;
  // 3-6 dan >6 bulan (G, H) dan "dipesan sebelum lulus" (E) diisi prodi (pemilik 2026-11-24).
  [ts - 2, ts - 1, ts].forEach((t, i) => {
    const x = (X.tracer || []).find(y => +y.tahun_lulus === t);
    if (!x) return;
    const r = 8 + i;
    set('L.4', `C${r}`, x.jumlah_lulusan); set('L.4', `D${r}`, x.jumlah_terlacak); set('L.4', `F${r}`, x.wt_kurang_3);
  });
  // E.1 tidak diisi: tabelnya per ANGKATAN (kolom periksa N = lulus seleksi - aktif - tidak aktif - lulus - gagal),
  // sedangkan Data prodi › Mahasiswa per TS menyimpan jumlah per tahun akademik (2026-11-24).

  // A.1 Kemitraan dan kerja sama (Data prodi › Kerja sama) yang berlaku dalam TS-2 s.d. TS.
  (X.kerjasama || [])
    .filter(k => (!k.tahun_selesai || +k.tahun_selesai >= ts - 2) && (!k.tahun_mulai || +k.tahun_mulai <= ts))
    .sort((a, b) => String(a.mitra).localeCompare(String(b.mitra)))
    .forEach((k, i) => {
      const r = 8 + i;
      set('A.1', `B${r}`, i + 1); set('A.1', `C${r}`, k.mitra);
      const t = tingkatKe(k.tingkat);
      if (t) set('A.1', `${t}${r}`, 1);
      set('A.1', `G${r}`, k.kegiatan); set('A.1', `H${r}`, k.manfaat);
      set('A.1', `I${r}`, tglTeks(k.tanggal_mulai) || (k.tahun_mulai ? String(k.tahun_mulai) : null));
      set('A.1', `J${r}`, tglTeks(k.tanggal_selesai) || (k.tahun_selesai ? String(k.tahun_selesai) : null));
      set('A.1', `M${r}`, k.tautan_bukti);
    });
  return peta;
}

/* Isi templat (string XML per lembar). Murni: { path: xml } -> { path: xml }. */
export function isiLembar(xmlPerLembar, lembar, contoh, peta){
  const out = { ...xmlPerLembar };
  let kosong = 0, isi = 0;
  const kurang = [...Object.keys(contoh), ...Object.keys(peta)].filter(n => !lembar[n]);
  if (kurang.length) throw new Error(`lembar tidak ada di templat: ${[...new Set(kurang)].join(', ')}`);
  for (const [nama, refs] of Object.entries(contoh)) {
    let x = out[lembar[nama]];
    for (const ref of refs) { x = kosongkanSel(x, ref); kosong++; }
    out[lembar[nama]] = x;
  }
  for (const [nama, sel] of Object.entries(peta)) {
    let x = out[lembar[nama]];
    for (const [ref, v] of Object.entries(sel)) { x = tulisSel(x, ref, v); isi++; }
    out[lembar[nama]] = x;
  }
  return { xml: out, kosong, isi };
}

/* Unduh LKPS. C dari skor.html unduhLKPS(): templat, contoh, daftar, ts, prodi, institusi, jenjang.
   opsi.unduh === false -> kembalikan blob tanpa mengunduh. */
export async function buatLKPS(C, opsi = {}){
  const { default: JSZip } = await import(JSZIP);
  const r = await fetch(C.templat, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`templat ${C.templat} tidak terbaca (${r.status})`);
  const rc = await fetch(C.contoh, { cache: 'no-cache' });
  if (!rc.ok) throw new Error(`daftar sel contoh ${C.contoh} tidak terbaca (${rc.status})`);
  const contoh = await rc.json();
  const zip = await JSZip.loadAsync(await r.arrayBuffer());
  const wb = await zip.file('xl/workbook.xml').async('string');
  const lembar = petaLembar(wb, await zip.file('xl/_rels/workbook.xml.rels').async('string'));
  const peta = petaLKPSLamdepilar(C);
  const pakai = [...new Set([...Object.keys(contoh), ...Object.keys(peta)])].filter(n => lembar[n]);
  const xml = {};
  for (const n of pakai) xml[lembar[n]] = await zip.file(lembar[n]).async('string');
  const h = isiLembar(xml, lembar, contoh, peta);
  for (const [path, x] of Object.entries(h.xml)) zip.file(path, x);
  zip.file('xl/workbook.xml', hitungUlangSaatBuka(wb));
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const nama = `LKPS-${(C.prodi || 'prodi').replace(/[^\w-]+/g, '_')}-TS${C.ts}.xlsx`;
  if (opsi.unduh !== false) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nama;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }
  return { nama, sel: h.isi, kosong: h.kosong, lembar: Object.keys(peta), blob };
}
