// Laporan kinerja tahunan program studi, pemilik 2026-11-11; diperluas 2026-11-27 (mahasiswa dan lulusan, prestasi,
// kepuasan, kesenjangan CPL, kegiatan prodi, tindak lanjut) dan versi publik.
// Satu model isi (daftar blok) dirender ke Word (.docx, disusun sendiri tanpa templat) dan ke HTML (laporan-tahunan.html).
// Sumber: data.json publik, rekap survei yang sudah diterbitkan (survei_rekap), dan, khusus admin, capaian IKU/IKT,
// perkiraan status akreditasi, serta Temuan AMI. Versi publik (publik: true) tidak memuat bagian khusus admin.
import { hitungSumber } from './iku-otomatis.js?v=2026-11-27-80978c';
import { SDGS } from './form-karya.js?v=2026-11-27-80978c';
import { run, para, judul, teks, tabel, buatDocx } from './docx-dasar.js?v=2026-11-27-80978c';
import { rekapSurvei, aspekTindakLanjut, kesenjanganCPL, labelKelompok, labelAspek, lengkapiCPL } from './survei-kepuasan.js?v=2026-11-27-80978c';

const angka = v => v == null || v === '' ? '—' : (Math.round(+v * 100) / 100).toLocaleString('id-ID');
const diTS = (xs, ts) => (xs || []).filter(x => +x.tahun_ts === +ts);
const ta = ts => `${ts - 1}/${ts}`;
const rapi = s => String(s || '').replace(/_/g, ' ');
const kapital = s => { const t = rapi(s); return t.charAt(0).toUpperCase() + t.slice(1); };
const BULAN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
/** TS 1 September s.d. 31 Agustus (sama dengan bangun.py): bulan >= 9 masuk TS tahun berikutnya. */
export const tsDari = (tahun, bulan) => (+bulan >= 9 ? +tahun + 1 : +tahun);
const tsTanggal = s => { const m = /^(\d{4})-(\d{2})/.exec(String(s || '')); return m ? tsDari(m[1], m[2]) : null; };
const tglPendek = s => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '')); return m ? `${+m[3]} ${BULAN[+m[2]]} ${m[1]}` : ''; };
const persen = (a, b) => b ? `${angka(a / b * 100)}%` : '—';

// Status satu indikator (sama dengan ringkasan di Data prodi).
function statusIKU(tg, cp, arah){
  if (tg == null || cp == null) return ['—', 'capaian belum ada'];
  const maks = arah === 'maksimal', ok = maks ? cp <= tg : cp >= tg;
  const p = maks ? (cp > 0 ? tg / cp * 100 : 100) : (tg > 0 ? cp / tg * 100 : 100);
  return [`${Math.round(p)}%`, ok ? 'tercapai' : p >= 80 ? 'hampir' : 'belum'];
}

/**
 * Model isi laporan. C = { D (data.json), ts, survei (baris survei_rekap) | undefined, iku (lkps_target_kinerja) | null,
 * NA, status, langkah: [{no, n, label, pihak, naik}], temuan (ami_temuan) | null }.
 * opsi.publik: tanpa IKU/IKT, kesiapan akreditasi, dan tindak lanjut internal.
 * Hasil: [{sampul: [baris]}, {h: 1|2, t}, {p, i}, {tabel: [[kepala], ...baris]}].
 */
export function susunLaporan(C, { publik = false, kalender = false } = {}){
  const { D, ts } = C, out = [];
  // Periode (pemilik 2026-11-27): tahun akademik TS (1 Sep – 31 Agu) atau tahun kalender (1 Jan – 31 Des). Pada tahun
  // kalender, data yang hanya ada per TS (mahasiswa aktif, kerja sama, kepuasan pengguna, IKU/IKT, temuan) memakai TS
  // yang berakhir pada tahun itu dan diberi label TS-nya.
  const kal = !!kalender, PER = kal ? `tahun ${ts}` : `TS ${ta(ts)}`, catTS = kal ? `TS ${ta(ts)}` : '';
  const diPer = xs => (xs || []).filter(x => kal ? +x.tahun === +ts : +x.tahun_ts === +ts);
  const thTgl = s => +String(s || '').slice(0, 4);
  let no = 0;
  const h1 = t => out.push({ h: 1, t: `${++no}. ${t}` }), h2 = t => out.push({ h: 2, t });
  const p = (t, i = false) => out.push({ p: t, i }), tb = rows => out.push({ tabel: rows });
  const A = D.akreditasi || {};
  out.push({ sampul: ['LAPORAN KINERJA TAHUNAN PROGRAM STUDI',[D.prodi, D.institusi].filter(Boolean).join(' '),
    kal ? `Tahun ${ts} (1 Januari – 31 Desember)` : `Tahun akademik ${ta(ts)}`, `Disusun otomatis dari situs kinerja prodi pada ${new Date().toLocaleDateString('id-ID',
      { day: 'numeric', month: 'long', year: 'numeric' })}; data yang sudah diverifikasi prodi${publik ? ', versi publik' : ''}.`] });

  // Bahan bersama
  const pub = diPer(D.publikasi), keg = diPer(D.kegiatan), lua = diPer(D.luaran_dosen), rek = diPer(D.rekognisi);
  const prestasi = (D.prestasi || []).filter(x => kal ? +x.tahun === +ts : tsDari(x.tahun, x.bulan) === +ts)
    .sort((a, b) => (+a.tahun - +b.tahun) || (+a.bulan || 0) - (+b.bulan || 0));
  const presAgr = diPer(D.prestasi_agregat).reduce((a, x) => a + (+x.jumlah || 0), 0);
  const ks = (A.kerjasama || []).filter(x => +x.tahun === +ts)
    .reduce((a, x) => a + (+x.internasional || 0) + (+x.nasional || 0) + (+x.wilayah || 0) + (+x.tanpa_tingkat || 0), 0);
  const tr = (D.tracer || []).find(t => +t.tahun_lulus === +ts - 1);
  const taRow = (A.ta || []).find(x => +x.tahun_ts === +ts);
  const baru = (A.kohort || []).find(x => +x.tahun_masuk === (kal ? +ts : +ts - 1));
  const kabar = (D.kabar || []).filter(k => (kal ? thTgl(k.tanggal) : tsTanggal(k.tanggal)) === +ts).sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)));
  const survei = (C.survei || []).filter(s => (kal ? thTgl(s.mulai) === +ts : +s.tahun_ts === +ts) && +s.n > 0).map(s => ({ ...s, pertanyaan: lengkapiCPL(s.pertanyaan) }));
  const dt = D.dtps || {};

  // 1. Ringkasan
  h1('Ringkasan kinerja');
  tb([['Aspek', kal ? `Tahun ${ts}` : `TS ${ta(ts)}`, 'Keterangan'],
    ['Mahasiswa aktif', angka(taRow?.mahasiswa_aktif), catTS],
    ['Mahasiswa baru', angka(baru?.masuk), baru ? `angkatan ${baru.tahun_masuk}` : 'data kohort belum ada'],
    ['Dosen tetap (DTPS)', angka(dt.jumlah), `${angka(dt.doktor)} bergelar doktor (data terkini)`],
    ['Publikasi', angka(pub.length), `${pub.filter(x => /^(scopus|wos)/.test(x.indeksasi || '')).length} terindeks Scopus/WoS`],
    ['Penelitian', angka(keg.filter(k => k.kategori === 'penelitian').length), ''],
    ['Pengabdian kepada masyarakat', angka(keg.filter(k => k.kategori === 'pkm').length), ''],
    ['Luaran/HKI dosen', angka(lua.length), ''],
    ['Rekognisi dosen', angka(rek.length), ''],
    ['Prestasi mahasiswa', angka(Math.max(presAgr, prestasi.length)), ''],
    ['Kerja sama', angka(ks), `penelitian, PkM, dan MoU yang tercatat${kal ? ` (${catTS})` : ''}`],
    ['Kegiatan prodi (kabar)', angka(kabar.length), 'kuliah tamu, kunjungan, survei lapangan, dan sejenisnya'],
    ['Survei kepuasan', angka(survei.length), survei.length ? `${angka(survei.reduce((a, s) => a + +s.n, 0))} responden (rekap terbit)` : 'belum ada rekap terbit'],
    ['Lulusan terlacak (tracer)', tr ? `${angka(tr.terlacak)} dari ${angka(tr.lulusan)}` : '—',
      tr ? `lulusan ${tr.tahun_lulus}; rata-rata waktu tunggu ${angka(tr.waktu_tunggu_bulan)} bulan` : 'belum ada tracer lulusan TS-1']]);

  // 2. Mahasiswa dan lulusan
  h1('Mahasiswa dan lulusan');
  const kohort = (A.kohort || []).filter(x => +x.tahun_masuk <= (kal ? +ts : +ts - 1)).sort((a, b) => +b.tahun_masuk - +a.tahun_masuk).slice(0, 7);
  if (kohort.length) {
    h2('Kohort mahasiswa');
    tb([['Tahun masuk', 'Mahasiswa baru', 'Lulus', 'Lulus 3,5–4,5 tahun', 'Lulus 4,5–5,5 tahun', 'Lulus > 5,5 tahun'],
      ...kohort.map(k => [String(k.tahun_masuk), angka(k.masuk), angka(k.lulus), angka(k.lulus_3_5_sd_4_5), angka(k.lulus_4_5_sd_5_5),
        angka((+k.lulus_5_5_sd_6_5 || 0) + (+k.lulus_6_5_sd_8 || 0))])]);
  } else p('Data kohort belum ada.', true);
  h2(`Tracer study lulusan ${ts - 1}`);
  if (tr) {
    const kerja = (+tr.wt_kurang_3 || 0) + (+tr.wt_3_18 || 0) + (+tr.wt_lebih_18 || 0);
    tb([['Indikator', 'Nilai'],
      ['Lulusan', angka(tr.lulusan)], ['Terlacak', `${angka(tr.terlacak)} (${persen(+tr.terlacak, +tr.lulusan)})`],
      ['Rata-rata waktu tunggu', `${angka(tr.waktu_tunggu_bulan)} bulan`],
      ['Waktu tunggu < 3 / 3–18 / > 18 bulan', `${angka(tr.wt_kurang_3)} / ${angka(tr.wt_3_18)} / ${angka(tr.wt_lebih_18)} (dari ${angka(kerja)} yang bekerja)`],
      ['Kesesuaian bidang tinggi / sedang / rendah', `${angka(tr.kesesuaian_tinggi)} / ${angka(tr.kesesuaian_sedang)} / ${angka(tr.kesesuaian_rendah)}`],
      ['Tempat kerja internasional / nasional / wilayah', `${angka(tr.kerja_internasional)} / ${angka(tr.kerja_nasional)} / ${angka(tr.kerja_wilayah)}`]]);
  } else p(`Belum ada data tracer study lulusan ${ts - 1}.`, true);

  // 3. Prestasi
  h1('Prestasi mahasiswa');
  if (prestasi.length) {
    const per = [...new Set(prestasi.map(x => x.tingkat || 'tanpa tingkat'))].map(t => [t, prestasi.filter(x => (x.tingkat || 'tanpa tingkat') === t).length]);
    p(`${prestasi.length} prestasi pada ${PER}: ${per.map(([t, n]) => `${n} tingkat ${rapi(t)}`).join(', ')}.`);
    tb([['Kegiatan', 'Tingkat', 'Capaian', 'Mahasiswa'], ...prestasi.map(x => [
      [x.kegiatan, x.penyelenggara].filter(Boolean).join(' — '), kapital(x.tingkat), x.capaian || '',
      (x.mahasiswa || []).join(', ')])]);
  } else p(presAgr ? `${presAgr} prestasi tercatat pada ${PER}.` : 'Belum ada prestasi yang tercatat.', true);

  // 4. Kepuasan
  h1('Kepuasan pemangku kepentingan');
  if (survei.length) {
    const rks = survei.map(s => [s, rekapSurvei(s.pertanyaan, s.hitung || {})]);
    tb([['Kelompok', 'Survei', 'Responden', 'Rerata (1–4)', '% puas'], ...rks.map(([s, rk]) =>
      [labelKelompok(s.kelompok), s.judul || '', angka(s.n), angka(rk.rerata), rk.puas == null ? '—' : `${angka(rk.puas)}%`])]);
    const bawah = rks.flatMap(([s, rk]) => aspekTindakLanjut(rk, s).map(a => `${labelKelompok(s.kelompok)}, ${a.label} (${a.alasan.join('; ')})`));
    p(bawah.length ? `Aspek di bawah ambang yang ditindaklanjuti: ${bawah.join('; ')}.` : 'Semua aspek berada di atas ambang (% puas ≥ 75 dan rerata ≥ 3).');
  } else p(`Belum ada rekap survei kepuasan ${PER} yang diterbitkan.`, true);
  const peng = diTS(A.kepuasan, ts);
  if (peng.length) {
    h2(`Kepuasan pengguna lulusan (Tabel 6.g.2)${kal ? `, ${catTS}` : ''}`);
    tb([['Aspek', 'Sangat baik', 'Baik', 'Cukup', 'Kurang'], ...peng.map(x => [kapital(labelAspek(x.aspek)),
      `${angka(x.sangat_baik)}%`, `${angka(x.baik)}%`, `${angka(x.cukup)}%`, `${angka(x.kurang)}%`])]);
  }

  // EDOM (pemilik 2026-11-27, butir 16): rekap prodi per semester dari rekap_evaluasi() (D._edom, hanya pengguna terdaftar;
  // tanpa angka per dosen). Tahun akademik: Ganjil + Genap TS; tahun kalender: Genap TS (Feb-Jun) + Ganjil TS+1 (Sep-Jan).
  if (!publik && Array.isArray(D._edom)) {
    h2(`Evaluasi dosen oleh mahasiswa (EDOM)${kal ? `, semester yang berjalan pada tahun ${ts}` : ''}`);
    const smt = kal ? [[ta(ts), 'Genap'], [ta(ts + 1), 'Ganjil']] : [[ta(ts), 'Ganjil'], [ta(ts), 'Genap']];
    const ed = smt.map(([t, s]) => D._edom.find(r => r.tahun_akademik === t && r.semester === s)).filter(Boolean);
    if (ed.length) tb([['Semester', 'MK-dosen dievaluasi', 'Rerata EDOM (0–4)', 'Di bawah ambang', 'Sudah ditindaklanjuti', 'Refleksi RPS terisi'],
      ...ed.map(r => [`${r.semester} ${r.tahun_akademik}`, angka(r.ber_edom), angka(r.rerata_edom), angka(r.di_bawah_ambang),
        angka(r.bawah_bertindak), `${angka(r.rps_terisi)} dari ${angka(r.jumlah)}`])]);
    else p('Belum ada rekap EDOM untuk periode ini (Evaluasi pembelajaran › tempel rekap EDOM dari kampus).', true);
  }

  // 5. Kesenjangan CPL
  h1('Kesenjangan capaian pembelajaran lulusan (CPL)');
  const cpl = survei.flatMap(s => kesenjanganCPL(s.pertanyaan, s.opsi || {}).filter(x => x.penting != null || x.kuasai != null)
    .map(x => ({ ...x, kelompok: labelKelompok(s.kelompok) })));
  if (cpl.length) {
    p('Rerata 1–5 tingkat kepentingan dan penguasaan tiap CPL; selisih ≥ 1 menjadi prioritas peninjauan kurikulum.');
    tb([['CPL', 'Kelompok', 'Penting', 'Dikuasai', 'Selisih', 'Prioritas'], ...cpl.map(x => [`CPL-${x.kode}`, x.kelompok,
      angka(x.penting), angka(x.kuasai), angka(x.selisih), x.selisih != null && x.selisih >= 1 ? 'ya' : ''])]);
  } else p('Belum ada survei dengan pertanyaan CPL yang rekapnya diterbitkan pada periode ini.', true);

  // 6. IKU/IKT (admin)
  if (!publik) {
    h1('Capaian IKU dan IKT');
    const iku = (C.iku || []).filter(r => +r.tahun_ts === +ts);
    if (!C.iku) p('Data IKU/IKT hanya terbaca oleh admin; unduh laporan sebagai admin untuk bagian ini.', true);
    else if (!iku.length) p(`Belum ada IKU/IKT untuk TS ${ta(ts)} di Data prodi › Target IKU/IKT.`, true);
    else for (const jenis of ['iku', 'ikt']) {
      const xs = iku.filter(r => r.jenis === jenis).sort((a, b) => (a.urutan ?? 100) - (b.urutan ?? 100));
      if (!xs.length) continue;
      h2(jenis.toUpperCase());
      const cpOf = r => { const h = r.sumber ? hitungSumber(r.sumber, D, ts) : null; return [h, h ? h.nilai : (r.capaian == null ? null : +r.capaian)]; };
      tb([['Indikator', 'Target', 'Capaian', '%', 'Status'], ...xs.map(r => {
        const [h, cp] = cpOf(r), [pc, s] = statusIKU(r.target == null ? null : +r.target, cp, r.arah);
        return [r.nama + (h ? ' (otomatis)' : ''), `${r.arah === 'maksimal' ? '≤' : '≥'} ${angka(r.target)} ${r.satuan || ''}`.trim(),
          cp == null ? '—' : `${angka(cp)} ${r.satuan || ''}`.trim(), pc, s];
      })]);
      // Analisis: IKT selalu (butir 54); IKU/IKT yang belum tercapai beserta rencana perbaikannya (butir 56, patch 67).
      xs.forEach(r => {
        const [, cp] = cpOf(r);
        const belum = statusIKU(r.target == null ? null : +r.target, cp, r.arah)[1] !== 'tercapai' && cp != null && r.target != null;
        const isi = [r.analisis, belum && r.rencana_perbaikan ? `Rencana perbaikan: ${r.rencana_perbaikan}` : ''].filter(Boolean).join(' ');
        if ((r.jenis === 'ikt' || belum) && isi) p(`${r.nama}: ${isi}`);
      });
    }
  }

  // SDGs
  h1('Kontribusi pada SDGs');
  const karya = [...pub, ...keg, ...lua];
  const sdg = SDGS.map(([n, nama]) => [n, nama, karya.filter(k => (k.sdgs || []).includes(n)).length]).filter(x => x[2]);
  p(`${karya.filter(k => (k.sdgs || []).length).length} dari ${karya.length} karya ${PER} terkait SDGs.`);
  if (sdg.length) tb([['SDG', 'Tujuan', 'Jumlah karya'], ...sdg.map(([n, nama, j]) => [String(n), nama, angka(j)])]);

  // Kegiatan prodi
  h1('Kegiatan program studi');
  if (kabar.length) tb([['Tanggal', 'Kegiatan', 'Jenis', 'Tempat'], ...kabar.map(k => [tglPendek(k.tanggal), k.judul || '', kapital(k.jenis), k.tempat || ''])]);
  else p('Belum ada kabar kegiatan yang diterbitkan pada periode ini.', true);

  // Karya
  h1('Publikasi');
  if (pub.length) tb([['Judul', 'Terbitan', 'Indeksasi/tingkat', 'Penulis'], ...pub.map(x => [x.judul, x.terbitan || '',
    rapi(x.indeksasi || x.tingkat), (x.penulis || []).map(a => a.nama).join(', ')])]);
  else p('Belum ada publikasi terverifikasi.', true);
  h1('Penelitian dan pengabdian kepada masyarakat');
  if (keg.length) tb([['Judul', 'Jenis', 'Skema', 'Tim'], ...keg.map(k => [k.judul, k.kategori === 'pkm' ? 'PkM' : 'Penelitian',
    k.skema || '', (k.penulis || []).map(a => a.nama).join(', ')])]);
  else p('Belum ada kegiatan terverifikasi.', true);

  if (!publik) {
    h1('Kesiapan akreditasi');
    if (C.NA != null) p(`Perkiraan nilai akreditasi (NA) ${angka(C.NA)}; perkiraan status: ${C.status || '—'}. ` +
      'Perkiraan dari kalkulator skor situs, bukan penilaian asesor.');
    if ((C.langkah || []).length) {
      p('Langkah tercepat menaikkan skor (bukti per unsur berikutnya):');
      tb([['Butir', 'Bukti berikutnya', 'Penanggung jawab', '+ Poin berbobot'],
        ...C.langkah.slice(0, 10).map(x => [String(x.no), `Unsur ${x.n}: ${x.label}`, x.pihak || '', angka(x.naik)])]);
    }
    h1('Catatan dan tindak lanjut');
    const tm = diTS(C.temuan, ts);
    if (tm.length) {
      const sel = tm.filter(x => x.status === 'selesai').length;
      p(`${tm.length} temuan dan peluang peningkatan TS ${ta(ts)} (Data prodi › Temuan AMI), ${sel} selesai.`);
      tb([['Uraian', 'Kategori', 'Penanggung jawab', 'Tenggat', 'Status'], ...tm.map(x => [x.uraian || '', rapi(x.kategori),
        x.pj_nama || x.pihak || '', tglPendek(x.tenggat), rapi(x.status)])]);
    }
    p('[Isi: hasil rapat tinjauan manajemen, rencana tindak lanjut, dan penanggung jawabnya.]', true);
  }
  return out;
}

// ---------------- Render ----------------
/** XML badan dokumen Word dari model. */
export function docxDariBlok(bloks){
  return bloks.map(b => {
    if (b.sampul) return [para(run(b.sampul[0], { b: true, sz: 32 }), { jc: 'center', before: 0, after: 60 }),
      para(run(b.sampul[1], { b: true, sz: 26 }), { jc: 'center', after: 60 }), para(run(b.sampul[2], { sz: 24 }), { jc: 'center', after: 60 }),
      para(run(b.sampul[3], { i: true, sz: 18, warna: '595959' }), { jc: 'center', after: 240 })].join('');
    if (b.h) return judul(b.t, b.h);
    if (b.tabel) return tabel(b.tabel);
    return teks(b.p, b.i ? { i: true } : undefined);
  }).join('');
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/** HTML dari model (halaman publik): sampul tidak ikut (judul halaman sudah ada), judul 1 = h2, judul 2 = h3. */
export function htmlDariBlok(bloks){
  return bloks.map(b => {
    if (b.sampul) return '';
    if (b.h) return b.h === 1 ? `<h2>${esc(b.t)}</h2>` : `<h3>${esc(b.t)}</h3>`;
    if (b.tabel) return `<div class="gulir"><table><thead><tr>${b.tabel[0].map(x => `<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${
      b.tabel.slice(1).map(r => `<tr>${r.map(x => `<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    return `<p${b.i ? ' class="ket"' : ''}>${esc(b.p)}</p>`;
  }).join('\n');
}

/** XML badan dokumen (laporan admin; dipakai tes). */
export const isiLaporan = (C, opsi) => docxDariBlok(susunLaporan(C, opsi));
/** Berkas .docx (Blob). */
export async function buatLaporanTahunan(C, opsi){
  return buatDocx(isiLaporan(C, opsi));
}
/** Pilihan tahun kalender: dari tahun terbaru yang punya data, mundur sampai 5 tahun; tahun ini ditandai berjalan. */
export function pilihanTahun(D, kini = new Date()){
  const now = kini.getFullYear();
  const ada = [...(D.publikasi || []), ...(D.kegiatan || [])].map(x => +x.tahun).filter(Boolean);
  const atas = Math.min(now, Math.max(now - 1, ...ada));
  return Array.from({ length: 5 }, (_, i) => atas - i).map(t => ({ ts: t, label: `${t}${t === now ? ' (berjalan)' : ''}` }));
}
/** Pilihan TS untuk halaman publik: dari TS terbaru yang punya data, mundur sampai 5 TS. */
export function pilihanTS(D, kini = new Date()){
  const berjalan = kini.getMonth() >= 8 ? kini.getFullYear() + 1 : kini.getFullYear();
  const ada = [...(D.publikasi || []), ...(D.kegiatan || []), ...((D.akreditasi || {}).ta || [])].map(x => +x.tahun_ts).filter(Boolean);
  const atas = Math.min(berjalan, Math.max(berjalan - 1, ...ada));
  return Array.from({ length: 5 }, (_, i) => atas - i).map(ts => ({ ts, label: `${ta(ts)}${ts === berjalan ? ' (berjalan)' : ''}` }));
}
