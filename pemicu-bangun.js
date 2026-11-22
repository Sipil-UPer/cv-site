// Build situs otomatis setelah data publik berubah (pemilik 2026-11-19: "data yang diupload langsung muncul di website").
// Dipasang sekali per halaman ruang kerja oleh menu.js gerbang(). Klien Supabase dibungkus: setelah insert/update/upsert/delete
// berhasil ke tabel yang dibaca pembangun situs publik (bangun.py), atau RPC persetujuan yang membuat data tampil, halaman
// mengirim kind 'bangun_situs' ke Apps Script (window.UPLOAD_URL) setelah JEDA ms tanpa perubahan lagi. Apps Script memicu
// workflow Bangun situs (workflow_dispatch, token di Script Properties) dengan jeda minimal antarpemicu; workflow hanya
// menerbitkan bila data.json/halaman berubah, dan jadwal tiap jam tetap ada sebagai cadangan. Kegagalan pemicu diam saja.

// Tabel yang dibaca bangun.py/halaman_publik.py untuk situs publik (sb.ambil / sb.ambil_opsional), 2026-11-19.
export const TABEL_PUBLIK = new Set(['dosen', 'kabar_kegiatan', 'karya', 'karya_mahasiswa', 'karya_mitra', 'karya_penulis', 'lkps_bukti',
  'lkps_kerjasama', 'lkps_prasarana', 'lkps_prestasi_mahasiswa', 'lkps_prodi_upps', 'lkps_vmts', 'pengajuan_mahasiswa', 'pengelola_prodi',
  'profil_prodi', 'ref_bidang_keahlian', 'ref_cpl', 'ref_kelompok_dana', 'ref_mata_kuliah', 'ref_mk_cpl', 'ref_profil_lulusan', 'testimoni',
  'ref_skema_dana', 'ref_topik_keahlian', 'survei', 'survei_jawaban', 'laboratorium', 'laboratorium_baris', 'jadwal_ta', 'jadwal_ta_baris',
  // 2026-11-22: kalender akademik (patch 148).
  'kalender_akademik']);
// RPC yang menyetujui/menerbitkan data publik.
// silabus_putuskan (patch 129): silabus yang disahkan tampil di halaman mata kuliah (pemilik 2026-11-22).
export const RPC_PUBLIK = new Set(['setujui_ajuan_prestasi', 'setujui_ajuan_ubah', 'silabus_putuskan']);
const UBAH = ['insert', 'update', 'upsert', 'delete'];
export const JEDA = 8000;   // cukup untuk menggabungkan beberapa simpan beruntun; pindah halaman sebelum jeda = tunggu build tiap jam

/** true bila hasil kueri Supabase berhasil (tanpa error). */
const berhasil = r => r && !r.error;

/**
 * Bungkus klien sb: kirim(), dipanggil setelah perubahan publik berhasil, dijadwalkan ulang tiap perubahan (jeda).
 * Mengembalikan sb yang sama. kirim dan jadwal bisa diganti untuk uji.
 */
export function pasangPemicuBangun(sb, { kirim = kirimBangun, jeda = JEDA, jadwal = setTimeout, batal = clearTimeout } = {}){
  if (!sb || sb.__pemicuBangun) return sb;
  let t = null;
  const picu = () => { if (t) batal(t); t = jadwal(() => { t = null; Promise.resolve(kirim(sb)).catch(() => {}); }, jeda); };
  const amati = q => {   // thenable PostgREST: picu setelah selesai tanpa error
    const then = q.then.bind(q);
    q.then = (ok, ng) => then(r => { if (berhasil(r)) picu(); return ok ? ok(r) : r; }, ng);
    return q;
  };
  const from = sb.from.bind(sb);
  sb.from = tabel => {
    const q = from(tabel);
    if (TABEL_PUBLIK.has(tabel)) for (const m of UBAH) if (typeof q[m] === 'function') { const f = q[m].bind(q); q[m] = (...a) => amati(f(...a)); }
    return q;
  };
  if (typeof sb.rpc === 'function') {
    const rpc = sb.rpc.bind(sb);
    sb.rpc = (nama, ...a) => (RPC_PUBLIK.has(nama) ? amati(rpc(nama, ...a)) : rpc(nama, ...a));
  }
  sb.__pemicuBangun = true;
  return sb;
}

/** Minta Apps Script memicu workflow Bangun situs; diam bila belum disiapkan atau gagal. */
export async function kirimBangun(sb){
  if (!globalThis.UPLOAD_URL) return;
  const { data: { session } = {} } = await sb.auth.getSession();
  if (!session) return;
  await fetch(globalThis.UPLOAD_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ token: session.access_token, kind: 'bangun_situs' }) });
}
