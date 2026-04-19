// pages/index.js — Azandhi Career OS v4 · Full Flow
import { useState, useCallback, useRef, useEffect } from 'react';

/* ─── PRIMITIVES ──────────────────────────────────────────── */
const I = ({ i, sz = 14, s = {} }) => <i className={`fa-solid fa-${i}`} style={{ fontSize: sz, lineHeight: 1, ...s }} />;

const Logo = ({ inv = false, size = 28 }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
    {/* Azandhi "A" mark — wave glyph */}
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1B5FD4"/>
          <stop offset="100%" stopColor="#0B9E8A"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22" fill={inv ? 'rgba(255,255,255,.1)' : 'url(#lg1)'}/>
      <path d="M16 82 Q50 16 84 82" fill="none" stroke="white" strokeWidth="9" strokeLinecap="round"/>
      <path d="M30 82 Q50 40 70 82" fill="none" stroke="rgba(255,255,255,.65)" strokeWidth="8" strokeLinecap="round"/>
      <path d="M44 82 Q50 64 56 82" fill="none" stroke="rgba(255,255,255,.38)" strokeWidth="7" strokeLinecap="round"/>
    </svg>
    <div style={{ lineHeight: 1, userSelect: 'none' }}>
      <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: '.18em', color: inv ? '#fff' : 'var(--navy)' }}>AZANDHI</div>
      <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 500, fontSize: 8.5, letterSpacing: '.26em', color: inv ? 'rgba(255,255,255,.45)' : 'var(--g500)', marginTop: 2 }}>CAREER OS</div>
    </div>
  </div>
);

/* ─── AI ────────────────────────────────────────────────────── */
const GEM = 'gemini-2.0-flash';
const SYS = 'Anda adalah senior career coach & HR strategist Indonesia. Bahasa Indonesia profesional. JANGAN mengarang angka/data. Action verbs kuat di awal kalimat (Memimpin, Mengoptimalkan, Merancang, Mentransformasi). Tiap poin diawali "• " dan dipisah baris baru.';
async function runAI(prompt) {
  const k = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  if (!k) return '⚠️ Gemini API Key belum diatur.';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEM}:generateContent?key=${k}`;
  for (let t = 0; t < 3; t++) {
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], systemInstruction: { parts: [{ text: SYS }] } }) });
      if (!r.ok) throw new Error(r.status);
      const d = await r.json();
      return d.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch { if (t === 2) return '⚠️ AI sedang sibuk. Coba lagi.'; await new Promise(x => setTimeout(x, 1500 * (t + 1))); }
  }
}

/* ─── UTILS ─────────────────────────────────────────────────── */
const mkCV = () => ({ id: 'cv_' + Date.now(), title: 'CV Baru', targetRole: '', level: 'Profesional', lastModified: Date.now(), personal: { fullName: '', jobTitle: '', email: '', phone: '', location: '', linkedin: '' }, summary: { text: '' }, experience: [], education: [], skills: [], languages: [], certifications: [] });
const mkExp = () => ({ id: 'e' + Date.now(), role: '', company: '', start: '', end: '', current: false, desc: '' });
const mkEdu = () => ({ id: 'u' + Date.now(), degree: '', field: '', school: '', start: '', end: '', gpa: '', notes: '' });
const fmtD = v => v ? new Date(v + '-01').toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : '';
const fmtTs = v => v ? new Date(v).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

/* ─── SHARED UI ─────────────────────────────────────────────── */
const Lbl = ({ c }) => <div className="field-label">{c}</div>;
const Fld = ({ label, value, onChange, type = 'text', placeholder = '', dark = false, required = false }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <Lbl c={label + (required ? ' *' : '')} />}
    <input type={type} className={dark ? 'inp inp-dark' : 'inp'} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);
const G2 = ({ ch }) => <div className="grid2">{ch}</div>;
const Spin = ({ sz = 18, col = 'var(--blue)' }) => <I i="circle-notch" sz={sz} s={{ color: col, animation: 'spin .8s linear infinite' }} />;
const Div = () => <div className="div" />;

/* ─── AI TEXTAREA ────────────────────────────────────────────── */
function AIBox({ label, value, onChange, placeholder, role, type = 'exp' }) {
  const [busy, setBusy] = useState(false);
  const [prev, setPrev] = useState('');
  async function run(mode) {
    if (!value?.trim()) return alert('Tulis draf terlebih dahulu sebelum menggunakan AI.');
    setBusy(true); setPrev(value);
    const ps = {
      fix: `Perbaiki tata bahasa & gaya profesional teks CV ini:\n"${value}"`,
      star: `Ubah menjadi bullet points ATS-optimized (metode STAR) untuk posisi "${role || 'profesional'}":\n"${value}"`,
      sum: `Tulis Executive Summary 3-4 kalimat ATS-friendly untuk posisi "${role || 'profesional'}":\n"${value}"`,
    };
    onChange(await runAI(ps[mode])); setBusy(false);
  }
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5, flexWrap: 'wrap', gap: 6 }}>
        {label && <Lbl c={label} />}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {prev && <button className="btn btn-ghost btn-xs" onClick={() => { onChange(prev); setPrev(''); }}>↩ Undo</button>}
          <button className="btn btn-out btn-xs" disabled={busy} onClick={() => run('fix')}>✦ Perbaiki</button>
          <button className="btn btn-blue btn-xs" disabled={busy} onClick={() => run(type === 'sum' ? 'sum' : 'star')}>
            <I i="wand-magic-sparkles" sz={10} /> {type === 'sum' ? 'Sintesis AI' : 'Optimalkan (STAR)'}
          </button>
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        <textarea className="inp" value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={busy}
          style={{ minHeight: 96, resize: 'vertical', fontFamily: "'Outfit',sans-serif", fontSize: 13 }} />
        {busy && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,.88)', borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Spin sz={20} /><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)' }}>AI sedang memproses…</span>
        </div>}
      </div>
    </div>
  );
}

/* ─── SKILLS CHIP INPUT ──────────────────────────────────────── */
function SkillChips({ skills, onChange, targetRole }) {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const colors = ['chip', 'chip chip-teal', 'chip chip-amber', 'chip chip-green', 'chip chip-gray'];
  function addSkill(v) {
    const clean = v.trim();
    if (!clean || skills.includes(clean)) return;
    onChange([...skills, clean]);
    setInput('');
  }
  function onKey(e) {
    if (['Enter', ',', 'Tab'].includes(e.key)) { e.preventDefault(); addSkill(input); }
    if (e.key === 'Backspace' && !input && skills.length) onChange(skills.slice(0, -1));
  }
  async function suggestAI() {
    if (!targetRole?.trim()) return alert('Isi target posisi di step 1 terlebih dahulu.');
    setBusy(true);
    const res = await runAI(`Berikan 12-15 hard skills dan soft skills paling penting untuk posisi "${targetRole}" dalam format satu kata per baris (contoh: Python\nSQL\nKomunikasi). Hanya nama skill, tanpa penomoran.`);
    const newSkills = res.split('\n').map(s => s.replace(/^[•\-\d\.\s]+/, '').trim()).filter(s => s && s.length < 40);
    const merged = [...new Set([...skills, ...newSkills])];
    onChange(merged); setBusy(false);
  }
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Lbl c="Keahlian Teknis & Soft Skills" />
        <button className="btn btn-teal btn-xs" disabled={busy} onClick={suggestAI}>
          {busy ? <Spin sz={10} col="#fff" /> : <I i="wand-magic-sparkles" sz={10} />} Saran AI
        </button>
      </div>
      <div style={{ minHeight: 44, padding: '8px 10px', background: 'var(--w)', border: '1.5px solid var(--g200)', borderRadius: 'var(--r1)', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', cursor: 'text' }}
        onClick={e => e.currentTarget.querySelector('input')?.focus()}>
        {skills.map((s, i) => (
          <span key={i} className={colors[i % colors.length]} style={{ cursor: 'default' }}>
            {s}
            <button onClick={() => onChange(skills.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 2, opacity: .6, display: 'flex', padding: 0, lineHeight: 1 }}><I i="xmark" sz={9} /></button>
          </span>
        ))}
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey} onBlur={() => input.trim() && addSkill(input)}
          placeholder={skills.length === 0 ? 'Ketik keahlian lalu tekan Enter...' : ''}
          style={{ border: 'none', outline: 'none', fontSize: 12, fontFamily: "'Outfit',sans-serif", background: 'transparent', color: 'var(--g800)', minWidth: 120, flex: 1 }} />
      </div>
      <p style={{ fontSize: 11, color: 'var(--g500)', marginTop: 5 }}>Tekan Enter atau koma setelah tiap keahlian. Klik "Saran AI" untuk rekomendasi otomatis.</p>
    </div>
  );
}

/* ─── CV PREVIEW ─────────────────────────────────────────────── */
function CvPreview({ cv }) {
  if (!cv) return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: 'var(--g300)' }}><I i="file-lines" sz={32} /><span style={{ fontSize: 13 }}>Pratinjau CV</span></div>;
  const p = cv.personal || {};
  const Sh = ({ t }) => <div style={{ fontSize: 11, fontWeight: 700, borderBottom: '1.5px solid #111', paddingBottom: 2, marginBottom: 6, marginTop: 12, letterSpacing: '.04em' }}>{t.toUpperCase()}</div>;
  return (
    <div className="print-zone cv-sheet" style={{ width: '100%', maxWidth: 590, margin: '0 auto', padding: '24px 28px', minHeight: 800, background: 'white', boxShadow: '0 4px 40px rgba(0,0,0,.13)' }}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '.06em' }}>{(p.fullName || 'NAMA LENGKAP').toUpperCase()}</div>
        {p.jobTitle && <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>{p.jobTitle}</div>}
        <div style={{ fontSize: 10, color: '#666', marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: '2px 10px' }}>
          {[p.location, p.phone, p.email, p.linkedin?.replace(/^https?:\/\//, '')].filter(Boolean).map((v, i) => <span key={i}>{v}</span>)}
        </div>
      </div>
      {cv.summary?.text && <><Sh t="Profil Singkat" /><p style={{ textAlign: 'justify', lineHeight: 1.5 }}>{cv.summary.text}</p></>}
      {cv.education?.length > 0 && <><Sh t="Pendidikan" />{cv.education.map((e, i) => <div key={i} style={{ marginBottom: 7 }}><div style={{ fontWeight: 700 }}>{[e.degree, e.field, e.gpa ? `IPK ${e.gpa}` : ''].filter(Boolean).join(' • ')}</div><div style={{ color: '#555' }}>{[`${fmtD(e.start)} – ${fmtD(e.end)}`, e.school].filter(Boolean).join(' • ')}</div>{(e.notes || '').split('\n').filter(Boolean).map((l, j) => <div key={j} style={{ paddingLeft: 10 }}>• {l.replace(/^•\s*/, '')}</div>)}</div>)}</>}
      {cv.experience?.length > 0 && <><Sh t="Pengalaman Kerja" />{cv.experience.map((e, i) => <div key={i} style={{ marginBottom: 9 }}><div style={{ fontWeight: 700 }}>{[e.role, e.company].filter(Boolean).join(' — ')}</div><div style={{ color: '#555' }}>{fmtD(e.start)} – {e.current ? 'Sekarang' : fmtD(e.end)}</div>{(e.desc || '').split('\n').filter(Boolean).map((l, j) => <div key={j} style={{ paddingLeft: 10 }}>• {l.replace(/^•\s*/, '')}</div>)}</div>)}</>}
      {cv.certifications?.length > 0 && <><Sh t="Sertifikasi" />{cv.certifications.map((c, i) => <div key={i} style={{ paddingLeft: 10 }}>• {[c.name, c.issuer, c.year].filter(Boolean).join(' / ')}</div>)}</>}
      {((cv.skills || []).filter(s => s?.trim()).length > 0 || (cv.languages || []).length > 0) && <>
        <Sh t="Keahlian" />
        {(cv.skills || []).filter(s => s?.trim()).length > 0 && <div><strong>Teknis: </strong>{cv.skills.filter(s => s?.trim()).join(', ')}</div>}
        {(cv.languages || []).length > 0 && <div><strong>Bahasa: </strong>{cv.languages.map(l => `${l.name} (${l.level})`).join(', ')}</div>}
      </>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════ */
export default function App() {
  /* ── STATE ── */
  const [view, setView] = useState('login');    // login | register | dashboard | builder | admin
  const [user, setUser] = useState(null);       // { email, name, phone, role }
  const [loginErr, setLE] = useState('');
  const [loginBusy, setLB] = useState(false);
  const [emailIn, setEI] = useState('');
  const [pinIn, setPI] = useState('');
  const [regForm, setRF] = useState({ email: '', phone: '', name: '', pin: '', pinConfirm: '' });
  const [regBusy, setRB] = useState(false);
  const [regMsg, setRM] = useState({ type: '', text: '' });

  /* builder */
  const [cv, setCv] = useState(mkCV());
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  /* dashboard */
  const [myCvs, setMyCvs] = useState([]);
  const [loadingCvs, setLoadingCvs] = useState(false);

  /* admin */
  const [adminData, setAdminData] = useState({ users: [], waitlist: [] });
  const [adminCvs, setAdminCvs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminTab, setAdminTab] = useState('users');
  const [modal, setModal] = useState(null);    // { type, data }

  /* ── STEPS ── */
  const STEPS = [
    { id: 'target', label: 'Target',      icon: 'bullseye' },
    { id: 'info',   label: 'Data Pribadi', icon: 'user' },
    { id: 'exp',    label: 'Pengalaman',   icon: 'briefcase' },
    { id: 'edu',    label: 'Pendidikan',   icon: 'graduation-cap' },
    { id: 'skills', label: 'Keahlian',     icon: 'layer-group' },
    { id: 'sum',    label: 'Ringkasan',    icon: 'align-left' },
    { id: 'export', label: 'Ekspor',       icon: 'download' },
  ];

  /* ── API ── */
  const api = async (url, opts = {}) => { const r = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts }); return r.json(); };

  /* ── CV helpers ── */
  const upd = (k, v) => setCv(p => ({ ...p, [k]: v }));
  const updP = (k, v) => setCv(p => ({ ...p, personal: { ...p.personal, [k]: v } }));
  const updS = (k, v) => setCv(p => ({ ...p, summary: { ...p.summary, [k]: v } }));
  const updA = (a, id, k, v) => setCv(p => ({ ...p, [a]: p[a].map(x => x.id === id ? { ...x, [k]: v } : x) }));
  const addA = (a, item) => setCv(p => ({ ...p, [a]: [...p[a], item] }));
  const delA = (a, id) => setCv(p => ({ ...p, [a]: p[a].filter(x => x.id !== id) }));

  /* ── LOGIN ── */
  async function handleLogin() {
    const e = emailIn.trim().toLowerCase();
    if (!e.includes('@')) return setLE('Format email tidak valid.');
    setLB(true); setLE('');
    const r = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: e, pin: pinIn }) });
    if (r.ok) {
      setUser(r); setEI(''); setPI('');
      if (r.role === 'admin') { loadAdminData(); setView('admin'); }
      else { await loadMyCvs(r.email); setView('dashboard'); }
    } else {
      setLE(r.msg || 'Login gagal.');
    }
    setLB(false);
  }

  /* ── REGISTER ── */
  async function handleRegister() {
    const { email, phone, name, pin, pinConfirm } = regForm;
    if (!email.includes('@')) return setRM({ type: 'err', text: 'Format email tidak valid.' });
    if (!phone.trim()) return setRM({ type: 'err', text: 'Nomor telepon wajib diisi.' });
    if (!pin.trim()) return setRM({ type: 'err', text: 'PIN wajib diisi.' });
    if (pin !== pinConfirm) return setRM({ type: 'err', text: 'Konfirmasi PIN tidak cocok.' });
    setRB(true); setRM({ type: '', text: '' });
    const r = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ email: email.toLowerCase().trim(), phone, name, pin }) });
    setRB(false);
    if (r.ok) { setRM({ type: 'ok', text: r.msg }); setRF({ email: '', phone: '', name: '', pin: '', pinConfirm: '' }); }
    else setRM({ type: 'err', text: r.msg });
  }

  /* ── SAVE PIN in waitlist for later approve ── */
  // We store PIN in register call. But since our sheet doesn't hold pin on waitlist,
  // Admin will set pin when approving. For now user sets it at register time and we pass to register API.
  // (See register API — it will be available when admin approves from waitlist they set PIN manually)

  /* ── LOGOUT ── */
  function logout() { setUser(null); setMyCvs([]); setAdminData({ users: [], waitlist: [] }); setView('login'); setCv(mkCV()); setStep(0); }

  /* ── LOAD MY CVs ── */
  const loadMyCvs = useCallback(async (email) => {
    setLoadingCvs(true);
    const r = await api(`/api/cvs?email=${encodeURIComponent(email)}`);
    if (r.ok) setMyCvs(r.data.sort((a, b) => b.lastModified - a.lastModified));
    setLoadingCvs(false);
  }, []);

  /* ── SAVE CV ── */
  async function saveCv() {
    if (!user?.email) return;
    setSaving(true);
    const payload = { ...cv, ownerEmail: user.email, lastModified: Date.now() };
    const r = await api('/api/cvs', { method: 'POST', body: JSON.stringify(payload) });
    if (r.ok) { setCv(payload); await loadMyCvs(user.email); }
    else alert('Gagal menyimpan: ' + r.msg);
    setSaving(false);
  }

  /* ── DELETE CV ── */
  async function deleteCv(e, id) {
    e.stopPropagation();
    if (!confirm('Hapus dokumen ini secara permanen?')) return;
    await api('/api/cvs', { method: 'DELETE', body: JSON.stringify({ id }) });
    await loadMyCvs(user.email);
    if (cv?.id === id) { setCv(mkCV()); setStep(0); }
  }

  /* ── LOAD ADMIN DATA ── */
  const loadAdminData = useCallback(async () => {
    setAdminLoading(true);
    const [ud, cd, al] = await Promise.all([api('/api/admin/users'), api('/api/cvs?admin=true'), api('/api/audit')]);
    if (ud.ok) setAdminData({ users: ud.users || [], waitlist: ud.waitlist || [] });
    if (cd.ok) setAdminCvs(cd.data || []);
    if (al.ok) setAuditLogs(al.data || []);
    setAdminLoading(false);
  }, []);

  /* ── ADMIN APPROVE ── */
  async function adminApprove(entry, customPin) {
    const r = await api('/api/admin/users', { method: 'POST', body: JSON.stringify({ email: entry.email, phone: entry.phone, name: entry.name, pin: customPin || '1234', fromWaitlist: true }) });
    if (r.ok) { setModal(null); loadAdminData(); }
    else alert('Gagal: ' + r.msg);
  }

  /* ── ADMIN DELETE USER ── */
  async function adminDeleteUser(email, docsOnly = false) {
    if (!confirm(docsOnly ? `Hapus semua dokumen ${email}?` : `Hapus pengguna ${email} beserta semua dokumennya?`)) return;
    await api('/api/admin/users', { method: 'DELETE', body: JSON.stringify({ email, deleteDocsOnly: docsOnly }) });
    loadAdminData();
  }

  /* ── EXPORT WORD ── */
  async function exportWord() {
    setExporting(true);
    try {
      const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } = await import('docx');
      const F = 'Arial'; const kids = [];
      const sh = t => new Paragraph({ children: [new TextRun({ text: t.toUpperCase(), bold: true, size: 23, font: F })], border: { bottom: { color: '111111', space: 1, value: BorderStyle.SINGLE, size: 6 } }, spacing: { before: 260, after: 130 } });
      kids.push(new Paragraph({ children: [new TextRun({ text: (cv.personal?.fullName || 'NAMA').toUpperCase(), bold: true, size: 30, font: F })], spacing: { after: 80 } }));
      const cp = [cv.personal?.location, cv.personal?.phone, cv.personal?.email, cv.personal?.linkedin?.replace(/^https?:\/\//, '')].filter(Boolean).join(' • ');
      if (cp) kids.push(new Paragraph({ children: [new TextRun({ text: cp, size: 20, font: F })], spacing: { after: 220 } }));
      if (cv.summary?.text) { kids.push(sh('Profil Singkat')); kids.push(new Paragraph({ children: [new TextRun({ text: cv.summary.text, size: 22, font: F })], alignment: AlignmentType.JUSTIFIED, spacing: { line: 276, after: 80 } })); }
      if (cv.education?.length) { kids.push(sh('Pendidikan')); cv.education.forEach(e => { kids.push(new Paragraph({ children: [new TextRun({ text: [e.degree, e.field, e.gpa ? `IPK ${e.gpa}` : ''].filter(Boolean).join(' • '), bold: true, size: 22, font: F })], spacing: { after: 40 } })); kids.push(new Paragraph({ children: [new TextRun({ text: [`${fmtD(e.start)} – ${fmtD(e.end)}`, e.school].filter(Boolean).join(' • '), size: 22, font: F })], spacing: { after: 60 } })); (e.notes || '').split('\n').filter(Boolean).forEach(l => kids.push(new Paragraph({ children: [new TextRun({ text: l.replace(/^•\s*/, ''), size: 21, font: F })], bullet: { level: 0 }, spacing: { after: 40 } }))); }); }
      if (cv.experience?.length) { kids.push(sh('Pengalaman Kerja')); cv.experience.forEach(e => { kids.push(new Paragraph({ children: [new TextRun({ text: [e.role, e.company].filter(Boolean).join(' — '), bold: true, size: 22, font: F })], spacing: { after: 40 } })); kids.push(new Paragraph({ children: [new TextRun({ text: `${fmtD(e.start)} – ${e.current ? 'Sekarang' : fmtD(e.end)}`, size: 22, font: F })], spacing: { after: 60 } })); (e.desc || '').split('\n').filter(Boolean).forEach(l => kids.push(new Paragraph({ children: [new TextRun({ text: l.replace(/^•\s*/, ''), size: 21, font: F })], bullet: { level: 0 }, spacing: { after: 40, line: 276 } }))); kids.push(new Paragraph({ text: '', spacing: { after: 60 } })); }); }
      if (cv.certifications?.length) { kids.push(sh('Sertifikasi')); cv.certifications.forEach(c => kids.push(new Paragraph({ children: [new TextRun({ text: [c.name, c.issuer, c.year].filter(Boolean).join(' / '), size: 21, font: F })], bullet: { level: 0 }, spacing: { after: 50 } }))); }
      const sk = (cv.skills || []).filter(s => s?.trim()); const ln = cv.languages || [];
      if (sk.length || ln.length) { kids.push(sh('Keahlian')); if (sk.length) kids.push(new Paragraph({ children: [new TextRun({ text: 'Teknis: ', bold: true, size: 22, font: F }), new TextRun({ text: sk.join(', '), size: 22, font: F })], spacing: { after: 60 } })); if (ln.length) kids.push(new Paragraph({ children: [new TextRun({ text: 'Bahasa: ', bold: true, size: 22, font: F }), new TextRun({ text: ln.map(l => `${l.name} (${l.level})`).join(', '), size: 22, font: F })], spacing: { after: 60 } })); }
      const doc = new Document({ sections: [{ properties: { page: { margin: { top: 1260, right: 1260, bottom: 1260, left: 1260 } } }, children: kids }] });
      const blob = await Packer.toBlob(doc);
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${cv.title || 'CV'}.docx`; a.click();
    } catch (err) { alert('Gagal ekspor: ' + err.message); }
    setExporting(false);
  }

  /* ── STEP RENDERER ── */
  const fb = { background: 'var(--w)', border: '1.5px solid var(--g200)', borderRadius: 'var(--r3)', padding: '22px 24px', marginBottom: 16 };

  function renderStep() {
    const sid = STEPS[step].id;

    if (sid === 'target') return (
      <div className="fu">
        <h2 className="disp" style={{ fontSize: 22, color: 'var(--navy)', marginBottom: 4 }}>Target Posisi</h2>
        <p style={{ fontSize: 13, color: 'var(--g500)', marginBottom: 20 }}>Tentukan tujuan strategis CV Anda agar AI dapat mengoptimalkan setiap bagian.</p>
        <div style={fb}>
          <Fld label="Nama Dokumen" value={cv.title} onChange={v => upd('title', v)} placeholder="Contoh: CV Senior Analyst 2025" />
          <Fld label="Target Posisi Pekerjaan" value={cv.targetRole} onChange={v => upd('targetRole', v)} placeholder="Contoh: Product Manager / Data Scientist" />
          <Lbl c="Level Karir" />
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {['Lulusan Baru', 'Profesional', 'Eksekutif'].map(lv => (
              <button key={lv} onClick={() => upd('level', lv)} className={cv.level === lv ? 'btn btn-navy btn-sm' : 'btn btn-out btn-sm'} style={{ flex: 1 }}>{lv}</button>
            ))}
          </div>
        </div>
      </div>
    );

    if (sid === 'info') return (
      <div className="fu">
        <h2 className="disp" style={{ fontSize: 22, color: 'var(--navy)', marginBottom: 4 }}>Data Pribadi</h2>
        <p style={{ fontSize: 13, color: 'var(--g500)', marginBottom: 20 }}>Informasi kontak di bagian atas CV Anda.</p>
        <div style={fb}>
          <G2 ch={<>
            <Fld label="Nama Lengkap" value={cv.personal.fullName} onChange={v => updP('fullName', v)} placeholder="Sesuai identitas resmi" required />
            <Fld label="Jabatan / Profesi" value={cv.personal.jobTitle} onChange={v => updP('jobTitle', v)} placeholder="Software Engineer" />
            <Fld label="Email" value={cv.personal.email} onChange={v => updP('email', v)} type="email" placeholder="nama@email.com" />
            <Fld label="Nomor Telepon" value={cv.personal.phone} onChange={v => updP('phone', v)} placeholder="+62 812 xxxx xxxx" />
            <Fld label="Kota / Domisili" value={cv.personal.location} onChange={v => updP('location', v)} placeholder="Jakarta Selatan" />
            <Fld label="URL LinkedIn" value={cv.personal.linkedin} onChange={v => updP('linkedin', v)} placeholder="linkedin.com/in/username" />
          </>} />
        </div>
      </div>
    );

    if (sid === 'exp') return (
      <div className="fu">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <div>
            <h2 className="disp" style={{ fontSize: 22, color: 'var(--navy)', marginBottom: 4 }}>Pengalaman Kerja</h2>
            <p style={{ fontSize: 13, color: 'var(--g500)' }}>Mulai dari posisi paling baru.</p>
          </div>
          <button className="btn btn-blue btn-sm" onClick={() => addA('experience', mkExp())}><I i="plus" sz={12} /> Tambah</button>
        </div>
        {cv.experience.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px', border: '2px dashed var(--g200)', borderRadius: 'var(--r3)', color: 'var(--g400)' }}><I i="briefcase" sz={24} s={{ display: 'block', margin: '0 auto 10px' }} /><div style={{ fontSize: 13 }}>Belum ada pengalaman. Klik Tambah.</div></div>}
        {cv.experience.map((exp, idx) => (
          <div key={exp.id} style={{ ...fb, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--blue-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--blue)' }}>{idx + 1}</div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--g700)' }}>{exp.role || exp.company || 'Posisi Baru'}</span>
              </div>
              <button className="btn btn-red btn-xs" onClick={() => delA('experience', exp.id)}><I i="trash" sz={11} /></button>
            </div>
            <G2 ch={<>
              <Fld label="Posisi / Jabatan" value={exp.role} onChange={v => updA('experience', exp.id, 'role', v)} placeholder="Product Manager" />
              <Fld label="Perusahaan" value={exp.company} onChange={v => updA('experience', exp.id, 'company', v)} placeholder="PT. Contoh Indonesia" />
              <Fld label="Mulai (Bln Thn)" value={exp.start} onChange={v => updA('experience', exp.id, 'start', v)} placeholder="Jan 2022" />
              {!exp.current && <Fld label="Selesai (Bln Thn)" value={exp.end} onChange={v => updA('experience', exp.id, 'end', v)} placeholder="Des 2024" />}
            </>} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--g600)', cursor: 'pointer', marginBottom: 12, userSelect: 'none' }}>
              <input type="checkbox" checked={exp.current} onChange={e => updA('experience', exp.id, 'current', e.target.checked)} style={{ accentColor: 'var(--blue)', width: 14, height: 14 }} /> Masih bekerja di sini
            </label>
            <AIBox label="Deskripsi Pekerjaan" value={exp.desc} onChange={v => updA('experience', exp.id, 'desc', v)} placeholder="Ceritakan tanggung jawab dan pencapaian Anda, lalu klik 'Optimalkan (STAR)'..." role={cv.targetRole} />
          </div>
        ))}
      </div>
    );

    if (sid === 'edu') return (
      <div className="fu">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <div>
            <h2 className="disp" style={{ fontSize: 22, color: 'var(--navy)', marginBottom: 4 }}>Pendidikan</h2>
            <p style={{ fontSize: 13, color: 'var(--g500)' }}>Riwayat pendidikan formal.</p>
          </div>
          <button className="btn btn-blue btn-sm" onClick={() => addA('education', mkEdu())}><I i="plus" sz={12} /> Tambah</button>
        </div>
        {cv.education.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px', border: '2px dashed var(--g200)', borderRadius: 'var(--r3)', color: 'var(--g400)' }}><I i="graduation-cap" sz={24} s={{ display: 'block', margin: '0 auto 10px' }} /><div style={{ fontSize: 13 }}>Belum ada data pendidikan.</div></div>}
        {cv.education.map((edu, idx) => (
          <div key={edu.id} style={{ ...fb, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--teal-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--teal)' }}>{idx + 1}</div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--g700)' }}>{edu.school || 'Institusi Baru'}</span>
              </div>
              <button className="btn btn-red btn-xs" onClick={() => delA('education', edu.id)}><I i="trash" sz={11} /></button>
            </div>
            <G2 ch={<>
              <Fld label="Gelar (D1/S1/S2/dll)" value={edu.degree} onChange={v => updA('education', edu.id, 'degree', v)} />
              <Fld label="Jurusan / Program Studi" value={edu.field} onChange={v => updA('education', edu.id, 'field', v)} />
              <Fld label="Institusi / Universitas" value={edu.school} onChange={v => updA('education', edu.id, 'school', v)} />
              <Fld label="IPK / Nilai Rata-rata" value={edu.gpa} onChange={v => updA('education', edu.id, 'gpa', v)} placeholder="3.85" />
              <Fld label="Mulai" value={edu.start} onChange={v => updA('education', edu.id, 'start', v)} placeholder="Ags 2018" />
              <Fld label="Tahun Lulus" value={edu.end} onChange={v => updA('education', edu.id, 'end', v)} placeholder="Jul 2022" />
            </>} />
            <AIBox label="Prestasi & Kegiatan Relevan" value={edu.notes} onChange={v => updA('education', edu.id, 'notes', v)} placeholder="Organisasi, beasiswa, atau prestasi akademik..." role={cv.targetRole} />
          </div>
        ))}
      </div>
    );

    if (sid === 'skills') return (
      <div className="fu">
        <h2 className="disp" style={{ fontSize: 22, color: 'var(--navy)', marginBottom: 4 }}>Keahlian</h2>
        <p style={{ fontSize: 13, color: 'var(--g500)', marginBottom: 20 }}>Skills, bahasa, dan sertifikasi.</p>
        <div style={fb}>
          <SkillChips skills={cv.skills || []} onChange={v => upd('skills', v)} targetRole={cv.targetRole} />
        </div>
        <div style={fb}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Lbl c="Bahasa" />
            <button className="btn btn-out btn-xs" onClick={() => addA('languages', { id: 'l' + Date.now(), name: '', level: 'Fasih' })}><I i="plus" sz={10} /> Tambah</button>
          </div>
          {cv.languages.map(l => (
            <div key={l.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <input className="inp" value={l.name} onChange={e => updA('languages', l.id, 'name', e.target.value)} placeholder="Nama Bahasa" style={{ flex: 1 }} />
              <select className="inp" value={l.level} onChange={e => updA('languages', l.id, 'level', e.target.value)} style={{ width: 120 }}>
                {['Dasar', 'Menengah', 'Mahir', 'Fasih', 'Native'].map(lv => <option key={lv}>{lv}</option>)}
              </select>
              <button className="btn btn-red btn-xs" onClick={() => delA('languages', l.id)}><I i="trash" sz={11} /></button>
            </div>
          ))}
        </div>
        <div style={fb}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Lbl c="Sertifikasi & Pelatihan" />
            <button className="btn btn-out btn-xs" onClick={() => addA('certifications', { id: 'c' + Date.now(), name: '', issuer: '', year: '' })}><I i="plus" sz={10} /> Tambah</button>
          </div>
          {cv.certifications.map(c => (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 32px', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <input className="inp" value={c.name} onChange={e => updA('certifications', c.id, 'name', e.target.value)} placeholder="Nama Sertifikasi" />
              <input className="inp" value={c.issuer} onChange={e => updA('certifications', c.id, 'issuer', e.target.value)} placeholder="Penerbit" />
              <input className="inp" value={c.year} onChange={e => updA('certifications', c.id, 'year', e.target.value)} placeholder="Tahun" />
              <button className="btn btn-red btn-xs" onClick={() => delA('certifications', c.id)}><I i="trash" sz={11} /></button>
            </div>
          ))}
        </div>
      </div>
    );

    if (sid === 'sum') return (
      <div className="fu">
        <h2 className="disp" style={{ fontSize: 22, color: 'var(--navy)', marginBottom: 4 }}>Ringkasan Profil</h2>
        <p style={{ fontSize: 13, color: 'var(--g500)', marginBottom: 20 }}>Paragraf pembuka 3–4 kalimat yang merangkum nilai jual utama Anda.</p>
        <div style={fb}>
          <AIBox label="Executive Summary" value={cv.summary.text} onChange={v => updS('text', v)} placeholder="Tulis ringkasan singkat atau ide kasar Anda, lalu klik 'Sintesis AI' untuk versi profesional..." role={cv.targetRole} type="sum" />
          <div style={{ padding: '12px 16px', background: 'var(--blue-pale)', borderRadius: 'var(--r1)', fontSize: 12, color: 'var(--blue)' }}>
            <I i="lightbulb" sz={12} /> <strong>Tips ATS:</strong> Sertakan level pengalaman, 2–3 kompetensi kunci, dan nilai yang Anda bawa ke perusahaan.
          </div>
        </div>
      </div>
    );

    if (sid === 'export') return (
      <div className="fu">
        <h2 className="disp" style={{ fontSize: 22, color: 'var(--navy)', marginBottom: 4 }}>Ekspor CV</h2>
        <p style={{ fontSize: 13, color: 'var(--g500)', marginBottom: 20 }}>CV Anda siap! Simpan atau unduh dalam format pilihan.</p>
        <div style={{ ...fb, background: 'var(--green-pale)', borderColor: '#86EFAC', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><I i="check" sz={16} s={{ color: 'white' }} /></div>
          <div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)' }}>CV Siap Diunduh!</div><div style={{ fontSize: 12, color: 'var(--g600)' }}>Simpan ke akun agar bisa diedit kapan saja, atau langsung ekspor.</div></div>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          {[
            { icon: 'cloud-arrow-up', bg: 'var(--navy)', title: 'Simpan ke Akun', desc: 'CV tersimpan permanen & bisa diedit kapan saja', action: <button className="btn btn-navy" disabled={saving} onClick={saveCv}>{saving ? <Spin sz={13} col="#fff" /> : <I i="cloud-arrow-up" sz={13} />} Simpan</button> },
            { icon: 'file-pdf', bg: '#D93025', title: 'Ekspor PDF', desc: 'Cetak sebagai PDF — format siap kirim ke rekruter', action: <button className="btn btn-out" onClick={() => window.print()}><I i="print" sz={13} /> Cetak / PDF</button> },
            { icon: 'file-word', bg: '#1B5FD4', title: 'Unduh Word (.docx)', desc: 'Format yang bisa diedit di Microsoft Word atau Google Docs', action: <button className="btn btn-out" disabled={exporting} onClick={exportWord}>{exporting ? <Spin sz={13} /> : <I i="download" sz={13} />} Unduh</button> },
          ].map(row => (
            <div key={row.title} style={{ ...fb, marginBottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: row.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><I i={row.icon} sz={18} s={{ color: 'white' }} /></div>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{row.title}</div><div style={{ fontSize: 11, color: 'var(--g500)' }}>{row.desc}</div></div>
              </div>
              {row.action}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ═══════════════ LOGIN VIEW ══════════════════════════════ */
  if (view === 'login') return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }} className="no-print">
      <div className="grid-bg" style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(27,95,212,.3) 0%, transparent 60%), radial-gradient(ellipse 40% 30% at 85% 80%, rgba(11,158,138,.15) 0%, transparent 50%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="fu"><Logo inv size={36} /></div>
          <p className="fu d2" style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 14, letterSpacing: '.1em', textTransform: 'uppercase' }}>Platform Eksklusif</p>
        </div>

        <div className="fu d1" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 'var(--r4)', padding: '32px 28px', backdropFilter: 'blur(16px)' }}>
          <h2 className="disp" style={{ fontSize: 24, color: '#fff', marginBottom: 6 }}>Masuk ke Akun</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', marginBottom: 24, lineHeight: 1.5 }}>Masukkan email dan PIN Anda untuk melanjutkan.</p>

          <Fld label="Alamat Email" value={emailIn} onChange={setEI} type="email" placeholder="nama@email.com" dark />
          <Fld label="PIN" value={pinIn} onChange={setPI} type="password" placeholder="PIN Anda" dark />

          {loginErr && <div style={{ padding: '10px 14px', background: 'rgba(217,48,37,.13)', border: '1px solid rgba(217,48,37,.3)', borderRadius: 8, fontSize: 12, color: '#FCA5A5', marginBottom: 16, lineHeight: 1.5 }}>{loginErr}</div>}

          <button className="btn btn-blue" disabled={loginBusy} onClick={handleLogin} style={{ width: '100%', padding: 11, fontSize: 13, marginBottom: 10 }}>
            {loginBusy ? <><Spin sz={14} col="#fff" /> Memverifikasi…</> : <><I i="shield-halved" sz={14} /> Masuk</>}
          </button>
          <button className="btn btn-ghost" onClick={() => { setView('register'); setLE(''); }} style={{ width: '100%', color: 'rgba(255,255,255,.4)', fontSize: 12 }}>
            Belum punya akun? <span style={{ color: 'rgba(107,160,245,.9)', fontWeight: 600 }}>Daftar di sini</span>
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,.18)', marginTop: 24 }}>© {new Date().getFullYear()} Azandhi Academy</p>
      </div>
    </div>
  );

  /* ═══════════════ REGISTER VIEW ══════════════════════════ */
  if (view === 'register') return (
    <div style={{ minHeight: '100vh', background: 'var(--navy)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }} className="no-print">
      <div className="grid-bg" style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(11,158,138,.2) 0%, transparent 60%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="fu"><Logo inv size={32} /></div>
        </div>

        <div className="fu d1" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 'var(--r4)', padding: '28px', backdropFilter: 'blur(16px)' }}>
          <h2 className="disp" style={{ fontSize: 22, color: '#fff', marginBottom: 4 }}>Daftar Akses</h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.38)', marginBottom: 22, lineHeight: 1.5 }}>Isi formulir berikut. Admin akan memproses permintaan Anda.</p>

          <G2 ch={<>
            <Fld label="Nama Lengkap" value={regForm.name} onChange={v => setRF(p => ({ ...p, name: v }))} placeholder="Nama Anda" dark />
            <Fld label="Email *" value={regForm.email} onChange={v => setRF(p => ({ ...p, email: v }))} type="email" placeholder="nama@email.com" dark />
          </>} />
          <Fld label="Nomor Telepon *" value={regForm.phone} onChange={v => setRF(p => ({ ...p, phone: v }))} placeholder="+62 812 xxxx xxxx" dark />
          <G2 ch={<>
            <Fld label="Buat PIN *" value={regForm.pin} onChange={v => setRF(p => ({ ...p, pin: v }))} type="password" placeholder="Min 4 karakter" dark />
            <Fld label="Konfirmasi PIN *" value={regForm.pinConfirm} onChange={v => setRF(p => ({ ...p, pinConfirm: v }))} type="password" placeholder="Ulangi PIN" dark />
          </>} />

          {regMsg.text && <div style={{ padding: '10px 14px', background: regMsg.type === 'ok' ? 'rgba(26,154,82,.13)' : 'rgba(217,48,37,.13)', border: `1px solid ${regMsg.type === 'ok' ? 'rgba(26,154,82,.3)' : 'rgba(217,48,37,.3)'}`, borderRadius: 8, fontSize: 12, color: regMsg.type === 'ok' ? '#86EFAC' : '#FCA5A5', marginBottom: 16, lineHeight: 1.5 }}>{regMsg.text}</div>}

          <button className="btn btn-teal" disabled={regBusy} onClick={handleRegister} style={{ width: '100%', padding: 11, fontSize: 13, marginBottom: 10 }}>
            {regBusy ? <><Spin sz={14} col="#fff" /> Mengirim…</> : <><I i="paper-plane" sz={14} /> Kirim Permintaan Akses</>}
          </button>
          <button className="btn btn-ghost" onClick={() => { setView('login'); setRM({ type: '', text: '' }); }} style={{ width: '100%', color: 'rgba(255,255,255,.4)', fontSize: 12 }}>
            ← Kembali ke Login
          </button>
        </div>
      </div>
    </div>
  );

  /* ═══════════════ DASHBOARD VIEW ══════════════════════════ */
  if (view === 'dashboard') return (
    <div style={{ minHeight: '100vh', background: 'var(--g50)' }} className="no-print">
      <nav className="app-nav">
        <Logo size={24} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right', marginRight: 4 }}>
            <div className="sub-label">Workspace</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginTop: 1 }}>{user?.name || user?.email}</div>
          </div>
          <div style={{ width: 1, height: 24, background: 'var(--g200)' }} />
          <button className="btn btn-ghost btn-sm" onClick={logout}><I i="arrow-right-from-bracket" sz={13} /></button>
        </div>
      </nav>

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '36px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
          <div>
            <div className="sub-label" style={{ marginBottom: 6 }}>Dokumen Saya</div>
            <h1 className="disp" style={{ fontSize: 28, color: 'var(--navy)' }}>Workspace CV</h1>
          </div>
          <button className="btn btn-navy" onClick={() => { setCv(mkCV()); setStep(0); setView('builder'); }}><I i="plus" sz={14} /> Buat CV Baru</button>
        </div>

        {loadingCvs ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--g400)' }}><Spin sz={24} col="var(--g400)" /></div>
        ) : myCvs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: 'white', borderRadius: 'var(--r4)', border: '2px dashed var(--g200)' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--blue-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><I i="file-circle-plus" sz={24} s={{ color: 'var(--blue)' }} /></div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>Workspace Masih Kosong</h3>
            <p style={{ fontSize: 13, color: 'var(--g500)', marginBottom: 20 }}>Buat CV pertama Anda sekarang.</p>
            <button className="btn btn-navy" onClick={() => { setCv(mkCV()); setStep(0); setView('builder'); }}><I i="wand-magic-sparkles" sz={14} /> Buat CV Sekarang</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
            {myCvs.map(cvItem => (
              <div key={cvItem.id} className="card hover-card" style={{ padding: '20px', position: 'relative' }} onClick={() => { setCv({ ...cvItem }); setStep(0); setView('builder'); }}>
                <button onClick={e => deleteCv(e, cvItem.id)} className="btn btn-red btn-xs" style={{ position: 'absolute', top: 12, right: 12, opacity: 0, transition: 'opacity .15s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                  <I i="trash" sz={11} />
                </button>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,var(--blue),var(--teal))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><I i="file-lines" sz={17} s={{ color: 'white' }} /></div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 4, paddingRight: 28, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cvItem.title}</div>
                <span className="badge badge-blue" style={{ marginBottom: 10, fontSize: 10 }}>{cvItem.targetRole || 'Draft'}</span>
                <div style={{ fontSize: 11, color: 'var(--g400)', borderTop: '1px solid var(--g100)', paddingTop: 10, marginTop: 6 }}>
                  {cvItem.lastModified ? new Date(Number(cvItem.lastModified)).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );

  /* ═══════════════ BUILDER VIEW ════════════════════════════ */
  if (view === 'builder') return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--g50)' }}>
      {/* TOP BAR */}
      <nav className="app-nav no-print" style={{ height: 56, padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setView(user ? 'dashboard' : 'login')} style={{ flexShrink: 0 }}><I i="arrow-left" sz={13} /></button>
          <Logo size={22} />
          <div style={{ width: 1, height: 20, background: 'var(--g200)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cv.title || 'CV Baru'}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {user && <button className="btn btn-out btn-sm" disabled={saving} onClick={saveCv}>{saving ? <Spin sz={12} /> : <I i="cloud-arrow-up" sz={12} />} Simpan</button>}
          <button className="btn btn-navy btn-sm" onClick={() => setStep(STEPS.length - 1)}>Ekspor <I i="download" sz={12} /></button>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* SIDEBAR */}
        <aside className="no-print" style={{ width: 196, background: 'white', borderRight: '1px solid var(--g200)', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
          <div style={{ padding: '14px 12px', borderBottom: '1px solid var(--g100)' }}>
            <div className="sub-label" style={{ marginBottom: 3 }}>CV Builder</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cv.title || 'CV Baru'}</div>
          </div>
          <nav style={{ flex: 1, padding: '8px' }}>
            {STEPS.map((s, i) => (
              <div key={i} className={`step-item${step === i ? ' on' : i < step ? ' done' : ''}`} onClick={() => setStep(i)}>
                <div className="step-num">{i < step ? <I i="check" sz={9} /> : i + 1}</div>
                <div className="step-label">{s.label}</div>
              </div>
            ))}
          </nav>
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--g100)' }}>
            <div style={{ height: 4, background: 'var(--g200)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg,var(--blue),var(--teal))', width: `${(step / (STEPS.length - 1)) * 100}%`, transition: 'width .3s ease', borderRadius: 4 }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--g400)', marginTop: 5, textAlign: 'center' }}>Step {step + 1} / {STEPS.length}</div>
          </div>
        </aside>

        {/* FORM */}
        <section className="no-print" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', maxWidth: 760, width: '100%' }}>
            {renderStep()}
          </div>
          <div style={{ background: 'white', borderTop: '1px solid var(--g200)', padding: '12px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn btn-ghost" disabled={step === 0} onClick={() => setStep(s => s - 1)} style={{ opacity: step === 0 ? .4 : 1 }}><I i="arrow-left" sz={13} /> Kembali</button>
            <div style={{ display: 'flex', gap: 8 }}>
              {step < STEPS.length - 1
                ? <button className="btn btn-navy" onClick={() => setStep(s => s + 1)}>Lanjut <I i="arrow-right" sz={13} /></button>
                : <button className="btn btn-blue" onClick={() => window.print()}><I i="print" sz={13} /> Cetak PDF</button>}
            </div>
          </div>
        </section>

        {/* PREVIEW */}
        <aside style={{ width: 460, background: 'var(--g100)', borderLeft: '1px solid var(--g200)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
          <div className="no-print" style={{ padding: '10px 16px', borderBottom: '1px solid var(--g200)', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <span className="sub-label"><I i="eye" sz={10} /> Pratinjau ATS</span>
            <span className="badge badge-teal"><I i="check" sz={9} /> Format Bersih</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', justifyContent: 'center' }}>
            <CvPreview cv={cv} />
          </div>
        </aside>
      </div>
    </div>
  );

  /* ═══════════════ ADMIN VIEW ══════════════════════════════ */
  if (view === 'admin') {
    const approveModal = modal?.type === 'approve' ? modal.data : null;
    const userDetail  = modal?.type === 'userdetail' ? modal.data : null;

    return (
      <div style={{ minHeight: '100vh', background: 'var(--g50)' }} className="no-print">
        <nav className="app-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Logo size={24} />
            <span className="badge badge-navy" style={{ fontSize: 10 }}><I i="shield-halved" sz={10} /> Admin Panel</span>
            {adminLoading && <Spin sz={13} col="var(--g400)" />}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-out btn-sm" onClick={loadAdminData}><I i="arrows-rotate" sz={12} /> Refresh</button>
            <button className="btn btn-ghost btn-sm" onClick={logout}><I i="arrow-right-from-bracket" sz={13} /></button>
          </div>
        </nav>

        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 28px' }}>
          {/* HEADER */}
          <div style={{ marginBottom: 28 }}>
            <div className="sub-label" style={{ marginBottom: 6 }}>Dashboard Admin</div>
            <h1 className="disp" style={{ fontSize: 28, color: 'var(--navy)' }}>Manajemen Pengguna & Dokumen</h1>
          </div>

          {/* STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
            {[
              ['users', 'Pengguna Aktif', adminData.users.length, 'var(--green)', 'var(--green-pale)'],
              ['clock', 'Menunggu Approve', adminData.waitlist.length, 'var(--amber)', 'var(--amber-pale)'],
              ['file-lines', 'Total Dokumen', adminCvs.length, 'var(--blue)', 'var(--blue-pale)'],
              ['list-check', 'Log Aktivitas', auditLogs.length, 'var(--teal)', 'var(--teal-pale)'],
            ].map(([icon, label, count, color, bg]) => (
              <div key={label} className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="sub-label" style={{ marginBottom: 6 }}>{label}</div>
                    <div className="disp" style={{ fontSize: 38, color: 'var(--navy)', lineHeight: 1 }}>{count}</div>
                  </div>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <I i={icon} sz={20} s={{ color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* TABS */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--g100)', padding: 4, borderRadius: 10, width: 'fit-content', flexWrap: 'wrap' }}>
            {[['users', 'Pengguna Aktif'], ['waitlist', 'Waitlist'], ['documents', 'Semua Dokumen'], ['audit', 'Log Aktivitas']].map(([tab, label]) => (
              <button key={tab} onClick={() => setAdminTab(tab)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s', border: 'none', background: adminTab === tab ? 'white' : 'transparent', color: adminTab === tab ? 'var(--navy)' : 'var(--g500)', boxShadow: adminTab === tab ? 'var(--s1)' : 'none', fontFamily: "'Outfit',sans-serif" }}>{label}</button>
            ))}
          </div>

          {/* ── TAB: USERS ── */}
          {adminTab === 'users' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--g100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Pengguna Terdaftar ({adminData.users.length})</span>
              </div>
              {adminData.users.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--g400)', fontSize: 13 }}>Belum ada pengguna aktif.</div> : (
                <table className="tbl">
                  <thead><tr><th>Nama</th><th>Email</th><th>Telepon</th><th>Disetujui</th><th>Dokumen</th><th>Aksi</th></tr></thead>
                  <tbody>
                    {adminData.users.map((u, i) => {
                      const userCvCount = adminCvs.filter(c => c.ownerEmail === u.email).length;
                      return (
                        <tr key={i}>
                          <td><span style={{ fontWeight: 600, color: 'var(--navy)' }}>{u.name || '—'}</span></td>
                          <td>{u.email}</td>
                          <td>{u.phone || '—'}</td>
                          <td><span style={{ fontSize: 11, color: 'var(--g500)' }}>{u.approvedAt ? new Date(u.approvedAt).toLocaleDateString('id-ID') : '—'}</span></td>
                          <td><span className="badge badge-blue">{userCvCount} CV</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn btn-amber btn-xs" onClick={() => setModal({ type: 'userdetail', data: { ...u, cvs: adminCvs.filter(c => c.ownerEmail === u.email) } })}><I i="eye" sz={10} /> Detail</button>
                              <button className="btn btn-red btn-xs" onClick={() => adminDeleteUser(u.email, true)}><I i="file-circle-xmark" sz={10} /> Hapus Dok</button>
                              <button className="btn btn-red btn-xs" onClick={() => adminDeleteUser(u.email, false)}><I i="trash" sz={10} /> Hapus</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── TAB: WAITLIST ── */}
          {adminTab === 'waitlist' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--g100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Permintaan Akses ({adminData.waitlist.length})</span>
              </div>
              {adminData.waitlist.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--g400)', fontSize: 13 }}>Tidak ada permintaan masuk.</div> : (
                <table className="tbl">
                  <thead><tr><th>Nama</th><th>Email</th><th>Telepon</th><th>Tanggal Daftar</th><th>Aksi</th></tr></thead>
                  <tbody>
                    {adminData.waitlist.map((w, i) => (
                      <tr key={i}>
                        <td><span style={{ fontWeight: 600 }}>{w.name || '—'}</span></td>
                        <td>{w.email}</td>
                        <td>{w.phone}</td>
                        <td style={{ fontSize: 11, color: 'var(--g500)' }}>{w.requestedAt ? new Date(w.requestedAt).toLocaleDateString('id-ID') : '—'}</td>
                        <td><button className="btn btn-green btn-xs" onClick={() => setModal({ type: 'approve', data: w })}><I i="check" sz={11} /> Setujui</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── TAB: DOCUMENTS ── */}
          {adminTab === 'documents' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--g100)' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Semua Dokumen CV ({adminCvs.length})</span>
              </div>
              {adminCvs.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--g400)', fontSize: 13 }}>Belum ada dokumen.</div> : (
                <table className="tbl">
                  <thead><tr><th>Judul</th><th>Pemilik</th><th>Target Posisi</th><th>Terakhir Diubah</th><th>Aksi</th></tr></thead>
                  <tbody>
                    {adminCvs.map((c, i) => (
                      <tr key={i}>
                        <td><span style={{ fontWeight: 600, color: 'var(--navy)' }}>{c.title}</span></td>
                        <td style={{ fontSize: 12, color: 'var(--g600)' }}>{c.ownerEmail}</td>
                        <td><span className="badge badge-blue" style={{ fontSize: 10 }}>{c.targetRole || 'Draft'}</span></td>
                        <td style={{ fontSize: 11, color: 'var(--g500)' }}>{c.lastModified ? new Date(Number(c.lastModified)).toLocaleDateString('id-ID') : '—'}</td>
                        <td>
                          <button className="btn btn-red btn-xs" onClick={async () => { if (!confirm('Hapus dokumen ini?')) return; await api('/api/cvs', { method: 'DELETE', body: JSON.stringify({ id: c.id }) }); loadAdminData(); }}><I i="trash" sz={11} /> Hapus</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── TAB: AUDIT ── */}
          {adminTab === 'audit' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--g100)' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Log Aktivitas ({auditLogs.length})</span>
              </div>
              {auditLogs.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--g400)', fontSize: 13 }}>Belum ada aktivitas.</div> : (
                <table className="tbl">
                  <thead><tr><th>Waktu</th><th>Aksi</th><th>Target</th><th>Detail</th></tr></thead>
                  <tbody>
                    {auditLogs.slice(0, 50).map((l, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: 11, color: 'var(--g500)', whiteSpace: 'nowrap' }}>{fmtTs(l.timestamp)}</td>
                        <td><span className={`badge ${l.action?.includes('DELETE') ? 'badge-red' : l.action?.includes('APPROVE') ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 10 }}>{l.action}</span></td>
                        <td style={{ fontSize: 12 }}>{l.target}</td>
                        <td style={{ fontSize: 11, color: 'var(--g500)' }}>{l.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </main>

        {/* ── MODAL: APPROVE ── */}
        {approveModal && (
          <ApproveModal entry={approveModal} onClose={() => setModal(null)} onConfirm={adminApprove} />
        )}

        {/* ── MODAL: USER DETAIL ── */}
        {userDetail && (
          <div className="modal-bg" onClick={() => setModal(null)}>
            <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <h3 className="disp" style={{ fontSize: 20, color: 'var(--navy)', marginBottom: 3 }}>{userDetail.name || 'Pengguna'}</h3>
                  <p style={{ fontSize: 12, color: 'var(--g500)' }}>{userDetail.email}</p>
                </div>
                <button className="btn btn-ghost btn-xs" onClick={() => setModal(null)}><I i="xmark" sz={14} /></button>
              </div>
              <Div />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', marginBottom: 20 }}>
                {[['Telepon', userDetail.phone || '—'], ['Disetujui', userDetail.approvedAt ? new Date(userDetail.approvedAt).toLocaleDateString('id-ID') : '—'], ['Total Dokumen', userDetail.cvs?.length || 0]].map(([l, v]) => (
                  <div key={l}><div className="sub-label" style={{ marginBottom: 2 }}>{l}</div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{v}</div></div>
                ))}
              </div>
              {userDetail.cvs?.length > 0 && <>
                <div className="sub-label" style={{ marginBottom: 8 }}>Dokumen CV</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {userDetail.cvs.map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--g50)', borderRadius: 8 }}>
                      <div><div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy)' }}>{c.title}</div><div style={{ fontSize: 10, color: 'var(--g500)' }}>{c.targetRole}</div></div>
                      <button className="btn btn-red btn-xs" onClick={async () => { await api('/api/cvs', { method: 'DELETE', body: JSON.stringify({ id: c.id }) }); loadAdminData(); setModal(null); }}><I i="trash" sz={10} /></button>
                    </div>
                  ))}
                </div>
              </>}
              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button className="btn btn-red btn-sm" style={{ flex: 1 }} onClick={() => { adminDeleteUser(userDetail.email, false); setModal(null); }}>Hapus Pengguna</button>
                <button className="btn btn-out btn-sm" onClick={() => setModal(null)}>Tutup</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

/* ─── APPROVE MODAL ─────────────────────────────────────────── */
function ApproveModal({ entry, onClose, onConfirm }) {
  const [pin, setPin] = useState('1234');
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!pin.trim()) return alert('PIN wajib diisi.');
    setBusy(true); await onConfirm(entry, pin); setBusy(false);
  }
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 className="disp" style={{ fontSize: 20, color: 'var(--navy)' }}>Setujui Pengguna</h3>
          <button className="btn btn-ghost btn-xs" onClick={onClose}><I i="xmark" sz={14} /></button>
        </div>
        <div style={{ padding: '12px 16px', background: 'var(--green-pale)', borderRadius: 'var(--r2)', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', marginBottom: 2 }}>{entry.name || entry.email}</div>
          <div style={{ fontSize: 12, color: 'var(--g600)' }}>{entry.email} · {entry.phone}</div>
        </div>
        <Fld label="Set PIN untuk Pengguna *" value={pin} onChange={setPin} type="text" placeholder="Minimal 4 karakter" />
        <p style={{ fontSize: 11, color: 'var(--g500)', marginTop: -8, marginBottom: 20 }}>PIN ini akan digunakan pengguna untuk login. Sampaikan ke pengguna setelah disetujui.</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-green btn-sm" disabled={busy} style={{ flex: 1 }} onClick={submit}>{busy ? <Spin sz={13} col="#fff" /> : <I i="check" sz={13} />} Setujui & Aktifkan</button>
          <button className="btn btn-out btn-sm" onClick={onClose}>Batal</button>
        </div>
      </div>
    </div>
  );
}
