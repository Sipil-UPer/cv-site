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
  biaya: { judul: 'Biaya dan beasiswa', href: 'biaya-beasiswa.html' },
  english: { judul: 'English', href: 'english.html' },
  ta: { judul: 'Arsip tugas akhir', href: 'tugas-akhir.html' },
  kontak: { judul: 'Kontak', href: 'kontak.html' },
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
  testimoni: { judul: 'Data prodi › Testimoni', href: 'data-prodi.html?tab=testimoni' },
  silabus: { judul: 'Silabus (disahkan Kaprodi)', href: 'silabus.html' },
  kalender: { judul: 'Data prodi › Kalender akademik', href: 'data-prodi.html?tab=kalender_akademik' },
  jadwalTa: { judul: 'Data prodi › Jadwal seminar/sidang TA', href: 'data-prodi.html?tab=jadwal_ta' },
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
  // Halaman per mata kuliah (pemilik 2026-11-22): isi silabus hanya setelah disahkan Kaprodi.
  const berhal = mk.filter(m => m.berkas), sah = berhal.filter(m => m.silabus).length;
  out.push(baris('silabus', H.kurikulum, `Silabus disahkan di halaman mata kuliah ${kur.kode || ''}`.trim(), dariJumlah(sah, berhal.length),
    `${sah} dari ${berhal.length} MK`, ISI.silabus, sah < berhal.length ? 'Deskripsi, tujuan, dan pustaka tampil setelah silabus disahkan.' : ''));
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
  // Kelompok keahlian dan halaman bidang (pemilik 2026-11-22).
  const kel = s.kelompok_keahlian || [], kodeKel = new Set(kel.map(k => k.kode));
  const berKel = dosen.filter(d => kodeKel.has(d.kelompok)).length;
  out.push(baris('kelompok-dosen', H.dosen, 'Kelompok keahlian dosen', kel.length ? dariJumlah(berKel, tot) : 'kosong',
    `${berKel} dari ${tot}`, ISI.dosen, berKel < tot ? 'Dosen tanpa kelompok tidak muncul di halaman bidang keahlian.' : ''));
  const kurangBidang = kel.filter(k => !k.cakupan || !dosen.some(d => d.kelompok === k.kode));
  out.push(baris('bidang', { judul: 'Halaman bidang keahlian', href: kel[0]?.berkas || 'peta-situs.html' }, 'Dosen dan cakupan tiap bidang',
    kel.length ? dariJumlah(kel.length - kurangBidang.length, kel.length) : 'kosong', `${kel.length - kurangBidang.length} dari ${kel.length} bidang`,
    ISI.dosen, kurangBidang.length ? `Belum lengkap: ${kurangBidang.map(k => k.nama).join(', ')}.` : ''));
  const idRiset = dosen.filter(d => ada(d.sinta_id) || ada(d.scopus_id) || ada(d.orcid)).length;
  out.push(baris('id-riset', H.dosen, 'ID SINTA, Scopus, atau ORCID', dariJumlah(idRiset, tot), `${idRiset} dari ${tot}`, ISI.profilSaya));
  // Laboratorium
  const namaLab = s.laboratorium || [], profilLab = n(D.laboratorium);
  out.push(baris('laboratorium', H.lab, 'Profil laboratorium', dariJumlah(profilLab, namaLab.length || profilLab),
    `${profilLab} dari ${namaLab.length || profilLab} laboratorium`, ISI.lab,
    profilLab ? '' : 'Halaman hanya menampilkan nama laboratorium; templat isian untuk kepala lab tersedia.'));
  const labLengkap = (D.laboratorium || []).filter(l => n(l.foto) && n(l.bidang) && n(l.mk)).length;
  out.push(baris('lab-lengkap', H.lab, 'Foto, bidang keahlian, dan MK praktikum laboratorium', dariJumlah(labLengkap, profilLab),
    `${labLengkap} dari ${profilLab} laboratorium`, ISI.lab, profilLab ? 'Bidang tampil di halaman bidang; MK praktikum di halaman mata kuliah.' : ''));
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
  out.push(baris('kalender', H.layanan, 'Kalender akademik', n(D.kalender) ? 'terisi' : 'kosong', `${n(D.kalender)} kegiatan`, ISI.kalender,
    'Diisi admin sekali per semester; tautan kalender resmi universitas dari config.'));
  const al = D.alumni || {}, resp = +al.responden || 0, min = +al.min || 0;
  out.push(baris('alumni', H.alumni, 'Tracer alumni', resp === 0 ? 'kosong' : resp < min ? 'sebagian' : 'terisi',
    `${resp} responden${min ? ` (tampil mulai ${min})` : ''}`, ISI.tracer));
  // Calon mahasiswa (config)
  out.push(baris('tagline', H.calon, 'Tagline dan karier lulusan', ada(s.tagline) && n(s.karier) ? 'terisi' : (ada(s.tagline) || n(s.karier)) ? 'sebagian' : 'kosong',
    `${n(s.karier)} karier`, ISI.config));
  out.push(baris('pendaftaran', H.calon, 'Tautan pendaftaran (PMB)', ada(s.pendaftaran) ? 'terisi' : 'kosong', '', ISI.config));
  out.push(baris('instagram', H.calon, 'Akun Instagram prodi', ada((s.sosial || {}).instagram) ? 'terisi' : 'kosong', '', ISI.config));
  out.push(baris('testimoni', H.calon, 'Testimoni alumni dan mahasiswa', n(D.testimoni) ? 'terisi' : 'kosong',
    `${n(D.testimoni)} testimoni`, ISI.testimoni, 'Tampil hanya bila tanggal persetujuan orangnya dicatat.'));
  // Arsip judul TA (pemilik 2026-11-22): sidang akhir yang selesai di Data prodi.
  const ta = D.arsip_ta || [], taBidang = ta.filter(t => t.bidang).length;
  out.push(baris('arsip-ta', H.ta, 'Arsip judul tugas akhir', !ta.length ? 'kosong' : taBidang < ta.length ? 'sebagian' : 'terisi',
    `${ta.length} judul`, ISI.jadwalTa, ta.length ? (taBidang < ta.length ? `${ta.length - taBidang} judul tanpa bidang.` : '')
      : 'Dari sidang akhir berstatus selesai; judul TA lama boleh dicatat sebagai sidang akhir yang selesai.'));
  const k = s.kontak || {};
  out.push(baris('kontak', H.kontak, 'Alamat, telepon, email, jam layanan', ['address', 'phone', 'email', 'hours'].every(x => ada(k[x])) ? 'terisi'
    : ['address', 'phone', 'email', 'hours'].some(x => ada(k[x])) ? 'sebagian' : 'kosong',
    ['address', 'phone', 'email', 'hours'].filter(x => ada(k[x])).length + ' dari 4', ISI.config, 'Kini kontak universitas; ganti dengan kontak prodi bila ada.'));
  out.push(baris('biaya', H.biaya, 'Tautan resmi biaya dan beasiswa', n(s.biaya) ? 'terisi' : 'kosong', `${n(s.biaya)} tautan`, ISI.config,
    'Hanya tautan ke halaman resmi universitas, tanpa angka biaya.'));
  // Nama Inggris mata kuliah: halaman English dan halaman mata kuliah berbahasa Inggris (pemilik 2026-11-22).
  const en = mk.filter(m => m.nama_en).length;
  out.push(baris('nama-en', H.english, `Nama Inggris mata kuliah ${kur.kode || ''}`.trim(), dariJumlah(en, mk.length), `${en} dari ${mk.length} MK`,
    ISI.mk, en < mk.length ? `Belum: ${mk.filter(m => !m.nama_en).map(m => m.nama).slice(0, 6).join(', ')}.` : ''));
  return out;
}

/**
 * Tautan internal satu halaman (pemilik 2026-11-22, pemeriksa tautan rusak): alamat lengkap tanpa #/? yang berada di bawah
 * akar dan menuju .html (atau folder). html = isi halaman, dari = alamat halaman itu, akar = alamat folder situs (berakhir '/').
 */
export function tautanInternal(html, dari, akar){
  const out = new Set();
  for (const m of String(html || '').matchAll(/\shref="([^"]+)"/g)) {
    const h = m[1].replace(/&amp;/g, '&');
    if (/^(#|mailto:|tel:|javascript:|data:)/i.test(h) || h.includes('${')) continue;
    let u;
    try { u = new URL(h, dari); } catch { continue; }
    u.hash = ''; u.search = '';
    const s = u.href;
    if (s.startsWith(akar) && (/\.html$/.test(u.pathname) || s.endsWith('/'))) out.add(s);
  }
  return [...out];
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
