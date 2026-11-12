// Potret skor akreditasi berkala (pemilik 2026-11-11; 52-patch-potret-skor.sql).
// skor.html menyimpan angka ringkasan (NA, status, syarat perlu, skor tiap
// butir) ke potret_skor: otomatis sekali sebulan saat admin membuka Skor,
// atau manual dengan catatan. Riwayatnya ditampilkan sebagai tren dan
// perubahan butir terhadap potret sebelumnya.
import { SASARAN, gabungSyarat } from './syarat-unggul.js?v=2026-11-12-e3f9f9';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const r2 = x => Math.round(x * 100) / 100;
const f2 = x => x == null ? '—' : (+x).toFixed(2).replace('.', ',');

// Tanggal 1 bulan dari tanggal lokal, 'YYYY-MM-01'.
export const bulanDari = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;

// Batas NA menurut pedoman (Tabel 3): Terakreditasi 200, Unggul 331 dan 361.
export const BATAS_NA = [[200, 'Terakreditasi'], [331, 'Unggul 3 th'], [361, 'Unggul 5 th']];

/** Baris potret dari konteks render skor.html (ctxJalan) dan angka ringkasan. */
export function isiPotret(ctx, { cakupan, butirTerisi, butirTotal }){
  const skor = Object.fromEntries(Object.entries(ctx.skorButir || {})
    .map(([no, r]) => [no, r && r.ada ? r2(r.n) : null]));
  const syarat = Object.fromEntries(SASARAN.map(sa => [sa, gabungSyarat((ctx.semuaSy || []).map(x => x[sa + 'ok']))]));
  syarat.gagal = SASARAN.flatMap(sa => (ctx.semuaSy || []).filter(x => x[sa + 'ok'] === false)
    .map(x => `${sa}: ${x.indikator ? x.label : 'butir ' + x.no}`));
  const st = ctx.st || {};
  return { ts: ctx.tsData, na: r2(ctx.NA), na_maks: ctx.NAmax == null ? null : r2(ctx.NAmax),
    cakupan: cakupan == null ? null : r2(cakupan), status: `${st.status || ''}${st.durasi ? ` ${st.durasi} tahun` : ''}`.slice(0, 80),
    butir_terisi: butirTerisi, butir_total: butirTotal, skor, syarat };
}

/** Perubahan dari potret lama ke potret baru. */
export function bandingPotret(baru, lama){
  const naik = [], turun = [], terisi = [], kosong = [];
  const nomor = [...new Set([...Object.keys(baru.skor || {}), ...Object.keys(lama?.skor || {})])].sort((a, b) => a - b);
  for (const no of nomor) {
    const a = lama?.skor?.[no] ?? null, b = baru.skor?.[no] ?? null;
    if (a == null && b != null) terisi.push({ no, ke: b });
    else if (a != null && b == null) kosong.push({ no, dari: a });
    else if (a != null && b != null && Math.abs(b - a) >= 0.005) (b > a ? naik : turun).push({ no, dari: a, ke: b });
  }
  return { dNA: lama ? r2(baru.na - lama.na) : null, naik, turun, terisi, kosong };
}

const tglID = v => { const d = new Date(v); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; };
const urutWaktu = rows => [...(rows || [])].sort((a, b) => new Date(a.diambil) - new Date(b.diambil));

/** Grafik garis NA per potret (SVG), dengan garis batas status. */
export function svgTrenPotret(rows){
  const xs = urutWaktu(rows);
  if (xs.length < 2) return '';
  const W = 720, H = 240, kiri = 44, kanan = 16, atas = 14, bawah = 34;
  const lo = Math.max(0, Math.floor((Math.min(...xs.map(r => +r.na), 200) - 20) / 50) * 50);
  const y = v => atas + (H - atas - bawah) * (1 - (v - lo) / (400 - lo));
  const x = i => kiri + (W - kiri - kanan) * (i / (xs.length - 1));
  const garis = BATAS_NA.map(([v, l]) => `<line x1="${kiri}" x2="${W - kanan}" y1="${y(v)}" y2="${y(v)}" stroke="currentColor"
      stroke-opacity=".35" stroke-dasharray="4 4"/><text x="${W - kanan}" y="${y(v) - 4}" text-anchor="end" font-size="11"
      fill="currentColor" fill-opacity=".7">${esc(l)} ${v}</text>`).join('');
  const sumbu = [lo, ...[100, 200, 300, 400].filter(v => v > lo)].map(v => `<text x="${kiri - 6}" y="${y(v) + 4}" text-anchor="end"
      font-size="11" fill="currentColor" fill-opacity=".6">${v}</text>`).join('');
  const label = xs.map((r, i) => (xs.length <= 12 || i % Math.ceil(xs.length / 12) === 0 || i === xs.length - 1)
    ? `<text x="${x(i)}" y="${H - 12}" text-anchor="${i === 0 ? 'start' : i === xs.length - 1 ? 'end' : 'middle'}" font-size="11"
        fill="currentColor" fill-opacity=".7">${tglID(r.diambil).replace(/\/(\d{2})(\d{2})$/, '/$2')}</text>` : '').join('');
  const titik = xs.map((r, i) => `<circle cx="${x(i)}" cy="${y(+r.na)}" r="4" fill="var(--biru, #1f4e79)"><title>${tglID(r.diambil)}: NA ${
    f2(r.na)} (${esc(r.status || '')})${r.catatan ? ' — ' + esc(r.catatan) : ''}</title></circle>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Tren NA per potret"
    style="width:100%;height:auto;display:block;color:var(--ink, #222)">${garis}${sumbu}${label}
    <polyline fill="none" stroke="var(--biru, #1f4e79)" stroke-width="2.5" points="${xs.map((r, i) => `${x(i)},${y(+r.na)}`).join(' ')}"/>${titik}</svg>`;
}

const teksUbah = b => [
  b.naik.length ? `naik: ${b.naik.map(x => `${x.no} (${f2(x.dari)}→${f2(x.ke)})`).join(', ')}` : '',
  b.turun.length ? `turun: ${b.turun.map(x => `${x.no} (${f2(x.dari)}→${f2(x.ke)})`).join(', ')}` : '',
  b.terisi.length ? `baru terisi: ${b.terisi.map(x => `${x.no} (${f2(x.ke)})`).join(', ')}` : '',
  b.kosong.length ? `kini kosong: ${b.kosong.map(x => x.no).join(', ')}` : ''].filter(Boolean).join('; ');

/** Tabel riwayat, terbaru dulu; tiap baris dibandingkan dengan potret sebelumnya. */
export function htmlRiwayatPotret(rows, { admin = false } = {}){
  const xs = urutWaktu(rows);
  if (!xs.length) return '<p class="ket">Belum ada potret.</p>';
  const tanda = v => v === true ? 'ya' : v === false ? '<b style="color:var(--merah)">tidak</b>' : '?';
  const baris = xs.map((r, i) => ({ r, b: bandingPotret(r, xs[i - 1]) })).reverse();
  return `<div class="gulir"><table class="rin potret"><thead><tr><th>Diambil</th><th>TS</th><th>NA</th><th>Δ</th><th>Status</th>
    <th>Butir terisi</th><th>Syarat T / U3 / U5</th><th>Perubahan butir dari potret sebelumnya</th>${admin ? '<th></th>' : ''}</tr></thead>
    <tbody>${baris.map(({ r, b }) => `<tr><td>${tglID(r.diambil)}<br><small>${r.otomatis ? 'otomatis' : 'manual'}${r.catatan ? ': ' + esc(r.catatan) : ''}</small></td>
      <td>${r.ts - 1}/${r.ts}</td><td><b>${f2(r.na)}</b>${r.na_maks != null && +r.na_maks > +r.na + 0.005 ? `<br><small>maks ${f2(r.na_maks)}</small>` : ''}</td>
      <td>${b.dNA == null ? '—' : `<span style="color:${b.dNA > 0 ? 'var(--hijau)' : b.dNA < 0 ? 'var(--merah)' : 'inherit'}">${b.dNA > 0 ? '+' : ''}${f2(b.dNA)}</span>`}</td>
      <td>${esc(r.status || '—')}</td><td>${r.butir_terisi ?? '—'} / ${r.butir_total ?? '—'}${r.cakupan != null ? `<br><small>bobot ${f2(r.cakupan)}%</small>` : ''}</td>
      <td>${tanda(r.syarat?.t)} / ${tanda(r.syarat?.u3)} / ${tanda(r.syarat?.u5)}</td>
      <td><small>${b.dNA == null ? 'potret pertama' : esc(teksUbah(b)) || 'tidak ada perubahan skor'}${r.ts !== xs[xs.indexOf(r) - 1]?.ts && b.dNA != null
        ? ' <b>(TS berganti)</b>' : ''}</small></td>
      ${admin ? `<td><button type="button" class="pt-btn" data-hapus-potret="${r.id}">Hapus</button></td>` : ''}</tr>`).join('')}</tbody></table></div>`;
}
