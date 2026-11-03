/* =====================================================================
   PERBARUI SEKARANG — admin memicu build situs di GitHub Actions
   (fase 2, keputusan pemilik 2026-11-03). Dipakai skor.html dan
   data-prodi.html, khusus peran admin.

   Situs dibangun otomatis tiap jam (.github/workflows/bangun-situs.yml di
   cv-data). Tombol ini memicu build segera lewat Apps Script (kind
   'bangun'; status lewat 'status_bangun'), yang memegang token GitHub;
   halaman tidak pernah melihat token itu.

   Pemakaian: pasangPerbarui(sb, elemenWadah)
   ===================================================================== */

const JEDA_MS = 15000;          // selang cek status saat build berjalan
const BATAS_MS = 15 * 60000;    // berhenti memantau setelah 15 menit (= timeout workflow)

async function minta(sb, kind){
  const U = String(window.UPLOAD_URL || '').trim();
  if (!U) throw new Error('UPLOAD_URL belum diisi di config.js.');
  const { data: { session } } = await sb.auth.getSession();
  if (!session) throw new Error('Sesi login habis. Muat ulang halaman lalu masuk lagi.');
  // text/plain: tanpa preflight CORS (tidak dilayani Apps Script).
  const res = await fetch(U, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ token: session.access_token, kind }) });
  const out = await res.json();
  if (!out.ok) {
    if (/Jenis unggahan tidak dikenal/.test(out.error || ''))
      throw new Error('Apps Script di akun prodi belum diperbarui untuk tombol ini.');
    throw new Error(out.error || 'Permintaan gagal.');
  }
  return out;
}

const jam = iso => iso ? new Date(iso).toLocaleString('id-ID',
  { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

function teksStatus(run){
  if (!run) return 'Belum ada riwayat pembaruan.';
  if (run.status === 'queued' || run.status === 'waiting' || run.status === 'pending')
    return 'Pembaruan menunggu giliran…';
  if (run.status !== 'completed') return `Sedang memperbarui (mulai ${jam(run.mulai)})…`;
  if (run.conclusion === 'success')
    return `Pembaruan terakhir berhasil, ${jam(run.selesai)}. Situs terbit 1–2 menit kemudian.`;
  if (run.conclusion === 'cancelled') return `Pembaruan terakhir dibatalkan, ${jam(run.selesai)}.`;
  return `Pembaruan terakhir GAGAL, ${jam(run.selesai)}. Hubungi pengelola situs.`;
}

export function pasangPerbarui(sb, wadah){
  if (!wadah) return;
  wadah.innerHTML = `<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:12px">
    <button type="button" id="perbarui-tombol" style="font:inherit;font-size:12px;letter-spacing:.06em;
      text-transform:uppercase;cursor:pointer;color:#14212E;background:#fff;border:1px solid #fff;
      padding:8px 14px;border-radius:2px">&#8635;&nbsp; Perbarui sekarang</button>
    <span id="perbarui-status" style="font-size:12.5px;opacity:.9">Memeriksa status pembaruan…</span></div>`;
  const tombol = wadah.querySelector('#perbarui-tombol');
  const status = wadah.querySelector('#perbarui-status');
  let pantau = null;

  const tampil = run => {
    status.textContent = teksStatus(run);
    tombol.disabled = !!(run && run.status !== 'completed');
  };

  const mulaiPantau = () => {
    clearInterval(pantau);
    const awal = Date.now();
    pantau = setInterval(async () => {
      try {
        const { run } = await minta(sb, 'status_bangun');
        tampil(run);
        if ((run && run.status === 'completed') || Date.now() - awal > BATAS_MS) clearInterval(pantau);
      } catch (err) { status.textContent = err.message || String(err); clearInterval(pantau); }
    }, JEDA_MS);
  };

  minta(sb, 'status_bangun')
    .then(({ run }) => { tampil(run); if (run && run.status !== 'completed') mulaiPantau(); })
    .catch(err => { status.textContent = err.message || String(err); });

  tombol.onclick = async () => {
    tombol.disabled = true;
    status.textContent = 'Meminta pembaruan…';
    try {
      const out = await minta(sb, 'bangun');
      status.textContent = out.dipicu
        ? 'Pembaruan dimulai; biasanya selesai 2–3 menit.'
        : teksStatus(out.run) + ' Data terbaru ikut di pembaruan ini.';
      mulaiPantau();
    } catch (err) {
      status.textContent = err.message || String(err);
      tombol.disabled = false;
    }
  };
}
