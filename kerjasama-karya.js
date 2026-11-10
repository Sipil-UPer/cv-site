// Baris kerja sama LKPS 2.a.2 (penelitian) dan 2.a.3 (PkM) dari karya
// terverifikasi (pemilik 2026-11-10). Dipakai lkps.js (tabel), lkps-bukti.js
// (indeks bukti); bangun.py baris_kerjasama_karya menghitung skor butir 6
// dengan aturan yang sama (tests/test_kerjasama_karya.py dan
// tests/js/kerjasama_karya.test.mjs memakai kasus yang sama).
//
// Aturan:
//  1. Kegiatan (penelitian/PkM): satu baris untuk kerja sama induknya
//     (MoU/PKS/IA, karya.kerjasama_id) dan satu baris per mitra karya yang
//     berbeda dari mitra induk itu. TS baris = TS kegiatan.
//  2. Turunan (publikasi/luaran) DENGAN payung (karya.induk_id menunjuk
//     penelitian/PkM terverifikasi):
//       - mitra yang sama dengan mitra payung (atau mitra induk MoU payung)
//         tidak menambah baris; turunan menjadi bukti luaran kegiatan itu;
//       - mitra lain menambah satu baris per (payung, mitra), dengan judul
//         dan isian kerja sama payung; TS = TS turunan paling awal.
//  3. Turunan TANPA payung (kosong, belum terverifikasi, atau bukan
//     penelitian/PkM): satu baris per mitra di 2.a.2, judul turunan itu
//     sendiri, sampai dosen atau admin mengisi payungnya. TS = TS turunan.
// Setiap baris membawa ts; pemanggil menyaring jendela TS-nya sendiri.

export const KEGIATAN = ['penelitian', 'pkm'];
export const TURUNAN = ['publikasi', 'luaran'];

const rapi = s => String(s || '').trim().toLowerCase();
export const tsKarya = k => (+k.bulan >= 9 ? +k.tahun + 1 : +k.tahun);
const urut = (a, b) => (tsKarya(a) - tsKarya(b)) || (a.tahun - b.tahun) || String(a.judul).localeCompare(String(b.judul));

// Isian kerja sama pada karya (32-patch-isian-kerjasama.sql) didahulukan;
// kosong = data kerja sama induk (24-patch-kerjasama-induk.sql).
export const isianKS = (k, ks) => ({
  manfaat: k?.manfaat_ks || ks?.manfaat, tanggal_mulai: k?.mulai_ks || ks?.tanggal_mulai,
  tanggal_selesai: k?.selesai_ks || ks?.tanggal_selesai, jenis_bukti: k?.jenis_bukti_ks || ks?.jenis_bukti });

// semua: seluruh karya terverifikasi (dengan karya_mitra); semuaKS: Map id -> kerja sama induk.
// Hasil: daftar baris {ts, kategori, mitra, tingkat, judul, ks, karya, luaran, tanpaPayung, dariInduk}
//   karya: kegiatan (aturan 1-2) atau turunan itu sendiri (aturan 3);
//   luaran: turunan yang menjadi bukti baris ini.
export function barisKerjaSama(semua, semuaKS = new Map()) {
  const perId = new Map(semua.map(k => [k.id, k]));
  const payungDari = t => {
    const K = t.induk_id && perId.get(t.induk_id);
    return K && KEGIATAN.includes(K.kategori) ? K : null;
  };
  const turunanPer = new Map();       // kegiatan id -> turunan berpayung
  semua.filter(k => TURUNAN.includes(k.kategori)).forEach(t => {
    const K = payungDari(t);
    if (K) (turunanPer.get(K.id) || turunanPer.set(K.id, []).get(K.id)).push(t);
  });
  const baris = [];
  semua.filter(k => KEGIATAN.includes(k.kategori)).sort(urut).forEach(K => {
    const ks = semuaKS.get(K.kerjasama_id);
    const luaran = (turunanPer.get(K.id) || []).slice().sort(urut);
    const dasar = { ts: tsKarya(K), kategori: K.kategori, judul: K.judul, karya: K, luaran, tanpaPayung: false };
    // dariInduk: mitra MoU, yang skornya dihitung dari lembar Kerja sama (bangun.py).
    if (ks) baris.push({ ...dasar, mitra: ks.mitra, tingkat: ks.tingkat, ks: isianKS(K, ks), dariInduk: true });
    const sudah = new Set(ks ? [rapi(ks.mitra)] : []);
    (K.karya_mitra || []).forEach(m => {
      const n = rapi(m.institusi);
      if (!n || sudah.has(n)) return;
      sudah.add(n);
      baris.push({ ...dasar, mitra: m.institusi, tingkat: m.tingkat, ks: isianKS(K, null) });
    });
    // Aturan 2: mitra turunan yang belum ada pada kegiatan ini.
    const baru = new Map();
    luaran.forEach(t => (t.karya_mitra || []).forEach(m => {
      const n = rapi(m.institusi);
      if (!n || sudah.has(n) || baru.has(n)) return;
      baru.set(n, { ...dasar, ts: tsKarya(t), mitra: m.institusi, tingkat: m.tingkat, ks: isianKS(K, ks) });
    }));
    baris.push(...baru.values());
  });
  // Aturan 3.
  semua.filter(k => TURUNAN.includes(k.kategori) && !payungDari(k)).sort(urut).forEach(t => {
    const sudah = new Set();
    (t.karya_mitra || []).forEach(m => {
      const n = rapi(m.institusi);
      if (!n || sudah.has(n)) return;
      sudah.add(n);
      baris.push({ ts: tsKarya(t), kategori: 'penelitian', mitra: m.institusi, tingkat: m.tingkat,
        judul: t.judul, ks: isianKS(t, null), karya: t, luaran: [], tanpaPayung: true });
    });
  });
  return baris;
}
