// Penyusun Word RPS bersama (pemilik 2026-11-19): gambar Peta Analisis dan QR (kanvas), dan Word versi disahkan dari rps_dokumen
// (patch 121) untuk halaman verifikasi tanpa login. Halaman RPS memakai fungsi gambar yang sama, jadi Word dari kedua halaman sama.
import { petaSvg } from './rps-peta.js?v=2026-11-22-866c27';
import { rapikanRps, modelRps, esignRps, revisiDariLog, paritas, namaBerkasRps } from './rps.js?v=2026-11-22-866c27';
import { cplMK } from './cpmk.js?v=2026-11-22-866c27';
import { buatRpsDocx } from './rps-docx.js?v=2026-11-22-866c27';

/** Titik masuk Peta Analisis: isian peta, atau prasyarat MK. */
export const entryPeta = r => r.peta?.entry || (r.syarat?.prasyarat ? `MK prasyarat: ${r.syarat.prasyarat}` : '');

/** Peta Analisis (SVG) -> PNG 2x untuk Word. */
export async function pngPeta(struktur, peta, entry){
  const { svg, w, h } = petaSvg(struktur, peta, entry);
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();
  const c = Object.assign(document.createElement('canvas'), { width: w * 2, height: h * 2 }), g = c.getContext('2d');
  g.scale(2, 2); g.drawImage(img, 0, 0, w, h);
  const blob = await new Promise(r => c.toBlob(r, 'image/png'));
  return { png: new Uint8Array(await blob.arrayBuffer()), w, h };
}

/** Kode QR (alamat verifikasi) -> PNG untuk Word; qrcode-generator 1.4.4 (jsDelivr). */
export async function pngQr(teks){
  const { default: qrcode } = await import('https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/+esm');
  const q = qrcode(0, 'M'); q.addData(teks); q.make();
  const n = q.getModuleCount(), k = 8, tepi = 4, c = Object.assign(document.createElement('canvas'), { width: (n + 2 * tepi) * k, height: (n + 2 * tepi) * k });
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#000';
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (q.isDark(i, j)) x.fillRect((j + tepi) * k, (i + tepi) * k, k, k);
  return new Uint8Array(await (await new Promise(r => c.toBlob(r, 'image/png'))).arrayBuffer());
}

const isoDari = n => { const m = String(n ?? '').match(/^(\d{4})(\d{2})(\d{2})$/); return m ? `${m[1]}-${m[2]}-${m[3]}` : ''; };

/**
 * Bahan model Word versi disahkan dari hasil rps_dokumen (tanpa DOM; diuji). D = {mk, rps, log, dosen, cpl, peta_cpl, sebutan, tanggal};
 * url = alamat verifikasi (isi QR). Kolom Dekan kosong bila belum ditetapkan (Word dari halaman RPS menulis Dekan aktif).
 */
export function konteksDokumen(D, { situs = {}, url = '' } = {}){
  const m = D.mk, r = D.rps, dosen = new Map((D.dosen || []).map(d => [d.id, d])), nama = id => dosen.get(id) || null;
  const rps = rapikanRps(r.sah.rps, m, situs);
  const p = paritas(m.semester) || paritas(rps.identitas?.semester);
  const tgl = p ? isoDari(D.tanggal?.[p.toLowerCase()]) : '';
  const rpsDok = tgl ? { ...rps, identitas: { ...rps.identitas, tanggal: tgl } } : rps;
  return { mk: m, struktur: r.sah.struktur, rps: rpsDok, cpl: cplMK(D.cpl || [], D.peta_cpl || [], m.kurikulum, m.kode).cpl,
    pengembang: nama(rps.pengembang), kaprodi: nama(r.sah_atas_nama) || nama(r.sah_oleh), dekan: nama(r.tetap_atas_nama),
    revisi: revisiDariLog(D.log || []), kaprodi_penyusun: !!r.sah?.kaprodi_penyusun,
    esign: esignRps(r, D.log || [], nama, url, { tanggal: tgl, sebutanKaprodi: D.sebutan?.kaprodi || '', sebutanDekan: D.sebutan?.dekan || '' }) };
}

/** Word versi disahkan (Blob) dari rps_dokumen. */
export async function wordDariDokumen(D, { JSZip, logo = null, situs = {}, url = '' } = {}){
  const c = konteksDokumen(D, { situs, url });
  const peta = c.struktur?.sub?.length ? await pngPeta(c.struktur, c.rps.peta, entryPeta(c.rps)) : null;
  const qr = c.esign ? await pngQr(c.esign.url).catch(() => null) : null;
  return { blob: await buatRpsDocx(modelRps(c), { JSZip, logo, peta, qr }), nama: namaBerkasRps(D.mk) };
}
