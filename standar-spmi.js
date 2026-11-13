// Standar SPMI dan siklus PPEPP (pemilik 2026-11-12; 67-patch-standar-spmi.sql).
// Sumber standar: rekap standar SPM universitas ("Draft Rekap Standar", .xlsx): satu
// lembar per standar, satu baris per butir berkode (mis. A.01.02a), target per TS.
// Dipakai data-prodi.html (impor), siklus-ppepp.html, dan kelengkapan.js.
import { nilaiCapaian, perluAnalisis } from './capaian-iku.js?v=2026-11-13-e738fd';
export { perluAnalisis };

// TS = 1 September s.d. 31 Agustus; nilainya tahun akhir (2026 untuk 2025/2026).
export const tsDariTanggal = d => { const [y, m] = String(d || '').split('-').map(Number); return y ? (m >= 9 ? y + 1 : y) : null; };
export const labelTS = ts => `${ts - 1}/${ts}`;

// ---- Lembar rekap SPM. Situs ini khusus LAM Teknik (pemilik 2026-11-12): lembar
// akreditasi LAM lain tidak ditawarkan; lembar unit lain ditawarkan tanpa centang.
const LEMBAR_LAM_LAIN = /LAMSAMA|LAMSPAK|LAM ?INFOKOM|LAMEMBA|BAN-?PT|DEPILAR/i;
const LEMBAR_BAWAAN = /^(pendidikan|penelitian|pkm|iku pt)$|LAMTEK/i;
export function pilihanLembar(nama){
  if (/^daftar tabel$/i.test(String(nama).trim())) return 'daftar';
  if (LEMBAR_LAM_LAIN.test(nama)) return 'lain';
  return LEMBAR_BAWAAN.test(String(nama).trim()) ? 'bawaan' : 'pilihan';
}

const bersih = v => String(v ?? '').replace(/ /g, ' ').replace(/\t/g, ' ').split('\n')
  .map(s => s.replace(/ {2,}/g, ' ').trim()).filter(Boolean).join('\n');
const pendek = (s, n) => (s = s.replace(/\n/g, ' ')).length > n ? s.slice(0, n - 1) + '…' : s;
// Kode butir: huruf.nn.nn[huruf]. Penulisan tak baku di rekap (mis. "A.03.6a", "O.04. 13")
// dinormalkan: spasi dibuang, angka dua digit. Hasil '' bila bukan kode.
export function kodeButir(v){
  const m = String(v ?? '').replace(/\s+/g, '').match(/^([A-Z])\.(\d{1,2})\.(\d{1,2})([a-z]?)$/);
  return m ? `${m[1]}.${m[2].padStart(2, '0')}.${m[3].padStart(2, '0')}${m[4]}` : '';
}

/** Nama sub-standar dari lembar "Daftar Tabel": { 'A.01': 'Standar Luaran Pendidikan', ... }. */
export function petaSub(rows){
  const peta = {};
  let huruf = '', nama = '';
  for (const r of rows || []) {
    const h = bersih(r[0]), n = bersih(r[1]), no = String(r[2] ?? '').trim(), ket = bersih(r[3]);
    if (/^[A-Z]$/.test(h)) { huruf = h; nama = n || nama; }
    if (huruf && /^\d+$/.test(no)) peta[`${huruf}.${no.padStart(2, '0')}`] = ket || nama;
  }
  return peta;
}

/**
 * Butir standar satu lembar. rows = sheet_to_json(header:1, raw:false). Hasil:
 * [{ kode, induk, sub, lembar, pernyataan, luaran, pic, referensi, target: { ts: teks } }]
 * Baris tanpa kode di bawah butir = rincian butir itu (mis. target per jenjang).
 */
export function bacaLembarStandar(nama, rows, sub = {}){
  const iKepala = (rows || []).findIndex(r => (r || []).some(c => /^butir standar$/i.test(bersih(c))));
  if (iKepala < 0) return [];
  const kepala = rows[iKepala].map(c => bersih(c).toLowerCase());
  const kol = t => kepala.findIndex(c => c.startsWith(t));
  const K = { induk: kol('standar'), kode: kol('butir standar'), pernyataan: kol('pernyataan'), luaran: kol('jenis luaran'),
              pic1: kol('pic 1'), pic2: kol('pic 2'), ref: kol('referensi') };
  const kolTS = [];
  (rows[iKepala + 1] || []).forEach((c, i) => { const m = bersih(c).match(/^(\d{4})\s*\/\s*(\d{4})$/); if (m && +m[2] === +m[1] + 1) kolTS.push([i, +m[2]]); });
  const hasil = [];
  let induk = '', cur = null;
  const ambil = (r, i) => (i < 0 ? '' : bersih(r[i]));
  for (const r of rows.slice(iKepala + 2)) {
    if (!r || !r.some(c => bersih(c))) continue;
    if (ambil(r, K.induk)) induk = ambil(r, K.induk).replace(/\n/g, ' ');
    const kode = kodeButir(r[K.kode]);
    const bagian = { luaran: ambil(r, K.luaran), target: Object.fromEntries(kolTS.map(([i, ts]) => [ts, bersih(r[i])])) };
    const pic = [ambil(r, K.pic1), ambil(r, K.pic2)].filter(Boolean);
    if (kode) {
      cur = { kode, induk, sub: sub[kode.slice(0, 4)] || nama, lembar: nama, pernyataan: ambil(r, K.pernyataan),
              referensi: ambil(r, K.ref), pic: new Set(pic), bagian: [bagian] };
      hasil.push(cur);
    } else if (cur) {
      cur.bagian.push(bagian);
      pic.forEach(p => cur.pic.add(p));
      if (!cur.pernyataan && ambil(r, K.pernyataan)) cur.pernyataan = ambil(r, K.pernyataan);
    }
  }
  return hasil.map(b => {
    const target = {};
    for (const [, ts] of kolTS) {
      const isi = b.bagian.filter(x => x.target[ts]);
      if (!isi.length) continue;
      target[ts] = b.bagian.length === 1 || new Set(isi.map(x => x.target[ts])).size === 1 && isi.length === b.bagian.length
        ? isi[0].target[ts]
        // Label rincian = baris terakhir jenis luaran (mis. "b. Sarjana"); baris di atasnya uraian umum.
        : isi.map(x => (x.luaran ? `${pendek(x.luaran.split('\n').pop(), 60)}: ` : '') + x.target[ts]).join('\n');
    }
    return { kode: b.kode, induk: b.induk || null, sub: b.sub, lembar: b.lembar, pernyataan: b.pernyataan || b.kode,
             luaran: b.bagian.map(x => x.luaran).filter(Boolean).join('\n') || null, pic: [...b.pic].join('; ') || null,
             referensi: b.referensi || null, target };
  });
}

/** Seluruh buku: { lembar: [{ nama, jenis, butir: [...] }] }. buku = { NamaLembar: rows }. */
export function bacaRekapSPM(buku){
  const nama = Object.keys(buku || {});
  const daftar = nama.find(n => pilihanLembar(n) === 'daftar');
  const sub = daftar ? petaSub(buku[daftar]) : {};
  return { lembar: nama.filter(n => pilihanLembar(n) !== 'daftar')
    .map(n => ({ nama: n, jenis: pilihanLembar(n), butir: bacaLembarStandar(n, buku[n], sub) })).filter(l => l.butir.length) };
}

/**
 * Rencana impor untuk lembar terpilih. lama = baris spmi_standar. Butir lama yang tidak ada di
 * berkas tidak dihapus (bisa ditandai tidak berlaku). Hasil: { baru, ubah, sama, hilang, target, ganda }.
 */
export function rencanaImporSPM(butir, lama){
  const per = new Map((lama || []).map(r => [r.kode, r]));
  const ada = new Set(), ganda = [];
  const KOL = ['induk', 'sub', 'lembar', 'pernyataan', 'luaran', 'pic', 'referensi'];
  const baru = [], ubah = [], sama = [];
  for (const b of butir) {
    if (ada.has(b.kode)) { ganda.push(b.kode); continue; }
    ada.add(b.kode);
    const l = per.get(b.kode);
    if (!l) baru.push(b);
    else if (KOL.some(k => (l[k] ?? null) !== (b[k] ?? null))) ubah.push({ ...b, id: l.id });
    else sama.push({ ...b, id: l.id });
  }
  const pilihLembar = new Set(butir.map(b => b.lembar));
  const hilang = (lama || []).filter(r => r.asal !== 'prodi' && pilihLembar.has(r.lembar) && !ada.has(r.kode));
  const target = [...baru, ...ubah, ...sama].reduce((n, b) => n + Object.keys(b.target).length, 0);
  return { baru, ubah, sama, hilang, target, ganda };
}

/** Pantauan per lembar (pemilik 2026-11-12): [{ lembar, total, dipantau }] urut nama; standar prodi = "Standar prodi". */
// Penanggung jawab tingkat prodi di kolom PIC rekap SPM: Dekan (UPPS) atau Kaprodi (pemilik 2026-11-13).
export const PIC_PRODI = ['dekan', 'kaprodi'];
export const picProdi = r => String(r?.pic || '').split(/[;,]/).some(p => PIC_PRODI.includes(p.trim().toLowerCase()));

// Hasil per lembar: { lembar, total, dipantau, picProdi (butir ber-PIC prodi), hanyaProdi (yang dipantau = tepat butir ber-PIC prodi) }.
export function ringkasLembar(rows){
  const per = new Map();
  for (const r of rows || []) {
    const l = r.lembar || (r.asal === 'prodi' ? 'Standar prodi' : '(tanpa lembar)');
    const x = per.get(l) || { lembar: l, total: 0, dipantau: 0, picProdi: 0, hanyaProdi: true };
    const pantau = r.dipantau !== false, prodi = picProdi(r);
    x.total++; if (pantau) x.dipantau++; if (prodi) x.picProdi++;
    if (pantau !== prodi) x.hanyaProdi = false;
    per.set(l, x);
  }
  return [...per.values()].sort((a, b) => a.lembar.localeCompare(b.lembar));
}

// ---- c. Siklus PPEPP per butir standar untuk satu TS.
// X = { standar, capaian, revisi, target (IKU dengan capaian efektif), temuan, rapat }.
// Status tahap: 'ada' (bukti lengkap), 'kurang' (perlu dilengkapi), 'na' (tidak perlu / tidak ada).
export const TAHAP = [['penetapan', 'Penetapan'], ['pelaksanaan', 'Pelaksanaan'], ['evaluasi', 'Evaluasi'],
  ['pengendalian', 'Pengendalian'], ['peningkatan', 'Peningkatan']];
export const STATUS_CAPAIAN = [['tercapai', 'Tercapai'], ['belum', 'Belum tercapai'], ['tidak_berlaku', 'Tidak berlaku bagi prodi']];
const isi = v => !!String(v ?? '').trim();

export function tahapButir(s, c, X, ts){
  const tem = (X.temuan || []).filter(t => +t.tahun_ts === +ts && +t.standar_id === +s.id);
  const rev = (X.revisi || []).filter(v => +v.standar_id === +s.id && tsDariTanggal(v.tanggal) === +ts);
  const iku = (X.target || []).filter(r => +r.tahun_ts === +ts && +r.standar_id === +s.id).map(r => ({ ...r, _st: nilaiCapaian(r).status }));
  // Tindak lanjut evaluasi pembelajaran (68-patch-evaluasi-pembelajaran.sql); TS dari tahun akademik evaluasinya.
  const tev = (X.tindakEval || []).filter(t => +t.standar_id === +s.id
    && +String(t.evaluasi_mk?.tahun_akademik || '').slice(5) === +ts);
  if (c?.status === 'tidak_berlaku') {
    const na = { status: 'na', ket: 'tidak berlaku bagi prodi' };
    return { tahap: Object.fromEntries(TAHAP.map(([k]) => [k, na])), temuan: tem, revisi: rev, iku, tindakEval: tev };
  }
  const ikuBelum = iku.filter(r => r._st === 'belum' || r._st === 'hampir');
  const perlu = (c?.status === 'belum' ? 1 : 0) + tem.length + ikuBelum.length + tev.length;
  const kurangRencana = (c?.status === 'belum' && !isi(c.rencana) ? 1 : 0) + tem.filter(t => !isi(t.rencana)).length
    + ikuBelum.filter(r => !isi(r.rencana_perbaikan)).length;
  const tahap = {
    penetapan: isi(c?.target) ? { status: 'ada', ket: `target: ${pendek(c.target, 80)}` } : { status: 'kurang', ket: 'target TS ini belum ada' },
    pelaksanaan: isi(c?.bukti_url) || c?.dokumen_id ? { status: 'ada', ket: 'bukti pelaksanaan tercatat' }
      : { status: 'kurang', ket: 'bukti pelaksanaan belum ada' },
    evaluasi: (c?.status === 'tercapai' || c?.status === 'belum') ? { status: 'ada', ket: c.status === 'tercapai' ? 'tercapai' : 'belum tercapai' }
      : tem.length || tev.length ? { status: 'ada', ket: [tem.length ? `${tem.length} temuan AMI` : '', tev.length ? `${tev.length} tindak lanjut evaluasi pembelajaran` : '']
        .filter(Boolean).join('; ') } : { status: 'kurang', ket: 'capaian belum dinilai' },
    pengendalian: !perlu ? { status: 'na', ket: 'tidak ada yang perlu dikendalikan' }
      : kurangRencana ? { status: 'kurang', ket: `${kurangRencana} dari ${perlu} belum punya rencana perbaikan/tindak lanjut` }
      : { status: 'ada', ket: `${perlu} punya rencana perbaikan/tindak lanjut` },
    peningkatan: rev.length ? { status: 'ada', ket: `${rev.length} revisi standar` } : { status: 'na', ket: 'tidak ada revisi pada TS ini' },
  };
  return { tahap, temuan: tem, revisi: rev, iku, tindakEval: tev };
}

export function siklusPPEPP(X, ts){
  const akhirTS = `${ts}-08-31`;
  const cap = new Map((X.capaian || []).filter(c => +c.tahun_ts === +ts).map(c => [+c.standar_id, c]));
  const baris = (X.standar || [])
    .filter(s => s.dipantau !== false && s.aktif !== false && (!s.berlaku_sejak || String(s.berlaku_sejak) <= akhirTS))
    .map(s => ({ standar: s, capaian: cap.get(+s.id) || null, ...tahapButir(s, cap.get(+s.id), X, ts) }));
  const hitung = Object.fromEntries(TAHAP.map(([k]) => [k, { ada: 0, kurang: 0, na: 0 }]));
  baris.forEach(b => TAHAP.forEach(([k]) => { hitung[k][b.tahap[k].status]++; }));
  const rtm = (X.rapat || []).filter(r => r.jenis === 'rtm' && tsDariTanggal(r.tanggal) === +ts);
  const lepas = { iku: (X.target || []).filter(r => +r.tahun_ts === +ts && !r.standar_id).length,
                  temuan: (X.temuan || []).filter(t => +t.tahun_ts === +ts && !t.standar_id).length };
  return { ts, baris, hitung, rtm, lepas, lengkap: baris.filter(b => TAHAP.every(([k]) => b.tahap[k].status !== 'kurang')).length };
}

/** TS yang punya data siklus, terbaru dulu; selalu memuat TS berjalan. */
export function tsSiklus(X, kini = new Date()){
  const s = new Set([tsDariTanggal(kini.toISOString().slice(0, 10))]);
  (X.capaian || []).forEach(c => s.add(+c.tahun_ts));
  (X.temuan || []).forEach(r => s.add(+r.tahun_ts));
  (X.revisi || []).forEach(r => s.add(tsDariTanggal(r.tanggal)));
  return [...s].filter(Boolean).sort((a, b) => b - a);
}
