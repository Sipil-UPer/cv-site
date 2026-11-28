// Jurnal perkuliahan (206-patch-jurnal-perkuliahan.sql, pemilik 2026-11-28): realisasi materi per pertemuan oleh pengajar kelas;
// rencana dari materi pekan RPS (versi disahkan bila ada); BAP Word; kelengkapan untuk portofolio (komponen BAP).
import { rentangPekan } from './rps.js?v=2026-11-28-09fd85';
import { tglPanjang } from './surat.js?v=2026-11-28-09fd85';
import { para, run, teks, tabel, buatDocx } from './docx-dasar.js?v=2026-11-28-09fd85';

const LABEL_UJIAN = { uts: 'Ujian Tengah Semester (UTS)', uas: 'Ujian Akhir Semester (UAS)' };
const bersih = s => String(s ?? '').replace(/\s+/g, ' ').trim();

/** Rentang tanggal semester ['TTTT-BB-HH', 'TTTT-BB-HH'] (aturan situs: Ganjil 1 September–akhir Februari, Genap 1 Maret–31 Agustus;
 *  sama dengan semester_tanggal SQL 138), atau null bila TA/semester tidak dikenal. */
export function rentangSemester(ta, sm){
  const m = /^(\d{4})\/(\d{4})$/.exec(String(ta || ''));
  if (!m) return null;
  const y = +m[2], kabisat = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  if (sm === 'Ganjil') return [`${m[1]}-09-01`, `${m[2]}-02-${kabisat ? 29 : 28}`];
  if (sm === 'Genap') return [`${m[2]}-03-01`, `${m[2]}-08-31`];
  return null;
}
/** Galat tanggal pertemuan jurnal (pemilik 2026-11-28, uji alur semester): kosong, belum lewat, atau di luar semester kelas. '' = sah.
 *  Sama dengan pemeriksaan trigger kelas_pertemuan_rapikan (211). */
export function galatTanggalJurnal(tgl, ta, sm, hariIni){
  if (!tgl) return 'Isi tanggal.';
  if (hariIni && tgl > hariIni) return 'Tanggal belum lewat.';
  const r = rentangSemester(ta, sm);
  if (r && (tgl < r[0] || tgl > r[1])) return `Tanggal di luar semester ${sm} ${ta} (${tglPanjang(r[0])} sampai ${tglPanjang(r[1])}).`;
  return '';
}

/** Rencana pertemuan dari data RPS: [{ke, materi, jenis}] urut, satu baris per pekan (label "1-2" dipecah). */
export function rencanaRps(rps){
  const out = new Map();
  for (const p of rps?.pekan || []) {
    const jenis = p.jenis || 'kuliah';
    const materi = jenis === 'kuliah' ? bersih(p.materi) : (bersih(p.materi) || LABEL_UJIAN[jenis] || jenis.toUpperCase());
    for (const ke of rentangPekan(p.pekan)) if (!out.has(ke)) out.set(ke, { ke, materi, jenis });
  }
  return [...out.values()].sort((a, b) => a.ke - b.ke);
}

/** Baris jurnal: rencana RPS digabung isian (kelas_pertemuan); pertemuan di luar rencana ikut tampil. */
export function susunJurnal(rencana = [], isi = []){
  const per = new Map(isi.map(x => [x.pertemuan_ke, x]));
  const kes = [...new Set([...rencana.map(r => r.ke), ...per.keys()])].sort((a, b) => a - b);
  return kes.map(ke => ({ ke, rencana: rencana.find(r => r.ke === ke) || null, isi: per.get(ke) || null }));
}

/** Sama dengan RPS bila teks materi sama (abaikan spasi dan huruf besar) atau isian kosong. */
export const sesuaiRps = (materi, rps) => !bersih(rps) || bersih(materi).toLowerCase() === bersih(rps).toLowerCase();

/** Rekap satu kelas: tercatat, rencana (jumlah pertemuan RPS; 0 = RPS belum ada), berbeda dari RPS, lengkap (untuk BAP). */
export function rekapJurnal(isi = [], rencana = []){
  const n = isi.length, r = rencana.length;
  return { isi: n, rencana: r, beda: isi.filter(x => !sesuaiRps(x.materi, x.materi_rps)).length, lengkap: r ? n >= r : false };
}

/**
 * Isi <w:body> BAP/jurnal perkuliahan. o = { prodi, institusi, mk: {kode, nama, sks}, kelas: {tahun_akademik, semester, kelas},
 * pengampu: [nama], baris: susunJurnal(...), namaPengajar: (isi) => nama }.
 */
export function isiBap(o){
  const out = [];
  const kop = [o.institusi, o.prodi].filter(Boolean);
  kop.forEach((k, i) => out.push(para(run(k.toUpperCase(), { b: true, sz: i ? 24 : 22 }), { jc: 'center', before: 0, after: i === kop.length - 1 ? 200 : 0 })));
  out.push(para(run('JURNAL PERKULIAHAN (BERITA ACARA PERKULIAHAN)', { b: true, sz: 26 }), { jc: 'center', after: 200 }));
  out.push(tabel([['Isian', 'Keterangan'], ['Mata kuliah', `${o.mk?.kode || ''} ${o.mk?.nama || ''}`.trim()], ['SKS', String(o.mk?.sks ?? '')],
    ['Kelas', String(o.kelas?.kelas || '')], ['Semester', `${o.kelas?.semester || ''} ${o.kelas?.tahun_akademik || ''}`.trim()],
    ['Dosen pengampu', (o.pengampu || []).join(', ') || '—']]));
  const nama = o.namaPengajar || (x => x.pengajar || '');
  // Terhadap RPS: RPS tanpa materi untuk pertemuan itu ditulis apa adanya, bukan 'Sesuai' (uji alur semester 2026-11-28).
  const rps = x => !bersih(x.materi_rps) ? 'Belum ada di RPS' : sesuaiRps(x.materi, x.materi_rps) ? 'Sesuai' : `Berbeda; RPS: ${bersih(x.materi_rps)}`;
  const rows = (o.baris || []).filter(b => b.isi).map(b => [String(b.ke), tglPanjang(b.isi.tanggal) || String(b.isi.tanggal || ''), nama(b.isi), b.isi.materi,
    rps(b.isi), b.isi.catatan || '']);
  out.push(rows.length ? tabel([['Pertemuan', 'Tanggal', 'Pengajar', 'Materi yang diajarkan', 'Terhadap RPS', 'Catatan'], ...rows])
    : teks('Belum ada pertemuan tercatat.'));
  const kosong = (o.baris || []).filter(b => !b.isi && b.rencana).map(b => b.ke);
  if (kosong.length) out.push(teks(`Pertemuan rencana RPS yang belum tercatat: ${kosong.join(', ')}.`));
  out.push(para(run(`Disusun dari jurnal perkuliahan di situs program studi${o.tanggal ? ` pada ${tglPanjang(o.tanggal) || o.tanggal}` : ''}; materi diisi dosen pengajar tiap pertemuan.`,
    { i: true, sz: 16, warna: '555555' }), { before: 240 }));
  return out.join('');
}
export const buatBap = o => buatDocx(isiBap(o));
export const namaBerkasBap = (mk, kelas) => `BAP_${String(mk?.kode || '').replace(/[^\w]+/g, '')}_${String(kelas?.kelas || '').replace(/[^\w]+/g, '')}_`
  + `${String(kelas?.semester || '')}_${String(kelas?.tahun_akademik || '').replace('/', '-')}.docx`;
