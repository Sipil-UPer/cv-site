// Rencana pengembangan dosen dan tendik (198-patch-rencana-pengembangan-sdm.sql, pemilik 2026-11-27).
// Fungsi murni; dipakai rencana-pengembangan.html, tugas-saya.js, dan laporan-tahunan.js. Bukti butir 5-I dan 27–29.

export const JENIS_SDM = { studi_lanjut: 'Studi lanjut', sertifikasi: 'Sertifikasi', pelatihan: 'Pelatihan', jabatan: 'Kenaikan jabatan', lainnya: 'Lainnya' };
export const STATUS_SDM = { rencana: 'Rencana', berjalan: 'Berjalan', selesai: 'Selesai', batal: 'Batal' };
export const DANA_SDM = { prodi: 'Prodi', universitas: 'Universitas', hibah: 'Hibah/beasiswa', mandiri: 'Mandiri', lainnya: 'Lainnya' };

/** Rekap per tahun target x jenis: [{tahun, jenis, target, selesai, berjalan, batal, persen}]. target = semua kecuali batal;
 *  persen = selesai / target (null bila target 0). Urut tahun lalu urutan JENIS_SDM. */
export function rekapSdm(rows = []){
  const urut = Object.keys(JENIS_SDM), m = new Map();
  for (const r of rows) {
    const k = `${r.tahun_target}|${r.jenis}`;
    if (!m.has(k)) m.set(k, { tahun: +r.tahun_target, jenis: r.jenis, target: 0, selesai: 0, berjalan: 0, batal: 0 });
    const x = m.get(k);
    if (r.status === 'batal') x.batal++; else x.target++;
    if (r.status === 'selesai') x.selesai++;
    if (r.status === 'berjalan') x.berjalan++;
  }
  return [...m.values()].map(x => ({ ...x, persen: x.target ? Math.round(x.selesai / x.target * 100) : null }))
    .sort((a, b) => a.tahun - b.tahun || urut.indexOf(a.jenis) - urut.indexOf(b.jenis));
}

/** Jumlah per tahun (semua jenis): [{tahun, target, selesai, berjalan, batal, persen}]. */
export function rekapTahun(rows = []){
  const m = new Map();
  for (const x of rekapSdm(rows)) {
    if (!m.has(x.tahun)) m.set(x.tahun, { tahun: x.tahun, target: 0, selesai: 0, berjalan: 0, batal: 0 });
    const y = m.get(x.tahun); for (const k of ['target', 'selesai', 'berjalan', 'batal']) y[k] += x[k];
  }
  return [...m.values()].map(y => ({ ...y, persen: y.target ? Math.round(y.selesai / y.target * 100) : null }));
}

/** Tugas saya: rencana sendiri yang tahun targetnya sudah tiba (atau lewat) tetapi belum selesai/batal. Mulai 1 Oktober tahun
 *  target diingatkan; hari = sisa hari sampai 31 Desember tahun target (negatif = lewat). */
export function tugasSdm(rows = [], sayaId, kini = new Date()){
  const wib = new Date(kini.getTime() + 7 * 3600e3), th = wib.getUTCFullYear(), bln = wib.getUTCMonth() + 1;
  const xs = rows.filter(r => r.dosen_id === sayaId && ['rencana', 'berjalan'].includes(r.status)
    && (+r.tahun_target < th || (+r.tahun_target === th && bln >= 10)));
  if (!xs.length) return null;
  const tertua = Math.min(...xs.map(r => +r.tahun_target));
  const hari = Math.round((Date.UTC(tertua, 11, 31) - Date.UTC(th, wib.getUTCMonth(), wib.getUTCDate())) / 864e5);
  return { judul: `Rencana pengembangan: ${xs.length} belum selesai`,
    rinci: xs.map(r => `${JENIS_SDM[r.jenis] || r.jenis}: ${r.uraian} (target ${r.tahun_target}, ${STATUS_SDM[r.status].toLowerCase()})`).join('; ')
      + '. Perbarui statusnya: selesai beserta tanggal dan bukti, berjalan, atau batal.', hari };
}

/** CSV rencana (pemisah titik koma, BOM). nama: baris -> nama orang. */
export function csvSdm(rows = [], nama = () => ''){
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return '﻿' + [['Nama', 'Dosen/Tendik', 'Jenis', 'Uraian', 'Tahun target', 'Status', 'Selesai', 'Dana', 'Bukti', 'Catatan'],
    ...[...rows].sort((a, b) => a.tahun_target - b.tahun_target || String(nama(a)).localeCompare(String(nama(b)), 'id'))
      .map(r => [nama(r), r.dosen_id ? 'Dosen' : 'Tendik', JENIS_SDM[r.jenis] || r.jenis, r.uraian, r.tahun_target, STATUS_SDM[r.status] || r.status,
        r.selesai_pada || '', DANA_SDM[r.dana] || '', r.bukti_url || '', r.catatan || ''])].map(x => x.map(q).join(';')).join('\r\n');
}
