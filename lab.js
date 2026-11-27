// Inventaris, perawatan, peminjaman alat, dan induksi K3 laboratorium (199-patch-inventaris-k3-lab.sql, pemilik 2026-11-27).
// Fungsi murni; dipakai lab-inventaris.html, tugas-saya.js, dan laporan-tahunan.js. Bukti butir 38 (sarana) dan 39 (K3L).

export const KONDISI_ALAT = { baik: 'Baik', perlu_perbaikan: 'Perlu perbaikan', rusak: 'Rusak' };
export const JENIS_RAWAT = { perawatan: 'Perawatan', perbaikan: 'Perbaikan', kalibrasi: 'Kalibrasi' };
export const HARI_KALIBRASI = 30;   // kalibrasi diingatkan 30 hari sebelum jatuh tempo

const hariIni = kini => new Date(kini.getTime() + 7 * 3600e3).toISOString().slice(0, 10);
const selisih = (a, b) => Math.round((Date.parse(a) - Date.parse(b)) / 864e5);

/** Tanggal kalibrasi berikutnya (YYYY-MM-DD) atau null (tidak perlu kalibrasi / belum pernah / tanpa interval). */
export function kalibrasiBerikut(a){
  if (!a?.kalibrasi_perlu || !a.kalibrasi_terakhir || !a.kalibrasi_bulan) return null;
  const [y, m, d] = String(a.kalibrasi_terakhir).slice(0, 10).split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1 + +a.kalibrasi_bulan, 1));
  const akhir = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), Math.min(d, akhir))).toISOString().slice(0, 10);
}

/** Status kalibrasi: '' (tidak perlu), 'belum' (perlu tetapi belum ada data), 'lewat', 'segera' (<= HARI_KALIBRASI), 'tepat'. */
export function statusKalibrasi(a, kini = new Date()){
  if (!a?.kalibrasi_perlu) return '';
  const b = kalibrasiBerikut(a);
  if (!b) return 'belum';
  const h = selisih(b, hariIni(kini));
  return h < 0 ? 'lewat' : h <= HARI_KALIBRASI ? 'segera' : 'tepat';
}

/** Peminjam sudah ikut induksi K3 lab itu (NIM ada di salah satu sesi lab tersebut). */
export const sudahInduksi = (nim, labId, induksi = []) => !!nim
  && induksi.some(s => s.laboratorium_id === labId && (s.peserta_nim || []).includes(String(nim).trim()));

/** Rekap per laboratorium untuk rentang tanggal [dari, sampai] (riwayat dan induksi) dan keadaan alat saat ini. */
export function rekapLab({ lab = [], alat = [], perawatan = [], induksi = [], pinjam = [] } = {}, { dari = '0000-01-01', sampai = '9999-12-31' } = {}, kini = new Date()){
  const dalam = t => t && t >= dari && t <= sampai;
  return lab.map(l => {
    const xs = alat.filter(a => a.laboratorium_id === l.id), ids = new Set(xs.map(a => a.id));
    const unit = xs.reduce((s, a) => s + (+a.jumlah || 0), 0), baik = xs.filter(a => a.kondisi === 'baik').reduce((s, a) => s + (+a.jumlah || 0), 0);
    const kal = xs.filter(a => a.kalibrasi_perlu), st = kal.map(a => statusKalibrasi(a, kini));
    const rw = perawatan.filter(p => ids.has(p.alat_id) && dalam(p.tanggal));
    const ind = induksi.filter(s => s.laboratorium_id === l.id && dalam(s.tanggal));
    return { id: l.id, nama: l.nama, jenisAlat: xs.length, unit, unitBaik: baik, persenBaik: unit ? Math.round(baik / unit * 100) : null,
      perluKalibrasi: kal.length, kalibrasiTepat: st.filter(s => s === 'tepat' || s === 'segera').length,
      kalibrasiLewat: st.filter(s => s === 'lewat' || s === 'belum').length,
      perawatan: rw.length, kalibrasiDilakukan: rw.filter(p => p.jenis === 'kalibrasi').length,
      sesiInduksi: ind.length, pesertaInduksi: new Set(ind.flatMap(s => s.peserta_nim || [])).size + ind.reduce((s, x) => s + (+x.jumlah_lain || 0), 0),
      pinjam: pinjam.filter(p => ids.has(p.alat_id) && dalam(p.tanggal_pinjam)).length };
  });
}

/** Tugas kepala lab/pengelola: kalibrasi lewat atau segera, alat rusak/perlu perbaikan, pinjaman lewat rencana kembali.
 *  labSaya = id lab yang dikelola (null = semua). Hasil [{judul, rinci, hari}]. */
export function tugasLab({ alat = [], pinjam = [], lab = [], labSaya = null } = {}, kini = new Date()){
  const milik = a => !labSaya || labSaya.includes(a.laboratorium_id);
  const nmLab = id => lab.find(l => l.id === id)?.nama || 'lab';
  const out = [], t = hariIni(kini);
  const kal = alat.filter(milik).map(a => ({ a, s: statusKalibrasi(a, kini), b: kalibrasiBerikut(a) })).filter(x => ['lewat', 'segera', 'belum'].includes(x.s));
  if (kal.length) out.push({ judul: `Kalibrasi alat: ${kal.length} ${kal.some(x => x.s !== 'segera') ? 'lewat atau belum tercatat' : 'segera jatuh tempo'}`,
    rinci: kal.map(x => `${x.a.nama} (${nmLab(x.a.laboratorium_id)}): ${x.s === 'belum' ? 'belum ada tanggal kalibrasi' : `jatuh tempo ${x.b}`}`).join('; '),
    hari: Math.min(...kal.map(x => (x.b ? selisih(x.b, t) : -1))) });
  const rusak = alat.filter(milik).filter(a => a.kondisi !== 'baik');
  if (rusak.length) out.push({ judul: `Alat perlu perbaikan atau rusak: ${rusak.length}`,
    rinci: rusak.map(a => `${a.nama} (${nmLab(a.laboratorium_id)}, ${KONDISI_ALAT[a.kondisi].toLowerCase()})`).join('; ')
      + '. Catat perbaikan di riwayat alat; kondisi ikut diperbarui.', hari: null });
  const ids = new Set(alat.filter(milik).map(a => a.id));
  const telat = pinjam.filter(p => ids.has(p.alat_id) && !p.kembali_pada && p.rencana_kembali && p.rencana_kembali < t);
  if (telat.length) out.push({ judul: `Pinjaman alat lewat tanggal kembali: ${telat.length}`,
    rinci: telat.map(p => `${alat.find(a => a.id === p.alat_id)?.nama || 'alat'} oleh ${p.peminjam} (rencana ${p.rencana_kembali})`).join('; '),
    hari: Math.min(...telat.map(p => selisih(p.rencana_kembali, t))) });
  return out;
}

/** CSV inventaris (pemisah titik koma, BOM). */
export function csvAlat(alat = [], lab = [], kini = new Date()){
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const nm = id => lab.find(l => l.id === id)?.nama || '';
  return '﻿' + [['Laboratorium', 'Alat', 'Merek/tipe', 'Jumlah', 'Kondisi', 'Lokasi', 'Kalibrasi terakhir', 'Kalibrasi berikut', 'Status kalibrasi'],
    ...[...alat].sort((a, b) => nm(a.laboratorium_id).localeCompare(nm(b.laboratorium_id), 'id') || String(a.nama).localeCompare(String(b.nama), 'id'))
      .map(a => [nm(a.laboratorium_id), a.nama, a.merek_tipe || '', a.jumlah, KONDISI_ALAT[a.kondisi] || a.kondisi, a.lokasi || '',
        a.kalibrasi_terakhir || '', kalibrasiBerikut(a) || '', statusKalibrasi(a, kini)])].map(r => r.map(q).join(';')).join('\r\n');
}
