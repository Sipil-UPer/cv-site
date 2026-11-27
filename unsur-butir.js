// UNSUR PER BUTIR — fungsi umum. Data instrumen (UNSUR, UNSUR_BUTIR, PJ_UNSUR,
// PJ_DATA, PJ_BUKTI) ada di site/instrumen/<id>/unsur-butir.js dan diekspor ulang
// dari sini; <id> ditulis tools/pilih_instrumen.py (pemilik 2026-11-24).
// Masih khusus LAM Teknik di sini: nomor butir 20/22/24 di hitungUnsur (pindah
// bersama rumus skor.html).
import { UNSUR_BUTIR, PJ_UNSUR, PJ_DATA, PJ_BUKTI } from './instrumen/lam-teknik-s1/unsur-butir.js?v=2026-11-27-80978c';
export * from './instrumen/lam-teknik-s1/unsur-butir.js?v=2026-11-27-80978c';

// Banyaknya unsur berurutan mulai unsur 1 yang ada buktinya (0-4).
export function skorUnsur(ada){
  let n = 0;
  while (n < 4 && ada.has(n + 1)) n++;
  return n;
}

// Kunci isian (b38_i, b39, ...) -> butir dan komponennya.
export const KUNCI_UNSUR = Object.fromEntries(Object.entries(UNSUR_BUTIR)
  .flatMap(([no, d]) => d.komponen.map(k => [k.kunci, { no, k }])));

// Nomor unsur yang ada buktinya untuk satu butir dari baris unsur_bukti().
export const unsurAda = (no, bukti) => new Set((bukti || [])
  .filter(b => b.tabel === 'butir' && String(b.baris_id) === String(no)).map(b => +b.unsur));

// Skor satu kunci dari bukti per unsur. Tanpa bukti sama sekali = 0
// (pemilik 2026-11-10: tidak ada isian manual lagi). null = bukan kunci
// berunsur, atau data bukti belum terbaca.
export function skorKunci(kunci, bukti){
  const x = KUNCI_UNSUR[kunci];
  if (!x || !bukti) return null;
  const ada = unsurAda(x.no, bukti);
  return ada.size ? x.k.f(ada) : 0;
}

// Dokumen peta jalan berlaku pada TS (tahun akhir TS, mis. 2026 = 2025/2026):
// mulai paling lambat TS, selesai paling cepat TS-1 (kosong = masih berlaku).
export const berlakuTS = (r, ts) =>
  (r.tahun_mulai == null || +r.tahun_mulai <= ts) && (r.tahun_selesai == null || +r.tahun_selesai >= ts - 1);

// Skor butir dari baris dan bukti per unsur.
//   no      '20' | '22' | '24'
//   mk      ref_mata_kuliah aktif (id, kode, nama, capstone)
//   peta    lkps_peta_jalan (id, jenis, judul, tahun_mulai, tahun_selesai)
//   bukti   baris unsur_bukti(): { tabel, baris_id, unsur }
// Hasil null = data belum terbaca (sebelum login / patch belum dijalankan).
// Belum ada MK capstone / dokumen peta jalan berlaku = skor 0 (pemilik 2026-11-10:
// tidak ada isian manual lagi). Lebih dari satu baris: yang terlengkap dipakai.
export function hitungUnsur(no, { mk, peta, bukti, ts }){
  const tabel = no === '20' ? 'ref_mata_kuliah' : 'lkps_peta_jalan';
  if (!bukti || (no === '20' ? !mk : !peta)) return null;
  const baris = no === '20' ? mk.filter(m => m.capstone)
    : peta.filter(r => r.jenis === (no === '22' ? 'penelitian' : 'pkm') && berlakuTS(r, ts));
  if (!baris.length) return { skor: 0, terbaik: null, rinci: [] };
  const rinci = baris.map(r => {
    const ada = new Set(bukti.filter(b => b.tabel === tabel && +b.baris_id === +r.id).map(b => +b.unsur));
    return { id: r.id, label: no === '20' ? `${r.kode || ''} ${r.nama || ''}`.trim() : r.judul || '', ada, skor: skorUnsur(ada) };
  });
  const terbaik = rinci.reduce((a, b) => (b.skor > a.skor ? b : a));
  return { skor: terbaik.skor, terbaik, rinci };
}

// Kode pihak penanggung jawab (pemilik 2026-11-10); dipakai PJ_* di folder instrumen.
//   U Universitas · F UPPS (fakultas) · P Prodi · S SPM (penjaminan mutu) · D Dosen
export const PIHAK = { U: 'Universitas', F: 'UPPS', P: 'Prodi', S: 'SPM', D: 'Dosen' };
const nama = kode => kode.map(k => PIHAK[k]).join(', ');
// Penanggung jawab satu unsur, mis. 'UPPS, Universitas'; '' bila tidak diatur.
export const pihakUnsur = (no, n) => nama(PJ_UNSUR[String(no)]?.[+n] || []);
// Semua pihak untuk satu butir (urutan PIHAK), untuk kepala kartu.
export function pihakButir(no){
  const u = PJ_UNSUR[String(no)], d = PJ_DATA[String(no)];
  const kode = new Set(u ? Object.values(u).flat() : d ? d.split(',') : []);
  return Object.keys(PIHAK).filter(k => kode.has(k)).map(k => PIHAK[k]).join(', ');
}
// Penanggung jawab bukti ke-i (0-based) yang dianjurkan untuk butir `no`; '' bila tidak diatur.
export const pihakBukti = (no, i) => nama(String(PJ_BUKTI[String(no)]?.[i] || '').split(',').filter(Boolean));
