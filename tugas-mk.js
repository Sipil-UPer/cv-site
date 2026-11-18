// Tugas saya untuk koordinator MK dan pengampu kelas (pemilik 2026-11-17; OBE O2 dan O3).
// Hanya yang belum punya pengingat lain: CPMK/RPS (cpmk.html) dan unggahan portofolio (portofolio.html).
// Berkas nilai CPL dan refleksi evaluasi sudah diingatkan tugas-saya.js / evaluasi-pembelajaran.js.
import { periksaStruktur } from './templat-cpl.js?v=2026-11-18-394409';
import { cplMK, dataTemplat, statusStruktur } from './cpmk.js?v=2026-11-18-394409';
import { kelengkapan, mkSemester, daftarSemester } from './portofolio.js?v=2026-11-18-394409';

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
    const xs = [st === 'kosong' ? 'CPMK belum diisi' : st === 'belum' ? 'CPMK belum lengkap' : '', m.rps_url ? '' : 'RPS belum ada'].filter(Boolean);
    return xs.length ? { m, teks: `${m.kode} ${m.nama}: ${xs.join(', ')}` } : null;
  }).filter(Boolean);
  if (kurang.length) out.push({ jenis: 'cpmk', judul: `CPMK dan RPS: ${kurang.length} mata kuliah yang Anda koordinasikan belum lengkap`,
    rinci: potong(kurang.map(x => x.teks)) + '.',
    href: kurang.length === 1 ? `cpmk.html?kode=${encodeURIComponent(kurang[0].m.kode)}` : 'cpmk.html' });

  // 2. Portofolio semester terbaru: koordinator MK -> tingkat MK; pengampu -> kelasnya sendiri
  //    (dan tingkat MK bila MK itu belum punya koordinator).
  const sem = daftarSemester(d.kelas)[0];
  if (!sem) return out;
  const butir = [];
  for (const x of mkSemester(d.kelas, d.berkas, mk, sem.ta, sem.sm)) {
    const ref = mk.find(m => m.kurikulum === x.kurikulum && m.kode === x.kode);
    const sayaKoor = !!nidn && koor(ref).includes(nidn);
    const kelasSaya = x.kelas.filter(c => email && kecil(c.dosen_email) === email).map(c => c.kelas);
    if (!sayaKoor && !kelasSaya.length) continue;
    const s = str.get(`${x.kurikulum}|${x.kode}`);
    const berkas = (d.berkas || []).filter(b => b.tahun_akademik === sem.ta && b.semester === sem.sm && b.kurikulum === x.kurikulum && b.kode_mk === x.kode);
    // Bagian otomatis (RPS, CPMK, refleksi, nilai) dianggap ada: pengingatnya di tempat lain.
    const k = kelengkapan({ rps: true, cpmkLengkap: true, refleksi: true, asesmen: (s?.asesmen || []).map(a => a.nama), berkas,
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
