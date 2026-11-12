// Masa berlaku MoU, SK, dan dokumen lain (pemilik 2026-11-11; 53-patch-berlaku-dokumen.sql).
// Mengumpulkan tanggal berakhir yang sudah ada di data dan menandai yang sudah
// lewat (paling lama setahun ke belakang) atau akan berakhir <= 90 hari.
// Dipakai Pengingat (tabel + email). Hanya membaca.
import { labelDokumen } from './pustaka-dokumen.js?v=2026-11-12-9ba4e4';

export const HARI_SEGERA = 90;     // "3 bulan" (usulan 2026-11-11)
export const HARI_LEWAT = 365;     // yang sudah lewat lebih lama dari ini tidak ditampilkan

const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const tanggal = v => v ? String(v).slice(0, 10) : null;
const akhirTahun = t => t ? `${t}-12-31` : null;
export function selisihHari(sampai, kini = new Date()){
  const [y, m, d] = sampai.split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(kini.getFullYear(), kini.getMonth(), kini.getDate())) / 864e5);
}
export const tglID = s => s ? s.split('-').reverse().join('/') : '—';

/**
 * S = { kerjasama, karyaKS, prodiUpps, petaJalan, dokumen, tautanAmi }.
 * Hasil: [{ sumber, label, sampai, hari, keadaan: 'lewat'|'segera'|'aman', ke, perkiraan, penerima? }]
 * terurut dari tanggal paling awal. penerima = dosen penulis (kerja sama di karya).
 */
export function daftarBerlaku(S, kini = new Date()){
  const out = [];
  const tambah = (sumber, label, sampai, ke, extra = {}) => {
    if (!sampai) return;
    const hari = selisihHari(sampai, kini);
    if (hari < -HARI_LEWAT) return;
    out.push({ sumber, label, sampai, hari, keadaan: hari < 0 ? 'lewat' : hari <= HARI_SEGERA ? 'segera' : 'aman', ke, ...extra });
  };
  (S.kerjasama || []).forEach(r => tambah('Kerja sama', `${r.mitra || '—'}${r.jenis ? ` (${r.jenis})` : ''}`,
    tanggal(r.tanggal_selesai) || akhirTahun(r.tahun_selesai), 'data-prodi.html?tab=kerjasama', { perkiraan: !r.tanggal_selesai }));
  (S.karyaKS || []).forEach(k => tambah('Kerja sama di karya', `${k.mitra_institusi || 'Mitra'} — ${k.judul || ''}`,
    tanggal(k.selesai_ks), 'input.html', { penerima: (k.karya_penulis || []).map(p => p.dosen).filter(d => d?.email) }));
  (S.prodiUpps || []).forEach(r => tambah('SK akreditasi prodi', `${r.nama_prodi || '—'}${r.nomor_sk ? `, SK ${r.nomor_sk}` : ''}`,
    tanggal(r.tanggal_kedaluwarsa), 'data-prodi.html?tab=prodi_upps'));
  (S.petaJalan || []).forEach(r => tambah('Peta jalan', `${r.judul || r.jenis || 'Peta jalan'}`,
    akhirTahun(r.tahun_selesai), 'data-prodi.html?tab=peta_dok', { perkiraan: true }));
  (S.dokumen || []).forEach(d => tambah('Dokumen', labelDokumen(d), tanggal(d.berlaku_sampai), 'data-prodi.html?tab=dokumen'));
  (S.tautanAmi || []).filter(t => !t.dicabut).forEach(t => tambah('Tautan AMI', t.judul || 'Tautan AMI',
    tanggal(t.sampai), 'monitoring.html'));
  return out.sort((a, b) => a.sampai.localeCompare(b.sampai));
}

const baris = x => `- ${x.sumber}: ${x.label} — ${x.hari < 0 ? `berakhir ${tglID(x.sampai)} (${-x.hari} hari lalu)`
  : `berakhir ${tglID(x.sampai)} (${x.hari} hari lagi)`}${x.perkiraan ? ' [akhir tahun, tanggal pasti belum diisi]' : ''}`;

/** Penerima email: data prodi ke email pihak Prodi; kerja sama di karya ke dosen penulisnya. */
export function penerimaBerlaku(daftar, emailProdi, namaProdi = 'Prodi'){
  const perlu = daftar.filter(x => x.keadaan !== 'aman');
  const per = new Map();
  const ke = (email, nama, x) => { if (!per.has(email)) per.set(email, { nama, email, b: [] }); per.get(email).b.push(baris(x)); };
  perlu.forEach(x => {
    if (x.penerima) x.penerima.forEach(d => ke(d.email, d.nama || d.email, x));
    else if (emailProdi) ke(emailProdi, namaProdi, x);
  });
  return [...per.values()].map(p => ({ nama: p.nama, email: p.email, rinci: p.b.join('\n') }));
}

const WARNA = { lewat: 'var(--merah)', segera: '#B8860B', aman: 'var(--hijau)' };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function htmlBerlaku(daftar){
  if (!daftar.length) return '<p class="kosong">Belum ada tanggal berakhir di data (kerja sama, SK akreditasi, peta jalan, dokumen, tautan AMI).</p>';
  const n = k => daftar.filter(x => x.keadaan === k).length;
  return `<p class="ket"><b style="color:${WARNA.lewat}">${n('lewat')} sudah berakhir</b> (setahun terakhir) ·
      <b style="color:${WARNA.segera}">${n('segera')} berakhir ≤ ${HARI_SEGERA} hari</b> · ${n('aman')} masih lama.</p>
    <table class="bl"><thead><tr><th>Jenis</th><th>Dokumen / kegiatan</th><th>Berakhir</th><th>Keadaan</th><th></th></tr></thead><tbody>
    ${daftar.map(x => `<tr${x.keadaan === 'aman' ? ' class="aman"' : ''}><td>${esc(x.sumber)}</td><td>${esc(x.label)}${x.perkiraan
      ? '<br><small class="ket">akhir tahun; tanggal pasti belum diisi</small>' : ''}</td>
      <td>${tglID(x.sampai)}</td><td style="color:${WARNA[x.keadaan]};font-weight:600">${x.hari < 0 ? `lewat ${-x.hari} hari`
        : x.keadaan === 'segera' ? `${x.hari} hari lagi` : `${x.hari} hari lagi`}</td>
      <td><a href="${esc(x.ke)}">perbarui ›</a></td></tr>`).join('')}</tbody></table>`;
}
