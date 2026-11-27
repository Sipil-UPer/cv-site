// Daftar mahasiswa (pemilik 2026-11-26): satu daftar mahasiswa aktif (unggahan SIAKAD per semester, 186) dan lulusan
// (periode yudisium, 187), dengan IPK/SKS terakhir, email, dosen wali, dan riwayat TA. Akses mengikuti RLS tabel
// mahasiswa (admin, Kaprodi, pimpinan: semua; dosen wali: mahasiswa walinya). Fungsi murni; halaman: daftar-mahasiswa.html.
import { urutSemester, teksSm } from './perwalian.js?v=2026-11-27-50c79d';

export const STATUS_MHS = { aktif: 'Aktif', lulus: 'Lulus', tidak_aktif: 'Tidak tercatat aktif' };
const TAHAP = { seminar_proposal: 'Seminar proposal', seminar_kemajuan: 'Seminar kemajuan', sidang_akhir: 'Sidang akhir' };
const t = s => String(s ?? '').trim();
const BULAN = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
/** '2025-08' -> 'Agustus 2025'. */
export const teksPeriode = p => (/^\d{4}-\d{2}$/.test(t(p)) ? `${BULAN[+p.slice(5)]} ${p.slice(0, 4)}` : t(p));

/**
 * Satu baris per NIM. mahasiswa: [{nim, nama, email, angkatan, lulus_periode}]; semester: [{nim, ts, semester, sks_total,
 * ipk, wali_id}]; dosen: [{id, nidn, nama}]; jadwal: [{nim, tahap, tanggal, status, hasil, pembimbing[], pembimbing_luar}].
 * Status: lulus (lulus_periode terisi) | aktif (tercatat pada semester terbaru yang diunggah) | tidak_aktif (selain itu).
 * IPK/SKS/wali dari semester terakhir mahasiswa itu; TA = jadwal terakhir (tanggal) mahasiswa itu yang tidak batal.
 */
export function susunDaftar({ mahasiswa = [], semester = [], dosen = [], jadwal = [] } = {}){
  const perId = new Map(dosen.map(d => [d.id, d.nama])), perNidn = new Map(dosen.filter(d => d.nidn).map(d => [d.nidn, d.nama]));
  const smNim = new Map();
  for (const s of semester) {
    const k = urutSemester({ ts: +s.ts, sm: s.semester });
    const lama = smNim.get(s.nim);
    if (!lama || k > lama.k) smNim.set(s.nim, { k, s });
  }
  const terbaru = Math.max(0, ...[...smNim.values()].map(x => x.k));
  const taNim = new Map();
  for (const j of jadwal) {
    const nim = t(j.nim).toUpperCase();
    if (!nim || j.status === 'batal') continue;
    const lama = taNim.get(nim);
    if (!lama || String(j.tanggal) > String(lama.tanggal)) taNim.set(nim, j);
  }
  return mahasiswa.map(m => {
    const x = smNim.get(m.nim), s = x?.s, j = taNim.get(t(m.nim).toUpperCase());
    const status = t(m.lulus_periode) ? 'lulus' : x && x.k === terbaru ? 'aktif' : 'tidak_aktif';
    const pb = j ? [...(j.pembimbing || []).map(n => perNidn.get(n) || n), ...(t(j.pembimbing_luar) ? [t(j.pembimbing_luar)] : [])] : [];
    return {
      nim: m.nim, nama: t(m.nama), email: t(m.email), angkatan: m.angkatan ?? null, status,
      lulus_periode: t(m.lulus_periode) || null,
      semester_terakhir: s ? teksSm({ ts: +s.ts, sm: s.semester }) : '',
      ipk: s?.ipk == null ? null : +s.ipk, sks: s?.sks_total == null ? null : +s.sks_total,
      wali: s?.wali_id ? perId.get(s.wali_id) || '' : '',
      ta: j ? { tahap: TAHAP[j.tahap] || j.tahap, tanggal: String(j.tanggal || '').slice(0, 10), status: j.status, hasil: j.hasil || '',
                pembimbing: pb } : null,
    };
  }).sort((a, b) => (b.angkatan ?? 0) - (a.angkatan ?? 0) || a.nim.localeCompare(b.nim));
}

/** Saring: q (NIM/nama, tanpa beda huruf besar), angkatan, status, tahunLulus (tahun periode yudisium). */
export function saringDaftar(xs, { q = '', angkatan = '', status = '', tahunLulus = '' } = {}){
  const kata = t(q).toLowerCase();
  return xs.filter(x => (!kata || x.nim.toLowerCase().includes(kata) || x.nama.toLowerCase().includes(kata))
    && (!angkatan || String(x.angkatan) === String(angkatan)) && (!status || x.status === status)
    && (!tahunLulus || String(x.lulus_periode || '').slice(0, 4) === String(tahunLulus)));
}

/** Ringkasan untuk kartu angka: jumlah per status dan per angkatan (aktif). */
export function ringkasDaftar(xs){
  const n = k => xs.filter(x => x.status === k).length;
  return { semua: xs.length, aktif: n('aktif'), lulus: n('lulus'), tidak_aktif: n('tidak_aktif') };
}

/** Lembar Excel (data pribadi: NIM, email, IPK) untuk admin/Kaprodi/dosen wali; juga daftar sasaran tracer study. */
export function lembarDaftar(xs){
  const L = [['No', 'NIM', 'Nama', 'Email', 'Angkatan', 'Status', 'Periode yudisium', 'Semester terakhir', 'IPK', 'SKS',
    'Dosen wali', 'TA terakhir', 'Tanggal TA', 'Pembimbing TA']];
  xs.forEach((x, i) => L.push([i + 1, x.nim, x.nama, x.email, x.angkatan ?? '', STATUS_MHS[x.status], teksPeriode(x.lulus_periode),
    x.semester_terakhir, x.ipk ?? '', x.sks ?? '', x.wali, x.ta?.tahap || '', x.ta?.tanggal || '', (x.ta?.pembimbing || []).join('; ')]));
  return L;
}
