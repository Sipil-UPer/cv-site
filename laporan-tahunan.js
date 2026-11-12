// Laporan kinerja tahunan program studi (.docx), pemilik 2026-11-11.
// Dokumen Word disusun sendiri (tanpa templat) dari data yang sama dengan
// halaman Skor: data.json publik, capaian IKU/IKT (Data prodi), dan perkiraan
// status akreditasi. Untuk rapat tinjauan manajemen dan laporan kinerja;
// bebas disunting di Word.
import { hitungSumber } from './iku-otomatis.js?v=2026-11-11-adf238';
import { SDGS } from './form-karya.js?v=2026-11-11-adf238';
import { LEBAR, xe, run, para, judul, teks, tabel, buatDocx } from './docx-dasar.js?v=2026-11-11-adf238';

const angka = v => v == null ? '—' : (Math.round(+v * 100) / 100).toLocaleString('id-ID');
const diTS = (xs, ts) => (xs || []).filter(x => +x.tahun_ts === +ts);
const ta = ts => `${ts - 1}/${ts}`;
const rapi = s => String(s || '').replace(/_/g, ' ');

// Status satu indikator (sama dengan ringkasan di Data prodi).
function statusIKU(tg, cp, arah){
  if (tg == null || cp == null) return ['—', 'capaian belum ada'];
  const maks = arah === 'maksimal', ok = maks ? cp <= tg : cp >= tg;
  const p = maks ? (cp > 0 ? tg / cp * 100 : 100) : (tg > 0 ? cp / tg * 100 : 100);
  return [`${Math.round(p)}%`, ok ? 'tercapai' : p >= 80 ? 'hampir' : 'belum'];
}

// C = { D, ts, iku: baris lkps_target_kinerja|null, NA, status, langkah: [{no, n, label, naik}] }
export function isiLaporan(C){
  const { D, ts } = C, out = [];
  const prodi = [D.prodi, D.institusi].filter(Boolean).join(' ');
  out.push(para(run('LAPORAN KINERJA TAHUNAN PROGRAM STUDI', { b: true, sz: 32 }), { jc: 'center', before: 0, after: 60 }));
  out.push(para(run(prodi, { b: true, sz: 26 }), { jc: 'center', after: 60 }));
  out.push(para(run(`Tahun akademik ${ta(ts)}`, { sz: 24 }), { jc: 'center', after: 60 }));
  out.push(para(run(`Disusun otomatis dari situs kinerja prodi pada ${new Date().toLocaleDateString('id-ID',
    { day: 'numeric', month: 'long', year: 'numeric' })}; data yang sudah diverifikasi prodi.`, { i: true, sz: 18, warna: '595959' }),
    { jc: 'center', after: 240 }));

  // 1. Ringkasan
  const pub = diTS(D.publikasi, ts), keg = diTS(D.kegiatan, ts), lua = diTS(D.luaran_dosen, ts);
  const rek = diTS(D.rekognisi, ts), pres = diTS(D.prestasi_agregat, ts).reduce((a, x) => a + (+x.jumlah || 0), 0);
  const ks = ((D.akreditasi || {}).kerjasama || []).filter(x => +x.tahun === +ts)
    .reduce((a, x) => a + (+x.internasional || 0) + (+x.nasional || 0) + (+x.wilayah || 0) + (+x.tanpa_tingkat || 0), 0);
  const tr = (D.tracer || []).find(t => +t.tahun_lulus === +ts - 1);
  const dt = D.dtps || {};
  out.push(judul('1. Ringkasan kinerja', 1));
  out.push(tabel([['Aspek', `TS ${ta(ts)}`, 'Keterangan'],
    ['Dosen tetap (DTPS)', angka(dt.jumlah), `${angka(dt.doktor)} bergelar doktor (data terkini)`],
    ['Publikasi', angka(pub.length), `${pub.filter(p => /^(scopus|wos)/.test(p.indeksasi || '')).length} terindeks Scopus/WoS`],
    ['Penelitian', angka(keg.filter(k => k.kategori === 'penelitian').length), ''],
    ['Pengabdian kepada masyarakat', angka(keg.filter(k => k.kategori === 'pkm').length), ''],
    ['Luaran/HKI dosen', angka(lua.length), ''],
    ['Rekognisi dosen', angka(rek.length), ''],
    ['Prestasi mahasiswa', angka(pres), ''],
    ['Kerja sama', angka(ks), 'penelitian, PkM, dan MoU yang tercatat'],
    ['Lulusan terlacak (tracer)', tr ? `${angka(tr.terlacak)} dari ${angka(tr.lulusan)}` : '—',
      tr ? `lulusan ${tr.tahun_lulus}; rata-rata waktu tunggu ${angka(tr.waktu_tunggu_bulan)} bulan` : 'belum ada tracer lulusan TS-1']]));

  // 2. IKU/IKT
  out.push(judul('2. Capaian IKU dan IKT', 1));
  const iku = (C.iku || []).filter(r => +r.tahun_ts === +ts);
  if (!C.iku) out.push(teks('Data IKU/IKT hanya terbaca oleh admin; unduh laporan sebagai admin untuk bagian ini.', { i: true }));
  else if (!iku.length) out.push(teks(`Belum ada IKU/IKT untuk TS ${ta(ts)} di Data prodi › Target IKU/IKT.`, { i: true }));
  else for (const jenis of ['iku', 'ikt']) {
    const xs = iku.filter(r => r.jenis === jenis).sort((a, b) => (a.urutan ?? 100) - (b.urutan ?? 100));
    if (!xs.length) continue;
    out.push(judul(jenis.toUpperCase(), 2));
    out.push(tabel([['Indikator', 'Target', 'Capaian', '%', 'Status'], ...xs.map(r => {
      const h = r.sumber ? hitungSumber(r.sumber, D, ts) : null, cp = h ? h.nilai : (r.capaian == null ? null : +r.capaian);
      const [p, s] = statusIKU(r.target == null ? null : +r.target, cp, r.arah);
      return [r.nama + (h ? ' (otomatis)' : ''), `${r.arah === 'maksimal' ? '≤' : '≥'} ${angka(r.target)} ${r.satuan || ''}`.trim(),
        cp == null ? '—' : `${angka(cp)} ${r.satuan || ''}`.trim(), p, s];
    })]));
    xs.filter(r => r.jenis === 'ikt' && r.analisis).forEach(r => out.push(teks(`${r.nama}: ${r.analisis}`)));
  }

  // 3. SDGs
  out.push(judul('3. Kontribusi pada SDGs', 1));
  const karya = [...pub, ...keg, ...lua];
  const sdg = SDGS.map(([n, nama]) => [n, nama, karya.filter(k => (k.sdgs || []).includes(n)).length]).filter(x => x[2]);
  out.push(teks(`${karya.filter(k => (k.sdgs || []).length).length} dari ${karya.length} karya TS ${ta(ts)} terkait SDGs.`));
  if (sdg.length) out.push(tabel([['SDG', 'Tujuan', 'Jumlah karya'], ...sdg.map(([n, nama, j]) => [String(n), nama, angka(j)])]));

  // 4-5. Daftar karya
  out.push(judul('4. Publikasi', 1));
  out.push(pub.length ? tabel([['Judul', 'Terbitan', 'Indeksasi/tingkat', 'Penulis'], ...pub.map(p => [p.judul, p.terbitan || '',
    rapi(p.indeksasi || p.tingkat), (p.penulis || []).map(a => a.nama).join(', ')])]) : teks('Belum ada publikasi terverifikasi.', { i: true }));
  out.push(judul('5. Penelitian dan pengabdian kepada masyarakat', 1));
  out.push(keg.length ? tabel([['Judul', 'Jenis', 'Skema', 'Tim'], ...keg.map(k => [k.judul, k.kategori === 'pkm' ? 'PkM' : 'Penelitian',
    k.skema || '', (k.penulis || []).map(a => a.nama).join(', ')])]) : teks('Belum ada kegiatan terverifikasi.', { i: true }));

  // 6. Akreditasi
  out.push(judul('6. Kesiapan akreditasi', 1));
  if (C.NA != null) out.push(teks(`Perkiraan nilai akreditasi (NA) ${angka(C.NA)}; perkiraan status: ${C.status || '—'}. ` +
    'Perkiraan dari kalkulator skor situs, bukan penilaian asesor.'));
  if ((C.langkah || []).length) {
    out.push(teks('Langkah tercepat menaikkan skor (bukti per unsur berikutnya):', { keep: true }));
    out.push(tabel([['Butir', 'Bukti berikutnya', 'Penanggung jawab', '+ Poin berbobot'],
      ...C.langkah.slice(0, 10).map(x => [String(x.no), `Unsur ${x.n}: ${x.label}`, x.pihak || '', angka(x.naik)])]));
  }
  out.push(judul('7. Catatan dan tindak lanjut', 1));
  out.push(teks('[Isi: hasil rapat tinjauan manajemen, rencana tindak lanjut, dan penanggung jawabnya.]', { i: true }));
  return out.join('');
}



// Berkas .docx (Blob) dari isiLaporan.
export async function buatLaporanTahunan(C){
  return buatDocx(isiLaporan(C));
}
