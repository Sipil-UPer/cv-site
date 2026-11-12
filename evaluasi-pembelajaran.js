// Evaluasi pembelajaran per semester (pemilik 2026-11-12; 68-patch-evaluasi-pembelajaran.sql).
// EDOM per dosen per mata kuliah (skala 0-4, rekap dari kampus), capaian CPL kelas dari ringkasan
// CPL, refleksi dosen (kesesuaian RPS, metode), dan tindak lanjut. Bukti butir 16 komponen II.

export const SEMESTER = ['Ganjil', 'Genap'];
export const AMBANG_BAWAAN = 3;                      // pengaturan.ambang_edom (patch 68), pemilik 2026-11-12
export const RPS = [['sesuai', 'Sesuai RPS'], ['sebagian', 'Sebagian sesuai'], ['tidak', 'Tidak sesuai']];
export const STATUS_TINDAK = [['terbuka', 'Terbuka'], ['proses', 'Dalam proses'], ['selesai', 'Selesai']];
const norm = s => String(s ?? '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9@.]+/g, ' ').trim();
export const angka = v => v == null || v === '' ? '—' : (+v).toFixed(2).replace('.', ',');

/** Semester berjalan: Ganjil September–Februari, Genap Maret–Agustus. */
export function semesterKini(kini = new Date()){
  const y = kini.getFullYear(), m = kini.getMonth() + 1;
  if (m >= 9) return { ta: `${y}/${y + 1}`, sm: 'Ganjil' };
  if (m <= 2) return { ta: `${y - 1}/${y}`, sm: 'Ganjil' };
  return { ta: `${y - 1}/${y}`, sm: 'Genap' };
}
export const kunciSemester = (ta, sm) => `${ta} ${sm}`;
/** Urutan semester terbaru dulu: 2025/2026 Genap, 2025/2026 Ganjil, 2024/2025 Genap, ... */
export const urutSemester = (a, b) => b.ta.localeCompare(a.ta) || SEMESTER.indexOf(b.sm) - SEMESTER.indexOf(a.sm);
/** TS (tahun akhir) dari "2025/2026". */
export const tsDariTA = ta => { const m = String(ta || '').match(/^(\d{4})\/(\d{4})$/); return m ? +m[2] : null; };

// ---- Tempel rekap EDOM: kolom kode_mk, dosen (email, NIDN, atau nama), nilai, [responden], [nama_mk].
const POLA_KOLOM = [['kode_mk', /^kode|^kd|kode.?mk/], ['nama_mk', /nama.?mk|mata.?kuliah|^mk$/], ['dosen', /dosen|email|nidn|nama/],
  ['edom', /edom|nilai|indeks|ipk|skor|rata/], ['responden', /respon|jumlah|^n$/]];
const pisah = baris => baris.includes('\t') ? baris.split('\t') : baris.includes(';') ? baris.split(';') : baris.split(',');

/**
 * Baris rekap EDOM dari teks tempelan (Excel/CSV). dosen = baris dosen {id, nama, email, nidn}.
 * Hasil [{ baris, kode_mk, nama_mk, dosen_id, dosen_nama, edom, responden, galat: [] }].
 */
export function bacaTempelEDOM(teks, dosen){
  const rows = String(teks || '').replace(/\r/g, '').split('\n').filter(s => s.trim()).map(s => pisah(s).map(x => x.trim().replace(/^"|"$/g, '')));
  if (!rows.length) return [];
  const kepala = rows[0].map(norm);
  const adaKepala = kepala.some(k => /kode|dosen|edom|nilai|nidn|email/.test(k)) && !rows[0].some(x => /^\d+([.,]\d+)?$/.test(x));
  let kol = { kode_mk: 0, dosen: 1, edom: 2, responden: 3, nama_mk: 4 };
  if (adaKepala) {
    kol = {};
    kepala.forEach((k, i) => { const p = POLA_KOLOM.find(([nama, re]) => kol[nama] == null && re.test(k)); if (p) kol[p[0]] = i; });
  }
  const perEmail = new Map(), perNidn = new Map(), perNama = new Map();
  for (const d of dosen || []) {
    if (d.email) perEmail.set(String(d.email).toLowerCase(), d);
    if (d.nidn) perNidn.set(String(d.nidn).trim(), d);
    if (d.nama) perNama.set(norm(d.nama), d);
  }
  const dilihat = new Set();
  return rows.slice(adaKepala ? 1 : 0).map((sel, i) => {
    const ambil = k => kol[k] == null ? '' : String(sel[kol[k]] ?? '').trim();
    const galat = [];
    const kode = ambil('kode_mk').toUpperCase().replace(/\s+/g, '');
    if (!kode || kode.length > 20) galat.push('kode MK kosong atau lebih dari 20 karakter');
    const kd = ambil('dosen');
    const d = perEmail.get(kd.toLowerCase()) || perNidn.get(kd) || perNama.get(norm(kd)) || null;
    if (!d) galat.push(`dosen "${kd}" tidak dikenal (pakai email, NIDN, atau nama persis seperti di Kelola dosen)`);
    const v = ambil('edom').replace(',', '.');
    const edom = v === '' ? null : Number(v);
    if (edom == null || !Number.isFinite(edom) || edom < 0 || edom > 4) galat.push(`nilai EDOM "${ambil('edom')}" harus 0–4`);
    const rs = ambil('responden');
    const responden = rs === '' ? null : Number(rs);
    if (responden != null && !(Number.isInteger(responden) && responden >= 0)) galat.push('responden harus bilangan bulat');
    const k = `${kode}|${d?.id}`;
    if (!galat.length && dilihat.has(k)) galat.push('MK dan dosen yang sama sudah ada di atas');
    dilihat.add(k);
    return { baris: i + (adaKepala ? 2 : 1), kode_mk: kode, nama_mk: ambil('nama_mk') || null, dosen_id: d?.id || null, dosen_nama: d?.nama || kd,
             edom: galat.length ? null : Math.round(edom * 100) / 100, responden, galat };
  });
}

// ---- CPL kelas dari ringkasan CPL (cpl_ringkasan.data.kelas; term "2025/2026 Ganjil").
const cocokTerm = (term, ta, sm) => { const m = String(term || '').match(/(\d{4})\s*\/\s*(\d{4})\s*(ganjil|genap)/i);
  return !!m && `${m[1]}/${m[2]}` === ta && m[3].toLowerCase() === String(sm).toLowerCase(); };
/** Map kode_mk -> { kelas: [..], belum: ['CPL1 kelas A', ...], terendah } untuk satu semester. */
export function cplPerMK(ringkasan, ta, sm){
  const per = new Map();
  for (const r of ringkasan?.kelas || []) {
    if (!cocokTerm(r.term, ta, sm)) continue;
    const kode = String(r.course_code || '').toUpperCase();
    const x = per.get(kode) || { kelas: new Set(), belum: [], terendah: null };
    x.kelas.add(r.class_name);
    if (r.status === 'BELUM') x.belum.push(`${r.cpl} kelas ${r.class_name}`);
    if (typeof r.share === 'number') x.terendah = x.terendah == null ? r.share : Math.min(x.terendah, r.share);
    per.set(kode, x);
  }
  return per;
}

/**
 * Status satu baris evaluasi. Hasil { alasan: [teks], perlu, tl: 'tidak_perlu' | 'belum' | 'proses' | 'selesai' }.
 * tindak = baris evaluasi_tindak untuk baris ini.
 */
export function statusEvaluasi(e, cpl, ambang = AMBANG_BAWAAN, tindak = []){
  const alasan = [];
  if (e.edom != null && +e.edom < +ambang) alasan.push(`EDOM ${angka(e.edom)} di bawah ${angka(ambang)}`);
  if (cpl?.belum?.length) alasan.push(`CPL belum tercapai: ${cpl.belum.join(', ')}`);
  if (e.rps_sesuai === 'tidak') alasan.push('pelaksanaan tidak sesuai RPS');
  const perlu = alasan.length > 0;
  const tl = !tindak.length ? (perlu ? 'belum' : 'tidak_perlu') : tindak.every(t => t.status === 'selesai') ? 'selesai' : 'proses';
  return { alasan, perlu, tl };
}

/** Rekap satu semester dari baris yang terbaca (admin/pimpinan: semua). */
export function rekapSemester(rows, cplMap, ambang, tindakPer){
  const s = rows.map(e => statusEvaluasi(e, cplMap.get(String(e.kode_mk).toUpperCase()), ambang, tindakPer.get(e.id) || []));
  const edom = rows.filter(e => e.edom != null).map(e => +e.edom);
  return { jumlah: rows.length, berEdom: edom.length, rerata: edom.length ? edom.reduce((a, b) => a + b, 0) / edom.length : null,
    bawah: rows.filter(e => e.edom != null && +e.edom < +ambang).length, rpsTerisi: rows.filter(e => e.rps_sesuai).length,
    perlu: s.filter(x => x.perlu).length, perluBelumTL: s.filter(x => x.tl === 'belum').length, tlSelesai: s.filter(x => x.tl === 'selesai').length };
}

/**
 * Butir Tugas saya dari evaluasi pembelajaran. d = { saya, evaluasi: baris evaluasi_mk milik sendiri,
 * tindakEval: evaluasi_tindak dengan evaluasi_mk {kode_mk, tahun_akademik, semester} }, kini.
 * Hasil [{ jenis, judul, rinci, href, hari }] (hari = ke tenggat; negatif = lewat).
 */
export function tugasEvaluasi(d, kini = new Date()){
  const out = [];
  const milik = (d.evaluasi || []).filter(e => e.dosen_id === d.saya?.id);
  const terbaru = milik.map(e => ({ ta: e.tahun_akademik, sm: e.semester })).sort(urutSemester)[0];
  if (terbaru) {
    const kosong = milik.filter(e => e.tahun_akademik === terbaru.ta && e.semester === terbaru.sm && !e.rps_sesuai);
    if (kosong.length) out.push({ jenis: 'evaluasi', judul: `Evaluasi pembelajaran ${terbaru.ta} ${terbaru.sm}: ${kosong.length} mata kuliah belum diisi`,
      rinci: `${kosong.map(e => e.kode_mk).join(', ')}: kesesuaian dengan RPS dan catatan metode.`,
      href: `evaluasi-pembelajaran.html?ta=${encodeURIComponent(terbaru.ta)}&sm=${terbaru.sm}`, hari: null });
  }
  const hariIni = Date.UTC(kini.getFullYear(), kini.getMonth(), kini.getDate());
  for (const t of (d.tindakEval || []).filter(t => t.pj_id === d.saya?.id && t.status !== 'selesai')) {
    const [y, m, h] = String(t.tenggat || '').split('-').map(Number);
    const hari = y ? Math.round((Date.UTC(y, m - 1, h) - hariIni) / 864e5) : null;
    const mk = t.evaluasi_mk || {};
    // PJ yang bukan pengampu tidak membaca baris evaluasinya (RLS): kode MK kosong.
    out.push({ jenis: 'evaluasi', judul: `Tindak lanjut${mk.kode_mk ? ' ' + mk.kode_mk : ' evaluasi pembelajaran'}: ${t.rencana}`,
      rinci: `${t.masalah}${mk.tahun_akademik ? ` (${mk.tahun_akademik} ${mk.semester})` : ''}${t.tenggat ? `; tenggat ${t.tenggat.split('-').reverse().join('/')}` : '; tanpa tenggat'}`,
      href: mk.tahun_akademik ? `evaluasi-pembelajaran.html?ta=${encodeURIComponent(mk.tahun_akademik)}&sm=${mk.semester}` : 'evaluasi-pembelajaran.html', hari });
  }
  return out;
}
