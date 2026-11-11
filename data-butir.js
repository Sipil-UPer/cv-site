/* =====================================================================
   DATA BUTIR — baris yang benar-benar dipakai tiap butir (pemilik 2026-11-07)
   ---------------------------------------------------------------------
   skor.html menghitung skor dari agregat data.json (tanpa id dan tautan).
   Modul ini mengulang penyaring rumus yang sama pada baris Supabase, supaya
   kartu butir bisa menampilkan baris sumbernya beserta buktinya. Penyaring
   di sini disalin dari bangun.py dan fungsi butir di skor.html; tiap entri
   menyebut asalnya. Angka `pakai` dibandingkan dengan `pembanding` dari
   data.json: bila berbeda, kartu menampilkan PERIKSA (data.json dibangun
   tiap jam, jadi selisih sesaat setelah isian baru masih wajar).

   P (dari skor.html, lewat RLS pengguna yang login):
     mhs, kohort, tracer, kepuasan, prestasi, pubMhs, luaranMhs, kerjasama
                 baris tabel lkps_* apa adanya
     karya       karya terverifikasi: id, kategori, tahun, bulan, judul,
                 relevan_visi, kerjasama_id, karya_mitra(institusi,tingkat),
                 karya_mahasiswa(peran)
     dana        baris DANA skor.html (penelitian/PkM terverifikasi)
     dosen       nama, peran, dtps, aktif, pendidikan, jabatan
     bukti       baris lkps_bukti (tabel, baris_id, judul, url, dokumen(url));
                 hanya terbaca admin
   Tiap fungsi mengembalikan
     { judul, tab, tabel, kolom: [[th, kunci]], baris: [{..., _bukti}],
       pakai, pembanding, labelPakai, catatan }
   ===================================================================== */

import { barisBkd } from './tautan-butir.js?v=2026-11-11-847016';

const angka = v => { const x = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(x) ? x : 0; };
const bulat = v => Math.trunc(angka(v));
// _ts_baris bangun.py: bulan >= 9 masuk TS berikutnya.
const tsBaris = (tahun, bulan) => { const t = bulat(tahun); return t ? (bulat(bulan) >= 9 ? t + 1 : t) : 0; };
// '2025/2026' -> 2026 (bangun.py: bagian terakhir setelah '/' atau '-').
const tsTA = ta => { const s = String(ta ?? '').trim(); if (!s) return 0; const x = parseInt(s.replace('-', '/').split('/').pop(), 10); return Number.isFinite(x) ? x : 0; };
const dalam = (t, a, b) => t >= a && t <= b;
const rapi = s => String(s ?? '').replace(/_/g, ' ');

// Tautan bukti satu baris: kolom tautan baris itu + lkps_bukti (tabel, baris_id).
export function buktiBaris(tabel, r, bukti = []){
  const xs = [];
  ['bukti_url', 'tautan_bukti', 'tautan', 'rps_url'].forEach(k => {
    const u = String(r?.[k] ?? '').trim(); if (/^https?:\/\//.test(u)) xs.push({ url: u, label: 'Bukti' });
  });
  (bukti || []).filter(b => b.tabel === tabel && String(b.baris_id) === String(r?.id)).forEach(b => {
    const u = (b.url || b.dokumen?.url || '').trim();
    if (u) xs.push({ url: u, label: b.judul || 'Bukti' });
  });
  const lihat = new Set();
  return xs.filter(x => !lihat.has(x.url) && lihat.add(x.url));
}
const pasang = (tabel, P) => r => ({ ...r, _bukti: buktiBaris(tabel, r, P.bukti) });

function jumlah(baris, kunci, a, b){
  return (baris || []).filter(r => dalam(r.tahun, a, b)).reduce((s, r) => s + kunci.reduce((t, k) => t + (r[k] || 0), 0), 0);
}

// Rumus masuk_dtps bangun.py: asesor tidak pernah; kolom dtps menentukan; tanpa nilai, aktif.
export function dosenDTPS(dosen){
  return (dosen || []).filter(d => String(d.peran || 'dosen').toLowerCase() !== 'asesor'
    && (d.dtps != null ? d.dtps === true || ['ya', 'y', 'true', '1'].includes(String(d.dtps).toLowerCase()) : d.aktif !== false));
}
const doktor = d => ['s3', 'doktor', 'dr', 'ph'].some(x => String(d.pendidikan || '').toLowerCase().includes(x));
const jabatanKey = d => String(d.jabatan || '').trim().toLowerCase().replace(/ /g, '_') || 'tanpa_jabatan';

// ---------------------------------------------------------------------
const MHS = 'lkps_mahasiswa_ta';
const barisMhs = (P, a, b, syarat = () => true) => (P.mhs || [])
  .map(r => ({ ...r, _ts: tsTA(r.tahun_akademik) })).filter(r => r._ts && dalam(r._ts, a, b) && syarat(r))
  .sort((x, y) => y._ts - x._ts).map(pasang(MHS, P));
const KOLOM_MHS = [['Tahun akademik', 'tahun_akademik'], ['Mahasiswa aktif', 'jumlah_mahasiswa_aktif'],
  ['Lulusan', 'jumlah_lulusan'], ['Rerata IPK', 'rerata_ipk_lulusan'], ['Mhs asing', 'jumlah_mahasiswa_asing']];
const akrTA = (D, TS) => ((D.akreditasi || {}).ta || []).filter(r => r.tahun_ts === TS);

const KOHORT = 'lkps_kohort_lulusan';
const PITA = ['lulus_3_5_sd_4_5', 'lulus_4_5_sd_5_5', 'lulus_5_5_sd_6_5', 'lulus_6_5_sd_8'];
const lulusKohort = r => PITA.reduce((a, k) => a + bulat(r[k]), 0);
const KOLOM_KOHORT = [['Angkatan', 'tahun_masuk'], ['Masuk', 'jumlah_masuk'], ['3,5–4,5 th', PITA[0]],
  ['4,5–5,5 th', PITA[1]], ['5,5–6,5 th', PITA[2]], ['6,5–8 th', PITA[3]], ['Lulus', '_lulus']];

const PETA_NLP = { paten: 'paten', paten_sederhana: 'paten', ttg: 'ttg', teknologi_tepat_guna: 'ttg', produk: 'ttg',
  buku_isbn: 'bc', buku: 'bc', book_chapter: 'bc', bab_buku: 'bc', hak_cipta: 'hki' };
const NAMA_NLP = { paten: 'NPaten ×3', ttg: 'NTTG ×2', bc: 'NBC ×2', hki: 'NHKI ×1', lainnya: 'tidak masuk rumus' };

const DEF = {
  // butir40/butir41 skor.html: baris mahasiswa_ta dengan tahun_ts === TS.
  '40': (P, TS, D) => ({ judul: 'Mahasiswa per TS', tab: 'mahasiswa', tabel: MHS, kolom: KOLOM_MHS.slice(0, 2),
    baris: barisMhs(P, TS, TS), pakai: barisMhs(P, TS, TS).length, pembanding: akrTA(D, TS).length, labelPakai: 'baris TS' }),
  '41': (P, TS, D) => ({ judul: 'Mahasiswa per TS', tab: 'mahasiswa', tabel: MHS, kolom: [KOLOM_MHS[0], KOLOM_MHS[1], KOLOM_MHS[4]],
    baris: barisMhs(P, TS, TS), pakai: barisMhs(P, TS, TS).length, pembanding: akrTA(D, TS).length, labelPakai: 'baris TS' }),
  // butir42: TS-2..TS dengan lulusan > 0.
  '42': (P, TS, D) => {
    const b = barisMhs(P, TS - 2, TS, r => bulat(r.jumlah_lulusan) > 0);
    return { judul: 'Mahasiswa per TS (lulusan dan IPK)', tab: 'mahasiswa', tabel: MHS,
      kolom: [KOLOM_MHS[0], KOLOM_MHS[2], KOLOM_MHS[3]], baris: b, pakai: b.length, labelPakai: 'TS berlulusan',
      pembanding: ((D.akreditasi || {}).ta || []).filter(r => dalam(r.tahun_ts, TS - 2, TS) && r.lulusan > 0).length };
  },
  // siapkanPrestasi: terverifikasi, TS-4..TS, bidang akademik*/non*.
  '43': (P, TS, D) => {
    const ok = r => /^(akademik|non)/.test(String(r.bidang || '').toLowerCase());
    const b = (P.prestasi || []).filter(r => r.status == null || r.status === 'terverifikasi')
      .map(r => ({ ...r, _ts: tsBaris(r.tahun, r.bulan) })).filter(r => dalam(r._ts, TS - 4, TS) && ok(r))
      .sort((x, y) => y._ts - x._ts || String(x.nama_kegiatan).localeCompare(String(y.nama_kegiatan)))
      .map(r => ({ ...r, _bidang: rapi(r.bidang), _tingkat: rapi(r.tingkat) })).map(pasang('lkps_prestasi_mahasiswa', P));
    const agg = (D.prestasi_agregat || []).filter(r => dalam(r.tahun_ts ?? r.tahun, TS - 4, TS) && ok(r));
    return { judul: 'Prestasi mahasiswa terverifikasi, 5 TS', tab: 'prestasi', tabel: 'lkps_prestasi_mahasiswa',
      kolom: [['Th', 'tahun'], ['Kegiatan', 'nama_kegiatan'], ['Bidang', '_bidang'], ['Tingkat', '_tingkat'], ['Capaian', 'capaian']],
      baris: b, pakai: b.length, labelPakai: 'prestasi', pembanding: agg.reduce((a, r) => a + (r.jumlah || 0), 0) };
  },
  // kohort6d + butir44: angkatan TS-8..TS-1 dengan lulusan; cadangan rerata_masa_studi TS-2..TS.
  '44': (P, TS, D) => {
    const k = (P.kohort || []).filter(r => dalam(bulat(r.tahun_masuk), TS - 8, TS - 1) && lulusKohort(r) > 0)
      .map(r => ({ ...r, _lulus: lulusKohort(r) })).sort((a, b) => b.tahun_masuk - a.tahun_masuk).map(pasang(KOHORT, P));
    const kD = ((D.akreditasi || {}).kohort || []).filter(r => dalam(r.tahun_masuk, TS - 8, TS - 1) && r.lulus > 0);
    if (k.length || kD.length) return { judul: 'Kohort lulusan', tab: 'kohort', tabel: KOHORT, kolom: KOLOM_KOHORT,
      baris: k, pakai: k.length, pembanding: kD.length, labelPakai: 'angkatan' };
    const b = barisMhs(P, TS - 2, TS, r => bulat(r.jumlah_lulusan) > 0 && angka(r.rerata_masa_studi_tahun) > 0);
    return { judul: 'Mahasiswa per TS (cadangan: rerata masa studi)', tab: 'mahasiswa', tabel: MHS,
      kolom: [KOLOM_MHS[0], KOLOM_MHS[2], ['Rerata masa studi', 'rerata_masa_studi_tahun']], baris: b, pakai: b.length, labelPakai: 'TS',
      pembanding: ((D.akreditasi || {}).ta || []).filter(r => dalam(r.tahun_ts, TS - 2, TS) && r.lulusan > 0 && r.rerata_masa_studi > 0).length };
  },
  // butir45: angkatan TS-4 (baris TS-3) dengan masuk > 0; cadangan persen_tepat_waktu TS-2..TS.
  '45': (P, TS, D) => {
    const k = (P.kohort || []).filter(r => bulat(r.tahun_masuk) === TS - 4 && bulat(r.jumlah_masuk) > 0)
      .map(r => ({ ...r, _lulus: lulusKohort(r) })).map(pasang(KOHORT, P));
    const kD = ((D.akreditasi || {}).kohort || []).filter(r => r.tahun_masuk === TS - 4 && r.masuk > 0);
    if (k.length || kD.length) return { judul: `Kohort lulusan angkatan ${TS - 4}`, tab: 'kohort', tabel: KOHORT,
      kolom: KOLOM_KOHORT.slice(0, 3), baris: k, pakai: k.length, pembanding: kD.length, labelPakai: 'angkatan' };
    const b = barisMhs(P, TS - 2, TS, r => bulat(r.jumlah_lulusan) > 0 && angka(r.persen_lulus_tepat_waktu) > 0);
    return { judul: 'Mahasiswa per TS (cadangan: persen tepat waktu)', tab: 'mahasiswa', tabel: MHS,
      kolom: [KOLOM_MHS[0], KOLOM_MHS[2], ['% tepat waktu', 'persen_lulus_tepat_waktu']], baris: b, pakai: b.length, labelPakai: 'TS',
      pembanding: ((D.akreditasi || {}).ta || []).filter(r => dalam(r.tahun_ts, TS - 2, TS) && r.lulusan > 0 && r.persen_tepat_waktu > 0).length };
  },
  // bangun.py akr_pub_mhs: publikasi dosen terverifikasi & relevan dengan mahasiswa penulis
  // pertama, + semua baris lkps_publikasi_mahasiswa; jendela TS-2..TS.
  '46': (P, TS, D) => {
    const dosen = (P.karya || []).filter(k => k.kategori === 'publikasi' && k.relevan_visi !== false
        && (k.karya_mahasiswa || []).some(m => m.peran === 'penulis_pertama'))
      .map(k => ({ tahun: k.tahun, _ts: tsBaris(k.tahun, k.bulan), judul: k.judul, _asal: 'Publikasi dosen (Input karya)',
        _karya: { kategori: 'publikasi', tahun: k.tahun, judul: k.judul } }));
    const mandiri = (P.pubMhs || []).map(r => ({ ...r, _ts: tsBaris(r.tahun, r.bulan), _asal: 'Publikasi mahasiswa (Data prodi)' }))
      .map(pasang('lkps_publikasi_mahasiswa', P));
    const b = [...dosen, ...mandiri].filter(r => dalam(r._ts, TS - 2, TS)).sort((x, y) => y._ts - x._ts);
    return { judul: 'Publikasi mahasiswa sebagai penulis pertama, 3 TS', tab: 'publikasi', tabel: 'lkps_publikasi_mahasiswa',
      kolom: [['Th', 'tahun'], ['Judul', 'judul'], ['Asal', '_asal']], baris: b, pakai: b.length, labelPakai: 'publikasi',
      pembanding: jumlah((D.akreditasi || {}).publikasi_mhs, ['na1', 'na2', 'na3', 'na4', 'nb1', 'nb2', 'nb3'], TS - 2, TS),
      catatan: 'Publikasi dosen hanya terhitung bila seorang mahasiswa berperan penulis pertama di Input karya.' };
  },
  // bangun.py mhs_luaran_pub: semua baris lkps_luaran_mahasiswa, jendela TS-2..TS.
  '47': (P, TS, D) => {
    const b = (P.luaranMhs || []).map(r => {
      const jn = String(r.jenis || '').trim().toLowerCase().replace(/ /g, '_');
      return { ...r, _ts: tsBaris(r.tahun, r.bulan), _jenis: rapi(jn), _komponen: NAMA_NLP[PETA_NLP[jn] || 'lainnya'] };
    }).filter(r => dalam(r._ts, TS - 2, TS)).sort((x, y) => y._ts - x._ts).map(pasang('lkps_luaran_mahasiswa', P));
    return { judul: 'Luaran mahasiswa, 3 TS', tab: 'luaran', tabel: 'lkps_luaran_mahasiswa',
      kolom: [['Th', 'tahun'], ['Judul', 'judul'], ['Jenis', '_jenis'], ['Komponen', '_komponen']], baris: b, pakai: b.length,
      labelPakai: 'luaran', pembanding: jumlah((D.akreditasi || {}).luaran_mhs, ['paten', 'ttg', 'bc', 'hki', 'lainnya'], TS - 2, TS) };
  },
  // butir52 / tkKepuasan: baris TS ini.
  '52': (P, TS, D) => {
    const b = (P.kepuasan || []).filter(r => /^\d{4}\/\d{4}$/.test(String(r.tahun_akademik || '').trim()) && tsTA(r.tahun_akademik) === TS)
      .map(r => ({ ...r, _aspek: rapi(r.aspek) })).map(pasang('lkps_kepuasan_pengguna', P));
    return { judul: `Kepuasan pengguna TS ${TS - 1}/${TS}`, tab: 'kepuasan', tabel: 'lkps_kepuasan_pengguna',
      kolom: [['Aspek', '_aspek'], ['Sangat baik %', 'sangat_baik'], ['Baik %', 'baik'], ['Cukup %', 'cukup'], ['Kurang %', 'kurang']],
      baris: b, pakai: b.length, labelPakai: 'aspek',
      pembanding: ((D.akreditasi || {}).kepuasan || []).filter(r => r.tahun_ts === TS).length };
  },
  // butir6 + bangun.py: lkps_kerjasama dihitung sekali per TS dalam rentang tahun_mulai..tahun_selesai
  // (kosong = sampai tahun depan); mitra karya terverifikasi dan relevan, kecuali mitra kerja sama induknya.
  '6': (P, TS, D) => {
    const b = [];
    const akhirKosong = new Date().getFullYear() + 1;
    (P.kerjasama || []).forEach(r => {
      const nm = String(r.mitra || '').trim(); const t0 = bulat(r.tahun_mulai);
      if (!nm || !t0) return;
      const t1 = bulat(r.tahun_selesai) || Math.max(t0, akhirKosong);
      if (t1 < t0) return;
      const n = [TS - 2, TS - 1, TS].filter(t => dalam(t, t0, t1)).length;
      if (n) b.push({ ...r, _bukti: buktiBaris('lkps_kerjasama', r, P.bukti), _nama: nm, _asal: `Data prodi (${rapi(r.jenis) || 'kerja sama'})`,
        _tingkat: rapi(r.tingkat) || 'tanpa tingkat', _berlaku: `${t0}–${bulat(r.tahun_selesai) || '…'}`, _n: n });
    });
    const induk = new Map((P.kerjasama || []).filter(r => r.id).map(r => [String(r.id), String(r.mitra || '').trim().toLowerCase()]));
    (P.karya || []).filter(k => k.relevan_visi !== false).forEach(k => {
      const ts = tsBaris(k.tahun, k.bulan); if (!dalam(ts, TS - 2, TS)) return;
      const ind = induk.get(String(k.kerjasama_id ?? ''));
      (k.karya_mitra || []).forEach(m => {
        const nm = String(m.institusi || '').trim();
        if (!nm || (ind && nm.toLowerCase() === ind)) return;
        b.push({ _nama: nm, _asal: `Karya ${rapi(k.kategori)}: ${k.judul}`, _tingkat: rapi(m.tingkat) || 'tanpa tingkat',
          _berlaku: String(ts), _n: 1, _karya: { kategori: k.kategori, tahun: k.tahun, judul: k.judul } });
      });
    });
    b.sort((x, y) => String(x._nama).localeCompare(String(y._nama)));
    return { judul: 'Mitra kerja sama, 3 TS', tab: 'kerjasama', tabel: 'lkps_kerjasama',
      kolom: [['Mitra', '_nama'], ['Tingkat', '_tingkat'], ['Berlaku / TS', '_berlaku'], ['Hitungan', '_n'], ['Asal', '_asal']],
      baris: b, pakai: b.reduce((a, r) => a + r._n, 0), labelPakai: 'hitungan mitra',
      pembanding: jumlah((D.akreditasi || {}).kerjasama, ['internasional', 'nasional', 'wilayah', 'tanpa_tingkat'], TS - 2, TS),
      catatan: 'Kerja sama Data prodi dihitung sekali untuk tiap TS dalam rentang berlakunya; mitra karya sekali pada TS karyanya.' };
  },
  // Butir 30: rbk_prodi (supabase/39) — BKD terverifikasi DTPS bukan asesor, TA = TS;
  // beban = SKS/2 per dosen. Pembanding: jumlah dosen dan RBK hasil rbk_prodi.
  '30': (P, TS) => {
    const { baris, rbk } = barisBkd(P.bkd, P.dosen, TS);
    const r = (P.rbk || []).find(x => x.tahun_akademik === `${TS - 1}/${TS}`);
    const sks = v => String(v).replace('.', ',');
    const b = baris.map(x => ({ ...x, _semester: x.semester.join(', ') + (x.lengkap ? '' : ' (belum dua semester)'),
      _sks: sks(x.sks), _beban: sks(x.beban), _lkd: x.berkas.map(f => ({ url: f.url, label: 'LKD ' + f.semester })) }));
    const beda = r && rbk != null && Math.abs(rbk - +r.rbk) >= 1e-3;
    return { judul: `BKD terverifikasi TS ${TS - 1}/${TS}`, tab: 'bkd', tabel: 'lkps_bkd',
      kolom: [['Dosen DTPS', 'nama'], ['Semester', '_semester'], ['SKS BKD', '_sks'], ['Beban (sks/2)', '_beban']],
      baris: b, pakai: b.length, labelPakai: 'dosen', pembanding: r ? r.n_dosen : null,
      periksa: beda ? `rata-rata daftar ${sks(rbk)} sks, RBK kartu ${sks(Math.round(+r.rbk * 10000) / 10000)} sks.` : '',
      catatan: rbk == null ? '' : `Rata-rata beban ${sks(rbk)} sks per semester (RBK).` };
  },
  // Butir 35 (bangun.py utama_pasang): publikasi terverifikasi & relevan yang teks
  // jenis/tingkat/indeksasinya memuat bereputasi/scopus/ieee/spie/wos, dosen
  // penulis pertama atau korespondensi; ditambah luaran paten (bagian 1), semua
  // dosennya. Hanya DTPS, TS-2..TS. Skor menghitung DOSEN unik.
  '35': (P, TS, D) => {
    const slug = n => String(n || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const dtps = new Set(dosenDTPS(P.dosen).map(d => slug(d.nama)));
    const b = [], lihat = new Set();
    const tambah = (k, nama, peran) => {
      const sg = slug(nama), ts = tsBaris(k.tahun, k.bulan);
      if (!dtps.has(sg) || !dalam(ts, TS - 2, TS) || lihat.has(sg + '|' + k.id)) return;
      lihat.add(sg + '|' + k.id);
      b.push({ _slug: sg, nama, tahun: k.tahun, _ts: ts, judul: k.judul, _peran: peran,
        _jenis: k.kategori === 'luaran' ? rapi(k.sub_jenis) : [k.jenis, k.indeksasi || k.tingkat].filter(Boolean).map(rapi).join(' · '),
        _karya: { kategori: k.kategori, tahun: k.tahun, judul: k.judul } });
    };
    (P.karya || []).filter(k => k.relevan_visi !== false).forEach(k => {
      const pen = (k.karya_penulis || []).filter(a => a.dosen?.nama);
      if (k.kategori === 'publikasi'){
        const teks = `${k.jenis || ''} ${k.tingkat || ''} ${k.indeksasi || ''}`.toLowerCase();
        if (!['bereputasi', 'scopus', 'ieee', 'spie', 'wos'].some(x => teks.includes(x))) return;
        pen.filter(a => a.peran === 'penulis_pertama' || a.korespondensi)
          .forEach(a => tambah(k, a.dosen.nama, a.peran === 'penulis_pertama' ? (a.korespondensi ? 'penulis pertama, korespondensi' : 'penulis pertama') : 'korespondensi'));
      } else if (k.kategori === 'luaran' && ['paten', 'paten_sederhana'].includes(String(k.sub_jenis || '').trim().toLowerCase())){
        pen.forEach(a => tambah(k, a.dosen.nama, 'pemegang paten'));
      }
    });
    b.sort((x, y) => String(x.nama).localeCompare(String(y.nama)) || y._ts - x._ts);
    const rinci = (D.dtps || {}).karya_utama_rinci;
    return { judul: 'Karya utama DTPS, 3 TS', tab: null, tabel: 'karya',
      kolom: [['Dosen', 'nama'], ['Th', 'tahun'], ['Karya', 'judul'], ['Terbitan / jenis', '_jenis'], ['Peran', '_peran']],
      baris: b, pakai: new Set(b.map(r => r._slug)).size, labelPakai: 'dosen dengan karya utama',
      pembanding: Array.isArray(rinci) ? new Set(rinci.filter(x => dalam(x.tahun, TS - 2, TS)).map(x => x.slug)).size : null,
      catatan: 'Satu dosen bisa punya beberapa karya; skor menghitung dosennya sekali.' };
  },
  // butirDanaKarya: DANA kategori itu, TS-2..TS (tanpa saringan relevan_visi, sama dengan skor).
  '10': (P, TS) => dana(P, TS, 'penelitian'),
  '11': (P, TS) => dana(P, TS, 'pkm'),
  // butir27/28: dosen DTPS (masuk_dtps bangun.py).
  '27': (P, TS, D) => dtpsBaris(P, D, 'Pendidikan', 'pendidikan', d => doktor(d) ? 'doktor' : ''),
  // butir26: NDTPS = jumlah DTPS (NDTT dari isian ndtt, bukan baris).
  '26': (P, TS, D) => ({ ...dtpsBaris(P, D, 'Jabatan', 'jabatan', d => rapi(d.pendidikan) || '—'),
    kolom: [['Dosen', 'nama'], ['Jabatan', '_isi'], ['Pendidikan', '_hitung']] }),
  '28': (P, TS, D) => dtpsBaris(P, D, 'Jabatan', 'jabatan',
    d => ['lektor', 'lektor_kepala', 'guru_besar'].includes(jabatanKey(d)) ? 'L/LK/GB' : ''),
};
// Tracer 49-51 (tracerJendela): tahun lulus TS-2..TS-1.
['49', '50', '51'].forEach(no => {
  DEF[no] = (P, TS, D) => {
    const b = (P.tracer || []).filter(r => dalam(bulat(r.tahun_lulus), TS - 2, TS - 1))
      .sort((a, b) => b.tahun_lulus - a.tahun_lulus).map(pasang('lkps_tracer_lulusan', P));
    const kolom = { '49': [['Rerata tunggu (bln)', 'rata_rata_waktu_tunggu_bulan'], ['<3 bln', 'wt_kurang_3'], ['3–18', 'wt_3_18'], ['>18', 'wt_lebih_18']],
      '50': [['Sesuai bidang', 'bekerja_sesuai_bidang'], ['Rendah', 'kesesuaian_rendah'], ['Sedang', 'kesesuaian_sedang'], ['Tinggi', 'kesesuaian_tinggi']],
      '51': [['Internasional', 'kerja_internasional'], ['Nasional', 'kerja_nasional'], ['Wilayah', 'kerja_wilayah']] }[no];
    return { judul: `Tracer study, lulusan ${TS - 2}–${TS - 1}`, tab: 'tracer', tabel: 'lkps_tracer_lulusan',
      kolom: [['Tahun lulus', 'tahun_lulus'], ['Lulusan', 'jumlah_lulusan'], ['Terlacak', 'jumlah_terlacak'], ...kolom],
      baris: b, pakai: b.length, labelPakai: 'tahun lulus',
      pembanding: (D.tracer || []).filter(t => dalam(t.tahun_lulus, TS - 2, TS - 1)).length };
  };
});

function dana(P, TS, kategori){
  const b = (P.dana || []).filter(r => r.kategori === kategori)
    .map(r => ({ ...r, _ts: +r.bulan >= 9 ? +r.tahun + 1 : +r.tahun })).filter(r => dalam(r._ts, TS - 2, TS))
    .sort((x, y) => y._ts - x._ts || String(x.judul).localeCompare(String(y.judul)))
    .map(r => ({ ...r, _dana: +r.besaran_dana > 0 ? 'Rp ' + (+r.besaran_dana).toLocaleString('id-ID') : 'belum diisi (0)',
      _karya: { kategori, tahun: r.tahun, judul: r.judul } }));
  return { judul: `${kategori === 'pkm' ? 'PkM' : 'Penelitian'} terverifikasi, 3 TS`, tab: null, tabel: 'karya',
    kolom: [['Th', 'tahun'], ['Judul', 'judul'], ['Dana', '_dana']], baris: b, pakai: b.length, pembanding: null, labelPakai: 'kegiatan' };
}
function dtpsBaris(P, D, th, kunci, tanda){
  const b = dosenDTPS(P.dosen).map(d => ({ ...d, _isi: rapi(d[kunci]) || '—', _hitung: tanda(d) }))
    .sort((x, y) => String(x.nama).localeCompare(String(y.nama)));
  return { judul: 'Dosen DTPS', tab: null, tabel: 'dosen', tanpaBukti: true, kolom: [['Dosen', 'nama'], [th, '_isi'], ['Terhitung', '_hitung']],
    baris: b, pakai: b.length, pembanding: (D.dtps || {}).jumlah ?? null, labelPakai: 'DTPS' };
}

// Butir manual: baris Data prodi terkait sebagai data pendukung. Skornya
// penilaian sendiri, jadi tidak ada penyaring rumus; semua baris ditampilkan.
const PENDUKUNG = {
  vmts: ['lkps_vmts', 'VMTS', [['Jenis', 'jenis'], ['Nomor SK', 'nomor_sk'], ['Visi', 'visi']]],
  mk: ['ref_mata_kuliah', 'Mata kuliah', [['Kode', 'kode'], ['Mata kuliah', 'nama'], ['Smt', 'semester']]],
  tema: ['ref_tema_peta_jalan', 'Peta jalan', [['Tema', 'nama'], ['Berlaku untuk', 'jenis'], ['Keterangan', 'keterangan']]],
  tendik: ['lkps_tendik', 'Tenaga kependidikan', [['Nama', 'nama'], ['Jabatan', 'jabatan'], ['Pendidikan', 'pendidikan'], ['Sertifikat', 'sertifikat']]],
  prasarana: ['lkps_prasarana', 'Prasarana & alat', [['Prasarana', 'prasarana'], ['Alat', 'alat'], ['Kondisi', 'kondisi']]],
  dok_k3l: ['lkps_dokumen_k3l', 'Dokumen K3L', [['Jenis dokumen', 'jenis_dokumen'], ['Jumlah', 'jumlah'], ['Pengesahan', 'riwayat_pengesahan']]],
  fas_k3l: ['lkps_fasilitas_k3l', 'Fasilitas K3L', [['Sarana', 'nama_sarana'], ['Fungsi', 'fungsi'], ['Unit', 'jumlah_unit'], ['Kondisi', 'kondisi']]],
  spmi: ['lkps_spmi_ppepp', 'SPMI (PPEPP)', [['Tahap', 'tahap'], ['Keterangan', 'keterangan']]],
  target: ['lkps_target_kinerja', 'Target IKU/IKT', [['Indikator', 'nama'], ['TS', 'tahun_ts'], ['Target', 'target'], ['Capaian', 'capaian']]],
  kerjasama: ['lkps_kerjasama', 'Kerja sama aktif, 3 TS', [['Mitra', 'mitra'], ['Jenis', 'jenis'], ['Tingkat', 'tingkat'], ['Mulai', 'tahun_mulai'], ['Selesai', 'tahun_selesai'], ['Kegiatan', 'kegiatan']]],
  dana: ['lkps_penggunaan_dana', 'Penggunaan dana, 3 TS', [['Tahun akademik', 'tahun_akademik'], ['Jenis', 'jenis'], ['UPPS (Rp)', 'dana_upps'], ['Program studi (Rp)', 'dana_ps']]],
  tracer: ['lkps_tracer_lulusan', 'Tracer study, lulusan TS-2 s.d. TS-1', [['Tahun lulus', 'tahun_lulus'], ['Lulusan', 'jumlah_lulusan'], ['Terlacak', 'jumlah_terlacak']]],
};
// Penyaring jendela untuk data pendukung bertahun (sama dengan butir berumus terkait).
const aktif3 = (r, no, TS) => { const t0 = bulat(r.tahun_mulai); if (!t0) return false;
  const t1 = bulat(r.tahun_selesai) || Math.max(t0, new Date().getFullYear() + 1);
  return [TS - 2, TS - 1, TS].some(t => dalam(t, t0, t1)); };
const ta3 = (r, no, TS) => dalam(tsTA(r.tahun_akademik), TS - 2, TS);
// butir -> [tab, saring baris]. Butir 15 hanya MK ber-RPS, 19 MK basic science, 20 MK capstone,
// 22/24 tema penelitian/PkM, 54/56 indikator yang menunjuk butir itu.
const SUMBER_MANUAL = {
  '1': [['vmts']], '2': [['vmts']], '3': [['vmts']],
  '15': [['mk', r => r.rps_ada || r.rps_url]], '19': [['mk', r => r.basic_science]], '20': [['mk', r => r.capstone]],
  '22': [['tema', r => ['penelitian', 'keduanya'].includes(r.jenis)]],
  '24': [['tema', r => ['pkm', 'keduanya'].includes(r.jenis)]],
  '29': [['tendik']], '38': [['prasarana']], '39': [['dok_k3l'], ['fas_k3l']],
  '53': [['spmi']], '55': [['spmi']], '54': [['target', (r, no) => String(r.butir) === no]], '56': [['target', (r, no) => String(r.butir) === no]],
  // Pemilik 2026-11-07: semua butir masuk rincian; data pendukung bila ada tabelnya.
  '7': [['kerjasama', aktif3]], '8': [['dana', ta3]], '9': [['dana', ta3]], '10': [['dana', ta3]], '11': [['dana', ta3]],
  '48': [['tracer', (r, no, TS) => dalam(bulat(r.tahun_lulus), TS - 2, TS - 1)]],
  '17': [],
};

export function pendukungButir(no, P, TS, D = {}){
  const src = SUMBER_MANUAL[String(no)];
  if (!src) return [];
  const xs = src.map(([tab, saring]) => {
    const [tabel, judul, kolom] = PENDUKUNG[tab];
    const baris = (P.pendukung?.[tabel] || []).filter(r => r.aktif !== false && (!saring || saring(r, String(no), TS)))
      .map(pasang(tabel, P));
    return { judul, tab, tabel, kolom, baris, pakai: baris.length, pembanding: null, labelPakai: 'baris', pendukung: true };
  });
  // Butir 17: kegiatan integrasi terverifikasi, jendela sama dengan konteks kartu
  // (butir-manual.js: D.integrasi, tahun TS-2..TS; tahun = TS, bangun.py).
  if (String(no) === '17'){
    const baris = (D.integrasi || []).filter(r => dalam(r.tahun_ts ?? r.tahun, TS - 2, TS))
      .sort((a, b) => (b.tahun_ts ?? b.tahun) - (a.tahun_ts ?? a.tahun))
      .map(r => ({ ...r, _bentuk: rapi(r.bentuk), _karya: { kategori: 'integrasi', tahun: r.tahun, judul: r.judul_kegiatan } }));
    xs.push({ judul: 'Integrasi MK terverifikasi, 3 TS', tab: null, tabel: 'karya', baris, pakai: baris.length, pembanding: null,
      labelPakai: 'kegiatan', pendukung: true,
      kolom: [['Th', 'tahun'], ['Mata kuliah', 'mata_kuliah'], ['Kegiatan', 'judul_kegiatan'], ['Bentuk', '_bentuk'], ['Dosen', 'dosen']] });
  }
  return xs;
}
export const TABEL_PENDUKUNG = [...new Set(Object.values(PENDUKUNG).map(x => x[0]))];

export function dataButir(no, P, TS, D){
  const f = DEF[String(no)];
  return f ? f(P || {}, TS, D || {}) : null;
}
export const BUTIR_DATA_BARIS = Object.keys(DEF);

// ---------------------------------------------------------------------
//  Pemuat baris sumber (dipakai skor.html dan rincian.html). Tabel yang
//  belum ada atau tidak boleh dibaca cukup kosong; kartu lalu menampilkan
//  PERIKSA atau catatan. RLS: lkps_bukti hanya admin.
// ---------------------------------------------------------------------
const semua = async (sb, t, q = x => x) => { const { data, error } = await q(sb.from(t).select('*'));
  if (error) console.warn(t, error.message); return data || []; };

// Butir 6 dan 46: karya terverifikasi dengan mitra dan peran mahasiswa.
// Tanpa kolom patch 10/24 (relevan_visi, kerjasama_id) kueri diulang tanpa keduanya.
async function ambilKarya(sb){
  const q = kol => sb.from('karya').select(kol).eq('status', 'terverifikasi').limit(5000);
  // jenis..karya_penulis: butir 35 (karya utama).
  const UTAMA = ',jenis,tingkat,indeksasi,sub_jenis,karya_penulis(peran,korespondensi,dosen(nama))';
  for (const kol of ['id,kategori,tahun,bulan,judul,relevan_visi,kerjasama_id,karya_mitra(institusi,tingkat),karya_mahasiswa(peran)' + UTAMA,
                     'id,kategori,tahun,bulan,judul,karya_mitra(institusi,tingkat),karya_mahasiswa(peran)' + UTAMA]){
    const { data, error } = await q(kol);
    if (!error) return data || [];
    console.warn('karya', error.message);
  }
  return [];
}
async function ambilBukti(sb){
  const q = kol => sb.from('lkps_bukti').select(kol);
  const { data, error } = await q('tabel,baris_id,judul,url,dokumen(url)');
  return error ? ((await q('tabel,baris_id,judul,url')).data || []) : (data || []);
}

// Cukup untuk butir 6 (rincian.html).
export async function ambilDataKerjasama(sb){
  const [kerjasama, karya, bukti] = await Promise.all([semua(sb, 'lkps_kerjasama'), ambilKarya(sb), ambilBukti(sb)]);
  return { kerjasama, karya, bukti };
}

// Semua butir (skor.html). dana: baris DANA yang sudah dimuat skor.html.
export async function ambilDataButir(sb, { dana = [] } = {}){
  const rbk = async () => { const { data, error } = await sb.rpc('rbk_prodi'); if (error) console.warn('rbk_prodi', error.message); return data || []; };
  const [ks, mhs, kohort, tracer, kepuasan, prestasi, pubMhs, luaranMhs, dosen, bkd, rb, ...pend] = await Promise.all([
    ambilDataKerjasama(sb), semua(sb, 'lkps_mahasiswa_ta'), semua(sb, 'lkps_kohort_lulusan'), semua(sb, 'lkps_tracer_lulusan'),
    semua(sb, 'lkps_kepuasan_pengguna'), semua(sb, 'lkps_prestasi_mahasiswa', q => q.eq('status', 'terverifikasi')),
    semua(sb, 'lkps_publikasi_mahasiswa'), semua(sb, 'lkps_luaran_mahasiswa'), semua(sb, 'dosen'),
    // RLS lkps_bkd: admin semua baris, dosen hanya miliknya.
    semua(sb, 'lkps_bkd', q => q.eq('verifikasi', 'terverifikasi')), rbk(),
    ...TABEL_PENDUKUNG.map(t => semua(sb, t))]);
  return { ...ks, mhs, kohort, tracer, kepuasan, prestasi, pubMhs, luaranMhs, dana, bkd, rbk: rb,
    dosen: dosen.map(d => ({ nama: d.nama, nidn: d.nidn, peran: d.peran, dtps: d.dtps, aktif: d.aktif, pendidikan: d.pendidikan, jabatan: d.jabatan })),
    pendukung: Object.fromEntries(TABEL_PENDUKUNG.map((t, i) => [t, pend[i]])) };
}

// Semua butir yang punya daftar data di modul ini (rincian.html melengkapinya
// dengan butir karya di rincian.js).
export const BUTIR_RINCIAN_DATA = [...new Set([...Object.keys(DEF), ...Object.keys(SUMBER_MANUAL)])];

// Tabel satu blok data + pemeriksaan + catatan; dipakai skor.html (kartu) dan
// rincian.html (halaman penuh) supaya keduanya tampil sama. k: nama kelas CSS
// halaman pemanggil; buktiKarya(r._karya) mengembalikan tautan bukti karya.
export function htmlTabelData(x, { esc, buktiKarya = () => [], admin = false, ts = null, k = {} }){
  const K = { tabel: 'rinci-t', cek: 'rinci-cek', bukti: 'bukti-sel', kosong: 'isian', ...k };
  const pendek = v => { const t = String(v ?? ''); return t.length > 140 ? t.slice(0, 137) + '…' : t; };
  const sel = v => v === true ? 'ya' : v === false ? 'tidak' : v == null || v === '' ? '—' : esc(pendek(v));
  const tautan = r => r._bukti || (r._karya ? buktiKarya(r._karya) : []);
  const isiBukti = r => {
    const a = tautan(r).map(b => `<a class="${K.bukti}" href="${esc(b.url)}" target="_blank" rel="noopener nofollow">${esc(pendek(b.label || 'Bukti'))}</a>`);
    const l = (r._lkd || []).map(b => `<button type="button" class="btn-lkd" data-lkd="${esc(b.url)}">${esc(b.label)}</button>`);
    return a.length || l.length ? [...a, ...l].join(' ') : `<span class="${K.kosong}">tanpa bukti</span>`;
  };
  const adaBukti = r => tautan(r).length || (r._lkd || []).length;
  const kolB = !x.tanpaBukti;
  const tabel = x.baris.length ? `<div class="gulir"><table class="${K.tabel}"><thead><tr>${x.kolom.map(([th]) => `<th>${esc(th)}</th>`).join('')}${kolB ? '<th>Bukti</th>' : ''}</tr></thead>
    <tbody>${x.baris.map(r => `<tr>${x.kolom.map(([, c]) => `<td>${sel(r[c])}</td>`).join('')}${kolB ? `<td>${isiBukti(r)}</td>` : ''}</tr>`).join('')}</tbody></table></div>`
    : `<p class="${K.kosong}">Belum ada baris yang memenuhi syarat${ts ? ` untuk TS ${ts - 1}/${ts}` : ''}${admin ? '' : ' (atau belum dapat Anda baca)'}.</p>`;
  let cek = '';
  if (!x.pendukung && x.pembanding != null){
    cek = x.pakai === x.pembanding && !x.periksa
      ? `<div class="${K.cek}">${x.pakai} ${esc(x.labelPakai)}, sama dengan angka yang dipakai kartu.</div>`
      : `<div class="${K.cek} beda">PERIKSA: daftar ${x.pakai} ${esc(x.labelPakai)}, angka kartu ${x.pembanding}${x.periksa ? '; ' + esc(x.periksa) : '.'} `
        + (admin ? 'Data situs dibangun tiap jam; isian yang baru saja diubah baru masuk kartu setelah pembangunan berikutnya.'
                 : 'Sebagian baris mungkin hanya dapat dibaca admin.') + `</div>`;
  }
  const ctt = x.catatan ? `<div class="${K.cek}">${esc(x.catatan)}</div>` : '';
  const ringkas = `${x.baris.length} baris${x.baris.length && kolB ? ` · bukti ${x.baris.filter(adaBukti).length}/${x.baris.length}` : ''}`;
  return { tabel, cek, ctt, ringkas };
}
