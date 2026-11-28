// Mutu survei (pemilik 2026-11-27): tingkat respons terhadap target yang dihitung dari data situs, dan uji instrumen
// (reliabilitas Cronbach alpha per kelompok pertanyaan dan per aspek; validitas butir = korelasi butir-total terkoreksi).
// Bahan butir 57 (instrumen sahih, cakupan responden) dan analisis Juli (Agenda tugas). Fungsi murni; halaman: kelola-survei.html.
import { sedangTB } from './dosen-hitung.js?v=2026-11-28-38a701';
import { susunDaftar } from './daftar-mahasiswa.js?v=2026-11-28-38a701';
import { punya } from './koordinator.js?v=2026-11-28-38a701';

const t = s => String(s ?? '').trim();
const ya = v => v === true || ['ya', 'y', 'true', '1'].includes(String(v ?? '').toLowerCase());
const r2 = x => Math.round(x * 100) / 100;
const f2 = x => x == null ? '—' : (+x).toFixed(2).replace('.', ',');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------------- Target responden (pemilik 2026-11-27: "pakai saran Anda") ----------------
/** Aturan target per kelompok, ditampilkan di samping angkanya. {tahun} = tahun lulus yang dihitung. */
export const ATURAN_TARGET = {
  mahasiswa: 'mahasiswa aktif (tercatat pada semester SIAKAD terbaru yang diunggah, belum lulus)',
  dosen: 'dosen aktif (DTPS atau berperan dosen), tidak sedang tugas belajar pada tanggal mulai survei',
  tendik: 'tenaga kependidikan aktif, tetap atau kontrak (magang tidak dihitung)',
  mitra: 'mitra kerja sama yang berlaku pada tanggal mulai survei (nama mitra dihitung sekali)',
  alumni: 'lulusan dengan periode yudisium tahun {tahun}',
  pengguna: 'jumlah instansi pengguna lulusan tidak tercatat di sistem, jadi hanya jumlah responden yang ditampilkan',
};
const SUMBER = { mahasiswa: 'mahasiswa', alumni: 'mahasiswa', dosen: 'dosen', tendik: 'tendik', mitra: 'kerjasama' };
const TAK_TERBACA = {
  mahasiswa: 'data mahasiswa hanya terbaca admin dan Kaprodi',
  dosen: 'data dosen tidak terbaca',
  tendik: 'data tendik hanya terbaca admin',
  kerjasama: 'data kerja sama tidak terbaca',
};
const KOSONG = {
  mahasiswa: 'belum ada mahasiswa aktif (unggah data SIAKAD di Perwalian)',
  alumni: 'belum ada lulusan tahun itu (Data prodi › Lulusan)',
  dosen: 'belum ada dosen aktif', tendik: 'belum ada tendik aktif (Data prodi › Tendik)',
  mitra: 'belum ada kerja sama yang berlaku (Data prodi › Kerja sama)',
};

/** Kerja sama berlaku pada tanggal hari (YYYY-MM-DD); tanggal kosong memakai tahun (1 Januari / 31 Desember). */
export function kerjasamaBerlaku(k, hari){
  const mulai = t(k.tanggal_mulai).slice(0, 10) || (k.tahun_mulai ? `${k.tahun_mulai}-01-01` : '');
  const selesai = t(k.tanggal_selesai).slice(0, 10) || (k.tahun_selesai ? `${k.tahun_selesai}-12-31` : '');
  return (!mulai || mulai <= hari) && (!selesai || selesai >= hari);
}

/**
 * Target responden satu survei. data: { mahasiswa (hasil susunDaftar), dosen, tendik, kerjasama }; null = tidak terbaca.
 * Hasil { target: angka | null, aturan, catatan } (catatan terisi bila target tidak bisa dihitung).
 */
export function targetResponden(kelompok, data = {}, { tahunTs, hari } = {}){
  const tahun = tahunTs ? tahunTs - 1 : null;
  const aturan = (ATURAN_TARGET[kelompok] || '').replace('{tahun}', tahun ?? '?');
  if (!SUMBER[kelompok]) return { target: null, aturan, catatan: kelompok === 'pengguna' ? '' : 'kelompok tanpa aturan target' };
  const xs = data[SUMBER[kelompok]];
  if (!Array.isArray(xs)) return { target: null, aturan, catatan: TAK_TERBACA[SUMBER[kelompok]] };
  let n;
  if (kelompok === 'mahasiswa') n = xs.filter(m => m.status === 'aktif').length;
  else if (kelompok === 'alumni') n = xs.filter(m => m.status === 'lulus' && t(m.lulus_periode).slice(0, 4) === String(tahun)).length;
  else if (kelompok === 'dosen') n = xs.filter(d => d.aktif !== false && (ya(d.dtps) || d.peran === 'dosen') && !sedangTB(d, null, hari)).length;
  else if (kelompok === 'tendik') n = xs.filter(x => x.aktif !== false && x.status_kerja !== 'magang').length;
  else n = new Set(xs.filter(k => t(k.mitra) && kerjasamaBerlaku(k, hari)).map(k => t(k.mitra).toLowerCase().replace(/\s+/g, ' '))).size;
  return n ? { target: n, aturan, catatan: '' } : { target: null, aturan, catatan: KOSONG[kelompok] };
}

async function ambilSemua(buat){
  const out = [];
  for (let dari = 0; ; dari += 1000) {
    const { data, error } = await buat().range(dari, dari + 999);
    if (error) throw new Error(error.message);
    out.push(...(data || []));
    if (!data || data.length < 1000) return out;
  }
}
/**
 * Data populasi untuk targetResponden (Kelola survei dan Tugas saya). null = tidak terbaca dengan hak akses ini:
 * mahasiswa hanya admin dan Kaprodi (RLS 186), tendik hanya admin (RLS 27).
 */
export async function muatPopulasi(sb, saya){
  const atau = p => p.catch(() => null);
  const semuaMhs = saya?.peran === 'admin' || punya(saya, 'kaprodi');
  const [dosen, tendik, mhs, sem, kerjasama] = await Promise.all([
    atau(ambilSemua(() => sb.from('dosen').select('id,peran,dtps,aktif,tugas_belajar,tugas_belajar_mulai,tugas_belajar_selesai').order('id'))),
    saya?.peran === 'admin' ? atau(ambilSemua(() => sb.from('lkps_tendik').select('id,aktif,status_kerja').order('id'))) : null,
    semuaMhs ? atau(ambilSemua(() => sb.from('mahasiswa').select('nim,lulus_periode').order('nim'))) : null,
    semuaMhs ? atau(ambilSemua(() => sb.from('mahasiswa_semester').select('nim,ts,semester').order('nim'))) : null,
    atau(ambilSemua(() => sb.from('lkps_kerjasama').select('id,mitra,tahun_mulai,tahun_selesai,tanggal_mulai,tanggal_selesai').order('id')))]);
  return { dosen, tendik, kerjasama, mahasiswa: mhs && sem ? susunDaftar({ mahasiswa: mhs, semester: sem }) : null };
}
/** Target satu baris survei (tanggal acuan = tanggal mulai survei). */
export const targetSurvei = (s, pop, hariIni) => targetResponden(s.kelompok, pop,
  { tahunTs: s.tahun_ts, hari: String(s.mulai || '').slice(0, 10) || hariIni });

/** Persentase responden terhadap target (dua desimal); null bila target tidak ada. */
export const persenRespons = (n, target) => target ? r2(n / target * 100) : null;

// ---------------- Uji instrumen ----------------
/** Acuan umum (George dan Mallery): kategori Cronbach alpha. */
export function kategoriAlpha(a){
  if (a == null) return '';
  return a >= 0.9 ? 'sangat baik' : a >= 0.8 ? 'baik' : a >= 0.7 ? 'dapat diterima' : a >= 0.6 ? 'meragukan' : a >= 0.5 ? 'lemah' : 'tidak dapat diterima';
}
/** Batas korelasi butir-total terkoreksi (acuan umum); di bawahnya butir perlu ditinjau. */
export const BATAS_R = 0.3;
/** Jumlah responden lengkap minimal agar uji dihitung, dan batas "hasil masih kasar". */
export const MIN_UJI = 3, CUKUP_UJI = 30;

const KELUARGA = [
  ['skala', 'Pertanyaan kepuasan (skala 1–4)', q => q.jenis === 'skala'],
  ['cpl_penting', 'CPL: tingkat kepentingan (1–5)', q => !!q.cpl && q.cpl_sisi === 'penting'],
  ['cpl_kuasai', 'CPL: tingkat penguasaan (1–5)', q => !!q.cpl && q.cpl_sisi === 'kuasai'],
];
// Nilai angka satu jawaban: skala 1-4, CPL '1'-'5'; selain itu null.
const nilai = (q, v) => q.jenis === 'skala' ? ([1, 2, 3, 4].includes(v) ? v : null)
  : (/^[1-5]$/.test(String(v ?? '')) ? +v : null);
const ragam = xs => { const m = xs.reduce((a, b) => a + b, 0) / xs.length; return xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1); };

/** Cronbach alpha dari matriks [responden][butir] (semua terisi); null bila < 2 butir, < MIN_UJI responden, atau total seragam. */
export function cronbachAlpha(mat){
  const n = mat.length, k = mat[0]?.length || 0;
  if (k < 2 || n < MIN_UJI) return null;
  const vt = ragam(mat.map(r => r.reduce((a, b) => a + b, 0)));
  if (!vt) return null;
  const vi = Array.from({ length: k }, (_, j) => ragam(mat.map(r => r[j]))).reduce((a, b) => a + b, 0);
  return r2(k / (k - 1) * (1 - vi / vt));
}

/** Korelasi Pearson; null bila salah satu seragam. */
export function pearson(x, y){
  const n = x.length; if (n < MIN_UJI) return null;
  const mx = x.reduce((a, b) => a + b, 0) / n, my = y.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; }
  return sxx && syy ? r2(sxy / Math.sqrt(sxx * syy)) : null;
}

/**
 * Uji instrumen satu survei dari baris survei_jawaban. Pertanyaan bersyarat (q.syarat) tidak ikut karena tidak semua
 * responden menjawabnya. Responden lengkap = menjawab semua butir kelompok itu (listwise).
 * Hasil { kelompok: [{kunci, label, k, n, alpha, kategori, aspek: [{label, k, alpha, kategori}]}],
 *         butir: [{id, teks, kelompok, r, status: 'ok' | 'rendah' | 'seragam'}] }.
 */
export function ujiInstrumen(pertanyaan, rows, labelAspek = a => a){
  const kelompok = [], butir = [];
  for (const [kunci, label, pilih] of KELUARGA) {
    const qs = (pertanyaan || []).filter(q => pilih(q) && !q.syarat);
    if (qs.length < 2) continue;
    const mat = (rows || []).map(r => qs.map(q => nilai(q, r.jawaban?.[q.id]))).filter(v => v.every(x => x != null));
    const alpha = cronbachAlpha(mat);
    const aspek = kunci !== 'skala' ? [] : [...new Set(qs.map(q => q.aspek))].map(a => {
      const idx = qs.map((q, i) => q.aspek === a ? i : -1).filter(i => i >= 0);
      if (idx.length < 2) return null;
      const al = cronbachAlpha(mat.map(v => idx.map(i => v[i])));
      return { label: labelAspek(a), k: idx.length, alpha: al, kategori: kategoriAlpha(al) };
    }).filter(Boolean);
    kelompok.push({ kunci, label, k: qs.length, n: mat.length, alpha, kategori: kategoriAlpha(alpha), aspek });
    if (mat.length < MIN_UJI) continue;
    qs.forEach((q, j) => {
      const r = pearson(mat.map(v => v[j]), mat.map(v => v.reduce((a, b) => a + b, 0) - v[j]));
      butir.push({ id: q.id, teks: q.teks, kelompok: label, r, status: r == null ? 'seragam' : r < BATAS_R ? 'rendah' : 'ok' });
    });
  }
  return { kelompok, butir };
}

/** Kartu "Mutu survei" di Hasil (admin/GKM): tingkat respons, reliabilitas, dan butir yang perlu ditinjau. */
export function htmlMutuSurvei({ n, target, aturan, catatan }, uji){
  const p = persenRespons(n, target);
  const respons = target
    ? `<p><b>${n} dari ${target} responden (${f2(p)}%)</b>.<br><small class="ket">Target: ${esc(aturan)}.</small></p>`
    : `<p><b>${n} responden</b>. <small class="ket">Target tidak dihitung: ${esc(catatan || aturan)}.</small></p>`;
  const bar = (label, k, nn, a, kat, sub = false) => `<tr><td>${sub ? '&nbsp;&nbsp;↳ ' : ''}${esc(label)}</td><td>${k}</td><td>${nn ?? ''}</td>
    <td>${a == null ? '—' : f2(a)}</td><td>${esc(kat || (nn != null && nn < MIN_UJI ? `butuh ≥ ${MIN_UJI} responden lengkap` : ''))}</td></tr>`;
  const tabel = uji.kelompok.length ? `<div class="gulir"><table class="sv"><thead><tr><th>Kelompok pertanyaan</th><th>Butir</th>
      <th>Responden lengkap</th><th>Cronbach α</th><th>Kategori</th></tr></thead><tbody>${uji.kelompok.map(g =>
      bar(g.label, g.k, g.n, g.alpha, g.kategori) + g.aspek.map(a => bar(a.label, a.k, null, a.alpha, a.kategori, true)).join('')).join('')}</tbody></table></div>`
    : '<p class="ket">Tidak ada kelompok pertanyaan dengan dua butir atau lebih untuk diuji.</p>';
  const lemah = uji.butir.filter(b => b.status !== 'ok');
  const nMin = Math.min(...uji.kelompok.map(g => g.n), Infinity);
  const tinjau = !uji.butir.length ? '' : lemah.length
    ? `<p><b>Butir yang perlu ditinjau</b> (korelasi butir-total terkoreksi &lt; ${f2(BATAS_R)} atau jawaban seragam):</p>
      <ul>${lemah.map(b => `<li>${esc(b.teks)} <small class="ket">(${esc(b.kelompok)}; r = ${b.r == null ? 'tidak terhitung, jawaban seragam' : f2(b.r)})</small></li>`).join('')}</ul>`
    : `<p class="ket">Semua butir berkorelasi butir-total terkoreksi ≥ ${f2(BATAS_R)}.</p>`;
  return `<div class="kartu" style="margin:10px 0"><h2 style="font-size:15px">Mutu survei: tingkat respons dan uji instrumen</h2>
    ${respons}${tabel}${tinjau}
    <p class="ket">Acuan umum: Cronbach α ≥ 0,70 dapat diterima (≥ 0,80 baik); validitas butir dengan korelasi butir-total terkoreksi ≥ ${f2(BATAS_R)}.
      Pertanyaan bersyarat tidak ikut diuji.${nMin < CUKUP_UJI && uji.kelompok.length ? ` Responden lengkap kurang dari ${CUKUP_UJI}: hasil uji masih kasar.` : ''}</p></div>`;
}
