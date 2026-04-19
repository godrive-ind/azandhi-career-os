// pages/api/auth/register.js
import { readAll, appendRow, ensureSheets, SHEET } from '../../../src/lib/sheets';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    await ensureSheets();
    const { email, phone, name } = req.body;
    if (!email?.includes('@')) return res.status(400).json({ ok: false, msg: 'Format email tidak valid.' });
    if (!phone?.trim()) return res.status(400).json({ ok: false, msg: 'Nomor telepon wajib diisi.' });

    const e = email.toLowerCase().trim();

    // Cek sudah terdaftar
    const users = await readAll(SHEET.USERS);
    if (users.find(u => u.email === e)) {
      return res.json({ ok: false, msg: 'Email sudah terdaftar. Silakan login.' });
    }

    // Cek sudah di waitlist
    const wl = await readAll(SHEET.WAITLIST);
    if (wl.find(w => w.email === e)) {
      return res.json({ ok: true, msg: 'Anda sudah ada dalam antrian. Tunggu persetujuan admin.' });
    }

    await appendRow(SHEET.WAITLIST, {
      email: e,
      phone: phone.trim(),
      name: name?.trim() || '',
      requestedAt: new Date().toISOString(),
    });

    return res.json({ ok: true, msg: 'Permintaan akses terkirim. Admin akan segera memproses.' });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: err.message });
  }
}
