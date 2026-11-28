// Satu kotak "Lacak kiriman" untuk semua layanan berkode lacak (pemilik 2026-11-28): pertanyaan/masukan/pengaduan (193),
// lamaran asisten (202), peminjaman alat lab (204). Ketiga kode dibuat masukan_kode (10 huruf/angka) di tabel masing-masing;
// kode dicari di ketiganya sekaligus, fungsi yang gagal (patch belum ada) dilewati. Dipakai layanan-mahasiswa.html.
import { STATUS_LAMARAN } from './karier.js?v=2026-11-28-bbb354';
import { STATUS_PINJAM } from './lab.js?v=2026-11-28-bbb354';

export const POLA_KODE = /^[A-Z0-9]{10}$/;
const LABEL_STATUS = { baru: 'Diterima, belum ditinjau', ditindaklanjuti: 'Sedang ditindaklanjuti', selesai: 'Selesai' };
const LABEL_JENIS = { tanya: 'Pertanyaan', masukan: 'Masukan', pengaduan: 'Pengaduan' };
const LABEL_KAT = { perkuliahan: 'perkuliahan dan penilaian', fasilitas: 'fasilitas dan sarana', layanan: 'layanan administrasi',
  perilaku: 'perilaku atau etika', lain: 'lainnya' };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tglId = iso => (iso ? new Date(String(iso).slice(0, 10) + 'T00:00:00Z').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '');

/** Cari kode di ketiga layanan: {masukan, lamaran, pinjam} (null = tidak ditemukan atau fungsi tidak tersedia). */
export async function lacakSemua(sb, kode){
  const r = (f, a) => sb.rpc(f, a).then(x => (x.error ? null : x.data || null), () => null);
  const [masukan, lamaran, pinjam] = await Promise.all([r('lacak_masukan', { p_kode: kode }), r('lacak_lamaran', { p_kode: kode }),
    r('lacak_pinjam', { p_kode: kode })]);
  return { masukan, lamaran, pinjam };
}

/** HTML hasil lacak; teks "tidak ditemukan" bila ketiganya kosong. */
export function htmlLacak({ masukan: m, lamaran: l, pinjam: p } = {}){
  const out = [];
  if (m) out.push(`<div class="lacak-hasil"><b>${esc(LABEL_JENIS[m.jenis] || m.jenis)}</b>${m.kategori ? ` · ${esc(LABEL_KAT[m.kategori] || m.kategori)}` : ''}
    · dikirim ${esc(tglId(m.dikirim))}<br>Status: <b>${esc(LABEL_STATUS[m.status] || m.status)}</b>${m.selesai_pada ? ` (${esc(tglId(m.selesai_pada))})` : ''}
    ${m.tindak_publik ? `<p>Tindak lanjut: ${esc(m.tindak_publik)}</p>` : ''}</div>`);
  if (l) out.push(`<div class="lacak-hasil"><b>Lamaran asisten</b> · ${esc(l.judul)} · dikirim ${esc(tglId(l.dikirim))}<br>
    Status: <b>${esc(STATUS_LAMARAN[l.status] || l.status)}</b>${l.diputuskan ? ` (${esc(tglId(l.diputuskan))})` : ''}</div>`);
  if (p) out.push(`<div class="lacak-hasil"><b>Peminjaman alat</b> · ${esc(p.alat)} (${esc(p.laboratorium)}) ×${esc(p.jumlah)}
    · ${esc(tglId(p.tanggal_pinjam))} s.d. ${esc(tglId(p.rencana_kembali))}<br>Status: <b>${esc(STATUS_PINJAM[p.status] || p.status)}</b>
    ${p.catatan ? `<p>Alasan: ${esc(p.catatan)}</p>` : ''}</div>`);
  return out.length ? out.join('') : '<p class="msg buruk">Kode tidak ditemukan. Periksa lagi penulisannya.</p>';
}
