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
   E.4.1-E.4.2 (CPL dan matriks MK-CPL, kurikulum terbaru) dan P.1.3-P.1.7 (EWMP, dosen tidak tetap,
   praktisi, rekognisi, tendik) ditambahkan 2026-11-24; baris yang tidak muat disisipkan. L.1 (165-patch)
   dan P.1.2 (167-patch) dari isian Data prodi khusus LAMDEPILAR, 2026-11-24; A.5.1/A.5.2 blok Magister
   (169-patch, A.5.3 rumus templat), 2026-11-24; E.1.1/E.1.2 per angkatan (171-patch), 2026-11-24.
   Lembar lain (E.3, R.3, R.6) tinggal
   kosong untuk diisi prodi. R.3/R.6 ditunda sampai pemetaan karya -> program
   diputuskan (pemilik 2026-11-24).
   Kolom yang tidak disimpan situs dibiarkan kosong (tanpa tebakan).
   ===================================================================== */
import { JSZIP, tulisSel, petaLembar, hitungUlangSaatBuka } from './lkps.js?v=2026-11-27-e02e4a';
import { daftarProdi, STATUS_PS, tglTeks } from './pustaka-dokumen.js?v=2026-11-27-e02e4a';
import { nidnNuptk, masaBerlaku } from './profil-dosen.js?v=2026-11-27-e02e4a';
import { ampuPerTA, dosenTS } from './dosen-hitung.js?v=2026-11-27-e02e4a';
import { POS_A5 } from './keuangan-a5.js?v=2026-11-27-e02e4a';

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

// Kosongkan sel berumus (rumus dan nilai tersimpan), gaya tetap. Untuk rumus baris contoh templat yang
// menjadi #DIV/0! bila barisnya tidak terisi (P.1.2 G/K/L 24-27, pemilik 2026-11-25). Rumus shared harus
// dihapus satu kelompok utuh (induk dan semua anaknya); pemanggil yang menjamin.
export function hapusRumus(xml, ref){
  const re = new RegExp(`<c r="${ref}"(?=[\\s>/])[^>]*?(?:/>|>[\\s\\S]*?</c>)`);
  const m = re.exec(xml);
  if (!m || !/<f[\s>/]/.test(m[0])) return xml;
  const s = (/\ss="(\d+)"/.exec(m[0]) || [])[1];
  return xml.slice(0, m.index) + `<c r="${ref}"${s ? ` s="${s}"` : ''}/>` + xml.slice(m.index + m[0].length);
}

const tingkatKe = t => /internasional/i.test(t || '') ? 'D' : /nasional/i.test(t || '') ? 'E'
  : /lokal|wilayah|regional/i.test(t || '') ? 'F' : null;

// Kolom: huruf <-> nomor (A = 1).
export const nomorKolom = h => [...h].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0);
export function hurufKolom(n){ let s = ''; for (; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + (n - 1) % 26) + s; return s; }
const geserRef = (ref, setelah, n) => ref.replace(/^(\$?)([A-Z]+)(\$?\d+)$/, (m, a, h, r) =>
  a + (nomorKolom(h) > setelah ? hurufKolom(nomorKolom(h) + n) : h) + r);

/* Sisipkan n kolom kosong setelah kolom nomor `setelah` pada XML lembar (tanpa rumus; LKPS LAMDEPILAR E.4,
   pemilik 2026-11-24: CPL > 5). Sel, lebar kolom, dimensi, dan seleksi di kanannya bergeser; sel gabungan
   yang berakhir tepat di `setelah` diperlebar (kepala "Capaian Pembelajaran" K5:O5), yang di kanannya digeser.
   Kolom baru memakai gaya sel kolom `setelah` pada baris yang sama. */
export function sisipKolom(xml, setelah, n){
  if (!n) return xml;
  if (/<f[\s>]/.test(xml)) throw new Error('sisipKolom: lembar berumus tidak didukung');
  const huruf = hurufKolom(setelah);
  let out = xml.replace(/<c r="([A-Z]+)(\d+)"/g, (m, h, r) => `<c r="${geserRef(h + r, setelah, n)}"`);
  // sel baru bergaya kolom `setelah`, disisipkan tepat sesudahnya
  out = out.replace(new RegExp(`<c r="${huruf}(\\d+)"([^>]*?)(\\/>|>[\\s\\S]*?<\\/c>)`, 'g'), (m, r, attr) => {
    const s = /\ss="(\d+)"/.exec(attr)?.[1];
    return m + Array.from({ length: n }, (_, i) => `<c r="${hurufKolom(setelah + 1 + i)}${r}"${s ? ` s="${s}"` : ''}/>`).join('');
  });
  out = out.replace(/<mergeCell ref="([A-Z]+\d+):([A-Z]+\d+)"\/>/g, (m, a, b) => {
    const ka = nomorKolom(/[A-Z]+/.exec(a)[0]), kb = nomorKolom(/[A-Z]+/.exec(b)[0]);
    if (kb === setelah && ka < setelah) return `<mergeCell ref="${a}:${geserRef(b, setelah - 1, n)}"/>`;
    return `<mergeCell ref="${geserRef(a, setelah, n)}:${geserRef(b, setelah, n)}"/>`;
  });
  out = out.replace(/<col ([^>]*?)min="(\d+)" max="(\d+)"([^>]*?)\/>/g, (m, a, mi, ma, z) => {
    mi = +mi; ma = +ma;
    if (mi > setelah) return `<col ${a}min="${mi + n}" max="${ma + n}"${z}/>`;
    if (ma >= setelah) return `<col ${a}min="${mi}" max="${ma + n}"${z}/>`;   // kolom baru selebar kolom `setelah`
    return m;
  });
  out = out.replace(/<dimension ref="([A-Z]+\d+):([A-Z]+\d+)"/, (m, a, b) => `<dimension ref="${a}:${geserRef(b, setelah, n)}"`);
  out = out.replace(/<selection\b[^>]*\/>/g, s => s.replace(/(activeCell|sqref)="([A-Z]+\d+)"/g, (m, k, r) => `${k}="${geserRef(r, setelah, n)}"`));
  return out;
}

/* ---------------------------------------------------------------------
   Sisip baris (lembar berumus; LKPS LAMDEPILAR P.1, pemilik 2026-11-24). Aturan Excel: rujukan ke baris >= p
   bergeser n (juga $-absolut), jadi rentang yang melintasi p melebar. Berlaku untuk alamat sel, teks rumus
   (termasuk induk rumus shared dan atribut ref-nya), sel gabungan, validasi data, dimensi, dan seleksi.
   --------------------------------------------------------------------- */
const geserBaris = (ref, p, n) => ref.replace(/^(\$?[A-Z]+\$?)(\d+)$/, (m, k, r) => k + (+r >= p ? +r + n : r));
// Rujukan sel di teks rumus: opsional nama lembar, lalu kolom+baris; bukan nama fungsi (LOG10( ) atau nama lembar.
const RUJUKAN_RUMUS = /(?<![A-Za-z0-9_$.])((?:'[^']+'|[A-Za-z0-9_.]+)!)?(\$?[A-Z]{1,3}\$?\d+)(?![\w(!])/g;
const namaLembar = pre => pre.slice(0, -1).replace(/^'|'$/g, '');
/* sendiri = rumus di lembar `nama` itu sendiri (rujukan tanpa nama lembar ikut digeser). */
export function geserRumusBaris(f, nama, p, n, sendiri){
  return f.replace(RUJUKAN_RUMUS, (m, pre, ref) => {
    if (pre ? namaLembar(pre) !== nama : !sendiri) return m;
    return (pre || '') + ref.split(':').map(x => geserBaris(x, p, n)).join(':');
  });
}
// Rujukan baris relatif (tanpa $) digeser d: untuk menyalin rumus baris p-1 ke baris baru.
const terjemahBaris = (f, d) => f.replace(RUJUKAN_RUMUS, (m, pre, ref) =>
  pre ? m : ref.replace(/^(\$?[A-Z]+)(\d+)$/, (x, k, r) => k + (+r + d)));

export function sisipBaris(xml, nama, p, n){
  if (!n) return xml;
  const sel = r => r.replace(/^([A-Z]+)(\d+)$/, (m, k, b) => k + (+b >= p ? +b + n : b));
  const rentang = s => s.split(' ').map(x => x.split(':').map(sel).join(':')).join(' ');
  // 1. Geser semua yang ada (baris >= p).
  let out = xml.replace(/<f([^>]*)>([^<]*)<\/f>/g, (m, a, f) =>
    `<f${a.replace(/\sref="([^"]+)"/, (x, r) => ` ref="${rentang(r)}"`)}>${geserRumusBaris(f, nama, p, n, true)}</f>`);
  out = out.replace(/<f([^>]*\sref="[^"]+"[^>]*)\/>/g, (m, a) => `<f${a.replace(/\sref="([^"]+)"/, (x, r) => ` ref="${rentang(r)}"`)}/>`);
  out = out.replace(/<row r="(\d+)"/g, (m, r) => `<row r="${+r >= p ? +r + n : r}"`);
  out = out.replace(/<c r="([A-Z]+\d+)"/g, (m, r) => `<c r="${sel(r)}"`);
  out = out.replace(/<mergeCell ref="([^"]+)"\/>/g, (m, r) => `<mergeCell ref="${rentang(r)}"/>`);
  out = out.replace(/(<dataValidation\b[^>]*\ssqref=")([^"]+)"/g, (m, a, r) => `${a}${rentang(r)}"`);
  out = out.replace(/<formula1>([^<]*)<\/formula1>/g, (m, f) => `<formula1>${geserRumusBaris(f, nama, p, n, true)}</formula1>`);
  out = out.replace(/<dimension ref="([^"]+)"/, (m, r) => `<dimension ref="${rentang(r)}"`);
  out = out.replace(/<selection\b[^>]*\/>/g, s => s.replace(/(activeCell|sqref)="([^"]+)"/g, (m, k, r) => `${k}="${rentang(r)}"`));
  // 2. Baris baru p..p+n-1 meniru baris p-1: gaya sama, rumus diterjemahkan ke barisnya, tanpa nilai.
  const induk = {};                                          // si -> {f, baris} rumus shared (sudah digeser)
  for (const m of out.matchAll(/<c r="[A-Z]+(\d+)"[^>]*>\s*<f([^>]*\st="shared"[^>]*)>([^<]*)<\/f>/g)) {
    const si = /\ssi="(\d+)"/.exec(m[2])?.[1];
    if (si != null) induk[si] = { f: m[3], baris: +m[1] };
  }
  const contoh = new RegExp(`<row r="${p - 1}"([^>]*?)(?:\\/>|>([\\s\\S]*?)<\\/row>)`).exec(out);
  const baru = Array.from({ length: n }, (_, i) => {
    const r = p + i;
    if (!contoh) return `<row r="${r}"/>`;
    const sels = [...(contoh[2] || '').matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)].map(c => {
      const s = /\ss="\d+"/.exec(c[2])?.[0] || '';
      const fm = /<f([^>]*)>([^<]*)<\/f>|<f([^>]*)\/>/.exec(c[3] || '');
      let f = null;
      if (fm && fm[2] != null) f = terjemahBaris(fm[2], r - (p - 1));
      else if (fm) { const si = /\ssi="(\d+)"/.exec(fm[3])?.[1], x = induk[si]; if (x) f = terjemahBaris(x.f, r - x.baris); }
      return f != null ? `<c r="${c[1]}${r}"${s}><f>${f}</f></c>` : `<c r="${c[1]}${r}"${s}/>`;
    });
    return `<row r="${r}"${contoh[1].replace(/\sspans="[^"]*"/, '')}>${sels.join('')}</row>`;
  }).join('');
  // sebelum baris pertama bernomor >= p+n (baris kosong boleh tidak tertulis di XML)
  const sesudah = [...out.matchAll(/<row r="(\d+)"/g)].find(m => +m[1] >= p + n);
  const pos = sesudah ? sesudah.index : out.indexOf('</sheetData>');
  return out.slice(0, pos) + baru + out.slice(pos);
}

/* Rumus di lembar lain yang merujuk lembar `nama` pada baris >= p ikut bergeser (Daftar Isi: P.1!B19). */
export function geserRujukanBaris(xml, nama, p, n){
  if (!n) return xml;
  return xml.replace(/<f([^>]*)>([^<]*)<\/f>/g, (m, a, f) => `<f${a}>${geserRumusBaris(f, nama, p, n, false)}</f>`);
}

/* Tulis rumus ke sel tanpa rumus (gaya dipertahankan); sel berumus dibiarkan. */
export function tulisRumus(xml, ref, f){
  const re = new RegExp(`<c r="${ref}"(?=[\\s>/])[^>]*?(?:/>|>[\\s\\S]*?</c>)`);
  const m = re.exec(xml);
  if (m && /<f[\s>]/.test(m[0])) return xml;
  const x = tulisSel(xml, ref, 0);
  const c = re.exec(x);
  // Teks rumus di-escape (COUNTIFS "<>", ">6"): "<" mentah membuat XML lembar tidak sah.
  const e = f.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return x.slice(0, c.index) + c[0].replace(/<v>0<\/v>/, () => `<f>${e}</f>`) + x.slice(c.index + c[0].length);
}

/* Rumus lembar lain yang merujuk lembar `nama` di kanan kolom `setelah` ikut bergeser (Daftar Isi: E.4!T4). */
export function geserRujukan(xml, nama, setelah, n){
  if (!n) return xml;
  const lembar = nama.replace(/[.]/g, '\\.');
  const re = new RegExp(`((?:'${lembar}'|${lembar})!)(\\$?[A-Z]+\\$?\\d+)`, 'g');
  return xml.replace(/<f([^>]*)>([^<]*)<\/f>/g, (m, a, f) => `<f${a}>${f.replace(re, (x, p, r) => p + geserRef(r, setelah, n))}</f>`);
}

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
  // Lembar P.1 memuat tujuh tabel bertumpuk. Bila data melebihi baris templat, baris disisipkan sebelum
  // baris terakhir tabel itu (sisipBaris, pemilik 2026-11-24), jadi tabel berikutnya bergeser ke bawah.
  // muat() mengembalikan [data, baris akhir]; baris akhir = baris templat + sisipan tabel di atasnya.
  // Sisipan dicatat dalam koordinat templat dan diterapkan dari bawah ke atas di isiLembar.
  const peringatan = [];
  const sisipP1 = [];
  let geserP1 = 0;
  const muat = (xs, kapasitas, baris0, sisipDi) => {
    const lebih = Math.max(0, xs.length - kapasitas), awal = baris0 + geserP1;
    if (lebih) sisipP1.push({ lembar: 'P.1', baris: sisipDi, n: lebih });
    geserP1 += lebih;
    return xs.map((x, i) => [x, awal + i]);
  };
  const diTS = dosenTS(X.dosen || [], `${ts - 1}/${ts}`, ampuPerTA(X.ampu || {}));
  const urutNama = xs => xs.slice().sort((a, b) => a.nama.localeCompare(b.nama));
  const kategori = k => urutNama(diTS.hitung.filter(d => (d.kategori || 'tetap') === k));
  const mkDiampu = d => mk.filter(m => (m.pengampu || []).includes(d.nidn));
  const srtBerlaku = d => (d.sertifikat || []).filter(s => !masaBerlaku(s, C.kini || new Date())?.lewat)
    .map(s => [s.bidang, s.lembaga].filter(Boolean).join(', ')).filter(Boolean).join('; ');
  const PEND = { S3: 'Doktor', S2: 'Magister' };
  const tetap = kategori('tetap');
  muat(tetap, 11, 8, 18).forEach(([d, r], i) => {
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

  // P.1.2 Pembimbing utama tugas akhir (Data prodi › Pembimbing utama TA, 167-patch, pemilik 2026-11-24):
  // dosen dengan bimbingan > 0 pada TS-2 s.d. TS (PS ini atau PS lain), urut nama; tahun tanpa baris = 0.
  // G/K/L = rumus rata-rata templat, ditulis per baris (templat hanya punya rumus di baris contoh).
  // Analisis (pemilik 2026-11-25), sebagai rumus agar ikut berubah bila prodi menyunting tabel:
  // R21 = banyak baris Tabel P.1.2; R22 = U22 = banyak dosen tetap Tabel P.1.1; U21 = pembimbing dengan
  // rata-rata bimbingan per tahun di semua program > 6, yaitu (D+E+F+H+I+J)/3 > 6 (= G+K karena ketiga
  // tahun selalu terisi; G/K tidak dipakai karena baris contoh kosong berumus AVERAGE bisa #DIV/0!).
  // R23/U23 = rumus templat; labelnya (tersalin dari P.1.1) dibiarkan.
  const g12 = geserP1;                                   // sisipan Tabel P.1.1 di atas blok ini
  const bimb = X.bimbinganUtama || [];
  const taP12 = [ts - 2, ts - 1, ts].map(t => `${t - 1}/${t}`);
  const namaNidn = n => ((X.dosen || []).find(d => d.nidn === n) || {}).nama || n;
  const pembimbing = urutNama([...new Set(bimb.filter(b => taP12.includes(b.tahun_akademik)
      && (+b.jumlah_ps || 0) + (+b.jumlah_ps_lain || 0) > 0).map(b => b.nidn))].map(n => ({ nidn: n, nama: namaNidn(n) })));
  muat(pembimbing, 12, 24, 35).forEach(([d, r], i) => {
    set('P.1', `B${r}`, i + 1); set('P.1', `C${r}`, d.nama);
    taP12.forEach((ta, j) => {
      const b = bimb.find(x => x.nidn === d.nidn && x.tahun_akademik === ta);
      set('P.1', `${'DEF'[j]}${r}`, b ? +b.jumlah_ps || 0 : 0);
      set('P.1', `${'HIJ'[j]}${r}`, b ? +b.jumlah_ps_lain || 0 : 0);
    });
    set('P.1', `G${r}`, { rumus: `AVERAGE(D${r}:F${r})` });
    set('P.1', `K${r}`, { rumus: `AVERAGE(H${r}:J${r})` });
    set('P.1', `L${r}`, { rumus: `AVERAGE(D${r}:K${r})` });
  });
  {
    const a = 24 + g12, b = 35 + geserP1, k = c => `${c}${a}:${c}${b}`;
    const nTetap = { rumus: `COUNTA(C8:C${18 + g12})` };
    set('P.1', `R${21 + g12}`, { rumus: `COUNTA(${k('C')})` });
    set('P.1', `R${22 + g12}`, nTetap);
    set('P.1', `U${21 + g12}`, { rumus: `SUMPRODUCT(--((${[...'DEFHIJ'].map(k).join('+')})/3>6))` });
    set('P.1', `U${22 + g12}`, nTetap);
    // Analisis P.1.1 (pemilik 2026-11-25), di atas tabel jadi tidak bergeser; rentang = baris Tabel P.1.1.
    // R6 = dosen yang mengampu MK di PS ini (L terisi) tanpa V kesesuaian (M); U6 = nomor serdos (J) terisi;
    // U7 = sertifikat kompetensi/profesi/industri berlaku (K) terisi; X6/X7 = jabatan (I) Profesor/Lektor Kepala;
    // jumlah dosen = banyak baris. X6 (=1) dan X9 (=2/4) rumus contoh templat: dihapus (hapusRumus) lalu ditulis.
    const t = c => `${c}8:${c}${18 + g12}`, ada = c => `${t(c)},"<>"`;
    set('P.1', 'R6', { rumus: `COUNTIFS(${ada('C')},${ada('L')},${t('M')},"<>V")` });
    set('P.1', 'R7', nTetap);
    set('P.1', 'U6', { rumus: `COUNTIFS(${ada('C')},${ada('J')})` });
    set('P.1', 'U7', { rumus: `COUNTIFS(${ada('C')},${ada('K')})` });
    set('P.1', 'U8', nTetap);
    set('P.1', 'X6', { rumus: `COUNTIF(${t('I')},"Profesor")` });
    set('P.1', 'X7', { rumus: `COUNTIF(${t('I')},"Lektor Kepala")` });
    set('P.1', 'X8', nTetap);
    set('P.1', 'X9', { rumus: '(X6+X7)/X8' });
  }

  // P.1.3 EWMP (Data prodi › BKD), sama dengan lkps.js 4.c: TS laporan, jumlah kedua semester, V = DTPS;
  // dosen lain tampil bila BKD-nya ada. K = SUM templat. L = rata-rata per semester TS-2 s.d. TS:
  // jumlah sks keenam kolom / banyak baris BKD (satu baris = satu semester).
  const KOL_BKD = ['sks_pendidikan', 'sks_ps_lain_dalam', 'sks_ps_lain_luar', 'sks_penelitian', 'sks_pkm', 'sks_penunjang'];
  const taDari = t => `${t - 1}/${t}`;
  const bkdTS = (X.bkd || []).filter(b => b.tahun_akademik === taDari(ts));
  const bkd3 = (X.bkd || []).filter(b => [ts - 2, ts - 1, ts].map(taDari).includes(b.tahun_akademik));
  const dtps = urutNama(diTS.dtps);
  const ewmp = [...dtps, ...urutNama(diTS.hitung.filter(d => !dtps.includes(d) && bkdTS.some(b => b.nidn === d.nidn)))]
    .filter(d => bkdTS.some(b => b.nidn === d.nidn));
  const g13 = geserP1;                                   // sisipan Tabel P.1.1-P.1.2 di atas blok ini
  muat(ewmp, 7, 45, 51).forEach(([d, r], i) => {
    const rows = bkdTS.filter(b => b.nidn === d.nidn), s = k => rows.reduce((a, b) => a + (+b[k] || 0), 0);
    set('P.1', `B${r}`, i + 1); set('P.1', `C${r}`, d.nama); if (dtps.includes(d)) set('P.1', `D${r}`, 'V');
    KOL_BKD.forEach((k, j) => set('P.1', `${'EFGHIJ'[j]}${r}`, s(k)));
    set('P.1', `K${r}`, { rumus: `SUM(E${r}:J${r})` });     // templat hanya punya rumus ini di baris contoh
    const tiga = bkd3.filter(b => b.nidn === d.nidn);
    if (tiga.length) set('P.1', `L${r}`, Math.round(tiga.reduce((a, b) => a + KOL_BKD.reduce((x, k) => x + (+b[k] || 0), 0), 0)
      / tiga.length * 100) / 100);
  });
  // Analisis P.1.3 (pemilik 2026-11-25): K = jumlah dua semester TS, jadi ambang per semester 12 dan 20
  // dibandingkan dengan K/2; Jumlah Dosen = baris Tabel P.1.3. R44/U44 tetap rumus templat (labelnya
  // keliru menyalin P.1.1, dibiarkan). Baris kosong tidak dihitung (syarat nama terisi).
  {
    const a = 45 + g13, b = 51 + geserP1, t = c => `${c}${a}:${c}${b}`;
    const n = { rumus: `COUNTA(${t('C')})` };
    set('P.1', `R${42 + g13}`, { rumus: `SUMPRODUCT((${t('C')}<>"")*(${t('K')}/2<12))` });
    set('P.1', `R${43 + g13}`, n);
    set('P.1', `U${42 + g13}`, { rumus: `SUMPRODUCT((${t('C')}<>"")*(${t('K')}/2>20))` });
    set('P.1', `U${43 + g13}`, n);
  }

  // P.1.4 Dosen tidak tetap, P.1.5 dosen industri/praktisi: dihitung pada TS (dosenTS), menurut kategori di
  // Kelola dosen. Nomor Induk Kependudukan tidak disimpan situs (kosong).
  const g14 = geserP1;                                   // sisipan Tabel P.1.1-P.1.3 di atas blok ini
  muat(kategori('tidak_tetap'), 7, 55, 61).forEach(([d, r], i) => {
    set('P.1', `B${r}`, i + 1); set('P.1', `C${r}`, d.nama); set('P.1', `E${r}`, PEND[d.pendidikan]);
    set('P.1', `F${r}`, d.bidang_keahlian); set('P.1', `G${r}`, JABATAN[d.jabatan]); set('P.1', `H${r}`, d.nomor_serdos);
    set('P.1', `I${r}`, srtBerlaku(d)); set('P.1', `J${r}`, mkDiampu(d).map(m => m.nama).join('; '));
    if (d.sesuai_keahlian_mk === true) set('P.1', `K${r}`, 'V');
  });
  // Analisis P.1.4 (pemilik 2026-11-25): R55 = baris Tabel P.1.4; Jumlah Dosen R56 = dosen tetap (Tabel P.1.1)
  // + dosen tidak tetap, jadi R57 (rumus templat) = NDTT / (NDT + NDTT).
  set('P.1', `R${55 + g14}`, { rumus: `COUNTA(C${55 + g14}:C${61 + geserP1})` });
  set('P.1', `R${56 + g14}`, { rumus: `COUNTA(C8:C${18 + g12})+R${55 + g14}` });
  // P.1.5 "Diisi oleh pengusul dari Program Studi pada program Diploma Tiga/Sarjana Terapan": Magister
  // tidak mengisi barisnya (pemilik 2026-11-25); rumus analisis tetap ditulis (0 %, bukan contoh 0/4).
  const g15 = geserP1;
  muat(C.jenjang === 'Magister' ? [] : kategori('industri'), 7, 66, 72).forEach(([d, r], i) => {
    const xs = mkDiampu(d);
    set('P.1', `B${r}`, i + 1); set('P.1', `C${r}`, d.nama); set('P.1', `E${r}`, d.perusahaan);
    set('P.1', `F${r}`, PEND[d.pendidikan] || d.pendidikan); set('P.1', `G${r}`, d.bidang_keahlian);
    set('P.1', `H${r}`, srtBerlaku(d)); set('P.1', `I${r}`, xs.map(m => m.nama).join('; '));
    if (xs.length) set('P.1', `J${r}`, xs.reduce((a, m) => a + (+m.sks || 0), 0));
  });
  // Analisis P.1.5 (pemilik 2026-11-25): Jumlah Dosen = tetap (P.1.1) + tidak tetap (R55) + praktisi.
  set('P.1', `R${66 + g15}`, { rumus: `COUNTA(C${66 + g15}:C${72 + geserP1})` });
  set('P.1', `R${67 + g15}`, { rumus: `COUNTA(C8:C${18 + g12})+R${55 + g14}+R${66 + g15}` });

  // P.1.6 Rekognisi DTPS: karya kategori rekognisi TS-2 s.d. TS (sama dengan lkps.js 4.j). Bukti: jenis
  // "SK/kontrak/surat tugas" -> H (Surat Tugas); undangan dan web penyelenggara tidak punya jenis bukti
  // yang sepadan (kosong). Tingkat V di I wilayah, J nasional, K internasional; L tahun.
  const tsKarya = k => (+k.bulan >= 9 ? +k.tahun + 1 : +k.tahun);
  const REKOGNISI = { visiting: 'Visiting lecturer/scholar', invited_speaker: 'Keynote/invited speaker',
    editor: 'Editor', mitra_bestari: 'Mitra bestari', narasumber: 'Staf ahli/narasumber', juri: 'Juri',
    penghargaan: 'Penghargaan atas prestasi dan kinerja' };
  const ketua = k => { const p = k.karya_penulis || [];
    const u = p.find(x => x.peran === 'ketua' || x.peran === 'penulis_pertama') || p[0]; return u?.dosen?.nama || ''; };
  const rekognisi = (X.karya || []).filter(k => k.kategori === 'rekognisi' && tsKarya(k) >= ts - 2 && tsKarya(k) <= ts)
    .sort((a, b) => (a.tahun - b.tahun) || String(a.judul).localeCompare(String(b.judul)));
  const g16 = geserP1;
  muat(rekognisi, 7, 77, 83).forEach(([k, r], i) => {
    const nama = ketua(k);
    set('P.1', `B${r}`, i + 1); set('P.1', `C${r}`, nama);
    set('P.1', `D${r}`, (X.dosen || []).find(d => d.nama === nama)?.bidang_keahlian);
    set('P.1', `E${r}`, [REKOGNISI[k.sub_jenis], k.judul].filter(Boolean).join(': '));
    set('P.1', `H${r}`, (X.buktiKarya || []).filter(b => b.karya_id === k.id && b.jenis === 'sk').map(b => b.url).join('; '));
    const t = /^internasional/.test(k.tingkat || '') ? 'K' : /^nasional/.test(k.tingkat || '') ? 'J'
      : /^(wilayah|lokal)/.test(k.tingkat || '') ? 'I' : null;
    if (t) set('P.1', `${t}${r}`, 'V');
    set('P.1', `L${r}`, +k.tahun);
  });
  // Analisis P.1.6 (pemilik 2026-11-25): dosen UNIK per tingkat (satu baris = satu rekognisi; tiap baris
  // berbobot 1 / banyak baris dengan nama dan isian tingkat yang sama, penyebut >= 1); Jumlah Dosen = P.1.1.
  {
    const a = 77 + g16, b = 83 + geserP1, t = c => `${c}${a}:${c}${b}`;
    const unik = c => ({ rumus: `SUMPRODUCT((${t('C')}<>"")*(${t(c)}="V")/COUNTIFS(${t('C')},${t('C')}&"",${t(c)},${t(c)}&""))` });
    set('P.1', `R${77 + g16}`, unik('I')); set('P.1', `R${78 + g16}`, unik('J')); set('P.1', `R${79 + g16}`, unik('K'));
    set('P.1', `R${80 + g16}`, { rumus: `COUNTA(C8:C${18 + g12})` });
  }

  // P.1.7 Tenaga kependidikan (Data prodi › Tendik), aktif; sama dengan lkps.js 4.b. Pendidikan V di kolom
  // SMA (F), DI/DII (G), DIII (H), DIV (I), S1 (J), S2 (K); S3 tidak punya kolom di templat. NIP tidak disimpan.
  const KOL_PEND_TENDIK = { sma_smk: 'F', d1: 'G', d2: 'G', d3: 'H', d4: 'I', s1: 'J', s2: 'K' };
  // 164-patch (pemilik 2026-11-22): jabatan admin_prodi dan asisten_lab; status_kerja magang tidak masuk LKPS.
  const TUGAS_TENDIK = { laboran: 'Laboran', teknisi: 'Teknisi', administrator_sistem: 'Administrator sistem', lainnya: 'Lainnya',
    admin_prodi: 'Admin prodi', asisten_lab: 'Asisten laboratorium' };
  const UNIT_TENDIK = { upps: 'UPPS', prodi: 'Program Studi', institusi: 'Institusi' };
  // Tabel terakhir di lembar: tanpa batas baris, cukup bergeser sebanyak sisipan di atasnya.
  const tendikLKPS = urutNama((X.tendik || []).filter(x => x.aktif !== false && x.status_kerja !== 'magang'));
  tendikLKPS.forEach((x, i) => {
    const r = 88 + geserP1 + i;
    set('P.1', `B${r}`, i + 1); set('P.1', `C${r}`, x.nama);
    if (KOL_PEND_TENDIK[x.pendidikan]) set('P.1', `${KOL_PEND_TENDIK[x.pendidikan]}${r}`, 'V');
    set('P.1', `L${r}`, x.sertifikat); set('P.1', `M${r}`, TUGAS_TENDIK[x.jabatan]); set('P.1', `N${r}`, UNIT_TENDIK[x.unit_kerja]);
  });
  // Analisis P.1.7 (2026-11-25, tanpa pilihan: label templat): banyak V per kolom pendidikan atas baris tendik
  // (7 baris templat 88-94 atau lebih); DIV/S1 = kolom I + J. R94 SUM dan S = R/$R$94 tetap rumus templat.
  {
    const a = 88 + geserP1, b = a + Math.max(7, tendikLKPS.length) - 1, n = c => `COUNTIF(${c}${a}:${c}${b},"V")`;
    [['E'], ['F'], ['G'], ['H'], ['I', 'J'], ['K']].forEach((cs, i) => set('P.1', `R${a + i}`, { rumus: cs.map(n).join('+') }));
  }

  // L.1 Sarana menurut standar (Data prodi › Sarana menurut standar, 165-patch; pemilik 2026-11-24).
  // L.1.1 belajar: lima blok kategori (butir di C bernomor "1. …" seperti templat); L.1.2-L.1.4: nomor di B.
  // D lokasi, E ukuran, F nama standar, G occupancy, H standar ditetapkan, I ukuran eksisting.
  // Blok penuh -> baris disisipkan sebelum baris terakhir blok (lembar L.1 tanpa rumus); L.1.4 tabel terakhir.
  const sisipL1 = [];
  let geserL1 = 0;
  const urutSarana = (a, b) => ((a.urutan ?? 100) - (b.urutan ?? 100)) || String(a.nama).localeCompare(String(b.nama));
  const sarana = (X.saranaStd || []).slice().sort(urutSarana);
  const isiSarana = (x, r, noB, noC) => {
    if (noB != null) set('L.1', `B${r}`, noB);
    set('L.1', `C${r}`, noC != null ? `${noC}. ${x.nama}` : x.nama);
    set('L.1', `D${r}`, x.lokasi); set('L.1', `E${r}`, x.ukuran); set('L.1', `F${r}`, x.nama_standar);
    set('L.1', `G${r}`, x.occupancy); set('L.1', `H${r}`, x.standar_ditetapkan); set('L.1', `I${r}`, x.ukuran_eksisting);
  };
  const blokL1 = (xs, kapasitas, baris0, sisipDi, nomorDiC) => {
    const lebih = Math.max(0, xs.length - kapasitas), awal = baris0 + geserL1;
    if (lebih) sisipL1.push({ lembar: 'L.1', baris: sisipDi, n: lebih });
    geserL1 += lebih;
    xs.forEach((x, i) => isiSarana(x, awal + i, nomorDiC ? null : i + 1, nomorDiC ? i + 1 : null));
  };
  const belajar = k => sarana.filter(x => x.jenis === 'belajar' && x.kategori === k);
  blokL1(belajar('perabot'), 4, 8, 11, true);
  blokL1(belajar('media'), 4, 13, 16, true);
  blokL1(belajar('kenyamanan'), 4, 18, 21, true);
  blokL1(belajar('administrasi'), 4, 23, 26, true);
  blokL1(belajar('k3'), 3, 28, 30, true);
  blokL1(sarana.filter(x => x.jenis === 'kerja'), 16, 38, 53, false);
  blokL1(sarana.filter(x => x.jenis === 'diseminasi'), 16, 59, 74, false);
  sarana.filter(x => x.jenis === 'kesejahteraan').forEach((x, i) => isiSarana(x, 80 + geserL1 + i, i + 1, null));

  // E.4.3 Penghargaan eksternal karya mahasiswa (Data prodi › Prestasi mahasiswa), TS-4 s.d. TS
  // (pemilik 2026-11-24; sama dengan rentang E.1). TS prestasi seperti lkps.js: bulan >= 9 masuk TS berikutnya.
  // X/Y/Z wilayah/nasional/internasional; AA capaian; AB/AC kompetitif tidak disimpan situs.
  // E.4.1 CPL dan E.4.2 matriks MK-CPL (Data prodi › CPL; 71-patch). Pemilik 2026-11-24:
  //   - kurikulum terbaru di antara MK aktif (mis. K26); MK kurikulum lain tidak masuk matriks;
  //   - bobot per KOLOM CPL: bobot MK itu / jumlah bobot semua MK pendukung CPL itu (kosong = 1), kolom berjumlah 1;
  //   - CPL > 5: kolom ditambah setelah O (sisipKolom), Keterangan dan tabel E.4.3 bergeser ke kanan.
  // E.4.1: satu CPL per dua baris tergabung (B8:B9, ...); kolom E (rujukan kesetaraan) tidak disimpan situs.
  const { kurikulum: kur, cpl } = cplTerbaru(X);
  const nKol = Math.max(5, cpl.length), geser = nKol - 5;
  const K = 11;                                              // kolom K = CPL pertama
  const kol = j => hurufKolom(K + j);
  const tambahKosong = [];                                   // label templat yang tidak terpakai
  cpl.forEach((c, i) => {
    const r = 8 + 2 * i;
    set('E.4', `B${r}`, c.rumusan); set('E.4', `C${r}`, c.kode); set('E.4', `D${r}`, c.indikator);
  });
  if (cpl.length) {
    const mkKur = mk.filter(m => m.kurikulum === kur);
    const pemetaan = new Map();                              // cpl -> Map(kode_mk -> bobot mentah)
    for (const p of X.mkCpl || []) {
      if (p.kurikulum !== kur || !mkKur.some(m => m.kode === p.kode_mk)) continue;
      if (!pemetaan.has(p.cpl)) pemetaan.set(p.cpl, new Map());
      pemetaan.get(p.cpl).set(p.kode_mk, +p.bobot > 0 ? +p.bobot : 1);
    }
    const porsi = (c, kode) => { const xs = pemetaan.get(c.kode); if (!xs || !xs.has(kode)) return null;
      return xs.get(kode) / [...xs.values()].reduce((a, b) => a + b, 0); };
    for (let j = 0; j < nKol; j++) {
      set('E.4', `${kol(j)}7`, 3 + j);                       // nomor kolom
      if (j < cpl.length) set('E.4', `${kol(j)}6`, cpl[j].kode); else tambahKosong.push(`${kol(j)}6`);
    }
    set('E.4', `${kol(nKol)}7`, 3 + nKol);                   // Keterangan
    mkKur.forEach((m, i) => {
      const r = 8 + i;
      set('E.4', `I${r}`, m.nama); set('E.4', `J${r}`, m.kode);
      cpl.forEach((c, j) => { const v = porsi(c, m.kode); if (v != null) set('E.4', `${kol(j)}${r}`, Math.round(v * 1e4) / 1e4); });
    });
    // Rekapitulasi bobot (templat baris 19) dan catatannya (baris 21) di bawah MK terakhir bila MK > 11.
    const R = Math.max(19, 8 + mkKur.length);
    if (R !== 19) { set('E.4', `I${R}`, 'Rekapitulasi Bobot CPL'); set('E.4', `I${R + 2}`,
      'Jumlah dari gabungan matakuliah yang mendukung satu CPL = 1'); if (8 + mkKur.length <= 21) tambahKosong.push('I21'); }
    cpl.forEach((c, j) => { const xs = pemetaan.get(c.kode);
      if (xs) set('E.4', `${kol(j)}${R}`, Math.round(mkKur.reduce((a, m) => a + (porsi(c, m.kode) || 0), 0) * 100) / 100); });
  }

  const tsBaris = p => (+p.bulan >= 9 ? +p.tahun + 1 : +p.tahun);
  // E.4.3 bergeser sebanyak kolom CPL tambahan (T = 20).
  const kolP = h => hurufKolom(nomorKolom(h) + geser);
  const KOL_TINGKAT = { wilayah_lokal: 'X', nasional: 'Y', internasional: 'Z' };
  (X.prestasi || []).filter(p => tsBaris(p) >= ts - 4 && tsBaris(p) <= ts)
    .sort((a, b) => (tsBaris(a) - tsBaris(b)) || String(a.nama_kegiatan).localeCompare(String(b.nama_kegiatan)))
    .forEach((p, i) => {
      const r = 8 + i;
      set('E.4', `${kolP('T')}${r}`, p.nama_mahasiswa); set('E.4', `${kolP('U')}${r}`, p.nim);
      set('E.4', `${kolP('V')}${r}`, p.nama_kegiatan); set('E.4', `${kolP('W')}${r}`, p.penyelenggara);
      if (KOL_TINGKAT[p.tingkat]) set('E.4', `${kolP(KOL_TINGKAT[p.tingkat])}${r}`, 'V');
      set('E.4', `${kolP('AA')}${r}`, p.capaian);
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
  // E.1.1 dan E.1.2 per ANGKATAN (Data prodi › Mahasiswa per angkatan, 171-patch, pemilik 2026-11-24), baris 8-12 =
  // angkatan TS-4..TS. Kolom periksa N, S (teregistrasi), baris Jumlah, dan E.1.3 tetap rumus templat.
  const kolomE1 = { C: 'daya_tampung', D: 'pendaftar', E: 'lulus_seleksi', F: 'afirmasi', G: 'transfer', H: 'asing',
    I: 'aktif', J: 'tidak_aktif', K: 'lulus', L: 'gagal',
    T: 'asing_penuh_waktu', U: 'asing_satu_semester', V: 'asing_pendek_kredit', W: 'asing_tanpa_kredit' };
  [ts - 4, ts - 3, ts - 2, ts - 1, ts].forEach((t, i) => {
    const a = (X.angkatan || []).find(y => y.tahun_akademik === `${t - 1}/${t}`);
    if (a) for (const [c, k] of Object.entries(kolomE1)) set('E.1', `${c}${8 + i}`, a[k]);
  });

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
  // Bukan isian sel (tidak ikut Object.entries): kolom yang disisipkan dan sel templat tambahan yang dikosongkan.
  Object.defineProperty(peta, 'sisip', { value: geser ? [{ lembar: 'E.4', setelah: nomorKolom('O'), n: geser }] : [] });
  Object.defineProperty(peta, 'kosongTambahan', { value: tambahKosong.length ? { 'E.4': tambahKosong } : {} });
  Object.defineProperty(peta, 'peringatan', { value: peringatan });
  // Rumus baris contoh P.1.2 (G24/K24/L24 biasa, G/K/L25:27 shared) dihapus utuh, alamat templat; baris terisi
  // mendapat rumusnya lagi dari blok P.1.2, baris kosong tidak lagi #DIV/0! (pemilik 2026-11-25).
  // X6/X9: rumus contoh analisis P.1.1 (=1, =2/4), diganti rumus hitung dari tabel.
  Object.defineProperty(peta, 'hapusRumus', { value: { 'P.1': [...[...'GKL'].flatMap(c => [24, 25, 26, 27].map(r => `${c}${r}`)), 'X6', 'X9'] } });
  // A.5.1 pemasukan, A.5.2 pembiayaan, blok Program Magister (Data prodi › Keuangan A.5, 169-patch, pemilik
  // 2026-11-24): rupiah -> juta rupiah; D-F UPPS, H-J PS untuk TS-2..TS. Pos yang tidak diisi untuk satu tahun
  // dibiarkan kosong (bukan 0). Jumlah, rata-rata, rasio, dan neraca A.5.3 dihitung rumus templat.
  const taA5 = [ts - 2, ts - 1, ts].map(t => `${t - 1}/${t}`);
  const juta = v => (v == null || v === '' ? null : +v / 1e6);
  for (const p of POS_A5) taA5.forEach((ta, j) => {
    const k = (X.keuangan || []).find(x => x.pos === p.kode && x.tahun_akademik === ta);
    if (!k) return;
    set(p.lembar, `${'DEF'[j]}${p.baris}`, juta(k.dana_upps));
    set(p.lembar, `${'HIJ'[j]}${p.baris}`, juta(k.dana_ps));
  });

  Object.defineProperty(peta, 'sisipBaris', { value: [...sisipP1, ...sisipL1] });
  return peta;
}

/* Isi templat (string XML per lembar). Murni: { path: xml } -> { path: xml }. */
/* calcChain templat dibuang (2026-11-25): sisipan baris menggeser rumus dan rumus baris contoh P.1.2 dihapus,
   sehingga daftar urutan hitung templat tidak lagi cocok dan Excel bisa menawarkan "perbaikan". Bagian ini
   opsional; Excel menyusunnya lagi saat menghitung ulang (fullCalcOnLoad). */
// CPL kurikulum terbaru di antara MK aktif (pemilik 2026-11-24), dipakai LKPS E.4 dan draf LED (4.1).
export function cplTerbaru(X){
  const kurs = [...new Set((X.mk || []).filter(m => m.aktif !== false).map(m => m.kurikulum).filter(Boolean))].sort();
  const kurikulum = kurs[kurs.length - 1];
  const cpl = (X.cpl || []).filter(c => c.kurikulum === kurikulum)
    .sort((a, b) => ((a.urutan ?? 100) - (b.urutan ?? 100)) || String(a.kode).localeCompare(String(b.kode), undefined, { numeric: true }));
  return { kurikulum, cpl };
}

export function tanpaCalcChain(rels, types){
  return { rels: rels.replace(/<Relationship\b[^>]*\/calcChain"[^>]*\/>/g, ''),
           types: types.replace(/<Override\b[^>]*PartName="\/xl\/calcChain\.xml"[^>]*\/>/g, '') };
}

export function isiLembar(xmlPerLembar, lembar, contoh, peta){
  const out = { ...xmlPerLembar };
  let kosong = 0, isi = 0;
  const kurang = [...Object.keys(contoh), ...Object.keys(peta)].filter(n => !lembar[n]);
  if (kurang.length) throw new Error(`lembar tidak ada di templat: ${[...new Set(kurang)].join(', ')}`);
  // 1. contoh dan label tak terpakai dikosongkan (alamat templat); 2. kolom disisipkan dan rujukan lembar
  //    lain digeser; 3. isian ditulis (alamat sesudah sisipan).
  for (const daftar of [contoh, peta.kosongTambahan || {}])
    for (const [nama, refs] of Object.entries(daftar)) {
      let x = out[lembar[nama]];
      for (const ref of refs) { x = kosongkanSel(x, ref); kosong++; }
      out[lembar[nama]] = x;
    }
  for (const [nama, refs] of Object.entries(peta.hapusRumus || {})) {
    let x = out[lembar[nama]];
    for (const ref of refs) x = hapusRumus(x, ref);
    out[lembar[nama]] = x;
  }
  for (const s of peta.sisip || []) {
    out[lembar[s.lembar]] = sisipKolom(out[lembar[s.lembar]], s.setelah, s.n);
    for (const [nama, path] of Object.entries(lembar))
      if (nama !== s.lembar && out[path] != null) out[path] = geserRujukan(out[path], s.lembar, s.setelah, s.n);
  }
  // Sisip baris dari bawah ke atas: alamat templat tabel di atasnya tetap berlaku.
  for (const s of [...(peta.sisipBaris || [])].sort((a, b) => b.baris - a.baris)) {
    out[lembar[s.lembar]] = sisipBaris(out[lembar[s.lembar]], s.lembar, s.baris, s.n);
    for (const [nama, path] of Object.entries(lembar))
      if (nama !== s.lembar && out[path] != null) out[path] = geserRujukanBaris(out[path], s.lembar, s.baris, s.n);
  }
  for (const [nama, sel] of Object.entries(peta)) {
    let x = out[lembar[nama]];
    for (const [ref, v] of Object.entries(sel)) {
      x = v && typeof v === 'object' && 'rumus' in v ? tulisRumus(x, ref, v.rumus) : tulisSel(x, ref, v); isi++;
    }
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
  // Semua lembar dimuat: sisipan kolom E.4 ikut menggeser rumus Daftar Isi yang merujuknya.
  const xml = {};
  for (const path of Object.values(lembar)) xml[path] = await zip.file(path).async('string');
  const h = isiLembar(xml, lembar, contoh, peta);
  for (const [path, x] of Object.entries(h.xml)) zip.file(path, x);
  zip.file('xl/workbook.xml', hitungUlangSaatBuka(wb));
  const t = tanpaCalcChain(await zip.file('xl/_rels/workbook.xml.rels').async('string'),
    await zip.file('[Content_Types].xml').async('string'));
  zip.file('xl/_rels/workbook.xml.rels', t.rels); zip.file('[Content_Types].xml', t.types); zip.remove('xl/calcChain.xml');
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const nama = `LKPS-${(C.prodi || 'prodi').replace(/[^\w-]+/g, '_')}-TS${C.ts}.xlsx`;
  if (opsi.unduh !== false) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nama;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  }
  return { nama, sel: h.isi, kosong: h.kosong, lembar: Object.keys(peta), peringatan: peta.peringatan, blob };
}
