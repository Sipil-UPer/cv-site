// Surat dan SK prodi (201-patch-surat-sk-prodi.sql, pemilik 2026-11-28). Fungsi murni: label, nomor dari pola (cermin
// surat_format_nomor untuk pratinjau; nomor sebenarnya diberikan basis data saat disahkan), isi Word umum ber-QR, tugas,
// rekap. Templat Word per jenis menyusul dari pemilik; sampai itu dipakai bentuk umum di isiSurat.
import { para, run, teks, tabel, buatDocx, gambar } from './docx-dasar.js?v=2026-11-28-e24bbe';

export const STATUS_SURAT = { draf: 'Draf', diajukan: 'Menunggu tanda tangan', dikembalikan: 'Dikembalikan', disahkan: 'Disahkan',
  dibatalkan: 'Dibatalkan', arsip: 'Arsip (ditandatangani di luar situs)' };
export const PENANDATANGAN = { kaprodi: 'Ketua Program Studi', dekan: 'Dekan' };
export const PENANDA_POLA = ['{urut}', '{kode}', '{bulan_romawi}', '{bulan}', '{tahun}'];
const ROMAWI = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

/** "2026-11-28" -> "28 November 2026". */
export function tglPanjang(iso){
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${+m[3]} ${BULAN[+m[2] - 1]} ${m[1]}` : '';
}
/** Tanggal hari ini di WIB (TTTT-BB-HH), sama dengan basis data (Asia/Jakarta). */
export const hariIniWIB = (kini = new Date()) => new Date(kini.getTime() + 7 * 3600e3).toISOString().slice(0, 10);

/** Nomor dari pola; sama persis dengan public.surat_format_nomor. */
export function formatNomor(pola, urut, lebar, kode, tanggal){
  const t = String(tanggal).slice(0, 10), bln = +t.slice(5, 7);
  return String(pola).replaceAll('{urut}', String(urut).padStart(Math.max(+lebar || 1, String(urut).length), '0'))
    .replaceAll('{kode}', kode ?? '').replaceAll('{bulan_romawi}', ROMAWI[bln - 1]).replaceAll('{bulan}', t.slice(5, 7)).replaceAll('{tahun}', t.slice(0, 4));
}
/** Galat pola (null = sah): wajib memuat {urut}; penanda lain hanya yang dikenal. */
export function galatPola(pola){
  const p = String(pola || '').trim();
  if (!p) return 'Pola nomor kosong.';
  if (!p.includes('{urut}')) return 'Pola nomor wajib memuat {urut}.';
  const asing = (p.match(/\{[^}]*\}/g) || []).filter(x => !PENANDA_POLA.includes(x));
  if (asing.length) return `Penanda tidak dikenal: ${asing.join(', ')}.`;
  if (p.length > 120) return 'Pola nomor paling panjang 120 karakter.';
  return null;
}
/** Pratinjau nomor berikutnya untuk satu jenis: urutTerakhir = surat_nomor_urut.terakhir tahun berjalan (0 bila belum ada). */
export const nomorBerikut = (j, urutTerakhir = 0, tanggal = hariIniWIB()) =>
  formatNomor(j.pola, (+urutTerakhir || 0) + 1, j.lebar_urut, j.kode_nomor || '[kode belum diatur]', tanggal);

/**
 * Isi <w:body> surat. S = versi disahkan (surat.sah) atau draf {jenis, jenis_nama, perihal, tujuan, isi, dosen:[{nama,nidn}]}.
 * o = { prodi, institusi, url (alamat verifikasi), qr (true bila gambar rIdQR disertakan), konsep (belum disahkan),
 *       penandatangan: {jabatan, nama, nip, sebutan} untuk konsep }.
 */
export function isiSurat(S, o = {}){
  const out = [], sk = S.jenis === 'sk', pt = S.penandatangan || o.penandatangan || {};
  const kop = [o.institusi, o.prodi].filter(Boolean);
  kop.forEach((k, i) => out.push(para(run(k.toUpperCase(), { b: true, sz: i ? 24 : 22 }), { jc: 'center', before: 0, after: i === kop.length - 1 ? 240 : 0 })));
  if (o.konsep) out.push(para(run('KONSEP — belum ditandatangani; nomor diberikan saat disahkan', { b: true, sz: 18, warna: 'C00000' }), { jc: 'center', after: 200 }));
  const nomor = S.nomor || '……/……/……/……';
  if (sk) {
    out.push(para(run('KEPUTUSAN', { b: true, sz: 26 }), { jc: 'center', after: 40 }));
    out.push(para(run(`${(pt.sebutan || PENANDATANGAN.dekan).toUpperCase()}`, { b: true }), { jc: 'center', after: 40 }));
    out.push(para(run(`NOMOR ${nomor}`, { b: true }), { jc: 'center', after: 160 }));
    out.push(para(run('TENTANG', { b: true }), { jc: 'center', after: 40 }));
    out.push(para(run(String(S.perihal || '').toUpperCase(), { b: true }), { jc: 'center', after: 240 }));
  } else {
    out.push(para(run(`Nomor: ${nomor}`), { jc: 'left', before: 0, after: 0 }));
    out.push(para(run(`Perihal: ${S.perihal || ''}`), { jc: 'left', before: 0, after: 200 }));
    if (S.tujuan) {
      out.push(para(run('Kepada'), { jc: 'left', before: 0, after: 0 }));
      String(S.tujuan).split('\n').forEach(b => out.push(para(run(b), { jc: 'left', before: 0, after: 0 })));
      out.push(para('', { after: 120 }));
    }
  }
  String(S.isi || '').split('\n').forEach(b => out.push(teks(b)));
  const dosen = S.dosen || [];
  if (dosen.length) {
    out.push(para(run(sk ? 'Lampiran: daftar nama' : 'Daftar nama', { b: true }), { jc: 'left', before: 200, after: 80 }));
    out.push(tabel([['No', 'Nama', 'NIDN'], ...dosen.map((d, i) => [String(i + 1), d.nama || '', d.nidn || ''])]));
  }
  // Tanda tangan (rata kanan): tanggal, jabatan, QR, nama, NIP.
  const kanan = (isi, x = {}) => para(isi, { jc: 'right', before: 0, after: 0, ...x });
  out.push(kanan(run(sk ? `Ditetapkan pada tanggal ${S.tanggal ? tglPanjang(S.tanggal) : '……'}` : (S.tanggal ? tglPanjang(S.tanggal) : '……')), { before: 360 }));
  out.push(kanan(run(pt.sebutan || PENANDATANGAN[pt.jabatan] || '')));
  out.push(o.qr ? kanan(gambar('rIdQR', 1080000, 1080000, 1, 'QR'), { before: 80, after: 80 }) : kanan(run(''), { after: 720 }));
  out.push(kanan(run(pt.nama || '(……………………………)', { b: true })));
  if (pt.nip) out.push(kanan(run(`NIP ${pt.nip}`)));
  if (o.url && o.qr) out.push(para(run(`Ditandatangani secara elektronik melalui situs program studi. Periksa keaslian dengan memindai kode QR atau membuka ${o.url}`,
    { i: true, sz: 16, warna: '555555' }), { before: 300 }));
  return out.join('');
}
/** Word surat (Blob). qrPng = Uint8Array PNG kode QR alamat verifikasi, atau null. */
export const buatSurat = (S, o, qrPng = null) => buatDocx(isiSurat(S, { ...o, qr: !!qrPng }), { gambar: qrPng ? [{ rid: 'rIdQR', png: qrPng }] : [] });
export const namaBerkasSurat = S => `${S.jenis === 'sk' ? 'SK' : 'Surat'}_${String(S.nomor || 'konsep').replace(/[^\w]+/g, '-')}_${String(S.perihal || '')
  .normalize('NFD').replace(/[^\w]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 50)}.docx`;
/** Alamat verifikasi (isi QR) dari alamat halaman ruang kerja saat ini. */
export const urlVerifikasi = (kode, dasar) => new URL(`verifikasi-surat.html?k=${kode}`, dasar).href;

/**
 * Tugas untuk Tugas saya. xs = surat yang terbaca (status diajukan/dikembalikan) dengan surat_jenis.penandatangan;
 * tanda = {kaprodi, dekan} boolean (penandatangan aktif), kelola = admin/Kaprodi.
 */
export function tugasSurat(xs, { tanda = {}, kelola = false } = {}){
  const out = [];
  for (const s of xs || []) {
    const pj = s.penandatangan || s.surat_jenis?.penandatangan;
    if (s.status === 'diajukan' && tanda[pj]) out.push({ judul: `Tanda tangani: ${s.perihal}`, rinci: `${s.surat_jenis?.nama || s.jenis} menunggu pengesahan Anda.`, href: 'surat.html#tanda' });
    if (s.status === 'dikembalikan' && kelola) out.push({ judul: `Perbaiki surat: ${s.perihal}`, rinci: s.catatan ? `Catatan: ${s.catatan}` : 'Dikembalikan penandatangan.', href: 'surat.html#agenda' });
  }
  return out;
}

// SK sebagai berkas dosen (pemilik 2026-11-28, ide 2026-11-26 "SK bundel"): satu SK menyebut banyak dosen (dosen_ids);
// tiap dosen melihat, menyaring, dan menyalin tautannya untuk BKD/SISTER, dan SK masuk CV.
/** Tahun akademik dari tanggal surat (1 September s.d. 31 Agustus): 2026-09-01 -> 2026/2027. */
export const tahunAkademikSurat = t => { const y = +String(t).slice(0, 4), m = +String(t).slice(5, 7); return m >= 9 ? `${y}/${y + 1}` : `${y - 1}/${y}`; };
/** SK/surat yang menyebut dosen: disahkan dan arsip (opsional juga dibatalkan), terbaru dulu. */
export const skDosen = (xs, dosenId, { batal = false } = {}) => (xs || [])
  .filter(s => (s.dosen_ids || []).includes(dosenId) && (['disahkan', 'arsip'].includes(s.status) || (batal && s.status === 'dibatalkan')))
  .sort((a, b) => String(b.tanggal || '').localeCompare(String(a.tanggal || '')) || String(b.nomor || '').localeCompare(String(a.nomor || '')));
/**
 * Tautan untuk BKD/SISTER: berkas akhir bertanda tangan (arsip_url) bila ada; selain itu halaman verifikasi QR (disahkan);
 * null bila tidak ada keduanya (arsip tanpa berkas) atau surat dibatalkan.
 */
export function tautanSister(s, dasar){
  if (!s || s.status === 'dibatalkan') return null;
  if (s.arsip_url) return s.arsip_url;
  return s.status === 'disahkan' && s.kode_verifikasi ? urlVerifikasi(s.kode_verifikasi, dasar) : null;
}
/** Saring daftar SK: ta = tahun akademik ('' semua), jenis ('' semua), cari di nomor/perihal. */
export const saringSk = (xs, { ta = '', jenis = '', cari = '' } = {}) => {
  const q = cari.trim().toLowerCase();
  return (xs || []).filter(s => (!ta || (s.tanggal && tahunAkademikSurat(s.tanggal) === ta)) && (!jenis || s.jenis === jenis)
    && (!q || `${s.nomor || ''} ${s.perihal || ''}`.toLowerCase().includes(q)));
};

/** Rekap per tahun x jenis: terbit (disahkan + arsip) dan dibatalkan. */
export function rekapSurat(xs, jenis = []){
  const nama = k => jenis.find(j => j.kode === k)?.nama || k, per = new Map();
  for (const s of xs || []) {
    if (!['disahkan', 'arsip', 'dibatalkan'].includes(s.status) || !s.tanggal) continue;
    const k = `${String(s.tanggal).slice(0, 4)}|${s.jenis}`;
    if (!per.has(k)) per.set(k, { tahun: +String(s.tanggal).slice(0, 4), jenis: s.jenis, nama: nama(s.jenis), terbit: 0, batal: 0 });
    per.get(k)[s.status === 'dibatalkan' ? 'batal' : 'terbit'] += 1;
  }
  return [...per.values()].sort((a, b) => b.tahun - a.tahun || a.nama.localeCompare(b.nama, 'id'));
}
