// Ruang KP (105-patch-ruang-kp.sql, pemilik 2026-11-18): nama instansi baku, mitra kerja sama, beban bimbingan,
// dan bukti KP selesai untuk asesor. Fungsi murni; dipakai rekap-kp.html, pengajuan.html, kerja-praktik.html, data-prodi.html.
import { keadaanKP, waktuPengajuan } from './pengajuan-mhs.js?v=2026-11-19-ee7343';

// Sama dengan public.nama_instansi_kunci(): rapikan tepi, buang titik/koma, spasi tunggal, huruf kecil.
export const kunciInstansi = s => String(s ?? '').trim().replace(/[.,]/g, '').replace(/\s+/g, ' ').toLowerCase();
export const rapiNama = s => String(s ?? '').trim().replace(/\s+/g, ' ');
// Id berkas Google Drive dari tautan (/d/<id>/ atau ?id=<id>); '' bila bukan.
export const idDrive = url => {
  const m = String(url || '').match(/\/d\/([A-Za-z0-9_-]{20,})|[?&]id=([A-Za-z0-9_-]{20,})/);
  return m ? (m[1] || m[2]) : '';
};
// Tautan asesor (Akses asesor dibuka admin, Code.gs bukaLkdAsesor_): berkas privat tanpa masuk akun.
export const tautanAsesor = url => (idDrive(url) ? `lkd.html?f=${idDrive(url)}` : '');

// Usulan nama instansi untuk mahasiswa (data.json publik): mitra kerja sama dulu (nama baku), lalu tempat KP.
// Satu nama per kunci; urut abjad.
export function saranInstansi(D = {}){
  const per = new Map();
  for (const n of [...(D.kerja_sama || []).map(x => x.mitra), ...(D.tempat_kp || []).map(x => x.instansi)]) {
    const nama = rapiNama(n), k = kunciInstansi(nama);
    if (k && !per.has(k)) per.set(k, nama);
  }
  return [...per.values()].sort((a, b) => a.localeCompare(b, 'id'));
}

// Baris kp_rekap_baris() -> bentuk pengajuan untuk keadaanKP/waktuPengajuan.
export const dariRekap = r => ({ id: r.id, jenis: 'kp', status: r.status, tahap: r.tahap, dibuat: r.dibuat, pembimbing_id: r.pembimbing_id,
  data: { instansi: r.instansi, program: r.program, rencana_mulai: r.mulai || '', jawaban_instansi: r.jawaban || '' }, data_selesai: {} });

// Kuota pembimbing KP (107): baris kp_beban(ts) -> {dosen_id, nama, kuota, kuota_sendiri, beban, sisa, lebih}.
// kuota null = belum diatur (tanpa batas); lebih = beban sudah mencapai/melebihi kuota.
export const barisKuota = rows => (rows || []).map(r => ({ ...r, sisa: r.kuota == null ? null : r.kuota - r.beban,
  lebih: r.kuota != null && r.beban >= r.kuota }));
// Teks pilihan pembimbing untuk koordinator: "Nama — 2/5" (beban/kuota), "Nama — 2" bila kuota belum diatur.
export const teksPilihanPembimbing = r => `${r.nama} — ${r.beban}${r.kuota == null ? '' : '/' + r.kuota}${r.kuota != null && r.beban >= r.kuota ? ' (kuota penuh)' : ''}`;

// Tahun KP (tanggal mulai, rencana mulai, lalu tanggal pengajuan); modul ini khusus KP.
const tahunKP = p => waktuPengajuan({ ...p, jenis: 'kp' }).tahun || 0;
const berlaku = k => `${k.tahun_mulai || '…'}–${k.tahun_selesai || '…'}`;

/**
 * kp: pengajuan KP (dariRekap atau baris pengajuan_mahasiswa), dosen: [{id, nama}] (yang ikut dihitung bebannya,
 * termasuk yang belum membimbing), kerjasama: lkps_kerjasama, keputusan: kp_instansi_keputusan.
 * Hasil { tahun, instansi, dosen, rata }.
 *   tahun    [{tahun, semua, proses, berjalan, selesai, ditolak, magang}] terbaru dulu
 *   instansi [{kunci, nama, varian, mahasiswa, selesai, berjalan, ids, mitra: [...], status: mitra|usul|tidak|belum}]
 *   dosen    [{id, nama, proses, berjalan, aktif, selesai, tinggi}]; aktif = proses + berjalan;
 *            tinggi = aktif > max(2, 1,5 × rata-rata aktif dosen yang dihitung)
 */
export function rekapKP({ kp = [], dosen = [], kerjasama = [], keputusan = [] } = {}){
  const xs = kp.filter(p => p.status !== 'draf');
  // Per tahun (tahun mulai KP, lihat waktuPengajuan).
  const th = new Map();
  for (const p of xs) {
    const t = tahunKP(p), e = keadaanKP(p);
    const x = th.get(t) || { tahun: t, semua: 0, proses: 0, berjalan: 0, selesai: 0, ditolak: 0, magang: 0 };
    x.semua++; if (x[e] !== undefined) x[e]++;
    if (p.data?.program === 'magang') x.magang++;
    th.set(t, x);
  }
  // Per instansi (kunci sama = satu instansi; nama = tulisan terbanyak).
  const mitra = new Map(), putus = new Map(keputusan.map(k => [k.kunci || kunciInstansi(k.nama), k]));
  for (const k of kerjasama) {
    const kk = kunciInstansi(k.mitra);
    if (kk) mitra.set(kk, [...(mitra.get(kk) || []), { id: k.id, mitra: rapiNama(k.mitra), jenis: k.jenis || '', tingkat: k.tingkat || '', berlaku: berlaku(k) }]);
  }
  const ins = new Map();
  for (const p of xs) {
    const nama = rapiNama(p.data?.instansi), k = kunciInstansi(nama);
    if (!k || keadaanKP(p) === 'ditolak') continue;
    const x = ins.get(k) || { kunci: k, tulis: new Map(), mahasiswa: 0, selesai: 0, berjalan: 0, ids: [] };
    x.tulis.set(nama, (x.tulis.get(nama) || 0) + 1);
    x.mahasiswa++; x.ids.push(p.id);
    const e = keadaanKP(p);
    if (e === 'selesai') x.selesai++; else if (e === 'berjalan') x.berjalan++;
    ins.set(k, x);
  }
  const instansi = [...ins.values()].map(x => {
    const varian = [...x.tulis.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n);
    const m = mitra.get(x.kunci) || [];
    return { kunci: x.kunci, nama: m[0]?.mitra || varian[0], varian, mahasiswa: x.mahasiswa, selesai: x.selesai, berjalan: x.berjalan,
             ids: x.ids, mitra: m, status: m.length ? 'mitra' : (putus.get(x.kunci)?.keputusan || 'belum') };
  }).sort((a, b) => b.mahasiswa - a.mahasiswa || a.nama.localeCompare(b.nama, 'id'));
  // Beban bimbingan per dosen.
  const per = new Map(dosen.map(d => [d.id, { id: d.id, nama: d.nama, proses: 0, berjalan: 0, selesai: 0 }]));
  for (const p of xs) {
    const e = keadaanKP(p);
    if (!p.pembimbing_id || !['proses', 'berjalan', 'selesai'].includes(e)) continue;
    const d = per.get(p.pembimbing_id) || { id: p.pembimbing_id, nama: '(dosen tidak aktif)', proses: 0, berjalan: 0, selesai: 0 };
    d[e]++; per.set(p.pembimbing_id, d);
  }
  const ds = [...per.values()].map(d => ({ ...d, aktif: d.proses + d.berjalan }));
  const rata = ds.length ? ds.reduce((a, d) => a + d.aktif, 0) / ds.length : 0;
  return {
    tahun: [...th.values()].sort((a, b) => b.tahun - a.tahun),
    instansi,
    dosen: ds.map(d => ({ ...d, tinggi: d.aktif > Math.max(2, 1.5 * rata) }))
      .sort((a, b) => b.aktif - a.aktif || b.selesai - a.selesai || String(a.nama).localeCompare(String(b.nama), 'id')),
    rata: Math.round(rata * 10) / 10,
  };
}

// KP selesai sebagai bukti (koordinator, admin, asesor): pengajuan lengkap (dengan nim/nama) + berkas laporan/surat selesai.
export function buktiSelesai(kp = [], berkas = [], dosen = []){
  const nm = new Map(dosen.map(d => [d.id, d.nama]));
  return kp.filter(p => keadaanKP(p) === 'selesai').map(p => ({
    id: p.id, nim: p.nim || '', nama: p.nama || '', instansi: rapiNama(p.data?.instansi), program: p.data?.program === 'magang' ? 'Magang' : 'KP',
    tahun: tahunKP(p) || '', pembimbing: nm.get(p.pembimbing_id) || '',
    berkas: berkas.filter(b => b.pengajuan_id === p.id && ['laporan_kp', 'surat_selesai'].includes(b.jenis))
      .map(b => ({ id: b.id, jenis: b.jenis, asesor: tautanAsesor(b.url) })),
  })).sort((a, b) => (+b.tahun || 0) - (+a.tahun || 0) || a.instansi.localeCompare(b.instansi, 'id'));
}

// Pelaksanaan KP per kerja sama (kp_pelaksanaan_mitra): Map kerjasama_id -> 'teks' mis. "2025: 2 · 2026: 1 KP, 1 magang".
export function teksPelaksanaan(rows = []){
  const per = new Map();
  for (const r of rows) per.set(r.kerjasama_id, [...(per.get(r.kerjasama_id) || []), r]);
  return new Map([...per].map(([id, xs]) => [id, xs.sort((a, b) => a.tahun - b.tahun).map(r =>
    `${r.tahun}: ${[r.kp ? `${r.kp} KP` : '', r.magang ? `${r.magang} magang` : ''].filter(Boolean).join(', ')}`).join(' · ')]));
}
