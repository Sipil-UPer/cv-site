// Cari calon pembimbing Tugas Akhir (pemilik 2026-11-16): mahasiswa menulis judul atau topik TA, lalu
// dosen tetap diurutkan menurut kecocokan dengan topik keahlian baku (bobot terbesar), bidang keahlian,
// judul dan topik publikasi, serta judul penelitian/PkM-nya, semuanya dari data.json. Judul hanya diolah
// di peramban; tidak dikirim atau disimpan. Saran saja: penetapan pembimbing tetap oleh program studi.
//
// Jembatan bahasa: kata dalam judul yang cocok dengan nama/sinonim/padanan sebuah topik baku
// (keahlian_baku.topik, 61-patch-keahlian-baku.sql) menambahkan seluruh padanannya (Indonesia dan
// Inggris) ke pencarian, jadi "genangan" juga menemukan publikasi tentang "flood".

// Kata umum judul TA dan artikel (Indonesia dan Inggris) yang tidak membedakan keahlian.
const UMUM = new Set(`yang dan atau di ke dari pada untuk dengan dalam terhadap sebagai oleh akibat antara serta
  ini itu adalah tersebut secara studi kasus analisis analisa pengaruh evaluasi perencanaan perancangan desain
  kajian tinjauan penerapan penggunaan menggunakan berbasis metode model pemodelan sistem pendekatan alternatif
  optimasi peningkatan perbandingan identifikasi pengembangan kota kabupaten provinsi jalan raya daerah wilayah
  kawasan proyek pembangunan teknik sipil indonesia baru lama tahun bagi hasil nilai jenis tinggi rendah
  the of and in on for to a an with using use based study case analysis evaluation assessment design approach
  method methods model modeling modelling system systems effect effects impact its from by at as into via
  between toward towards new review application applications performance indonesia jakarta
  control management manajemen engineering rekayasa technology teknologi`.split(/\s+/).filter(Boolean));

const BOBOT = { topik: 4, bidang: 1.5, publikasi: 1, kegiatan: 1 };
const SAMBUNG = 0.8;     // bobot kata tambahan dari padanan topik baku yang cocok (terjemahan langsung)
const BONUS_TOPIK = 12;  // dosen yang memilih topik baku yang dikenali dari judul
const AMBANG = 0.12;     // hasil di bawah 12 % skor tertinggi tidak ditampilkan (8 dari 10 dosen belum memilih topik)

export const rapikan = s => ' ' + String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, ' ').trim() + ' ';

// Kata bermakna: >= 3 huruf, bukan kata umum, bentuk jamak Inggris sederhana disatukan (floods -> flood).
export function kata(teks){
  return rapikan(teks).trim().split(' ').filter(w => w.length >= 3 && !UMUM.has(w) && !/^\d+$/.test(w))
    .map(w => w.length > 4 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);
}

const frasaTopik = t => [t.nama, t.nama_en, ...(t.sinonim || []), ...(t.padanan || [])].filter(Boolean);

// Topik baku yang disebut judul: salah satu frasanya muncul utuh di judul.
export function topikDisebut(judul, baku){
  const j = rapikan(judul);
  return (baku?.topik || []).filter(t => frasaTopik(t).some(f => { const r = rapikan(f); return r.trim().length >= 3 && j.includes(r); }));
}

// Model sekali per halaman: tiap dosen tetap (punya slug) dengan sumber kecocokannya.
export function siapkan(D){
  const baku = D.keahlian_baku || { bidang: [], topik: [] };
  const topikKode = Object.fromEntries((baku.topik || []).map(t => [t.kode, t]));
  const milik = (xs, slug) => (xs || []).filter(x => (x.penulis || []).some(p => p.slug === slug));
  const dosen = (D.dosen || []).filter(d => d.slug).map(d => {
    const sumber = [];
    for (const k of d.topik_keahlian || []) {
      const t = topikKode[k];
      if (t) sumber.push({ jenis: 'topik', label: t.nama, kode: k, kata: new Set(kata(frasaTopik(t).join(' '))) });
    }
    if (d.bidang_keahlian) sumber.push({ jenis: 'bidang', label: d.bidang_keahlian, kata: new Set(kata(d.bidang_keahlian)) });
    for (const p of milik(D.publikasi, d.slug))
      sumber.push({ jenis: 'publikasi', label: p.judul, tahun: p.tahun,
                    kata: new Set(kata([p.judul, ...(p.topik || []).map(x => x.t)].join(' '))) });
    for (const p of milik(D.kegiatan, d.slug))
      sumber.push({ jenis: 'kegiatan', label: p.judul, tahun: p.tahun, kategori: p.kategori, kata: new Set(kata(p.judul)) });
    return { slug: d.slug, nama: d.nama, bidang: d.bidang_keahlian || '', topik: new Set(d.topik_keahlian || []), sumber };
  });
  // Kata yang muncul di banyak sumber kurang membedakan (bobot idf).
  const df = new Map();
  let n = 0;
  dosen.forEach(d => d.sumber.forEach(s => { n++; s.kata.forEach(w => df.set(w, (df.get(w) || 0) + 1)); }));
  const idf = w => Math.log(1 + n / (df.get(w) || 1));
  return { dosen, baku, idf };
}

// Dosen terurut menurut skor (> 0), paling banyak `batas`, beserta alasan: topik yang cocok dan
// sumber dengan kata yang sama terbanyak (paling banyak 3).
export function cariPembimbing(judul, model, batas = 5){
  const disebut = topikDisebut(judul, model.baku);
  const q = new Map(kata(judul).map(w => [w, 1]));
  disebut.forEach(t => kata(frasaTopik(t).join(' ')).forEach(w => { if (!q.has(w)) q.set(w, SAMBUNG); }));
  if (!q.size) return { topik: disebut, hasil: [] };
  const kodeDisebut = new Set(disebut.map(t => t.kode));
  const hasil = model.dosen.map(d => {
    const nilai = d.sumber.map(s => {
      // Topik keahlian dosen: yang dikenali dari judul dihitung lewat BONUS_TOPIK; topik lain hanya oleh kata
      // asli judul, bukan kata tambahan padanan (padanan "beton" tidak membuat topik perkerasan ikut cocok).
      if (s.jenis === 'topik' && kodeDisebut.has(s.kode)) return null;
      const sama = [...q.keys()].filter(w => s.kata.has(w) && (s.jenis !== 'topik' || q.get(w) === 1));
      return { s, sama, skor: BOBOT[s.jenis] * sama.reduce((a, w) => a + q.get(w) * model.idf(w), 0) };
    }).filter(x => x && x.skor > 0).sort((a, b) => b.skor - a.skor);
    const cocokTopik = disebut.filter(t => d.topik.has(t.kode));
    // Lima sumber terkuat saja: dosen dengan banyak publikasi tidak menang hanya karena jumlah.
    const skor = nilai.slice(0, 5).reduce((a, x) => a + x.skor, 0) + BONUS_TOPIK * cocokTopik.length;
    const alasan = [...cocokTopik.map(t => ({ jenis: 'topik', label: t.nama })),
                    ...nilai.slice(0, 3).map(x => ({ jenis: x.s.jenis, label: x.s.label, tahun: x.s.tahun,
                                                     kategori: x.s.kategori }))].slice(0, 4);
    return { slug: d.slug, nama: d.nama, bidang: d.bidang, skor, alasan };
  }).filter(x => x.skor > 0).sort((a, b) => b.skor - a.skor || a.nama.localeCompare(b.nama));
  // Kecocokan yang jauh di bawah yang terbaik tidak ditampilkan sebagai saran.
  const ambang = hasil.length ? AMBANG * hasil[0].skor : 0;
  return { topik: disebut, hasil: hasil.filter(x => x.skor >= ambang).slice(0, batas) };
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const JENIS = { topik: 'Topik keahlian', bidang: 'Bidang', publikasi: 'Publikasi', kegiatan: 'Penelitian/PkM' };

// Pasang formulir dan hasil di elemen `el`; D = data.json.
export function pasangPembimbing(el, D){
  const model = siapkan(D);
  if (!model.dosen.length) { el.closest('section')?.setAttribute('hidden', ''); return; }
  el.innerHTML = `<form class="form" id="pbForm">
      <div class="fld"><label for="pbJudul">Judul atau topik Tugas Akhir</label>
        <textarea id="pbJudul" rows="2" maxlength="400" placeholder="Contoh: Analisis genangan banjir di kawasan perumahan dengan HEC-RAS 2D"></textarea></div>
      <button type="submit" class="kirim">Cari calon pembimbing</button>
    </form><div id="pbHasil" aria-live="polite"></div>`;
  const tampil = () => {
    const judul = el.querySelector('#pbJudul').value.trim(), out = el.querySelector('#pbHasil');
    if (kata(judul).length < 1) { out.innerHTML = '<p class="ket">Tulis judul atau beberapa kata kunci topik TA.</p>'; return; }
    const { topik, hasil } = cariPembimbing(judul, model);
    if (!hasil.length) {
      out.innerHTML = `<p class="ket">Belum ada dosen yang keahlian atau karyanya cocok dengan kata-kata itu. Coba kata kunci lain
        (misalnya bahan, metode, atau objek penelitian), atau lihat <a href="keahlian.html">kepakaran dosen</a>.</p>`;
      return;
    }
    const alasan = a => a.jenis === 'topik' || a.jenis === 'bidang'
      ? `<li><b>${JENIS[a.jenis]}:</b> ${esc(a.label)}</li>`
      : `<li><b>${a.jenis === 'kegiatan' ? (a.kategori === 'pkm' ? 'Pengabdian' : 'Penelitian') : 'Publikasi'}${a.tahun ? ' ' + esc(a.tahun) : ''}:</b> ${esc(a.label)}</li>`;
    out.innerHTML = (topik.length ? `<p class="ket">Topik yang dikenali: ${topik.map(t => esc(t.nama)).join(', ')}.</p>` : '')
      + `<ol class="pb-daftar">${hasil.map(h => `<li><div class="pb-nama"><a href="dosen/${esc(h.slug)}.html">${esc(h.nama)}</a>
          ${h.bidang ? `<span>${esc(h.bidang)}</span>` : ''}</div><ul>${h.alasan.map(alasan).join('')}</ul></li>`).join('')}</ol>
        <p class="ket">Urutan dihitung dari topik keahlian, publikasi, serta penelitian dan pengabdian yang tercatat di program studi.
          Diskusikan judul dengan calon pembimbing; penetapan pembimbing tetap oleh program studi.</p>`;
  };
  el.querySelector('#pbForm').addEventListener('submit', ev => { ev.preventDefault(); tampil(); });
}
