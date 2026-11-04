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
import { teksPendidikan } from './profil-dosen.js?v=2026-11-04-1c89d6';

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
  if (C.daftar) Object.entries(petaDaftar(C)).forEach(([l, sel]) =>
    Object.entries(sel).forEach(([ref, v]) => set(l, ref, v)));
  return peta;
}

/* ---------------------------------------------------------------------
   Tahap 2: lembar daftar dari tabel Supabase (admin), pemilik 2026-11-04.
   C.daftar = { dosen, karya, kerjasama, bkd, prestasi, luaranMhs }
     dosen:     [{nama, nidn, pendidikan, jabatan, dtps, aktif, peran}]
     karya:     terverifikasi, dengan karya_penulis(peran, dosen(nama)),
                karya_mitra(institusi, tingkat), karya_mahasiswa(nama)
   Tanggal yang hanya diketahui bulan-tahunnya ditulis tanggal 1 bulan itu
   (keputusan pemilik 2026-11-04); tanpa bulan, tanggal dikosongkan.
   Kolom yang tidak disimpan situs (tanggal kerja sama, TKT, nomor HKI
   mahasiswa, jenis kegiatan 6.h.1, dst.) dibiarkan kosong.
   --------------------------------------------------------------------- */
const JABATAN = { tenaga_pengajar: 'Tenaga Pengajar', asisten_ahli: 'Asisten Ahli', lektor: 'Lektor',
                  lektor_kepala: 'Lektor Kepala', guru_besar: 'Guru Besar' };
// Daftar pilihan Kategori Dosen di lembar 4a (L6:L8).
const KATEGORI_LKPS = { tetap: 'Dosen Tetap', tidak_tetap: 'Dosen Tidak Tetap', industri: 'Dosen Industri' };
const INTEGRASI = { bahan_kajian: 'Tambahan Materi Perkuliahan', studi_kasus: 'Studi Kasus',
                    bab_buku_ajar: 'Bab/ Subbab dalam buku ajar', modul_praktikum: 'Bahan Ajar',
                    tugas_proyek: 'Bentuk Lain yang Relevan', lainnya: 'Bentuk Lain yang Relevan' };
const REKOGNISI = { visiting: 'visiting lecturer atau visiting scholar',
                    invited_speaker: 'keynote speaker/invited speaker',
                    editor: 'editor atau mitra bestari', mitra_bestari: 'editor atau mitra bestari',
                    narasumber: 'staf ahli/narasumber ', juri: 'staf ahli/narasumber ',   // spasi di ujung = templat
                    penghargaan: 'penghargaan atas prestasi dan kinerja' };
// kolom "V" tingkat: [lokal/wilayah, nasional, internasional]
const tingkatKe = t => /^internasional/.test(t || '') ? 2 : /^nasional/.test(t || '') ? 1 : /^wilayah/.test(t || '') ? 0 : -1;

export function serialTanggal(tahun, bulan){
  if (!tahun || !bulan) return null;
  return { tanggal: Math.round((Date.UTC(+tahun, +bulan - 1, 1) - Date.UTC(1899, 11, 30)) / 86400000) };
}
const tsKarya = k => (+k.bulan >= 9 ? +k.tahun + 1 : +k.tahun);

export function petaDaftar(C){
  const { ts } = C;
  const X = C.daftar || {};
  const out = {};
  const set = (l, ref, v) => { if (v != null && v !== '') (out[l] ||= {})[ref] = v; };
  const dalam = (t, n = 3) => t >= ts - n + 1 && t <= ts;
  const urut = (a, b) => (a.tahun - b.tahun) || String(a.judul).localeCompare(String(b.judul));

  // 4.a profil dosen: semua yang berkategori (Dosen Tetap / Tidak Tetap /
  // Industri; DTPS tanpa kategori = Dosen Tetap). Nama di sini = daftar
  // ValidDosen di lembar lain. Kolom E-P, R, S dari profil-dosen.js
  // (supabase/22-patch-profil-dosen.sql); "V" hanya bila admin menilai.
  const dtps = (X.dosen || []).filter(d => d.dtps && d.peran !== 'asesor')
    .sort((a, b) => a.nama.localeCompare(b.nama));
  const profil = (X.dosen || []).filter(d => d.peran !== 'asesor' && (d.kategori || d.dtps))
    .sort((a, b) => a.nama.localeCompare(b.nama));
  profil.forEach((d, i) => {
    const r = 14 + i;
    const rw = d.riwayat_pendidikan || [];
    const pend = (kelompok, ada, ket) => teksPendidikan(rw, kelompok) ||
      (ada ? `[isi: prodi ${ket} dan bidang ilmu]` : '');
    const srt = (d.sertifikat || []);
    set('4a', `B${r}`, d.nama); set('4a', `C${r}`, d.nidn);
    set('4a', `D${r}`, KATEGORI_LKPS[d.kategori || 'tetap']);
    set('4a', `E${r}`, pend('sarjana', !rw.length, 'S1'));
    set('4a', `F${r}`, pend('magister', !rw.length && ['S2', 'S3'].includes(d.pendidikan), 'S2'));
    set('4a', `G${r}`, pend('doktor', !rw.length && d.pendidikan === 'S3', 'S3'));
    set('4a', `H${r}`, d.bidang_keahlian); set('4a', `I${r}`, d.perusahaan);
    if (d.sesuai_kompetensi_inti === true) set('4a', `J${r}`, 'V');
    set('4a', `K${r}`, JABATAN[d.jabatan]);
    set('4a', `L${r}`, d.nomor_serdos);
    set('4a', `M${r}`, srt.map(s => s.bidang).filter(Boolean).join('; '));
    set('4a', `N${r}`, srt.map(s => s.lembaga).filter(Boolean).join('; '));
    set('4a', `O${r}`, d.skip); set('4a', `P${r}`, d.stri);
    if (d.sesuai_keahlian_mk === true) set('4a', `R${r}`, 'V');
    set('4a', `S${r}`, d.mk_ps_lain);
  });

  // 4.c beban kerja DTPS pada TS (jumlah kedua semester)
  const bkd = (X.bkd || []).filter(b => b.tahun_akademik === `${ts - 1}/${ts}`);
  dtps.forEach((d, i) => {
    const rows = bkd.filter(b => b.nidn === d.nidn);
    if (!rows.length) return;
    const s = k => rows.reduce((a, b) => a + (+b[k] || 0), 0);
    const r = 11 + i;
    set('4c', `B${r}`, d.nama); set('4c', `C${r}`, 'V');
    set('4c', `D${r}`, s('sks_pendidikan')); set('4c', `G${r}`, s('sks_penelitian'));
    set('4c', `H${r}`, s('sks_pkm')); set('4c', `I${r}`, s('sks_penunjang'));
  });

  const karya = (X.karya || []).filter(k => k.status === 'terverifikasi' && dalam(tsKarya(k)));
  const ketua = k => {
    const p = k.karya_penulis || [];
    const u = p.find(x => x.peran === 'ketua' || x.peran === 'penulis_pertama') || p[0];
    return u && u.dosen ? u.dosen.nama : '';
  };

  // 2.a kerja sama: tabel Data prodi + mitra pada karya penelitian/PkM
  const kerjaSama = { pendidikan: [], penelitian: [], pkm: [] };
  (X.kerjasama || []).filter(k => !k.tahun_selesai || +k.tahun_selesai >= ts - 2)
    .forEach(k => kerjaSama[k.jenis]?.push({ mitra: k.mitra, tingkat: k.tingkat, judul: k.kegiatan }));
  karya.filter(k => k.kategori === 'penelitian' || k.kategori === 'pkm').sort(urut)
    .forEach(k => (k.karya_mitra || []).forEach(m =>
      kerjaSama[k.kategori].push({ mitra: m.institusi, tingkat: m.tingkat, judul: k.judul })));
  [['2a1', 'pendidikan', 13], ['2a2', 'penelitian', 12], ['2a3', 'pkm', 12]].forEach(([l, j, r0]) =>
    kerjaSama[j].forEach((k, i) => {
      const r = r0 + i;
      set(l, `B${r}`, k.mitra); set(l, `F${r}`, k.judul);
      const t = tingkatKe(k.tingkat);
      if (t >= 0) set(l, `${'EDC'[t]}${r}`, 'V');          // C internasional, D nasional, E lokal
    }));

  // 3.a.3 integrasi penelitian/PkM dalam pembelajaran
  karya.filter(k => k.kategori === 'integrasi').sort(urut).forEach((k, i) => {
    const r = 13 + i;
    set('3a3', `B${r}`, ketua(k)); set('3a3', `C${r}`, k.judul); set('3a3', `D${r}`, k.mata_kuliah);
    set('3a3', `E${r}`, INTEGRASI[k.sub_jenis]);
    set('3a3', `${'FGH'[tsKarya(k) - (ts - 2)]}${r}`, 'V');
  });

  // 4.f luaran DTPS per jenis
  const luaran = karya.filter(k => k.kategori === 'luaran').sort(urut);
  const isiLuaran = (l, r0, jenis, kolomNo) => luaran.filter(k => jenis.includes(k.sub_jenis)).forEach((k, i) => {
    const r = r0 + i;
    set(l, `B${r}`, k.judul); set(l, `C${r}`, serialTanggal(k.tahun, k.bulan));
    set(l, `${kolomNo}${r}`, k.nama_terbitan);
  });
  isiLuaran('4f-1', 7, ['paten', 'paten_sederhana'], 'D');
  isiLuaran('4f-2', 7, ['hak_cipta', 'desain_industri', 'merek'], 'D');
  isiLuaran('4f-3', 16, ['ttg', 'produk'], 'E');
  isiLuaran('4f-4', 7, ['buku_isbn', 'book_chapter'], 'D');

  // 4.j rekognisi DTPS
  karya.filter(k => k.kategori === 'rekognisi').sort(urut).forEach((k, i) => {
    const r = 12 + i;
    set('4j', `B${r}`, ketua(k)); set('4j', `D${r}`, REKOGNISI[k.sub_jenis]);
    set('4j', `E${r}`, k.judul);
    const t = tingkatKe(k.tingkat);
    if (t >= 0) set('4j', `${'FGH'[t]}${r}`, 'V');         // F wilayah, G nasional, H internasional
    set('4j', `I${r}`, +k.tahun);
  });

  // 6.c prestasi mahasiswa (5 TS, sama dengan butir 43)
  const tsBaris = p => (+p.bulan >= 9 ? +p.tahun + 1 : +p.tahun);
  const pres = (X.prestasi || []).filter(p => dalam(tsBaris(p), 5)).sort(urut);
  [['6c1', 'akademik', 10], ['6c2', 'non_akademik', 11]].forEach(([l, b, r0]) =>
    pres.filter(p => (p.bidang || '').startsWith(b === 'akademik' ? 'akademik' : 'non')).forEach((p, i) => {
      const r = r0 + i;
      set(l, `B${r}`, p.nama_kegiatan); set(l, `C${r}`, serialTanggal(p.tahun, p.bulan));
      const t = tingkatKe(p.tingkat);
      if (t >= 0) set(l, `${'DEF'[t]}${r}`, 'V');          // D lokal, E nasional, F internasional
      set(l, `G${r}`, p.capaian);
    }));

  // 6.d masa studi, bagian Sarjana: baris TS-k = 41 - k, tahun masuk TS-1-k
  const kohort = (C.D && C.D.akreditasi && C.D.akreditasi.kohort) || [];
  for (let kk = 0; kk <= 7; kk++){
    const k = kohort.find(x => x.tahun_masuk === ts - 1 - kk);
    if (!k) continue;
    const r = 41 - kk;
    set('6d', `B${r}`, k.masuk);
    ['lulus_3_5_sd_4_5', 'lulus_4_5_sd_5_5', 'lulus_5_5_sd_6_5', 'lulus_6_5_sd_8']
      .forEach((p, j) => set('6d', `${'CDEF'[j]}${r}`, +k[p] || 0));
  }

  // 6.e.3 luaran mahasiswa (judul dan tanggal; nomor/status diisi prodi)
  const lm = (X.luaranMhs || []).filter(x => dalam(tsBaris(x))).sort(urut);
  const isiLm = (l, r0, jenis) => lm.filter(x => jenis.includes(x.jenis)).forEach((x, i) => {
    set(l, `B${r0 + i}`, x.judul); set(l, `C${r0 + i}`, serialTanggal(x.tahun, x.bulan));
  });
  isiLm('6e3-1', 12, ['paten', 'paten_sederhana']);
  isiLm('6e3-2', 8, ['hak_cipta', 'desain_industri', 'merek']);
  isiLm('6e3-3', 18, ['ttg', 'produk']);
  isiLm('6e3-4', 8, ['buku_isbn', 'book_chapter']);

  // 6.h.1 / 6.i penelitian / PkM DTPS yang melibatkan mahasiswa
  [['6h1', 'penelitian', 11, 'C'], ['6i', 'pkm', 6, 'E']].forEach(([l, kat, r0, kolJudul]) =>
    karya.filter(k => k.kategori === kat && (k.karya_mahasiswa || []).length).sort(urut).forEach((k, i) => {
      const r = r0 + i;
      set(l, `B${r}`, ketua(k));
      set(l, `${kolJudul}${r}`, k.judul);
      set(l, `D${r}`, k.karya_mahasiswa.map(m => m.nama).filter(Boolean).join(', '));
      set(l, `F${r}`, +k.tahun);
    }));
  return out;
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
