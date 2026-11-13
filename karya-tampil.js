// Tampilan baris karya dan buktinya, dipakai bersama input.html (Karya saya,
// Karya prodi) dan verifikasi.html (tab Karya). Dipindah dari input.html saat
// verifikasi dijadikan halaman tersendiri (pemilik 2026-11-08).
//
// Bukti jamak per karya (tabel karya_bukti, supabase/14-patch-bukti-jamak.sql;
// keputusan pemilik 2026-11-03). Bukti penelitian/PkM induk (karya.induk_id)
// ikut tampil pada publikasi/luaran/integrasi turunannya tanpa disalin.
// st = { KB: karya_id -> [karya_bukti], INDUK: id -> karya } dari muatBuktiKarya.

import { namaJenisBukti } from './rencana-bukti.js?v=2026-11-13-2f8b74';
import { buangBerkas, PESAN_SAMPAH } from './hapus-berkas.js?v=2026-11-13-2f8b74';
import { htmlTautanButir, butirKarya, tsBaris } from './tautan-butir.js?v=2026-11-13-2f8b74';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const rapi = s => s ? String(s).replace(/_/g, ' ') : '';

// Tautan baris karya ke butirnya pada TS karya itu. Yang ditolak tidak dipakai.
export function tautanKarya(k){
  if(k.status === 'ditolak') return '';
  const ok = k.status === 'terverifikasi';
  return `<div class="rec-m">${htmlTautanButir(butirKarya(k), tsBaris(k.tahun, k.bulan),
    ok ? 'Dipakai di' : 'Masuk setelah diverifikasi:')}</div>`;
}

// Nama penulis beserta penanda posisi dan korespondensi.
// Keduanya berdiri sendiri: seorang dosen bisa sekaligus penulis
// pertama dan penulis korespondensi.
export const daftarPenulis = kp => (kp || []).map(p => {
  const n = p.dosen?.nama; if(!n) return null;
  const tanda = [
    p.peran === 'penulis_pertama' ? 'penulis pertama' : null,
    p.peran === 'ketua'           ? 'ketua'           : null,
    p.korespondensi               ? 'korespondensi'   : null,
  ].filter(Boolean).join(', ');
  return tanda ? `${n} (${tanda})` : n;
}).filter(Boolean);

// namaSkema: kode skema dana -> nama (dari ref_skema_dana halaman pemanggil).
export function barisKarya(k, aksi = '', ekstra = '', namaSkema = () => ''){
  const nama = daftarPenulis(k.karya_penulis);
  const nMhs = (k.karya_mahasiswa || []).length;
  const mitra = (k.karya_mitra || []).map(m => m.institusi).filter(Boolean);
  const meta = [k.tahun, rapi(k.kategori), rapi(k.tingkat),
                k.nama_terbitan, namaSkema(k.skema_kode),
                mitra.length ? 'mitra: ' + mitra.join(', ') : null,
                nMhs ? `${nMhs} mahasiswa` : null].filter(Boolean);
  return `<div class="rec" data-s="${k.status}">
    <div class="spine"></div>
    <div class="rec-b">
      <div class="rec-j">${esc(k.judul)}</div>
      <div class="rec-m">${meta.map(x => `<span>${esc(x)}</span>`).join('')}</div>
      ${nama.length ? `<div class="rec-m"><span>${esc(nama.join(' · '))}</span></div>` : ''}
      ${k.catatan ? `<div class="rec-m"><span>Catatan: ${esc(k.catatan)}</span></div>` : ''}
      ${tautanKarya(k)}
      ${ekstra}
    </div>
    <div class="rec-a"><span class="tag">${rapi(k.status)}</span>${aksi}</div>
  </div>`;
}

// Muat karya induk (penelitian/PkM asal), bukti jamak, ajuan hapus, dan
// ajuan ubah untuk daftar karya ini.
export async function muatBuktiKarya(sb, data){
  const st = { KB: new Map(), INDUK: new Map(data.map(k => [k.id, k])), AJUAN: new Map(),
    AJUAN_UBAH: new Map(), KB_GAGAL: '', AJUAN_GAGAL: '', AJUAN_UBAH_GAGAL: '' };
  const indukIds = [...new Set(data.map(k => k.induk_id).filter(i => i && !st.INDUK.has(i)))];
  if(indukIds.length){
    const { data: ind } = await sb.from('karya').select('id,judul,kategori,bukti_url').in('id', indukIds);
    (ind || []).forEach(k => st.INDUK.set(k.id, k));
  }
  const ids = [...st.INDUK.keys()];
  if(!ids.length) return st;
  // Banyak karya (Karya prodi): ambil seluruh tabel, daftar id terlalu
  // panjang untuk alamat permintaan; dipetakan per karya di bawah.
  const saring = q => ids.length > 100 ? q : q.in('karya_id', ids);
  const { data: kb, error: eKb } = await saring(sb.from('karya_bukti')
    .select('id,karya_id,jenis,judul,url,oleh'));
  st.KB_GAGAL = eKb ? eKb.message : '';
  const { data: aj, error: eAj } = await saring(sb.from('ajuan_hapus')
    .select('id,karya_id,alasan,oleh,dibuat'));
  st.AJUAN_GAGAL = eAj ? eAj.message : '';
  st.AJUAN = new Map((aj || []).map(a => [a.karya_id, a]));
  const { data: au, error: eAu } = await saring(sb.from('ajuan_ubah')
    .select('id,karya_id,oleh,status,alasan,catatan_admin').eq('jenis', 'karya'));
  st.AJUAN_UBAH_GAGAL = eAu ? eAu.message : '';
  (au || []).forEach(a => {
    if(!st.AJUAN_UBAH.has(a.karya_id)) st.AJUAN_UBAH.set(a.karya_id, []);
    st.AJUAN_UBAH.get(a.karya_id).push(a);
  });
  (kb || []).forEach(b => { if(!st.KB.has(b.karya_id)) st.KB.set(b.karya_id, []); st.KB.get(b.karya_id).push(b); });
  return st;
}

// Semua bukti karya: isian awal, karya_bukti, dan bukti induknya.
// sayaId: penanda bukti milik pengguna (tombol hapus di Karya saya).
export function daftarBuktiKarya(k, st, sayaId = null){
  const xs = [];
  if(k.bukti_url) xs.push({ url: k.bukti_url, label: 'Bukti (isian awal)', lama: k.id });
  (st.KB.get(k.id) || []).forEach(b => xs.push({ url: b.url, id: b.id, milik: b.oleh === sayaId,
    label: namaJenisBukti(b.jenis) + (b.judul ? ': ' + b.judul : '') }));
  const ind = k.induk_id && st.INDUK.get(k.induk_id);
  if(ind){
    const aw = `dari ${ind.kategori === 'pkm' ? 'PkM' : 'penelitian'} "${ind.judul}": `;
    if(ind.bukti_url) xs.push({ url: ind.bukti_url, label: aw + 'Bukti' });
    (st.KB.get(ind.id) || []).forEach(b => xs.push({ url: b.url,
      label: aw + namaJenisBukti(b.jenis) + (b.judul ? ': ' + b.judul : '') }));
  }
  return xs;
}

// Tautan berkas milik karya ini sendiri (isian awal + karya_bukti), tanpa
// bukti warisan induk: berkas warisan masih dipakai karya induknya.
export function berkasMilikKarya(k, st){
  return daftarBuktiKarya(k, st).filter(x => x.id || x.lama).map(x => x.url);
}

// Daftar tautan bukti tanpa formulir (verifikasi, Karya prodi admin).
// hapus=true (layar admin): tombol Hapus pada bukti milik karya ini
// (bukan bukti warisan induk); berkasnya dibuang ke Sampah Drive.
export function htmlDaftarBukti(k, st, hapus = false){
  const xs = daftarBuktiKarya(k, st);
  if(!xs.length) return '';
  return `<div class="rec-m vb"><span>Bukti (${xs.length}):</span><ul>${xs.map(x =>
    `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.label)}</a>${
      hapus && (x.id || x.lama) ? ` <button type="button" class="btn ghost sm" data-adm-hapus="1"
        data-url="${esc(x.url)}" ${x.lama ? `data-lama="${esc(x.lama)}"` : `data-id="${esc(x.id)}"`}>Hapus</button>` : ''}</li>`).join('')}</ul></div>`;
}

// Hapus bukti karya oleh admin (tombol data-adm-hapus): buang berkas ke
// Sampah Drive dulu, lalu hapus catatannya; bukti isian awal
// (karya.bukti_url) dikosongkan. adalahAdmin() dibaca saat klik.
export function pasangHapusBuktiAdmin(sb, adalahAdmin){
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-adm-hapus]');
    if(!b || !adalahAdmin()) return;
    if(!confirm('Hapus bukti ini? ' + PESAN_SAMPAH)) return;
    b.disabled = true;
    try{
      await buangBerkas(sb, b.dataset.url);
      const { error } = b.dataset.lama
        ? await sb.from('karya').update({ bukti_url: null }).eq('id', b.dataset.lama)
        : await sb.from('karya_bukti').delete().eq('id', +b.dataset.id);
      if(error) throw error;
      const li = b.closest('li');
      if(li) li.remove();
    }catch(err){
      alert('Gagal menghapus: ' + (err.message || err));
      b.disabled = false;
    }
  });
}
