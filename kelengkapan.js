// Daftar periksa kelengkapan LED (pemilik 2026-11-05). Fungsi murni: halaman
// kelengkapan.html mengambil data, modul ini menghitung. Aturan terisi sama
// dengan halaman sumbernya: kotak narasi seperti narasi-led.html, bukti butir
// seperti rekap bukti di skor.html.
import { BUTIR_MANUAL } from './butir-manual.js?v=2026-11-11-d37711';
import { UNSUR_BUTIR, pihakUnsur } from './unsur-butir.js?v=2026-11-11-d37711';
import { BUTIR_DATA } from './butir-data.js?v=2026-11-11-d37711';
import { faktaNarasi, anggotaTim } from './led-isi.js?v=2026-11-11-d37711';
import { pisahKalimat } from './led-narasi.js?v=2026-11-11-d37711';
import { masihKerangka } from './led-saran.js?v=2026-11-11-d37711';
import { JENIS_DOKUMEN, buktiButir } from './rencana-bukti.js?v=2026-11-11-d37711';

// Tab Data prodi: [id tab, tabel, judul, butir]; sama dengan TABEL di data-prodi.html.
export const TAB_DATA = [
  ['prodi_upps', 'lkps_prodi_upps', 'Prodi di UPPS', 'PS, 6.a'], ['vmts', 'lkps_vmts', 'VMTS', '1–3'],
  ['kerjasama', 'lkps_kerjasama', 'Kerja sama', '6–7'], ['dana', 'lkps_penggunaan_dana', 'Penggunaan dana', '8–11'],
  ['mk', 'ref_mata_kuliah', 'Mata kuliah', '15, 17, 19, 20'], ['tema', 'ref_tema_peta_jalan', 'Peta jalan', '22–25'],
  ['peta_dok', 'lkps_peta_jalan', 'Dokumen peta jalan', '22, 24'],
  ['tendik', 'lkps_tendik', 'Tenaga kependidikan', '29'], ['bkd', 'lkps_bkd', 'Beban kerja dosen', '30'],
  ['prasarana', 'lkps_prasarana', 'Prasarana & alat', '38'], ['dok_k3l', 'lkps_dokumen_k3l', 'Dokumen K3L', '39'],
  ['fas_k3l', 'lkps_fasilitas_k3l', 'Fasilitas K3L', '39'], ['mahasiswa', 'lkps_mahasiswa_ta', 'Mahasiswa per TS', '40–45'],
  ['prestasi', 'lkps_prestasi_mahasiswa', 'Prestasi mahasiswa', '43'], ['kohort', 'lkps_kohort_lulusan', 'Kohort lulusan', '44–45'],
  ['publikasi', 'lkps_publikasi_mahasiswa', 'Publikasi mahasiswa', '46'], ['luaran', 'lkps_luaran_mahasiswa', 'Luaran mahasiswa', '47'],
  ['tracer', 'lkps_tracer_lulusan', 'Tracer study', '48–51'], ['kepuasan', 'lkps_kepuasan_pengguna', 'Kepuasan pengguna', '52'],
  ['spmi', 'lkps_spmi_ppepp', 'SPMI (PPEPP)', '53–57'], ['target', 'lkps_target_kinerja', 'Target IKU/IKT', '54–56'],
];

// Konteks kalimat narasi; dipakai narasi-led.html dan halaman ini supaya kotaknya sama.
export function konteksNarasi(D, daftar){
  const d = new Date(), ts = d.getFullYear() + (d.getMonth() >= 8 ? 1 : 0);
  const ta = t => `${t - 1}/${t}`;
  const C = { ts, daftar, dokumen: daftar.dokumen, ta: ta(ts), ta2: ta(ts - 2),
    manual: new Set(BUTIR_MANUAL.map(b => String(b.no))),
    judulButir: Object.fromEntries([...BUTIR_DATA, ...BUTIR_MANUAL].map(b => [String(b.no), b.judul])) };
  C.P = { ps: `Program Studi ${D.prodi || ''}`, pt: D.institusi || '', ...faktaNarasi(C) };
  return C;
}

export const statusButir = (ada, n) => ada >= n ? 'selesai' : ada > 0 ? 'sebagian' : 'belum';

// Kotak wajib satu kelompok narasi; kotak narasi tambahan bersifat opsional.
export function hitungKelompok(g, narasi){
  const kunci = g.bagian.flatMap(b => b.kalimat.flatMap(x =>
    pisahKalimat(x.teks, b.lingkup, x.id).filter(p => p.kunci).map(p => p.kunci)));
  const terisi = k => { const v = (narasi || {})[k]; return !!(v && v.trim() && !masihKerangka(v)); };
  return { ada: kunci.filter(terisi).length, n: kunci.length };
}

const baris = (judul, ada, n, o = {}) => ({ judul, ada, n, status: statusButir(ada, n), ...o });

// S: { kelompok, narasi, tugas, tim, dosen, jumlah:{tabel:n|null}, dokumen,
//      butirBukti, pengaturan, karya, karyaBukti, ts }
export function rekapKelengkapan(S){
  const anggota = anggotaTim(S.tim, S.dosen), tugas = S.tugas || {};
  const nama = e => ((S.dosen || []).find(d => String(d.email).toLowerCase() === String(e).toLowerCase()) || {}).nama || e;
  const belumTugas = S.kelompok.filter(g => !tugas[g.id]);
  const kurangData = anggota.filter(d => !d.nomor || !d.jabatan);
  const tim = [
    baris('Anggota tim', anggota.length ? 1 : 0, 1, { ket: `${anggota.length} orang`, href: 'narasi-led.html' }),
    baris('Deskripsi kerja anggota', anggota.filter(d => d.deskripsi).length, anggota.length || 1, { href: 'narasi-led.html',
      kurang: anggota.filter(d => !d.deskripsi).map(d => d.nama) }),
    baris('Nomor dan jabatan anggota', anggota.length - kurangData.length, anggota.length || 1, { href: 'kelola-dosen.html',
      kurang: kurangData.map(d => d.nama) }),
    baris('Penanggung jawab bagian', S.kelompok.length - belumTugas.length, S.kelompok.length, { href: 'narasi-led.html',
      kurang: belumTugas.map(g => g.pendek) }),
  ];

  const narasi = S.kelompok.map(g => {
    const { ada, n } = hitungKelompok(g, S.narasi);
    return baris(g.kelompok, ada, n, { href: 'narasi-led.html', ket: tugas[g.id] ? `Penanggung jawab: ${nama(tugas[g.id])}` : 'Belum ada penanggung jawab' });
  });

  const data = TAB_DATA.map(([id, tabel, judul, butir]) => {
    const j = (S.jumlah || {})[tabel];
    return baris(judul, j > 0 ? 1 : 0, 1, { href: `data-prodi.html?tab=${id}`,
      ket: j == null ? 'Tidak terbaca' : j ? `${j} baris · butir ${butir}` : `Belum diisi · butir ${butir}` });
  });

  const dok = S.dokumen || [];
  const belumDok = JENIS_DOKUMEN.filter(j => !dok.some(d => d.jenis === j.id));
  const peng = S.pengaturan || [];
  const nos = [...new Set([...BUTIR_DATA, ...BUTIR_MANUAL].map(b => String(b.no)))].sort((a, b) => a - b);
  const adaBukti = no => peng.some(p => p.kunci === `bukti_b${no}` && p.nilai != null && String(p.nilai).trim()) ||
    buktiButir(no, { dokumen: dok, butirBukti: S.butirBukti, ts: S.ts }).some(x => x.url);
  const belumBukti = nos.filter(no => !adaBukti(no));
  // Butir kualitatif dinilai dari bukti per unsur, bukan isian angka (pemilik 2026-11-10).
  const berbukti = new Set((S.butirBukti || []).filter(b => b.unsur).map(b => `${b.butir}|${b.unsur}`));
  const semuaUnsur = Object.entries(UNSUR_BUTIR).flatMap(([no, d]) => Object.entries(d.unsur).map(([n, l]) => [no, n, l]));
  const belumUnsur = semuaUnsur.filter(([no, n]) => !berbukti.has(`${no}|${n}`));
  const bukti = [
    baris('Jenis dokumen di pustaka', JENIS_DOKUMEN.length - belumDok.length, JENIS_DOKUMEN.length, { href: 'input-butir.html', kurang: belumDok.map(j => j.nama) }),
    baris('Butir yang punya bukti', nos.length - belumBukti.length, nos.length, { href: 'input-butir.html', kurang: belumBukti.map(no => `Butir ${no}`) }),
    baris('Unsur penilaian berbukti', semuaUnsur.length - belumUnsur.length, semuaUnsur.length, { href: 'input-butir.html',
      kurang: belumUnsur.map(([no, n, l]) => `[${pihakUnsur(no, n)}] Butir ${no} unsur ${n}: ${l}`) }),
  ];

  const karya = (S.karya || []).filter(k => k.status !== 'ditolak' && k.status !== 'draf');
  const diajukan = karya.filter(k => k.status === 'diajukan');
  const berkas = new Set((S.karyaBukti || []).map(b => b.karya_id));
  const tanpaBukti = karya.filter(k => !k.bukti_url && !berkas.has(k.id));
  const dosen = [
    baris('Karya terverifikasi', karya.length - diajukan.length, karya.length || 1, { href: 'input.html', ket: `${diajukan.length} menunggu verifikasi` }),
    baris('Karya dengan tautan bukti', karya.length - tanpaBukti.length, karya.length || 1, { href: 'input.html', ket: `${tanpaBukti.length} tanpa bukti` }),
  ];

  const bagian = [{ id: 'tim', judul: 'Tim penyusun', butir: tim }, { id: 'narasi', judul: 'Narasi LED', butir: narasi },
    { id: 'data', judul: 'Data prodi', butir: data }, { id: 'bukti', judul: 'Dokumen dan bukti', butir: bukti },
    { id: 'karya', judul: 'Karya dosen', butir: dosen }];
  const semua = bagian.flatMap(b => b.butir);
  return { bagian, selesai: semua.filter(b => b.status === 'selesai').length, total: semua.length };
}
