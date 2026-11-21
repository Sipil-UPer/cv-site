// Penyusunan kelas per semester (136-patch-penyusunan-kelas.sql, pemilik 2026-11-21): logika murni halaman kelas.html,
// dites di Node (tests/js/kelas.test.mjs). Satu MK boleh beberapa kelas; team teaching = satu koordinator kelas + anggota.
// CSV (impor/ekspor, untuk optimasi jadwal di luar situs): pemisah ';', dosen dipisah '|' (NIDN atau email; pertama =
// koordinator). Ekspor menulis kolom koordinator + anggota; impor menerima kolom 'dosen' atau koordinator + anggota.

/** MK yang dibuka pada semester itu: MK aktif kurikulum kur, semester ganjil untuk Ganjil / genap untuk Genap; MK pilihan
 *  (atau tanpa semester) selalu ikut, ditandai pilihan. Urut semester lalu kode. */
export function mkDitawarkan(mk = [], kur, semester){
  const paritas = semester === 'Ganjil' ? 1 : 0;
  return mk.filter(m => m.kurikulum === kur && m.aktif !== false
      && (m.sifat === 'pilihan' || !m.semester || +m.semester % 2 === paritas))
    .map(m => ({ ...m, pilihan: m.sifat === 'pilihan' || !m.semester }))
    .sort((a, b) => (a.pilihan - b.pilihan) || (+a.semester || 99) - (+b.semester || 99) || String(a.kode).localeCompare(String(b.kode)));
}

/** Nama kelas berikutnya: A, B, ..., Z, lalu A2, B2, ... (yang belum dipakai, tanpa beda huruf besar). */
export function kelasBerikut(ada = []){
  const pakai = new Set(ada.map(k => String(k).trim().toUpperCase()));
  for (let n = 1; n < 10; n++) for (let i = 0; i < 26; i++) {
    const k = String.fromCharCode(65 + i) + (n > 1 ? n : '');
    if (!pakai.has(k)) return k;
  }
  return '';
}

/**
 * Usulan kelas A untuk MK yang belum punya kelas; dosen dari pengampu MK (Data prodi), pengampu pertama = koordinator.
 * dosen = [{ id, nidn }]. Hasil { baris: [{ kurikulum, kode_mk, kelas, dosen: [{dosen_id, peran}] }], tanpaPengampu: [kode] }.
 */
export function usulanKelasAwal(mk = [], kelasAda = [], dosen = []){
  const ada = new Set(kelasAda.map(k => `${k.kurikulum}|${k.kode_mk}`));
  const perNidn = new Map(dosen.filter(d => d.nidn).map(d => [String(d.nidn), d.id]));
  const baris = [], tanpaPengampu = [];
  for (const m of mk) {
    if (ada.has(`${m.kurikulum}|${m.kode}`)) continue;
    const ids = [...new Set((m.pengampu || []).map(String).map(n => perNidn.get(n)).filter(Boolean))];
    if (!ids.length) { tanpaPengampu.push(m.kode); continue; }
    baris.push({ kurikulum: m.kurikulum, kode_mk: m.kode, kelas: 'A', dosen: ids.map((id, i) => ({ dosen_id: id, peran: i ? 'anggota' : 'koordinator' })) });
  }
  return { baris, tanpaPengampu };
}

const bersih = v => String(v ?? '').replace(/;/g, ',').replace(/[\r\n]+/g, ' ').trim();

/**
 * CSV ekspor satu periode. kelas = baris kelas_kuliah; kd = baris kelas_dosen; mk = ref_mata_kuliah; dosen = [{id, nidn, email, nama}].
 * Kolom: tahun_akademik;semester;kurikulum;kode_mk;nama_mk;sks;semester_paket;sifat;kelas;kapasitas;angkatan;koordinator;anggota;
 * nama_dosen;pertemuan;catatan. koordinator/anggota = NIDN (email bila NIDN kosong); pertemuan sejajar urutan dosen.
 */
export function csvKelas(kelas = [], kd = [], mk = [], dosen = []){
  const D = new Map(dosen.map(d => [d.id, d])), id = d => d ? (d.nidn || d.email || '') : '';
  const M = new Map(mk.map(m => [`${m.kurikulum}|${m.kode}`, m]));
  const kepala = ['tahun_akademik', 'semester', 'kurikulum', 'kode_mk', 'nama_mk', 'sks', 'semester_paket', 'sifat', 'kelas', 'kapasitas',
    'angkatan', 'koordinator', 'anggota', 'nama_dosen', 'pertemuan', 'catatan'];
  const urut = [...kelas].sort((a, b) => `${a.kurikulum}|${a.kode_mk}|${a.kelas}`.localeCompare(`${b.kurikulum}|${b.kode_mk}|${b.kelas}`));
  const baris = urut.map(k => {
    const m = M.get(`${k.kurikulum}|${k.kode_mk}`) || {};
    const ds = kd.filter(x => x.kelas_id === k.id).sort((a, b) => (a.peran === 'koordinator' ? -1 : 0) - (b.peran === 'koordinator' ? -1 : 0) || a.urutan - b.urutan);
    const koor = ds.find(x => x.peran === 'koordinator'), ang = ds.filter(x => x !== koor);
    return [k.tahun_akademik, k.semester, k.kurikulum, k.kode_mk, m.nama, m.sks, m.semester, m.sifat, k.kelas, k.kapasitas, k.angkatan,
      id(D.get(koor?.dosen_id)), ang.map(x => id(D.get(x.dosen_id))).join('|'), ds.map(x => D.get(x.dosen_id)?.nama || '?').join('|'),
      ds.map(x => x.pertemuan ?? '').join('|'), k.catatan].map(bersih);
  });
  return [kepala, ...baris].map(r => r.join(';')).join('\r\n');
}

/**
 * Baca CSV impor. Wajib kolom kode_mk, kelas, dan dosen (atau koordinator [+ anggota]); opsional kurikulum (bawaan
 * kurikulumBawaan), kapasitas, angkatan, catatan. mk = ref_mata_kuliah untuk memeriksa MK. Hasil { baris: [{kurikulum,
 * kode_mk, kelas, kapasitas, angkatan, catatan, dosen: ['NIDN/email', ...]}], galat: ['Baris n: ...'] }.
 */
export function bacaCsvKelas(isi, { mk = [], kurikulumBawaan = '' } = {}){
  const garis = String(isi || '').replace(/^﻿/, '').split(/\r?\n/).filter(g => g.trim());
  if (!garis.length) return { baris: [], galat: ['Berkas kosong.'] };
  const pisah = garis[0].includes(';') ? ';' : ',';
  const sel = g => g.split(pisah).map(s => s.trim().replace(/^"|"$/g, ''));
  const kep = sel(garis[0]).map(s => s.toLowerCase()), i = k => kep.indexOf(k);
  const iDosen = i('dosen'), iKoor = i('koordinator'), iAng = i('anggota');
  if (i('kode_mk') < 0 || i('kelas') < 0 || (iDosen < 0 && iKoor < 0))
    return { baris: [], galat: ['Kolom kode_mk, kelas, dan dosen (atau koordinator) wajib ada.'] };
  const ada = new Set(mk.map(m => `${m.kurikulum}|${m.kode}`)), sudah = new Set(), baris = [], galat = [];
  garis.slice(1).forEach((g, n) => {
    const c = sel(g), v = k => (i(k) >= 0 ? c[i(k)] || '' : '').trim(), no = `Baris ${n + 2}`;
    const kur = (v('kurikulum') || kurikulumBawaan).toUpperCase(), kode = v('kode_mk'), kelas = v('kelas');
    if (!kode && !kelas) return;
    if (!kur) return galat.push(`${no}: kurikulum kosong.`);
    if (!ada.has(`${kur}|${kode}`)) return galat.push(`${no}: MK ${kode} tidak ada di ${kur}.`);
    if (!/^[A-Za-z0-9._ -]{1,10}$/.test(kelas)) return galat.push(`${no}: nama kelas "${kelas}" tidak sah (1–10 huruf/angka).`);
    const pecah = s => String(s || '').split('|').map(x => x.trim()).filter(Boolean);
    const dosen = [...new Set(iDosen >= 0 ? pecah(c[iDosen]) : [...pecah(c[iKoor]), ...pecah(iAng >= 0 ? c[iAng] : '')])];
    if (!dosen.length) return galat.push(`${no}: dosen kosong.`);
    const k = `${kur}|${kode}|${kelas.toUpperCase()}`;
    if (sudah.has(k)) return galat.push(`${no}: kelas ${kode} ${kelas} ganda di berkas.`);
    sudah.add(k);
    const kap = v('kapasitas');
    if (kap && !(+kap >= 1 && +kap <= 500 && Number.isInteger(+kap))) return galat.push(`${no}: kapasitas 1–500.`);
    baris.push({ kurikulum: kur, kode_mk: kode, kelas, kapasitas: kap ? +kap : null, angkatan: v('angkatan') || null, catatan: v('catatan') || null, dosen });
  });
  return { baris, galat };
}
