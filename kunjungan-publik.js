// Statistik kunjungan situs publik, ramah privasi (142-patch-kunjungan-publik.sql, pemilik 2026-11-21).
// Hanya jumlah per (hari, halaman, kategori asal, peristiwa); tanpa cookie, IP, atau penanda pengunjung.
// Logika murni (dites di Node: tests/js/kunjungan_publik.test.mjs) + satu fungsi kirim yang tidak pernah melempar galat.

export const RUJUKAN = ['langsung', 'internal', 'google', 'bing', 'instagram', 'facebook', 'whatsapp', 'linkedin', 'youtube',
  'tiktok', 'x', 'kampus', 'lainnya'];
export const PERISTIWA = ['lihat', 'kuis_selesai', 'daftar_klik'];

const POLA = [
  ['google', /(^|\.)google\.[a-z.]+$/], ['bing', /(^|\.)bing\.com$/], ['instagram', /(^|\.)instagram\.com$|^l\.instagram\.com$/],
  ['facebook', /(^|\.)(facebook|fb)\.com$|^l\.facebook\.com$|^lm\.facebook\.com$/], ['whatsapp', /(^|\.)whatsapp\.(com|net)$|^wa\.me$/],
  ['linkedin', /(^|\.)linkedin\.com$|^lnkd\.in$/], ['youtube', /(^|\.)youtube\.com$|^youtu\.be$/], ['tiktok', /(^|\.)tiktok\.com$/],
  ['x', /(^|\.)(twitter|x)\.com$|^t\.co$/], ['kampus', /(^|\.)universitaspertamina\.ac\.id$/],
];

/** Kategori asal dari document.referrer; host sendiri = internal; kosong/tidak terbaca = langsung.
 *  Parameter ?src=ig|wa|fb|li|yt (mis. tautan di kartu Instagram) menang bila ada. */
export function kategoriRujukan(referrer, hostSendiri = '', src = ''){
  const s = String(src || '').toLowerCase();
  const SRC = { ig: 'instagram', instagram: 'instagram', wa: 'whatsapp', whatsapp: 'whatsapp', fb: 'facebook', li: 'linkedin',
    yt: 'youtube', tt: 'tiktok' };
  if (SRC[s]) return SRC[s];
  let host = '';
  try { host = new URL(String(referrer || '')).hostname.toLowerCase(); } catch { return 'langsung'; }
  if (!host) return 'langsung';
  if (hostSendiri && host === String(hostSendiri).toLowerCase()) return 'internal';
  for (const [k, re] of POLA) if (re.test(host)) return k;
  return 'lainnya';
}

/** Nama halaman dari pathname + query: 'calon-mahasiswa.html', 'index.html', 'daftar.html:dosen', 'dosen/ani.html'. */
export function namaHalaman(pathname, search = ''){
  const bagian = String(pathname || '/').split('/').filter(Boolean);
  let nama = bagian.length ? bagian[bagian.length - 1] : 'index.html';
  if (!/\.html$/i.test(nama)) nama = 'index.html';
  if (bagian.length >= 2 && bagian[bagian.length - 2] === 'dosen') nama = 'dosen/' + nama;
  const jenis = new URLSearchParams(search || '').get('jenis');
  if (jenis && /^[a-z0-9_-]{1,20}$/i.test(jenis)) nama += ':' + jenis;
  // Mode latihan pengajuan (pemilik 2026-11-24): dicatat terpisah supaya angka halaman sungguhan tidak bertambah.
  if (new URLSearchParams(search || '').has('latihan')) nama += ':latihan';
  nama = nama.toLowerCase();
  return /^[a-z0-9._/:-]{1,100}$/.test(nama) ? nama : 'lainnya.html';
}

/** Bukan manusia (perayap, peramban otomatis) atau situs uji lokal: tidak dicatat. */
export function lewati({ ua = '', webdriver = false, host = '' } = {}){
  return Boolean(webdriver) || /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit/i.test(String(ua))
    || /^(localhost|127\.0\.0\.1|\[::1\])$|\.localhost$|\.test$/.test(String(host));
}

/** Kirim satu catatan; diam bila gagal atau tidak ada konfigurasi. */
export function catatKunjunganPublik(peristiwa = 'lihat', w = globalThis){
  try {
    const loc = w.location, nav = w.navigator || {};
    if (!w.SB_URL || !w.SB_KEY || !PERISTIWA.includes(peristiwa)) return;
    if (lewati({ ua: nav.userAgent, webdriver: nav.webdriver, host: loc.hostname })) return;
    const src = new URLSearchParams(loc.search).get('src');
    const isi = JSON.stringify({ p_halaman: namaHalaman(loc.pathname, loc.search),
      p_rujukan: peristiwa === 'lihat' ? kategoriRujukan(w.document?.referrer, loc.hostname, src) : 'internal', p_peristiwa: peristiwa });
    w.fetch(w.SB_URL + '/rest/v1/rpc/catat_kunjungan_publik', { method: 'POST', keepalive: true,
      headers: { apikey: w.SB_KEY, 'Content-Type': 'application/json' }, body: isi }).catch(() => {});
  } catch { /* statistik tidak boleh mengganggu halaman */ }
}

/** Rekap untuk halaman admin dari baris {t, h, r, p, n}. */
export function rekapKunjungan(baris = []){
  const lihat = baris.filter(x => x.p === 'lihat');
  const jumlah = xs => xs.reduce((a, x) => a + (+x.n || 0), 0);
  const per = (xs, k) => Object.entries(xs.reduce((o, x) => { o[x[k]] = (o[x[k]] || 0) + (+x.n || 0); return o; }, {}))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const luar = lihat.filter(x => x.r !== 'internal');
  return {
    kunjungan: jumlah(lihat), dariLuar: jumlah(luar),
    kuis: jumlah(baris.filter(x => x.p === 'kuis_selesai')), daftar: jumlah(baris.filter(x => x.p === 'daftar_klik')),
    perHalaman: per(lihat, 'h'), perRujukan: per(luar, 'r'), perHari: per(lihat, 't').sort((a, b) => a[0].localeCompare(b[0])),
  };
}
