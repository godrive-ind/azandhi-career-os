// pages/api/admin/users.js
import { readAll, appendRow, upsertByEmail, deleteByEmail, ensureSheets, SHEET } from '../../../src/lib/sheets';
import { v4 as uuid } from 'uuid';

export default async function handler(req, res) {
  try {
    await ensureSheets();

    // GET — ambil semua users + waitlist
    if (req.method === 'GET') {
      const [users, waitlist] = await Promise.all([readAll(SHEET.USERS), readAll(SHEET.WAITLIST)]);
      return res.json({ ok: true, users, waitlist });
    }

    // POST — approve pengguna dari waitlist atau tambah manual
    if (req.method === 'POST') {
      const { email, phone, name, pin, fromWaitlist, waitlistEmail } = req.body;
      const e = email.toLowerCase().trim();

      // Simpan ke sheet users (approved = true)
      await appendRow(SHEET.USERS, {
        email: e,
        phone: phone || '',
        pin: pin || '1234',
        name: name || '',
        approved: 'true',
        approvedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      // Hapus dari waitlist jika dari waitlist
      if (fromWaitlist) {
        await deleteByEmail(SHEET.WAITLIST, waitlistEmail || e);
      }

      // Catat audit
      await appendRow(SHEET.AUDIT, {
        id: uuid(), adminEmail: 'ADMIN', action: 'APPROVE_USER',
        target: e, detail: `PIN: ${pin || '1234'}`, timestamp: new Date().toISOString(),
      });

      return res.json({ ok: true });
    }

    // PATCH — update data pengguna (pin, phone, dll)
    if (req.method === 'PATCH') {
      const { email, ...updates } = req.body;
      await upsertByEmail(SHEET.USERS, email.toLowerCase(), updates);
      return res.json({ ok: true });
    }

    // DELETE — hapus pengguna beserta semua CV-nya
    if (req.method === 'DELETE') {
      const { email, deleteDocsOnly } = req.body;
      const e = email.toLowerCase();

      if (!deleteDocsOnly) {
        await deleteByEmail(SHEET.USERS, e);
      }

      // Hapus semua CV milik pengguna
      const allCvs = await readAll(SHEET.CVS);
      const toDelete = allCvs.filter(c => c.ownerEmail === e);
      const { deleteById } = await import('../../../src/lib/sheets');
      for (const cv of toDelete) { await deleteById(SHEET.CVS, cv.id); }

      await appendRow(SHEET.AUDIT, {
        id: uuid(), adminEmail: 'ADMIN',
        action: deleteDocsOnly ? 'DELETE_DOCS_ONLY' : 'DELETE_USER',
        target: e, detail: `Hapus ${toDelete.length} dokumen`, timestamp: new Date().toISOString(),
      });

      return res.json({ ok: true, deleted: toDelete.length });
    }

    return res.status(405).end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, msg: err.message });
  }
}
