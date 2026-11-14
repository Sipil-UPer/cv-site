// Impor publikasi menjadi draf (pemilik 2026-11-10): data OpenAlex
// (api.openalex.org, gratis, boleh dipanggil dari browser) dipetakan ke
// isian karya. Tiga jalur: DOI, ORCID di profil, ekspor Google Scholar
// (DOI dicari dari judul). Status draf: supabase/41-patch-draf-karya.sql.
// Fungsi murni di sini diuji tests/js/impor_karya.test.mjs.

export const OPENALEX = 'https://api.openalex.org';
const PILIH = 'id,doi,title,publication_year,publication_date,type,primary_location,biblio,counts_by_year,authorships';

// Jenis karya OpenAlex yang bukan publikasi untuk LKPS: tidak dicentang bawaan.
const BUKAN_PUBLIKASI = ['dataset', 'dissertation', 'software', 'other', 'paratext', 'erratum',
  'peer-review', 'supplementary-materials', 'libguides'];

export function rapiDoi(s) {
  return String(s || '').trim().toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, '').replace(/^doi:\s*/, '').trim();
}

// Satu DOI per baris (atau dipisah spasi/koma); yang tidak berbentuk DOI dibuang.
export function daftarDoi(teks) {
  return [...new Set(String(teks || '').split(/[\s,;]+/).map(rapiDoi).filter(d => /^10\.\d{4,9}\/\S+$/.test(d)))];
}

export function jenisDari(w) {
  const t = w.type || '', src = w.primary_location?.source?.type || '';
  if (t === 'conference-paper' || t === 'proceedings-article' || src === 'conference') return 'prosiding';
  if (t === 'book-chapter') return 'bab_buku';
  if (t === 'book') return 'buku';
  if (['article', 'review', 'letter', 'editorial'].includes(t)) return 'jurnal';
  return 'lainnya';
}

export const centangBawaan = w => !!w.publication_year && !BUKAN_PUBLIKASI.includes(w.type);

// TS dinamai menurut tahun akhirnya; September ke atas masuk TS berikutnya.
export const tsDari = hariIni => +hariIni.slice(0, 4) + (+hariIni.slice(5, 7) >= 9 ? 1 : 0);

// Sitasi per tahun kalender (42-patch-sitasi-tahunan.sql). OpenAlex
// counts_by_year mencakup sepuluh tahun terakhir dan tidak memuat tahun
// bersitasi nol: tahun sejak terbit di dalam rentang itu diisi 0; tahun
// yang lebih tua tidak diketahui dan dibiarkan kosong.
export function sitasiTahunan(w, tahunIni) {
  const ada = new Map((w.counts_by_year || []).map(c => [c.year, c.cited_by_count || 0]));
  const awal = Math.max(w.publication_year || tahunIni, tahunIni - 9);
  const out = [];
  for (let t = awal; t <= tahunIni; t++) out.push({ tahun: t, jumlah: ada.get(t) || 0 });
  return out;
}

// Sitasi "tiga tahun terakhir" LKPS 4.i: tahun kalender yang beririsan
// dengan TS-2 s.d. TS (tahun awal TS-2 sampai tahun akhir TS; pemilik 2026-11-10).
export function sitasi3(w, ts) {
  return (w.counts_by_year || []).filter(c => c.year >= ts - 3 && c.year <= ts)
    .reduce((n, c) => n + (c.cited_by_count || 0), 0);
}

const orcidRapi = s => String(s || '').trim().replace(/^https?:\/\/orcid\.org\//, '').toUpperCase();

// Posisi dosen pada daftar penulis, menurut ORCID-nya (kosong = tidak dikenali).
export function peranDari(w, orcid) {
  const o = orcidRapi(orcid);
  const a = o && (w.authorships || []).find(x => orcidRapi(x.author?.orcid) === o);
  return { peran: a?.author_position === 'first' ? 'penulis_pertama' : 'anggota',
           korespondensi: !!a?.is_corresponding, dikenali: !!a };
}

// ID OpenAlex ('W' + angka) dari URL work; null bila tidak ada (44-patch-openalex-id.sql).
export const idOA = s => (String(s || '').match(/W\d+$/) || [null])[0];

// Volume dan nomor (74-patch-volume-nomor.sql); kunci hanya ada bila terisi,
// supaya impor tetap jalan sebelum patch itu dijalankan.
export const volNo = (volume, nomor) => {
  const v = String(volume ?? '').trim(), n = String(nomor ?? '').trim();
  return { ...(v ? { volume: v.slice(0, 40) } : {}), ...(n ? { nomor: n.slice(0, 40) } : {}) };
};

// Draf karya dari satu work OpenAlex. hariIni: 'YYYY-MM-DD'.
export function drafDari(w, { orcid = '', hariIni }) {
  const ts = tsDari(hariIni);
  const bulan = w.publication_date ? +w.publication_date.slice(5, 7) || null : null;
  const doi = rapiDoi(w.doi);
  return {
    karya: {
      kategori: 'publikasi', status: 'draf', judul: (w.title || '').trim(), jenis: jenisDari(w),
      tahun: w.publication_year || null, bulan,
      nama_terbitan: w.primary_location?.source?.display_name || null,
      doi: doi || null, url: w.primary_location?.landing_page_url || (doi ? `https://doi.org/${doi}` : null),
      // Tautan "karya yang mengutip" untuk asesor (pemilik 2026-11-10).
      ...(idOA(w.id) ? { openalex_id: idOA(w.id) } : {}),
      ...volNo(w.biblio?.volume, w.biblio?.issue),
    },
    // Baris karya_sitasi (sumber OpenAlex) dan jumlah untuk TS berjalan (pratinjau).
    sitasi: sitasiTahunan(w, +hariIni.slice(0, 4)).map(r => ({ ...r, sumber: 'openalex', diambil: hariIni })),
    sitasiTS: sitasi3(w, ts),
    penulis: peranDari(w, orcid),
    centang: centangBawaan(w),
    tipe: w.type || '',
  };
}

// ---- Panggilan API (tidak diuji tanpa jaringan) ----------------------
// Batas harian OpenAlex per alamat IP tanpa kunci API (diamati 2026-11-10):
// 1000 kredit; pencarian judul memakan 10 kredit, jadi sekitar 100 pencarian
// per hari, dibagi semua pengguna di jaringan yang sama. Jawaban 429 menjadi
// galat {batas: true, tunggu: detik} agar halaman berhenti memanggil.
async function periksa(r) {
  if (r.status === 429) {
    const e = new Error('Batas harian OpenAlex untuk jaringan ini habis.');
    e.batas = true;
    e.tunggu = +(r.headers.get('retry-after') || 0) || null;
    throw e;
  }
  if (!r.ok) throw new Error(`OpenAlex ${r.status}`);
  return r.json();
}

// Pesan batas habis dengan perkiraan jam pulih (waktu lokal pengguna).
export function teksBatas(e, sekarang = new Date()) {
  if (!e?.tunggu) return 'Batas harian OpenAlex untuk jaringan ini habis; coba lagi besok.';
  const pulih = new Date(sekarang.getTime() + e.tunggu * 1000);
  const jam = `${String(pulih.getHours()).padStart(2, '0')}.${String(pulih.getMinutes()).padStart(2, '0')}`;
  const besok = pulih.toDateString() !== sekarang.toDateString();
  return `Batas harian OpenAlex untuk jaringan ini habis; coba lagi sekitar pukul ${jam}${besok ? ' besok' : ''}.`;
}

export async function ambilDoi(doi, ambil = fetch) {
  const r = await ambil(`${OPENALEX}/works/doi:${encodeURI(rapiDoi(doi))}?select=${PILIH}`);
  if (r.status === 404) return null;
  return periksa(r);
}

// Semua karya satu ORCID (pemilik 2026-11-10): penulis OpenAlex dari ORCID
// (/authors/orcid:), lalu karyanya per 100 (/works?filter=author.id:). Hasil
// {nama, jumlah, works}; nama ditampilkan agar dosen memastikan itu dirinya.
// null bila ORCID tidak dikenal OpenAlex.
export async function karyaOrcid(orcid, ambil = fetch, maksHalaman = 5) {
  const o = String(orcid || '').trim().replace(/^https?:\/\/orcid\.org\//i, '');
  const ra = await ambil(`${OPENALEX}/authors/orcid:${encodeURIComponent(o)}`);
  if (ra.status === 404) return null;
  const a = await periksa(ra);
  const id = String(a.id || '').split('/').pop();
  const works = [];
  for (let hal = 1; hal <= maksHalaman; hal++) {
    const r = await ambil(`${OPENALEX}/works?filter=author.id:${id}&per_page=100&page=${hal}&select=${PILIH}`);
    const j = await periksa(r);
    works.push(...(j.results || []));
    if (works.length >= (j.meta?.count ?? 0) || !(j.results || []).length) break;
  }
  return { nama: a.display_name || '', jumlah: a.works_count ?? works.length, works };
}

// Banyak DOI sekaligus (filter doi:a|b|..., sampai 100 nilai per filter menurut
// dokumentasi OpenAlex; dipakai 50 agar alamat tidak terlalu panjang).
// Hasil: Map DOI rapi -> work. Untuk tombol admin "Perbarui sitasi" (pemilik 2026-11-10).
export async function ambilBanyakDoi(dois, ambil = fetch, ukuran = 50) {
  const hasil = new Map(), semua = [...new Set(dois.map(rapiDoi).filter(Boolean))];
  for (let i = 0; i < semua.length; i += ukuran) {
    const kel = semua.slice(i, i + ukuran);
    const filter = 'doi:' + kel.map(d => encodeURIComponent(d.includes(',') ? `"${d}"` : d)).join('|');
    const r = await ambil(`${OPENALEX}/works?filter=${filter}&per_page=${ukuran}&select=id,doi,publication_year,counts_by_year,topics`);
    for (const w of (await periksa(r)).results || []) hasil.set(rapiDoi(w.doi), w);
  }
  return hasil;
}

// Topik OpenAlex satu work (peta keahlian, pemilik 2026-11-11; 60-patch-keahlian.sql):
// paling banyak 3, bentuk ringkas {t: topik, s: subbidang, f: bidang, n: skor}.
// Bentuk OpenAlex diperiksa 2026-11-11: topics[{display_name, score, subfield{display_name}, field{display_name}}].
export function topikDari(w) {
  return (w?.topics || []).filter(x => x && x.display_name).slice(0, 3).map(x => ({
    t: x.display_name, s: x.subfield?.display_name || '', f: x.field?.display_name || '',
    n: Math.round((+x.score || 0) * 1000) / 1000 }));
}

// Rencana pembaruan sitasi untuk karya ber-DOI. karya: [{id, doi, karya_sitasi:[{tahun, jumlah, sumber}]}].
// Tahun yang kosong atau bersumber OpenAlex diisi/diperbarui; angka isian dosen
// (google_scholar/scopus/manual) tidak disentuh. Hasil: {baris, diperbarui, dibiarkan, tidakDitemukan, sama, oa}.
// oa = [{id, oa}] karya yang ID OpenAlex-nya belum tercatat atau berubah (catat_openalex).
export function rencanaSitasi(karya, works, hariIni) {
  const tahunIni = +hariIni.slice(0, 4), baris = [], diperbarui = new Set(), tidakDitemukan = [], oa = [];
  let dibiarkan = 0, sama = 0;
  for (const k of karya) {
    const w = works.get(rapiDoi(k.doi));
    if (!w) { tidakDitemukan.push(k); continue; }
    if (idOA(w.id) && idOA(w.id) !== k.openalex_id) oa.push({ id: k.id, oa: idOA(w.id) });
    const ada = new Map((k.karya_sitasi || []).map(r => [+r.tahun, r]));
    for (const r of sitasiTahunan(w, tahunIni)) {
      const lama = ada.get(r.tahun);
      if (lama && lama.sumber !== 'openalex') { dibiarkan++; continue; }
      if (lama && +lama.jumlah === r.jumlah) { sama++; continue; }
      baris.push({ karya_id: k.id, tahun: r.tahun, jumlah: r.jumlah, sumber: 'openalex', diambil: hariIni });
      diperbarui.add(k.id);
    }
  }
  return { baris, diperbarui: diperbarui.size, dibiarkan, tidakDitemukan, sama, oa };
}

// Lima kandidat OpenAlex untuk satu judul (pencarian teks, 10 kredit).
export async function cariJudul(judul, ambil = fetch) {
  const r = await ambil(`${OPENALEX}/works?search=${encodeURIComponent(String(judul).slice(0, 200))}&per_page=5&select=${PILIH}`);
  return (await periksa(r)).results || [];
}

// ---- Ekspor Google Scholar (BibTeX), pemilik 2026-11-10 ----------------
// Google Scholar tidak punya API; dosen mengekspor daftarnya sendiri dari
// profil (pilih artikel > Export > BibTeX) lalu mengunggah berkasnya.

// Sisa markup LaTeX yang muncul di ekspor Google Scholar.
export const rapiLatex = s => String(s || '').replace(/\\([_&%$#])/g, '$1').replace(/~/g, ' ')
  .replace(/--/g, '–').replace(/[{}]/g, '').replace(/\s+/g, ' ').trim();

// Entri BibTeX -> [{jenis, kunci, title, author, journal, booktitle, publisher, year, ...}].
// Nilai dalam kurung kurawal bersarang, tanda kutip, atau angka polos.
export function bacaBibtex(teks) {
  const t = String(teks || ''), out = [], re = /@(\w+)\s*\{/g;
  let m;
  while ((m = re.exec(t))) {
    let i = re.lastIndex, d = 1;
    while (i < t.length && d > 0) { if (t[i] === '{') d++; else if (t[i] === '}') d--; i++; }
    const isi = t.slice(re.lastIndex, i - 1);
    re.lastIndex = i;
    const jenis = m[1].toLowerCase();
    if (['comment', 'string', 'preamble'].includes(jenis)) continue;
    const koma = isi.indexOf(',');
    const badan = koma < 0 ? '' : isi.slice(koma + 1), f = {};
    let j = 0;
    const nama = /\s*([\w-]+)\s*=\s*/y, sisa = /\s*,?/y;
    while (j < badan.length) {
      nama.lastIndex = j;
      const r = nama.exec(badan);
      if (!r) break;
      j = nama.lastIndex;
      let v = '';
      if (badan[j] === '{') {
        let k = j + 1, d2 = 1;
        while (k < badan.length && d2 > 0) { if (badan[k] === '{') d2++; else if (badan[k] === '}') d2--; k++; }
        v = badan.slice(j + 1, k - 1); j = k;
      } else if (badan[j] === '"') {
        const k = badan.indexOf('"', j + 1);
        v = badan.slice(j + 1, k < 0 ? undefined : k); j = k < 0 ? badan.length : k + 1;
      } else {
        const k = badan.slice(j).search(/[,\n]/);
        v = badan.slice(j, k < 0 ? undefined : j + k); j = k < 0 ? badan.length : j + k;
      }
      f[r[1].toLowerCase()] = rapiLatex(v);
      sisa.lastIndex = j; sisa.exec(badan); j = sisa.lastIndex;
    }
    out.push({ jenis, kunci: koma < 0 ? isi.trim() : isi.slice(0, koma).trim(), ...f });
  }
  return out;
}

// Judul untuk dibandingkan: huruf kecil, hanya huruf dan angka (aksara apa pun).
export const judulRapi = s => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

// Kemiripan dua judul (Dice pada pasangan huruf), 0..1.
export function mirip(a, b) {
  const x = judulRapi(a), y = judulRapi(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const pas = s => { const m = new Map(); for (let i = 0; i < s.length - 1; i++) { const p = s.slice(i, i + 2); m.set(p, (m.get(p) || 0) + 1); } return m; };
  const px = pas(x), py = pas(y);
  let sama = 0;
  for (const [p, n] of px) sama += Math.min(n, py.get(p) || 0);
  return (2 * sama) / (Math.max(1, x.length - 1) + Math.max(1, y.length - 1));
}

// Kandidat OpenAlex yang cocok dengan entri: judul >= 0,9 mirip, tahun selisih <= 1.
export function pilihCocok(e, kandidat, ambang = 0.9) {
  let terbaik = null, nilai = 0;
  for (const w of kandidat || []) {
    if (e.year && w.publication_year && Math.abs(+e.year - w.publication_year) > 1) continue;
    const s = mirip(e.title, w.title);
    if (s > nilai) { nilai = s; terbaik = w; }
  }
  return nilai >= ambang ? terbaik : null;
}

const JENIS_BIB = { article: 'jurnal', inproceedings: 'prosiding', conference: 'prosiding', proceedings: 'prosiding',
  book: 'buku', incollection: 'bab_buku', inbook: 'bab_buku' };

// Dosen penulis pertama bila nama keluarga penulis pertama ada di namanya.
export function pertamaDariBib(author, namaSaya) {
  const satu = String(author || '').split(/\s+and\s+/i)[0] || '';
  const keluarga = (satu.includes(',') ? satu.split(',')[0] : satu.trim().split(/\s+/).pop() || '').toLowerCase().trim();
  const bagian = String(namaSaya || '').toLowerCase().split(/[^\p{L}]+/u).filter(Boolean);
  return !!keluarga && bagian.includes(keluarga);
}

// Draf dari entri BibTeX saja (tanpa kecocokan OpenAlex): tanpa DOI dan sitasi.
export function drafDariBib(e, { namaSaya = '' } = {}) {
  const tahun = /^\d{4}$/.test(e.year || '') ? +e.year : null;
  return {
    karya: { kategori: 'publikasi', status: 'draf', judul: e.title || '', jenis: JENIS_BIB[e.jenis] || 'lainnya',
      tahun, bulan: null, nama_terbitan: e.journal || e.booktitle || e.publisher || e.school || null, doi: null, url: null,
      ...volNo(e.volume, e.number) },
    penulis: { peran: pertamaDariBib(e.author, namaSaya) ? 'penulis_pertama' : 'anggota', korespondensi: false, dikenali: false },
    centang: !!tahun && e.jenis in JENIS_BIB,
    tipe: e.jenis,
    sitasi: [],
    sitasiTS: null,
  };
}
