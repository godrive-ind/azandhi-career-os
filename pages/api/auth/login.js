// pages/api/auth/login.js
import { readAll, ensureSheets, SHEET } from '../../../src/lib/sheets';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    await ensureSheets();
    const { email, pin } = req.body;
    if (!email?.includes('@')) return res.status(400).json({ ok: false, msg: 'Format email tidak valid.' });

    const e = email.toLowerCase().trim();

    // ── Admin check ──
    if (e === (process.env.ADMIN_EMAIL || 'admin@azandhi.com').toLowerCase()) {
      if (pin === (process.env.ADMIN_PIN || 'ADMIN2026')) {
        return res.json({ ok: true, role: 'admin', email: e, name: 'Admin' });
      }
      return res.status(401).json({ ok: false, msg: 'PIN Admin salah.' });
    }

    // ── User check ──
    const users = await readAll(SHEET.USERS);
    const user = users.find(u => u.email === e);

    if (!user) {
      return res.status(403).json({ ok: false, msg: 'NOT_REGISTERED', email: e });
    }
    if (user.approved !== 'true') {
      return res.status(403).json({ ok: false, msg: 'NOT_APPROVED', email: e });
    }
    if (user.pin !== pin) {
      return res.status(401).json({ ok: false, msg: 'PIN salah. Hubungi admin jika lupa PIN Anda.' });
    }

    return res.json({ ok: true, role: 'user', email: e, name: user.name || e, phone: user.phone });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, msg: 'Server error: ' + err.message });
  }
}
