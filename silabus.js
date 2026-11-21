// Silabus mata kuliah (129-patch-silabus.sql, pemilik 2026-11-20): kolom isian, pemeriksaan kelengkapan, CPL terkait,
// rencana impor isi awal, dan isi Word "Lampiran: Silabus Mata Kuliah" dokumen kurikulum (bentuk Lampiran Kurikulum SIAKUP,
// dua bahasa). Fungsi murni; halaman: silabus.html.
import { para, run, judul, tabel } from './docx-dasar.js?v=2026-11-21-2ea609';
import { susunanMK, jenisMK } from './rps.js?v=2026-11-21-2ea609';

const t = s => String(s ?? '').trim();

/** Kolom isian (kunci data, label, wajib saat diajukan, baris textarea). Sama dengan silabus_rapikan / silabus_ajukan. */
export const KOLOM_SILABUS = [
  { k: 'nama_en', l: 'Nama MK (Inggris)', wajib: true, baris: 1 },
  { k: 'tujuan', l: 'Tujuan umum mata kuliah', wajib: true, baris: 5 },
  { k: 'tujuan_en', l: 'Tujuan umum (Inggris)', wajib: true, baris: 5 },
  { k: 'deskripsi', l: 'Deskripsi mata kuliah (termasuk pokok bahasan)', wajib: true, baris: 9 },
  { k: 'deskripsi_en', l: 'Deskripsi (Inggris)', wajib: true, baris: 9 },
  { k: 'prasyarat', l: 'Prasyarat (kode/nama MK; kosong = tidak ada)', wajib: false, baris: 1 },
  { k: 'bersamaan', l: 'MK bersamaan (co-requisite; kosong = tidak ada)', wajib: false, baris: 1 },
  { k: 'pustaka', l: 'Pustaka (satu per baris)', wajib: true, baris: 6 },
];
export const BATAS = { nama_en: 200, tujuan: 4000, tujuan_en: 4000, deskripsi: 8000, deskripsi_en: 8000, prasyarat: 500, bersamaan: 500,
  pustaka: 8000, catatan_impor: 2000 };
export const STATUS_SILABUS = { belum: 'Belum dibuat', draf: 'Draf', diajukan: 'Diajukan', dikembalikan: 'Dikembalikan', disahkan: 'Disahkan' };

/** Isian dirapikan seperti silabus_rapikan di basis data (kunci dikenal saja, teks dipangkas). */
export function rapikanSilabus(d = {}){
  const out = { versi: '1' };
  for (const k of Object.keys(BATAS)) out[k] = t(d?.[k]);
  return out;
}

/** Label kolom wajib yang masih kosong (urutan sama dengan silabus_ajukan). */
export const kekuranganSilabus = d => KOLOM_SILABUS.filter(c => c.wajib && !t(d?.[c.k])).map(c => c.l);

/** Status kemajuan satu MK: belum | draf | diajukan | dikembalikan | disahkan; revisi berjalan = draf dengan revisi > 0. */
export const statusSilabus = s => (s ? s.status : 'belum');

/** MK berpenyelenggara universitas (MKU, MKPT, Kalkulus, Fisika Dasar, ...): silabusnya dari universitas. Pemilik 2026-11-20:
 *  tetap tampil, boleh diisi (disalin dari universitas), ikut lampiran dan angka kemajuan; hanya impor isi awal yang
 *  melewatinya (silabus lama prodi untuk MK ini sengaja dihapus). */
export const dariUniversitas = m => m?.unit_penyelenggara === 'universitas';

/** CPL terkait MK (urut kurikulum) dari peta MK-CPL dan daftar CPL: [{ kode, rumusan, rumusan_en }]. */
export function cplTerkait(kur, kode, peta = [], refCpl = []){
  const ada = new Set(peta.filter(p => p.kurikulum === kur && p.kode_mk === kode).map(p => p.cpl));
  return refCpl.filter(c => c.kurikulum === kur && ada.has(c.kode))
    .sort((a, b) => (a.urutan ?? 100) - (b.urutan ?? 100) || String(a.kode).localeCompare(String(b.kode)))
    .map(c => ({ kode: c.kode, rumusan: t(c.rumusan), rumusan_en: t(c.rumusan_en) }));
}

const normNama = s => t(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Rencana impor isi awal (berkas JSON dari Lampiran SIAKUP): { kurikulum, silabus: [{ kode | null, nama, data }] }.
 * Kode null (kode baru belum resmi) dicocokkan dengan nama MK kurikulum itu (unik). Hasil:
 * { baris: [{ kode, data }], sudahAda: [kode], tanpaMk: [{ kode, nama }], ganda: [nama] }.
 */
export function rencanaImpor(berkas, mk = [], silabus = new Map()){
  const kur = t(berkas?.kurikulum);
  if (!kur || !Array.isArray(berkas?.silabus)) throw new Error('Berkas impor harus berisi "kurikulum" dan daftar "silabus".');
  const mkKur = mk.filter(m => m.kurikulum === kur);
  const kodeAda = new Set(mkKur.map(m => m.kode));
  const perNama = new Map();
  for (const m of mkKur) { const n = normNama(m.nama); perNama.set(n, perNama.has(n) ? null : m.kode); }
  const out = { kurikulum: kur, baris: [], sudahAda: [], tanpaMk: [], ganda: [], universitas: [] };
  const dipakai = new Set();
  for (const s of berkas.silabus) {
    let kode = t(s.kode);
    if (!kode) {
      const k = perNama.get(normNama(s.nama));
      if (k === null) { out.ganda.push(t(s.nama)); continue; }
      kode = k || '';
    }
    if (!kode || !kodeAda.has(kode)) { out.tanpaMk.push({ kode: t(s.kode), nama: t(s.nama) }); continue; }
    if (dariUniversitas(mkKur.find(m => m.kode === kode))) { out.universitas.push(kode); continue; }
    if (dipakai.has(kode)) { out.ganda.push(`${kode} ${t(s.nama)}`); continue; }
    dipakai.add(kode);
    if (silabus.has(`${kur}|${kode}`)) { out.sudahAda.push(kode); continue; }
    out.baris.push({ kode, data: rapikanSilabus(s.data) });
  }
  return out;
}

// Sel tabel bertanda baris baru -> beberapa paragraf dalam satu sel (docx-dasar.tabel menerima { xml, teks }).
const PISAH = '</w:p><w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr>';
const selBaris = sel => (typeof sel === 'string' && sel.includes('\n')
  ? { xml: sel.split('\n').map(p => run(p, { sz: 18 })).join(PISAH), teks: sel.split('\n').sort((a, b) => b.length - a.length)[0] }
  : sel);

const UNIT = { universitas: 'Universitas', fakultas: 'Fakultas', prodi: 'Program Studi' };
const JENIS = m => (m.sifat === 'pilihan' ? ['Mata Kuliah Pilihan', 'Elective Course'] : ['Mata Kuliah Wajib', 'Compulsory Course']);
const angka = v => String(v ?? '').replace('.', ',');

/** Penyelenggara MK: "Program Studi Teknik Sipil" / "Universitas" / "Fakultas" / '' (belum diisi di daftar MK). */
export const penyelenggara = (m, prodi = '') => {
  const u = UNIT[m.unit_penyelenggara];
  return u ? (m.unit_penyelenggara === 'prodi' && prodi ? `${u} ${prodi}` : u) : '';
};

/**
 * Isi <w:body> lampiran silabus satu kurikulum. Per MK satu tabel 3 kolom (butir | Indonesia | English), urut semester
 * (susunanMK). Yang dipakai: versi disahkan (sah); dengan draf = true, MK yang belum disahkan memakai isian terakhir dan
 * ditandai "DRAF". MK tanpa silabus disebut di daftar "belum ada silabus". Hasil { xml, jumlah, draf, belum: [kode] }.
 */
export function lampiranSilabus({ kur, mk = [], silabus = new Map(), peta = [], refCpl = [], prodi = '', institusi = '', draf = false }){
  const mkKur = mk.filter(m => m.kurikulum === kur && m.aktif !== false);
  let x = judul(`LAMPIRAN: SILABUS MATA KULIAH KURIKULUM ${kur}`, 1);
  x += para(run([prodi && `Program Studi ${prodi}`, institusi].filter(Boolean).join(' · ')), { jc: 'left' });
  let jumlah = 0, nDraf = 0;
  const belum = [];
  for (const g of susunanMK(mkKur)) {
    let isiGrup = '';
    for (const m of g.xs) {
      const s = silabus.get(`${kur}|${m.kode}`);
      const pakaiDraf = !s?.sah && draf && s;
      const d = s?.sah || (pakaiDraf ? s.data : null);
      if (!d) { belum.push(m.kode); continue; }
      jumlah++; if (pakaiDraf) nDraf++;
      const cpl = cplTerkait(kur, m.kode, peta, refCpl);
      const tandaDraf = pakaiDraf ? ' (DRAF, belum disahkan)' : '';
      isiGrup += judul(`${m.kode} ${t(m.nama)}${tandaDraf}`, 2);
      const sks = [angka(m.sks), m.sks_praktikum ? `(praktikum ${angka(m.sks_praktikum)})` : ''].filter(Boolean).join(' ');
      const [jId, jEn] = JENIS(m);
      const syarat = (a, b, la, lb) => `${la}: ${t(a) || '-'}; ${lb}: ${t(b) || '-'}`;
      isiGrup += tabel([
        ['Butir', 'Bahasa Indonesia', 'English'],
        ['Kode mata kuliah', m.kode, m.kode],
        ['Nama mata kuliah', t(m.nama), t(d.nama_en)],
        ['Bobot sks', sks, sks],
        ['Semester', m.semester ? String(m.semester) : (m.sifat === 'pilihan' ? 'Pilihan' : '-'), m.semester ? String(m.semester) : (m.sifat === 'pilihan' ? 'Elective' : '-')],
        ['Jenis mata kuliah', `${jId}${jenisMK(m) ? ` (${jenisMK(m)})` : ''}`, jEn],
        ['Penyelenggara', penyelenggara(m, prodi) || '-', penyelenggara(m, prodi) || '-'],
        ['Tujuan umum', t(d.tujuan), t(d.tujuan_en)],
        ['Deskripsi', t(d.deskripsi), t(d.deskripsi_en)],
        ['Capaian Pembelajaran Lulusan', cpl.map(c => `CPL-${c.kode}: ${c.rumusan}`).join('\n') || '-',
          cpl.map(c => `CPL-${c.kode}: ${c.rumusan_en || c.rumusan}`).join('\n') || '-'],
        ['Mata kuliah terkait', syarat(d.prasyarat, d.bersamaan, 'Prasyarat', 'Bersamaan'), syarat(d.prasyarat, d.bersamaan, 'Pre-requisite', 'Co-requisite')],
        ['Pustaka', t(d.pustaka).replace(/\n{2,}/g, '\n') || '-', ''],
      ].map(r => r.map(selBaris)));
    }
    if (isiGrup) x += judul(g.judul, 1) + isiGrup;
  }
  if (belum.length) {
    x += judul('Mata kuliah yang belum memiliki silabus' + (draf ? '' : ' yang disahkan'), 1);
    x += para(run(belum.map(k => `${k} ${t(mkKur.find(m => m.kode === k)?.nama)}`).join('; ')), { jc: 'left' });
  }
  return { xml: x, jumlah, draf: nDraf, belum };
}

