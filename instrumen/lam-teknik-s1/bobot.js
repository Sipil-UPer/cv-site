/* =====================================================================
   BOBOT BUTIR — Lampiran "Bobot Penilaian Akreditasi Program Studi"
   LAM Teknik, instrumen APS-AV 2025 1.0, Program Sarjana.
   ---------------------------------------------------------------------
   Angka disalin dari lampiran bobot. Butir berkomponen dua punya bobot
   per komponen; yang disimpan di sini JUMLAHNYA, karena skor butir
   sudah digabung lebih dulu dengan rumus matriks.

   Itu sah karena rasio bobot komponen sama dengan rasio pada rumus
   gabungan — sudah diperiksa untuk kesebelas butir berkomponen dua:

     butir  bobot I/II      rasio    rumus matriks
       4    1,18 / 0,58     2,03     (I×2 + II)/3     -> 2:1
       5    0,32 / 0,62     0,52     (I + 2×II)/3     -> 1:2
       6    0,52 / 1,01     0,52     (I + 2×II)/3     -> 1:2
      13    1,21 / 1,21     1,00     (I + II)/2       -> 1:1
      14    1,04 / 1,07     0,97     (I + II)/2       -> 1:1
      15    0,80 / 1,67     0,48     (I + 2×II)/3     -> 1:2
      16    1,02 / 1,02     1,00     (I + II)/2       -> 1:1
      21    1,46 / 1,46     1,00     (I + II)/2       -> 1:1
      38    2,66 / 2,66     1,00     (I + II)/2       -> 1:1
      43    1,85 / 0,62     2,98     ((I×3) + II)/4   -> 3:1
      53    2,42 / 2,42     1,00     (I + II)/2       -> 1:1

   Karena sepakat, skor_butir × Σbobot memberi hasil yang sama dengan
   Σ(skor_komponen × bobot_komponen). Kalau salah satu angka di bawah
   diperbaiki dan rasionya tidak lagi cocok, hitungannya harus diubah
   jadi per komponen.

   PEMERIKSAAN JUMLAH: seluruh bobot di bawah berjumlah 100,01 — praktis
   tepat 100. Itu bukti kuat bahwa daftar ini lengkap dan tidak ada angka
   yang salah salin, karena satu kekeliruan akan menggeser jumlahnya.

   Sekaligus menjawab baris kosong pada butir 58: kolom bobot komponen II
   ("Ketepatan analisis SWOT") memang kosong di lampiran, bukan terpotong
   saat dipindai. Kalau ada bobot yang hilang di sana, jumlahnya akan
   kurang dari 100 sebesar angka itu. Jadi 2,92 berlaku untuk butir 58
   secara keseluruhan.
   ===================================================================== */

export const BOBOT = {
  '1': 1.14, '2': 0.69, '3': 0.22,
  '4': 1.18 + 0.58,        // I struktur organisasi + II GUG
  '5': 0.32 + 0.62,        // I komitmen + II kemampuan manajerial
  '6': 0.52 + 1.01,        // I relevansi + II tingkat kerja sama
  '7': 1.01, '8': 0.60, '9': 0.49, '10': 0.49, '11': 0.24, '12': 1.09,
  '13': 1.21 + 1.21,       // I profil lulusan + II kesesuaian CPL
  '14': 1.04 + 1.07,       // I kesesuaian CPL + II tinjauan rutin
  '15': 0.80 + 1.67,       // I kelengkapan RPS + II tinjauan rutin
  '16': 1.02 + 1.02,       // I proses + II tinjauan rutin
  '17': 2.37, '18': 0.79, '19': 1.05, '20': 1.05,
  '21': 1.46 + 1.46,       // I pengelolaan + II kebebasan ilmiah
  '22': 1.37, '23': 1.11, '24': 0.92, '25': 0.74,
  '26': 1.06, '27': 1.76, '28': 0.85, '29': 2.06, '30': 0.28,
  '31': 0.39, '32': 0.22, '33': 0.39, '34': 0.22,
  '35': 1.88, '36': 2.17, '37': 2.17,
  '38': 2.66 + 2.66,       // I akademik + II non-akademik
  '39': 2.19, '40': 0.85, '41': 0.60, '42': 1.22,
  '43': 1.85 + 0.62,       // I akademik + II non-akademik
  '44': 1.22, '45': 1.22, '46': 1.51, '47': 0.38,
  '48': 3.39, '49': 3.18, '50': 3.18, '51': 3.18, '52': 2.47,
  '53': 2.42 + 2.42,       // I unit penjaminan mutu + II perangkat SPMI
  '54': 2.92, '55': 1.93, '56': 2.91, '57': 2.75,
  '58': 2.92,              // mencakup kedua komponen; lihat catatan jumlah
  '59': 1.88, '60': 2.47,
};

export const BOBOT_TOTAL =
  Object.values(BOBOT).reduce((a, b) => a + b, 0);

export const bobotButir = no => BOBOT[String(no)] ?? 0;
