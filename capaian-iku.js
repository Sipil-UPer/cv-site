// Ringkasan capaian IKU/IKT (pemilik 2026-11-11), dipakai Data prodi ›
// Target IKU/IKT dan Monitoring agar angkanya sama di kedua halaman.
// Arah minimal: % = capaian / target; maksimal: % = target / capaian.
// Status: tercapai, hampir (>= 80%), belum, atau capaian belum diisi.
import { hitungSumber, petunjukSumber } from './iku-otomatis.js?v=2026-11-14-64b5ca';
export { muatTambahan, denganTambahan } from './iku-otomatis.js?v=2026-11-14-64b5ca';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function nilaiCapaian(r){
  const tg = r.target == null ? null : +r.target, cp = r.capaian == null ? null : +r.capaian;
  if (tg == null || cp == null || !Number.isFinite(tg) || !Number.isFinite(cp)) return { status: 'kosong', persen: null };
  const maks = r.arah === 'maksimal';
  const tercapai = maks ? cp <= tg : cp >= tg;
  const persen = maks ? (cp > 0 ? (tg / cp) * 100 : 100) : (tg > 0 ? (cp / tg) * 100 : 100);
  return { status: tercapai ? 'tercapai' : persen >= 80 ? 'hampir' : 'belum', persen };
}

// Indikator yang belum tercapai (termasuk "hampir") perlu analisis dan rencana perbaikan
// (butir 56; 67-patch-standar-spmi.sql). r = baris dengan capaian efektif.
export function perluAnalisis(r){
  const s = nilaiCapaian(r).status;
  if (s !== 'belum' && s !== 'hampir') return false;
  return !String(r.analisis || '').trim() || !String(r.rencana_perbaikan || '').trim();
}
const ringkasAnalisis = r => [r.analisis, r.rencana_perbaikan && 'Rencana: ' + r.rencana_perbaikan].filter(Boolean).join(' · ');

// Baris dengan capaian otomatis bila bersumber (capaian tersimpan tidak diubah).
// D = data.json publik; null bila belum termuat (capaian tersimpan dipakai).
export function denganOtomatis(r, D){
  const h = r.sumber && D ? hitungSumber(r.sumber, D, r.tahun_ts) : null;
  return h ? { ...r, capaian: h.nilai, _oto: h } : r;
}

// Tahun akhir TS yang punya baris, terbaru dulu.
export const tsTersedia = baris => [...new Set((baris || []).map(r => +r.tahun_ts).filter(Boolean))].sort((a, b) => b - a);

// TS yang dibuka pertama kali (2026-11-13: target sudah diisi sampai TS mendatang, mis. 2030/2031).
// TS berjalan berganti bulan September (sama dengan tsBerjalan di mutu-data.js); bila TS berjalan
// tidak punya baris: TS terbaru yang sudah lewat, lalu TS mendatang terdekat.
export function tsAwal(tsAda, kini = new Date()){
  const xs = (tsAda || []).map(Number).filter(Boolean);
  if (!xs.length) return null;
  const berjalan = kini.getMonth() >= 8 ? kini.getFullYear() + 1 : kini.getFullYear();
  const lewat = xs.filter(t => t <= berjalan);
  return lewat.length ? Math.max(...lewat) : Math.min(...xs);
}

const kunci = r => `${r.jenis}|${String(r.nama).trim().toLowerCase()}`;
export const WARNA_STATUS = { tercapai: 'var(--hijau)', hampir: '#B8860B', belum: 'var(--merah)', kosong: 'var(--muted)' };
const TEKS_STATUS = { tercapai: 'tercapai', hampir: 'hampir (≥ 80%)', belum: 'belum', kosong: 'capaian belum diisi' };
const potong = (s, n) => s.length > n ? s.slice(0, n - 1) + '…' : s;
const angka = v => v == null ? '—' : (Math.round(+v * 100) / 100).toLocaleString('id-ID');

// Baris TS terpilih (dengan capaian otomatis) dan ringkasan per jenis.
export function capaianTS(baris, D, ts){
  const kini = (baris || []).filter(r => +r.tahun_ts === +ts).map(r => denganOtomatis(r, D))
    .sort((a, b) => (a.urutan ?? 100) - (b.urutan ?? 100));
  const lalu = new Map((baris || []).filter(r => +r.tahun_ts === +ts - 1).map(r => denganOtomatis(r, D)).map(r => [kunci(r), r]));
  const ringkas = jenis => {
    const n = kini.filter(r => r.jenis === jenis).map(nilaiCapaian);
    return { jumlah: n.length, tercapai: n.filter(x => x.status === 'tercapai').length,
             terisi: n.filter(x => x.status !== 'kosong').length };
  };
  return { kini, lalu, iku: ringkas('iku'), ikt: ringkas('ikt') };
}

// Tabel IKU lalu IKT untuk TS terpilih. kelasTabel mengikuti CSS halaman pemakai.
export function htmlCapaianIKU(baris, D, ts, { kelasTabel = 't' } = {}){
  const { kini, lalu } = capaianTS(baris, D, ts);
  const blok = jenis => {
    const xs = kini.filter(r => r.jenis === jenis);
    if (!xs.length) return `<p class="ket">Belum ada ${jenis.toUpperCase()} untuk TS ${ts - 1}/${ts}.</p>`;
    const n = xs.map(nilaiCapaian), ok = n.filter(x => x.status === 'tercapai').length, isi = n.filter(x => x.status !== 'kosong').length;
    const tanpa = xs.filter(perluAnalisis).length;
    return `<p class="ket"><b>${jenis.toUpperCase()}: ${ok} dari ${xs.length} tercapai</b>${isi < xs.length ? ` (${xs.length - isi} belum diisi capaiannya)` : ''}${
      tanpa ? `; <b style="color:${WARNA_STATUS.belum}">${tanpa} belum tercapai tanpa analisis dan rencana perbaikan</b>` : ''}.</p>
      <div class="gulir"><table class="${kelasTabel}"><thead><tr><th>Indikator</th><th>Target</th><th>Capaian</th><th>%</th><th>Status</th>
        <th>TS sebelumnya</th><th>Analisis dan rencana</th></tr></thead><tbody>${xs.map((r, i) => {
        const c = n[i], p = lalu.get(kunci(r)), s = r.satuan ? ' ' + esc(r.satuan) : '';
        return `<tr><td>${esc(r.nama)}${r.butir ? ` <small>(butir ${esc(r.butir)})</small>` : ''}${r._oto
          ? `<br><small class="ket">otomatis: ${esc(r._oto.ket)}</small>`
          : r.sumber ? `<br><small class="ket">otomatis — ${esc(petunjukSumber(r.sumber))}${r.capaian != null ? '; memakai capaian tersimpan' : ''}</small>` : ''}</td>
          <td>${r.arah === 'maksimal' ? '≤' : '≥'} ${angka(r.target)}${s}</td><td>${angka(r.capaian)}${r.capaian != null ? s : ''}</td>
          <td>${c.persen == null ? '—' : Math.round(c.persen) + '%'}</td>
          <td style="color:${WARNA_STATUS[c.status]};font-weight:600">${TEKS_STATUS[c.status]}</td>
          <td>${p ? angka(p.capaian) + (p.capaian != null ? s : '') : '—'}</td>
          <td>${perluAnalisis(r) ? `<span style="color:${WARNA_STATUS.belum};font-weight:600">belum dianalisis</span>`
            : c.status === 'belum' || c.status === 'hampir' ? `<small>${esc(potong(ringkasAnalisis(r), 140))}</small>` : '—'}</td></tr>`; }).join('')}</tbody></table></div>`;
  };
  return blok('iku') + blok('ikt');
}

export const KET_CAPAIAN = `% = capaian ÷ target (arah minimal) atau target ÷ capaian (arah maksimal). Hampir = setidaknya 80% dari target.
  Indikator bersumber otomatis dihitung dari data situs (data.json, diperbarui tiap jam), kurikulum, dan rekap EDOM;
  bila datanya belum ada, keterangan di bawah nama indikator menyebut yang perlu diisi. Lainnya dari kolom capaian.`;
