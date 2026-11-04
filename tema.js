/* =====================================================================
   tema.js — nilai warna tema.css untuk gambar. Canvas (led-grafik.js) dan
   SVG yang diekspor (grafik.html) tidak mengenal var(--nama), jadi nilainya
   dibaca dari halaman saat menggambar.
   ===================================================================== */
export const warna = nama =>
  getComputedStyle(document.documentElement).getPropertyValue(nama).trim();
