// Contoh halaman tautan pribadi mahasiswa (pemilik 2026-11-19): pengajuan.html?contoh=<kunci> menggambar data FIKTIF
// dengan penggambar yang sama (halamanSaya), tombol dinonaktifkan. Bentuk objek = hasil mhs_lihat (patch 90/91/106/107).
// Nama, NIM, instansi, dan dosen di sini fiktif; jangan diganti nama orang sungguhan.

export const CONTOH_PENGAJUAN = [
  ['baru', 'Baru dibuka dari email', 'Tampilan pertama setelah mengklik tautan di email: unggah berkas, lalu Kirim untuk diperiksa.'],
  ['diperiksa', 'Sedang diperiksa', 'Sudah dikirim; jalur proses menunjukkan siapa yang sedang memeriksa (KP: koordinator KP, yang juga menetapkan pembimbing).'],
  ['selesai', 'Pelaporan selesai KP', 'Diterima instansi; setelah KP selesai, isi laporan dan unggah laporan KP + surat keterangan selesai.'],
];

const JAM = 3600e3, HARI = 24 * JAM;

/** Objek pengajuan fiktif untuk halamanSaya(); kunci tak dikenal = 'baru'. kini = Date (waktu riwayat relatif terhadapnya). */
export function contohPengajuan(kunci, kini = new Date()){
  const t = ms => new Date(+kini - ms).toISOString();
  const k = CONTOH_PENGAJUAN.some(([x]) => x === kunci) ? kunci : 'baru';
  const dasar = {
    id: 1, jenis: 'kp', nim: '000000000', nama: 'Mahasiswa Contoh', email: '000000000@student.contoh.ac.id',
    pembimbing_id: null, pembimbing: 'Dosen Pembimbing Contoh', pembimbing_2: null, penetapan_ta: null, jadwal: null,
    data: { program: 'kp', instansi: 'PT Contoh Konstruksi', alamat_instansi: 'Jl. Contoh No. 1, Jakarta', bidang_kerja: 'Pengawasan struktur gedung',
      rencana_mulai: '2027-01-04', rencana_selesai: '2027-02-26', kontak_instansi: 'HRD PT Contoh Konstruksi' },
    data_selesai: {}, lain: [], dibuat: t(2 * HARI), diperbarui: t(JAM),
  };
  const berkas = (id, jenis, nama, lalu, oleh = 'mahasiswa') => ({ id, jenis, nama, oleh, dibuat: t(lalu) });
  if (k === 'baru') return { ...dasar, status: 'draf', tahap: 'pengajuan', boleh_ubah: true, jendela_selesai: false, berkas: [],
    riwayat: [{ status: 'draf', oleh: 'mahasiswa', tahap: 'pengajuan', waktu: t(5 * 60e3) }], dibuat: t(5 * 60e3), diperbarui: t(5 * 60e3) };
  if (k === 'diperiksa') return { ...dasar, status: 'admin', tahap: 'pengajuan', boleh_ubah: false, jendela_selesai: false,
    berkas: [berkas(11, 'surat_permohonan', 'surat-permohonan-kp.pdf', 2 * HARI)],
    // Sejak patch 107 pengajuan KP langsung ke koordinator KP (yang menetapkan pembimbing).
    riwayat: [{ status: 'draf', oleh: 'mahasiswa', tahap: 'pengajuan', waktu: t(2 * HARI) },
      { status: 'admin', oleh: 'mahasiswa', tahap: 'pengajuan', waktu: t(2 * HARI - JAM) }] };
  return { ...dasar, status: 'disetujui', tahap: 'pengajuan', boleh_ubah: true, jendela_selesai: true,
    data: { ...dasar.data, jawaban_instansi: 'diterima', tanggal_mulai: '2027-01-04' },
    berkas: [berkas(11, 'surat_permohonan', 'surat-permohonan-kp.pdf', 60 * HARI),
      berkas(12, 'surat_pengantar', 'surat-pengantar-kp.pdf', 58 * HARI, 'prodi'),
      berkas(13, 'surat_balasan', 'surat-balasan-pt-contoh.pdf', 50 * HARI)],
    riwayat: [{ status: 'draf', oleh: 'mahasiswa', tahap: 'pengajuan', waktu: t(60 * HARI) },
      { status: 'admin', oleh: 'mahasiswa', tahap: 'pengajuan', waktu: t(60 * HARI - JAM) },
      { status: 'disetujui', oleh: 'Koordinator KP Contoh', tahap: 'pengajuan', waktu: t(58 * HARI),
        catatan: 'Pembimbing ditetapkan: Dosen Pembimbing Contoh.' }] };
}
