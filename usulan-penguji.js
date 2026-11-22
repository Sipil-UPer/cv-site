// Usulan penguji seminar/sidang TA (pemilik 2026-11-17): judul TA dicocokkan dengan keahlian, publikasi, dan
// penelitian/PkM dosen memakai mesin "Cari calon pembimbing TA" (pembimbing.js), pembimbing dikeluarkan, dan beban
// menguji pada TS berjalan ditampilkan untuk pemerataan. Saran saja: penetapan tetap oleh admin.
import { cariPembimbing } from './pembimbing.js?v=2026-11-22-866c27';

// TS berjalan (1 September s.d. 31 Agustus; ditulis tahun ujung), sama dengan sdgs-unduh.js tsBerjalan.
export const tsDari = tgl => { const m = String(tgl || '').match(/^(\d{4})-(\d{2})/); return m ? (+m[2] >= 9 ? +m[1] + 1 : +m[1]) : 0; };

// Beban menguji per NIDN pada TS `ts` dari baris jadwal_ta (yang tidak batal).
export function bebanUji(jadwal, ts){
  const out = new Map();
  for (const j of jadwal || []) {
    if (j.status === 'batal' || tsDari(j.tanggal) !== ts) continue;
    for (const n of j.penguji || []) out.set(n, (out.get(n) || 0) + 1);
  }
  return out;
}

// Usulan: [{nidn, nama, skor, alasan, beban}] paling banyak `batas`. dosen = [{nidn, nama}] (calon penguji yang sah);
// model = siapkan(data.json); kecuali = Set NIDN pembimbing. Dosen dicocokkan menurut nama (data.json tidak memuat NIDN).
export function usulPenguji(judul, model, dosen, { kecuali = new Set(), beban = new Map(), batas = 3 } = {}){
  if (!String(judul || '').trim() || !model) return [];
  const perNama = new Map(dosen.map(d => [String(d.nama).trim().toLowerCase(), d]));
  return cariPembimbing(judul, model, 20).hasil
    .map(h => ({ h, d: perNama.get(String(h.nama).trim().toLowerCase()) }))
    .filter(x => x.d && !kecuali.has(x.d.nidn))
    .slice(0, batas)
    .map(({ h, d }) => ({ nidn: d.nidn, nama: d.nama, skor: h.skor, alasan: h.alasan, beban: beban.get(d.nidn) || 0 }));
}
