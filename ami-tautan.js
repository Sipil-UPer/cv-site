// Tautan Monitoring untuk bukti AMI (pemilik 2026-11-11; 50-patch-tautan-ami.sql).
// Admin membuat tautan monitoring.html?ami=<token> dengan periode yang sedang
// dipilih di Monitoring; siapa pun yang memegang tautan bisa membukanya tanpa
// login sampai tanggal berlaku (bawaan 2 bulan). Bisa diperpanjang atau dicabut.

const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const MASA_BAWAAN = 2;   // bulan (pemilik 2026-11-11)

// Tambah n bulan; tanggal 31 Jan + 1 bulan menjadi akhir Februari, bukan Maret.
export function tambahBulan(d, n){
  const x = new Date(d), tgl = x.getDate();
  x.setDate(1); x.setMonth(x.getMonth() + n);
  const akhir = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate();
  x.setDate(Math.min(tgl, akhir));
  return x;
}

export const tglID = d => {
  const x = new Date(d);
  return `${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth() + 1).padStart(2, '0')}/${x.getFullYear()}`;
};

export const urlAMI = (token, dasar) => new URL('monitoring.html?ami=' + encodeURIComponent(token), dasar).href;

export function statusAMI(r, kini = new Date()){
  if (r.dicabut) return 'dicabut';
  return new Date(r.sampai) > kini ? 'berlaku' : 'kedaluwarsa';
}

// Teks periode yang dikunci, mis. "3 TS terakhir (2023/2024–2025/2026)".
export function labelPeriode({ mode, periode, akhir }){
  const ts = mode === 'ts';
  const lbl = t => ts ? `${t - 1}/${t}` : String(t);
  if (periode === 'semua') return ts ? 'Semua TS' : 'Semua tahun';
  if (periode === 'ts3') return (ts ? '3 TS terakhir' : '3 tahun terakhir') + (akhir ? ` (${lbl(akhir - 2)}–${lbl(akhir)})` : '');
  return ts ? `TS ${lbl(+periode)}` : `Tahun ${periode}`;
}

const WARNA = { berlaku: 'var(--hijau)', kedaluwarsa: 'var(--muted)', dicabut: 'var(--merah)' };

// Panel admin. keadaan() -> { mode, periode, akhir, ts_iku } yang sedang tampil.
export function pasangAMIAdmin(sb, saya, wadah, keadaan){
  const opsiMasa = [1, 2, 3, 6].map(n => `<option value="${n}"${n === MASA_BAWAAN ? ' selected' : ''}>${n} bulan</option>`).join('');
  wadah.innerHTML = `<div class="kartu ami">
    <h3>Tautan Monitoring untuk bukti AMI</h3>
    <p class="ket">Tautan tanpa login untuk auditor Audit Mutu Internal. Angka mengikuti data terbaru,
      tetapi periode dikunci ke pilihan yang sedang aktif di atas: <b id="ami_kunci"></b>.
      Salin tautannya lalu tempel sebagai bukti (tautan luar) pada dokumen atau butir AMI.</p>
    <div class="ami-f"><input id="ami_judul" type="text" maxlength="120" value="AMI ${new Date().getFullYear()}" aria-label="Judul tautan">
      <label>Berlaku <select id="ami_masa">${opsiMasa}</select></label>
      <button type="button" id="ami_buat">Buat tautan</button><span class="msg" id="ami_msg"></span></div>
    <div id="ami_daftar" class="ket">Memuat…</div></div>`;
  const $ = id => wadah.querySelector('#' + id);
  const msg = t => { $('ami_msg').textContent = t; };
  const segarkan = () => { const k = keadaan(); $('ami_kunci').textContent = labelPeriode(k) + (k.ts_iku ? `; IKU/IKT TS ${k.ts_iku - 1}/${k.ts_iku}` : ''); };
  segarkan();

  async function muat(){
    const { data, error } = await sb.from('tautan_ami').select('*').order('dibuat_pada', { ascending: false });
    const box = $('ami_daftar');
    if (error) { box.textContent = /does not exist|schema cache/i.test(error.message)
      ? 'Tabel tautan AMI belum ada: jalankan supabase/50-patch-tautan-ami.sql.' : 'Gagal memuat: ' + error.message; return; }
    if (!data.length) { box.textContent = 'Belum ada tautan AMI.'; return; }
    box.className = '';
    box.innerHTML = `<div class="gulir"><table class="sp"><thead><tr><th>Judul</th><th>Periode dikunci</th>
      <th>Berlaku sampai</th><th>Status</th><th></th></tr></thead><tbody>${data.map(r => {
        const s = statusAMI(r), u = urlAMI(r.token, location.href);
        return `<tr><td>${esc(r.judul)}<br><small class="ket">dibuat ${tglID(r.dibuat_pada)}${r.oleh ? ' oleh ' + esc(r.oleh) : ''}</small></td>
          <td>${esc(labelPeriode(r))}${r.ts_iku ? `<br><small class="ket">IKU/IKT TS ${r.ts_iku - 1}/${r.ts_iku}</small>` : ''}</td>
          <td>${tglID(r.sampai)}</td><td style="color:${WARNA[s]};font-weight:600">${s}</td>
          <td class="ami-aksi">${s === 'dicabut' ? '' : `<button type="button" data-salin="${esc(u)}">Salin</button>
            <a href="${esc(u)}" target="_blank" rel="noopener">Buka</a>
            <button type="button" data-panjang="${r.id}" data-sampai="${esc(r.sampai)}">Perpanjang</button>
            <button type="button" data-cabut="${r.id}">Cabut</button>`}</td></tr>`;
      }).join('')}</tbody></table></div>
      <p class="kaki">Perpanjang menambah masa pada pilihan "Berlaku" dari tanggal berakhir (atau dari hari ini bila sudah lewat); tautannya tidak berubah.
      Cabut menutup tautan seketika dan tidak bisa dibuka lagi.</p>`;
    box.querySelectorAll('[data-salin]').forEach(b => b.onclick = async () => {
      try { await navigator.clipboard.writeText(b.dataset.salin); b.textContent = 'Tersalin'; }
      catch { prompt('Salin tautan ini:', b.dataset.salin); }
    });
    box.querySelectorAll('[data-panjang]').forEach(b => b.onclick = async () => {
      const n = +$('ami_masa').value || MASA_BAWAAN;
      const dari = new Date(Math.max(Date.now(), new Date(b.dataset.sampai).getTime()));
      const sampai = tambahBulan(dari, n);
      if (!confirm(`Perpanjang sampai ${tglID(sampai)}?`)) return;
      const { error: e } = await sb.from('tautan_ami').update({ sampai: sampai.toISOString() }).eq('id', +b.dataset.panjang);
      if (e) alert('Gagal: ' + e.message); else muat();
    });
    box.querySelectorAll('[data-cabut]').forEach(b => b.onclick = async () => {
      if (!confirm('Cabut tautan ini? Auditor tidak bisa membukanya lagi.')) return;
      const { error: e } = await sb.from('tautan_ami').update({ dicabut: true }).eq('id', +b.dataset.cabut);
      if (e) alert('Gagal: ' + e.message); else muat();
    });
  }

  $('ami_buat').onclick = async () => {
    const judul = $('ami_judul').value.trim();
    if (judul.length < 3) return msg('Judul minimal 3 karakter.');
    const k = keadaan(), n = +$('ami_masa').value || MASA_BAWAAN;
    $('ami_buat').disabled = true; msg('Menyimpan…');
    const { error } = await sb.from('tautan_ami').insert({ judul, mode: k.mode, periode: String(k.periode),
      akhir: k.akhir || null, ts_iku: k.ts_iku || null, sampai: tambahBulan(new Date(), n).toISOString(),
      oleh: saya?.nama || saya?.email || null });
    $('ami_buat').disabled = false;
    if (error) return msg('Gagal: ' + error.message);
    msg('Tautan dibuat.'); muat();
  };
  muat();
  return { segarkan };
}
