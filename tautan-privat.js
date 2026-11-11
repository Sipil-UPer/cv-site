// Berkas privat (pemilik 2026-11-06): tidak punya tautan publik. Yang dicatat
// di database adalah alamat lkd.html?f=<id>, jadi semua daftar bukti, LED, dan
// LKPS otomatis menuju halaman kata sandi; admin dan pemilik yang login langsung
// masuk. Apps Script memegang daftar jenis yang sama (JENIS_PRIVAT di Code.gs).

import { JENIS_DOKUMEN, TABEL_PRIVAT, JENIS_KARYA_PRIVAT } from './rencana-bukti.js?v=2026-11-11-dd6efa';

export const tautanLkd = id => new URL(`lkd.html?f=${id}`, location.href).href;
// Tautan hasil unggah: berkas privat tidak memakai tautan Drive.
export const tautanBerkas = out => out.privat ? tautanLkd(out.id) : out.url;
export const adalahPrivat = u => /lkd\.html\?f=/.test(String(u || ''));
// Berkas kembar: tautan yang sudah ada hanya dipakai bila tidak membuat berkas privat
// memakai tautan publik. Null = unggah sebagai berkas baru.
export const temuanPakai = (temuan, privat) => temuan && (!privat || adalahPrivat(temuan.url)) ? temuan : null;
const berkasDrive = u => /\/file\/d\/[A-Za-z0-9_-]{20,}/.test(String(u || ''));

// Catatan yang harus dipindah ke penyimpanan privat: tautannya berkas Drive
// biasa padahal jenisnya privat.
export function daftarLama({ dokumen = [], karyaBukti = [], lkpsBukti = [] }){
  const privat = new Set(JENIS_DOKUMEN.filter(j => j.privat).map(j => j.id));
  return [...dokumen.filter(d => privat.has(d.jenis) && berkasDrive(d.url)).map(d => ({ tabel: 'dokumen', id: d.id, url: d.url })),
    ...karyaBukti.filter(b => JENIS_KARYA_PRIVAT.includes(b.jenis) && berkasDrive(b.url)).map(b => ({ tabel: 'karya_bukti', id: b.id, url: b.url })),
    ...lkpsBukti.filter(b => (TABEL_PRIVAT.includes(b.tabel) || b.jenis === 'surat_tugas') && berkasDrive(b.url)).map(b => ({ tabel: 'lkps_bukti', id: b.id, url: b.url }))];
}

// Pindahkan berkas lama ke folder privat dan cabut tautan publiknya. Admin.
export async function privatkanLama(sb, tulis){
  const baca = async (t, kol) => { const { data, error } = await sb.from(t).select(kol); if (error) throw error; return data || []; };
  const xs = daftarLama({ dokumen: await baca('dokumen', 'id,jenis,url'), karyaBukti: await baca('karya_bukti', 'id,jenis,url'),
    lkpsBukti: await baca('lkps_bukti', 'id,tabel,jenis,url') });
  if (!xs.length) return 0;
  const { data: { session } } = await sb.auth.getSession();
  if (!session) throw new Error('Sesi login habis. Muat ulang halaman.');
  let n = 0;
  for (const x of xs) {
    tulis(`Memindahkan ${n + 1} dari ${xs.length}…`);
    const res = await fetch(window.UPLOAD_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ token: session.access_token, kind: 'privatkan', url: x.url }) });
    const out = await res.json();
    if (!out.ok) throw new Error(out.error || 'Berkas gagal dipindah.');
    const isi = x.tabel === 'dokumen' ? { url: tautanLkd(out.id), folder_url: null } : { url: tautanLkd(out.id) };
    const { error } = await sb.from(x.tabel).update(isi).eq('id', x.id);
    if (error) throw error;
    n++;
  }
  return n;
}
