// Tautan dari data ke kartu butir di skor.html (pemilik 2026-11-07): tiap isian
// (tab Data prodi, tab Input karya, baris isian, baris Verifikasi) menyebut
// butir yang memakainya. Kartu dibuka pada TS isian itu lewat ?ts=, supaya
// daftar "Data yang dipakai" di kartu memuat baris yang sama.

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// "48–51" -> ['48','49','50','51']; "15, 17, 19, 20" -> 4 nomor; "PS, 6.a" -> []
// (rujukan tabel LKPS, bukan butir).
export function nomorButir(teks){
  const out = [];
  String(teks ?? '').split(',').map(s => s.trim()).forEach(s => {
    const m = s.match(/^(\d{1,2})\s*[–-]\s*(\d{1,2})$/);
    if (m) { for (let i = +m[1]; i <= +m[2]; i++) out.push(String(i)); return; }
    if (/^\d{1,2}$/.test(s)) out.push(String(+s));
  });
  return [...new Set(out)].filter(n => +n >= 1 && +n <= 60);
}

// "2025/2026" -> 2026 (TS = tahun akhir tahun akademik); selain itu null.
export function tsDariTA(ta){
  const m = String(ta ?? '').trim().match(/^(\d{4})\/(\d{4})$/);
  return m && +m[2] === +m[1] + 1 ? +m[2] : null;
}

export function urlButir(no, ts){
  return `skor.html${ts ? `?ts=${ts}` : ''}#butir-${no}`;
}

// nos: daftar nomor butir; ts: TS kartu (boleh null = TS berjalan).
// awalan: "Dipakai di" untuk isian yang sudah terhitung, "Masuk ... setelah
// diverifikasi" untuk yang belum.
export function htmlTautanButir(nos, ts, awalan = 'Dipakai di'){
  const xs = [...new Set(nos || [])].map(String);
  if (!xs.length) return '';
  const a = xs.map(n => `<a href="${esc(urlButir(n, ts))}">butir ${esc(n)}</a>`).join(', ');
  return `<span class="ke-butir-data">${esc(awalan)} ${a}${ts ? ` <small>(TS ${ts - 1}/${ts})</small>` : ''}</span>`;
}

// TS satu baris bertanggal: September ke atas masuk TS berikutnya (sama dengan
// _ts_baris di bangun.py).
export function tsBaris(tahun, bulan){
  const t = +tahun;
  if (!Number.isFinite(t) || !t) return null;
  return +bulan >= 9 ? t + 1 : t;
}

// Butir yang memakai satu karya, menurut kategorinya (rumus di skor.html dan
// penyaring rincian.js). Butir bersyarat tambahan (35 karya utama, 46
// publikasi mahasiswa) tidak ditautkan dari sini karena syaratnya bergantung
// pada penulis dan bereputasi tidaknya terbitan.
export const BUTIR_KATEGORI = {
  publikasi: ['33'], penelitian: ['10', '23', '31'], pkm: ['11', '25', '32'],
  luaran: ['34'], rekognisi: ['37'], integrasi: ['17'],
};
export function butirKarya(k){
  const xs = [...(BUTIR_KATEGORI[k?.kategori] || [])];
  const adaMitra = (k?.karya_mitra || []).some(m => String(m.institusi || '').trim());
  if (adaMitra && ['publikasi', 'penelitian', 'pkm'].includes(k.kategori)) xs.unshift('6');
  return xs;
}

// Butir 30: baris BKD per dosen persis seperti rbk_prodi() (supabase/39):
// BKD terverifikasi, dosen DTPS bukan asesor, tahun akademik = TS. Beban per
// dosen = jumlah SKS BKD semua semesternya / 2; RBK = rata-rata beban itu.
const SKS_BKD = ['sks_pendidikan', 'sks_ps_lain_dalam', 'sks_ps_lain_luar', 'sks_penelitian', 'sks_pkm', 'sks_penunjang'];
export function barisBkd(bkd, dosen, ts){
  const ta = `${ts - 1}/${ts}`;
  const per = new Map((dosen || []).filter(d => d.dtps && d.peran !== 'asesor').map(d => [d.nidn, d]));
  const kel = new Map();
  (bkd || []).filter(b => b.verifikasi === 'terverifikasi' && b.tahun_akademik === ta && per.has(b.nidn))
    .forEach(b => { if (!kel.has(b.nidn)) kel.set(b.nidn, []); kel.get(b.nidn).push(b); });
  const baris = [...kel].map(([nidn, xs]) => {
    const sks = xs.reduce((a, b) => a + SKS_BKD.reduce((s, k) => s + (+b[k] || 0), 0), 0);
    return { nama: per.get(nidn).nama, nidn, semester: xs.map(b => b.semester).sort(),
             sks: Math.round(sks * 10000) / 10000, beban: Math.round(sks / 2 * 10000) / 10000,
             lengkap: xs.length === 2, berkas: xs.filter(b => b.bukti_url).map(b => ({ semester: b.semester, url: b.bukti_url })) };
  }).sort((a, b) => a.nama.localeCompare(b.nama));
  const rbk = baris.length ? Math.round(baris.reduce((a, b) => a + b.beban, 0) / baris.length * 10000) / 10000 : null;
  return { baris, rbk };
}
