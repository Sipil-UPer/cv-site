// Pengajuan mahasiswa KP dan laporan lomba (90-patch-pengajuan-mahasiswa.sql, pemilik 2026-11-17).
// Dipakai pengajuan.html (mahasiswa, tanpa login) dan pengajuan-mahasiswa.html (pembimbing/admin).
// Daftar jenis berkas sama dengan MHS_BERKAS di apps-script/Code.gs dan pengajuan_berkas_jenis_check (patch 90).

export const JENIS = {
  kp: { label: 'Kerja Praktik (KP)', singkat: 'KP', wajib: 'surat_permohonan',
        berkas: ['surat_permohonan', 'surat_balasan', 'laporan_kp', 'surat_selesai', 'logbook', 'nilai_lapangan', 'foto', 'lainnya'] },
  lomba: { label: 'Laporan lomba', singkat: 'Lomba', wajib: 'laporan_lomba',
           berkas: ['laporan_lomba', 'sertifikat', 'surat_tugas', 'foto', 'lainnya'] },
};

export const LABEL_BERKAS = {
  surat_permohonan: 'Surat permohonan KP', surat_balasan: 'Surat balasan instansi', laporan_kp: 'Laporan KP',
  surat_selesai: 'Surat keterangan selesai', logbook: 'Logbook', nilai_lapangan: 'Nilai pembimbing lapangan',
  laporan_lomba: 'Laporan lomba', sertifikat: 'Sertifikat/piagam', surat_tugas: 'SK/surat tugas', foto: 'Foto kegiatan',
  lainnya: 'Lainnya', surat_pengantar: 'Surat pengantar dari prodi',
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
export const NAMA_TAHAP_SELESAI = ['Isi laporan selesai', 'Diperiksa dosen pembimbing', 'Diperiksa admin prodi', 'KP selesai'];
export const BERKAS_SELESAI = ['laporan_kp', 'surat_selesai', 'logbook', 'nilai_lapangan', 'surat_balasan', 'foto', 'lainnya'];

// Status untuk dibaca manusia, dengan tahap KP.
export function labelStatus(p){
  if (p.jenis === 'kp' && p.tahap === 'selesai') return { pembimbing: 'Laporan selesai: diperiksa dosen pembimbing',
    admin: 'Laporan selesai: diperiksa admin prodi', disetujui: 'KP selesai', dikembalikan: 'Laporan selesai dikembalikan untuk diperbaiki',
    ditolak: 'Laporan selesai ditolak' }[p.status] || p.status;
  if (p.jenis === 'kp' && p.status === 'disetujui') return 'Pengajuan disetujui; KP berjalan (laporan selesai belum dikirim)';
  return LABEL_STATUS[p.status] || p.status;
}

// Jalur satu tahap KP (atau lomba): status dan riwayat tahap itu saja. Riwayat tanpa tahap = pengajuan (patch 90).
export function jalurTahap(p, tahap = 'pengajuan'){
  const r = (p.riwayat || p.pengajuan_riwayat || []).filter(x => (x.tahap || 'pengajuan') === tahap);
  if (tahap === 'pengajuan') return jalur(p.tahap === 'selesai' ? 'disetujui' : p.status, r);
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
  if (!pembimbing) g.push('Pilih dosen pembimbing.');
  if (jenis === 'kp' && !String(data.instansi || '').trim()) g.push('Isi nama instansi tujuan KP.');
  if (jenis === 'lomba') {
    if (!String(data.nama_kegiatan || '').trim()) g.push('Isi nama kegiatan/lomba.');
    if (!data.tingkat) g.push('Pilih tingkat lomba.');
    if (!data.bidang) g.push('Pilih bidang lomba.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.tanggal || ''))) g.push('Isi tanggal lomba.');
  }
  return g;
}

export const judulPengajuan = p => p.jenis === 'kp' ? (p.data?.instansi || 'KP') : (p.data?.nama_kegiatan || 'Lomba');

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
