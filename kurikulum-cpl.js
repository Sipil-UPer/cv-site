// CPL per kurikulum, peta MK-CPL, korelasi CPL antar kurikulum (pemilik 2026-11-13; 71-patch-cpl-kurikulum.sql).
// Dipakai Data prodi (tab CPL, Peta MK-CPL, Korelasi CPL: impor CSV dan sebaran) dan capaian-cpl.js (tren lintas kurikulum).
// Keputusan pemilik 2026-11-13: sebaran CPL dalam MK dibagi rata; bobot boleh disesuaikan kemudian
// (ref_mk_cpl.bobot kosong = 1). Korelasi "setara" menyambung tren; "sebagian" ditampilkan berdampingan.

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** CSV dengan pemisah ';' atau ',' (dipilih dari baris judul) dan tanda kutip -> array baris (array sel). */
export function bacaCSV(teks){
  teks = String(teks || '').replace(/^﻿/, '');
  const judul = teks.split(/\r?\n/)[0] || '';
  const pisah = (judul.match(/;/g) || []).length > (judul.match(/,/g) || []).length ? ';' : ',';
  const baris = []; let r = [], v = '', q = false;
  for (let i = 0; i < teks.length; i++) {
    const c = teks[i];
    if (q) { if (c === '"') { if (teks[i + 1] === '"') { v += '"'; i++; } else q = false; } else v += c; continue; }
    if (c === '"') q = true;
    else if (c === pisah) { r.push(v); v = ''; }
    else if (c === '\n') { r.push(v); baris.push(r); r = []; v = ''; }
    else if (c !== '\r') v += c;
  }
  if (v !== '' || r.length) { r.push(v); baris.push(r); }
  return baris.filter(x => x.some(s => s.trim() !== ''));
}

/** Nama kurikulum baku: "K26", "k 26", "2026", "Kurikulum 2026" -> "K26"; lainnya apa adanya (huruf besar). */
export function normKur(s){
  const t = String(s ?? '').trim().toUpperCase();
  let m = t.match(/^K\s*-?\s*(\d{2})$/);
  if (m) return 'K' + m[1];
  m = t.match(/^(?:KURIKULUM\s*)?20(\d{2})$/);
  return m ? 'K' + m[1] : t;
}
/** Kode CPL tanpa awalan "CPL": "CPL-A", "CPL A", "a" -> "A"/"a" (huruf asli dipertahankan). */
export const normCpl = s => String(s ?? '').trim().replace(/^cpl[\s_.-]*/i, '');
const KODE = /^[A-Za-z0-9.-]{1,10}$/, KUR = /^K\d{2}$/;
const kunci = (...xs) => xs.join('|');

export const KOLOM_IMPOR = {
  cpl: ['kurikulum', 'kode', 'ranah', 'rumusan', 'rumusan_en', 'indikator', 'urutan'],
  peta: ['kurikulum', 'kode_mk', 'cpl', 'indikator', 'bobot'],
  korelasi: ['kurikulum_asal', 'cpl_asal', 'kurikulum_tujuan', 'cpl_tujuan', 'tingkat', 'alasan', 'status'],
};
export const CONTOH_IMPOR = {
  cpl: [['K26', 'A', 'Sikap', 'Menunjukkan sikap bertakwa ...', 'Demonstrate ...', '', '10'],
        ['K21', 'a', '', 'Memiliki karakter ...', '', 'a-1 ...\na-2 ...', '10']],
  peta: [['K26', '41101', 'D', '', ''], ['K21', '41405', 'j', 'j-1, j-2, j-3, j-4', '2'], ['K21', '41405', 'd', 'd-1', '1']],
  korelasi: [['K21', 'a', 'K26', 'A', 'setara', 'Isi CPL sama', 'disetujui'], ['K21', 'c', 'K26', 'C', 'sebagian', '', 'usulan']],
};
// Kolom matriks lebar "CPL A" / "CPL-a" (lembar Peta MK-CPL di draf Excel).
const KOLOM_LEBAR = /^cpl[\s_-]*([A-Za-z0-9.]+)$/i;
const TANDA = /^(v|x|ya|y|1|✓|✔|\(baris cpl\))$/i;

/**
 * Rencana impor satu jenis (cpl | peta | korelasi) dari baris CSV.
 * ref = { mk: ref_mata_kuliah[], cpl: ref_cpl[], peta: ref_mk_cpl[], korelasi: ref_cpl_korelasi[] } yang sudah ada.
 * Hasil: { sah: [{baris, isi, baru}], salah: [{baris, label, galat}], hapus: [id], asing: [kolom], galat: '' }.
 * Peta: tiap MK yang muncul di CSV dianggap lengkap; pasangan lama MK itu yang tidak ada di CSV dihapus.
 */
export function rencanaImpor(jenis, rows, ref = {}){
  const kepala = (rows[0] || []).map(s => String(s).trim().toLowerCase());
  const hasil = { sah: [], salah: [], hapus: [], asing: [], galat: '' };
  const kolom = KOLOM_IMPOR[jenis];
  if (!kolom) return { ...hasil, galat: `Jenis impor tidak dikenal: ${jenis}` };
  // Kode CPL dari judul asli (huruf besar/kecil dibedakan: K26 "A", K21 "a").
  const lebar = jenis === 'peta' && !kepala.includes('cpl')
    ? (rows[0] || []).map(k => (String(k).trim().match(KOLOM_LEBAR) || [])[1] || null) : null;
  if (jenis === 'peta' && kepala.includes('kode') && !kepala.includes('kode_mk')) kepala[kepala.indexOf('kode')] = 'kode_mk';
  const wajib = jenis === 'cpl' ? ['kurikulum', 'kode'] : jenis === 'peta' ? ['kurikulum', 'kode_mk'] : kolom.slice(0, 5);
  const kurang = wajib.filter(k => !kepala.includes(k));
  if (jenis === 'peta' && !kepala.includes('cpl') && !(lebar || []).some(Boolean)) kurang.push('cpl (atau kolom "CPL A", "CPL B", ...)');
  if (kurang.length) return { ...hasil, galat: `Kolom wajib tidak ada: ${kurang.join(', ')}.` };
  hasil.asing = kepala.filter((k, i) => k && !kolom.includes(k) && !(lebar && lebar[i])
    && !(jenis === 'korelasi' && /^(jumlah_mk_pendukung|mk_pendukung)$/.test(k)) && !(jenis === 'peta' && /^(nama|sks|sifat|catatan)$/.test(k)));
  const ada = k => kepala.includes(k);
  const sel = (r, k) => { const i = kepala.indexOf(k); return i < 0 ? '' : String(r[i] ?? '').trim(); };
  const cplAda = new Set((ref.cpl || []).map(c => kunci(c.kurikulum, c.kode)));
  const mkAda = new Set((ref.mk || []).map(m => kunci(m.kurikulum, m.kode)));
  const dilihat = new Set();
  const data = rows.slice(1);

  if (jenis === 'cpl') {
    const lama = new Map((ref.cpl || []).map(c => [kunci(c.kurikulum, c.kode), c]));
    data.forEach((r, i) => {
      const kur = normKur(sel(r, 'kurikulum')), kode = normCpl(sel(r, 'kode')), galat = [];
      if (!KUR.test(kur)) galat.push('kurikulum: huruf K dan dua angka, mis. K26');
      if (!KODE.test(kode)) galat.push('kode CPL: 1-10 huruf/angka, mis. A atau a');
      const k = kunci(kur, kode), baru = !lama.has(k);
      if (dilihat.has(k)) galat.push('kurikulum + kode ganda di CSV');
      dilihat.add(k);
      const isi = { kurikulum: kur, kode };
      for (const c of ['ranah', 'rumusan', 'rumusan_en', 'indikator']) if (ada(c) && sel(r, c)) isi[c] = sel(r, c);
      if (baru && !isi.rumusan) galat.push('rumusan kosong (CPL baru)');
      const u = sel(r, 'urutan');
      if (u) { if (/^\d+$/.test(u)) isi.urutan = +u; else galat.push('urutan bukan bilangan bulat'); }
      else if (baru) isi.urutan = (i + 1) * 10;
      (galat.length ? hasil.salah : hasil.sah).push(galat.length ? { baris: i + 2, label: `${kur} ${kode}`, galat } : { baris: i + 2, isi, baru });
    });
    return hasil;
  }

  if (jenis === 'peta') {
    const lama = new Map((ref.peta || []).map(p => [kunci(p.kurikulum, p.kode_mk, p.cpl), p]));
    const mkCsv = new Set();
    const tambah = (no, kur, kodeMk, cpl, ind, bobotTeks) => {
      const galat = [];
      if (!KUR.test(kur)) galat.push('kurikulum: huruf K dan dua angka, mis. K26');
      if (!kodeMk) galat.push('kode MK kosong');
      else if (!mkAda.has(kunci(kur, kodeMk))) galat.push(`MK ${kodeMk} tidak ada di kurikulum ${kur} (impor mata kuliah dulu)`);
      if (!cplAda.has(kunci(kur, cpl))) galat.push(`CPL ${cpl} tidak ada di kurikulum ${kur} (impor CPL dulu)`);
      const k = kunci(kur, kodeMk, cpl);
      if (dilihat.has(k)) galat.push('pasangan MK-CPL ganda di CSV');
      dilihat.add(k);
      const isi = { kurikulum: kur, kode_mk: kodeMk, cpl, indikator: ind && !TANDA.test(ind) ? ind : null };
      if (ada('bobot')) {
        const b = String(bobotTeks || '').replace(',', '.');
        if (b === '') isi.bobot = null;
        else if (!Number.isFinite(+b) || +b <= 0 || +b > 100) galat.push('bobot: angka > 0 sampai 100 (kosong = dibagi rata)');
        else isi.bobot = +b;
      }
      if (!galat.length) mkCsv.add(kunci(kur, kodeMk));
      (galat.length ? hasil.salah : hasil.sah).push(galat.length ? { baris: no, label: `${kur} ${kodeMk} → ${cpl}`, galat }
        : { baris: no, isi, baru: !lama.has(k) });
    };
    data.forEach((r, i) => {
      const kur = normKur(sel(r, 'kurikulum')), kodeMk = sel(r, 'kode_mk');
      if (lebar) lebar.forEach((c, j) => { const v = String(r[j] ?? '').trim(); if (c && v) tambah(i + 2, kur, kodeMk, normCpl(c), v, ''); });
      else tambah(i + 2, kur, kodeMk, normCpl(sel(r, 'cpl')), sel(r, 'indikator'), sel(r, 'bobot'));
    });
    const baruKunci = new Set(hasil.sah.map(x => kunci(x.isi.kurikulum, x.isi.kode_mk, x.isi.cpl)));
    hasil.hapus = (ref.peta || []).filter(p => mkCsv.has(kunci(p.kurikulum, p.kode_mk)) && !baruKunci.has(kunci(p.kurikulum, p.kode_mk, p.cpl)))
      .map(p => p.id);
    return hasil;
  }

  // korelasi
  const lama = new Map((ref.korelasi || []).map(x => [kunci(x.kurikulum_asal, x.cpl_asal, x.kurikulum_tujuan, x.cpl_tujuan), x]));
  data.forEach((r, i) => {
    const ka = normKur(sel(r, 'kurikulum_asal')), ca = normCpl(sel(r, 'cpl_asal'));
    const kt = normKur(sel(r, 'kurikulum_tujuan')), ct = normCpl(sel(r, 'cpl_tujuan'));
    const galat = [];
    if (!KUR.test(ka) || !KUR.test(kt)) galat.push('kurikulum: huruf K dan dua angka, mis. K21 dan K26');
    else if (ka === kt) galat.push('kurikulum asal dan tujuan harus berbeda');
    if (!cplAda.has(kunci(ka, ca))) galat.push(`CPL ${ca} tidak ada di ${ka}`);
    if (!cplAda.has(kunci(kt, ct))) galat.push(`CPL ${ct} tidak ada di ${kt}`);
    const t = sel(r, 'tingkat').toLowerCase();
    const tingkat = /^setara/.test(t) ? 'setara' : /^sebagian/.test(t) ? 'sebagian' : null;
    if (!tingkat) galat.push('tingkat: setara atau sebagian');
    const k = kunci(ka, ca, kt, ct), baru = !lama.has(k);
    if (dilihat.has(k)) galat.push('pasangan ganda di CSV');
    dilihat.add(k);
    const isi = { kurikulum_asal: ka, cpl_asal: ca, kurikulum_tujuan: kt, cpl_tujuan: ct, tingkat };
    if (ada('alasan') && sel(r, 'alasan')) isi.alasan = sel(r, 'alasan');
    const st = sel(r, 'status').toLowerCase();
    if (st) { if (/^disetujui|^setuju/.test(st)) isi.status = 'disetujui'; else if (/^usul/.test(st)) isi.status = 'usulan'; else galat.push('status: usulan atau disetujui'); }
    else if (baru) isi.status = 'usulan';
    (galat.length ? hasil.salah : hasil.sah).push(galat.length ? { baris: i + 2, label: `${ka} ${ca} → ${kt} ${ct}`, galat } : { baris: i + 2, isi, baru });
  });
  return hasil;
}

/** Porsi tiap CPL dalam satu MK: bobot / jumlah bobot MK itu (bobot kosong = 1, jadi semua kosong = dibagi rata). */
export function porsiMK(peta){
  const per = new Map();
  for (const p of peta || []) {
    const k = kunci(p.kurikulum, p.kode_mk);
    if (!per.has(k)) per.set(k, []);
    per.get(k).push(p);
  }
  const out = new Map();
  for (const [k, xs] of per) {
    const total = xs.reduce((a, p) => a + (+p.bobot > 0 ? +p.bobot : 1), 0);
    out.set(k, xs.map(p => ({ cpl: p.cpl, indikator: p.indikator || '', porsi: (+p.bobot > 0 ? +p.bobot : 1) / total })));
  }
  return out;
}

/**
 * Sebaran CPL per kurikulum: banyak MK, SKS setara (SKS MK x porsi), MK wajib aktif/terdaftar tanpa CPL, CPL tanpa MK.
 * mk: ref_mata_kuliah (kurikulum, kode, nama, sks, sifat); cpl: ref_cpl; peta: ref_mk_cpl.
 */
export function sebaranCPL(mk, cpl, peta){
  const porsi = porsiMK(peta);
  const kurs = [...new Set([...(cpl || []).map(c => c.kurikulum), ...(peta || []).map(p => p.kurikulum)])].sort().reverse();
  return kurs.map(kur => {
    const cs = (cpl || []).filter(c => c.kurikulum === kur).sort((a, b) => (a.urutan ?? 100) - (b.urutan ?? 100) || String(a.kode).localeCompare(b.kode));
    const mks = (mk || []).filter(m => m.kurikulum === kur);
    const per = new Map(cs.map(c => [c.kode, { kode: c.kode, rumusan: c.rumusan || '', mk: 0, sks: 0, wajib: 0 }]));
    for (const m of mks) {
      for (const x of porsi.get(kunci(kur, m.kode)) || []) {
        const p = per.get(x.cpl);
        if (!p) continue;
        p.mk++; p.sks += (+m.sks || 0) * x.porsi;
        if (m.sifat !== 'pilihan') p.wajib++;
      }
    }
    const totalSks = [...per.values()].reduce((a, p) => a + p.sks, 0);
    return { kurikulum: kur, cpl: [...per.values()].map(p => ({ ...p, sks: Math.round(p.sks * 100) / 100,
        persen: totalSks ? p.sks / totalSks : 0 })),
      mkTanpaCpl: mks.filter(m => m.sifat !== 'pilihan' && !porsi.has(kunci(kur, m.kode))),
      cplTanpaMk: [...per.values()].filter(p => !p.mk).map(p => p.kode),
      mkTerpetakan: mks.filter(m => porsi.has(kunci(kur, m.kode))).length, mkJumlah: mks.length };
  });
}

const pct = x => x == null ? '—' : `${(x * 100).toFixed(0)}%`;
const f2 = x => (Math.round(x * 100) / 100).toString().replace('.', ',');

/** HTML sebaran CPL (tab Peta MK-CPL). */
export function htmlSebaran(sebaran){
  if (!sebaran.length) return '<p class="kosong">Belum ada CPL. Impor CPL di tab CPL, lalu peta MK-CPL di sini.</p>';
  return sebaran.map(s => `<h4 style="margin:12px 0 4px">${esc(s.kurikulum)}: ${s.mkTerpetakan} dari ${s.mkJumlah} MK terpetakan</h4>
    <div class="gulir"><table class="t"><thead><tr><th>CPL</th><th>Rumusan</th><th>MK (wajib)</th><th>SKS setara</th><th>Porsi kurikulum</th></tr></thead>
    <tbody>${s.cpl.map(c => `<tr><td><b>${esc(c.kode)}</b></td><td><small>${esc(c.rumusan.length > 110 ? c.rumusan.slice(0, 108) + '…' : c.rumusan)}</small></td>
      <td>${c.mk} (${c.wajib})</td><td>${f2(c.sks)}</td><td>${pct(c.persen)}</td></tr>`).join('')}</tbody></table></div>
    ${s.cplTanpaMk.length ? `<p class="msg buruk">CPL tanpa MK: ${esc(s.cplTanpaMk.join(', '))}.</p>` : ''}
    ${s.mkTanpaCpl.length ? `<p class="ket">MK wajib tanpa CPL (${s.mkTanpaCpl.length}): ${esc(s.mkTanpaCpl.map(m => `${m.kode} ${m.nama || ''}`.trim()).join('; '))}.</p>` : ''}`).join('')
    + `<p class="ket">SKS setara = SKS MK × porsi CPL dalam MK itu. Porsi dibagi rata di antara CPL MK (pemilik 2026-11-13);
      bila kolom bobot diisi, porsi = bobot / jumlah bobot CPL MK itu.</p>`;
}

/**
 * Tren lintas kurikulum dari ringkasan CPL (progres per semester) dan korelasi.
 * Hasil: { terms: [[term_order, term]], kelompok: [{ kurikulum, cpl, baris: [{ kurikulum, cpl, tingkat, status, nilai: Map(term_order -> progres) }] }] }.
 * Baris pertama tiap kelompok = CPL tujuan itu sendiri (tingkat 'ini'); setara lalu sebagian.
 */
export function trenLintas(s, korelasi){
  const prog = new Map();
  for (const r of (s && s.progres) || []) {
    const k = kunci(normKur(r.curriculum), normCpl(r.cpl).toLowerCase());
    if (!prog.has(k)) prog.set(k, new Map());
    prog.get(k).set(r.term_order, r);
  }
  const nilai = (kur, cpl) => prog.get(kunci(kur, String(cpl).toLowerCase())) || new Map();
  const per = new Map();
  for (const x of korelasi || []) {
    const k = kunci(x.kurikulum_tujuan, x.cpl_tujuan);
    if (!per.has(k)) per.set(k, { kurikulum: x.kurikulum_tujuan, cpl: x.cpl_tujuan, sumber: [] });
    per.get(k).sumber.push(x);
  }
  const urutT = { setara: 0, sebagian: 1 };
  const kelompok = [...per.values()].sort((a, b) => a.kurikulum.localeCompare(b.kurikulum) || a.cpl.localeCompare(b.cpl)).map(g => ({
    kurikulum: g.kurikulum, cpl: g.cpl,
    baris: [{ kurikulum: g.kurikulum, cpl: g.cpl, tingkat: 'ini', status: '', nilai: nilai(g.kurikulum, g.cpl) },
      ...g.sumber.sort((a, b) => urutT[a.tingkat] - urutT[b.tingkat] || a.cpl_asal.localeCompare(b.cpl_asal))
        .map(x => ({ kurikulum: x.kurikulum_asal, cpl: x.cpl_asal, tingkat: x.tingkat, status: x.status, nilai: nilai(x.kurikulum_asal, x.cpl_asal) }))],
  })).filter(g => g.baris.some(b => b.nilai.size));
  const terms = [...new Map(((s && s.progres) || []).map(r => [r.term_order, r.term])).entries()].sort((a, b) => a[0] - b[0]);
  return { terms, kelompok };
}

/** HTML tren lintas kurikulum; '' bila tidak ada korelasi yang punya data. */
export function htmlTrenLintas(s, korelasi, { kelasTabel = 'sp', individu = 45 } = {}){
  const { terms, kelompok } = trenLintas(s, korelasi);
  if (!kelompok.length || !terms.length) return '';
  const warna = st => st === 'TERCAPAI' ? 'var(--hijau)' : st === 'BELUM' ? 'var(--merah)' : 'inherit';
  const usulan = (korelasi || []).some(x => x.status !== 'disetujui');
  return `<h3 class="cpl-h">Tren lintas kurikulum (korelasi CPL, % mahasiswa ≥ ${individu})</h3>
    <p class="ket">Baris tebal = CPL kurikulum baru; di bawahnya CPL kurikulum lama yang berkorelasi. <b>Setara</b> = isi sama, trennya
      dibaca bersambung; <i>sebagian</i> = hanya sebagian isi beririsan, pembanding saja.${usulan ? ' Tanda * = korelasi masih usulan (belum disetujui tim).' : ''}</p>
    <div class="gulir"><table class="${kelasTabel}"><thead><tr><th>CPL</th><th>Korelasi</th>${terms.map(([, t]) => `<th>${esc(t)}</th>`).join('')}</tr></thead><tbody>
    ${kelompok.map(g => g.baris.map(b => `<tr${b.tingkat === 'sebagian' ? ' style="opacity:.75"' : ''}>
      <td style="white-space:nowrap">${b.tingkat === 'ini' ? `<b>${esc(b.cpl)}</b> <small class="ket">${esc(b.kurikulum)}</small>`
        : `&nbsp;&nbsp;↳ ${esc(b.cpl)} <small class="ket">${esc(b.kurikulum)}</small>`}</td>
      <td>${b.tingkat === 'ini' ? '' : b.tingkat === 'setara' ? `setara${b.status !== 'disetujui' ? '*' : ''}` : `<i>sebagian${b.status !== 'disetujui' ? '*' : ''}</i>`}</td>
      ${terms.map(([o]) => { const r = b.nilai.get(o); return `<td>${r ? `<span style="color:${warna(r.status)}">${pct(r.share_achieved)}</span>` : '—'}</td>`; }).join('')}
    </tr>`).join('')).join('')}</tbody></table></div>`;
}
