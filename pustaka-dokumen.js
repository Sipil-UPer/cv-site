/* =====================================================================
   pustaka-dokumen.js — pustaka dokumen prodi (tabel `dokumen`,
   13-patch-dokumen.sql; tautan dari bukti baris: 29-patch-pustaka-dokumen.sql).
   Keputusan pemilik 2026-11-04: satu berkas tersimpan SATU kali, boleh
   diklaim sebagai bukti di banyak tempat. Kunci dokumen = jenis + tahun +
   judul (judul kosong untuk jenis tunggal); unggah dengan kunci yang sama
   MENGGANTI berkasnya (versi lama ke _arsip Drive), tidak menambah salinan.
   Dipakai data-prodi.html (tab Dokumen dan bukti baris) dan input-butir.html.
   ===================================================================== */
import { JENIS_DOKUMEN, infoJenis } from './rencana-bukti.js?v=2026-11-04-4dd821';

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
  ? `${infoJenis(d.jenis).nama}${d.judul ? ' — ' + d.judul : ''} (${d.tahun})` : '';

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
  const opt = j => `<option value="${esc(j.id)}"${j.id === pilih ? ' selected' : ''}>${esc(j.nama)}${j.tunggal ? '' : ' (banyak)'}</option>`;
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
export async function unggahKePustaka(sb, UNGGAH, { jenis, tahun, judul, berkas, oleh, progres = () => {} }){
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
  let url = null, folderUrl = null;
  for (let i = 0; i < berkas.length; i++) {
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
    url = url || out.url; folderUrl = out.folderUrl || folderUrl;
  }
  const { data, error } = await sb.from('dokumen').upsert({
    ...k, url, folder_url: folderUrl, nama_berkas: berkas.map(f => f.name).join('; ').slice(0, 500),
    diunggah_oleh: oleh || null, diperbarui: new Date().toISOString(),
  }, { onConflict: 'jenis,tahun,judul' }).select().single();
  if (error) throw new Error('Berkas terunggah, tetapi catatan pustaka gagal disimpan: ' + error.message);
  return data;
}
