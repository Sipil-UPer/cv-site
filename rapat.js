// Rapat dan notulen terstruktur (pemilik 2026-11-12; 62-patch-rapat.sql). Logika tanpa
// peramban: jenis rapat dan unsur butir yang disarankan, tindak lanjut (Pengingat,
// Monitoring), isi notulen Word, token daftar hadir. Dipakai rapat.html, hadir.html,
// pengingat.html, monitoring.html.
import { selisihHari, tglID } from './masa-berlaku.js?v=2026-11-13-40e042';
import { para, run, judul, teks, tabel, buatDocx } from './docx-dasar.js?v=2026-11-13-40e042';

// Unsur butir yang meminta notulen/berita acara rapat (label dari unsur-butir.js UNSUR_BUTIR,
// diperiksa 2026-11-12). Saran saja: admin memilih saat menautkan notulen sebagai bukti.
export const JENIS_RAPAT = [
  { id: 'rapat_prodi', nama: 'Rapat prodi', saran: [] },
  { id: 'tinjau_vmts', nama: 'Tinjau ulang VMTS', saran: [[1, 4], [2, 1]] },
  { id: 'kurikulum', nama: 'Lokakarya / FGD kurikulum', saran: [[13, 2]] },
  { id: 'tinjauan_cpl', nama: 'Tinjauan CPL', saran: [[13, 9], [14, 5], [14, 6], [14, 7]] },
  { id: 'tinjauan_rps', nama: 'Tinjauan RPS', saran: [[15, 5], [15, 6], [15, 7], [15, 8]] },
  { id: 'k3l', nama: 'Tinjauan K3L', saran: [[39, 4]] },
  { id: 'rtm', nama: 'Rapat Tinjauan Manajemen (RTM)', saran: [[53, 4]] },
  { id: 'kinerja', nama: 'Tinjauan hasil pengukuran kinerja', saran: [[56, 3]] },
  { id: 'kk', nama: 'Rapat kelompok keahlian', saran: [] },
  { id: 'lainnya', nama: 'Lainnya', saran: [] },
];
export const jenisRapat = id => JENIS_RAPAT.find(j => j.id === id) || JENIS_RAPAT[JENIS_RAPAT.length - 1];
export const STATUS_TINDAK = { terbuka: 'Terbuka', proses: 'Dalam proses', selesai: 'Selesai', batal: 'Batal' };
export const PERAN_PESERTA = { pimpinan: 'Pimpinan rapat', notulis: 'Notulis', narasumber: 'Narasumber', peserta: 'Peserta' };
export const HARI_TINDAK = 14;     // pengingat mulai 14 hari sebelum tenggat (sama dengan hibah)
export const HARI_LEWAT = 365;
export { tglID };

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
/** "Kamis, 12 November 2026" dari "2026-11-12". */
export function tanggalPanjang(iso){
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return `${HARI[d.getUTCDay()]}, ${+m[3]} ${BULAN[+m[2] - 1]} ${m[1]}`;
}
const jam = t => String(t || '').slice(0, 5);
export const waktuRapat = r => [jam(r.mulai), jam(r.selesai)].filter(Boolean).join('–') + (r.mulai ? ' WIB' : '');

/** Token daftar hadir: 40 karakter heksadesimal acak (rapat.token_hadir, >= 32). */
export function tokenBaru(acak = crypto.getRandomValues.bind(crypto)){
  return [...acak(new Uint8Array(20))].map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Tindak lanjut yang masih harus dikerjakan, dengan selisih hari ke tenggat. */
export function tindakTerbuka(tindak, kini = new Date()){
  return (tindak || []).filter(t => t.status === 'terbuka' || t.status === 'proses')
    .map(t => ({ ...t, hari: t.tenggat ? selisihHari(String(t.tenggat).slice(0, 10), kini) : null }))
    .sort((a, b) => (a.hari ?? 1e9) - (b.hari ?? 1e9));
}

/**
 * Penerima pengingat: PJ (dosen berpemail) dari tindak lanjut terbuka yang lewat tenggat (<= 365 hari)
 * atau <= 14 hari lagi. tindak: baris dengan rapat {judul, tanggal} dan pj {nama, email}.
 * Hasil { penerima: [{nama, email, rinci}], tanpaEmail: [tindak] }.
 */
export function penerimaTindak(tindak, kini = new Date()){
  const per = new Map(), tanpaEmail = [];
  for (const t of tindakTerbuka(tindak, kini)) {
    if (t.hari == null || t.hari > HARI_TINDAK || t.hari < -HARI_LEWAT) continue;
    const e = t.pj?.email;
    if (!e) { tanpaEmail.push(t); continue; }
    if (!per.has(e)) per.set(e, { nama: t.pj.nama || e, email: e, b: [] });
    per.get(e).b.push(`- ${t.keputusan} (rapat "${t.rapat?.judul || ''}" ${tglID(String(t.rapat?.tanggal || '').slice(0, 10))}; `
      + `tenggat ${tglID(String(t.tenggat).slice(0, 10))}, ${t.hari < 0 ? `lewat ${-t.hari} hari` : t.hari === 0 ? 'hari ini' : `${t.hari} hari lagi`})`);
  }
  return { penerima: [...per.values()].map(p => ({ nama: p.nama, email: p.email, rinci: p.b.join('\n') })), tanpaEmail };
}

/** Ringkasan Monitoring: jumlah per status dan yang lewat tenggat. */
export function ringkasTindak(tindak, kini = new Date()){
  const n = k => (tindak || []).filter(t => t.status === k).length;
  const buka = tindakTerbuka(tindak, kini);
  return { terbuka: n('terbuka'), proses: n('proses'), selesai: n('selesai'), batal: n('batal'),
    lewat: buka.filter(t => t.hari != null && t.hari < 0).length, buka };
}

/** Saran unsur untuk menautkan notulen sebagai bukti: [{butir, unsur, label}] dari UNSUR_BUTIR. */
export function saranBukti(jenis, UNSUR_BUTIR){
  return jenisRapat(jenis).saran.map(([b, u]) => ({ butir: b, unsur: u, label: UNSUR_BUTIR?.[String(b)]?.unsur?.[u] || '' }));
}

/**
 * Isi <w:body> notulen. R = rapat, peserta = rapat_peserta, tindak = rapat_tindak (pj_nama terisi),
 * o = { prodi, institusi }.
 */
export function isiNotulen(R, peserta, tindak, o = {}){
  const out = [];
  const kop = [o.prodi, o.institusi].filter(Boolean).join(' · ');
  if (kop) out.push(para(run(kop.toUpperCase(), { b: true, sz: 20 }), { jc: 'center', after: 60 }));
  out.push(para(run('NOTULEN RAPAT', { b: true, sz: 28 }), { jc: 'center', after: 40 }));
  out.push(para(run(R.judul || '', { b: true }), { jc: 'center', after: 200 }));
  const hadir = (peserta || []).filter(p => p.hadir !== false);
  out.push(tabel([['Hari, tanggal', tanggalPanjang(R.tanggal)], ['Waktu', waktuRapat(R) || '—'], ['Tempat', R.tempat || '—'],
    ['Jenis rapat', jenisRapat(R.jenis).nama], ['Pimpinan rapat', R.pimpinan || '—'], ['Notulis', R.notulis || '—'],
    ['Jumlah hadir', `${hadir.length} orang`]]));
  out.push(judul('Peserta', 1));
  out.push(hadir.length ? tabel([['No', 'Nama', 'Instansi / peran', 'Kehadiran'], ...hadir.map((p, i) => [String(i + 1), p.nama,
    [p.instansi, PERAN_PESERTA[p.peran] && p.peran !== 'peserta' ? PERAN_PESERTA[p.peran] : ''].filter(Boolean).join(', ') || (p.dosen_id ? 'Dosen' : '—'),
    p.cara === 'daring' ? 'daftar hadir daring' : 'dicatat'])]) : teks('Belum ada peserta tercatat.'));
  out.push(judul('Agenda', 1));
  String(R.agenda || '—').split('\n').forEach(b => out.push(teks(b)));
  out.push(judul('Pembahasan', 1));
  String(R.pembahasan || '—').split('\n').forEach(b => out.push(teks(b)));
  out.push(judul('Keputusan dan tindak lanjut', 1));
  const ts = [...(tindak || [])].sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
  out.push(ts.length ? tabel([['No', 'Keputusan / tindak lanjut', 'Penanggung jawab', 'Tenggat', 'Status'], ...ts.map((t, i) => [String(i + 1), t.keputusan,
    t.pj_nama || '—', t.tenggat ? tglID(String(t.tenggat).slice(0, 10)) : '—', STATUS_TINDAK[t.status] || t.status])]) : teks('Tidak ada keputusan tercatat.'));
  out.push(para(run(''), { before: 240 }));
  // Kotak tanda tangan: dua baris kosong sebagai ruang tanda tangan (docx-dasar tidak memecah baris di dalam sel).
  out.push(tabel([['Pimpinan rapat', 'Notulis'], ['', ''], ['', ''], [R.pimpinan || '(………………………)', R.notulis || '(………………………)']]));
  out.push(para(run(`Notulen disusun dari situs kinerja program studi${R.status === 'draf' ? ' (DRAF, belum final)' : ''}.`,
    { i: true, sz: 16, warna: '555555' }), { before: 200 }));
  return out.join('');
}
export const buatNotulen = (R, peserta, tindak, o) => buatDocx(isiNotulen(R, peserta, tindak, o));
export const namaBerkasNotulen = R => `Notulen_${String(R.tanggal || '').slice(0, 10)}_${String(R.judul || 'rapat')
  .normalize('NFD').replace(/[^\w]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60)}.docx`;
