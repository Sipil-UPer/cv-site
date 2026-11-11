// Tab Profil di verifikasi.html (admin): ajuan perubahan profil dari
// profil.html (supabase/20-patch-ajuan-ubah.sql, pemilik 2026-11-04).
// Setujui -> rpc setujui_ajuan_ubah menerapkan kolom "Diajukan" ke tabel
// dosen; Tolak -> alasan dilihat dosen di profil.html. Dipindah dari
// kelola-dosen.html (pemilik 2026-11-08).

import { ISIAN_PROFIL, KOLOM_PROFIL, JABATAN, tampil as tampilIsian } from './profil-dosen.js?v=2026-11-11-093b1f';

const esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Kolom dosen yang dibaca kelola-dosen.html (KOLOM + KOLOM_PROFIL).
const KOLOM = 'id,nidn,nama,email,peran,pendidikan,jabatan,sinta_id,scopus_id,orcid,aktif,dtps';

export async function pasangVerifikasiProfil(box, { sb }){
  async function muat(){
    const { data: aj, error } = await sb.from('ajuan_ubah')
      .select('id,dosen_id,data,lama,alasan,dibuat_pada')
      .eq('jenis', 'profil').eq('status', 'menunggu').order('dibuat_pada');
    if (error) { box.innerHTML = `<p class="kosong">Tabel ajuan_ubah belum bisa dibaca (${esc(error.message)}).
      Jalankan supabase/20-patch-ajuan-ubah.sql.</p>`; return; }
    if (!aj?.length) { box.innerHTML = '<p class="kosong">Tidak ada ajuan perubahan profil.</p>'; return; }
    // Nilai sekarang dari tabel dosen; tanpa kolom patch 22 bila belum dijalankan.
    const ids = [...new Set(aj.map(a => a.dosen_id))];
    let { data: ds, error: eD } = await sb.from('dosen').select(KOLOM + ',' + KOLOM_PROFIL).in('id', ids);
    if (eD) ({ data: ds } = await sb.from('dosen').select(KOLOM).in('id', ids));
    const DOSEN = ds || [];
    const tampil = (k, v) => tampilIsian(k, v, JABATAN);
    box.innerHTML = aj.map(a => {
      const d = DOSEN.find(x => x.id === a.dosen_id) || {};
      return `<div class="ajuan-ubah"><div><b>${esc(d.nama || 'dosen')}</b></div>
        <div class="hint" style="margin:4px 0 0">Diajukan ${esc(String(a.dibuat_pada).slice(0, 10))}.
          Keterangan: ${esc(a.alasan || '-')}</div>
        <table class="beda"><thead><tr><th>Isian</th><th>Sekarang</th><th>Diajukan</th></tr></thead><tbody>${
          ISIAN_PROFIL.filter(([k]) => k in (a.data || {})).map(([k, l]) =>
            `<tr><td>${esc(l)}</td><td>${esc(tampil(k, d.id ? d[k] : a.lama?.[k]))}</td>
              <td>${esc(tampil(k, a.data[k]))}</td></tr>`).join('')
        }</tbody></table>
        <div class="aksi" style="margin:10px 0 0"><button class="btn sm" data-su="${a.id}">Setujui</button>
          <button class="btn danger sm" data-tu="${a.id}">Tolak</button></div></div>`;
    }).join('');
    box.querySelectorAll('[data-su]').forEach(b => {
      b.onclick = async () => {
        if (!confirm('Terapkan perubahan profil ini?')) return;
        b.disabled = true;
        const { error: e } = await sb.rpc('setujui_ajuan_ubah', { a: +b.dataset.su });
        if (e) alert('Gagal menerapkan: ' + e.message);
        await muat();
      };
    });
    box.querySelectorAll('[data-tu]').forEach(b => {
      b.onclick = async () => {
        const c = prompt('Alasan penolakan (akan dilihat dosen):');
        if (c === null) return;
        const { error: e } = await sb.from('ajuan_ubah')
          .update({ status: 'ditolak', catatan_admin: c.trim() || '-' }).eq('id', +b.dataset.tu);
        if (e) alert('Gagal: ' + e.message);
        await muat();
      };
    });
  }
  await muat();
}
