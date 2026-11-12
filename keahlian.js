// Peta keahlian dosen (pemilik 2026-11-11; 60-patch-keahlian.sql). Hanya data publik
// data.json: dosen[].kata_kunci dan bidang_keahlian (diisi dosen, disetujui admin),
// publikasi[].topik (topik OpenAlex), judul publikasi/kegiatan/luaran terverifikasi.
// Dipakai keahlian.html (cari pakar, peta topik, usulan pembimbing TA) dan hibah.html
// (usulan anggota tim). Tanpa peramban, bisa diuji.

// Bobot kecocokan: kata kunci dosen > topik OpenAlex > judul karya.
// Dengan daftar baku (patch 61): topik pilihan dosen 6, topik baku dari karyanya 2 per karya (maks. 3).
export const BOBOT = { pilihan: 6, kata: 5, bidang: 3, topik: 2, karyaBaku: 2, judul: 1 };
// Kata umum yang tidak membedakan keahlian (Indonesia dan Inggris).
const UMUM = new Set(('dan atau yang di ke dari untuk pada dengan dalam terhadap sebagai oleh serta antara ' +
  'studi kasus analisis kajian penerapan pengaruh evaluasi perancangan desain sistem metode model berbasis ' +
  'menggunakan melalui baru tahun kota kabupaten provinsi indonesia daerah wilayah program kegiatan ' +
  'the and of in on for to a an with by from using based case study analysis approach evaluation design ' +
  'system method model new its at as into via toward towards').split(' '));

const AKSEN = new RegExp('[\u0300-\u036f]', 'g');   // tanda aksen setelah NFD
export const normal = s => String(s ?? '').normalize('NFD').replace(AKSEN, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export const token = s => [...new Set(normal(s).split(' ').filter(w => w.length >= 3 && !UMUM.has(w)))];
const pecahBidang = s => String(s || '').split(/[,;/\n]+/).map(x => x.trim()).filter(Boolean);
const topikKarya = k => (k.topik || []).map(x => x && x.t).filter(Boolean);

// ---------------------------------------------------------------------------
// Daftar keahlian baku (61-patch-keahlian-baku.sql, pemilik 2026-11-12): bidang -> topik,
// nama Indonesia/Inggris, sinonim, padanan. data.json.keahlian_baku; null bila belum ada.

/** { bidang[], topik[], perKode: Map(kode -> topik), istilah: Map(kode -> [frasa ternormal]) } atau null. */
export function daftarBaku(D){
  const kb = D && D.keahlian_baku;
  if (!kb || !(kb.topik || []).length) return null;
  const istilah = new Map(kb.topik.map(t => [t.kode,
    [...new Set([t.nama, t.nama_en, ...(t.sinonim || []), ...(t.padanan || [])].map(normal).filter(Boolean))]]));
  return { bidang: kb.bidang || [], topik: kb.topik, perKode: new Map(kb.topik.map(t => [t.kode, t])), istilah };
}

/** Kode topik baku yang frasanya muncul utuh di teks (nama, sinonim, atau padanan), urut daftar. */
export function topikDariTeks(B, teks){
  if (!B) return [];
  const t = ` ${normal(teks)} `;
  return B.topik.filter(x => B.istilah.get(x.kode).some(f => t.includes(` ${f} `))).map(x => x.kode);
}

/**
 * Profil keahlian per dosen (DTPS di data.json). Hasil [{ slug, nama, kata[], bidang[], topik: Map(label -> n),
 * karya: [{ judul, tahun, jenis, topik[], baku[] }], pilihan[] (kode topik baku dipilih dosen),
 * dariKarya: Map(kode -> jumlah karya) }], urut nama. pilihan/dariKarya kosong tanpa daftar baku.
 */
export function profilKeahlian(D){
  const B = daftarBaku(D);
  const per = new Map();
  for (const d of D.dosen || []) per.set(d.slug, { slug: d.slug, nama: d.nama, kata: (d.kata_kunci || []).filter(Boolean),
    bidang: pecahBidang(d.bidang_keahlian), topik: new Map(), karya: [],
    pilihan: B ? (d.topik_keahlian || []).filter(k => B.perKode.has(k)) : [], dariKarya: new Map() });
  const bySlugNama = new Map([...per.values()].map(p => [normal(p.nama), p]));
  const tambah = (p, k, jenis) => {
    const t = topikKarya(k);
    // Topik baku dari judul dan topik OpenAlex karya ini (padanan otomatis).
    const baku = topikDariTeks(B, [k.judul, ...t].join(' | '));
    p.karya.push({ judul: k.judul, tahun: k.tahun, jenis, topik: t, baku });
    t.forEach(x => p.topik.set(x, (p.topik.get(x) || 0) + 1));
    baku.forEach(x => p.dariKarya.set(x, (p.dariKarya.get(x) || 0) + 1));
  };
  for (const k of D.publikasi || []) for (const a of k.penulis || []) { const p = per.get(a.slug); if (p) tambah(p, k, 'publikasi'); }
  for (const k of D.kegiatan || []) for (const a of k.penulis || []) { const p = per.get(a.slug); if (p) tambah(p, k, k.kategori); }
  for (const k of D.luaran_dosen || []) for (const n of k.dosen || []) { const p = bySlugNama.get(normal(n)); if (p) tambah(p, k, 'luaran'); }
  for (const p of per.values()) p.karya.sort((a, b) => (b.tahun || 0) - (a.tahun || 0));
  return [...per.values()].sort((a, b) => a.nama.localeCompare(b.nama));
}

const cocokTeks = (q, teks) => { const t = new Set(token(teks)); return q.filter(w => t.has(w)); };

/**
 * Dosen yang relevan dengan kueri (topik, judul TA, judul proposal). Hasil urut skor:
 * [{ slug, nama, skor, alasan: { kata[], bidang[], topik[] }, karya: [judul, ...] }], hanya skor > 0.
 * Frasa kueri yang persis sama dengan kata kunci dosen diberi bobot penuh dua kali.
 */
export function cariPakar(P, kueri, { kecuali = [], B = null } = {}){
  const q = token(kueri), qn = normal(kueri);
  if (!q.length) return [];
  // Topik baku yang dimaksud kueri (mis. "flood", "genangan", "banjir" -> AIR02).
  const qb = topikDariTeks(B, kueri);
  const out = [];
  for (const p of P) {
    if (kecuali.includes(p.slug)) continue;
    const kata = p.kata.filter(k => cocokTeks(q, k).length || (qn && normal(k) === qn));
    const bidang = p.bidang.filter(b => cocokTeks(q, b).length);
    const topik = [...p.topik.keys()].filter(t => cocokTeks(q, t).length);
    const karya = p.karya.filter(k => cocokTeks(q, k.judul).length || k.topik.some(t => topik.includes(t))
      || (k.baku || []).some(x => qb.includes(x)));
    const pilih = qb.filter(x => p.pilihan.includes(x)), dari = qb.filter(x => p.dariKarya.has(x));
    let skor = 0;
    // Topik baku: pilihan dosen sendiri paling kuat, lalu karyanya (paling banyak 3 karya per topik dihitung).
    pilih.forEach(() => { skor += BOBOT.pilihan; });
    dari.forEach(x => { skor += BOBOT.karyaBaku * Math.min(3, p.dariKarya.get(x)); });
    kata.forEach(k => { skor += BOBOT.kata * cocokTeks(q, k).length + (normal(k) === qn ? BOBOT.kata * 2 : 0); });
    bidang.forEach(b => { skor += BOBOT.bidang * cocokTeks(q, b).length; });
    topik.forEach(t => { skor += BOBOT.topik * cocokTeks(q, t).length * Math.min(3, p.topik.get(t)); });
    // Judul: paling banyak 5 karya dihitung, supaya dosen yang sangat produktif tidak menenggelamkan kata kunci.
    karya.slice(0, 5).forEach(k => { skor += BOBOT.judul * cocokTeks(q, k.judul).length; });
    const baku = [...new Set([...pilih, ...dari])].map(x => B.perKode.get(x).nama);
    if (skor > 0) out.push({ slug: p.slug, nama: p.nama, skor, alasan: { kata, bidang, topik, baku },
      karya: karya.slice(0, 3).map(k => k.judul) });
  }
  return out.sort((a, b) => b.skor - a.skor || a.nama.localeCompare(b.nama));
}

/**
 * Peta topik: tiap kata kunci dosen (digabung tanpa beda huruf besar) dan topik OpenAlex,
 * dengan dosen yang memegangnya dan jumlah karya. Urut: jumlah dosen, lalu jumlah karya.
 * tunggal = hanya satu dosen (keahlian yang bergantung pada satu orang).
 */
export function petaTopik(P){
  const peta = new Map();
  const ambil = (label, jenis) => {
    const k = normal(label);
    if (!k) return null;
    if (!peta.has(k)) peta.set(k, { label, jenis, dosen: new Map() });
    return peta.get(k);
  };
  for (const p of P) {
    for (const kata of [...p.kata, ...p.bidang]) {
      const r = ambil(kata, 'kata'); if (!r) continue;
      const n = p.karya.filter(k => cocokTeks(token(kata), k.judul).length).length;
      r.dosen.set(p.nama, Math.max(r.dosen.get(p.nama) || 0, n));
    }
    for (const [t, n] of p.topik) { const r = ambil(t, 'topik'); if (r) r.dosen.set(p.nama, Math.max(r.dosen.get(p.nama) || 0, n)); }
  }
  return [...peta.values()].map(r => ({ label: r.label, jenis: r.jenis, dosen: [...r.dosen.keys()].sort(),
    karya: [...r.dosen.values()].reduce((a, b) => a + b, 0), tunggal: r.dosen.size === 1 }))
    .sort((a, b) => b.dosen.length - a.dosen.length || b.karya - a.karya || a.label.localeCompare(b.label));
}

/**
 * Peta keahlian baku: satu baris per topik baku, urut bidang lalu topik.
 * { kode, bidang, nama, nama_en, pilih: [nama dosen yang memilih], karya: Map(nama dosen -> jumlah karya),
 *   dosen: [semua nama, pilih atau berkarya], nKarya, tunggal: tepat 1 dosen, kosong: 0 dosen }.
 * Ringkasan per bidang: { kode, nama, nama_en, topik, dosen (unik), nKarya, tunggal, kosong }.
 */
export function petaBaku(P, B){
  if (!B) return null;
  const baris = B.topik.map(t => {
    const pilih = P.filter(p => p.pilihan.includes(t.kode)).map(p => p.nama);
    const karya = new Map(P.filter(p => p.dariKarya.has(t.kode)).map(p => [p.nama, p.dariKarya.get(t.kode)]));
    const dosen = [...new Set([...pilih, ...karya.keys()])].sort((a, b) => a.localeCompare(b));
    // Jumlah karya unik untuk topik ini (satu karya bersama beberapa dosen dihitung sekali).
    const nKarya = new Set(P.flatMap(p => p.karya.filter(k => (k.baku || []).includes(t.kode)).map(k => k.judul))).size;
    return { kode: t.kode, bidang: t.bidang, nama: t.nama, nama_en: t.nama_en, pilih, karya, dosen, nKarya,
      tunggal: dosen.length === 1, kosong: !dosen.length };
  });
  const bidang = B.bidang.map(b => {
    const xs = baris.filter(r => r.bidang === b.kode);
    return { kode: b.kode, nama: b.nama, nama_en: b.nama_en, topik: xs.length,
      dosen: new Set(xs.flatMap(r => r.dosen)).size,
      nKarya: new Set(P.flatMap(p => p.karya.filter(k => (k.baku || []).some(c => xs.some(r => r.kode === c))).map(k => k.judul))).size,
      tunggal: xs.filter(r => r.tunggal).length, kosong: xs.filter(r => r.kosong).length };
  });
  return { baris, bidang };
}

/** Matriks topik × dosen untuk CSV: sel "P" = dipilih dosen, angka = jumlah karya, "P+n" = keduanya. */
export function matriksBaku(P, B){
  const peta = petaBaku(P, B);
  if (!peta) return [];
  const nama = P.map(p => p.nama);
  return [['Kode', 'Bidang', 'Topik', 'Topic', ...nama, 'Jumlah dosen', 'Jumlah karya'],
    ...peta.baris.map(r => [r.kode, r.bidang, r.nama, r.nama_en, ...nama.map(n => {
      const pil = r.pilih.includes(n), k = r.karya.get(n) || 0;
      return pil && k ? `P+${k}` : pil ? 'P' : k ? String(k) : '';
    }), r.dosen.length, r.nKarya])];
}

/**
 * Usulan pembimbing dan penguji untuk beberapa judul TA sekaligus. Agar tidak menumpuk pada
 * satu dosen, skor dibagi (1 + 0,25 × jumlah tugas yang sudah diberikan dalam daftar ini).
 * Hasil [{ judul, pembimbing: [{nama, skor}], penguji: [...], tanpa: true bila tak ada yang cocok }] dan beban per dosen.
 */
export function usulanTA(P, daftarJudul, { pembimbing = 2, penguji = 2, B = null } = {}){
  const beban = new Map();
  const hasil = daftarJudul.map(j => String(j || '').trim()).filter(Boolean).map(judul => {
    const calon = cariPakar(P, judul, { B }).map(c => ({ ...c, nilai: c.skor / (1 + 0.25 * (beban.get(c.nama) || 0)) }))
      .sort((a, b) => b.nilai - a.nilai || a.nama.localeCompare(b.nama));
    const pb = calon.slice(0, pembimbing), pg = calon.slice(pembimbing, pembimbing + penguji);
    [...pb, ...pg].forEach(c => beban.set(c.nama, (beban.get(c.nama) || 0) + 1));
    const ringkas = c => ({ nama: c.nama, skor: c.skor,
      alasan: [...new Set([...(c.alasan.baku || []), ...c.alasan.kata, ...c.alasan.bidang, ...c.alasan.topik])].slice(0, 3) });
    return { judul, pembimbing: pb.map(ringkas), penguji: pg.map(ringkas), tanpa: !calon.length };
  });
  return { hasil, beban: [...beban.entries()].sort((a, b) => b[1] - a[1]) };
}
