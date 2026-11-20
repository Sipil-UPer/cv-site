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

// ---------- Rentang tanggal + hari + slot (135-patch-berhalangan-rentang.sql, pemilik 2026-11-21) ----------
const tglID = s => String(s || '').split('-').reverse().map(x => x.replace(/^0/, '')).join('/');
export const RENTANG_MAKS_HARI = 366;   // sama dengan batas di patch 135
const selisihHari = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);

/** Periksa isian rentang sebelum disimpan: { mulai, selesai, hari: [..], slot: [..] } -> daftar pesan galat ([] = baik). */
export function cekRentang({ mulai, selesai, hari = [], slot = [] } = {}){
  const g = [], ok = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
  if (!ok(mulai)) g.push('Isi tanggal mulai.');
  const akhir = selesai || mulai;
  if (ok(mulai) && !ok(akhir)) g.push('Tanggal selesai tidak sah.');
  if (ok(mulai) && ok(akhir)) {
    const n = selisihHari(mulai, akhir);
    if (n < 0) g.push('Tanggal selesai harus sama atau setelah tanggal mulai.');
    else if (n > RENTANG_MAKS_HARI) g.push(`Rentang paling lama ${RENTANG_MAKS_HARI} hari; isi jadwal semesteran di Jadwal mingguan.`);
    else if (hari.length) {
      const ada = new Set();
      for (let i = 0; i <= Math.min(n, 6); i++) ada.add(hariISO(new Date(Date.parse(mulai + 'T00:00:00Z') + i * 864e5).toISOString().slice(0, 10)));
      if (!hari.some(h => ada.has(+h))) g.push('Hari yang dipilih tidak ada di dalam rentang tanggal itu.');
    }
  }
  if (hari.some(h => !(+h >= 1 && +h <= 7))) g.push('Hari tidak sah.');
  if (slot.length > 30) g.push('Paling banyak 30 slot.');
  return g;
}

/** "1/12/2026–15/1/2027 · Selasa, Kamis · Jam 1, Jam 2" (satu tanggal: tanpa tanda hubung; tanpa hari/slot: semua hari/sepanjang hari). */
export function labelRentang(r = {}, slot = []){
  const tgl = r.mulai === r.selesai || !r.selesai ? tglID(r.mulai) : `${tglID(r.mulai)}–${tglID(r.selesai)}`;
  const hari = r.hari?.length ? r.hari.map(namaHari).join(', ') : (r.mulai === r.selesai || !r.selesai ? namaHari(hariISO(r.mulai)) : 'setiap hari');
  const jam = r.slot_ids?.length ? r.slot_ids.map(id => slot.find(s => s.id === id)?.label || `slot ${id}`).join(', ') : 'sepanjang hari';
  return `${tgl} · ${hari} · ${jam}`;
}

/** Rentang yang berlaku pada satu tanggal, diuraikan seperti baris dosen_berhalangan_tgl: [{dosen_id, tanggal, slot_id|null, jenis, alasan}]. */
export function rentangPadaTanggal(rentang = [], tanggal){
  const h = hariISO(tanggal), out = [];
  if (!h) return out;
  for (const r of rentang) {
    if (!(r.mulai <= tanggal && tanggal <= (r.selesai || r.mulai))) continue;
    if (r.hari?.length && !r.hari.map(Number).includes(h)) continue;
    for (const s of r.slot_ids?.length ? r.slot_ids : [null])
      out.push({ dosen_id: r.dosen_id, tanggal, slot_id: s, jenis: r.jenis, alasan: r.alasan || '', rentang: r.id });
  }
  return out;
}

/** Slot berurutan dari jam awal sampai jam akhir tiap n menit (tombol "Buat slot otomatis", admin; pemilik 2026-11-21:
 *  jam 07-17 per 1 jam). Hasil [{label, mulai, selesai, aktif}] atau galat { galat: '...' }. Nilai jam tidak ditanam di kode. */
export function buatSlot(dari, sampai, menit){
  const ke = t => { const m = String(t || '').match(/^(\d{1,2})[.:](\d{2})/); return m ? +m[1] * 60 + +m[2] : null; };
  const ff = n => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
  const a = ke(dari), b = ke(sampai), d = +menit;
  if (a == null || b == null) return { galat: 'Isi jam awal dan jam akhir (mis. 07:00 dan 17:00).' };
  if (!(d >= 15 && d <= 240)) return { galat: 'Lama slot 15–240 menit.' };
  if (b - a < d) return { galat: 'Jam akhir harus setelah jam awal, paling sedikit satu slot.' };
  const out = [];
  for (let t = a; t + d <= b; t += d) out.push({ label: `Jam ${ff(t).slice(0, 2)}${t % 60 ? '.' + ff(t).slice(3) : ''}`, mulai: ff(t), selesai: ff(t + d), aktif: true });
  return out.length > 30 ? { galat: 'Paling banyak 30 slot; perbesar lama slot.' } : out;
}

// ---------- Kalender bertanggal (pemilik 2026-11-21): seret untuk blok jam pada tanggal tertentu, judul wajib + jenis,
// opsi "ulangi tiap minggu sampai ...". Disimpan sebagai baris dosen_berhalangan_rentang (135): satu tanggal = mulai = selesai,
// berulang = mulai..sampai dengan hari = [hari tanggal itu]. Judul disimpan di kolom alasan. Tanpa SQL baru. ----------

/** 'YYYY-MM-DD' + n hari (tanpa geser zona waktu). */
export const tambahHari = (tgl, n) => new Date(Date.parse(tgl + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10);

/** Tanggal Senin..Minggu pada minggu yang memuat tgl. */
export function mingguDari(tgl){
  const h = hariISO(tgl);
  if (!h) return [];
  const senin = tambahHari(tgl, 1 - h);
  return [0, 1, 2, 3, 4, 5, 6].map(i => tambahHari(senin, i));
}

/** Id slot berurutan dari a sampai b (urutan daftar slot aktif; arah seret bebas). */
export function slotAntara(slot = [], a, b){
  const i = slot.findIndex(s => s.id === +a), j = slot.findIndex(s => s.id === +b);
  if (i < 0 || j < 0) return [];
  return slot.slice(Math.min(i, j), Math.max(i, j) + 1).map(s => s.id);
}

/**
 * Baris rentang dari blok kalender (pemilik 2026-11-21: juga jam yang sama pada setiap hari terpilih dalam rentang tanggal).
 * { tanggal, sampai, hari: [1..7], slot_ids, judul, jenis } -> { baris: {mulai, selesai, hari, slot_ids, jenis, alasan} } atau
 * { galat: [..] }. Satu tanggal (sampai kosong/sama) = hari null. Rentang: hari wajib dipilih (minimal satu, ada di rentang).
 */
export function blokBaru({ tanggal, sampai = '', hari = [], slot_ids = [], judul = '', jenis = 'lainnya' } = {}){
  const galat = [], j = String(judul || '').trim(), akhir = sampai || tanggal;
  const rentang = !!sampai && sampai !== tanggal, hs = [...new Set(hari.map(Number))].sort((x, y) => x - y);
  if (!hariISO(tanggal)) galat.push('Tanggal tidak sah.');
  if (!slot_ids.length) galat.push('Pilih jam dengan menyeret pada kalender.');
  if (!j) galat.push('Isi judul, mis. "Mengajar Teknik Lingkungan".');
  if (j.length > 200) galat.push('Judul paling panjang 200 huruf.');
  if (!JENIS_HALANGAN.some(([k]) => k === jenis)) galat.push('Jenis tidak sah.');
  if (rentang && !hs.length) galat.push('Centang minimal satu hari.');
  if (hariISO(tanggal)) galat.push(...cekRentang({ mulai: tanggal, selesai: akhir, hari: rentang ? hs : [], slot: slot_ids })
    .map(g => g.replace('isi jadwal semesteran di Jadwal mingguan', 'pecah menjadi beberapa blok')));
  if (galat.length) return { galat: [...new Set(galat)] };
  return { baris: { mulai: tanggal, selesai: akhir, hari: rentang ? hs : null, slot_ids: [...slot_ids], jenis, alasan: j } };
}

/**
 * Isi kalender: Map 'tanggal|slot_id' -> [{ sumber: 'blok'|'tanggal'|'mingguan', id, judul, jenis, ulang }] untuk tanggal dan slot
 * yang diberikan. rentang (135) dan tanggalan (132, slot_id null = sepanjang hari) per tanggal; mingguan (132) dipakai bila
 * semesterDari(tanggal) cocok dengan {ta, sm} barisnya.
 */
export function isiKalender({ tanggal = [], slot = [], rentang = [], tanggalan = [], mingguan = [], semesterDari = null } = {}){
  const out = new Map();
  const tambah = (t, sid, x) => { const k = `${t}|${sid}`; if (!out.has(k)) out.set(k, []); out.get(k).push(x); };
  for (const t of tanggal) {
    for (const r of rentang) {
      if (!(r.mulai <= t && t <= (r.selesai || r.mulai))) continue;
      if (r.hari?.length && !r.hari.map(Number).includes(hariISO(t))) continue;
      const ulang = (r.selesai || r.mulai) !== r.mulai;
      for (const s of slot) if (!r.slot_ids?.length || r.slot_ids.includes(s.id))
        tambah(t, s.id, { sumber: 'blok', id: r.id, judul: r.alasan || '', jenis: r.jenis, ulang, mulai: r.mulai, selesai: r.selesai || r.mulai });
    }
    for (const r of tanggalan) if (r.tanggal === t)
      for (const s of slot) if (r.slot_id == null || r.slot_id === s.id) tambah(t, s.id, { sumber: 'tanggal', id: r.id, judul: r.alasan || '', jenis: r.jenis });
    const sem = semesterDari ? semesterDari(t) : null;
    if (sem) for (const r of mingguan)
      if (r.tahun_akademik === sem.ta && r.semester === sem.sm && +r.hari === hariISO(t))
        for (const s of slot) if (r.slot_id === s.id) tambah(t, s.id, { sumber: 'mingguan', id: r.id, judul: r.alasan || '', jenis: r.jenis });
  }
  return out;
}
