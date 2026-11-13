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
   Satu dokumen tidak pernah tercatat dua kali (pemilik 2026-11-05): dokumen
   yang sudah ada cukup ditautkan. Pilihan hanya memuat yang belum tertaut di
   butir ini, termasuk berkas yang diunggah di butir lain; tautan manual ke
   berkas yang sudah ada menjadi tautan ke dokumen itu.
   Hak tulis ditegakkan RLS (admin saja); panel hanya tampil bagi admin.

   Pemakaian:
     htmlPanel(no, keadaan)   -> HTML panel satu butir
     pasangPanel(c)           -> sekali per halaman; c = {
         sb, keadaan: () => ({dokumen, butirBukti, ts, gagal, unggah}),
         oleh: () => email pengguna, muatUlang: async () => {...},
         segarkan: () => {...} }
     unggah = {url, ext[], maxMb, accept} dari config.js, atau null.
   ===================================================================== */

import { JENIS_DOKUMEN, infoJenis, buktiButir } from './rencana-bukti.js?v=2026-11-13-39b9d6';
import { tautanBerkas, temuanPakai } from './tautan-privat.js?v=2026-11-13-39b9d6';
import { buangBerkas, PESAN_SAMPAH } from './hapus-berkas.js?v=2026-11-13-39b9d6';
import { periksaBerkas, kolomSidik, teksTemuan } from './sidik-berkas.js?v=2026-11-13-39b9d6';
import { UNSUR_BUTIR, pihakUnsur } from './unsur-butir.js?v=2026-11-13-39b9d6';

const esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = id => document.getElementById(id);

// Bukti per unsur (butir 38, 39, 48, 53-60; pemilik 2026-11-10): unsur yang
// sedang dipilih per butir. Pengecekan "sudah tertaut" berlaku per unsur, jadi
// satu dokumen boleh menjadi bukti beberapa unsur.
const PILIH_UNSUR = new Map();
const unsurPilih = no => (UNSUR_BUTIR[String(no)] && PILIH_UNSUR.get(String(no))) || null;
const samaUnsur = no => b => String(b.butir) === String(no) && (b.unsur || null) === unsurPilih(no);

// Dokumen yang bisa ditautkan ke butir `no`: tanpa yang sudah tertaut di butir ini.
//   j:<jenis> dokumen jenis tunggal (selalu versi berlaku), d:<id> entri pustaka,
//   u:<id> berkas yang diunggah di butir lain (baris butir_bukti).
export function pilihanBukti(no, k){
  const dok = k.dokumen || [], bb = k.butirBukti || [];
  const di = bb.filter(samaUnsur(no));
  const jenis = new Set(di.map(b => b.jenis_dokumen).filter(Boolean));
  const dokId = new Set(di.map(b => b.dokumen_id).filter(Boolean));
  const url = new Set(di.map(b => b.url).filter(Boolean));
  const tertaut = d => dokId.has(d.id) || jenis.has(d.jenis) || url.has(d.url);
  const cocok = j => (j.butir || []).includes(String(no));
  const tunggal = JENIS_DOKUMEN.filter(j => j.tunggal && dok.some(d => d.jenis === j.id)
    && !dok.some(d => d.jenis === j.id && tertaut(d)))
    .map(j => ({ nilai: `j:${j.id}`, label: j.nama, saran: cocok(j) }));
  const banyak = dok.filter(d => !infoJenis(d.jenis).tunggal && !tertaut(d))
    .sort((a, b) => b.tahun - a.tahun || String(a.judul).localeCompare(String(b.judul)))
    .map(d => ({ nilai: `d:${d.id}`, label: `${infoJenis(d.jenis).nama}: ${d.judul} (${d.tahun})`, saran: cocok(infoJenis(d.jenis)) }));
  const semua = [...tunggal, ...banyak];
  const dikenal = new Set(dok.map(d => d.url));
  const sudah = new Set();
  const berkas = bb.filter(b => b.url && !url.has(b.url) && !dikenal.has(b.url))
    .filter(b => !sudah.has(b.url) && sudah.add(b.url))
    .map(b => ({ nilai: `u:${b.id}`, label: `${b.judul || 'Berkas bukti'} (butir ${b.butir}${b.unsur ? ', unsur ' + b.unsur : ''})` }));
  return { saran: semua.filter(x => x.saran), lain: semua.filter(x => !x.saran), berkas };
}

// Baris butir_bukti untuk dokumen yang sudah tersimpan, atau null bila sudah tertaut di butir ini.
export function barisTaut(no, k, b){
  const dok = k.dokumen || [];
  const di = (k.butirBukti || []).filter(samaUnsur(no));
  const d = b.dokumen_id ? dok.find(x => x.id === b.dokumen_id) : dok.find(x => b.url && x.url === b.url);
  if (d) {
    const ada = di.some(x => x.dokumen_id === d.id || x.jenis_dokumen === d.jenis || x.url === d.url);
    return ada ? null : { dokumen_id: d.id };
  }
  return di.some(x => b.url && x.url === b.url) ? null : b;
}

export function htmlPanel(no, k){
  if (k.gagal) return `<div class="pb" id="pb-${esc(no)}"><p class="pb-ket">Tabel
    <code>butir_bukti</code> belum bisa dibaca (${esc(k.gagal)}). Jalankan
    <code>supabase/14-patch-bukti-jamak.sql</code>.</p></div>`;
  const xs = buktiButir(no, k);
  const P = pilihanBukti(no, k);
  const opsi = (label, ys) => ys.length ? `<optgroup label="${esc(label)}">${ys.map(y =>
    `<option value="${esc(y.nilai)}">${esc(y.label)}</option>`).join('')}</optgroup>` : '';
  const pilihan = P.saran.length + P.lain.length + P.berkas.length ? `<select id="pp-${esc(no)}">
      <option value="">— pilih dokumen yang sudah diunggah —</option>
      ${opsi('Disarankan untuk butir ini', P.saran)}${opsi('Dokumen lain di pustaka', P.lain)}${opsi('Berkas di butir lain', P.berkas)}
    </select><button type="button" data-pb="tautkan" data-no="${esc(no)}">Tautkan</button>`
    : `<span class="pb-ket">${(k.dokumen || []).length ? 'Semua dokumen pustaka sudah tertaut di butir ini.'
        : 'Pustaka dokumen masih kosong (unggah di halaman isi butir, bagian Dokumen).'}</span>`;
  const u = k.unggah;
  return `<div class="pb" id="pb-${esc(no)}">
    <div class="pb-j">Kelola bukti butir ${esc(no)} (${xs.length})</div>
    ${htmlUnsurPanel(no, xs)}
    ${xs.length ? `<ul class="pb-l">${xs.map(x => `<li>${x.unsur ? `<span class="pb-unsur">unsur ${esc(x.unsur)} · ${esc(pihakUnsur(no, x.unsur))}</span> ` : ''}${x.url
        ? `<a href="${esc(x.url)}" target="_blank" rel="noopener nofollow">${esc(x.label)}</a>`
        : `${esc(x.label)} <span class="pb-kos">· ${esc(x.ket)}</span>`}
      <span class="pb-ket">${esc(x.ket)}</span>
      ${x.sumber === 'url'
        ? `<button type="button" class="kecil" data-pb="lepas" data-id="${esc(x.id)}" data-url="${esc(x.url)}">Hapus</button>`
        : `<button type="button" class="kecil" data-pb="lepas" data-id="${esc(x.id)}">Lepas</button>`}</li>`).join('')}</ul>`
      : '<p class="pb-ket">Belum ada bukti tertaut.</p>'}
    <div class="pb-a">${pilihan}</div>
    ${u ? `<div class="pb-a"><label>Berkas baru (hanya bila belum pernah diunggah) <input type="file" id="pbf-${esc(no)}" accept="${esc(u.accept)}" multiple></label>
      <label title="Centang untuk berkas berisi data pribadi atau internal: tanpa tautan publik, asesor memakai kata sandi."><input type="checkbox" id="pbv-${esc(no)}"> Privat (data pribadi/internal)</label>
      <button type="button" data-pb="unggah" data-no="${esc(no)}">Unggah</button></div>` : ''}
    <div class="pb-a"><input type="text" id="mj-${esc(no)}" placeholder="Judul bukti (mis. Rekap PDDikti mahasiswa aktif 2025/2026)">
      <input type="url" id="mu-${esc(no)}" placeholder="https://…">
      <button type="button" data-pb="manual" data-no="${esc(no)}">Tambah tautan</button></div>
    <div class="pb-m" id="pm-${esc(no)}"></div>
  </div>`;
}

// Tabel unsur (✓/—, bukti yang dibutuhkan) dan pilihan unsur untuk bukti berikutnya.
function htmlUnsurPanel(no, xs){
  const d = UNSUR_BUTIR[String(no)];
  if (!d) return '';
  const ada = new Set(xs.map(x => +x.unsur).filter(Boolean));
  const pilih = unsurPilih(no);
  return `<table class="pb-tu"><thead><tr><th>Unsur</th><th>Bukti yang dibutuhkan</th><th>Penanggung jawab</th><th></th></tr></thead><tbody>${
    Object.entries(d.unsur).map(([n, l]) => `<tr class="${ada.has(+n) ? 'ada' : 'belum'}"><td>${n}</td><td>${esc(l)}${
      d.contoh?.[n] ? `<br><small class="contoh">Contoh: ${esc(d.contoh[n])}</small>` : ''}</td>
      <td>${esc(pihakUnsur(no, n))}</td><td>${ada.has(+n) ? '✓' : '—'}</td></tr>`).join('')}</tbody></table>
    <div class="pb-a"><label>Bukti berikut untuk <select data-pb-unsur="${esc(no)}">
      <option value="">bukti umum (bukan unsur penilaian)</option>
      ${Object.entries(d.unsur).map(([n, l]) => `<option value="${n}"${pilih === +n ? ' selected' : ''}>Unsur ${n} (${esc(pihakUnsur(no, n))}): ${esc(l)}</option>`).join('')}
    </select></label></div>`;
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
      (Array.isArray(baris) ? baris : [baris]).map(b => ({ butir: +no, oleh: c.oleh(), ...b,
        ...(unsurPilih(no) ? { unsur: unsurPilih(no) } : {}) })));
    if (error) {
      tulis(no, 'buruk', /duplicate|unique/i.test(error.message)
        ? 'Dokumen itu sudah tertaut di butir ini (untuk unsur yang sama).' : 'Gagal menyimpan: ' + error.message);
      return false;
    }
    await selesai();
    return true;
  };

  const aksi = {
    async tautkan(no){
      const v = ($('pp-' + no) || {}).value || '';
      if (!v) return tulis(no, 'buruk', 'Pilih dokumen dulu.');
      if (v.startsWith('u:')) {
        const b = (c.keadaan().butirBukti || []).find(x => x.id === +v.slice(2));
        return simpan(no, { judul: b.judul, url: b.url, ...kolomSidik(b.sha256) });
      }
      await simpan(no, v.startsWith('j:') ? { jenis_dokumen: v.slice(2) } : { dokumen_id: +v.slice(2) });
    },
    async manual(no){
      const judul = $('mj-' + no).value.trim(), url = $('mu-' + no).value.trim();
      if (!/^https?:\/\/\S+$/i.test(url)) return tulis(no, 'buruk', 'Isi tautan https://… yang sah.');
      // Tautan ke berkas yang sudah ada: tautkan berkas itu, jangan catat dua kali.
      const baris = barisTaut(no, c.keadaan(), { judul: judul || 'Tautan bukti', url });
      if (!baris) return tulis(no, 'buruk', 'Dokumen itu sudah tertaut di butir ini.');
      await simpan(no, baris);
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
            if (temuanPakai(s.temuan, !!$('pbv-' + no)?.checked)) {
              baris.push(s.temuan.dokumen_id ? { dokumen_id: s.temuan.dokumen_id }
                : { judul: f.name, url: s.temuan.url, ...kolomSidik(s.sha256) });
              ulang.push(`${f.name} ${teksTemuan(s.temuan)}`);
              continue;
            }
            // text/plain: tanpa preflight CORS (tidak dilayani Apps Script).
            const res = await fetch(u.url, { method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({ token: session.access_token, kind: 'butir', butir: no,
                                     privat: !!$('pbv-' + no)?.checked, filename: f.name, data: await keB64(f) }) });
            const out = await res.json();
            if (!out.ok) throw new Error(out.error || 'Unggah gagal.');
            baris.push({ judul: f.name, url: tautanBerkas(out), ...kolomSidik(s.sha256) });
          } catch (err) {
            gagal.push(`${f.name}: ${err.message || err}`);
            if (/Sesi login/.test(err.message || '')) break;
          }
        }
        // Berkas yang sudah tertaut di butir ini dilewati, tidak menggagalkan yang lain.
        const k = c.keadaan(), sudah = new Set();
        const tautBaru = baris.map(b => barisTaut(no, k, b)).filter(Boolean).filter(b => {
          const id = b.dokumen_id ? `d${b.dokumen_id}` : b.url;
          return !sudah.has(id) && sudah.add(id);
        });
        const lewat = baris.length - tautBaru.length;
        if (lewat) ulang.push(`${lewat} berkas sudah tertaut di butir ini`);
        if (tautBaru.length && !(await simpan(no, tautBaru))) return;
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

  // Ganti unsur: pilihan dokumen dihitung ulang untuk unsur itu.
  document.addEventListener('change', e => {
    const s = e.target.closest('[data-pb-unsur]');
    if (!s) return;
    PILIH_UNSUR.set(s.dataset.pbUnsur, +s.value || null);
    c.segarkan();
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-pb]');
    if (!b) return;
    const no = b.dataset.no || (b.closest('.pb') || { id: '' }).id.replace(/^pb-/, '');
    const f = aksi[b.dataset.pb];
    if (f) f(no, b);
  });
}
