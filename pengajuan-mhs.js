// Pengajuan mahasiswa KP dan laporan lomba (90-patch-pengajuan-mahasiswa.sql, pemilik 2026-11-17).
// Dipakai pengajuan.html (mahasiswa, tanpa login) dan pengajuan-mahasiswa.html (pembimbing/admin).
// Daftar jenis berkas sama dengan MHS_BERKAS di apps-script/Code.gs dan pengajuan_berkas_jenis_check (patch 90).

export const JENIS = {
  kp: { label: 'Kerja Praktik (KP)', singkat: 'KP', wajib: 'surat_permohonan',
        berkas: ['surat_permohonan', 'surat_balasan', 'laporan_kp', 'surat_selesai', 'logbook', 'foto', 'lainnya'] },
  lomba: { label: 'Laporan lomba', singkat: 'Lomba', wajib: 'laporan_lomba',
           berkas: ['laporan_lomba', 'sertifikat', 'surat_tugas', 'foto', 'lainnya'] },
  // Surat ditandatangani Kaprodi (93-patch-pengajuan-surat.sql): tanpa pembimbing, tanpa berkas wajib.
  surat: { label: 'Permohonan surat', singkat: 'Surat', wajib: null, tanpaPembimbing: true, berkas: ['lainnya'] },
  // Seminar/sidang TA (94-patch-jadwal-ta.sql): pembimbing 1 memeriksa kesiapan, admin menjadwalkan.
  ta: { label: 'Seminar/sidang TA', singkat: 'TA', wajib: 'naskah_ta', berkas: ['naskah_ta', 'lainnya'] },
  // Publikasi/luaran mahasiswa (96-patch-luaran-mahasiswa.sql): mandiri -> tabel LKPS 6.e.1 / 6.e.3.
  luaran: { label: 'Publikasi/luaran', singkat: 'Luaran', wajib: 'bukti_luaran', berkas: ['bukti_luaran', 'lainnya'] },
};

export const JENIS_PUB = [['jurnal', 'Jurnal'], ['prosiding', 'Prosiding'], ['buku', 'Buku'], ['lainnya', 'Lainnya']];
export const TINGKAT_PUB = [['internasional', 'Internasional'], ['nasional', 'Nasional'], ['wilayah', 'Wilayah']];
export const INDEKSASI = [['scopus', 'Scopus'], ['wos', 'Web of Science'], ['bereputasi', 'Internasional bereputasi lain'],
                          ['sinta', 'SINTA'], ['tidak_terindeks', 'Tidak terindeks']];
export const JENIS_LUARAN = [['paten', 'Paten'], ['paten_sederhana', 'Paten sederhana'], ['hak_cipta', 'Hak cipta'],
  ['desain_industri', 'Desain industri'], ['merek', 'Merek'], ['ttg', 'Teknologi tepat guna'], ['produk', 'Produk'],
  ['buku_isbn', 'Buku ber-ISBN'], ['book_chapter', 'Book chapter']];

export const TAHAP_TA = [['seminar_proposal', 'Seminar proposal'], ['seminar_kemajuan', 'Seminar kemajuan'], ['sidang_akhir', 'Sidang akhir']];
export const NAMA_TAHAP_TA = ['Isi dan unggah naskah', 'Diperiksa pembimbing 1', 'Dijadwalkan admin prodi', 'Terjadwal'];
// Pengajuan pembimbing TA (110, pemilik 2026-11-18): sekali di awal; koordinator TA menetapkan pembimbing menurut
// kelompok keahlian (KK) dan kuota. Pembimbing 1 harus KK sama atau berdekatan; seminar/sidang memakai penetapan ini.
export const TAHAP_PEMBIMBING_TA = 'penetapan_pembimbing';
export const TAHAP_TA_AJU = [[TAHAP_PEMBIMBING_TA, 'Pengajuan pembimbing TA'], ...TAHAP_TA];
export const NAMA_TAHAP_PEMBIMBING_TA = ['Isi KK, judul awal, dan usulan pembimbing', 'Dikirim ke koordinator TA',
                                         'Diperiksa koordinator TA; pembimbing ditetapkan', 'Pembimbing TA ditetapkan'];
export const penetapanTA = p => p?.jenis === 'ta' && p?.data?.tahap_ta === TAHAP_PEMBIMBING_TA;
// Dosen yang boleh jadi pembimbing 1 untuk KK topik TA (pembimbing_pilihan_ta(): kk_cocok = KK sendiri + berdekatan).
export const pembimbingCocok = (dosen, kk) => (dosen || []).filter(d => !!kk && (d.kk_cocok || []).includes(kk));
// Sama dengan public.ta_kk_cocok (110): KK sama, atau pasangan ta_kk_dekat {kk_a, kk_b} (dua arah).
export const kkCocok = (kkTa, kkDosen, dekat = []) => !!kkTa && !!kkDosen && (kkTa === kkDosen
  || dekat.some(k => (k.kk_a === kkTa && k.kk_b === kkDosen) || (k.kk_b === kkTa && k.kk_a === kkDosen)));
// Pilihan pembimbing 1 untuk koordinator TA: baris ta_beban(ts) -> cocok KK dulu, lalu abjad; teks "Nama - KK - 2/5".
export function pilihanPembimbingTA(rows = [], kkTa = '', dekat = []){
  return rows.map(r => {
    const cocok = kkCocok(kkTa, r.kk, dekat), lebih = r.kuota != null && r.beban >= r.kuota;
    return { ...r, cocok, lebih, teks: `${r.nama} — ${r.kk || 'KK belum diisi'} — ${r.beban}${r.kuota == null ? '' : '/' + r.kuota}`
      + `${lebih ? ' (kuota penuh)' : ''}${cocok ? '' : ' (di luar KK)'}` };
  }).sort((a, b) => (b.cocok - a.cocok) || String(a.nama).localeCompare(String(b.nama), 'id'));
}

export const JENIS_SURAT = [['aktif_kuliah', 'Surat keterangan aktif kuliah'], ['izin_penelitian', 'Surat izin penelitian/survei'],
                            ['rekomendasi', 'Surat rekomendasi']];
export const NAMA_TAHAP_SURAT = ['Isi permohonan', 'Dikirim ke prodi', 'Diproses admin prodi', 'Surat terbit'];

export const LABEL_BERKAS = {
  surat_permohonan: 'Surat permohonan KP', surat_balasan: 'Surat balasan instansi', laporan_kp: 'Laporan KP',
  surat_selesai: 'Surat keterangan selesai', logbook: 'Logbook', nilai_lapangan: 'Nilai pembimbing lapangan',
  laporan_lomba: 'Laporan lomba', sertifikat: 'Sertifikat/piagam', surat_tugas: 'SK/surat tugas', foto: 'Foto kegiatan',
  lainnya: 'Lainnya', surat_pengantar: 'Surat pengantar dari prodi', surat_jadi: 'Surat dari prodi (bertanda tangan)',
  naskah_ta: 'Naskah TA (proposal / laporan kemajuan / laporan akhir)',
  bukti_luaran: 'Bukti publikasi/luaran (naskah, LoA, sertifikat HKI, halaman ISBN)',
};

export const LABEL_STATUS = {
  draf: 'Draf (belum dikirim)', pembimbing: 'Diperiksa dosen pembimbing', admin: 'Diperiksa admin prodi',
  disetujui: 'Disetujui', dikembalikan: 'Dikembalikan untuk diperbaiki', ditolak: 'Ditolak',
};

export const TINGKAT = [['internasional', 'Internasional'], ['nasional', 'Nasional'], ['wilayah_lokal', 'Wilayah/lokal']];
export const BIDANG = [['akademik', 'Akademik'], ['non_akademik', 'Non-akademik']];

// Jalur proses untuk ditampilkan: empat tahap tetap; keadaan dari status sekarang dan riwayat.
// Hasil [{kunci, label, keadaan: 'selesai'|'kini'|'nanti'|'kembali'|'tolak', waktu, oleh, catatan}].
const TAHAP = [['draf', 'Isi dan unggah berkas'], ['pembimbing', 'Diperiksa dosen pembimbing'],
               ['admin', 'Diperiksa admin prodi'], ['disetujui', 'Disetujui']];
// Laporan selesai KP (91-patch-laporan-selesai-kp.sql): label tahap dan berkasnya.
export const NAMA_TAHAP_SELESAI = ['Isi laporan selesai', 'Diperiksa dosen pembimbing', 'Diperiksa koordinator KP/admin', 'KP selesai'];
// Pengajuan KP (107, pemilik 2026-11-18): langsung ke koordinator KP/admin, yang menetapkan dosen pembimbing (kuota).
export const NAMA_TAHAP_KP = ['Isi pengajuan dan unggah surat', 'Dikirim ke koordinator KP', 'Diperiksa koordinator KP; pembimbing ditetapkan',
                              'Surat pengantar terbit'];
// Laporan lomba (108, pemilik 2026-11-18): satu persetujuan, dari dosen pembimbing, pembina kemahasiswaan, atau admin.
export const NAMA_TAHAP_LOMBA = ['Isi laporan dan unggah bukti', 'Diperiksa dosen pembimbing atau pembina kemahasiswaan',
                                 'Disahkan (satu persetujuan)', 'Tercatat sebagai prestasi'];
// nilai_lapangan tidak di sini: diunggah dosen pembimbing, koordinator KP, atau admin (99-patch-kp-magang.sql).
export const BERKAS_SELESAI = ['laporan_kp', 'surat_selesai', 'logbook', 'surat_balasan', 'foto', 'lainnya'];

// Program pengajuan KP (99-patch-kp-magang.sql, pemilik 2026-11-17): kosong = Kerja Praktik.
export const PROGRAM_KP = [['kp', 'Kerja Praktik (KP)'], ['magang', 'Magang (MBKM)']];
export const labelProgram = v => (PROGRAM_KP.find(x => x[0] === (v || 'kp')) || PROGRAM_KP[0])[1];

// Status untuk dibaca manusia, dengan tahap KP.
export function labelStatus(p){
  if (p.jenis === 'surat') return { admin: 'Diproses admin prodi', disetujui: 'Surat terbit' }[p.status] || LABEL_STATUS[p.status] || p.status;
  if (penetapanTA(p)) return { pembimbing: 'Diperiksa koordinator TA', admin: 'Diperiksa koordinator TA',
    disetujui: 'Pembimbing TA ditetapkan' }[p.status] || LABEL_STATUS[p.status] || p.status;
  if (p.jenis === 'ta') return { pembimbing: 'Diperiksa pembimbing 1', admin: 'Menunggu jadwal dari admin prodi', disetujui: 'Terjadwal' }[p.status]
    || LABEL_STATUS[p.status] || p.status;
  if (p.jenis === 'lomba') return { pembimbing: 'Diperiksa dosen pembimbing atau pembina kemahasiswaan', admin: 'Diperiksa pembina kemahasiswaan/admin',
    disetujui: 'Disahkan; tercatat sebagai prestasi' }[p.status] || LABEL_STATUS[p.status] || p.status;
  if (p.jenis === 'kp' && p.tahap === 'selesai') return { pembimbing: 'Laporan selesai: diperiksa dosen pembimbing',
    admin: 'Laporan selesai: diperiksa koordinator KP/admin', disetujui: 'KP selesai', dikembalikan: 'Laporan selesai dikembalikan untuk diperbaiki',
    ditolak: 'Laporan selesai ditolak' }[p.status] || p.status;
  // Jawaban instansi atas surat pengantar (107): data.jawaban_instansi 'diterima' | 'ditolak'.
  if (p.jenis === 'kp' && p.status === 'ditolak' && p.data?.jawaban_instansi === 'ditolak') return 'Ditolak instansi; pengajuan ditutup';
  if (p.jenis === 'kp' && p.status === 'disetujui') return p.data?.jawaban_instansi === 'diterima'
    ? 'Diterima instansi; KP dilaksanakan (pelaporan selesai belum dikirim)' : 'Surat pengantar terbit; menunggu jawaban instansi';
  if (p.jenis === 'kp' && p.status === 'admin') return 'Diperiksa koordinator KP/admin';
  return LABEL_STATUS[p.status] || p.status;
}

// Jalur satu tahap KP (atau lomba): status dan riwayat tahap itu saja. Riwayat tanpa tahap = pengajuan (patch 90).
export function jalurTahap(p, tahap = 'pengajuan'){
  const r = (p.riwayat || p.pengajuan_riwayat || []).filter(x => (x.tahap || 'pengajuan') === tahap);
  if (tahap === 'pengajuan') return jalur(p.tahap === 'selesai' ? 'disetujui' : p.status, r, p.jenis === 'surat' ? NAMA_TAHAP_SURAT : p.jenis === 'ta' ? (penetapanTA(p) ? NAMA_TAHAP_PEMBIMBING_TA : NAMA_TAHAP_TA) : p.jenis === 'kp' ? NAMA_TAHAP_KP : p.jenis === 'lomba' ? NAMA_TAHAP_LOMBA : null);
  return jalur(p.tahap === 'selesai' ? p.status : 'draf', r, NAMA_TAHAP_SELESAI);
}

export function periksaSelesai(d = {}){
  const g = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d.tanggal_mulai || ''))) g.push('Isi tanggal mulai KP.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d.tanggal_selesai || ''))) g.push('Isi tanggal selesai KP.');
  if (d.tanggal_mulai && d.tanggal_selesai && d.tanggal_selesai < d.tanggal_mulai) g.push('Tanggal selesai tidak boleh sebelum tanggal mulai.');
  if (!String(d.pembimbing_lapangan || '').trim()) g.push('Isi nama pembimbing lapangan.');
  if (String(d.ringkasan || '').trim().length < 30) g.push('Tulis ringkasan kegiatan (minimal 30 huruf).');
  return g;
}

export function jalur(status, riwayat = [], nama = null){
  // Hanya perpindahan status; catatan tanpa perpindahan (mis. "Mengunggah surat pengantar") dilewati.
  const urut = [...riwayat].sort((a, b) => String(a.waktu).localeCompare(String(b.waktu)));
  const pindah = urut.filter((r, i) => i === 0 || r.status !== urut[i - 1].status);
  const terakhir = k => [...pindah].reverse().find(r => r.status === k);
  const posisi = { draf: 0, dikembalikan: 0, pembimbing: 1, admin: 2, disetujui: 3, ditolak: 3 }[status] ?? 0;
  return TAHAP.map(([kunci, label0], i) => {
    const label = nama ? nama[i] : label0;
    let keadaan = i < posisi ? 'selesai' : i === posisi ? 'kini' : 'nanti';
    if (status === 'disetujui' && i === 3) keadaan = 'selesai';
    if (status === 'ditolak' && i === 3) return { kunci: 'ditolak', label: 'Ditolak', keadaan: 'tolak', ...info(terakhir('ditolak')) };
    if (status === 'dikembalikan' && i === 0) return { kunci, label: 'Perbaiki lalu kirim lagi', keadaan: 'kembali', ...info(terakhir('dikembalikan')) };
    return { kunci, label, keadaan, ...(keadaan === 'selesai' ? info(terakhir(TAHAP[i + 1]?.[0] ?? kunci)) : {}) };
  });
}
const info = r => r ? { waktu: r.waktu, oleh: r.oleh, catatan: r.catatan || '' } : {};

// Status yang masih boleh diubah mahasiswa.
export const bolehUbah = s => s === 'draf' || s === 'dikembalikan';

// Anggota tim lomba dari teks, satu orang per baris: "104123011 - Nama", "104123011 Nama", atau "Nama".
export function bacaAnggota(teks){
  return String(teks || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean).slice(0, 10).map(s => {
    const m = s.match(/^(\d{6,15})\s*[-–:,]?\s*(.*)$/);
    return m ? { nim: m[1], nama: m[2].trim() } : { nim: '', nama: s };
  }).filter(a => a.nama);
}
export const teksAnggota = xs => (xs || []).map(a => a.nim ? `${a.nim} - ${a.nama}` : a.nama).join('\n');

// Pemeriksaan isian di peramban (basis data memeriksa lagi). Hasil: daftar pesan; kosong = lengkap.
export function periksaIsian(jenis, { nim, nama, pembimbing, data = {} }){
  const g = [];
  if (nim !== undefined && !/^\d{6,15}$/.test(String(nim).trim())) g.push('NIM harus angka 6–15 digit.');
  if (String(nama || '').trim().length < 2) g.push('Isi nama lengkap.');
  if (!pembimbing && jenis !== 'surat') g.push('Pilih dosen pembimbing.');
  if (jenis === 'kp' && !String(data.instansi || '').trim()) g.push('Isi nama instansi tujuan KP.');
  if (jenis === 'lomba') {
    if (!String(data.nama_kegiatan || '').trim()) g.push('Isi nama kegiatan/lomba.');
    if (!data.tingkat) g.push('Pilih tingkat lomba.');
    if (!data.bidang) g.push('Pilih bidang lomba.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.tanggal || ''))) g.push('Isi tanggal lomba.');
  }
  if (jenis === 'luaran') {
    if (!data.kategori) g.push('Pilih kategori: publikasi atau luaran.');
    if (String(data.judul || '').trim().length < 3) g.push('Tulis judul.');
    if (!/^\d{4}$/.test(String(data.tahun || ''))) g.push('Isi tahun terbit/terdaftar.');
    if (data.kategori === 'publikasi' && !data.jenis_pub) g.push('Pilih jenis publikasi.');
    if (data.kategori === 'luaran' && !data.jenis_luaran) g.push('Pilih jenis luaran.');
    if (data.doi_url && !/^https?:\/\/\S+$/i.test(data.doi_url)) g.push('DOI/URL harus diawali https://');
  }
  if (jenis === 'ta') {
    if (!data.tahap_ta) g.push('Pilih tahap TA.');
    if (data.tahap_ta === TAHAP_PEMBIMBING_TA && !data.kk_ta) g.push('Pilih kelompok keahlian topik TA.');
    if (String(data.judul || '').trim().length < 3) g.push(data.tahap_ta === TAHAP_PEMBIMBING_TA ? 'Tulis judul awal TA.' : 'Tulis judul TA.');
    if (data.pembimbing_2 && data.pembimbing_2 === pembimbing) g.push('Pembimbing 2 harus berbeda dari pembimbing 1.');
  }
  if (jenis === 'surat') {
    if (!data.jenis_surat) g.push('Pilih jenis surat.');
    if (String(data.keperluan || '').trim().length < 5) g.push('Tulis keperluan surat.');
    if (['izin_penelitian', 'rekomendasi'].includes(data.jenis_surat) && !String(data.tujuan_surat || '').trim()) g.push('Tulis tujuan surat (kepada siapa).');
    if (data.jenis_surat === 'izin_penelitian' && !String(data.judul_penelitian || '').trim()) g.push('Tulis judul penelitian.');
  }
  return g;
}

export const judulPengajuan = p => p.jenis === 'kp' ? (p.data?.instansi || 'KP') : p.jenis === 'ta' ? (p.data?.judul || 'Tugas Akhir')
  : p.jenis === 'luaran' ? (p.data?.judul || 'Publikasi/luaran')
  : p.jenis === 'surat' ? ((JENIS_SURAT.find(x => x[0] === p.data?.jenis_surat) || [, 'Surat'])[1]) : (p.data?.nama_kegiatan || 'Lomba');

export const keB64 = f => new Promise((ok, gagal) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result).split(',')[1] || '');
  r.onerror = () => gagal(r.error);
  r.readAsDataURL(f);
});

// Hasil isiBerkas_ Apps Script ({name, mime, data base64}) dibuka di tab baru.
export function bukaIsi(out){
  const b = Uint8Array.from(atob(out.data), c => c.charCodeAt(0));
  const u = URL.createObjectURL(new Blob([b], { type: out.mime || 'application/octet-stream' }));
  const a = document.createElement('a');
  a.href = u; a.target = '_blank'; a.rel = 'noopener';
  if (!/^(application\/pdf|image\/)/.test(out.mime || '')) a.download = out.name || 'berkas';
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 60000);
}

// Panggil Apps Script (UPLOAD_URL di config.js).
export async function appsScript(isi){
  const res = await fetch(window.UPLOAD_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                                               body: JSON.stringify(isi) });
  const out = await res.json();
  if (!out.ok) throw new Error(out.error || 'Gagal.');
  return out;
}

// ---------- Rekap dan unduhan per periode (pemilik 2026-11-17) ----------
// Waktu satu pengajuan untuk saringan TS/tahun (sdgs-unduh.js cocokPeriode memakai {tahun, bulan}):
// KP = tanggal mulai di laporan selesai, lalu tanggal mulai dari jawaban instansi (107), lalu rencana mulai, lalu tanggal dibuat; lomba = tanggal lomba, lalu dibuat.
export function waktuPengajuan(p){
  const d = p.data || {}, s = p.data_selesai || {};
  const t = String((p.jenis === 'kp' ? s.tanggal_mulai || d.tanggal_mulai || d.rencana_mulai : d.tanggal) || p.dibuat || '');
  const m = t.match(/^(\d{4})-(\d{2})/);
  return m ? { tahun: +m[1], bulan: +m[2] } : { tahun: 0, bulan: 0 };
}

// Keadaan KP untuk rekap: 'selesai' (laporan selesai disahkan), 'berjalan' (ditampilkan "dilaksanakan": pengajuan
// disetujui atau laporan selesai sedang diperiksa), 'proses' (pengajuan belum disetujui), 'ditolak' (prodi atau instansi), 'draf'.
export function keadaanKP(p){
  if (p.status === 'draf') return 'draf';
  if (p.status === 'ditolak') return 'ditolak';
  if (p.tahap === 'selesai') return p.status === 'disetujui' ? 'selesai' : 'berjalan';
  return p.status === 'disetujui' ? 'berjalan' : 'proses';
}

// Ringkasan: angka KP dan lomba, serta KP per instansi (nama instansi disatukan tanpa beda huruf besar/spasi).
export function rekapPengajuan(xs){
  const kp = xs.filter(p => p.jenis === 'kp' && p.status !== 'draf'), lomba = xs.filter(p => p.jenis === 'lomba' && p.status !== 'draf');
  const hit = (ys, f) => ys.filter(f).length;
  const per = new Map();
  for (const p of kp) {
    const nama = String(p.data?.instansi || '').trim().replace(/\s+/g, ' ');
    if (!nama) continue;
    const k = nama.toLowerCase(), x = per.get(k) || { instansi: nama, mahasiswa: 0, selesai: 0, berjalan: 0 };
    x.mahasiswa++; const e = keadaanKP(p);
    if (e === 'selesai') x.selesai++; else if (e === 'berjalan') x.berjalan++;
    per.set(k, x);
  }
  return {
    kp: { semua: kp.length, selesai: hit(kp, p => keadaanKP(p) === 'selesai'), berjalan: hit(kp, p => keadaanKP(p) === 'berjalan'),
          proses: hit(kp, p => keadaanKP(p) === 'proses') },
    lomba: { semua: lomba.length, disetujui: hit(lomba, p => p.status === 'disetujui'),
             tingkat: Object.fromEntries(TINGKAT.map(([k]) => [k, hit(lomba, p => p.status === 'disetujui' && p.data?.tingkat === k)])) },
    instansi: [...per.values()].sort((a, b) => b.mahasiswa - a.mahasiswa || a.instansi.localeCompare(b.instansi)),
  };
}

// Isi lembar Excel (untuk admin; memuat NIM). Sel tautan berbentuk {t, l}.
const LABEL_KEADAAN = { selesai: 'KP selesai', berjalan: 'KP dilaksanakan', proses: 'Pengajuan diperiksa', ditolak: 'Ditolak', draf: 'Draf' };
export function lembarPengajuan(xs, tsTeks = () => ''){
  const kp = xs.filter(p => p.jenis === 'kp' && p.status !== 'draf'), lomba = xs.filter(p => p.jenis === 'lomba' && p.status !== 'draf');
  const pemb = p => p.dosen?.nama || p.pembimbing || '';
  const L = {
    KP: [['No', 'NIM', 'Nama', 'Program', 'Instansi', 'Pembimbing', 'Mulai', 'Selesai', 'Pembimbing lapangan', 'TS', 'Keadaan', 'Berkas']],
    Lomba: [['No', 'NIM', 'Nama', 'Kegiatan', 'Penyelenggara', 'Tingkat', 'Bidang', 'Capaian', 'Tanggal', 'Anggota lain', 'Pembimbing', 'TS', 'Status']],
    'Instansi KP': [['Instansi', 'Mahasiswa', 'KP selesai', 'KP dilaksanakan']],
    Berkas: [['NIM', 'Nama', 'Jenis pengajuan', 'Jenis berkas', 'Nama berkas', 'Tautan']],
  };
  kp.forEach((p, i) => {
    const s = p.data_selesai || {};
    L.KP.push([i + 1, p.nim, p.nama, labelProgram(p.data?.program), p.data?.instansi || '', pemb(p), s.tanggal_mulai || p.data?.rencana_mulai || '',
      s.tanggal_selesai || p.data?.rencana_selesai || '', [s.pembimbing_lapangan, s.jabatan_lapangan].filter(Boolean).join(', '),
      tsTeks(p), LABEL_KEADAAN[keadaanKP(p)], (p.pengajuan_berkas || []).length]);
  });
  lomba.forEach((p, i) => {
    const d = p.data || {};
    L.Lomba.push([i + 1, p.nim, p.nama, d.nama_kegiatan || '', d.penyelenggara || '', (TINGKAT.find(t => t[0] === d.tingkat) || [, ''])[1],
      (BIDANG.find(t => t[0] === d.bidang) || [, ''])[1], d.capaian || '', d.tanggal || '', teksAnggota(d.anggota).replace(/\n/g, '; '),
      pemb(p), tsTeks(p), labelStatus(p)]);
  });
  rekapPengajuan(xs).instansi.forEach(x => L['Instansi KP'].push([x.instansi, x.mahasiswa, x.selesai, x.berjalan]));
  [...kp, ...lomba].forEach(p => (p.pengajuan_berkas || []).forEach(b => L.Berkas.push([p.nim, p.nama, JENIS[p.jenis]?.singkat || p.jenis,
    LABEL_BERKAS[b.jenis] || b.jenis, b.nama || '', b.url ? { t: b.url, l: b.url } : ''])));
  return L;
}
