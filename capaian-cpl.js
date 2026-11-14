// Capaian CPL di situs (pemilik 2026-11-11, pilihan 1; 56-patch-cpl-ringkasan.sql).
// Sumber: ringkasan_cpl.json dari run_cpl.py di komputer admin, angka agregat TANPA NIM.
// Ambang dari ringkasan itu (config.yaml: individu 45, kelas 60 %; keputusan 2026-10-09).
// Tampil di Monitoring (dosen terdaftar) dan tautan AMI; tidak di halaman publik.
// Bukti: butir 13 unsur 9, butir 14 unsur 5 (tinjauan rutin pencapaian CPL),
// butir 15 unsur 5 (tinjauan RPS: analisis CPL), butir 16 unsur 1.

import { htmlRadarAngkatan, htmlProgresKecil, htmlPetaPanas, CSS_GRAFIK } from './grafik-cpl.js?v=2026-11-14-cf0155';
import { htmlTrenLintas, normKur, normCpl } from './kurikulum-cpl.js?v=2026-11-14-cf0155';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = x => x == null ? '—' : `${(x * 100).toFixed(0)}%`;
const f1 = x => x == null ? '—' : (+x).toFixed(1).replace('.', ',');

/** '' bila berkas sah untuk diunggah, selain itu pesan. */
export function cekRingkasan(s, teksAsli = ''){
  if (!s || typeof s !== 'object' || Array.isArray(s)) return 'Berkas bukan ringkasan CPL (objek JSON).';
  if (s.versi !== 1) return 'Versi ringkasan tidak dikenal; jalankan run_cpl.py versi terbaru.';
  for (const k of ['kelas', 'progres', 'kumulatif', 'berkas', 'cpl']) if (!Array.isArray(s[k])) return `Bagian "${k}" tidak ada.`;
  if (!s.ambang || typeof s.ambang.individu !== 'number' || typeof s.ambang.kelas_persen !== 'number') return 'Ambang tidak ada.';
  // Penjaga: berkas yang memuat NIM (mis. laporan yang diubah tangan) ditolak.
  if (/"nim"\s*:/i.test(teksAsli || JSON.stringify(s))) return 'Berkas memuat NIM. Unggah ringkasan_cpl.json, bukan laporan per mahasiswa.';
  if (!s.kumulatif.length && !s.kelas.length) return 'Ringkasan kosong: belum ada berkas nilai yang lolos pemeriksaan.';
  return '';
}

// "2025/2026 Ganjil" -> 2026 (TS = tahun akhir tahun akademik).
export const tsDariTerm = t => { const m = String(t || '').match(/(\d{4})\s*\/\s*(\d{4})/); return m ? +m[2] : null; };
// "2025/2026 Ganjil" -> "2526Gj"; dipakai untuk kode temuan yang ringkas (<= 30 karakter).
const kodeTerm = t => { const m = String(t || '').match(/(\d{2})(\d{2})\s*\/\s*\d{2}(\d{2})\s*(\w{2})?/); return m ? `${m[2]}${m[3]}${m[4] || ''}` : 'x'; };

/** Butir tindak lanjut: CPL kumulatif BELUM dan CPL per kelas BELUM. kode = kode temuan unik. */
export function tindakLanjutCPL(s){
  const xs = [];
  (s.kumulatif || []).filter(r => r.status === 'BELUM').forEach(r => xs.push({ jenis: 'kumulatif', r,
    kode: `CPL-${r.curriculum}-${r.cpl}`.slice(0, 30),
    label: `${r.cpl} (${r.curriculum}) kumulatif: ${pct(r.share_achieved)} mahasiswa ≥ ${s.ambang.individu}, perlu ${s.ambang.kelas_persen}%` }));
  (s.kelas || []).filter(r => r.status === 'BELUM').forEach(r => xs.push({ jenis: 'kelas', r,
    kode: `CK-${kodeTerm(r.term)}-${r.course_code}-${r.class_name}-${r.cpl}`.slice(0, 30),
    label: `${r.cpl} di ${r.course_code} ${r.course_name} kelas ${r.class_name} (${r.term}): ${pct(r.share)} dari ${r.counted} mahasiswa` }));
  return xs;
}

/** Baris ami_temuan (51-patch-temuan-ami.sql) dari satu butir tindak lanjut CPL. */
export function temuanDariCPL(x, s, tsCadangan){
  const kls = x.jenis === 'kelas';
  return { siklus: kls ? `Capaian CPL ${x.r.term}` : 'Capaian CPL kumulatif', tahun_ts: (kls ? tsDariTerm(x.r.term) : null) || tsCadangan,
    kode: x.kode, standar: 'Pembelajaran (capaian CPL)', butir: 14, kategori: 'peluang',
    uraian: `${x.label}. Tinjau metode pembelajaran, asesmen, dan RPS MK terkait (butir 14 unsur 5, butir 15 unsur 5).`,
    pihak: 'P', status: 'terbuka' };
}

const WARNA = { TERCAPAI: 'var(--hijau)', BELUM: 'var(--merah)' };
const status = st => `<b style="color:${WARNA[st] || 'inherit'}">${st === 'TERCAPAI' ? 'tercapai' : st === 'BELUM' ? 'belum' : esc(st || '—')}</b>`;

/** Tampilan lengkap ringkasan (dipakai Monitoring dan tautan AMI). */
// korelasi: ref_cpl_korelasi (71-patch) untuk tren lintas kurikulum; kosong = tabel itu tidak tampil.
// cplRef: ref_cpl (kurikulum, kode, rumusan); rumusan cadangan bila ringkasan tidak membawa teks CPL (estimasi nilai akhir).
export function htmlCPL(s, { kelasTabel = 'sp', meta = '', korelasi = [], cplRef = [] } = {}){
  const ref = new Map((cplRef || []).map(c => [`${normKur(c.kurikulum)}|${normCpl(c.kode).toLowerCase()}`, c.rumusan]));
  const teks = new Map((s.kumulatif || []).map(r => [`${r.curriculum}|${r.cpl}`,
    ref.get(`${normKur(r.curriculum)}|${normCpl(r.cpl).toLowerCase()}`)]));
  (s.cpl || []).forEach(c => { if (c.text) teks.set(`${c.curriculum}|${c.cpl}`, c.text); });
  const terms = [...new Map((s.progres || []).map(r => [r.term_order, r.term])).entries()].sort((a, b) => a[0] - b[0]);
  const cpls = [...new Set((s.progres || []).map(r => `${r.curriculum}|${r.cpl}`))];
  const prog = new Map((s.progres || []).map(r => [`${r.curriculum}|${r.cpl}|${r.term_order}`, r]));
  const belumKelas = (s.kelas || []).filter(r => r.status === 'BELUM');
  const dipakai = (s.berkas || []).filter(b => b.used), ditolak = (s.berkas || []).length - dipakai.length;
  // Estimasi dari nilai akhir MK (run_cpl final_grades, pemilik 2026-11-13): ditandai, bukan templat rinci.
  const adaEst = [...(s.kumulatif || []), ...(s.progres || []), ...(s.kelas || [])].some(r => r.estimate === true);
  const est = r => r.estimate === true ? ' <small class="ket" title="dihitung dari nilai akhir MK">· estimasi</small>' : '';
  const nEst = dipakai.filter(b => b.jenis === 'nilai_akhir').length;
  return `<p class="ket">${meta}Ambang: mahasiswa mencapai CPL bila skornya ≥ ${s.ambang.individu}; CPL <b>tercapai</b> bila ≥ ${s.ambang.kelas_persen}%
      mahasiswa mencapainya. Dari ${dipakai.length} berkas kelas${ditolak ? ` (${ditolak} ditolak pemeriksaan, tidak dihitung)` : ''};
      mengulang MK memakai percobaan terbaik. Angka agregat, tanpa data per mahasiswa.${adaEst ? `<br><b>Estimasi</b>: ${nEst} kelas
      dihitung dari nilai akhir MK (semester sebelum templat CPL rinci), dibagi ke CPL menurut peta MK–CPL; ${esc(s.aturan?.estimasi || '')}.` : ''}</p>
    ${htmlRadarAngkatan(s) || htmlProgresKecil(s) ? `<h3 class="cpl-h">Grafik</h3>${htmlRadarAngkatan(s)}${htmlProgresKecil(s)}` : ''}
    <h3 class="cpl-h">Kumulatif per CPL</h3>
    ${(s.kumulatif || []).length ? `<div class="gulir"><table class="${kelasTabel}"><thead><tr><th>CPL</th><th>Rumusan</th><th>Mahasiswa</th>
      <th>Rerata skor</th><th>% ≥ ${s.ambang.individu}</th><th>Status</th></tr></thead><tbody>${s.kumulatif.map(r => `<tr><td style="white-space:nowrap"><b>${esc(r.cpl)}</b><br><small class="ket">${esc(r.curriculum)}</small>${est(r)}</td>
        <td><small>${esc(teks.get(`${r.curriculum}|${r.cpl}`) || '')}</small></td><td>${r.students}</td><td>${f1(r.mean_score)}</td>
        <td>${pct(r.share_achieved)}</td><td>${status(r.status)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="kosong">Belum ada.</p>'}
    ${terms.length > 0 ? `<h3 class="cpl-h">Progres per semester (% mahasiswa ≥ ${s.ambang.individu})</h3>
      <div class="gulir"><table class="${kelasTabel}"><thead><tr><th>CPL</th>${terms.map(([, t]) => `<th>${esc(t)}</th>`).join('')}</tr></thead><tbody>
      ${cpls.map(c => `<tr><td style="white-space:nowrap"><b>${esc(c.split('|')[1])}</b> <small class="ket">${esc(c.split('|')[0])}</small></td>${terms.map(([o]) => { const r = prog.get(`${c}|${o}`);
        return `<td>${r ? `<span style="color:${WARNA[r.status]}">${pct(r.share_achieved)}</span>${r.estimate === true ? '<sup title="estimasi dari nilai akhir MK">e</sup>' : ''}${r.change_share != null
          ? ` <small class="ket">${r.change_share > 0 ? '▲' : r.change_share < 0 ? '▼' : '='}${Math.abs(Math.round(r.change_share * 100))}</small>` : ''}` : '—'}</td>`; }).join('')}</tr>`).join('')}
      </tbody></table></div>` : ''}
    ${htmlTrenLintas(s, korelasi, { kelasTabel, individu: s.ambang.individu })}
    ${htmlPetaPanas(s)}
    <h3 class="cpl-h">Kelas dengan CPL belum tercapai (${belumKelas.length})</h3>
    ${belumKelas.length ? `<div class="gulir"><table class="${kelasTabel}"><thead><tr><th>Semester</th><th>MK</th><th>Kelas</th><th>CPL</th>
      <th>Dihitung</th><th>% ≥ ${s.ambang.individu}</th></tr></thead><tbody>${belumKelas.map(r => `<tr><td>${esc(r.term)}</td>
        <td>${esc(r.course_code)} ${esc(r.course_name)}</td><td>${esc(r.class_name)}</td><td>${esc(r.cpl)}${est(r)}</td><td>${r.counted}</td>
        <td style="color:${WARNA.BELUM}">${pct(r.share)}</td></tr>`).join('')}</tbody></table></div>`
      : '<p class="ket">Semua CPL di semua kelas tercapai.</p>'}`;
}

export const CSS_CPL = `.cpl-h{font-size:14.5px;margin:16px 0 4px;color:var(--biru)}${CSS_GRAFIK}`;
