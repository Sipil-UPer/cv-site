// Pencarian menyeluruh (pemilik 2026-11-12): satu kotak cari di menu ruang kerja (sesuai peran)
// dan di beranda umum (data publik saja). Logika murni di sini (diuji tests/js/cari.test.mjs);
// tampilan menu di cari-ui.js, tampilan beranda di index.html.
//
// Sumber: halaman dan menu (menu.js, sesuai peran dan FITUR_MATI), dosen dan karya dan mitra
// (data.json publik), 60 butir LAM (butir-manual.js + butir-data.js), serta dokumen, rapat,
// tindak lanjut, dan temuan AMI lewat Supabase saat mengetik (RLS membatasi hak baca).

const AKSEN = new RegExp('[\\u0300-\\u036f]', 'g');
/** Huruf kecil, tanpa aksen, tanda baca menjadi spasi. */
export const normal = s => String(s ?? '').normalize('NFD').replace(AKSEN, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ').trim();

// Bidang keahlian, mata kuliah, laboratorium, prestasi, dan kabar (pemilik 2026-11-22): pencarian situs publik
// mencakup halaman per bidang dan per mata kuliah, dan bisa dibuka dari kepala setiap halaman (kerangka.js).
export const JENIS_CARI = [
  ['halaman', 'Halaman'], ['butir', 'Butir akreditasi'], ['bidang', 'Bidang keahlian'], ['mk', 'Mata kuliah'],
  ['dosen', 'Dosen'], ['lab', 'Laboratorium'], ['karya', 'Karya'], ['prestasi', 'Prestasi mahasiswa'],
  ['kabar', 'Kegiatan prodi'], ['ta', 'Tugas akhir'], ['mitra', 'Mitra'], ['dokumen', 'Dokumen'], ['rapat', 'Rapat'], ['tindak', 'Tindak lanjut rapat'],
  ['temuan', 'Temuan AMI'],
];
export const MAKS_PER_JENIS = 6;

/** Satu entri indeks. ekstra = kata yang ikut dicari tetapi tidak ditampilkan (DOI, sinonim). */
export const entri = (jenis, judul, ket, href, ekstra = '', luar = false) =>
  ({ jenis, judul: String(judul ?? '').trim(), ket: String(ket ?? '').trim(), href, luar,
     kunci: normal([judul, ket, ekstra].join(' ')), kJudul: normal(judul) });

// Kata tambahan per halaman ruang kerja, supaya istilah sehari-hari menemukan halamannya.
const KATA_HALAMAN = {
  'karya.html': 'karya publikasi penelitian pkm pengabdian luaran hki rekognisi prestasi bukti unggah bkd draf impor doi',
  'profil.html': 'sinta scopus orcid jabatan pendidikan topik keahlian kata kunci',
  'nilai-cpl.html': 'cpl nilai obe template_input_data_cpl unggah kelas',
  'kalender.html': 'jadwal agenda ics google calendar tenggat',
  'rapat.html': 'notulen daftar hadir qr keputusan tindak lanjut rtm',
  'hibah.html': 'proposal panggilan pendanaan dana',
  'kelola-survei.html': 'kepuasan kuesioner angket',
  'pengingat.html': 'email kirim pengingat templat',
  'verifikasi.html': 'ajuan setujui tolak menunggu verifikasi',
  'data-prodi.html': 'lkps mahasiswa lulusan tracer kerja sama mou bkd mata kuliah rps dokumen pustaka temuan ami spmi target iku ikt sarana prasarana tendik dana k3l',
  'kelola-dosen.html': 'akun email peran admin daftar dosen',
  'jejak.html': 'audit log riwayat perubahan siapa mengubah',
  'mutu-data.html': 'doi ganda judul mirip tanpa bukti',
  'monitoring.html': 'rekap kinerja ts iku syarat unggul cpl temuan',
  'skor.html': 'skor led lkps unduh laporan tahunan asesor simulasi',
  'narasi-led.html': 'narasi led bagian saya penyusun',
  'kelengkapan.html': 'daftar periksa kelengkapan led',
  'input-butir.html': 'butir kualitatif bukti dokumen pustaka',
  'panduan.html': 'bantuan cara petunjuk',
};
// Pintasan langsung ke tab (dipakai karya.html#tab dan data-prodi.html?tab=).
const PINTASAN = [
  ['karya.html#saya', 'Karya saya', 'Data saya · karya, draf, dan yang dikembalikan admin', 'draf ditolak dikembalikan'],
  ['karya.html#bkd', 'BKD saya', 'Data saya · beban kerja dosen per semester', 'beban kerja dosen'],
];

/** Halaman ruang kerja yang boleh dibuka (hasil halamanBoleh di menu.js) + pintasan tab. */
export function indeksHalaman(modul, boleh = () => true){
  const xs = [];
  for (const m of modul || []) for (const h of m.halaman || [])
    xs.push(entri('halaman', h.judul, `${m.judul} · ${h.ket || ''}`, h.href, KATA_HALAMAN[String(h.href).split(/[?#]/)[0]] || ''));
  for (const [href, judul, ket, kata] of PINTASAN) if (boleh(href)) xs.push(entri('halaman', judul, ket, href, kata));
  return xs;
}

/** 60 butir LAM: nomor dan judul, menuju skor.html#butir-N. */
export function indeksButir(manual, data){
  const per = new Map();
  for (const b of [...(data || []), ...(manual || [])]) if (b?.no && !per.has(String(b.no))) per.set(String(b.no), b);
  return [...per.values()].sort((a, b) => +a.no - +b.no)
    .map(b => ({ ...entri('butir', `Butir ${b.no}: ${b.judul}`, b.tabel || '', `skor.html#butir-${b.no}`, `b${b.no}`), no: String(b.no) }));
}

const daftarNama = xs => (xs || []).map(p => (typeof p === 'string' ? p : p?.nama)).filter(Boolean);

/** Data publik dari data.json: halaman umum, bidang keahlian, mata kuliah, dosen, laboratorium, karya, prestasi, kabar,
 *  mitra. aktif(k) = modul opsional menyala. */
export function indeksPublik(D, aktif = () => true){
  const xs = [];
  const umum = [
    ['index.html', 'Beranda', 'beranda program studi', ''],
    ['kinerja.html', 'Kinerja program studi', 'angka dan grafik kinerja program studi', 'dashboard rekap'],
    ['daftar.html?jenis=dosen', 'Daftar dosen', 'semua dosen program studi', ''],
    ['daftar.html?jenis=publikasi', 'Daftar publikasi', 'jurnal dan prosiding', 'artikel'],
    ['daftar.html?jenis=penelitian', 'Daftar penelitian', 'penelitian dosen', 'riset'],
    ['daftar.html?jenis=pkm', 'Daftar pengabdian', 'pengabdian kepada masyarakat', 'pkm'],
    ['prestasi.html', 'Prestasi mahasiswa', 'lomba dan kompetisi', 'juara'],
    ['kerja-sama.html', 'Kerja sama', 'mitra karya dan kerja sama resmi', 'mou'],
    ['kerja-sama.html#tempat-kp', 'Tempat KP dan magang', 'instansi tempat kerja praktik dan magang mahasiswa', 'kerja praktik magang mbkm'],
    ['kerja-praktik.html', 'Kerja praktik dan magang', 'alur, syarat, dokumen, tempat KP, pengajuan surat pengantar dan selesai KP',
     'kp kerja praktik magang surat pengantar laporan selesai'],
    ['alumni.html', 'Alumni dan tracer study', 'waktu tunggu, kesesuaian bidang, tempat kerja lulusan', 'tracer lulusan alumni'],
    ['hasil-survei.html', 'Hasil survei kepuasan', 'rekap survei', 'kepuasan'],
    ['profil-prodi.html', 'Profil program studi', 'sejarah, visi dan misi, sambutan, pengelola',
     'sejarah visi misi tujuan sambutan kaprodi ketua program studi pengelola'],
    ['kurikulum.html', 'Kurikulum', 'profil lulusan, capaian pembelajaran lulusan, mata kuliah per semester',
     'cpl obe sks semester mata kuliah wajib pilihan profil lulusan'],
    ['laboratorium.html', 'Laboratorium', 'fasilitas praktikum, peralatan, layanan pengujian', 'lab praktikum alat uji'],
    ['calon-mahasiswa.html', 'Untuk calon mahasiswa', 'bidang, perjalanan kuliah, prestasi, karier, pendaftaran',
     'pendaftaran pmb daftar kuliah calon mahasiswa baru karier'],
    ['layanan-mahasiswa.html', 'Layanan mahasiswa', 'pengumuman, jadwal, berkas, tanya-jawab', 'pengumuman jadwal formulir tanya'],
    ['ekuivalensi-kurikulum.html', 'Ekuivalensi kurikulum', 'padanan mata kuliah kurikulum lama ke baru', 'konversi padanan transisi'],
    ['pengajuan.html', 'Pengajuan mahasiswa', 'KP, TA, lomba, luaran, kabar kegiatan, surat, yudisium',
     'ajukan surat yudisium tugas akhir skripsi lomba'],
    ['peta-situs.html', 'Peta situs', 'daftar seluruh halaman', 'sitemap'],
  ];
  if ((D?.kabar || []).length) umum.push(['kabar.html', 'Kegiatan prodi', 'kegiatan program studi', 'kabar kegiatan']);
  if ([...(D?.kabar || []), ...(D?.prestasi || []), ...(D?.laboratorium || [])].some(x => (x.foto || []).length))
    umum.push(['galeri.html', 'Galeri foto', 'foto kegiatan, prestasi, dan laboratorium', 'foto dokumentasi']);
  if (D?.situs?.prodi_en) umum.push(['english.html', 'English', 'programme overview in English', 'english inggris']);
  if ((D?.kalender || []).length || D?.situs?.kalender_resmi)
    umum.push(['layanan-mahasiswa.html#kalender', 'Kalender akademik', 'registrasi, perkuliahan, ujian, yudisium, libur',
      'jadwal kuliah krs uts uas libur semester wisuda']);
  if ((D?.arsip_ta || []).length)
    umum.push(['tugas-akhir.html', 'Arsip tugas akhir', 'judul tugas akhir mahasiswa per bidang keahlian', 'ta skripsi judul tugas akhir']);
  if (Object.keys(D?.situs?.kontak || {}).length)
    umum.push(['kontak.html', 'Kontak', 'alamat, telepon, email, formulir pertanyaan', 'kontak alamat lokasi peta telepon email hubungi']);
  if ((D?.situs?.biaya || []).length)
    umum.push(['biaya-beasiswa.html', 'Biaya dan beasiswa', 'tautan resmi biaya pendidikan, pendaftaran, dan beasiswa universitas',
      'biaya kuliah ukt spp uang kuliah beasiswa pembayaran']);
  if (aktif('sdgs')) umum.push(['sdgs.html', 'Rekap SDGs', 'karya per tujuan pembangunan berkelanjutan', 'sdg']);
  if (aktif('kepakaran')) umum.push(['keahlian.html', 'Kepakaran dosen', 'cari pakar dan peta topik', 'keahlian pakar']);
  for (const [href, j, k, e] of umum) xs.push(entri('halaman', j, k, href, e));

  const slug = new Map((D?.dosen || []).map(d => [d.nama, d.slug]));
  const keDosen = nama => slug.get(nama) ? `dosen/${encodeURIComponent(slug.get(nama))}.html` : 'daftar.html?jenis=dosen';
  // Bidang keahlian (halaman bidang-*.html, pemilik 2026-11-22); berkas dari bangun.py.
  const kel = [...(D?.situs?.kelompok_keahlian || []), ...(D?.situs?.peminatan_lain || [])];
  const namaKel = k => kel.find(x => x.kode === k)?.nama || '';
  for (const b of D?.situs?.kelompok_keahlian || []) if (b.berkas && b.nama)
    xs.push(entri('bidang', b.nama, b.cakupan || 'Bidang keahlian', b.berkas, [b.kode, b.nama_en].join(' ')));
  // Mata kuliah kurikulum terbaru yang punya halaman (mk-*.html, bangun.py).
  const angka = v => String(Number(v || 0)).replace('.', ',');
  for (const m of (D?.kurikulum || [])[0]?.mk || []) if (m.berkas)
    xs.push(entri('mk', m.nama, [m.kode, `${angka(m.sks)} sks`, m.sifat === 'pilihan' ? `Pilihan ${namaKel(m.peminatan)}`.trim()
      : (m.semester ? `Semester ${m.semester}` : '')].filter(Boolean).join(' · '), m.berkas,
      [m.nama_en, m.silabus?.nama_en, 'mata kuliah matkul'].filter(Boolean).join(' ')));
  // Dosen dengan nama bergelar bila diisi (pemilik 2026-11-22); nama tanpa gelar tetap ikut dicari.
  for (const d of D?.dosen || [])
    xs.push(entri('dosen', d.nama_gelar || d.nama, d.bidang_keahlian || 'Dosen', `dosen/${encodeURIComponent(d.slug)}.html`,
      [d.nama, ...(d.kata_kunci || [])].join(' ')));
  for (const l of D?.laboratorium || [])
    xs.push(entri('lab', l.nama, String(l.ringkasan || '').slice(0, 120), `laboratorium.html#lab-${encodeURIComponent(l.id)}`,
      [...(l.layanan || []), ...(l.alat || []).map(a => a.nama), ...(l.mk || []).map(m => m.nama), ...(l.bidang || []).map(namaKel)].join(' ')));
  for (const p of D?.prestasi || [])
    xs.push(entri('prestasi', [p.capaian, p.kegiatan].filter(Boolean).join(' '), [p.tahun, p.tingkat, p.penyelenggara].filter(Boolean).join(' · '),
      `prestasi.html#prestasi-${encodeURIComponent(p.id)}`, [p.bidang, daftarNama(p.mahasiswa).join(' ')].join(' ')));
  // Arsip judul TA (pemilik 2026-11-22): tanpa nama mahasiswa.
  for (const t of D?.arsip_ta || [])
    xs.push(entri('ta', t.judul, ['Tugas akhir', t.tahun, namaKel(t.bidang)].filter(Boolean).join(' · '),
      `tugas-akhir.html#ta-${encodeURIComponent(t.id)}`, (t.pembimbing || []).map(o => o.nama).join(' ')));
  for (const k of D?.kabar || [])
    xs.push(entri('kabar', k.judul, [k.tanggal, String(k.ringkasan || '').slice(0, 100)].filter(Boolean).join(' · '),
      `kabar.html#kabar-${encodeURIComponent(k.id)}`, k.jenis || ''));
  const mitra = new Map();
  const catatMitra = k => daftarNama(k.mitra).forEach(m => mitra.set(m, (mitra.get(m) || 0) + 1));
  for (const p of D?.publikasi || []) {
    catatMitra(p);
    xs.push(entri('karya', p.judul, ['Publikasi', p.tahun, daftarNama(p.penulis).join(', '), p.terbitan].filter(Boolean).join(' · '),
      `daftar.html?jenis=publikasi&q=${encodeURIComponent(p.judul)}`, [p.doi, daftarNama(p.mitra).join(' ')].join(' ')));
  }
  for (const k of D?.kegiatan || []) {
    catatMitra(k);
    const jenis = k.kategori === 'pkm' ? 'pkm' : 'penelitian';
    xs.push(entri('karya', k.judul, [jenis === 'pkm' ? 'Pengabdian' : 'Penelitian', k.tahun, daftarNama(k.penulis).join(', '), k.skema].filter(Boolean).join(' · '),
      `daftar.html?jenis=${jenis}&q=${encodeURIComponent(k.judul)}`, daftarNama(k.mitra).join(' ')));
  }
  for (const l of D?.luaran_dosen || []) {
    const ds = daftarNama(l.dosen);
    xs.push(entri('karya', l.judul, ['Luaran', l.nama_bagian, l.tahun, ds.join(', ')].filter(Boolean).join(' · '), keDosen(ds[0])));
  }
  for (const r of D?.rekognisi || []) {
    const ds = daftarNama([].concat(r.dosen || []));
    xs.push(entri('karya', r.nama_kegiatan, ['Rekognisi', r.tahun, ds.join(', ')].filter(Boolean).join(' · '), keDosen(ds[0])));
  }
  for (const [m, n] of mitra) xs.push(entri('mitra', m, `${n} karya bersama`, 'kerja-sama.html'));
  return xs;
}

/**
 * Cocokkan q dengan indeks: setiap kata harus ada. Skor: nomor butir persis, judul diawali kueri,
 * kata di awal kata judul, kata di judul, lalu di keterangan. Hasil terurut skor, paling banyak
 * maks per jenis.
 */
export function cari(indeks, q, maks = MAKS_PER_JENIS){
  const nq = normal(q), kata = nq.split(' ').filter(Boolean);
  if (!kata.length) return [];
  const hasil = [];
  // Angka harus kata utuh: "23" menemukan butir 23, bukan setiap judul berisi "2023".
  const ada = (e, k) => /^\d+$/.test(k) ? (' ' + e.kunci + ' ').includes(' ' + k + ' ') : e.kunci.includes(k);
  for (const e of indeks || []) {
    if (!kata.every(k => ada(e, k))) continue;
    let s = 0;
    if (e.jenis === 'butir' && (e.no === nq || `butir ${e.no}` === nq)) s += 500;
    if (e.kJudul === nq) s += 200; else if (e.kJudul.startsWith(nq)) s += 100;
    for (const k of kata) {
      if ((' ' + e.kJudul).includes(' ' + k)) s += 10; else if (e.kJudul.includes(k)) s += 5; else s += 1;
    }
    hasil.push([s, e]);
  }
  hasil.sort((a, b) => b[0] - a[0] || a[1].judul.localeCompare(b[1].judul));
  const hitung = {};
  return hasil.map(([, e]) => e).filter(e => (hitung[e.jenis] = (hitung[e.jenis] || 0) + 1) <= maks);
}

/** Hasil dikelompokkan per jenis, urut JENIS_CARI: [{ jenis, label, entri }]. */
export const kelompokkan = hasil => JENIS_CARI.map(([jenis, label]) => ({ jenis, label, entri: hasil.filter(e => e.jenis === jenis) }))
  .filter(g => g.entri.length);

// Kueri teks aman untuk filter PostgREST or(): tanpa koma, kurung, tanda kutip, bintang, persen.
export const kueriAman = q => String(q ?? '').replace(/[,()"'*%\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);

/**
 * Cari dokumen, rapat, tindak lanjut, dan temuan AMI di Supabase (RLS membatasi). Tabel yang belum
 * ada atau tidak boleh dibaca dilewati. o = { rapat: modul rapat menyala, admin }.
 * Hasil disaring ulang dengan cari() supaya hanya yang cocok yang tampil.
 */
export async function cariSupabase(sb, q, o = {}){
  const t = kueriAman(q);
  if (t.length < 3) return [];
  const p = `*${t}*`, lim = MAKS_PER_JENIS;   // PostgREST: * = % (tanpa URL-encoding)
  const baca = pr => pr.then(r => r.error ? [] : (r.data || []), () => []);
  const [dok, rap, tin, tem] = await Promise.all([
    baca(sb.from('dokumen').select('id,judul,jenis,tahun,nama_berkas,url').or(`judul.ilike.${p},nama_berkas.ilike.${p},jenis.ilike.${p}`).limit(lim)),
    o.rapat ? baca(sb.from('rapat').select('id,judul,tanggal,agenda').or(`judul.ilike.${p},agenda.ilike.${p}`).limit(lim)) : [],
    o.rapat ? baca(sb.from('rapat_tindak').select('id,rapat_id,keputusan,tenggat,status').ilike('keputusan', p).limit(lim)) : [],
    baca(sb.from('ami_temuan').select('id,kode,siklus,uraian,standar,status').or(`uraian.ilike.${p},kode.ilike.${p},standar.ilike.${p}`).limit(lim)),
  ]);
  const xs = [
    ...dok.map(d => entri('dokumen', d.judul || d.nama_berkas || d.jenis, [String(d.jenis || '').replace(/_/g, ' '), d.tahun, d.nama_berkas].filter(Boolean).join(' · '),
      d.url || 'data-prodi.html?tab=dokumen', '', !!d.url)),
    ...rap.map(r => entri('rapat', r.judul, ['Rapat', String(r.tanggal || '').slice(0, 10)].filter(Boolean).join(' · '), `rapat.html?id=${r.id}`, r.agenda || '')),
    ...tin.map(x => entri('tindak', x.keputusan, ['Tindak lanjut', x.status, x.tenggat ? 'tenggat ' + String(x.tenggat).slice(0, 10) : ''].filter(Boolean).join(' · '), `rapat.html?id=${x.rapat_id}`)),
    ...tem.map(x => entri('temuan', `Temuan ${[x.siklus, x.kode].filter(Boolean).join(' ')}`.trim(), [x.uraian, x.status].filter(Boolean).join(' · '),
      o.admin ? 'data-prodi.html?tab=temuan' : 'monitoring.html', x.standar || '')),
  ];
  return cari(xs, q);
}
