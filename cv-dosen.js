// CV dosen otomatis (.docx), pemilik 2026-11-11: CV akademik umum, bisa disunting di Word.
// Karya: hanya yang terverifikasi (data.json publik). Profil (NIDN, jabatan, pendidikan,
// keahlian, sertifikat, email): tabel dosen di Supabase, dibaca dosen itu sendiri atau admin.
// Dipakai profil.html (CV sendiri) dan kelola-dosen.html (admin, semua dosen).
import { run, para, judul, teks, tabel, buatDocx } from './docx-dasar.js?v=2026-11-13-a41e8b';
import { JENJANG, JENIS_SERTIFIKAT, JABATAN, KATEGORI } from './profil-dosen.js?v=2026-11-13-a41e8b';

const label = (xs, k) => (xs.find(x => x[0] === k) || [, k || ''])[1];
const rapi = s => String(s || '').replace(/_/g, ' ').trim();
const nm = s => String(s || '').trim().toLowerCase();
const INDEKS = { scopus_q1: 'Scopus Q1', scopus_q2: 'Scopus Q2', scopus_q3: 'Scopus Q3', scopus_q4: 'Scopus Q4', wos: 'Web of Science',
  sinta_1_2: 'SINTA 1–2', sinta_3_4: 'SINTA 3–4', sinta_5_6: 'SINTA 5–6', tidak_terindeks: 'tidak terindeks' };
const URUT_JENJANG = JENJANG.map(x => x[0]);

/** Tahun awal untuk pilihan periode: 'semua' -> null, '5' -> tahun ini - 4. */
export const tahunAwal = (pilih, kini = new Date()) => pilih === '5' ? kini.getFullYear() - 4 : null;

/** Karya terverifikasi milik dosen P dari data.json D (dicocokkan lewat slug atau nama). */
export function kumpulKarya(P, D, dariTahun = null){
  const slug = (D.dosen || []).find(d => nm(d.nama) === nm(P.nama))?.slug;
  const milik = xs => (xs || []).filter(a => (slug && a.slug === slug) || nm(a.nama) === nm(P.nama));
  const masuk = x => dariTahun == null || +x.tahun >= dariTahun;
  const urut = xs => xs.sort((a, b) => (b.tahun || 0) - (a.tahun || 0) || String(a.judul).localeCompare(String(b.judul)));
  const denganPeran = x => { const a = milik(x.penulis)[0]; return a ? { ...x, peran: a.peran, korespondensi: !!a.korespondensi } : null; };
  const pub = urut((D.publikasi || []).filter(masuk).map(denganPeran).filter(Boolean));
  const keg = (D.kegiatan || []).filter(masuk).map(denganPeran).filter(Boolean);
  return {
    publikasi: pub,
    penelitian: urut(keg.filter(k => k.kategori === 'penelitian')),
    pkm: urut(keg.filter(k => k.kategori === 'pkm')),
    luaran: urut((D.luaran_dosen || []).filter(masuk).filter(l => (l.dosen || []).some(n => nm(n) === nm(P.nama)))),
    rekognisi: urut((D.rekognisi || []).filter(masuk).filter(r => nm(r.dosen) === nm(P.nama))),
  };
}

// Daftar penulis dengan nama pemilik CV dicetak tebal.
function runPenulis(penulis, P){
  const xs = penulis || [];
  return xs.map((a, i) => run(a.nama + (i < xs.length - 1 ? ', ' : ''), { b: nm(a.nama) === nm(P.nama) })).join('');
}

/** Isi <w:body> CV. P = baris dosen (Supabase); D = data.json; o = { dariTahun, tanggal }. */
export function isiCV(P, D, o = {}){
  const K = kumpulKarya(P, D, o.dariTahun);
  const scopus = K.publikasi.filter(p => /^scopus/.test(p.indeksasi || '')).length;
  const periode = o.dariTahun ? `${o.dariTahun}–sekarang` : 'seluruh tahun';
  const out = [];
  out.push(para(run('CURRICULUM VITAE', { b: true, sz: 32 }), { jc: 'center', after: 40 }));
  out.push(para(run(P.nama || '', { b: true, sz: 28 }), { jc: 'center', after: 20 }));
  out.push(para(run([label(JABATAN, P.jabatan) || '', [D.prodi, D.institusi].filter(Boolean).join(', ')].filter(Boolean).join(' · ')), { jc: 'center', after: 200 }));
  out.push(teks(`Ringkasan karya terverifikasi (${periode}): ${K.publikasi.length} publikasi (${scopus} terindeks Scopus), `
    + `${K.penelitian.length} penelitian, ${K.pkm.length} pengabdian kepada masyarakat, ${K.luaran.length} luaran/HKI, ${K.rekognisi.length} rekognisi.`));

  out.push(judul('Identitas', 1));
  const id = [['Nama', P.nama], ['NIDN', P.nidn], ['Jabatan akademik', label(JABATAN, P.jabatan)], ['Kategori dosen', label(KATEGORI, P.kategori)],
    ['Bidang keahlian', P.bidang_keahlian], ['Program studi', [D.prodi, D.institusi].filter(Boolean).join(', ')], ['Email', P.email],
    ['SINTA ID', P.sinta_id], ['Scopus Author ID', P.scopus_id], ['ORCID', P.orcid], ['Nomor sertifikat pendidik', P.nomor_serdos]]
    .filter(([, v]) => String(v ?? '').trim());
  out.push(tabel([['Isian', 'Keterangan'], ...id.map(([k, v]) => [k, String(v)])]));

  const rp = [...(P.riwayat_pendidikan || [])].sort((a, b) => URUT_JENJANG.indexOf(a.jenjang) - URUT_JENJANG.indexOf(b.jenjang)
    || String(a.tahun_lulus || '').localeCompare(String(b.tahun_lulus || '')));
  out.push(judul('Riwayat pendidikan', 1));
  out.push(rp.length ? tabel([['Jenjang', 'Perguruan tinggi', 'Program studi', 'Bidang ilmu', 'Negara', 'Tahun lulus'],
    ...rp.map(r => [label(JENJANG, r.jenjang), r.perguruan_tinggi, r.program_studi, r.bidang_ilmu, r.negara, r.tahun_lulus])])
    : teks('Belum diisi di profil.', { after: 120 }));

  const sr = P.sertifikat || [];
  if (sr.length) {
    out.push(judul('Sertifikasi', 1));
    out.push(tabel([['Jenis', 'Bidang', 'Lembaga penerbit', 'Nomor', 'Tahun'],
      ...sr.map(s => [label(JENIS_SERTIFIKAT, s.jenis), s.bidang, s.lembaga, s.nomor, s.tahun])]));
  }

  out.push(judul(`Publikasi (${K.publikasi.length})`, 1));
  if (!K.publikasi.length) out.push(teks('Belum ada publikasi terverifikasi pada periode ini.'));
  K.publikasi.forEach((p, i) => {
    const ket = [rapi(p.jenis), INDEKS[p.indeksasi] || '', p.peran === 'penulis_pertama' ? 'penulis pertama' : '', p.korespondensi ? 'korespondensi' : '']
      .filter(Boolean).join(', ');
    out.push(para(run(`${i + 1}. `) + runPenulis(p.penulis, P) + run(` (${p.tahun}). ${p.judul}. `)
      + run(p.terbitan || '', { i: true }) + run(`${p.terbitan ? '. ' : ''}${p.doi ? `https://doi.org/${String(p.doi).replace(/^https?:\/\/(dx\.)?doi\.org\//, '')}. ` : p.url ? `${p.url}. ` : ''}`)
      + run(ket ? `[${ket}]` : '', { sz: 18, warna: '555555' }), { jc: 'left', after: 80 }));
  });

  const tabelKeg = xs => tabel([['No', 'Tahun', 'Judul', 'Skema / sumber dana', 'Peran', 'Mitra'],
    ...xs.map((k, i) => [String(i + 1), k.tahun, k.judul, [...new Set([k.skema, k.kelompok].filter(Boolean))].join(' — '), k.peran === 'ketua' ? 'Ketua' : 'Anggota',
      (k.mitra || []).map(m => m.nama).join('; ')])]);
  out.push(judul(`Penelitian (${K.penelitian.length})`, 1));
  out.push(K.penelitian.length ? tabelKeg(K.penelitian) : teks('Belum ada penelitian terverifikasi pada periode ini.'));
  out.push(judul(`Pengabdian kepada masyarakat (${K.pkm.length})`, 1));
  out.push(K.pkm.length ? tabelKeg(K.pkm) : teks('Belum ada PkM terverifikasi pada periode ini.'));

  if (K.luaran.length) {
    out.push(judul(`Luaran dan HKI (${K.luaran.length})`, 1));
    out.push(tabel([['Tahun', 'Jenis', 'Judul'], ...K.luaran.map(l => [l.tahun, l.nama_bagian || rapi(l.jenis), l.judul])]));
  }
  if (K.rekognisi.length) {
    out.push(judul(`Rekognisi (${K.rekognisi.length})`, 1));
    out.push(tabel([['Tahun', 'Bentuk', 'Kegiatan', 'Tingkat'], ...K.rekognisi.map(r => [r.tahun, rapi(r.bentuk), String(r.nama_kegiatan || '').trim(), rapi(r.tingkat)])]));
  }
  out.push(para(run(`Disusun otomatis dari situs kinerja program studi pada ${o.tanggal || new Date().toISOString().slice(0, 10)}. `
    + 'Daftar karya hanya memuat karya yang sudah diverifikasi program studi; silakan disunting seperlunya.', { i: true, sz: 18, warna: '555555' }), { before: 240 }));
  return out.join('');
}

/** Berkas CV (.docx, Blob). */
export const buatCV = (P, D, o) => buatDocx(isiCV(P, D, o));
/** Nama berkas: CV_<Nama>_<tanggal>.docx (aman untuk sistem berkas). */
export const namaBerkasCV = (P, tanggal = new Date().toISOString().slice(0, 10)) =>
  `CV_${String(P.nama || 'dosen').replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_|_$/g, '')}_${tanggal}.docx`;

// ---------------------------------------------------------------------------
// Biodata pengusul hibah (pemilik 2026-11-11): susunan A–J panduan Penelitian dan PkM
// Kemdiktisaintek (edisi sebelum BIMA; cocokkan dengan panduan terbaru sebelum dipakai).
// Data yang belum tersimpan di sistem ditandai "(isi)" untuk dilengkapi di Word.
// Rentang: 5 tahun terakhir, penghargaan 10 tahun (sesuai judul bagian panduan).

const ISI = '(isi)';
const HKI = { paten: 'Paten', paten_sederhana: 'Paten sederhana', hak_cipta: 'Hak cipta', desain_industri: 'Desain industri', merek: 'Merek' };
const BUKU = new Set(['buku_isbn', 'book_chapter']);
const juta = v => v == null || v === '' || !Number.isFinite(+v) ? ISI : (Math.round(+v / 1e5) / 10).toLocaleString('id-ID');
const kunciKarya = (kategori, judulK, tahun) => `${kategori}|${nm(judulK)}|${tahun}`;

/** Mata kuliah yang diampu: kolom pengampu berisi NIDN (larik, atau teks dipisah koma/titik koma). */
export function mkDiampu(P, mk){
  const nidn = String(P.nidn || '').trim();
  if (!nidn) return [];
  return (mk || []).filter(m => m.aktif !== false)
    .filter(m => (Array.isArray(m.pengampu) ? m.pengampu : String(m.pengampu || '').split(/[;,]/)).map(x => String(x).trim()).includes(nidn))
    .sort((a, b) => String(a.kode).localeCompare(String(b.kode)));
}

/** Isi <w:body> biodata. o = { tanggal, kini, dana: baris karya {kategori, judul, tahun, besaran_dana, nama_terbitan}, mk, hibah }. */
export function isiBiodataHibah(P, D, o = {}){
  const kini = o.kini || new Date(), th = kini.getFullYear();
  const K = kumpulKarya(P, D, th - 4), K10 = kumpulKarya(P, D, th - 9);
  const tambah = new Map((o.dana || []).map(k => [kunciKarya(k.kategori, k.judul, k.tahun), k]));
  const cari = (kat, x) => tambah.get(kunciKarya(kat, x.judul, x.tahun)) || {};
  const mk = mkDiampu(P, o.mk);
  const rp = P.riwayat_pendidikan || [];
  const jenjang = awal => rp.filter(r => String(r.jenjang || '').startsWith(awal))
    .sort((a, b) => String(b.tahun_lulus || '').localeCompare(String(a.tahun_lulus || '')))[0] || null;
  const S = [jenjang('sarjana'), jenjang('magister'), jenjang('doktor')];
  const nomor = xs => xs.map((r, i) => [String(i + 1), ...r]);
  const kosong = n => [[...Array(n)].map((_, i) => i === 0 ? '1' : ISI)];
  const bagian = (judulB, kepala, baris) => judul(judulB, 1) + tabel([kepala, ...(baris.length ? nomor(baris) : kosong(kepala.length))]);
  const kantor = [D.prodi, D.institusi].filter(Boolean).join(', ');
  const out = [];
  out.push(para(run('BIODATA PENGUSUL', { b: true, sz: 28 }), { jc: 'center', after: 40 }));
  out.push(para(run(o.hibah ? `untuk ${o.hibah}` : 'Ketua / Anggota Tim Pengusul', { i: true }), { jc: 'center', after: 200 }));

  out.push(judul('A. Identitas Diri', 1));
  out.push(tabel([['No', 'Isian', 'Keterangan'], ...[
    ['Nama lengkap (dengan gelar)', P.nama || ISI], ['Jenis kelamin', ISI], ['Jabatan fungsional', label(JABATAN, P.jabatan) || ISI],
    ['NIP/NIK/identitas lainnya', ISI], ['NIDN', P.nidn || ISI], ['Tempat dan tanggal lahir', ISI], ['E-mail', P.email || ISI],
    ['Nomor telepon/HP', ISI], ['Alamat kantor', kantor ? `${kantor} ${ISI}` : ISI],
    ['Nomor telepon/faks kantor', ISI], ['Lulusan yang telah dihasilkan', `S-1 = ${ISI} orang; S-2 = ${ISI} orang; S-3 = ${ISI} orang`],
    ['Mata kuliah yang diampu', mk.length ? mk.map(m => `${m.nama}${m.sks ? ` (${m.sks} SKS)` : ''}`).join('; ') : ISI],
  ].map((r, i) => [String(i + 1), ...r])]));

  out.push(judul('B. Riwayat Pendidikan', 1));
  out.push(tabel([['', 'S-1', 'S-2', 'S-3'],
    ['Nama perguruan tinggi', ...S.map(r => r ? (r.perguruan_tinggi || ISI) : '—')],
    ['Bidang ilmu', ...S.map(r => r ? (r.bidang_ilmu || r.program_studi || ISI) : '—')],
    ['Tahun masuk–lulus', ...S.map(r => r ? `${ISI}–${r.tahun_lulus || ISI}` : '—')],
    ['Judul skripsi/tesis/disertasi', ...S.map(r => r ? ISI : '—')],
    ['Nama pembimbing/promotor', ...S.map(r => r ? ISI : '—')]]));

  const keg = (xs, kat) => xs.map(x => { const t = cari(kat, x);
    return [String(x.tahun), x.judul, [...new Set([x.skema, x.kelompok].filter(Boolean))].join(' — ') || ISI, juta(t.besaran_dana)]; });
  out.push(bagian('C. Pengalaman Penelitian dalam 5 Tahun Terakhir (bukan skripsi, tesis, maupun disertasi)',
    ['No', 'Tahun', 'Judul penelitian', 'Sumber pendanaan', 'Jumlah (juta Rp)'], keg(K.penelitian, 'penelitian')));
  out.push(bagian('D. Pengalaman Pengabdian kepada Masyarakat dalam 5 Tahun Terakhir',
    ['No', 'Tahun', 'Judul pengabdian kepada masyarakat', 'Sumber pendanaan', 'Jumlah (juta Rp)'], keg(K.pkm, 'pkm')));
  out.push(bagian('E. Publikasi Artikel Ilmiah dalam Jurnal dalam 5 Tahun Terakhir',
    ['No', 'Judul artikel ilmiah', 'Nama jurnal', 'Volume/Nomor/Tahun'],
    K.publikasi.filter(p => p.jenis === 'jurnal').map(p => [p.judul, p.terbitan || ISI, `${ISI}/${ISI}/${p.tahun}`])));
  out.push(bagian('F. Pemakalah Seminar Ilmiah (Oral Presentation) dalam 5 Tahun Terakhir',
    ['No', 'Nama pertemuan ilmiah/seminar', 'Judul artikel ilmiah', 'Waktu dan tempat'],
    K.publikasi.filter(p => p.jenis === 'prosiding').map(p => [p.terbitan || ISI, p.judul, `${p.tahun}, ${ISI}`])));
  out.push(bagian('G. Karya Buku dalam 5 Tahun Terakhir',
    ['No', 'Judul buku', 'Tahun', 'Jumlah halaman', 'Penerbit'],
    K.luaran.filter(l => BUKU.has(l.jenis)).map(l => [l.judul, String(l.tahun), ISI, cari('luaran', l).nama_terbitan || ISI])));
  out.push(bagian('H. Perolehan HKI dalam 5 Tahun Terakhir',
    ['No', 'Judul/tema HKI', 'Tahun', 'Jenis', 'Nomor P/ID'],
    K.luaran.filter(l => HKI[l.jenis]).map(l => [l.judul, String(l.tahun), HKI[l.jenis], cari('luaran', l).nama_terbitan || ISI])));
  out.push(bagian('I. Pengalaman Merumuskan Kebijakan Publik/Rekayasa Sosial Lainnya dalam 5 Tahun Terakhir',
    ['No', 'Judul/tema/jenis rekayasa sosial', 'Tahun', 'Tempat penerapan', 'Respons masyarakat'], []));
  out.push(bagian('J. Penghargaan dalam 10 Tahun Terakhir (dari pemerintah, asosiasi, atau institusi lainnya)',
    ['No', 'Jenis penghargaan', 'Institusi pemberi penghargaan', 'Tahun'],
    K10.rekognisi.filter(r => r.bentuk === 'penghargaan').map(r => [String(r.nama_kegiatan || '').trim(), ISI, String(r.tahun)])));

  out.push(teks('Semua data yang saya isikan dan tercantum dalam biodata ini adalah benar dan dapat dipertanggungjawabkan secara hukum. '
    + 'Apabila di kemudian hari ternyata dijumpai ketidaksesuaian dengan kenyataan, saya sanggup menerima sanksi. Demikian biodata ini '
    + `saya buat dengan sebenarnya untuk memenuhi salah satu persyaratan dalam pengajuan ${o.hibah || ISI}.`, { before: 240 }));
  out.push(para(run(`${ISI}, ${o.tanggal || kini.toISOString().slice(0, 10)}`), { jc: 'right', before: 200, after: 40 }));
  out.push(para(run('Pengusul,'), { jc: 'right', after: 720 }));
  out.push(para(run(P.nama || ISI, { b: true }), { jc: 'right' }));
  out.push(para(run('Disusun otomatis dari situs kinerja program studi; karya hanya yang terverifikasi prodi. Susunan mengikuti panduan Penelitian '
    + 'dan PkM Kemdiktisaintek: cocokkan dengan panduan hibah yang dituju dan lengkapi isian bertanda (isi).', { i: true, sz: 18, warna: '555555' }), { before: 240 }));
  return out.join('');
}

export const buatBiodataHibah = (P, D, o) => buatDocx(isiBiodataHibah(P, D, o));

/** Unduh CV di peramban. gaya: 'cv' (CV akademik) atau 'hibah' (biodata pengusul; perlu sb untuk dana dan MK). */
export async function unduhCV(P, pilihPeriode = 'semua', gaya = 'cv', sb = null){
  const D = await fetch('data.json?v=' + Date.now()).then(r => { if (!r.ok) throw new Error('data.json ' + r.status); return r.json(); });
  const tanggal = new Date().toISOString().slice(0, 10);
  let blob, nama;
  if (gaya === 'hibah') {
    const [k, m] = sb ? await Promise.all([
      sb.from('karya').select('judul,tahun,kategori,besaran_dana,nama_terbitan').eq('status', 'terverifikasi').in('kategori', ['penelitian', 'pkm', 'luaran']),
      sb.from('ref_mata_kuliah').select('kode,nama,sks,pengampu,aktif')]) : [{}, {}];
    blob = await buatBiodataHibah(P, D, { tanggal, dana: k.data || [], mk: m.data || [] });
    nama = namaBerkasCV(P, tanggal).replace(/^CV_/, 'Biodata_hibah_');
  } else {
    blob = await buatCV(P, D, { dariTahun: tahunAwal(pilihPeriode), tanggal });
    nama = namaBerkasCV(P, tanggal);
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nama;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/** Pilihan format + periode + tombol unduh (profil.html). */
export const htmlTombolCV = id => `<label class="ket">Format <select id="cv_gaya_${id}"><option value="cv">CV akademik</option>
  <option value="hibah">Biodata pengusul hibah (A–J)</option></select></label>
  <label class="ket">Periode karya <select id="cv_periode_${id}"><option value="semua">semua tahun</option>
  <option value="5">5 tahun terakhir</option></select></label> <button type="button" class="btn" data-cv="${id}">Unduh (.docx)</button>
  <span class="msg" id="cv_msg_${id}"></span>
  <div class="ket">Biodata hibah selalu memakai 5 tahun terakhir (penghargaan 10 tahun); isian bertanda (isi) dilengkapi di Word.</div>`;
