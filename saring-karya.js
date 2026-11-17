// Saringan daftar Karya prodi (pemilik 2026-11-17: karya dosen bisa disaring menurut kerja sama, mitra, negara,
// supaya isian yang salah, misalnya negara "Japan" vs "Jepang", mudah ditemukan lalu diubah).
// Tanpa impor agar bisa dites di Node (tests/js/saring_karya.test.mjs).

const kecil = s => String(s ?? '').trim().toLowerCase();

// Nilai khusus pilihan mitra/kerja sama.
export const ADA = '__ada', TANPA = '__tanpa';

// f: {q, kategori, tahun, tingkat, negara, ks}; string kosong = semua.
//   tingkat: ADA | TANPA | kode tingkat mitra (internasional, nasional, wilayah_lokal, ...)
//   negara : teks negara apa adanya (dibandingkan tanpa beda besar-kecil huruf); TANPA = mitra tanpa negara
//   ks     : ADA | TANPA | id lkps_kerjasama
export function saringKarya(semua, f = {}) {
  const q = kecil(f.q);
  return (semua || []).filter(k => {
    const m = k.karya_mitra || [];
    if (f.kategori && k.kategori !== f.kategori) return false;
    if (f.tahun && String(k.tahun) !== String(f.tahun)) return false;
    if (f.tingkat === ADA && !m.length) return false;
    if (f.tingkat === TANPA && m.length) return false;
    if (f.tingkat && f.tingkat !== ADA && f.tingkat !== TANPA && !m.some(x => x.tingkat === f.tingkat)) return false;
    if (f.negara === TANPA && !m.some(x => !kecil(x.negara))) return false;
    if (f.negara && f.negara !== TANPA && !m.some(x => kecil(x.negara) === kecil(f.negara))) return false;
    if (f.ks === ADA && !k.kerjasama_id) return false;
    if (f.ks === TANPA && k.kerjasama_id) return false;
    if (f.ks && f.ks !== ADA && f.ks !== TANPA && String(k.kerjasama_id) !== String(f.ks)) return false;
    if (q) {
      const teks = [k.judul, ...(k.karya_penulis || []).map(p => p.dosen?.nama),
                    ...m.flatMap(x => [x.institusi, x.negara])].map(kecil).join(' ');
      if (!teks.includes(q)) return false;
    }
    return true;
  });
}

// Pilihan negara seperti tertulis (ejaan berbeda tampil terpisah), dengan jumlah karya.
// Hasil: [[teks, jumlah], ...] urut abjad; mitra tanpa negara tidak dimasukkan.
export function daftarNegara(semua) {
  const peta = new Map();
  for (const k of semua || []) {
    const ada = new Set();
    for (const x of k.karya_mitra || []) {
      const t = String(x.negara ?? '').trim();
      if (!t || ada.has(t.toLowerCase())) continue;
      ada.add(t.toLowerCase());
      const kunci = t.toLowerCase();
      const g = peta.get(kunci) || [t, 0];
      g[1]++; peta.set(kunci, g);
    }
  }
  return [...peta.values()].sort((a, b) => a[0].localeCompare(b[0], 'id'));
}
