// Survei kepuasan daring (pemilik 2026-11-11; 54-patch-survei-kepuasan.sql).
// Butir 57 (kepuasan pemangku), butir 7 unsur 3 (mitra), butir 52 (pengguna
// lulusan, Tabel 6.g.2). Skala 1–4 sama dengan 6.g.2: 1 kurang, 2 cukup,
// 3 baik, 4 sangat baik. Templat bawaan adalah draf (2026-11-11) yang bisa
// disunting admin per survei; pengguna lulusan memakai 7 aspek resmi 6.g.2.
import { ASPEK_KEPUASAN } from './butir-manual.js?v=2026-11-13-e738fd';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const KELOMPOK_SURVEI = [['mahasiswa', 'Mahasiswa'], ['dosen', 'Dosen'], ['tendik', 'Tenaga kependidikan'],
  ['mitra', 'Mitra kerja sama'], ['pengguna', 'Pengguna lulusan'], ['alumni', 'Alumni (tracer)']];
export const labelKelompok = k => (KELOMPOK_SURVEI.find(x => x[0] === k) || [, k])[1];
export const SKALA = [[4, 'Sangat baik'], [3, 'Baik'], [2, 'Cukup'], [1, 'Kurang']];
// Jenis pertanyaan ala Google Form (pemilik 2026-11-11); aturan sama dengan survei_kirim di SQL.
export const JENIS_PERTANYAAN = [['skala', 'Skala 1–4'], ['pilihan', 'Pilihan (satu)'], ['centang', 'Kotak centang (banyak)'],
  ['angka', 'Angka'], ['singkat', 'Isian singkat'], ['teks', 'Isian panjang']];
export const IDENTITAS = [['tidak', 'Anonim (tanpa identitas)'], ['opsional', 'Identitas opsional'], ['wajib', 'Identitas wajib (nama + NIM atau email)']];
export const wajibQ = q => q.wajib ?? ['skala', 'pilihan'].includes(q.jenis);
/** Pertanyaan berlaku bila tanpa syarat, atau jawaban pertanyaan acuannya termasuk nilai syarat. */
export const aktifQ = (q, jawaban) => !q.syarat || (q.syarat.nilai || []).includes(jawaban?.[q.syarat.q]);
// Penyunting admin: opsi "a; b; c" dan syarat "status=bekerja|wirausaha".
export const teksOpsi = xs => (xs || []).join('; ');
export const bacaOpsi = s => [...new Set(String(s || '').split(';').map(x => x.trim()).filter(Boolean))];
export const teksSyarat = sy => sy ? `${sy.q}=${(sy.nilai || []).join('|')}` : '';
export function bacaSyarat(s){
  const m = String(s || '').trim().match(/^([a-z0-9_]{1,40})\s*=\s*(.+)$/);
  return m ? { q: m[1], nilai: m[2].split('|').map(x => x.trim()).filter(Boolean) } : null;
}
export const LABEL_ASPEK = {
  keandalan: 'Keandalan', daya_tanggap: 'Daya tanggap', kepastian: 'Kepastian', empati: 'Empati', sarana: 'Sarana dan prasarana',
  tata_kelola: 'Kepemimpinan dan tata kelola', administrasi: 'Layanan administrasi', pengembangan: 'Pengembangan diri dan karier',
  tridharma: 'Dukungan tridharma', kesejahteraan: 'Kesejahteraan dan suasana kerja', manfaat: 'Manfaat kerja sama',
  komunikasi_mitra: 'Komunikasi dan koordinasi', pelaksanaan: 'Pelaksanaan kegiatan', kompetensi: 'Kompetensi pelaksana',
  keberlanjutan: 'Keberlanjutan', saran: 'Saran', kurikulum: 'Kurikulum', tahun_lulus: 'Tahun lulus', status: 'Status',
  waktu_tunggu: 'Waktu tunggu', kesesuaian: 'Kesesuaian bidang', tingkat_kerja: 'Tingkat tempat kerja', instansi: 'Instansi',
  pengguna: 'Pengguna lulusan', ...Object.fromEntries(ASPEK_KEPUASAN),
};
export const labelAspek = a => LABEL_ASPEK[a] || String(a || '').replace(/_/g, ' ');

const S = (id, aspek, teks) => ({ id, aspek, teks, jenis: 'skala' });
// Tracer: nilai opsi status dan tingkat tempat kerja (Tabel 6.g.1: wilayah/lokal,
// nasional atau wirausaha berizin, multinasional/internasional).
export const STATUS_ALUMNI = ['bekerja', 'wirausaha', 'studi lanjut', 'belum bekerja'];
export const BEKERJA = ['bekerja', 'wirausaha'];
export const TINGKAT_KERJA = { wilayah: 'wilayah/lokal', nasional: 'nasional atau wirausaha berizin', internasional: 'multinasional/internasional' };
const SARAN = { id: 'saran', aspek: 'saran', teks: 'Saran atau masukan untuk perbaikan (boleh dikosongkan).', jenis: 'teks' };
// Aspek "kurikulum" (pemilik 2026-11-11: bahan pengembangan kurikulum; butir 12 unsur 2, 3, 5;
// butir 13 unsur 2; butir 48 unsur 5). Dihimpun lintas survei di kelola-survei.html.
const K = (id, teks, jenis = 'skala') => ({ id, aspek: 'kurikulum', teks, jenis });
const TEMPLAT = {
  mahasiswa: [
    S('m1', 'keandalan', 'Dosen menyampaikan perkuliahan sesuai RPS dan jadwal.'),
    S('m2', 'keandalan', 'Layanan administrasi akademik (KRS, nilai, surat) tepat waktu dan benar.'),
    S('m3', 'daya_tanggap', 'Dosen dan tenaga kependidikan cepat menanggapi pertanyaan atau keluhan.'),
    S('m4', 'daya_tanggap', 'Keluhan mahasiswa ditindaklanjuti dalam waktu yang wajar.'),
    S('m5', 'kepastian', 'Dosen menguasai materi serta menilai secara adil dan transparan.'),
    S('m6', 'kepastian', 'Informasi akademik (kalender, aturan, persyaratan) jelas dan mudah diperoleh.'),
    S('m7', 'empati', 'Dosen pembimbing akademik mudah ditemui dan memperhatikan kemajuan studi.'),
    S('m8', 'empati', 'Prodi memperhatikan kebutuhan dan aspirasi mahasiswa.'),
    S('m9', 'sarana', 'Ruang kuliah, laboratorium, dan peralatan memadai dan terawat.'),
    S('m10', 'sarana', 'Akses pustaka, internet, dan sistem informasi akademik memadai.'),
    K('mk1', 'Mata kuliah yang diajarkan relevan dengan perkembangan ilmu dan kebutuhan dunia kerja.'),
    K('mk2', 'Mata kuliah atau topik yang perlu ditambah, diperbarui, atau dikurangi (boleh dikosongkan).', 'teks'),
    SARAN],
  dosen: [
    S('d1', 'tata_kelola', 'Pimpinan prodi/UPPS melibatkan dosen dalam perencanaan dan pengambilan keputusan.'),
    S('d2', 'tata_kelola', 'Kebijakan dan prosedur kerja jelas dan diterapkan secara konsisten.'),
    S('d3', 'administrasi', 'Layanan administrasi (keuangan, kepegawaian, akademik) cepat dan tepat.'),
    S('d4', 'pengembangan', 'Ada dukungan untuk studi lanjut, pelatihan, dan kenaikan jabatan akademik.'),
    S('d5', 'tridharma', 'Ada dukungan dana dan fasilitas untuk penelitian dan PkM.'),
    S('d6', 'tridharma', 'Beban kerja tridharma dibagi secara adil.'),
    S('d7', 'sarana', 'Sarana, prasarana, dan peralatan untuk mengajar dan meneliti memadai.'),
    S('d8', 'kesejahteraan', 'Remunerasi dan penghargaan sesuai dengan kinerja.'),
    S('d9', 'kesejahteraan', 'Suasana kerja kondusif dan kolegial.'),
    K('dk1', 'Kurikulum prodi sesuai dengan perkembangan iptek di bidang Anda.'),
    K('dk2', 'Usulan perubahan kurikulum, CPL, atau mata kuliah (boleh dikosongkan).', 'teks'),
    SARAN],
  tendik: [
    S('t1', 'tata_kelola', 'Pimpinan memberikan arahan kerja yang jelas.'),
    S('t2', 'administrasi', 'Prosedur dan sistem informasi mendukung pekerjaan Anda.'),
    S('t3', 'pengembangan', 'Ada kesempatan pelatihan dan pengembangan karier.'),
    S('t4', 'sarana', 'Peralatan dan ruang kerja memadai.'),
    S('t5', 'kesejahteraan', 'Remunerasi dan penghargaan sesuai dengan kinerja.'),
    S('t6', 'kesejahteraan', 'Suasana kerja kondusif dan saling mendukung.'),
    SARAN],
  mitra: [
    S('k1', 'manfaat', 'Kerja sama memberi manfaat nyata bagi institusi Anda.'),
    S('k2', 'komunikasi_mitra', 'Komunikasi dan koordinasi dengan prodi lancar.'),
    S('k3', 'pelaksanaan', 'Kegiatan kerja sama dilaksanakan sesuai kesepakatan dan jadwal.'),
    S('k4', 'kompetensi', 'Dosen dan mahasiswa yang terlibat kompeten dan profesional.'),
    S('k5', 'keberlanjutan', 'Institusi Anda bersedia melanjutkan atau memperluas kerja sama.'),
    K('kk1', 'Kompetensi lulusan atau topik yang menurut Anda perlu diperkuat dalam kurikulum (boleh dikosongkan).', 'teks'),
    SARAN],
  // Tabel 6.g.2: id = kunci aspek di lkps_kepuasan_pengguna, supaya hasil bisa disalin.
  pengguna: [...ASPEK_KEPUASAN.map(([a, nama]) => S(a, a, `Penilaian Anda atas lulusan kami dalam hal: ${nama.toLowerCase()}.`)),
    K('pk1', 'Kompetensi yang perlu diperkuat agar lulusan kami lebih siap bekerja di institusi Anda (boleh dikosongkan).', 'teks'),
    SARAN],
  // Tracer pendukung (55-patch-survei-alumni.sql). Kode tahun_lulus, status, bulan, kesesuaian,
  // tingkat, izin_atasan, email_atasan dipakai keTabelTracer dan undanganPengguna: jangan diubah.
  alumni: [
    { id: 'tahun_lulus', aspek: 'tahun_lulus', teks: 'Tahun lulus', jenis: 'angka', min: 1990, max: 2100, wajib: true },
    { id: 'status', aspek: 'status', teks: 'Status Anda saat ini', jenis: 'pilihan', opsi: STATUS_ALUMNI },
    { id: 'bulan', aspek: 'waktu_tunggu', teks: 'Berapa bulan setelah lulus Anda mendapat pekerjaan pertama atau memulai usaha?',
      jenis: 'angka', min: 0, max: 240, wajib: true, syarat: { q: 'status', nilai: BEKERJA } },
    { id: 'kesesuaian', aspek: 'kesesuaian', teks: 'Seberapa sesuai bidang pekerjaan Anda dengan bidang studi?', jenis: 'pilihan',
      opsi: ['tinggi', 'sedang', 'rendah'], syarat: { q: 'status', nilai: BEKERJA } },
    { id: 'tingkat', aspek: 'tingkat_kerja', teks: 'Tingkat tempat kerja Anda', jenis: 'pilihan',
      opsi: [TINGKAT_KERJA.wilayah, TINGKAT_KERJA.nasional, TINGKAT_KERJA.internasional], syarat: { q: 'status', nilai: BEKERJA } },
    { id: 'instansi', aspek: 'instansi', teks: 'Nama instansi atau usaha (boleh dikosongkan)', jenis: 'singkat', syarat: { q: 'status', nilai: BEKERJA } },
    { ...K('ak1', 'Kurikulum yang Anda pelajari relevan dengan pekerjaan Anda saat ini.'), syarat: { q: 'status', nilai: BEKERJA } },
    K('ak2', 'Kompetensi atau mata kuliah yang perlu ditambah agar lulusan lebih siap bekerja (boleh dikosongkan).', 'teks'),
    { id: 'izin_atasan', aspek: 'pengguna', teks: 'Bolehkah kami mengirim survei kepuasan pengguna lulusan kepada atasan Anda?',
      jenis: 'pilihan', opsi: ['ya', 'tidak'], wajib: false, syarat: { q: 'status', nilai: BEKERJA } },
    { id: 'email_atasan', aspek: 'pengguna', teks: 'Email atasan Anda', jenis: 'singkat', wajib: true, syarat: { q: 'izin_atasan', nilai: ['ya'] } },
    SARAN],
};
export const templatSurvei = k => (TEMPLAT[k] || []).map(q => JSON.parse(JSON.stringify(q)));
/** Identitas bawaan per kelompok: tracer perlu bisa ditindaklanjuti, survei kepuasan anonim. */
export const identitasBawaan = k => k === 'alumni' ? 'opsional' : 'tidak';

/** '' bila daftar pertanyaan sah, selain itu pesan galat. */
export function cekPertanyaan(xs){
  if (!Array.isArray(xs) || !xs.length) return 'Isi paling sedikit satu pertanyaan.';
  if (xs.length > 60) return 'Paling banyak 60 pertanyaan.';
  const ids = new Set();
  for (const [i, q] of xs.entries()) {
    if (!/^[a-z0-9_]{1,40}$/.test(q.id || '')) return `Pertanyaan ${i + 1}: kode hanya huruf kecil, angka, garis bawah.`;
    if (ids.has(q.id)) return `Kode pertanyaan "${q.id}" dipakai dua kali.`;
    ids.add(q.id);
    if (!String(q.teks || '').trim()) return `Pertanyaan ${i + 1}: teks kosong.`;
    if (!JENIS_PERTANYAAN.some(([j]) => j === q.jenis)) return `Pertanyaan ${i + 1}: jenis tidak dikenal.`;
    if (['pilihan', 'centang'].includes(q.jenis)) {
      const o = q.opsi || [];
      if (o.length < 2) return `Pertanyaan ${i + 1}: isi paling sedikit dua opsi (pisahkan dengan titik koma).`;
      if (new Set(o).size !== o.length || o.some(x => !String(x).trim() || String(x).length > 100)) return `Pertanyaan ${i + 1}: opsi kosong, kembar, atau lebih dari 100 karakter.`;
    }
    if (q.jenis === 'angka' && q.min != null && q.max != null && +q.min > +q.max) return `Pertanyaan ${i + 1}: batas bawah lebih besar dari batas atas.`;
    if (q.syarat) {
      const acuan = xs.slice(0, i).find(x => x.id === q.syarat.q);
      if (!acuan || acuan.jenis !== 'pilihan') return `Pertanyaan ${i + 1}: syarat harus mengacu ke pertanyaan pilihan sebelumnya (kode=nilai).`;
      if (!q.syarat.nilai?.length || q.syarat.nilai.some(v => !(acuan.opsi || []).includes(v))) return `Pertanyaan ${i + 1}: nilai syarat harus salah satu opsi "${acuan.id}".`;
    }
  }
  return '';
}

/** '' bila jawaban sah terhadap pertanyaan (cerminan survei_kirim), selain itu pesan. */
export function cekJawaban(xs, j){
  for (const q of xs || []) {
    let v = j?.[q.id];
    if (v === '' || (Array.isArray(v) && !v.length)) v = undefined;
    if (!aktifQ(q, j)) { if (v !== undefined) return `Pertanyaan "${q.teks}" tidak berlaku untuk jawaban Anda sebelumnya.`; continue; }
    if (v === undefined) { if (wajibQ(q)) return `Pertanyaan wajib belum dijawab: ${q.teks}`; continue; }
    if (q.jenis === 'skala' && ![1, 2, 3, 4].includes(v)) return `Jawaban "${q.teks}" harus 1–4.`;
    if (q.jenis === 'pilihan' && !(q.opsi || []).includes(v)) return `Pilihan untuk "${q.teks}" tidak dikenal.`;
    if (q.jenis === 'centang' && (!Array.isArray(v) || v.some(x => !(q.opsi || []).includes(x)))) return `Pilihan untuk "${q.teks}" tidak dikenal.`;
    if (q.jenis === 'angka' && (typeof v !== 'number' || !Number.isFinite(v) || (q.min != null && v < +q.min) || (q.max != null && v > +q.max)))
      return `Angka untuk "${q.teks}" di luar rentang${q.min != null || q.max != null ? ` (${q.min ?? '…'}–${q.max ?? '…'})` : ''}.`;
    if (q.jenis === 'singkat' && String(v).length > 200) return `Isian "${q.teks}" paling panjang 200 karakter.`;
    if (q.jenis === 'teks' && String(v).length > 2000) return `Isian "${q.teks}" paling panjang 2000 karakter.`;
  }
  return '';
}

/** Sebaran [n1, n2, n3, n4] per pertanyaan berskala dari baris survei_jawaban. */
export function hitungDariJawaban(pertanyaan, rows){
  const out = {};
  (pertanyaan || []).filter(q => q.jenis === 'skala').forEach(q => { out[q.id] = [0, 0, 0, 0]; });
  (rows || []).forEach(r => Object.entries(r.jawaban || {}).forEach(([k, v]) => {
    if (out[k] && [1, 2, 3, 4].includes(v)) out[k][v - 1]++;
  }));
  return out;
}

const r2 = x => Math.round(x * 100) / 100;
/** Rekap per pertanyaan dan per aspek dari sebaran. Sama untuk admin dan halaman publik. */
export function rekapSurvei(pertanyaan, hitung){
  const per = (pertanyaan || []).filter(q => q.jenis === 'skala').map(q => {
    const h = hitung?.[q.id] || [0, 0, 0, 0], n = h.reduce((a, b) => a + b, 0);
    return { ...q, hitung: h, n, rerata: n ? r2((h[0] + 2 * h[1] + 3 * h[2] + 4 * h[3]) / n) : null,
      puas: n ? r2((h[2] + h[3]) / n * 100) : null };
  });
  const aspek = [...new Set(per.map(q => q.aspek))].map(a => {
    const xs = per.filter(q => q.aspek === a && q.n);
    return { aspek: a, label: labelAspek(a), rerata: xs.length ? r2(xs.reduce((s, q) => s + q.rerata, 0) / xs.length) : null,
      puas: xs.length ? r2(xs.reduce((s, q) => s + q.puas, 0) / xs.length) : null };
  });
  const ada = per.filter(q => q.n);
  return { per, aspek, rerata: ada.length ? r2(ada.reduce((s, q) => s + q.rerata, 0) / ada.length) : null,
    puas: ada.length ? r2(ada.reduce((s, q) => s + q.puas, 0) / ada.length) : null };
}

/** Isian teks dan singkat per pertanyaan (khusus admin; tidak pernah ditampilkan publik).
 *  Nama responden ikut bila survei meminta identitas. */
export function komentarSurvei(pertanyaan, rows){
  return (pertanyaan || []).filter(q => q.jenis === 'teks' || q.jenis === 'singkat').map(q => ({ ...q,
    isi: (rows || []).map(r => { const t = String(r.jawaban?.[q.id] ?? '').trim(); return t && r.nama ? `${t} — ${r.nama}` : t; }).filter(Boolean) }));
}

/** Sebaran opsi (pilihan/centang) dan [n, rerata] angka, bentuknya sama dengan survei_rekap(). */
export function ringkasLain(pertanyaan, rows){
  const opsi = {}, angka = {};
  (pertanyaan || []).forEach(q => {
    if (q.jenis === 'pilihan' || q.jenis === 'centang') {
      const c = {};
      (rows || []).forEach(r => { const v = r.jawaban?.[q.id]; (Array.isArray(v) ? v : v != null ? [v] : []).forEach(x => { c[x] = (c[x] || 0) + 1; }); });
      opsi[q.id] = c;
    } else if (q.jenis === 'angka') {
      const xs = (rows || []).map(r => r.jawaban?.[q.id]).filter(v => typeof v === 'number');
      angka[q.id] = [xs.length, xs.length ? r2(xs.reduce((a, b) => a + b, 0) / xs.length) : null];
    }
  });
  return { opsi, angka };
}

/** Aspek di bawah ambang (pemilik 2026-11-11: % puas < ambang_puas ATAU rerata < ambang_rerata). */
export function aspekTindakLanjut(rk, { ambang_puas = 75, ambang_rerata = 3 } = {}){
  return (rk.aspek || []).filter(a => a.rerata != null).map(a => ({ ...a,
    alasan: [a.puas < ambang_puas ? `% puas ${a.puas.toFixed(2).replace('.', ',')} < ${ambang_puas}` : '',
      a.rerata < ambang_rerata ? `rerata ${a.rerata.toFixed(2).replace('.', ',')} < ${String(ambang_rerata).replace('.', ',')}` : ''].filter(Boolean) }))
    .filter(a => a.alasan.length);
}
/** Kode temuan unik per survei dan aspek, supaya tombol tidak membuat baris ganda. */
export const kodeTemuanSurvei = (s, aspek) => `SV${s.id}-${aspek}`.slice(0, 30);
/** Baris ami_temuan (51-patch-temuan-ami.sql) dari satu aspek survei di bawah ambang. */
export function temuanDariAspek(s, a, n){
  const kur = a.aspek === 'kurikulum';
  return { siklus: s.judul.slice(0, 120), tahun_ts: s.tahun_ts, kode: kodeTemuanSurvei(s, a.aspek),
    standar: kur ? 'Kurikulum' : 'Kepuasan pemangku kepentingan',
    butir: kur ? 12 : s.kelompok === 'mitra' ? 7 : s.kelompok === 'pengguna' ? 52 : 57, kategori: 'peluang',
    uraian: `Survei kepuasan ${labelKelompok(s.kelompok).toLowerCase()}, aspek ${a.label}: ${a.alasan.join('; ')} (${n} responden).`,
    pihak: 'P', status: 'terbuka' };
}

// Persen dua desimal yang berjumlah tepat 100 (sisa terbesar).
function persen100(h){
  const n = h.reduce((a, b) => a + b, 0);
  if (!n) return null;
  const mentah = h.map(x => x / n * 10000), bulat = mentah.map(Math.floor);
  let sisa = 10000 - bulat.reduce((a, b) => a + b, 0);
  mentah.map((x, i) => [x - bulat[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (sisa > 0) { bulat[i]++; sisa--; } });
  return bulat.map(x => x / 100);
}
/** Baris lkps_kepuasan_pengguna (Tabel 6.g.2) dari survei pengguna lulusan. */
export function keTabel62(hitung, tahunTs){
  return ASPEK_KEPUASAN.map(([a]) => {
    const p = persen100(hitung?.[a] || [0, 0, 0, 0]);
    return p ? { tahun_akademik: `${tahunTs - 1}/${tahunTs}`, aspek: a, kurang: p[0], cukup: p[1], baik: p[2], sangat_baik: p[3] } : null;
  }).filter(Boolean);
}

/** CSV jawaban mentah (admin), pemisah ; dan BOM UTF-8. */
export function csvJawaban(pertanyaan, rows){
  const q = s => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const kol = pertanyaan || [];
  const idn = (rows || []).some(r => r.nama || r.nim || r.email);
  const nilai = v => Array.isArray(v) ? v.join('; ') : v ?? '';
  return String.fromCharCode(0xFEFF) + [['Diisi', ...(idn ? ['Nama', 'NIM', 'Email'] : []), ...kol.map(x => `${x.id} ${x.teks}`)].map(q).join(';'),
    ...(rows || []).map(r => [String(r.diisi || '').slice(0, 16).replace('T', ' '), ...(idn ? [r.nama, r.nim, r.email] : []),
      ...kol.map(x => nilai(r.jawaban?.[x.id]))].map(q).join(';'))
  ].join('\r\n');
}

const f2 = x => x == null ? '—' : (+x).toFixed(2).replace('.', ',');
const WARNA = ['#C0392B', '#E59866', '#5DADE2', '#1E8449'];   // kurang, cukup, baik, sangat baik
/** Tabel rekap per pertanyaan dengan bilah sebaran, dan ringkasan per aspek. */
export function htmlRekap(rk, n){
  if (!n) return '<p class="ket">Belum ada responden.</p>';
  const bilah = h => { const t = h.reduce((a, b) => a + b, 0) || 1;
    return `<span class="sv-bilah">${h.map((x, i) => x ? `<i style="width:${x / t * 100}%;background:${WARNA[i]}" title="${SKALA[3 - i][1]}: ${x}"></i>` : '').join('')}</span>`; };
  return `<p class="ket"><b>${n} responden</b> · rerata ${f2(rk.rerata)} dari 4 · ${f2(rk.puas)}% menjawab baik atau sangat baik.
      <span class="sv-leg">${SKALA.slice().reverse().map(([v, l]) => `<i style="background:${WARNA[v - 1]}"></i>${l}`).join(' ')}</span></p>
    <div class="gulir"><table class="sv"><thead><tr><th>Aspek</th><th>Rerata</th><th>% puas</th></tr></thead><tbody>
      ${rk.aspek.map(a => `<tr><td>${esc(a.label)}</td><td>${f2(a.rerata)}</td><td>${f2(a.puas)}</td></tr>`).join('')}</tbody></table></div>
    <div class="gulir"><table class="sv"><thead><tr><th>Pertanyaan</th><th>Sebaran</th><th>n</th><th>Rerata</th><th>% puas</th></tr></thead><tbody>
      ${rk.per.map(q => `<tr><td>${esc(q.teks)}<br><small class="ket">${esc(labelAspek(q.aspek))}</small></td><td>${bilah(q.hitung)}</td>
        <td>${q.n}</td><td>${f2(q.rerata)}</td><td>${f2(q.puas)}</td></tr>`).join('')}</tbody></table></div>`;
}

/**
 * Rekap tracer per tahun lulus untuk lkps_tracer_lulusan (Tabel 6.f.1, 6.f.2, 6.g.1).
 * Terlacak = responden tahun itu. Waktu tunggu, kesesuaian, dan tingkat dihitung dari yang
 * bekerja/berwirausaha. Pita waktu tunggu Sarjana: < 3, 3–18, > 18 bulan.
 * jumlah_lulusan dan bukti tidak diisi di sini (data prodi).
 * Hasil: { baris: [...], kurang: [kode pertanyaan yang tidak ada di survei] }.
 */
export function keTabelTracer(pertanyaan, rows){
  const ada = new Set((pertanyaan || []).map(q => q.id));
  const kurang = ['tahun_lulus', 'status', 'bulan', 'kesesuaian', 'tingkat'].filter(k => !ada.has(k));
  const per = new Map();
  (rows || []).forEach(r => {
    const t = r.jawaban?.tahun_lulus;
    if (!Number.isInteger(t)) return;
    if (!per.has(t)) per.set(t, []);
    per.get(t).push(r.jawaban);
  });
  const baris = [...per.entries()].sort((a, b) => a[0] - b[0]).map(([t, js]) => {
    const kerja = js.filter(j => BEKERJA.includes(j.status));
    const bln = kerja.map(j => j.bulan).filter(v => typeof v === 'number');
    const hit = (xs, f) => xs.filter(f).length;
    return { tahun_lulus: t, jumlah_terlacak: js.length,
      rata_rata_waktu_tunggu_bulan: bln.length ? r2(bln.reduce((a, b) => a + b, 0) / bln.length) : null,
      wt_kurang_3: hit(bln, v => v < 3), wt_3_18: hit(bln, v => v >= 3 && v <= 18), wt_lebih_18: hit(bln, v => v > 18),
      kesesuaian_rendah: hit(kerja, j => j.kesesuaian === 'rendah'), kesesuaian_sedang: hit(kerja, j => j.kesesuaian === 'sedang'),
      kesesuaian_tinggi: hit(kerja, j => j.kesesuaian === 'tinggi'),
      kerja_wilayah: hit(kerja, j => j.tingkat === TINGKAT_KERJA.wilayah), kerja_nasional: hit(kerja, j => j.tingkat === TINGKAT_KERJA.nasional),
      kerja_internasional: hit(kerja, j => j.tingkat === TINGKAT_KERJA.internasional) };
  });
  return { baris, kurang };
}

/** Atasan yang boleh dihubungi (izin "ya" dan email sah), tanpa duplikat. */
export function undanganPengguna(rows){
  const per = new Map();
  (rows || []).forEach(r => {
    const e = String(r.jawaban?.email_atasan || '').trim().toLowerCase();
    if (r.jawaban?.izin_atasan !== 'ya' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) || per.has(e)) return;
    per.set(e, { email: e, alumni: r.nama || '', instansi: String(r.jawaban?.instansi || '').trim() });
  });
  return [...per.values()];
}

// Pemangku internal dan eksternal (butir 12 unsur 2 dan 3).
export const INTERNAL = new Set(['mahasiswa', 'dosen', 'tendik']);
/**
 * Masukan kurikulum lintas survei: pertanyaan beraspek "kurikulum".
 * surveis = baris survei; jawabanPer = Map(survei_id -> baris jawaban).
 * Hasil per survei: { s, internal, skala: [{teks, n, rerata, puas}], isian: [{teks, isi: []}] }.
 */
export function masukanKurikulum(surveis, jawabanPer){
  return (surveis || []).map(s => {
    const xs = (s.pertanyaan || []).filter(q => q.aspek === 'kurikulum');
    if (!xs.length) return null;
    const rows = jawabanPer.get(s.id) || [];
    const rk = rekapSurvei(xs, hitungDariJawaban(xs, rows));
    return { s, internal: INTERNAL.has(s.kelompok), n: rows.length,
      skala: rk.per.map(q => ({ teks: q.teks, n: q.n, rerata: q.rerata, puas: q.puas })),
      isian: komentarSurvei(xs, rows).map(q => ({ teks: q.teks, isi: q.isi })) };
  }).filter(Boolean);
}
/** CSV masukan kurikulum (bahan rapat evaluasi kurikulum). */
export function csvKurikulum(daftar){
  const q = s => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const baris = [['Survei', 'Kelompok', 'Pemangku', 'TS', 'Pertanyaan', 'Rerata (1-4)', '% puas', 'Masukan'].map(q).join(';')];
  daftar.forEach(m => {
    const kol = [m.s.judul, labelKelompok(m.s.kelompok), m.internal ? 'internal' : 'eksternal', `${m.s.tahun_ts - 1}/${m.s.tahun_ts}`];
    m.skala.forEach(x => baris.push([...kol, x.teks, x.rerata ?? '', x.puas ?? '', ''].map(q).join(';')));
    m.isian.forEach(x => x.isi.forEach(t => baris.push([...kol, x.teks, '', '', t].map(q).join(';'))));
  });
  return String.fromCharCode(0xFEFF) + baris.join('\r\n');
}

/** Sebaran pilihan/centang dan rerata angka (dipakai admin dan halaman publik). */
export function htmlLain(pertanyaan, { opsi = {}, angka = {} } = {}, n = 0){
  const xs = (pertanyaan || []).filter(q => ['pilihan', 'centang', 'angka'].includes(q.jenis));
  if (!xs.length || !n) return '';
  return `<div class="gulir"><table class="sv"><thead><tr><th>Pertanyaan</th><th>Jawaban</th></tr></thead><tbody>${xs.map(q => {
    if (q.jenis === 'angka') { const [m, rata] = angka[q.id] || [0, null];
      return `<tr><td>${esc(q.teks)}</td><td>${m ? `rerata ${f2(rata)} (${m} jawaban)` : '—'}</td></tr>`; }
    const c = opsi[q.id] || {}, total = Object.values(c).reduce((a, b) => a + b, 0) || 1;
    return `<tr><td>${esc(q.teks)}${q.jenis === 'centang' ? '<br><small class="ket">boleh lebih dari satu</small>' : ''}</td><td>${(q.opsi || []).map(o =>
      `<div class="sv-opsi"><span>${esc(o)}</span><span class="sv-bilah"><i style="width:${(c[o] || 0) / total * 100}%;background:var(--biru)"></i></span><b>${c[o] || 0}</b></div>`).join('')}</td></tr>`;
  }).join('')}</tbody></table></div>`;
}

export const CSS_SURVEI = `
  .sv-opsi{display:grid;grid-template-columns:minmax(90px,1fr) 180px 36px;gap:8px;align-items:center;font-size:13px;margin:2px 0}
  .sv-opsi b{font-family:var(--mono);font-weight:400;text-align:right}
  table.sv{width:100%;border-collapse:collapse;font-size:13.5px;margin:8px 0 14px}
  table.sv th{text-align:left;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--line);padding:5px 8px}
  table.sv td{padding:6px 8px;border-bottom:1px solid var(--line-soft);vertical-align:top}
  .sv-bilah{display:flex;width:180px;max-width:40vw;height:12px;background:var(--line-soft);border-radius:3px;overflow:hidden}
  .sv-bilah i{display:block;height:100%}
  .sv-leg{display:inline-flex;gap:10px;margin-left:8px;flex-wrap:wrap}
  .sv-leg i{display:inline-block;width:10px;height:10px;margin-right:4px;vertical-align:middle;border-radius:2px}
  .gulir{overflow-x:auto}`;
