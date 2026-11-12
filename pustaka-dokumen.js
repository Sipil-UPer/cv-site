/* =====================================================================
   pustaka-dokumen.js — pustaka dokumen prodi (tabel `dokumen`,
   13-patch-dokumen.sql; tautan dari bukti baris: 29-patch-pustaka-dokumen.sql).
   Keputusan pemilik 2026-11-04: satu berkas tersimpan SATU kali, boleh
   diklaim sebagai bukti di banyak tempat. Kunci dokumen = jenis + tahun +
   judul (judul kosong untuk jenis tunggal); unggah dengan kunci yang sama
   MENGGANTI berkasnya (versi lama ke _arsip Drive), tidak menambah salinan.
   Dipakai data-prodi.html (tab Dokumen dan bukti baris) dan input-butir.html.
   ===================================================================== */
import { JENIS_DOKUMEN, infoJenis } from './rencana-bukti.js?v=2026-11-12-f0b3a0';
import { tautanBerkas, temuanPakai } from './tautan-privat.js?v=2026-11-12-f0b3a0';
import { periksaBerkas, kolomSidik, teksTemuan } from './sidik-berkas.js?v=2026-11-12-f0b3a0';

const esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Kunci pustaka sebuah dokumen: judul hanya untuk jenis banyak.
export const kunciDokumen = (jenis, tahun, judul) =>
  ({ jenis, tahun: +tahun, judul: infoJenis(jenis).tunggal ? '' : String(judul || '').trim() });

// Dokumen pustaka dengan kunci yang sama (unggahan akan menggantinya), atau null.
export function cariDokumen(dok, jenis, tahun, judul){
  const k = kunciDokumen(jenis, tahun, judul);
  return (dok || []).find(d => d.jenis === k.jenis && +d.tahun === k.tahun && (d.judul || '') === k.judul) || null;
}

export const labelDokumen = d => d
  ? `${infoJenis(d.jenis).nama}${d.judul ? ' — ' + d.judul : ''}${d.nomor ? ', No. ' + d.nomor : ''} (${d.tahun})` : '';

// Versi pustaka sebuah jenis untuk TS: tahun terbaru <= ts, atau terbaru bila belum ada.
export const STATUS_PS = { unggul: 'Terakreditasi Unggul', a: 'Terakreditasi A', baik_sekali: 'Terakreditasi Baik Sekali',
  b: 'Terakreditasi B', baik: 'Terakreditasi Baik', c: 'Terakreditasi C', minimum: 'Terakreditasi Minimum',
  tidak_terakreditasi: 'Tidak Terakreditasi' };
export const tglTeks = iso => (String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/) || []).slice(1).reverse().join('/');

// Daftar prodi di UPPS untuk LKPS (lembar PS) dan LED (Identitas Pengusul), urut
// Data prodi. Prodi yang diakreditasi selalu tampil walau tab Prodi di UPPS belum
// diisi (pemilik 2026-11-05): SK dari pustaka bila ada; peringkat tidak ditebak.
export function daftarProdi(X, namaProdi, ts){
  const out = (X.prodiUpps || []).slice()
    .sort((a, b) => ((a.urutan ?? 100) - (b.urutan ?? 100)) || String(a.nama_prodi).localeCompare(String(b.nama_prodi)));
  if (!out.some(x => x.diakreditasi) && namaProdi) {
    const sk = versiUntukTS(X.dokumen, 'sk_akreditasi_prodi', ts);
    out.unshift({ jenis_program: 'Sarjana', nama_prodi: namaProdi, diakreditasi: true,
                  nomor_sk: sk?.nomor || sk?.judul, tanggal_sk: sk?.tanggal });
  }
  const mhsTS = (X.mhs || []).find(x => +String(x.tahun_akademik || '').slice(5) === ts);
  return out.map(x => ({ ...x, mahasiswa: x.mahasiswa_ts ?? (x.diakreditasi ? mhsTS?.jumlah_mahasiswa_aktif : null) }));
}

export function versiUntukTS(dok, jenis, ts){
  const xs = (dok || []).filter(d => d.jenis === jenis).sort((a, b) => b.tahun - a.tahun);
  return xs.find(d => +d.tahun <= ts) || xs[0] || null;
}

// <option> pustaka: jenis yang disarankan tab di atas, lalu sisanya; tiap
// jenis terbaru dulu.
export function opsiPustaka(dok, saran = []){
  const urutJenis = id => { const s = saran.indexOf(id); if (s >= 0) return s;
    const i = JENIS_DOKUMEN.findIndex(j => j.id === id); return 100 + (i < 0 ? 999 : i); };
  const xs = (dok || []).slice().sort((a, b) => urutJenis(a.jenis) - urutJenis(b.jenis) || b.tahun - a.tahun
    || String(a.judul).localeCompare(String(b.judul)));
  const atas = xs.filter(d => saran.includes(d.jenis)), lain = xs.filter(d => !saran.includes(d.jenis));
  const opt = d => `<option value="${esc(d.id)}">${esc(labelDokumen(d))}</option>`;
  return `<option value="">— pilih dokumen dari pustaka —</option>` +
    (atas.length ? `<optgroup label="Disarankan untuk tab ini">${atas.map(opt).join('')}</optgroup>` : '') +
    (lain.length ? `<optgroup label="${atas.length ? 'Dokumen lain' : 'Semua dokumen'}">${lain.map(opt).join('')}</optgroup>` : '');
}

// <option> jenis dokumen untuk unggah: saran tab dulu.
export function opsiJenis(saran = [], pilih){
  const s = saran.map(id => infoJenis(id));
  const lain = JENIS_DOKUMEN.filter(j => !saran.includes(j.id));
  const opt = j => `<option value="${esc(j.id)}"${j.id === pilih ? ' selected' : ''}>${esc(j.nama)}${j.privat ? ' (privat)' : ''}${j.tunggal ? '' : ' (banyak)'}</option>`;
  return (s.length ? `<optgroup label="Disarankan">${s.map(opt).join('')}</optgroup>` : '') +
    `<optgroup label="Jenis lain">${lain.map(opt).join('')}</optgroup>`;
}

export const keBase64 = f => new Promise((ok, gagal) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result).split(',')[1] || '');
  r.onerror = () => gagal(new Error('Berkas tidak bisa dibaca: ' + f.name));
  r.readAsDataURL(f);
});

// Unggah berkas ke Drive (Apps Script kind 'dokumen') lalu upsert baris
// pustaka pada (jenis, tahun, judul). Berkas pertama mengganti (mengarsipkan
// versi lama), berkas berikutnya ditambahkan ke folder yang sama.
// Mengembalikan baris `dokumen` yang tersimpan.
//
// Sidik berkas (31-patch-sidik-berkas.sql): berkas yang sama persis tidak
// diunggah ulang. Satu berkas yang sudah ada di pustaka -> dokumen itu
// dikembalikan apa adanya dengan `_ada: 'pustaka'` (pemanggil menautkannya);
// sudah ada sebagai bukti lain -> dicatat di pustaka dengan tautan yang sudah
// ada, `_ada: 'bukti'`. Beberapa berkas sekaligus dengan salah satunya sudah
// tersimpan -> ditolak dengan daftar berkasnya.
export async function unggahKePustaka(sb, UNGGAH, { jenis, tahun, judul, berkas, oleh, nomor, tanggal, progres = () => {} }){
  const k = kunciDokumen(jenis, tahun, judul);
  if (!(k.tahun >= 1990 && k.tahun <= 2100)) throw new Error('Isi tahun dokumen (4 angka).');
  if (!infoJenis(jenis).tunggal && !k.judul) throw new Error('Jenis ini banyak per tahun: isi judul/nomor dokumen.');
  if (!berkas.length) throw new Error('Pilih berkas dulu.');
  const ditolak = berkas.filter(f => {
    const e = ((f.name.match(/\.([^.]+)$/) || [])[1] || '').toLowerCase();
    return !UNGGAH.ext.includes(e) || (UNGGAH.maxMb && f.size > UNGGAH.maxMb * 1024 * 1024);
  });
  if (ditolak.length) throw new Error(`Ditolak: ${ditolak.map(f => f.name).join(', ')}. ` +
    `Diterima: ${UNGGAH.ext.join(', ')}, maksimal ${UNGGAH.maxMb} MB.`);
  const { data: { session } } = await sb.auth.getSession();
  if (!session) throw new Error('Sesi login habis. Muat ulang halaman lalu masuk lagi.');
  const sidik = [];
  for (const f of berkas) { progres(`Memeriksa ${f.name}…`); sidik.push(await periksaBerkas(sb, f)); }
  const ada = sidik.map((s, i) => temuanPakai(s.temuan, infoJenis(jenis).privat) ? { f: berkas[i], t: s.temuan } : null).filter(Boolean);
  if (ada.length && berkas.length > 1)
    throw new Error(`Tidak diunggah: berkas yang sama ${ada.map(x => `${x.f.name} ${teksTemuan(x.t)}`).join('; ')}. ` +
                    'Tautkan dokumen yang sudah ada, atau unggah berkas lainnya saja.');
  let url = null, folderUrl = null, _ada = null;
  if (ada.length && ada[0].t.sumber === 'dokumen') {
    const { data, error } = await sb.from('dokumen').select('*').eq('id', ada[0].t.dokumen_id).single();
    if (error) throw new Error('Berkas ini sudah ada di pustaka, tetapi catatannya gagal dibaca: ' + error.message);
    return { ...data, _ada: 'pustaka' };
  }
  if (ada.length) { url = ada[0].t.url; _ada = 'bukti'; }
  for (let i = 0; !_ada && i < berkas.length; i++) {
    const f = berkas[i];
    progres(`Mengunggah ${i + 1} dari ${berkas.length}: ${f.name}…`);
    const res = await fetch(UNGGAH.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ token: session.access_token, kind: 'dokumen', jenis: k.jenis, tahun: String(k.tahun),
        judul: k.judul, mode: i > 0 ? 'tambah' : 'ganti', filename: f.name, data: await keBase64(f) }) });
    const out = await res.json();
    if (!out.ok) {
      if (/tidak dikenal|Pilih tahun|Id dokumen/.test(out.error || ''))
        throw new Error('Apps Script di akun prodi belum diperbarui untuk dokumen. ' +
                        'Lihat apps-script/README.md, bagian "Memperbarui kode".');
      throw new Error(`${i} dari ${berkas.length} berkas terunggah. ${out.error || 'Unggah gagal.'}`);
    }
    url = url || tautanBerkas(out); folderUrl = out.folderUrl || folderUrl;
  }
  const { data, error } = await sb.from('dokumen').upsert({
    ...k, url, folder_url: folderUrl, nama_berkas: berkas.map(f => f.name).join('; ').slice(0, 500),
    ...kolomSidik(sidik[0].sha256),
    diunggah_oleh: oleh || null, diperbarui: new Date().toISOString(),
    // Nomor/tanggal dokumen (30-patch-spmi.sql): hanya dikirim bila diisi.
    ...(nomor ? { nomor: String(nomor).trim() } : {}), ...(tanggal ? { tanggal } : {}),
  }, { onConflict: 'jenis,tahun,judul' }).select().single();
  if (error) throw new Error('Berkas terunggah, tetapi catatan pustaka gagal disimpan: ' + error.message);
  return _ada ? { ...data, _ada } : data;
}
