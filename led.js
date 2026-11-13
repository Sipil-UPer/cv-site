/* =====================================================================
   DRAF LED — Laporan Evaluasi Diri Program Studi (LAM Teknik)
   ---------------------------------------------------------------------
   Mengisi template resmi `led-template.docx` (LEDPS LAM Teknik, instrumen
   2025 ver. 2, "pasca akreditasi pertama dan unggul") di browser, dari
   angka yang sudah dihitung halaman skor. Dipanggil dari tombol "Unduh
   draf LED" di skor.html (keputusan pemilik 2026-11-03: tombol di halaman
   skor, narasi = kalimat + angka + [isi]).

   Cara kerja: tiap SLOT mencari judul subbagian di template (berurutan,
   dari atas ke bawah), lalu kalimat petunjuk biru "(… disampaikan oleh
   pengusul …)" sesudahnya, lalu menyisipkan draf SETELAH petunjuk dan
   kotak isiannya. Petunjuk resmi LAM tidak dihapus.

   Fakta narasi, tautan di dalam kalimat, tabel pendukung, dan tautan tabel
   bukti berasal dari led-isi.js (pemilik 2026-11-05).

   Penandaan di dokumen:
     sorot kuning        = narasi buatan mesin, harus diperiksa
     [isi: …] merah      = fakta yang hanya diketahui prodi, wajib diisi
     tanpa sorot         = tabel data, grafik, dan tautan bukti yang diambil
                           langsung dari sistem
   LED adalah dokumen yang diserahkan ke LAM Teknik (pemilik 2026-11-04):
   skor, bobot, NA, status, dan acuan matriks hasil penilaian sendiri TIDAK
   ditulis; semuanya tetap di halaman skor. Dosen tinggal melengkapi narasi.
   Peta subbagian LED ke butir: docs/led-peta-butir.md.
   ===================================================================== */

import { RENCANA_BUKTI, LKPS_TABEL, kelompokDokumen, buktiButir, saranDokumen } from './rencana-bukti.js?v=2026-11-13-c32d43';
import { grafikButir, tabelGrafik, tabelPendukung } from './led-data.js?v=2026-11-13-c32d43';
import { gambarGrafik } from './led-grafik.js?v=2026-11-13-c32d43';
import { faktaNarasi, anggotaTim, kalimatTren, buktiOtomatis, dokumenBelumAda, periksaTersisa, buktiLembar, tabelPenjelas } from './led-isi.js?v=2026-11-13-c32d43';
import { ISIAN_IDENTITAS, KOTA_PT, FOLDER_INDUK, NARAHUBUNG, nilaiIdentitas, KRITERIA, terapkanIsian, kunciTambahan, kalimatButir, kalimatCapaian, kalimatKriteria, kalimatUmum } from './led-narasi.js?v=2026-11-13-c32d43';
import { daftarProdi, STATUS_PS, tglTeks } from './pustaka-dokumen.js?v=2026-11-13-c32d43';

const NS = {
  w:  'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
  r:  'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
  wp: 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
  pr: 'http://schemas.openxmlformats.org/package/2006/relationships',
};
const TEMPLATE = 'led-template.docx';
const LOGO = 'logo-uper.png';
const JSZIP = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';
// Template sendiri (tools/make_led_template.py): A4 11906 twip, margin
// kiri 1440, kanan 1106; isi rata dengan kolom teks, lebar 9360.
const INDEN = 0;
const LEBAR = 9360;
const LOGO_LEBAR_EMU = 1800000;       // 5 cm

// ---------------------------------------------------------------------
//  Pembangun XML WordprocessingML (string)
// ---------------------------------------------------------------------
const xe = s => String(s ?? '').replace(/[&<>"]/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function run(t, o = {}){
  const pr = [
    o.gaya ? `<w:rStyle w:val="${o.gaya}"/>` : '',
    o.b ? '<w:b/>' : '', o.i ? '<w:i/>' : '',
    o.warna ? `<w:color w:val="${o.warna}"/>` : '',
    o.sz ? `<w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/>` : '',
    o.sorot ? `<w:highlight w:val="${o.sorot}"/>` : '',
  ].join('');
  return `<w:r>${pr ? `<w:rPr>${pr}</w:rPr>` : ''}<w:t xml:space="preserve">${xe(t)}</w:t></w:r>`;
}

// Narasi mesin: sorot kuning; potongan [isi: …] merah tebal.
// Token ⟦url|label⟧ (led-isi.js) = tautan ke dokumen di dalam kalimat.
let P_AKTIF = null;
function auto(t, o = {}){
  return String(t).split(/(\[isi:[^\]]*\]|⟦[^⟧]*⟧|⟪[^⟫]*⟫)/).filter(Boolean).map(s => {
    if (s.startsWith('[isi:')) return run(s, { ...o, b: true, warna: 'C00000', sorot: 'yellow' });
    // Isian tersimpan (led-narasi.js) tanpa sorot; [..] dari saran yang belum diganti tetap merah.
    if (s.startsWith('⟪')) return s.slice(1, -1).split(/(\[[^\]]+\])/).filter(Boolean).map(x =>
      x.startsWith('[') ? run(x, { ...o, b: true, warna: 'C00000', sorot: 'yellow' }) : run(x, o)).join('');
    if (s.startsWith('⟦')) {
      const i = s.indexOf('|');
      return tautan(P_AKTIF, s.slice(1, i), s.slice(i + 1, -1), o);
    }
    return run(s, { ...o, sorot: 'yellow' });
  }).join('');
}

function para(isi, o = {}){
  const kotak = ['top', 'left', 'bottom', 'right'].map(s =>
    `<w:${s} w:val="dashed" w:sz="4" w:space="4" w:color="808080"/>`).join('');
  const pr = [
    o.keep ? '<w:keepNext/>' : '',
    o.kotak ? `<w:pBdr>${kotak}</w:pBdr><w:shd w:val="clear" w:color="auto" w:fill="${o.kotak}"/>` : '',
    `<w:spacing w:before="${o.before ?? 60}" w:after="${o.after ?? 120}"/>`,
    `<w:ind w:left="${o.ind ?? INDEN}"/>`,
    `<w:jc w:val="${o.jc || 'both'}"/>`,
  ].join('');
  return `<w:p><w:pPr>${pr}</w:pPr>${isi}</w:p>`;
}
const paraAuto = (t, o) => para(auto(t), o);
// Kalimat dengan isian tersimpan diterapkan.
const paraIsi = (C, lingkup, x) => paraAuto(terapkanIsian(x.teks, lingkup, x.id, C.narasi));

function tautan(P, url, label, o = {}){
  return `<w:hyperlink r:id="${P.link(url)}" w:history="1">${
    run(label || url, { ...o, gaya: 'Hyperlink' })}</w:hyperlink>`;
}

const gambar = ket => para(run(`[Gambar: ${ket} — sisipkan gambar di sini]`,
  { i: true, warna: '7F7F7F' }), { kotak: 'F2F2F2', jc: 'center', before: 120, after: 160 });

// baris: [[sel]], sel = teks | {t, url, span}. o.kepala = jumlah baris kepala.
function tabel(P, baris, o = {}){
  const B = baris.map(r => r.map(c => c && typeof c === 'object' ? c : { t: String(c ?? '') }));
  const n = Math.max(1, ...B.map(r => r.reduce((a, c) => a + (c.span || 1), 0)));
  // Lebar kolom sebanding panjang teks terpanjang (7–40 karakter); di bawah
  // 7 kolom angka seperti "2,90" atau judul "Butir" terpotong.
  const pj = Array(n).fill(7);
  B.forEach(r => { let k = 0; r.forEach(c => {
    if ((c.span || 1) === 1)
      pj[k] = Math.max(pj[k], Math.min(40, (c.url ? (c.t || 'buka') : c.t || '').length));
    k += c.span || 1; }); });
  const tot = pj.reduce((a, b) => a + b, 0);
  const w = pj.map(x => Math.floor(LEBAR * x / tot));
  w[n - 1] += LEBAR - w.reduce((a, b) => a + b, 0);
  const nKepala = o.kepala ?? 1;
  const garis = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(s =>
    `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="808080"/>`).join('');
  const rows = B.map((r, i) => {
    const kepala = i < nKepala;
    let k = 0;
    const sel = r.map(c => {
      const sp = c.span || 1;
      const cw = w.slice(k, k + sp).reduce((a, b) => a + b, 0);
      k += sp;
      const isi = c.links ? c.links.map(l => tautan(P, l.url, l.t, { sz: 18 })).join(run('; ', { sz: 18 }))
                : c.url ? tautan(P, c.url, c.t || 'buka', { sz: 18 })
                : c.auto ? auto(c.t, { sz: 18 })
                : run(c.t, { b: kepala, sz: 18 });
      return `<w:tc><w:tcPr><w:tcW w:w="${cw}" w:type="dxa"/>${
        sp > 1 ? `<w:gridSpan w:val="${sp}"/>` : ''}${
        kepala ? '<w:shd w:val="clear" w:color="auto" w:fill="DCE6F1"/>' : ''}</w:tcPr>` +
        `<w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr>${isi}</w:p></w:tc>`;
    });
    for (; k < n; k++)
      sel.push(`<w:tc><w:tcPr><w:tcW w:w="${w[k]}" w:type="dxa"/></w:tcPr><w:p/></w:tc>`);
    return `<w:tr>${kepala ? '<w:trPr><w:tblHeader/></w:trPr>' : ''}${sel.join('')}</w:tr>`;
  }).join('');
  return `<w:tbl><w:tblPr><w:tblW w:w="${LEBAR}" w:type="dxa"/>` +
    `<w:tblInd w:w="${INDEN}" w:type="dxa"/><w:tblBorders>${garis}</w:tblBorders>` +
    `<w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="80" w:type="dxa"/>` +
    `<w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr>` +
    `<w:tblGrid>${w.map(x => `<w:gridCol w:w="${x}"/>`).join('')}</w:tblGrid>${rows}</w:tbl>` +
    para('', { before: 0, after: 60 });
}

function paraLogo(cx, cy){
  return `<w:p><w:pPr><w:spacing w:before="0" w:after="240"/><w:jc w:val="center"/></w:pPr>` +
    `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="9001" name="Logo Universitas Pertamina"/>` +
    `<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
    `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:nvPicPr><pic:cNvPr id="0" name="${LOGO}"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="rIdLedLogo"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>` +
    `</a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

// Grafik data (led-grafik.js) sebagai gambar sebaris, rata tengah.
const GRAFIK_LEBAR_EMU = 5400000;     // 15 cm
function paraGrafik(rid, cx, cy, id, nama){
  return `<w:p><w:pPr><w:keepNext/><w:spacing w:before="120" w:after="0"/><w:jc w:val="center"/></w:pPr>` +
    `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">` +
    `<wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="${xe(nama)}"/>` +
    `<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
    `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
    `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
    `<pic:nvPicPr><pic:cNvPr id="0" name="${xe(nama)}.png"/><pic:cNvPicPr/></pic:nvPicPr>` +
    `<pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
    `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
    `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>` +
    `</a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

// Butir yang mendapat grafik data (satu grafik per butir; 7 dan 41 memakai
// grafik butir 6 dan 40).
const BUTIR_GRAFIK = ['6', '23', '25', '31', '32', '33', '34', '40', '42', '43',
                      '46', '47', '49', '50', '51', '52'];

// Tabel pendukung, dan grafik + tabel datanya.
function blokData(C, P, no){
  const out = [];
  const tp = tabelPendukung(no, C.D, C.ts);
  if (tp){
    out.push(para(run(tp.judul, { b: true }), { keep: true }));
    out.push(tabel(P, tp.baris));
  }
  const g = C.grafik && C.grafik[no];
  if (g){
    const n = ++C.nomorGambar;
    out.push(paraGrafik(g.rid, g.cx, g.cy, 9100 + n, `Grafik butir ${no}`));
    out.push(para(run(`Gambar ${n}. ${g.spec.judul}`, { i: true, sz: 18 }), { jc: 'center', before: 40 }));
    out.push(para(run(`Data Gambar ${n} (${g.spec.satuan})`, { b: true, sz: 18 }), { keep: true }));
    out.push(tabel(P, tabelGrafik(g.spec)));
  }
  return out.join('');
}

// ---------------------------------------------------------------------
//  Isi: kriteria, narasi butir kualitatif, gambar
// ---------------------------------------------------------------------
const GAMBAR = {
  '2': [0, 'Alur penyusunan VMTS'],
  '4': [0, 'Struktur organisasi UPPS dan program studi'],
  '12': [0, 'Alur evaluasi dan pemutakhiran kurikulum'],
  '13': [1, 'Pemetaan CPL terhadap profil lulusan'],
  '22': [0, 'Peta jalan penelitian'],
  '24': [0, 'Peta jalan PkM'],
  '53': [0, 'Struktur unit penjaminan mutu'],
  '55': [0, 'Siklus PPEPP'],
};

// ---------------------------------------------------------------------
//  Blok per butir dan per kriteria
// ---------------------------------------------------------------------
const bersih = s => String(s || '').replace(/\s+/g, ' ').trim();

function tabelDariHtml(t, maks = 40){
  const rows = [...t.rows].map(tr => [...tr.cells].map(c => ({
    t: bersih(c.textContent.replace(/kunci:\s*\S+/g, '')), span: c.colSpan || 1 })));
  const kepala = t.tHead ? t.tHead.rows.length : 0;
  if (rows.length > kepala + maks){
    const sisa = rows.length - kepala - maks;
    rows.splice(kepala + maks);
    rows.push([{ t: `… ${sisa} baris lagi; daftar lengkap pada LKPS`, span: 99 }]);
  }
  return { rows, kepala };
}

function dariKartu(el){
  if (!el) return { tabel: [], rumus: [], syarat: '' };
  const luar = x => !x.closest('details.rinci');
  return {
    tabel: [...el.querySelectorAll('table')].filter(luar).map(t => tabelDariHtml(t)),
    rumus: [...el.querySelectorAll('.rumus')].filter(luar).map(x => bersih(x.textContent)).filter(Boolean),
    syarat: bersih(el.querySelector('.syarat-ket')?.textContent),
  };
}

// Buang kolom berjudul "Skor"/"Bobot" (faktor rumus skor) dan baris yang
// diawali "Skor" dari tabel kartu.
function tanpaSkor(t){
  const kepala = t.rows.slice(0, t.kepala);
  const isSkor = s => /^skor\b/i.test(s || '');
  const isKolomSkor = s => /^(skor|bobot)\b/i.test(s || '');
  const buang = new Set();
  kepala.forEach(r => { let k = 0; r.forEach(c => { if (isKolomSkor(c.t) && (c.span || 1) === 1) buang.add(k); k += c.span || 1; }); });
  const rows = t.rows.filter((r, i) => i < t.kepala || !isSkor(r[0]?.t)).map(r => {
    let k = 0;
    return r.filter(c => { const ok = !buang.has(k); k += c.span || 1; return ok; });
  });
  return { rows, kepala: t.kepala };
}

function blokButir(C, P, no, k = 0){
  const s = C.skorButir[no] || { n: 0, ada: false };
  const lingkup = `b${no}`;
  const manualSaja = C.manual.has(no);
  const bagian = kalimatButir(no, k, C, !manualSaja && s.ada);
  const dua = k > 0 || kalimatButir(no, 1, C, false).length > 0;
  const gb = GAMBAR[no] && GAMBAR[no][0] === k ? gambar(GAMBAR[no][1]) : '';
  const out = [];

  if (k > 0){
    out.push(paraAuto('Data dan bukti untuk bagian ini disajikan pada bagian sebelumnya.'));
    bagian.forEach(x => out.push(paraIsi(C, lingkup, x)));
    return out.join('') + gb;
  }

  if (dua) out.push(paraAuto('Komponen I.'));
  bagian.forEach(x => out.push(paraIsi(C, lingkup, x)));
  const tren = C.grafik && C.grafik[no] ? kalimatTren(C.grafik[no].spec, { berjalan: C.tsMasihBerjalan }) : '';
  if (tren) out.push(paraAuto(tren));
  const tambahan = (C.narasi || {})[kunciTambahan(lingkup)];
  if (tambahan) String(tambahan).split(/\n+/).filter(Boolean).forEach(x => out.push(para(run(x))));

  // Tabel data dari kartu skor, tanpa kolom/baris skor. Butir yang dinilai
  // dengan matriks (manual) hanya berisi isian skor, jadi tidak disalin.
  if (!C.manual.has(no)) dariKartu(C.kartu(no)).tabel.map(tanpaSkor)
    .forEach(t => { if (t.rows.length > t.kepala) out.push(tabel(P, t.rows, { kepala: t.kepala })); });
  out.push(blokData(C, P, no));
  tabelPenjelas(no, C).forEach(x => {
    out.push(para(run(x.judul, { b: true }), { keep: true }));
    out.push(tabel(P, x.baris));
    if (x.catatan) out.push(para(run(x.catatan, { sz: 18, warna: '595959' })));
  });
  // Karya yang dihitung butir ini, dengan tautan buktinya.
  const karya = (C.daftarKarya(no) || []).slice().sort((a, b) => (b.tahun || 0) - (a.tahun || 0));
  if (karya.length) {
    const maks = 25;
    out.push(para(run('Daftar karya', { b: true }), { keep: true }));
    out.push(tabel(P, [['Th', 'Karya', 'Bukti'], ...karya.slice(0, maks).map(x => [String(x.tahun ?? ''), x.judul || '',
      x.bukti && x.bukti.length ? { links: x.bukti.map(b => ({ url: b.url, t: b.label })), t: x.bukti.map(b => b.label).join('; ') }
                                : { t: '[isi: tautan]', auto: true }])]));
    if (karya.length > maks) out.push(para(run(`Ditampilkan ${maks} dari ${karya.length} karya; selengkapnya pada Lampiran B.`, { sz: 18, warna: '595959' })));
  }

  const u = C.buktiButir(no);
  const bukti = buktiOtomatis(no, C);
  out.push(para(run('Bukti butir: ', { b: true }) +
    (u ? tautan(P, u) : bukti.length ? run('lihat daftar bukti sahih di bawah.')
       : auto('[isi: tautan folder bukti butir di Drive prodi]'))));
  const rk = C.rekapKarya(no);
  if (rk && rk.n) out.push(para(
    run(`Bukti karya: ${rk.ada} dari ${rk.n} karya memiliki tautan bukti; tautan tiap karya ada pada Lampiran B.`)));

  // Daftar periksa bukti (rencana-bukti.js) dengan kolom tautan untuk diisi,
  // lalu kerangka capaian–analisis–tindak lanjut (pola narasi 6 langkah).
  const rb = RENCANA_BUKTI[no];
  if (rb){
    // Tautan terisi sendiri: bukti butir, dokumen pustaka, bukti baris Data prodi.
    // Sisanya daftar periksa matriks yang belum punya berkas.
    const kosongSel = { t: '[isi: tautan]', auto: true };
    const baris = bukti.map(x => [x.label, { url: x.url, t: 'buka' }]);
    dokumenBelumAda(no, C).forEach(j => baris.push([`${j.nama} (belum ada di pustaka)`, kosongSel]));
    periksaTersisa(rb.bukti, bukti).forEach(b => baris.push([b, kosongSel]));
    out.push(para(run('Daftar bukti sahih', { b: true }), { keep: true }));
    out.push(tabel(P, [['No', 'Bukti sahih', 'Tautan'],
      ...baris.map((r, i) => [String(i + 1), ...r])]));
  }
  // Angka sudah ada di tabel/grafik: yang perlu ditulis hanya targetnya.
  out.push(paraIsi(C, lingkup, kalimatCapaian(C, tren || (!manualSaja && s.ada), no)));
  return out.join('') + gb;
}


const blokKriteria = bagian => K => (C, P) =>
  kalimatKriteria(K, bagian, C).map(x => paraIsi(C, K.kode, x)).join('');
const latar = blokKriteria('latar'), kebijakan = blokKriteria('kebijakan');
const analisis = blokKriteria('analisis'), swot = blokKriteria('swot');
const blokUmum = bagian => C => kalimatUmum(bagian, C).map(x => paraIsi(C, 'umum', x)).join('');


// Lampiran untuk asesor: semua tautan langsung ke Drive (situs prodi perlu
// login, jadi tidak dipakai di sini). A = per butir, B = per karya,
// C = per tabel LKPS.
const judulLampiran = t => para(run(t, { b: true, warna: '1F3864' }), { keep: true, before: 240 });
function blokLampiran(C, P){
  const out = [];
  const isian = l => nilaiIdentitas(C.narasi, l) || `[isi: ${l}]`;
  out.push(paraAuto(`Seluruh bukti sahih LED dan LKPS ${C.P.ps} disimpan di Google Drive akun prodi, folder induk ${isian(FOLDER_INDUK)}. ` +
    'Folder disusun mengikuti struktur penilaian: (1) bukti tingkat butir di subfolder butir-NN sesuai no urut 1–60 matriks APS-AV 2025; ' +
    '(2) bukti karya dosen dan mahasiswa (penelitian, PkM, publikasi, luaran, rekognisi) di subfolder per tahun dan per dosen, satu subfolder atau berkas per karya; ' +
    '(3) dokumen bernama (statuta, renstra, kurikulum, SK, perangkat SPMI, laporan, dan sebagainya) di subfolder per jenis dan tahun; dokumen tahun berbeda disimpan sebagai versi tersendiri, dan versi yang diganti pada tahun yang sama dipindah ke subfolder _arsip. ' +
    'Bukti umum dibagikan dengan akses "siapa pun yang memiliki tautan: Viewer", sehingga dapat dibuka asesor tanpa masuk akun. ' +
    'Bukti yang memuat data pribadi atau informasi internal disimpan privat dan dibuka dengan kata sandi yang diberikan program studi kepada asesor. ' +
    'Rekapitulasi disajikan pada Lampiran A (per butir LED), Lampiran B (per karya), Lampiran C (per tabel LKPS), dan Lampiran D (dokumen). ' +
    `Narahubung verifikasi bukti: ${isian(NARAHUBUNG)}.`));

  out.push(judulLampiran('Lampiran A. Indeks bukti per butir LED'));
  out.push(tabel(P, [['Butir', 'Judul', 'Bukti butir', 'Bukti karya'],
    ...Object.keys(C.skorButir).sort((a, b) => a - b).map(no => {
      const u = C.buktiButir(no), rk = C.rekapKarya(no);
      const tertaut = buktiButir(no, { dokumen: C.dokumen, butirBukti: C.butirBukti, ts: C.ts })
        .filter(x => x.url).map(x => ({ url: x.url, t: x.label }));
      const sel = u ? [{ url: u, t: 'folder butir' }, ...tertaut] : tertaut;
      return [no, C.judulButir[no] || '',
        sel.length ? { links: sel, t: sel.map(l => l.t).join('; ') } : { t: '[isi: tautan]', auto: true },
        rk && rk.n ? `${rk.ada}/${rk.n} karya (Lampiran B)` : '—'];
    })]));

  out.push(judulLampiran('Lampiran B. Bukti karya per butir'));
  out.push(para(run(`Karya mengikuti jendela TS yang sama dengan LKPS (TS ${C.ta}). Karya yang dihitung pada lebih dari satu butir hanya dicantumkan pada butir pertama.`,
    { sz: 18, warna: '595959' })));
  const sudah = new Set();
  Object.keys(C.skorButir).sort((a, b) => a - b).forEach(no => {
    const xs = C.daftarKarya(no);
    if (!xs || !xs.length) return;
    const baru = xs.filter(x => { const k = `${x.tahun}|${x.judul}`;
      if (sudah.has(k)) return false; sudah.add(k); return true; });
    out.push(para(run(`Butir ${no} · ${C.judulButir[no] || ''}`, { b: true }), { keep: true, before: 160 }));
    if (!baru.length){
      out.push(para(run(`Seluruh ${xs.length} karya butir ini sudah tercantum pada butir sebelumnya.`, { sz: 18 })));
      return;
    }
    out.push(tabel(P, [['Th', 'Karya', 'Bukti'],
      ...baru.map(x => [String(x.tahun ?? ''), x.judul || '',
        x.bukti && x.bukti.length
          ? { links: x.bukti.map(b => ({ url: b.url, t: b.label })), t: x.bukti.map(b => b.label).join('; ') }
          : { t: '[isi: tautan]', auto: true }])]));
    if (baru.length < xs.length)
      out.push(para(run(`${xs.length - baru.length} karya lain butir ini sudah tercantum pada butir sebelumnya.`, { sz: 18 })));
  });

  out.push(judulLampiran('Lampiran C. Indeks bukti LKPS per tabel'));
  out.push(tabel(P, [['Tabel LKPS', 'Bukti per baris', 'Butir', 'Tautan folder'],
    ...LKPS_TABEL.map(t => {
      const xs = buktiLembar(t.sheet, C);
      return [t.tabel, t.bukti, t.butir, xs.length ? { links: xs, t: xs.map(x => x.t).join('; ') } : { t: '[isi: tautan]', auto: true }];
    })]));

  out.push(judulLampiran('Lampiran D. Dokumen'));
  const dok = [];
  kelompokDokumen(C.dokumen, null, C.ts).forEach(g => {
    const semua = g.utama ? [g.utama, ...g.lain] : g.lain;
    semua.forEach(r => dok.push([g.nama, String(r.tahun), r.judul || '—',
      g.tunggal ? (r === g.utama ? 'berlaku' : 'versi lain') : '—',
      [...new Set((C.butirBukti || []).filter(b => b.dokumen_id === r.id || b.jenis_dokumen === r.jenis)
        .map(b => b.butir))].sort((a, b) => a - b).join(', ') || '—',
      { url: r.url, t: 'buka' }]));
  });
  out.push(dok.length
    ? tabel(P, [['Jenis', 'Tahun', 'Judul/nomor', 'Status', 'Butir', 'Tautan'], ...dok])
    : paraAuto('[isi: belum ada dokumen yang diunggah di halaman isi butir, bagian Dokumen].'));
  return out.join('');
}

// ---------------------------------------------------------------------
//  Titik sisip, berurutan seperti di template. `cari` = awal teks judul
//  subbagian; `k` = komponen butir (0 = I, 1 = II); `penanda` mengganti
//  kalimat petunjuk bila subbagian tidak memilikinya.
// ---------------------------------------------------------------------
const B = (cari, no, k = 0) => ({ cari, isi: (C, P) => blokButir(C, P, no, k) });
const KR = (kode) => {
  const K = KRITERIA[kode];
  return [
    { cari: 'Latar Belakang', isi: latar(K) },
    { cari: 'Kebijakan', isi: kebijakan(K) },
  ];
};
const AKHIR = kode => [
  { cari: 'Analisis Faktor Keberhasilan', isi: analisis(KRITERIA[kode]) },
  { cari: 'Strategi perbaikan dan pengembangan', isi: swot(KRITERIA[kode]) },
];

const SLOT = [
  { cari: 'KATA PENGANTAR', isi: blokUmum('pengantar') },
  { cari: 'RINGKASAN EKSEKUTIF', isi: blokUmum('ringkasan') },
  { cari: 'BAB I PENDAHULUAN', isi: blokUmum('pendahuluan') },
  { cari: 'Struktur Tim Penyusun dan Mekanisme Kerja', isi: C => blokUmum('tim')(C) + gambar('Struktur tim penyusun LED') },
  B('Analisis Lingkungan Eksternal dalam Pengembangan', '58', 0),
  // C.1
  ...KR('C1'),
  B('Kekhasan VMTS', '1'), B('Mekanisme Penyusunan VMTS', '2'),
  B('Tingkat pemahaman dan pencapaian VMTS', '3'),
  ...AKHIR('C1'),
  // C.2
  ...KR('C2'),
  B('Sistem Tata Pamong', '4', 0), B('Bagian ini menjelaskan perwujudan Good University', '4', 1),
  B('Komitmen pimpinan dan kemampuan', '5', 0), B('Bagian ini menjelaskan kemampuan manajerial', '5', 1),
  B('Relevansi kerja sama', '6'), B('Pelaksanaan kerja sama', '7'),
  B('Pengelolaan Keuangan', '8'), B('Biaya Operasional Pendidikan', '9'),
  B('Dana Penelitian', '10'), B('Dana PkM', '11'),
  ...AKHIR('C2'),
  // C.3
  ...KR('C3'),
  B('Pemutakhiran kurikulum', '12'),
  B('Profil lulusan', '13', 0), B('Kesesuaian CPL dengan profil lulusan', '13', 1),
  B('Kesesuaian CPL dengan standar kompetensi', '14', 0), B('Proses tinjauan rutin CPL', '14', 1),
  B('Ketersediaan dan kelengkapan dokumen RPS', '15', 0), B('Proses tinjauan rutin RPS', '15', 1),
  B('Proses pembelajaran untuk memastikan', '16', 0), B('Proses tinjauan rutin proses pembelajaran', '16', 1),
  B('Integrasi penelitian dan PkM dalam pembelajaran', '17'),
  B('Pembelajaran yang dilaksanakan dalam bentuk penugasan', '18'),
  B('Basic Sciences dan matematika', '19'),
  B('Proyek Rekayasa Penciri', '20'),
  B('Pengelolaan suasana akademik', '21', 0), B('Integritas dan kebebasan ilmiah', '21', 1),
  B('Kesesuaian penelitian dalam mendukung VMTS', '22'),
  B('Penelitian DTPS yang sesuai dengan Peta jalan', '23'),
  B('Kesesuaian PkM dalam mendukung VMTS', '24'),
  B('PkM DTPS yang sesuai dengan Peta jalan', '25'),
  ...AKHIR('C3'),
  // C.4
  ...KR('C4'),
  B('Kecukupan jumlah dosen tetap yang ditugaskan', '26'),
  B('Kualifikasi akademik DTPS', '27'), B('Jabatan akademik DTPS', '28'),
  B('Tenaga Kependidikan', '29'), B('Beban kerja DTPS', '30'),
  B('Kegiatan Penelitian', '31'), B('Kegiatan PkM', '32'),
  B('Publikasi ilmiah DTPS', '33'), B('Luaran penelitian dan PkM DTPS', '34'),
  B('Kinerja DTPS dalam mendukung keunggulan', '35'),
  B('Karya ilmiah DTPS yang disitasi', '36'),
  B('Pengakuan / rekognisi atas prestasi', '37'),
  ...AKHIR('C4'),
  // C.5
  ...KR('C5'),
  B('Sarana dan Prasarana', '38', 0),
  B('Bagian ini berisi deskripsi kecukupan serta mutu sarana dan prasarana untuk mendukung kegiatan non akademik', '38', 1),
  B('Keselamatan, Kesehatan Kerja', '39'),
  ...AKHIR('C5'),
  // C.6
  ...KR('C6'),
  B('Rasio jumlah mahasiswa terhadap jumlah DTPS', '40'), B('Persentase mahasiswa asing', '41'),
  B('IPK lulusan', '42'), B('Prestasi mahasiswa', '43'), B('Masa studi', '44'),
  B('Lulusan tepat waktu', '45'), B('Publikasi ilmiah mahasiswa', '46'),
  B('Luaran penelitian dan PkM yang dihasilkan mahasiswa', '47'),
  B('Tracer study', '48'), B('Waktu tunggu', '49'), B('Kesesuaian bidang kerja', '50'),
  B('Tingkat dan ukuran tempat kerja', '51'), B('Tingkat kepuasan pengguna lulusan', '52'),
  ...AKHIR('C6'),
  // C.7
  ...KR('C7'),
  B('Keberadaan unit penjaminan', '53', 0), B('Ketersediaan Perangkat SPMI', '53', 1),
  B('Indikator Kinerja Tambahan (IKT)', '54'),
  B('Keterlaksanaan penjaminan mutu', '55'), B('Evaluasi capaian kinerja', '56'),
  B('Kepuasan Pemangku kepentingan', '57'),
  ...AKHIR('C7'),
  // Bab III, IV, lampiran
  { cari: 'Analisis SWOT Semua', isi: (C, P) => blokButir(C, P, '58', 1) +
      Object.values(KRITERIA).map(K => para(run(K.nama, { b: true }), { keep: true }) + swot(K)(C, P)).join('') },
  B('Tujuan Strategis Pengembangan', '59'),
  B('Program Pengembangan Keberlanjutan', '60'),
  { cari: 'BAB IV. PENUTUP', isi: blokUmum('penutup') },
  { cari: 'LAMPIRAN', penanda: /dari LKPS/, isi: blokLampiran },
];

// ---------------------------------------------------------------------
//  Penelusuran dokumen
// ---------------------------------------------------------------------
const norm = s => String(s || '').replace(/\s+/g, ' ').replace(/\s*\/\s*/g, '/').trim()
  .replace(/^([ivx]+|[a-z]|\d+)\.\s+/i, '').toLowerCase();
const teks = p => [...p.getElementsByTagNameNS(NS.w, 't')].map(t => t.textContent).join('');
const adalahP = n => n.namespaceURI === NS.w && n.localName === 'p';
const gayaP = p => p.getElementsByTagNameNS(NS.w, 'pStyle')[0]?.getAttributeNS(NS.w, 'val') || '';
const adalahKotak = n => adalahP(n) && !teks(n).trim() &&
  (n.getElementsByTagNameNS(NS.w, 'drawing').length || n.getElementsByTagNameNS(NS.w, 'pict').length);
const PETUNJUK = /disampaikan oleh pengusul|diisi oleh pengusul/i;

function cari(mulai, uji, maks = Infinity){
  for (let n = mulai, i = 0; n && i < maks; n = n.nextElementSibling){
    if (!adalahP(n) || /^TOC/i.test(gayaP(n))) continue;
    i++;
    if (uji(n)) return n;
  }
  return null;
}

function fragmen(doc, xml){
  const f = new DOMParser().parseFromString(
    `<x xmlns:w="${NS.w}" xmlns:r="${NS.r}" xmlns:wp="${NS.wp}">${xml}</x>`, 'application/xml');
  if (f.getElementsByTagName('parsererror').length)
    throw new Error('XML sisipan tidak sah: ' + f.getElementsByTagName('parsererror')[0].textContent);
  return [...f.documentElement.childNodes].map(n => doc.importNode(n, true));
}

function sisipSetelah(doc, ref, xml){
  for (const n of fragmen(doc, xml)){ ref.parentNode.insertBefore(n, ref.nextSibling); ref = n; }
  return ref;
}

// Sorot kuning pada run yang sudah ada (isian sampul dan identitas).
// Urutan anak w:rPr diatur skema; highlight sebelum u … oMath.
const SESUDAH_SOROT = ['u', 'effect', 'bdr', 'shd', 'fitText', 'vertAlign', 'rtl', 'cs', 'em',
                       'lang', 'eastAsianLayout', 'specVanish', 'oMath'];
function sorotRun(r){
  const doc = r.ownerDocument;
  let pr = [...r.children].find(n => n.localName === 'rPr');
  if (!pr){ pr = doc.createElementNS(NS.w, 'w:rPr'); r.insertBefore(pr, r.firstChild); }
  if ([...pr.children].some(n => n.localName === 'highlight')) return;
  const h = doc.createElementNS(NS.w, 'w:highlight');
  h.setAttributeNS(NS.w, 'w:val', 'yellow');
  pr.insertBefore(h, [...pr.children].find(n => SESUDAH_SOROT.includes(n.localName)) || null);
}

function gantiTeksParagraf(p, isi){
  const ts = [...p.getElementsByTagNameNS(NS.w, 't')];
  if (!ts.length) return;
  ts.forEach((t, i) => { t.textContent = i ? '' : isi; });
  sorotRun(ts[0].parentNode);
}

function isiSampul(doc, C){
  const semua = [...doc.getElementsByTagNameNS(NS.w, 'p')];
  const prodi = C.D.prodi || '', pt = C.D.institusi || '';
  for (const p of semua){
    const n = norm(teks(p));
    if (prodi && n === 'program dan nama program studi')
      gantiTeksParagraf(p, `PROGRAM SARJANA ${prodi.toUpperCase()}`);
    else if (pt && n.startsWith('universitas/institut/'))
      gantiTeksParagraf(p, pt.toUpperCase());
    else if (/^tahun \.{3,}/.test(n))
      gantiTeksParagraf(p, `TAHUN ${new Date().getFullYear()}`);
  }
  // Identitas pengusul: hanya fakta yang ada di data.json.
  const isian = [['Perguruan Tinggi', pt], ['Jenis Program', 'Sarjana'], ['Nama Program Studi', prodi]];
  // Template sendiri: tabel label | : | nilai.
  const barisTabel = [...doc.getElementsByTagNameNS(NS.w, 'tr')];
  for (const [label, nilai] of isian){
    if (!nilai) continue;
    const tr = barisTabel.find(r => {
      const tc = r.getElementsByTagNameNS(NS.w, 'tc');
      return tc.length === 3 && teks(tc[0]).trim() === label;
    });
    if (tr){
      const p = tr.getElementsByTagNameNS(NS.w, 'tc')[2].getElementsByTagNameNS(NS.w, 'p')[0];
      const rr = doc.createElementNS(NS.w, 'w:r'), t = doc.createElementNS(NS.w, 'w:t');
      t.textContent = nilai; rr.appendChild(t); p.appendChild(rr); sorotRun(rr);
      continue;
    }
    // Template LAM lama: "Perguruan Tinggi : ......"
    const p = semua.find(p => teks(p).startsWith(label) && /\.{5,}/.test(teks(p)));
    const t = p && [...p.getElementsByTagNameNS(NS.w, 't')].find(t => /\.{5,}/.test(t.textContent));
    if (!t) continue;
    t.textContent = t.textContent.replace(/\.{5,}/, nilai);
    sorotRun(t.parentNode);
  }
}

function isiSel(tc, nilai){
  if (!nilai) return;
  const doc = tc.ownerDocument, p = tc.getElementsByTagNameNS(NS.w, 'p')[0];
  const rr = doc.createElementNS(NS.w, 'w:r'), t = doc.createElementNS(NS.w, 'w:t');
  t.textContent = nilai; rr.appendChild(t); p.appendChild(rr); sorotRun(rr);
}

// Halaman IDENTITAS PENGUSUL dan sampul. Isian dari kelompok Identitas di Narasi LED,
// akreditasi dan daftar prodi dari Data prodi (sama dengan lembar PS di LKPS).
function isiIdentitas(doc, C){
  const baris = [...doc.getElementsByTagNameNS(NS.w, 'tr')];
  const isiBaris = (label, nilai) => {
    const tr = baris.find(r => {
      const tc = r.getElementsByTagNameNS(NS.w, 'tc');
      return tc.length === 3 && teks(tc[0]).trim().startsWith(label);
    });
    if (tr) isiSel(tr.getElementsByTagNameNS(NS.w, 'tc')[2], nilai);
  };
  ISIAN_IDENTITAS.forEach(l => isiBaris(l, nilaiIdentitas(C.narasi, l)));
  const prodi = daftarProdi(C.daftar || {}, C.D.prodi, C.ts);
  const utama = prodi.find(x => x.diakreditasi);
  const sk = x => [x.nomor_sk, tglTeks(x.tanggal_sk)].filter(Boolean).join(', ');
  if (utama){
    isiBaris('Peringkat Terbaru Akreditasi PS', STATUS_PS[utama.status_akreditasi]);
    isiBaris('Nomor SK Akreditasi Terakhir', sk(utama));
  }

  const body = doc.getElementsByTagNameNS(NS.w, 'body')[0];
  const judul = [...body.children].find(n => adalahP(n) && teks(n).trim().startsWith('Daftar Program Studi di Unit'));
  const tabel = judul?.nextElementSibling;
  if (tabel?.localName === 'tbl' && prodi.length){
    const rows = [...tabel.getElementsByTagNameNS(NS.w, 'tr')];
    const i1 = rows.findIndex(r => teks(r.getElementsByTagNameNS(NS.w, 'tc')[0]).trim() === '1' &&
                                   teks(r.getElementsByTagNameNS(NS.w, 'tc')[1]).trim() === '');
    const jumlah = rows.find(r => teks(r.getElementsByTagNameNS(NS.w, 'tc')[0]).trim() === 'Jumlah');
    if (i1 >= 0 && jumlah){
      const contoh = rows[i1];
      rows.slice(i1).filter(r => r !== jumlah).forEach(r => r.parentNode.removeChild(r));
      prodi.forEach((x, i) => {
        const tr = contoh.cloneNode(true);
        jumlah.parentNode.insertBefore(tr, jumlah);
        const tc = [...tr.getElementsByTagNameNS(NS.w, 'tc')];
        [...tc[0].getElementsByTagNameNS(NS.w, 't')].forEach((t, k) => { t.textContent = k ? '' : String(i + 1); });
        [x.jenis_program, x.nama_prodi, STATUS_PS[x.status_akreditasi], sk(x), tglTeks(x.tanggal_kedaluwarsa),
         x.mahasiswa == null ? '' : String(x.mahasiswa)].forEach((v, k) => isiSel(tc[k + 1], v));
      });
      const ada = prodi.filter(x => x.mahasiswa != null);
      const tcJumlah = [...jumlah.getElementsByTagNameNS(NS.w, 'tc')];
      if (ada.length) isiSel(tcJumlah[tcJumlah.length - 1], String(ada.reduce((a, x) => a + +x.mahasiswa, 0)));
    }
  }

  const ps = [...body.children].filter(adalahP);
  const kota = nilaiIdentitas(C.narasi, KOTA_PT), upps = nilaiIdentitas(C.narasi, ISIAN_IDENTITAS[0]);
  const pKota = ps.find(p => norm(teks(p)).startsWith('nama kota kedudukan'));
  if (kota && pKota) gantiTeksParagraf(pKota, kota.toUpperCase());
  const pTitik = ps.slice(0, 12).find(p => /^\.{10,}$/.test(teks(p).trim()));
  if (upps && pTitik) gantiTeksParagraf(pTitik, upps.toUpperCase());
}

// Halaman IDENTITAS TIM PENYUSUN: satu kotak per anggota, urut susunan tim.
// Templat punya 4 kotak; yang lebih dihapus, yang kurang disalin. Tanggal dan
// tanda tangan diisi saat menandatangani. Tanpa anggota: templat utuh.
function isiIdentitasTim(doc, tim){
  const body = doc.getElementsByTagNameNS(NS.w, 'body')[0];
  const kotak = [...body.children]
    .filter(n => adalahP(n) && /^Penyusun \d+$/.test(teks(n).trim()) && n.nextElementSibling?.localName === 'tbl')
    .map(judul => ({ judul, tabel: judul.nextElementSibling }));
  if (!tim.length || !kotak.length) return;
  while (kotak.length < tim.length){
    const akhir = kotak[kotak.length - 1], sesudah = akhir.tabel.nextSibling;
    const judul = akhir.judul.cloneNode(true), tabel = akhir.tabel.cloneNode(true);
    const ts = [...judul.getElementsByTagNameNS(NS.w, 't')];
    ts.forEach((t, i) => { t.textContent = i ? '' : `Penyusun ${kotak.length + 1}`; });
    body.insertBefore(judul, sesudah);
    body.insertBefore(tabel, sesudah);
    kotak.push({ judul, tabel });
  }
  kotak.splice(tim.length).forEach(k => { body.removeChild(k.judul); body.removeChild(k.tabel); });
  tim.forEach((d, i) => {
    for (const [label, nilai] of [['Nama', d.nama], ['NIDN / NUPTK', d.nomor], ['Jabatan', d.jabatan]]){
      const tr = [...kotak[i].tabel.getElementsByTagNameNS(NS.w, 'tr')].find(r =>
        teks(r.getElementsByTagNameNS(NS.w, 'tc')[0]).trim() === label);
      if (tr) isiSel(tr.getElementsByTagNameNS(NS.w, 'tc')[2], nilai);
    }
  });
}

// Tabel 2.1 (dosen) dan 2.2 (nondosen): No, nama, nomor, jabatan, deskripsi kerja.
// Baris contoh templat diganti satu baris per anggota; tanpa anggota: templat utuh.
function isiTabelTim(doc, awalJudul, tim){
  const body = doc.getElementsByTagNameNS(NS.w, 'body')[0];
  const judul = [...body.children].find(n => adalahP(n) && teks(n).trim().startsWith(awalJudul));
  const tabel = judul?.nextElementSibling;
  if (!tim.length || tabel?.localName !== 'tbl') return;
  const baris = [...tabel.getElementsByTagNameNS(NS.w, 'tr')], contoh = baris[1];
  baris.slice(1).forEach(r => r.parentNode.removeChild(r));
  tim.forEach((d, i) => {
    const tr = contoh.cloneNode(true);
    tabel.appendChild(tr);
    const tc = [...tr.getElementsByTagNameNS(NS.w, 'tc')];
    [...tc[0].getElementsByTagNameNS(NS.w, 't')].forEach((t, k) => { t.textContent = k ? '' : String(i + 1); });
    [d.nama, d.nomor, d.jabatan, d.deskripsi].forEach((v, k) => isiSel(tc[k + 1], v));
  });
}

function ukuranPng(buf){
  const dv = new DataView(buf);
  return { w: dv.getUint32(16), h: dv.getUint32(20) };
}

// ---------------------------------------------------------------------
//  Utama
// ---------------------------------------------------------------------
export async function buatLED(C, opsi = {}){
  const { default: JSZip } = await import(JSZIP);
  const [tR, lR] = await Promise.all([fetch(TEMPLATE, { cache: 'no-cache' }), fetch(LOGO)]);
  if (!tR.ok) throw new Error(`${TEMPLATE} tidak terbaca (HTTP ${tR.status})`);
  const zip = await JSZip.loadAsync(await tR.arrayBuffer());
  const doc = new DOMParser().parseFromString(
    await zip.file('word/document.xml').async('string'), 'application/xml');
  const relsPath = 'word/_rels/document.xml.rels';
  const rels = new DOMParser().parseFromString(await zip.file(relsPath).async('string'), 'application/xml');
  if (doc.getElementsByTagName('parsererror').length || rels.getElementsByTagName('parsererror').length)
    throw new Error('Template LED tidak bisa dibaca sebagai XML.');

  C = { ...C,
    angka: v => C.f2(v).replace('.', ','),
    // TS berjalan 1 Sep s.d. 31 Agu: datanya belum lengkap, jadi arah tren tidak disebut.
    tsMasihBerjalan: C.ts >= new Date().getFullYear() + (new Date().getMonth() >= 8 ? 1 : 0),
    ta: C.taDari(C.ts), ta2: C.taDari(C.ts - 2),
    P: { ps: `Program Studi ${C.D.prodi || '[isi: nama program studi]'}`,
         pt: C.D.institusi || '[isi: nama perguruan tinggi]', ...faktaNarasi(C) } };
  const P = { daftar: [], link(url){ const id = `rIdLed${this.daftar.length + 1}`;
    this.daftar.push({ id, url }); return id; } };
  P_AKTIF = P;
  const body = doc.getElementsByTagNameNS(NS.w, 'body')[0];

  isiSampul(doc, C);
  isiIdentitas(doc, C);
  const tim = anggotaTim(C.daftar?.tim, C.daftar?.dosen);
  isiIdentitasTim(doc, tim);
  isiTabelTim(doc, 'Tabel 2.1', tim.filter(d => d.jenis === 'dosen'));
  isiTabelTim(doc, 'Tabel 2.2', tim.filter(d => d.jenis === 'nondosen'));

  // Logo di sampul menggantikan kotak "Logo Perguruan Tinggi".
  let logoOk = false;
  if (lR.ok){
    const buf = await lR.arrayBuffer();
    const kotak = [...body.children].find(n => adalahP(n) && teks(n).includes('Logo Perguruan Tinggi'));
    if (kotak){
      const { w, h } = ukuranPng(buf);
      const [baru] = fragmen(doc, paraLogo(LOGO_LEBAR_EMU, Math.round(LOGO_LEBAR_EMU * h / w)));
      body.replaceChild(baru, kotak);
      zip.file('word/media/logo_uper_led.png', buf);
      logoOk = true;
    }
  }

  // Grafik data dibuat lebih dulu (PNG asinkron), disisipkan oleh blokData.
  C.grafik = {}; C.nomorGambar = 0;
  for (const no of BUTIR_GRAFIK){
    const spec = grafikButir(no, C.D, C.ts);
    if (!spec) continue;
    const { buf, w, h } = await gambarGrafik(spec);
    zip.file(`word/media/led_grafik_${no}.png`, buf);
    C.grafik[no] = { spec, rid: `rIdLedG${no}`, cx: GRAFIK_LEBAR_EMU, cy: Math.round(GRAFIK_LEBAR_EMU * h / w) };
  }

  const gagal = [];
  let kursor = body.firstElementChild;
  for (const s of SLOT){
    const kunci = norm(s.cari);
    const h = cari(kursor, p => norm(teks(p)).startsWith(kunci));
    if (!h){ gagal.push(s.cari); continue; }
    let a = cari(h, p => (s.penanda || PETUNJUK).test(teks(p)), 30);
    if (!a){ gagal.push(`${s.cari} (kalimat petunjuk)`); kursor = h.nextElementSibling; continue; }
    // Petunjuk yang terpecah dua paragraf ("… Doktor Terapan" lalu
    // "/ Program Profesi Insinyur).") dilewati sampai habis, lalu kotak isian.
    while (a.nextElementSibling && adalahP(a.nextElementSibling) &&
           teks(a.nextElementSibling).trim().startsWith('/')) a = a.nextElementSibling;
    while (a.nextElementSibling && adalahKotak(a.nextElementSibling)) a = a.nextElementSibling;
    const xml = s.isi(C, P);
    kursor = (xml ? sisipSetelah(doc, a, xml) : a).nextElementSibling;
  }

  // Catatan draf di halaman pertama.
  const catatan = para(
    run('DRAF OTOMATIS — hapus paragraf ini sebelum dikirim. ', { b: true, warna: 'C00000' }) +
    run(`Dibuat ${new Date().toLocaleString('id-ID')} dari halaman skor (versi ${C.versi}), TS ${C.ta}. ` +
      'Teks bersorot kuning adalah draf yang wajib diperiksa; [isi: …] merah wajib diisi prodi; ' +
      'tabel data, grafik, dan tautan bukti diambil langsung dari sistem; skor penilaian sendiri tidak dimuat (lihat halaman skor). ' +
      'Perbarui daftar isi lewat klik kanan > Update Field.' +
      (gagal.length ? ` Subbagian yang tidak ditemukan di template dan belum terisi: ${gagal.join('; ')}.` : '') +
      (logoOk ? '' : ' Logo belum terpasang.'), { sz: 18 }),
    { kotak: 'FDE9E7', ind: 0 });
  for (const n of fragmen(doc, catatan).reverse()) body.insertBefore(n, body.firstChild);

  // Relasi: tautan luar dan logo.
  const akar = rels.documentElement;
  const tambahRel = (id, type, target, luar) => {
    const e = rels.createElementNS(NS.pr, 'Relationship');
    e.setAttribute('Id', id); e.setAttribute('Type', type); e.setAttribute('Target', target);
    if (luar) e.setAttribute('TargetMode', 'External');
    akar.appendChild(e);
  };
  const RT = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/';
  P.daftar.forEach(x => tambahRel(x.id, RT + 'hyperlink', x.url, true));
  if (logoOk) tambahRel('rIdLedLogo', RT + 'image', 'media/logo_uper_led.png', false);
  Object.entries(C.grafik).forEach(([no, g]) => tambahRel(g.rid, RT + 'image', `media/led_grafik_${no}.png`, false));

  const ser = new XMLSerializer();
  zip.file('word/document.xml', ser.serializeToString(doc));
  zip.file(relsPath, ser.serializeToString(rels));
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

  const tgl = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const nama = `LED-draf-${(C.D.prodi || 'prodi').replace(/\s+/g, '-')}-TS${C.ts}-${tgl}.docx`;
  if (opsi.unduh === false) return { nama, gagal, logoOk, blob };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = nama;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  return { nama, gagal, logoOk };
}
