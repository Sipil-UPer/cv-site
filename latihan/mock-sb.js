// Supabase tiruan untuk "python coba_lokal.py" (pemilik 2026-11-12; asalnya alat rekaman video
// 2026-11-07): data fiktif seed.json (coba/seed.py), perubahan tersimpan di localStorage peramban.
// Disalin ke folder coba-lokal/ (mode coba) dan, oleh tools/buat_latihan.py, ke site/latihan/ (mode latihan di situs
// terbit; salinan itu harus identik, tests/test_latihan.py). Peran (mode coba): localStorage.mockSaya =
// email, atau 'tamu' untuk pengunjung umum; diganti lewat bilah MODE COBA di bawah halaman.
// Mode latihan (pemilik 2026-11-24): salinan berkas ini di site/latihan/ dipakai pengajuan.html?latihan=1 di situs terbit untuk
// sosialisasi; window.LATIHAN = true. Bedanya: seed.json dibaca dari folder berkas ini, penyimpanan memakai kunci latihan*
// (tidak bercampur dengan mode coba), peran selalu tamu (mahasiswa), dan bilah MODE COBA tidak dipasang.
const LATIHAN = !!window.LATIHAN;
const KDB = LATIHAN ? 'latihanDB' : 'mockDB', KN = LATIHAN ? 'latihanN' : 'mockN';
const res = await fetch(new URL('seed.json', import.meta.url));
const SEED = await res.json();
let DB = JSON.parse(localStorage[KDB] || 'null') || SEED;
// Situs coba dibangun ulang (seed baru): data lama di peramban diganti.
if (DB._versi !== SEED._versi) { DB = SEED; localStorage.removeItem(KN); }
const simpan = () => { try { localStorage[KDB] = JSON.stringify(DB); } catch (e) { /* cukup di memori */ } };
const email = () => (LATIHAN ? 'tamu' : localStorage.mockSaya || 'tamu');
window.__DB = () => DB;
// 110: pasangan KK berdekatan untuk pembimbing TA (sama dengan isi awal ta_kk_dekat di patch 110).
if (!DB.ta_kk_dekat) DB.ta_kk_dekat = [{ kk_a: 'GEO', kk_b: 'STR' }, { kk_a: 'MRK', kk_b: 'STR' }, { kk_a: 'AIR', kk_b: 'GEO' }, { kk_a: 'GEO', kk_b: 'TRN' }];

// Bilah MODE COBA: berganti peran dan mengembalikan data contoh.
const PERAN_COBA = [['admin@contoh.ac.id', 'Admin'], ['pimpinan@contoh.ac.id', 'Pimpinan'], ['adi@contoh.ac.id', 'Dosen (Adi)'],
  ['asesor@contoh.ac.id', 'Asesor'], ['tamu', 'Tamu']];
function pasangBilah(){
  if (document.getElementById('bilah-coba')) return;
  const b = document.createElement('div');
  b.id = 'bilah-coba';
  b.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#7A4B00;color:#fff;'
    + 'font:13px/1.4 system-ui,sans-serif;padding:6px 12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap';
  const tombol = 'background:#fff;color:#7A4B00;border:0;border-radius:3px;padding:2px 9px;font:inherit;cursor:pointer';
  b.innerHTML = `<b>MODE COBA</b><span>data fiktif, perubahan hanya di peramban ini · masuk sebagai:</span>`
    + PERAN_COBA.map(([e, l]) => `<button type="button" data-peran="${e}" style="${tombol}${email() === e ? ';font-weight:700;outline:2px solid #fff' : ''}">${l}</button>`).join('')
    + `<button type="button" id="atur-ulang-coba" style="${tombol};margin-left:auto">Atur ulang data</button>`;
  b.querySelectorAll('[data-peran]').forEach(x => { x.onclick = () => { localStorage.mockSaya = x.dataset.peran; location.reload(); }; });
  b.querySelector('#atur-ulang-coba').onclick = () => {
    if (!confirm('Kembalikan semua data ke contoh awal?')) return;
    ['mockDB', 'mockN'].forEach(k => localStorage.removeItem(k)); location.reload();
  };
  document.body.appendChild(b);
  document.body.style.paddingBottom = '44px';
}
if (!LATIHAN) { if (document.body) pasangBilah(); else addEventListener('DOMContentLoaded', pasangBilah); }
let n = Number(localStorage[KN] || 500000);
const baru = () => { n += 1; localStorage[KN] = n; return n; };
const uuid = () => '00000000-0000-4000-8000-' + String(baru()).padStart(12, '0');
const TABEL_UUID = new Set(['karya', 'dosen', 'karya_mitra', 'karya_mahasiswa', 'hibah_ajuan']);
const KUNCI = { pengaturan: ['kunci'], led_narasi: ['kunci'], led_penugasan: ['kelompok'], hibah_tim: ['ajuan_id', 'dosen_id'] };
// Relasi anak selain lewat karya_id (58-patch-hibah.sql).
const FK_ANAK = { hibah_tim: 'ajuan_id', pengajuan_berkas: 'pengajuan_id', pengajuan_riwayat: 'pengajuan_id' };

// Pengajuan mahasiswa (90-patch-pengajuan-mahasiswa.sql), tiruan ringkas: token disimpan apa adanya,
// tautan "email" dicetak ke konsol. Aturan lengkap diuji di tests/test_pengajuan_mahasiswa.py.
const PM = () => (DB.pengajuan_mahasiswa ||= []);
const pmToken = t => PM().find(p => p.token === t);
const pmRiwayat = (p, status, oleh, catatan = null) => (DB.pengajuan_riwayat ||= []).push({ id: baru(), pengajuan_id: p.id, status, oleh, catatan,
  tahap: p.tahap || 'pengajuan', waktu: new Date().toISOString() });
const pmGagal = message => ({ data: null, error: { message } });
// 175: pembimbing TA (penetapan disetujui, atau pengajuan TA terakhir yang dikirim), sah = dikonfirmasi atau 14 hari, syarat per tahap.
function pmPembimbingNim(nim){
  const xs = PM().filter(o => o.nim === nim && o.jenis === 'ta' && o.pembimbing_id && !['draf', 'ditolak', 'dibatalkan'].includes(o.status));
  const o = xs.find(x => x.data?.tahap_ta === 'penetapan_pembimbing' && x.status === 'disetujui') || xs.at(-1);
  if (!o) return [];
  const d = id => (DB.dosen || []).find(x => x.id === id);
  return [[o.pembimbing_id, 1], [o.data?.pembimbing_2, 2]].filter(([id], i) => id && d(id) && (i === 0 || id !== o.pembimbing_id))
    .map(([id, ke]) => ({ id, nama: d(id).nama, ke }));
}
// 178: lulus = sidang akhir selesai, lulus atau lulus dengan revisi yang sudah selesai.
function pmArsipSiap(){
  const g = new Map();
  for (const t of (DB.jadwal_ta || []).filter(t => t.nim && t.tahap === 'sidang_akhir' && t.status === 'selesai'
      && (t.hasil === 'lulus' || (t.hasil === 'lulus_revisi' && t.revisi_selesai))).sort((a, b) => a.tanggal.localeCompare(b.tanggal))) {
    const a = (DB.ta_arsip || []).find(x => x.nim === t.nim);
    g.set(t.nim, { nim: t.nim, nama: t.nama_mahasiswa, judul: t.judul, lulus: t.tanggal, arsip_url: a?.url || null, arsip_dibuat: a?.dibuat || null, arsip_oleh: a?.oleh || null });
  }
  return [...g.values()];
}
const pmBimbSah = b => b.status === 'dikonfirmasi' || (b.status === 'menunggu' && +new Date(b.diajukan) <= Date.now() - 14 * 864e5);
function pmSyaratBimb(nim, tahap){
  const minimal = (DB.ta_syarat_bimbingan || []).find(s => s.tahap === tahap)?.minimal ?? 0;
  const sebelum = { seminar_kemajuan: 'seminar_proposal', sidang_akhir: 'seminar_kemajuan' }[tahap];
  const sejak = sebelum ? (DB.jadwal_ta || []).filter(t => t.nim === nim && t.tahap === sebelum && t.status === 'selesai' && ['lulus', 'lulus_revisi'].includes(t.hasil))
    .map(t => t.tanggal).sort().at(-1) || null : null;
  const terhitung = (DB.ta_bimbingan || []).filter(b => b.nim === nim && pmBimbSah(b) && (!sejak || b.tanggal > sejak)).length;
  return { tahap, minimal, terhitung, sejak, cukup: terhitung >= minimal };
}
function pmRpc(nama, a){
  // 174: berkas pendaftaran seminar/sidang TA per tahap (daftar aktif, urut seperti ta_berkas_daftar).
  if (nama === 'ta_berkas_daftar') return { data: (DB.ta_berkas || []).filter(t => t.aktif)
    .sort((a, b) => a.tahap.localeCompare(b.tahap) || a.urut - b.urut || a.kode.localeCompare(b.kode))
    .map(({ tahap, kode, label, keterangan, wajib }) => ({ tahap, kode, label, keterangan, wajib })), error: null };
  // 178: mahasiswa lulus sidang akhir + status arsip (koordinator TA/admin), tiruan.
  if (nama === 'ta_arsip_siap') {
    const saya = (DB.dosen || []).find(d => d.email === email());
    const koor = !!saya && (saya.peran === 'admin' || (DB.koordinator || []).some(k => k.dosen_id === saya.id && k.jabatan === 'koordinator_ta' && !k.selesai));
    return { data: koor ? pmArsipSiap() : [], error: null };
  }
  if (nama === 'pembimbing_pilihan') return { data: (DB.dosen || []).filter(d => d.aktif && d.peran !== 'asesor' && (d.dtps || d.kategori) && !d.tugas_belajar)
    .map(d => ({ id: d.id, nama: d.nama })).sort((x, y) => x.nama.localeCompare(y.nama)), error: null };
  // Kuota dan penetapan pembimbing KP (107), tiruan: "koordinator" = admin.
  const tsDari = t => { const m = String(t || '').match(/^(\d{4})-(\d{2})/); return m ? (+m[2] >= 9 ? +m[1] + 1 : +m[1]) : 0; };
  const tsKP = p => tsDari(p.data_selesai?.tanggal_mulai || p.data?.tanggal_mulai || p.data?.rencana_mulai || p.dibuat);
  const sayaAdmin = () => (DB.dosen || []).find(d => d.email === email() && d.peran === 'admin');
  if (nama === 'kp_beban') {
    const k = DB.kp_kuota || [], bawaan = k.find(x => x.ts === a.p_ts && !x.dosen_id)?.kuota ?? null;
    return { data: pmRpc('pembimbing_pilihan').data.map(d => { const sendiri = k.find(x => x.ts === a.p_ts && x.dosen_id === d.id);
      return { dosen_id: d.id, nama: d.nama, kuota: sendiri ? sendiri.kuota : bawaan, kuota_sendiri: !!sendiri,
        beban: PM().filter(p => p.jenis === 'kp' && p.pembimbing_id === d.id && !['draf', 'ditolak'].includes(p.status) && tsKP(p) === a.p_ts).length }; }), error: null };
  }
  // Kesehatan sistem (125), tiruan: contoh hasil sistem_kesehatan() (satu butir terlambat) untuk admin/pimpinan.
  if (nama === 'sistem_kesehatan') {
    const jam = h => new Date(Date.now() - h * 3600e3).toISOString();
    return { data: { dibuat: new Date().toISOString(), perlu_dicek: 1, basis_data_mb: 42.5, ringkasan_terakhir: jam(70), butir: [
      { kunci: 'bangun_situs', label: 'Bangun situs (tiap jam)', waktu: jam(0.4), status: 'baik', rinci: 'tanpa perubahan pada jalan terakhir' },
      { kunci: 'situs_terbit', label: 'Situs terakhir terbit (hanya bila ada perubahan)', waktu: jam(5), status: 'info', rinci: null },
      { kunci: 'cadangan', label: 'Cadangan basis data (harian)', waktu: jam(9), status: 'baik', rinci: null },
      { kunci: 'jaga_hidup', label: 'Jaga-hidup Supabase (tiap 3 hari)', waktu: jam(30), status: 'baik', rinci: null },
      { kunci: 'hitung_cpl', label: 'Hitung CPL (harian)', waktu: jam(40), status: 'terlambat', rinci: null },
      { kunci: 'apps_script', label: 'Pemicu Apps Script (tiap jam)', waktu: jam(0.7), status: 'baik',
        rinci: 'sisa kuota email hari ini 87 · Drive 41% (6,2 dari 15,0 GB)' }] }, error: null };
  }
  // Beban bimbingan per dosen (109), tiruan sederhana dari beban_bimbingan().
  if (nama === 'beban_bimbingan') {
    const ts = a.p_ts, mhs = x => String(x.nim || '').trim() || String(x.nama || x.nama_mahasiswa || '').trim().toLowerCase();
    const J = (DB.jadwal_ta || []).filter(j => j.status !== 'batal' && tsDari(j.tanggal) === ts), R = DB.lkps_prestasi_mahasiswa || [];
    const kuota = pmRpc('kp_beban', { p_ts: ts }).data;
    return { data: pmRpc('pembimbing_pilihan').data.map(d => {
      const ds = (DB.dosen || []).find(x => x.id === d.id) || {}, nidn = String(ds.nidn || '').trim();
      const kp = PM().filter(p => p.jenis === 'kp' && p.pembimbing_id === d.id && !['draf', 'ditolak'].includes(p.status) && tsKP(p) === ts);
      const ta = new Set([...PM().filter(p => p.jenis === 'ta' && !['draf', 'ditolak'].includes(p.status) && tsDari(p.dibuat) === ts
          && (p.pembimbing_id === d.id || p.data?.pembimbing_2 === d.id)).map(mhs),
        ...J.filter(j => nidn && (j.pembimbing || []).includes(nidn)).map(mhs)]);
      return { dosen_id: d.id, nama: d.nama, kk: ds.kelompok_keahlian || null, kp: kp.length,
        kp_selesai: kp.filter(p => p.tahap === 'selesai' && p.status === 'disetujui').length,
        kp_kuota: kuota.find(x => x.dosen_id === d.id)?.kuota ?? null, ta: ta.size,
        ta_lulus: new Set(J.filter(j => nidn && (j.pembimbing || []).includes(nidn) && j.tahap === 'sidang_akhir'
          && ['lulus', 'lulus_revisi'].includes(j.hasil)).map(mhs)).size,
        uji: J.filter(j => nidn && (j.penguji || []).includes(nidn)).length,
        lomba: R.filter(r => r.status !== 'ditolak' && nidn && (r.pembimbing || []).includes(nidn)
          && +r.tahun + ((+r.bulan || 1) >= 9 ? 1 : 0) === ts).length };
    }), error: null };
  }
  // Pembimbing TA menurut KK + kuota TA (110), tiruan.
  const kkDosen = id => (DB.dosen || []).find(d => d.id === id)?.kelompok_keahlian || null;
  const cocokKK = (t, k) => !!t && !!k && (t === k || DB.ta_kk_dekat.some(x => (x.kk_a === t && x.kk_b === k) || (x.kk_b === t && x.kk_a === k)));
  const penetapan = x => x.jenis === 'ta' && x.data?.tahap_ta === 'penetapan_pembimbing';
  if (nama === 'pembimbing_pilihan_ta') return { data: pmRpc('pembimbing_pilihan').data.map(d => { const k = kkDosen(d.id);
    return { ...d, kk: k, kk_cocok: k ? [...new Set([k, ...DB.ta_kk_dekat.filter(x => [x.kk_a, x.kk_b].includes(k)).map(x => x.kk_a === k ? x.kk_b : x.kk_a)])].sort() : [] }; }), error: null };
  // 180: kuota per semester; beban pada pembimbing pertama (pembimbing_awal); dibimbing = semester sebelumnya, belum lulus.
  const smtIdx = t => { const m = String(t || '').match(/^(\d{4})-(\d{2})/); if (!m) return null; const y = +m[1], b = +m[2];
    return b >= 9 ? (y + 1) * 2 : b <= 2 ? y * 2 : y * 2 + 1; };
  const lulusTA = nim => (DB.jadwal_ta || []).some(j => j.nim === nim && j.tahap === 'sidang_akhir' && j.status === 'selesai'
    && (j.hasil === 'lulus' || (j.hasil === 'lulus_revisi' && j.revisi_selesai)));
  if (nama === 'ta_beban') {
    const k = (DB.ta_kuota || []).filter(x => x.ts === a.p_ts && (x.semester || 'Ganjil') === a.p_sm), bawaan = k.find(x => !x.dosen_id)?.kuota ?? null;
    const i = a.p_ts * 2 + (a.p_sm === 'Genap' ? 1 : 0), jalan = p => penetapan(p) && !['draf', 'ditolak'].includes(p.status);
    return { data: pmRpc('pembimbing_pilihan').data.map(d => { const sendiri = k.find(x => x.dosen_id === d.id);
      return { dosen_id: d.id, nama: d.nama, kk: kkDosen(d.id), kuota: sendiri ? sendiri.kuota : bawaan, kuota_sendiri: !!sendiri,
        beban: PM().filter(p => jalan(p) && (p.data?.pembimbing_awal || p.pembimbing_id) === d.id && smtIdx(p.dibuat) === i).length,
        dibimbing: new Set(PM().filter(p => jalan(p) && p.pembimbing_id === d.id && smtIdx(p.dibuat) < i && !lulusTA(p.nim)).map(p => p.nim)).size }; }),
      error: null };
  }
  if (nama === 'ta_atur_kuota') {
    if (!sayaAdmin()) return pmGagal('Kuota TA diatur koordinator TA atau admin.');
    if (!['Ganjil', 'Genap'].includes(a.p_sm)) return pmGagal('Semester harus Ganjil atau Genap.');
    DB.ta_kuota = (DB.ta_kuota || []).filter(x => !(x.ts === a.p_ts && (x.semester || 'Ganjil') === a.p_sm && (x.dosen_id || null) === (a.p_dosen || null)));
    if (a.p_kuota != null) DB.ta_kuota.push({ id: baru(), ts: a.p_ts, semester: a.p_sm, dosen_id: a.p_dosen || null, kuota: a.p_kuota });
    simpan(); return { data: 'ok', error: null };
  }
  if (nama === 'ta_ganti_pembimbing') {
    const p = PM().find(x => x.id === a.p_id), alasan = String(a.p_alasan || '').trim(), judul = String(a.p_judul || '').trim();
    if (!sayaAdmin()) return pmGagal('Pembimbing TA diganti koordinator TA atau admin.');
    if (!p || !penetapan(p)) return pmGagal('Pengajuan pembimbing TA tidak ditemukan.');
    if (p.status !== 'disetujui') return pmGagal('Ganti pembimbing hanya pada penetapan yang sudah disahkan; sebelum itu pakai Tetapkan pembimbing.');
    if (alasan.length < 5) return pmGagal('Tulis alasan penggantian (bimbingan dibatalkan).');
    if (a.p_dosen2 && a.p_dosen2 === a.p_dosen) return pmGagal('Pembimbing 2 harus berbeda dari pembimbing 1.');
    const nm = id => (DB.dosen || []).find(d => d.id === id)?.nama || '-';
    const catatan = `Bimbingan dibatalkan, pembimbing diganti. Pembimbing 1: ${nm(p.pembimbing_id)} -> ${nm(a.p_dosen)}. Alasan: ${alasan}`;
    p.data = { ...p.data, pembimbing_awal: p.data?.pembimbing_awal || p.pembimbing_id, ...(judul ? { judul } : {}) };
    if (a.p_dosen2) p.data.pembimbing_2 = a.p_dosen2; else delete p.data.pembimbing_2;
    for (const o of PM().filter(o => o.nim === p.nim && o.jenis === 'ta' && o.id !== p.id && !penetapan(o)
      && ['draf', 'pembimbing', 'admin', 'dikembalikan'].includes(o.status))) { o.pembimbing_id = a.p_dosen; o.data = { ...o.data, pembimbing_2: a.p_dosen2 || undefined }; }
    p.pembimbing_id = a.p_dosen;
    (DB.pengajuan_riwayat ||= []).push({ id: baru(), pengajuan_id: p.id, status: p.status, oleh: 'Situs coba (koordinator TA/admin)', catatan,
      tahap: p.tahap, waktu: new Date().toISOString() });
    simpan(); return { data: 'diganti', error: null };
  }
  if (nama === 'ta_tetapkan_pembimbing') {
    const saya = sayaAdmin(), p = PM().find(x => x.id === a.p_id);
    if (!saya) return pmGagal('Pembimbing TA ditetapkan koordinator TA atau admin.');
    if (!p || !penetapan(p)) return pmGagal('Pengajuan pembimbing TA tidak ditemukan.');
    if (a.p_dosen2 && a.p_dosen2 === a.p_dosen) return pmGagal('Pembimbing 2 harus berbeda dari pembimbing 1.');
    const cocok = cocokKK(p.data.kk_ta, kkDosen(a.p_dosen)), alasan = String(a.p_alasan || '').trim();
    if (!cocok && alasan.length < 5) return pmGagal('Pembimbing 1 di luar kelompok keahlian TA: tulis alasannya.');
    const nm = id => (DB.dosen || []).find(d => d.id === id)?.nama;
    p.pembimbing_id = a.p_dosen; p.data = { ...p.data, pembimbing_2: a.p_dosen2 || undefined, alasan_luar_kk: cocok ? undefined : alasan };
    pmRiwayat(p, p.status, saya.nama + ' (koordinator TA/admin)', `Pembimbing 1 ditetapkan: ${nm(a.p_dosen)}; pembimbing 2: ${nm(a.p_dosen2) || 'tidak ada'}`
      + (cocok ? '' : '. Di luar kelompok keahlian TA: ' + alasan)); simpan();
    return { data: 'diganti', error: null };
  }
  if (nama === 'kp_atur_kuota') {
    if (!sayaAdmin()) return pmGagal('Kuota diatur koordinator KP atau admin.');
    if (a.p_kuota != null && !(a.p_kuota >= 0 && a.p_kuota <= 100)) return pmGagal('Kuota 0 sampai 100.');
    DB.kp_kuota = (DB.kp_kuota || []).filter(x => !(x.ts === a.p_ts && (x.dosen_id || null) === (a.p_dosen || null)));
    if (a.p_kuota != null) DB.kp_kuota.push({ id: baru(), ts: a.p_ts, dosen_id: a.p_dosen || null, kuota: a.p_kuota });
    simpan(); return { data: 'ok', error: null };
  }
  if (nama === 'kp_tetapkan_pembimbing') {
    const saya = sayaAdmin(), p = PM().find(x => x.id === a.p_id);
    if (!saya) return pmGagal('Pembimbing KP ditetapkan koordinator KP atau admin.');
    if (!p || p.jenis !== 'kp') return pmGagal('Pengajuan KP tidak ditemukan.');
    if (p.pembimbing_id === a.p_dosen) return { data: 'tetap', error: null };
    const nm = id => (DB.dosen || []).find(d => d.id === id)?.nama;
    pmRiwayat(p, p.status, saya.nama + ' (koordinator/admin)', `Dosen pembimbing ditetapkan: ${nm(a.p_dosen)}${p.pembimbing_id ? ` (sebelumnya ${nm(p.pembimbing_id)})` : ''}`);
    p.pembimbing_id = a.p_dosen; p.diperbarui = new Date().toISOString(); simpan();
    return { data: 'diganti', error: null };
  }
  // Revisi TA selesai (95), tiruan ringkas.
  if (nama === 'ta_revisi_selesai') {
    const j = (DB.jadwal_ta || []).find(x => x.id === a.p_id), saya = (DB.dosen || []).find(d => d.email === email());
    if (!j || !saya || !(saya.peran === 'admin' || (j.pembimbing || []).includes(saya.nidn))) return pmGagal('Hanya pembimbing mahasiswa ini atau admin.');
    j.revisi_selesai = a.p_selesai === false ? null : new Date().toISOString().slice(0, 10); simpan();
    return { data: j.revisi_selesai, error: null };
  }
  // Jadwalkan seminar/sidang TA (94), tiruan ringkas.
  if (nama === 'pengajuan_jadwalkan') {
    const p = PM().find(x => x.id === a.p_id), saya = (DB.dosen || []).find(d => d.email === email());
    if (!saya || saya.peran !== 'admin') return pmGagal('Menjadwalkan khusus admin.');
    if (!p || p.status !== 'admin') return pmGagal('Pengajuan belum disetujui pembimbing atau sudah dijadwalkan.');
    if (!(a.p_penguji || []).length && !a.p_penguji_luar) return pmGagal('Tetapkan minimal satu penguji.');
    const nidn = id => (DB.dosen || []).find(d => d.id === id)?.nidn;
    (DB.jadwal_ta ||= []).push({ id: baru(), pengajuan_id: p.id, tahap: p.data?.tahap_ta, nama_mahasiswa: p.nama, nim: p.nim, judul: p.data?.judul,
      pembimbing: [nidn(p.pembimbing_id), nidn(p.data?.pembimbing_2)].filter(Boolean), penguji: a.p_penguji || [], penguji_luar: a.p_penguji_luar,
      tanggal: a.p_tanggal, jam: a.p_jam, ruang: a.p_ruang, tautan_daring: a.p_tautan, status: 'terjadwal', tampil_nama: !!p.data?.tampil_nama });
    p.status = 'disetujui'; p.diperbarui = new Date().toISOString(); pmRiwayat(p, 'disetujui', saya.nama, 'Dijadwalkan ' + a.p_tanggal); simpan();
    return { data: 1, error: null };
  }
  // 163: insentif publikasi, tiruan ringkas (aturan sama dengan 163-patch-insentif-publikasi.sql).
  if (nama.startsWith('insentif_')) {
    const saya = (DB.dosen || []).find(d => d.email === email()), KL = (DB.insentif_publikasi ||= []), PJ = (DB.insentif_pengajuan ||= []);
    const pengelola = saya?.peran === 'admin';
    const penulis = kid => (DB.karya_penulis || []).some(p => p.karya_id === kid && p.dosen_id === saya?.id);
    const kurang = kid => ['naskah', 'indeksasi', 'loa', 'pernyataan'].filter(j => !(DB.karya_bukti || []).some(b => b.karya_id === kid && b.jenis === j));
    const tahun = new Date(Date.now() + 7 * 3600e3).getUTCFullYear(), kini = new Date().toISOString();
    if (nama === 'insentif_klaim') {
      const k = (DB.karya || []).find(x => x.id === a.p_karya);
      if (!k) return pmGagal('Publikasi tidak ditemukan.');
      if (!penulis(k.id)) return pmGagal('Hanya penulis publikasi ini yang bisa mengklaim insentif.');
      if (k.kategori !== 'publikasi') return pmGagal('Insentif hanya untuk publikasi.');
      if (+k.tahun !== tahun) return pmGagal(`Insentif hanya untuk publikasi terbit tahun ${tahun} (publikasi ini ${k.tahun}).`);
      const i = KL.find(x => x.karya_id === k.id);
      if (i && i.pengklaim_id !== saya.id) return pmGagal('Publikasi ini sudah diklaim penulis lain (satu klaim per publikasi).');
      if (i) { if (i.status === 'dikembalikan') Object.assign(i, { status: 'diklaim', diperbarui: kini }); simpan(); return { data: i.id, error: null }; }
      const n = { id: baru(), karya_id: k.id, pengklaim_id: saya.id, status: 'diklaim', catatan: null, pengajuan_id: null, diklaim_pada: kini, diperbarui: kini };
      KL.push(n); simpan(); return { data: n.id, error: null };
    }
    if (nama === 'insentif_batal') {
      const i = KL.find(x => x.karya_id === a.p_karya); if (!i) return { data: null, error: null };
      if (!['diklaim', 'dikembalikan'].includes(i.status)) return pmGagal(`Klaim berstatus ${i.status} tidak bisa dibatalkan; hubungi admin prodi.`);
      DB.insentif_publikasi = KL.filter(x => x !== i); simpan(); return { data: null, error: null };
    }
    if (!pengelola) return pmGagal('Klaim insentif diperiksa admin prodi atau Kaprodi aktif.');
    if (nama === 'insentif_periksa') {
      const i = KL.find(x => x.id === a.p_id); if (!i) return pmGagal('Klaim tidak ditemukan.');
      if (a.p_status === 'dikembalikan' && !String(a.p_catatan || '').trim()) return pmGagal('Tulis catatan: apa yang perlu diperbaiki dosen.');
      if (a.p_status === 'siap') {
        const k = (DB.karya || []).find(x => x.id === i.karya_id);
        if (k?.status !== 'terverifikasi') return pmGagal(`Verifikasi publikasinya dulu (status sekarang: ${k?.status}).`);
        if (kurang(i.karya_id).length) return pmGagal(`Berkas belum lengkap: ${kurang(i.karya_id).join(', ')}.`);
      }
      Object.assign(i, { status: a.p_status, catatan: String(a.p_catatan || '').trim() || null, diperbarui: kini }); simpan(); return { data: null, error: null };
    }
    if (nama === 'insentif_ajukan') {
      if (!a.p_ids?.length || a.p_ids.some(id => KL.find(x => x.id === id)?.status !== 'siap')) return pmGagal('Hanya klaim berstatus siap yang bisa diajukan.');
      const p = { id: baru(), judul: a.p_judul, tanggal: kini.slice(0, 10), catatan: a.p_catatan || null, dibuat_oleh: saya.id, dibuat: kini };
      PJ.push(p); KL.filter(x => a.p_ids.includes(x.id)).forEach(x => Object.assign(x, { status: 'diajukan', pengajuan_id: p.id })); simpan();
      return { data: p.id, error: null };
    }
    if (nama === 'insentif_hasil') {
      const xs = KL.filter(x => a.p_ids.includes(x.id));
      if (xs.some(x => !((x.status === 'diajukan' && ['disetujui', 'ditolak', 'siap'].includes(a.p_status)) || (x.status === 'disetujui' && a.p_status === 'cair'))))
        return pmGagal(`Ada klaim yang statusnya tidak bisa diubah menjadi ${a.p_status}.`);
      xs.forEach(x => Object.assign(x, { status: a.p_status, pengajuan_id: a.p_status === 'siap' ? null : x.pengajuan_id })); simpan();
      return { data: xs.length, error: null };
    }
  }
  // 161: batalkan oleh admin atas permintaan mahasiswa, tiruan (sama dengan pengajuan_batalkan).
  if (nama === 'pengajuan_batalkan') {
    const p = PM().find(x => x.id === a.p_id), saya = (DB.dosen || []).find(d => d.email === email());
    if (!p) return pmGagal('Pengajuan tidak ditemukan.');
    if (!saya || saya.peran !== 'admin') return pmGagal('Pembatalan oleh prodi khusus admin prodi atau koordinator bidangnya.');
    const al = String(a.p_alasan || '').trim().slice(0, 300);
    if (!al) return pmGagal('Tulis alasan pembatalan (mis. permintaan mahasiswa: salah jalur).');
    if (p.status === 'ditolak' || (p.status === 'disetujui' && ((p.tahap || 'pengajuan') === 'selesai' || p.jenis !== 'kp')))
      return pmGagal('Pengajuan yang sudah diputuskan tidak dibatalkan.');
    p.status = 'dibatalkan'; p.diperbarui = new Date().toISOString();
    pmRiwayat(p, 'dibatalkan', saya.nama, 'Dibatalkan prodi atas permintaan: ' + al + '.'); simpan();
    return { data: 'dibatalkan', error: null };
  }
  if (nama === 'pengajuan_putuskan') {
    const p = PM().find(x => x.id === a.p_id), saya = (DB.dosen || []).find(d => d.email === email());
    if (!p || !saya) return pmGagal('Pengajuan tidak ditemukan.');
    const adm = saya.peran === 'admin';
    if (p.status === 'pembimbing' && !(adm || p.pembimbing_id === saya.id)) return pmGagal('Hanya dosen pembimbing atau admin.');
    if (p.status === 'admin' && !adm) return pmGagal('Tahap ini diputuskan admin.');
    if (a.p_aksi !== 'setujui' && !a.p_catatan) return pmGagal('Tulis catatan untuk mahasiswa.');
    if (p.jenis === 'surat' && p.status === 'admin' && a.p_aksi === 'setujui' && !(DB.pengajuan_berkas || []).some(b => b.pengajuan_id === p.id && b.jenis === 'surat_jadi'))
      return pmGagal('Unggah surat yang sudah ditandatangani dulu.');
    // 108: lomba satu persetujuan.
    p.status = a.p_aksi === 'kembalikan' ? 'dikembalikan' : a.p_aksi === 'tolak' ? 'ditolak' : p.status === 'pembimbing' && p.jenis !== 'lomba' ? 'admin' : 'disetujui';
    p.diperbarui = new Date().toISOString();
    pmRiwayat(p, p.status, saya.nama, a.p_catatan); simpan();
    return { data: p.status, error: null };
  }
  // 160: "Lihat seperti mahasiswa", tiruan: sama dengan patch (fungsi asli dijalankan dengan token sementara, lalu dibatalkan):
  // data disalin, cabang mhs_lihat / mhs_kirim / mhs_kirim_selesai di bawah dipanggil, lalu data dikembalikan dari salinan.
  if (nama === 'mhs_pratinjau_admin') {
    const saya = (DB.dosen || []).find(d => d.email === email());
    const p0 = PM().find(x => x.id === +a.p_id);
    if (!p0) return pmGagal('Pengajuan tidak ditemukan.');
    if (!saya || saya.peran !== 'admin') return pmGagal('Pratinjau pengajuan khusus admin prodi atau koordinator bidangnya.');
    const salinan = JSON.stringify(DB), T = '__pratinjau__';
    const coba = n => { const q = PM().find(x => x.id === p0.id); q.token = T; return pmRpc(n, { p_token: T }); };
    const lihat = coba('mhs_lihat').data;
    const tahap = p0.tahap || 'pengajuan';
    const xs = [['kirim', 'Kirim untuk diperiksa', tahap === 'pengajuan' && ['draf', 'dikembalikan'].includes(p0.status) && p0.data?.susulan !== 'selesai'],
      ['kirim_selesai', 'Kirim laporan selesai', lihat.jendela_selesai && (p0.data?.susulan === 'selesai' || tahap === 'selesai'
        || p0.data?.jawaban_instansi === 'diterima')]].filter(x => x[2]);   // sama dengan pengajuan.html bukaSelesai
    const periksa = xs.map(([aksi, label]) => {
      DB = JSON.parse(salinan);
      const r = coba(aksi === 'kirim' ? 'mhs_kirim' : 'mhs_kirim_selesai');
      return { aksi, label, lolos: !r.error, pesan: r.error ? r.error.message : null };
    });
    DB = JSON.parse(salinan); simpan();
    return { data: { lihat: { ...lihat, token: undefined }, periksa }, error: null };
  }
  // 175: catatan bimbingan TA, tiruan (aturan sama dengan 175-patch-bimbingan-ta.sql).
  if (['ta_bimbingan_konfirmasi', 'ta_bimbingan_rekap', 'ta_bimbingan_menunggu'].includes(nama)) {
    const saya = (DB.dosen || []).find(d => d.email === email()), B = (DB.ta_bimbingan ||= []);
    const koor = !!saya && (saya.peran === 'admin' || (DB.koordinator || []).some(k => k.dosen_id === saya.id && k.jabatan === 'koordinator_ta' && !k.selesai));
    const pbSaya = nim => pmPembimbingNim(nim).some(x => x.id === saya?.id);
    if (nama === 'ta_bimbingan_menunggu') {
      const g = new Map();
      for (const b of B.filter(b => b.status === 'menunggu' && !pmBimbSah(b) && pbSaya(b.nim))) {
        const x = g.get(b.nim) || { nim: b.nim, nama: b.nama, n: 0, tertua: b.diajukan }; x.n++; if (b.diajukan < x.tertua) x.tertua = b.diajukan; g.set(b.nim, x); }
      return { data: [...g.values()], error: null };
    }
    if (nama === 'ta_bimbingan_rekap') {
      const nims = new Map();
      for (const o of PM().filter(o => o.jenis === 'ta' && !['draf', 'ditolak', 'dibatalkan'].includes(o.status))) nims.set(o.nim, o.nama);
      for (const b of B) if (!nims.has(b.nim)) nims.set(b.nim, b.nama);
      const urutT = { sidang_akhir: 3, seminar_kemajuan: 2, seminar_proposal: 1 };
      return { data: [...nims].filter(([nim]) => koor || pbSaya(nim)).map(([nim, nm]) => { const xs = B.filter(b => b.nim === nim);
        const lulus = (DB.jadwal_ta || []).filter(t => t.nim === nim && t.status === 'selesai' && ['lulus', 'lulus_revisi'].includes(t.hasil))
          .sort((a, b) => urutT[b.tahap] - urutT[a.tahap])[0];
        return { nim, nama: nm, pembimbing: pmPembimbingNim(nim).map(x => x.nama).join(', ') || null, sah: xs.filter(pmBimbSah).length,
          menunggu: xs.filter(b => b.status === 'menunggu' && !pmBimbSah(b)).length, dikembalikan: xs.filter(b => b.status === 'dikembalikan').length,
          terakhir: xs.map(b => b.tanggal).sort().at(-1) || null, tahap_lulus: lulus?.tahap || null }; }).sort((a, b) => a.nama.localeCompare(b.nama)), error: null };
    }
    if (!saya) return pmGagal('Masuk sebagai dosen terdaftar dulu.');
    if (!a.p_setuju && String(a.p_catatan || '').trim().length < 3) return pmGagal('Tulis alasan mengembalikan (minimal 3 huruf).');
    const xs = B.filter(b => (a.p_ids || []).includes(b.id));
    if (!xs.length) return pmGagal('Pilih catatan bimbingan dulu.');
    if (xs.some(b => !(koor || pbSaya(b.nim)))) return pmGagal('Catatan bimbingan dikonfirmasi pembimbingnya, koordinator TA, atau admin.');
    for (const b of xs) Object.assign(b, { status: a.p_setuju ? 'dikonfirmasi' : 'dikembalikan', catatan_pembimbing: String(a.p_catatan || '').trim() || null,
      konfirmasi_oleh: saya.nama, konfirmasi_pada: new Date().toISOString() });
    simpan(); return { data: xs.length, error: null };
  }
  if (!nama.startsWith('mhs_')) return null;
  const p = pmToken(a.p_token);
  if (!p) return pmGagal('Tautan tidak berlaku. Minta tautan baru di halaman pengajuan.');
  // Laporan selesai KP (patch 91), tiruan ringkas.
  const tahap = p.tahap || 'pengajuan', jendela = p.jenis === 'kp' && ((tahap === 'pengajuan' && p.status === 'disetujui') || (tahap === 'selesai' && p.status === 'dikembalikan')
    || (tahap === 'pengajuan' && ['draf', 'dikembalikan'].includes(p.status) && p.data?.susulan === 'selesai'));   // 106: lapor KP susulan
  // Jawaban instansi (107), tiruan: ditolak = pengajuan ditutup; diterima = surat balasan + tanggal mulai.
  const bisaJawab = p.jenis === 'kp' && tahap === 'pengajuan' && p.status === 'disetujui';
  if (nama === 'mhs_tolak_instansi') {
    if (!bisaJawab) return pmGagal('Hanya untuk pengajuan KP yang surat pengantarnya sudah terbit.');
    if (String(a.p_alasan || '').trim().length < 5) return pmGagal('Tulis alasan singkat penolakan dari instansi.');
    const ins = p.data?.instansi || '(tanpa nama)', hari = new Date().toISOString().slice(0, 10);
    (DB.kp_tolak_instansi ||= []).push({ id: baru(), pengajuan_id: p.id, instansi: ins, alasan: a.p_alasan, dibuat: new Date().toISOString() });
    p.status = 'ditolak'; p.data = { ...p.data, jawaban_instansi: 'ditolak', alasan_instansi: a.p_alasan, tanggal_jawaban: hari };
    pmRiwayat(p, 'ditolak', 'mahasiswa', `Ditolak instansi ${ins}: ${a.p_alasan}. Pengajuan ditutup; mahasiswa membuat pengajuan baru.`); simpan();
    return { data: 'ditolak', error: null };
  }
  if (nama === 'mhs_terima_instansi') {
    if (!bisaJawab) return pmGagal('Hanya untuk pengajuan KP yang surat pengantarnya sudah terbit.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(a.p_mulai || '')) return pmGagal('Isi tanggal mulai KP.');
    if (!(DB.pengajuan_berkas || []).some(b => b.pengajuan_id === p.id && b.jenis === 'surat_balasan')) return pmGagal('Unggah surat balasan (penerimaan) dari instansi dulu.');
    p.data = { ...p.data, jawaban_instansi: 'diterima', tanggal_mulai: a.p_mulai, tanggal_jawaban: new Date().toISOString().slice(0, 10) };
    pmRiwayat(p, 'disetujui', 'mahasiswa', `Diterima instansi ${p.data.instansi || ''}; mulai KP ${a.p_mulai}.`); simpan();
    return { data: 'diterima', error: null };
  }
  if (nama === 'mhs_ubah_selesai') { if (!jendela) return pmGagal('Laporan selesai KP belum bisa diubah.'); p.data_selesai = a.p_data; simpan(); return { data: 'ok', error: null }; }
  if (nama === 'mhs_kirim_selesai') {
    if (!jendela) return pmGagal('Laporan selesai KP sudah dikirim atau belum bisa dikirim.');
    // Urutan dan bunyi pesan sama dengan mhs_kirim_selesai (106), 2026-11-24.
    if (tahap === 'pengajuan' && (!p.data?.instansi || !p.pembimbing_id)) return pmGagal('Isi nama instansi dan pilih dosen pembimbing KP.');
    const ds = p.data_selesai || {};
    if (!ds.tanggal_mulai || !ds.tanggal_selesai || !ds.pembimbing_lapangan || String(ds.ringkasan || '').length < 30)
      return pmGagal('Lengkapi tanggal mulai dan selesai, pembimbing lapangan, dan ringkasan kegiatan (minimal 30 huruf).');
    for (const j of ['laporan_kp', 'surat_selesai']) if (!(DB.pengajuan_berkas || []).some(b => b.pengajuan_id === p.id && b.jenis === j))
      return pmGagal(`Unggah berkas wajib dulu: ${j === 'laporan_kp' ? 'laporan KP' : 'surat keterangan selesai'}.`);
    Object.assign(p, { tahap: 'selesai', status: 'pembimbing', diperbarui: new Date().toISOString() });
    (DB.pengajuan_riwayat ||= []).push({ id: baru(), pengajuan_id: p.id, status: 'pembimbing', oleh: 'mahasiswa', tahap: 'selesai', waktu: new Date().toISOString() });
    simpan(); return { data: 'pembimbing', error: null };
  }
  const jd = (DB.jadwal_ta || []).find(j => j.pengajuan_id === p.id);
  const tetapTA = PM().filter(o => o.nim === p.nim && o.jenis === 'ta' && o.data?.tahap_ta === 'penetapan_pembimbing' && o.status === 'disetujui').at(-1);
  const nmD = id => (DB.dosen || []).find(d => d.id === id)?.nama || null;
  if (nama === 'mhs_lihat') return { data: { ...p, token: undefined, tahap, data_selesai: p.data_selesai || {},
    penetapan_ta: tetapTA ? { id: tetapTA.id, kk_ta: tetapTA.data.kk_ta, judul: tetapTA.data.judul, pembimbing: nmD(tetapTA.pembimbing_id),
      pembimbing_2: nmD(tetapTA.data.pembimbing_2) } : null,
    pembimbing_2: (DB.dosen || []).find(d => d.id === p.data?.pembimbing_2)?.nama || null,
    jadwal: jd ? { ...jd, penguji: (jd.penguji || []).map(n => (DB.dosen || []).find(d => d.nidn === n)?.nama || n) } : null,
    boleh_ubah: ['draf', 'dikembalikan'].includes(p.status) || (p.jenis === 'kp' && tahap === 'pengajuan' && p.status === 'disetujui'), jendela_selesai: jendela,
    lain: PM().filter(o => o.nim === p.nim && o.id !== p.id).map(o => ({ id: o.id, jenis: o.jenis, status: o.status, tahap: o.tahap || 'pengajuan',
      judul: o.data?.instansi || o.data?.nama_kegiatan || '' })), pembimbing: (DB.dosen || []).find(d => d.id === p.pembimbing_id)?.nama,
    berkas: (DB.pengajuan_berkas || []).filter(b => b.pengajuan_id === p.id).map(b => ({ ...b, oleh: b.oleh === 'mahasiswa' ? 'mahasiswa' : 'prodi' })),
    riwayat: (DB.pengajuan_riwayat || []).filter(r => r.pengajuan_id === p.id) }, error: null };
  // 161: batalkan pengajuan oleh mahasiswa, tiruan (sama dengan mhs_batal).
  if (nama === 'mhs_batal') {
    if (p.status === 'dibatalkan') return { data: 'dibatalkan', error: null };
    if (tahap !== 'pengajuan' || !['draf', 'dikembalikan'].includes(p.status))
      return pmGagal('Pengajuan yang sedang diperiksa atau sudah diputuskan tidak bisa dibatalkan sendiri. Minta pemeriksa mengembalikannya dulu, atau hubungi admin prodi.');
    const al = String(a.p_alasan || '').trim().slice(0, 300);
    p.status = 'dibatalkan'; p.diperbarui = new Date().toISOString();
    pmRiwayat(p, 'dibatalkan', 'mahasiswa', 'Dibatalkan mahasiswa' + (al ? ': ' + al : '') + '.'); simpan();
    return { data: 'dibatalkan', error: null };
  }
  // 175: catatan bimbingan TA mahasiswa, tiruan (tidak bergantung status pengajuan, sama dengan SQL).
  if (nama === 'mhs_bimbingan' || nama === 'mhs_bimbingan_simpan' || nama === 'mhs_bimbingan_hapus') {
    if (p.jenis !== 'ta') return pmGagal('Catatan bimbingan ada di pengajuan TA.');
    const B = (DB.ta_bimbingan ||= []), pb = pmPembimbingNim(p.nim);
    if (nama === 'mhs_bimbingan') return { data: { hari_otomatis: 14, pembimbing: pb,
      catatan: B.filter(b => b.nim === p.nim).sort((x, y) => y.tanggal.localeCompare(x.tanggal) || y.id - x.id).map(b => ({ ...b,
        pembimbing: (DB.dosen || []).find(d => d.id === b.pembimbing_id)?.nama || null, sah: pmBimbSah(b), ada_lampiran: !!b.lampiran_url })),
      syarat: ['seminar_proposal', 'seminar_kemajuan', 'sidang_akhir'].map(t => pmSyaratBimb(p.nim, t)) }, error: null };
    if (nama === 'mhs_bimbingan_hapus') {
      const b = B.find(x => x.id === a.p_id && x.nim === p.nim);
      if (!b) return pmGagal('Catatan bimbingan tidak ditemukan.');
      if (pmBimbSah(b)) return pmGagal('Catatan yang sudah terkonfirmasi tidak bisa dihapus.');
      B.splice(B.indexOf(b), 1); simpan(); return { data: 'dihapus', error: null };
    }
    if (!pb.length) return pmGagal('Pembimbing TA Anda belum tercatat; ajukan pembimbing TA dulu.');
    if (!pb.some(x => x.id === a.p_pembimbing)) return pmGagal('Pilih pembimbing yang membimbing.');
    const kini = new Date().toISOString(), isi = { tanggal: a.p_tanggal, cara: a.p_cara, pembimbing_id: a.p_pembimbing,
      topik: String(a.p_topik || '').trim(), arahan: String(a.p_arahan || '').trim(), status: 'menunggu', diajukan: kini };
    if (!a.p_id) { const b = { id: baru(), nim: p.nim, nama: p.nama, dibuat: kini, ...isi }; B.push(b); simpan(); return { data: b.id, error: null }; }
    const b = B.find(x => x.id === a.p_id && x.nim === p.nim);
    if (!b) return pmGagal('Catatan bimbingan tidak ditemukan.');
    if (pmBimbSah(b)) return pmGagal('Catatan yang sudah terkonfirmasi tidak bisa diubah.');
    Object.assign(b, isi); simpan(); return { data: b.id, error: null };
  }
  if (!['draf', 'dikembalikan'].includes(p.status)) return pmGagal('Pengajuan sedang diperiksa; isian tidak bisa diubah.');
  if (nama === 'mhs_ubah') { Object.assign(p, { nama: a.p_nama, pembimbing_id: a.p_pembimbing, data: a.p_data, diperbarui: new Date().toISOString() }); simpan(); return { data: 'ok', error: null }; }
  // 122: tautan Google Drive untuk berkas yudisium yang terlalu besar.
  if (nama === 'mhs_tautan_berkas') {
    if (p.jenis !== 'yudisium') return pmGagal('Tautan berkas hanya untuk berkas yudisium.');
    if (!/^https:\/\/(drive|docs)\.google\.com\/\S+$/.test(a.p_url || '')) return pmGagal('Tempelkan tautan Google Drive (diawali https://drive.google.com/ atau https://docs.google.com/).');
    const b = { id: baru(), pengajuan_id: p.id, jenis: a.p_jenis, nama: a.p_nama || 'Tautan Google Drive', url: a.p_url, tautan: true, oleh: 'mahasiswa', dibuat: new Date().toISOString() };
    (DB.pengajuan_berkas ||= []).push(b); simpan(); return { data: b.id, error: null };
  }
  if (nama === 'mhs_kirim') {
    if (p.jenis === 'kp' && p.data?.susulan === 'selesai') return pmGagal('KP yang sudah selesai dikirim dengan tombol Kirim laporan selesai.');
    // 107: KP = surat permohonan atau surat balasan, langsung ke koordinator KP/admin.
    if (p.jenis === 'kp' && !(DB.pengajuan_berkas || []).some(b => b.pengajuan_id === p.id && ['surat_permohonan', 'surat_balasan'].includes(b.jenis)))
      return pmGagal('Unggah surat permohonan KP dulu (atau surat balasan instansi bila Anda sudah diterima).');
    // 110: pengajuan pembimbing TA langsung ke koordinator TA; seminar/sidang memakai pembimbing yang ditetapkan.
    const aju = p.jenis === 'ta' && p.data?.tahap_ta === 'penetapan_pembimbing';
    if (aju && !p.data?.kk_ta) return pmGagal('Pilih kelompok keahlian TA dan tulis judul awal.');
    if (aju) {
      const k = (DB.dosen || []).find(d => d.id === p.pembimbing_id)?.kelompok_keahlian, t = p.data.kk_ta;
      if (!(k && (k === t || DB.ta_kk_dekat.some(x => (x.kk_a === t && x.kk_b === k) || (x.kk_b === t && x.kk_a === k)))))
        return pmGagal('Pembimbing 1 harus dari kelompok keahlian TA Anda atau yang berdekatan; pilih dari daftar.');
    }
    if (p.jenis === 'ta' && !aju && tetapTA) { p.pembimbing_id = tetapTA.pembimbing_id; p.data = { ...p.data, pembimbing_2: tetapTA.data.pembimbing_2 }; }
    // Berkas wajib dan bunyi pesannya sama dengan mhs_kirim (144); kabar = foto kegiatan (2026-11-24: sebelumnya tidak ditiru).
    const wajib = p.jenis === 'lomba' ? 'laporan_lomba' : p.jenis === 'ta' && !aju ? 'naskah_ta' : p.jenis === 'luaran' ? 'bukti_luaran'
      : p.jenis === 'kabar' ? 'foto' : null;   // surat (93): tanpa berkas wajib
    const namaWajib = { naskah_ta: 'naskah TA', bukti_luaran: 'bukti publikasi/luaran', foto: 'foto kegiatan' };
    if (wajib && !(DB.pengajuan_berkas || []).some(b => b.pengajuan_id === p.id && b.jenis === wajib))
      return pmGagal(`Unggah berkas wajib dulu: ${namaWajib[wajib] || wajib.replace(/_/g, ' ')}.`);
    // 174: seminar/sidang TA = berkas wajib tahapnya (ta_berkas), pesan sama dengan ta_periksa_berkas.
    const tahapTA = p.jenis === 'ta' ? p.data?.tahap_ta : null;   // 176: termasuk pengajuan pembimbing TA
    const kurangTA = (DB.ta_berkas || []).filter(t => t.tahap === tahapTA && t.aktif && t.wajib
      && !(DB.pengajuan_berkas || []).some(b => b.pengajuan_id === p.id && b.jenis === t.kode)).sort((a, b) => a.urut - b.urut).map(t => t.label);
    // 175: minimal bimbingan terkonfirmasi sejak tahap sebelumnya (sesudah pemeriksaan berkas, sama dengan urutan trigger).
    if (tahapTA && !aju && !kurangTA.length) { const s = pmSyaratBimb(p.nim, tahapTA);
      if (!s.cukup) return pmGagal(`Bimbingan terkonfirmasi${s.sejak ? ' sejak tahap sebelumnya (' + s.sejak.split('-').reverse().join('-') + ')' : ''}: baru ${s.terhitung} dari minimal ${s.minimal}. Catat bimbingan Anda di bagian Catatan bimbingan dan minta pembimbing mengonfirmasinya (catatan yang 14 hari tidak ditanggapi terkonfirmasi otomatis).`); }
    if (kurangTA.length) return pmGagal(`Berkas wajib ${{ penetapan_pembimbing: 'pengajuan pembimbing TA', seminar_proposal: 'seminar proposal', seminar_kemajuan: 'seminar kemajuan', sidang_akhir: 'sidang akhir' }[tahapTA]} belum lengkap: ${kurangTA.join(', ')}.`);
    // 122: yudisium = 14 berkas wajib (daftar bawaan patch 122), langsung ke admin prodi.
    if (p.jenis === 'yudisium') {
      const ada = new Set((DB.pengajuan_berkas || []).filter(b => b.pengajuan_id === p.id).map(b => b.jenis));
      const kurang = ['yud_form_pendaftaran', 'yud_laporan_ta', 'yud_transkrip', 'yud_pem', 'yud_toefl', 'yud_bebas_pustaka', 'yud_repository',
        'yud_bebas_alat_lab', 'yud_foto_warna', 'yud_foto_bw', 'yud_bebas_fasilitas', 'yud_bebas_plagiasi', 'yud_form_fpi', 'yud_artikel'].filter(k => !ada.has(k));
      if (kurang.length) return pmGagal('Berkas wajib belum lengkap: ' + kurang.join(', ') + '.');
    }
    const ke = ['surat', 'kp', 'yudisium'].includes(p.jenis) || aju ? 'admin' : 'pembimbing';
    p.status = ke; p.diperbarui = new Date().toISOString(); pmRiwayat(p, ke, 'mahasiswa'); simpan();
    return { data: ke, error: null };
  }
  return pmGagal('Fungsi tiruan tidak dikenal: ' + nama);
}
// Situs coba (pemilik 2026-11-19): "email" tautan pribadi tampil sebagai kotak di halaman, tautannya bisa langsung diklik.
function emailCoba(ke, xs){
  if (typeof document === 'undefined') return;
  document.getElementById('emailCoba')?.remove();
  const d = document.createElement('div'); d.id = 'emailCoba'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Email tiruan');
  d.style.cssText = 'position:fixed;right:12px;bottom:130px;z-index:99999;max-width:360px;background:#fff;color:#1a1a1a;border:2px solid #7a4a00;'
    + 'border-radius:10px;padding:12px 14px;box-shadow:0 6px 24px rgba(0,0,0,.25);font:14px/1.45 system-ui,sans-serif';
  const e = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  d.innerHTML = `<b>EMAIL TIRUAN (${LATIHAN ? 'latihan' : 'situs coba'})</b><button type="button" aria-label="Tutup" style="float:right;border:0;background:none;font-size:18px;cursor:pointer">×</button>
    <div style="color:#555;margin:2px 0 8px">Ke: ${e(ke)}. Di situs sungguhan tautan ini dikirim ke email kampus.</div>
    ${xs.length ? xs.map(([l, t]) => `<div style="margin:4px 0"><a href="pengajuan.html?dari=email-coba${LATIHAN ? '&latihan=1' : ''}#t=${e(t)}" style="color:#0b4ea2;font-weight:600">Buka tautan pribadi</a> · ${e(l)}</div>`).join('')
      : '<div>Tidak ada pengajuan untuk NIM ini.</div>'}`;
  d.querySelector('button').onclick = () => d.remove();
  document.body.appendChild(d);
}
function pmAppsScript(q){
  const isi = { ok: true, name: 'contoh.txt', mime: 'text/plain', data: btoa('Berkas contoh (situs coba)') };
  // 179: lampiran catatan bimbingan TA (tiruan): unggah mencatat nama + tautan contoh; buka mengembalikan berkas contoh.
  if (q.kind === 'mhs_bimbingan_unggah' || q.kind === 'mhs_bimbingan_buka' || q.kind === 'ta_bimbingan_buka') {
    const b = (DB.ta_bimbingan || []).find(x => x.id === +q.id && (q.kind === 'ta_bimbingan_buka' || x.nim === pmToken(q.t)?.nim));
    if (!b) return { ok: false, error: 'Catatan bimbingan tidak ditemukan.' };
    if (q.kind !== 'mhs_bimbingan_unggah') return b.lampiran_url ? isi : { ok: false, error: 'Lampiran tidak ada (atau sudah dihapus 30 hari setelah lulus).' };
    if (!/\.(pdf|jpe?g|png)$/i.test(q.filename || '')) return { ok: false, error: 'Mahasiswa hanya bisa mengunggah PDF, JPG, atau PNG. Simpan berkas Word/Excel sebagai PDF dulu.' };
    if (pmBimbSah(b)) return { ok: false, error: 'Catatan yang sudah terkonfirmasi tidak bisa diberi lampiran.' };
    Object.assign(b, { lampiran_nama: q.filename, lampiran_url: `https://drive.google.com/file/d/contohlampiran${baru()}abcdefghij/view`, lampiran_dihapus: null });
    simpan(); return { ok: true, name: q.filename };
  }
  if (q.kind === 'mhs_ajukan') {
    // 106/107: satu KP aktif per NIM.
    if (q.jenis === 'kp' && PM().some(o => o.nim === q.nim && o.jenis === 'kp' && !['ditolak', 'dibatalkan'].includes(o.status) && !(o.tahap === 'selesai' && o.status === 'disetujui')))
      return { ok: false, error: 'NIM ini masih punya KP yang dalam proses; satu mahasiswa hanya satu KP aktif. Bila surat pengantar ditolak instansi, buka tautan pengajuan itu dan laporkan di "Jawaban instansi" (ditolak); sesudah itu pengajuan baru bisa dibuat. Tautan hilang? Minta tautan baru.' };
    const t = 'tokencoba' + baru() + 'x'.repeat(30), p = { id: baru(), jenis: q.jenis, nim: q.nim, nama: q.nama, email: q.nim + '@student.contoh.ac.id',
      pembimbing_id: q.pembimbing_id, data: q.data, status: 'draf', token: t, dibuat: new Date().toISOString(), diperbarui: new Date().toISOString() };
    PM().push(p); pmRiwayat(p, 'draf', 'mahasiswa'); simpan();
    console.log('[coba] tautan pengajuan: ' + new URL('pengajuan.html#t=' + t, location.href).href);
    emailCoba(p.email, [[`${p.jenis.toUpperCase()}: ${p.data?.instansi || p.data?.nama_kegiatan || p.data?.judul || 'pengajuan baru'}`, t]]);
    return { ok: true, email: p.email };
  }
  if (q.kind === 'mhs_tautan_ulang') {
    const xs = PM().filter(o => o.nim === q.nim);
    emailCoba(q.nim + '@student.contoh.ac.id', xs.map(o => [`${o.jenis.toUpperCase()}: ${o.data?.instansi || o.data?.nama_kegiatan || o.data?.judul || '—'} (${o.status})`, o.token]));
    return { ok: true, email: q.nim + '@student.contoh.ac.id' };
  }
  // RPS (102; 113: RPS bertanda tangan Dekan), tiruan: tautan Drive palsu.
  if (q.kind === 'rps') return { ok: true, url: `https://drive.google.com/file/d/contohrps${baru()}abcdefghij/view`, name: q.filename };
  // 178: arsip TA (tiruan Apps Script): isi HTML disimpan di peramban; "Buka" mengembalikannya sebagai HTML.
  if (q.kind === 'ta_arsip_simpan' || q.kind === 'ta_arsip_buka') {
    const saya = (DB.dosen || []).find(d => d.email === email());
    const koor = !!saya && (saya.peran === 'admin' || (DB.koordinator || []).some(k => k.dosen_id === saya.id && k.jabatan === 'koordinator_ta' && !k.selesai));
    if (!koor) return { ok: false, error: 'Arsip TA disimpan koordinator TA atau admin.' };
    const A = (DB.ta_arsip ||= []);
    if (q.kind === 'ta_arsip_buka') { const a = A.find(x => x.nim === q.nim);
      if (!a) return { ok: false, error: 'Arsip TA mahasiswa ini belum disimpan.' };
      return { ok: true, name: `Arsip TA ${a.nim}.html`, mime: 'text/html', data: btoa(unescape(encodeURIComponent(a.html))) }; }
    if (!pmArsipSiap().some(r => r.nim === q.nim)) return { ok: false, error: `Mahasiswa ${q.nim} belum lulus sidang akhir (atau revisinya belum selesai).` };
    const lama = A.find(x => x.nim === q.nim);
    const baris = { nim: q.nim, nama: q.nama, url: `https://drive.google.com/file/d/contoharsip${baru()}abcdefghij/view`, oleh: saya.nama,
      dibuat: new Date().toISOString(), html: q.html };
    if (lama) Object.assign(lama, baris); else A.push(baris);
    simpan(); return { ok: true, url: baris.url, name: `Arsip TA ${q.nim} ${q.nama}.pdf` };
  }
  if (q.kind === 'mhs_unggah' || q.kind === 'mhs_unggah_prodi') {
    // Mahasiswa hanya PDF dan gambar (sama dengan MHS_EXT di Code.gs, pemilik 2026-11-20).
    if (q.kind === 'mhs_unggah' && !/\.(pdf|jpe?g|png)$/i.test(q.filename || '')) return { ok: false, error: 'Mahasiswa hanya bisa mengunggah PDF, JPG, atau PNG. Simpan berkas Word/Excel sebagai PDF dulu.' };
    const p = q.kind === 'mhs_unggah' ? pmToken(q.t) : PM().find(x => x.id === q.pengajuan_id);
    if (!p) return { ok: false, error: 'Tautan tidak berlaku.' };
    (DB.pengajuan_berkas ||= []).push({ id: baru(), pengajuan_id: p.id, jenis: q.jenis_berkas, nama: q.filename,
      url: `https://drive.google.com/file/d/contohberkas${baru()}abcdefghij/view`, oleh: q.kind === 'mhs_unggah' ? 'mahasiswa' : email(), dibuat: new Date().toISOString() });
    if (q.kind === 'mhs_unggah_prodi') pmRiwayat(p, p.status, 'Admin', 'Mengunggah surat pengantar');
    simpan(); return { ok: true };
  }
  if (q.kind === 'mhs_buang') { DB.pengajuan_berkas = (DB.pengajuan_berkas || []).filter(b => b.id !== q.berkas); simpan(); return { ok: true }; }
  if (q.kind === 'mhs_buka' || q.kind === 'mhs_buka_prodi') return isi;
  if (q.kind === 'mhs_kabari') return { ok: true, terkirim: true };
  // 120: email undangan reviewer (Code.gs rpsReviewKabari_), tiruan tanpa email sungguhan.
  if (q.kind === 'rps_review_kabari') {
    const e = String(email()).toLowerCase(), saya = (DB.dosen || []).find(x => String(x.email || '').toLowerCase() === e);
    const boleh = saya?.peran === 'admin' || (DB.koordinator || []).some(k => k.dosen_id === saya?.id && k.jabatan === 'kaprodi' && !k.selesai);
    const v = (DB.mk_rps_review || []).find(x => x.kurikulum === q.kurikulum && x.kode_mk === q.kode && x.reviewer_id === q.reviewer);
    if (!boleh) return { ok: false, error: 'Email undangan reviewer dikirim Kaprodi aktif atau admin.' };
    if (!v || v.kirim_pada) return { ok: false, error: 'Dosen ini tidak ditunjuk sebagai reviewer RPS ini, atau review sudah dikirim.' };
    v.dikabari_pada = new Date().toISOString(); simpan();
    return { ok: true, ke: (DB.dosen || []).find(x => x.id === v.reviewer_id)?.email + ' (tiruan, tidak terkirim)' };
  }
  return null;
}

// Apps Script tiruan: unggah selalu berhasil, berkas tidak ke mana-mana.
const asli = window.fetch.bind(window);
window.fetch = (u, o) => {
  if (!String(u).includes('script.google.com')) return asli(u, o);
  const q = JSON.parse(o.body);
  const id = 'contohberkas' + baru() + 'abcdefghij';
  const pm = String(q.kind || '').startsWith('mhs_') || String(q.kind || '').startsWith('ta_arsip_') || q.kind === 'ta_bimbingan_buka'
    || q.kind === 'rps_review_kabari' ? pmAppsScript(q) : null;   // 178: arsip TA; 179: lampiran bimbingan
  const out = pm ? pm : q.kind === 'sidik' ? { ok: true, hasil: [] }
    : { ok: true, url: `https://drive.google.com/file/d/${id}/view`, name: q.filename || 'berkas.pdf', id, ...(q.privat || q.kind === 'bkd' ? { privat: true } : {}) };
  return new Promise(r => setTimeout(() => r(new Response(JSON.stringify(out))), 500));
};

// select('a, b, rel!inner(c, rel2(d))') -> pohon relasi.
function urai(s){
  const out = []; let d = 0, cur = '';
  for (const c of String(s || '*')) {
    if (c === '(') d++; if (c === ')') d--;
    if (c === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(x => x.includes('(')).map(x => {
    const m = x.match(/^(\w+)(!inner)?\((.*)\)$/s);
    return { nama: m[1], dalam: !!m[2], anak: urai(m[3]) };
  });
}
const KE_INDUK = { dosen: ['dosen_id', 'id'], karya: ['karya_id', 'id'], rapat: ['rapat_id', 'id'] };
function lengkapi(t, r, rel){
  const o = { ...r };
  for (const x of rel) {
    if (KE_INDUK[x.nama] && t !== x.nama) {
      const [fk0, pk] = KE_INDUK[x.nama];
      const fk = t === 'pengajuan_mahasiswa' && x.nama === 'dosen' ? 'pembimbing_id' : fk0;   // patch 90
      const induk = (DB[x.nama] || []).find(y => y[pk] === r[fk]);
      o[x.nama] = induk ? lengkapi(x.nama, induk, x.anak) : null;
    } else {
      o[x.nama] = (DB[x.nama] || []).filter(y => y[FK_ANAK[x.nama] || 'karya_id'] === r.id).map(y => lengkapi(x.nama, y, x.anak));
    }
  }
  return o;
}
const ambilKolom = (r, c) => c.includes('.') ? null : r[c];

function q(t){
  const saring = [], anak = [], urut = []; let op = 'baca', isi = null, satu = false, rel = [], batas = null, mulai = 0, opsi = {}, kepala = false, adaHitung = false;
  const f = {
    select(s, o){ if (op === 'baca') { rel = urai(s); kepala = !!o?.head; adaHitung = !!o?.count; } return f; },
    eq(c, v){ if (c.includes('.')) anak.push([c, v]); else saring.push(r => r[c] === v); return f; },
    neq(c, v){ saring.push(r => r[c] !== v); return f; },
    in(c, vs){ saring.push(r => vs.includes(r[c])); return f; },
    is(c, v){ saring.push(r => (r[c] ?? null) === v); return f; },
    not(c, o, v){ const xs = o === 'in' ? String(v).replace(/^\(|\)$/g, '').split(',') : null;
      saring.push(r => o === 'is' ? (r[c] ?? null) !== v : xs ? !xs.includes(String(r[c])) : r[c] !== v); return f; },
    gte(c, v){ saring.push(r => r[c] >= v); return f; }, lte(c, v){ saring.push(r => r[c] <= v); return f; },
    like(c, v){ const p = String(v); saring.push(r => p.endsWith('%') ? String(r[c] ?? '').startsWith(p.slice(0, -1)) : String(r[c] ?? '') === p); return f; },
    ilike(c, v){ const p = String(v).toLowerCase().replace(/[%*]/g, ''); saring.push(r => String(r[c] ?? '').toLowerCase().includes(p)); return f; },
    or(){ return f; }, order(c, o){ urut.push([c, o?.ascending !== false]); return f; },
    limit(k){ batas = k; return f; }, range(a, b){ mulai = a; batas = b - a + 1; return f; },
    single(){ satu = true; return f; }, maybeSingle(){ satu = true; return f; },
    insert(x){ op = 'tambah'; isi = x; return f; }, update(x){ op = 'ubah'; isi = x; return f; },
    upsert(x, o){ op = 'upsert'; isi = x; opsi = o || {}; return f; }, delete(){ op = 'hapus'; return f; },
    then(ok, no){
      DB[t] ||= [];
      const cocok = r => saring.every(s => s(r));
      let data = null, count = null;
      if (op === 'baca') {
        let xs = DB[t].filter(cocok).map(r => lengkapi(t, r, rel));
        for (const [c, v] of anak) { const [a, k] = c.split('.'); xs = xs.filter(r => (r[a] || []).some(y => y[k] === v)); }
        for (const [c, naik] of [...urut].reverse()) xs = [...xs].sort((a, b) => (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * (naik ? 1 : -1));
        count = xs.length;
        data = kepala ? null : xs.slice(mulai, batas == null ? undefined : mulai + batas);
      }
      const isian = x => {
        const r = { dibuat: new Date().toISOString(), dibuat_pada: new Date().toISOString(), ...x };
        if ((t === 'tautan_ami' || t === 'survei') && !r.token) r.token = (crypto.randomUUID()).replace(/-/g, '');
        if (r.id == null && !KUNCI[t] && t !== 'karya_penulis') r.id = TABEL_UUID.has(t) ? uuid() : baru();
        if (t === 'karya') { r.status ??= 'diajukan'; r.judul_norm ??= String(r.judul || '').toLowerCase(); }
        if (t.startsWith('ajuan_')) { r.status ??= 'menunggu'; r.hapus ??= false; }
        return r;
      };
      if (op === 'tambah') { data = (Array.isArray(isi) ? isi : [isi]).map(isian); DB[t].push(...data); }
      if (op === 'ubah') { data = DB[t].filter(cocok); data.forEach(r => Object.assign(r, isi)); }
      // Jejak mk_rps (111/112), tiruan: diperbarui dan oleh berubah saat isi berubah (pencegah tabrakan di rps.html).
      if (t === 'mk_rps' && ['ubah', 'tambah', 'upsert'].includes(op)) (data || []).forEach(r => Object.assign(r, { diperbarui: new Date().toISOString(), oleh: email() }));
      if (op === 'upsert') {
        const kunci = opsi.onConflict ? opsi.onConflict.split(',').map(s => s.trim()) : KUNCI[t] || ['id'];
        data = (Array.isArray(isi) ? isi : [isi]).map(x => {
          const lama = DB[t].find(r => kunci.every(k => r[k] === x[k]));
          if (lama) return Object.assign(lama, x);
          const r = isian(x); DB[t].push(r); return r;
        });
        // 114 (trigger rps_b_berubah), tiruan: bagian B berubah dari salinan disahkan -> RPS draf.
        if (t === 'mk_struktur') for (const s of data) for (const r of DB.mk_rps || [])
          if (r.kurikulum === s.kurikulum && r.kode_mk === s.kode_mk && r.status === 'disahkan'
              && JSON.stringify(r.sah?.struktur ?? null) !== JSON.stringify(s.data ?? null)) r.status = 'draf';
      }
      if (op === 'hapus') { data = DB[t].filter(cocok); DB[t] = DB[t].filter(r => !cocok(r)); }
      if (op !== 'baca') simpan();
      return Promise.resolve({ data: satu ? (data?.[0] ?? null) : data, error: null, count: adaHitung ? count : null }).then(ok, no);
    },
  };
  return f;
}
// 173: penilaian seminar/sidang TA, tiruan ringkas (aturan sama dengan 173-patch-penilaian-ta.sql, kecuali trigger penjaga
// jadwal_ta). Hitungan dari penilaian-ta.js, dimuat dari folder HALAMAN karena berkas ini juga disalin ke site/latihan/.
const TA_NILAI = new Set(['ta_nilai_simpan', 'ta_nilai_hapus', 'ta_nilai_rekap', 'ta_ba_tetapkan', 'ta_ba_buka', 'ta_rubrik_simpan', 'ta_nilai_tugas', 'ta_siup_tandai']);
async function taNilaiRpc(nama, a){
  const P = await import(new URL('penilaian-ta.js', location.href).href);
  const gagal = message => ({ data: null, error: { message } }), ok = data => ({ data, error: null });
  const saya = (DB.dosen || []).find(d => d.email === email());
  const koor = !!saya && (saya.peran === 'admin' || (DB.koordinator || []).some(k => k.dosen_id === saya.id && k.jabatan === 'koordinator_ta' && !k.selesai));
  const R = (DB.ta_rubrik ||= []), N = (DB.ta_nilai ||= []), J = DB.jadwal_ta || [];
  const nama_ = nidn => (DB.dosen || []).find(d => d.nidn === nidn)?.nama || nidn;
  const rubrikJadwal = j => j.rubrik_id ? R.find(r => r.id === j.rubrik_id) : R.filter(r => r.tahap === j.tahap).sort((x, y) => y.versi - x.versi)[0];
  const panel = j => [...(j.pembimbing || []).map(n => ({ peran: 'pembimbing', nidn: n, nama: nama_(n) })),
                      ...(j.penguji || []).map(n => ({ peran: 'penguji', nidn: n, nama: nama_(n) }))];
  const peranDi = (j, nidn) => (j.pembimbing || []).includes(nidn) ? 'pembimbing' : (j.penguji || []).includes(nidn) ? 'penguji' : null;
  const diPanel = (j, n) => n.bagian === 'bimbingan' ? peranDi(j, n.penilai_nidn) === 'pembimbing'
    : !!peranDi(j, n.penilai_nidn) || (!n.penilai_nidn && !!String(j.penguji_luar || '').trim());
  const hitung = j => { const r = rubrikJadwal(j);
    const x = P.rekapNilai({ rubrik: r, panel: panel(j), penguji_luar: j.penguji_luar,
      nilai: N.filter(n => n.jadwal_id === j.id && diPanel(j, n)).map(n => ({ bagian: n.bagian || 'seminar', nidn: n.penilai_nidn, nama: n.penilai_nama, total: n.total })) });
    return { rubrik_id: r?.id, rata_penguji: x.rataPenguji, rata_pembimbing: x.rataPembimbing, rata_bimbingan: x.rataBimbingan,
      nilai_akhir: x.akhir, kurang: x.kurang, saran: x.saran }; };
  const punyaNilai = (j, nidn, bagian) => N.some(n => n.jadwal_id === j.id && n.penilai_nidn === nidn && (n.bagian || 'seminar') === bagian);
  const kini = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  if (nama === 'ta_nilai_tugas') {
    if (!saya) return ok([]);
    return ok(J.filter(j => ['terjadwal', 'selesai'].includes(j.status) && !j.ba_ditetapkan && j.tanggal <= kini).flatMap(j => [
      ...(saya.nidn && peranDi(j, saya.nidn) && (!punyaNilai(j, saya.nidn, 'seminar') || (peranDi(j, saya.nidn) === 'pembimbing'
        && P.bobotBagian(rubrikJadwal(j)).bimbingan > 0 && !punyaNilai(j, saya.nidn, 'bimbingan'))) ? [{ tugas: 'nilai' }] : []),
      ...(koor && N.some(n => n.jadwal_id === j.id) ? [{ tugas: 'tetapkan' }] : [])]
      .map(t => ({ jadwal_id: j.id, tahap: j.tahap, nama_mahasiswa: j.nama_mahasiswa, tanggal: j.tanggal, ...t })))
      // 177: nilai belum diunggah ke SIUP (koordinator TA/admin).
      // 179: nilai belum diunggah ke SIUP -> pembimbing jadwal itu.
      .concat(saya?.nidn ? J.filter(j => j.ba_ditetapkan && !j.siup_diunggah && (j.pembimbing || []).includes(saya.nidn))
        .map(j => ({ jadwal_id: j.id, tahap: j.tahap, nama_mahasiswa: j.nama_mahasiswa, tanggal: j.tanggal, tugas: 'siup' })) : [])
      // 178: mahasiswa lulus yang arsipnya belum disimpan.
      .concat(koor ? pmArsipSiap().filter(r => !r.arsip_url).map(r => ({ jadwal_id: null, tahap: 'sidang_akhir', nama_mahasiswa: r.nama,
        tanggal: r.lulus, tugas: 'arsip' })) : []));
  }
  if (nama === 'ta_rubrik_simpan') {
    if (!koor) return gagal('Form penilaian TA diubah koordinator TA atau admin.');
    const g = P.cekRubrik({ komponen: a.p_komponen || [], komponen_bimbingan: a.p_komponen_bimbingan || [], bobot_penguji: a.p_bobot_penguji,
      bobot_bimbingan: a.p_bobot_bimbingan ?? 0, batas_lulus: a.p_batas_lulus, tingkat: a.p_tingkat });
    if (g.length) return gagal(g[0]);
    const versi = Math.max(0, ...R.filter(r => r.tahap === a.p_tahap).map(r => r.versi)) + 1;
    R.push({ id: baru(), tahap: a.p_tahap, versi, komponen: a.p_komponen, komponen_bimbingan: a.p_komponen_bimbingan || [],
      bobot_penguji: a.p_bobot_penguji, bobot_bimbingan: a.p_bobot_bimbingan ?? 0, batas_lulus: a.p_batas_lulus,
      tingkat: a.p_tingkat, catatan: a.p_catatan || null, oleh: saya.nama, dibuat: new Date().toISOString() });
    simpan(); return ok(versi);
  }
  // 177: tanda sudah diunggah ke SIUP (koordinator TA/admin; hanya berita acara yang sudah ditetapkan).
  if (nama === 'ta_siup_tandai') {
    const xs = J.filter(j => (a.p_ids || []).includes(j.id));
    if (!xs.length) return gagal('Pilih seminar/sidang dulu.');
    // 179: pembimbing jadwal itu juga boleh.
    const bukan = xs.filter(j => !koor && !(saya?.nidn && (j.pembimbing || []).includes(saya.nidn)));
    if (bukan.length) return gagal(`Tanda unggah SIUP diisi pembimbingnya, koordinator TA, atau admin (${bukan.map(j => j.nama_mahasiswa).join(', ')}).`);
    const belum = xs.filter(j => !j.ba_ditetapkan);
    if (belum.length) return gagal(`Berita acara belum ditetapkan: ${belum.map(j => j.nama_mahasiswa).join(', ')}.`);
    for (const j of xs) Object.assign(j, { siup_diunggah: a.p_sudah ? new Date().toISOString() : null, siup_oleh: a.p_sudah ? saya.nama : null });
    simpan(); return ok(xs.length);
  }
  const j = J.find(x => x.id === (a.p_jadwal ?? N.find(n => n.id === a.p_id)?.jadwal_id));
  if (!j) return gagal('Jadwal seminar/sidang tidak ditemukan.');
  if (nama === 'ta_nilai_rekap') {
    const sp = saya?.nidn ? peranDi(j, saya.nidn) : null;
    if (!koor && !sp) return gagal('Rekap nilai dibuka pembimbing/penguji seminar ini, koordinator TA, atau admin.');
    return ok({ jadwal: j, rubrik: rubrikJadwal(j) || null, panel: panel(j), hitung: hitung(j), saya: { peran: sp, koordinator: koor },
      nilai: N.filter(n => n.jadwal_id === j.id).map(n => ({ id: n.id, bagian: n.bagian || 'seminar', peran: n.peran, nidn: n.penilai_nidn, nama: n.penilai_nama, nilai: n.nilai,
        total: n.total, catatan: n.catatan, diisi_oleh: n.diisi_oleh, diwakilkan: n.diwakilkan, diperbarui: n.diperbarui, rubrik_id: n.rubrik_id,
        di_panel: diPanel(j, n) })) });
  }
  if (nama === 'ta_nilai_simpan') {
    if (j.ba_ditetapkan) return gagal('Berita acara sudah ditetapkan; nilai tidak bisa diubah. Minta koordinator TA membukanya kembali.');
    if (!['terjadwal', 'selesai'].includes(j.status)) return gagal(`Seminar/sidang ini berstatus ${j.status}; nilai tidak bisa diisi.`);
    if (!saya) return gagal('Masuk sebagai dosen terdaftar dulu.');
    let nidn = saya.nidn, nm = saya.nama, wakil = false, peran = null;
    if (a.p_nidn || String(a.p_nama_luar || '').trim()) {
      if (!koor) return gagal('Nilai atas nama penilai lain diisikan koordinator TA atau admin.');
      wakil = true;
      if (a.p_nidn) { nidn = a.p_nidn; nm = nama_(nidn); wakil = nidn !== saya.nidn; }
      else { nidn = null; nm = String(a.p_nama_luar).trim(); peran = 'penguji'; }
    }
    peran ||= peranDi(j, nidn);
    if (!peran) return gagal(`${wakil ? nm : 'Anda'} bukan pembimbing atau penguji seminar ini.`);
    const r = rubrikJadwal(j), bagian = a.p_bagian || 'seminar';
    if (!r) return gagal('Form penilaian tahap ini belum ada.');
    if (bagian === 'bimbingan' && peran !== 'pembimbing') return gagal('Nilai proses bimbingan diisi pembimbing.');
    if (bagian === 'bimbingan' && !(P.bobotBagian(r).bimbingan > 0)) return gagal('Form penilaian tahap ini tidak memakai nilai proses bimbingan.');
    const komp = bagian === 'bimbingan' ? r.komponen_bimbingan : r.komponen;
    const g = P.cekNilai(komp, a.p_nilai);
    if (g) return gagal(g);
    const total = P.totalNilai(komp, a.p_nilai);
    j.rubrik_id ||= r.id;
    const kunci = n => n.penilai_nidn || 'luar:' + String(n.penilai_nama).toLowerCase().trim();
    let n = N.find(x => x.jadwal_id === j.id && (x.bagian || 'seminar') === bagian && kunci(x) === (nidn || 'luar:' + nm.toLowerCase()));
    if (!n) N.push(n = { id: baru(), jadwal_id: j.id, bagian, penilai_nidn: nidn });
    Object.assign(n, { rubrik_id: r.id, peran, penilai_nama: nm, nilai: a.p_nilai, total, catatan: String(a.p_catatan || '').trim() || null,
      diisi_oleh: saya.nama, diwakilkan: wakil, diperbarui: new Date().toISOString() });
    simpan(); return ok(total);
  }
  if (nama === 'ta_nilai_hapus') {
    const n = N.find(x => x.id === a.p_id);
    if (j.ba_ditetapkan) return gagal('Berita acara sudah ditetapkan; nilai tidak bisa dihapus.');
    if (!(koor || (n.penilai_nidn && n.penilai_nidn === saya?.nidn))) return gagal('Nilai dihapus penilainya sendiri, koordinator TA, atau admin.');
    N.splice(N.indexOf(n), 1);
    if (!N.some(x => x.jadwal_id === j.id)) j.rubrik_id = null;
    simpan(); return ok('dihapus');
  }
  if (!koor) return gagal('Berita acara ditetapkan koordinator TA atau admin.');
  if (nama === 'ta_ba_buka') {
    if (String(a.p_alasan || '').trim().length < 5) return gagal('Tulis alasan membuka kembali (5–500 huruf).');
    if (!j.ba_ditetapkan) return gagal('Berita acara seminar ini belum ditetapkan.');
    Object.assign(j, { ba_ditetapkan: null, ba_oleh: null, nilai_akhir: null, hasil: null, revisi_selesai: null, siup_diunggah: null, siup_oleh: null,
      ba_dibuka: `${new Date().toISOString().slice(0, 16).replace('T', ' ')}, ${saya.nama}: ${String(a.p_alasan).trim()}` });
    simpan(); return ok('dibuka');
  }
  // ta_ba_tetapkan
  if (j.ba_ditetapkan) return gagal('Berita acara seminar ini sudah ditetapkan.');
  if (!N.some(n => n.jadwal_id === j.id)) return gagal('Belum ada nilai untuk seminar ini.');
  const h = hitung(j), r = rubrikJadwal(j);
  if (h.kurang.length) return gagal(`Nilai belum lengkap: ${h.kurang.map(k => k.nama + (k.bagian === 'bimbingan' ? ' (proses bimbingan)' : '')).join(', ')} belum menilai.`);
  let hasil = a.p_hasil;
  if (h.nilai_akhir < r.batas_lulus) {
    if ((hasil || 'mengulang') !== 'mengulang') return gagal(`Nilai akhir ${P.angka(h.nilai_akhir)} di bawah batas lulus ${P.angka(r.batas_lulus)}: hasilnya mengulang.`);
    hasil = 'mengulang';
  } else if (!['lulus', 'lulus_revisi'].includes(hasil)) return gagal(`Nilai akhir ${P.angka(h.nilai_akhir)} mencapai batas lulus ${P.angka(r.batas_lulus)}: pilih lulus atau lulus dengan revisi.`);
  if (hasil === 'lulus_revisi' && !a.p_batas_revisi) return gagal('Isi tenggat revisi.');
  Object.assign(j, { status: 'selesai', hasil, nilai_akhir: h.nilai_akhir, rubrik_id: r.id, ba_ditetapkan: new Date().toISOString(), ba_oleh: saya.nama,
    batas_revisi: hasil === 'lulus_revisi' ? a.p_batas_revisi : null, catatan_revisi: hasil === 'lulus_revisi' ? (String(a.p_catatan_revisi || '').trim() || null) : null });
  simpan(); return ok(hasil);
}
const sesi = () => email() === 'tamu' ? null : { access_token: 'contoh', user: { email: email() } };
export function createClient(){
  return { from: q,
    rpc(nama, a){
      if (TA_NILAI.has(nama)) return taNilaiRpc(nama, a || {});
      const pm = pmRpc(nama, a || {});
      if (pm) return Promise.resolve(pm);
      // Login dengan email utama atau alternatif (69-patch-email-alternatif.sql), tiruan.
      // Rekap evaluasi pembelajaran per TA + semester (68-patch-evaluasi-pembelajaran.sql), tiruan sebagian.
      if (nama === 'rekap_evaluasi') { const g = new Map(); (DB.evaluasi_mk || []).forEach(e => { const k = e.tahun_akademik + '|' + e.semester;
          if (!g.has(k)) g.set(k, { tahun_akademik: e.tahun_akademik, semester: e.semester, jumlah: 0, ber_edom: 0, s: 0 }); const x = g.get(k); x.jumlah++;
          if (e.edom != null) { x.ber_edom++; x.s += +e.edom; } });
        return Promise.resolve({ data: [...g.values()].map(({ s, ...x }) => ({ ...x, rerata_edom: x.ber_edom ? Math.round(s / x.ber_edom * 100) / 100 : null })), error: null }); }
      // Foto profil dosen sendiri (85-patch-foto-dosen.sql), tiruan: mengisi foto_url pengguna yang login.
      if (nama === 'atur_foto_profil') { const e = String(email()).toLowerCase();
        const d = (DB.dosen || []).find(x => [x.email, x.email_alternatif].some(v => String(v || '').toLowerCase() === e));
        if (d) { d.foto_url = a?.u || null; simpan(); }
        return Promise.resolve({ data: null, error: d ? null : { message: 'Belum masuk sebagai dosen terdaftar.' } }); }
      // RPS K26 tahap 2 (112), tiruan: penyusun = koordinator MK atau pengampu kelas semester terakhir; Kaprodi aktif memutuskan.
      // 118 (pemilik 2026-11-19), tiruan: review sejawat RPS (aturan sama dengan supabase/118-patch-rps-review.sql).
      if (['rps_review_tunjuk', 'rps_review_batal', 'rps_review_simpan', 'rps_review_mk', 'rps_review_tanggapi', 'rps_review_rekap', 'rps_review_undangan'].includes(nama)) {
        a = a || {};   // rps_review_rekap tanpa argumen
        const e = String(email()).toLowerCase(), saya = (DB.dosen || []).find(x => String(x.email || '').toLowerCase() === e);
        const gagal = message => Promise.resolve({ data: null, error: { message } }), ok = data => Promise.resolve({ data, error: null });
        const V = (DB.mk_rps_review ||= []), sini = v => v.kurikulum === a.p_kurikulum && v.kode_mk === a.p_kode;
        const r = (DB.mk_rps || []).find(x => x.kurikulum === a.p_kurikulum && x.kode_mk === a.p_kode);
        const sidik = () => JSON.stringify(r?.data || null);
        const pengelola = saya?.peran === 'admin' || (DB.koordinator || []).some(k => k.dosen_id === saya?.id && k.jabatan === 'kaprodi' && !k.selesai);
        if (nama === 'rps_review_mk') {
          if (!saya) return ok([]);
          return ok(V.filter(sini).map(v => { const d = (DB.dosen || []).find(x => x.id === v.reviewer_id), lihat = v.kirim_pada || v.reviewer_id === saya.id;
            return { reviewer_id: v.reviewer_id, nama: d?.nama_gelar || d?.nama, saya: v.reviewer_id === saya.id, ditunjuk_pada: v.ditunjuk_pada,
              kirim_pada: v.kirim_pada, diperbarui: v.diperbarui, revisi: v.revisi, sama: !!v.sidik && v.sidik === sidik(),
              kesimpulan: lihat ? v.kesimpulan : null, skor: lihat ? v.skor : null, catatan: lihat ? v.catatan : null, umum: lihat ? v.umum : null,
              tanggapan: v.kirim_pada ? v.tanggapan || {} : null, tanggapan_umum: v.kirim_pada ? v.tanggapan_umum || null : null, tanggapan_pada: v.tanggapan_pada || null,
              tanggapan_oleh: (DB.dosen || []).find(x => x.id === v.tanggapan_oleh)?.nama || null, dikabari_pada: v.dikabari_pada || null,
              tenggat: (() => { const d = new Date(v.ditunjuk_pada); d.setDate(d.getDate() + hariRv()); return d.toISOString().slice(0, 10); })() }; }));
        }
        // 119: rekap per MK dan tanggapan penyusun (pengampu MK = boleh_rps tiruan).
        // 120: hari tenggat review dari pengaturan; undangan (data email) untuk Kaprodi/admin.
        function hariRv(){ return +((DB.pengaturan || []).find(x => x.kunci === 'rps_review_hari')?.nilai) || 14; }
        if (nama === 'rps_review_undangan') {
          if (!pengelola) return gagal('Email undangan reviewer dikirim Kaprodi aktif atau admin.');
          const v = V.find(x => sini(x) && x.reviewer_id === a.p_reviewer);
          if (!v) return gagal('Dosen ini tidak ditunjuk sebagai reviewer RPS ini.');
          if (v.kirim_pada) return gagal('Review sudah dikirim; undangan tidak perlu dikirim lagi.');
          const d = (DB.dosen || []).find(x => x.id === v.reviewer_id); v.dikabari_pada = new Date().toISOString(); simpan();
          return ok({ email: d?.email, nama: d?.nama, kurikulum: a.p_kurikulum, kode_mk: a.p_kode });
        }
        if (nama === 'rps_review_rekap') {
          if (!saya) return ok([]);
          const g2 = new Map();
          for (const v of V) { const k = `${v.kurikulum}|${v.kode_mk}`; if (!g2.has(k)) g2.set(k, []); g2.get(k).push(v); }
          return ok([...g2.values()].map(xs => { const t = xs.filter(v => v.kirim_pada), rr = t.map(v => { const n = Object.values(v.skor || {}).map(Number); return n.reduce((a, b) => a + b, 0) / (n.length || 1); });
            return { kurikulum: xs[0].kurikulum, kode_mk: xs[0].kode_mk, ditunjuk: xs.length, terkirim: t.length, kesimpulan: t.map(v => v.kesimpulan),
              rerata: rr.length ? Math.round(rr.reduce((a, b) => a + b, 0) / rr.length * 100) / 100 : null,
              ditanggapi: t.filter(v => v.tanggapan_pada && v.tanggapan_pada >= v.kirim_pada).length }; }));
        }
        if (nama === 'rps_review_tanggapi') {
          const m = (DB.ref_mata_kuliah || []).find(x => x.kurikulum === a.p_kurikulum && x.kode === a.p_kode);
          if (!saya || !m || !(m.pengampu || []).includes(saya.nidn)) return gagal('Review ditanggapi dosen penyusun RPS ini (koordinator MK atau dosen pengampu).');
          const v = V.find(x => sini(x) && x.reviewer_id === a.p_reviewer && x.kirim_pada);
          if (!v) return gagal('Review ini belum dikirim reviewer.');
          if (Object.values(a.p_tanggapan || {}).some(t => !['diperbaiki', 'sebagian', 'tidak_diubah'].includes(t?.status)))
            return gagal('Tanggapan tiap butir: status diperbaiki, sebagian, atau tidak_diubah, dengan uraian teks.');
          Object.assign(v, { tanggapan: a.p_tanggapan || {}, tanggapan_umum: (a.p_umum || '').trim() || null, tanggapan_pada: new Date().toISOString(), tanggapan_oleh: saya.id });
          simpan(); return ok('ditanggapi');
        }
        if (nama === 'rps_review_tunjuk') {
          if (!pengelola) return gagal('Reviewer RPS ditunjuk Kaprodi aktif atau admin.');
          if (r?.data?.pengembang === a.p_dosen) return gagal('Dosen pengembang RPS ini tidak dapat menjadi reviewernya.');
          if (!V.some(v => sini(v) && v.reviewer_id === a.p_dosen))
            V.push({ id: baru(), kurikulum: a.p_kurikulum, kode_mk: a.p_kode, reviewer_id: a.p_dosen, ditunjuk_oleh: saya.id,
              ditunjuk_pada: new Date().toISOString(), skor: {}, catatan: {}, umum: null, kesimpulan: null, kirim_pada: null, diperbarui: new Date().toISOString() });
          simpan(); return ok('ditunjuk');
        }
        if (nama === 'rps_review_batal') {
          if (!pengelola) return gagal('Penunjukan reviewer diubah Kaprodi aktif atau admin.');
          if (V.some(v => sini(v) && v.reviewer_id === a.p_dosen && v.kirim_pada)) return gagal('Review sudah dikirim; penunjukan tidak dapat dibatalkan.');
          DB.mk_rps_review = V.filter(v => !(sini(v) && v.reviewer_id === a.p_dosen)); simpan(); return ok('dibatalkan');
        }
        const v = V.find(x => sini(x) && x.reviewer_id === saya?.id);
        if (!v) return gagal('Anda tidak ditunjuk sebagai reviewer RPS ini.');
        if (Object.values(a.p_skor || {}).some(n => ![1, 2, 3, 4].includes(n))) return gagal('Skor tiap butir harus 1, 2, 3, atau 4.');
        if (a.p_kirim) {
          if (!r) return gagal('RPS MK ini belum diisi; belum ada yang direview.');
          if (!a.p_kesimpulan) return gagal('Pilih kesimpulan review sebelum mengirim.');
          if (!Object.keys(a.p_skor || {}).length) return gagal('Isi skor butir penilaian sebelum mengirim.');
        }
        Object.assign(v, { skor: a.p_skor || {}, catatan: a.p_catatan || {}, umum: (a.p_umum || '').trim() || null, kesimpulan: a.p_kesimpulan,
          diperbarui: new Date().toISOString() }, a.p_kirim ? { kirim_pada: new Date().toISOString(), revisi: r.revisi, sidik: sidik() } : {});
        simpan(); return ok(a.p_kirim ? 'dikirim' : 'disimpan');
      }
      // 121 (pemilik 2026-11-19), tiruan: bahan Word lewat kode QR (tanpa login) dan tautan dokumen RPS elektronik.
      if (nama === 'rps_dokumen') {
        const r = (DB.mk_rps || []).find(x => x.kode_verifikasi && x.kode_verifikasi === a.p_kode && x.sah);
        if (!r) return Promise.resolve({ data: null, error: null });
        const m = (DB.ref_mata_kuliah || []).find(x => x.kurikulum === r.kurikulum && x.kode === r.kode_mk) || {};
        const ids = [r.sah?.rps?.pengembang, r.sah_oleh, r.sah_atas_nama, r.tetap_oleh, r.tetap_atas_nama];
        const seb = (id, j) => (DB.koordinator || []).find(k => k.dosen_id === id && k.jabatan === j && !k.selesai)?.sebutan || null;
        const atur = k => (DB.pengaturan || []).find(x => x.kunci === k)?.nilai ?? null;
        return Promise.resolve({ data: { mk: { kurikulum: m.kurikulum, kode: m.kode, nama: m.nama, sks: m.sks, sks_kuliah: m.sks_kuliah,
            sks_praktikum: m.sks_praktikum, semester: m.semester, sifat: m.sifat, capstone: m.capstone },
          rps: { status: r.status, revisi: r.revisi, sah: r.sah, sah_pada: r.sah_pada, sah_oleh: r.sah_oleh, sah_atas_nama: r.sah_atas_nama,
            tetap_pada: r.tetap_pada || null, tetap_oleh: r.tetap_oleh || null, tetap_atas_nama: r.tetap_atas_nama || null, kode_verifikasi: r.kode_verifikasi },
          log: (DB.mk_rps_pengesahan || []).filter(l => l.kurikulum === r.kurikulum && l.kode_mk === r.kode_mk && ['ajukan', 'sahkan', 'tetapkan'].includes(l.aksi)),
          dosen: (DB.dosen || []).filter(d => ids.includes(d.id)).map(d => ({ id: d.id, nama: d.nama, nama_gelar: d.nama_gelar, nip: d.nip })),
          cpl: (DB.ref_cpl || []).filter(c => c.kurikulum === r.kurikulum), peta_cpl: (DB.ref_mk_cpl || []).filter(p => p.kurikulum === r.kurikulum && p.kode_mk === r.kode_mk),
          sebutan: { kaprodi: seb(r.sah_atas_nama, 'kaprodi'), dekan: r.tetap_pada ? seb(r.tetap_atas_nama, 'dekan') : null },
          tanggal: { ganjil: atur('rps_tanggal_ganjil'), genap: atur('rps_tanggal_genap') },
          dekan_aktif: (DB.koordinator || []).some(k => k.jabatan === 'dekan' && !k.selesai) }, error: null });
      }
      if (nama === 'rps_pasang_tautan') {
        const e = String(email()).toLowerCase(), saya = (DB.dosen || []).find(x => String(x.email || '').toLowerCase() === e);
        const jab = j => (DB.koordinator || []).some(k => k.dosen_id === saya?.id && k.jabatan === j && !k.selesai);
        if (!(saya?.peran === 'admin' || jab('kaprodi') || jab('dekan'))) return Promise.resolve({ data: null, error: { message: 'Tautan dokumen RPS dipasang Kaprodi, Dekan, atau admin.' } });
        if (!/^https:\/\/\S+\/$/.test(a.p_situs || '')) return Promise.resolve({ data: null, error: { message: 'Alamat situs tidak sah (harus https://.../).' } });
        const r = (DB.mk_rps || []).find(x => x.kurikulum === a.p_kurikulum && x.kode_mk === a.p_kode);
        if (!r || r.status !== 'disahkan' || !r.kode_verifikasi) return Promise.resolve({ data: 'belum_disahkan', error: null });
        if (!r.tetap_pada && (DB.koordinator || []).some(k => k.jabatan === 'dekan' && !k.selesai)) return Promise.resolve({ data: 'menunggu_dekan', error: null });
        const m = (DB.ref_mata_kuliah || []).find(x => x.kurikulum === a.p_kurikulum && x.kode === a.p_kode);
        if (m) Object.assign(m, { rps_url: `${a.p_situs}verifikasi-rps.html?k=${r.kode_verifikasi}`, rps_ada: true });
        simpan(); return Promise.resolve({ data: 'terpasang', error: null });
      }
      // 116/117 (pemilik 2026-11-19), tiruan: verifikasi publik dari kode QR.
      if (nama === 'rps_verifikasi') {
        const r = (DB.mk_rps || []).find(x => x.kode_verifikasi && x.kode_verifikasi === a.p_kode);
        if (!r) return Promise.resolve({ data: { ditemukan: false }, error: null });
        const nm = id => { const d = (DB.dosen || []).find(x => x.id === id); return d ? d.nama_gelar || d.nama : null; };
        const seb = (id, j) => (DB.koordinator || []).find(k => k.dosen_id === id && k.jabatan === j && !k.selesai)?.sebutan || null;
        const aju = (DB.mk_rps_pengesahan || []).filter(l => l.kurikulum === r.kurikulum && l.kode_mk === r.kode_mk && l.aksi === 'ajukan').pop();
        return Promise.resolve({ data: { ditemukan: true, kurikulum: r.kurikulum, kode_mk: r.kode_mk,
          nama_mk: (DB.ref_mata_kuliah || []).find(m => m.kurikulum === r.kurikulum && m.kode === r.kode_mk)?.nama, revisi: r.revisi, status: r.status,
          berlaku: r.status === 'disahkan', sidik: 'tiruan', diajukan: aju ? { nama: aju.oleh_nama, waktu: aju.waktu } : null,
          disahkan: { waktu: r.sah_pada, atas_nama: nm(r.sah_atas_nama), sebutan: seb(r.sah_atas_nama, 'kaprodi'), oleh: nm(r.sah_oleh), diwakilkan: r.sah_oleh !== r.sah_atas_nama },
          ditetapkan: r.tetap_pada ? { waktu: r.tetap_pada, atas_nama: nm(r.tetap_atas_nama), sebutan: seb(r.tetap_atas_nama, 'dekan'), oleh: nm(r.tetap_oleh),
            diwakilkan: r.tetap_oleh !== r.tetap_atas_nama } : null }, error: null });
      }
      if (['rps_boleh_saya', 'rps_ajukan', 'rps_putuskan', 'rps_unggah_ttd', 'rps_tetapkan'].includes(nama)) {
        const e = String(email()).toLowerCase(), saya = (DB.dosen || []).find(x => String(x.email || '').toLowerCase() === e);
        const K = DB.cpl_kelas || [], urut = k => `${k.tahun_akademik}|${k.semester === 'Genap' ? 2 : 1}`;
        const akhir = K.reduce((a, k) => (urut(k) > a ? urut(k) : a), '');
        const boleh = m => !!saya && ((m.pengampu || []).includes(saya.nidn)
          || K.some(k => urut(k) === akhir && String(k.kode_mk).toUpperCase() === String(m.kode).toUpperCase() && String(k.dosen_email).toLowerCase() === e));
        if (nama === 'rps_boleh_saya') return Promise.resolve({ data: (DB.ref_mata_kuliah || []).filter(boleh).map(m => ({ kurikulum: m.kurikulum, kode_mk: m.kode })), error: null });
        const gagal = message => Promise.resolve({ data: null, error: { message } });
        const r = (DB.mk_rps || []).find(x => x.kurikulum === a.p_kurikulum && x.kode_mk === a.p_kode);
        const catat = (aksi, revisi, sendiri = false) => (DB.mk_rps_pengesahan ||= []).push({ id: baru(), kurikulum: a.p_kurikulum, kode_mk: a.p_kode, aksi, oleh_id: saya?.id,
          oleh_nama: saya?.nama_gelar || saya?.nama, catatan: a.p_catatan || null, revisi, penyusun_sendiri: sendiri, waktu: new Date().toISOString() });
        if (nama === 'rps_unggah_ttd') {   // 113: bukti = RPS bertanda tangan Dekan
          const m = (DB.ref_mata_kuliah || []).find(x => x.kurikulum === a.p_kurikulum && x.kode === a.p_kode);
          if (!m || !(boleh(m) || saya?.peran === 'admin')) return gagal('RPS bertanda tangan Dekan diunggah koordinator MK, dosen pengampu MK ini, atau admin prodi.');
          if (r && !(r.revisi > 0)) return gagal('RPS di situs belum disahkan Kaprodi; unggah setelah disahkan dan ditandatangani Dekan.');
          (DB.mk_rps_ttd ||= []).push({ id: baru(), kurikulum: a.p_kurikulum, kode_mk: a.p_kode, url: a.p_url, nama: a.p_nama, revisi: r ? r.revisi : null,
            oleh: email(), waktu: new Date().toISOString() });
          Object.assign(m, { rps_url: a.p_url, rps_ada: true }); simpan(); return Promise.resolve({ data: 'ok', error: null });
        }
        if (nama === 'rps_ajukan') {
          const m = (DB.ref_mata_kuliah || []).find(x => x.kurikulum === a.p_kurikulum && x.kode === a.p_kode);
          if (!m || !boleh(m)) return gagal('RPS diajukan koordinator MK atau dosen pengampu MK ini.');
          if (!r) return gagal('Simpan RPS dulu.');
          if (r.status === 'diajukan') return gagal('RPS sudah diajukan; menunggu pemeriksaan Kaprodi.');
          if (r.status === 'disahkan') return gagal('RPS sudah disahkan dan belum diubah.');
          if ((r.revisi || 0) > 0 && !a.p_catatan) return gagal('Tulis ringkasan perubahan (masuk daftar revisi RPS).');
          r.status = 'diajukan'; catat('ajukan', r.revisi || 0); simpan(); return Promise.resolve({ data: 'diajukan', error: null });
        }
        // 116: admin selalu boleh atas nama pejabat aktif (khusus RPS).
        const pejabat = j => (DB.koordinator || []).filter(k => k.jabatan === j && !k.selesai).map(k => k.dosen_id)[0] || null;
        const admin = saya?.peran === 'admin';
        if (nama === 'rps_tetapkan') {
          const dekan = pejabat('dekan');
          if (!((DB.koordinator || []).some(k => k.dosen_id === saya?.id && k.jabatan === 'dekan' && !k.selesai) || admin))
            return gagal('RPS ditetapkan Dekan aktif atau admin atas nama Dekan (Penugasan koordinator).');
          if (!dekan) return gagal('Dekan aktif belum ditetapkan (Admin › Penugasan koordinator).');
          if (!r || r.status !== 'disahkan') return gagal('RPS belum disahkan Kaprodi.');
          if (r.tetap_pada) return gagal('RPS ini sudah ditetapkan.');
          Object.assign(r, { tetap_pada: new Date().toISOString(), tetap_oleh: saya.id, tetap_atas_nama: dekan });
          (DB.mk_rps_pengesahan ||= []).push({ id: baru(), kurikulum: a.p_kurikulum, kode_mk: a.p_kode, aksi: 'tetapkan', oleh_id: saya.id,
            oleh_nama: saya.nama_gelar || saya.nama, revisi: r.revisi, atas_nama_id: dekan,
            atas_nama_nama: (DB.dosen || []).find(d => d.id === dekan)?.nama, waktu: new Date().toISOString() });
          simpan(); return Promise.resolve({ data: 'ditetapkan', error: null });
        }
        const kaprodi = (DB.koordinator || []).some(k => k.dosen_id === saya?.id && k.jabatan === 'kaprodi' && !k.selesai);
        if (!kaprodi && !admin) return gagal('RPS diperiksa dan disahkan Kaprodi aktif atau admin atas nama Kaprodi (Penugasan koordinator).');
        const kapAktif = pejabat('kaprodi');
        if (!kapAktif) return gagal('Kaprodi aktif belum ditetapkan (Admin › Penugasan koordinator).');
        if (!r || r.status !== 'diajukan') return gagal('RPS tidak sedang diajukan.');
        if (a.p_aksi === 'kembalikan' && !a.p_catatan) return gagal('Tulis catatan untuk dosen.');
        if (a.p_aksi === 'kembalikan') { r.status = 'dikembalikan'; catat('kembalikan', r.revisi || 0); }
        else {
          const m = (DB.ref_mata_kuliah || []).find(x => x.kurikulum === a.p_kurikulum && x.kode === a.p_kode);
          // 114: Kaprodi sekaligus penyusun (boleh_rps) atau pengaju terakhir -> ditandai.
          const aju = (DB.mk_rps_pengesahan || []).filter(l => l.kurikulum === a.p_kurikulum && l.kode_mk === a.p_kode && l.aksi === 'ajukan').pop();
          const sendiri = (!!m && boleh(m)) || aju?.oleh_id === saya.id;
          r.status = 'disahkan'; r.revisi = (r.revisi || 0) + 1; r.sah_pada = new Date().toISOString(); r.sah_oleh = saya.id;
          Object.assign(r, { sah_atas_nama: kapAktif, tetap_pada: null, tetap_oleh: null, tetap_atas_nama: null, kode_verifikasi: crypto.randomUUID() });   // 116
          r.sah = { rps: JSON.parse(JSON.stringify(r.data)), struktur: JSON.parse(JSON.stringify((DB.mk_struktur || []).find(s => s.kurikulum === a.p_kurikulum && s.kode_mk === a.p_kode)?.data || null)),
                    kaprodi_penyusun: sendiri };
          if (m) Object.assign(m, { rps_ada: true, rps_9_komponen: true });   // 113: bukti hanya dari RPS bertanda tangan Dekan
          catat('sahkan', r.revisi, sendiri);
          Object.assign(DB.mk_rps_pengesahan[DB.mk_rps_pengesahan.length - 1], { atas_nama_id: kapAktif, atas_nama_nama: (DB.dosen || []).find(d => d.id === kapAktif)?.nama });
        }
        simpan(); return Promise.resolve({ data: r.status, error: null });
      }
      // Tinjauan RPS (115), tiruan: ajukan oleh pengisi; Kaprodi aktif menyetujui/mengembalikan; revisi -> RPS sasaran draf.
      if (nama === 'tinjauan_ajukan' || nama === 'tinjauan_putuskan') {
        const e = String(email()).toLowerCase(), saya = (DB.dosen || []).find(x => String(x.email || '').toLowerCase() === e);
        const t = (DB.mk_rps_tinjauan || []).find(x => x.id === a.p_id);
        const gagal = message => Promise.resolve({ data: null, error: { message } });
        const catat = (aksi, cat = null) => (DB.mk_rps_tinjauan_log ||= []).push({ id: baru(), tinjauan_id: a.p_id, aksi, oleh_id: saya?.id,
          oleh_nama: saya?.nama_gelar || saya?.nama, catatan: cat, penyusun_sendiri: false, waktu: new Date().toISOString() });
        if (!t) return gagal('Tinjauan tidak ditemukan; simpan dulu.');
        if (nama === 'tinjauan_ajukan') {
          if (!['draf', 'dikembalikan'].includes(t.status)) return gagal('Tinjauan sudah diajukan atau disetujui.');
          const d = t.data || {};
          if (['analisis_cpl', 'materi_metode', 'penilaian', 'pembaruan'].some(k => !String(d[k] || '').trim())) return gagal('Isi keempat bagian tinjauan.');
          if (!t.keputusan) return gagal('Pilih keputusan.');
          t.status = 'diajukan'; catat('ajukan'); simpan(); return Promise.resolve({ data: 'diajukan', error: null });
        }
        if (!(DB.koordinator || []).some(k => k.dosen_id === saya?.id && k.jabatan === 'kaprodi' && !k.selesai)) return gagal('Tinjauan RPS disetujui Kaprodi aktif (Penugasan koordinator).');
        if (t.status !== 'diajukan') return gagal('Tinjauan tidak sedang diajukan.');
        if (a.p_aksi === 'kembalikan' && !a.p_catatan) return gagal('Tulis catatan untuk koordinator MK.');
        if (a.p_aksi === 'kembalikan') t.status = 'dikembalikan';
        else {
          const ps = (DB.ref_mk_padanan || []).filter(p => p.kurikulum_lama === t.kurikulum && p.kode_lama === t.kode_mk && !p.tidak_berlanjut);
          const sas = ps.length ? ps.map(p => [p.kurikulum_baru, p.kode_baru]) : [[t.kurikulum, t.kode_mk]];
          t.rps_dasar = Object.fromEntries(sas.map(([k, c]) => [`${k}|${c}`, (DB.mk_rps || []).find(r => r.kurikulum === k && r.kode_mk === c)?.revisi || 0]));
          Object.assign(t, { status: 'disetujui', disetujui_pada: new Date().toISOString(), disetujui_oleh: saya.id });
          if (t.keputusan === 'revisi') for (const r of DB.mk_rps || []) if (sas.some(([k, c]) => r.kurikulum === k && r.kode_mk === c) && r.status === 'disahkan') r.status = 'draf';
        }
        catat(a.p_aksi, a.p_catatan || null); simpan();
        return Promise.resolve({ data: t.status, error: null });
      }
      // Nama dengan gelar dosen sendiri (111), tiruan.
      if (nama === 'atur_nama_gelar') { const e = String(email()).toLowerCase();
        const d = (DB.dosen || []).find(x => [x.email, x.email_alternatif].some(v => String(v || '').toLowerCase() === e));
        if (d) { d.nama_gelar = a?.p || null; simpan(); }
        return Promise.resolve({ data: null, error: d ? null : { message: 'Belum masuk sebagai dosen terdaftar.' } }); }
      // NIP dan NUPTK dosen sendiri (128), tiruan.
      if (nama === 'atur_nip_nuptk') { const e = String(email()).toLowerCase();
        const d = (DB.dosen || []).find(x => [x.email, x.email_alternatif].some(v => String(v || '').toLowerCase() === e));
        if (d) { d.nip = a?.p_nip || null; d.nuptk = a?.p_nuptk || null; simpan(); }
        return Promise.resolve({ data: null, error: d ? null : { message: 'Belum masuk sebagai dosen terdaftar.' } }); }
      // Pemakaian halaman (133), tiruan: catat per hari/halaman/pengguna; rekap admin.
      if (nama === 'catat_kunjungan') { const e = String(email()).toLowerCase(), d = (DB.dosen || []).find(x => String(x.email || '').toLowerCase() === e);
        if (d && /^[a-z0-9._-]{1,80}$/.test(a.p_halaman || '')) { const t = new Date().toISOString().slice(0, 10), P = (DB.pemakaian_halaman ||= []);
          const r = P.find(x => x.tanggal === t && x.halaman === a.p_halaman && x.dosen_id === d.id);
          if (r) r.n++; else P.push({ tanggal: t, halaman: a.p_halaman, dosen_id: d.id, peran: d.peran, jabatan: (DB.koordinator || []).filter(k => k.dosen_id === d.id && !k.selesai).map(k => k.jabatan), n: 1 });
          simpan(); }
        return Promise.resolve({ data: null, error: null }); }
      if (nama === 'pemakaian_rekap') { const P = DB.pemakaian_halaman || [], g = new Map();
        for (const r of P) { if (!g.has(r.halaman)) g.set(r.halaman, []); g.get(r.halaman).push(r); }
        const hit = (xs, f) => { const o = {}; xs.forEach(x => (f(x) || []).forEach(k => { (o[k] ||= new Set()).add(x.dosen_id); })); return Object.fromEntries(Object.entries(o).map(([k, s]) => [k, s.size])); };
        return Promise.resolve({ data: { mulai_catat: P.map(r => r.tanggal).sort()[0] || null, pengguna_aktif: new Set(P.map(r => r.dosen_id)).size,
          halaman: [...g.entries()].map(([h, xs]) => ({ halaman: h, kunjungan: xs.reduce((a, x) => a + x.n, 0), pengguna: new Set(xs.map(x => x.dosen_id)).size,
            hari: new Set(xs.map(x => x.tanggal)).size, terakhir: xs.map(x => x.tanggal).sort().pop(), peran: hit(xs, x => [x.peran || '-']), jabatan: hit(xs, x => x.jabatan) })) }, error: null }); }
      // Jadwal berhalangan (132), tiruan: jumlah dosen per slot tanpa nama.
      if (nama === 'jadwal_berhalangan_rekap') { const g = new Map();
        for (const r of DB.dosen_berhalangan || []) if (r.tahun_akademik === a.p_ta && r.semester === a.p_semester) {
          const k = `${r.hari}|${r.slot_id}`; if (!g.has(k)) g.set(k, { hari: r.hari, slot_id: r.slot_id, d: new Set() }); g.get(k).d.add(r.dosen_id); }
        return Promise.resolve({ data: { mingguan: [...g.values()].map(x => ({ hari: x.hari, slot_id: x.slot_id, n: x.d.size })), tanggal: [] }, error: null }); }
      // Silabus (129), tiruan: semua MK boleh (seperti mk_boleh_saya tiruan); sahkan hanya Kaprodi aktif; impor admin tanpa menimpa.
      if (['silabus_simpan', 'silabus_ajukan', 'silabus_putuskan', 'silabus_impor'].includes(nama)) {
        const e = String(email()).toLowerCase(), saya = (DB.dosen || []).find(x => String(x.email || '').toLowerCase() === e);
        const gagal = message => Promise.resolve({ data: null, error: { message } }), ok = data => { simpan(); return Promise.resolve({ data, error: null }); };
        const S = (DB.mk_silabus ||= []), cari = kode => S.find(x => x.kurikulum === a.p_kurikulum && x.kode_mk === kode);
        const KUNCI = ['nama_en', 'tujuan', 'tujuan_en', 'deskripsi', 'deskripsi_en', 'prasyarat', 'bersamaan', 'pustaka', 'catatan_impor'];
        const rapi = d => Object.fromEntries([['versi', '1'], ...KUNCI.map(k => [k, String(d?.[k] ?? '').trim()])]);
        const catat = (kode, aksi, revisi, catatan) => (DB.mk_silabus_log ||= []).push({ id: baru(), kurikulum: a.p_kurikulum, kode_mk: kode, aksi,
          oleh_id: saya?.id, oleh_nama: saya?.nama_gelar || saya?.nama, catatan: catatan || null, revisi, waktu: new Date().toISOString() });
        if (!saya) return gagal('Belum masuk sebagai dosen terdaftar.');
        if (nama === 'silabus_impor') {
          if (saya.peran !== 'admin') return gagal('Impor silabus hanya oleh admin.');
          let masuk = 0, ada = 0; const tidak = [];
          for (const b of a.p_baris || []) {
            if (!(DB.ref_mata_kuliah || []).some(m => m.kurikulum === a.p_kurikulum && m.kode === b.kode)) { tidak.push(b.kode); continue; }
            if (cari(b.kode)) { ada++; continue; }
            S.push({ kurikulum: a.p_kurikulum, kode_mk: b.kode, data: rapi(b.data), status: 'draf', revisi: 0, sah: null, oleh: email(), diperbarui: new Date().toISOString() });
            catat(b.kode, 'impor', null, b.data?.catatan_impor); masuk++;
          }
          return ok({ masuk, sudah_ada: ada, tidak_ada: tidak });
        }
        const r = cari(a.p_kode);
        if (nama === 'silabus_simpan') {
          if (r?.status === 'diajukan') return gagal('Silabus sedang diajukan; tunggu keputusan Kaprodi.');
          if (r) Object.assign(r, { data: rapi(a.p_data), status: 'draf', oleh: email(), diperbarui: new Date().toISOString() });
          else S.push({ kurikulum: a.p_kurikulum, kode_mk: a.p_kode, data: rapi(a.p_data), status: 'draf', revisi: 0, sah: null, oleh: email(), diperbarui: new Date().toISOString() });
          return ok('draf');
        }
        if (nama === 'silabus_ajukan') {
          if (!r) return gagal('Simpan silabus dulu.');
          if (r.status === 'diajukan') return gagal('Silabus sudah diajukan; menunggu Kaprodi.');
          if (r.status === 'disahkan') return gagal('Silabus sudah disahkan dan belum diubah.');
          const kurang = ['nama_en', 'tujuan', 'tujuan_en', 'deskripsi', 'deskripsi_en', 'pustaka'].filter(k => !r.data[k]);
          if (kurang.length) return gagal(`Lengkapi dulu: ${kurang.join(', ')}.`);
          if (r.data.catatan_impor) return gagal('Periksa isi awal hasil impor, lalu hapus catatan impor sebelum diajukan.');
          if (r.revisi > 0 && !a.p_catatan) return gagal('Tulis ringkasan perubahan dari versi yang disahkan.');
          r.status = 'diajukan'; catat(a.p_kode, 'ajukan', r.revisi, a.p_catatan); return ok('diajukan');
        }
        if (!(DB.koordinator || []).some(k => k.dosen_id === saya.id && k.jabatan === 'kaprodi' && !k.selesai))
          return gagal('Silabus disahkan Kaprodi aktif (Penugasan koordinator).');
        if (!r || r.status !== 'diajukan') return gagal('Silabus tidak sedang diajukan.');
        if (a.p_aksi === 'kembalikan' && !a.p_catatan) return gagal('Tulis catatan untuk penyusun.');
        if (a.p_aksi === 'kembalikan') r.status = 'dikembalikan';
        else Object.assign(r, { status: 'disahkan', revisi: r.revisi + 1, sah: r.data, sah_pada: new Date().toISOString(), sah_oleh: saya.id });
        catat(a.p_kode, a.p_aksi, r.revisi, a.p_catatan); return ok(r.status);
      }
      // Cari waktu rapat (138), tiruan: mingguan per semester tanggal, isian tanggal, rentang, rapat lain; nama hanya pengatur jadwal.
      if (nama === 'cari_waktu_rapat') {
        const e = String(email()).toLowerCase(), saya = (DB.dosen || []).find(x => String(x.email || '').toLowerCase() === e);
        if (!saya) return Promise.resolve({ data: null, error: { message: 'Masuk sebagai dosen terdaftar dulu.' } });
        const jab = j => (DB.koordinator || []).some(k => k.dosen_id === saya.id && k.jabatan === j && !k.selesai);
        const namaBoleh = saya.peran === 'admin' || ['kaprodi', 'koordinator_ta', 'koordinator_kp'].some(jab);
        const peserta = new Set(a.p_peserta || []), slot = (DB.jadwal_slot || []).filter(x => x.aktif !== false), hari = (DB.jadwal_hari || []).map(x => +x.hari);
        const hISO = t => { const d = new Date(Date.parse(t + 'T00:00:00Z')).getUTCDay(); return d === 0 ? 7 : d; };
        const sem = t => { const y = +t.slice(0, 4), m = +t.slice(5, 7); return m >= 9 ? [`${y}/${y + 1}`, 'Ganjil'] : [`${y - 1}/${y}`, m <= 2 ? 'Ganjil' : 'Genap']; };
        const mnt = x => { const [h, mm] = String(x || '').split(':'); return +h * 60 + +mm; };
        const g = new Map(), catat = (t, sid, d) => { const k = `${t}|${sid}`; if (!g.has(k)) g.set(k, { tanggal: t, slot_id: sid, d: new Set() }); g.get(k).d.add(d); };
        for (let t = a.p_dari; t <= a.p_sampai; t = new Date(Date.parse(t + 'T00:00:00Z') + 864e5).toISOString().slice(0, 10)) {
          if (!hari.includes(hISO(t))) continue;
          const [ta, sm] = sem(t);
          for (const b of DB.dosen_berhalangan || []) if (peserta.has(b.dosen_id) && b.tahun_akademik === ta && b.semester === sm && +b.hari === hISO(t) && slot.some(s => s.id === b.slot_id)) catat(t, b.slot_id, b.dosen_id);
          for (const x of DB.dosen_berhalangan_tgl || []) if (peserta.has(x.dosen_id) && x.tanggal === t) for (const s of slot) if (x.slot_id == null || x.slot_id === s.id) catat(t, s.id, x.dosen_id);
          for (const r of DB.dosen_berhalangan_rentang || []) if (peserta.has(r.dosen_id) && r.mulai <= t && t <= r.selesai && (!r.hari?.length || r.hari.map(Number).includes(hISO(t))))
            for (const s of slot) if (!r.slot_ids?.length || r.slot_ids.includes(s.id)) catat(t, s.id, r.dosen_id);
          for (const ra of DB.rapat || []) if (ra.id !== a.p_kecuali && String(ra.tanggal).slice(0, 10) === t && ra.mulai && ra.selesai)
            for (const p of (DB.rapat_peserta || []).filter(p => p.rapat_id === ra.id && peserta.has(p.dosen_id)))
              for (const s of slot) if (mnt(s.mulai) < mnt(ra.selesai) && mnt(s.selesai) > mnt(ra.mulai)) catat(t, s.id, p.dosen_id);
        }
        return Promise.resolve({ data: { nama: namaBoleh, sibuk: [...g.values()].map(x => ({ tanggal: x.tanggal, slot_id: x.slot_id, n: x.d.size,
          ...(namaBoleh ? { dosen: [...x.d] } : {}) })) }, error: null });
      }
      // Jadwal kuliah (150, pemilik 2026-11-22), tiruan: admin/Kaprodi menyusun, hanya Kaprodi mengesahkan; setelah sah hanya
      // ruang yang berubah; impor melewati kelas berkunci. Aturan sama dengan supabase/150-patch-jadwal-kuliah.sql.
      if (['jadwal_simpan', 'jadwal_impor', 'jadwal_sahkan'].includes(nama)) {
        const e = String(email()).toLowerCase(), saya = (DB.dosen || []).find(x => String(x.email || '').toLowerCase() === e);
        const gagal = message => Promise.resolve({ data: null, error: { message } }), ok = data => { simpan(); return Promise.resolve({ data, error: null }); };
        const kaprodi = !!saya && (DB.koordinator || []).some(k => k.dosen_id === saya.id && k.jabatan === 'kaprodi' && !k.selesai);
        const K = DB.kelas_kuliah || [], J = (DB.jadwal_kuliah ||= []), S = (DB.jadwal_kuliah_sah ||= []);
        const sah = (ta, sm) => S.some(x => x.tahun_akademik === ta && x.semester === sm);
        if (nama === 'jadwal_sahkan') {
          if (!kaprodi) return gagal('Jadwal kuliah disahkan Kaprodi aktif.');
          const i = S.findIndex(x => x.tahun_akademik === a.p_ta && x.semester === a.p_semester);
          if (!a.p_sah) { if (i >= 0) S.splice(i, 1); return ok({ sah: false }); }
          const ks = K.filter(k => k.tahun_akademik === a.p_ta && k.semester === a.p_semester);
          if (!ks.length) return gagal(`Belum ada kelas ${a.p_semester} ${a.p_ta}.`);
          const tanpa = ks.filter(k => !J.some(j => j.kelas_id === k.id)).length;
          if (tanpa) return gagal(`${tanpa} dari ${ks.length} kelas ${a.p_semester} ${a.p_ta} belum berjadwal.`);
          if (i < 0) S.push({ tahun_akademik: a.p_ta, semester: a.p_semester, sah_oleh: email(), sah_pada: new Date().toISOString() });
          return ok({ sah: true, kelas: ks.length });
        }
        if (!(saya?.peran === 'admin' || kaprodi)) return gagal('Jadwal kuliah disusun admin atau Kaprodi aktif.');
        if (nama === 'jadwal_simpan') {
          const p = a.p || {}, k = K.find(x => x.id === +p.kelas_id);
          if (!k) return gagal('Kelas tidak ditemukan.');
          const j = J.find(x => x.kelas_id === k.id), jj = v => String(v || '').slice(0, 5);
          if (sah(k.tahun_akademik, k.semester) && (!j || +p.hari !== +j.hari || jj(p.mulai) !== jj(j.mulai) || jj(p.selesai) !== jj(j.selesai)))
            return gagal(`Jadwal ${k.semester} ${k.tahun_akademik} sudah disahkan Kaprodi: hari dan jam terkunci (ruang tetap boleh diisi). Minta Kaprodi membuka kembali.`);
          if (!p.hari) { const i = J.findIndex(x => x.kelas_id === k.id); if (i >= 0) J.splice(i, 1); return ok({ kelas_id: k.id, hapus: true }); }
          if (!p.mulai || !p.selesai || jj(p.selesai) <= jj(p.mulai)) return gagal(`Kelas ${k.kode_mk} ${k.kelas}: jam selesai harus sesudah jam mulai.`);
          const isi = { kelas_id: k.id, hari: +p.hari, mulai: jj(p.mulai) + ':00', selesai: jj(p.selesai) + ':00', ruang: String(p.ruang || '').trim() || null,
            kunci: 'kunci' in p ? !!p.kunci : !!j?.kunci, oleh: email() };
          if (j) Object.assign(j, isi); else J.push(isi);
          return ok({ kelas_id: k.id, hapus: false });
        }
        if (sah(a.p_ta, a.p_semester)) return gagal(`Jadwal ${a.p_semester} ${a.p_ta} sudah disahkan Kaprodi. Minta Kaprodi membuka kembali sebelum mengimpor.`);
        let masuk = 0, berkunci = 0, dihapus = 0; const galat = [], ids = new Set();
        (a.p_baris || []).forEach((b, n) => {
          const k = K.find(x => x.id === +b.kelas_id && x.tahun_akademik === a.p_ta && x.semester === a.p_semester);
          if (!k) return galat.push(`Baris ${n + 1} (kelas ${b.kelas_id}): kelas tidak ada di ${a.p_semester} ${a.p_ta}.`);
          ids.add(k.id);
          const j = J.find(x => x.kelas_id === k.id);
          if (j?.kunci) { berkunci++; return; }
          const isi = { hari: +b.hari, mulai: b.mulai + ':00', selesai: b.selesai + ':00', oleh: email() };
          if (j) Object.assign(j, isi); else J.push({ kelas_id: k.id, ruang: null, kunci: false, ...isi });
          masuk++;
        });
        if (a.p_ganti) for (let i = J.length - 1; i >= 0; i--) {
          const k = K.find(x => x.id === J[i].kelas_id);
          if (k && k.tahun_akademik === a.p_ta && k.semester === a.p_semester && !J[i].kunci && !ids.has(k.id)) { J.splice(i, 1); dihapus++; }
        }
        return ok({ masuk, berkunci, dihapus, galat });
      }
      // Penyusunan kelas (136), tiruan: admin/Kaprodi aktif; tepat satu koordinator; impor NIDN/email; salin ke cpl_kelas.
      if (['kelas_simpan', 'kelas_impor', 'kelas_ke_cpl'].includes(nama)) {
        const e = String(email()).toLowerCase(), saya = (DB.dosen || []).find(x => String(x.email || '').toLowerCase() === e);
        const gagal = message => Promise.resolve({ data: null, error: { message } }), ok = data => { simpan(); return Promise.resolve({ data, error: null }); };
        const kaprodi = !!saya && (DB.koordinator || []).some(k => k.dosen_id === saya.id && k.jabatan === 'kaprodi' && !k.selesai);
        if (!(saya?.peran === 'admin' || kaprodi)) return gagal('Kelas disusun admin atau Kaprodi aktif.');
        const K = (DB.kelas_kuliah ||= []), KD = (DB.kelas_dosen ||= []);
        const simpanSatu = p => {
          const ds = p.dosen || [];
          // 151 (pemilik 2026-11-22): MKU (universitas) dan MK fakultas boleh tanpa dosen prodi.
          const unit = (DB.ref_mata_kuliah || []).find(m => m.kurikulum === p.kurikulum && m.kode === p.kode_mk)?.unit_penyelenggara;
          if (!ds.length && !['universitas', 'fakultas'].includes(unit)) throw new Error(`Kelas ${p.kode_mk} ${p.kelas}: pilih minimal satu dosen.`);
          if (ds.length && ds.filter(d => d.peran === 'koordinator').length !== 1) throw new Error(`Kelas ${p.kode_mk} ${p.kelas}: tetapkan tepat satu koordinator kelas.`);
          let k = p.id ? K.find(x => x.id === +p.id) : K.find(x => x.tahun_akademik === p.tahun_akademik && x.semester === p.semester
            && x.kurikulum === p.kurikulum && x.kode_mk === p.kode_mk && x.kelas === String(p.kelas).trim());
          if (!k) K.push(k = { id: baru(), tahun_akademik: p.tahun_akademik, semester: p.semester, kurikulum: p.kurikulum, kode_mk: p.kode_mk });
          Object.assign(k, { kelas: String(p.kelas).trim(), kapasitas: p.kapasitas ?? null, angkatan: p.angkatan || null, catatan: p.catatan || null, oleh: email() });
          for (let i = KD.length - 1; i >= 0; i--) if (KD[i].kelas_id === k.id) KD.splice(i, 1);
          ds.forEach((d, i) => KD.push({ kelas_id: k.id, dosen_id: d.dosen_id, peran: d.peran, pertemuan: d.pertemuan ?? null, urutan: i }));
          return k;
        };
        try {
          if (nama === 'kelas_simpan') return ok(simpanSatu(a.p).id);
          if (nama === 'kelas_impor') {
            let masuk = 0, dihapus = 0; const galat = [], kunci = new Set();
            (a.p_baris || []).forEach((b, n) => {
              const ket = `Baris ${n + 1} (${b.kode_mk} ${b.kelas})`;
              if (!(DB.ref_mata_kuliah || []).some(m => m.kurikulum === b.kurikulum && m.kode === b.kode_mk)) return galat.push(`${ket}: MK tidak ada di ${b.kurikulum}.`);
              const ids = (b.dosen || []).map(t => (DB.dosen || []).find(d => d.aktif !== false && (String(d.nidn) === t || String(d.email).toLowerCase() === t.toLowerCase()))?.id);
              if (ids.some(x => !x)) return galat.push(`${ket}: dosen tidak terdaftar/aktif.`);
              try { simpanSatu({ ...b, id: null, tahun_akademik: a.p_ta, semester: a.p_semester, dosen: ids.map((id, i) => ({ dosen_id: id, peran: i ? 'anggota' : 'koordinator' })) });
                masuk++; kunci.add(`${b.kurikulum}|${b.kode_mk}|${String(b.kelas).trim()}`); } catch (x) { galat.push(`${ket}: ${x.message}`); }
            });
            if (a.p_ganti) for (let i = K.length - 1; i >= 0; i--) { const k = K[i];
              if (k.tahun_akademik === a.p_ta && k.semester === a.p_semester && !kunci.has(`${k.kurikulum}|${k.kode_mk}|${k.kelas}`)) { K.splice(i, 1); dihapus++; } }
            return ok({ masuk, dihapus, galat });
          }
          const C = (DB.cpl_kelas ||= []), grup = new Map(); let disalin = 0; const bentrok = [], tanpa = [];
          K.filter(k => k.tahun_akademik === a.p_ta && k.semester === a.p_semester).forEach(k => { const g = `${k.kode_mk}|${k.kelas}`; grup.set(g, [...(grup.get(g) || []), k]); });
          for (const [g, ks] of grup) {
            const [kode, kelas] = g.split('|');
            if (ks.length > 1) { bentrok.push(`${kode} ${kelas}`); continue; }
            const koor = KD.find(d => d.kelas_id === ks[0].id && d.peran === 'koordinator'), em = (DB.dosen || []).find(d => d.id === koor?.dosen_id)?.email;
            if (!em) { tanpa.push(`${kode} ${kelas}`); continue; }
            const nm = (DB.ref_mata_kuliah || []).find(m => m.kurikulum === ks[0].kurikulum && m.kode === kode)?.nama;
            const ada = C.find(c => c.tahun_akademik === a.p_ta && c.semester === a.p_semester && c.kode_mk === kode && c.kelas === kelas);
            if (ada) Object.assign(ada, { nama_mk: nm, dosen_email: em.toLowerCase() });
            else C.push({ id: baru(), tahun_akademik: a.p_ta, semester: a.p_semester, kode_mk: kode, nama_mk: nm, kelas, dosen_email: em.toLowerCase() });
            disalin++;
          }
          return ok({ disalin, bentrok_kurikulum: bentrok, tanpa_koordinator: tanpa });
        } catch (x) { return gagal(x.message); }
      }
      // Ekuivalensi MK (134), tiruan: Kaprodi aktif sahkan, Dekan aktif tetapkan; pemicu "berubah -> draf" tidak ditiru (diuji di PGlite).
      if (['padanan_sahkan', 'padanan_tetapkan', 'padanan_kembalikan'].includes(nama)) {
        const e = String(email()).toLowerCase(), saya = (DB.dosen || []).find(x => String(x.email || '').toLowerCase() === e);
        const gagal = message => Promise.resolve({ data: null, error: { message } }), ok = data => { simpan(); return Promise.resolve({ data, error: null }); };
        const jab = j => !!saya && (DB.koordinator || []).some(k => k.dosen_id === saya.id && k.jabatan === j && !k.selesai);
        const nm = saya?.nama_gelar || saya?.nama, kini = new Date().toISOString();
        const S = (DB.mk_padanan_sah ||= []);
        let r = S.find(x => x.kurikulum_lama === a.p_lama && x.kurikulum_baru === a.p_baru);
        const catat = (aksi, revisi) => (DB.mk_padanan_sah_log ||= []).push({ id: baru(), kurikulum_lama: a.p_lama, kurikulum_baru: a.p_baru, aksi,
          oleh_id: saya?.id, oleh_nama: nm, catatan: a.p_catatan || null, revisi, pada: kini });
        const salinan = () => ({ kurikulum_lama: a.p_lama, kurikulum_baru: a.p_baru,
          mk_lama: (DB.ref_mata_kuliah || []).filter(m => m.kurikulum === a.p_lama).map(({ kode, nama, sks, semester, sifat }) => ({ kode, nama, sks, semester, sifat })),
          mk_baru: (DB.ref_mata_kuliah || []).filter(m => m.kurikulum === a.p_baru).map(({ kode, nama, sks, semester, sifat }) => ({ kode, nama, sks, semester, sifat })),
          padanan: (DB.ref_mk_padanan || []).filter(p => p.kurikulum_lama === a.p_lama && (p.kurikulum_baru === a.p_baru || p.tidak_berlanjut))
            .map(({ kode_lama, kode_baru, model, tidak_berlanjut, catatan }) => ({ kode_lama, kode_baru, model, tidak_berlanjut, catatan })) });
        if (nama === 'padanan_sahkan') {
          if (!jab('kaprodi')) return gagal('Tabel ekuivalensi disahkan Kaprodi aktif (Penugasan koordinator).');
          const s = salinan(), ada = new Set(s.padanan.map(p => p.kode_lama)), belum = s.mk_lama.filter(m => !ada.has(m.kode)).map(m => m.kode);
          if (belum.length) return gagal(`${belum.length} MK ${a.p_lama} belum punya baris padanan (isi padanan atau TIDAK_BERLANJUT): ${belum.slice(0, 10).join(', ')}`);
          if (!r) S.push(r = { kurikulum_lama: a.p_lama, kurikulum_baru: a.p_baru, status: 'draf', revisi: 0 });
          if (r.status !== 'draf') return gagal(r.status === 'disahkan' ? 'Sudah disahkan, menunggu penetapan Dekan.' : 'Sudah ditetapkan Dekan; sunting padanan dulu bila ada perubahan.');
          Object.assign(r, { status: 'disahkan', usulan: s, sah_pada: kini, sah_oleh: saya.id, sah_nama: nm, catatan: null });
          catat('sahkan', r.revisi); return ok('disahkan');
        }
        if (nama === 'padanan_tetapkan') {
          if (!jab('dekan')) return gagal('Tabel ekuivalensi ditetapkan Dekan aktif (Penugasan koordinator).');
          if (r?.status !== 'disahkan') return gagal('Belum disahkan Kaprodi.');
          r.revisi += 1;
          Object.assign(r, { status: 'ditetapkan', tetap_pada: kini, tetap_oleh: saya.id, tetap_nama: nm, terbit_pada: kini,
            terbit: { ...r.usulan, revisi: r.revisi, disahkan: { nama: r.sah_nama, pada: r.sah_pada }, ditetapkan: { nama: nm, pada: kini } } });
          catat('tetapkan', r.revisi); return ok('ditetapkan');
        }
        if (!(jab('kaprodi') || jab('dekan'))) return gagal('Dikembalikan oleh Kaprodi atau Dekan aktif.');
        if (!a.p_catatan) return gagal('Tulis catatan perbaikan untuk admin.');
        if (r?.status !== 'disahkan') return gagal('Hanya isi yang sedang menunggu penetapan yang bisa dikembalikan.');
        Object.assign(r, { status: 'draf', usulan: null, catatan: a.p_catatan });
        catat('kembalikan', r.revisi); return ok('draf');
      }
      // Ruang KP (105), tiruan: rekap tanpa identitas, pelaksanaan per mitra, bakukan nama.
      if (nama === 'kp_tolak_rekap') { const g = new Map();   // 106, tiruan
        for (const t of DB.kp_tolak_instansi || []) { const k = String(t.instansi).toLowerCase(), x = g.get(k) || { instansi: t.instansi, n: 0, terakhir: t.dibuat };
          x.n++; if (t.dibuat > x.terakhir) x.terakhir = t.dibuat; g.set(k, x); }
        return Promise.resolve({ data: [...g.values()].sort((a, b) => b.n - a.n), error: null }); }
      if (nama === 'kp_rekap_baris') return Promise.resolve({ data: PM().filter(p => p.jenis === 'kp' && p.status !== 'draf').map(p => ({
        id: p.id, instansi: p.data?.instansi, program: p.data?.program || 'kp', status: p.status, tahap: p.tahap || 'pengajuan',
        mulai: p.data_selesai?.tanggal_mulai || p.data?.tanggal_mulai || p.data?.rencana_mulai || null, dibuat: p.dibuat, pembimbing_id: p.pembimbing_id,
        jawaban: p.data?.jawaban_instansi || null })), error: null });
      if (nama === 'kp_pelaksanaan_mitra') { const kk = s => String(s ?? '').trim().replace(/[.,]/g, '').replace(/\s+/g, ' ').toLowerCase(), g = new Map();
        for (const k of DB.lkps_kerjasama || []) for (const p of PM()) {
          if (p.jenis !== 'kp' || p.tahap !== 'selesai' || p.status !== 'disetujui' || kk(p.data?.instansi) !== kk(k.mitra)) continue;
          const th = +String(p.data_selesai?.tanggal_mulai || p.data?.rencana_mulai || p.dibuat).slice(0, 4), key = k.id + '|' + th;
          const x = g.get(key) || { kerjasama_id: k.id, tahun: th, kp: 0, magang: 0 }; x[p.data?.program === 'magang' ? 'magang' : 'kp']++; g.set(key, x); }
        return Promise.resolve({ data: [...g.values()], error: null }); }
      if (nama === 'kp_bakukan_instansi') { const kk = s => String(s ?? '').trim().replace(/[.,]/g, '').replace(/\s+/g, ' ').toLowerCase();
        const p0 = PM().find(p => p.id === a.p_id), baru = String(a.p_baru).trim().replace(/\s+/g, ' '); let n = 0;
        for (const p of PM()) if (p.jenis === 'kp' && (p.id === a.p_id || (a.p_semua && kk(p.data?.instansi) === kk(p0?.data?.instansi))) && p.data?.instansi !== baru) {
          p.data = { instansi_asli: p.data?.instansi, ...p.data, instansi: baru }; n++; }
        simpan(); return Promise.resolve({ data: n, error: null }); }
      // CPMK dan portofolio MK (102/103), tiruan: semua MK boleh (peran contoh), kelas dan refleksi apa adanya.
      // boleh_mk (102), tiruan: admin/GKM semua MK; dosen lain MK yang pengampunya memuat NIDN-nya (kelas semester terakhir tidak ditiru).
      // Koordinator dan tim MK (158), tiruan: Kaprodi aktif atau admin; koordinator di depan daftar pengampu.
      if (nama === 'mk_atur_tim') { const e = String(email()).toLowerCase(), d = (DB.dosen || []).find(x => String(x.email || '').toLowerCase() === e);
        const kap = !!d && (DB.koordinator || []).some(k => k.dosen_id === d.id && k.jabatan === 'kaprodi' && !k.selesai);
        const gagal = message => Promise.resolve({ data: null, error: { message } });
        if (!(d?.peran === 'admin' || kap)) return gagal('Koordinator dan tim MK ditetapkan Kaprodi aktif atau admin prodi.');
        const m = (DB.ref_mata_kuliah || []).find(x => x.kurikulum === a.p_kurikulum && x.kode === a.p_kode);
        if (!m) return gagal('Mata kuliah tidak ditemukan.');
        const koor = a.p_koordinator || null, tim = [...new Set((a.p_tim || []).filter(n => n && n !== koor))];
        if (!koor && tim.length) return gagal('Pilih koordinator MK lebih dulu.');
        m.koordinator_nidn = koor; m.pengampu = koor ? [koor, ...tim] : []; simpan();
        return Promise.resolve({ data: null, error: null }); }
      if (nama === 'mk_boleh_saya') { const e = String(email()).toLowerCase(), d = (DB.dosen || []).find(x => String(x.email || '').toLowerCase() === e);
        const gkm = !!d && (DB.koordinator || []).some(k => k.dosen_id === d.id && k.jabatan === 'gkm' && !k.selesai);
        // 137: juga MK kelas yang saya ajar (kelas_dosen, termasuk team teaching) pada semester berjalan atau sesudahnya.
        const urut = (ta, sm) => +String(ta).split('/')[0] * 10 + (sm === 'Ganjil' ? 1 : sm === 'Genap' ? 2 : 3);
        const kini = (() => { const t = new Date(), y = t.getFullYear(), m = t.getMonth() + 1; return m >= 9 ? y * 10 + 1 : m <= 2 ? (y - 1) * 10 + 1 : (y - 1) * 10 + 2; })();
        const ajar = new Set((DB.kelas_kuliah || []).filter(k => d && urut(k.tahun_akademik, k.semester) >= kini
          && (DB.kelas_dosen || []).some(x => x.kelas_id === k.id && x.dosen_id === d.id)).map(k => `${k.kurikulum}|${k.kode_mk}`));
        const xs = (DB.ref_mata_kuliah || []).filter(m => d && (d.peran === 'admin' || gkm || (m.pengampu || []).includes(d.nidn) || ajar.has(`${m.kurikulum}|${m.kode}`)));
        return Promise.resolve({ data: xs.map(m => ({ kurikulum: m.kurikulum, kode_mk: m.kode })), error: null }); }
      if (nama === 'portofolio_ringkas') return Promise.resolve({ data: {
        kelas: (DB.cpl_kelas || []).map(k => ({ ...k, nilai: (DB.cpl_berkas || []).some(b => b.kelas_id === k.id) })),
        evaluasi: (DB.evaluasi_mk || []).map(e => ({ tahun_akademik: e.tahun_akademik, semester: e.semester, kode_mk: e.kode_mk, refleksi: e.rps_sesuai != null })) },
        error: null });
      if (nama === 'id_dosen_login') { const e = String(email()).toLowerCase(); const d = (DB.dosen || []).find(x => [x.email, x.email_alternatif].some(v => String(v || '').toLowerCase() === e));
        return Promise.resolve({ data: d ? d.id : null, error: null }); }

      // Tiruan fungsi survei (54-patch-survei-kepuasan.sql), hanya untuk uji sandbox.
      if (nama === 'survei_buka') { const s = (DB.survei || []).find(x => x.token === a.p_token && !x.dicabut); const h = new Date().toISOString().slice(0, 10);
        return Promise.resolve({ data: s ? { ...s, buka: h >= s.mulai && h <= s.selesai } : null, error: null }); }
      if (nama === 'survei_kirim') { const s = (DB.survei || []).find(x => x.token === a.p_token && !x.dicabut);
        if (!s) return Promise.resolve({ data: null, error: { message: 'Survei ini tidak sedang dibuka.' } });
        DB.survei_jawaban = DB.survei_jawaban || [];
        if (DB.survei_jawaban.some(j => j.survei_id === s.id && j.klien === a.p_klien)) return Promise.resolve({ data: null, error: { message: 'Survei ini sudah Anda isi dari perangkat ini. Terima kasih.' } });
        if (s.pertanyaan.some(q => q.jenis === 'skala' && ![1, 2, 3, 4].includes(a.p_jawaban[q.id]))) return Promise.resolve({ data: null, error: { message: 'Semua pertanyaan berskala wajib dijawab (1–4).' } });
        DB.survei_jawaban.push({ id: baru(), survei_id: s.id, klien: a.p_klien, diisi: new Date().toISOString(), jawaban: a.p_jawaban }); simpan();
        return Promise.resolve({ data: true, error: null }); }
      // Rekap survei (54; 130: publik hanya salinan yang diterbitkan admin), tiruan.
      const rekapSv = s => { const js = (DB.survei_jawaban || []).filter(j => j.survei_id === s.id); const hit = {};
        s.pertanyaan.filter(q => q.jenis === 'skala').forEach(q => { hit[q.id] = [1, 2, 3, 4].map(v => js.filter(j => j.jawaban[q.id] === v).length); });
        return { n: js.length, pertanyaan: s.pertanyaan.filter(q => q.jenis === 'skala'), hitung: hit }; };
      if (nama === 'survei_rekap') { const h = new Date().toISOString().slice(0, 10);
        return Promise.resolve({ data: (DB.survei || []).filter(s => s.publik && s.rekap_terbit && s.mulai <= h).map(s => ({ ...s.rekap_terbit,
          id: s.id, judul: s.judul, kelompok: s.kelompok, tahun_ts: s.tahun_ts, mulai: s.mulai, selesai: s.selesai, terbit_pada: s.terbit_pada })), error: null }); }
      if (['survei_terbitkan', 'survei_tarik_terbit'].includes(nama)) { const s = (DB.survei || []).find(x => x.id === a.p_id);
        if (!s) return Promise.resolve({ data: null, error: { message: 'Survei tidak ada.' } });
        if (nama === 'survei_terbitkan') Object.assign(s, { rekap_terbit: rekapSv(s), terbit_pada: new Date().toISOString(), terbit_oleh: email() });
        else Object.assign(s, { rekap_terbit: null, terbit_pada: null, terbit_oleh: null });
        simpan(); return Promise.resolve({ data: nama === 'survei_terbitkan' ? s.rekap_terbit.n : null, error: null }); }
      if (nama === 'ami_buka') { const x = (DB.tautan_ami || []).find(r => r.token === a.p_token && !r.dicabut && new Date(r.sampai) > new Date()); return Promise.resolve({ data: x ? { ...x, iku: DB.lkps_target_kinerja || [], temuan: DB.ami_temuan || [], bukti_temuan: (DB.lkps_bukti || []).filter(b => b.tabel === 'ami_temuan'), cpl: ((DB.cpl_ringkasan || []).slice(-1)[0] || null) } : null, error: null }); }
      if (nama === 'rbk_prodi') return Promise.resolve({ data: ['2025/2026', '2024/2025', '2023/2024'].map(t => ({ tahun_akademik: t, rbk: 13.6, rbk_lebih: 14.2, n_dosen: 10, n_lengkap: 10 })), error: null });
      if (nama === 'unsur_bukti') return Promise.resolve({ data: (DB.lkps_bukti || []).filter(x => x.unsur && ['ref_mata_kuliah','lkps_peta_jalan'].includes(x.tabel)).map(({ tabel, baris_id, unsur }) => ({ tabel, baris_id, unsur })).concat((DB.butir_bukti || []).filter(x => x.unsur).map(x => ({ tabel: 'butir', baris_id: x.butir, unsur: x.unsur }))), error: null });
      // Rekap hibah (58-patch-hibah.sql), tiruan.
      if (nama === 'hibah_rekap') { const g = new Map();
        for (const h of DB.hibah_ajuan || []) { const s = (DB.ref_skema_dana || []).find(x => x.kode === h.skema_kode);
          const k = [h.tahun_usulan, h.kategori, s?.nama || 'Belum dipilih', h.status].join('|');
          if (!g.has(k)) g.set(k, { tahun: h.tahun_usulan, kategori: h.kategori, skema: s?.nama || 'Belum dipilih', kelompok: s?.kelompok || '', status: h.status, n: 0, dana_usulan: 0, dana_disetujui: 0 });
          const x = g.get(k); x.n++; x.dana_usulan += +h.dana_usulan || 0; x.dana_disetujui += +h.dana_disetujui || 0; }
        return Promise.resolve({ data: [...g.values()], error: null }); }
      // Rapat (62-patch-rapat.sql), tiruan sederhana.
      // 166: isi notulen (pembahasan) hanya bila final atau saya pembuat/admin/pimpinan/peserta/PJ.
      if (nama === 'rapat_isi') { const r = (DB.rapat || []).find(x => x.id === a.p_id), d = (DB.dosen || []).find(x => x.email === email());
        const boleh = !!r && !!d && (r.status === 'final' && !r.terbatas || r.dibuat_oleh === d.id || ['admin', 'pimpinan'].includes(d.peran)
          || (DB.rapat_peserta || []).some(p => p.rapat_id === r.id && p.dosen_id === d.id)
          || (DB.rapat_tindak || []).some(t => t.rapat_id === r.id && t.pj_dosen_id === d.id));
        return Promise.resolve({ data: { boleh, pembahasan: boleh ? r.pembahasan ?? null : null }, error: null }); }
      if (nama === 'perbarui_tindak_lanjut') { const t = (DB.rapat_tindak || []).find(x => x.id === a.p_id);
        if (t) { t.status = a.p_status; if (a.p_catatan) t.catatan = a.p_catatan; t.tanggal_selesai = a.p_status === 'selesai' ? new Date().toISOString().slice(0, 10) : null; simpan(); }
        return Promise.resolve({ data: null, error: t ? null : { message: 'Tindak lanjut tidak ditemukan.' } }); }
      if (nama === 'rapat_buka_hadir') { const r = (DB.rapat || []).find(x => x.token_hadir === a.p_token && new Date(x.hadir_sampai) > new Date());
        return Promise.resolve({ data: r ? { judul: r.judul, tanggal: r.tanggal, tempat: r.tempat, sampai: r.hadir_sampai,
          jumlah: (DB.rapat_peserta || []).filter(p => p.rapat_id === r.id).length, dosen: DB.dosen.map(d => ({ id: d.id, nama: d.nama })),
          sudah: (DB.rapat_peserta || []).filter(p => p.rapat_id === r.id && p.dosen_id).map(p => p.dosen_id) } : null, error: null }); }
      if (nama === 'rapat_hadir') { const r = (DB.rapat || []).find(x => x.token_hadir === a.p_token && new Date(x.hadir_sampai) > new Date());
        if (!r) return Promise.resolve({ data: null, error: { message: 'Daftar hadir rapat ini tidak sedang dibuka.' } });
        DB.rapat_peserta = DB.rapat_peserta || [];
        const d = a.p_dosen ? DB.dosen.find(x => x.id === a.p_dosen) : null;
        if (DB.rapat_peserta.some(p => p.rapat_id === r.id && (d ? p.dosen_id === d.id : p.klien === a.p_klien))) return Promise.resolve({ data: 'sudah', error: null });
        DB.rapat_peserta.push({ id: baru(), rapat_id: r.id, dosen_id: d?.id || null, nama: d ? d.nama : a.p_nama, instansi: a.p_instansi, peran: 'peserta', hadir: true, cara: 'daring', klien: a.p_klien });
        simpan(); return Promise.resolve({ data: 'tercatat', error: null }); }
      if (nama === 'prestasi_mirip') return Promise.resolve({ data: [], error: null });
      if (nama === 'jumlah_rujukan') return Promise.resolve({ data: 0, error: null });
      if (nama === 'cari_sha256') return Promise.resolve({ data: [], error: null });
      // Draf karya (41-patch-draf-karya.sql), tiruan sederhana tanpa RLS.
      if (nama === 'ubah_karya' || nama === 'ajukan_karya') {
        const k = (DB.karya || []).find(x => x.id === a.k);
        if (!k) return Promise.resolve({ data: null, error: { message: 'Karya tidak ditemukan.' } });
        if (nama === 'ubah_karya') { Object.assign(k, a.d?.karya || {}); if (k.status !== 'draf') k.status = 'diajukan'; }
        else if (k.status !== 'draf') return Promise.resolve({ data: null, error: { message: 'Hanya draf yang bisa diajukan.' } });
        else if (!k.tingkat) return Promise.resolve({ data: null, error: { message: 'Lengkapi tingkat karya sebelum diajukan.' } });
        else k.status = 'diajukan';
        simpan();
        return Promise.resolve({ data: null, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    },
    auth: { getSession: async () => ({ data: { session: sesi() } }), onAuthStateChange(){ return { data: { subscription: { unsubscribe(){} } } }; },
      signOut: async () => { localStorage.mockSaya = 'tamu'; }, signInWithOtp: async () => ({ error: null }) },
    storage: { from: () => ({ createSignedUrl: async () => ({ data: null }) }) } };
}
