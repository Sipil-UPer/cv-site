// Jejak perubahan data (pemilik 2026-11-12; 65-patch-jejak.sql). Dipakai jejak.html (admin).

export const LABEL_TABEL = {
  karya: 'Karya', karya_penulis: 'Penulis karya', karya_bukti: 'Bukti karya', karya_mitra: 'Mitra karya',
  karya_mahasiswa: 'Mahasiswa pada karya', dosen: 'Dosen', butir_bukti: 'Bukti butir', dokumen: 'Pustaka dokumen',
  pengaturan: 'Isian angka butir', led_narasi: 'Narasi LED', led_penugasan: 'Penugasan LED', led_tim: 'Tim penyusun LED',
  ami_temuan: 'Temuan AMI', cpl_kelas: 'Kelas CPL', cpl_berkas: 'Berkas nilai CPL', cpl_ringkasan: 'Ringkasan CPL',
  lkps_bkd: 'BKD dosen', target_baku: 'Target baku per jabatan', target_dosen: 'Target khusus dosen',
  spmi_standar: 'Standar SPMI', spmi_capaian: 'Capaian standar SPMI', spmi_standar_revisi: 'Revisi standar SPMI',
  evaluasi_mk: 'Evaluasi pembelajaran (EDOM, refleksi RPS)', evaluasi_tindak: 'Tindak lanjut evaluasi pembelajaran',
  ref_cpl: 'CPL per kurikulum', ref_mk_cpl: 'Peta MK–CPL', ref_cpl_korelasi: 'Korelasi CPL antar kurikulum',
};
export const AKSI = { tambah: 'Tambah', ubah: 'Ubah', hapus: 'Hapus' };

/** Nama tabel yang mudah dibaca; lkps_* dan ref_* diturunkan dari namanya. */
export function labelTabel(t){
  if (LABEL_TABEL[t]) return LABEL_TABEL[t];
  const s = String(t || '');
  if (s.startsWith('lkps_')) return 'LKPS: ' + s.slice(5).replace(/_/g, ' ');
  if (s.startsWith('ref_')) return 'Referensi: ' + s.slice(4).replace(/_/g, ' ');
  return s.replace(/_/g, ' ');
}

/** Nilai satu kolom untuk tampilan: null = '—', teks/JSON dipotong. */
export function tampilNilai(v, maks = 80){
  if (v === null || v === undefined || v === '') return '—';
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  return s.length > maks ? s.slice(0, maks - 1) + '…' : s;
}

/** Kolom yang berubah: [{ kolom, lama, baru }] urut nama kolom. */
export const rincianUbah = ubah => Object.entries(ubah || {}).sort(([a], [b]) => a.localeCompare(b))
  .map(([kolom, [lama, baru] = []]) => ({ kolom, lama, baru }));

const KOLOM_JUDUL = ['judul', 'nama', 'nama_kegiatan', 'nama_mahasiswa', 'mitra', 'nama_mk', 'uraian', 'keterangan', 'kunci', 'kode'];

/**
 * Judul singkat baris yang berubah. nama = { karya: Map(id -> judul), dosen: Map(id -> nama) }
 * dari pencarian halaman. Urutan: isi baris (tambah/hapus), lalu nama karya/dosen yang dikenal.
 */
export function judulBaris(j, nama = {}){
  const isi = j.isi || {};
  const kar = nama.karya || new Map(), dos = nama.dosen || new Map();
  const bagian = [];
  if (j.tabel === 'karya') bagian.push(isi.judul || kar.get(j.baris));
  else if (j.tabel === 'dosen') bagian.push(isi.nama || dos.get(j.baris));
  else {
    const k = KOLOM_JUDUL.find(c => isi[c]);
    if (k) bagian.push(String(isi[k]));
    if (isi.karya_id && kar.get(isi.karya_id)) bagian.push(`karya: ${kar.get(isi.karya_id)}`);
    if (isi.dosen_id && dos.get(isi.dosen_id)) bagian.push(`dosen: ${dos.get(isi.dosen_id)}`);
    if (j.tabel === 'karya_penulis' && !isi.karya_id) {
      const [k1, d1] = String(j.baris || '').split('|');
      if (kar.get(k1)) bagian.push(`karya: ${kar.get(k1)}`);
      if (dos.get(d1)) bagian.push(`dosen: ${dos.get(d1)}`);
    }
  }
  const t = bagian.filter(Boolean).join(' · ');
  return t ? tampilNilai(t, 140) : '';
}

/** Id karya dan dosen yang perlu dicari namanya untuk sehalaman jejak. */
export function idTerkait(rows){
  const karya = new Set(), dosen = new Set();
  for (const j of rows || []) {
    const isi = j.isi || {};
    if (j.tabel === 'karya' && j.baris) karya.add(j.baris);
    if (j.tabel === 'dosen' && j.baris) dosen.add(j.baris);
    if (isi.karya_id) karya.add(isi.karya_id);
    if (isi.dosen_id) dosen.add(isi.dosen_id);
    if (j.tabel === 'karya_penulis' && j.baris) { const [k, d] = j.baris.split('|'); if (k) karya.add(k); if (d) dosen.add(d); }
  }
  return { karya: [...karya], dosen: [...dosen] };
}
