// Pemeriksaan jadwal seminar/sidang TA saat menjadwalkan (pemilik 2026-11-22): logika murni untuk pengajuan-mahasiswa.html,
// dites di Node (tests/js/jadwal_sidang.test.mjs). Sumber "tidak bisa":
//   * cari_waktu_rapat (138/152): berhalangan, rapat lain, dan jadwal kuliah yang sudah disahkan. Alasan tidak pernah dikirim
//     (keputusan pemilik 2026-11-20), jadi sebabnya ditulis umum: "berhalangan, mengajar, atau rapat";
//   * sidang TA lain (jadwal_ta, 94) yang diikuti dosen yang sama sebagai pembimbing atau penguji (NIDN), selain pengajuan
//     yang sedang dijadwalkan; status batal/ditunda tidak dihitung.

const keMenit = (h, m) => +h * 60 + +(m || 0);
export const jamTeks = n => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
const menitDari = t => { const m = String(t || '').match(/^(\d{1,2})[:.](\d{2})/); return m ? keMenit(m[1], m[2]) : null; };

/** Jam teks bebas -> { mulai, selesai } dalam menit, atau null. "09.00–10.30", "9:00-10:30", "09.00 s.d. 10.30", "09.00"
 *  (tanpa jam selesai: ditambah durasi menit). */
export function bacaJam(teks, durasi = 90){
  const xs = [...String(teks || '').matchAll(/(\d{1,2})[.:](\d{2})/g)].map(m => keMenit(m[1], m[2])).filter(n => n < 24 * 60);
  if (!xs.length) return null;
  const mulai = xs[0], selesai = xs.length > 1 && xs[1] > mulai ? xs[1] : mulai + durasi;
  return { mulai, selesai };
}

/** Teks jam untuk formulir dan jadwal_ta: "09.00–10.30" (bentuk placeholder formulir). */
export const formatJam = (mulai, selesai) => `${jamTeks(mulai).replace(':', '.')}–${jamTeks(selesai).replace(':', '.')}`;

const TAHAP = { seminar_proposal: 'seminar proposal', seminar_kemajuan: 'seminar kemajuan', sidang_akhir: 'sidang akhir' };
const aktif = j => !['batal', 'ditunda'].includes(j.status);

/**
 * Sidang TA lain sebagai slot sibuk. jadwal = baris jadwal_ta {pengajuan_id, tahap, tanggal, jam, status, pembimbing[], penguji[]};
 * slot = jadwal_slot aktif {id, mulai, selesai}; dosen = [{id, nidn}]; tanggal = daftar 'YYYY-MM-DD' yang dicari;
 * kecuali = id pengajuan yang sedang dijadwalkan. -> [{ tanggal, slot_id, n, dosen: [id] }]
 */
export function sibukSidang({ jadwal = [], slot = [], dosen = [], tanggal = [], kecuali = null, durasi = 90 }){
  const idNidn = new Map(dosen.filter(d => d.nidn).map(d => [String(d.nidn), d.id])), T = new Set(tanggal), out = new Map();
  for (const j of jadwal) {
    const t = String(j.tanggal || '').slice(0, 10);
    if (!T.has(t) || !aktif(j) || (kecuali != null && j.pengajuan_id === kecuali)) continue;
    const w = bacaJam(j.jam, durasi);
    if (!w) continue;
    const ids = [...new Set([...(j.pembimbing || []), ...(j.penguji || [])].map(n => idNidn.get(String(n))).filter(Boolean))];
    for (const s of slot) {
      const a = menitDari(s.mulai), b = menitDari(s.selesai);
      if (a == null || b == null || !(a < w.selesai && w.mulai < b)) continue;
      const k = `${t}|${s.id}`, x = out.get(k) || { tanggal: t, slot_id: s.id, dosen: new Set() };
      ids.forEach(i => x.dosen.add(i)); out.set(k, x);
    }
  }
  return [...out.values()].filter(x => x.dosen.size).map(x => ({ tanggal: x.tanggal, slot_id: x.slot_id, n: x.dosen.size, dosen: [...x.dosen] }));
}

/** Gabungan hasil cari_waktu_rapat dan sibukSidang per (tanggal, slot): daftar dosen digabung; tanpa nama = jumlah terbesar. */
export function gabungSibuk(a = [], b = []){
  const out = new Map();
  for (const x of [...a, ...b]) {
    const k = `${x.tanggal}|${x.slot_id}`, y = out.get(k);
    if (!y) { out.set(k, { tanggal: x.tanggal, slot_id: x.slot_id, n: x.n, dosen: x.dosen ? [...x.dosen] : null }); continue; }
    if (y.dosen && x.dosen) { y.dosen = [...new Set([...y.dosen, ...x.dosen])]; y.n = y.dosen.length; }
    else y.n = Math.max(y.n, x.n);
  }
  return [...out.values()];
}

/**
 * Siapa yang tidak bisa pada tanggal + jam yang dipilih. sibukRapat = hasil cari_waktu_rapat().sibuk (dengan dosen bila pengatur
 * jadwal); peserta = id dosen pembimbing + penguji; nama = id -> nama.
 * -> { bentrok: [{ id, nama, sebab: [teks] }], tanpaNama: jumlah terbesar bila nama tidak dikirim, tidakTerbaca: [teks] }
 */
export function periksaWaktu({ tanggal, mulai, selesai, slot = [], sibukRapat = [], jadwal = [], dosen = [], peserta = [], kecuali = null,
  nama = id => id, durasi = 90 }){
  const P = new Set(peserta), per = new Map(), tidakTerbaca = [];
  const catat = (id, s) => { if (!P.has(id)) return; const x = per.get(id) || new Set(); x.add(s); per.set(id, x); };
  const kena = slot.filter(s => { const a = menitDari(s.mulai), b = menitDari(s.selesai); return a != null && b != null && a < selesai && mulai < b; })
    .map(s => s.id);
  let tanpaNama = 0;
  for (const x of sibukRapat) {
    if (x.tanggal !== tanggal || !kena.includes(x.slot_id)) continue;
    if (x.dosen) x.dosen.forEach(id => catat(id, 'berhalangan, mengajar, atau rapat'));
    else tanpaNama = Math.max(tanpaNama, x.n);
  }
  const idNidn = new Map(dosen.filter(d => d.nidn).map(d => [String(d.nidn), d.id]));
  for (const j of jadwal) {
    if (String(j.tanggal || '').slice(0, 10) !== tanggal || !aktif(j) || (kecuali != null && j.pengajuan_id === kecuali)) continue;
    const w = bacaJam(j.jam, durasi);
    const ids = [...(j.pembimbing || []), ...(j.penguji || [])].map(n => idNidn.get(String(n))).filter(id => P.has(id));
    if (!ids.length) continue;
    if (!w) { tidakTerbaca.push(`${TAHAP[j.tahap] || 'sidang TA'} lain pada tanggal ini, jam "${j.jam || ''}" tidak terbaca`); continue; }
    if (w.mulai < selesai && mulai < w.selesai) ids.forEach(id => catat(id, `${TAHAP[j.tahap] || 'sidang TA'} lain ${formatJam(w.mulai, w.selesai)}`));
  }
  return { bentrok: [...per].map(([id, s]) => ({ id, nama: nama(id), sebab: [...s] })).sort((a, b) => String(a.nama).localeCompare(String(b.nama))),
    tanpaNama, tidakTerbaca };
}
