// Pemeriksa mutu data (pemilik 2026-11-11): menandai data yang perlu diperbaiki
// sebelum asesor atau auditor melihatnya. Hanya membaca; tidak mengubah apa pun.
// Masukan M = { karya, karyaBukti, karyaPenulis, dosen, mk, kerjasama, tracer }.
// Tiap pemeriksaan -> { id, judul, tingkat: 'penting'|'periksa'|'info', ket, ke, temuan: [{teks}] }.

const BATAS_MIRIP = 0.85;     // kemiripan kata judul (Jaccard) untuk dugaan entri ganda
const HARI_MENUNGGU = 30;     // karya diajukan lebih lama dari ini belum diverifikasi
const POLA_DOI = /^10\.\d{4,9}\/\S+$/;

export const normDOI = s => String(s || '').trim().toLowerCase()
  .replace(/^https?:\/\/(dx\.)?doi\.org\//, '').replace(/^doi:\s*/, '');
const kata = s => new Set(String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]+/g, ' ')
  .split(/\s+/).filter(w => w.length > 2));
export function mirip(a, b){
  const A = kata(a), B = kata(b);
  if (A.size < 4 || B.size < 4) return 0;
  let sama = 0; A.forEach(w => { if (B.has(w)) sama++; });
  return sama / (A.size + B.size - sama);
}
// TS berjalan: 1 Sep–31 Agu, ditulis tahun akhirnya.
export const tsBerjalan = kini => kini.getMonth() >= 8 ? kini.getFullYear() + 1 : kini.getFullYear();
const tglISO = kini => `${kini.getFullYear()}-${String(kini.getMonth() + 1).padStart(2, '0')}-${String(kini.getDate()).padStart(2, '0')}`;
const labelKarya = k => `${k.tahun || '—'} · ${k.kategori || ''} · ${k.judul || '(tanpa judul)'}`;
const AKTIF = k => k.status === 'diajukan' || k.status === 'terverifikasi';

export function periksaMutu(M, kini = new Date()){
  const karya = (M.karya || []).filter(AKTIF);
  const byId = new Map((M.karya || []).map(k => [k.id, k]));
  const punyaBukti = new Set((M.karyaBukti || []).map(b => b.karya_id));
  const adaBukti = k => !!k && (!!k.bukti_url || punyaBukti.has(k.id));
  const penulis = new Set((M.karyaPenulis || []).map(p => p.karya_id));
  const hasil = [];
  const tambah = (id, judul, tingkat, ket, ke, temuan) => hasil.push({ id, judul, tingkat, ket, ke, temuan });

  // 1. Karya tanpa bukti (bukti induk penelitian/PkM ikut dihitung, seperti di daftar karya).
  tambah('karya_tanpa_bukti', 'Karya tanpa bukti', 'penting',
    'Karya diajukan/terverifikasi tanpa tautan bukti, tanpa berkas bukti, dan induknya pun tanpa bukti.', 'verifikasi.html',
    karya.filter(k => !adaBukti(k) && !adaBukti(byId.get(k.induk_id))).map(k => ({ teks: labelKarya(k) })));

  // 2–3. DOI ganda dan DOI tidak sah.
  const perDOI = new Map();
  karya.forEach(k => { const d = normDOI(k.doi); if (d) { if (!perDOI.has(d)) perDOI.set(d, []); perDOI.get(d).push(k); } });
  tambah('doi_ganda', 'DOI sama pada lebih dari satu karya', 'penting',
    'Kemungkinan karya yang sama tercatat dua kali; satu cukup, penulis lain ditambahkan sebagai rekan.', 'verifikasi.html',
    [...perDOI].filter(([, xs]) => xs.length > 1).map(([d, xs]) => ({ teks: `${d}: ${xs.map(labelKarya).join(' | ')}` })));
  tambah('doi_format', 'Format DOI tidak sah', 'periksa',
    'DOI semestinya berbentuk 10.xxxx/… (tanpa spasi). Tautan https://doi.org/… diterima.', 'verifikasi.html',
    karya.filter(k => normDOI(k.doi) && !POLA_DOI.test(normDOI(k.doi))).map(k => ({ teks: `${labelKarya(k)} — "${k.doi}"` })));

  // 4. Judul mirip dalam kategori yang sama (judul_norm sama, atau kemiripan kata ≥ 85%).
  const pasang = [];
  const perKat = new Map();
  karya.forEach(k => { if (!perKat.has(k.kategori)) perKat.set(k.kategori, []); perKat.get(k.kategori).push(k); });
  perKat.forEach(xs => {
    for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) {
      const a = xs[i], b = xs[j];
      if (normDOI(a.doi) && normDOI(a.doi) === normDOI(b.doi)) continue;   // sudah di DOI ganda
      const sama = a.judul_norm && a.judul_norm === b.judul_norm;
      const m = sama ? 1 : mirip(a.judul, b.judul);
      if (m >= BATAS_MIRIP) pasang.push({ teks: `${Math.round(m * 100)}%: ${labelKarya(a)} | ${labelKarya(b)}` });
    }
  });
  tambah('judul_mirip', 'Judul sangat mirip (dugaan entri ganda)', 'periksa',
    `Judul dalam kategori sama yang identik atau kemiripan katanya ≥ ${Math.round(BATAS_MIRIP * 100)}%. Bisa saja memang karya berbeda (mis. bagian 1 dan 2).`,
    'verifikasi.html', pasang);

  // 5. Publikasi jurnal/prosiding tanpa DOI maupun URL.
  tambah('publikasi_tanpa_tautan', 'Publikasi tanpa DOI maupun URL', 'periksa',
    'Asesor memeriksa publikasi lewat DOI atau halaman terbitan.', 'verifikasi.html',
    karya.filter(k => k.kategori === 'publikasi' && ['jurnal', 'prosiding'].includes(k.jenis) && !normDOI(k.doi) && !k.url)
      .map(k => ({ teks: labelKarya(k) })));

  // 6. Karya tanpa penulis dari prodi.
  tambah('karya_tanpa_penulis', 'Karya tanpa penulis dari prodi', 'penting',
    'Karya ini tidak terhitung untuk dosen mana pun.', 'verifikasi.html',
    karya.filter(k => !penulis.has(k.id)).map(k => ({ teks: labelKarya(k) })));

  // 7. Karya lama menunggu verifikasi.
  const batas = kini.getTime() - HARI_MENUNGGU * 864e5;
  tambah('menunggu_lama', `Karya diajukan lebih dari ${HARI_MENUNGGU} hari belum diverifikasi`, 'periksa',
    'Karya yang belum terverifikasi tidak masuk hitungan skor dan LKPS.', 'verifikasi.html',
    karya.filter(k => k.status === 'diajukan' && k.dibuat_pada && new Date(k.dibuat_pada).getTime() < batas)
      .map(k => ({ teks: `${labelKarya(k)} (diajukan ${String(k.dibuat_pada).slice(0, 10)})` })));

  // 8. Dosen aktif: ID dan data akademik.
  const dosen = (M.dosen || []).filter(d => d.aktif !== false && d.peran !== 'asesor');
  tambah('dosen_tanpa_id', 'Dosen aktif tanpa ID SINTA, Scopus, atau ORCID', 'periksa',
    'ID dipakai untuk impor karya dan dicek asesor.', 'kelola-dosen.html',
    dosen.map(d => ({ d, kurang: [['sinta_id', 'SINTA'], ['scopus_id', 'Scopus'], ['orcid', 'ORCID']].filter(([k]) => !String(d[k] || '').trim()).map(x => x[1]) }))
      .filter(x => x.kurang.length).map(x => ({ teks: `${x.d.nama}: ${x.kurang.join(', ')}` })));
  tambah('dosen_data_akademik', 'DTPS tanpa pendidikan, jabatan, atau NIDN', 'penting',
    'Dipakai Tabel 4.a LKPS dan butir kecukupan/kualifikasi dosen.', 'kelola-dosen.html',
    dosen.filter(d => d.dtps).map(d => ({ d, kurang: [['pendidikan', 'pendidikan'], ['jabatan', 'jabatan'], ['nidn', 'NIDN']].filter(([k]) => !String(d[k] || '').trim()).map(x => x[1]) }))
      .filter(x => x.kurang.length).map(x => ({ teks: `${x.d.nama}: ${x.kurang.join(', ')}` })));

  // 9. Mata kuliah.
  const mk = (M.mk || []).filter(m => m.aktif !== false);
  const labelMK = m => `${m.kode || '—'} ${m.nama || ''}`;
  tambah('mk_tanpa_rps', 'MK aktif tanpa RPS', 'penting', 'Butir 15 menilai ketersediaan RPS.', 'data-prodi.html?tab=mk',
    mk.filter(m => !m.rps_ada && !m.rps_url).map(m => ({ teks: labelMK(m) })));
  tambah('mk_rps_9', 'RPS belum memuat 9 komponen', 'periksa', 'Butir 15 unsur 4: RPS memuat 9 komponen.', 'data-prodi.html?tab=mk',
    mk.filter(m => (m.rps_ada || m.rps_url) && m.rps_9_komponen === false).map(m => ({ teks: labelMK(m) })));
  tambah('mk_sks', 'SKS tidak sama dengan jumlah rinciannya', 'periksa',
    'SKS total semestinya = SKS kuliah + seminar + praktikum (bila rincian diisi).', 'data-prodi.html?tab=mk',
    mk.filter(m => [m.sks_kuliah, m.sks_seminar, m.sks_praktikum].some(v => v != null) && m.sks != null
      && Math.abs(+m.sks - ((+m.sks_kuliah || 0) + (+m.sks_seminar || 0) + (+m.sks_praktikum || 0))) > 0.001)
      .map(m => ({ teks: `${labelMK(m)}: ${m.sks} ≠ ${(+m.sks_kuliah || 0)} + ${(+m.sks_seminar || 0)} + ${(+m.sks_praktikum || 0)}` })));

  // 10. Kerja sama yang sudah berakhir.
  const hariIni = tglISO(kini);
  tambah('ks_berakhir', 'Kerja sama sudah berakhir', 'info',
    'Tetap terhitung pada TS saat masih berlaku; perpanjang bila kerja sama masih berjalan.', 'data-prodi.html?tab=kerjasama',
    (M.kerjasama || []).filter(r => r.tanggal_selesai ? String(r.tanggal_selesai).slice(0, 10) < hariIni
      : r.tahun_selesai != null && +r.tahun_selesai < kini.getFullYear())
      .map(r => ({ teks: `${r.mitra || '—'} (${r.jenis || ''}) berakhir ${r.tanggal_selesai ? String(r.tanggal_selesai).slice(0, 10) : r.tahun_selesai}` })));

  // 11. Tracer: lulusan dua tahun terakhir (jendela tracer TS berjalan) dan konsistensi angka.
  const ts = tsBerjalan(kini), tracer = M.tracer || [];
  const perlu = [ts - 2, ts - 1].filter(t => !tracer.some(r => +r.tahun_lulus === t));
  const tak = tracer.filter(r => (r.jumlah_terlacak != null && r.jumlah_lulusan != null && +r.jumlah_terlacak > +r.jumlah_lulusan)
    || ((+r.wt_kurang_3 || 0) + (+r.wt_3_18 || 0) + (+r.wt_lebih_18 || 0) > (+r.jumlah_terlacak || 0) && r.jumlah_terlacak != null)
    || ((+r.kesesuaian_rendah || 0) + (+r.kesesuaian_sedang || 0) + (+r.kesesuaian_tinggi || 0) > (+r.jumlah_terlacak || 0) && r.jumlah_terlacak != null));
  tambah('tracer', 'Tracer study belum ada atau angkanya tidak konsisten', 'penting',
    `Jendela tracer TS ${ts - 1}/${ts}: lulusan ${ts - 2} dan ${ts - 1}. Terlacak tidak boleh melebihi lulusan; rincian waktu tunggu dan kesesuaian tidak boleh melebihi terlacak.`,
    'data-prodi.html?tab=tracer',
    [...perlu.map(t => ({ teks: `Lulusan ${t}: belum ada baris tracer` })),
     ...tak.map(r => ({ teks: `Lulusan ${r.tahun_lulus}: lulusan ${r.jumlah_lulusan ?? '—'}, terlacak ${r.jumlah_terlacak ?? '—'}, `
       + `waktu tunggu ${(+r.wt_kurang_3 || 0) + (+r.wt_3_18 || 0) + (+r.wt_lebih_18 || 0)}, kesesuaian ${(+r.kesesuaian_rendah || 0) + (+r.kesesuaian_sedang || 0) + (+r.kesesuaian_tinggi || 0)}` }))]);

  return hasil;
}

export const TINGKAT = { penting: ['Penting', 'var(--merah)'], periksa: ['Periksa', '#B8860B'], info: ['Info', 'var(--muted)'] };

// CSV semua temuan (pemisah ; untuk Excel berbahasa Indonesia), dengan BOM UTF-8.
export function csvMutu(hasil){
  const q = s => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const baris = [['Pemeriksaan', 'Tingkat', 'Temuan', 'Tempat memperbaiki'].map(q).join(';')];
  hasil.forEach(h => h.temuan.forEach(t => baris.push([h.judul, TINGKAT[h.tingkat][0], t.teks, h.ke].map(q).join(';'))));
  return String.fromCharCode(0xFEFF) + baris.join('\r\n');
}
