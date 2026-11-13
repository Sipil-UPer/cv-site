/* =====================================================================
   RAPIKAN BERKAS — alat admin di tab Dokumen Data prodi (pemilik
   2026-11-04: satu dokumen tidak boleh tersimpan lebih dari sekali).
   Butuh supabase/31-patch-sidik-berkas.sql dan Apps Script kind 'sidik'.

   Langkah, masing-masing atas tombol admin:
     1. Sidik: bukti lama berupa berkas Drive tanpa sidik dihitung SHA-256-nya
        oleh Apps Script (10 tautan per panggilan) lalu disimpan (isi_sha256).
     2. Berkas kembar: isi sama, tautan berbeda (diunggah lebih dari sekali)
        atau dicatat di pustaka lebih dari sekali. Admin memilih yang
        dipertahankan; rujukan lain dialihkan (satukan_berkas) dan salinannya
        dibuang ke Sampah Drive (bisa dipulihkan 30 hari).
     3. Ke pustaka: bukti baris Data prodi yang masih berupa berkas lama
        (unggahan sebelum patch 29) dicatat di pustaka dengan jenis, tahun,
        dan judul pilihan admin (masukkan_pustaka); barisnya lalu menunjuk
        dokumen pustaka. Berkasnya tidak dipindah atau diunggah ulang.
   Tautan luar (DOI, situs mitra, berkas di luar folder prodi) tidak disentuh.

   Pemakaian: pasangRapikan(sb, wadah, { tabel, saran, oleh, selesai })
     tabel  = TABEL Data prodi (id, tabel, judul) untuk nama tab dan saran jenis
     saran  = SARAN_DOK (id tab -> jenis dokumen yang disarankan)
   ===================================================================== */
import { opsiJenis, kunciDokumen, labelDokumen } from './pustaka-dokumen.js?v=2026-11-13-e738fd';
import { infoJenis } from './rencana-bukti.js?v=2026-11-13-e738fd';
import { buangSemua, PESAN_SAMPAH } from './hapus-berkas.js?v=2026-11-13-e738fd';

const esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Tautan berkas Google Drive (sama dengan idBerkas_ di apps-script/Code.gs).
export const berkasDrive = url => /^https:\/\/(drive|docs)\.google\.com\//.test(String(url || ''))
  && /(\/d\/|[?&]id=)[A-Za-z0-9_-]{20,}/.test(String(url));

// Judul usulan dari nama berkas: tanpa cap waktu unggah (yyyyMMdd-HHmmss_) dan ekstensi.
export const judulDariBerkas = nama => String(nama || '').replace(/^\d{8}-\d{6}_/, '')
  .replace(/\.[A-Za-z0-9]{1,5}$/, '').replace(/[_]+/g, ' ').trim().slice(0, 120);

// Tahun usulan: segmen 4 angka di jalur Drive (dokumen/<tabel>/<tahun>/...), lalu tahun dibuat.
export function tahunUsulan(jalur, dibuat){
  const m = String(jalur || '').match(/(?:^|\/)((?:19|20)\d{2})\//);
  if (m) return +m[1];
  const t = +String(dibuat || '').slice(0, 4);
  return t >= 1990 && t <= 2100 ? t : new Date().getFullYear();
}

// Kelompok berkas kembar dari catatan {sumber, id, url, sha256, ket}: sidik sama
// dengan lebih dari satu tautan, atau lebih dari satu catatan pustaka. Tautan
// yang diusulkan dipertahankan: yang dipakai pustaka, lalu yang paling banyak dirujuk.
export function kelompokKembar(catatan){
  const per = new Map();
  catatan.filter(c => c.sha256 && c.url).forEach(c => {
    if (!per.has(c.sha256)) per.set(c.sha256, []);
    per.get(c.sha256).push(c);
  });
  const out = [];
  for (const [sha256, xs] of per) {
    const urls = [...new Set(xs.map(x => x.url))];
    const nDok = xs.filter(x => x.sumber === 'dokumen').length;
    if (urls.length < 2 && nDok < 2) continue;
    const skor = u => (xs.some(x => x.url === u && x.sumber === 'dokumen') ? 1000 : 0) + xs.filter(x => x.url === u).length;
    const usul = urls.slice().sort((a, b) => skor(b) - skor(a))[0];
    out.push({ sha256, urls, catatan: xs, usul });
  }
  return out;
}

const NAMA = { dokumen: 'Pustaka', butir_bukti: 'Butir', lkps_bukti: 'Data prodi', karya_bukti: 'Karya' };

async function semua(q){
  const out = [];
  for (let awal = 0; ; awal += 1000) {
    const { data, error } = await q().order('id').range(awal, awal + 999);
    if (error) throw new Error(error.message);
    out.push(...(data || []));
    if (!data || data.length < 1000) return out;
  }
}

async function panggilScript(sb, isi){
  const U = String(window.UPLOAD_URL || '').trim();
  if (!U) throw new Error('UPLOAD_URL belum diisi di config.js.');
  const { data: { session } } = await sb.auth.getSession();
  if (!session) throw new Error('Sesi login habis. Muat ulang halaman lalu masuk lagi.');
  const res = await fetch(U, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ token: session.access_token, ...isi }) });
  const out = await res.json();
  if (!out.ok) {
    if (/Jenis unggahan tidak dikenal/.test(out.error || ''))
      throw new Error('Apps Script di akun prodi belum diperbarui untuk sidik berkas (apps-script/README.md, "Memperbarui kode").');
    throw new Error(out.error || 'Apps Script gagal.');
  }
  return out;
}

export function pasangRapikan(sb, wadah, { tabel = [], saran = {}, oleh = '', selesai = async () => {} } = {}){
  if (!wadah) return;
  const tabPer = Object.fromEntries(tabel.map(T => [T.tabel, T]));
  wadah.innerHTML = `<p class="ket">Satu dokumen cukup tersimpan sekali. Alat ini memberi sidik (SHA-256) pada
    berkas bukti lama, menampilkan berkas yang tersimpan lebih dari sekali untuk disatukan, dan memasukkan
    unggahan bukti baris lama ke pustaka. Unggahan baru sudah diperiksa otomatis: berkas yang sama persis
    ditautkan, tidak diunggah ulang.</p>
    <div class="aksi"><button type="button" class="btn" id="rp-mulai">Periksa berkas lama</button>
    <span class="msg" id="rp-status"></span></div><div id="rp-hasil"></div>`;
  const status = wadah.querySelector('#rp-status'), hasil = wadah.querySelector('#rp-hasil');
  const lapor = (t, cls = '') => { status.className = 'msg' + (cls ? ' ' + cls : ''); status.textContent = t; };
  let INFO = new Map();   // url -> {sha256, nama, jalur, alasan} dari Apps Script

  async function muat(){
    const [dok, bb, kb, lb] = await Promise.all([
      semua(() => sb.from('dokumen').select('id,jenis,tahun,judul,nomor,url,sha256,diperbarui')),
      semua(() => sb.from('butir_bukti').select('id,butir,judul,url,sha256,dibuat').not('url', 'is', null)),
      semua(() => sb.from('karya_bukti').select('id,judul,url,sha256,dibuat,karya(judul)')),
      semua(() => sb.from('lkps_bukti').select('id,tabel,baris_id,judul,url,sha256,dibuat').not('url', 'is', null))]);
    return [
      ...dok.map(d => ({ sumber: 'dokumen', id: d.id, url: d.url, sha256: d.sha256, ket: labelDokumen(d), dibuat: d.diperbarui })),
      ...bb.map(b => ({ sumber: 'butir_bukti', id: b.id, url: b.url, sha256: b.sha256, ket: `butir ${b.butir}${b.judul ? ' — ' + b.judul : ''}`, dibuat: b.dibuat })),
      ...kb.map(b => ({ sumber: 'karya_bukti', id: b.id, url: b.url, sha256: b.sha256, ket: `${b.karya?.judul || 'karya'}${b.judul ? ' — ' + b.judul : ''}`, dibuat: b.dibuat })),
      ...lb.map(b => ({ sumber: 'lkps_bukti', id: b.id, url: b.url, sha256: b.sha256, tabel: b.tabel, judul: b.judul,
                        ket: `${tabPer[b.tabel]?.judul || b.tabel}${b.judul ? ' — ' + b.judul : ''}`, dibuat: b.dibuat })),
    ];
  }

  async function sidikLama(catatan){
    const perlu = [...new Set(catatan.filter(c => !c.sha256 && berkasDrive(c.url) && !INFO.has(c.url)).map(c => c.url))];
    for (let i = 0; i < perlu.length; i += 10) {
      lapor(`Menghitung sidik berkas ${Math.min(i + 10, perlu.length)} dari ${perlu.length}…`);
      const out = await panggilScript(sb, { kind: 'sidik', urls: perlu.slice(i, i + 10) });
      (out.hasil || []).forEach(x => INFO.set(x.url, x));
      const pasangan = (out.hasil || []).filter(x => x.sha256).map(x => ({ url: x.url, sha256: x.sha256 }));
      if (pasangan.length) {
        const { error } = await sb.rpc('isi_sha256', { p: pasangan });
        if (error) throw new Error('Sidik gagal disimpan: ' + error.message);
      }
    }
    catatan.forEach(c => { if (!c.sha256 && INFO.get(c.url)?.sha256) c.sha256 = INFO.get(c.url).sha256; });
    return perlu.length;
  }

  function gambar(catatan){
    const kembar = kelompokKembar(catatan);
    // Bukti baris berupa berkas prodi (bersidik = di dalam folder prodi), dikelompokkan per tautan.
    const perUrl = new Map();
    catatan.filter(c => c.sumber === 'lkps_bukti' && c.sha256).forEach(c => {
      if (!perUrl.has(c.url)) perUrl.set(c.url, []);
      perUrl.get(c.url).push(c);
    });
    const calon = [...perUrl.entries()].map(([url, xs]) => ({ url, xs, sha256: xs[0].sha256, info: INFO.get(url) || {} }));
    const luar = catatan.filter(c => c.sumber === 'lkps_bukti' && !c.sha256).length;

    const htmlKembar = kembar.length ? kembar.map((g, i) => `<div class="rp-g" data-g="${i}">
        <table class="t"><thead><tr><th>Pertahankan</th><th>Tautan</th><th>Dipakai di</th></tr></thead><tbody>${g.urls.map(u => `<tr>
          <td><input type="radio" name="rp-k${i}" value="${esc(u)}"${u === g.usul ? ' checked' : ''}></td>
          <td><a href="${esc(u)}" target="_blank" rel="noopener nofollow">buka</a></td>
          <td>${g.catatan.filter(c => c.url === u).map(c => `${esc(NAMA[c.sumber])}: ${esc(c.ket)}`).join('<br>')}</td></tr>`).join('')}
        </tbody></table>
        <button type="button" class="btn kecil" data-satukan="${i}">Satukan</button> <span class="msg" id="rp-gm${i}"></span></div>`).join('')
      : '<p class="kosong">Tidak ada berkas kembar.</p>';

    const htmlCalon = calon.length ? `<table class="t"><thead><tr><th>Bukti baris</th><th>Jenis</th><th>Tahun</th><th>Judul</th><th></th></tr></thead><tbody>${
      calon.map((c, i) => {
        const T = tabPer[c.xs[0].tabel] || {};
        const s = saran[T.id] || [];
        return `<tr data-c="${i}"><td>${c.xs.map(x => esc(x.ket)).join('<br>')} · <a href="${esc(c.url)}" target="_blank" rel="noopener nofollow">buka</a></td>
          <td><select data-cj="${i}">${opsiJenis(s, s[0] || 'lainnya')}</select></td>
          <td><input type="number" data-ct="${i}" min="1990" max="2100" style="width:6em" value="${tahunUsulan(c.info.jalur, c.xs[0].dibuat)}"></td>
          <td><input type="text" data-cd="${i}" maxlength="120" value="${esc(judulDariBerkas(c.info.nama || c.xs[0].judul))}"></td>
          <td><button type="button" class="btn kecil" data-masukkan="${i}">Masukkan</button> <span class="msg" id="rp-cm${i}"></span></td></tr>`;
      }).join('')}</tbody></table>
      <div class="aksi"><button type="button" class="btn" id="rp-semua">Masukkan semua</button></div>`
      : '<p class="kosong">Semua bukti baris berupa berkas sudah ada di pustaka.</p>';

    hasil.innerHTML = `<h4>Berkas kembar (${kembar.length})</h4>
      <p class="ket">Isi berkas sama, tersimpan lebih dari sekali. Pilih yang dipertahankan; semua rujukan
        dialihkan ke sana dan salinannya dibuang. ${esc(PESAN_SAMPAH)}</p>${htmlKembar}
      <h4>Bukti baris lama ke pustaka (${calon.length})</h4>
      <p class="ket">Unggahan bukti baris sebelum pustaka ada. Setelah dimasukkan, baris menunjuk dokumen
        pustaka dan dokumen itu bisa ditautkan di tempat lain. Bila pustaka sudah punya berkas yang sama,
        dokumen itu yang dipakai dan salinan ini dibuang. Jenis tunggal tidak memakai judul.
        ${luar ? `${luar} bukti baris berupa tautan luar dibiarkan.` : ''}</p>${htmlCalon}`;

    hasil.querySelectorAll('[data-satukan]').forEach(b => { b.onclick = async () => {
      const i = +b.dataset.satukan, g = kembar[i], m = hasil.querySelector('#rp-gm' + i);
      const simpan = (hasil.querySelector(`input[name="rp-k${i}"]:checked`) || {}).value;
      const buang = g.urls.filter(u => u !== simpan);
      if (!simpan || !confirm(`Alihkan ${buang.length} tautan ke berkas yang dipertahankan, lalu buang salinannya? ${PESAN_SAMPAH}`)) return;
      b.disabled = true;
      try {
        const { error } = await sb.rpc('satukan_berkas', { simpan, buang });
        if (error) throw new Error(error.message);
        const n = await buangSemua(sb, buang);
        m.className = 'msg ok'; m.textContent = `Disatukan; ${n} salinan dibuang.`;
        await selesai();
      } catch (err) { m.className = 'msg buruk'; m.textContent = err.message || String(err); b.disabled = false; }
    }; });

    const masukkan = async i => {
      const c = calon[i], m = hasil.querySelector('#rp-cm' + i), tombol = hasil.querySelector(`[data-masukkan="${i}"]`);
      if (!tombol || tombol.disabled) return true;
      const jenis = hasil.querySelector(`[data-cj="${i}"]`).value;
      const k = kunciDokumen(jenis, hasil.querySelector(`[data-ct="${i}"]`).value, hasil.querySelector(`[data-cd="${i}"]`).value);
      if (!(k.tahun >= 1990 && k.tahun <= 2100)) { m.className = 'msg buruk'; m.textContent = 'Tahun 4 angka.'; return false; }
      if (!infoJenis(jenis).tunggal && !k.judul) { m.className = 'msg buruk'; m.textContent = 'Isi judul.'; return false; }
      tombol.disabled = true;
      try {
        const { data, error } = await sb.rpc('masukkan_pustaka', { p_url: c.url, p_jenis: k.jenis, p_tahun: k.tahun,
          p_judul: k.judul, p_sha256: c.sha256, p_nama: c.info.nama || c.xs[0].judul || '' });
        if (error) throw new Error(error.message);
        if (data && data.sudah_ada) await buangSemua(sb, [c.url]);
        m.className = 'msg ok';
        m.textContent = data && data.sudah_ada ? 'Pustaka sudah punya berkas ini; ditautkan, salinan dibuang.' : 'Masuk pustaka.';
        return true;
      } catch (err) { m.className = 'msg buruk'; m.textContent = err.message || String(err); tombol.disabled = false; return false; }
    };
    hasil.querySelectorAll('[data-masukkan]').forEach(b => { b.onclick = async () => { if (await masukkan(+b.dataset.masukkan)) await selesai(); }; });
    const semuaBtn = hasil.querySelector('#rp-semua');
    if (semuaBtn) semuaBtn.onclick = async () => {
      if (!confirm(`Masukkan ${calon.length} bukti baris ke pustaka dengan jenis, tahun, dan judul di tabel?`)) return;
      semuaBtn.disabled = true;
      let ok = 0;
      for (let i = 0; i < calon.length; i++) { lapor(`Memasukkan ${i + 1} dari ${calon.length}…`); if (await masukkan(i)) ok++; }
      lapor(`${ok} dari ${calon.length} masuk pustaka.`, ok === calon.length ? 'ok' : 'buruk');
      await selesai();
    };
  }

  wadah.querySelector('#rp-mulai').onclick = async e => {
    const tombol = e.currentTarget;
    tombol.disabled = true; hasil.innerHTML = '';
    try {
      if ((await sb.rpc('cari_sha256', { h: '0'.repeat(64) })).error)
        throw new Error('Jalankan dulu supabase/31-patch-sidik-berkas.sql di Supabase SQL Editor.');
      lapor('Membaca catatan bukti…');
      const catatan = await muat();
      const n = await sidikLama(catatan);
      const tanpa = [...INFO.values()].filter(x => !x.sha256);
      lapor(`${catatan.length} catatan bukti; ${n} berkas lama diberi sidik` +
        (tanpa.length ? `; ${tanpa.length} dilewati (${[...new Set(tanpa.map(x => x.alasan))].join(', ')}).` : '.'), 'ok');
      gambar(catatan);
    } catch (err) {
      lapor('Berhenti: ' + (err.message || err), 'buruk');
    } finally {
      tombol.disabled = false;
    }
  };
}
