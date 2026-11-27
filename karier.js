// Karier (lowongan kerja/magang) dan rekrutmen asisten (202-patch-karier-asisten.sql, pemilik 2026-11-28). Fungsi murni:
// label, sisa hari, saringan lowongan, isi SK asisten untuk Surat dan SK (201), tugas untuk Tugas saya, rekap.
export const JENIS_LOWONGAN = { kerja: 'Kerja', magang: 'Magang', lainnya: 'Lainnya' };
export const SUMBER_LOWONGAN = { mitra: 'Mitra kerja sama', alumni: 'Alumni', pemangku: 'Pemangku kepentingan', dosen: 'Dosen', lainnya: 'Lainnya' };
export const STATUS_LOWONGAN = { usulan: 'Usulan (belum tayang)', tayang: 'Tayang', tutup: 'Ditutup', ditolak: 'Ditolak' };
export const JENIS_ASISTEN = { praktikum: 'Asisten praktikum', mk: 'Asisten mata kuliah' };
export const STATUS_REKRUTMEN = { draf: 'Draf', buka: 'Dibuka', tutup: 'Ditutup', selesai: 'Selesai' };
export const STATUS_LAMARAN = { masuk: 'Masuk', diterima: 'Diterima', ditolak: 'Tidak diterima', mundur: 'Mengundurkan diri' };
export const HARI_USULAN = 3;   // usulan lowongan diingatkan ke pengelola setelah 3 hari belum diputuskan

const hari = iso => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 864e5;
/** Hari dari `kini` (TTTT-BB-HH, WIB) ke tanggal iso; null bila tanggal kosong. */
export const sisaHari = (iso, kini) => (iso ? Math.round(hari(String(iso).slice(0, 10)) - hari(String(kini).slice(0, 10))) : null);
export const kiniWIB = (d = new Date()) => new Date(d.getTime() + 7 * 3600e3).toISOString().slice(0, 10);

/** Saring dan urutkan lowongan publik: jenis ('' = semua), kata dicari di judul/organisasi/bidang/lokasi. */
export function saringLowongan(xs, { jenis = '', cari = '' } = {}){
  const q = cari.trim().toLowerCase();
  return (xs || []).filter(x => (!jenis || x.jenis === jenis)
    && (!q || [x.judul, x.organisasi, x.bidang, x.lokasi].filter(Boolean).join(' ').toLowerCase().includes(q)));
}

/** Nama tempat rekrutmen: lab (praktikum) atau MK. */
export const tempatRekrutmen = (r, labNama = '', mkNama = '') =>
  r.jenis === 'praktikum' ? (labNama || r.laboratorium || 'laboratorium') : [r.kode_mk, mkNama || r.nama_mk].filter(Boolean).join(' ');

/**
 * Isi draf SK asisten untuk surat.html: {jenis:'sk', perihal, isi}. diterima = lamaran berstatus diterima (nama, nim),
 * diurutkan nama. Pertimbangan/dasar hukum ditulis penyusun; di sini hanya kerangka penetapan dan daftar nama.
 */
export function drafSkAsisten(r, diterima, o = {}){
  const tempat = tempatRekrutmen(r, o.labNama, o.mkNama);
  const sebutan = r.jenis === 'praktikum' ? `Asisten Praktikum ${tempat}` : `Asisten Mata Kuliah ${tempat}`;
  const periode = `Semester ${r.semester} Tahun Akademik ${r.tahun_akademik}`;
  const daftar = [...(diterima || [])].sort((a, b) => String(a.nama).localeCompare(String(b.nama), 'id'));
  return {
    jenis: 'sk',
    perihal: `${sebutan} ${periode}`,
    isi: ['Menimbang: (tulis pertimbangan)', 'Mengingat: (tulis dasar)', 'MEMUTUSKAN',
      `Menetapkan: mahasiswa berikut sebagai ${sebutan} ${periode}:`,
      ...daftar.map((l, i) => `${i + 1}. ${l.nama} (NIM ${l.nim})`),
      'Keputusan ini berlaku sejak tanggal ditetapkan sampai akhir semester tersebut.'].join('\n'),
  };
}

/**
 * Tugas untuk Tugas saya. lowongan = usulan yang terbaca pengelola; rekrutmen = yang boleh dikelola, dengan lamaran
 * [{status}] dan sk_surat_id; surat = penyusun surat (admin/Kaprodi) yang membuat SK. Hasil [{judul, rinci, href, hari}].
 */
export function tugasKarier({ lowongan = [], rekrutmen = [], surat = false } = {}, kini = kiniWIB()){
  const out = [];
  const usul = lowongan.filter(l => l.status === 'usulan' && l.diusulkan && -sisaHari(String(l.diusulkan).slice(0, 10), kini) >= HARI_USULAN);
  if (usul.length) out.push({ judul: `${usul.length} usulan lowongan belum diputuskan`, rinci: 'Dari alumni/mitra lewat halaman Karier; tayangkan atau tolak.',
    href: 'kelola-karier.html#lowongan', hari: null });
  for (const r of rekrutmen) {
    const xs = r.lamaran || [], masuk = xs.filter(l => l.status === 'masuk').length, diterima = xs.filter(l => l.status === 'diterima').length;
    const s = sisaHari(r.tutup, kini);
    if (masuk && s != null && s < 0) out.push({ judul: `Putuskan lamaran: ${r.judul}`, rinci: `${masuk} lamaran belum diputuskan; rekrutmen sudah ditutup.`,
      href: 'kelola-karier.html#asisten', hari: s });
    if (surat && diterima && !masuk && !r.sk_surat_id && ['tutup', 'selesai'].includes(r.status))
      out.push({ judul: `Buat SK asisten: ${r.judul}`, rinci: `${diterima} asisten diterima; SK belum dibuat di Surat dan SK.`, href: 'kelola-karier.html#asisten', hari: null });
  }
  return out;
}

/** Rekap per tahun akademik: rekrutmen, kuota, pelamar, diterima; lowongan tayang per tahun dan jenis. */
export function rekapAsisten(rekrutmen){
  const per = new Map();
  for (const r of rekrutmen || []) {
    const k = r.tahun_akademik;
    if (!per.has(k)) per.set(k, { tahun_akademik: k, rekrutmen: 0, kuota: 0, pelamar: 0, diterima: 0 });
    const x = per.get(k), ls = r.lamaran || [];
    x.rekrutmen += 1; x.kuota += +r.kuota || 0; x.pelamar += ls.length; x.diterima += ls.filter(l => l.status === 'diterima').length;
  }
  return [...per.values()].sort((a, b) => b.tahun_akademik.localeCompare(a.tahun_akademik));
}
export function rekapLowongan(xs){
  const per = new Map();
  for (const l of xs || []) {
    if (!l.tayang_pada || l.status === 'ditolak') continue;
    const k = `${String(l.tayang_pada).slice(0, 4)}|${l.jenis}`;
    if (!per.has(k)) per.set(k, { tahun: +String(l.tayang_pada).slice(0, 4), jenis: l.jenis, n: 0, dariAlumni: 0 });
    const x = per.get(k); x.n += 1; if (l.sumber === 'alumni') x.dariAlumni += 1;
  }
  return [...per.values()].sort((a, b) => b.tahun - a.tahun || a.jenis.localeCompare(b.jenis));
}
