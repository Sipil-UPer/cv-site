// Bukti dari modul operasional 193–200 untuk draf LED (pemilik 2026-11-27): tabel per butir, dipakai tabelPenjelas
// (led-isi.js). Fungsi murni; X.modul dimuat ambilDaftarLKPS (data-lkps.js). Periode TS-2 s.d. TS = tahun akademik
// (1 September s.d. 31 Agustus). Pengaduan dan nilai layanan memakai rekap publik (tanpa isi dan identitas).
import { rekapUjian } from './ujian.js?v=2026-11-28-c88499';
import { rekapSdm, JENIS_SDM } from './sdm.js?v=2026-11-28-c88499';
import { rekapLab } from './lab.js?v=2026-11-28-c88499';
import { rekapMasukan, kategoriSumber, TOPIK_MASUKAN, KATEGORI_PEMANGKU } from './pemangku.js?v=2026-11-28-c88499';

const angka = v => (v == null ? '—' : String(Math.round(+v * 100) / 100).replace('.', ','));
const ta = t => `${t - 1}/${t}`;
/** Rentang tanggal TS-2 s.d. TS. */
export const rentangTS = ts => ({ dari: `${ts - 3}-09-01`, sampai: `${ts}-08-31` });
const dalam = (t, r) => t && String(t).slice(0, 10) >= r.dari && String(t).slice(0, 10) <= r.sampai;

/** Tahun akademik (1 September s.d. 31 Agustus) dari tanggal: 2026-09-01 -> 2026/2027. */
export const tahunAkademik = t => { const y = +String(t).slice(0, 4), m = +String(t).slice(5, 7); return m >= 9 ? `${y}/${y + 1}` : `${y - 1}/${y}`; };
const JENIS_LOWONGAN = { kerja: 'Kerja', magang: 'Magang', lainnya: 'Lainnya' };
const JENIS_ASISTEN = { praktikum: 'Asisten praktikum', mk: 'Asisten mata kuliah' };
/** Baris rekap rekrutmen asisten per tahun akademik x jenis: [ta, jenis, rekrutmen, kuota, pelamar, diterima, ber-SK]. */
function rekapRekrutmen(xs){
  const per = {};
  for (const x of xs) {
    const k = `${x.tahun_akademik}|${x.jenis}`, ls = x.lamaran || [];
    per[k] ||= { ta: x.tahun_akademik, jenis: JENIS_ASISTEN[x.jenis] || x.jenis, n: 0, kuota: 0, pelamar: 0, diterima: 0, sk: 0 };
    const p = per[k]; p.n += 1; p.kuota += +x.kuota || 0; p.pelamar += ls.length; p.diterima += ls.filter(l => l.status === 'diterima').length; if (x.sk_surat_id) p.sk += 1;
  }
  return Object.values(per).sort((a, b) => a.ta.localeCompare(b.ta) || a.jenis.localeCompare(b.jenis, 'id'))
    .map(p => [p.ta, p.jenis, String(p.n), String(p.kuota), String(p.pelamar), String(p.diterima), `${p.sk} dari ${p.n}`]);
}
const JENIS_KIRIMAN = { tanya: 'Pertanyaan', masukan: 'Masukan', pengaduan: 'Pengaduan' };
const NAMA_LAYANAN = { kp: 'Kerja praktik', lomba: 'Laporan lomba', surat: 'Surat', ta: 'Seminar/sidang TA', luaran: 'Publikasi/luaran',
  yudisium: 'Yudisium', kabar: 'Kabar kegiatan' };

/** Tabel modul untuk butir no: [{judul, baris: [kepala, ...], catatan}]; kosong bila datanya belum ada. */
export function tabelModul(no, X = {}, ts){
  const M = X.modul || {}, r = rentangTS(ts), out = [];
  const tabel = (judul, kepala, baris, catatan = '') => { if (baris.length) out.push({ judul, baris: [['No', ...kepala], ...baris.map((x, i) => [String(i + 1), ...x])], catatan }); };
  const masukan = (M.pemangku?.masukan || []).filter(m => dalam(m.tanggal, r)), pemangku = M.pemangku?.pemangku || [];
  const rekapTopik = topik => rekapMasukan(masukan.filter(m => !topik || topik.includes(m.topik)));
  const adopsi = topik => masukan.filter(m => m.status === 'diadopsi' && (!topik || topik.includes(m.topik)))
    .map(m => [String(m.tanggal).slice(0, 10), KATEGORI_PEMANGKU[kategoriSumber(m, pemangku)] || '—', TOPIK_MASUKAN[m.topik] || m.topik, m.isi, m.tindak_lanjut || '—']);
  const ringkasTopik = (judul, topik) => tabel(judul, ['Tahun', 'Topik', 'Masukan', 'Diadopsi', 'Tidak diadopsi', 'Belum diputuskan'],
    rekapTopik(topik).map(x => [String(x.tahun), TOPIK_MASUKAN[x.topik] || x.topik, String(x.masuk), String(x.diadopsi), String(x.tidak), String(x.baru + x.dikaji)]),
    'Dari Forum pemangku kepentingan (ruang kerja); tidak diadopsi selalu disertai alasan.');
  const KEPALA_ADOPSI = ['Tanggal', 'Sumber', 'Topik', 'Masukan', 'Tindak lanjut'];

  switch (String(no)) {
    case '2': {
      const forum = pemangku.filter(p => p.anggota_forum && p.aktif !== false), per = {};
      for (const p of forum) per[p.kategori] = (per[p.kategori] || 0) + 1;
      tabel('Anggota forum pemangku kepentingan', ['Kategori', 'Jumlah anggota'], Object.entries(per).map(([k, n]) => [KATEGORI_PEMANGKU[k] || k, String(n)]));
      tabel('Masukan pemangku tentang VMTS yang diadopsi', KEPALA_ADOPSI, adopsi(['vmts']));
      break;
    }
    case '4': {
      const k = M.masukanRekap;
      if (k) {
        tabel('Pertanyaan, masukan, dan pengaduan mahasiswa (12 bulan terakhir)', ['Jenis', 'Masuk', 'Selesai', 'Diproses', 'Rerata hari sampai selesai'],
          (k.per_jenis || []).map(x => [JENIS_KIRIMAN[x.jenis] || x.jenis, String(x.masuk), String(x.selesai), String(x.proses), angka(x.rerata_hari)]),
          'Saluran Kirim pertanyaan, masukan, atau pengaduan di halaman Layanan mahasiswa: boleh tanpa nama, berkode lacak; pengaduan hanya dibaca Kaprodi dan GKM.');
        tabel('Tindak lanjut yang diumumkan', ['Tanggal', 'Jenis', 'Tindakan'], (k.tindakan || []).map(t => [String(t.tanggal || ''), JENIS_KIRIMAN[t.jenis] || t.jenis, t.tindak]));
      }
      // Surat dan SK prodi (201): unsur 2 (SK uraian tugas) dan 5 (tata kelola transparan, akuntabel). Pemetaan Claude 2026-11-28.
      if (M.surat) {
        const nama = k => M.surat.jenis.find(j => j.kode === k)?.nama || k, per = {};
        for (const s of M.surat.surat.filter(s => dalam(s.tanggal, r) && ['disahkan', 'arsip', 'dibatalkan'].includes(s.status))) {
          const k = `${tahunAkademik(s.tanggal)}|${s.jenis}`;
          per[k] ||= { ta: tahunAkademik(s.tanggal), jenis: nama(s.jenis), terbit: 0, qr: 0, batal: 0 };
          if (s.status === 'dibatalkan') per[k].batal += 1; else per[k].terbit += 1;
          if (s.status === 'disahkan' && s.kode_verifikasi) per[k].qr += 1;
        }
        tabel('Surat dan SK program studi', ['Tahun akademik', 'Jenis', 'Terbit', 'Bertanda tangan elektronik (QR)', 'Dibatalkan'],
          Object.values(per).sort((a, b) => a.ta.localeCompare(b.ta) || a.jenis.localeCompare(b.jenis, 'id'))
            .map(x => [x.ta, x.jenis, String(x.terbit), String(x.qr), String(x.batal)]),
          'Agenda surat dan SK prodi bernomor otomatis (Surat dan SK, ruang kerja). SK prodi ditandatangani Dekan, surat lain Kaprodi, secara elektronik '
          + 'tanpa diwakilkan; keaslian dan status berlaku dapat diperiksa siapa pun lewat kode QR. Terbit = disahkan + arsip surat lama.');
      }
      break;
    }
    case '5':
      tabel('Rencana dan realisasi pengembangan dosen dan tendik', ['Tahun', 'Jenis', 'Target', 'Selesai', 'Berjalan', 'Tercapai'],
        rekapSdm((M.sdm || []).filter(x => +x.tahun_target >= ts - 2 && +x.tahun_target <= ts)).map(x => [String(x.tahun), JENIS_SDM[x.jenis] || x.jenis,
          String(x.target), String(x.selesai), String(x.berjalan), x.persen == null ? '—' : `${x.persen}%`]),
        'Dari Rencana pengembangan (ruang kerja); target = semua rencana kecuali yang batal.');
      break;
    case '12':
      ringkasTopik('Masukan pemangku tentang kurikulum dan pembelajaran', ['kurikulum', 'cpl', 'pembelajaran']);
      tabel('Masukan kurikulum yang diadopsi dan tindak lanjutnya', KEPALA_ADOPSI, adopsi(['kurikulum', 'cpl', 'pembelajaran']));
      break;
    case '16': case '55': {
      const U = M.ujian;
      if (U) {
        const tas = [ta(ts - 2), ta(ts - 1), ta(ts)];
        tabel('Validasi soal ujian per semester', ['Semester', 'MK ditawarkan', 'Soal UTS layak', 'Soal UAS layak', 'Pernah direvisi', 'Kelas terjadwal UTS / UAS'],
          rekapUjian(U).filter(x => tas.includes(x.tahun_akademik)).map(x => [`${x.semester} ${x.tahun_akademik}`, String(x.mk), `${x.layak.uts} dari ${x.mk}`,
            `${x.layak.uas} dari ${x.mk}`, String(x.pernahRevisi), `${x.terjadwal.uts} / ${x.terjadwal.uas} dari ${x.kelas}`]),
          'Soal divalidasi GKM atau Kaprodi yang bukan pengampu MK-nya dengan daftar periksa enam butir (Ujian dan validasi soal, ruang kerja).');
      }
      break;
    }
    case '38': {
      const L = M.lab;
      if (L) tabel('Inventaris dan perawatan alat laboratorium', ['Laboratorium', 'Jenis alat', 'Unit', 'Kondisi baik', 'Kalibrasi tepat waktu', 'Perawatan tercatat'],
        rekapLab(L, r).map(x => [x.nama, String(x.jenisAlat), String(x.unit), x.persenBaik == null ? '—' : `${x.persenBaik}%`,
          x.perluKalibrasi ? `${x.kalibrasiTepat} dari ${x.perluKalibrasi}` : '—', String(x.perawatan)]),
        `Kondisi saat ini; perawatan, perbaikan, dan kalibrasi tercatat ${ta(ts - 2)} s.d. ${ta(ts)} (Inventaris dan K3 laboratorium, ruang kerja).`);
      // Rekrutmen asisten (202): pendukung layanan praktikum laboratorium dan MK. Pemetaan Claude 2026-11-28 (tidak disebut rubrik).
      const tas = [ta(ts - 2), ta(ts - 1), ta(ts)];
      if (M.rekrutmen) tabel('Rekrutmen asisten praktikum dan mata kuliah', ['Tahun akademik', 'Jenis', 'Rekrutmen', 'Kuota', 'Pelamar', 'Diterima', 'Ber-SK'],
        rekapRekrutmen(M.rekrutmen.filter(x => tas.includes(x.tahun_akademik) && x.status !== 'draf')),
        'Dibuka terbuka di halaman publik Rekrutmen asisten; pelamar dicocokkan dengan IPK dari data akademik; asisten yang diterima ditetapkan dengan SK.');
      // Layanan karier (unsur 5): lowongan yang ditayangkan dalam periode, per sumber.
      if (M.lowongan) {
        const xs = M.lowongan.filter(l => l.tayang_pada && l.status !== 'ditolak' && dalam(l.tayang_pada, r)), per = {};
        for (const l of xs) { const k = `${tahunAkademik(l.tayang_pada)}|${l.jenis}`;
          per[k] ||= { ta: tahunAkademik(l.tayang_pada), jenis: JENIS_LOWONGAN[l.jenis] || l.jenis, n: 0, mitra: 0, alumni: 0, lain: 0 };
          per[k].n += 1; per[k][l.sumber === 'mitra' ? 'mitra' : l.sumber === 'alumni' ? 'alumni' : 'lain'] += 1; }
        tabel('Layanan karier: lowongan kerja dan magang', ['Tahun akademik', 'Jenis', 'Lowongan', 'Dari mitra', 'Dari alumni', 'Sumber lain'],
          Object.values(per).sort((a, b) => a.ta.localeCompare(b.ta) || a.jenis.localeCompare(b.jenis, 'id'))
            .map(x => [x.ta, x.jenis, String(x.n), String(x.mitra), String(x.alumni), String(x.lain)]),
          'Lowongan ditayangkan di halaman publik Lowongan kerja dan magang setelah diperiksa prodi; alumni dan mitra dapat mengusulkan lowongan.');
      }
      break;
    }
    case '39': {
      const L = M.lab;
      if (L) tabel('Induksi K3 laboratorium', ['Laboratorium', 'Sesi induksi', 'Peserta'],
        rekapLab(L, r).filter(x => x.sesiInduksi).map(x => [x.nama, String(x.sesiInduksi), String(x.pesertaInduksi)]),
        `Induksi K3 wajib sebelum praktikum dan peminjaman alat, ${ta(ts - 2)} s.d. ${ta(ts)}; daftar hadir tersimpan per sesi.`);
      break;
    }
    case '57': {
      const n = M.nilaiRekap;
      if (n && n.n) tabel('Nilai kepuasan layanan mahasiswa (12 bulan terakhir)', ['Layanan', 'Penilai', 'Rata-rata (1–5)'],
        [...(n.per_jenis || []).map(x => [NAMA_LAYANAN[x.jenis] || x.jenis, String(x.n), angka(x.rerata)]), ['Semua layanan', String(n.n), angka(n.rerata)]],
        'Dinilai mahasiswa setelah pengajuannya selesai diproses (halaman pengajuan), melengkapi survei kepuasan tahunan.');
      break;
    }
    case '58': {
      const per = {};
      for (const m of masukan) { const k = kategoriSumber(m, pemangku); per[k] = (per[k] || 0) + 1; }
      tabel('Masukan pemangku eksternal per sumber', ['Sumber', 'Masukan'], Object.entries(per).map(([k, v]) => [KATEGORI_PEMANGKU[k] || k, String(v)]));
      ringkasTopik('Masukan pemangku eksternal per topik', null);
      break;
    }
    default: break;
  }
  return out;
}
