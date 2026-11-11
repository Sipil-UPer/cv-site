// Temuan AMI dan tindak lanjut, siklus PPEPP (pemilik 2026-11-11; 51-patch-temuan-ami.sql).
// Dipakai Data prodi › SPMI › Temuan AMI, Monitoring (juga lewat tautan AMI),
// dan Pengingat. Status: terbuka -> proses -> selesai (menunggu verifikasi)
// -> ditutup (terverifikasi efektif). Tenggat "dekat" = 14 hari atau kurang.
import { PIHAK } from './unsur-butir.js?v=2026-11-11-42413c';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const KATEGORI_TEMUAN = [['kts_mayor', 'KTS mayor'], ['kts_minor', 'KTS minor'],
  ['observasi', 'Observasi'], ['peluang', 'Peluang peningkatan']];
export const STATUS_TEMUAN = [['terbuka', 'Terbuka'], ['proses', 'Dalam proses'],
  ['selesai', 'Selesai, menunggu verifikasi'], ['ditutup', 'Ditutup (efektif)']];
export const PIHAK_TEMUAN = Object.entries(PIHAK);
export const HARI_DEKAT = 14;

const label = (daftar, k) => (daftar.find(x => x[0] === k) || [, k || '—'])[1];
export const labelKategori = k => label(KATEGORI_TEMUAN, k);
export const labelStatus = k => label(STATUS_TEMUAN, k);
const SELESAI = new Set(['selesai', 'ditutup']);

const hariIni = kini => { const d = new Date(kini); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); };
// Selisih hari kalender dari hari ini ke tenggat (negatif = lewat).
export function hariKeTenggat(tenggat, kini = new Date()){
  if (!tenggat) return null;
  const [y, m, d] = String(tenggat).slice(0, 10).split('-').map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - hariIni(kini)) / 864e5);
}
// 'lewat' | 'dekat' | 'aman' | null (sudah selesai atau tanpa tenggat).
export function keadaanTenggat(r, kini = new Date()){
  if (SELESAI.has(r.status)) return null;
  const h = hariKeTenggat(r.tenggat, kini);
  if (h == null) return null;
  return h < 0 ? 'lewat' : h <= HARI_DEKAT ? 'dekat' : 'aman';
}

export function ringkasTemuan(rows, kini = new Date()){
  const xs = rows || [];
  const hitung = (daftar, k) => Object.fromEntries(daftar.map(([v]) => [v, xs.filter(r => r[k] === v).length]));
  const ditutup = xs.filter(r => r.status === 'ditutup').length;
  return { jumlah: xs.length, status: hitung(STATUS_TEMUAN, 'status'), kategori: hitung(KATEGORI_TEMUAN, 'kategori'),
    belumTutup: xs.length - ditutup, persenDitutup: xs.length ? Math.round(ditutup / xs.length * 100) : null,
    lewat: xs.filter(r => keadaanTenggat(r, kini) === 'lewat').length,
    dekat: xs.filter(r => keadaanTenggat(r, kini) === 'dekat').length };
}

// Belum ditutup dulu; di dalamnya lewat tenggat, lalu tenggat terdekat; lalu TS terbaru.
export function urutTemuan(rows, kini = new Date()){
  const bobot = r => r.status === 'ditutup' ? 3 : SELESAI.has(r.status) ? 2 : keadaanTenggat(r, kini) === 'lewat' ? 0 : 1;
  return [...(rows || [])].sort((a, b) => bobot(a) - bobot(b)
    || String(a.tenggat || '9999').localeCompare(String(b.tenggat || '9999'))
    || (b.tahun_ts || 0) - (a.tahun_ts || 0) || String(a.kode || '').localeCompare(String(b.kode || '')));
}

const tgl = v => v ? String(v).slice(0, 10).split('-').reverse().join('/') : '—';
export const WARNA_STATUS_TEMUAN = { terbuka: 'var(--merah)', proses: '#B8860B', selesai: 'var(--biru)', ditutup: 'var(--hijau)' };

export function htmlRingkasTemuan(s){
  if (!s.jumlah) return '<p class="ket">Belum ada temuan AMI.</p>';
  return `<p class="ket"><b>${s.jumlah} temuan</b>: ${STATUS_TEMUAN.map(([k, l]) => `${s.status[k]} ${l.toLowerCase()}`).join(' · ')}.
    ${s.persenDitutup}% ditutup${s.lewat ? `; <b style="color:var(--merah)">${s.lewat} lewat tenggat</b>` : ''}${s.dekat
      ? `; ${s.dekat} tenggatnya ≤ ${HARI_DEKAT} hari` : ''}.
    Kategori: ${KATEGORI_TEMUAN.filter(([k]) => s.kategori[k]).map(([k, l]) => `${s.kategori[k]} ${l}`).join(', ') || '—'}.</p>`;
}

// buktiPer: Map baris_id -> [{judul, url}].
export function htmlTemuan(rows, buktiPer = new Map(), { kini = new Date(), kelasTabel = 'sp' } = {}){
  const xs = urutTemuan(rows, kini);
  if (!xs.length) return htmlRingkasTemuan(ringkasTemuan(xs, kini));
  return htmlRingkasTemuan(ringkasTemuan(xs, kini)) + `<div class="gulir"><table class="${kelasTabel}"><thead><tr>
    <th>Temuan</th><th>Kategori</th><th>Penanggung jawab</th><th>Tenggat</th><th>Status</th><th>Tindak lanjut dan bukti</th>
    </tr></thead><tbody>${xs.map(r => {
      const t = keadaanTenggat(r, kini), h = hariKeTenggat(r.tenggat, kini);
      const bukti = buktiPer.get(r.id) || buktiPer.get(String(r.id)) || [];
      return `<tr><td><small class="ket">${esc([r.siklus || `TS ${r.tahun_ts - 1}/${r.tahun_ts}`, r.kode].filter(Boolean).join(' · '))}</small><br>
          ${esc(r.uraian)}${r.standar || r.butir ? `<br><small class="ket">${esc([r.standar, r.butir ? 'butir ' + r.butir : ''].filter(Boolean).join(' · '))}</small>` : ''}</td>
        <td>${esc(labelKategori(r.kategori))}</td>
        <td>${esc(PIHAK[r.pihak] || '—')}${r.pj_nama ? `<br><small class="ket">${esc(r.pj_nama)}</small>` : ''}</td>
        <td>${tgl(r.tenggat)}${t === 'lewat' ? `<br><small style="color:var(--merah);font-weight:600">lewat ${-h} hari</small>`
          : t === 'dekat' ? `<br><small style="color:#B8860B">${h} hari lagi</small>` : ''}</td>
        <td style="color:${WARNA_STATUS_TEMUAN[r.status] || 'inherit'};font-weight:600">${esc(labelStatus(r.status))}${r.tanggal_selesai
          ? `<br><small class="ket">selesai ${tgl(r.tanggal_selesai)}</small>` : ''}</td>
        <td>${r.rencana ? esc(r.rencana) : '<span class="ket">rencana belum diisi</span>'}${r.verifikasi
          ? `<br><small class="ket">Verifikasi: ${esc(r.verifikasi)}</small>` : ''}${bukti.length ? `<br>${bukti.map(b =>
            `<a href="${esc(b.url)}" target="_blank" rel="noopener">${esc(b.judul || 'bukti')}</a>`).join(' · ')}` : ''}</td></tr>`;
    }).join('')}</tbody></table></div>`;
}

// Penerima pengingat: temuan belum selesai yang lewat atau dekat tenggat, dikelompokkan
// per email (pj_email, bila kosong email pihak). tanpaEmail = temuan yang tidak bisa dikirim.
export function penerimaTemuan(rows, emailPihak = {}, kini = new Date()){
  const per = new Map(), tanpaEmail = [];
  for (const r of urutTemuan(rows, kini)) {
    const t = keadaanTenggat(r, kini);
    if (t !== 'lewat' && t !== 'dekat') continue;
    const email = (r.pj_email || emailPihak[r.pihak] || '').trim();
    if (!email) { tanpaEmail.push(r); continue; }
    if (!per.has(email)) per.set(email, { nama: r.pj_email ? (r.pj_nama || email) : (PIHAK[r.pihak] || email), email, butir: [] });
    const h = hariKeTenggat(r.tenggat, kini);
    per.get(email).butir.push(`- ${[r.siklus, r.kode].filter(Boolean).join(' ')}: ${r.uraian} (tenggat ${tgl(r.tenggat)}, ${
      h < 0 ? `lewat ${-h} hari` : `${h} hari lagi`}; status ${labelStatus(r.status).toLowerCase()})`);
  }
  return { penerima: [...per.values()].map(p => ({ nama: p.nama, email: p.email, rinci: p.butir.join('\n') })), tanpaEmail };
}

export const buktiPerBaris = bukti => {
  const m = new Map();
  for (const b of bukti || []) { const k = String(b.baris_id); if (!m.has(k)) m.set(k, []); m.get(k).push(b); }
  return m;
};
