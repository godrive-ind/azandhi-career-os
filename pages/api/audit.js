// pages/api/audit.js
import { readAll, ensureSheets, SHEET } from '../../src/lib/sheets';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    await ensureSheets();
    const logs = await readAll(SHEET.AUDIT);
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return res.json({ ok: true, data: logs });
  } catch (err) {
    return res.status(500).json({ ok: false, msg: err.message });
  }
}
