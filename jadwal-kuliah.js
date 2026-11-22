// Jadwal kuliah per semester (150-patch-jadwal-kuliah.sql, pemilik 2026-11-22): logika murni halaman jadwal-kuliah.html,
// dites di Node (tests/js/jadwal_kuliah.test.mjs). Aturan bentrok dari data.json jadwal_aturan = config.yaml schedule, sama
// dengan run_jadwal.py: dosen tidak bentrok, kelas berlabel sama satu semester paket tidak bentrok + jeda, MK pilihan satu
// kurikulum tidak saling bentrok, jam wajib kosong, berhalangan mingguan; anjuran: jam yang dihindari, batas jam dosen per hari.
// Situs menambah dua pemeriksaan yang tidak dilakukan penjalan: ruang dipakai ganda dan kelas tanpa jadwal.

export const HARI = { 1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu', 7: 'Minggu' };
export const menit = j => { const [h, m] = String(j || '').split(':').map(Number); return h * 60 + (m || 0); };
export const jam = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const jamPendek = j => String(j || '').slice(0, 5);

const kenaJendela = (w, hari, mulai, selesai) => (w.day === 'all' || +w.day === +hari) && mulai < menit(w.end) && menit(w.start) < selesai;
const teksJendela = w => `${w.day === 'all' ? 'setiap hari' : HARI[w.day]} ${w.start}–${w.end}`;

/** Lama satu pertemuan, menit: sks x menit per sks, dibulatkan ke atas ke panjang slot (pemilik 2026-11-22). */
export function durasiMenit(sks, aturan, panjangSlot = 30){
  const mps = +aturan?.minutes_per_sks || 50;
  return Math.max(1, Math.ceil((+sks || 0) * mps / panjangSlot - 1e-9)) * panjangSlot;
}

/** Masa kuliah dari Kalender akademik (148): kegiatan kategori perkuliahan yang semesternya "<Ganjil|Genap> <TA>". */
export function masaDariKalender(rows = [], ta, sm){
  const cocok = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim() === `${sm} ${ta}`.toLowerCase();
  return rows.filter(r => r.kategori === 'perkuliahan' && cocok(r.semester))
    .map(r => ({ mulai: String(r.mulai).slice(0, 10), selesai: String(r.selesai || r.mulai).slice(0, 10) }))
    .sort((a, b) => a.mulai.localeCompare(b.mulai));
}

const isoHari = t => { const d = new Date(t + 'T00:00:00Z').getUTCDay(); return d === 0 ? 7 : d; };
function tanggalAntara(a, b){
  const out = [];
  for (let t = new Date(a + 'T00:00:00Z'); t <= new Date(b + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + 1)) out.push(t.toISOString().slice(0, 10));
  return out;
}

/**
 * Berkas masukan run_jadwal.py (format jadwal-masukan-1, lihat jadwal/masukan.py). kelas/kd = baris kelas_kuliah/kelas_dosen
 * periode itu; mk = ref_mata_kuliah; jadwal = baris jadwal_kuliah; slot/hari = jadwal_slot aktif/jadwal_hari; berhalangan =
 * dosen_berhalangan periode itu; tgl = dosen_berhalangan_tgl; rentang = dosen_berhalangan_rentang (diuraikan per tanggal di
 * dalam masa kuliah, hanya hari yang dipilih); libur = tanggal hari_libur; masa = [{mulai, selesai}].
 */
export function masukanPenjadwalan({ ta, sm, kelas = [], kd = [], mk = [], dosen = [], jadwal = [], slot = [], hari = [],
  berhalangan = [], tgl = [], rentang = [], libur = [], masa = [], dibuat = new Date().toISOString() }){
  const M = new Map(mk.map(m => [`${m.kurikulum}|${m.kode}`, m]));
  const J = new Map(jadwal.map(j => [j.kelas_id, j]));
  const dalam = new Set(masa.flatMap(r => tanggalAntara(r.mulai, r.selesai)));
  const ids = new Set(kelas.flatMap(k => kd.filter(d => d.kelas_id === k.id).map(d => d.dosen_id)));
  const tanggal = [];
  for (const b of tgl) if (ids.has(b.dosen_id) && dalam.has(String(b.tanggal).slice(0, 10)))
    tanggal.push({ dosen: b.dosen_id, tanggal: String(b.tanggal).slice(0, 10), slot: b.slot_id ?? null });
  for (const r of rentang) {
    if (!ids.has(r.dosen_id)) continue;
    for (const t of tanggalAntara(String(r.mulai).slice(0, 10), String(r.selesai).slice(0, 10))) {
      if (!dalam.has(t) || (r.hari && !r.hari.includes(isoHari(t)))) continue;
      for (const s of r.slot_ids || [null]) tanggal.push({ dosen: r.dosen_id, tanggal: t, slot: s });
    }
  }
  const unik = [...new Map(tanggal.map(x => [`${x.dosen}|${x.tanggal}|${x.slot}`, x])).values()];
  return {
    format: 'jadwal-masukan-1', dibuat, tahun_akademik: ta, semester: sm, masa_kuliah: masa,
    libur: libur.map(x => String(x).slice(0, 10)).filter(t => dalam.has(t)).sort(),
    hari: [...hari].map(Number).sort((a, b) => a - b),
    slot: slot.filter(s => s.aktif !== false).sort((a, b) => menit(a.mulai) - menit(b.mulai))
      .map(s => ({ id: s.id, mulai: jamPendek(s.mulai), selesai: jamPendek(s.selesai) })),
    dosen: dosen.filter(d => ids.has(d.id)).map(d => ({ id: d.id, nama: d.nama_gelar || d.nama })),
    kelas: kelas.map(k => {
      const m = M.get(`${k.kurikulum}|${k.kode_mk}`) || {}, j = J.get(k.id);
      const pilihan = m.sifat === 'pilihan' || !m.semester;
      return { id: k.id, kurikulum: k.kurikulum, kode_mk: k.kode_mk, nama_mk: m.nama || '', sks: +m.sks || 0,
        semester_paket: pilihan ? null : +m.semester, pilihan, kelas: k.kelas,
        dosen: kd.filter(d => d.kelas_id === k.id).sort((a, b) => a.urutan - b.urutan).map(d => d.dosen_id),
        jadwal: j ? { hari: j.hari, mulai: jamPendek(j.mulai), selesai: jamPendek(j.selesai), kunci: !!j.kunci } : null };
    }),
    berhalangan: berhalangan.filter(b => ids.has(b.dosen_id)).map(b => ({ dosen: b.dosen_id, hari: b.hari, slot: b.slot_id })),
    berhalangan_tanggal: unik,
  };
}

/** Baca hasil_jadwal_*.csv dari run_jadwal.py (pemisah ;, kolom kelas_id, hari, mulai, selesai; kolom lain diabaikan). */
export function bacaCsvHasil(teks){
  const baris = String(teks || '').replace(/^﻿/, '').split(/\r?\n/).filter(x => x.trim());
  if (!baris.length) return { baris: [], galat: ['Berkas kosong.'] };
  const kepala = baris[0].split(';').map(x => x.trim().toLowerCase());
  const i = Object.fromEntries(['kelas_id', 'hari', 'mulai', 'selesai'].map(k => [k, kepala.indexOf(k)]));
  const kurang = Object.entries(i).filter(([, v]) => v < 0).map(([k]) => k);
  if (kurang.length) return { baris: [], galat: [`Kolom tidak ada: ${kurang.join(', ')}. Pakai berkas hasil_jadwal_*.csv dari run_jadwal.py.`] };
  const out = [], galat = [];
  baris.slice(1).forEach((b, n) => {
    const c = b.split(';').map(x => x.trim());
    const r = { kelas_id: +c[i.kelas_id], hari: +c[i.hari], mulai: c[i.mulai], selesai: c[i.selesai] };
    if (!Number.isInteger(r.kelas_id) || !(r.hari >= 1 && r.hari <= 7) || !/^\d{2}:\d{2}$/.test(r.mulai) || !/^\d{2}:\d{2}$/.test(r.selesai)
        || menit(r.selesai) <= menit(r.mulai)) galat.push(`Baris ${n + 2}: kelas_id, hari 1–7, dan jam HH:MM (selesai sesudah mulai).`);
    else out.push(r);
  });
  return { baris: out, galat };
}

/**
 * Pemeriksaan jadwal satu periode. kelas, kd, mk seperti masukanPenjadwalan; jadwal = baris jadwal_kuliah; berhalangan =
 * dosen_berhalangan periode itu; slot = jadwal_slot; aturan = data.json jadwal_aturan; nama = id dosen -> nama.
 * -> { wajib: [teks], anjuran: [teks], perKelas: Map(kelas_id -> [teks]) }.
 */
export function periksaJadwal({ kelas = [], kd = [], mk = [], jadwal = [], berhalangan = [], slot = [], aturan = {}, nama = id => id }){
  const M = new Map(mk.map(m => [`${m.kurikulum}|${m.kode}`, m]));
  const J = new Map(jadwal.map(j => [j.kelas_id, j]));
  const D = new Map(kelas.map(k => [k.id, kd.filter(d => d.kelas_id === k.id).map(d => d.dosen_id)]));
  const S = new Map(slot.map(s => [s.id, s]));
  const wajib = [], anjuran = [], perKelas = new Map();
  const catat = (daftar, teks, ...ids) => { daftar.push(teks); for (const id of ids) perKelas.set(id, [...(perKelas.get(id) || []), teks]); };
  const info = k => { const m = M.get(`${k.kurikulum}|${k.kode_mk}`) || {}; return { m, pilihan: m.sifat === 'pilihan' || !m.semester, paket: +m.semester || null }; };
  const label = k => `${k.kode_mk} ${k.kelas}`;
  const panjang = slot.length ? menit(slot[0].selesai) - menit(slot[0].mulai) : 30;
  const isi = kelas.filter(k => J.has(k.id));
  for (const k of kelas) if (!J.has(k.id)) catat(wajib, `${label(k)}: belum berjadwal`, k.id);
  for (const k of isi) {
    const j = J.get(k.id), a = menit(j.mulai), b = menit(j.selesai), w = `${label(k)} ${HARI[j.hari]} ${jamPendek(j.mulai)}–${jamPendek(j.selesai)}`;
    for (const x of aturan.blocked || []) if (kenaJendela(x, j.hari, a, b)) catat(wajib, `${w}: kena jam wajib kosong ${teksJendela(x)}`, k.id);
    for (const x of aturan.avoid || []) if (kenaJendela(x, j.hari, a, b)) catat(anjuran, `${w}: memakai jam yang dihindari ${teksJendela(x)}`, k.id);
    for (const d of D.get(k.id)) {
      const kena = berhalangan.some(h => h.dosen_id === d && +h.hari === +j.hari && S.has(h.slot_id)
        && menit(S.get(h.slot_id).mulai) < b && a < menit(S.get(h.slot_id).selesai));
      if (kena) catat(wajib, `${w}: ${nama(d)} berhalangan mingguan`, k.id);
    }
    const harus = durasiMenit(info(k).m.sks, aturan, panjang);
    if (info(k).m.sks && b - a !== harus) catat(anjuran, `${w}: lama ${b - a} menit, menurut sks ${harus} menit`, k.id);
  }
  for (let x = 0; x < isi.length; x++) for (let y = x + 1; y < isi.length; y++) {
    const p = isi[x], q = isi[y], jp = J.get(p.id), jq = J.get(q.id);
    if (+jp.hari !== +jq.hari) continue;
    const pa = menit(jp.mulai), pb = menit(jp.selesai), qa = menit(jq.mulai), qb = menit(jq.selesai);
    const tumpang = pa < qb && qa < pb, pas = `${label(p)} dan ${label(q)} (${HARI[jp.hari]})`;
    const sama = D.get(p.id).filter(d => D.get(q.id).includes(d));
    if (tumpang && sama.length) catat(wajib, `${pas}: dosen bentrok (${sama.map(nama).join(', ')})`, p.id, q.id);
    if (tumpang && jp.ruang && jq.ruang && jp.ruang.trim().toLowerCase() === jq.ruang.trim().toLowerCase())
      catat(wajib, `${pas}: ruang ${jp.ruang} dipakai dua kelas`, p.id, q.id);
    const ip = info(p), iq = info(q);
    if (!ip.pilihan && !iq.pilihan && ip.paket && ip.paket === iq.paket && p.kurikulum === q.kurikulum
        && p.kelas.trim().toUpperCase() === q.kelas.trim().toUpperCase()) {
      const jarak = Math.max(qa - pb, pa - qb), jeda = +aturan.same_label_break_minutes || 0;
      if (tumpang) catat(wajib, `${pas}: kelas ${p.kelas} semester ${ip.paket} bentrok`, p.id, q.id);
      else if (jarak < jeda) catat(wajib, `${pas}: kelas ${p.kelas} semester ${ip.paket} hanya berjeda ${jarak} menit (minimal ${jeda})`, p.id, q.id);
    }
    if (aturan.electives_no_overlap && ip.pilihan && iq.pilihan && p.kurikulum === q.kurikulum && tumpang)
      catat(wajib, `${pas}: MK pilihan ${p.kurikulum} bentrok`, p.id, q.id);
  }
  if (aturan.lecturer_daily_max_hours) {
    const beban = new Map();
    for (const k of isi) for (const d of D.get(k.id)) {
      const j = J.get(k.id), kunci = `${d}|${j.hari}`;
      beban.set(kunci, (beban.get(kunci) || 0) + menit(j.selesai) - menit(j.mulai));
    }
    for (const [kunci, mnt] of beban) if (mnt > aturan.lecturer_daily_max_hours * 60) {
      const [d, h] = kunci.split('|');
      anjuran.push(`${nama(d)} ${HARI[h]}: mengajar ${String(Math.round(mnt / 6) / 10).replace('.', ',')} jam (anjuran maks ${aturan.lecturer_daily_max_hours})`);
    }
  }
  return { wajib, anjuran, perKelas };
}

/** CSV jadwal satu periode untuk dibagikan (pemisah ;): hari, jam, MK, kelas, dosen, ruang. */
export function csvJadwal({ kelas = [], kd = [], mk = [], jadwal = [], nama = id => id }){
  const M = new Map(mk.map(m => [`${m.kurikulum}|${m.kode}`, m])), J = new Map(jadwal.map(j => [j.kelas_id, j]));
  const sel = v => { const s = String(v ?? ''); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const rows = kelas.filter(k => J.has(k.id)).map(k => {
    const j = J.get(k.id), m = M.get(`${k.kurikulum}|${k.kode_mk}`) || {};
    return [j.hari, HARI[j.hari], jamPendek(j.mulai), jamPendek(j.selesai), k.kurikulum, k.kode_mk, m.nama || '', k.kelas, m.sks ?? '',
      m.sifat === 'pilihan' || !m.semester ? 'pilihan' : m.semester,
      kd.filter(d => d.kelas_id === k.id).sort((a, b) => a.urutan - b.urutan).map(d => nama(d.dosen_id)).join(' | '), j.ruang || ''];
  }).sort((a, b) => a[0] - b[0] || a[2].localeCompare(b[2]) || a[5].localeCompare(b[5]) || a[7].localeCompare(b[7]));
  return [['hari', 'nama_hari', 'mulai', 'selesai', 'kurikulum', 'kode_mk', 'nama_mk', 'kelas', 'sks', 'semester_paket', 'dosen', 'ruang'],
    ...rows].map(r => r.map(sel).join(';')).join('\n');
}
