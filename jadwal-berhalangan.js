// Jadwal berhalangan dosen (132-patch-jadwal-berhalangan.sql, pemilik 2026-11-20): logika murni halaman
// jadwal-berhalangan.html, dites di Node (tests/js/jadwal_berhalangan.test.mjs).

export const HARI = [[1, 'Senin'], [2, 'Selasa'], [3, 'Rabu'], [4, 'Kamis'], [5, 'Jumat'], [6, 'Sabtu'], [7, 'Minggu']];
export const namaHari = h => (HARI.find(x => x[0] === +h) || [, ''])[1];
/** Jenis berhalangan; termasuk jadwal di luar prodi (pemilik 2026-11-20). */
export const JENIS_HALANGAN = [['prodi_lain', 'Mengajar/tugas di prodi lain'], ['institusi', 'Tugas fakultas/universitas'],
  ['luar', 'Kegiatan di luar kampus'], ['lainnya', 'Lainnya']];
export const namaJenis = j => (JENIS_HALANGAN.find(x => x[0] === j) || [, j || ''])[1];
const jam = t => String(t || '').slice(0, 5);
export const labelSlot = s => (s ? `${s.label} (${jam(s.mulai)}–${jam(s.selesai)})` : 'Sepanjang hari');

/** Hari ISO (1 = Senin ... 7 = Minggu) dari 'YYYY-MM-DD' (tanpa geser zona waktu). */
export function hariISO(tgl){
  const m = String(tgl || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay();
  return d === 0 ? 7 : d;
}

/** Periksa daftar slot sebelum disimpan admin: [{label, mulai, selesai, aktif}] -> daftar pesan galat ([] = baik). */
export function cekSlot(slot = []){
  const g = [], menit = t => { const m = String(t || '').match(/^(\d{1,2})[.:](\d{2})/); return m ? +m[1] * 60 + +m[2] : null; };
  slot.forEach((s, i) => {
    const n = `Slot ${i + 1}`, a = menit(s.mulai), b = menit(s.selesai);
    if (!String(s.label || '').trim()) g.push(`${n}: label kosong.`);
    if (a == null || b == null) g.push(`${n}: jam mulai dan selesai diisi (mis. 07.30).`);
    else if (b <= a) g.push(`${n}: jam selesai harus setelah jam mulai.`);
  });
  const aktif = slot.map((s, i) => ({ i, a: menit(s.mulai), b: menit(s.selesai), aktif: s.aktif !== false }))
    .filter(x => x.aktif && x.a != null && x.b != null).sort((x, y) => x.a - y.a);
  for (let k = 1; k < aktif.length; k++) if (aktif[k].a < aktif[k - 1].b) g.push(`Slot ${aktif[k - 1].i + 1} dan ${aktif[k].i + 1} tumpang-tindih.`);
  return g;
}

/** Kelompokkan baris mingguan per sel: Map 'hari|slot_id' -> [baris]. */
export function perSel(mingguan = []){
  const m = new Map();
  for (const r of mingguan) { const k = `${r.hari}|${r.slot_id}`; if (!m.has(k)) m.set(k, []); m.get(k).push(r); }
  return m;
}

/**
 * Cari slot kosong untuk sekelompok dosen (mis. pembimbing + penguji sidang). Hasil Map 'hari|slot_id' -> [{ dosen_id, jenis,
 * alasan, sumber: 'mingguan'|'tanggal' }] untuk dosen terpilih yang berhalangan; sel tanpa isi = semua bisa.
 * tanggal 'YYYY-MM-DD' (opsional): hanya hari itu, ditambah berhalangan tanggal itu (slot_id null = sepanjang hari).
 */
export function cariSlotKosong({ slot = [], hari = [], mingguan = [], tanggalan = [], dosen = [], tanggal = null } = {}){
  const pilih = new Set(dosen), out = new Map();
  const hs = tanggal ? [hariISO(tanggal)].filter(h => hari.includes(h)) : hari;
  for (const h of hs) for (const s of slot) out.set(`${h}|${s.id}`, []);
  for (const r of mingguan) {
    const k = `${r.hari}|${r.slot_id}`;
    if (pilih.has(r.dosen_id) && out.has(k)) out.get(k).push({ dosen_id: r.dosen_id, jenis: r.jenis, alasan: r.alasan || '', sumber: 'mingguan' });
  }
  if (tanggal) for (const r of tanggalan) {
    if (!pilih.has(r.dosen_id) || r.tanggal !== tanggal) continue;
    for (const s of slot) if (r.slot_id == null || r.slot_id === s.id) {
      const k = `${hs[0]}|${s.id}`;
      if (out.has(k) && !out.get(k).some(x => x.dosen_id === r.dosen_id && x.sumber === 'tanggal'))
        out.get(k).push({ dosen_id: r.dosen_id, jenis: r.jenis, alasan: r.alasan || '', sumber: 'tanggal' });
    }
  }
  return out;
}
