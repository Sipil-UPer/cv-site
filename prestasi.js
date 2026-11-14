// Prestasi mahasiswa yang diisi dosen pembimbing (pemilik 2026-11-06,
// supabase/38-patch-prestasi-dosen.sql). Dipakai input.html: tab Prestasi
// mahasiswa (pasangPrestasi) dan verifikasi.html (pasangVerifikasiPrestasi).
// Admin tetap bisa mengisi langsung di Data prodi.

import { periksaBerkas, kolomSidik, teksTemuan } from './sidik-berkas.js?v=2026-11-14-64b5ca';
import { buangSemua, PESAN_SAMPAH } from './hapus-berkas.js?v=2026-11-14-64b5ca';
import { htmlSaran } from './saran-bukti.js?v=2026-11-14-64b5ca';
import { tautanBerkas, temuanPakai } from './tautan-privat.js?v=2026-11-14-64b5ca';
import { htmlTautanButir, tsBaris } from './tautan-butir.js?v=2026-11-14-64b5ca';

export const TABEL = 'lkps_prestasi_mahasiswa';

// Butir 43 memakai prestasi terverifikasi pada jendela TS-4..TS (skor.html
// butir43); tautan dibuka pada TS prestasi itu.
export function tautanPrestasi(r){
  if (r.status === 'ditolak') return '';
  return `<div class="rec-m">${htmlTautanButir(['43'], tsBaris(r.tahun, r.bulan),
    r.status === 'terverifikasi' ? 'Dipakai di' : 'Masuk setelah diverifikasi:')}</div>`;
}
export const JENIS_BUKTI_PRESTASI = [['sertifikat', 'Sertifikat / piagam'], ['surat_tugas', 'Surat tugas (privat)'],
  ['foto', 'Foto kegiatan'], ['lainnya', 'Lainnya']];
const BIDANG = [['akademik', 'Akademik'], ['non_akademik', 'Nonakademik']];
const TINGKAT = [['internasional', 'Internasional'], ['nasional', 'Nasional'], ['wilayah_lokal', 'Wilayah/lokal']];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September',
  'Oktober', 'November', 'Desember'];
const LABEL = { nama_kegiatan: 'Nama kegiatan', nama_mahasiswa: 'Mahasiswa', nim: 'NIM', penyelenggara: 'Penyelenggara',
  bidang: 'Bidang', tingkat: 'Tingkat', capaian: 'Capaian', tahun: 'Tahun', bulan: 'Bulan', pembimbing: 'Pembimbing' };

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nama = (xs, v) => (xs.find(x => x[0] === v) || [v, v ?? ''])[1];
export const JENIS_PRESTASI_PRIVAT = ['surat_tugas'];
export const namaJenis = j => nama(JENIS_BUKTI_PRESTASI, j || 'lainnya');

// ---------- logika murni ----------

// Kata yang ada di hampir semua nama lomba tidak ikut membandingkan.
const KATA_UMUM = new Set(['lomba', 'kompetisi', 'kejuaraan', 'tingkat', 'nasional', 'internasional', 'tahun',
  'dan', 'di', 'the', 'of', 'in', 'competition']);
const kataKegiatan = s => new Set(String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ')
  .filter(w => w.length > 1 && !KATA_UMUM.has(w) && !/^\d+$/.test(w)));
const ringkasCapaian = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

// Mirip = sebagian besar kata nama kegiatan sama, dan capaiannya tidak
// berbeda (Juara 1 dan Juara 3 pada satu lomba adalah dua prestasi).
export function mirip(a, b){
  const ca = ringkasCapaian(a.capaian), cb = ringkasCapaian(b.capaian);
  if (ca && cb && ca !== cb) return false;
  const ka = kataKegiatan(a.nama_kegiatan), kb = kataKegiatan(b.nama_kegiatan);
  const kecil = Math.min(ka.size, kb.size);
  if (kecil < 2) return false;
  return [...ka].filter(w => kb.has(w)).length / kecil >= 0.7;
}
export const cariMirip = (isi, daftar) => (daftar || []).filter(r => r.id !== isi.id && mirip(isi, r));

// "A; B" <-> baris mahasiswa, sama dengan isian Data prodi.
export const pecah = v => String(v ?? '').split(';').map(s => s.trim());
export function barisMahasiswa(r){
  const n = pecah(r?.nama_mahasiswa), m = pecah(r?.nim);
  const k = Math.max(n.filter(Boolean).length, m.filter(Boolean).length);
  return Array.from({ length: k }, (_, i) => ({ nama: n[i] || '', nim: m[i] || '' }));
}
export const gabungMahasiswa = rows => ({ nama_mahasiswa: rows.map(x => x.nama).join('; ') || null,
  nim: rows.map(x => x.nim).join('; ') || null });

// Daftar galat isian; baru = isian baru, yang wajib punya sertifikat/piagam.
export function periksaIsian(isi, mahasiswa, antrean, baru){
  const g = [];
  if (!String(isi.nama_kegiatan || '').trim()) g.push('Nama kegiatan wajib diisi');
  if (!isi.bidang) g.push('Bidang wajib dipilih');
  if (!isi.tingkat) g.push('Tingkat wajib dipilih');
  if (!Number.isInteger(isi.tahun) || isi.tahun < 1990 || isi.tahun > 2100) g.push('Tahun wajib dipilih');
  if (!mahasiswa.length) g.push('Isi sedikitnya satu mahasiswa');
  if (mahasiswa.some(x => !x.nama || !x.nim)) g.push('Tiap mahasiswa perlu nama dan NIM');
  if (mahasiswa.some(x => x.nama.includes(';') || x.nim.includes(';'))) g.push('Satu mahasiswa per baris, tanpa titik koma');
  if (!(isi.pembimbing || []).length) g.push('Pilih sedikitnya satu pembimbing');
  if (baru && !antrean.some(b => b.jenis === 'sertifikat')) g.push('Unggah sertifikat atau piagam sebagai bukti');
  return g;
}

// Kolom yang berubah saja, untuk ajuan: { data, lama }.
export function ubahan(lama, baru){
  const sama = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  const data = {}, sebelum = {};
  Object.keys(baru).forEach(k => { if (!sama(lama[k], baru[k])) { data[k] = baru[k]; sebelum[k] = lama[k] ?? null; } });
  return { data, lama: sebelum };
}

export const ubahLangsung = (r, saya) => r.dilaporkan_oleh === saya.id && r.status !== 'terverifikasi';

// ---------- pembantu bersama ----------

const keB64 = f => new Promise((ok, gagal) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result).split(',')[1]);
  r.onerror = () => gagal(r.error);
  r.readAsDataURL(f);
});

const namaDosen = (dosen, nidn) => (dosen.find(d => d.nidn === nidn) || {}).nama || nidn;
const judulBukti = (jenis, nama_) => `${namaJenis(jenis)}: ${nama_}`;

// Berkas ke Drive lewat kind 'karya': <tahun>/<dosen>/Prestasi - <kegiatan>/.
async function unggahBerkas(sb, berkas, jenis, tahun, kegiatan, tulis){
  const ext = String(window.UPLOAD_EXT || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  const maxMb = Number(window.UPLOAD_MAX_MB) || 0;
  if (!window.UPLOAD_URL) throw new Error('Unggah berkas belum disiapkan; tempel tautan saja.');
  const { data: { session } } = await sb.auth.getSession();
  if (!session) throw new Error('Sesi login habis. Muat ulang halaman.');
  const hasil = [];
  for (let i = 0; i < berkas.length; i++) {
    const f = berkas[i], e = ((f.name.match(/\.([^.]+)$/) || [])[1] || '').toLowerCase();
    if (ext.length && !ext.includes(e)) throw new Error(`${f.name}: jenis berkas tidak diterima (${ext.join(', ')}).`);
    if (maxMb && f.size > maxMb * 1024 * 1024) throw new Error(`${f.name}: lebih dari ${maxMb} MB.`);
    tulis(`Memeriksa dan mengunggah ${i + 1}/${berkas.length}: ${f.name}…`);
    const s = await periksaBerkas(sb, f), privat = JENIS_PRESTASI_PRIVAT.includes(jenis);
    if (temuanPakai(s.temuan, privat)) {
      hasil.push({ jenis, judul: judulBukti(jenis, f.name), url: s.temuan.url, ...kolomSidik(s.sha256), catatan: teksTemuan(s.temuan) });
      continue;
    }
    const res = await fetch(window.UPLOAD_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ token: session.access_token, kind: 'karya', year: tahun,
                             ...(privat ? { privat: true } : { group: `Prestasi - ${kegiatan}` }),
                             filename: f.name, data: await keB64(f) }) });
    const out = await res.json();
    if (!out.ok) throw new Error(out.error || 'Unggah gagal.');
    hasil.push({ jenis, judul: judulBukti(jenis, f.name), url: tautanBerkas(out), ...kolomSidik(s.sha256) });
  }
  return hasil;
}

const barisBukti = (b, id, email) => ({ tabel: TABEL, baris_id: id, jenis: b.jenis, judul: b.judul, url: b.url,
  oleh: email, ...(b.sha256 ? { sha256: b.sha256 } : {}) });

async function buktiUntuk(sb, ids){
  const peta = new Map();
  if (!ids.length) return peta;
  const { data } = await sb.from('lkps_bukti').select('id,baris_id,jenis,judul,url,oleh')
    .eq('tabel', TABEL).in('baris_id', ids).order('id');
  (data || []).forEach(b => { if (!peta.has(b.baris_id)) peta.set(b.baris_id, []); peta.get(b.baris_id).push(b); });
  return peta;
}

const metaPrestasi = r => [r.tahun, r.bulan ? BULAN[r.bulan - 1] : null, nama(TINGKAT, r.tingkat), nama(BIDANG, r.bidang),
  r.capaian, r.penyelenggara].filter(Boolean);
const htmlMeta = xs => `<div class="rec-m">${xs.map(x => `<span>${esc(x)}</span>`).join('')}</div>`;
const tautan = (url, teks) => `<a href="${esc(url)}" target="_blank" rel="noopener nofollow">${esc(teks)}</a>`;

function htmlOrang(r, dosen){
  const mhs = barisMahasiswa(r).map(m => `${m.nama} (${m.nim})`).join('; ');
  const pb = (r.pembimbing || []).map(n => namaDosen(dosen, n)).join(', ');
  return (mhs ? htmlMeta([`Mahasiswa: ${mhs}`]) : '') + (pb ? htmlMeta([`Pembimbing: ${pb}`]) : '');
}

// ---------- tab dosen ----------

export async function pasangPrestasi(wadah, { sb, saya, dosen }){
  let SUNTING = null, ANTREAN = [], BARIS = [], BUKTI = new Map(), AJUAN = new Map();
  const TH = new Date().getFullYear();
  const $ = id => wadah.querySelector('#' + id);
  const opsi = xs => xs.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('');
  const baris = (m = {}) => `<div class="pr-mhs" style="display:flex;gap:8px;margin-bottom:6px">
    <input data-m="nama" placeholder="Nama mahasiswa" value="${esc(m.nama || '')}" style="flex:2;min-width:0">
    <input data-m="nim" placeholder="NIM" value="${esc(m.nim || '')}" style="flex:1;min-width:0">
    <button type="button" class="btn ghost sm" data-hapus-mhs="1" title="Hapus mahasiswa ini">×</button></div>`;

  wadah.innerHTML = `<div class="panel"><h2 id="pr_judul">Prestasi mahasiswa bimbingan</h2>
    <p class="hint">Satu entri untuk satu prestasi (LKPS Tabel 6.c, butir 43). Tim boleh beberapa mahasiswa dan
    beberapa pembimbing. Prestasi dihitung setelah diverifikasi admin. Nama dan NIM tidak dipublikasikan.
    ${htmlTautanButir(['43'], null, 'Lihat')}</p>
    ${htmlSaran('prestasi_dosen')}
    <form id="pr_form" novalidate><div class="grid">
      <div class="fld full"><label for="pr_kegiatan">Nama kegiatan <span class="req">*</span></label>
        <input id="pr_kegiatan" type="text"></div>
      <div class="fld full"><label>Mahasiswa <span class="req">*</span></label>
        <div id="pr_mhs">${baris()}</div>
        <div><button type="button" class="btn ghost sm" id="pr_tambah_mhs">+ Tambah mahasiswa</button></div></div>
      <div class="fld"><label for="pr_bidang">Bidang <span class="req">*</span></label>
        <select id="pr_bidang"><option value="">— pilih —</option>${opsi(BIDANG)}</select></div>
      <div class="fld"><label for="pr_tingkat">Tingkat <span class="req">*</span></label>
        <select id="pr_tingkat"><option value="">— pilih —</option>${opsi(TINGKAT)}</select></div>
      <div class="fld"><label for="pr_tahun">Tahun <span class="req">*</span></label>
        <select id="pr_tahun"><option value="">— pilih —</option>${opsi(Array.from({ length: 12 }, (_, i) =>
          [String(TH + 1 - i), String(TH + 1 - i)]))}</select></div>
      <div class="fld"><label for="pr_bulan">Bulan</label>
        <select id="pr_bulan"><option value="">—</option>${opsi(BULAN.map((b, i) => [String(i + 1), b]))}</select>
        <span class="sub">Menentukan tahun akademik (TS): September ke atas masuk TS berikutnya</span></div>
      <div class="fld"><label for="pr_capaian">Capaian</label>
        <input id="pr_capaian" type="text" placeholder="Juara 2"></div>
      <div class="fld"><label for="pr_penyelenggara">Penyelenggara</label>
        <input id="pr_penyelenggara" type="text"></div>
      <div class="fld full"><label>Dosen pembimbing <span class="req">*</span></label>
        <div id="pr_pembimbing" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:2px 12px">
          ${dosen.map(d => `<label style="display:flex;gap:6px;align-items:center;font-weight:400">
            <input type="checkbox" value="${esc(d.nidn)}" style="width:auto">${esc(d.nama)}</label>`).join('')}</div></div>
      <div class="fld full" id="pr_blok_bukti"><label>Bukti <span class="req">*</span></label>
        <span class="sub">Sertifikat atau piagam wajib. Surat tugas dan foto boleh ditambahkan.</span>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <select id="pr_jenis" style="width:auto">${opsi(JENIS_BUKTI_PRESTASI)}</select>
          <input id="pr_berkas" type="file" multiple style="width:auto;flex:1;min-width:200px">
          <button type="button" class="btn ghost sm" id="pr_unggah">Unggah</button></div>
        <ul id="pr_antrean" style="margin:6px 0 0;padding-left:18px;font-size:13px"></ul></div>
    </div>
    <div class="aksi"><button class="btn" type="submit" id="pr_simpan">Simpan</button>
      <button class="btn ghost" type="button" id="pr_batal" hidden>Batal</button>
      <span class="msg" id="pr_msg"></span></div></form></div>
    <div class="panel"><h2>Prestasi yang saya bimbing</h2><div id="pr_daftar" class="kosong">Memuat…</div></div>`;

  const tulis = (cls, t) => { const m = $('pr_msg'); m.className = 'msg' + (cls ? ' ' + cls : ''); m.textContent = t; };
  const centang = () => [...$('pr_pembimbing').querySelectorAll('input')];
  const mahasiswa = () => [...wadah.querySelectorAll('.pr-mhs')].map(b => ({
    nama: b.querySelector('[data-m=nama]').value.trim(), nim: b.querySelector('[data-m=nim]').value.trim() }))
    .filter(x => x.nama || x.nim);
  const gambarAntrean = () => {
    $('pr_antrean').innerHTML = ANTREAN.map((b, i) => `<li>${tautan(b.url, b.judul)}${b.catatan ? ` (${esc(b.catatan)})` : ''}
      <button type="button" class="btn ghost sm" data-buang="${i}">×</button></li>`).join('');
  };
  const isiForm = r => {
    SUNTING = r || null; ANTREAN = []; gambarAntrean();
    $('pr_judul').textContent = r ? (ubahLangsung(r, saya) ? 'Ubah prestasi' : 'Ajukan perubahan prestasi')
                                  : 'Prestasi mahasiswa bimbingan';
    $('pr_batal').hidden = !r;
    $('pr_blok_bukti').hidden = !!r;
    $('pr_simpan').textContent = r && !ubahLangsung(r, saya) ? 'Kirim ajuan' : 'Simpan';
    [['kegiatan', 'nama_kegiatan'], ['bidang', 'bidang'], ['tingkat', 'tingkat'], ['tahun', 'tahun'], ['bulan', 'bulan'],
     ['capaian', 'capaian'], ['penyelenggara', 'penyelenggara']].forEach(([id, k]) => { $('pr_' + id).value = r?.[k] ?? ''; });
    const mhs = barisMahasiswa(r);
    $('pr_mhs').innerHTML = (mhs.length ? mhs : [{}]).map(baris).join('');
    const pilih = new Set(r ? r.pembimbing || [] : [saya.nidn]);
    centang().forEach(c => { c.checked = pilih.has(c.value); });
  };
  const bacaIsian = () => ({
    nama_kegiatan: $('pr_kegiatan').value.trim(), bidang: $('pr_bidang').value || null, tingkat: $('pr_tingkat').value || null,
    tahun: $('pr_tahun').value ? +$('pr_tahun').value : null, bulan: $('pr_bulan').value ? +$('pr_bulan').value : null,
    capaian: $('pr_capaian').value.trim() || null, penyelenggara: $('pr_penyelenggara').value.trim() || null,
    pembimbing: centang().filter(c => c.checked).map(c => c.value), ...gabungMahasiswa(mahasiswa()) });

  async function unggahAntrean(){
    const f = [...$('pr_berkas').files], tahun = $('pr_tahun').value, kegiatan = $('pr_kegiatan').value.trim();
    if (!f.length) return tulis('err', 'Pilih berkas dulu.');
    if (!tahun || !kegiatan) return tulis('err', 'Isi nama kegiatan dan tahun dulu; keduanya menjadi nama folder bukti.');
    $('pr_unggah').disabled = true;
    try {
      ANTREAN.push(...await unggahBerkas(sb, f, $('pr_jenis').value, tahun, kegiatan, t => tulis('', t)));
      $('pr_berkas').value = ''; gambarAntrean();
      tulis('ok', 'Berkas siap; tersimpan sebagai bukti saat prestasi disimpan.');
    } catch (e) { tulis('err', e.message || String(e)); }
    $('pr_unggah').disabled = false;
  }

  async function simpan(){
    const isi = bacaIsian(), r = SUNTING;
    const galat = periksaIsian(isi, mahasiswa(), ANTREAN, !r);
    if (galat.length) return tulis('err', galat.join(' · '));
    $('pr_simpan').disabled = true;
    try {
      if (!r) {
        const { data: sejenis } = await sb.rpc('prestasi_mirip', { p_tahun: isi.tahun });
        const m = cariMirip(isi, sejenis);
        if (m.length && !confirm('Prestasi yang mirip sudah tercatat:\n' + m.map(x => `- ${x.nama_kegiatan}`
            + `${x.capaian ? ' (' + x.capaian + ')' : ''}`).join('\n') + '\n\nBila sama, minta pelapornya menambahkan Anda '
            + 'sebagai pembimbing. Tetap simpan sebagai prestasi baru?')) return;
        const { data: baru, error } = await sb.from(TABEL).insert({ ...isi, status: 'diajukan', dilaporkan_oleh: saya.id,
          oleh: saya.email }).select('id').single();
        if (error) throw error;
        const { error: eB } = await sb.from('lkps_bukti').insert(ANTREAN.map(b => barisBukti(b, baru.id, saya.email)));
        isiForm(null);
        tulis(eB ? 'err' : 'ok', eB ? 'Prestasi tersimpan, tetapi bukti gagal dicatat (' + eB.message + '); tambahkan lagi di daftar.'
                                    : 'Tersimpan, menunggu verifikasi admin.');
      } else if (ubahLangsung(r, saya)) {
        const { error } = await sb.from(TABEL).update({ ...isi, status: 'diajukan', catatan: null, oleh: saya.email,
          diperbarui: new Date().toISOString() }).eq('id', r.id);
        if (error) throw error;
        isiForm(null); tulis('ok', 'Perubahan tersimpan, menunggu verifikasi admin.');
      } else {
        const { data, lama } = ubahan(r, isi);
        if (!Object.keys(data).length) return tulis('err', 'Tidak ada yang berubah.');
        const alasan = prompt('Alasan perubahan:');
        if (!alasan?.trim()) return tulis('err', 'Alasan wajib diisi.');
        const { error } = await sb.from('ajuan_prestasi').insert({ prestasi_id: r.id, data, lama, alasan: alasan.trim() });
        if (error) throw error;
        isiForm(null); tulis('ok', 'Ajuan terkirim; admin memutuskannya di halaman Verifikasi.');
      }
      await muat();
    } catch (e) { tulis('err', /ajuan_prestasi_menunggu/.test(e.message || '') ? 'Masih ada ajuan yang menunggu untuk prestasi ini.'
                                                                              : 'Gagal: ' + (e.message || e)); }
    finally { $('pr_simpan').disabled = false; }
  }

  function aksi(r){
    const a = AJUAN.get(r.id);
    if (a?.status === 'menunggu') return `<span class="tag">ajuan menunggu</span>
      <button class="btn ghost sm" data-batal-ajuan="${a.id}">Batalkan ajuan</button>`;
    const langsung = ubahLangsung(r, saya);
    return `<button class="btn ghost sm" data-ubah="${r.id}">${langsung ? 'Ubah' : 'Ajukan ubah'}</button>
      <button class="btn danger sm" data-hapus="${r.id}">${langsung ? 'Hapus' : 'Ajukan hapus'}</button>`;
  }
  function htmlBaris(r){
    const a = AJUAN.get(r.id), xs = BUKTI.get(r.id) || [];
    const bisaBuang = b => r.status !== 'terverifikasi' && String(b.oleh).toLowerCase() === String(saya.email).toLowerCase();
    return `<div class="rec" data-s="${esc(r.status)}"><div class="spine"></div><div class="rec-b">
      <div class="rec-j">${esc(r.nama_kegiatan)}</div>${htmlMeta(metaPrestasi(r))}${htmlOrang(r, dosen)}
      ${tautanPrestasi(r)}
      ${r.catatan ? htmlMeta([`Catatan admin: ${r.catatan}`]) : ''}
      ${a?.status === 'ditolak' ? `<div class="rec-m"><span>Ajuan ditolak: ${esc(a.catatan_admin || '-')}</span>
        <button class="btn ghost sm" data-batal-ajuan="${a.id}">Tutup</button></div>` : ''}
      <ul style="margin:6px 0;padding-left:18px;font-size:13px">
        ${r.tautan_bukti ? `<li>${tautan(r.tautan_bukti, 'Bukti (lama)')}</li>` : ''}
        ${xs.map(b => `<li>${tautan(b.url, b.judul || namaJenis(b.jenis))}${bisaBuang(b)
          ? ` <button class="btn ghost sm" data-buang-bukti="${b.id}">×</button>` : ''}</li>`).join('')}</ul>
      <details><summary style="cursor:pointer;font-size:13px">Tambah bukti</summary>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:6px">
          <select id="prj-${r.id}" style="width:auto">${opsi(JENIS_BUKTI_PRESTASI)}</select>
          <input id="prf-${r.id}" type="file" multiple style="width:auto;flex:1;min-width:180px">
          <input id="pru-${r.id}" type="url" placeholder="atau tempel tautan https://…" style="flex:1;min-width:180px">
          <button class="btn ghost sm" data-tambah-bukti="${r.id}">Tambah</button>
          <span class="msg" id="prm-${r.id}"></span></div></details>
      </div><div class="rec-a"><span class="tag">${esc(r.status)}</span>${aksi(r)}</div></div>`;
  }

  async function muat(){
    const box = $('pr_daftar');
    const { data, error } = await sb.from(TABEL).select('*').order('tahun', { ascending: false }).order('id', { ascending: false });
    if (error) { box.className = 'kosong'; box.textContent = 'Tabel prestasi belum bisa dibaca (' + error.message
      + '). Jalankan supabase/38-patch-prestasi-dosen.sql.'; return; }
    // Admin membaca semua baris; tab ini hanya miliknya sendiri.
    BARIS = (data || []).filter(r => r.dilaporkan_oleh === saya.id || (r.pembimbing || []).includes(saya.nidn));
    if (!BARIS.length) { box.className = 'kosong'; box.textContent = 'Belum ada prestasi.'; return; }
    const ids = BARIS.map(r => r.id);
    BUKTI = await buktiUntuk(sb, ids);
    const { data: aj } = await sb.from('ajuan_prestasi').select('*').eq('oleh', saya.id).in('prestasi_id', ids);
    AJUAN = new Map((aj || []).map(a => [a.prestasi_id, a]));
    box.className = ''; box.innerHTML = BARIS.map(htmlBaris).join('');
  }

  async function tambahBukti(r, tombol){
    const m = $('prm-' + r.id), jenis = $('prj-' + r.id).value, url = $('pru-' + r.id).value.trim();
    const f = [...$('prf-' + r.id).files], t = x => { m.className = 'msg'; m.textContent = x; };
    if (!f.length && !url) return t('Pilih berkas atau tempel tautan.');
    if (url && !/^https?:\/\/\S+$/i.test(url)) return t('Tautan harus https://…');
    tombol.disabled = true;
    try {
      const xs = f.length ? await unggahBerkas(sb, f, jenis, r.tahun, r.nama_kegiatan, t) : [];
      if (url) xs.push({ jenis, judul: judulBukti(jenis, 'tautan'), url });
      const { error } = await sb.from('lkps_bukti').insert(xs.map(b => barisBukti(b, r.id, saya.email)));
      if (error) throw error;
      await muat();
    } catch (e) { m.className = 'msg err'; m.textContent = e.message || String(e); tombol.disabled = false; }
  }

  wadah.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    const d = b.dataset, cari = id => BARIS.find(r => r.id === +id);
    if (b.id === 'pr_tambah_mhs') return $('pr_mhs').insertAdjacentHTML('beforeend', baris());
    if (b.id === 'pr_unggah') return unggahAntrean();
    if (b.id === 'pr_batal') { isiForm(null); return tulis('', ''); }
    if (d.hapusMhs) { b.parentElement.remove(); if (!wadah.querySelector('.pr-mhs')) $('pr_mhs').innerHTML = baris(); return; }
    if (d.buang) { ANTREAN.splice(+d.buang, 1); return gambarAntrean(); }
    if (d.ubah) { isiForm(cari(d.ubah)); tulis('', ''); return wadah.scrollIntoView({ behavior: 'smooth' }); }
    if (d.tambahBukti) return tambahBukti(cari(d.tambahBukti), b);
    if (d.buangBukti) {
      if (!confirm('Lepaskan bukti ini? Berkasnya tetap di Drive.')) return;
      const { error } = await sb.from('lkps_bukti').delete().eq('id', +d.buangBukti);
      if (error) alert(error.message);
      return muat();
    }
    if (d.batalAjuan) {
      const { error } = await sb.from('ajuan_prestasi').delete().eq('id', +d.batalAjuan);
      if (error) alert(error.message);
      return muat();
    }
    if (d.hapus) {
      const r = cari(d.hapus);
      if (ubahLangsung(r, saya)) {
        if (!confirm(`Hapus "${r.nama_kegiatan}"? Berkas buktinya tetap di Drive.`)) return;
        const { error } = await sb.from(TABEL).delete().eq('id', r.id);
        if (error) alert(error.message);
      } else {
        const alasan = prompt('Alasan menghapus prestasi ini:');
        if (!alasan?.trim()) return;
        const { error } = await sb.from('ajuan_prestasi').insert({ prestasi_id: r.id, hapus: true, alasan: alasan.trim() });
        if (error) alert(error.message);
      }
      return muat();
    }
  });
  $('pr_form').onsubmit = e => { e.preventDefault(); simpan(); };
  isiForm(null);
  await muat();
}

// ---------- verifikasi.html, tab Prestasi (admin) ----------

export async function pasangVerifikasiPrestasi(boxIsian, boxAjuan, { sb, dosen }){
  const tampilKolom = (k, v) => k === 'pembimbing' ? (v || []).map(n => namaDosen(dosen, n)).join(', ')
    : k === 'bulan' ? (v ? BULAN[v - 1] : '') : k === 'tingkat' ? nama(TINGKAT, v) : k === 'bidang' ? nama(BIDANG, v) : v ?? '';

  async function muat(){
    const [{ data, error }, { data: aj, error: eA }] = await Promise.all([
      sb.from(TABEL).select('*').order('tahun', { ascending: false }),
      sb.from('ajuan_prestasi').select('*').eq('status', 'menunggu').order('dibuat_pada')]);
    if (error || eA) {
      boxIsian.className = boxAjuan.className = 'kosong';
      boxIsian.textContent = boxAjuan.textContent = 'Belum bisa dibaca (' + (error || eA).message
        + '). Jalankan supabase/38-patch-prestasi-dosen.sql.';
      return;
    }
    const semua = data || [], tunggu = semua.filter(r => r.status === 'diajukan'), per = new Map(semua.map(r => [r.id, r]));
    const bukti = await buktiUntuk(sb, [...new Set([...tunggu.map(r => r.id), ...(aj || []).map(a => a.prestasi_id)])]);
    const daftarBukti = r => `<ul style="margin:6px 0;padding-left:18px;font-size:13px">
      ${r.tautan_bukti ? `<li>${tautan(r.tautan_bukti, 'Bukti (lama)')}</li>` : ''}
      ${(bukti.get(r.id) || []).map(b => `<li>${tautan(b.url, b.judul || namaJenis(b.jenis))}</li>`).join('') || (r.tautan_bukti ? '' : '<li>Tanpa bukti</li>')}</ul>`;

    if (!tunggu.length) { boxIsian.className = 'kosong'; boxIsian.textContent = 'Tidak ada prestasi yang menunggu.'; }
    else {
      boxIsian.className = '';
      boxIsian.innerHTML = tunggu.map(r => {
        const m = cariMirip(r, semua.filter(x => x.tahun === r.tahun && x.status !== 'ditolak'));
        return `<div class="rec" data-s="diajukan"><div class="spine"></div><div class="rec-b">
          <div class="rec-j">${esc(r.nama_kegiatan)}</div>${htmlMeta(metaPrestasi(r))}${htmlOrang(r, dosen)}
          ${m.length ? htmlMeta([`Mungkin ganda dengan: ${m.map(x => x.nama_kegiatan).join('; ')}`]) : ''}
          ${tautanPrestasi(r)}
          ${daftarBukti(r)}</div><div class="rec-a">
          <button class="btn sm" data-vp="${r.id}">Verifikasi</button>
          <button class="btn danger sm" data-tp="${r.id}">Tolak</button></div></div>`;
      }).join('');
    }

    if (!aj?.length) { boxAjuan.className = 'kosong'; boxAjuan.textContent = 'Tidak ada ajuan.'; }
    else {
      boxAjuan.className = '';
      boxAjuan.innerHTML = aj.map(a => {
        const r = per.get(a.prestasi_id) || {};
        const beda = a.hapus ? '<div class="rec-m"><span>Ajuan: hapus prestasi ini</span></div>'
          : Object.keys(a.data || {}).map(k => `<div class="rec-m"><span>${esc(LABEL[k] || k)}: ${esc(tampilKolom(k, a.lama?.[k]))
            } → ${esc(tampilKolom(k, a.data[k]))}</span></div>`).join('');
        return `<div class="rec" data-s="diajukan"><div class="spine"></div><div class="rec-b">
          <div class="rec-j">${esc(r.nama_kegiatan)}</div>${htmlMeta(metaPrestasi(r))}${beda}
          ${htmlMeta([`Alasan: ${a.alasan}`])}${daftarBukti(r)}</div><div class="rec-a">
          <button class="btn sm" data-sa="${a.id}" data-prestasi="${a.prestasi_id}" data-hapus-ajuan="${a.hapus ? 1 : ''}">Setujui</button>
          <button class="btn danger sm" data-ta="${a.id}">Tolak</button></div></div>`;
      }).join('');
    }

    boxIsian.querySelectorAll('[data-vp]').forEach(b => b.onclick = async () => {
      const r = per.get(+b.dataset.vp);
      if (!r.tautan_bukti && !(bukti.get(r.id) || []).some(x => x.jenis === 'sertifikat')
          && !confirm('Belum ada sertifikat atau piagam. Tetap verifikasi?')) return;
      const { error: e } = await sb.from(TABEL).update({ status: 'terverifikasi', catatan: null }).eq('id', r.id);
      if (e) alert(e.message);
      muat();
    });
    boxIsian.querySelectorAll('[data-tp]').forEach(b => b.onclick = async () => {
      const c = prompt('Alasan penolakan (dilihat dosen):');
      if (!c?.trim()) return;
      const { error: e } = await sb.from(TABEL).update({ status: 'ditolak', catatan: c.trim() }).eq('id', +b.dataset.tp);
      if (e) alert(e.message);
      muat();
    });
    boxAjuan.querySelectorAll('[data-sa]').forEach(b => b.onclick = async () => {
      const hapus = !!b.dataset.hapusAjuan, id = +b.dataset.prestasi;
      const urls = hapus ? (bukti.get(id) || []).map(x => x.url).concat(per.get(id)?.tautan_bukti || []).filter(Boolean) : [];
      if (hapus && !confirm(`Hapus prestasi ini?${urls.length ? ` ${urls.length} berkas buktinya dipindah ke Sampah. ${PESAN_SAMPAH}` : ''}`)) return;
      try { if (urls.length) await buangSemua(sb, urls); }
      catch (e) { return alert('Gagal membuang berkas: ' + (e.message || e)); }
      const { error: e } = await sb.rpc('setujui_ajuan_prestasi', { a: +b.dataset.sa });
      if (e) alert(e.message);
      muat();
    });
    boxAjuan.querySelectorAll('[data-ta]').forEach(b => b.onclick = async () => {
      const c = prompt('Alasan penolakan (dilihat pengaju):');
      if (!c?.trim()) return;
      const { error: e } = await sb.from('ajuan_prestasi').update({ status: 'ditolak', catatan_admin: c.trim() }).eq('id', +b.dataset.ta);
      if (e) alert(e.message);
      muat();
    });
  }
  await muat();
}
