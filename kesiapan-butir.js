// Kesiapan akreditasi per butir (pemilik 2026-11-21): pelengkap seksi "Rekap bukti" di skor.html.
// Baris rekap (dibuat skor.html dari kartu butir) diberi penanggung jawab (unsur-butir.js PIHAK),
// lalu bisa disaring per PJ dan status, diringkas per PJ, dan diunduh sebagai CSV untuk dibagikan ke PJ.
// Logika murni, dites di Node (tests/js/kesiapan_butir.test.mjs).
//
// Baris: { no, judul, bobot, skor (0-4 | null), status ('lengkap' | 'sebagian' | 'kosong'),
//          pj: ['UPPS', 'Prodi', ...], tertaut, dianjurkan, unsur: {ada, n} | null, karya: {ada, n} | null }

import { PIHAK } from './unsur-butir.js?v=2026-11-22-866c27';

export const STATUS = { lengkap: 'lengkap', sebagian: 'sebagian', kosong: 'kosong' };
export const URUT_PJ = Object.values(PIHAK);
export const TANPA_PJ = 'Belum diatur';

/** 'UPPS, Universitas' -> ['UPPS', 'Universitas']; '' -> []. */
export const pecahPJ = s => String(s || '').split(',').map(x => x.trim()).filter(Boolean);

/** Saring: pj = nama pihak atau '' (semua) atau TANPA_PJ; status = kunci STATUS atau ''. */
export function saringKesiapan(baris, { pj = '', status = '' } = {}){
  return (baris || []).filter(x => (!status || x.status === status)
    && (!pj || (pj === TANPA_PJ ? !(x.pj || []).length : (x.pj || []).includes(pj))));
}

/**
 * Ringkasan per PJ: butir yang melibatkan pihak itu (satu butir bisa terhitung di beberapa PJ).
 * -> [{ pj, n, lengkap, sebagian, kosong, bobotBelum }] urut PIHAK; TANPA_PJ di akhir bila ada.
 * bobotBelum = jumlah bobot butir yang belum lengkap (prioritas penagihan).
 */
export function ringkasPJ(baris){
  const nama = [...URUT_PJ, TANPA_PJ];
  return nama.map(pj => {
    const xs = saringKesiapan(baris, { pj });
    const hit = s => xs.filter(x => x.status === s).length;
    return { pj, n: xs.length, lengkap: hit('lengkap'), sebagian: hit('sebagian'), kosong: hit('kosong'),
      bobotBelum: Math.round(xs.filter(x => x.status !== 'lengkap').reduce((a, x) => a + (+x.bobot || 0), 0) * 100) / 100 };
  }).filter(r => r.n > 0);
}

const sel = v => {
  const s = v == null ? '' : String(v);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const angka = x => x == null || x === '' ? '' : String(Math.round(+x * 100) / 100).replace('.', ',');
const pecahan = x => x ? `${x.ada}/${x.n}` : '';

/**
 * CSV ';' (Excel Indonesia), BOM tidak ditambahkan di sini (pemanggil yang menambah).
 * dasar = awal URL situs (mis. 'https://…/cv-site/'), ts = TS kartu untuk tautan.
 */
export function csvKesiapan(baris, { ts = null, dasar = '' } = {}){
  const kepala = ['butir', 'judul', 'bobot', 'skor', 'status', 'penanggung_jawab', 'bukti_tertaut', 'bukti_dianjurkan',
    'unsur_berbukti', 'karya_berbukti', 'tautan_kartu'];
  const isi = (baris || []).map(x => [x.no, x.judul, angka(x.bobot), angka(x.skor), x.status,
    (x.pj || []).join(', ') || TANPA_PJ, x.tertaut ?? '', x.dianjurkan ?? '', pecahan(x.unsur), pecahan(x.karya),
    `${dasar}skor.html${ts ? `?ts=${ts}` : ''}#butir-${x.no}`]);
  return [kepala, ...isi].map(r => r.map(sel).join(';')).join('\r\n') + '\r\n';
}
