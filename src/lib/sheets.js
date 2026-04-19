// src/lib/sheets.js — Google Sheets sebagai database
import { google } from 'googleapis';

export const SHEET = {
  USERS:      'users',       // email, phone, pin_hash, name, approved, approvedAt, createdAt
  WAITLIST:   'waitlist',    // email, phone, name, requestedAt
  CVS:        'cvs',         // id, ownerEmail, title, targetRole, level, lastModified, data(JSON)
  AUDIT:      'audit_logs',  // id, adminEmail, action, target, detail, timestamp
};

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON tidak ditemukan!');
  return new google.auth.GoogleAuth({ credentials: JSON.parse(raw), scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
}
async function client() {
  return google.sheets({ version: 'v4', auth: getAuth() });
}
function sid() {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error('GOOGLE_SHEET_ID tidak ditemukan!');
  return id;
}

// ── Baca semua baris (baris 1 = header) ──────────────────────
export async function readAll(sheet) {
  const s = await client();
  try {
    const r = await s.spreadsheets.values.get({ spreadsheetId: sid(), range: `${sheet}!A:Z` });
    const rows = r.data.values || [];
    if (rows.length <= 1) return [];
    const headers = rows[0];
    return rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] || ''; });
      return obj;
    });
  } catch { return []; }
}

// ── Tambah baris baru ──────────────────────────────────────────
export async function appendRow(sheet, data) {
  const s = await client();
  // Ambil / buat header
  let headers;
  try {
    const hr = await s.spreadsheets.values.get({ spreadsheetId: sid(), range: `${sheet}!1:1` });
    headers = hr.data.values?.[0] || [];
  } catch { headers = []; }
  if (headers.length === 0) {
    headers = Object.keys(data);
    await s.spreadsheets.values.update({ spreadsheetId: sid(), range: `${sheet}!A1`, valueInputOption: 'RAW', requestBody: { values: [headers] } });
  }
  const row = headers.map(h => data[h] !== undefined ? String(data[h]) : '');
  await s.spreadsheets.values.append({ spreadsheetId: sid(), range: `${sheet}!A:A`, valueInputOption: 'RAW', requestBody: { values: [row] } });
}

// ── Update baris berdasarkan kolom `id` ──────────────────────
export async function upsertById(sheet, id, newData) {
  const s = await client();
  const r = await s.spreadsheets.values.get({ spreadsheetId: sid(), range: `${sheet}!A:Z` });
  const rows = r.data.values || [];
  if (rows.length === 0) { return appendRow(sheet, { id, ...newData }); }
  const headers = rows[0];
  const rowIdx = rows.findIndex((row, i) => i > 0 && row[0] === id);
  if (rowIdx === -1) { return appendRow(sheet, { id, ...newData }); }
  const existing = {};
  headers.forEach((h, i) => { existing[h] = rows[rowIdx][i] || ''; });
  const merged = { ...existing, ...newData, id };
  const updRow = headers.map(h => merged[h] !== undefined ? String(merged[h]) : '');
  const sheetRow = rowIdx + 1;
  await s.spreadsheets.values.update({ spreadsheetId: sid(), range: `${sheet}!A${sheetRow}:Z${sheetRow}`, valueInputOption: 'RAW', requestBody: { values: [updRow] } });
}

// ── Update baris berdasarkan kolom `email` ───────────────────
export async function upsertByEmail(sheet, email, newData) {
  const s = await client();
  const r = await s.spreadsheets.values.get({ spreadsheetId: sid(), range: `${sheet}!A:Z` });
  const rows = r.data.values || [];
  if (rows.length === 0) { return appendRow(sheet, { email, ...newData }); }
  const headers = rows[0];
  const emailCol = headers.indexOf('email');
  if (emailCol === -1) { return appendRow(sheet, { email, ...newData }); }
  const rowIdx = rows.findIndex((row, i) => i > 0 && row[emailCol] === email);
  if (rowIdx === -1) { return appendRow(sheet, { email, ...newData }); }
  const existing = {};
  headers.forEach((h, i) => { existing[h] = rows[rowIdx][i] || ''; });
  const merged = { ...existing, ...newData, email };
  const updRow = headers.map(h => merged[h] !== undefined ? String(merged[h]) : '');
  await s.spreadsheets.values.update({ spreadsheetId: sid(), range: `${sheet}!A${rowIdx + 1}:Z${rowIdx + 1}`, valueInputOption: 'RAW', requestBody: { values: [updRow] } });
}

// ── Hapus baris berdasarkan ID ────────────────────────────────
export async function deleteById(sheet, id) {
  const s = await client();
  const r = await s.spreadsheets.values.get({ spreadsheetId: sid(), range: `${sheet}!A:A` });
  const col = r.data.values || [];
  const rowIdx = col.findIndex((c, i) => i > 0 && c[0] === id);
  if (rowIdx === -1) return;
  const meta = await s.spreadsheets.get({ spreadsheetId: sid() });
  const sh = meta.data.sheets.find(x => x.properties.title === sheet);
  if (!sh) return;
  await s.spreadsheets.batchUpdate({ spreadsheetId: sid(), requestBody: { requests: [{ deleteDimension: { range: { sheetId: sh.properties.sheetId, dimension: 'ROWS', startIndex: rowIdx, endIndex: rowIdx + 1 } } }] } });
}

// ── Hapus baris berdasarkan email ────────────────────────────
export async function deleteByEmail(sheet, email) {
  const s = await client();
  const r = await s.spreadsheets.values.get({ spreadsheetId: sid(), range: `${sheet}!A:Z` });
  const rows = r.data.values || [];
  if (rows.length === 0) return;
  const headers = rows[0];
  const emailCol = headers.indexOf('email');
  if (emailCol === -1) return;
  const rowIdx = rows.findIndex((row, i) => i > 0 && row[emailCol] === email);
  if (rowIdx === -1) return;
  const meta = await s.spreadsheets.get({ spreadsheetId: sid() });
  const sh = meta.data.sheets.find(x => x.properties.title === sheet);
  if (!sh) return;
  await s.spreadsheets.batchUpdate({ spreadsheetId: sid(), requestBody: { requests: [{ deleteDimension: { range: { sheetId: sh.properties.sheetId, dimension: 'ROWS', startIndex: rowIdx, endIndex: rowIdx + 1 } } }] } });
}

// ── Pastikan semua tab ada ───────────────────────────────────
export async function ensureSheets() {
  const s = await client();
  const meta = await s.spreadsheets.get({ spreadsheetId: sid() });
  const existing = meta.data.sheets.map(x => x.properties.title);
  const needed = Object.values(SHEET).filter(x => !existing.includes(x));
  if (needed.length === 0) return;
  await s.spreadsheets.batchUpdate({ spreadsheetId: sid(), requestBody: { requests: needed.map(title => ({ addSheet: { properties: { title } } })) } });
  const headerMap = {
    [SHEET.USERS]:    ['email','phone','pin','name','approved','approvedAt','createdAt'],
    [SHEET.WAITLIST]: ['email','phone','name','requestedAt'],
    [SHEET.CVS]:      ['id','ownerEmail','title','targetRole','level','lastModified','data'],
    [SHEET.AUDIT]:    ['id','adminEmail','action','target','detail','timestamp'],
  };
  for (const sh of needed) {
    if (headerMap[sh]) {
      await s.spreadsheets.values.update({ spreadsheetId: sid(), range: `${sh}!A1`, valueInputOption: 'RAW', requestBody: { values: [headerMap[sh]] } });
    }
  }
}
