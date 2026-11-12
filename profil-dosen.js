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
  ['bidang_ilmu', 'Bidang ilmu'], ['negara', 'Negara'], ['tahun_lulus', 'Tahun lulus']];
const KOLOM_SERTIFIKAT = [['bidang', 'Bidang sertifikasi'], ['lembaga', 'Lembaga penerbit'],
  ['nomor', 'Nomor'], ['tahun', 'Tahun'], ['url', 'Tautan bukti']];

// Isian yang boleh diajukan dosen (urutan formulir dan tabel ajuan).
export const ISIAN_PROFIL = [
  ['nama', 'Nama lengkap'], ['jabatan', 'Jabatan akademik'],
  ['sinta_id', 'SINTA ID'], ['scopus_id', 'Scopus ID'], ['orcid', 'ORCID'],
  ['riwayat_pendidikan', 'Riwayat pendidikan'], ['pendidikan', 'Pendidikan tertinggi'],
  ['bidang_keahlian', 'Bidang keahlian'], ['kata_kunci', 'Kata kunci keahlian'], ['perusahaan', 'Perusahaan / industri'],
  ['nomor_serdos', 'Nomor sertifikat pendidik'], ['sertifikat', 'Sertifikat kompetensi/profesi/industri'],
  ['skip', 'SKIP'], ['stri', 'Nomor STRI'], ['mk_ps_lain', 'MK diampu di PS lain'],
];
// Isian penilaian prodi, hanya admin.
export const ISIAN_ADMIN = [['kategori', 'Kategori dosen'],
  ['sesuai_kompetensi_inti', 'Sesuai kompetensi inti PS'], ['sesuai_keahlian_mk', 'Keahlian sesuai MK diampu']];

export const KOLOM_PROFIL = 'kategori,riwayat_pendidikan,bidang_keahlian,perusahaan,sesuai_kompetensi_inti,' +
  'nomor_serdos,sertifikat,skip,stri,mk_ps_lain,sesuai_keahlian_mk,kata_kunci';   // kata_kunci: 60-patch-keahlian.sql

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
  (r.bidang_ilmu ? ` (${r.bidang_ilmu})` : '') + (r.tahun_lulus ? `, ${r.tahun_lulus}` : '');
const ringkasSertifikat = s => `${label(JENIS_SERTIFIKAT, s.jenis)}: ${s.bidang || '—'}` +
  (s.lembaga ? `, ${s.lembaga}` : '') + (s.nomor ? `, no. ${s.nomor}` : '');

// Teks tampilan satu isian (tabel ajuan, daftar admin).
export function tampil(k, v, JABATAN = []){
  if (k === 'jabatan') return label(JABATAN, v);
  if (k === 'kategori') return label(KATEGORI, v);
  if (k === 'riwayat_pendidikan') return (v || []).length ? v.map(ringkasRiwayat).join('; ') : '—';
  if (k === 'sertifikat') return (v || []).length ? v.map(ringkasSertifikat).join('; ') : '—';
  if (k === 'kata_kunci') return (v || []).length ? v.join(', ') : '—';
  if (k === 'sesuai_kompetensi_inti' || k === 'sesuai_keahlian_mk') return v === true ? 'V' : v === false ? 'tidak' : '—';
  return v || '—';
}

// Sama-tidaknya dua nilai isian (daftar dibandingkan isinya).
export const sama = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null) ||
  (Array.isArray(a) && !a.length && b == null) || (Array.isArray(b) && !b.length && a == null);

// ---------------------------------------------------------------- editor
const bersihBaris = (r, kolom) => Object.fromEntries(
  Object.entries(r).map(([k, v]) => [k, String(v ?? '').trim()]).filter(([k, v]) => v && (k === 'jenjang' || k === 'jenis' || kolom.some(c => c[0] === k))));

function barisRiwayat(r, i){
  return `<tr data-i="${i}"><td><select data-k="jenjang">${opsi(JENJANG, r.jenjang || 'sarjana')}</select></td>${
    KOLOM_RIWAYAT.map(([k]) => `<td><input data-k="${k}" value="${esc(r[k])}"${k === 'tahun_lulus' ? ' inputmode="numeric" size="5"' : ''}></td>`).join('')
  }<td><button type="button" class="btn ghost kecil" data-hapus>Hapus</button></td></tr>`;
}
function barisSertifikat(s, i){
  return `<tr data-i="${i}"><td><select data-k="jenis">${opsi(JENIS_SERTIFIKAT, s.jenis || 'kompetensi')}</select></td>${
    KOLOM_SERTIFIKAT.map(([k]) => `<td><input data-k="${k}" value="${esc(s[k])}"${k === 'tahun' ? ' inputmode="numeric" size="5"' : ''}></td>`).join('')
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

// Pasang tombol tambah/hapus untuk editor di dalam `akar`.
export function pasangEditor(akar){
  akar.querySelectorAll('[data-tambah]').forEach(b => {
    b.onclick = () => {
      const t = document.getElementById(b.dataset.tambah);
      const fn = t.dataset.jenis === 'riwayat' ? barisRiwayat : barisSertifikat;
      t.tBodies[0].insertAdjacentHTML('beforeend', fn({}, t.tBodies[0].rows.length));
    };
  });
  akar.addEventListener('click', e => {
    if (e.target.matches('table.ed [data-hapus]')) e.target.closest('tr').remove();
  });
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
export function formLKPS(r){
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
