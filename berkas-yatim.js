/* =====================================================================
   BERKAS TAK TERPAKAI — berkas di folder bukti prodi yang tidak dirujuk catatan
   mana pun di situs (keputusan pemilik 2026-11-03). Terjadi bila dosen
   menghapus bukti/karyanya sendiri (dosen tidak bisa membuang berkas
   Drive) atau dari karya lama. Admin memilih, lalu berkas dipindah ke
   Sampah Drive (hapus-berkas.js, bisa dipulihkan 30 hari).

   Rujukan dikumpulkan dari SEMUA tabel yang menyimpan tautan bukti; satu
   tabel gagal dibaca = berhenti, karena daftar rujukan yang tidak lengkap
   membuat berkas yang masih dipakai tampak tak terpakai. Berkas dianggap dirujuk
   bila id-nya ATAU salah satu folder induknya disebut (bukti lama berupa
   tautan folder). Dilewati: berkas < 24 jam (catatannya mungkin belum
   tersimpan) dan folder _arsip (dilewati Apps Script).

   Pemakaian: pasangYatim(sb, elemenWadah)
   ===================================================================== */

import { buangBerkas, PESAN_SAMPAH } from './hapus-berkas.js?v=2026-11-06-f488b4';

// Tabel yang bisa memuat tautan Drive. Tambahkan tabel baru yang
// menyimpan tautan bukti di sini, kalau tidak berkasnya tampak tak terpakai.
const TABEL_RUJUKAN = ['karya', 'karya_bukti', 'butir_bukti', 'dokumen', 'lkps_bukti', 'pengaturan',
  'lkps_mahasiswa_ta', 'lkps_kohort_lulusan', 'lkps_tracer_lulusan', 'lkps_kerjasama', 'lkps_bkd',
  'lkps_prestasi_mahasiswa', 'lkps_publikasi_mahasiswa', 'lkps_luaran_mahasiswa'];
const BARU_MS = 24 * 3600 * 1000;
const POLA_ID = /(?:\/d\/|[?&]id=|\/folders\/)([A-Za-z0-9_-]{20,})/g;

const esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function semuaBaris(sb, tabel){
  const out = [];
  for (let awal = 0; ; awal += 1000) {
    // Urutan tetap supaya halaman 1000 baris tidak melompati/menggandakan
    // baris (kolom kunci sama dengan supabase.tables di config.yaml).
    const { data, error } = await sb.from(tabel).select('*')
      .order(tabel === 'pengaturan' ? 'kunci' : 'id').range(awal, awal + 999);
    if (error) throw new Error(`${tabel}: ${error.message}`);
    out.push(...(data || []));
    if (!data || data.length < 1000) return out;
  }
}

async function kumpulkanRujukan(sb){
  const ids = new Set();
  for (const t of TABEL_RUJUKAN) {
    const teks = JSON.stringify(await semuaBaris(sb, t));
    for (const m of teks.matchAll(POLA_ID)) ids.add(m[1]);
  }
  return ids;
}

async function daftarDrive(sb){
  const U = String(window.UPLOAD_URL || '').trim();
  if (!U) throw new Error('UPLOAD_URL belum diisi di config.js.');
  const { data: { session } } = await sb.auth.getSession();
  if (!session) throw new Error('Sesi login habis. Muat ulang halaman lalu masuk lagi.');
  const res = await fetch(U, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ token: session.access_token, kind: 'daftar_berkas' }) });
  const out = await res.json();
  if (!out.ok) {
    if (/Jenis unggahan tidak dikenal/.test(out.error || ''))
      throw new Error('Apps Script di akun prodi belum diperbarui untuk alat ini (apps-script/README.md, "Memperbarui kode").');
    throw new Error(out.error || 'Daftar berkas gagal dibaca.');
  }
  return out.berkas || [];
}

const kb = n => n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';

export function pasangYatim(sb, wadah){
  if (!wadah) return;
  wadah.innerHTML = `<p class="b-ket">Berkas di folder bukti prodi yang tidak dirujuk catatan mana pun di
    situs, misalnya karena dosen menghapus bukti atau karyanya sendiri. Periksa dulu, lalu pilih yang
    dibuang. ${PESAN_SAMPAH}</p>
    <button type="button" id="yatim-cari">Cari berkas tak terpakai</button>
    <span class="b-ket" id="yatim-status"></span><div id="yatim-hasil"></div>`;
  const status = wadah.querySelector('#yatim-status');
  const hasil = wadah.querySelector('#yatim-hasil');

  wadah.querySelector('#yatim-cari').onclick = async e => {
    const tombol = e.currentTarget;
    tombol.disabled = true; hasil.innerHTML = '';
    status.textContent = 'Membaca rujukan di situs dan isi folder Drive…';
    try {
      const [rujukan, berkas] = await Promise.all([kumpulkanRujukan(sb), daftarDrive(sb)]);
      const kini = Date.now();
      const dirujuk = f => rujukan.has(f.id) || (f.induk || []).some(i => rujukan.has(i));
      const baru = berkas.filter(f => !dirujuk(f) && kini - Date.parse(f.dibuat) < BARU_MS);
      const yatim = berkas.filter(f => !dirujuk(f) && kini - Date.parse(f.dibuat) >= BARU_MS)
        .sort((a, b) => (a.jalur + a.nama).localeCompare(b.jalur + b.nama));
      status.textContent = `${berkas.length} berkas di Drive; ${berkas.length - yatim.length - baru.length} dirujuk;`
        + ` ${baru.length} baru (< 24 jam, dilewati); ${yatim.length} tak terpakai.`;
      if (!yatim.length) { hasil.innerHTML = '<p class="b-ket">Tidak ada berkas tak terpakai.</p>'; return; }
      hasil.innerHTML = `<div class="gulir"><table class="dok-t"><thead><tr><th><input type="checkbox" id="yatim-semua"></th>
        <th>Folder</th><th>Berkas</th><th>Ukuran</th><th>Diunggah</th></tr></thead><tbody>${yatim.map((f, i) => `
        <tr><td><input type="checkbox" data-yatim="${i}"></td><td>${esc(f.jalur || '/')}</td>
        <td><a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.nama)}</a></td>
        <td>${kb(f.ukuran)}</td><td>${esc(String(f.dibuat).slice(0, 10))}</td></tr>`).join('')}</tbody></table></div>
        <button type="button" id="yatim-buang">Buang terpilih ke Sampah</button>`;
      const kotak = () => [...hasil.querySelectorAll('[data-yatim]')];
      hasil.querySelector('#yatim-semua').onchange = ev => kotak().forEach(k => { k.checked = ev.target.checked; });
      hasil.querySelector('#yatim-buang').onclick = async ev => {
        const pilih = kotak().filter(k => k.checked).map(k => yatim[+k.dataset.yatim]);
        if (!pilih.length) return;
        if (!confirm(`Buang ${pilih.length} berkas ke Sampah Drive? ${PESAN_SAMPAH}`)) return;
        ev.currentTarget.disabled = true;
        let n = 0;
        try {
          for (const f of pilih) {
            status.textContent = `Membuang ${n + 1} dari ${pilih.length}: ${f.nama}…`;
            await buangBerkas(sb, f.url);
            n++;
            kotak().find(k => yatim[+k.dataset.yatim] === f).closest('tr').remove();
          }
          status.textContent = `${n} berkas dipindah ke Sampah Drive.`;
        } catch (err) {
          status.textContent = `${n} berkas dibuang; berhenti: ${err.message || err}`;
          ev.currentTarget.disabled = false;
        }
      };
    } catch (err) {
      status.textContent = 'Berhenti: ' + (err.message || err);
    } finally {
      tombol.disabled = false;
    }
  };
}
