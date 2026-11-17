// Rekap seminar/sidang TA dan beban dosen (94-patch-jadwal-ta.sql, pemilik 2026-11-17). Dipakai rekap-ta.html.
// Periode memakai {tahun, bulan} dari tanggal jadwal, sama dengan saringan TS di sdgs-unduh.js.

export const TAHAP = [['seminar_proposal', 'Seminar proposal'], ['seminar_kemajuan', 'Seminar kemajuan'], ['sidang_akhir', 'Sidang akhir']];
export const STATUS = { terjadwal: 'Terjadwal', selesai: 'Selesai', ditunda: 'Ditunda', batal: 'Batal' };
export const HASIL = { lulus: 'Lulus', lulus_revisi: 'Lulus dengan revisi', mengulang: 'Mengulang' };

export const waktuJadwal = r => { const m = String(r.tanggal || '').match(/^(\d{4})-(\d{2})/); return m ? { tahun: +m[1], bulan: +m[2] } : { tahun: 0, bulan: 0 }; };
const daftar = v => (Array.isArray(v) ? v : String(v || '').split(';')).map(x => String(x).trim()).filter(Boolean);

// Angka per tahap (yang tidak batal) dan beban per dosen (NIDN -> nama). Hanya jadwal selesai yang dihitung sebagai beban
// bila hanyaSelesai; bawaan menghitung semua yang tidak batal (terjadwal ikut, karena tugasnya sudah ditetapkan).
export function rekapTA(rows, dosen = {}, { hanyaSelesai = false } = {}){
  const xs = rows.filter(r => r.status !== 'batal' && (!hanyaSelesai || r.status === 'selesai'));
  const tahap = Object.fromEntries(TAHAP.map(([k]) => [k, { semua: 0, selesai: 0, terjadwal: 0 }]));
  const per = new Map();
  const tambah = (nidn, peran, t) => {
    const x = per.get(nidn) || { nidn, nama: dosen[nidn] || nidn, bimbing: 0, uji: 0,
      ...Object.fromEntries(TAHAP.flatMap(([k]) => [[`bimbing_${k}`, 0], [`uji_${k}`, 0]])) };
    x[peran]++; x[`${peran}_${t}`]++; per.set(nidn, x);
  };
  for (const r of xs) {
    const t = tahap[r.tahap]; if (!t) continue;
    t.semua++; if (r.status === 'selesai') t.selesai++; else if (r.status === 'terjadwal') t.terjadwal++;
    daftar(r.pembimbing).forEach(n => tambah(n, 'bimbing', r.tahap));
    daftar(r.penguji).forEach(n => tambah(n, 'uji', r.tahap));
  }
  return { tahap, jumlah: xs.length, dosen: [...per.values()].sort((a, b) => (b.bimbing + b.uji) - (a.bimbing + a.uji) || a.nama.localeCompare(b.nama)) };
}

// Lembar Excel (admin; memuat NIM): Jadwal, Beban dosen.
export function lembarTA(rows, dosen = {}, tsTeks = () => ''){
  const nm = xs => daftar(xs).map(n => dosen[n] || n).join('; ');
  const lbl = k => (TAHAP.find(t => t[0] === k) || [, k])[1];
  const L = { Jadwal: [['No', 'Tanggal', 'Jam', 'Tahap', 'Nama', 'NIM', 'Judul', 'Pembimbing', 'Penguji', 'Penguji luar', 'Ruang', 'Status', 'Hasil', 'TS']],
    'Beban dosen': [['Dosen', 'NIDN', 'Membimbing', ...TAHAP.map(([, l]) => `Bimbing: ${l}`), 'Menguji', ...TAHAP.map(([, l]) => `Uji: ${l}`)]] };
  [...rows].sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal))).forEach((r, i) => L.Jadwal.push([i + 1, r.tanggal || '', r.jam || '',
    lbl(r.tahap), r.nama_mahasiswa || '', r.nim || '', r.judul || '', nm(r.pembimbing), nm(r.penguji), r.penguji_luar || '', r.ruang || '',
    STATUS[r.status] || r.status || '', HASIL[r.hasil] || '', tsTeks(r)]));
  rekapTA(rows, dosen).dosen.forEach(d => L['Beban dosen'].push([d.nama, d.nidn, d.bimbing, ...TAHAP.map(([k]) => d[`bimbing_${k}`]),
    d.uji, ...TAHAP.map(([k]) => d[`uji_${k}`])]));
  return L;
}

// ---------- Revisi setelah seminar/sidang (95-patch-revisi-ta.sql) ----------
export const HARI_REVISI = 14;   // pengingat mulai 14 hari sebelum batas (sama dengan HARI_DEKAT temuan AMI)
const hariKe = (tgl, kini) => Math.round((Date.parse(tgl + 'T00:00:00Z') - Date.parse(kini.toISOString().slice(0, 10) + 'T00:00:00Z')) / 864e5);

// Revisi yang belum selesai: hasil lulus_revisi, revisi_selesai kosong. hari = sisa hari ke batas (negatif = lewat; null = tanpa batas).
export function revisiBerjalan(rows, kini = new Date()){
  return (rows || []).filter(r => r.hasil === 'lulus_revisi' && !r.revisi_selesai && r.status !== 'batal')
    .map(r => ({ ...r, hari: r.batas_revisi ? hariKe(r.batas_revisi, kini) : null }))
    .sort((a, b) => (a.hari ?? 1e9) - (b.hari ?? 1e9));
}

// Penerima email pengingat: mahasiswa (email kampus dari pengajuan) dan pembimbing (dikumpulkan per dosen).
// Hanya revisi yang batasnya sudah lewat atau tinggal <= hariDekat. dosen = NIDN -> {nama, email}; email = jadwal id -> email mahasiswa.
export function penerimaRevisi(rows, dosen = {}, email = new Map(), kini = new Date(), hariDekat = HARI_REVISI){
  const xs = revisiBerjalan(rows, kini).filter(r => r.hari != null && r.hari <= hariDekat);
  const lbl = k => (TAHAP.find(t => t[0] === k) || [, 'TA'])[1].toLowerCase();
  const teks = r => `- ${r.nama_mahasiswa}: revisi ${lbl(r.tahap)} "${r.judul}", batas ${r.batas_revisi}`
    + (r.hari < 0 ? ` (lewat ${-r.hari} hari)` : r.hari === 0 ? ' (hari ini)' : ` (${r.hari} hari lagi)`);
  const out = [], tanpaEmail = [], per = new Map();
  for (const r of xs) {
    const e = email.get(r.id);
    if (e) out.push({ nama: r.nama_mahasiswa, email: e, rinci: teks(r) }); else tanpaEmail.push(r);
    for (const n of r.pembimbing || []) {
      const d = dosen[n]; if (!d?.email) continue;
      if (!per.has(d.email)) per.set(d.email, { nama: d.nama, email: d.email, baris: [] });
      per.get(d.email).baris.push(teks(r));
    }
  }
  return { penerima: [...out, ...[...per.values()].map(p => ({ nama: p.nama, email: p.email, rinci: p.baris.join('\n') }))], tanpaEmail };
}
