// BKD diisi DTPS dari Laporan Kinerja Dosen (LKD) SISTER (pemilik 2026-11-06,
// supabase/39-patch-bkd-dosen.sql). Dipakai input.html: tab BKD saya
// (pasangBkd) dan verifikasi.html (pasangVerifikasiBkd). Dosen lain diisi admin
// di Data prodi. Berkas LKD privat: lihat unggahLKD dan bukaLKD.

import { ubahan } from './prestasi.js?v=2026-11-11-908c00';
import { htmlSaran } from './saran-bukti.js?v=2026-11-11-908c00';
import { htmlTautanButir, tsDariTA } from './tautan-butir.js?v=2026-11-11-908c00';

// Bagian C LKD. Pendidikan dipecah per PS untuk Tabel 4.c; SISTER tidak
// punya kolom prodi, jadi dosen memilahnya menurut kode kelas.
export const KOLOM_BKD = [['sks_pendidikan', 'Pendidikan di PS ini'], ['sks_ps_lain_dalam', 'Pendidikan di PS lain, dalam PT'],
  ['sks_ps_lain_luar', 'Pendidikan di PS lain, luar PT'], ['sks_penelitian', 'Penelitian'], ['sks_pkm', 'Pengabdian'],
  ['sks_penunjang', 'Penunjang']];
export const KOLOM_LEBIH = [['sks_lebih_pendidikan', 'Pendidikan'], ['sks_lebih_penelitian', 'Penelitian'],
  ['sks_lebih_pkm', 'Pengabdian'], ['sks_lebih_penunjang', 'Penunjang']];
// Yang diketik dosen: total pendidikan dari LKD, lalu bagian PS lain; PS ini
// = total dikurangi PS lain (pemilik 2026-11-06). Database tetap menyimpan PS ini.
export const KOLOM_ISIAN = [['pendidikan_total', 'Pendidikan: total (baris Pelaksanaan Pendidikan)'],
  ['sks_ps_lain_dalam', 'Dari total itu: PS lain, dalam PT'], ['sks_ps_lain_luar', 'Dari total itu: PS lain, luar PT'],
  ['sks_penelitian', 'Penelitian'], ['sks_pkm', 'Pengabdian'], ['sks_penunjang', 'Penunjang']];
export const SKS_MIN = 12, SKS_MAKS = 16;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const angka = v => Math.round((+v || 0) * 10000) / 10000;
const tampilSks = v => String(angka(v)).replace('.', ',');

// ---------- logika murni ----------

export const pendidikanTotal = r => angka((+r.sks_pendidikan || 0) + (+r.sks_ps_lain_dalam || 0) + (+r.sks_ps_lain_luar || 0));
export const pendidikanPS = (total, dalam, luar) => total == null ? null : angka(total - (dalam || 0) - (luar || 0));
export const totalBkd = r => angka(KOLOM_BKD.reduce((a, [k]) => a + (+r[k] || 0), 0));
export const totalLebih = r => angka(KOLOM_LEBIH.reduce((a, [k]) => a + (+r[k] || 0), 0));

// Tahun akademik TS berjalan: September ke atas masuk TS berikutnya.
export function taSekarang(d = new Date()){
  const akhir = d.getFullYear() + (d.getMonth() >= 8 ? 1 : 0);
  return `${akhir - 1}/${akhir}`;
}

// Daftar galat; baru = isian baru, yang wajib melampirkan LKD.
export function periksaBkd(isi, adaBerkas, baru){
  const g = [], m = String(isi.tahun_akademik || '').match(/^(\d{4})\/(\d{4})$/);
  if (!m || +m[2] !== +m[1] + 1) g.push('Tahun akademik ditulis seperti 2025/2026');
  if (!['ganjil', 'genap'].includes(isi.semester)) g.push('Semester wajib dipilih');
  if (isi.sks_pendidikan < 0) g.push('SKS PS lain melebihi total pendidikan');
  const semua = [...KOLOM_BKD, ...KOLOM_LEBIH].filter(([k]) => k !== 'sks_pendidikan');
  if (semua.some(([k]) => isi[k] != null && !(Number.isFinite(isi[k]) && isi[k] >= 0))) g.push('SKS harus angka 0 atau lebih');
  if (!(totalBkd(isi) > 0)) g.push('Isi SKS BKD dari bagian C LKD');
  if (baru && !adaBerkas) g.push('Lampirkan PDF LKD semester ini');
  return g;
}
export const diLuarRentang = isi => totalBkd(isi) < SKS_MIN || totalBkd(isi) > SKS_MAKS;
export const ubahLangsung = r => r.verifikasi !== 'terverifikasi';

// ---------- berkas LKD (privat) ----------

const keB64 = f => new Promise((ok, gagal) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result).split(',')[1]);
  r.onerror = () => gagal(r.error);
  r.readAsDataURL(f);
});

// Disimpan tanpa tautan publik (Code.gs kind 'bkd'). atasNama: admin untuk dosen lain.
export async function unggahLKD(sb, f, ta, semester, atasNama){
  if (!window.UPLOAD_URL) throw new Error('Unggah berkas belum disiapkan.');
  const maxMb = Number(window.UPLOAD_MAX_MB) || 0;
  if (!/\.pdf$/i.test(f.name)) throw new Error('LKD harus berkas PDF.');
  if (maxMb && f.size > maxMb * 1024 * 1024) throw new Error(`Berkas lebih dari ${maxMb} MB.`);
  const { data: { session } } = await sb.auth.getSession();
  if (!session) throw new Error('Sesi login habis. Muat ulang halaman.');
  const res = await fetch(window.UPLOAD_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ token: session.access_token, kind: 'bkd', tahun_akademik: ta, semester,
      atas_nama: atasNama || '', filename: f.name, data: await keB64(f) }) });
  const out = await res.json();
  if (!out.ok) throw new Error(/Jenis unggahan tidak dikenal/.test(out.error || '')
    ? 'LKD belum bisa diunggah: Apps Script belum diperbarui. Minta admin men-deploy ulang Code.gs.' : out.error || 'Unggah gagal.');
  return out.url;
}

// LKD yang sudah tidak dipakai (diganti, ajuan ditolak/dibatalkan, simpan gagal) dibuang
// ke Sampah Drive (Code.gs kind 'buang_bkd', pemilik 2026-11-11). Galat diabaikan:
// berkas yang tertinggal masih bisa dibersihkan lewat alat berkas tak terpakai.
export async function buangLKD(sb, url){
  if (!url || !window.UPLOAD_URL) return;
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return;
    await fetch(window.UPLOAD_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ token: session.access_token, kind: 'buang_bkd', url }) });
  } catch (e) { /* dibiarkan */ }
}

// Berkas tidak punya tautan publik. lkd.html membukanya untuk admin dan pemilik yang
// login, dan menyediakan tautan 2 bulan untuk laporan SISTER.
export function bukaLKD(sb, url){
  const id = (String(url).match(/\/d\/([A-Za-z0-9_-]{20,})/) || [])[1];
  if (!id) return alert('Tautan LKD tidak dikenali.');
  window.open(`lkd.html?f=${id}`, '_blank', 'noopener');
}

const htmlMeta = xs => `<div class="rec-m">${xs.map(x => `<span>${esc(x)}</span>`).join('')}</div>`;
const metaBkd = r => [`SKS BKD ${tampilSks(totalBkd(r))}`, `SKS Lebih ${tampilSks(totalLebih(r))}`];
const rincian = r => htmlMeta([`Pendidikan total: ${tampilSks(pendidikanTotal(r))}`,
  ...KOLOM_BKD.filter(([k]) => +r[k]).map(([k, l]) => `${l}: ${tampilSks(r[k])}`)]);
const tombolLKD = r => r.bukti_url ? `<button class="btn ghost sm" data-lkd="${esc(r.bukti_url)}">Buka LKD</button>` : '';

// Butir 30 memakai BKD terverifikasi DTPS pada TS = tahun akademiknya
// (rbk_prodi, 39-patch-bkd-dosen.sql); Tabel 4.c memuat juga dosen non-DTPS.
export function tautanBkd(r, dtps = true){
  if (r.verifikasi === 'ditolak') return '';
  const ts = tsDariTA(r.tahun_akademik), ok = r.verifikasi === 'terverifikasi';
  if (!dtps) return '<div class="rec-m"><span>Tabel 4.c saja (bukan DTPS, tidak masuk butir 30)</span></div>';
  return `<div class="rec-m">${htmlTautanButir(['30'], ts, ok ? 'Dipakai di' : 'Masuk setelah diverifikasi:')}</div>`;
}

// ---------- tab dosen ----------

export async function pasangBkd(wadah, { sb, saya }){
  let SUNTING = null, BARIS = [], AJUAN = new Map();
  const $ = id => wadah.querySelector('#' + id);
  const kotak = ([k, l]) => `<div class="fld"><label for="bk_${k}">${esc(l)}</label>
    <input id="bk_${k}" type="number" step="any" min="0"></div>`;

  wadah.innerHTML = `<div class="panel"><h2 id="bk_judul">BKD saya</h2>
    <p class="hint">Satu entri per semester, disalin dari bagian C Laporan Kinerja Dosen (LKD) SISTER. Dipakai untuk
    Tabel 4.c dan butir 30 setelah diverifikasi admin. Data ini tidak dipublikasikan.
    ${htmlTautanButir(['30'], null, 'Lihat')}</p>
    ${htmlSaran('bkd')}
    <form id="bk_form" novalidate><div class="grid">
      <div class="fld"><label for="bk_ta">Tahun akademik <span class="req">*</span></label>
        <input id="bk_ta" type="text" placeholder="2025/2026"></div>
      <div class="fld"><label for="bk_semester">Semester <span class="req">*</span></label>
        <select id="bk_semester"><option value="">— pilih —</option><option value="ganjil">Ganjil</option>
          <option value="genap">Genap</option></select></div>
      <div class="fld full"><label>SKS BKD <span class="req">*</span></label>
        <span class="sub">Salin baris Pelaksanaan Pendidikan apa adanya, lalu isi bagian PS lain menurut kode kelas.
        Pendidikan di PS ini dihitung otomatis: total dikurangi PS lain.</span></div>
      ${KOLOM_ISIAN.map(kotak).join('')}
      <div class="fld full"><label>SKS Lebih</label>
        <span class="sub">Kolom SKS Lebih di LKD. Dicatat saja; tidak masuk Tabel 4.c.</span></div>
      ${KOLOM_LEBIH.map(kotak).join('')}
      <div class="fld full"><label for="bk_berkas">PDF LKD <span class="req" id="bk_wajib">*</span></label>
        <input id="bk_berkas" type="file" accept=".pdf">
        <span class="sub">Berkas privat: hanya bisa dibuka Anda dan admin. Untuk laporan SISTER, tekan Buka LKD lalu buat tautan 2 bulan.</span></div>
    </div>
    <div class="aksi"><button class="btn" type="submit" id="bk_simpan">Simpan</button>
      <button class="btn ghost" type="button" id="bk_batal" hidden>Batal</button>
      <span class="msg" id="bk_msg"></span><span class="msg" id="bk_total"></span></div></form></div>
    <div class="panel"><h2>Riwayat BKD saya</h2><div id="bk_daftar" class="kosong">Memuat…</div></div>`;

  const tulis = (cls, t) => { const m = $('bk_msg'); m.className = 'msg' + (cls ? ' ' + cls : ''); m.textContent = t; };
  const baca = () => {
    const isi = { tahun_akademik: $('bk_ta').value.trim(), semester: $('bk_semester').value };
    [...KOLOM_ISIAN, ...KOLOM_LEBIH].forEach(([k]) => { const v = $('bk_' + k).value.trim(); isi[k] = v === '' ? null : Number(v.replace(',', '.')); });
    isi.sks_pendidikan = pendidikanPS(isi.pendidikan_total, isi.sks_ps_lain_dalam, isi.sks_ps_lain_luar);
    delete isi.pendidikan_total;
    return isi;
  };
  const hitung = () => { const i = baca(); $('bk_total').textContent = `Pendidikan di PS ini ${tampilSks(i.sks_pendidikan)} · Total SKS BKD ${tampilSks(totalBkd(i))}`
    + (totalBkd(i) && diLuarRentang(i) ? ` (di luar ${SKS_MIN}–${SKS_MAKS})` : ''); };
  const isiForm = r => {
    SUNTING = r || null;
    $('bk_judul').textContent = r ? (ubahLangsung(r) ? 'Ubah BKD' : 'Ajukan perubahan BKD') : 'BKD saya';
    $('bk_batal').hidden = !r; $('bk_wajib').hidden = !!r; $('bk_berkas').value = '';
    $('bk_simpan').textContent = r && !ubahLangsung(r) ? 'Kirim ajuan' : 'Simpan';
    $('bk_ta').value = r?.tahun_akademik ?? taSekarang(); $('bk_ta').disabled = !!r;
    $('bk_semester').value = r?.semester ?? ''; $('bk_semester').disabled = !!r;
    [...KOLOM_ISIAN.slice(1), ...KOLOM_LEBIH].forEach(([k]) => { $('bk_' + k).value = r?.[k] ?? ''; });
    $('bk_pendidikan_total').value = r ? pendidikanTotal(r) : '';
    hitung();
  };

  async function simpan(){
    const isi = baca(), r = SUNTING, f = $('bk_berkas').files[0];
    const galat = periksaBkd(isi, !!f, !r);
    if (galat.length) return tulis('err', galat.join(' · '));
    if (diLuarRentang(isi) && !confirm(`Total SKS BKD ${tampilSks(totalBkd(isi))} di luar ${SKS_MIN}–${SKS_MAKS}. `
      + 'Pastikan sama dengan Total Kinerja di LKD. Tetap simpan?')) return;
    $('bk_simpan').disabled = true;
    let url = null, dipakai = false;
    try {
      if (f) tulis('', 'Mengunggah LKD…');
      url = f ? await unggahLKD(sb, f, isi.tahun_akademik, isi.semester) : null;
      const sks = Object.fromEntries([...KOLOM_BKD, ...KOLOM_LEBIH].map(([k]) => [k, isi[k]]));
      if (url) sks.bukti_url = url;
      if (!r) {
        const pend = String(saya.pendidikan || '').toLowerCase();
        const { error } = await sb.from('lkps_bkd').insert({ ...sks, nidn: saya.nidn, tahun_akademik: isi.tahun_akademik,
          semester: isi.semester, status: 'dtps', jabatan_akademik: saya.jabatan || null,
          pendidikan_tertinggi: ['s2', 's3'].includes(pend) ? pend : null,
          verifikasi: 'diajukan', dilaporkan_oleh: saya.id, oleh: saya.email });
        if (error) throw error;
        dipakai = true;
        isiForm(null); tulis('ok', 'Tersimpan dan LKD terunggah, menunggu verifikasi admin.');
      } else if (ubahLangsung(r)) {
        const { error } = await sb.from('lkps_bkd').update({ ...sks, verifikasi: 'diajukan', catatan: null, oleh: saya.email,
          diperbarui: new Date().toISOString() }).eq('id', r.id);
        if (error) throw error;
        dipakai = true;
        // LKD lama diganti yang baru: berkas lama dibuang.
        if (url && r.bukti_url && r.bukti_url !== url) await buangLKD(sb, r.bukti_url);
        isiForm(null); tulis('ok', 'Perubahan tersimpan, menunggu verifikasi admin.');
      } else {
        const { data, lama } = ubahan(r, sks);
        if (!Object.keys(data).length) return tulis('err', 'Tidak ada yang berubah.');
        const alasan = prompt('Alasan perubahan:');
        if (!alasan?.trim()) return tulis('err', 'Alasan wajib diisi.');
        const { error } = await sb.from('ajuan_bkd').insert({ bkd_id: r.id, data, lama, alasan: alasan.trim() });
        if (error) throw error;
        dipakai = true;   // LKD lama dibuang saat ajuan disetujui
        isiForm(null); tulis('ok', 'Ajuan terkirim; admin memutuskannya di halaman Verifikasi.');
      }
      await muat();
    } catch (e) {
      if (url && !dipakai) await buangLKD(sb, url);   // unggahan yang tidak jadi dipakai
      const t = e.message || String(e);
      tulis('err', /ajuan_bkd_menunggu/.test(t) ? 'Masih ada ajuan yang menunggu untuk semester ini.'
        : /duplicate|unique/i.test(t) ? 'Semester ini sudah terisi. Ubah baris yang ada di riwayat.' : 'Gagal: ' + t);
    } finally { $('bk_simpan').disabled = false; }
  }

  function htmlBaris(r){
    const a = AJUAN.get(r.id), menunggu = a?.status === 'menunggu';
    return `<div class="rec" data-s="${r.verifikasi === 'diajukan' ? 'diajukan' : esc(r.verifikasi)}"><div class="spine"></div><div class="rec-b">
      <div class="rec-j">${esc(r.tahun_akademik)} ${esc(r.semester)}</div>${htmlMeta(metaBkd(r))}${rincian(r)}
      ${tautanBkd(r)}
      ${r.catatan ? htmlMeta([`Catatan admin: ${r.catatan}`]) : ''}
      ${a?.status === 'ditolak' ? `<div class="rec-m"><span>Ajuan ditolak: ${esc(a.catatan_admin || '-')}</span>
        <button class="btn ghost sm" data-batal-ajuan="${a.id}">Tutup</button></div>` : ''}
      </div><div class="rec-a"><span class="tag">${esc(r.verifikasi)}</span>${tombolLKD(r) || '<span class="tag">tanpa LKD</span>'}
      ${menunggu ? `<span class="tag">ajuan menunggu</span><button class="btn ghost sm" data-batal-ajuan="${a.id}">Batalkan ajuan</button>`
        : `<button class="btn ghost sm" data-ubah="${r.id}">${ubahLangsung(r) ? 'Ubah' : 'Ajukan ubah'}</button>
           ${ubahLangsung(r) ? `<button class="btn danger sm" data-hapus="${r.id}">Hapus</button>` : ''}`}</div></div>`;
  }

  async function muat(){
    const box = $('bk_daftar');
    const { data, error } = await sb.from('lkps_bkd').select('*').eq('nidn', saya.nidn)
      .order('tahun_akademik', { ascending: false }).order('semester');
    if (error) { box.className = 'kosong'; box.textContent = 'Tabel BKD belum bisa dibaca (' + error.message
      + '). Jalankan supabase/39-patch-bkd-dosen.sql.'; return; }
    BARIS = data || [];
    if (!BARIS.length) { box.className = 'kosong'; box.textContent = 'Belum ada BKD.'; return; }
    const { data: aj } = await sb.from('ajuan_bkd').select('*').eq('oleh', saya.id).in('bkd_id', BARIS.map(r => r.id));
    AJUAN = new Map((aj || []).map(a => [a.bkd_id, a]));
    box.className = ''; box.innerHTML = BARIS.map(htmlBaris).join('');
  }

  wadah.addEventListener('input', e => { if (e.target.type === 'number') hitung(); });
  wadah.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    const d = b.dataset;
    if (b.id === 'bk_batal') { isiForm(null); return tulis('', ''); }
    if (d.lkd) return bukaLKD(sb, d.lkd);
    if (d.ubah) { isiForm(BARIS.find(r => r.id === +d.ubah)); tulis('', ''); return wadah.scrollIntoView({ behavior: 'smooth' }); }
    if (d.batalAjuan) {
      const a = [...AJUAN.values()].find(x => x.id === +d.batalAjuan);
      const { error } = await sb.from('ajuan_bkd').delete().eq('id', +d.batalAjuan);
      if (error) alert(error.message);
      else if (a?.data?.bukti_url && a.data.bukti_url !== a.lama?.bukti_url) await buangLKD(sb, a.data.bukti_url);
      return muat();
    }
    if (d.hapus) {
      if (!confirm('Hapus BKD semester ini?')) return;
      const lama = BARIS.find(r => r.id === +d.hapus);
      const { error } = await sb.from('lkps_bkd').delete().eq('id', +d.hapus);
      if (error) alert(error.message);
      else if (lama?.bukti_url) await buangLKD(sb, lama.bukti_url);
      return muat();
    }
  });
  $('bk_form').onsubmit = e => { e.preventDefault(); simpan(); };
  isiForm(null);
  await muat();
}

// ---------- verifikasi.html, tab BKD (admin) ----------

export async function pasangVerifikasiBkd(boxIsian, boxAjuan, { sb, dosen }){
  const nama = n => (dosen.find(d => d.nidn === n) || {}).nama || n;
  const LABEL = Object.fromEntries([...KOLOM_BKD, ...KOLOM_LEBIH.map(([k, l]) => [k, 'Lebih: ' + l]), ['bukti_url', 'Berkas LKD']]);
  const nilai = (k, v) => k === 'bukti_url' ? (v ? 'ada' : 'tidak ada') : v == null ? '—' : tampilSks(v);

  async function muat(){
    const [{ data, error }, { data: aj, error: eA }] = await Promise.all([
      sb.from('lkps_bkd').select('*').order('tahun_akademik', { ascending: false }),
      sb.from('ajuan_bkd').select('*').eq('status', 'menunggu').order('dibuat_pada')]);
    if (error || eA) {
      boxIsian.className = boxAjuan.className = 'kosong';
      boxIsian.textContent = boxAjuan.textContent = 'Belum bisa dibaca (' + (error || eA).message
        + '). Jalankan supabase/39-patch-bkd-dosen.sql.';
      return;
    }
    const semua = data || [], tunggu = semua.filter(r => r.verifikasi === 'diajukan'), per = new Map(semua.map(r => [r.id, r]));
    if (!tunggu.length) { boxIsian.className = 'kosong'; boxIsian.textContent = 'Tidak ada BKD yang menunggu.'; }
    else {
      boxIsian.className = '';
      boxIsian.innerHTML = tunggu.map(r => `<div class="rec" data-s="diajukan"><div class="spine"></div><div class="rec-b">
        <div class="rec-j">${esc(nama(r.nidn))}: ${esc(r.tahun_akademik)} ${esc(r.semester)}</div>${htmlMeta(metaBkd(r))}${rincian(r)}
        ${diLuarRentang(r) ? htmlMeta([`Total di luar ${SKS_MIN}–${SKS_MAKS} SKS`]) : ''}
        ${tautanBkd(r, (dosen.find(d => d.nidn === r.nidn) || {}).dtps !== false)}
        </div><div class="rec-a">${tombolLKD(r) || '<span class="tag">tanpa LKD</span>'}
        <button class="btn sm" data-vb="${r.id}">Verifikasi</button>
        <button class="btn danger sm" data-tb="${r.id}">Tolak</button></div></div>`).join('');
    }
    if (!aj?.length) { boxAjuan.className = 'kosong'; boxAjuan.textContent = 'Tidak ada ajuan.'; }
    else {
      boxAjuan.className = '';
      boxAjuan.innerHTML = aj.map(a => {
        const r = per.get(a.bkd_id) || {};
        return `<div class="rec" data-s="diajukan"><div class="spine"></div><div class="rec-b">
          <div class="rec-j">${esc(nama(r.nidn))}: ${esc(r.tahun_akademik)} ${esc(r.semester)}</div>
          ${Object.keys(a.data || {}).map(k => htmlMeta([`${LABEL[k] || k}: ${nilai(k, a.lama?.[k])} → ${nilai(k, a.data[k])}`])).join('')}
          ${htmlMeta([`Alasan: ${a.alasan}`])}</div><div class="rec-a">${tombolLKD(a.data?.bukti_url ? a.data : r)}
          <button class="btn sm" data-sa="${a.id}">Setujui</button>
          <button class="btn danger sm" data-ta="${a.id}">Tolak</button></div></div>`;
      }).join('');
    }
    [boxIsian, boxAjuan].forEach(x => x.querySelectorAll('[data-lkd]').forEach(b => { b.onclick = () => bukaLKD(sb, b.dataset.lkd); }));
    boxIsian.querySelectorAll('[data-vb]').forEach(b => { b.onclick = async () => {
      const { error: e } = await sb.from('lkps_bkd').update({ verifikasi: 'terverifikasi', catatan: null }).eq('id', +b.dataset.vb);
      if (e) alert(e.message);
      muat();
    }; });
    boxIsian.querySelectorAll('[data-tb]').forEach(b => { b.onclick = async () => {
      const c = prompt('Alasan penolakan (dilihat dosen):');
      if (!c?.trim()) return;
      const { error: e } = await sb.from('lkps_bkd').update({ verifikasi: 'ditolak', catatan: c.trim() }).eq('id', +b.dataset.tb);
      if (e) alert(e.message);
      muat();
    }; });
    boxAjuan.querySelectorAll('[data-sa]').forEach(b => { b.onclick = async () => {
      const a = (aj || []).find(x => x.id === +b.dataset.sa);
      const { error: e } = await sb.rpc('setujui_ajuan_bkd', { a: +b.dataset.sa });
      if (e) alert(e.message);
      // LKD baru dipakai: yang lama dibuang.
      else if (a?.data?.bukti_url && a.lama?.bukti_url && a.data.bukti_url !== a.lama.bukti_url) await buangLKD(sb, a.lama.bukti_url);
      muat();
    }; });
    boxAjuan.querySelectorAll('[data-ta]').forEach(b => { b.onclick = async () => {
      const c = prompt('Alasan penolakan (dilihat pengaju):');
      if (!c?.trim()) return;
      const a = (aj || []).find(x => x.id === +b.dataset.ta);
      const { error: e } = await sb.from('ajuan_bkd').update({ status: 'ditolak', catatan_admin: c.trim() }).eq('id', +b.dataset.ta);
      if (e) alert(e.message);
      // LKD yang diajukan tidak dipakai: dibuang.
      else if (a?.data?.bukti_url && a.data.bukti_url !== a.lama?.bukti_url) await buangLKD(sb, a.data.bukti_url);
      muat();
    }; });
  }
  await muat();
}
