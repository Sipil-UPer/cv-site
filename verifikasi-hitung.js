// Jumlah yang menunggu keputusan admin per tab verifikasi.html (pemilik
// 2026-11-08). Dipakai verifikasi.html (angka tab), input.html dan
// kelola-dosen.html (tautan), dan ruang-kerja.html (kartu menu).
// Status yang dihitung sama dengan penyaring panelnya:
//   karya   : karya.status 'diajukan' + ajuan_hapus + ajuan_ubah karya 'menunggu'
//   profil  : ajuan_ubah profil 'menunggu'
//   bkd     : lkps_bkd.verifikasi 'diajukan' + ajuan_bkd 'menunggu'
//   prestasi: lkps_prestasi_mahasiswa.status 'diajukan' + ajuan_prestasi 'menunggu'
// Tabel yang belum ada (patch belum dijalankan) dihitung 0.

const TAB_HITUNG = {
  karya: [['karya', q => q.eq('status', 'diajukan')], ['ajuan_hapus', q => q],
          ['ajuan_ubah', q => q.eq('jenis', 'karya').eq('status', 'menunggu')]],
  profil: [['ajuan_ubah', q => q.eq('jenis', 'profil').eq('status', 'menunggu')]],
  bkd: [['lkps_bkd', q => q.eq('verifikasi', 'diajukan')], ['ajuan_bkd', q => q.eq('status', 'menunggu')]],
  prestasi: [['lkps_prestasi_mahasiswa', q => q.eq('status', 'diajukan')],
             ['ajuan_prestasi', q => q.eq('status', 'menunggu')]],
};

export const TAB_VERIFIKASI = Object.keys(TAB_HITUNG);

// -> { karya, profil, bkd, prestasi, total }
export async function hitungVerifikasi(sb){
  const satu = async ([tabel, saring]) => {
    try{
      const { count, error } = await saring(sb.from(tabel).select('*', { count: 'exact', head: true }));
      return error ? 0 : (count || 0);
    }catch{ return 0; }
  };
  const hasil = { total: 0 };
  await Promise.all(TAB_VERIFIKASI.map(async t => {
    const n = (await Promise.all(TAB_HITUNG[t].map(satu))).reduce((a, b) => a + b, 0);
    hasil[t] = n;
    hasil.total += n;
  }));
  return hasil;
}
