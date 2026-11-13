// Bahan Rapat Tinjauan Manajemen (.docx), pemilik 2026-11-12. Disusun dari data situs untuk satu TS:
// tindak lanjut RTM sebelumnya, hasil AMI, capaian standar SPMI (Siklus PPEPP), IKU/IKT, evaluasi
// pembelajaran, tindak lanjut lain yang masih terbuka, revisi standar, dan tabel usulan keputusan.
// Keputusan RTM dicatat di Rapat dan notulen (jenis RTM); revisi standar di Data prodi › Revisi standar.
import { run, para, judul, teks, tabel, buatDocx } from './docx-dasar.js?v=2026-11-13-0fce0b';
import { siklusPPEPP, TAHAP, tsDariTanggal, labelTS } from './standar-spmi.js?v=2026-11-13-0fce0b';
import { nilaiCapaian } from './capaian-iku.js?v=2026-11-13-0fce0b';
import { labelKategori, labelStatus, KATEGORI_TEMUAN } from './temuan-ami.js?v=2026-11-13-0fce0b';
import { rekapSurvei, aspekTindakLanjut, labelKelompok } from './survei-kepuasan.js?v=2026-11-13-0fce0b';

const tgl = d => d ? String(d).slice(0, 10).split('-').reverse().join('/') : '';
const pendek = (s, n) => { s = String(s ?? '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const angka = v => v == null || v === '' ? '—' : String(Math.round(+v * 100) / 100).replace('.', ',');
const STATUS_TINDAK = { terbuka: 'Terbuka', proses: 'Dalam proses', selesai: 'Selesai' };
const kosong = s => teks(s, { i: true });

/**
 * Isi <w:body>. X = { prodi, ts, standar, capaian, revisi, target (IKU, capaian efektif; null = tidak terbaca),
 * temuan, rapat, tindakRapat (rapat_tindak dengan rapat_id), tindakEval (evaluasi_tindak dengan evaluasi_mk),
 * rekapEval (rekap_evaluasi()), survei ([{judul, kelompok, tahun_ts, n, pertanyaan, hitung}] | null), namaDosen: id -> nama }.
 */
export function isiBahanRTM(X, kini = new Date()){
  const { ts } = X, out = [], nama = X.namaDosen || (() => '');
  const S = siklusPPEPP(X, ts);
  const rapatPer = new Map((X.rapat || []).map(r => [r.id, r]));
  const awalTS = `${ts - 1}-09-01`;
  out.push(para(run('BAHAN RAPAT TINJAUAN MANAJEMEN', { b: true, sz: 32 }), { jc: 'center', before: 0, after: 60 }));
  out.push(para(run(X.prodi || 'Program Studi', { b: true, sz: 26 }), { jc: 'center', after: 60 }));
  out.push(para(run(`Tahun akademik (TS) ${labelTS(ts)}`, { sz: 24 }), { jc: 'center', after: 60 }));
  out.push(para(run(`Disusun otomatis dari situs kinerja prodi pada ${kini.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}. `
    + 'Bahan ini masukan rapat; keputusan RTM dicatat di Rapat dan notulen (jenis RTM).', { i: true, sz: 18, warna: '595959' }), { jc: 'center', after: 240 }));

  // 1. Tindak lanjut RTM sebelumnya.
  out.push(judul('1. Tindak lanjut keputusan RTM sebelumnya', 1));
  const rtmLalu = (X.tindakRapat || []).filter(t => { const r = rapatPer.get(t.rapat_id); return r && r.jenis === 'rtm' && String(r.tanggal) < awalTS; });
  const rtmBuka = rtmLalu.filter(t => t.status !== 'selesai' && t.status !== 'batal');
  out.push(teks(`${rtmLalu.length} keputusan dari RTM sebelum TS ini; ${rtmLalu.length - rtmBuka.length} sudah selesai, ${rtmBuka.length} belum.`));
  if (rtmBuka.length) out.push(tabel([['Keputusan', 'RTM', 'PJ', 'Tenggat', 'Status'], ...rtmBuka.map(t => [pendek(t.keputusan, 140),
    tgl(rapatPer.get(t.rapat_id)?.tanggal), t.pj_nama || nama(t.pj_dosen_id), tgl(t.tenggat), STATUS_TINDAK[t.status] || t.status])]));

  // 2. Hasil AMI.
  out.push(judul('2. Hasil audit mutu internal', 1));
  const tem = (X.temuan || []).filter(t => +t.tahun_ts === +ts);
  if (!tem.length) out.push(kosong(`Tidak ada temuan AMI tercatat untuk TS ${labelTS(ts)} (Data prodi › Temuan AMI).`));
  else {
    out.push(tabel([['Kategori', 'Jumlah', 'Belum ditutup'], ...KATEGORI_TEMUAN.map(([k, l]) => [l, String(tem.filter(t => t.kategori === k).length),
      String(tem.filter(t => t.kategori === k && t.status !== 'ditutup').length)]).filter(r => r[1] !== '0')]));
    const buka = tem.filter(t => t.status !== 'ditutup');
    if (buka.length) out.push(tabel([['Kode', 'Temuan', 'Kategori', 'Rencana tindak lanjut', 'Tenggat', 'Status'], ...buka.map(t => [t.kode || '',
      pendek(t.uraian, 120), labelKategori(t.kategori), pendek(t.rencana, 100) || '—', tgl(t.tenggat), labelStatus(t.status)])]));
  }

  // 3. Capaian standar SPMI.
  out.push(judul('3. Capaian standar SPMI (siklus PPEPP)', 1));
  if (!S.baris.length) out.push(kosong('Belum ada butir standar yang dipantau prodi (Data prodi › SPMI › Standar SPMI).'));
  else {
    out.push(teks(`${S.baris.length} butir standar dipantau; ${S.lengkap} lengkap kelima tahapnya pada TS ini.`));
    out.push(tabel([['Tahap', 'Ada', 'Perlu dilengkapi', 'Tidak perlu'], ...TAHAP.map(([k, l]) => [l, String(S.hitung[k].ada), String(S.hitung[k].kurang), String(S.hitung[k].na)])]));
    const nilai = S.baris.filter(b => b.capaian?.status);
    out.push(teks(`Capaian dinilai: ${nilai.length} butir; tercapai ${nilai.filter(b => b.capaian.status === 'tercapai').length}, `
      + `belum tercapai ${nilai.filter(b => b.capaian.status === 'belum').length}, tidak berlaku ${nilai.filter(b => b.capaian.status === 'tidak_berlaku').length}.`));
    const belum = S.baris.filter(b => b.capaian?.status === 'belum');
    if (belum.length) out.push(tabel([['Kode', 'Pernyataan standar', 'Target', 'Capaian', 'Analisis', 'Rencana perbaikan'], ...belum.map(b => [b.standar.kode,
      pendek(b.standar.pernyataan, 100), pendek(b.capaian.target, 60), pendek(b.capaian.capaian, 60), pendek(b.capaian.analisis, 80) || '—', pendek(b.capaian.rencana, 80) || '—'])]));
    const per = new Map();
    S.baris.forEach(b => { const l = b.standar.lembar || 'Standar prodi'; const x = per.get(l) || [0, 0];
      x[0]++; if (TAHAP.some(([k]) => b.tahap[k].status === 'kurang')) x[1]++; per.set(l, x); });
    out.push(tabel([['Lembar standar', 'Butir dipantau', 'Ada tahap perlu dilengkapi'], ...[...per].map(([l, [n, k]]) => [l, String(n), String(k)])]));
  }

  // 4. IKU/IKT.
  out.push(judul('4. Capaian IKU dan IKT', 1));
  const iku = X.target == null ? null : X.target.filter(r => +r.tahun_ts === +ts);
  if (iku == null) out.push(kosong('Data IKU/IKT hanya terbaca oleh admin; unduh bahan ini sebagai admin untuk bagian ini.'));
  else if (!iku.length) out.push(kosong(`Belum ada IKU/IKT untuk TS ${labelTS(ts)} (Data prodi › Target IKU/IKT).`));
  else out.push(tabel([['Indikator', 'Jenis', 'Target', 'Capaian', 'Status', 'Analisis dan rencana'], ...iku.map(r => { const s = nilaiCapaian(r).status;
    return [r.nama, String(r.jenis).toUpperCase(), `${r.arah === 'maksimal' ? '≤' : '≥'} ${angka(r.target)} ${r.satuan || ''}`.trim(), r.capaian == null ? '—' : `${angka(r.capaian)} ${r.satuan || ''}`.trim(),
      { tercapai: 'tercapai', hampir: 'hampir', belum: 'belum', kosong: 'belum diukur' }[s],
      s === 'belum' || s === 'hampir' ? [r.analisis, r.rencana_perbaikan && `Rencana: ${r.rencana_perbaikan}`].filter(Boolean).join(' ') || 'BELUM DIANALISIS' : '—']; })]));

  // 5. Evaluasi pembelajaran.
  out.push(judul('5. Evaluasi pembelajaran', 1));
  const ta = labelTS(ts), rk = (X.rekapEval || []).filter(r => r.tahun_akademik === ta);
  if (!rk.length) out.push(kosong(`Belum ada data evaluasi pembelajaran untuk ${ta} (Operasional › Evaluasi pembelajaran).`));
  else out.push(tabel([['Semester', 'MK × dosen', 'Rerata EDOM', 'Di bawah ambang', 'Sudah ditindaklanjuti', 'Refleksi RPS terisi', 'Tindak lanjut selesai'],
    ...rk.map(r => [r.semester, String(r.jumlah), r.rerata_edom == null ? '—' : angka(r.rerata_edom), String(r.di_bawah_ambang),
      `${r.bawah_bertindak} dari ${r.di_bawah_ambang}`, `${r.rps_terisi} dari ${r.jumlah}`, `${r.tindak_selesai} dari ${r.tindak}`])]));
  const tev = (X.tindakEval || []).filter(t => t.status !== 'selesai' && (!t.evaluasi_mk || t.evaluasi_mk.tahun_akademik === ta));
  if (tev.length) out.push(tabel([['Mata kuliah', 'Masalah', 'Rencana', 'PJ', 'Tenggat', 'Status'], ...tev.map(t => [
    t.evaluasi_mk ? `${t.evaluasi_mk.kode_mk} ${t.evaluasi_mk.semester}` : '—', pendek(t.masalah, 90), pendek(t.rencana, 90), nama(t.pj_id), tgl(t.tenggat),
    STATUS_TINDAK[t.status] || t.status])]));

  // 6. Umpan balik pemangku kepentingan.
  out.push(judul('6. Umpan balik pemangku kepentingan', 1));
  // Survei kepuasan TS ini (54-patch); X.survei = [{ judul, kelompok, tahun_ts, n, pertanyaan, hitung }], null = tidak terbaca.
  const sv = (X.survei || []).filter(s => +s.tahun_ts === +ts && s.n);
  if (X.survei == null) out.push(kosong('Hasil survei kepuasan tidak terbaca; unduh bahan ini sebagai admin atau pimpinan.'));
  else if (!sv.length) out.push(kosong(`Belum ada survei kepuasan berjawaban untuk TS ${labelTS(ts)} (Operasional › Survei kepuasan).`));
  else {
    const rk = sv.map(s => ({ s, r: rekapSurvei(s.pertanyaan, s.hitung) }));
    out.push(tabel([['Kelompok', 'Survei', 'Responden', 'Rerata (1–4)', '% puas', 'Aspek di bawah ambang'], ...rk.map(({ s, r }) => [labelKelompok(s.kelompok),
      pendek(s.judul, 60), String(s.n), r.rerata == null ? '—' : angka(r.rerata), r.puas == null ? '—' : `${angka(r.puas)}%`,
      aspekTindakLanjut(r).map(a => `${a.label} (${a.alasan.join('; ')})`).join('; ') || '—'])]));
    out.push(teks('Ambang: % puas di bawah 75 atau rerata di bawah 3 (sama dengan Hasil survei kepuasan). Rincian per pertanyaan di halaman Survei kepuasan.', { i: true }));
  }
  out.push(kosong('[Isi bila ada: keluhan atau masukan pemangku kepentingan di luar survei.]'));

  // 7. Tindak lanjut lain.
  out.push(judul('7. Tindak lanjut rapat lain yang masih terbuka', 1));
  const lain = (X.tindakRapat || []).filter(t => { const r = rapatPer.get(t.rapat_id); return r && r.jenis !== 'rtm' && (t.status === 'terbuka' || t.status === 'proses'); });
  if (!lain.length) out.push(kosong('Tidak ada tindak lanjut rapat lain yang masih terbuka.'));
  else out.push(tabel([['Keputusan', 'Rapat', 'PJ', 'Tenggat', 'Status'], ...lain.map(t => [pendek(t.keputusan, 120),
    `${pendek(rapatPer.get(t.rapat_id)?.judul, 50)} ${tgl(rapatPer.get(t.rapat_id)?.tanggal)}`, t.pj_nama || nama(t.pj_dosen_id), tgl(t.tenggat), STATUS_TINDAK[t.status] || t.status])]));

  // 8. Revisi standar.
  out.push(judul('8. Perubahan standar pada TS ini', 1));
  const rev = (X.revisi || []).filter(v => tsDariTanggal(v.tanggal) === +ts);
  const kode = id => ((X.standar || []).find(s => +s.id === +id) || {}).kode || '';
  if (!rev.length) out.push(kosong('Belum ada revisi standar tercatat pada TS ini (Data prodi › Revisi standar).'));
  else out.push(tabel([['Tanggal', 'Standar', 'Perubahan', 'Dasar'], ...rev.map(v => [tgl(v.tanggal), kode(v.standar_id), pendek(v.perubahan, 140),
    { rtm: 'Keputusan RTM', ami: 'Temuan AMI', evaluasi_capaian: 'Evaluasi capaian', kebijakan: 'Kebijakan baru', lainnya: 'Lainnya' }[v.dasar] || v.dasar])]));

  // 9. Usulan keputusan.
  out.push(judul('9. Usulan keputusan RTM', 1));
  out.push(teks('Diisi saat rapat. Keputusan yang mengubah standar dicatat juga sebagai revisi standar.', { i: true }));
  out.push(tabel([['No', 'Keputusan', 'Penanggung jawab', 'Tenggat'], ...[1, 2, 3, 4, 5].map(n => [String(n), '', '', ''])]));
  return out.join('');
}

export const buatBahanRTM = (X, kini) => buatDocx(isiBahanRTM(X, kini));
