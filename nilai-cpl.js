// Unggah berkas nilai CPL lewat situs (pemilik 2026-11-11, pilihan 2; 57-patch-cpl-unggah.sql).
// Dosen mengunggah Template_Input_Data_CPL.xlsx per kelas; berkas diperiksa di peramban
// sebelum dikirim (versi templat, identitas sama dengan kelasnya, lembar Periksa semua OK),
// lalu disimpan privat di Drive prodi (Code.gs kind 'cpl'). run_cpl.py memeriksa ulang semuanya.

// Sama dengan config.yaml template_versions dan semester_order (dijaga test).
export const VERSI_TEMPLAT = ['CPL-2026.10.09'];
// Pendek = semester pendek sesudah Genap (pemilik 2026-11-14; patch 73). Urutan = config.yaml semester_order.
export const SEMESTER = ['Ganjil', 'Genap', 'Pendek'];
export const SHEETJS = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm';
// Tata letak templat CPL-2026.10.09 (cpl/template.py, cpl/checks.py): Info A4:B13, Periksa A8:C20.
const INFO_BARIS = [4, 13], PERIKSA_BARIS = [8, 20];

const teks = v => v == null ? '' : String(v).trim();
const sama = (a, b) => teks(a).toLowerCase() === teks(b).toLowerCase();

/** Lembar Info dan Periksa dari buku kerja SheetJS (nilai tersimpan Excel, bukan rumus). */
export function bacaLembar(wb){
  const sel = (lembar, a) => wb?.Sheets?.[lembar]?.[a]?.v;
  if (!wb?.Sheets?.Info || !wb?.Sheets?.Periksa) return null;
  const info = {};
  for (let r = INFO_BARIS[0]; r <= INFO_BARIS[1]; r++) { const l = teks(sel('Info', `A${r}`)); if (l) info[l] = sel('Info', `B${r}`); }
  const periksa = [];
  for (let r = PERIKSA_BARIS[0]; r <= PERIKSA_BARIS[1]; r++)
    periksa.push({ baris: r, label: teks(sel('Periksa', `A${r}`)), nilai: sel('Periksa', `B${r}`), status: sel('Periksa', `C${r}`) });
  return { info, periksa };
}

/** { ok, masalah: [teks] } untuk satu berkas terhadap baris cpl_kelas. */
export function periksaBerkas(lembar, kelas){
  if (!lembar) return { ok: false, masalah: ['Bukan berkas Template_Input_Data_CPL (lembar Info atau Periksa tidak ada).'] };
  const m = [], i = lembar.info;
  if (!VERSI_TEMPLAT.includes(teks(i['Versi templat'])))
    m.push(`Versi templat "${teks(i['Versi templat']) || 'kosong'}" tidak diterima; pakai templat ${VERSI_TEMPLAT.join(' atau ')} dari admin.`);
  const cek = [['Kode MK', kelas.kode_mk], ['Kelas', kelas.kelas], ['Tahun Akademik', kelas.tahun_akademik], ['Semester', kelas.semester]];
  for (const [label, harus] of cek)
    if (!sama(i[label], harus)) m.push(`Info "${label}" berisi "${teks(i[label]) || 'kosong'}", seharusnya "${harus}" untuk kelas ini.`);
  const tanpaNilai = lembar.periksa.filter(p => p.status === undefined || p.status === null || p.status === '');
  if (tanpaNilai.length) m.push('Lembar Periksa belum berisi hasil: buka berkas di Excel, periksa, lalu simpan ulang sebelum mengunggah.');
  else lembar.periksa.filter(p => teks(p.status).toUpperCase() !== 'OK')
    .forEach(p => m.push(`Periksa baris ${p.baris} belum OK: ${p.label}${p.nilai != null ? ` (nilai ${p.nilai})` : ''}.`));
  return { ok: !m.length, masalah: m };
}

/** CSV daftar kelas (pemisah ; atau ,): tahun_akademik, semester, kode_mk, nama_mk, kelas, email_dosen. */
export function bacaCSVKelas(isi){
  const baris = String(isi || '').replace(/^\uFEFF/, '').split(/\r?\n/).filter(x => x.trim());
  if (!baris.length) return { rows: [], galat: ['Berkas kosong.'] };
  const pisah = (baris[0].match(/;/g) || []).length >= (baris[0].match(/,/g) || []).length ? ';' : ',';
  const sel = x => x.split(pisah).map(v => v.trim().replace(/^"(.*)"$/, '$1').trim());
  const kepala = sel(baris[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));
  const kol = { tahun_akademik: ['tahun_akademik', 'ta'], semester: ['semester'], kode_mk: ['kode_mk', 'kode'],
    nama_mk: ['nama_mk', 'nama'], kelas: ['kelas'], dosen_email: ['email_dosen', 'dosen_email', 'email'] };
  const idx = Object.fromEntries(Object.entries(kol).map(([k, xs]) => [k, kepala.findIndex(h => xs.includes(h))]));
  const kurang = Object.entries(idx).filter(([k, v]) => v < 0 && k !== 'nama_mk').map(([k]) => k);
  if (kurang.length) return { rows: [], galat: [`Kolom tidak ada: ${kurang.join(', ')}. Kepala: tahun_akademik;semester;kode_mk;nama_mk;kelas;email_dosen`] };
  const rows = [], galat = [], kunci = new Set();
  baris.slice(1).forEach((b, n) => {
    const c = sel(b), v = k => idx[k] >= 0 ? (c[idx[k]] || '') : '';
    const sem = SEMESTER.find(s => sama(s, v('semester')));
    const r = { tahun_akademik: v('tahun_akademik'), semester: sem || v('semester'), kode_mk: v('kode_mk'), nama_mk: v('nama_mk') || null,
      kelas: v('kelas'), dosen_email: v('dosen_email').toLowerCase() };
    const salah = [!/^\d{4}\/\d{4}$/.test(r.tahun_akademik) && 'tahun_akademik bukan YYYY/YYYY', !sem && `semester harus ${SEMESTER.join('/')}`,
      !r.kode_mk && 'kode_mk kosong', !r.kelas && 'kelas kosong', !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.dosen_email) && 'email_dosen tidak sah'].filter(Boolean);
    const k = [r.tahun_akademik, r.semester, r.kode_mk, r.kelas].join('|');
    if (!salah.length && kunci.has(k)) salah.push('kelas ganda dalam berkas');
    if (salah.length) galat.push(`Baris ${n + 2}: ${salah.join('; ')}`); else { kunci.add(k); rows.push(r); }
  });
  return { rows, galat };
}

/** Kelas dengan unggahan terakhirnya (berkas = baris cpl_berkas). */
export function statusKelas(kelas, berkas){
  const akhir = new Map();
  (berkas || []).forEach(b => { const a = akhir.get(b.kelas_id); if (!a || String(b.diunggah) > String(a.diunggah)) akhir.set(b.kelas_id, b); });
  const jumlah = new Map();
  (berkas || []).forEach(b => jumlah.set(b.kelas_id, (jumlah.get(b.kelas_id) || 0) + 1));
  return (kelas || []).map(k => ({ ...k, terakhir: akhir.get(k.id) || null, versi: jumlah.get(k.id) || 0 }))
    .sort((a, b) => String(a.kode_mk).localeCompare(String(b.kode_mk)) || String(a.kelas).localeCompare(String(b.kelas)));
}

/** Periode (TA + semester) yang ada di daftar kelas, terbaru dulu. */
export function periodeKelas(kelas){
  const ps = [...new Set((kelas || []).map(k => `${k.tahun_akademik}|${k.semester}`))];
  return ps.sort((a, b) => { const [ta, sa] = a.split('|'), [tb, sb] = b.split('|');
    return tb.localeCompare(ta) || SEMESTER.indexOf(sb) - SEMESTER.indexOf(sa); });
}

/** Pengingat: dosen yang kelasnya belum mengunggah, satu email per dosen. */
export function penerimaBelumUnggah(status, namaDosen = new Map()){
  const per = new Map();
  status.filter(k => !k.terakhir).forEach(k => {
    const e = k.dosen_email.toLowerCase();
    if (!per.has(e)) per.set(e, { nama: namaDosen.get(e) || e, email: e, kelas: [] });
    per.get(e).kelas.push(`- ${k.kode_mk} ${k.nama_mk || ''} kelas ${k.kelas} (${k.tahun_akademik} ${k.semester})`.replace(/\s+\(/, ' ('));
  });
  return [...per.values()].map(p => ({ nama: p.nama, email: p.email, rinci: p.kelas.join('\n') }));
}
