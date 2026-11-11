/* =====================================================================
   led-isi.js — isi draf LED dari data sistem (pemilik 2026-11-05): narasi
   umum yang faktanya terisi, tautan langsung ke dokumen di dalam narasi,
   tabel pendukung penjelasan, dan tabel bukti yang tautannya terisi sendiri.
   Penyusun tinggal menguatkan narasi. Fungsi murni, dipakai led.js.

   X = data yang sama dengan LKPS (skor.html ambilDaftarLKPS). Fakta yang
   tidak ada di sistem tetap [isi: …]: tidak pernah ditebak.
   Tautan di dalam teks memakai token ⟦url|label⟧; auto() di led.js
   mengubahnya menjadi hyperlink Word.
   ===================================================================== */
import { versiUntukTS } from './pustaka-dokumen.js?v=2026-11-11-7e7727';
import { infoJenis, JENIS_DOKUMEN, kelompokDokumen, buktiButir, saranDokumen } from './rencana-bukti.js?v=2026-11-11-7e7727';
import { teksPendidikan } from './profil-dosen.js?v=2026-11-11-7e7727';
import { karya4i } from './sitasi.js?v=2026-11-11-7e7727';

export const tokenTautan = (url, label) => `⟦${url}|${String(label).replace(/[⟦⟧|]/g, ' ')}⟧`;
const isi = t => `[isi: ${t}]`;
const gabungKata = xs => xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} dan ${xs[xs.length - 1]}`;

const JABATAN = { tenaga_pengajar: 'Tenaga Pengajar', asisten_ahli: 'Asisten Ahli', lektor: 'Lektor',
                  lektor_kepala: 'Lektor Kepala', guru_besar: 'Guru Besar' };
const TINGKAT = { internasional: 'Internasional', nasional: 'Nasional', wilayah: 'Wilayah', lokal: 'Lokal' };
const JENIS_KS = { pendidikan: 'Pendidikan', penelitian: 'Penelitian', pkm: 'PkM' };
const TENDIK = { laboran: 'laboran', teknisi: 'teknisi', administrator: 'tenaga administrasi', pustakawan: 'pustakawan' };
const TAHAP = { penetapan: 'Penetapan', pelaksanaan: 'Pelaksanaan', evaluasi: 'Evaluasi',
                pengendalian: 'Pengendalian', peningkatan: 'Peningkatan' };

export function labelDokumenLED(d){
  const j = infoJenis(d.jenis);
  return `${j.nama}${d.judul ? ` ${d.judul}` : ''}${d.nomor ? ` No. ${d.nomor}` : ''} (${d.tahun})`;
}

// Target IKU/IKT (34-patch-target-kinerja.sql). true/false, null bila angkanya belum lengkap.
export function tercapai(r){
  if (r.target == null || r.capaian == null) return null;
  return r.arah === 'maksimal' ? +r.capaian <= +r.target : +r.capaian >= +r.target;
}
const angkaID = v => String(v).replace('.', ',');
export function teksTarget(r){
  const tanda = r.arah === 'maksimal' ? '≤' : '≥', s = r.satuan ? ` ${r.satuan}` : '';
  const hasil = tercapai(r);
  return `${r.nama}: target ${tanda} ${angkaID(r.target)}${s}` + (r.capaian == null ? ''
    : `, capaian ${angkaID(r.capaian)}${s} (${hasil ? 'tercapai' : 'belum tercapai'})`);
}
// Baris terbaru tiap indikator sampai TS, urut tampil.
export function targetBerlaku(X, ts){
  const per = new Map();
  (X.target || []).filter(r => +r.tahun_ts <= ts && r.target != null)
    .sort((a, b) => +a.tahun_ts - +b.tahun_ts).forEach(r => per.set(`${r.jenis}|${r.nama}`, r));
  return [...per.values()].sort((a, b) => (a.urutan ?? 100) - (b.urutan ?? 100) || String(a.nama).localeCompare(String(b.nama)));
}

// Fakta narasi. C = { dokumen, daftar, ts }; hasilnya bergabung ke C.P.
// Susunan tim dari led_tim, urut sesuai pengaturan admin. Dosen terdaftar mengambil
// nama, nomor, dan jabatan dari data dosen; orang di luar sistem dari barisnya.
export function anggotaTim(tim, dosen){
  return [...(tim || [])].sort((a, b) => a.urutan - b.urutan || a.id - b.id).flatMap(r => {
    const d = r.dosen_id ? (dosen || []).find(x => x.id === r.dosen_id) : null;
    if (r.dosen_id && (!d || d.aktif === false || d.peran === 'asesor')) return [];
    return [{ id: r.id, dosen_id: r.dosen_id || null, jenis: r.jenis || 'dosen', deskripsi: r.deskripsi || '',
      nama: d ? d.nama : r.nama, nomor: (d ? d.nidn : r.nomor) || '',
      jabatan: (d ? JABATAN[d.jabatan] : r.jabatan) || '' }];
  });
}

// Kosong = tetap [isi].
export function namaTim(tim, dosen){
  const xs = anggotaTim(tim, dosen).map(d => d.nama);
  return xs.length ? gabungKata(xs) : isi('nama anggota tim');
}

export function faktaNarasi(C){
  const X = C.daftar || {}, ts = C.ts, dok = C.dokumen || X.dokumen || [];
  const mk = (X.mk || []).filter(m => m.aktif !== false);
  const tsKarya = k => (+k.bulan >= 9 ? +k.tahun + 1 : +k.tahun);
  const dalam = k => tsKarya(k) >= ts - 2 && tsKarya(k) <= ts;
  const vmts = j => (X.vmts || []).find(r => r.jenis === j);
  const capstone = mk.filter(m => m.capstone);
  const namaMK = kode => (mk.find(m => m.kode === kode) || {}).nama || kode;
  const integrasi = (X.karya || []).filter(k => k.kategori === 'integrasi' && dalam(k));
  const mkIntegrasi = [...new Set(integrasi.map(k => k.mata_kuliah).filter(Boolean))];
  const tendik = (X.tendik || []).filter(t => t.aktif !== false);
  const perJabatan = Object.entries(TENDIK).map(([k, n]) => [tendik.filter(t => t.jabatan === k).length, n]).filter(([c]) => c);
  const tracer = (X.tracer || []).filter(t => t.tahun_lulus >= ts - 2 && t.tahun_lulus <= ts - 1);
  const lulusan = tracer.reduce((a, t) => a + (+t.jumlah_lulusan || 0), 0);
  const terlacak = tracer.reduce((a, t) => a + (+t.jumlah_terlacak || 0), 0);
  const tema = jenis => (X.tema || []).filter(t => t.aktif !== false && (t.jenis === jenis || t.jenis === 'keduanya')).map(t => t.nama);
  const ruang = [...new Set((X.prasarana || []).map(r => r.prasarana).filter(Boolean))];
  const sarana = [...new Set((X.fasK3l || []).map(r => r.nama_sarana).filter(Boolean))];
  const d = (jenis, cadangan) => {
    const x = versiUntukTS(dok, jenis, ts);
    return x && x.url ? tokenTautan(x.url, labelDokumenLED(x)) : isi(cadangan);
  };
  const ada = (xs, cadangan) => xs.length ? xs : isi(cadangan);
  const target = targetBerlaku(X, ts), ikt = target.filter(r => r.jenis === 'ikt');
  const tahunIKT = [...new Set(ikt.filter(r => r.capaian != null).map(r => r.tahun_ts))].sort();
  return {
    d,
    timPenyusun: namaTim(X.tim, X.dosen),
    // Kalimat target satu butir; kosong bila belum ada target.
    targetButir: no => gabungKata(target.filter(r => String(r.butir) === String(no)).map(teksTarget)),
    daftarIKT: ada(gabungKata(ikt.map(r => `${r.nama} (target ${r.arah === 'maksimal' ? '≤' : '≥'} ${angkaID(r.target)}${r.satuan ? ` ${r.satuan}` : ''})`)), 'daftar IKT beserta target'),
    tahunIKT: tahunIKT.length ? tahunIKT.map(t => `${t - 1}/${t}`).join(', ') : isi('tahun'),
    capaianIKT: ikt.some(r => r.capaian != null)
      ? `${ikt.filter(r => tercapai(r)).length} dari ${ikt.length} IKT tercapai` : isi('capaian'),
    // Beberapa dokumen dalam satu kalimat; yang belum ada di pustaka tidak disebut.
    dSemua: (jenis, cadangan) => {
      const xs = jenis.map(j => versiUntukTS(dok, j, ts)).filter(x => x && x.url);
      return xs.length ? gabungKata(xs.map(x => tokenTautan(x.url, labelDokumenLED(x)))) : isi(cadangan);
    },
    tahunDok: (jenis, cadangan) => { const x = versiUntukTS(dok, jenis, ts); return x ? String(x.tahun) : isi(cadangan); },
    visi: (j, cadangan) => (vmts(j) && vmts(j).visi) ? vmts(j).visi.trim() : isi(cadangan),
    jumlahMK: mk.length ? String(mk.length) : isi('jumlah'),
    jumlahRPS: mk.length ? String(mk.filter(m => m.rps_ada).length) : isi('jumlah'),
    jumlahIntegrasi: mkIntegrasi.length ? String(mkIntegrasi.length) : isi('jumlah'),
    contohIntegrasi: ada(gabungKata(mkIntegrasi.slice(0, 3)), 'contoh mata kuliah dan topik'),
    capstone: ada(gabungKata(capstone.map(m => `${m.nama} (${m.sks} SKS)`)), 'nama mata kuliah dan SKS'),
    capstonePendukung: ada(gabungKata([...new Set(capstone.flatMap(m => m.capstone_pendukung || []))].map(namaMK)), 'daftar mata kuliah'),
    tema: jenis => ada(gabungKata(tema(jenis)), 'tema utama'),
    tendik: ada(gabungKata(perJabatan.map(([c, n]) => `${c} ${n}`)), 'jumlah laboran, teknisi, dan administrator'),
    ruang: ada(gabungKata(ruang.slice(0, 8)), 'ruang kelas, laboratorium sesuai panduan asosiasi, perpustakaan, media pembelajaran, perangkat lunak'),
    saranaK3L: ada(gabungKata(sarana.slice(0, 8)), 'APAR, jalur evakuasi, P3K, APD laboratorium'),
    responsTracer: lulusan && terlacak ? `${Math.round(terlacak / lulusan * 100)}% (${terlacak} dari ${lulusan} lulusan)` : isi('persentase'),
  };
}

// Kalimat umum dari data grafik: nilai tiap seri dan arahnya.
export function kalimatTren(g, o = {}){
  if (!g || !g.seri || !g.seri.length || !g.kategori || g.kategori.length < 2) return '';
  const f = v => g.desimal ? v.toFixed(g.desimal).replace('.', ',') : String(v);
  const arah = xs => { const a = xs[0], z = xs[xs.length - 1]; return z > a ? 'naik' : z < a ? 'turun' : 'tetap'; };
  const seri = g.seri.slice(0, 4).map(s => `${s.nama} ${s.nilai.map(f).join(', ')}${o.berjalan ? '' : ` (${arah(s.nilai)})`}`);
  return `Pada ${g.kategori[0]} s.d. ${g.kategori[g.kategori.length - 1]}, ${g.judul.charAt(0).toLowerCase()}${g.judul.slice(1)} ` +
         `berturut-turut: ${seri.join('; ')}${g.satuan ? `, dalam satuan ${g.satuan}` : ''}.` +
         (o.berjalan ? ` Data ${g.kategori[g.kategori.length - 1]} belum lengkap karena TS masih berjalan.` : '');
}

// Tabel Data prodi yang menjadi sumber tiap butir, untuk bukti baris.
const TABEL_BUTIR = {
  lkps_vmts: ['1', '2', '3'], lkps_kerjasama: ['6', '7'], lkps_penggunaan_dana: ['8', '9', '10', '11'],
  ref_mata_kuliah: ['15', '17', '19', '20'], ref_tema_peta_jalan: ['22', '24'], lkps_tendik: ['29'],
  lkps_bkd: ['30'], lkps_prasarana: ['38'], lkps_dokumen_k3l: ['39'], lkps_fasilitas_k3l: ['39'],
  lkps_mahasiswa_ta: ['40', '41', '42'], lkps_prestasi_mahasiswa: ['43'], lkps_kohort_lulusan: ['44', '45'],
  lkps_publikasi_mahasiswa: ['46'], lkps_luaran_mahasiswa: ['47'], lkps_tracer_lulusan: ['48', '49', '50', '51'],
  lkps_kepuasan_pengguna: ['52'], lkps_spmi_ppepp: ['53', '55'], lkps_target_kinerja: ['54', '55', '56'], ami_temuan: ['55'],
};
// Lembar LKPS (LKPS_TABEL.sheet) -> tabel Data prodi.
const TABEL_LEMBAR = [[/^Menu|^PS/, 'lkps_prodi_upps'], [/^1$/, 'lkps_vmts'], [/^2a/, 'lkps_kerjasama'], [/^2b/, 'lkps_penggunaan_dana'],
  [/^3a[145]/, 'ref_mata_kuliah'], [/^4b/, 'lkps_tendik'], [/^4c/, 'lkps_bkd'], [/^5a/, 'lkps_prasarana'],
  [/^5b/, 'lkps_dokumen_k3l'], [/^6a|^6b/, 'lkps_mahasiswa_ta'], [/^6c/, 'lkps_prestasi_mahasiswa'], [/^6d/, 'lkps_kohort_lulusan'],
  [/^6e1/, 'lkps_publikasi_mahasiswa'], [/^6e3/, 'lkps_luaran_mahasiswa'], [/^6f|^6g1/, 'lkps_tracer_lulusan'],
  [/^6g2/, 'lkps_kepuasan_pengguna'], [/^7b/, 'lkps_spmi_ppepp']];

const urlBaris = b => b.url || (b.dokumen && b.dokumen.url) || '';
const labelBaris = b => b.dokumen && b.dokumen.jenis ? labelDokumenLED(b.dokumen) : (b.judul || 'Bukti');

// Bukti dengan tautan untuk satu butir, tanpa berkas kembar:
// bukti butir, dokumen pustaka yang lazim untuk butir itu, bukti baris Data prodi.
export function buktiOtomatis(no, C){
  const opsi = { dokumen: C.dokumen, butirBukti: C.butirBukti, ts: C.ts };
  const sudah = new Set(), hasil = [];
  const tambah = (label, url) => { if (url && !sudah.has(url)) { sudah.add(url); hasil.push({ label, url }); } };
  buktiButir(no, opsi).forEach(x => {
    // Bukti per unsur (pemilik 2026-11-10): label diawali nomor unsurnya.
    if (x.url) tambah((x.unsur ? `Unsur ${x.unsur}: ` : '') + x.label
      + (x.lain.length ? `; versi lain: ${x.lain.map(v => v.tahun).join(', ')}` : ''), x.url);
  });
  kelompokDokumen(C.dokumen, no, C.ts).forEach(g => (g.utama ? [g.utama] : g.lain).forEach(r => tambah(labelDokumenLED(r), r.url)));
  const baris = (C.daftar || {}).buktiBaris || [];
  Object.entries(TABEL_BUTIR).filter(([, xs]) => xs.includes(String(no))).forEach(([t]) =>
    baris.filter(b => b.tabel === t).forEach(b => tambah(labelBaris(b), urlBaris(b))));
  return hasil;
}

// Saran pustaka yang berkasnya belum ada: masih perlu diunggah.
export function dokumenBelumAda(no, C){
  return saranDokumen(no, C.butirBukti).filter(j => !(C.dokumen || []).some(d => d.jenis === j.id));
}

// Baris daftar periksa matriks yang sudah terwakili dokumen pustaka tidak diulang.
export function periksaTersisa(rb, bukti){
  const kata = t => String(t).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 3);
  const ada = bukti.map(x => new Set(kata(x.label)));
  return (rb || []).filter(t => {
    const k = kata(t);
    return !k.length || !ada.some(s => k.filter(w => s.has(w)).length / k.length >= 0.6);
  });
}

// Tautan Lampiran C untuk satu lembar LKPS.
export function buktiLembar(sheet, C){
  const t = (TABEL_LEMBAR.find(([p]) => p.test(sheet)) || [])[1];
  const sudah = new Set();
  return ((C.daftar || {}).buktiBaris || []).filter(b => b.tabel === t).map(b => ({ url: urlBaris(b), t: labelBaris(b) }))
    .filter(x => x.url && !sudah.has(x.url) && sudah.add(x.url));
}

const sel = (url, t = 'buka') => url ? { url, t } : '—';
const potong = (baris, maks, ket) => baris.length <= maks ? { baris, catatan: '' }
  : { baris: baris.slice(0, maks), catatan: `Ditampilkan ${maks} dari ${baris.length} baris; selengkapnya ${ket}.` };

// Tabel pendukung penjelasan per butir, [{judul, baris, catatan}]; kosong bila datanya belum ada.
export function tabelPenjelas(no, C){
  const X = C.daftar || {}, ts = C.ts, dok = C.dokumen || [];
  const buat = (judul, kepala, baris, ket = 'pada LKPS', maks = 40) => {
    if (!baris.length) return [];
    const p = potong(baris, maks, ket);
    return [{ judul, baris: [kepala, ...p.baris.map((r, i) => [String(i + 1), ...r])], catatan: p.catatan }];
  };
  const mk = (X.mk || []).filter(m => m.aktif !== false)
    .sort((a, b) => (a.semester || 0) - (b.semester || 0) || String(a.kode).localeCompare(String(b.kode)));
  const baris = t => (X.buktiBaris || []).filter(b => b.tabel === t);
  switch (String(no)) {
    case '1': return buat('Visi, misi, tujuan, dan strategi', ['No', 'Tingkat', 'Visi', 'Nomor SK', 'Dokumen'],
      ['pt', 'upps', 'ps'].map(j => (X.vmts || []).find(r => r.jenis === j)).filter(Boolean).map(r => [
        { pt: 'Perguruan tinggi', upps: 'UPPS', ps: 'Visi keilmuan PS' }[r.jenis], r.visi || '—', r.nomor_sk || '—',
        sel(r.tautan || urlBaris(baris('lkps_vmts').find(b => b.baris_id === r.id) || {}))]));
    case '6': return buat('Daftar kerja sama', ['No', 'Mitra', 'Tingkat', 'Bidang', 'Kegiatan', 'Periode'],
      (X.kerjasama || []).map(k => [k.mitra, TINGKAT[k.tingkat] || k.tingkat || '—', JENIS_KS[k.jenis] || k.jenis || '—', k.kegiatan || '—',
        [k.tahun_mulai, k.tahun_selesai].filter(Boolean).join('–') || '—']), 'pada Tabel 2.a LKPS');
    case '15': return buat('Daftar mata kuliah dan RPS', ['No', 'Kode', 'Mata kuliah', 'SKS', 'Smt', 'RPS'],
      mk.map(m => {
        const d = dok.find(x => x.jenis === 'rps' && String(x.judul || '').includes(m.kode));
        return [m.kode, m.nama, String(m.sks ?? '—'), String(m.semester ?? '—'), d ? sel(d.url) : m.rps_ada ? 'Ada' : 'Belum'];
      }), 'pada Tabel 3.a.1 LKPS', 80);
    case '17': return buat('Integrasi penelitian dan PkM dalam pembelajaran', ['No', 'Mata kuliah', 'Kegiatan'],
      (X.karya || []).filter(k => k.kategori === 'integrasi').map(k => [k.mata_kuliah || '—', k.judul]), 'pada Tabel 3.a.3 LKPS');
    case '19': return buat('Mata kuliah basic sciences dan matematika', ['No', 'Kode', 'Mata kuliah', 'SKS'],
      mk.filter(m => m.basic_science).map(m => [m.kode, m.nama, String(m.sks ?? '—')]));
    case '20': return buat('Mata kuliah capstone design', ['No', 'Kode', 'Mata kuliah', 'SKS', 'Mata kuliah pendukung'],
      mk.filter(m => m.capstone).map(m => [m.kode, m.nama, String(m.sks ?? '—'), (m.capstone_pendukung || []).join(', ') || '—']));
    case '22': case '24': {
      const jenis = no == 22 ? 'penelitian' : 'pkm';
      return buat(`Tema peta jalan ${no == 22 ? 'penelitian' : 'PkM'}`, ['No', 'Tema'],
        (X.tema || []).filter(t => t.aktif !== false && (t.jenis === jenis || t.jenis === 'keduanya')).map(t => [t.nama]));
    }
    case '26': return buat('Daftar dosen tetap program studi (DTPS)', ['No', 'Nama', 'NIDN/NUPTK', 'Pendidikan', 'Bidang keahlian', 'Jabatan akademik'],
      (X.dosen || []).filter(d => d.dtps && d.aktif !== false).sort((a, b) => String(a.nama).localeCompare(String(b.nama)))
        .map(d => [d.nama, d.nidn || '—', d.pendidikan || '—', d.bidang_keahlian || '—', JABATAN[d.jabatan] || '—']), 'pada Tabel 4.a LKPS', 80);
    case '27': return buat('Riwayat pendidikan DTPS', ['No', 'Nama', 'Sarjana', 'Magister', 'Doktor'],
      (X.dosen || []).filter(d => d.dtps && d.aktif !== false && (d.riwayat_pendidikan || []).length)
        .sort((a, b) => String(a.nama).localeCompare(String(b.nama)))
        .map(d => [d.nama, ...['sarjana', 'magister', 'doktor'].map(k => teksPendidikan(d.riwayat_pendidikan, k) || '—')]), 'pada Tabel 4.a LKPS', 80);
    case '29': return buat('Daftar tenaga kependidikan', ['No', 'Nama', 'Jabatan', 'Pendidikan', 'Sertifikat', 'Unit kerja'],
      (X.tendik || []).filter(t => t.aktif !== false).map(t => [t.nama, TENDIK[t.jabatan] || t.jabatan || '—',
        String(t.pendidikan || '—').toUpperCase(), t.sertifikat || '—', String(t.unit_kerja || '—').toUpperCase()]), 'pada Tabel 4.b LKPS');
    case '36': return buat('Karya ilmiah DTPS yang disitasi', ['No', 'Judul', 'Tahun', 'Sitasi 3 tahun terakhir'],
      karya4i(X.karya, ts).map(({ k, n }) => [k.judul, String(k.tahun), String(n)]), 'pada Tabel 4.i LKPS');
    case '38': return buat('Prasarana dan peralatan utama', ['No', 'Prasarana', 'Jumlah', 'Alat', 'Dimiliki/standar', 'Kondisi'],
      (X.prasarana || []).map(r => [r.prasarana, String(r.jumlah_prasarana ?? '—'), r.alat || '—',
        `${r.jumlah_dimiliki ?? '—'}/${r.jumlah_standar ?? '—'}`, String(r.kondisi || '—').replace(/_/g, ' ')]), 'pada Tabel 5.a LKPS');
    case '39': return [
      ...buat('Dokumen K3L', ['No', 'Jenis dokumen', 'Jumlah', 'Riwayat pengesahan'],
        (X.dokK3l || []).map(r => [r.jenis_dokumen, String(r.jumlah ?? '—'), r.riwayat_pengesahan || '—']), 'pada Tabel 5.b LKPS'),
      ...buat('Fasilitas K3L', ['No', 'Sarana', 'Fungsi', 'Jumlah', 'Kondisi'],
        (X.fasK3l || []).map(r => [r.nama_sarana, r.fungsi || '—', String(r.jumlah_unit ?? '—'), String(r.kondisi || '—').replace(/_/g, ' ')]), 'pada Tabel 5.c LKPS')];
    case '43': return buat('Daftar prestasi mahasiswa', ['No', 'Kegiatan', 'Tahun', 'Tingkat', 'Capaian'],
      (X.prestasi || []).slice().sort((a, b) => (b.tahun || 0) - (a.tahun || 0)).map(p => [p.nama_kegiatan, String(p.tahun ?? '—'),
        TINGKAT[p.tingkat] || p.tingkat || '—', p.capaian || '—']), 'pada Tabel 6.c LKPS');
    case '47': return buat('Luaran penelitian dan PkM mahasiswa', ['No', 'Judul', 'Jenis', 'Tahun'],
      (X.luaranMhs || []).map(l => [l.judul || '—', String(l.jenis || '—').replace(/_/g, ' '), String(l.tahun ?? '—')]), 'pada Tabel 6.e.3 LKPS');
    case '53': {
      const j = ['kebijakan_spmi', 'manual_spmi', 'standar_spmi', 'tata_cara_dokumentasi_spmi', 'sk_unit_pm'];
      return buat('Perangkat SPMI', ['No', 'Dokumen', 'Nomor', 'Tanggal', 'Tautan'],
        j.map(x => versiUntukTS(dok, x, ts)).filter(Boolean).map(d => [infoJenis(d.jenis).nama, d.nomor || '—',
          d.tanggal ? String(d.tanggal).split('-').reverse().join('/') : String(d.tahun), sel(d.url)]));
    }
    case '54': return buat('Indikator Kinerja Tambahan', ['No', 'IKT', 'Tujuan strategis', 'Dampak', 'Daya saing internasional', 'Target', 'Capaian'],
      targetBerlaku(X, ts).filter(r => r.jenis === 'ikt').map(r => [r.nama, r.tujuan_strategis || '—', r.dampak || '—', r.daya_saing || '—',
        `${r.arah === 'maksimal' ? '≤' : '≥'} ${angkaID(r.target)}${r.satuan ? ` ${r.satuan}` : ''}`, r.capaian == null ? '—' : angkaID(r.capaian)]));
    case '56': return buat('Target dan capaian IKU/IKT', ['No', 'Indikator', 'Jenis', 'Target', 'Capaian', 'Status'],
      targetBerlaku(X, ts).map(r => [r.nama, r.jenis.toUpperCase(), `${r.arah === 'maksimal' ? '≤' : '≥'} ${angkaID(r.target)}${r.satuan ? ` ${r.satuan}` : ''}`,
        r.capaian == null ? '—' : angkaID(r.capaian), tercapai(r) == null ? 'Belum diukur' : tercapai(r) ? 'Tercapai' : 'Belum tercapai']));
    case '55': {
      const u = id => (dok.find(d => d.id === id) || {}).url || '';
      return buat('Pelaksanaan siklus PPEPP', ['No', 'Tahap', 'Dokumen', 'Laporan audit', 'Laporan RTM', 'Peningkatan'],
        Object.keys(TAHAP).map(t => (X.ppepp || []).find(r => r.tahap === t)).filter(Boolean).map(r => [TAHAP[r.tahap],
          sel(u(r.dokumen_id)), sel(u(r.audit_dokumen_id)), sel(u(r.rtm_dokumen_id)), sel(u(r.peningkatan_dokumen_id))]));
    }
    default: return [];
  }
}

// Kebijakan satu kriteria: dokumen pustaka yang terkait butir-butirnya.
export function dokumenKriteria(butir, C){
  const sudah = new Set();
  return butir.flatMap(no => kelompokDokumen(C.dokumen, no, C.ts).map(g => g.utama).filter(Boolean))
    .filter(d => d.url && !sudah.has(d.url) && sudah.add(d.url));
}

export { JENIS_DOKUMEN };
