// Tab Karya di verifikasi.html (admin): karya menunggu verifikasi, ajuan hapus,
// ajuan perubahan, klaim penulis, dan publikasi/luaran tanpa payung. Dipindah dari tab Verifikasi di
// input.html saat verifikasi dijadikan halaman tersendiri (pemilik 2026-11-08).

import { buangSemua } from './hapus-berkas.js?v=2026-11-12-b7db2c';
import { JENIS_BUKTI_KS } from './manfaat-kerjasama.js?v=2026-11-12-b7db2c';
import { labelKolom } from './form-karya.js?v=2026-11-12-b7db2c';
import { esc, rapi, barisKarya, muatBuktiKarya, daftarBuktiKarya, berkasMilikKarya,
  htmlDaftarBukti } from './karya-tampil.js?v=2026-11-12-b7db2c';

const PILIH = '*, karya_penulis(peran, korespondensi, dosen(nama)), karya_mahasiswa(nim), karya_mitra(institusi)';

// wadah: elemen tempat kelima panel; dosen: [{id, nama}] untuk nama pengaju.
export async function pasangVerifikasiKarya(wadah, { sb, dosen }){
  wadah.innerHTML = `
    <div class="panel"><h2>Menunggu verifikasi</h2>
      <p class="hint">Buka tautan bukti dan pastikan dapat diakses sebelum memverifikasi. Entri tanpa bukti sebaiknya dikembalikan ke dosennya.</p>
      <div id="vf" class="kosong">Memuat…</div></div>
    <div class="panel"><h2>Ajuan hapus karya</h2>
      <p class="hint">Karya terverifikasi yang diajukan dosen untuk dihapus.
      Setujui = karya dihapus beserta penulis dan buktinya (berkas di Drive
      tetap). Tolak = karya tetap, alasan penolakan ditulis di catatan karya.</p>
      <div id="ah" class="kosong">Memuat…</div></div>
    <div class="panel"><h2>Ajuan perubahan karya</h2>
      <p class="hint">Perubahan yang diajukan dosen pada karya terverifikasi (atau
      oleh penulis yang bukan pelapor). Setujui = kolom "Baru" diterapkan, status
      karya tetap. Tolak = data tetap, alasan penolakan dilihat pengajunya.</p>
      <div id="au" class="kosong">Memuat…</div></div>
    <div class="panel"><h2>Klaim penulis untuk ditinjau</h2>
      <p class="hint">Dosen yang mendaftarkan dirinya sendiri pada karya yang
      diinput orang lain. Hapus bila keliru.</p>
      <div id="kl" class="kosong">Memuat…</div></div>
    <div class="panel"><h2>Publikasi dan luaran tanpa payung penelitian</h2>
      <p class="hint">Publikasi dan luaran yang belum dikaitkan dengan penelitian atau PkM
      asalnya. Yang bermitra dicatat sebagai kerja sama tersendiri di LKPS 2.a sampai
      payungnya diisi; dengan payung, karya itu menjadi bukti luaran kerja sama
      kegiatannya. Pilih kegiatan payung lalu klik Tautkan. Bila penelitiannya belum
      tercatat, minta dosennya mencatat penelitian itu (misalnya berdasarkan SK
      penelitian mandiri) di Data saya › Karya dosen, lalu tautkan di sini. Panel ini tidak
      dihitung sebagai "menunggu".</p>
      <div id="tp" class="kosong">Memuat…</div></div>`;
  const kotak = id => wadah.querySelector('#' + id);

  // Nama skema dana untuk baris karya (semua skema, termasuk yang tidak aktif).
  const { data: sk } = await sb.from('ref_skema_dana').select('kode,nama');
  const namaSkema = kode => (sk || []).find(s => s.kode === kode)?.nama || '';
  const baris = (k, aksi, ekstra) => barisKarya(k, aksi, ekstra, namaSkema);
  const namaDosen = id => (dosen.find(d => d.id === id) || {}).nama || 'dosen';

  async function muatMenunggu(){
    const box = kotak('vf');
    const [{ data }, { data: kataVisi }] = await Promise.all([
      sb.from('karya').select(PILIH).eq('status', 'diajukan').order('dibuat_pada'),
      sb.from('ref_kata_visi').select('kata'),
    ]);
    // Kata kunci hanya MENYOROT kandidat tidak relevan; keputusannya tetap
    // pada centang admin. Daftar kosong = tidak ada sorotan.
    const kunciVisi = (kataVisi || []).map(x => x.kata.toLowerCase());
    const mungkinLuar = k => kunciVisi.length
      && !kunciVisi.some(w => (k.judul || '').toLowerCase().includes(w));
    if(!data?.length){ box.className = 'kosong'; box.textContent = 'Tidak ada entri yang menunggu.'; return; }
    // Semua bukti: isian awal, karya_bukti, dan bukti penelitian/PkM induk.
    const st = await muatBuktiKarya(sb, data);
    box.className = '';
    box.innerHTML = data.map(k => baris(k,
      `<label class="cek" style="margin-right:6px" title="Karya mendukung visi keilmuan prodi. Hilangkan centang bila di luar bidang — karya tetap tampil di profil dosen, hanya tidak dihitung pada butir akreditasi prodi.">
         <input type="checkbox" data-r="${k.id}" ${k.relevan_visi === false ? '' : 'checked'}>
         sesuai visi</label>
       ${mungkinLuar(k) ? '<span class="tag" style="background:#FFF3D6;color:#7A5A00" title="Judul tidak memuat satu pun kata kunci visi keilmuan — periksa relevansinya.">periksa relevansi</span>' : ''}
       ${k.bukti_path
          ? `<button class="btn ghost sm" data-f="${k.bukti_path}">Bukti lama</button>`
          : (daftarBuktiKarya(k, st).length ? '' : '<span class="tag">tanpa bukti</span>')}
       <button class="btn sm" data-v="${k.id}">Verifikasi</button>
       <button class="btn danger sm" data-x="${k.id}">Tolak</button>`,
      htmlDaftarBukti(k, st, true))).join('');

    // Entri lama masih menyimpan berkasnya di bucket Supabase.
    box.querySelectorAll('[data-f]').forEach(b => {
      b.onclick = async () => {
        const { data: s } = await sb.storage.from('bukti').createSignedUrl(b.dataset.f, 300);
        if(s?.signedUrl) window.open(s.signedUrl, '_blank', 'noopener');
      };
    });
    const ubah = async (id, status) => {
      const patch = { status };
      const cek = box.querySelector(`[data-r="${id}"]`);
      if(cek) patch.relevan_visi = cek.checked;
      if(status === 'ditolak'){
        const c = prompt('Alasan penolakan (akan dilihat dosen):');
        if(c === null) return;
        patch.catatan = c;
      }
      const { error } = await sb.from('karya').update(patch).eq('id', id);
      if(error) alert('Gagal: ' + error.message);
      muatMenunggu();
    };
    box.querySelectorAll('[data-v]').forEach(b => b.onclick = () => ubah(b.dataset.v, 'terverifikasi'));
    box.querySelectorAll('[data-x]').forEach(b => b.onclick = () => ubah(b.dataset.x, 'ditolak'));
  }

  async function muatAjuanHapus(){
    const box = kotak('ah');
    const { data: aj, error } = await sb.from('ajuan_hapus')
      .select('id,karya_id,alasan,oleh,dibuat').order('dibuat');
    if(error){ box.className = 'kosong'; box.textContent = 'Tabel ajuan_hapus belum bisa dibaca (' + error.message
      + '). Jalankan supabase/15-patch-ajuan-hapus.sql.'; return; }
    if(!aj?.length){ box.className = 'kosong'; box.textContent = 'Tidak ada ajuan hapus.'; return; }
    const { data: ks } = await sb.from('karya').select(PILIH).in('id', aj.map(a => a.karya_id));
    const perId = new Map((ks || []).map(k => [k.id, k]));
    const st = await muatBuktiKarya(sb, ks || []);
    box.className = '';
    box.innerHTML = aj.filter(a => perId.has(a.karya_id)).map(a => {
      const k = perId.get(a.karya_id);
      return baris(k,
        `<button class="btn danger sm" data-sh="${k.id}">Setujui hapus</button>
         <button class="btn ghost sm" data-th="${k.id}">Tolak</button>`,
        `<div class="rec-m"><span>Diajukan ${esc(namaDosen(a.oleh))}, ${esc(String(a.dibuat).slice(0, 10))}:
          ${esc(a.alasan)}</span></div>` + htmlDaftarBukti(k, st, true));
    }).join('');
    box.querySelectorAll('[data-sh]').forEach(b => {
      b.onclick = async () => {
        const k = perId.get(b.dataset.sh);
        const urls = berkasMilikKarya(k, st);
        if(!confirm(`Hapus permanen karya "${k.judul}"? Penulis, bukti, dan ajuannya ikut terhapus` +
          (urls.length ? `; ${urls.length} berkas buktinya dipindah ke Sampah Drive (bisa dipulihkan 30 hari).` : '.'))) return;
        try{ await buangSemua(sb, urls); }
        catch(err){ alert('Gagal membuang berkas: ' + (err.message || err)); return; }
        const { error: e } = await sb.from('karya').delete().eq('id', k.id);
        if(e) alert('Gagal menghapus: ' + e.message);
        muatAjuanHapus();
      };
    });
    box.querySelectorAll('[data-th]').forEach(b => {
      b.onclick = async () => {
        const k = perId.get(b.dataset.th);
        const c = prompt('Alasan penolakan (akan dilihat dosen di catatan karya):');
        if(c === null) return;
        const { error: e1 } = await sb.from('karya')
          .update({ catatan: 'Ajuan hapus ditolak: ' + (c.trim() || '-') }).eq('id', k.id);
        const { error: e2 } = await sb.from('ajuan_hapus').delete().eq('karya_id', k.id);
        if(e1 || e2) alert('Gagal: ' + (e1 || e2).message);
        muatAjuanHapus();
      };
    });
  }

  async function muatAjuanUbah(){
    const box = kotak('au');
    const { data: aj, error } = await sb.from('ajuan_ubah')
      .select('id,karya_id,data,lama,alasan,oleh,dibuat_pada')
      .eq('jenis', 'karya').eq('status', 'menunggu').order('dibuat_pada');
    if(error){ box.className = 'kosong'; box.textContent = 'Tabel ajuan_ubah belum bisa dibaca ('
      + error.message + '). Jalankan supabase/20-patch-ajuan-ubah.sql.'; return; }
    if(!aj?.length){ box.className = 'kosong'; box.textContent = 'Tidak ada ajuan perubahan.'; return; }
    // Nama dosen dan judul karya/induk yang dirujuk ajuan.
    const idDosen = new Set(), idKarya = new Set();
    aj.forEach(a => {
      idDosen.add(a.oleh); idKarya.add(a.karya_id);
      [a.data, a.lama].forEach(s => {
        (s?.penulis || []).forEach(p => idDosen.add(p.dosen_id));
        if(s?.karya?.induk_id) idKarya.add(s.karya.induk_id);
      });
    });
    const [{ data: ds }, { data: ks }] = await Promise.all([
      sb.from('dosen').select('id,nama').in('id', [...idDosen]),
      sb.from('karya').select('id,judul,tahun,kategori').in('id', [...idKarya]),
    ]);
    const nama = new Map((ds || []).map(d => [d.id, d.nama]));
    const karya = new Map((ks || []).map(k => [k.id, k]));
    // Nama kerja sama induk (24-patch-kerjasama-induk.sql) dan tema peta
    // jalan (25-patch-isian-karya.sql) yang dirujuk ajuan.
    const namaKS = {}, namaTema = {};
    const idKS = [...new Set(aj.flatMap(a => [a.data?.karya?.kerjasama_id, a.lama?.karya?.kerjasama_id]).filter(Boolean))];
    if(idKS.length){
      const { data: kk } = await sb.from('lkps_kerjasama').select('id,mitra,kegiatan').in('id', idKS);
      (kk || []).forEach(x => { namaKS[x.id] = x.mitra + (x.kegiatan ? ' — ' + x.kegiatan : ''); });
    }
    const idTema = [...new Set(aj.flatMap(a => [a.data?.karya?.tema_id, a.lama?.karya?.tema_id]).filter(Boolean))];
    if(idTema.length){
      const { data: tt } = await sb.from('ref_tema_peta_jalan').select('id,nama').in('id', idTema);
      (tt || []).forEach(x => { namaTema[x.id] = x.nama; });
    }
    const lihat = { nama, karya, namaKS, namaTema, namaSkema };
    box.className = '';
    box.innerHTML = aj.map(a => {
      const k = karya.get(a.karya_id) || {};
      return `<div class="ajuan-ubah">
        <div><b>${esc(k.judul || '(karya)')}</b>
          <span class="tag">${esc(String(k.tahun || ''))} · ${esc(rapi(k.kategori))}</span></div>
        <div class="hint" style="margin:4px 0 0">Diajukan ${esc(nama.get(a.oleh) || 'dosen')},
          ${esc(String(a.dibuat_pada).slice(0, 10))}. Alasan: ${esc(a.alasan || '-')}</div>
        ${tabelBeda(a, lihat)}
        <div class="aksi" style="margin:10px 0 0">
          <button class="btn sm" data-su="${a.id}">Setujui</button>
          <button class="btn danger sm" data-tu="${a.id}">Tolak</button></div></div>`;
    }).join('');
    box.querySelectorAll('[data-su]').forEach(b => {
      b.onclick = async () => {
        if(!confirm('Terapkan perubahan ini? Data lama diganti dengan kolom "Baru".')) return;
        b.disabled = true;
        const { error: e } = await sb.rpc('setujui_ajuan_ubah', { a: +b.dataset.su });
        if(e) alert('Gagal menerapkan: ' + (e.code === '23505' ? 'DOI sudah terdaftar pada karya lain.' : e.message));
        muatAjuanUbah();
      };
    });
    box.querySelectorAll('[data-tu]').forEach(b => {
      b.onclick = async () => {
        const c = prompt('Alasan penolakan (akan dilihat dosen):');
        if(c === null) return;
        const { error: e } = await sb.from('ajuan_ubah')
          .update({ status: 'ditolak', catatan_admin: c.trim() || '-' }).eq('id', +b.dataset.tu);
        if(e) alert('Gagal: ' + e.message);
        muatAjuanUbah();
      };
    });
  }

  async function muatKlaim(){
    const kb = kotak('kl');
    const { data: klaim } = await sb.from('karya_penulis')
      .select('karya_id, dosen_id, peran, korespondensi, ditambahkan_pada, dosen(nama), karya(judul,tahun)')
      .eq('ditambahkan_sendiri', true).order('ditambahkan_pada', { ascending: false });
    if(!klaim?.length){ kb.className = 'kosong'; kb.textContent = 'Belum ada klaim.'; return; }
    kb.className = '';
    kb.innerHTML = klaim.map(c => `<div class="rec" data-s="diajukan">
      <div class="spine"></div>
      <div class="rec-b">
        <div class="rec-j">${esc(c.dosen?.nama || '')} — ${esc(rapi(c.peran))}${
        c.korespondensi ? ', korespondensi' : ''}</div>
        <div class="rec-m"><span>${esc(c.karya?.judul || '')}</span>
          <span>${c.karya?.tahun || ''}</span></div>
      </div>
      <div class="rec-a">
        <button class="btn danger sm" data-d="${c.karya_id}|${c.dosen_id}">Hapus klaim</button>
      </div></div>`).join('');
    kb.querySelectorAll('[data-d]').forEach(b => {
      b.onclick = async () => {
        if(!confirm('Hapus klaim penulis ini?')) return;
        const [ki, di] = b.dataset.d.split('|');
        await sb.from('karya_penulis').delete().eq('karya_id', ki).eq('dosen_id', di);
        muatKlaim();
      };
    });
  }

  // Payung penelitian (pemilik 2026-11-10): aturan kerja samanya di kerjasama-karya.js.
  async function muatTanpaPayung(){
    const box = kotak('tp');
    const [{ data: tp, error }, { data: keg }] = await Promise.all([
      sb.from('karya').select('id,judul,tahun,kategori,status,karya_penulis(dosen_id,dosen(nama)),karya_mitra(institusi)')
        .in('kategori', ['publikasi', 'luaran']).is('induk_id', null).in('status', ['diajukan', 'terverifikasi'])
        .order('tahun', { ascending: false }),
      sb.from('karya').select('id,judul,tahun,kategori,status,karya_penulis(dosen_id)')
        .in('kategori', ['penelitian', 'pkm']).in('status', ['diajukan', 'terverifikasi']).order('tahun', { ascending: false }),
    ]);
    if(error){ box.className = 'kosong'; box.textContent = 'Gagal memuat: ' + error.message; return; }
    if(!tp?.length){ box.className = 'kosong'; box.textContent = 'Semua publikasi dan luaran sudah punya payung.'; return; }
    const penulis = k => new Set((k.karya_penulis || []).map(p => p.dosen_id));
    const pilihan = k => { const ps = penulis(k);
      return (keg || []).filter(g => (g.karya_penulis || []).some(p => ps.has(p.dosen_id))); };
    const judulPendek = s => s.length > 70 ? s.slice(0, 70) + '…' : s;
    box.className = '';
    box.innerHTML = `<p class="hint">${tp.length} karya, ${tp.filter(k => (k.karya_mitra || []).length).length} di antaranya bermitra.</p>`
      + tp.map(k => { const ops = pilihan(k), mitra = (k.karya_mitra || []).map(m => m.institusi).filter(Boolean);
        return `<div class="rec" data-s="${esc(k.status)}">
      <div class="spine"></div>
      <div class="rec-b">
        <div class="rec-j">${esc(k.judul)}</div>
        <div class="rec-m"><span>${k.tahun || ''}</span><span>${esc(rapi(k.kategori))}</span>
          <span>${esc((k.karya_penulis || []).map(p => p.dosen?.nama).filter(Boolean).join(' · '))}</span></div>
        ${mitra.length ? `<div class="rec-m"><span>Mitra: ${esc(mitra.join(', '))} (kerja sama tersendiri)</span></div>` : ''}
        ${ops.length ? `<div class="rec-m"><select data-tp-pilih="${k.id}" style="max-width:100%">
            <option value="">— pilih penelitian / PkM payung —</option>${ops.map(g => `<option value="${g.id}">${esc(
              `${g.tahun} · ${g.kategori === 'pkm' ? 'PkM' : 'Penelitian'} · ${judulPendek(g.judul || '')}`
              + (g.status === 'terverifikasi' ? '' : ' (belum terverifikasi)'))}</option>`).join('')}</select></div>`
          : '<div class="rec-m"><span>Belum ada penelitian/PkM yang mencantumkan penulisnya.</span></div>'}
      </div>
      <div class="rec-a"><span class="tag">${esc(rapi(k.status))}</span>
        ${ops.length ? `<button class="btn sm" data-tp="${k.id}">Tautkan</button>` : ''}</div></div>`; }).join('');
    box.querySelectorAll('[data-tp]').forEach(b => {
      b.onclick = async () => {
        const induk = box.querySelector(`[data-tp-pilih="${b.dataset.tp}"]`)?.value;
        if(!induk){ alert('Pilih penelitian atau PkM payungnya dulu.'); return; }
        b.disabled = true;
        const { error: e } = await sb.from('karya').update({ induk_id: induk }).eq('id', b.dataset.tp);
        if(e){ alert('Gagal menautkan: ' + e.message); b.disabled = false; return; }
        muatTanpaPayung();
      };
    });
  }

  await Promise.all([muatMenunggu(), muatAjuanHapus(), muatAjuanUbah(), muatKlaim(), muatTanpaPayung()]);
}

// Tabel Isian | Lama | Baru untuk satu ajuan ubah karya.
// lihat = { nama: dosen_id -> nama, karya: id -> karya, namaKS, namaTema, namaSkema }.
export function tabelBeda(a, lihat){
  const { nama, karya, namaKS = {}, namaTema = {}, namaSkema = () => '' } = lihat;
  const kosong = '<span class="kosong">—</span>';
  const nilai = (c, v) => {
    if(v == null || v === '') return kosong;
    if(c === 'skema_kode') return esc(namaSkema(v) || v);
    if(c === 'induk_id') return esc(karya.get(v)?.judul || v);
    if(c === 'kerjasama_id') return esc(namaKS[v] || 'kerja sama #' + v);
    if(c === 'tema_id') return esc(namaTema[v] || 'tema #' + v);
    if(c === 'sesuai_rps') return String(v) === 'true' ? 'Ya' : 'Belum';
    if(c === 'jenis_bukti_ks') return esc((JENIS_BUKTI_KS.find(x => x[0] === v) || [])[1] || v);
    return esc(rapi(String(v)));
  };
  const daftar = xs => xs.length ? xs.map(esc).join('<br>') : kosong;
  const tanda = p => rapi(p.peran) + (p.korespondensi ? ', korespondensi' : '');
  const pen = xs => (xs || []).map(p => `${nama.get(p.dosen_id) || 'dosen'} (${tanda(p)})`);
  const mtr = xs => (xs || []).map(m => [m.institusi, rapi(m.tingkat), m.negara].filter(Boolean).join(', '));
  const mhs = xs => (xs || []).map(m => `${m.nim} ${m.nama} (${tanda(m)})`);
  const baris = Object.keys(a.data?.karya || {}).map(c =>
    [labelKolom(c), nilai(c, a.lama?.karya?.[c]), nilai(c, a.data.karya[c])]);
  if(a.data?.penulis)   baris.push(['Penulis dari prodi', daftar(pen(a.lama?.penulis)), daftar(pen(a.data.penulis))]);
  if(a.data?.mitra)     baris.push(['Institusi mitra', daftar(mtr(a.lama?.mitra)), daftar(mtr(a.data.mitra))]);
  if(a.data?.mahasiswa) baris.push(['Mahasiswa terlibat', daftar(mhs(a.lama?.mahasiswa)), daftar(mhs(a.data.mahasiswa))]);
  return `<table class="beda"><thead><tr><th>Isian</th><th>Lama</th><th>Baru</th></tr></thead><tbody>${
    baris.map(([l, x, y]) => `<tr><td>${esc(l)}</td><td>${x}</td><td>${y}</td></tr>`).join('')}</tbody></table>`;
}
