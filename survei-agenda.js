// Siapkan survei dari Agenda tugas (pemilik 2026-11-27): agenda survei (191, isi awal jadwal survei pemangku) menjadi
// draf survei di Kelola survei dengan templat yang sesuai dan tanggal buka-tutup dari agenda. Fungsi murni.

const ta = ts => `${ts - 1}/${ts}`;
/** TS dari tanggal ISO: bulan >= 9 masuk TS tahun berikutnya. */
export const tsTanggal = iso => { const m = /^(\d{4})-(\d{2})/.exec(String(iso || '')); return m ? (+m[2] >= 9 ? +m[1] + 1 : +m[1]) : null; };

/**
 * Kelompok dan jenis templat dari judul agenda. Hanya agenda yang judulnya diawali "Survei".
 * Hasil [{kelompok, jenis: 'kepuasan' | 'kurikulum'}]; [] bila tidak dikenali (pilih sendiri di Kelola survei).
 */
export function tebakSurveiAgenda(judul){
  const j = String(judul || '').trim();
  if (!/^survei\b/i.test(j)) return [];
  if (/kurikulum/i.test(j) && /alumni/i.test(j) && /pengguna/i.test(j))
    return [{ kelompok: 'alumni', jenis: 'kurikulum' }, { kelompok: 'pengguna', jenis: 'kurikulum' }];
  if (/\bPEO\b|alumni\s*3/i.test(j)) return [{ kelompok: 'alumni', jenis: 'kurikulum' }];
  if (/tenaga kependidikan|\btendik\b/i.test(j)) return [{ kelompok: 'tendik', jenis: 'kepuasan' }];
  if (/\bdosen\b/i.test(j)) return [{ kelompok: 'dosen', jenis: 'kepuasan' }];
  if (/\bmitra\b|industri/i.test(j)) return [{ kelompok: 'mitra', jenis: 'kepuasan' }];
  if (/\bmahasiswa\b/i.test(j)) return [{ kelompok: 'mahasiswa', jenis: 'kepuasan' }];
  if (/pengguna/i.test(j)) return [{ kelompok: 'pengguna', jenis: 'kepuasan' }];
  if (/alumni/i.test(j)) return [{ kelompok: 'alumni', jenis: 'kepuasan' }];
  return [];
}

const tambahHari = (iso, n) => { const d = new Date(String(iso).slice(0, 10) + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

/**
 * Draf survei per agenda yang masih terbuka dan belum lewat tenggatnya. survei = baris survei yang ada: draf dengan
 * kelompok dan tanggal buka yang sama ditandai sudah ada (ada_id). labelKelompok dari survei-kepuasan.js.
 * Hasil [{agenda_id, agenda, kelompok, jenis, judul, tahun_ts, mulai, selesai, ada_id}].
 */
export function drafDariAgenda(agenda = [], survei = [], { hariIni, labelKelompok = k => k } = {}){
  const out = [];
  for (const a of agenda || []) {
    if (a.status && a.status !== 'terbuka') continue;
    const selesai = a.tenggat || tambahHari(a.mulai, 30);
    if (hariIni && selesai < hariIni) continue;
    for (const t of tebakSurveiAgenda(a.judul)) {
      const ts = tsTanggal(a.mulai), nama = labelKelompok(t.kelompok).toLowerCase();
      const ada = (survei || []).find(s => s.kelompok === t.kelompok && String(s.mulai).slice(0, 10) === String(a.mulai).slice(0, 10));
      out.push({ agenda_id: a.id, agenda: a.judul, ...t, tahun_ts: ts, mulai: String(a.mulai).slice(0, 10), selesai,
        judul: `${t.jenis === 'kurikulum' ? 'Survei kurikulum' : 'Survei kepuasan'} ${nama} ${ta(ts)}`, ada_id: ada?.id ?? null });
    }
  }
  return out.sort((a, b) => a.mulai.localeCompare(b.mulai));
}
