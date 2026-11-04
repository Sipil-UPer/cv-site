/* =====================================================================
   Data grafik dan tabel untuk draf LED (pemilik 2026-11-04: "minimal
   data, tabel, atau gambar terkait narasi masuk template"). Murni, tanpa
   DOM: diuji di Node (tests/js/led_data.test.mjs). Gambar digambar oleh
   led-grafik.js; disisipkan oleh led.js.

   Spesifikasi grafik: { judul, satuan, mode: 'tumpuk'|'kelompok',
     kategori: [label], seri: [{ nama, nilai: [angka per kategori] }] }
   Setiap grafik di LED disertai tabel datanya (tabelGrafik), supaya
   angkanya bisa dikutip di narasi dan diperiksa asesor.
   ===================================================================== */
const taDari = ts => `${ts - 1}/${ts}`;
const jumlah = (r, ks) => ks.reduce((a, k) => a + (+r?.[k] || 0), 0);
const per = (rows, kunciTahun, t) => (rows || []).find(r => r[kunciTahun] === t);

// Kategori 3 TS (TS-2, TS-1, TS) atau 5 TS untuk prestasi.
const tsKe = (ts, n = 3) => Array.from({ length: n }, (_, i) => ts - n + 1 + i);

const ASPEK = [['etika', 'Etika'], ['keahlian_bidang_ilmu', 'Keahlian bidang ilmu'],
  ['bahasa_asing', 'Bahasa asing'], ['teknologi_informasi', 'Teknologi informasi'],
  ['komunikasi', 'Komunikasi'], ['kerja_sama_tim', 'Kerja sama tim'],
  ['pengembangan_diri', 'Pengembangan diri']];

function grafikPublikasi(rows, ts, judul){
  const T = tsKe(ts);
  return { judul, satuan: 'judul', mode: 'tumpuk', kategori: T.map(taDari), seri: [
    { nama: 'Jurnal nasional', nilai: T.map(t => jumlah(per(rows, 'tahun', t), ['na1', 'na2'])) },
    { nama: 'Jurnal internasional', nilai: T.map(t => jumlah(per(rows, 'tahun', t), ['na3', 'na4'])) },
    { nama: 'Prosiding', nilai: T.map(t => jumlah(per(rows, 'tahun', t), ['nb1', 'nb2', 'nb3'])) }] };
}

function grafikSumberDana(rows, ts, kategori, judul){
  const T = tsKe(ts);
  const r = t => (rows || []).find(x => x.tahun === t && x.kategori === kategori);
  return { judul, satuan: 'judul', mode: 'tumpuk', kategori: T.map(taDari), seri: [
    { nama: 'PT / mandiri', nilai: T.map(t => +r(t)?.pt_mandiri || 0) },
    { nama: 'Dalam negeri', nilai: T.map(t => +r(t)?.dalam_negeri || 0) },
    { nama: 'Luar negeri', nilai: T.map(t => +r(t)?.luar_negeri || 0) }] };
}

function grafikKegMhs(rows, ts, kategori, judul){
  const T = tsKe(ts);
  const r = t => (rows || []).find(x => x.tahun === t && x.kategori === kategori);
  return { judul, satuan: 'judul', mode: 'kelompok', kategori: T.map(taDari), seri: [
    { nama: 'Seluruh judul', nilai: T.map(t => +r(t)?.total || 0) },
    { nama: 'Melibatkan mahasiswa', nilai: T.map(t => +r(t)?.dengan_mahasiswa || 0) }] };
}

// Grafik per butir, atau null bila butir tidak punya data berderet.
export function grafikButir(no, D, ts){
  const A = (D && D.akreditasi) || {};
  const T = tsKe(ts);
  const kosong = g => !g || g.seri.every(s => s.nilai.every(v => !v));
  let g = null;
  switch (String(no)){
    case '6': case '7':
      g = { judul: 'Kerja sama menurut tingkat', satuan: 'kerja sama', mode: 'tumpuk',
        kategori: T.map(taDari), seri: [
          { nama: 'Internasional', nilai: T.map(t => +per(A.kerjasama, 'tahun', t)?.internasional || 0) },
          { nama: 'Nasional', nilai: T.map(t => +per(A.kerjasama, 'tahun', t)?.nasional || 0) },
          { nama: 'Wilayah/lokal', nilai: T.map(t => +per(A.kerjasama, 'tahun', t)?.wilayah || 0) }] };
      break;
    case '23': g = grafikKegMhs(A.kegiatan_mhs, ts, 'penelitian', 'Penelitian DTPS yang melibatkan mahasiswa'); break;
    case '25': g = grafikKegMhs(A.kegiatan_mhs, ts, 'pkm', 'PkM DTPS yang melibatkan mahasiswa'); break;
    case '31': g = grafikSumberDana(A.sumber_dana, ts, 'penelitian', 'Penelitian DTPS menurut sumber dana'); break;
    case '32': g = grafikSumberDana(A.sumber_dana, ts, 'pkm', 'PkM DTPS menurut sumber dana'); break;
    case '33': g = grafikPublikasi(A.publikasi_dtps, ts, 'Publikasi ilmiah DTPS'); break;
    case '46': g = grafikPublikasi(A.publikasi_mhs, ts, 'Publikasi ilmiah mahasiswa'); break;
    case '34': case '47': {
      const rows = no == '34' ? A.luaran_dtps : A.luaran_mhs;
      g = { judul: no == '34' ? 'Luaran penelitian dan PkM DTPS' : 'Luaran penelitian dan PkM mahasiswa',
        satuan: 'luaran', mode: 'tumpuk', kategori: T.map(taDari), seri: [
          { nama: 'Paten', nilai: T.map(t => +per(rows, 'tahun', t)?.paten || 0) },
          { nama: 'TTG / produk', nilai: T.map(t => +per(rows, 'tahun', t)?.ttg || 0) },
          { nama: 'Buku / book chapter', nilai: T.map(t => +per(rows, 'tahun', t)?.bc || 0) },
          { nama: 'HKI lain', nilai: T.map(t => +per(rows, 'tahun', t)?.hki || 0) }] };
      break;
    }
    case '40': case '41':
      g = { judul: 'Mahasiswa aktif per TS', satuan: 'mahasiswa', mode: 'kelompok',
        kategori: T.map(taDari), seri: [
          { nama: 'Mahasiswa aktif', nilai: T.map(t => +per(A.ta, 'tahun_ts', t)?.mahasiswa_aktif || 0) },
          { nama: 'Mahasiswa asing', nilai: T.map(t => +per(A.ta, 'tahun_ts', t)?.mahasiswa_asing || 0) }] };
      break;
    case '42':
      g = { judul: 'Rerata IPK lulusan per TS', satuan: 'IPK', mode: 'kelompok', desimal: 2,
        kategori: T.map(taDari), seri: [
          { nama: 'Rerata IPK', nilai: T.map(t => +per(A.ta, 'tahun_ts', t)?.rerata_ipk || 0) }] };
      break;
    case '43': {
      const T5 = tsKe(ts, 5);
      const n = (t, tg) => (D.prestasi_agregat || []).filter(r => (r.tahun_ts ?? r.tahun) === t &&
        String(r.tingkat || '').startsWith(tg)).reduce((a, r) => a + (+r.jumlah || 0), 0);
      g = { judul: 'Prestasi mahasiswa menurut tingkat (5 TS)', satuan: 'capaian', mode: 'tumpuk',
        kategori: T5.map(taDari), seri: [
          { nama: 'Internasional', nilai: T5.map(t => n(t, 'internasional')) },
          { nama: 'Nasional', nilai: T5.map(t => n(t, 'nasional')) },
          { nama: 'Wilayah/lokal', nilai: T5.map(t => n(t, 'wilayah')) }] };
      break;
    }
    case '49': case '50': case '51': {
      const L = [ts - 2, ts - 1];
      const r = t => per(D.tracer, 'tahun_lulus', t);
      const kat = L.map(t => `Lulus ${t}`);
      if (no == '49') g = { judul: 'Rata-rata waktu tunggu lulusan', satuan: 'bulan', mode: 'kelompok', desimal: 1,
        kategori: kat, seri: [{ nama: 'Waktu tunggu (bulan)', nilai: L.map(t => +r(t)?.waktu_tunggu_bulan || 0) }] };
      if (no == '50') g = { judul: 'Lulusan terlacak dan bekerja sesuai bidang', satuan: 'lulusan', mode: 'kelompok',
        kategori: kat, seri: [{ nama: 'Terlacak', nilai: L.map(t => +r(t)?.terlacak || 0) },
                              { nama: 'Sesuai bidang', nilai: L.map(t => +r(t)?.sesuai_bidang || 0) }] };
      if (no == '51') g = { judul: 'Tempat kerja lulusan menurut tingkat', satuan: 'lulusan', mode: 'tumpuk',
        kategori: kat, seri: [{ nama: 'Wilayah/lokal', nilai: L.map(t => +r(t)?.kerja_wilayah || 0) },
                              { nama: 'Nasional', nilai: L.map(t => +r(t)?.kerja_nasional || 0) },
                              { nama: 'Internasional', nilai: L.map(t => +r(t)?.kerja_internasional || 0) }] };
      break;
    }
    case '52': {
      const kp = (A.kepuasan || []).filter(r => r.tahun_ts === ts);
      const r = a => kp.find(x => x.aspek === a);
      g = { judul: `Kepuasan pengguna lulusan, TS ${taDari(ts)}`, satuan: '%', mode: 'tumpuk', maks: 100,
        kategori: ASPEK.map(([, l]) => l), seri: [
          { nama: 'Sangat baik', nilai: ASPEK.map(([a]) => +r(a)?.sangat_baik || 0) },
          { nama: 'Baik', nilai: ASPEK.map(([a]) => +r(a)?.baik || 0) },
          { nama: 'Cukup', nilai: ASPEK.map(([a]) => +r(a)?.cukup || 0) },
          { nama: 'Kurang', nilai: ASPEK.map(([a]) => +r(a)?.kurang || 0) }] };
      break;
    }
  }
  return kosong(g) ? null : g;
}

// Tabel data di bawah grafik: kepala = kategori, satu baris per seri,
// baris Jumlah untuk grafik tumpuk.
export function tabelGrafik(g){
  const f = v => g.desimal ? v.toFixed(g.desimal).replace('.', ',') : String(v);
  const baris = [[g.satuan === '%' ? 'Aspek / tingkat (%)' : '', ...g.kategori],
    ...g.seri.map(s => [s.nama, ...s.nilai.map(f)])];
  if (g.mode === 'tumpuk' && g.seri.length > 1 && g.satuan !== '%')
    baris.push(['Jumlah', ...g.kategori.map((_, i) => f(g.seri.reduce((a, s) => a + s.nilai[i], 0)))]);
  return baris;
}

// Skor butir pada TS-2, TS-1, TS (dari halaman skor), dengan selisih.
export function tabelTren(no, tren, tsTren, angka){
  const t = (tren || {})[no];
  if (!t || tsTren.every(ts => t[ts] == null)) return null;
  const sel = v => v == null ? '—' : angka(v);
  const a = t[tsTren[0]], z = t[tsTren[2]];
  return [['', ...tsTren.map(ts => `TS ${taDari(ts)}`), 'Perubahan'],
    ['Skor butir', ...tsTren.map(ts => sel(t[ts])),
     a == null || z == null ? '—' : (z - a >= 0 ? '+' : '') + angka(z - a)]];
}

// Tabel pendukung narasi yang tidak berbentuk deret waktu.
export function tabelPendukung(no, D, ts){
  const dt = (D && D.dtps) || {};
  const N = dt.jumlah || 0;
  const pct = n => N ? `${Math.round(n / N * 100)}%` : '—';
  if (no == '26' || no == '27' || no == '28'){
    const j = dt.jabatan || {};
    const s2 = N - (dt.doktor || 0);
    return { judul: 'Profil DTPS', baris: [['Kelompok', 'Jumlah', 'Persentase'],
      ['DTPS (NDTPS)', String(N), '100%'],
      ['Berpendidikan S3', String(dt.doktor || 0), pct(dt.doktor || 0)],
      ['Berpendidikan S2', String(s2), pct(s2)],
      ['Guru besar', String(j.guru_besar || 0), pct(j.guru_besar || 0)],
      ['Lektor kepala', String(j.lektor_kepala || 0), pct(j.lektor_kepala || 0)],
      ['Lektor', String(j.lektor || 0), pct(j.lektor || 0)],
      ['Asisten ahli', String(j.asisten_ahli || 0), pct(j.asisten_ahli || 0)],
      ['Belum berjabatan akademik', ...(n => [String(n), pct(n)])(j.tanpa_jabatan ?? Math.max(0,
        N - (j.guru_besar || 0) - (j.lektor_kepala || 0) - (j.lektor || 0) - (j.asisten_ahli || 0)))]] };
  }
  return null;
}
