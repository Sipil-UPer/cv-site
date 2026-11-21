// Cari waktu rapat (138-patch-cari-waktu-rapat.sql, pemilik 2026-11-21): logika murni untuk rapat.html, dites di Node
// (tests/js/cari_waktu.test.mjs). Masukan = hasil cari_waktu_rapat(): { nama, sibuk: [{ tanggal, slot_id, n, dosen? }] }.

const menit = t => { const m = String(t || '').match(/^(\d{1,2}):(\d{2})/); return m ? +m[1] * 60 + +m[2] : null; };
const jam = n => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
export const CELAH_SAMBUNG = 15;   // menit: slot dianggap bersambung bila jedanya paling lama segini (mis. pergantian jam kuliah)

/** Durasi rapat (menit) dari jam mulai-selesai formulir; bawaan 60. */
export function durasiDari(mulai, selesai, bawaan = 60){
  const a = menit(mulai), b = menit(selesai);
  return a != null && b != null && b > a ? b - a : bawaan;
}

/** Map 'tanggal|slot_id' -> { n, dosen: [] | null }. */
export const petaSibuk = sibuk => new Map((sibuk || []).map(x => [`${x.tanggal}|${x.slot_id}`, { n: x.n, dosen: x.dosen || null }]));

/**
 * Usulan waktu rapat. tanggal = tanggal hari kuliah yang dicari ('YYYY-MM-DD'); slot = slot aktif {id, mulai, selesai};
 * durasi (menit). Untuk tiap tanggal dan tiap slot awal, ambil slot bersambung sampai cukup untuk durasi; jumlah tidak bisa
 * = gabungan id dosen (bila ada, untuk pengatur jadwal) atau jumlah terbesar per slot. Waktu lewat dari 'kini'
 * ({ tanggal, menit }) dilewati. Hasil urut: tidak bisa paling sedikit, lalu tanggal, lalu jam; paling banyak maks.
 * -> [{ tanggal, mulai, selesai, n, dosen: [] | null }]
 */
export function usulanWaktu({ tanggal = [], slot = [], sibuk = [], durasi = 60, kini = null, maks = 10 } = {}){
  const ss = [...slot].map(s => ({ ...s, a: menit(s.mulai), b: menit(s.selesai) })).filter(s => s.a != null && s.b != null).sort((x, y) => x.a - y.a);
  const peta = petaSibuk(sibuk), out = [];
  for (const t of tanggal) {
    if (kini && t < kini.tanggal) continue;
    for (let i = 0; i < ss.length; i++) {
      if (kini && t === kini.tanggal && ss[i].a < kini.menit) continue;
      const awal = ss[i].a, akhir = awal + durasi;
      let j = i, ok = ss[i].b >= akhir;
      while (!ok && j + 1 < ss.length && ss[j + 1].a - ss[j].b <= CELAH_SAMBUNG) { j++; ok = ss[j].b >= akhir; }
      if (!ok) continue;
      const pakai = ss.slice(i, j + 1).map(s => peta.get(`${t}|${s.id}`)).filter(Boolean);
      const adaNama = pakai.some(x => x.dosen);
      const dosen = adaNama ? [...new Set(pakai.flatMap(x => x.dosen || []))] : null;
      out.push({ tanggal: t, mulai: jam(awal), selesai: jam(akhir), n: adaNama ? dosen.length : Math.max(0, ...pakai.map(x => x.n)), dosen });
    }
  }
  out.sort((x, y) => x.n - y.n || x.tanggal.localeCompare(y.tanggal) || x.mulai.localeCompare(y.mulai));
  // Paling banyak dua usulan per tanggal, supaya pilihan tersebar.
  const per = new Map(), pilih = [];
  for (const u of out) { const k = per.get(u.tanggal) || 0; if (k >= 2) continue; per.set(u.tanggal, k + 1); pilih.push(u); if (pilih.length >= maks) break; }
  return pilih;
}
