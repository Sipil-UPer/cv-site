// Grafik Capaian CPL di Monitoring (pemilik 2026-11-13): SVG tanpa pustaka luar, dari ringkasan CPL (agregat, tanpa NIM).
//   htmlRadarAngkatan  jaring laba-laba per angkatan: rerata skor CPL kumulatif tiap angkatan, lingkaran ambang individu.
//   htmlProgresKecil   satu grafik garis per CPL: % mahasiswa >= ambang per semester, garis ambang kelas.
//   htmlPetaPanas      MK x CPL: % mahasiswa >= ambang gabungan semua kelas dan semester (dari ringkasan "kelas").
// Radar per mahasiswa tidak di sini: memuat NIM, dibuat lokal oleh run_cpl.py (radar_mahasiswa.html).

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = x => x == null ? '—' : `${Math.round(x * 100)}%`;
const urutCPL = (a, b) => a.length - b.length || a.localeCompare(b);
const RADAR_MAKS = 5;   // angkatan per radar (usulan Claude 2026-11-13: lebih dari 5 poligon sulit dibaca)
// Warna seri angkatan; merah dipakai untuk ambang/status, tidak untuk seri.
export const WARNA_SERI = ['var(--biru)', 'var(--hijau)', 'var(--emas)', 'var(--ungu)',
  'var(--aksi)', 'var(--biru-3)', '#8A5A44', '#2E7D7A'];

/** SVG jaring laba-laba. axes: kode CPL; seri: [{label, nilai: {cpl: 0-100}, warna}]; ambang: lingkaran putus merah. */
export function svgRadar(axes, seri, { ambang = null, ukuran = 420 } = {}){
  const W = ukuran, H = ukuran, cx = W / 2, cy = H / 2, R = W * 0.36, n = axes.length;
  if (n < 3) return '';
  const pt = (i, v) => { const a = -Math.PI / 2 + 2 * Math.PI * i / n, r = R * Math.max(0, Math.min(100, v)) / 100;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  const poly = f => axes.map((c, i) => pt(i, f(c)).map(x => x.toFixed(1)).join(',')).join(' ');
  let g = [20, 40, 60, 80, 100].map(lv => `<polygon points="${poly(() => lv)}" fill="none" stroke="var(--line)"/>`).join('');
  axes.forEach((c, i) => { const [x, y] = pt(i, 100), [lx, ly] = pt(i, 113);
    g += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--line)"/>`
      + `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="13" font-weight="600" fill="var(--ink)">${esc(c)}</text>`; });
  [20, 40, 60, 80].forEach(lv => { const [x, y] = pt(0, lv);
    g += `<text x="${(x + 4).toFixed(1)}" y="${y.toFixed(1)}" font-size="10" fill="var(--muted)">${lv}</text>`; });
  if (ambang != null) g += `<polygon points="${poly(() => ambang)}" fill="none" stroke="var(--merah)" stroke-width="1.5" stroke-dasharray="5 4"><title>ambang ${ambang}</title></polygon>`;
  seri.forEach(s => {
    // CPL tanpa nilai (belum diukur untuk seri ini) = celah pada garis, bukan 0; isi warna hanya bila lengkap.
    const ada = axes.map(c => s.nilai[c] != null);
    if (ada.every(Boolean)) {
      g += `<polygon points="${poly(c => s.nilai[c])}" fill="${s.warna}" fill-opacity=".07" stroke="${s.warna}" stroke-width="2"><title>${esc(s.label)}</title></polygon>`;
    } else {
      let d = '';
      axes.forEach((c, i) => { const j = (i + 1) % n;
        if (ada[i] && ada[j]) { const [x1, y1] = pt(i, s.nilai[c]), [x2, y2] = pt(j, s.nilai[axes[j]]);
          d += `M${x1.toFixed(1)},${y1.toFixed(1)}L${x2.toFixed(1)},${y2.toFixed(1)}`; } });
      if (d) g += `<path d="${d}" fill="none" stroke="${s.warna}" stroke-width="2"><title>${esc(s.label)} (tanpa ${esc(axes.filter((c, i) => !ada[i]).join(', '))})</title></path>`;
    }
    axes.forEach((c, i) => { if (s.nilai[c] == null) return; const [x, y] = pt(i, s.nilai[c]);
      g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${s.warna}"><title>${esc(s.label)} · ${esc(c)}: ${(+s.nilai[c]).toFixed(1)}</title></circle>`; });
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px" role="img" aria-label="Jaring laba-laba CPL">${g}</svg>`;
}

const legenda = items => `<div class="grf-leg">${items.map(([w, t, putus]) =>
  `<span><i style="border-top:3px ${putus ? 'dashed' : 'solid'} ${w}"></i>${esc(t)}</span>`).join('')}</div>`;

/** Radar per angkatan (ringkasan.angkatan, 71+: run_cpl cohort). '' bila tidak ada. */
export function htmlRadarAngkatan(s){
  const rows = s.angkatan || [];
  if (!rows.length) return '';
  const kurs = [...new Set(rows.map(r => r.curriculum))].sort().reverse();
  return kurs.map(k => {
    const rk = rows.filter(r => r.curriculum === k);
    const axes = [...new Set(rk.map(r => r.cpl))].sort(urutCPL);
    // Lima angkatan terbaru di radar utama; yang lebih lama di radar kedua (dilipat) supaya tidak bertumpuk.
    const ang = [...new Set(rk.map(r => r.cohort))].sort();
    const baru = ang.slice(-RADAR_MAKS), lama = ang.slice(0, -RADAR_MAKS);
    const seriDari = xs => xs.map((a, i) => {
      const ra = rk.filter(r => r.cohort === a);
      const tanpa = axes.filter(c => !ra.some(r => r.cpl === c));
      return { label: `Angkatan ${a} (${Math.max(...ra.map(r => r.students))} mhs${tanpa.length ? `; belum ada CPL ${tanpa.join(', ')}` : ''})`,
        warna: WARNA_SERI[i % WARNA_SERI.length],
        nilai: Object.fromEntries(ra.map(r => [r.cpl, r.mean_score])) };
    });
    const gambar = seri => `${svgRadar(axes, seri, { ambang: s.ambang.individu })}
      ${legenda([...seri.map(x => [x.warna, x.label]), ['var(--merah)', `ambang ${s.ambang.individu}`, true]])}`;
    const rb = rk.filter(r => baru.includes(r.cohort));
    const terendah = axes.map(c => [c, Math.min(...rb.filter(r => r.cpl === c).map(r => r.mean_score))])
      .filter(x => Number.isFinite(x[1])).sort((a, b) => a[1] - b[1])[0];
    return `<div class="grf-kotak"><h4>Jaring laba-laba per angkatan · ${esc(k)}</h4>
      <p class="ket">Rerata skor CPL kumulatif mahasiswa tiap angkatan (0–100). Garis putus merah = ambang ${s.ambang.individu}.
        Angkatan dengan kurang dari 5 mahasiswa tidak ditampilkan.${terendah ? ` Terendah (angkatan ${baru[0]}–${baru[baru.length - 1]}):
        CPL ${esc(terendah[0])} (${terendah[1].toFixed(1)}).` : ''}</p>
      ${gambar(seriDari(baru))}
      ${lama.length ? `<details><summary class="ket">Angkatan lebih lama (${lama.join(', ')}): hanya sebagian MK ${esc(k)} yang mereka tempuh</summary>
        ${gambar(seriDari(lama))}</details>` : ''}</div>`;
  }).join('');
}

/** SVG garis kecil satu CPL: titik per semester, garis ambang kelas. */
export function svgGarisKecil(terms, nilai, { ambang = 0.6, lebar = 230, tinggi = 96 } = {}){
  const L = 26, Rr = 8, T = 8, B = 18, w = lebar - L - Rr, h = tinggi - T - B;
  const x = i => L + (terms.length < 2 ? w / 2 : w * i / (terms.length - 1)), y = v => T + h * (1 - v);
  const pts = terms.map((t, i) => [i, nilai[t[0]]]).filter(p => p[1] && p[1].share_achieved != null);
  let g = [0, 0.5, 1].map(v => `<line x1="${L}" x2="${L + w}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line-soft)"/>`
    + `<text x="${L - 4}" y="${y(v) + 3}" text-anchor="end" font-size="9" fill="var(--muted)">${v * 100}</text>`).join('');
  g += `<line x1="${L}" x2="${L + w}" y1="${y(ambang)}" y2="${y(ambang)}" stroke="var(--merah)" stroke-dasharray="4 3"/>`;
  if (pts.length > 1) g += `<polyline fill="none" stroke="var(--biru)" stroke-width="2" points="${pts.map(([i, r]) =>
    `${x(i).toFixed(1)},${y(r.share_achieved).toFixed(1)}`).join(' ')}"/>`;
  g += pts.map(([i, r]) => `<circle cx="${x(i).toFixed(1)}" cy="${y(r.share_achieved).toFixed(1)}" r="3.2"
    fill="${r.status === 'BELUM' ? 'var(--merah)' : 'var(--hijau)'}"><title>${esc(terms[i][1])}: ${pct(r.share_achieved)} (${r.students} mhs)</title></circle>`).join('');
  const awal = terms[0]?.[1] || '', akhir = terms[terms.length - 1]?.[1] || '';
  g += `<text x="${L}" y="${tinggi - 4}" font-size="9" fill="var(--muted)">${esc(awal.replace(/^(\d{4})\/\d{2}(\d{2})/, '$1/$2'))}</text>`
    + `<text x="${L + w}" y="${tinggi - 4}" text-anchor="end" font-size="9" fill="var(--muted)">${esc(akhir.replace(/^(\d{4})\/\d{2}(\d{2})/, '$1/$2'))}</text>`;
  return `<svg viewBox="0 0 ${lebar} ${tinggi}" width="100%" role="img" aria-label="Progres CPL">${g}</svg>`;
}

/** Grafik garis kecil semua CPL (ringkasan.progres). */
export function htmlProgresKecil(s){
  const pr = s.progres || [];
  if (!pr.length) return '';
  const terms = [...new Map(pr.map(r => [r.term_order, r.term])).entries()].sort((a, b) => a[0] - b[0]);
  if (terms.length < 2) return '';
  const amb = (s.ambang.kelas_persen || 60) / 100;
  const kurs = [...new Set(pr.map(r => r.curriculum))].sort().reverse();
  return kurs.map(k => {
    const cpls = [...new Set(pr.filter(r => r.curriculum === k).map(r => r.cpl))].sort(urutCPL);
    return `<div class="grf-kotak"><h4>Progres per semester · ${esc(k)}</h4>
      <p class="ket">% mahasiswa dengan skor ≥ ${s.ambang.individu} per semester (${esc(terms[0][1])} – ${esc(terms[terms.length - 1][1])}).
        Garis putus merah = ${s.ambang.kelas_persen}%; titik merah = belum tercapai. Arahkan kursor ke titik untuk angkanya.</p>
      <div class="grf-kecil">${cpls.map(c => {
        const nilai = Object.fromEntries(pr.filter(r => r.curriculum === k && r.cpl === c).map(r => [r.term_order, r]));
        const ada = terms.map(t => nilai[t[0]]).filter(Boolean), akhir = ada[ada.length - 1];
        const ubah = ada.length > 1 ? akhir.share_achieved - ada[0].share_achieved : null;
        return `<figure><figcaption><b>${esc(c)}</b> <span class="ket">${pct(akhir?.share_achieved)}${ubah == null ? ''
          : ` <span style="color:${ubah < 0 ? 'var(--merah)' : 'var(--hijau)'}">${ubah < 0 ? '▼' : '▲'}${Math.abs(Math.round(ubah * 100))}</span>`}</span></figcaption>
          ${svgGarisKecil(terms, nilai, { ambang: amb })}</figure>`;
      }).join('')}</div></div>`;
  }).join('');
}

const warnaSel = (v, amb) => v == null ? '' : v < amb ? 'background:var(--merah-m1);color:var(--merah);font-weight:600'
  : v < amb + 0.15 ? 'background:#FFF2CC' : v < 0.9 ? 'background:#DDEFE3' : 'background:#B9E2C8';

/** Peta panas MK x CPL (ringkasan.kelas): >= ambang / dihitung, gabungan semua kelas dan semester. */
export function petaMK(s){
  const per = new Map();
  for (const r of s.kelas || []) {
    const k = `${r.curriculum}|${r.course_code}`;
    if (!per.has(k)) per.set(k, { curriculum: r.curriculum, kode: r.course_code, nama: r.course_name, cpl: new Map(), kelas: new Set() });
    const m = per.get(k);
    m.kelas.add(`${r.term}|${r.class_name}`);
    const c = m.cpl.get(r.cpl) || { atas: 0, n: 0 };
    c.atas += r.above_threshold; c.n += r.counted;
    m.cpl.set(r.cpl, c);
  }
  return [...per.values()];
}
export function htmlPetaPanas(s){
  const mk = petaMK(s);
  if (!mk.length) return '';
  const amb = (s.ambang.kelas_persen || 60) / 100;
  const kurs = [...new Set(mk.map(m => m.curriculum))].sort().reverse();
  return kurs.map(k => {
    const rows = mk.filter(m => m.curriculum === k).sort((a, b) => a.kode.localeCompare(b.kode));
    const cpls = [...new Set(rows.flatMap(m => [...m.cpl.keys()]))].sort(urutCPL);
    const nilai = (m, c) => { const x = m.cpl.get(c); return x && x.n ? x.atas / x.n : null; };
    const terendah = rows.map(m => [m, Math.min(...[...m.cpl.keys()].map(c => nilai(m, c)))]).sort((a, b) => a[1] - b[1]).slice(0, 5);
    return `<div class="grf-kotak"><details><summary><b>Peta panas MK × CPL · ${esc(k)}</b> <span class="ket">(${rows.length} MK;
        terendah: ${terendah.map(([m, v]) => `${esc(m.nama)} ${pct(v)}`).join(', ')})</span></summary>
      <p class="ket">% mahasiswa dengan nilai ≥ ${s.ambang.individu} per MK per CPL, gabungan semua kelas dan semester. Merah = di bawah
        ${s.ambang.kelas_persen}%; kuning = ${s.ambang.kelas_persen}–${s.ambang.kelas_persen + 15}%; hijau = di atasnya. Sel kosong = MK tidak memetakan CPL itu.</p>
      <div class="gulir"><table class="grf-panas"><thead><tr><th>MK</th><th>Kelas</th>${cpls.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>
      ${rows.map(m => `<tr><td><small class="ket">${esc(m.kode)}</small> ${esc(m.nama)}</td><td>${m.kelas.size}</td>${cpls.map(c => {
        const v = nilai(m, c); return `<td style="${warnaSel(v, amb)}" title="${esc(m.nama)} · CPL ${esc(c)}">${v == null ? '' : pct(v)}</td>`; }).join('')}</tr>`).join('')}
      </tbody></table></div></details></div>`;
  }).join('');
}

export const CSS_GRAFIK = `.grf-kotak{margin:14px 0}.grf-kotak h4{margin:0 0 2px;font-size:14px;color:var(--biru)}
.grf-leg{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12.5px;color:var(--muted);margin-top:4px}
.grf-leg i{display:inline-block;width:20px;vertical-align:middle;margin-right:5px}
.grf-kecil{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px 14px}
.grf-kecil figure{margin:0;border:1px solid var(--line-soft);border-radius:6px;padding:4px 6px 0}
.grf-kecil figcaption{font-size:13px}
table.grf-panas{border-collapse:collapse;font-size:12.5px}table.grf-panas th,table.grf-panas td{border:1px solid var(--line-soft);padding:3px 6px;text-align:center}
table.grf-panas td:first-child{text-align:left;white-space:nowrap}`;
