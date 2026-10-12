import { useEffect, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, Table, Badge, Button, Select, Field, Modal, Textarea, useFlash, useConfirm, errText, fmtDate } from '../../components/ui';

// Batch promotion desk: pick a program + session (batch) and the whole batch
// loads, semester by semester. Promotion itself still happens one semester at a
// time — each semester card promotes its own students to the next one (or passes
// the final semester out). College rule: a student may be promoted with up to
// `maxCarry` (default 2) failed subjects, recorded as carry papers to re-sit with
// the junior batch; more than that means repeating the semester.
export default function Promotion() {
  const { can } = useAuth();
  const canUpdate = can('students.update'); // clerk & principal: student status
  const [programs, setPrograms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [programId, setProgramId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [termNo, setTermNo] = useState(''); // '' = every semester of the batch
  const [pendingOnly, setPendingOnly] = useState(false);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState({}); // studentId -> { promote: bool, carry: number[] }
  const [running, setRunning] = useState(null); // termNo currently being promoted
  const [statusEdit, setStatusEdit] = useState(null); // { student, status, reason }
  const [savingStatus, setSavingStatus] = useState(false);
  const [carries, setCarries] = useState(null);
  const [flash, flashEl] = useFlash();
  const [confirm, confirmEl] = useConfirm();

  useEffect(() => {
    Promise.all([api.get('/academic/programs'), api.get('/academic/sessions')]).then(([p, s]) => {
      setPrograms(p.data.programs);
      setSessions(s.data.sessions);
    });
    loadCarries();
  }, []);

  const program = programs.find((p) => p.id === Number(programId));
  const isInter = program?.level === 'intermediate';
  const finalTerm = program ? (isInter ? (program.totalSemesters ?? 2) : (program.totalSemesters ?? 8)) : 0;
  const termLabel = (t) => (isInter ? `${t === 1 ? '1st' : '2nd'} Year` : `Semester ${t}`);
  // Sessions whose span matches the program's course length.
  const matchingSessions = sessions.filter((s) => program && (s.endYear - s.startYear) === (isInter ? 2 : 4));

  function loadCarries() {
    api.get('/promotion/carries', { params: { status: 'pending' } }).then((r) => setCarries(r.data.carries));
  }

  // The whole batch is fetched in one go; the semester dropdown filters what is
  // shown, so switching semesters never needs another round trip.
  async function loadBatch(pId = programId, sId = sessionId) {
    if (!pId || !sId) return;
    setLoading(true);
    try {
      const r = await api.get('/promotion/preview', { params: { programId: pId, sessionId: sId } });
      setPreview(r.data);
      // everyone active is promoted by default, no carries
      const next = {};
      for (const t of r.data.terms) {
        for (const st of t.students) next[st.id] = { promote: st.status === 'active', carry: [] };
      }
      setPlan(next);
    } catch (e) { setPreview(null); flash({ type: 'error', text: errText(e) }); }
    finally { setLoading(false); }
  }

  // Changing the program invalidates the session too — sessions are filtered by
  // course length, so a session picked for a BS program is not a valid batch for
  // an Intermediate one. Leaving the old id behind was why "Load students"
  // sometimes came back empty.
  function pickProgram(id) {
    setProgramId(id);
    setSessionId('');
    setTermNo('');
    setPreview(null);
  }
  function pickSession(id) {
    setSessionId(id);
    setTermNo('');
    loadBatch(programId, id);
  }

  // `students` always stays the full semester roll — the pending-papers checkbox
  // is a view filter (`visible`) only, so it can never quietly shrink the set of
  // students a promotion run acts on.
  const visibleTerms = (preview?.terms ?? [])
    .filter((t) => !termNo || t.termNo === Number(termNo))
    .map((t) => ({ ...t, visible: pendingOnly ? t.students.filter((st) => st.carryForwards.length) : t.students }));
  const unassigned = pendingOnly
    ? (preview?.unassigned ?? []).filter((st) => st.carryForwards.length)
    : (preview?.unassigned ?? []);

  const setPromote = (id, promote) => setPlan({ ...plan, [id]: { ...(plan[id] ?? { carry: [] }), promote } });
  const toggleCarry = (id, subjectId) => {
    const cur = plan[id] ?? { promote: true, carry: [] };
    const has = cur.carry.includes(subjectId);
    if (!has && cur.carry.length >= (preview?.maxCarry ?? 2)) {
      flash({ type: 'error', text: `Maximum ${preview?.maxCarry ?? 2} carry subjects — beyond that the student must repeat the semester (uncheck "Promote").` });
      return;
    }
    setPlan({ ...plan, [id]: { ...cur, promote: true, carry: has ? cur.carry.filter((s) => s !== subjectId) : [...cur.carry, subjectId] } });
  };

  const promotable = (term) => term.students.filter((st) => st.status === 'active');
  const promotedCount = (term) => promotable(term).filter((st) => plan[st.id]?.promote).length;

  async function run(term) {
    const list = promotable(term);
    const promotions = list
      .filter((st) => plan[st.id]?.promote)
      .map((st) => ({ studentId: st.id, carrySubjectIds: plan[st.id].carry }));
    const detained = list.length - promotions.length;
    confirm(
      term.isFinalTerm
        ? `Pass out ${promotions.length} student(s) of ${term.fromLabel}? ${detained ? `${detained} will stay (detained).` : ''}`
        : `Promote ${promotions.length} student(s) from ${term.fromLabel} to ${term.toLabel}? ${detained ? `${detained} will stay (detained).` : ''}`,
      async () => {
        setRunning(term.termNo);
        try {
          const r = await api.post('/promotion/run', { programId: Number(programId), sessionId: Number(sessionId), termNo: term.termNo, promotions });
          const bits = [];
          if (r.data.promoted) bits.push(`${r.data.promoted} promoted`);
          if (r.data.passedOut) bits.push(`${r.data.passedOut} passed out`);
          if (r.data.detained) bits.push(`${r.data.detained} detained`);
          if (r.data.skipped?.length) bits.push(`${r.data.skipped.length} skipped`);
          flash({ type: 'ok', text: `Done — ${bits.join(', ')}.` });
          for (const s of r.data.skipped ?? []) flash({ type: 'error', text: `${s.name ?? s.studentId}: ${s.reason}` });
          loadBatch();
          loadCarries();
        } catch (e) { flash({ type: 'error', text: errText(e) }); }
        finally { setRunning(null); }
      }
    );
  }

  async function saveStatus() {
    setSavingStatus(true);
    try {
      const r = await api.put(`/students/${statusEdit.student.id}/status`, {
        status: statusEdit.status,
        reason: statusEdit.reason.trim() || undefined,
      });
      flash({ type: 'ok', text: r.data.message });
      setStatusEdit(null);
      loadBatch();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
    finally { setSavingStatus(false); }
  }

  async function clearCarry(c) {
    confirm(`Mark ${c.subject.title} as cleared for ${c.student.name} (${c.student.rollNumber})?`, async () => {
      try {
        await api.put(`/promotion/carries/${c.id}/clear`);
        flash({ type: 'ok', text: 'Carry paper cleared.' });
        loadCarries();
        if (preview) loadBatch();
      } catch (e) { flash({ type: 'error', text: errText(e) }); }
    });
  }
  async function removeCarry(c) {
    confirm(`Remove the ${c.subject.title} carry entry for ${c.student.name}? Use this only for entries recorded by mistake.`, async () => {
      try {
        await api.delete(`/promotion/carries/${c.id}`);
        loadCarries();
        if (preview) loadBatch();
      } catch (e) { flash({ type: 'error', text: errText(e) }); }
    });
  }

  // Columns shared by every semester card (and the unassigned one, minus the
  // promotion controls — a student with no class shift has nowhere to move to).
  const studentColumns = (term) => [
    ...(term ? [{
      header: 'Promote',
      cell: (st) => st.status === 'active'
        ? <input type="checkbox" className="h-4 w-4" checked={plan[st.id]?.promote ?? false}
            onChange={(e) => setPromote(st.id, e.target.checked)} />
        : <span className="text-slate-300">—</span>,
    }] : []),
    { header: 'Roll No', cell: (st) => <span className="font-medium">{st.rollNumber}</span> },
    { header: 'Name', cell: (st) => st.name },
    { header: 'Shift', cell: (st) => st.classSection ? <Badge value={st.classSection.shift} /> : <span className="text-slate-400">—</span> },
    {
      header: 'Status',
      cell: (st) => (
        <div className="flex items-center gap-2">
          <Badge value={st.status} />
          {canUpdate && st.status !== 'passed_out' && (
            <button type="button" onClick={() => setStatusEdit({ student: st, status: st.status, reason: '' })}
              className="text-xs text-slate-400 underline hover:text-primary">change</button>
          )}
        </div>
      ),
    },
    {
      header: 'Pending papers',
      cell: (st) => st.carryForwards.length
        ? st.carryForwards.map((c) => <Badge key={c.id} value={c.subject.code} />)
        : <span className="text-slate-400">—</span>,
    },
    ...(term ? [{
      header: `Failed subjects of ${term.fromLabel} (max ${preview.maxCarry})`,
      cell: (st) => (
        <div className="flex flex-wrap gap-1">
          {term.subjects.map((sub) => {
            const on = plan[st.id]?.carry.includes(sub.id);
            return (
              <button key={sub.id} title={sub.title}
                onClick={() => toggleCarry(st.id, sub.id)}
                disabled={st.status !== 'active' || !plan[st.id]?.promote}
                className={`rounded-full border px-2 py-0.5 text-xs ${on
                  ? 'border-amber-400 bg-amber-100 font-semibold text-amber-800'
                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'} disabled:opacity-40`}>
                {sub.code}
              </button>
            );
          })}
          {!term.subjects.length && <span className="text-xs text-slate-400">No subjects defined for this {isInter ? 'class' : 'semester'}.</span>}
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-6">
      {flashEl}{confirmEl}
      <h1 className="text-2xl font-bold text-slate-900">Batch Promotion</h1>

      <Card title="Select the batch">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Program">
            <Select value={programId} onChange={(e) => pickProgram(e.target.value)}>
              <option value="">Select…</option>
              {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
          <Field label="Session (batch)">
            <Select value={sessionId} onChange={(e) => pickSession(e.target.value)} disabled={!programId}>
              <option value="">Select…</option>
              {matchingSessions.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.startYear}–{s.endYear}, {s.shift})</option>)}
            </Select>
          </Field>
          <Field label={isInter ? 'Class (optional)' : 'Semester (optional)'}>
            <Select value={termNo} onChange={(e) => setTermNo(e.target.value)} disabled={!preview}>
              <option value="">All {isInter ? 'classes' : 'semesters'}</option>
              {Array.from({ length: finalTerm }, (_, i) => i + 1).map((t) => (
                <option key={t} value={t}>{termLabel(t)}{t === finalTerm ? ' (final)' : ''}</option>
              ))}
            </Select>
          </Field>
          <label className="flex items-center gap-2 pb-2 text-sm text-slate-600">
            <input type="checkbox" className="h-4 w-4" checked={pendingOnly} onChange={(e) => setPendingOnly(e.target.checked)} disabled={!preview} />
            Only students with pending papers
          </label>
          <Button onClick={() => loadBatch()} disabled={!programId || !sessionId || loading}>
            {loading ? 'Loading…' : preview ? 'Reload' : 'Load students'}
          </Button>
        </div>
        {preview && (
          <p className="mt-3 text-xs text-slate-500">
            {preview.totals.batch} student(s) in this batch — {preview.totals.active} active,
            {' '}{preview.totals.pendingPapers} with pending papers
            {preview.totals.unassigned ? `, ${preview.totals.unassigned} with no class shift` : ''}.
            {' '}Leave the {isInter ? 'class' : 'semester'} box on “All” to see the whole batch.
          </p>
        )}
      </Card>

      {preview && !!unassigned.length && (
        <Card title={`No class shift assigned (${unassigned.length})`}>
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            These students are enrolled in this batch but have not been given a class shift yet, so they do not sit in
            any {isInter ? 'class' : 'semester'} and cannot be promoted. Assign a shift from the
            <b> Students Directory</b> first.
          </p>
          <Table columns={studentColumns(null)} rows={unassigned} empty="Nobody here." />
        </Card>
      )}

      {preview && visibleTerms.map((term) => (
        <Card
          key={term.termNo}
          title={term.isFinalTerm
            ? `${term.fromLabel} → Passed out (final ${isInter ? 'class' : 'semester'}) — ${term.students.length} student(s)`
            : `${term.fromLabel} → ${term.toLabel} — ${term.students.length} student(s)`}
          actions={promotable(term).length > 0 && (
            <Button onClick={() => run(term)} disabled={running !== null || promotedCount(term) === 0}>
              {running === term.termNo ? 'Working…' : term.isFinalTerm ? `Pass out ${promotedCount(term)} student(s)` : `Promote ${promotedCount(term)} student(s)`}
            </Button>
          )}
        >
          <p className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            Every active student is promoted by default. <b>Failed up to {preview.maxCarry} subjects?</b> Tick those subjects —
            the student is still promoted and re-sits the papers with the junior batch (carry papers).
            <b> Failed more than {preview.maxCarry}?</b> Uncheck “Promote” — the student repeats {term.fromLabel}.
            {term.isFinalTerm && <> <b>Final {isInter ? 'class' : 'semester'}:</b> promoted students are marked passed out — not possible with pending papers.</>}
          </p>
          {pendingOnly && term.visible.length !== term.students.length && (
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              Showing {term.visible.length} of {term.students.length} — filtered to students with pending papers. The
              promote button still acts on all {promotable(term).length} active student(s) of {term.fromLabel}, including
              the hidden ones.
            </p>
          )}
          <Table
            columns={studentColumns(term)}
            rows={term.visible}
            empty={pendingOnly ? 'Nobody here has pending papers.' : `No students in this ${isInter ? 'class' : 'semester'}.`}
          />
        </Card>
      ))}

      {preview && !visibleTerms.length && !unassigned.length && (
        <Card><p className="py-6 text-center text-sm text-slate-400">
          {pendingOnly
            ? 'No students with pending papers in this batch.'
            : 'No students found in this batch yet.'}
        </p></Card>
      )}

      <Card title="Pending carry papers (re-sit with the junior batch)">
        <Table
          columns={[
            { header: 'Roll No', cell: (c) => <span className="font-medium">{c.student.rollNumber}</span> },
            { header: 'Student', cell: (c) => c.student.name },
            { header: 'Program', cell: (c) => c.student.program?.name ?? '—' },
            { header: 'Subject', cell: (c) => `${c.subject.code} — ${c.subject.title}` },
            { header: 'Failed in', cell: (c) => c.student.program?.level === 'intermediate' ? `${c.fromTermNo === 1 ? '1st' : '2nd'} Year` : `Semester ${c.fromTermNo}` },
            { header: 'Since', cell: (c) => fmtDate(c.createdAt) },
            {
              header: 'Actions',
              cell: (c) => (
                <div className="flex gap-2">
                  <Button onClick={() => clearCarry(c)}>Mark cleared</Button>
                  <Button variant="danger" onClick={() => removeCarry(c)}>Remove</Button>
                </div>
              ),
            },
          ]}
          rows={carries ?? []}
          empty={carries === null ? 'Loading…' : 'No pending carry papers.'}
        />
      </Card>

      {/* Active / inactive / struck off — clerk & principal (students.update) */}
      <Modal
        open={!!statusEdit}
        title={`Student status — ${statusEdit?.student.name} (${statusEdit?.student.rollNumber})`}
        onClose={() => setStatusEdit(null)}
      >
        {statusEdit && (
          <>
            <Field label="Status">
              <Select value={statusEdit.status} onChange={(e) => setStatusEdit({ ...statusEdit, status: e.target.value })}>
                <option value="active">Active — on the rolls</option>
                <option value="inactive">Inactive — temporarily off the rolls (dropout / long leave)</option>
                <option value="struck_off">Struck off — expelled</option>
              </Select>
            </Field>
            <Field label="Reason (optional — included in the student's notification)">
              <Textarea value={statusEdit.reason} onChange={(e) => setStatusEdit({ ...statusEdit, reason: e.target.value })} />
            </Field>
            <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              {statusEdit.status === 'struck_off'
                ? 'An expelled student is dropped from class lists, attendance and promotion, and their portal login is disabled. Reversible — set them back to Active.'
                : statusEdit.status === 'inactive'
                  ? 'An inactive student is dropped from class lists, attendance and promotion but keeps read access to their own portal.'
                  : 'The student returns to class lists, attendance and promotion, and their portal login is re-enabled.'}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStatusEdit(null)}>Cancel</Button>
              <Button
                variant={statusEdit.status === 'active' ? 'primary' : 'danger'}
                disabled={savingStatus || statusEdit.status === statusEdit.student.status}
                onClick={saveStatus}
              >
                {savingStatus ? 'Saving…' : 'Save status'}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
