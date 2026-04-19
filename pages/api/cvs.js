// pages/api/cvs.js
import { readAll, upsertById, deleteById, ensureSheets, SHEET } from '../../src/lib/sheets';
import { v4 as uuid } from 'uuid';

export default async function handler(req, res) {
  try {
    await ensureSheets();

    if (req.method === 'GET') {
      const { email, admin } = req.query;
      const all = await readAll(SHEET.CVS);
      const parsed = all.map(row => {
        try {
          const d = JSON.parse(row.data || '{}');
          return { id: row.id, ownerEmail: row.ownerEmail, title: row.title, targetRole: row.targetRole, level: row.level, lastModified: row.lastModified, ...d };
        } catch { return { ...row }; }
      });
      if (admin === 'true') return res.json({ ok: true, data: parsed });
      const filtered = email ? parsed.filter(c => c.ownerEmail === email) : [];
      return res.json({ ok: true, data: filtered });
    }

    if (req.method === 'POST') {
      const cv = req.body;
      if (!cv.ownerEmail) return res.status(400).json({ ok: false, msg: 'ownerEmail wajib.' });
      const id = cv.id || ('cv_' + uuid().replace(/-/g,'').slice(0,12));
      const { ownerEmail, title, targetRole, level, lastModified, ...rest } = cv;
      await upsertById(SHEET.CVS, id, {
        ownerEmail, title: title || 'CV Baru', targetRole: targetRole || '',
        level: level || 'Profesional', lastModified: lastModified || Date.now().toString(),
        data: JSON.stringify({ ...rest, id, ownerEmail, title, targetRole, level, lastModified }),
      });
      return res.json({ ok: true, id });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ ok: false, msg: 'id wajib.' });
      await deleteById(SHEET.CVS, id);
      return res.json({ ok: true });
    }

    return res.status(405).end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, msg: err.message });
  }
}
