/* =====================================================================
   profil-dosen.js — isian profil dosen untuk LKPS Tabel 4.a (pemilik
   2026-11-04; supabase/22-patch-profil-dosen.sql). Dipakai profil.html
   (dosen mengajukan), kelola-dosen.html (admin), dan lkps.js (lembar 4a).

   Nilai sah mengikuti daftar pilihan di templat LKPS (lembar 4a):
   Kategori Dosen, SKIP (IPM/IPU), kesesuaian "V".
   ===================================================================== */

export const KATEGORI = [['', '—'], ['tetap', 'Dosen Tetap'], ['tidak_tetap', 'Dosen Tidak Tetap'],
  ['industri', 'Dosen Industri']];
export const JENJANG = [['sarjana', 'Sarjana'], ['sarjana_terapan', 'Sarjana Terapan'],
  ['magister', 'Magister'], ['magister_terapan', 'Magister Terapan'],
  ['doktor', 'Doktor'], ['doktor_terapan', 'Doktor Terapan']];
export const JENIS_SERTIFIKAT = [['kompetensi', 'Kompetensi'], ['profesi', 'Profesi'], ['industri', 'Industri']];
export const SKIP = [['', '—'], ['IPM', 'IPM'], ['IPU', 'IPU']];
// Jabatan akademik (kolom dosen.jabatan); dipakai kelola-dosen.html dan verifikasi-profil.js.
export const JABATAN = [['', 'Belum punya jabatan'], ['tenaga_pengajar', 'Tenaga pengajar'],
  ['asisten_ahli', 'Asisten ahli'], ['lektor', 'Lektor'], ['lektor_kepala', 'Lektor kepala'],
  ['guru_besar', 'Guru besar']];

// Kolom riwayat dan sertifikat; [kunci, label, lebar input]
const KOLOM_RIWAYAT = [['perguruan_tinggi', 'Perguruan tinggi'], ['program_studi', 'Program studi'],
  ['bidang_ilmu', 'Bidang ilmu'], ['negara', 'Negara'], ['tahun_lulus', 'Tahun lulus'], ['url', 'Tautan ijazah']];
const KOLOM_SERTIFIKAT = [['bidang', 'Bidang sertifikasi'], ['lembaga', 'Lembaga penerbit'],
  ['nomor', 'Nomor'], ['tahun', 'Tahun'], ['url', 'Tautan bukti']];

// Isian yang boleh diajukan dosen (urutan formulir dan tabel ajuan).
export const ISIAN_PROFIL = [
  ['nama', 'Nama lengkap'], ['jabatan', 'Jabatan akademik'],
  ['sinta_id', 'SINTA ID'], ['scopus_id', 'Scopus ID'], ['orcid', 'ORCID'],
  ['email_alternatif', 'Email alternatif untuk login'],   // patch 69
  ['riwayat_pendidikan', 'Riwayat pendidikan'], ['pendidikan', 'Pendidikan tertinggi'],
  ['bidang_keahlian', 'Bidang keahlian'], ['topik_keahlian', 'Topik keahlian'], ['kata_kunci', 'Kata kunci tambahan'], ['perusahaan', 'Perusahaan / industri'],
  ['nomor_serdos', 'Nomor sertifikat pendidik'], ['sertifikat', 'Sertifikat kompetensi/profesi/industri'],
  ['skip', 'SKIP'], ['stri', 'Nomor STRI'], ['mk_ps_lain', 'MK diampu di PS lain'],
];
// Isian penilaian prodi, hanya admin.
export const ISIAN_ADMIN = [['kategori', 'Kategori dosen'],
  ['sesuai_kompetensi_inti', 'Sesuai kompetensi inti PS'], ['sesuai_keahlian_mk', 'Keahlian sesuai MK diampu']];

export const KOLOM_PROFIL = 'kategori,riwayat_pendidikan,bidang_keahlian,perusahaan,sesuai_kompetensi_inti,' +
  'nomor_serdos,sertifikat,skip,stri,mk_ps_lain,sesuai_keahlian_mk,kata_kunci,topik_keahlian';   // kata_kunci: patch 60; topik_keahlian: patch 61

// Kata kunci keahlian dari isian teks (dipisah koma, titik koma, atau baris baru): rapi, tanpa ganda,
// paling banyak 10, tiap kata <= 60 karakter (sama dengan rapikan_kata_kunci di patch 60). [] -> null.
export function bacaKataKunci(teks){
  const out = [];
  for (const x of String(teks || '').split(/[,;\n]+/)) {
    const k = x.trim().replace(/\s+/g, ' ');
    if (k && k.length <= 60 && !out.some(o => o.toLowerCase() === k.toLowerCase())) out.push(k);
  }
  return out.length ? out.slice(0, 10) : null;
}

const esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const label = (daftar, v) => (daftar.find(x => x[0] === (v || '')) || [, v || '—'])[1];
const opsi = (daftar, v) => daftar.map(([k, l]) =>
  `<option value="${esc(k)}"${k === (v || '') ? ' selected' : ''}>${esc(l)}</option>`).join('');

// Pendidikan tertinggi (kolom dosen.pendidikan: S2/S3) dari riwayat.
export function pendidikanTertinggi(riwayat){
  const j = (riwayat || []).map(r => r.jenjang || '');
  if (j.some(x => x.startsWith('doktor'))) return 'S3';
  if (j.some(x => x.startsWith('magister'))) return 'S2';
  return null;
}

// Satu sel LKPS 4.a kolom E/F/G: "Program studi, Perguruan tinggi (bidang ilmu)".
export function teksPendidikan(riwayat, kelompok){
  return (riwayat || []).filter(r => (r.jenjang || '').startsWith(kelompok))
    .map(r => [r.program_studi, r.perguruan_tinggi].filter(Boolean).join(', ') +
      (r.bidang_ilmu ? ` (${r.bidang_ilmu})` : '') + (r.jenjang.endsWith('terapan') ? ' [terapan]' : ''))
    .filter(Boolean).join('; ');
}

const ringkasRiwayat = r => `${label(JENJANG, r.jenjang)}: ${[r.program_studi, r.perguruan_tinggi].filter(Boolean).join(', ')}` +
  (r.bidang_ilmu ? ` (${r.bidang_ilmu})` : '') + (r.tahun_lulus ? `, ${r.tahun_lulus}` : '') + (r.url ? ' · ada ijazah' : '');
const ringkasSertifikat = s => `${label(JENIS_SERTIFIKAT, s.jenis)}: ${s.bidang || '—'}` +
  (s.lembaga ? `, ${s.lembaga}` : '') + (s.nomor ? `, no. ${s.nomor}` : '') + (s.url ? ' · ada bukti' : '');

// Teks tampilan satu isian (tabel ajuan, daftar admin).
export function tampil(k, v, JABATAN = []){
  if (k === 'jabatan') return label(JABATAN, v);
  if (k === 'kategori') return label(KATEGORI, v);
  if (k === 'riwayat_pendidikan') return (v || []).length ? v.map(ringkasRiwayat).join('; ') : '—';
  if (k === 'sertifikat') return (v || []).length ? v.map(ringkasSertifikat).join('; ') : '—';
  if (k === 'kata_kunci') return (v || []).length ? v.join(', ') : '—';
  if (k === 'topik_keahlian') return (v || []).length ? v.map(x => NAMA_TOPIK.get(x) || x).join('; ') : '—';
  if (k === 'sesuai_kompetensi_inti' || k === 'sesuai_keahlian_mk') return v === true ? 'V' : v === false ? 'tidak' : '—';
  return v || '—';
}

// Sama-tidaknya dua nilai isian (daftar dibandingkan isinya).
export const sama = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null) ||
  (Array.isArray(a) && !a.length && b == null) || (Array.isArray(b) && !b.length && a == null);

// ---------------------------------------------------------------- editor
const bersihBaris = (r, kolom) => Object.fromEntries(
  Object.entries(r).map(([k, v]) => [k, String(v ?? '').trim()]).filter(([k, v]) => v && (k === 'jenjang' || k === 'jenis' || kolom.some(c => c[0] === k))));

// Sel tautan bukti: kotak tautan + tombol Unggah (2026-11-13, pemilik: bukti sertifikat diunggah
// dari profil). Tombol hanya tampil bila pasangEditor diberi fungsi unggah (Profil saya).
const selIsian = (k, v, angka) => k === 'url'
  ? `<td class="ed-url"><input data-k="url" value="${esc(v)}" placeholder="https://… atau unggah">` +
    `<label class="btn ghost kecil ed-unggah">${String(v ?? '').trim() ? 'Ganti berkas' : 'Unggah'}<input type="file" data-unggah hidden></label><small class="ed-status"></small></td>`
  : `<td><input data-k="${k}" value="${esc(v)}"${angka ? ' inputmode="numeric" size="5"' : ''}></td>`;
function barisRiwayat(r, i){
  return `<tr data-i="${i}"><td><select data-k="jenjang">${opsi(JENJANG, r.jenjang || 'sarjana')}</select></td>${
    KOLOM_RIWAYAT.map(([k]) => selIsian(k, r[k], k === 'tahun_lulus')).join('')
  }<td><button type="button" class="btn ghost kecil" data-hapus>Hapus</button></td></tr>`;
}
function barisSertifikat(s, i){
  return `<tr data-i="${i}"><td><select data-k="jenis">${opsi(JENIS_SERTIFIKAT, s.jenis || 'kompetensi')}</select></td>${
    KOLOM_SERTIFIKAT.map(([k]) => selIsian(k, s[k], k === 'tahun')).join('')
  }<td><button type="button" class="btn ghost kecil" data-hapus>Hapus</button></td></tr>`;
}

// Gaya editor dipasang sekali di <head> (bukan di dalam formulir yang
// digambar ulang, supaya tidak ikut terhapus saat formulir diganti).
function pasangGaya(){
  if (typeof document === 'undefined' || document.getElementById('gaya-profil-dosen')) return;
  document.head.insertAdjacentHTML('beforeend', CSS);
}
const CSS = `<style id="gaya-profil-dosen">
  table.ed{border-collapse:collapse;width:100%;font-size:13px;margin-top:4px}
  table.ed th{font-family:var(--mono,monospace);font-size:10.5px;letter-spacing:.05em;text-transform:uppercase;
    color:var(--muted);text-align:left;padding:4px 4px;border-bottom:1px solid var(--line)}
  table.ed td{padding:3px 4px;vertical-align:top}
  table.ed input,table.ed select{width:100%;padding:5px 6px;border:1px solid var(--line);font:inherit;font-size:13px;background:#fff}
  .ed-gulir{overflow-x:auto}
  .ed-gulir table{min-width:720px}
  h3.ed-judul{font-size:14px;margin:16px 0 2px;color:var(--biru)}
  table.ed td.ed-url{min-width:190px}
  .ed-unggah{display:none;margin-top:3px;cursor:pointer}
  .ed-bisa-unggah .ed-unggah{display:inline-block}
  .ed-status{display:block;font-size:11.5px;color:var(--muted)}
  ul.mk-prodi{margin:2px 0 0;padding-left:18px;font-size:13.5px;line-height:1.6}
</style>`;

// Editor daftar: kotak tabel + tombol tambah. Mengembalikan HTML.
export function editorDaftar(id, jenis, daftar){
  const kolom = jenis === 'riwayat' ? [['jenjang', 'Jenjang'], ...KOLOM_RIWAYAT] : [['jenis', 'Jenis'], ...KOLOM_SERTIFIKAT];
  const baris = jenis === 'riwayat' ? barisRiwayat : barisSertifikat;
  pasangGaya();
  return `<div class="ed-gulir"><table class="ed" id="${id}" data-jenis="${jenis}">
    <thead><tr>${kolom.map(([, l]) => `<th>${esc(l)}</th>`).join('')}<th></th></tr></thead>
    <tbody>${(daftar || []).map(baris).join('')}</tbody></table></div>
    <button type="button" class="btn ghost kecil" data-tambah="${id}">+ Tambah baris</button>`;
}

// Pasang tombol tambah/hapus untuk editor di dalam `akar`. `unggah(berkas, {jenis, tahun})`
// mengembalikan tautan bukti; tanpa fungsi itu tombol Unggah tidak tampil (mis. Kelola dosen,
// supaya berkas tidak masuk folder admin).
// Pendengar dipasang SEKALI per wadah (2026-11-13): halaman menggambar ulang isi wadah yang
// sama berkali-kali; pendengar ganda membuat satu pilihan berkas terunggah dua kali.
const SUDAH_DIPASANG = new WeakSet();
export function pasangEditor(akar, { unggah } = {}){
  akar._unggahBukti = unggah || null;
  akar.classList.toggle('ed-bisa-unggah', !!unggah);
  akar.querySelectorAll('[data-tambah]').forEach(b => {
    b.onclick = () => {
      const t = document.getElementById(b.dataset.tambah);
      const fn = t.dataset.jenis === 'riwayat' ? barisRiwayat : barisSertifikat;
      t.tBodies[0].insertAdjacentHTML('beforeend', fn({}, t.tBodies[0].rows.length));
    };
  });
  if (SUDAH_DIPASANG.has(akar)) return;
  SUDAH_DIPASANG.add(akar);
  akar.addEventListener('click', e => {
    if (e.target.matches('table.ed [data-hapus]')) e.target.closest('tr').remove();
  });
  akar.addEventListener('change', async e => {
      const unggah = akar._unggahBukti;
      if (!unggah || !e.target.matches('table.ed [data-unggah]') || !e.target.files.length) return;
      const td = e.target.closest('td'), tr = td.closest('tr'), status = td.querySelector('.ed-status');
      const kotak = td.querySelector('[data-k="url"]'), input = e.target;
      // Satu baris = satu berkas (pemilik 2026-11-13, mis. ijazah): selama mengunggah sel dikunci;
      // baris yang sudah bertautan hanya diganti setelah dikonfirmasi.
      if (td.dataset.sibuk) { input.value = ''; return; }
      if (kotak.value.trim() && !confirm('Baris ini sudah punya berkas bukti. Ganti dengan berkas baru?')) { input.value = ''; return; }
      const ambil = k => (tr.querySelector(`[data-k="${k}"]`) || {}).value || '';
      const tahun = (ambil('tahun') || ambil('tahun_lulus')).trim();
      td.dataset.sibuk = '1'; input.disabled = true;
      status.textContent = 'Mengunggah…';
      try {
        kotak.value = await unggah(input.files[0],
          { jenis: tr.closest('table').dataset.jenis, tahun: /^\d{4}$/.test(tahun) ? +tahun : new Date().getFullYear() });
        status.textContent = 'Terunggah; klik Kirim ajuan untuk menyimpan.';
      } catch (err) { status.textContent = 'Gagal: ' + (err.message || err); }
      finally { delete td.dataset.sibuk; input.disabled = false; input.value = ''; aturLabelUnggah(td); }
  });
  akar.addEventListener('input', e => { if (e.target.matches('table.ed [data-k="url"]')) aturLabelUnggah(e.target.closest('td')); });
}
// Tombol "Unggah" atau "Ganti berkas" menurut isi kotak tautan.
function aturLabelUnggah(td){
  const l = td && td.querySelector('.ed-unggah');
  if (l && l.firstChild) l.firstChild.nodeValue = td.querySelector('[data-k="url"]').value.trim() ? 'Ganti berkas' : 'Unggah';
}

// Baca isi editor menjadi daftar objek; baris tanpa isian dibuang.
export function bacaEditor(id){
  const t = document.getElementById(id);
  const kolom = t.dataset.jenis === 'riwayat' ? KOLOM_RIWAYAT : KOLOM_SERTIFIKAT;
  return [...t.tBodies[0].rows].map(tr => bersihBaris(Object.fromEntries(
    [...tr.querySelectorAll('[data-k]')].map(x => [x.dataset.k, x.value])), kolom))
    .filter(r => kolom.some(([k]) => r[k]));
}

// Bagian formulir LKPS 4.a yang diisi dosen (profil.html dan kelola-dosen.html).
// MK yang diampu di prodi ini (pemilik 2026-11-13): dari ref_mata_kuliah.pengampu (Data prodi ›
// Kurikulum), hanya tampil; null = tidak ditampilkan (mis. Kelola dosen).
export function htmlMkProdi(mkProdi){
  if (!Array.isArray(mkProdi)) return '';
  const isi = mkProdi.length
    ? `<ul class="mk-prodi">${mkProdi.map(m => `<li><code>${esc(m.kode)}</code> ${esc(m.nama)}${m.sks ? ` · ${esc(m.sks)} sks` : ''}</li>`).join('')}</ul>`
    : '<p class="ket" style="margin:2px 0">Belum ada. Admin menugaskan pengampu di Data prodi › Kurikulum (kolom Dosen pengampu).</p>';
  return `<div class="fld penuh"><label>Mata kuliah yang diampu di prodi ini (${mkProdi.length})</label>${isi}
    <small>Otomatis dari penugasan di Data prodi; dipakai di LKPS Tabel 4.a dan CV. Bila salah, hubungi admin.</small></div>`;
}

export function formLKPS(r, { mkProdi = null } = {}){
  return `
    <h3 class="ed-judul">Riwayat pendidikan</h3>
    <p class="ket" style="margin:0 0 4px">Sarjana, magister, dan doktor (LKPS Tabel 4.a kolom 5). Pendidikan tertinggi dihitung dari daftar ini.</p>
    ${editorDaftar('ed_riwayat', 'riwayat', r.riwayat_pendidikan)}
    <div class="grid" style="margin-top:12px">
      <div class="fld"><label>Bidang keahlian</label><input id="f_bidang_keahlian" value="${esc(r.bidang_keahlian)}">
        <small>Contoh: Rekayasa Sumber Daya Air.</small></div>
      <div class="fld"><label>Perusahaan / industri</label><input id="f_perusahaan" value="${esc(r.perusahaan)}">
        <small>Untuk dosen industri/praktisi; kosongkan bila tidak ada.</small></div>
      <div class="fld"><label>Nomor sertifikat pendidik (serdos)</label><input id="f_nomor_serdos" value="${esc(r.nomor_serdos)}"></div>
      <div class="fld"><label>SKIP (sertifikat insinyur profesional)</label><select id="f_skip">${opsi(SKIP, r.skip)}</select></div>
      <div class="fld"><label>Nomor STRI</label><input id="f_stri" value="${esc(r.stri)}"></div>
      ${htmlMkProdi(mkProdi)}
      <div class="fld penuh"><label>Mata kuliah yang diampu di program studi lain</label><input id="f_mk_ps_lain" value="${esc(r.mk_ps_lain)}">
        <small>Pisahkan dengan titik koma. MK di prodi ini diambil dari data kurikulum.</small></div>
    </div>
    <h3 class="ed-judul">Sertifikat kompetensi / profesi / industri</h3>
    ${editorDaftar('ed_sertifikat', 'sertifikat', r.sertifikat)}`;
}

// Nilai bagian LKPS dari formulir. Selama riwayat kosong, pendidikan
// tertinggi yang lama dipertahankan.
export function bacaFormLKPS(pendidikanLama = null){
  const v = k => document.getElementById('f_' + k).value.trim();
  const riwayat = bacaEditor('ed_riwayat');
  return {
    riwayat_pendidikan: riwayat, pendidikan: riwayat.length ? pendidikanTertinggi(riwayat) : pendidikanLama,
    bidang_keahlian: v('bidang_keahlian') || null, perusahaan: v('perusahaan') || null,
    nomor_serdos: v('nomor_serdos') || null, sertifikat: bacaEditor('ed_sertifikat'),
    skip: v('skip') || null, stri: v('stri') || null, mk_ps_lain: v('mk_ps_lain') || null,
  };
}

// ---------------------------------------------------------------------------
// Topik keahlian baku (61-patch-keahlian-baku.sql, pemilik 2026-11-12).
const NAMA_TOPIK = new Map();
/** Nama topik untuk tampil(): panggil dengan baris ref_topik_keahlian setelah dimuat. */
export function setelNamaTopik(topik){ NAMA_TOPIK.clear(); (topik || []).forEach(t => NAMA_TOPIK.set(t.kode, t.nama)); }
export const MAKS_TOPIK = 15;
const escT = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Pemilih topik per bidang (kotak lipat, centang). bidang/topik = baris ref_*_keahlian aktif; terpilih = kode. */
export function htmlPilihTopik(bidang, topik, terpilih = []){
  const pilih = new Set(terpilih || []);
  return bidang.map(b => {
    const ts = topik.filter(t => t.bidang === b.kode);
    if (!ts.length) return '';
    const n = ts.filter(t => pilih.has(t.kode)).length;
    return `<details class="pilih-bidang"${n ? ' open' : ''}><summary><b>${escT(b.nama)}</b> <span class="ket">${escT(b.nama_en)}</span>
        <span class="ket" data-hitung-bidang="${escT(b.kode)}">${n ? `· ${n} dipilih` : ''}</span></summary>
      ${ts.map(t => `<label class="pilih-topik"><input type="checkbox" data-topik="${escT(t.kode)}" data-bidang="${escT(b.kode)}"${pilih.has(t.kode) ? ' checked' : ''}>
        ${escT(t.nama)} <span class="ket">${escT(t.nama_en)}</span></label>`).join('')}</details>`;
  }).join('');
}

/** Kode topik yang dicentang di dalam `akar`, urut tampilan; [] -> null (sama dengan rapikan_topik_keahlian). */
export function bacaPilihTopik(akar){
  const xs = [...akar.querySelectorAll('[data-topik]:checked')].map(c => c.dataset.topik);
  return xs.length ? xs.slice(0, MAKS_TOPIK) : null;
}
