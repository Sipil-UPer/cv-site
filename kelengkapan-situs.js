// Kelengkapan situs publik (pemilik 2026-11-21): bagian halaman publik yang masih kosong atau sebagian, dihitung dari
// data.json yang sama dengan yang dibaca pengunjung, beserta tempat mengisinya di ruang kerja. Logika murni, dites di
// Node (tests/js/kelengkapan_situs.test.mjs); halaman: kelengkapan-situs.html.
//
// Baris: { id, halaman: {judul, href}, judul, status: 'terisi'|'sebagian'|'kosong', nilai, isi: {judul, href} | null,
//          catatan, bolehKosong }
// bolehKosong: bagian yang wajar kosong (mis. belum ada jadwal seminar); tidak dihitung sebagai kekurangan.

export const STATUS_KS = [['kosong', 'Kosong'], ['sebagian', 'Sebagian'], ['terisi', 'Terisi']];

const H = {
  profil: { judul: 'Profil prodi', href: 'profil-prodi.html' },
  kurikulum: { judul: 'Kurikulum', href: 'kurikulum.html' },
  ekuivalensi: { judul: 'Ekuivalensi kurikulum', href: 'ekuivalensi-kurikulum.html' },
  dosen: { judul: 'Daftar dosen', href: 'daftar.html?jenis=dosen' },
  lab: { judul: 'Laboratorium', href: 'laboratorium.html' },
  ks: { judul: 'Kerja sama', href: 'kerja-sama.html' },
  prestasi: { judul: 'Prestasi', href: 'prestasi.html' },
  kabar: { judul: 'Kabar', href: 'kabar.html' },
  layanan: { judul: 'Layanan mahasiswa', href: 'layanan-mahasiswa.html' },
  alumni: { judul: 'Alumni', href: 'alumni.html' },
  calon: { judul: 'Untuk calon mahasiswa', href: 'calon-mahasiswa.html' },
};
const ISI = {
  profil: { judul: 'Kelola profil prodi', href: 'kelola-profil.html' },
  vmts: { judul: 'Data prodi › VMTS', href: 'data-prodi.html?tab=vmts' },
  upps: { judul: 'Data prodi › Prodi di UPPS', href: 'data-prodi.html?tab=prodi_upps' },
  mk: { judul: 'Data prodi › Mata kuliah dan CPL', href: 'data-prodi.html?tab=mk' },
  pl: { judul: 'Data prodi › Profil lulusan', href: 'data-prodi.html?tab=profil_lulusan' },
  ekuivalensi: { judul: 'Ekuivalensi mata kuliah', href: 'ekuivalensi.html' },
  dosen: { judul: 'Kelola dosen', href: 'kelola-dosen.html' },
  profilSaya: { judul: 'Profil saya (tiap dosen)', href: 'profil.html' },
  lab: { judul: 'Kelola laboratorium', href: 'kelola-laboratorium.html' },
  ks: { judul: 'Data prodi › Kerja sama', href: 'data-prodi.html?tab=kerjasama' },
  layanan: { judul: 'Kelola layanan mahasiswa', href: 'kelola-layanan-mahasiswa.html' },
  prestasi: { judul: 'Verifikasi data (prestasi)', href: 'verifikasi.html' },
  kabar: { judul: 'Kabar kegiatan', href: 'kabar-kegiatan.html' },
  tracer: { judul: 'Data prodi › Tracer', href: 'data-prodi.html?tab=tracer' },
  config: { judul: 'config.yaml › public_site (admin repo)', href: '' },
};

const n = x => Array.isArray(x) ? x.length : (x && typeof x === 'object' ? Object.keys(x).length : 0);
const ada = v => typeof v === 'string' ? v.trim() !== '' : Boolean(v);

function baris(id, halaman, judul, status, nilai, isi, catatan = '', bolehKosong = false){
  return { id, halaman, judul, status, nilai, isi, catatan, bolehKosong };
}
const dariJumlah = (isi, total) => isi <= 0 ? 'kosong' : (total && isi < total ? 'sebagian' : 'terisi');

/** Semua pemeriksaan dari data.json situs publik. */
export function periksaKelengkapan(D = {}){
  const P = D.profil || {}, s = D.situs || {}, out = [];
  // Profil prodi
  out.push(baris('sambutan', H.profil, 'Sambutan', ada(P.sambutan) ? 'terisi' : 'kosong',
    ada(P.sambutan) ? `${P.sambutan.length} huruf` : '', ISI.profil));
  out.push(baris('sejarah', H.profil, 'Sejarah', ada(P.sejarah) ? 'terisi' : 'kosong',
    ada(P.sejarah) ? `${P.sejarah.length} huruf` : '', ISI.profil));
  const kelola = n(P.pengelola);
  out.push(baris('pengelola', H.profil, 'Pengelola program studi', kelola === 0 ? 'kosong' : kelola < 2 ? 'sebagian' : 'terisi',
    `${kelola} orang`, ISI.profil, kelola < 2 ? 'Ketua Program Studi otomatis dari Penugasan koordinator; tambahkan sekretaris dan koordinator.' : ''));
  const vm = (D.vmts || {}).ps || {};
  const vmIsi = ['visi', 'misi', 'tujuan', 'strategi'].filter(k => ada(vm[k]));
  out.push(baris('vmts', H.profil, 'Visi, misi, tujuan, strategi program studi',
    vmIsi.length === 0 ? 'kosong' : vmIsi.length < 4 ? 'sebagian' : 'terisi', vmIsi.join(', '), ISI.vmts));
  const ak = D.akreditasi_prodi || {};
  out.push(baris('akreditasi', H.profil, 'Akreditasi program studi',
    !ada(ak.peringkat) ? 'kosong' : (ada(ak.nomor_sk) && ada(ak.berlaku_sampai)) ? 'terisi' : 'sebagian',
    [ak.peringkat, ak.lembaga].filter(ada).join(' · '), ISI.upps,
    ada(ak.peringkat) && !(ada(ak.nomor_sk) && ada(ak.berlaku_sampai)) ? 'Lengkapi nomor SK dan tanggal berlaku.' : ''));
  // Kurikulum
  const kur = (D.kurikulum || [])[0] || {};
  const mk = kur.mk || [], tanpaCpl = mk.filter(m => !n(m.cpl)).length;
  out.push(baris('kurikulum', H.kurikulum, `Mata kuliah dan CPL ${kur.kode || ''}`.trim(),
    !mk.length ? 'kosong' : (!n(kur.cpl) || tanpaCpl) ? 'sebagian' : 'terisi',
    `${mk.length} MK, ${n(kur.cpl)} CPL`, ISI.mk, tanpaCpl ? `${tanpaCpl} MK belum punya CPL.` : ''));
  out.push(baris('profil-lulusan', H.kurikulum, 'Profil lulusan', n(kur.profil) ? 'terisi' : 'kosong', `${n(kur.profil)} profil`, ISI.pl));
  out.push(baris('ekuivalensi', H.ekuivalensi, 'Tabel ekuivalensi yang ditetapkan', n(D.ekuivalensi) ? 'terisi' : 'kosong',
    `${n(D.ekuivalensi)} baris`, ISI.ekuivalensi, n(D.ekuivalensi) ? '' : 'Tampil setelah disahkan Kaprodi dan ditetapkan Dekan.'));
  // Dosen
  const dosen = D.dosen || [], tot = dosen.length;
  const foto = dosen.filter(d => ada(d.foto)).length;
  out.push(baris('foto-dosen', H.dosen, 'Foto dosen', dariJumlah(foto, tot), `${foto} dari ${tot}`, ISI.profilSaya,
    foto < tot ? 'Dosen mengunggah foto di Profil saya.' : ''));
  const pakar = dosen.filter(d => n(d.topik_keahlian) || ada(d.bidang_keahlian)).length;
  out.push(baris('kepakaran', H.dosen, 'Bidang dan topik keahlian dosen', dariJumlah(pakar, tot), `${pakar} dari ${tot}`, ISI.profilSaya));
  const idRiset = dosen.filter(d => ada(d.sinta_id) || ada(d.scopus_id) || ada(d.orcid)).length;
  out.push(baris('id-riset', H.dosen, 'ID SINTA, Scopus, atau ORCID', dariJumlah(idRiset, tot), `${idRiset} dari ${tot}`, ISI.profilSaya));
  // Laboratorium
  const namaLab = s.laboratorium || [], profilLab = n(D.laboratorium);
  out.push(baris('laboratorium', H.lab, 'Profil laboratorium', dariJumlah(profilLab, namaLab.length || profilLab),
    `${profilLab} dari ${namaLab.length || profilLab} laboratorium`, ISI.lab,
    profilLab ? '' : 'Halaman hanya menampilkan nama laboratorium; templat isian untuk kepala lab tersedia.'));
  // Kerja sama dan KP
  out.push(baris('kerja-sama', H.ks, 'Kerja sama resmi (MoU/MoA)', n(D.kerja_sama) ? 'terisi' : 'kosong',
    `${n(D.kerja_sama)} kerja sama`, ISI.ks, n(D.kerja_sama) ? '' : 'Halaman kini hanya memuat mitra dari publikasi dan penelitian.'));
  out.push(baris('tempat-kp', H.ks, 'Tempat KP dan magang', n(D.tempat_kp) ? 'terisi' : 'kosong',
    `${n(D.tempat_kp)} instansi`, ISI.layanan, 'Otomatis dari pengajuan KP yang disetujui.'));
  // Mahasiswa dan alumni
  out.push(baris('prestasi', H.prestasi, 'Prestasi mahasiswa', n(D.prestasi) ? 'terisi' : 'kosong', `${n(D.prestasi)} prestasi`, ISI.prestasi));
  out.push(baris('kabar', H.kabar, 'Kabar kegiatan', n(D.kabar) ? 'terisi' : 'kosong', `${n(D.kabar)} kabar`, ISI.kabar,
    n(D.kabar) ? '' : 'Kuliah tamu, kunjungan lapangan, seminar, kompetisi.'));
  out.push(baris('jadwal-ta', H.layanan, 'Jadwal seminar dan sidang TA', n(D.jadwal_ta) ? 'terisi' : 'kosong',
    `${n(D.jadwal_ta)} jadwal`, ISI.layanan, 'Otomatis dari pengajuan seminar/sidang; wajar kosong bila belum ada jadwal.', true));
  const al = D.alumni || {}, resp = +al.responden || 0, min = +al.min || 0;
  out.push(baris('alumni', H.alumni, 'Tracer alumni', resp === 0 ? 'kosong' : resp < min ? 'sebagian' : 'terisi',
    `${resp} responden${min ? ` (tampil mulai ${min})` : ''}`, ISI.tracer));
  // Calon mahasiswa (config)
  out.push(baris('tagline', H.calon, 'Tagline dan karier lulusan', ada(s.tagline) && n(s.karier) ? 'terisi' : (ada(s.tagline) || n(s.karier)) ? 'sebagian' : 'kosong',
    `${n(s.karier)} karier`, ISI.config));
  out.push(baris('pendaftaran', H.calon, 'Tautan pendaftaran (PMB)', ada(s.pendaftaran) ? 'terisi' : 'kosong', '', ISI.config));
  out.push(baris('instagram', H.calon, 'Akun Instagram prodi', ada((s.sosial || {}).instagram) ? 'terisi' : 'kosong', '', ISI.config));
  return out;
}

/** Hitungan per status; bagian bolehKosong yang kosong tidak dihitung sebagai kekurangan. */
export function ringkasKelengkapan(xs){
  const r = { kosong: 0, sebagian: 0, terisi: 0, bolehKosong: 0 };
  for (const x of xs) {
    if (x.bolehKosong && x.status === 'kosong') r.bolehKosong++;
    else r[x.status]++;
  }
  return r;
}
