// Pengingat pembaruan karya dan profil dosen (pemilik 2026-11-12). Dipakai pengingat.html;
// pengiriman manual. Admin tidak melihat draf dosen (41-patch-draf-karya.sql), jadi rincian
// karya hanya memuat karya yang sudah diajukan.

const JENIS = { publikasi: 'publikasi', penelitian: 'penelitian', pkm: 'PkM', luaran: 'luaran' };
const MAKS_JUDUL = 5;

// Isian profil yang diingatkan bila kosong (pemilik 2026-11-12).
export const ISIAN_PROFIL_WAJIB = [
  ['sinta_id', 'SINTA ID'], ['orcid', 'ORCID'], ['scopus_id', 'Scopus ID (bila sudah punya)'],
  ['jabatan', 'Jabatan akademik'], ['riwayat_pendidikan', 'Riwayat pendidikan'], ['topik_keahlian', 'Topik keahlian'],
];
const kosong = v => v == null || (Array.isArray(v) ? !v.length : !String(v).trim());
// Dosen aktif ber-email, bukan asesor, dan bukan staf non-DTPS (admin staf: dtps = false; patch 16).
const dituju = d => d && d.email && d.aktif !== false && d.peran !== 'asesor' && d.dtps !== false;

/** Label isian profil yang masih kosong. Kolom yang tidak ada di baris (patch belum dijalankan) dilewati. */
export const kurangProfil = d => ISIAN_PROFIL_WAJIB.filter(([k]) => k in d && kosong(d[k])).map(([, l]) => l);

/** Penerima "Mohon lengkapi profil": hanya dosen yang profilnya kurang. */
export const penerimaProfil = dosen => (dosen || []).filter(dituju)
  .map(d => ({ d, kurang: kurangProfil(d) })).filter(x => x.kurang.length)
  .map(({ d, kurang }) => ({ nama: d.nama, email: d.email, rinci: kurang.map(l => `- ${l}`).join('\n') }));

const daftarJudul = xs => xs.slice(0, MAKS_JUDUL).map(k => `  - ${k.judul}${k.catatan ? ` (catatan admin: ${k.catatan})` : ''}`)
  .concat(xs.length > MAKS_JUDUL ? [`  - dan ${xs.length - MAKS_JUDUL} lainnya`] : []);
const ringkasTahun = (xs, th) => {
  const ys = xs.filter(k => +k.tahun === th);
  const n = Object.entries(JENIS).map(([k, l]) => [l, ys.filter(x => x.kategori === k).length]).filter(([, c]) => c);
  return `${th}: ${n.length ? n.map(([l, c]) => `${c} ${l}`).join(', ') : 'belum ada'}`;
};

/**
 * Rincian karya satu dosen. karya = baris {id, judul, tahun, kategori, status, bukti_url, catatan,
 * karya_penulis: [{dosen_id}]}; berBukti = Set id karya yang punya karya_bukti.
 */
export function rincianKarya(dosenId, karya, berBukti, kini = new Date()){
  const th = kini.getFullYear();
  const milik = (karya || []).filter(k => k.status !== 'draf' && (k.karya_penulis || []).some(p => p.dosen_id === dosenId));
  const sah = milik.filter(k => k.status === 'terverifikasi' || k.status === 'diajukan');
  const tanpaBukti = milik.filter(k => k.status === 'terverifikasi' && !k.bukti_url && !berBukti.has(k.id));
  const menunggu = milik.filter(k => k.status === 'diajukan');
  const ditolak = milik.filter(k => k.status === 'ditolak');
  const baris = [`- Karya tercatat ${ringkasTahun(sah, th)}; ${ringkasTahun(sah, th - 1)}.`];
  if (menunggu.length) baris.push(`- Menunggu verifikasi admin: ${menunggu.length} karya.`);
  if (tanpaBukti.length) baris.push(`- Terverifikasi tetapi belum ada buktinya (mohon unggah):`, ...daftarJudul(tanpaBukti));
  if (ditolak.length) baris.push(`- Dikembalikan untuk diperbaiki:`, ...daftarJudul(ditolak));
  return { teks: baris.join('\n'), tanpaBukti: tanpaBukti.length, ditolak: ditolak.length, menunggu: menunggu.length };
}

/** Penerima "Mohon perbarui karya": semua dosen aktif (bukan asesor) yang punya email. */
export function penerimaKarya(dosen, karya, berBukti, kini = new Date()){
  return (dosen || []).filter(dituju).map(d => ({ nama: d.nama, email: d.email, rinci: rincianKarya(d.id, karya, berBukti, kini).teks }));
}

/** Ganti penanda di subjek/isi email. */
export const isiPola = (pola, p, { situs = '', prodi = '' } = {}) => String(pola)
  .replaceAll('{nama}', p.nama || '').replaceAll('{rinci}', p.rinci || '').replaceAll('{situs}', situs).replaceAll('{prodi}', prodi);
