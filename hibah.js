// Pelacak pengajuan hibah (pemilik 2026-11-11; 58-patch-hibah.sql).
// Logika tanpa peramban: tenggat, penerima pengingat, rekap Monitoring, dan
// isi draf karya dari proposal yang didanai. Dipakai hibah.html, pengingat.html,
// dan monitoring.html.
import { selisihHari, tglID } from './masa-berlaku.js?v=2026-11-13-c52571';

export const STATUS = { rencana: 'Rencana', diajukan: 'Diajukan', didanai: 'Didanai', ditolak: 'Ditolak', batal: 'Batal' };
export const KATEGORI = { penelitian: 'Penelitian', pkm: 'PkM', keduanya: 'Penelitian & PkM' };
export const HARI_PENGINGAT = 14;   // usulan 2026-11-11: pengingat mulai 14 hari sebelum tenggat
export const HARI_LEWAT = 365;      // laporan yang lewat lebih lama dari ini tidak diingatkan lagi
export { tglID };

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tgl = v => v ? String(v).slice(0, 10) : null;

/** Sama dengan kolom karya.judul_norm (01-skema.sql): lower(trim(x)) lalu [^a-z0-9]+ -> ' '. */
export const judulNorm = s => String(s ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');

/** Rupiah -> juta, satu desimal, gaya Indonesia ("75,5"); kosong -> '—'. */
export const juta = v => v == null || v === '' || !Number.isFinite(+v) ? '—'
  : (Math.round(+v / 1e5) / 10).toLocaleString('id-ID');

/** Tim: baris hibah_tim { peran, dosen_id, dosen: { nama, email } }; ketua dulu, lalu nama. */
export const timUrut = a => [...(a.hibah_tim || [])].sort((x, y) =>
  (x.peran === 'ketua' ? 0 : 1) - (y.peran === 'ketua' ? 0 : 1) || String(x.dosen?.nama || '').localeCompare(String(y.dosen?.nama || '')));
export const ketuaTim = a => (a.hibah_tim || []).find(t => t.peran === 'ketua') || null;

/**
 * Tenggat terdekat yang masih harus dipenuhi:
 *   rencana  -> pengajuan (tenggat_ajuan, selama tanggal_ajuan kosong)
 *   didanai  -> laporan kemajuan, lalu laporan akhir (selama tanggal selesai kosong)
 * Hasil { jenis: 'pengajuan'|'kemajuan'|'akhir', label, tanggal, hari } atau null.
 */
export function tenggatBerikut(a, kini = new Date()){
  const jadi = (jenis, label, t) => ({ jenis, label, tanggal: t, hari: selisihHari(t, kini) });
  if (a.status === 'rencana' && tgl(a.tenggat_ajuan) && !a.tanggal_ajuan) return jadi('pengajuan', 'Kirim proposal', tgl(a.tenggat_ajuan));
  if (a.status === 'didanai') {
    if (tgl(a.tenggat_kemajuan) && !a.kemajuan_selesai) return jadi('kemajuan', 'Laporan kemajuan', tgl(a.tenggat_kemajuan));
    if (tgl(a.tenggat_akhir) && !a.akhir_selesai) return jadi('akhir', 'Laporan akhir', tgl(a.tenggat_akhir));
  }
  return null;
}

const teksHari = h => h < 0 ? `lewat ${-h} hari` : h === 0 ? 'hari ini' : `${h} hari lagi`;
export { teksHari };

/**
 * Penerima email per ketua tim (bila ketua belum dipilih: seluruh tim).
 * jenis 'pengajuan': proposal rencana, tenggat 0..14 hari lagi (yang sudah lewat tidak diingatkan).
 * jenis 'laporan':   proposal didanai, laporan kemajuan/akhir lewat (<= 365 hari) atau <= 14 hari lagi.
 * Hasil [{ nama, email, rinci }] dan tanpaEmail: proposal yang tidak punya penerima.
 */
export function penerimaHibah(ajuan, jenis, kini = new Date()){
  const per = new Map(), tanpaEmail = [];
  for (const a of ajuan || []) {
    const t = tenggatBerikut(a, kini);
    if (!t) continue;
    if (jenis === 'pengajuan' && !(t.jenis === 'pengajuan' && t.hari >= 0 && t.hari <= HARI_PENGINGAT)) continue;
    if (jenis === 'laporan' && !(t.jenis !== 'pengajuan' && t.hari <= HARI_PENGINGAT && t.hari >= -HARI_LEWAT)) continue;
    const k = ketuaTim(a);
    const ke = (k ? [k] : (a.hibah_tim || [])).map(x => x.dosen).filter(d => d?.email);
    if (!ke.length) { tanpaEmail.push(a); continue; }
    const baris = `- ${a.judul} (${t.label}: ${tglID(t.tanggal)}, ${teksHari(t.hari)})`;
    for (const d of ke) {
      if (!per.has(d.email)) per.set(d.email, { nama: d.nama || d.email, email: d.email, b: [] });
      per.get(d.email).b.push(baris);
    }
  }
  return { penerima: [...per.values()].map(p => ({ nama: p.nama, email: p.email, rinci: p.b.join('\n') })), tanpaEmail };
}

/** Panggilan yang masih terbuka: tanpa tenggat, atau tenggat hari ini atau nanti; terdekat dulu. */
export const panggilanTerbuka = (xs, kini = new Date()) => (xs || [])
  .filter(p => !tgl(p.tenggat) || selisihHari(tgl(p.tenggat), kini) >= 0)
  .sort((a, b) => String(tgl(a.tenggat) || '9999').localeCompare(String(tgl(b.tenggat) || '9999')));

export const barisPanggilan = p => `- ${p.judul}${p.penyelenggara ? ` (${p.penyelenggara})` : ''}${KATEGORI[p.kategori] ? `, ${KATEGORI[p.kategori]}` : ''}`
  + `${tgl(p.tenggat) ? `, tenggat ${tglID(tgl(p.tenggat))}` : ''}${p.tautan ? `\n  ${p.tautan}` : ''}`;

/**
 * Pengumuman panggilan ke semua dosen aktif selain asesor yang punya email.
 * Panggilan = yang terbuka dan belum pernah diumumkan; bila semua sudah, seluruh yang terbuka.
 * Hasil { penerima, panggilan } (panggilan dipakai untuk menandai diumumkan setelah terkirim).
 */
export function penerimaPanggilan(dosen, panggilan, kini = new Date()){
  const buka = panggilanTerbuka(panggilan, kini);
  const baru = buka.filter(p => !p.diumumkan);
  const pakai = baru.length ? baru : buka;
  if (!pakai.length) return { penerima: [], panggilan: [] };
  const rinci = pakai.map(barisPanggilan).join('\n');
  const penerima = (dosen || []).filter(d => d.email && d.aktif !== false && d.peran !== 'asesor')
    .map(d => ({ nama: d.nama || d.email, email: d.email, rinci }));
  return { penerima, panggilan: pakai };
}

/**
 * Isi draf karya dari proposal yang didanai (41-patch-draf-karya.sql: status 'draf').
 * Hasil { karya, penulis } atau { galat }. penulis tanpa karya_id (diisi setelah insert).
 */
export function karyaDariHibah(a, pelaporId){
  if (a.status !== 'didanai') return { galat: 'Hanya proposal berstatus didanai yang bisa dijadikan karya.' };
  if (a.karya_id) return { galat: 'Proposal ini sudah tertaut ke karya.' };
  if (!a.skema_kode) return { galat: 'Pilih skema pendanaan dulu (Ubah › Skema).' };
  if (!a.tahun_mulai) return { galat: 'Isi tahun pelaksanaan dulu (Ubah › Tahun pelaksanaan).' };
  const tim = timUrut(a);
  if (!tim.length) return { galat: 'Tim belum diisi.' };
  const karya = { kategori: a.kategori, judul: String(a.judul).trim(), tahun: +a.tahun_mulai, skema_kode: a.skema_kode,
    nama_pemberi_dana: a.nama_pemberi_dana || null, besaran_dana: a.dana_disetujui ?? null,
    status: 'draf', dilaporkan_oleh: pelaporId };
  const penulis = tim.map(t => ({ dosen_id: t.dosen_id, peran: t.peran === 'ketua' ? 'ketua' : 'anggota', ditambahkan_sendiri: false }));
  return { karya, penulis };
}

// ---------------------------------------------------------------------------
// Rekap Monitoring dari hibah_rekap(): baris { tahun, kategori, skema, kelompok, status, n, dana_usulan, dana_disetujui }.

const kosong = () => ({ rencana: 0, diajukan: 0, didanai: 0, ditolak: 0, batal: 0, usulan: 0, disetujui: 0 });
/** Tingkat keberhasilan = didanai / (didanai + ditolak); yang masih menunggu tidak dihitung. null bila belum ada keputusan. */
export const rasio = g => g.didanai + g.ditolak ? g.didanai / (g.didanai + g.ditolak) : null;

export function rekapHibah(rows){
  const tahun = new Map(), skema = new Map(), total = kosong();
  for (const r of rows || []) {
    const n = +r.n || 0;
    for (const [M, k] of [[tahun, r.tahun], [skema, `${r.kategori}|${r.skema}`]]) {
      if (!M.has(k)) M.set(k, { ...kosong(), tahun: r.tahun, kategori: r.kategori, skema: r.skema, kelompok: r.kelompok });
      const g = M.get(k);
      g[r.status] = (g[r.status] || 0) + n;
      if (r.status !== 'rencana' && r.status !== 'batal') g.usulan += +r.dana_usulan || 0;
      if (r.status === 'didanai') g.disetujui += +r.dana_disetujui || 0;
    }
    total[r.status] = (total[r.status] || 0) + n;
    if (r.status !== 'rencana' && r.status !== 'batal') total.usulan += +r.dana_usulan || 0;
    if (r.status === 'didanai') total.disetujui += +r.dana_disetujui || 0;
  }
  return { tahun: [...tahun.values()].sort((a, b) => b.tahun - a.tahun),
           skema: [...skema.values()].sort((a, b) => (b.didanai + b.ditolak + b.diajukan) - (a.didanai + a.ditolak + a.diajukan)
             || String(a.skema).localeCompare(String(b.skema))),
           total };
}

const persen = x => x == null ? '—' : `${Math.round(x * 100)}%`;
const diajukanSemua = g => g.diajukan + g.didanai + g.ditolak;

export function htmlRekap(rows){
  const R = rekapHibah(rows);
  if (!(rows || []).length) return '<p class="kosong">Belum ada proposal hibah yang dicatat. Dosen mencatatnya di Operasional › Pengajuan hibah.</p>';
  const T = R.total;
  const kepala = '<th>Diajukan</th><th>Menunggu</th><th>Didanai</th><th>Ditolak</th><th>Keberhasilan</th><th>Dana diusulkan (juta Rp)</th><th>Dana disetujui (juta Rp)</th>';
  const sel = g => `<td>${diajukanSemua(g)}</td><td>${g.diajukan}</td><td>${g.didanai}</td><td>${g.ditolak}</td><td>${persen(rasio(g))}</td>
    <td>${juta(g.usulan)}</td><td>${juta(g.disetujui)}</td>`;
  return `<p class="ket"><b>${diajukanSemua(T)}</b> proposal diajukan, <b>${T.didanai}</b> didanai, <b>${T.ditolak}</b> ditolak,
      ${T.diajukan} menunggu keputusan${T.rencana ? `, ${T.rencana} masih rencana` : ''}. Tingkat keberhasilan <b>${persen(rasio(T))}</b>
      (didanai dibagi yang sudah diputuskan); dana disetujui <b>Rp${juta(T.disetujui)} juta</b>.</p>
    <div class="gulir"><table class="sp"><thead><tr><th>Tahun usulan</th>${kepala}</tr></thead><tbody>
      ${R.tahun.map(g => `<tr><td>${esc(g.tahun)}</td>${sel(g)}</tr>`).join('')}</tbody></table></div>
    <div class="gulir"><table class="sp"><thead><tr><th>Skema</th><th>Kategori</th>${kepala}</tr></thead><tbody>
      ${R.skema.map(g => `<tr><td>${esc(g.skema)}${g.kelompok ? `<br><small class="ket">${esc(g.kelompok)}</small>` : ''}</td>
        <td>${esc(KATEGORI[g.kategori] || g.kategori)}</td>${sel(g)}</tr>`).join('')}</tbody></table></div>`;
}
