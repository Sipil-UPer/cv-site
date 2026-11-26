// Perwalian (186-patch-perwalian.sql, pemilik 2026-11-26): fungsi murni untuk perwalian.html, ruang-kerja (Tugas saya),
// dan uji. Daftar mahasiswa aktif dari ekspor SIAKAD/SIUP: CSV titik koma "No;NIM;Nama;Email;Tahun Masuk;SKS Total;IPK"
// (kolom dosen wali opsional), atau Excel dengan judul kolom yang sama.

/** Teks CSV -> tabel (array baris). Pemisah ; atau , (yang lebih banyak di baris judul); kutip ganda; "" = kutip. */
export function bacaCsv(teks){
  const s = String(teks || '').replace(/^﻿/, '');
  const judul = s.split(/\r?\n/, 1)[0] || '';
  const pisah = (judul.match(/;/g) || []).length >= (judul.match(/,/g) || []).length ? ';' : ',';
  const out = []; let baris = [], sel = '', kutip = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (kutip) {
      if (c === '"' && s[i + 1] === '"') { sel += '"'; i++; }
      else if (c === '"') kutip = false;
      else sel += c;
    } else if (c === '"' && sel === '') kutip = true;
    else if (c === pisah) { baris.push(sel); sel = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      baris.push(sel); sel = '';
      if (baris.some(x => x.trim() !== '')) out.push(baris);
      baris = [];
    } else sel += c;
  }
  baris.push(sel);
  if (baris.some(x => x.trim() !== '')) out.push(baris);
  return out;
}

const norm = x => String(x ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
// Judul kolom -> kunci. Wali: nama, email, atau NIDN/NIP dosen (perwalian_cari_dosen mencocokkan ketiganya).
const KOLOM = [['nim', /^nim$/], ['nama', /^nama( mahasiswa)?$/], ['email', /^e ?mail( mahasiswa)?$/],
  ['angkatan', /^(tahun masuk|angkatan)$/], ['sks', /^sks( total)?$/], ['ipk', /^ipk$/],
  ['wali', /^(dosen wali|wali|pembimbing akademik|dosen pa|pa|email wali|nidn wali|nip wali)$/]];

/** Tabel (baris judul + isi) -> {baris: [{nim, nama, email, angkatan, sks, ipk, wali}], kolom, galat}. */
export function barisMahasiswa(tabel){
  const t = (tabel || []).map(r => (r || []).map(x => String(x ?? '').trim()));
  const iJudul = t.findIndex(r => r.some(x => norm(x) === 'nim'));
  if (iJudul < 0) return { baris: [], kolom: [], galat: ['Kolom NIM tidak ditemukan. Pakai ekspor SIAKAD dengan judul kolom NIM dan Nama.'] };
  const judul = t[iJudul].map(norm), idx = {};
  for (const [k, re] of KOLOM) { const i = judul.findIndex(j => re.test(j)); if (i >= 0) idx[k] = i; }
  const galat = [];
  if (idx.nama == null) galat.push('Kolom Nama tidak ditemukan.');
  const baris = [];
  for (const r of t.slice(iJudul + 1)) {
    const v = k => (idx[k] == null ? '' : (r[idx[k]] ?? '').trim());
    const nim = v('nim').replace(/\s/g, '');
    if (!nim && !v('nama')) continue;
    baris.push({ nim, nama: v('nama'), email: v('email'), angkatan: v('angkatan'), sks: v('sks'), ipk: v('ipk').replace(',', '.'),
                 ...(idx.wali == null ? {} : { wali: v('wali') }) });
  }
  return { baris, kolom: Object.keys(idx), galat };
}

/** "2026_ganjil.csv" -> {ts: 2027, sm: 'Ganjil'} (2026/2027 Ganjil); "2025_genap" -> {ts: 2026, sm: 'Genap'}. Tahun = awal TA. */
export function semesterDariNama(nama){
  const m = String(nama || '').match(/(20\d{2})\s*[-_ ]\s*(ganjil|genap)/i);
  if (!m) return null;
  return { ts: +m[1] + 1, sm: m[2].toLowerCase() === 'ganjil' ? 'Ganjil' : 'Genap' };
}
export const urutSemester = s => s.ts * 2 + (s.sm === 'Genap' ? 1 : 0);
export const teksSm = s => s ? `${s.ts - 1}/${s.ts} ${s.sm}` : '';

/** Perlu perhatian: IPK ada dan di bawah 2,00 (angkatan baru tanpa nilai: kosong/0 dengan SKS kosong tidak dihitung). */
export const ipkRendah = r => r?.ipk != null && r.ipk !== '' && Number(r.ipk) < 2 && !(Number(r.ipk) === 0 && !r.sks_total);

/** Baris perwalian_daftar -> rekap per wali: [{wali, jumlah, cukup, belum, ipk_rendah}] (tanpa wali di akhir). */
export function rekapWali(rows = []){
  const m = new Map();
  for (const r of rows) {
    const k = r.wali || '';
    const x = m.get(k) || { wali: r.wali || '(belum ada wali)', jumlah: 0, cukup: 0, belum: 0, ipk_rendah: 0 };
    x.jumlah++; if (r.pertemuan >= r.minimal) x.cukup++; else x.belum++; if (ipkRendah(r)) x.ipk_rendah++;
    m.set(k, x);
  }
  return [...m.entries()].sort(([a], [b]) => (!a) - (!b) || a.localeCompare(b, 'id')).map(([, x]) => x);
}

/** Lembar unduhan daftar wali untuk SIUP/Dirsik (array baris; judul di baris pertama). */
export function lembarWali(rows = [], dosen = []){
  const nidn = new Map(dosen.map(d => [d.id, d.nidn || '']));
  return [['NIM', 'Nama', 'Angkatan', 'Dosen wali', 'NIDN/NIP dosen wali'],
    ...rows.map(r => [r.nim, r.nama, r.angkatan ?? '', r.wali || '', r.wali_id ? nidn.get(r.wali_id) || '' : ''])];
}

/** Tugas saya (dosen wali): butir setelah separuh semester bila masih ada mahasiswa di bawah minimal; null bila tidak. */
export function tugasPerwalian(t, kini = new Date()){
  if (!t || !t.total || !(t.belum || []).length || !t.awal || !t.akhir) return null;
  const tengah = (Date.parse(t.awal) + Date.parse(t.akhir)) / 2;
  if (kini.getTime() < tengah) return null;
  const xs = t.belum;
  return { jenis: 'perwalian', judul: `Perwalian: ${xs.length} dari ${t.total} mahasiswa belum ${t.minimal} kali bertemu semester ini`,
    rinci: xs.slice(0, 3).map(x => x.nama).join(', ') + (xs.length > 3 ? ', …' : ''), href: 'perwalian.html' };
}
