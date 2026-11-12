// Peta keahlian dosen (pemilik 2026-11-11; 60-patch-keahlian.sql). Hanya data publik
// data.json: dosen[].kata_kunci dan bidang_keahlian (diisi dosen, disetujui admin),
// publikasi[].topik (topik OpenAlex), judul publikasi/kegiatan/luaran terverifikasi.
// Dipakai keahlian.html (cari pakar, peta topik, usulan pembimbing TA) dan hibah.html
// (usulan anggota tim). Tanpa peramban, bisa diuji.

// Bobot kecocokan: kata kunci dosen > topik OpenAlex > judul karya.
export const BOBOT = { kata: 5, bidang: 3, topik: 2, judul: 1 };
// Kata umum yang tidak membedakan keahlian (Indonesia dan Inggris).
const UMUM = new Set(('dan atau yang di ke dari untuk pada dengan dalam terhadap sebagai oleh serta antara ' +
  'studi kasus analisis kajian penerapan pengaruh evaluasi perancangan desain sistem metode model berbasis ' +
  'menggunakan melalui baru tahun kota kabupaten provinsi indonesia daerah wilayah program kegiatan ' +
  'the and of in on for to a an with by from using based case study analysis approach evaluation design ' +
  'system method model new its at as into via toward towards').split(' '));

export const normal = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export const token = s => [...new Set(normal(s).split(' ').filter(w => w.length >= 3 && !UMUM.has(w)))];
const pecahBidang = s => String(s || '').split(/[,;/\n]+/).map(x => x.trim()).filter(Boolean);
const topikKarya = k => (k.topik || []).map(x => x && x.t).filter(Boolean);

/**
 * Profil keahlian per dosen (DTPS di data.json). Hasil [{ slug, nama, kata[], bidang[], topik: Map(label -> n),
 * karya: [{ judul, tahun, jenis, topik[] }] }], urut nama.
 */
export function profilKeahlian(D){
  const per = new Map();
  for (const d of D.dosen || []) per.set(d.slug, { slug: d.slug, nama: d.nama, kata: (d.kata_kunci || []).filter(Boolean),
    bidang: pecahBidang(d.bidang_keahlian), topik: new Map(), karya: [] });
  const bySlugNama = new Map([...per.values()].map(p => [normal(p.nama), p]));
  const tambah = (p, k, jenis) => {
    const t = topikKarya(k);
    p.karya.push({ judul: k.judul, tahun: k.tahun, jenis, topik: t });
    t.forEach(x => p.topik.set(x, (p.topik.get(x) || 0) + 1));
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
export function cariPakar(P, kueri, { kecuali = [] } = {}){
  const q = token(kueri), qn = normal(kueri);
  if (!q.length) return [];
  const out = [];
  for (const p of P) {
    if (kecuali.includes(p.slug)) continue;
    const kata = p.kata.filter(k => cocokTeks(q, k).length || (qn && normal(k) === qn));
    const bidang = p.bidang.filter(b => cocokTeks(q, b).length);
    const topik = [...p.topik.keys()].filter(t => cocokTeks(q, t).length);
    const karya = p.karya.filter(k => cocokTeks(q, k.judul).length || k.topik.some(t => topik.includes(t)));
    let skor = 0;
    kata.forEach(k => { skor += BOBOT.kata * cocokTeks(q, k).length + (normal(k) === qn ? BOBOT.kata * 2 : 0); });
    bidang.forEach(b => { skor += BOBOT.bidang * cocokTeks(q, b).length; });
    topik.forEach(t => { skor += BOBOT.topik * cocokTeks(q, t).length * Math.min(3, p.topik.get(t)); });
    // Judul: paling banyak 5 karya dihitung, supaya dosen yang sangat produktif tidak menenggelamkan kata kunci.
    karya.slice(0, 5).forEach(k => { skor += BOBOT.judul * cocokTeks(q, k.judul).length; });
    if (skor > 0) out.push({ slug: p.slug, nama: p.nama, skor, alasan: { kata, bidang, topik }, karya: karya.slice(0, 3).map(k => k.judul) });
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
 * Usulan pembimbing dan penguji untuk beberapa judul TA sekaligus. Agar tidak menumpuk pada
 * satu dosen, skor dibagi (1 + 0,25 × jumlah tugas yang sudah diberikan dalam daftar ini).
 * Hasil [{ judul, pembimbing: [{nama, skor}], penguji: [...], tanpa: true bila tak ada yang cocok }] dan beban per dosen.
 */
export function usulanTA(P, daftarJudul, { pembimbing = 2, penguji = 2 } = {}){
  const beban = new Map();
  const hasil = daftarJudul.map(j => String(j || '').trim()).filter(Boolean).map(judul => {
    const calon = cariPakar(P, judul).map(c => ({ ...c, nilai: c.skor / (1 + 0.25 * (beban.get(c.nama) || 0)) }))
      .sort((a, b) => b.nilai - a.nilai || a.nama.localeCompare(b.nama));
    const pb = calon.slice(0, pembimbing), pg = calon.slice(pembimbing, pembimbing + penguji);
    [...pb, ...pg].forEach(c => beban.set(c.nama, (beban.get(c.nama) || 0) + 1));
    const ringkas = c => ({ nama: c.nama, skor: c.skor, alasan: [...c.alasan.kata, ...c.alasan.bidang, ...c.alasan.topik].slice(0, 3) });
    return { judul, pembimbing: pb.map(ringkas), penguji: pg.map(ringkas), tanpa: !calon.length };
  });
  return { hasil, beban: [...beban.entries()].sort((a, b) => b[1] - a[1]) };
}
