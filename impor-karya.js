// Impor publikasi menjadi draf (pemilik 2026-11-10): data OpenAlex
// (api.openalex.org, gratis, boleh dipanggil dari browser) dipetakan ke
// isian karya. Tiga jalur: DOI, ORCID di profil, ekspor Google Scholar
// (DOI dicari dari judul). Status draf: supabase/41-patch-draf-karya.sql.
// Fungsi murni di sini diuji tests/js/impor_karya.test.mjs.

export const OPENALEX = 'https://api.openalex.org';
const PILIH = 'id,doi,title,publication_year,publication_date,type,primary_location,counts_by_year,authorships';

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
export async function ambilDoi(doi, ambil = fetch) {
  const r = await ambil(`${OPENALEX}/works/doi:${encodeURI(rapiDoi(doi))}?select=${PILIH}`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`OpenAlex ${r.status}`);
  return r.json();
}
