// Tinjauan RPS per MK per semester (115-patch-tinjauan-rps.sql, pemilik 2026-11-19): logika halaman tinjauan-rps.html.
// Tanpa DOM (tests/js/tinjauan_rps.test.mjs). Butir 15 unsur 5-8 dan butir 16-II LAM Teknik (site/unsur-butir.js).
// Tinjauan dibuka setelah nilai akhir keluar: berkas nilai akhir MK di ringkasan CPL (cpl_ringkasan.data.berkas) untuk
// semester >= pengaturan tinjauan_rps_mulai. MK lama (K21) ditinjau; revisi diarahkan ke RPS MK padanannya (ref_mk_padanan).

export const VERSI_DATA = '1';
export const MULAI_BAWAAN = 20252;   // 2025/2026 Genap (pemilik 2026-11-19); pengaturan.tinjauan_rps_mulai menimpanya

// Isian = unsur 5-8 butir 15 (site/unsur-butir.js), dengan pertanyaan penuntun.
export const UNSUR = [
  ['analisis_cpl', 'Analisis CPL', 5, 'Bagaimana capaian CPL MK ini (lihat analisis otomatis)? CPL mana yang belum tercapai, di kelas mana, dan dugaan penyebabnya.'],
  ['materi_metode', 'Kesesuaian materi dan metode', 6, 'Apakah materi dan metode (termasuk SCL) mendukung CPMK dan berjalan sesuai RPS? Apa yang perlu diubah?'],
  ['penilaian', 'Peninjauan metode penilaian', 7, 'Apakah bentuk, bobot, dan jadwal asesmen mengukur Sub-CPMK dengan tepat (termasuk HOTS)? Apa yang perlu diubah?'],
  ['pembaruan', 'Penyesuaian kurikulum dan pembaruan materi', 8, 'Perkembangan ilmu, teknologi, standar, atau kebutuhan industri yang perlu masuk ke materi; pustaka yang perlu diperbarui.'],
];
export const KEPUTUSAN = [['tetap', 'RPS tetap (tidak perlu revisi)'], ['revisi', 'RPS direvisi'], ['tidak_berlanjut', 'MK tidak berlanjut di kurikulum baru']];
export const STATUS = { draf: 'draf', diajukan: 'diajukan ke Kaprodi', dikembalikan: 'dikembalikan', disetujui: 'disetujui' };

const teks = v => String(v ?? '').trim();
const kunci = (kur, kode) => `${kur}|${kode}`;

/** Urutan semester seperti term_order ringkasan CPL: tahun awal x 10 + 1 (Ganjil) / 2 (Genap). */
export const urutTerm = (ta, semester) => (parseInt(String(ta).slice(0, 4), 10) || 0) * 10 + (semester === 'Genap' ? 2 : 1);
/** "2025/2026 Genap" -> { ta, semester, urut }; null bila bukan bentuk itu. */
export function pecahTerm(term){
  const m = String(term || '').match(/^(\d{4})\s*\/\s*(\d{4})\s+(Ganjil|Genap)$/i);
  if (!m) return null;
  const semester = m[3][0].toUpperCase() + m[3].slice(1).toLowerCase(), ta = `${m[1]}/${m[2]}`;
  return { term: `${ta} ${semester}`, ta, semester, urut: urutTerm(ta, semester) };
}

const nilaiAkhir = b => (b.jenis || 'nilai_akhir') === 'nilai_akhir' && b.used !== false;

/** Semester yang terbuka untuk ditinjau (berkas nilai akhir ada, urut >= mulai), terbaru dulu. */
export function daftarSemester(ringkasan, mulai = MULAI_BAWAAN){
  const xs = new Map();
  for (const b of ringkasan?.berkas || []) {
    const t = nilaiAkhir(b) && pecahTerm(b.term);
    if (t && t.urut >= mulai) xs.set(t.term, t);
  }
  return [...xs.values()].sort((a, b) => b.urut - a.urut);
}

/** MK yang punya berkas nilai akhir pada semester itu: [{ kurikulum, kode, nama, kelas }], urut kode. */
export function mkSemester(ringkasan, term){
  const xs = new Map();
  for (const b of ringkasan?.berkas || []) {
    if (!nilaiAkhir(b) || pecahTerm(b.term)?.term !== term) continue;
    const k = kunci(b.curriculum || '', b.course_code);
    const x = xs.get(k) || { kurikulum: b.curriculum || '', kode: b.course_code, nama: b.course_name || '', kelas: new Set() };
    x.kelas.add(b.class_name); xs.set(k, x);
  }
  return [...xs.values()].map(x => ({ ...x, kelas: x.kelas.size })).sort((a, b) => a.kode.localeCompare(b.kode));
}

/**
 * Analisis CPL otomatis dari ringkasan.kelas (MK, semester): per kelas per CPL (persen di atas ambang, status) dan per CPL
 * gabungan kelas. Teks = ringkasan satu kalimat untuk disalin ke isian.
 */
export function analisisCpl(ringkasan, kode, term){
  const K = String(kode).toUpperCase();
  const xs = (ringkasan?.kelas || []).filter(r => String(r.course_code).toUpperCase() === K && pecahTerm(r.term)?.term === term);
  const kelas = xs.map(r => ({ kelas: r.class_name, cpl: r.cpl, n: +r.counted || 0, atas: +r.above_threshold || 0,
    persen: r.counted ? Math.round(1000 * r.above_threshold / r.counted) / 10 : 0, status: r.status || '' }))
    .sort((a, b) => String(a.cpl).localeCompare(String(b.cpl)) || String(a.kelas).localeCompare(String(b.kelas)));
  const per = new Map();
  for (const r of kelas) {
    const x = per.get(r.cpl) || { cpl: r.cpl, n: 0, atas: 0, belum: [] };
    x.n += r.n; x.atas += r.atas; if (r.status === 'BELUM') x.belum.push(r.kelas);
    per.set(r.cpl, x);
  }
  const perCpl = [...per.values()].map(x => ({ ...x, persen: x.n ? Math.round(1000 * x.atas / x.n) / 10 : 0 }));
  const teksAnalisis = perCpl.length ? `Capaian CPL ${term}: ` + perCpl.map(x => `CPL ${x.cpl} ${String(x.persen).replace('.', ',')}% mahasiswa di atas ambang`
    + (x.belum.length ? ` (belum tercapai di kelas ${x.belum.join(', ')})` : '')).join('; ') + '.' : '';
  return { kelas, perCpl, teks: teksAnalisis };
}

/**
 * RPS sasaran revisi (sama dengan tinjauan_sasaran di SQL): padanan di kurikulum baru; tanpa baris padanan, MK itu sendiri
 * bila masih aktif. Hasil { sasaran: [mk], tidakBerlanjut, adaPadanan }.
 */
export function sasaranRps(padanan = [], mk = [], kur, kode){
  const ps = padanan.filter(p => p.kurikulum_lama === kur && p.kode_lama === kode);
  const cari = (k, c) => mk.find(m => m.kurikulum === k && m.kode === c);
  if (ps.length) return { adaPadanan: true, tidakBerlanjut: ps.some(p => p.tidak_berlanjut),
    sasaran: ps.filter(p => !p.tidak_berlanjut).map(p => cari(p.kurikulum_baru, p.kode_baru) || { kurikulum: p.kurikulum_baru, kode: p.kode_baru, nama: '' }) };
  const m = cari(kur, kode);
  return { adaPadanan: false, tidakBerlanjut: false, sasaran: m && m.aktif !== false ? [m] : [] };
}

/** Boleh mengisi (sama dengan tinjauan_boleh di SQL): koordinator MK, koordinator MK padanannya, atau pengampu kelas semester itu. */
export function bolehTinjau({ saya, mk = [], padanan = [], kelas = [], tim = [], kur, kode, ta, semester }){
  if (!saya?.nidn && !saya?.email) return false;
  const koor = m => !!m && (m.pengampu || []).includes(saya.nidn);
  if (koor(mk.find(m => m.kurikulum === kur && m.kode === kode))) return true;
  if (padanan.some(p => p.kurikulum_lama === kur && p.kode_lama === kode && koor(mk.find(m => m.kurikulum === p.kurikulum_baru && m.kode === p.kode_baru)))) return true;
  const e = String(saya.email || '').toLowerCase();
  // Penyusunan kelas (137, pemilik 2026-11-21): juga anggota team teaching kelas MK itu pada semester itu.
  if (tim.some(k => String(k.kode_mk).toUpperCase() === String(kode).toUpperCase() && k.tahun_akademik === ta && k.semester === semester)) return true;
  return kelas.some(k => String(k.kode_mk).toUpperCase() === String(kode).toUpperCase() && k.tahun_akademik === ta && k.semester === semester
    && String(k.dosen_email).toLowerCase() === e);
}

export const tinjauanKosong = () => ({ versi: VERSI_DATA, analisis_cpl: '', materi_metode: '', penilaian: '', pembaruan: '', rencana: '', tenggat: '' });

/** Butir yang menghalangi pengajuan (sama dengan tinjauan_ajukan di SQL). */
export function periksaTinjauan(t = {}, S = { sasaran: [], tidakBerlanjut: false }){
  const d = t.data || {}, out = [];
  for (const [k, label] of UNSUR) if (!teks(d[k])) out.push(`Isi bagian "${label}".`);
  if (!t.keputusan) out.push('Pilih keputusan: RPS tetap, direvisi, atau MK tidak berlanjut.');
  if (t.keputusan === 'revisi' && !teks(d.rencana)) out.push('Tulis rencana perubahan RPS (tindak lanjut).');
  if (t.keputusan === 'revisi' && !S.sasaran.length) out.push('MK ini belum punya RPS sasaran (padanan kurikulum baru); minta admin melengkapi padanan.');
  if (t.keputusan === 'tidak_berlanjut' && !S.tidakBerlanjut) out.push('Keputusan "MK tidak berlanjut" hanya untuk MK yang di daftar padanan ditandai tidak berlanjut.');
  return out;
}

/**
 * Status tindak lanjut tinjauan yang disetujui dengan keputusan revisi: selesai bila semua RPS sasaran sudah disahkan lagi
 * setelah tinjauan disetujui (revisi > rps_dasar). rpsMap = Map "kur|kode" -> { revisi, status }.
 */
export function statusTindak(t, rpsMap = new Map()){
  if (!t || t.keputusan !== 'revisi') return { kode: 'tidak_ada', label: '-' };
  if (t.status !== 'disetujui') return { kode: 'menunggu', label: 'menunggu persetujuan tinjauan' };
  const dasar = Object.entries(t.rps_dasar || {});
  if (!dasar.length) return { kode: 'terbuka', label: 'RPS sasaran belum ada' };
  const belum = dasar.filter(([k, v]) => !((rpsMap.get(k)?.revisi || 0) > (+v || 0))).map(([k]) => k.split('|')[1]);
  const lewat = t.data?.tenggat && t.data.tenggat < new Date().toISOString().slice(0, 10);
  return belum.length ? { kode: lewat ? 'lewat' : 'terbuka', label: `RPS ${belum.join(', ')} belum disahkan ulang${lewat ? ' (lewat tenggat)' : ''}` }
    : { kode: 'selesai', label: 'selesai: RPS revisi disahkan' };
}

/**
 * CSV padanan (pemisah ; atau ,): kolom kode_lama|kode_k21 dan kode_baru|kode_k26, opsional cara/model. kode baru
 * TIDAK_BERLANJUT = tanpa padanan. mk = ref_mata_kuliah. Hasil { baris: [ref_mk_padanan], galat: [teks] }.
 */
export function bacaCsvPadanan(isi, mk = [], kurLama = 'K21', kurBaru = 'K26'){
  const garis = String(isi || '').replace(/^﻿/, '').split(/\r?\n/).filter(g => g.trim());
  if (!garis.length) return { baris: [], galat: ['Berkas kosong.'] };
  const pisah = garis[0].includes(';') ? ';' : ',';
  const sel = g => g.split(pisah).map(s => s.trim().replace(/^"|"$/g, ''));
  const kepala = sel(garis[0]).map(s => s.toLowerCase());
  const iL = kepala.findIndex(h => h === 'kode_lama' || h === `kode_${kurLama.toLowerCase()}`);
  const iB = kepala.findIndex(h => h === 'kode_baru' || h === `kode_${kurBaru.toLowerCase()}`);
  const iC = kepala.findIndex(h => h === 'cara' || h === 'model');
  const iN = kepala.findIndex(h => h === 'catatan');   // opsional (134, pemilik 2026-11-21): sumber baris, mis. "Bab 7 Tabel 7-2"
  if (iL < 0 || iB < 0) return { baris: [], galat: [`Kolom kode_lama/kode_${kurLama.toLowerCase()} dan kode_baru/kode_${kurBaru.toLowerCase()} wajib ada.`] };
  const ada = (k, c) => mk.some(m => m.kurikulum === k && m.kode === c);
  const baris = [], galat = [], sudah = new Set();
  garis.slice(1).forEach((g, i) => {
    const c = sel(g), lama = c[iL] || '', baru = (c[iB] || '').toUpperCase() === 'TIDAK_BERLANJUT' ? null : (c[iB] || '');
    const no = `Baris ${i + 2}`;
    if (!lama) return;
    if (!ada(kurLama, lama)) return galat.push(`${no}: ${lama} tidak ada di MK ${kurLama}.`);
    if (baru === '') return galat.push(`${no}: ${lama} belum diisi kode ${kurBaru} (atau TIDAK_BERLANJUT).`);
    if (baru && !ada(kurBaru, baru)) return galat.push(`${no}: ${baru} tidak ada di MK ${kurBaru}.`);
    const k = `${lama}|${baru || ''}`;
    if (sudah.has(k)) return;
    sudah.add(k);
    const cara = (c[iC] || '').toLowerCase(), model = /1:2/.test(cara) ? '1:2' : /2:1/.test(cara) ? '2:1' : /1:1/.test(cara) ? '1:1' : /nama/.test(cara) ? 'nama sama' : null;
    const catatan = iN >= 0 ? (c[iN] || '').slice(0, 500) || null : null;
    baris.push({ kurikulum_lama: kurLama, kode_lama: lama, kurikulum_baru: baru ? kurBaru : null, kode_baru: baru, model: baru ? model : null,
                 tidak_berlanjut: !baru, ...(iN >= 0 ? { catatan } : {}) });
  });
  return { baris, galat };
}

// ---------- Tahap 2 (pemilik 2026-11-19): rekap, CSV, kalimat LED, unsur 5-8 skor, bagian E RPS, pemuat bersama ----------

/** Pemuat bersama untuk skor, kelengkapan, pengingat, Dasbor, dan Ruang kerja. Tanpa patch 115: patch = false, daftar kosong. */
export async function bacaTinjauan(sb){
  const [rg, tin, pad, peng, rps] = await Promise.all([
    sb.from('cpl_ringkasan').select('data').order('diunggah', { ascending: false }).order('id', { ascending: false }).limit(1),
    sb.from('mk_rps_tinjauan').select('id,kurikulum,kode_mk,tahun_akademik,semester,keputusan,status,rps_dasar,data,disetujui_pada'),
    sb.from('ref_mk_padanan').select('kurikulum_lama,kode_lama,kurikulum_baru,kode_baru,tidak_berlanjut'),
    sb.from('pengaturan').select('nilai').eq('kunci', 'tinjauan_rps_mulai'),
    sb.from('mk_rps').select('kurikulum,kode_mk,status,revisi')].map(q => q.then(r => r, () => ({ error: true }))));
  return { patch: !tin.error, ringkasan: rg.error ? null : rg.data?.[0]?.data || null, tinjauan: tin.error ? [] : tin.data || [],
           padanan: pad.error ? [] : pad.data || [], mulai: +(peng.data?.[0]?.nilai) || MULAI_BAWAAN, rps: rps.error ? [] : rps.data || [] };
}
export const petaRps = rps => new Map((rps || []).map(r => [kunci(r.kurikulum, r.kode_mk), r]));

/** Tinjauan satu MK pada satu semester ("2025/2026 Genap"). */
export function cariTinjauan(tinjauan = [], kur, kode, term){
  const t = pecahTerm(term);
  return t ? tinjauan.find(x => x.kurikulum === kur && x.kode_mk === kode && x.tahun_akademik === t.ta && x.semester === t.semester) : undefined;
}

/** Rekap satu semester: jumlah per status, keputusan, tindak lanjut, dan baris per MK. */
export function rekapSemester({ ringkasan, term, tinjauan = [], padanan = [], mk = [], rpsMap = new Map() }){
  const baris = mkSemester(ringkasan, term).map(m => {
    const t = cariTinjauan(tinjauan, m.kurikulum, m.kode, term);
    return { ...m, t: t || null, status: t?.status || 'belum', keputusan: t?.keputusan || '', tindak: statusTindak(t, rpsMap),
      sasaran: sasaranRps(padanan, mk, m.kurikulum, m.kode).sasaran.map(s => s.kode),
      belumCpl: analisisCpl(ringkasan, m.kode, term).perCpl.filter(x => x.belum.length).map(x => x.cpl) };
  });
  const hit = f => baris.filter(f).length, sah = b => b.status === 'disetujui';
  return { term, baris, n: baris.length, disetujui: hit(sah), diajukan: hit(b => b.status === 'diajukan'),
    proses: hit(b => ['draf', 'dikembalikan'].includes(b.status)), belum: hit(b => b.status === 'belum'),
    tetap: hit(b => sah(b) && b.keputusan === 'tetap'), revisi: hit(b => sah(b) && b.keputusan === 'revisi'),
    tidakBerlanjut: hit(b => sah(b) && b.keputusan === 'tidak_berlanjut'),
    tindak: { selesai: hit(b => b.tindak.kode === 'selesai'), terbuka: hit(b => b.tindak.kode === 'terbuka'), lewat: hit(b => b.tindak.kode === 'lewat') } };
}

/** CSV rekap (BOM, pemisah titik koma) untuk bahan rapat kurikulum: satu baris per MK beserta isian tinjauannya. */
export function csvTinjauan(R){
  const q = v => { const s = String(v ?? ''); return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const kepala = ['semester', 'kurikulum', 'kode', 'nama', 'kelas', 'rps_sasaran', 'status', 'keputusan', 'cpl_belum_tercapai',
    ...UNSUR.map(u => u[0]), 'rencana', 'tenggat', 'tindak_lanjut', 'disetujui_pada'];
  const isi = R.baris.map(b => [R.term, b.kurikulum, b.kode, b.nama, b.kelas, b.sasaran.join(' '), STATUS[b.status] || 'belum diisi',
    KEPUTUSAN.find(k => k[0] === b.keputusan)?.[1] || '', b.belumCpl.map(c => `CPL ${c}`).join(' '),
    ...UNSUR.map(u => b.t?.data?.[u[0]]), b.t?.data?.rencana, b.t?.data?.tenggat,
    b.tindak.kode === 'tidak_ada' ? '' : b.tindak.label, String(b.t?.disetujui_pada || '').slice(0, 10)].map(q).join(';'));
  return '\uFEFF' + [kepala.join(';'), ...isi].join('\r\n');
}

/** Paragraf siap salin untuk narasi LED butir 15/16 dari rekap satu semester. */
export function kalimatLed(R){
  if (!R?.n) return '';
  const cpl = new Map();
  for (const b of R.baris) for (const c of b.belumCpl) cpl.set(c, [...(cpl.get(c) || []), b.kode]);
  const s = [`Pada semester ${R.term}, RPS ${R.n} mata kuliah yang nilai akhirnya telah keluar ditinjau oleh koordinator mata kuliah; `
    + `${R.disetujui} tinjauan telah disetujui Ketua Program Studi${R.disetujui < R.n ? ` dan ${R.n - R.disetujui} belum selesai` : ''}.`,
    'Tinjauan mencakup analisis capaian CPL dari nilai akhir, kesesuaian materi dan metode pembelajaran, peninjauan metode penilaian, '
    + 'serta penyesuaian kurikulum dan pembaruan materi.'];
  if (cpl.size) s.push(`CPL yang belum tercapai di sebagian kelas: ${[...cpl].map(([c, ks]) => `CPL ${c} (${ks.join(', ')})`).join('; ')}.`);
  if (R.disetujui) s.push(`Hasilnya, ${R.tetap} RPS dinyatakan tetap dan ${R.revisi} RPS diputuskan direvisi`
    + (R.revisi ? `; tindak lanjut revisi telah selesai untuk ${R.tindak.selesai} RPS dan masih berjalan untuk ${R.tindak.terbuka + R.tindak.lewat} RPS.` : '.'));
  return s.join(' ');
}

/**
 * Unsur 5-8 butir 15 dari tinjauan (pemilik 2026-11-19): terhitung bila SEMUA MK yang nilai akhirnya keluar pada semester
 * terbaru yang ditinjau sudah punya tinjauan disetujui Kaprodi (seketat unsur 1: semua MK ber-RPS lengkap).
 */
export function unsurDariTinjauan({ ringkasan, tinjauan = [], mulai = MULAI_BAWAAN } = {}){
  const term = daftarSemester(ringkasan, mulai)[0]?.term;
  if (!term) return { term: '', n: 0, disetujui: 0, unsur: [] };
  const xs = mkSemester(ringkasan, term);
  const ok = xs.filter(m => cariTinjauan(tinjauan, m.kurikulum, m.kode, term)?.status === 'disetujui').length;
  return { term, n: xs.length, disetujui: ok, unsur: xs.length && ok === xs.length ? [5, 6, 7, 8] : [] };
}

/**
 * Bagian E RPS dari tinjauan: MK lama padanan RPS ini (atau MK itu sendiri), tinjauan disetujui terbaru.
 * Hasil { kodeLama, tinjauan, bahan: [baris teks] }.
 */
export function bahanTinjauan({ tinjauan = [], padanan = [], kur, kode }){
  const lama = padanan.filter(p => p.kurikulum_baru === kur && p.kode_baru === kode).map(p => [p.kurikulum_lama, p.kode_lama]);
  const asal = [[kur, kode], ...lama];
  const t = tinjauan.filter(x => x.status === 'disetujui' && asal.some(([k, c]) => x.kurikulum === k && x.kode_mk === c))
    .sort((a, b) => urutTerm(b.tahun_akademik, b.semester) - urutTerm(a.tahun_akademik, a.semester))[0] || null;
  const bahan = t ? [`Tinjauan RPS ${t.semester} ${t.tahun_akademik} (MK ${t.kode_mk}, disetujui Kaprodi):`,
    ...UNSUR.map(([k, l]) => (teks(t.data?.[k]) ? `${l}: ${teks(t.data[k])}` : '')),
    t.keputusan === 'revisi' && teks(t.data?.rencana) ? `Rencana revisi: ${teks(t.data.rencana)}` : '',
    t.keputusan === 'tetap' ? 'Keputusan tinjauan: RPS tetap.' : ''].filter(Boolean) : [];
  return { kodeLama: lama[0]?.[1] || '', tinjauan: t, bahan };
}
