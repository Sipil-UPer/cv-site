/* =====================================================================
   PANEL BUKTI BUTIR — dipakai input-butir.html (kartu tiap butir) dan
   skor.html (kartu butir, khusus admin). Permintaan pemilik 2026-11-03:
   banyak bukti per butir, dan butir kuantitatif bisa diberi bukti langsung
   dari kartu skor.

   Satu butir bisa punya banyak bukti (tabel butir_bukti,
   supabase/14-patch-bukti-jamak.sql):
     - tautan ke pustaka dokumen tanpa unggah ulang (jenis tunggal selalu
       versi berlaku, tahun terbaru <= TS);
     - berkas yang diunggah di panel ini (boleh beberapa sekaligus, tanpa
       folder — pemilik 2026-11-03) — Apps Script kind 'butir' menyimpan ke
       data-lkps/butir-manual/butir-NN/, tiap berkas menjadi satu bukti;
     - tautan manual (judul + URL).
   Hak tulis ditegakkan RLS (admin saja); panel hanya tampil bagi admin.

   Pemakaian:
     htmlPanel(no, keadaan)   -> HTML panel satu butir
     pasangPanel(c)           -> sekali per halaman; c = {
         sb, keadaan: () => ({dokumen, butirBukti, ts, gagal, unggah}),
         oleh: () => email pengguna, muatUlang: async () => {...},
         segarkan: () => {...} }
     unggah = {url, ext[], maxMb, accept} dari config.js, atau null.
   ===================================================================== */

import { JENIS_DOKUMEN, infoJenis, buktiButir } from './rencana-bukti.js?v=2026-11-05-c87389';
import { buangBerkas, PESAN_SAMPAH } from './hapus-berkas.js?v=2026-11-05-c87389';
import { periksaBerkas, kolomSidik, teksTemuan } from './sidik-berkas.js?v=2026-11-05-c87389';

const esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = id => document.getElementById(id);

export function htmlPanel(no, k){
  if (k.gagal) return `<div class="pb" id="pb-${esc(no)}"><p class="pb-ket">Tabel
    <code>butir_bukti</code> belum bisa dibaca (${esc(k.gagal)}). Jalankan
    <code>supabase/14-patch-bukti-jamak.sql</code>.</p></div>`;
  const dok = k.dokumen || [];
  const xs = buktiButir(no, k);
  const tunggal = JENIS_DOKUMEN.filter(j => j.tunggal && dok.some(d => d.jenis === j.id));
  const banyak = dok.filter(d => !infoJenis(d.jenis).tunggal)
    .sort((a, b) => b.tahun - a.tahun || String(a.judul).localeCompare(String(b.judul)));
  const pilihan = (tunggal.length || banyak.length) ? `<select id="pp-${esc(no)}">
      <option value="">— pilih dokumen dari pustaka —</option>
      ${tunggal.length ? `<optgroup label="Jenis tunggal (otomatis versi berlaku)">${tunggal.map(j =>
        `<option value="j:${esc(j.id)}">${esc(j.nama)}</option>`).join('')}</optgroup>` : ''}
      ${banyak.length ? `<optgroup label="Entri dokumen">${banyak.map(d =>
        `<option value="d:${esc(d.id)}">${esc(infoJenis(d.jenis).nama)}: ${esc(d.judul)} (${esc(d.tahun)})</option>`).join('')}</optgroup>` : ''}
    </select><button type="button" data-pb="tautkan" data-no="${esc(no)}">Tautkan</button>`
    : '<span class="pb-ket">Pustaka dokumen masih kosong (unggah di halaman isi butir, bagian Dokumen).</span>';
  const u = k.unggah;
  return `<div class="pb" id="pb-${esc(no)}">
    <div class="pb-j">Kelola bukti butir ${esc(no)} (${xs.length})</div>
    ${xs.length ? `<ul class="pb-l">${xs.map(x => `<li>${x.url
        ? `<a href="${esc(x.url)}" target="_blank" rel="noopener nofollow">${esc(x.label)}</a>`
        : `${esc(x.label)} <span class="pb-kos">· ${esc(x.ket)}</span>`}
      <span class="pb-ket">${esc(x.ket)}</span>
      ${x.sumber === 'url'
        ? `<button type="button" class="kecil" data-pb="lepas" data-id="${esc(x.id)}" data-url="${esc(x.url)}">Hapus</button>`
        : `<button type="button" class="kecil" data-pb="lepas" data-id="${esc(x.id)}">Lepas</button>`}</li>`).join('')}</ul>`
      : '<p class="pb-ket">Belum ada bukti tertaut.</p>'}
    ${u ? `<div class="pb-a"><label>Berkas <input type="file" id="pbf-${esc(no)}" accept="${esc(u.accept)}" multiple></label>
      <button type="button" data-pb="unggah" data-no="${esc(no)}">Unggah</button></div>` : ''}
    <div class="pb-a">${pilihan}</div>
    <div class="pb-a"><input type="text" id="mj-${esc(no)}" placeholder="Judul bukti (mis. Rekap PDDikti mahasiswa aktif 2025/2026)">
      <input type="url" id="mu-${esc(no)}" placeholder="https://…">
      <button type="button" data-pb="manual" data-no="${esc(no)}">Tambah tautan</button></div>
    <div class="pb-m" id="pm-${esc(no)}"></div>
  </div>`;
}

const keB64 = f => new Promise((ok, gagal) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result).split(',')[1] || '');
  r.onerror = () => gagal(new Error('Berkas tidak bisa dibaca: ' + f.name));
  r.readAsDataURL(f);
});

export function pasangPanel(c){
  const tulis = (no, cls, t) => { const m = $('pm-' + no); if (m) { m.className = 'pb-m' + (cls ? ' ' + cls : ''); m.textContent = t; } };
  const selesai = async () => { await c.muatUlang(); c.segarkan(); };
  const simpan = async (no, baris) => {
    const { error } = await c.sb.from('butir_bukti').insert(
      (Array.isArray(baris) ? baris : [baris]).map(b => ({ butir: +no, oleh: c.oleh(), ...b })));
    if (error) {
      tulis(no, 'buruk', /duplicate|unique/i.test(error.message)
        ? 'Dokumen itu sudah tertaut di butir ini.' : 'Gagal menyimpan: ' + error.message);
      return false;
    }
    await selesai();
    return true;
  };

  const aksi = {
    async tautkan(no){
      const v = ($('pp-' + no) || {}).value || '';
      if (!v) return tulis(no, 'buruk', 'Pilih dokumen dulu.');
      await simpan(no, v.startsWith('j:') ? { jenis_dokumen: v.slice(2) } : { dokumen_id: +v.slice(2) });
    },
    async manual(no){
      const judul = $('mj-' + no).value.trim(), url = $('mu-' + no).value.trim();
      if (!/^https?:\/\/\S+$/i.test(url)) return tulis(no, 'buruk', 'Isi tautan https://… yang sah.');
      await simpan(no, { judul: judul || 'Tautan bukti', url });
    },
    // Berkas yang diunggah di butir: dibuang ke Sampah Drive lalu
    // catatannya dihapus (pemilik 2026-11-03). Tautan pustaka: dilepas saja.
    async lepas(no, b){
      const id = +b.dataset.id, url = b.dataset.url;
      if (!confirm(url ? 'Hapus bukti ini? ' + PESAN_SAMPAH
                       : 'Lepas bukti ini dari butir? Dokumen di pustaka tidak dihapus.')) return;
      if (url) {
        try { await buangBerkas(c.sb, url); }
        catch (err) { alert('Gagal membuang berkas: ' + (err.message || err)); return; }
      }
      const { error } = await c.sb.from('butir_bukti').delete().eq('id', id);
      if (error) { alert('Gagal: ' + error.message); return; }
      await selesai();
    },
    async unggah(no, tombol){
      const u = c.keadaan().unggah;
      if (!u) return;
      const semua = [...(($('pbf-' + no) || {}).files || [])];
      if (!semua.length) return tulis(no, 'buruk', 'Pilih berkas dulu.');
      const dilewati = [], unggah = [];
      semua.forEach(f => {
        const e = ((f.name.match(/\.([^.]+)$/) || [])[1] || '').toLowerCase();
        if (!u.ext.includes(e)) dilewati.push(`${f.name} (jenis)`);
        else if (u.maxMb && f.size > u.maxMb * 1024 * 1024) dilewati.push(`${f.name} (> ${u.maxMb} MB)`);
        else unggah.push(f);
      });
      if (!unggah.length) return tulis(no, 'buruk', `Tidak ada berkas yang bisa diunggah. Diterima: ` +
        `${u.ext.join(', ')}, maksimal ${u.maxMb} MB. Dilewati: ${dilewati.join('; ')}.`);
      tombol.disabled = true;
      const baris = [], gagal = [], ulang = [];
      try {
        const { data: { session } } = await c.sb.auth.getSession();
        if (!session) throw new Error('Sesi login habis. Muat ulang halaman lalu masuk lagi.');
        for (let i = 0; i < unggah.length; i++) {
          const f = unggah[i];
          tulis(no, '', `Memeriksa dan mengunggah ${i + 1} dari ${unggah.length}: ${f.name}…`);
          try {
            // Berkas yang sama persis sudah tersimpan (31-patch-sidik-berkas.sql):
            // tautkan yang ada, jangan unggah ulang.
            const s = await periksaBerkas(c.sb, f);
            if (s.temuan) {
              baris.push(s.temuan.dokumen_id ? { dokumen_id: s.temuan.dokumen_id }
                : { judul: f.name, url: s.temuan.url, ...kolomSidik(s.sha256) });
              ulang.push(`${f.name} ${teksTemuan(s.temuan)}`);
              continue;
            }
            // text/plain: tanpa preflight CORS (tidak dilayani Apps Script).
            const res = await fetch(u.url, { method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({ token: session.access_token, kind: 'butir', butir: no,
                                     filename: f.name, data: await keB64(f) }) });
            const out = await res.json();
            if (!out.ok) throw new Error(out.error || 'Unggah gagal.');
            baris.push({ judul: f.name, url: out.url, ...kolomSidik(s.sha256) });
          } catch (err) {
            gagal.push(`${f.name}: ${err.message || err}`);
            if (/Sesi login/.test(err.message || '')) break;
          }
        }
        if (baris.length && !(await simpan(no, baris))) return;
        const ringkas = [`${baris.length} dari ${unggah.length} berkas tertaut`];
        if (ulang.length) ringkas.push(`tidak diunggah ulang (${ulang.join('; ')})`);
        if (dilewati.length) ringkas.push(`dilewati: ${dilewati.join('; ')}`);
        if (gagal.length) ringkas.push(`gagal: ${gagal.join('; ')}`);
        tulis(no, gagal.length || !baris.length ? 'buruk' : 'ok', ringkas.join('. ') + '.');
      } catch (err) {
        tulis(no, 'buruk', err.message || String(err));
      } finally {
        tombol.disabled = false;
      }
    },
  };

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-pb]');
    if (!b) return;
    const no = b.dataset.no || (b.closest('.pb') || { id: '' }).id.replace(/^pb-/, '');
    const f = aksi[b.dataset.pb];
    if (f) f(no, b);
  });
}
