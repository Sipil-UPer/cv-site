// Kalender kegiatan prodi (pemilik 2026-11-12; 64-patch-kegiatan.sql). Dipakai kalender.html.
// Keputusan pemilik 2026-11-12: kegiatan manual diisi admin; hanya pengguna terdaftar yang
// melihat; ekspor berupa unduhan .ics. Tenggat pribadi (tindak lanjut rapat, proposal/laporan
// hibah, temuan AMI) tampil untuk yang bersangkutan; admin melihat semuanya.
// Jam di situs ini WIB (UTC+7, tanpa musim panas); di .ics ditulis sebagai UTC.
import { JENIS_LIBUR } from './hari-libur.js?v=2026-11-24-0aaa65';

export const JENIS_ACARA = {
  libur:     { label: 'Hari libur', warna: '#9E3A26' },   // 139-patch-hari-libur.sql, pemilik 2026-11-21
  kuliah:    { label: 'Jadwal mengajar saya', warna: '#37474F' },   // 150/152, jadwal kuliah yang disahkan, pemilik 2026-11-22
  rapat:     { label: 'Rapat prodi', warna: '#1F4E79' },
  kegiatan:  { label: 'Kegiatan prodi', warna: '#2E7D32' },
  panggilan: { label: 'Panggilan hibah', warna: '#6A1B9A' },
  hibah:     { label: 'Tenggat hibah tim', warna: '#8A5A00' },
  tindak:    { label: 'Tindak lanjut rapat', warna: '#B23B3B' },
  ami:       { label: 'Temuan AMI', warna: '#C2185B' },
  evaluasi:  { label: 'Tindak lanjut evaluasi pembelajaran', warna: '#00695C' },
  berhalangan: { label: 'Berhalangan saya', warna: '#757575' },   // 132/135, hanya di Kalender saya (162, pemilik 2026-11-24)
};
export const JENIS_KEGIATAN = {
  ami: 'AMI', akademik: 'Akademik (UTS/UAS, perkuliahan)', yudisium: 'Yudisium', wisuda: 'Wisuda',
  seminar: 'Seminar / kuliah tamu', rapat_luar: 'Rapat di luar prodi',
  // 162 (pemilik 2026-11-24): penugasan dosen dari admin; dengan dosen terpilih tampil di Kalender saya mereka.
  mengawas: 'Mengawas ujian', sidang: 'Sidang (penguji/pembimbing)', piket: 'Piket', penugasan: 'Penugasan / kunjungan',
  lain: 'Lainnya',
};

/**
 * Saringan Kalender saya (162, pemilik 2026-11-24). d seperti kumpulkanAcara, ditambah pesertaRapat (rapat_peserta milik
 * saya: [{rapat_id}]) dan kegiatanDosen (semua kegiatan_dosen: [{kegiatan_id, dosen_id}]).
 * Rapat: hanya yang mencentang saya sebagai peserta. Kegiatan: tanpa dosen terpilih (untuk semua) atau yang menugasi saya.
 */
export function saringSaya(d, saya){
  const rapatSaya = new Set((d.pesertaRapat || []).map(p => p.rapat_id));
  const tugas = new Map();
  for (const x of d.kegiatanDosen || []) { if (!tugas.has(x.kegiatan_id)) tugas.set(x.kegiatan_id, new Set()); tugas.get(x.kegiatan_id).add(x.dosen_id); }
  return { ...d, rapat: (d.rapat || []).filter(r => rapatSaya.has(r.id)),
    kegiatan: (d.kegiatan || []).filter(k => !tugas.has(k.id) || tugas.get(k.id).has(saya?.id)) };
}

/** Berhalangan bertanggal (132 dosen_berhalangan_tgl, 135 dosen_berhalangan_rentang) menjadi acara sepanjang hari. */
export function acaraBerhalangan(tgl = [], rentang = []){
  const al = x => [x.alasan, x.slot_id ? 'sesi tertentu' : ''].filter(Boolean).join(' · ');
  return [...tgl.map(x => ({ uid: `berhalangan-t${x.id}`, judul: 'Berhalangan', mulai: iso(x.tanggal), ket: al(x) })),
    ...rentang.map(x => ({ uid: `berhalangan-r${x.id}`, judul: 'Berhalangan', mulai: iso(x.mulai), selesai: iso(x.selesai),
      ket: [x.alasan, x.hari?.length ? 'hari tertentu saja' : '', x.slot_ids?.length ? 'sesi tertentu' : ''].filter(Boolean).join(' · ') }))];
}
const TINDAK_BUKA = new Set(['terbuka', 'proses']);
const AMI_BUKA = new Set(['terbuka', 'proses']);

const iso = v => v ? String(v).slice(0, 10) : null;
const jam = v => v ? String(v).slice(0, 5) : null;

/**
 * Semua acara yang tampil untuk `saya` (baris dosen). d = { kegiatan, rapat, panggilan,
 * hibah (dengan hibah_tim [{dosen_id}]), tindak (dengan rapat {judul}), temuan }.
 * Hasil [{ uid, sumber, judul, mulai, selesai, jamMulai, jamSelesai, tempat, ket, href }],
 * urut tanggal lalu jam. mulai/selesai 'YYYY-MM-DD' (selesai = hari terakhir, inklusif).
 */
export function kumpulkanAcara(d, saya){
  const admin = saya?.peran === 'admin';
  const em = String(saya?.email || '').toLowerCase();
  const out = [];
  const tambah = a => { if (a.mulai) out.push({ selesai: a.mulai, jamMulai: null, jamSelesai: null, tempat: '', ket: '', href: '', ...a,
    selesai: a.selesai && a.selesai >= a.mulai ? a.selesai : a.mulai }); };

  // Hari libur (139): untuk semua pengguna, sepanjang hari.
  for (const l of d.libur || [])
    tambah({ uid: `libur-${iso(l.tanggal)}`, sumber: 'libur', judul: l.nama, mulai: iso(l.tanggal), ket: JENIS_LIBUR[l.jenis] || '' });

  // Jadwal mengajar (150, pemilik 2026-11-22): pertemuan bertanggal dari pertemuanKuliah (jadwal-kuliah.js), hanya kelas
  // pengguna ini dan hanya jadwal yang sudah disahkan Kaprodi; disusun pemanggil.
  for (const p of d.kuliah || [])
    tambah({ uid: p.uid, sumber: 'kuliah', judul: p.judul, mulai: p.tanggal, jamMulai: p.mulai, jamSelesai: p.selesai,
      tempat: p.ruang || '', ket: p.ket || '', href: 'jadwal-kuliah.html' });

  for (const k of d.kegiatan || [])
    tambah({ uid: `kegiatan-${k.id}`, sumber: 'kegiatan', judul: k.judul, mulai: iso(k.mulai), selesai: iso(k.selesai),
      jamMulai: jam(k.jam_mulai), jamSelesai: jam(k.jam_selesai), tempat: k.tempat || '',
      ket: [JENIS_KEGIATAN[k.jenis], k.ditugaskan?.length ? 'Ditugaskan: ' + k.ditugaskan.join(', ') : '', k.keterangan, k.tautan]
        .filter(Boolean).join('\n'), href: k.tautan || '', jenis: k.jenis });

  // Berhalangan saya (Kalender saya, 162): sudah berbentuk acara (acaraBerhalangan).
  for (const b of d.berhalangan || []) tambah({ ...b, sumber: 'berhalangan', href: 'jadwal-berhalangan.html' });

  for (const r of d.rapat || [])
    tambah({ uid: `rapat-${r.id}`, sumber: 'rapat', judul: r.judul, mulai: iso(r.tanggal),
      jamMulai: jam(r.mulai), jamSelesai: jam(r.selesai), tempat: r.tempat || '', ket: r.agenda || '', href: `rapat.html?id=${r.id}` });

  for (const p of d.panggilan || [])
    if (p.tenggat) tambah({ uid: `panggilan-${p.id}`, sumber: 'panggilan', judul: `Tenggat panggilan: ${p.judul}`, mulai: iso(p.tenggat),
      ket: [p.penyelenggara, p.tautan].filter(Boolean).join('\n'), href: 'hibah.html' });

  for (const a of d.hibah || []) {
    if (!admin && !(a.hibah_tim || []).some(t => t.dosen_id === saya?.id)) continue;
    const t = [];
    if (a.status === 'rencana' && a.tenggat_ajuan && !a.tanggal_ajuan) t.push(['ajuan', 'Kirim proposal', a.tenggat_ajuan]);
    if (a.status === 'didanai' && a.tenggat_kemajuan && !a.kemajuan_selesai) t.push(['kemajuan', 'Laporan kemajuan', a.tenggat_kemajuan]);
    if (a.status === 'didanai' && a.tenggat_akhir && !a.akhir_selesai) t.push(['akhir', 'Laporan akhir', a.tenggat_akhir]);
    for (const [k, l, tg] of t) tambah({ uid: `hibah-${a.id}-${k}`, sumber: 'hibah', judul: `${l}: ${a.judul}`, mulai: iso(tg), href: 'hibah.html' });
  }

  for (const t of d.tindak || [])
    if (t.tenggat && TINDAK_BUKA.has(t.status) && (admin || t.pj_dosen_id === saya?.id))
      tambah({ uid: `tindak-${t.id}`, sumber: 'tindak', judul: `Tindak lanjut: ${t.keputusan}`, mulai: iso(t.tenggat),
        ket: [t.rapat?.judul ? `Rapat: ${t.rapat.judul}` : '', t.pj_nama ? `PJ: ${t.pj_nama}` : ''].filter(Boolean).join('\n'),
        href: `rapat.html?id=${t.rapat_id}` });

  for (const r of d.temuan || [])
    if (r.tenggat && AMI_BUKA.has(r.status) && (admin || (em && String(r.pj_email || '').toLowerCase() === em)))
      tambah({ uid: `ami-${r.id}`, sumber: 'ami', judul: `Temuan AMI ${[r.siklus, r.kode].filter(Boolean).join(' ')}`.trim(),
        mulai: iso(r.tenggat), ket: r.uraian || '' });

  // Tindak lanjut evaluasi pembelajaran (68-patch-evaluasi-pembelajaran.sql): admin dan PJ-nya.
  for (const t of d.tindakEval || [])
    if (t.tenggat && t.status !== 'selesai' && (admin || t.pj_id === saya?.id)) {
      const mk = t.evaluasi_mk || {};
      tambah({ uid: `evaluasi-${t.id}`, sumber: 'evaluasi', judul: `Tindak lanjut ${mk.kode_mk || 'evaluasi'}: ${t.rencana}`, mulai: iso(t.tenggat),
        ket: [t.masalah, mk.tahun_akademik ? `${mk.tahun_akademik} ${mk.semester}` : ''].filter(Boolean).join('\n'),
        href: mk.tahun_akademik ? `evaluasi-pembelajaran.html?ta=${encodeURIComponent(mk.tahun_akademik)}&sm=${mk.semester}` : 'evaluasi-pembelajaran.html' });
    }

  return out.sort((a, b) => a.mulai.localeCompare(b.mulai) || String(a.jamMulai || '').localeCompare(String(b.jamMulai || ''))
    || a.judul.localeCompare(b.judul));
}

/** Acara yang berlangsung pada tanggal ISO (acara beberapa hari ikut di tiap harinya). */
export const acaraPada = (acara, t) => acara.filter(a => a.mulai <= t && t <= a.selesai);

const pad = n => String(n).padStart(2, '0');
export const isoTanggal = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

/** Kisi bulan (m = 1..12), minggu mulai Senin: 6 baris x 7 [{ iso, bulanIni }]. */
export function kisiBulan(y, m){
  const awal = new Date(Date.UTC(y, m - 1, 1));
  const geser = (awal.getUTCDay() + 6) % 7;            // Senin = 0
  return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, i) => {
    const t = new Date(Date.UTC(y, m - 1, 1 - geser + w * 7 + i));
    return { iso: t.toISOString().slice(0, 10), bulanIni: t.getUTCMonth() === m - 1 };
  }));
}

// --- .ics (RFC 5545) -----------------------------------------------------------
const teksIcs = s => String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
// Lipat baris > 75 oktet (UTF-8) dengan CRLF + spasi, tanpa memotong karakter.
function lipat(baris){
  const enc = new TextEncoder();
  if (enc.encode(baris).length <= 75) return baris;
  const potong = []; let cur = '', n = 0, batas = 75;
  for (const ch of baris) {
    const b = enc.encode(ch).length;
    if (n + b > batas) { potong.push(cur); cur = ''; n = 0; batas = 74; }
    cur += ch; n += b;
  }
  potong.push(cur);
  return potong.join('\r\n ');
}
const tglIcs = t => t.replace(/-/g, '');
const tambahHari = (t, n) => new Date(Date.UTC(+t.slice(0, 4), +t.slice(5, 7) - 1, +t.slice(8, 10) + n)).toISOString().slice(0, 10);
// WIB -> UTC: 'YYYY-MM-DD' + 'HH:MM' -> 'YYYYMMDDTHHMMSSZ'.
function utc(t, j, tambahMenit = 0){
  const [h, mi] = j.split(':').map(Number);
  const x = new Date(Date.UTC(+t.slice(0, 4), +t.slice(5, 7) - 1, +t.slice(8, 10), h - 7, mi + tambahMenit));
  return x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Berkas .ics dari daftar acara. o = { nama: nama kalender, domain: untuk UID, kini: Date, situs: URL dasar }.
 * Acara tanpa jam = sepanjang hari (DTEND eksklusif); berjam tanpa jam selesai = 1 jam.
 */
export function keIcs(acara, { nama = 'Kalender prodi', domain = 'cv-prodi', kini = new Date(), situs = '' } = {}){
  const stamp = kini.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//cv-prodi//Kalender kegiatan//ID', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${teksIcs(nama)}`, 'X-WR-TIMEZONE:Asia/Jakarta'];
  for (const a of acara) {
    L.push('BEGIN:VEVENT', `UID:${a.uid}@${domain}`, `DTSTAMP:${stamp}`);
    if (a.jamMulai) {
      L.push(`DTSTART:${utc(a.mulai, a.jamMulai)}`,
        `DTEND:${a.jamSelesai ? utc(a.selesai, a.jamSelesai) : utc(a.selesai, a.jamMulai, 60)}`);
    } else {
      L.push(`DTSTART;VALUE=DATE:${tglIcs(a.mulai)}`, `DTEND;VALUE=DATE:${tglIcs(tambahHari(a.selesai, 1))}`);
    }
    L.push(`SUMMARY:${teksIcs(a.judul)}`);
    if (a.tempat) L.push(`LOCATION:${teksIcs(a.tempat)}`);
    const ket = [a.ket, a.href && !/^https?:/i.test(a.href) && situs ? situs + a.href : ''].filter(Boolean).join('\n');
    if (ket) L.push(`DESCRIPTION:${teksIcs(ket)}`);
    if (/^https?:\/\//i.test(a.href)) L.push(`URL:${a.href}`);
    else if (a.href && situs) L.push(`URL:${situs}${a.href}`);
    L.push(`CATEGORIES:${teksIcs(JENIS_ACARA[a.sumber]?.label || a.sumber)}`, 'END:VEVENT');
  }
  L.push('END:VCALENDAR');
  return L.map(lipat).join('\r\n') + '\r\n';
}
