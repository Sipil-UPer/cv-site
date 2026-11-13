// Baris dosen untuk sesi login (pemilik 2026-11-13, 69-patch-email-alternatif.sql):
// dosen boleh masuk dengan email utama atau email alternatif. id_dosen_login()
// memetakan email login ke dosen; sebelum patch 69 dijalankan (rpc galat)
// pencarian kembali ke cara lama, email login = dosen.email.
export async function dosenLogin(sb, session, kolom = '*'){
  const { data: id, error } = await sb.rpc('id_dosen_login');
  if (error) return sb.from('dosen').select(kolom).ilike('email', session.user.email).maybeSingle();
  if (!id) return { data: null, error: null };
  return sb.from('dosen').select(kolom).eq('id', id).maybeSingle();
}
