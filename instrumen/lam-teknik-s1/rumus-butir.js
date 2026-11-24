/* Rumus butir berumus LAM Teknik, APS-AV 2025 1.0, Program Sarjana.
   Dipindah utuh dari site/skor.html (irisan 3, pemilik 2026-11-24): isi tiap fungsi
   sama persis dengan versi di skor.html sebelum dipindah.

   Modul instrumen tidak mengimpor apa pun dari site/. Pembantu halaman (kartu, format,
   isian butir, impor modul umum) dikirim lewat buatRumus(h); keadaan halaman (D, TS,
   DANA, KARYA_SITASI, P_DATA) dibaca dari h.keadaan() setiap kali sebuah rumus dipanggil,
   karena skor.html mengganti nilainya saat data dimuat atau TS diganti.

   Kontrak (dipakai skor.html dan tests/js/score_harness.mjs):
     buatRumus(h) -> { daftar(): [{no, f}],  fungsi: {nama: fungsi} }
   daftar() = butir yang dihitung dari data; butir manual tetap dari butir-manual.js.
   Instrumen tanpa butir berumus mengembalikan daftar kosong. */

// Nama yang wajib ada di h (selain keadaan).
export const PEMBANTU_RUMUS = [
  'esc', 'f2', 'taDari', 'kartuButir', 'kartuManualKosong', 'rincianButir', 'tabelNA', 'IS',
  'hitungBOP', 'hitungDosen', 'hitungMK', 'cekPitaWT', 'adaTingkat', 'sesuaiTracer', 'karya4i',
  'tautanPengutip'
];

export function buatRumus(h) {
  const kurang = ['keadaan', ...PEMBANTU_RUMUS].filter(n => typeof h?.[n] !== 'function');
  if (kurang.length) throw new Error(`buatRumus: pembantu tidak dikirim: ${kurang.join(', ')}`);
  const {
    esc, f2, taDari, kartuButir, kartuManualKosong, rincianButir, tabelNA, IS, hitungBOP,
    hitungDosen, hitungMK, cekPitaWT, adaTingkat, sesuaiTracer, karya4i, tautanPengutip
  } = h;
  let D, TS, DANA, KARYA_SITASI, P_DATA;
  const segarkan = () => { ({ D, TS, DANA, KARYA_SITASI, P_DATA } = h.keadaan()); };

// ===== isi utuh dari skor.html ===================================================

function jumlahJendela(baris, kunci, n){
  // total tiap kolom `kunci` untuk baris bertahun [TS-n+1 .. TS]
  const t0 = TS - n + 1;
  const pilih = baris.filter(r => r.tahun >= t0 && r.tahun <= TS);
  const out = {}; kunci.forEach(k => out[k] = 0);
  pilih.forEach(r => kunci.forEach(k => out[k] += (r[k] || 0)));
  return out;
}

// ---------------------------------------------------------------------
//  Rumus inti matriks: skor dari tiga rasio RI/RN/RW dengan faktor a,b,c
//  (butir 33, 43, 46). Termasuk aturan substitusi batas dari instrumen.
// ---------------------------------------------------------------------
function skorRasio(RI, RN, RW, a, b, c){
  if (RI > a && RN > b) return 4;
  if (RI <= 0 && RN <= 0 && RW <= 0) return 0;
  if (RI >= a && RN < b) RI = a;
  if (RI < a && RN >= b) RN = b;
  if (RW >= c) RW = c;
  const A = RI / a, B = RN / b, C = RW / c;
  const skor = 3.75 * ((A + B + C / 2) - (A * B) - (A * C) / 2
                       - (B * C) / 2 + (A * B * C) / 2);
  return Math.max(0, Math.min(4, skor));
}

// ---------------------------------------------------------------------
//  Butir 42 — IPK lulusan (3 TS terakhir, lembar mahasiswa_ta)
// ---------------------------------------------------------------------
function butir42(){
  const A = (D.akreditasi || {}).ta || [];
  const pilih = A.filter(r => r.tahun_ts >= TS - 2 && r.tahun_ts <= TS && r.lulusan > 0);
  if (!pilih.length)
    return kartuButir(42, 'IPK lulusan', `<p class="kosong"><a href="data-prodi.html?tab=mahasiswa">Data prodi › Mahasiswa per TS</a>
      belum berisi jumlah lulusan dan rerata IPK
      untuk TS ${esc(taDari(TS))} atau dua TS sebelumnya.</p>`, null, '');
  const nLul = pilih.reduce((a, r) => a + r.lulusan, 0);
  const ripk = pilih.reduce((a, r) => a + r.rerata_ipk * r.lulusan, 0) / nLul;
  let skor;
  if (ripk >= 3.25) skor = 4;
  else skor = Math.max(2, ((8 * ripk) - 6) / 5);
  const isi = `
    <div class="gulir"><table class="rin"><thead><tr>
      <th>TS</th><th>Lulusan</th><th>Rerata IPK</th></tr></thead><tbody>
      ${pilih.map(r => `<tr><td>${esc(r.ta)}</td><td>${r.lulusan}</td>
        <td>${f2(r.rerata_ipk)}</td></tr>`).join('')}
      <tr><td><b>RIPK tertimbang</b></td><td>${nLul}</td><td><b>${f2(ripk)}</b></td></tr>
    </tbody></table></div>
    <div class="rumus">RIPK &ge; 3,25 &rarr; 4 &nbsp;·&nbsp; 2,00 &le; RIPK &lt; 3,25 &rarr; ((8 &times; RIPK) &minus; 6) / 5 &nbsp;·&nbsp; skor terendah 2</div>`;
  return kartuButir(42, 'IPK lulusan', isi, skor,
    'RIPK dihitung sebagai rata-rata tertimbang jumlah lulusan per TS. ' +
    'Instrumen menulis "rata-rata IPK lulusan dalam 3 tahun terakhir" tanpa ' +
    'merinci pembobotan; bila asesor meminta rata-rata sederhana antar-TS, ' +
    'selisihnya kecil kecuali jumlah lulusan antar-TS timpang.');
}

// ---------------------------------------------------------------------
//  Butir 43 — Prestasi mahasiswa (5 tahun terakhir)
// ---------------------------------------------------------------------
function siapkanPrestasi(bidang){
  const P = D.prestasi_agregat || [];
  const t0 = TS - 4;
  let NI = 0, NN = 0, NW = 0;
  // tahun_ts (TS: 1 Sep - 31 Agu) dari bangun.py; data lama tanpa kolom itu
  // jatuh ke tahun kalender.
  const tsDari = r => (r.tahun_ts != null ? r.tahun_ts : r.tahun);
  P.filter(r => tsDari(r) >= t0 && tsDari(r) <= TS &&
                (r.bidang || '').startsWith(bidang === 'akademik' ? 'akademik' : 'non'))
   .forEach(r => {
     const tg = (r.tingkat || '').toLowerCase();
     if (tg.includes('internasional')) NI += r.jumlah;
     else if (tg.includes('nasional')) NN += r.jumlah;
     else NW += r.jumlah;
   });
  return {NI, NN, NW};
}

function butir43(){
  const A = (D.akreditasi || {}).ta || [];
  const barisTS = A.find(r => r.tahun_ts === TS);
  const NM = barisTS ? barisTS.mahasiswa_aktif : 0;
  const sub = (label, d) => {
    const skor = NM > 0
      ? skorRasio(d.NI / NM, d.NN / NM, d.NW / NM, 0.002, 0.02, 0.04) : null;
    return {skor, html: `
      <div class="gulir"><table class="rin"><thead><tr><th>${esc(label)}</th>
        <th>NI int.</th><th>NN nas.</th><th>NW wil.</th><th>NM</th><th>Skor</th></tr></thead>
        <tbody><tr><td>jumlah 5 TS</td><td>${d.NI}</td><td>${d.NN}</td><td>${d.NW}</td>
        <td>${NM || '—'}</td><td><b>${skor == null ? '—' : f2(skor)}</b></td></tr></tbody></table></div>`};
  };
  const ak = sub('I. Akademik', siapkanPrestasi('akademik'));
  const na = sub('II. Non-akademik', siapkanPrestasi('non'));
  const skor = (ak.skor == null || na.skor == null) ? null
             : (ak.skor * 3 + na.skor) / 4;
  const isi = ak.html + na.html +
    `<div class="rumus">Skor = ((I &times; 3) + II) / 4 &nbsp;·&nbsp; faktor a=0,2% &nbsp;b=2% &nbsp;c=4% terhadap NM</div>`;
  return kartuButir(43, 'Prestasi akademik dan non-akademik mahasiswa', isi, skor,
    (NM ? '' : `NM (jumlah mahasiswa saat TS) belum ada — isi "Mahasiswa aktif"
      di <a href="data-prodi.html?tab=mahasiswa">Data prodi › Mahasiswa per TS</a>
      untuk TS ${esc(taDari(TS))}. `) +
    'Jendela 5 TS: TS ' + taDari(TS - 4) + ' s.d. ' + taDari(TS) +
    ' (prestasi tanpa bulan dihitung menurut tahun kalendernya). ' +
    'Baris dengan tingkat selain internasional/nasional dihitung wilayah/lokal.');
}

// ---------------------------------------------------------------------
//  Butir 46 — Publikasi ilmiah mahasiswa (3 tahun, mandiri + bersama DTPS)
// ---------------------------------------------------------------------
function butir46(){
  const A = (D.akreditasi || {}).ta || [];
  const barisTS = A.find(r => r.tahun_ts === TS);
  const NM = barisTS ? barisTS.mahasiswa_aktif : 0;
  const j = jumlahJendela(((D.akreditasi || {}).publikasi_mhs) || [],
                          ['na1','na2','na3','na4','nb1','nb2','nb3'], 3);
  const RIn = (j.na4 + j.nb3), RNn = (j.na2 + j.na3 + j.nb2), RWn = (j.na1 + j.nb1);
  const skor = NM > 0 ? skorRasio(RIn / NM, RNn / NM, RWn / NM, 0.01, 0.1, 0.5) : null;
  const isi = tabelNA(j) + `
    <div class="rumus">RI=(NA4+NB3)/NM &nbsp; RN=(NA2+NA3+NB2)/NM &nbsp; RW=(NA1+NB1)/NM &nbsp;·&nbsp; a=0,01 &nbsp;b=0,1 &nbsp;c=0,5</div>`;
  return kartuButir(46, 'Publikasi ilmiah mahasiswa', isi, skor,
    (NM ? '' : `NM belum ada — isi <a href="data-prodi.html?tab=mahasiswa">Data prodi › Mahasiswa per TS</a> untuk TS
      ${esc(taDari(TS))}. `) +
    'Gabungan publikasi mandiri mahasiswa (Data prodi) dan publikasi dosen ' +
    'dengan mahasiswa sebagai PENULIS PERTAMA (form web; syarat Tabel 6.e.1), ' +
    'TS ' + taDari(TS - 2) + ' s.d. ' + taDari(TS) + '. ' +
    'Kolom Indeksasi pada <a href="data-prodi.html?tab=publikasi">Data prodi › Publikasi mahasiswa</a> menentukan ' +
    'kategori NA/NB; bila kosong, terhitung tidak terindeks.');
}

// ---------------------------------------------------------------------
//  Butir 47 — Luaran penelitian/PkM mahasiswa (3 tahun)
// ---------------------------------------------------------------------
function butir47(){
  const j = jumlahJendela(((D.akreditasi || {}).luaran_mhs) || [],
                          ['paten','ttg','bc','hki','lainnya'], 3);
  const NLP = 3 * j.paten + 2 * (j.ttg + j.bc) + j.hki;
  const skor = NLP >= 10 ? 4 : Math.max(2, 2 + 0.2 * NLP);
  const isi = `
    <div class="gulir"><table class="rin"><thead><tr><th>Komponen</th><th>Jumlah</th><th>Bobot</th></tr></thead><tbody>
      <tr><td>NPaten — paten &amp; paten sederhana</td><td>${j.paten}</td><td>&times;3</td></tr>
      <tr><td>NTTG — TTG &amp; produk</td><td>${j.ttg}</td><td>&times;2</td></tr>
      <tr><td>NBC — buku ber-ISBN &amp; book chapter</td><td>${j.bc}</td><td>&times;2</td></tr>
      <tr><td>NHKI — pencatatan ciptaan</td><td>${j.hki}</td><td>&times;1</td></tr>
      <tr><td><b>NLP</b></td><td colspan="2"><b>${NLP}</b></td></tr>
    </tbody></table></div>
    <div class="rumus">NLP &ge; 10 &rarr; 4 &nbsp;·&nbsp; NLP &lt; 10 &rarr; 2 + (0,2 &times; NLP)</div>`;
  return kartuButir(47, 'Luaran penelitian dan PkM mahasiswa', isi, skor,
    'Tahun ' + (TS - 2) + '–' + TS + '. Desain industri, merek, dan rahasia ' +
    'dagang (' + j.lainnya + ' baris) tidak masuk rumus instrumen dan tidak ' +
    'menyumbang skor.');
}

// ---------------------------------------------------------------------
//  Butir 33 — Publikasi DTPS (3 tahun)
// ---------------------------------------------------------------------
function butir33(){
  const N = (D.dtps || {}).jumlah || 0;
  const j = jumlahJendela(((D.akreditasi || {}).publikasi_dtps) || [],
                          ['na1','na2','na3','na4','nb1','nb2','nb3'], 3);
  const skor = N > 0 ? skorRasio((j.na4 + j.nb3) / N,
                                 (j.na2 + j.na3 + j.nb2) / N,
                                 (j.na1 + j.nb1) / N, 0.5, 1, 2) : null;
  const isi = tabelNA(j) + `
    <div class="rumus">RI=(NA4+NB3)/NDTPS &nbsp; RN=(NA2+NA3+NB2)/NDTPS &nbsp; RW=(NA1+NB1)/NDTPS &nbsp;·&nbsp; a=0,5 &nbsp;b=1 &nbsp;c=2 &nbsp;·&nbsp; NDTPS=${N}</div>
    ${rincianButir(33)}`;
  return kartuButir(33, 'Publikasi ilmiah DTPS', isi, skor,
    'Publikasi terverifikasi tahun ' + (TS - 2) + '–' + TS + '. NDTPS memakai ' +
    'jumlah dosen aktif; definisi instrumen ("pengampu mata kuliah sesuai ' +
    'kompetensi inti") lebih sempit, jadi skor ini sedikit konservatif bila ' +
    'ada dosen aktif di luar definisi itu.');
}

// ---------------------------------------------------------------------
//  Butir 34 — Luaran penelitian/PkM DTPS (3 tahun)
// ---------------------------------------------------------------------
function butir34(){
  const N = (D.dtps || {}).jumlah || 0;
  const j = jumlahJendela(((D.akreditasi || {}).luaran_dtps) || [],
                          ['paten','ttg','bc','hki','lainnya'], 3);
  const RLP = N > 0 ? (3 * j.paten + 2 * (j.ttg + j.bc) + j.hki) / N : null;
  const skor = RLP == null ? null : (RLP >= 3 ? 4 : Math.max(2, 2 + (2 * RLP) / 3));
  const isi = `
    <div class="gulir"><table class="rin"><thead><tr><th>Komponen</th><th>Jumlah</th><th>Bobot</th></tr></thead><tbody>
      <tr><td>NPaten</td><td>${j.paten}</td><td>&times;3</td></tr>
      <tr><td>NTTG</td><td>${j.ttg}</td><td>&times;2</td></tr>
      <tr><td>NBC</td><td>${j.bc}</td><td>&times;2</td></tr>
      <tr><td>NHKI — pencatatan ciptaan</td><td>${j.hki}</td><td>&times;1</td></tr>
      <tr><td><b>RLP</b></td><td colspan="2"><b>${RLP == null ? '—' : f2(RLP)}</b></td></tr>
    </tbody></table></div>
    <div class="rumus">RLP = (3&times;NPaten + 2&times;(NTTG+NBC) + NHKI) / NDTPS &nbsp;·&nbsp; RLP &ge; 3 &rarr; 4 &nbsp;·&nbsp; NDTPS=${N}</div>
    ${rincianButir(34)}`;
  return kartuButir(34, 'Luaran penelitian dan PkM DTPS', isi, skor,
    'Luaran terverifikasi tahun ' + (TS - 2) + '–' + TS + '. Baris "lainnya" (' +
    j.lainnya + ') tidak menyumbang skor.');
}

// ---------------------------------------------------------------------
//  Butir 35 — Karya utama internasional DTPS (3 tahun)
// ---------------------------------------------------------------------
function butir35(){
  const N = (D.dtps || {}).jumlah || 0;
  const rinci = (D.dtps || {}).karya_utama_rinci;
  if (!N || !Array.isArray(rinci))
    return kartuButir(35, 'DTPS dengan karya utama internasional',
      `<p class="kosong">Data belum lengkap; minta admin membangun ulang data.</p>`, null, '');
  const org = new Set(rinci.filter(x => x.tahun >= TS - 2 && x.tahun <= TS)
                           .map(x => x.slug));
  const P = org.size / N;
  const skor = P >= 0.5 ? 4 : Math.max(1, 1 + 6 * P);
  const isi = `
    <div class="gulir"><table class="rin"><thead><tr><th>Komponen</th><th>Nilai</th></tr></thead><tbody>
      <tr><td>NKDTPS — dosen dengan karya utama</td><td>${org.size}</td></tr>
      <tr><td>NDTPS</td><td>${N}</td></tr>
      <tr><td><b>PKDTPS</b></td><td><b>${f2(P * 100)}%</b></td></tr>
    </tbody></table></div>
    <div class="rumus">PKDTPS &ge; 50% &rarr; 4 &nbsp;·&nbsp; PKDTPS &lt; 50% &rarr; 1 + (6 &times; PKDTPS) &nbsp;·&nbsp; skor terendah 1</div>`;
  return kartuButir(35, 'DTPS dengan karya utama internasional', isi, skor,
    'Penulis pertama/korespondensi jurnal internasional bereputasi, prosiding ' +
    'terindeks, atau paten, tahun ' + (TS - 2) + '–' + TS + '. Sama dengan ' +
    'butir 7 syarat perlu di halaman monitoring; di sini dinilai sebagai skor.');
}

function taRange(n){ return `TS ${taDari(TS - n + 1)} s.d. ${taDari(TS)}`; }
function ndtps(){ return (D.dtps || {}).jumlah || 0; }

// Butir 6 — kerja sama. Skor = (I + 2×II) / 3.
function butir06(){
  const N = ndtps();
  const j = jumlahJendela(((D.akreditasi || {}).kerjasama) || [],
      ['internasional', 'nasional', 'wilayah', 'tanpa_tingkat', 'pendidikan'], 3);
  // Seluruh komponen RK kini berasal dari data: baris mitra pada karya
  // (penelitian & PkM) ditambah lembar kerjasama (pendidikan dan MoU
  // payung). Tidak ada lagi angka manual di tabel pengaturan.
  const total = j.internasional + j.nasional + j.wilayah + j.tanpa_tingkat;
  let skor1 = null, ket1 = '';
  if (N) { const RK = total / N; skor1 = Math.min(4, RK);
    ket1 = `RK = ${total} / ${N} = ${f2(RK)}` +
      (j.pendidikan ? `, termasuk ${j.pendidikan} kerja sama pendidikan.` : '.'); }
  const skor2 = skorRasio(j.internasional, j.nasional, j.wilayah, 2, 6, 8);
  const skor = skor1 == null ? null : (skor1 + 2 * skor2) / 3;
  const isi = `
    <div class="gulir"><table class="rin"><thead><tr><th>Tingkat</th><th>Jumlah</th></tr></thead><tbody>
      <tr><td>Internasional (NI)</td><td>${j.internasional}</td></tr>
      <tr><td>Nasional (NN)</td><td>${j.nasional}</td></tr>
      <tr><td>Wilayah/lokal (NW)</td><td>${j.wilayah}</td></tr>
      ${j.tanpa_tingkat ? `<tr><td>Tanpa tingkat — lengkapi di data mitra / Data prodi › Kerja sama</td><td>${j.tanpa_tingkat}</td></tr>` : ''}
      <tr><td><b>Jumlah (N1+N2+N3)</b> — di antaranya pendidikan</td>
          <td><b>${total}</b> — ${j.pendidikan}</td></tr>
    </tbody></table></div>
    <div class="rumus">Skor = (I + 2×II) / 3 · I: RK = (N1+N2+N3)/NDTPS · II: a=2, b=6, c=8 · sub-skor II = ${f2(skor2)}</div>
    ${P_DATA ? '' : rincianButir(6)}`;
  return kartuButir('6', 'Kerja sama (Tabel 2.a LKPS)', isi, skor,
    ket1 + ' Sumber: baris mitra pada karya terverifikasi (penelitian & PkM) ' +
    'ditambah <a href="data-prodi.html?tab=kerjasama">Data prodi › Kerja sama</a> (pendidikan dan MoU ' +
    'payung). Jendela ' + taRange(3) +
    (j.tanpa_tingkat ? `. ${j.tanpa_tingkat} mitra belum punya tingkat dan tidak menyumbang skor.` : '.'));
}

// Butir 10-11 — dana penelitian/PkM: dihitung dari besaran_dana pada
// karya terverifikasi (di belakang RLS), TIDAK dari berkas publik.
function butirDanaKarya(no, judul, kategori, amb, pengali){
  const N = ndtps(); if (!N) return kartuButir(no, judul, '<p class="kosong">Data dosen kosong.</p>', null, '');
  const rows = DANA.filter(r => r.kategori === kategori);
  const tsOf = r => (+r.bulan >= 9 ? +r.tahun + 1 : +r.tahun);
  const pilih = rows.filter(r => { const t = tsOf(r); return t >= TS - 2 && t <= TS; });
  const total = pilih.reduce((a, r) => a + (+r.besaran_dana || 0), 0);
  const tanpa = pilih.filter(r => !(+r.besaran_dana > 0)).length;
  if (!pilih.length)
    return kartuButir(no, judul, `<p class="kosong">Belum ada ${kategori}
      terverifikasi pada jendela ${esc(taRange(3))}.</p>`, null, '');
  const rata = total / 3 / N;
  const skor = rata >= amb ? 4 : Math.min(4, (pengali * rata) / 5000000);
  const isi = `
    <div class="gulir"><table class="rin"><tbody>
      <tr><td>Total dana ${kategori} 3 TS</td><td>Rp ${total.toLocaleString('id-ID')}</td></tr>
      <tr><td>Judul kegiatan</td><td>${pilih.length}${tanpa ? ` (${tanpa} tanpa nominal)` : ''}</td></tr>
      <tr><td><b>Rata-rata / DTPS / tahun</b></td><td><b>Rp ${Math.round(rata).toLocaleString('id-ID')}</b></td></tr>
    </tbody></table></div>
    <div class="rumus">≥ Rp ${amb.toLocaleString('id-ID')} → 4 · di bawah itu → ${pengali === 1 ? '' : pengali + ' × '}rata-rata / 5.000.000 · NDTPS=${N}</div>`;
  return kartuButir(no, judul, isi, skor,
    'Dihitung dari besaran dana pada karya terverifikasi — angka ini hanya ' +
    'tampil untuk dosen terdaftar dan tidak pernah masuk data.json.' +
    (tanpa ? ` ${tanpa} kegiatan belum mengisi besaran dana dan terhitung nol.` : ''));
}

// Butir 9 — BOP (dari tabel pengaturan).
function butirDana(no, judul, kunci, amb, pengali){
  const v = IS(kunci);
  if (v == null) return kartuManualKosong(no, judul, kunci);
  const skor = v >= amb ? 4 : Math.min(4, (pengali * v) / 5000000);
  const isi = `
    <div class="gulir"><table class="rin"><tbody>
      <tr><td>Nilai rata-rata / tahun (3 tahun)</td>
      <td>Rp ${v.toLocaleString('id-ID')}</td></tr></tbody></table></div>
    <div class="rumus">≥ Rp ${amb.toLocaleString('id-ID')} → 4 · di bawah itu → ${pengali === 1 ? '' : pengali + ' × '}nilai / 5.000.000</div>`;
  const bop = kunci === 'bop' ? hitungBOP() : null;
  return kartuButir(no, judul, isi, skor, bop
    ? 'Dihitung dari Data prodi › Penggunaan dana (dana PS, baris a–f Biaya Operasional Pendidikan) ÷ mahasiswa aktif: '
      + bop.per.map(x => `${x.ta} Rp ${Math.round(x.dana).toLocaleString('id-ID')} ÷ ${x.mhs} = Rp ${Math.round(x.nilai).toLocaleString('id-ID')}`).join('; ')
      + (bop.per.length < 3 ? ` (baru ${bop.per.length} dari 3 tahun akademik berisi dana dan jumlah mahasiswa).` : '.')
    : kunci === 'bop' ? 'Penggunaan dana atau jumlah mahasiswa aktif belum diisi di Data prodi.'
    : 'Dari tabel pengaturan Supabase; hanya terbaca oleh dosen terdaftar.');
}

// Butir 19 — basic sciences (pita skor diskrit).
function butir19(){
  const v = IS('sks_basic_sciences');
  if (v == null) return kartuManualKosong(19, 'Mata kuliah basic sciences dan matematika (Tabel 3.a.4 LKPS)', 'sks_basic_sciences');
  const skor = v >= 25 ? 4 : v >= 20 ? 3 : v >= 15 ? 2 : v >= 10 ? 1 : 0;
  return kartuButir(19, 'Mata kuliah basic sciences dan matematika (Tabel 3.a.4 LKPS)',
    `<div class="rumus">≥25 SKS → 4 · 20–24 → 3 · 15–19 → 2 · 10–14 → 1 · &lt;10 → 0 · terisi: ${v} SKS</div>`,
    skor, hitungMK()?.basic != null
      ? `Dihitung dari ${hitungMK().nBasic} mata kuliah aktif bertanda basic science (Data prodi › Mata kuliah, Tabel 3.a.4).`
      : 'Belum ada mata kuliah aktif bertanda basic science (Data prodi › Mata kuliah): 0 SKS.');
}

// Butir 23 & 25 — kegiatan melibatkan mahasiswa.
function butirKegMhs(no, judul, kategori){
  const rows = (((D.akreditasi || {}).kegiatan_mhs) || []).filter(r => r.kategori === kategori);
  const j = jumlahJendela(rows, ['total', 'dengan_mahasiswa'], 3);
  if (!j.total)
    return kartuButir(no, judul, `<p class="kosong">Belum ada ${kategori}
      terverifikasi pada jendela ${esc(taRange(3))}.</p>`, null, '');
  const P = j.dengan_mahasiswa / j.total;
  const skor = P >= 0.5 ? 4 : Math.max(1, 1 + 6 * P);
  const isi = `
    <div class="gulir"><table class="rin"><tbody>
      <tr><td>Judul melibatkan mahasiswa</td><td>${j.dengan_mahasiswa}</td></tr>
      <tr><td>Seluruh judul</td><td>${j.total}</td></tr>
      <tr><td><b>Persentase</b></td><td><b>${f2(P * 100)}%</b></td></tr>
    </tbody></table></div>
    <div class="rumus">≥ 50% → 4 · di bawah itu → 1 + (6 × persentase) · skor terendah 1</div>
    ${rincianButir(no)}`;
  return kartuButir(no, judul, isi, skor,
    'Melibatkan = minimal satu mahasiswa tercatat pada karya. Jendela ' + taRange(3) + '.');
}

// Butir 26 — kecukupan DTPS. PDTT = NDTT / (NDT + NDTT) (pemilik 2026-11-10): NDT dan
// NDTT dari kategori dosen di Kelola dosen (hitungDosen); syarat 5 dan 12 memakai NDTPS.
// DTPS pasti dosen tetap, jadi NDT tidak kurang dari NDTPS.
function butir26(){
  const N = ndtps();
  const h = hitungDosen();
  const ndtt = h ? h.ndtt : null;   // tanpa isian manual (pemilik 2026-11-10)
  if (ndtt == null) return kartuManualKosong(26, 'Kecukupan jumlah DTPS (Tabel 4.a LKPS)', 'ndtt');
  const ndt = h ? Math.max(h.ndt, N) : N;
  const PDTT = (ndtt / ((ndt + ndtt) || 1)) * 100;
  let skor;
  if (N < 5) skor = 0;
  else if (N >= 12 && PDTT <= 10) skor = 4;
  else if (N >= 12 && PDTT <= 40) skor = 2 + 2 * ((40 - PDTT) / 30);
  else if (PDTT <= 40) skor = 2 + 2 * (((N - 5) / 7) * ((40 - PDTT) / 40));
  else skor = 2;
  const isi = `
    <div class="gulir"><table class="rin"><tbody>
      <tr><td>NDTPS</td><td>${N}</td></tr>
      <tr><td>NDT (dosen tetap, termasuk dosen tetap PT dari prodi lain)</td><td>${ndt}</td></tr>
      <tr><td>NDTT (dosen tidak tetap dan industri)</td><td>${ndtt}</td></tr>
      <tr><td><b>PDTT = NDTT / (NDT + NDTT)</b></td><td><b>${f2(PDTT)}%</b></td></tr>
    </tbody></table></div>
    <div class="rumus">NDTPS ≥ 12 dan PDTT ≤ 10% → 4 · rumus antara lihat instrumen · NDTPS &lt; 5 → 0</div>`;
  return kartuButir(26, 'Kecukupan jumlah DTPS (Tabel 4.a LKPS)', isi, skor, h
    ? `Dihitung dari kategori dosen aktif di Kelola dosen: ${h.ndt} tetap, ${h.ndtt} tidak tetap/industri`
      + (h.industri ? ` (${h.industri} industri)` : '') + '.'
      + (h.ndt < N ? ` Ada DTPS yang kategorinya belum diisi; NDT memakai NDTPS (${N}).` : '')
      + (h.diterapkan ? ` Hanya yang mengampu MK pada ${TS - 1}/${TS} (Penyusunan kelas atau centang di Kelola dosen)`
          + (h.tidakMengampu.length ? `; tidak dihitung: ${h.tidakMengampu.length} dosen` : '') + '.'
        : ` Data mengampu MK ${TS - 1}/${TS} belum ada, jadi syarat mengampu belum diterapkan.`)
      + ((D.dtps || {}).ampu?.ta && (D.dtps || {}).ampu.ta !== `${TS - 1}/${TS}` ? ` NDTPS dihitung untuk ${(D.dtps || {}).ampu.ta}.` : '')
    : 'Kategori dosen belum diisi di Kelola dosen; NDTT memakai isian manual dan NDT dianggap sama dengan NDTPS.');
}

// Butir 27 & 28 — kualifikasi dan jabatan (versi skor dari data dtps).
function butir27(){
  const N = ndtps(); if (!N) return kartuButir(27, 'Kualifikasi akademik DTPS (Tabel 4.a LKPS)', '<p class="kosong">Data dosen kosong.</p>', null, '');
  const P = ((D.dtps || {}).doktor || 0) / N;
  const skor = P >= 0.5 ? 4 : 2 + 4 * P;
  return kartuButir(27, 'Kualifikasi akademik DTPS (Tabel 4.a LKPS)',
    `<div class="rumus">PDS3 = ${(D.dtps||{}).doktor || 0}/${N} = ${f2(P * 100)}% · ≥ 50% → 4 · di bawah itu → 2 + (4 × PDS3) · skor terendah 2</div>`,
    skor, '');
}
function butir28(){
  const N = ndtps(); if (!N) return kartuButir(28, 'Jabatan akademik DTPS (Tabel 4.a LKPS)', '<p class="kosong">Data dosen kosong.</p>', null, '');
  const jab = (D.dtps || {}).jabatan || {};
  const k = (jab.lektor || 0) + (jab.lektor_kepala || 0) + (jab.guru_besar || 0);
  const P = k / N;
  const skor = P >= 0.7 ? 4 : 2 + (20 * P) / 7;
  return kartuButir(28, 'Jabatan akademik DTPS (Tabel 4.a LKPS)',
    `<div class="rumus">PGBLKL = ${k}/${N} = ${f2(P * 100)}% (GB + LK + L) · ≥ 70% → 4 · di bawah itu → 2 + (20 × PGBLKL)/7 · skor terendah 2</div>`,
    skor, '');
}

// Butir 31 & 32 — kegiatan per sumber dana.
function butirDanaSumber(no, judul, kategori){
  const rows = (((D.akreditasi || {}).sumber_dana) || []).filter(r => r.kategori === kategori);
  const N = ndtps();
  const j = jumlahJendela(rows, ['luar_negeri', 'dalam_negeri', 'pt_mandiri', 'tanpa_sumber'], 3);
  const total = j.luar_negeri + j.dalam_negeri + j.pt_mandiri;
  if (!N || (!total && !j.tanpa_sumber))
    return kartuButir(no, judul, `<p class="kosong">Belum ada ${kategori}
      terverifikasi pada jendela ${esc(taRange(3))}.</p>`, null, '');
  const skor = skorRasio(j.luar_negeri / 3 / N, j.dalam_negeri / 3 / N,
                         j.pt_mandiri / 3 / N, 0.05, 0.3, 1);
  const isi = `
    <div class="gulir"><table class="rin"><thead><tr><th>Sumber dana</th><th>Jumlah 3 th</th></tr></thead><tbody>
      <tr><td>Luar negeri (NI)</td><td>${j.luar_negeri}</td></tr>
      <tr><td>Dalam negeri (NN)</td><td>${j.dalam_negeri}</td></tr>
      <tr><td>PT / mandiri (NW)</td><td>${j.pt_mandiri}</td></tr>
      ${j.tanpa_sumber ? `<tr><td>Tanpa sumber dana tercatat</td><td>${j.tanpa_sumber}</td></tr>` : ''}
    </tbody></table></div>
    <div class="rumus">RI = NI/3/NDTPS · RN = NN/3/NDTPS · RW = NW/3/NDTPS · a=0,05 b=0,3 c=1 · NDTPS=${N}</div>
    ${rincianButir(no)}`;
  return kartuButir(no, judul, isi, skor,
    'Pemetaan: kelompok skema luar negeri → NI; dalam negeri → NN; internal ' +
    'PT dan mandiri → NW. Jendela ' + taRange(3) +
    (j.tanpa_sumber ? `. ${j.tanpa_sumber} kegiatan tanpa sumber dana tidak menyumbang skor.` : '.'));
}

// Butir 36 — karya bereputasi disitasi. KIB = jumlah judul Tabel 4.i untuk TS
// ini, dihitung dari sitasi per tahun dengan aturan yang sama dengan LKPS
// (sitasi.js karya4i; pemilik 2026-11-10). Isian manual kib_3th hanya bila
// belum ada sitasi tercatat untuk TS ini.
function butir36(){
  const N = ndtps(), judul = 'Karya ilmiah bereputasi yang disitasi (Tabel 4.i LKPS)';
  const auto = KARYA_SITASI ? karya4i(KARYA_SITASI, TS) : null;
  const pakaiAuto = !!(auto && auto.length);
  // Tanpa isian manual kib_3th (pemilik 2026-11-10): terbaca tetapi kosong = 0 judul.
  const v = auto ? auto.length : null;
  if (v == null || !N) return kartuManualKosong(36, judul, 'kib_3th');
  const P = v / N;
  const skor = P >= 0.25 ? 4 : 2 + 8 * P;
  const lama = pakaiAuto ? auto.filter(x => x.asal === 'lama').length : 0;
  // Kolom tautan publik ke karya yang mengutip (OpenAlex) untuk asesor (pemilik 2026-11-10).
  const pengutip = k => tautanPengutip(k.openalex_id, TS)
    ? `<a class="bukti-sel" href="${esc(tautanPengutip(k.openalex_id, TS))}" target="_blank" rel="noopener nofollow">OpenAlex &#8599;</a>`
    : '<span class="isian">—</span>';
  const daftar = pakaiAuto ? `<div class="gulir"><table class="rin"><thead><tr><th>Judul</th><th>Tahun</th>
      <th>Sitasi ${TS - 3}–${TS}</th><th>Karya pengutip</th></tr></thead><tbody>${auto.map(({ k, n, asal }) =>
      `<tr><td>${esc(k.judul)}</td><td>${k.tahun || ''}</td><td>${n}${asal === 'lama' ? ' (angka lama)' : ''}</td>
        <td>${pengutip(k)}</td></tr>`).join('')
      }</tbody></table></div>
      <p class="ctt">Tautan OpenAlex: daftar karya yang mengutip pada ${TS - 3}–${TS}, bisa dibuka asesor tanpa masuk akun.
        Jumlahnya bisa sedikit berbeda dari angka sitasi per tahun karena OpenAlex memperbaruinya terpisah.
        Sitasi dari Google Scholar/Scopus tidak punya tautan ini; buktinya diunggah dosen di karya.</p>` : '';
  return kartuButir(36, judul,
    `<div class="rumus">PKIB = ${v}/${N} = ${f2(P * 100)}% · ≥ 25% → 4 · di bawah itu → 2 + (8 × PKIB) · skor terendah 2</div>${daftar}`,
    skor, pakaiAuto
      ? `KIB = ${v} judul jurnal/prosiding Scopus/WoS yang disitasi pada tahun ${TS - 3}–${TS} (beririsan dengan TS-2 s.d. TS), `
        + `dihitung otomatis dari sitasi per tahun${lama ? `; ${lama} memakai angka total lama` : ''}. `
        + 'Perbarui lewat tombol Perbarui sitasi dari OpenAlex atau isian dosen.'
      : 'Belum ada publikasi Scopus/WoS bersitasi pada jendela TS ini: KIB = 0. Isi sitasi per tahun di karya dosen atau tekan Perbarui sitasi dari OpenAlex.');
}

// Butir 37 — rekognisi DTPS.
function butir37(){
  const N = ndtps();
  const rinci = ((D.akreditasi || {}).rekognisi_dtps) || [];
  const org = new Set(rinci.filter(x => x.tahun >= TS - 2 && x.tahun <= TS).map(x => x.slug));
  if (!N) return kartuButir(37, 'Rekognisi DTPS (Tabel 4.j LKPS)', '<p class="kosong">Data dosen kosong.</p>', null, '');
  const P = org.size / N;
  const skor = P >= 0.5 ? 4 : 2 + 4 * P;
  return kartuButir(37, 'Rekognisi DTPS (Tabel 4.j LKPS)',
    `<div class="rumus">PRDTPS = ${org.size}/${N} = ${f2(P * 100)}% · ≥ 50% → 4 · di bawah itu → 2 + (4 × PRDTPS) · skor terendah 2</div>
     ${rincianButir(37)}`,
    skor, 'Dosen dengan minimal satu rekognisi terverifikasi, jendela ' + taRange(3) +
    '. Skor menghitung JUMLAH DOSEN (' + org.size + '), sedangkan daftar di bawah ' +
    'memuat setiap rekognisi — satu dosen dengan dua rekognisi tetap dihitung sekali.');
}

// Butir 40 & 41 — rasio mahasiswa dan mahasiswa asing.
function barisTA(){ return (((D.akreditasi || {}).ta) || []).find(r => r.tahun_ts === TS); }
function butir40(){
  const N = ndtps(); const b = barisTA();
  const NM = b ? b.mahasiswa_aktif : 0;
  if (!N || !NM)
    return kartuButir(40, 'Rasio mahasiswa terhadap DTPS (Tabel 6.a LKPS)',
      `<p class="kosong">Isi "Mahasiswa aktif" di <a href="data-prodi.html?tab=mahasiswa">Data prodi › Mahasiswa per TS</a>
      untuk TS ${esc(taDari(TS))}.</p>`, null, '');
  const RMD = NM / N;
  let skor;
  const A = (N - 5) / 7;
  const B = RMD < 15 ? RMD / 15 : RMD <= 25 ? 1 : RMD <= 35 ? (35 - RMD) / 10 : 0;
  if (RMD > 35) skor = 0;
  else if (N >= 12 && RMD >= 15 && RMD <= 25) skor = 4;
  else if (N >= 12) skor = 1 + 3 * B;
  else skor = 1 + 3 * (A * B);
  return kartuButir(40, 'Rasio mahasiswa terhadap DTPS (Tabel 6.a LKPS)',
    `<div class="rumus">RMD = ${NM}/${N} = ${f2(RMD)} · ideal 15–25 dengan NDTPS ≥ 12 → 4 · RMD &gt; 35 → 0</div>`,
    skor, '');
}
function butir41(){
  const b = barisTA();
  if (!b || !b.mahasiswa_aktif || b.mahasiswa_asing == null)
    return kartuButir(41, 'Mahasiswa asing (Tabel 6.a LKPS)',
      `<p class="kosong">Isi "Mahasiswa asing" di <a href="data-prodi.html?tab=mahasiswa">Data prodi › Mahasiswa per TS</a>
      untuk TS ${esc(taDari(TS))}.</p>`, null, '');
  const P = b.mahasiswa_asing / b.mahasiswa_aktif;
  const skor = P >= 0.01 ? 4 : Math.max(2, 2 + 200 * P);
  return kartuButir(41, 'Mahasiswa asing (Tabel 6.a LKPS)',
    `<div class="rumus">PMA = ${b.mahasiswa_asing}/${b.mahasiswa_aktif} = ${f2(P * 100)}% · ≥ 1% → 4 · di bawah itu → 2 + (200 × PMA)</div>`,
    skor, '');
}

// Butir 44 & 45 — masa studi & tepat waktu (rerata tertimbang 3 TS).
function reratTA(kunci){
  const rows = (((D.akreditasi || {}).ta) || [])
    .filter(r => r.tahun_ts >= TS - 2 && r.tahun_ts <= TS && r.lulusan > 0 && r[kunci] > 0);
  if (!rows.length) return null;
  const n = rows.reduce((a, r) => a + r.lulusan, 0);
  return rows.reduce((a, r) => a + r[kunci] * r.lulusan, 0) / n;
}
// Kohort (Tabel 6.d) adalah sumber utama butir 44/45. Tabel 6.d Sarjana
// memuat kohort baris TS-7 s.d. TS. TS di halaman ini = tahun ujung TS
// (TS 2025/2026 -> 2026), jadi angkatan yang masuk September 2025 adalah
// baris TS: baris TS-k = tahun_masuk TS - 1 - k.
// Tafsiran (keputusan pemilik 2026-10-12, docs/analisis... §4):
//   butir 44: MS = rerata tertimbang lulusan seluruh kohort TS-7..TS;
//             3 < MS <= 3,5 -> skor 4, MS > 8 -> skor 0 (celah rubrik);
//   butir 45: PTW = b/a pada kohort bertanda (a)(b) di Tabel 6.d, yaitu
//             baris TS-3: a = jumlah masuk, b = lulus 3,5 < MS <= 4,5.
const tahunMasukBaris = k => TS - 1 - k;
function kohort6d(){
  return (((D.akreditasi || {}).kohort) || [])
    .filter(k => k.tahun_masuk >= tahunMasukBaris(7) && k.tahun_masuk <= tahunMasukBaris(0))
    .sort((a, b) => b.tahun_masuk - a.tahun_masuk);
}
function skorMS(MS){
  if (MS > 3 && MS <= 4.5) return 4;          // 3 < MS <= 3,5: celah, diberi 4
  if (MS > 4.5 && MS <= 8) return (55 - 6 * MS) / 7;
  return 0;                                    // MS <= 3 atau MS > 8 (celah, diberi 0)
}

function butir44(){
  const K = kohort6d().filter(k => k.lulus > 0);
  if (K.length){
    const n = K.reduce((a, k) => a + k.lulus, 0);
    const MS = K.reduce((a, k) => a + k.ms_tertimbang * k.lulus, 0) / n;
    const skor = skorMS(MS);
    const ket = (MS > 3 && MS <= 3.5) || MS > 8
      ? 'MS berada di celah rubrik instrumen; skor mengikuti tafsiran yang disepakati. ' : '';
    const isi = `
      <div class="gulir"><table class="rin"><thead><tr><th>Angkatan</th>
        <th>Masuk</th><th>Lulus</th><th>MS taksiran</th></tr></thead><tbody>
        ${K.map(k => `<tr><td>${k.tahun_masuk}</td><td>${k.masuk}</td>
          <td>${k.lulus}</td><td>${f2(k.ms_tertimbang)}</td></tr>`).join('')}
        <tr><td><b>Gabungan</b></td><td></td><td>${n}</td><td><b>${f2(MS)}</b></td></tr>
      </tbody></table></div>
      <div class="rumus">3,5 &lt; MS ≤ 4,5 → 4 · 4,5 &lt; MS ≤ 8 → (55 − 6×MS)/7 · MS ≤ 3 → 0
        · celah: 3 &lt; MS ≤ 3,5 → 4, MS &gt; 8 → 0</div>`;
    return kartuButir(44, 'Masa studi (Tabel 6.d LKPS)', isi, skor, ket +
      `Kohort baris TS-7 s.d. TS Tabel 6.d: angkatan masuk ${tahunMasukBaris(7)}–${
      tahunMasukBaris(0)}. MS ditaksir dari titik tengah tiap pita masa studi ` +
      '(4,0 · 5,0 · 6,0 · 7,25) karena tabel LKPS hanya memberi rentang.');
  }
  const MS = reratTA('rerata_masa_studi');
  if (MS == null){
    const adaKohort = (((D.akreditasi || {}).kohort) || []).length > 0;
    return kartuButir(44, 'Masa studi (Tabel 6.d LKPS)', `<p class="kosong">${
      adaKohort
        ? `<a href="data-prodi.html?tab=kohort">Data prodi › Kohort lulusan</a> sudah terisi, tetapi belum ada
           lulusan dari angkatan masuk ${tahunMasukBaris(7)}–${tahunMasukBaris(0)}
           (kohort baris TS-7 s.d. TS Tabel 6.d).`
        : `Isi <a href="data-prodi.html?tab=kohort">Data prodi › Kohort lulusan</a>: jumlah masuk per angkatan
           dan jumlah lulusan pada tiap pita masa studi. Sebagai cadangan,
           kolom "Rerata masa studi" di Mahasiswa per TS juga dibaca.`}</p>`, null, '');
  }
  const skor = skorMS(MS);
  const ket = (MS > 3 && MS <= 3.5) || MS > 8
    ? 'MS berada di celah rubrik instrumen; skor mengikuti tafsiran yang disepakati.' : '';
  return kartuButir(44, 'Masa studi (Tabel 6.d LKPS)',
    `<div class="rumus">MS = ${f2(MS)} tahun · 3,5 &lt; MS ≤ 4,5 → 4 · 4,5 &lt; MS ≤ 8 → (55 − 6×MS)/7 · MS ≤ 3 → 0</div>`,
    skor, ket + ' Rerata tertimbang jumlah lulusan, 3 TS terakhir.');
}
function butir45(){
  const thm = tahunMasukBaris(3);
  const k = kohort6d().find(x => x.tahun_masuk === thm && x.masuk > 0);
  if (k){
    const fr = k.lulus_3_5_sd_4_5 / k.masuk;
    const skor = fr >= 0.5 ? 4 : fr > 0 ? 1 + 6 * fr : 0;
    const isi = `
      <div class="gulir"><table class="rin"><thead><tr><th>Angkatan (baris TS-3)</th>
        <th>Masuk (a)</th><th>Lulus 3,5 &lt; MS ≤ 4,5 (b)</th></tr></thead><tbody>
        <tr><td>${k.tahun_masuk}</td><td>${k.masuk}</td><td>${k.lulus_3_5_sd_4_5}</td></tr>
      </tbody></table></div>
      <div class="rumus">PTW = (b/a) × 100% = ${f2(fr * 100)}% · ≥ 50% → 4 · 0 &lt; PTW &lt; 50% → 1 + (6 × PTW) · 0 → 0</div>`;
    return kartuButir(45, 'Kelulusan tepat waktu (Tabel 6.d LKPS)', isi, skor,
      'a dan b mengikuti penanda (a)(b) Tabel 6.d pada kohort baris TS-3 ' +
      `(angkatan masuk ${thm}). Rumus instrumen tidak mendefinisikan a dan b; ` +
      'tafsiran ini keputusan pemilik 2026-10-12.');
  }
  const P = reratTA('persen_tepat_waktu');
  if (P == null){
    const adaKohort = (((D.akreditasi || {}).kohort) || []).length > 0;
    return kartuButir(45, 'Kelulusan tepat waktu (Tabel 6.d LKPS)', `<p class="kosong">${
      adaKohort
        ? `<a href="data-prodi.html?tab=kohort">Data prodi › Kohort lulusan</a> sudah terisi, tetapi tidak ada
           angkatan masuk ${tahunMasukBaris(3)} (kohort baris TS-3 Tabel 6.d).`
        : `Isi <a href="data-prodi.html?tab=kohort">Data prodi › Kohort lulusan</a>: kolom jumlah masuk dan
           lulus 3,5–4,5 tahun menentukan butir ini. Cadangannya kolom
           "Lulus tepat waktu (%)" di Mahasiswa per TS.`}</p>`,
      null, '');
  }
  const fr = P / 100;
  const skor = fr >= 0.5 ? 4 : fr > 0 ? 1 + 6 * fr : 0;
  return kartuButir(45, 'Kelulusan tepat waktu (Tabel 6.d LKPS)',
    `<div class="rumus">PTW = ${f2(P)}% · ≥ 50% → 4 · 0 &lt; PTW &lt; 50% → 1 + (6 × PTW) · 0 → 0</div>`,
    skor, 'Rerata tertimbang jumlah lulusan, 3 TS terakhir.');
}

// Butir 49, 50, 51 — tracer, jendela TS-2 s.d. TS-1.
function tracerJendela(){
  const tr = (D.tracer || []).filter(t => t.tahun_lulus >= TS - 2 && t.tahun_lulus <= TS - 1);
  const lulusan = tr.reduce((a, t) => a + (t.lulusan || 0), 0);
  const terlacak = tr.reduce((a, t) => a + (t.terlacak || 0), 0);
  return { tr, lulusan, terlacak,
           responden: lulusan ? (terlacak / lulusan) * 100 : 0 };
}
function catatanResponden(J){
  let c = `Jendela tahun lulus ${TS - 2}–${TS - 1} (TS-2 s.d. TS-1 — berbeda dari syarat perlu yang memakai dua tahun terakhir). `;
  if (J.lulusan) c += `Responden ${f2(J.responden)}%` +
    (J.responden < 30 ? ' — DI BAWAH batas minimal 30%, skor tidak sahih menurut instrumen.' : ' (memenuhi minimal 30%).');
  return c;
}
function butir49(){
  const J = tracerJendela();
  if (!J.terlacak)
    return kartuButir(49, 'Waktu tunggu (Tabel 6.f.1 LKPS)', `<p class="kosong"><a href="data-prodi.html?tab=tracer">Data prodi › Tracer study</a>
      belum berisi tahun lulus ${TS - 2}–${TS - 1}.</p>`, null, '');
  const WT = J.tr.reduce((a, t) => a + (t.waktu_tunggu_bulan || 0) * (t.terlacak || 0), 0) / J.terlacak;
  const skor = WT <= 3 ? 4 : WT <= 18 ? Math.max(1, (23 - WT) / 5) : 1;
  const P = cekPitaWT(J.tr, WT);
  const pita = !P ? '' : `<div class="rumus">Pita Tabel 6.f.1: &lt; 3 bulan ${P.a} · 3–18 bulan ${P.b} · &gt; 18 bulan ${P.c} orang`
    + ` → rata-rata yang mungkin ${f2(P.bawah)}–${P.atas === Infinity ? '…' : f2(P.atas)} bulan`
    + (P.cocok ? ' (cocok)' : ` · <b>TIDAK COCOK</b> dengan rata-rata ${f2(WT)} bulan: periksa isian Data prodi › Tracer study`) + `</div>`;
  return kartuButir(49, 'Waktu tunggu (Tabel 6.f.1 LKPS)',
    `<div class="rumus">WT = ${f2(WT)} bulan (rata-rata laporan tracer) · ≤ 3 → 4 · 3 &lt; WT ≤ 18 → (23 − WT)/5 · skor terendah 1</div>${pita}`,
    skor, catatanResponden(J));
}
function butir50(){
  const J = tracerJendela();
  if (!J.terlacak)
    return kartuButir(50, 'Kesesuaian bidang kerja (Tabel 6.f.2 LKPS)', `<p class="kosong"><a href="data-prodi.html?tab=tracer">Data prodi › Tracer study</a>
      belum berisi tahun lulus ${TS - 2}–${TS - 1}.</p>`, null, '');
  // Pemilik 2026-11-05: sesuai = kesesuaian Sedang ("cukup sesuai") + Tinggi (Tabel 6.f.2).
  // Tahun lulus yang belum mengisi tingkat kesesuaian memakai isian lama "Bekerja sesuai bidang".
  const ss = J.tr.reduce((a, t) => a + sesuaiTracer(t), 0);
  const lama = J.tr.filter(t => !adaTingkat(t)).map(t => t.tahun_lulus);
  const KBK = ss / J.terlacak;
  const skor = KBK >= 0.6 ? 4 : (20 * KBK) / 3;
  return kartuButir(50, 'Kesesuaian bidang kerja (Tabel 6.f.2 LKPS)',
    `<div class="rumus">KBK = (sedang + tinggi) / terlacak = ${ss}/${J.terlacak} = ${f2(KBK * 100)}% · ≥ 60% → 4 · di bawah itu → (20 × KBK)/3</div>`
    + (lama.length ? `<div class="rumus">Tahun lulus ${lama.join(', ')}: tingkat kesesuaian belum diisi, memakai "Bekerja sesuai bidang".</div>` : ''),
    skor, catatanResponden(J));
}
function butir51(){
  const J = tracerJendela();
  const NI = J.tr.reduce((a, t) => a + (t.kerja_internasional || 0), 0);
  const NN = J.tr.reduce((a, t) => a + (t.kerja_nasional || 0), 0);
  const NW = J.tr.reduce((a, t) => a + (t.kerja_wilayah || 0), 0);
  if (!J.lulusan || (NI + NN + NW) === 0)
    return kartuButir(51, 'Tingkat tempat kerja lulusan (Tabel 6.g.1 LKPS)', `<p class="kosong">Isi
      kolom tempat kerja (internasional / nasional / wilayah) di
      <a href="data-prodi.html?tab=tracer">Data prodi › Tracer study</a> (tahun lulus ${TS - 2}–${TS - 1}).</p>`, null, '');
  const skor = skorRasio(NI / J.lulusan, NN / J.lulusan, NW / J.lulusan, 0.05, 0.2, 0.9);
  const isi = `
    <div class="gulir"><table class="rin"><tbody>
      <tr><td>Multinasional/internasional (NI)</td><td>${NI}</td></tr>
      <tr><td>Nasional / wirausaha berizin (NN)</td><td>${NN}</td></tr>
      <tr><td>Wilayah / wirausaha tak berizin (NW)</td><td>${NW}</td></tr>
      <tr><td>Jumlah lulusan (NL)</td><td>${J.lulusan}</td></tr>
    </tbody></table></div>
    <div class="rumus">a=5% b=20% c=90% terhadap NL</div>`;
  return kartuButir(51, 'Tingkat tempat kerja lulusan (Tabel 6.g.1 LKPS)', isi, skor, catatanResponden(J));
}

// ===== akhir isi utuh =============================================================

// Daftar butir berumus (dulu di daftarButir() skor.html).
function daftarRumus(){
  return [
    {no:'6',  f: butir06},
    {no:'9',  f: () => butirDana(9,  'Biaya operasional pendidikan (Tabel 2.b LKPS)', 'bop', 20000000, 1)},
    {no:'10', f: () => butirDanaKarya(10, 'Dana penelitian DTPS (Tabel 2.b LKPS)', 'penelitian', 10000000, 2)},
    {no:'11', f: () => butirDanaKarya(11, 'Dana PkM DTPS (Tabel 2.b LKPS)', 'pkm', 5000000, 4)},
    {no:'19', f: butir19},
    {no:'23', f: () => butirKegMhs(23, 'Penelitian DTPS melibatkan mahasiswa (Tabel 6.h.1 LKPS)', 'penelitian')},
    {no:'25', f: () => butirKegMhs(25, 'PkM DTPS melibatkan mahasiswa (Tabel 6.i LKPS)', 'pkm')},
    {no:'26', f: butir26}, {no:'27', f: butir27}, {no:'28', f: butir28},
    {no:'31', f: () => butirDanaSumber(31, 'Penelitian DTPS per sumber dana (Tabel 3.b LKPS)', 'penelitian')},
    {no:'32', f: () => butirDanaSumber(32, 'PkM DTPS per sumber dana (Tabel 3.c LKPS)', 'pkm')},
    {no:'33', f: butir33}, {no:'34', f: butir34}, {no:'35', f: butir35},
    {no:'36', f: butir36}, {no:'37', f: butir37},
    {no:'40', f: butir40}, {no:'41', f: butir41},
    {no:'42', f: butir42}, {no:'43', f: butir43},
    {no:'44', f: butir44}, {no:'45', f: butir45},
    {no:'46', f: butir46}, {no:'47', f: butir47},
    {no:'49', f: butir49}, {no:'50', f: butir50}, {no:'51', f: butir51},
  ];
}

  const bungkus = f => (...a) => { segarkan(); return f(...a); };
  const FUNGSI = {
    jumlahJendela, skorRasio, butir42, siapkanPrestasi, butir43, butir46, butir47, butir33,
    butir34, butir35, taRange, ndtps, butir06, butirDanaKarya, butirDana, butir19, butirKegMhs,
    butir26, butir27, butir28, butirDanaSumber, butir36, butir37, barisTA, butir40, butir41,
    reratTA, tahunMasukBaris, kohort6d, skorMS, butir44, butir45, tracerJendela, catatanResponden,
    butir49, butir50, butir51
  };
  return {
    daftar: () => { segarkan(); return daftarRumus().map(x => ({ no: x.no, f: bungkus(x.f) })); },
    fungsi: Object.fromEntries(Object.entries(FUNGSI).map(([n, f]) => [n, bungkus(f)])),
  };
}
