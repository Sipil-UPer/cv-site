// Tugas saya untuk koordinator MK dan pengampu kelas (pemilik 2026-11-17; OBE O2 dan O3).
// Hanya yang belum punya pengingat lain: CPMK/RPS (cpmk.html) dan unggahan portofolio (portofolio.html).
// Berkas nilai CPL dan refleksi evaluasi sudah diingatkan tugas-saya.js / evaluasi-pembelajaran.js.
import { periksaStruktur } from './templat-cpl.js?v=2026-11-22-866c27';
import { cplMK, dataTemplat, statusStruktur } from './cpmk.js?v=2026-11-22-866c27';
import { bolehTinjau, cariTinjauan, statusTindak, petaRps, daftarSemester as semesterTinjau, mkSemester as mkTinjau } from './tinjauan-rps.js?v=2026-11-22-866c27';
import { kelengkapan, mkSemester, daftarSemester } from './portofolio.js?v=2026-11-22-866c27';

const kecil = s => String(s || '').trim().toLowerCase();
const potong = (xs, n = 6) => xs.slice(0, n).join('; ') + (xs.length > n ? `; dan ${xs.length - n} lagi` : '');

/**
 * d = { saya: {nidn, email}, mk: ref_mata_kuliah {kurikulum, kode, nama, aktif, pengampu, rps_url},
 *   struktur: mk_struktur {kurikulum, kode_mk, data}, refCpl: ref_cpl, peta: ref_mk_cpl,
 *   kelas: portofolio_ringkas().kelas {tahun_akademik, semester, kode_mk, kelas, dosen_email},
 *   berkas: portofolio_berkas yang terbaca }.
 * Hasil [{ jenis, judul, rinci, href }].
 */
export function tugasMK(d){
  const out = [], nidn = d.saya?.nidn, email = kecil(d.saya?.email);
  const mk = d.mk || [];
  const str = new Map((d.struktur || []).map(s => [`${s.kurikulum}|${s.kode_mk}`, s.data]));
  const koor = m => (m?.pengampu || []);

  // 1. CPMK dan RPS untuk MK aktif yang saya koordinasikan.
  const milik = nidn ? mk.filter(m => m.aktif !== false && koor(m).includes(nidn)) : [];
  const kurang = milik.map(m => {
    const s = str.get(`${m.kurikulum}|${m.kode}`);
    const st = s ? statusStruktur(s, periksaStruktur(dataTemplat(s, cplMK(d.refCpl, d.peta, m.kurikulum, m.kode)))) : 'kosong';
    const xs = [st === 'kosong' ? 'CPMK belum diisi' : st === 'belum' ? 'CPMK belum lengkap' : '', m.rps_url ? '' : m.rps_ada ? 'RPS menunggu penetapan Dekan' : 'RPS belum disahkan'].filter(Boolean);
    return xs.length ? { m, teks: `${m.kode} ${m.nama}: ${xs.join(', ')}` } : null;
  }).filter(Boolean);
  if (kurang.length) out.push({ jenis: 'cpmk', judul: `CPMK dan penilaian: ${kurang.length} mata kuliah yang Anda koordinasikan belum lengkap`,
    rinci: potong(kurang.map(x => x.teks)) + '.',
    href: kurang.length === 1 ? `cpmk.html?kode=${encodeURIComponent(kurang[0].m.kode)}` : 'cpmk.html' });

  // 1b. Tinjauan RPS (115, tahap 2): MK semester terbaru yang terbuka dan boleh saya isi tetapi belum diajukan; lalu RPS yang
  //     harus direvisi hasil tinjauan (saya koordinator MK sasarannya).
  const T = d.tinjau;
  if (T?.patch && T.ringkasan) {
    const tm = semesterTinjau(T.ringkasan, T.mulai)[0];
    const perlu = tm ? mkTinjau(T.ringkasan, tm.term).filter(m => bolehTinjau({ saya: d.saya, mk, padanan: T.padanan, kelas: d.kelas, tim: d.tim || [],
      kur: m.kurikulum, kode: m.kode, ta: tm.ta, semester: tm.semester }) && ['draf', 'dikembalikan', undefined].includes(cariTinjauan(T.tinjauan, m.kurikulum, m.kode, tm.term)?.status)) : [];
    if (perlu.length) out.push({ jenis: 'tinjauan', judul: `Tinjauan RPS ${tm.term}: ${perlu.length} mata kuliah belum diajukan`,
      rinci: potong(perlu.map(m => `${m.kode} ${m.nama}`)) + '. Nilai akhir sudah keluar; isi analisis CPL, materi dan metode, penilaian, dan pembaruan materi.',
      href: `tinjauan-rps.html?term=${encodeURIComponent(tm.term)}` });
    const rm = petaRps(T.rps);
    const rev = T.tinjauan.filter(t => t.keputusan === 'revisi' && t.status === 'disetujui' && statusTindak(t, rm).kode !== 'selesai')
      .flatMap(t => Object.entries(t.rps_dasar || {}).filter(([k, v]) => !((rm.get(k)?.revisi || 0) > (+v || 0))).map(([k]) => ({ t, k })))
      .filter(({ k }) => { const [kur, kode] = k.split('|'); return !!nidn && koor(mk.find(m => m.kurikulum === kur && m.kode === kode)).includes(nidn); });
    if (rev.length) out.push({ jenis: 'tinjauan', judul: `Revisi RPS hasil tinjauan: ${rev.length} RPS perlu diperbaiki dan diajukan ulang`,
      rinci: potong(rev.map(({ t, k }) => `${k.split('|')[1]} (tinjauan ${t.kode_mk} ${t.semester} ${t.tahun_akademik}${t.data?.tenggat ? `, tenggat ${t.data.tenggat}` : ''})`)) + '.',
      href: rev.length === 1 ? `rps.html?kur=${encodeURIComponent(rev[0].k.split('|')[0])}&kode=${encodeURIComponent(rev[0].k.split('|')[1])}` : 'rps.html' });
  }

  // 2. Portofolio semester terbaru: koordinator MK -> tingkat MK; pengampu -> kelasnya sendiri
  //    (dan tingkat MK bila MK itu belum punya koordinator).
  const sem = daftarSemester(d.kelas)[0];
  if (!sem) return out;
  const butir = [];
  for (const x of mkSemester(d.kelas, d.berkas, mk, sem.ta, sem.sm)) {
    const ref = mk.find(m => m.kurikulum === x.kurikulum && m.kode === x.kode);
    const sayaKoor = !!nidn && koor(ref).includes(nidn);
    // 137: juga kelas tempat saya anggota team teaching (Penyusunan kelas).
    const kelasSaya = x.kelas.filter(c => (email && kecil(c.dosen_email) === email) || (d.tim || []).some(k => k.tahun_akademik === sem.ta
      && k.semester === sem.sm && String(k.kode_mk).toUpperCase() === String(x.kode).toUpperCase() && k.kelas === c.kelas)).map(c => c.kelas);
    if (!sayaKoor && !kelasSaya.length) continue;
    const s = str.get(`${x.kurikulum}|${x.kode}`);
    const berkas = (d.berkas || []).filter(b => b.tahun_akademik === sem.ta && b.semester === sem.sm && b.kurikulum === x.kurikulum && b.kode_mk === x.kode);
    // Bagian otomatis (RPS, CPMK, refleksi, nilai) dianggap ada: pengingatnya di tempat lain.
    const k = kelengkapan({ rps: true, cpmkLengkap: true, refleksi: true, asesmen: (s?.asesmen || []).map(a => a.nama), berkas,
      rubrikRps: d.rubrikRps?.get(`${x.kurikulum}|${x.kode}`),
      kelas: x.kelas.map(c => ({ kelas: c.kelas, nilai: true })) });
    const nMK = (sayaKoor || (!koor(ref).length && kelasSaya.length)) ? k.mk.filter(it => it.komponen && !it.ada).length : 0;
    const nKelas = k.kelas.filter(c => kelasSaya.includes(c.kelas)).map(c => [c.kelas, c.item.filter(it => it.komponen && !it.ada).length]).filter(([, n]) => n);
    if (nMK || nKelas.length) butir.push({ x, teks: `${x.kode}${[nMK ? `tingkat MK ${nMK} komponen` : '', ...nKelas.map(([kl, n]) => `kelas ${kl} ${n} komponen`)]
      .filter(Boolean).join(', ').replace(/^/, ' (')})` });
  }
  if (butir.length) out.push({ jenis: 'portofolio', judul: `Portofolio ${sem.ta} ${sem.sm}: ${butir.length} mata kuliah belum lengkap`,
    rinci: potong(butir.map(b => b.teks)) + '. Unggah materi, soal, kunci/rubrik, contoh jawaban, presensi, atau BAP.',
    href: `portofolio.html?ta=${encodeURIComponent(sem.ta)}&sm=${sem.sm}${butir.length === 1 ? `&kode=${encodeURIComponent(butir[0].x.kode)}` : ''}` });
  return out;
}
