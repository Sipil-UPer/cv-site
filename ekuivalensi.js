// Tabel ekuivalensi MK kurikulum lama -> baru (134-patch-ekuivalensi-sah.sql, pemilik 2026-11-21). Dipakai halaman ruang
// kerja ekuivalensi.html dan halaman publik ekuivalensi-kurikulum.html. Fungsi murni.
//
// Masukan = salinan padanan_salinan(): { kurikulum_lama, kurikulum_baru, mk_lama: [{kode, nama, sks, semester, sifat}],
// mk_baru: [...], padanan: [{kode_lama, kode_baru, model, tidak_berlanjut, catatan}] }.
// Model dibaca dari bentuk pasangan, bukan dari kolom model: MK lama dengan dua MK baru = 1:2, dua MK lama ke satu MK
// baru = 2:1 (Pedoman Penyusunan K26 Bab 4.1.5; dokumen kurikulum K26 Bab 7 Tabel 7-2 s.d. 7-4).

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const angka = v => v == null || v === '' ? '' : Number(v).toLocaleString('id-ID', { maximumFractionDigits: 2 });
// Nama dibandingkan tanpa beda tulis: angka Romawi = angka ("Mekanika Tanah I" = "Mekanika Tanah 1"), metoda = metode.
const ROMAWI = { i: '1', ii: '2', iii: '3', iv: '4' };
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ')
  .map(k => ROMAWI[k] || (k === 'metoda' ? 'metode' : k)).join(' ');

// Ketentuan per model (ringkasan Pedoman 4.1.5 dan Bab 7 dokumen kurikulum K26; bukan kutipan).
export const KETENTUAN = {
  '1:1': 'Sudah lulus MK lama: SKS dan nilainya diakui; tidak perlu mengambil MK baru. Belum lulus (MK wajib): ambil MK baru.',
  '1:2': 'Sudah lulus MK lama: SKS dan nilainya diakui; tidak wajib mengambil MK baru pecahannya. Belum lulus: ambil semua MK baru di kelompok ini.',
  '2:1': 'Lulus semua MK lama di kelompok ini: tidak wajib mengambil MK baru; semua SKS dan nilai diakui. Ada yang belum lulus: ambil MK baru; SKS MK lama yang lulus tetap diakui.',
  'm:n': 'Padanan banyak-ke-banyak: tanyakan Dosen Wali.',
  tidak: 'Tidak diselenggarakan lagi. SKS yang sudah lulus tetap diakui dalam beban studi.',
  baru: 'MK baru tanpa padanan lama: wajib ditempuh bila termasuk MK wajib yang belum dipenuhi.',
};
export const JUDUL_MODEL = { '1:1': 'Ekuivalensi 1:1', '1:2': 'Ekuivalensi 1:2 (satu MK menjadi dua)',
  '2:1': 'Ekuivalensi 2:1 (dua MK menjadi satu)', 'm:n': 'Ekuivalensi banyak-ke-banyak' };

/** Kelompokkan salinan. Hasil { kelompok: [{model, lama:[mk], baru:[mk], catatan:[..], berubah}], tidak: [{mk, catatan}],
 *  baru: [mk], belum: [mk lama tanpa baris], asing: [kode di padanan yang tidak ada di daftar MK], ringkas }. */
export function susunEkuivalensi(s = {}){
  const L = new Map((s.mk_lama || []).map(m => [m.kode, m])), B = new Map((s.mk_baru || []).map(m => [m.kode, m]));
  const pad = s.padanan || [], asing = [];
  const sisi = pad.filter(p => !p.tidak_berlanjut && p.kode_baru);
  // Komponen terhubung: simpul 'L:kode' dan 'B:kode'.
  const induk = new Map();
  const cari = x => { while (induk.get(x) !== x) { induk.set(x, induk.get(induk.get(x))); x = induk.get(x); } return x; };
  const satukan = (a, b) => { for (const x of [a, b]) if (!induk.has(x)) induk.set(x, x); induk.set(cari(a), cari(b)); };
  sisi.forEach(p => satukan('L:' + p.kode_lama, 'B:' + p.kode_baru));
  const grup = new Map();
  for (const p of sisi) {
    const g = cari('L:' + p.kode_lama);
    if (!grup.has(g)) grup.set(g, { lama: new Set(), baru: new Set(), catatan: new Set(), modelKolom: new Set() });
    const x = grup.get(g);
    x.lama.add(p.kode_lama); x.baru.add(p.kode_baru);
    if (p.catatan) x.catatan.add(p.catatan);
    if (p.model) x.modelKolom.add(p.model);
  }
  const mk = (peta, k) => { const m = peta.get(k); if (!m) asing.push(k); return m || { kode: k, nama: '(tidak ada di daftar MK)', sks: null }; };
  const kelompok = [...grup.values()].map(x => {
    const lama = [...x.lama].sort().map(k => mk(L, k)), baru = [...x.baru].sort().map(k => mk(B, k));
    const model = lama.length === 1 && baru.length === 1 ? '1:1' : lama.length === 1 ? '1:2' : baru.length === 1 ? '2:1' : 'm:n';
    const berubah = model !== '1:1' || norm(lama[0].nama) !== norm(baru[0].nama) || Number(lama[0].sks) !== Number(baru[0].sks);
    return { model, lama, baru, catatan: [...x.catatan], berubah, namaSama: x.modelKolom.has('nama sama') };
  });
  const urutSmt = m => Number(m.semester) || 99;
  kelompok.sort((a, b) => urutSmt(a.lama[0]) - urutSmt(b.lama[0]) || String(a.lama[0].kode).localeCompare(String(b.lama[0].kode)));
  const tidak = pad.filter(p => p.tidak_berlanjut).map(p => ({ mk: mk(L, p.kode_lama), catatan: p.catatan || '' }))
    .sort((a, b) => urutSmt(a.mk) - urutSmt(b.mk) || String(a.mk.kode).localeCompare(String(b.mk.kode)));
  const adaLama = new Set(pad.map(p => p.kode_lama)), adaBaru = new Set(sisi.map(p => p.kode_baru));
  const belum = (s.mk_lama || []).filter(m => !adaLama.has(m.kode));
  const baru = (s.mk_baru || []).filter(m => !adaBaru.has(m.kode))
    .sort((a, b) => urutSmt(a) - urutSmt(b) || String(a.kode).localeCompare(String(b.kode)));
  const n = m => kelompok.filter(k => k.model === m).length;
  return { kelompok, tidak, baru, belum, asing: [...new Set(asing)],
           ringkas: { '1:1': n('1:1'), '1:1 berubah': kelompok.filter(k => k.model === '1:1' && k.berubah).length,
                      '1:2': n('1:2'), '2:1': n('2:1'), 'm:n': n('m:n'), tidak: tidak.length, baru: baru.length, belum: belum.length } };
}

/** Cocok dengan kata cari (kode atau nama MK lama/baru). */
export const cocokCari = (k, q) => !q || [...(k.lama || [k.mk]), ...(k.baru || [])].filter(Boolean)
  .some(m => `${m.kode} ${m.nama}`.toLowerCase().includes(q));

const sel = m => `<span class="ek-kode">${esc(m.kode)}</span> ${esc(m.nama)} <span class="ek-sks">${angka(m.sks)} sks${m.sifat === 'pilihan' ? ' · pilihan' : ''}</span>`;
const daftarMK = ms => ms.map(m => `<div>${sel(m)}</div>`).join('');

/** HTML tabel ekuivalensi (bagian per model + tidak berlanjut + MK baru). opsi: { cari, hanyaBerubah, lama, baru }. */
export function htmlEkuivalensi(h, opsi = {}){
  const q = String(opsi.cari || '').trim().toLowerCase(), lama = esc(opsi.lama || 'lama'), baru = esc(opsi.baru || 'baru');
  const kepala = `<thead><tr><th>MK ${lama}</th><th>MK ${baru}</th><th>Keterangan</th></tr></thead>`;
  const bagian = [];
  for (const model of ['1:1', '1:2', '2:1', 'm:n']) {
    let xs = h.kelompok.filter(k => k.model === model && cocokCari(k, q));
    if (model === '1:1' && opsi.hanyaBerubah) xs = xs.filter(k => k.berubah);
    if (!xs.length) continue;
    bagian.push(`<h3 class="ek-judul">${esc(JUDUL_MODEL[model])} <span class="ek-n">${xs.length}</span></h3>
      ${model === '1:1' ? `<p class="ek-ket">${esc(KETENTUAN['1:1'])} Baris bertanda <b>berubah</b>: nama atau sks berbeda.</p>` : `<p class="ek-ket">${esc(KETENTUAN[model])}</p>`}
      <div class="ek-gulir"><table class="ek-tabel">${kepala}<tbody>${xs.map(k => `<tr${k.berubah && model === '1:1' ? ' class="ek-berubah"' : ''}>
        <td>${daftarMK(k.lama)}</td><td>${daftarMK(k.baru)}${k.berubah && model === '1:1' ? ' <span class="ek-chip">berubah</span>' : ''}</td>
        <td class="ek-cat">${k.catatan.map(esc).join('<br>')}</td></tr>`).join('')}</tbody></table></div>`);
  }
  const tidak = h.tidak.filter(t => cocokCari(t, q));
  if (tidak.length) bagian.push(`<h3 class="ek-judul">MK ${lama} yang tidak berlanjut <span class="ek-n">${tidak.length}</span></h3>
    <p class="ek-ket">${esc(KETENTUAN.tidak)}</p>
    <div class="ek-gulir"><table class="ek-tabel"><thead><tr><th>MK ${lama}</th><th>Keterangan</th></tr></thead><tbody>
    ${tidak.map(t => `<tr><td>${sel(t.mk)}</td><td class="ek-cat">${esc(t.catatan)}</td></tr>`).join('')}</tbody></table></div>`);
  const mkBaru = h.baru.filter(m => cocokCari({ lama: [m] }, q));
  if (mkBaru.length) bagian.push(`<h3 class="ek-judul">MK ${baru} tanpa padanan ${lama} <span class="ek-n">${mkBaru.length}</span></h3>
    <p class="ek-ket">${esc(KETENTUAN.baru)}</p>
    <div class="ek-gulir"><table class="ek-tabel"><thead><tr><th>MK ${baru}</th><th>Semester</th></tr></thead><tbody>
    ${mkBaru.map(m => `<tr><td>${sel(m)}</td><td>${m.semester ? esc(m.semester) : ''}</td></tr>`).join('')}</tbody></table></div>`);
  return bagian.join('') || '<p class="ek-ket">Tidak ada mata kuliah yang cocok.</p>';
}

/** CSV isi sekarang, format impor padanan (kode_<lama>;kode_<baru>;cara;catatan) supaya bisa disunting lalu diimpor ulang. */
export function csvEkuivalensi(s = {}){
  const lama = String(s.kurikulum_lama || 'lama').toLowerCase(), baru = String(s.kurikulum_baru || 'baru').toLowerCase();
  const L = new Map((s.mk_lama || []).map(m => [m.kode, m])), B = new Map((s.mk_baru || []).map(m => [m.kode, m]));
  // bacaCsvPadanan (tinjauan-rps.js) memecah dengan split(';') tanpa tanda kutip: ';' dan baris baru di isian diganti.
  const q = v => String(v ?? '').replace(/;/g, ',').replace(/[\r\n]+/g, ' ').replace(/"/g, "'");
  const baris = (s.padanan || []).map(p => [p.kode_lama, p.tidak_berlanjut ? 'TIDAK_BERLANJUT' : p.kode_baru, p.model || '', p.catatan || '',
    L.get(p.kode_lama)?.nama || '', p.kode_baru ? B.get(p.kode_baru)?.nama || '' : '']);
  return [[`kode_${lama}`, `kode_${baru}`, 'cara', 'catatan', `nama_${lama}`, `nama_${baru}`], ...baris].map(r => r.map(q).join(';')).join('\r\n');
}
