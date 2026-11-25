// Catatan bimbingan TA dengan konfirmasi pembimbing (175-patch-bimbingan-ta.sql, pemilik 2026-11-25). Logika murni:
// dipakai pengajuan.html (mahasiswa), bimbingan-ta.html (pembimbing/koordinator TA), dan diuji tests/js/bimbingan_ta.test.mjs.
// Aturan sama dengan SQL: terkonfirmasi = dikonfirmasi, atau menunggu yang sudah 14 hari sejak diajukan (otomatis).

export const HARI_OTOMATIS = 14;
export const HARI_LAMA = 30;   // rekap: bimbingan terakhir lebih dari 30 hari lalu ditandai
export const CARA_BIMBINGAN = [['tatap_muka', 'Tatap muka'], ['daring', 'Daring']];
export const labelCara = k => (CARA_BIMBINGAN.find(x => x[0] === k) || [, k || ''])[1];
export const NAMA_TAHAP = { seminar_proposal: 'Seminar proposal', seminar_kemajuan: 'Seminar kemajuan', sidang_akhir: 'Sidang akhir' };

const HARI = 864e5;
const tglWIB = (kini = new Date()) => new Date(+kini + 7 * 3600e3).toISOString().slice(0, 10);

/** Terkonfirmasi (termasuk otomatis)? Sama dengan ta_bimbingan_sah. */
export const sahBimbingan = (b, kini = new Date()) => b.status === 'dikonfirmasi'
  || (b.status === 'menunggu' && +new Date(b.diajukan) <= +kini - HARI_OTOMATIS * HARI);

/** Status tampilan: { kode: menunggu|otomatis|dikonfirmasi|dikembalikan, label, otomatisPada (ISO tanggal, untuk menunggu) }. */
export function statusBimbingan(b, kini = new Date()){
  if (b.status === 'dikonfirmasi') return { kode: 'dikonfirmasi', label: `Dikonfirmasi${b.konfirmasi_oleh ? ' ' + b.konfirmasi_oleh : ''}` };
  if (b.status === 'dikembalikan') return { kode: 'dikembalikan', label: 'Dikembalikan pembimbing' };
  const pada = new Date(+new Date(b.diajukan) + HARI_OTOMATIS * HARI);
  if (+pada <= +kini) return { kode: 'otomatis', label: 'Terkonfirmasi otomatis' };
  return { kode: 'menunggu', label: 'Menunggu konfirmasi', otomatisPada: tglWIB(pada) };
}

/** Galat isian (aturan sama dengan mhs_bimbingan_simpan); [] = sah. x = { tanggal, cara, pembimbing, topik, arahan }. */
export function periksaBimbingan(x, pembimbing = [], kini = new Date()){
  const g = [];
  if (!pembimbing.length) g.push('Pembimbing TA Anda belum tercatat; ajukan pembimbing TA dulu.');
  else if (!pembimbing.some(p => p.id === x.pembimbing)) g.push('Pilih pembimbing yang membimbing.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(x.tanggal || '') || x.tanggal > tglWIB(kini)) g.push('Isi tanggal bimbingan (tidak boleh setelah hari ini).');
  else if (x.tanggal < '2020-01-01') g.push('Tanggal bimbingan terlalu lama.');
  if (!CARA_BIMBINGAN.some(c => c[0] === x.cara)) g.push('Pilih cara bimbingan: tatap muka atau daring.');
  const t = String(x.topik || '').trim().length;
  if (t < 5 || t > 1000) g.push('Tulis topik yang dibahas (5–1000 huruf).');
  if (String(x.arahan || '').trim().length > 2000) g.push('Arahan paling banyak 2000 huruf.');
  return g;
}

/** Teks syarat satu tahap dari ta_syarat_bimbingan_hitung: "Seminar kemajuan: 3 dari 4 bimbingan terkonfirmasi sejak 01-10-2026". */
export function teksSyarat(s){
  const sejak = s.sejak ? ` sejak ${String(s.sejak).split('-').reverse().join('-')}` : '';
  if (!s.minimal) return `${NAMA_TAHAP[s.tahap] || s.tahap}: tanpa syarat jumlah bimbingan`;
  return `${NAMA_TAHAP[s.tahap] || s.tahap}: ${s.terhitung} dari ${s.minimal} bimbingan terkonfirmasi${sejak}${s.cukup ? ' (cukup)' : ''}`;
}

/** Hari sejak tanggal ISO (WIB) sampai kini; null bila tanggal kosong. */
export const hariSejak = (tgl, kini = new Date()) => tgl
  ? Math.round((Date.parse(tglWIB(kini) + 'T00:00:00Z') - Date.parse(String(tgl).slice(0, 10) + 'T00:00:00Z')) / HARI) : null;
