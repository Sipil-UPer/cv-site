import { KELOMPOK, URUT_KELOMPOK, ampuPerTA, statusTS, hitungTS } from './dosen-hitung.js?v=2026-11-28-c36d24';
// Penyusunan kelas per semester (136-patch-penyusunan-kelas.sql, pemilik 2026-11-21): logika murni halaman kelas.html,
// dites di Node (tests/js/kelas.test.mjs). Satu MK boleh beberapa kelas; team teaching = satu koordinator kelas + anggota.
// CSV (impor/ekspor, untuk optimasi jadwal di luar situs): pemisah ';', dosen dipisah '|' (NIDN atau email; pertama =
// koordinator). Ekspor menulis kolom koordinator + anggota; impor menerima kolom 'dosen' atau koordinator + anggota.

/** MK yang dibuka pada semester itu: MK aktif kurikulum kur, semester ganjil untuk Ganjil / genap untuk Genap; MK pilihan
 *  (atau tanpa semester) selalu ikut, ditandai pilihan. Urut semester lalu kode. */
export function mkDitawarkan(mk = [], kur, semester){
  const paritas = semester === 'Ganjil' ? 1 : 0;
  return mk.filter(m => m.kurikulum === kur && m.aktif !== false
      && (m.sifat === 'pilihan' || !m.semester || +m.semester % 2 === paritas))
    .map(m => ({ ...m, pilihan: m.sifat === 'pilihan' || !m.semester }))
    .sort((a, b) => (a.pilihan - b.pilihan) || (+a.semester || 99) - (+b.semester || 99) || String(a.kode).localeCompare(String(b.kode)));
}

/** Nama kelas berikutnya: A, B, ..., Z, lalu A2, B2, ... (yang belum dipakai, tanpa beda huruf besar). */
export function kelasBerikut(ada = []){
  const pakai = new Set(ada.map(k => String(k).trim().toUpperCase()));
  for (let n = 1; n < 10; n++) for (let i = 0; i < 26; i++) {
    const k = String.fromCharCode(65 + i) + (n > 1 ? n : '');
    if (!pakai.has(k)) return k;
  }
  return '';
}

/**
 * Usulan kelas A untuk MK yang belum punya kelas; dosen dari pengampu MK (Data prodi), pengampu pertama = koordinator.
 * dosen = [{ id, nidn }]. Hasil { baris: [{ kurikulum, kode_mk, kelas, dosen: [{dosen_id, peran}] }], tanpaPengampu: [kode] }.
 * MKU (unit_penyelenggara universitas) dan MK fakultas tanpa pengampu prodi tetap dibuat, tanpa dosen (151, pemilik 2026-11-22):
 * jadwalnya ditetapkan universitas/fakultas dan dosennya dari luar prodi.
 * Pemilik 2026-11-28: koordinator prodi MK universitas/fakultas TIDAK wajib mengajar (hanya mengkoordinasi RPS dan silabus), jadi
 * usulan kelas MK itu selalu tanpa dosen; siapa yang mengajar dan berapa pertemuan diisi di Penyusunan kelas.
 */
export const tanpaDosenBoleh = m => ['universitas', 'fakultas'].includes(m?.unit_penyelenggara);
export function usulanKelasAwal(mk = [], kelasAda = [], dosen = []){
  const ada = new Set(kelasAda.map(k => `${k.kurikulum}|${k.kode_mk}`));
  const perNidn = new Map(dosen.filter(d => d.nidn).map(d => [String(d.nidn), d.id]));
  const baris = [], tanpaPengampu = [];
  for (const m of mk) {
    if (ada.has(`${m.kurikulum}|${m.kode}`)) continue;
    const ids = tanpaDosenBoleh(m) ? [] : [...new Set((m.pengampu || []).map(String).map(n => perNidn.get(n)).filter(Boolean))];
    if (!ids.length && !tanpaDosenBoleh(m)) { tanpaPengampu.push(m.kode); continue; }
    baris.push({ kurikulum: m.kurikulum, kode_mk: m.kode, kelas: 'A', dosen: ids.map((id, i) => ({ dosen_id: id, peran: i ? 'anggota' : 'koordinator' })) });
  }
  return { baris, tanpaPengampu };
}

const bersih = v => String(v ?? '').replace(/;/g, ',').replace(/[\r\n]+/g, ' ').trim();

/**
 * CSV ekspor satu periode. kelas = baris kelas_kuliah; kd = baris kelas_dosen; mk = ref_mata_kuliah; dosen = [{id, nidn, email, nama}].
 * Kolom: tahun_akademik;semester;kurikulum;kode_mk;nama_mk;sks;semester_paket;sifat;kelas;kapasitas;angkatan;koordinator;anggota;
 * nama_dosen;pertemuan;catatan. koordinator/anggota = NIDN (email bila NIDN kosong); pertemuan sejajar urutan dosen.
 */
export function csvKelas(kelas = [], kd = [], mk = [], dosen = []){
  const D = new Map(dosen.map(d => [d.id, d])), id = d => d ? (d.nidn || d.email || '') : '';
  const M = new Map(mk.map(m => [`${m.kurikulum}|${m.kode}`, m]));
  const kepala = ['tahun_akademik', 'semester', 'kurikulum', 'kode_mk', 'nama_mk', 'sks', 'semester_paket', 'sifat', 'kelas', 'kapasitas',
    'angkatan', 'koordinator', 'anggota', 'nama_dosen', 'pertemuan', 'catatan'];
  const urut = [...kelas].sort((a, b) => `${a.kurikulum}|${a.kode_mk}|${a.kelas}`.localeCompare(`${b.kurikulum}|${b.kode_mk}|${b.kelas}`));
  const baris = urut.map(k => {
    const m = M.get(`${k.kurikulum}|${k.kode_mk}`) || {};
    const ds = kd.filter(x => x.kelas_id === k.id).sort((a, b) => (a.peran === 'koordinator' ? -1 : 0) - (b.peran === 'koordinator' ? -1 : 0) || a.urutan - b.urutan);
    const koor = ds.find(x => x.peran === 'koordinator'), ang = ds.filter(x => x !== koor);
    return [k.tahun_akademik, k.semester, k.kurikulum, k.kode_mk, m.nama, m.sks, m.semester, m.sifat, k.kelas, k.kapasitas, k.angkatan,
      id(D.get(koor?.dosen_id)), ang.map(x => id(D.get(x.dosen_id))).join('|'), ds.map(x => D.get(x.dosen_id)?.nama || '?').join('|'),
      ds.map(x => x.pertemuan ?? '').join('|'), k.catatan].map(bersih);
  });
  return [kepala, ...baris].map(r => r.join(';')).join('\r\n');
}

/**
 * Baca CSV impor. Wajib kolom kode_mk, kelas, dan dosen (atau koordinator [+ anggota]); opsional kurikulum (bawaan
 * kurikulumBawaan), kapasitas, angkatan, catatan. mk = ref_mata_kuliah untuk memeriksa MK. Hasil { baris: [{kurikulum,
 * kode_mk, kelas, kapasitas, angkatan, catatan, dosen: ['NIDN/email', ...]}], galat: ['Baris n: ...'] }.
 */
export function bacaCsvKelas(isi, { mk = [], kurikulumBawaan = '' } = {}){
  const garis = String(isi || '').replace(/^﻿/, '').split(/\r?\n/).filter(g => g.trim());
  if (!garis.length) return { baris: [], galat: ['Berkas kosong.'] };
  const pisah = garis[0].includes(';') ? ';' : ',';
  const sel = g => g.split(pisah).map(s => s.trim().replace(/^"|"$/g, ''));
  const kep = sel(garis[0]).map(s => s.toLowerCase()), i = k => kep.indexOf(k);
  const iDosen = i('dosen'), iKoor = i('koordinator'), iAng = i('anggota');
  if (i('kode_mk') < 0 || i('kelas') < 0 || (iDosen < 0 && iKoor < 0))
    return { baris: [], galat: ['Kolom kode_mk, kelas, dan dosen (atau koordinator) wajib ada.'] };
  const ada = new Set(mk.map(m => `${m.kurikulum}|${m.kode}`)), sudah = new Set(), baris = [], galat = [];
  garis.slice(1).forEach((g, n) => {
    const c = sel(g), v = k => (i(k) >= 0 ? c[i(k)] || '' : '').trim(), no = `Baris ${n + 2}`;
    const kur = (v('kurikulum') || kurikulumBawaan).toUpperCase(), kode = v('kode_mk'), kelas = v('kelas');
    if (!kode && !kelas) return;
    if (!kur) return galat.push(`${no}: kurikulum kosong.`);
    if (!ada.has(`${kur}|${kode}`)) return galat.push(`${no}: MK ${kode} tidak ada di ${kur}.`);
    if (!/^[A-Za-z0-9._ -]{1,10}$/.test(kelas)) return galat.push(`${no}: nama kelas "${kelas}" tidak sah (1–10 huruf/angka).`);
    const pecah = s => String(s || '').split('|').map(x => x.trim()).filter(Boolean);
    const dosen = [...new Set(iDosen >= 0 ? pecah(c[iDosen]) : [...pecah(c[iKoor]), ...pecah(iAng >= 0 ? c[iAng] : '')])];
    if (!dosen.length && !tanpaDosenBoleh(mk.find(m => m.kurikulum === kur && m.kode === kode))) return galat.push(`${no}: dosen kosong.`);
    const k = `${kur}|${kode}|${kelas.toUpperCase()}`;
    if (sudah.has(k)) return galat.push(`${no}: kelas ${kode} ${kelas} ganda di berkas.`);
    sudah.add(k);
    const kap = v('kapasitas');
    if (kap && !(+kap >= 1 && +kap <= 500 && Number.isInteger(+kap))) return galat.push(`${no}: kapasitas 1–500.`);
    baris.push({ kurikulum: kur, kode_mk: kode, kelas, kapasitas: kap ? +kap : null, angkatan: v('angkatan') || null, catatan: v('catatan') || null, dosen });
  });
  return { baris, galat };
}

// ---------- Rekap beban per dosen (pemilik 2026-11-21, usulan nomor 3) ----------
/**
 * Beban satu periode. kelas/kd/mk seperti di atas (semua kurikulum); dosen = [{id, nama, peran}]; bimbingan = baris
 * beban_bimbingan(TS) (109; per tahun akademik). sks mengajar = sks MK x porsi dosen di kelas itu: menurut pertemuan bila
 * semua dosen kelas itu mengisi pertemuan, selain itu dibagi rata. Tidak ada batas atau konversi bimbingan ke sks
 * (kebijakan, belum diputuskan). Dosen peran 'dosen' tetap tampil walau tanpa beban. Urut sks terbesar.
 * -> { baris: [{ dosen_id, nama, kelas, mk: [kode], sks, sks_penuh, tim, kp, ta, uji, lomba }], ringkas: { n, rata, min, max } }
 */
export function rekapBeban({ kelas = [], kd = [], mk = [], dosen = [], bimbingan = [] } = {}){
  const M = new Map(mk.map(m => [`${m.kurikulum}|${m.kode}`, m])), per = new Map();
  const baris = id => {
    if (!per.has(id)) per.set(id, { dosen_id: id, nama: dosen.find(d => d.id === id)?.nama || '?', kelas: 0, mk: new Set(), sks: 0, sks_penuh: 0,
      tim: 0, kp: 0, ta: 0, uji: 0, lomba: 0 });
    return per.get(id);
  };
  for (const k of kelas) {
    const ds = kd.filter(x => x.kelas_id === k.id);
    if (!ds.length) continue;
    const sks = +(M.get(`${k.kurikulum}|${k.kode_mk}`)?.sks) || 0;
    const semuaPert = ds.every(x => +x.pertemuan > 0), total = ds.reduce((a, x) => a + (+x.pertemuan || 0), 0);
    for (const x of ds) {
      const b = baris(x.dosen_id), porsi = semuaPert && total ? +x.pertemuan / total : 1 / ds.length;
      b.kelas++; b.mk.add(k.kode_mk); b.sks += sks * porsi; b.sks_penuh += sks; if (ds.length > 1) b.tim++;
    }
  }
  for (const r of bimbingan) {
    if (!r.dosen_id) continue;
    const b = baris(r.dosen_id);
    if (b.nama === '?' && r.nama) b.nama = r.nama;
    for (const k of ['kp', 'ta', 'uji', 'lomba']) b[k] = +r[k] || 0;
  }
  for (const d of dosen) if (d.peran === 'dosen') baris(d.id);
  const out = [...per.values()].map(b => ({ ...b, mk: [...b.mk].sort(), sks: Math.round(b.sks * 100) / 100 }))
    .sort((a, b) => b.sks - a.sks || b.kelas - a.kelas || a.nama.localeCompare(b.nama));
  const xs = out.map(b => b.sks);
  return { baris: out, ringkas: { n: out.length, rata: xs.length ? Math.round(xs.reduce((a, x) => a + x, 0) / xs.length * 100) / 100 : 0,
    min: xs.length ? Math.min(...xs) : 0, max: xs.length ? Math.max(...xs) : 0 } };
}

/** CSV rekap beban (pemisah ';'). */
export function csvBeban(rekap, { ta = '', semester = '', ts = '' } = {}){
  const k = ['tahun_akademik', 'semester', 'dosen', 'kelas', 'mk', 'sks_mengajar', 'sks_penuh', 'kelas_team_teaching', `kp_ts${ts}`, `ta_ts${ts}`,
    `menguji_ts${ts}`, `lomba_ts${ts}`];
  return [k, ...rekap.baris.map(b => [ta, semester, b.nama, b.kelas, b.mk.join('|'), String(b.sks).replace('.', ','), b.sks_penuh, b.tim, b.kp, b.ta, b.uji, b.lomba])]
    .map(r => r.map(v => String(v ?? '').replace(/;/g, ',')).join(';')).join('\r\n');
}

// ---------- Dosen luar DTPS ditulis manual + draf SK pengajaran (208, pemilik 2026-11-28) ----------
// Dosen luar DTPS tetap baris dosen (DT prodi lain / DTT / industri) supaya dihitung NDT/NDTT dan disebut di SK.
export const KELOMPOK_LUAR = { dt: 'Dosen tetap prodi lain (DT)', dtt: 'Dosen tidak tetap (DTT)', industri: 'Dosen industri/praktisi (dihitung DTT)' };
const GOLONGAN = [['dtps', 'DTPS'], ['dt', 'Dosen tetap prodi lain (DT)'], ['dtt', 'Dosen tidak tetap (DTT)'], ['industri', 'Dosen industri/praktisi'], ['lain', 'Lainnya']];
/** Golongan untuk daftar pilihan dosen kelas: dtps | dt | dtt | industri | lain (sama dengan kolom dtps/kategori di Kelola dosen). */
export function golonganDosen(d = {}){
  const ya = v => v === true || String(v ?? '').toLowerCase() === 'true';
  if (ya(d.dtps) || String(d.tugas_belajar || '').trim()) return 'dtps';
  return { tetap: 'dt', tidak_tetap: 'dtt', industri: 'industri' }[d.kategori] || 'lain';
}
/** Label singkat golongan bukan DTPS untuk penanda di daftar kelas ('' untuk DTPS dan lainnya). */
export const tandaGolongan = d => ({ dt: 'DT', dtt: 'DTT', industri: 'Industri' }[golonganDosen(d)] || '');
/** Kelompok pilihan [[label, [dosen...]]] urut DTPS, DT, DTT, industri, lainnya; golongan kosong dilewati. */
export const kelompokPilihan = (dosen = []) => GOLONGAN.map(([g, l]) => [l, dosen.filter(d => golonganDosen(d) === g)]).filter(([, xs]) => xs.length);
/** NIDN sementara dari dosen_luar_tambah (208) yang perlu dilengkapi admin. */
export const nidnSementara = n => /^LUAR-/i.test(String(n || ''));

// Inti nama untuk mencari nama yang sama tanpa gelar: buang bagian sesudah koma pertama dan gelar depan.
const GELAR_DEPAN = new Set(['prof', 'dr', 'ir', 'drs', 'dra', 'h', 'hj']);
export function intiNama(n){
  const kata = String(n || '').split(',')[0].toLowerCase().replace(/[^a-z\s.]/g, ' ').split(/[\s.]+/).filter(Boolean);
  while (kata.length > 1 && GELAR_DEPAN.has(kata[0])) kata.shift();
  return kata.join(' ');
}
/**
 * Periksa isian dosen luar sebelum dikirim. isi = { nama, kelompok, nidn?, pendidikan? }; dosen = daftar terdaftar.
 * -> { galat } atau { isi (rapi), mirip: [nama terdaftar yang inti namanya sama] }.
 */
export function cekDosenLuar(isi = {}, dosen = []){
  const nama = String(isi.nama || '').replace(/\s+/g, ' ').trim(), nidn = String(isi.nidn || '').trim();
  if (nama.length < 3 || nama.length > 120) return { galat: 'Tulis nama dosen (3–120 huruf).' };
  if (!KELOMPOK_LUAR[isi.kelompok]) return { galat: 'Pilih kelompok dosen.' };
  if (nidn && !/^[A-Za-z0-9.-]{4,30}$/.test(nidn)) return { galat: 'NIDN/NIDK: 4–30 huruf, angka, titik, atau strip.' };
  if (isi.pendidikan && !['S2', 'S3'].includes(isi.pendidikan)) return { galat: 'Pendidikan: S2 atau S3.' };
  const ada = nidn && dosen.find(d => String(d.nidn || '').toLowerCase() === nidn.toLowerCase());
  if (ada) return { galat: `NIDN ${nidn} sudah terdaftar atas nama ${ada.nama_gelar || ada.nama}; pilih dari daftar.` };
  const inti = intiNama(nama);
  const mirip = dosen.filter(d => [d.nama, d.nama_gelar].some(x => x && intiNama(x) === inti)).map(d => d.nama_gelar || d.nama);
  return { isi: { nama, kelompok: isi.kelompok, nidn: nidn || null, pendidikan: isi.pendidikan || null }, mirip };
}

/**
 * Draf SK pengajaran satu semester dari Penyusunan kelas (untuk surat.html?kelas=TA|Semester). Satu butir per dosen, berisi
 * kelas yang diampunya; dosen luar DTPS ikut. kelas/kd/mk/dosen seperti csvKelas. -> isi formulir surat
 * { jenis, kategori, tahun_akademik, semester, perihal, isi, dosen_ids } + { nDosen, nKelas, tanpaDosen: ['KODE A'] }.
 */
export function drafSkPengajaran({ ta, semester, kelas = [], kd = [], mk = [], dosen = [] } = {}){
  const M = new Map(mk.map(m => [`${m.kurikulum}|${m.kode}`, m])), D = new Map(dosen.map(d => [d.id, d]));
  const per = new Map(), tanpaDosen = [];
  const urut = [...kelas].sort((a, b) => `${a.kode_mk}|${a.kelas}`.localeCompare(`${b.kode_mk}|${b.kelas}`, 'id', { numeric: true }));
  for (const k of urut) {
    const ds = kd.filter(x => x.kelas_id === k.id);
    if (!ds.length) { tanpaDosen.push(`${k.kode_mk} ${k.kelas}`); continue; }
    const m = M.get(`${k.kurikulum}|${k.kode_mk}`) || {};
    for (const x of ds) {
      if (!per.has(x.dosen_id)) per.set(x.dosen_id, []);
      const ket = ds.length > 1 ? ['Team teaching', x.peran === 'koordinator' ? 'koordinator kelas' : '', x.pertemuan ? `${x.pertemuan} pertemuan` : '']
        .filter(Boolean).join(', ') : '';
      per.get(x.dosen_id).push({ kode_mk: k.kode_mk, mk: m.nama || '', kelas: k.kelas, sks: m.sks ?? null, ket });
    }
  }
  const nm = id => { const d = D.get(id); return d ? (d.nama_gelar || d.nama) : '?'; };
  const nmUrut = id => D.get(id)?.nama || nm(id);   // urut nama tanpa gelar depan (Dr., Ir.)
  const ids = [...per.keys()].sort((a, b) => nmUrut(a).localeCompare(nmUrut(b), 'id'));
  const periode = `Semester ${semester} Tahun Akademik ${ta}`;
  // 209: lampiran terstruktur (surat.rincian), dibekukan ke surat.sah saat disahkan; Word menulisnya sebagai tabel lampiran.
  const rincian = ids.flatMap(id => {
    const d = D.get(id) || {};
    return per.get(id).map(r => ({ dosen_id: id, nama: nm(id), nidn: d.nidn && !nidnSementara(d.nidn) ? d.nidn : '',
      status: tandaGolongan(d) || 'DTPS', ...r }));
  });
  return {
    jenis: 'sk', kategori: 'pengajaran', tahun_akademik: ta, semester,
    perihal: `Dosen Pengampu Mata Kuliah ${periode}`,
    isi: ['Menimbang: (tulis pertimbangan)', 'Mengingat: (tulis dasar)', 'MEMUTUSKAN',
      `Menetapkan: dosen pengampu mata kuliah ${periode} sebagaimana tercantum dalam Lampiran Keputusan ini.`,
      'Keputusan ini berlaku sejak tanggal ditetapkan sampai akhir semester tersebut.'].join('\n'),
    dosen_ids: ids, rincian, nDosen: ids.length, nKelas: urut.length - tanpaDosen.length, tanpaDosen,
  };
}

// ---------- Rekap DTPS, DT, DTT per semester dari kelas (pemilik 2026-11-28, pilihan a) ----------
// Golongan dan "dihitung" memakai statusTS/hitungTS (dosen-hitung.js, 154/156) supaya sama dengan Kelola dosen dan Skor;
// sks per semester memakai porsi rekapBeban (pertemuan, selain itu rata). kelas = semua kelas tahun akademik ta (Ganjil + Genap).
const SEMESTER_TA = ['Ganjil', 'Genap'];
export function rekapGolonganTA({ ta, kelas = [], kd = [], mk = [], dosen = [], manual = [] } = {}){
  const D = new Map(dosen.map(d => [d.id, d]));
  const ampu = ampuPerTA({ kelas: kelas.map(k => ({ id: k.id, tahun_akademik: ta })), kd, manual });
  const per = new Map();
  for (const sm of SEMESTER_TA) {
    const ks = kelas.filter(k => k.semester === sm), ids = new Set(ks.map(k => k.id));
    for (const b of rekapBeban({ kelas: ks, kd: kd.filter(x => ids.has(x.kelas_id)), mk }).baris) {
      if (!per.has(b.dosen_id)) per.set(b.dosen_id, {});
      per.get(b.dosen_id)[sm] = { kelas: b.kelas, sks: b.sks };
    }
  }
  const urut = g => { const i = URUT_KELOMPOK.indexOf(g); return i < 0 ? 99 : i; };
  const baris = [...per.keys()].map(id => {
    const d = D.get(id) || { id, nama: '?' }, st = statusTS(d, ta, ampu);
    return { dosen_id: id, nama: d.nama_gelar || d.nama || '?', urut_nama: d.nama || '', nidn: nidnSementara(d.nidn) ? '' : (d.nidn || ''),
      nidn_sementara: nidnSementara(d.nidn), kelompok: st.kelompok, dihitung: st.dtps ? 'DTPS' : st.dt ? 'DT' : st.dtt ? 'DTT' : '', alasan: st.alasan,
      Ganjil: per.get(id).Ganjil || null, Genap: per.get(id).Genap || null };
  }).sort((a, b) => urut(a.kelompok) - urut(b.kelompok) || a.urut_nama.localeCompare(b.urut_nama, 'id'));
  const bulat = x => Math.round(x * 100) / 100;
  const golongan = [...new Set(baris.map(b => b.kelompok))].sort((a, b) => urut(a) - urut(b)).map(g => {
    const xs = baris.filter(b => b.kelompok === g);
    const sem = Object.fromEntries(SEMESTER_TA.map(sm => { const ys = xs.filter(b => b[sm]);
      return [sm, { dosen: ys.length, kelas: ys.reduce((a, b) => a + b[sm].kelas, 0), sks: bulat(ys.reduce((a, b) => a + b[sm].sks, 0)) }]; }));
    return { kelompok: g, label: KELOMPOK[g] || g, ...sem, dosen: xs.length };
  });
  const h = hitungTS(dosen, ta, ampu), dt = h.ndt + h.ndtt;
  return { baris, golongan, hitung: { ...h, porsi_dtt: dt ? Math.round(h.ndtt / dt * 1000) / 10 : null },
    tanpaKelas: kelas.filter(k => !kd.some(x => x.kelas_id === k.id)).length };
}
export function csvGolongan(r, ta = ''){
  const k = ['tahun_akademik', 'dosen', 'nidn', 'golongan', 'dihitung_ts', 'alasan', 'kelas_ganjil', 'sks_ganjil', 'kelas_genap', 'sks_genap'];
  const v = x => (x == null ? '' : String(x).replace('.', ','));
  return [k, ...r.baris.map(b => [ta, b.nama, b.nidn_sementara ? 'sementara' : b.nidn, KELOMPOK[b.kelompok] || b.kelompok, b.dihitung, b.alasan,
    b.Ganjil?.kelas ?? '', v(b.Ganjil?.sks), b.Genap?.kelas ?? '', v(b.Genap?.sks)])]
    .map(r => r.map(x => String(x ?? '').replace(/;/g, ',')).join(';')).join('\r\n');
}

