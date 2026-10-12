import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Input, Select, Field, Textarea, Badge, useFlash, errText, formatCnic, ageInYears } from '../../components/ui';
import { PROVINCES, DISTRICTS_BY_PROVINCE, BOARDS, RELIGIONS } from '../../data/pakistan';

const CNIC_RE = /^[0-9]{5}-[0-9]{7}-[0-9]$/;
const PHONE_RE = /^03[0-9]{9}$/;
// Names: letters (English + Urdu), spaces, dots, apostrophes, hyphens — no digits.
const NAME_RE = /^[A-Za-z؀-ۿ][A-Za-z؀-ۿ .'-]*$/;
const stripToName = (v) => v.replace(/[^A-Za-z؀-ۿ .'-]/g, '');
// Board roll numbers are numeric only.
const stripToDigits = (v) => v.replace(/\D/g, '');

const MARITAL_STATUSES = ['Single', 'Married', 'Widowed', 'Divorced'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

// Personal + academic fields copied from a previous application, so a second
// application only needs a program choice and a final review.
const PREFILL_FIELDS = [
  'name', 'fatherName', 'cnicBform', 'gender', 'province', 'domicile', 'religion',
  'maritalStatus', 'bloodGroup', 'hasDisability', 'disabilityDetails', 'medicalConditions',
  'isHafiz', 'phone', 'guardianPhone', 'address',
  'matricBoard', 'matricYear', 'matricRollNo', 'matricObtained', 'matricTotal',
  'interGroupId', 'interBoard', 'interYear', 'interRollNo', 'interObtained', 'interTotal',
];

// New Application wizard (§5.3): program → personal → academic → DOCUMENTS → review & submit.
// A draft application is created at the documents step so uploads attach to it;
// nothing reaches the office desk until the final "Submit application" click.
export default function ApplyWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectCycle = searchParams.get('cycle');
  const { user } = useAuth();
  const draftKey = `apply-draft-${user?.id}`;
  const [meta, setMeta] = useState(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ gender: 'male', isHafiz: false, hasDisability: false });
  const [restored, setRestored] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [blocked, setBlocked] = useState(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Draft application (created when the applicant reaches the documents step)
  const [draftApp, setDraftApp] = useState(null);
  const [docTypes, setDocTypes] = useState([]);
  const [flash, flashEl] = useFlash();
  // Small preview thumbnails — local (file just picked, before upload finishes)
  // and server-side (already-uploaded doc, fetched once per document type).
  const [localPreviews, setLocalPreviews] = useState({});
  const [serverPreviews, setServerPreviews] = useState({});

  useEffect(() => {
    api.get('/admissions/wizard-data').then((r) => {
      setMeta(r.data);
      const fromCycle = r.data.cycles.find((c) => c.id === Number(preselectCycle));
      const acc = r.data.account;
      const last = r.data.lastApplication;
      setForm((f) => {
        const next = {
          ...f,
          cycleId: f.cycleId || (fromCycle ? String(fromCycle.id) : f.cycleId),
          name: f.name || acc?.name || '',
          cnicBform: f.cnicBform || acc?.cnic || '',
          phone: f.phone || acc?.phone || '',
        };
        // Second application: copy everything from the previous one (§ multi-program)
        if (last && !f.name && !f.fatherName) {
          for (const k of PREFILL_FIELDS) {
            if (last[k] !== null && last[k] !== undefined) next[k] = typeof last[k] === 'boolean' ? last[k] : String(last[k]);
          }
          next.hasDisability = !!last.hasDisability;
          next.isHafiz = !!last.isHafiz;
          next.dob = last.dob ? new Date(last.dob).toISOString().slice(0, 10) : next.dob;
          setPrefilled(true);
        }
        return next;
      });
    });
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey) || 'null');
      if (saved?.form && Object.keys(saved.form).length > 2) {
        setForm(saved.form);
        setStep(Math.min(saved.step || 1, 3)); // documents/review need the draft reloaded — re-enter from step 3
        setRestored(true);
      }
    } catch { /* corrupt draft — start fresh */ }
  }, []);

  // Keep the draft saved on every change so an interrupted application survives.
  useEffect(() => {
    if (meta) localStorage.setItem(draftKey, JSON.stringify({ form, step: Math.min(step, 3) }));
  }, [form, step, meta]);

  // Fetch a small preview for each already-uploaded image document (once per
  // type) — PDFs get a generic icon instead, no point fetching those.
  useEffect(() => {
    (draftApp?.documents ?? []).forEach((doc) => {
      const ext = (doc.filePath || '').split('.').pop()?.toLowerCase();
      if (!['jpg', 'jpeg', 'png'].includes(ext)) return;
      if (serverPreviews[doc.documentTypeId]) return;
      api.get(`/admissions/documents/${doc.id}/download`, { responseType: 'blob' })
        .then((res) => setServerPreviews((p) => ({ ...p, [doc.documentTypeId]: URL.createObjectURL(res.data) })))
        .catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftApp]);

  if (!meta) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  const cycle = meta.cycles.find((c) => c.id === Number(form.cycleId));
  const programs = meta.programs.filter((p) => p.programLevelId === cycle?.programLevelId);
  const program = programs.find((p) => p.id === Number(form.programId));
  const isBs = cycle?.programLevelId === 1;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  // ── Real admission validations, mirrored by the server (§6.1/§6.2)
  const thisYear = new Date().getFullYear();
  const marksOk = (o, t) => Number(t) > 0 && Number(o) >= 0 && Number(o) <= Number(t);
  const pct = (o, t) => (o && t ? (Number(o) / Number(t)) * 100 : null);

  const minAge = isBs ? 16 : 15;
  const age = ageInYears(form.dob);
  const maxDob = new Date();
  maxDob.setFullYear(maxDob.getFullYear() - minAge);
  const maxDobStr = maxDob.toISOString().slice(0, 10);

  const dobYear = form.dob && !Number.isNaN(new Date(form.dob).getTime()) ? new Date(form.dob).getFullYear() : null;
  const yearsFrom = (min) => (min <= thisYear ? Array.from({ length: thisYear - min + 1 }, (_, i) => thisYear - i) : []);
  const matricYears = dobYear ? yearsFrom(dobYear + 13) : [];
  const interYears = dobYear ? yearsFrom(Math.max(dobYear + 15, (Number(form.matricYear) || 0) + 1)) : [];

  // Required documents state (step 4/5)
  const requiredDocTypes = docTypes.filter((t) => t.isRequired);
  const uploadedTypeIds = new Set((draftApp?.documents ?? []).map((d) => d.documentTypeId));
  const missingRequired = requiredDocTypes.filter((t) => !uploadedTypeIds.has(t.id));

  function stepErrors(n) {
    const errs = [];
    if (n === 1) {
      if (!form.cycleId) errs.push('Select an admission cycle.');
      if (!form.programId) errs.push('Select a program.');
    }
    if (n === 2) {
      if (!form.name || form.name.trim().length < 3) errs.push('Full name (at least 3 characters).');
      else if (!NAME_RE.test(form.name.trim())) errs.push('Full name — letters only, no digits.');
      if (!form.fatherName || form.fatherName.trim().length < 3) errs.push('Father name (at least 3 characters).');
      else if (!NAME_RE.test(form.fatherName.trim())) errs.push('Father name — letters only, no digits.');
      if (!CNIC_RE.test(form.cnicBform ?? '')) errs.push('CNIC/B-Form in #####-#######-# format.');
      if (!form.dob) errs.push('Date of birth.');
      else if (age < minAge || age > 45) errs.push(`Age must be between ${minAge} and 45 years for ${isBs ? 'BS' : 'Intermediate'} programs (currently ${age}).`);
      if (!form.province) errs.push('Province / territory.');
      if (!form.domicile) errs.push('Domicile district.');
      if (!form.religion) errs.push('Religion.');
      if (!form.maritalStatus) errs.push('Marital status.');
      if (!form.bloodGroup) errs.push('Blood group (choose "Unknown" if not sure).');
      if (form.hasDisability && !(form.disabilityDetails ?? '').trim()) errs.push('Disability details (you marked yes).');
      if (!PHONE_RE.test((form.phone ?? '').replace(/-/g, ''))) errs.push('Phone in 03XXXXXXXXX format.');
      if (!PHONE_RE.test((form.guardianPhone ?? '').replace(/-/g, ''))) errs.push('Guardian phone in 03XXXXXXXXX format.');
      if (!form.address || form.address.trim().length < 5) errs.push('Postal address.');
    }
    if (n === 3) {
      if (!form.matricBoard) errs.push('Matric board.');
      const my = Number(form.matricYear);
      if (!my) errs.push('Matric passing year.');
      else if (dobYear && (my < dobYear + 13 || my > thisYear)) {
        errs.push(`Matric passing year must be between ${dobYear + 13} and ${thisYear} (based on your date of birth).`);
      }
      if (!form.matricRollNo) errs.push('Matric roll number.');
      else if (!/^[0-9]+$/.test(form.matricRollNo)) errs.push('Matric roll number — digits only.');
      if (!marksOk(form.matricObtained, form.matricTotal)) errs.push('Matric marks — obtained between 0 and the total.');
      if (!isBs) {
        const p = pct(form.matricObtained, form.matricTotal);
        if (p !== null && program && p < Number(program.minPercentage)) {
          errs.push(`Matric ${p.toFixed(1)}% is below the ${Number(program.minPercentage)}% minimum for ${program.name}.`);
        }
      }
      if (isBs) {
        if (!form.interGroupId) errs.push('Intermediate group.');
        else if (program && !program.eligibilities.some((e) => e.interGroupId === Number(form.interGroupId))) {
          const g = meta.interGroups.find((x) => x.id === Number(form.interGroupId));
          errs.push(`${program.name} does not accept the ${g?.name ?? 'selected'} group (a clerk can override genuine special cases after submission).`);
        }
        if (!form.interBoard) errs.push('Intermediate board.');
        const iy = Number(form.interYear);
        const minIy = Math.max(dobYear ? dobYear + 15 : 0, my ? my + 1 : 0);
        if (!iy) errs.push('Intermediate passing year.');
        else if (iy < minIy || iy > thisYear) errs.push(`Intermediate passing year must be between ${minIy} and ${thisYear} (after Matric, age 15+).`);
        if (!form.interRollNo) errs.push('Intermediate roll number.');
        else if (!/^[0-9]+$/.test(form.interRollNo)) errs.push('Intermediate roll number — digits only.');
        if (!marksOk(form.interObtained, form.interTotal)) errs.push('Intermediate marks — obtained between 0 and the total.');
        const p = pct(form.interObtained, form.interTotal);
        if (p !== null && program && p < Number(program.minPercentage)) {
          errs.push(`Intermediate ${p.toFixed(1)}% is below the ${Number(program.minPercentage)}% minimum for ${program.name}.`);
        }
      }
    }
    if (n === 4) {
      if (missingRequired.length) errs.push(`Upload the required document(s): ${missingRequired.map((t) => t.name).join(', ')}.`);
    }
    return errs;
  }
  const currentErrors = stepErrors(step);

  async function loadDraft(id) {
    const r = await api.get(`/admissions/${id}`);
    setDraftApp(r.data.application);
    setDocTypes(r.data.documentTypes ?? []);
    return r.data.application;
  }

  // Entering the documents step: save the application as a DRAFT (or update the
  // existing draft) so uploads have something to attach to. Eligibility is
  // checked server-side here — an ineligible applicant is stopped with the reason.
  async function goToDocuments() {
    setBlocked(null);
    setSaving(true);
    try {
      const r = await api.post('/admissions', { ...form, asDraft: true });
      await loadDraft(r.data.application.id);
      setStep(4);
    } catch (e) {
      if (e.response?.data?.ineligible) setBlocked(e.response.data.message);
      else flash({ type: 'error', text: errText(e) });
    } finally {
      setSaving(false);
    }
  }

  async function uploadDoc(typeId, file) {
    // Show a small preview immediately, before the upload even finishes.
    if (file.type.startsWith('image/')) {
      setLocalPreviews((p) => ({ ...p, [typeId]: URL.createObjectURL(file) }));
    }
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.post(`/admissions/${draftApp.id}/documents/${typeId}`, fd);
      flash({ type: 'ok', text: 'Document uploaded.' });
      await loadDraft(draftApp.id);
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  // Final submission: the draft (details + documents) enters the office queue.
  async function submit() {
    setSubmitting(true);
    try {
      await api.put(`/admissions/${draftApp.id}/submit`);
      localStorage.removeItem(draftKey);
      flash({ type: 'ok', text: `Application ${draftApp.applicationNo} submitted — the admissions office will review it.` });
      setTimeout(() => navigate(`/portal/applications/${draftApp.id}`), 900);
    } catch (e) {
      flash({ type: 'error', text: errText(e) });
    } finally {
      setSubmitting(false);
    }
  }

  const steps = ['Program', 'Personal details', 'Academic record', 'Documents', 'Review & submit'];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {flashEl}
      <h1 className="text-2xl font-bold text-slate-900">New Application</h1>

      <div className="flex flex-wrap gap-2">
        {steps.map((label, i) => (
          <div key={label} className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-center text-xs font-medium ${step === i + 1 ? 'bg-primary text-white' : step > i + 1 ? 'bg-green-100 text-primary' : 'bg-slate-100 text-slate-400'}`}>
            {i + 1}. {label}
          </div>
        ))}
      </div>

      {restored && (
        <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-primary">
          <span>Draft restored — your progress saves automatically on this device.</span>
          <button
            className="text-xs font-semibold underline"
            onClick={() => {
              localStorage.removeItem(draftKey);
              setForm({ gender: 'male', isHafiz: false, hasDisability: false, name: meta.account?.name || '', cnicBform: meta.account?.cnic || '', phone: meta.account?.phone || '' });
              setStep(1); setRestored(false); setDraftApp(null);
            }}
          >
            Start over
          </button>
        </div>
      )}

      {prefilled && !restored && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-primary">
          Your details are pre-filled from your previous application — pick the program, review each step, and submit.
        </div>
      )}

      {blocked && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <b>Not eligible:</b> {blocked}
        </div>
      )}

      <Card>
        {step === 1 && (
          <div className="space-y-4">
            <Field label="Admission cycle">
              <Select value={form.cycleId ?? ''} onChange={(e) => setForm({ ...form, cycleId: e.target.value, programId: '' })}>
                <option value="">Select…</option>
                {meta.cycles.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </Select>
            </Field>
            <Field label="Program">
              <Select value={form.programId ?? ''} onChange={set('programId')}>
                <option value="">Select…</option>
                {programs.map((p) => <option key={p.id} value={p.id}>{p.name} (min {Number(p.minPercentage)}%)</option>)}
              </Select>
            </Field>
            {isBs && program && (
              <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                This BS program accepts intermediate groups: {meta.interGroups.filter((g) => program.eligibilities.some((e) => e.interGroupId === g.id)).map((g) => g.name).join(', ') || 'all'}.
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" hint="Letters only — pre-filled from your account.">
              <Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: stripToName(e.target.value) })} />
            </Field>
            <Field label="Father name" hint="Letters only.">
              <Input value={form.fatherName ?? ''} onChange={(e) => setForm({ ...form, fatherName: stripToName(e.target.value) })} />
            </Field>
            <Field
              label="CNIC / B-Form (#####-#######-#)"
              hint={meta.account?.cnic ? 'From your registered account — the application must use the same CNIC.' : undefined}
            >
              <Input
                value={form.cnicBform ?? ''}
                onChange={(e) => setForm({ ...form, cnicBform: formatCnic(e.target.value) })}
                placeholder="32302-1234567-1"
                inputMode="numeric"
                readOnly={!!meta.account?.cnic}
                className={meta.account?.cnic ? 'bg-slate-50 text-slate-500' : undefined}
              />
            </Field>
            <Field label="Gender">
              <Select value={form.gender} onChange={set('gender')}>
                <option value="male">Male</option><option value="female">Female</option>
              </Select>
            </Field>
            <Field
              label="Date of birth"
              hint={age !== null ? `Age: ${age} years (minimum ${minAge} for ${isBs ? 'BS' : 'Intermediate'})` : `Minimum age: ${minAge} years for ${isBs ? 'BS' : 'Intermediate'} programs.`}
            >
              <Input type="date" value={form.dob ?? ''} onChange={set('dob')} max={maxDobStr} />
            </Field>
            <Field
              label="Province / territory"
              hint={form.province && form.province !== 'Punjab' ? 'Non-Punjab domicile: an NOC upload will be required with your documents.' : undefined}
            >
              <Select
                value={form.province ?? ''}
                onChange={(e) => setForm({ ...form, province: e.target.value, domicile: '' })}
              >
                <option value="">Select province…</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            </Field>
            <Field label="Domicile district" hint={!form.province ? 'Select your province first.' : undefined}>
              <Select value={form.domicile ?? ''} onChange={set('domicile')} disabled={!form.province}>
                <option value="">Select district…</option>
                {(DISTRICTS_BY_PROVINCE[form.province] ?? []).map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </Field>
            <Field label="Phone (03XXXXXXXXX)"><Input value={form.phone ?? ''} onChange={set('phone')} inputMode="numeric" placeholder="03001234567" /></Field>
            <Field label="Guardian phone (03XXXXXXXXX)"><Input value={form.guardianPhone ?? ''} onChange={set('guardianPhone')} inputMode="numeric" placeholder="03001234567" /></Field>
            <Field label="Religion">
              <Select
                value={form.religion ?? ''}
                onChange={(e) => setForm({ ...form, religion: e.target.value, isHafiz: e.target.value === 'Islam' ? form.isHafiz : false })}
              >
                <option value="">Select…</option>
                {RELIGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </Select>
            </Field>
            <Field label="Marital status">
              <Select value={form.maritalStatus ?? ''} onChange={set('maritalStatus')}>
                <option value="">Select…</option>
                {MARITAL_STATUSES.map((m) => <option key={m} value={m}>{m}</option>)}
              </Select>
            </Field>
            <Field label="Blood group" hint='Choose "Unknown" if you are not sure.'>
              <Select value={form.bloodGroup ?? ''} onChange={set('bloodGroup')}>
                <option value="">Select…</option>
                {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
              </Select>
            </Field>
            <div className="col-span-full">
              <Field label="Postal address"><Textarea value={form.address ?? ''} onChange={set('address')} /></Field>
            </div>
            <label className="col-span-full flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={!!form.hasDisability} onChange={set('hasDisability')} />
              I have a physical disability or special need
            </label>
            {form.hasDisability && (
              <div className="col-span-full">
                <Field label="Disability details" hint="Briefly describe your disability / special need so the college can support you.">
                  <Textarea value={form.disabilityDetails ?? ''} onChange={set('disabilityDetails')} rows={2} />
                </Field>
              </div>
            )}
            <div className="col-span-full">
              <Field
                label="Medical conditions (optional declaration)"
                hint="Declare any ongoing medical condition, allergy, or medication the college should know about in an emergency — leave blank if none."
              >
                <Textarea value={form.medicalConditions ?? ''} onChange={set('medicalConditions')} rows={2} />
              </Field>
            </div>
            {form.religion === 'Islam' && (
              <label className="col-span-full flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={form.isHafiz} onChange={set('isHafiz')} />
                I am Hafiz-e-Quran (bonus marks apply per policy — §6.3)
              </label>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-accent">Matriculation</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Group">
                  <Select value={form.matricGroupId ?? ''} onChange={set('matricGroupId')}>
                    <option value="">Select…</option>
                    {meta.matricGroups?.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </Select>
                </Field>
                <Field label="Board">
                  <Select value={form.matricBoard ?? ''} onChange={set('matricBoard')}>
                    <option value="">Select board…</option>
                    {BOARDS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </Select>
                </Field>
                <Field label="Passing year" hint={!dobYear ? 'Select your date of birth first (Personal details).' : undefined}>
                  <Select value={form.matricYear ?? ''} onChange={set('matricYear')} disabled={!dobYear}>
                    <option value="">Select…</option>
                    {matricYears.map((y) => <option key={y} value={y}>{y}</option>)}
                  </Select>
                </Field>
                <Field label="Roll number" hint="Digits only."><Input value={form.matricRollNo ?? ''} onChange={(e) => setForm({ ...form, matricRollNo: stripToDigits(e.target.value) })} inputMode="numeric" /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Marks obtained"><Input type="number" value={form.matricObtained ?? ''} onChange={set('matricObtained')} /></Field>
                  <Field label="Total marks"><Input type="number" value={form.matricTotal ?? ''} onChange={set('matricTotal')} /></Field>
                </div>
              </div>
              {form.matricObtained && form.matricTotal && (
                <p className="mt-2 text-sm text-slate-500">Percentage: <b className="text-primary">{((form.matricObtained / form.matricTotal) * 100).toFixed(2)}%</b> (auto-computed)</p>
              )}
            </div>

            {isBs && (
              <div>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-accent">Intermediate</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Group">
                    <Select value={form.interGroupId ?? ''} onChange={set('interGroupId')}>
                      <option value="">Select…</option>
                      {meta.interGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </Select>
                  </Field>
                  <Field label="Board">
                    <Select value={form.interBoard ?? ''} onChange={set('interBoard')}>
                      <option value="">Select board…</option>
                      {BOARDS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </Select>
                  </Field>
                  <Field label="Passing year" hint={!dobYear ? 'Select your date of birth first (Personal details).' : undefined}>
                    <Select value={form.interYear ?? ''} onChange={set('interYear')} disabled={!dobYear}>
                      <option value="">Select…</option>
                      {interYears.map((y) => <option key={y} value={y}>{y}</option>)}
                    </Select>
                  </Field>
                  <Field label="Roll number" hint="Digits only."><Input value={form.interRollNo ?? ''} onChange={(e) => setForm({ ...form, interRollNo: stripToDigits(e.target.value) })} inputMode="numeric" /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Marks obtained"><Input type="number" value={form.interObtained ?? ''} onChange={set('interObtained')} /></Field>
                    <Field label="Total marks"><Input type="number" value={form.interTotal ?? ''} onChange={set('interTotal')} /></Field>
                  </div>
                </div>
                {form.interObtained && form.interTotal && (
                  <p className="mt-2 text-sm text-slate-500">Percentage: <b className="text-primary">{((form.interObtained / form.interTotal) * 100).toFixed(2)}%</b></p>
                )}
              </div>
            )}
          </div>
        )}

        {step === 4 && draftApp && (
          <div className="space-y-4">
            <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              Upload every <b>required</b> document — your application is saved as a draft and is
              <b> not submitted yet</b>. You will review everything on the next step.
            </p>
            {form.province && form.province !== 'Punjab' && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <b>Non-Punjab domicile ({form.province}):</b> the <b>NOC</b> is required for your application.
              </p>
            )}
            <div className="space-y-3">
              {docTypes.map((dt) => {
                const doc = (draftApp.documents ?? []).find((d) => d.documentTypeId === dt.id);
                const isPhoto = dt.name === 'Passport Size Photograph';
                const thumb = localPreviews[dt.id] || serverPreviews[dt.id];
                return (
                  <div key={dt.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {thumb ? (
                          <img src={thumb} alt="" className="h-12 w-12 rounded border border-slate-200 object-cover" />
                        ) : doc ? (
                          <div className="flex h-12 w-12 items-center justify-center rounded border border-slate-200 bg-slate-50 text-lg text-slate-400">📄</div>
                        ) : null}
                        <div>
                          <div className="text-sm font-medium text-slate-800">
                            {dt.name}{' '}
                            {dt.isRequired
                              ? <span className="ml-1 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-600">Required</span>
                              : <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500">Optional</span>}
                          </div>
                          <div className="mt-0.5 text-xs">
                            {doc ? <span className="font-medium text-primary">Uploaded ✓</span> : <span className="text-slate-400">Not uploaded yet</span>}
                          </div>
                        </div>
                      </div>
                      <label className={`cursor-pointer rounded-lg px-3.5 py-2 text-sm font-medium ${doc ? 'border border-slate-300 text-slate-700 hover:border-primary' : 'bg-primary text-white hover:opacity-90'}`}>
                        {doc ? 'Replace' : 'Upload'}
                        <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden"
                          onChange={(e) => e.target.files[0] && uploadDoc(dt.id, e.target.files[0])} />
                      </label>
                    </div>
                    {isPhoto && (
                      <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                        <b>Important:</b> upload a fresh passport-size picture — this exact photo will also appear on your official Student Card once you're enrolled.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 5 && draftApp && (
          <div className="space-y-5">
            <div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-accent">Program</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {[['Program', program?.name], ['Cycle', cycle?.title]].map(([k, v]) => (
                  <div key={k}><dt className="text-xs uppercase text-slate-400">{k}</dt><dd className="text-slate-700">{v ?? '—'}</dd></div>
                ))}
              </dl>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-accent">Personal</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {[
                  ['Name', form.name], ['Father', form.fatherName],
                  ['CNIC/B-Form', form.cnicBform], ['Gender', form.gender],
                  ['Age', age !== null ? `${age} years` : null], ['Religion', form.religion],
                  ['Marital status', form.maritalStatus], ['Blood group', form.bloodGroup],
                  ['Disability', form.hasDisability ? form.disabilityDetails : 'None'],
                  ['Medical conditions', form.medicalConditions || 'None declared'],
                  ...(form.religion === 'Islam' ? [['Hafiz-e-Quran', form.isHafiz ? 'Yes' : 'No']] : []),
                ].map(([k, v]) => (
                  <div key={k}><dt className="text-xs uppercase text-slate-400">{k}</dt><dd className="text-slate-700">{v ?? '—'}</dd></div>
                ))}
              </dl>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-accent">Contact</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {[
                  ['Phone', form.phone], ['Guardian phone', form.guardianPhone],
                  ['Province', form.province], ['Domicile', form.domicile],
                  ['Address', form.address],
                ].map(([k, v]) => (
                  <div key={k}><dt className="text-xs uppercase text-slate-400">{k}</dt><dd className="text-slate-700">{v ?? '—'}</dd></div>
                ))}
              </dl>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-accent">Academic record</h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {[
                  ['Matric', form.matricObtained && `${form.matricObtained}/${form.matricTotal} — ${form.matricBoard} (${form.matricYear})`],
                  ...(isBs ? [['Intermediate', form.interObtained && `${form.interObtained}/${form.interTotal} (${meta.interGroups.find((g) => g.id === Number(form.interGroupId))?.name ?? '—'})`]] : []),
                ].map(([k, v]) => (
                  <div key={k}><dt className="text-xs uppercase text-slate-400">{k}</dt><dd className="text-slate-700">{v ?? '—'}</dd></div>
                ))}
              </dl>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-accent">Documents</h3>
              <ul className="space-y-1.5 text-sm">
                {docTypes.map((dt) => {
                  const doc = (draftApp.documents ?? []).find((d) => d.documentTypeId === dt.id);
                  return (
                    <li key={dt.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                      <span className="text-slate-700">{dt.name}</span>
                      {doc ? <Badge value="uploaded" /> : dt.isRequired ? <span className="text-xs font-semibold text-red-600">MISSING (required)</span> : <span className="text-xs text-slate-400">not provided</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
            <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              By submitting you confirm all information is correct. The admissions office will verify your
              documents and approve or reject the application — you will be notified either way.
            </p>
          </div>
        )}

        {currentErrors.length > 0 && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <b>Required to continue:</b>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              {currentErrors.map((e) => <li key={e}>{e}</li>)}
            </ul>
          </div>
        )}

        <div className="mt-6 flex justify-between border-t border-slate-100 pt-4">
          <Button variant="outline" disabled={step === 1} onClick={() => setStep(step - 1)}>← Back</Button>
          {step < 3 && <Button disabled={currentErrors.length > 0} onClick={() => setStep(step + 1)}>Next →</Button>}
          {step === 3 && (
            <Button disabled={currentErrors.length > 0 || saving} onClick={goToDocuments}>
              {saving ? 'Saving draft…' : 'Next: upload documents →'}
            </Button>
          )}
          {step === 4 && <Button disabled={currentErrors.length > 0} onClick={() => setStep(5)}>Next: review →</Button>}
          {step === 5 && (
            <Button disabled={submitting || missingRequired.length > 0} onClick={submit}>
              {submitting ? 'Submitting…' : 'Submit application'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
