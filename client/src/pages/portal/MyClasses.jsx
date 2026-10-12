import { useEffect, useRef, useState } from 'react';
import api from '../../api/client';
import { Card, Button, Input, Badge, useFlash, errText } from '../../components/ui';

// Teacher: My Classes → pick a date → mark the register.
//
// Marking is a one-student-at-a-time flow rather than a long list. Everyone
// starts Present, so the teacher only intervenes for the exceptions: → moves to
// the next student, A marks absent, L marks leave, ← goes back to correct a
// mistake. At the end a review screen lists who was not present before anything
// is written. A saved register stays editable for 24 hours (§6.6).
const STATUSES = ['present', 'absent', 'leave'];
const STATUS_STYLE = {
  present: 'border-green-500 bg-green-50 text-green-800',
  absent: 'border-red-400 bg-red-50 text-red-800',
  leave: 'border-amber-400 bg-amber-50 text-amber-800',
};

export default function MyClasses() {
  const [allocations, setAllocations] = useState(null);
  const [active, setActive] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [sheet, setSheet] = useState(null);
  const [marks, setMarks] = useState([]);      // [{id, rollNumber, name, status}]
  const [cursor, setCursor] = useState(0);     // which student is on screen
  const [stage, setStage] = useState('idle');  // idle | marking | review
  const [saving, setSaving] = useState(false);
  const [flash, flashEl] = useFlash();
  const surface = useRef(null);

  useEffect(() => {
    api.get('/attendance/my-classes').then((r) => setAllocations(r.data.allocations));
  }, []);

  useEffect(() => {
    if (!active) return;
    setSheet(null); setStage('idle'); setCursor(0);
    api.get('/attendance/sheet', { params: { allocation: active.id, date } })
      .then((r) => { setSheet(r.data); setMarks(r.data.students.map((s) => ({ ...s }))); })
      .catch((e) => flash({ type: 'error', text: errText(e) }));
  }, [active, date]);

  // Keep the keyboard on the marking surface so the arrow keys work without the
  // teacher having to click anything first.
  useEffect(() => { if (stage === 'marking') surface.current?.focus(); }, [stage, cursor]);

  const setStatus = (i, status) =>
    setMarks((m) => m.map((s, idx) => (idx === i ? { ...s, status } : s)));

  const advance = () => setCursor((c) => Math.min(c + 1, marks.length));
  const back = () => setCursor((c) => Math.max(0, c - 1));

  function onKey(e) {
    if (stage !== 'marking') return;
    const k = e.key.toLowerCase();
    if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); advance(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
    else if (k === 'a') { e.preventDefault(); setStatus(cursor, 'absent'); advance(); }
    else if (k === 'l') { e.preventDefault(); setStatus(cursor, 'leave'); advance(); }
    else if (k === 'p') { e.preventDefault(); setStatus(cursor, 'present'); advance(); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      // Change the mark without moving on, for a quick correction.
      e.preventDefault();
      const cur = STATUSES.indexOf(marks[cursor]?.status ?? 'present');
      const next = e.key === 'ArrowDown' ? (cur + 1) % 3 : (cur + 2) % 3;
      setStatus(cursor, STATUSES[next]);
    }
  }

  // Running off the end of the roll goes straight to the review.
  useEffect(() => {
    if (stage === 'marking' && marks.length && cursor >= marks.length) setStage('review');
  }, [cursor, stage, marks.length]);

  async function save() {
    setSaving(true);
    try {
      await api.post('/attendance/sheet', {
        allocationId: active.id, date,
        records: marks.map((s) => ({ studentId: s.id, status: s.status })),
      });
      flash({ type: 'ok', text: 'Attendance saved. You can correct it for the next 24 hours.' });
      const r = await api.get('/attendance/sheet', { params: { allocation: active.id, date } });
      setSheet(r.data); setMarks(r.data.students.map((s) => ({ ...s }))); setStage('idle'); setCursor(0);
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
    finally { setSaving(false); }
  }

  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: marks.filter((m) => m.status === s).length }), {});
  const exceptions = marks.filter((m) => m.status !== 'present');
  const student = marks[cursor];

  if (!allocations) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6">
      {flashEl}
      <h1 className="text-2xl font-bold text-slate-900">My Classes &amp; Attendance</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allocations.map((a) => (
          <button key={a.id} onClick={() => setActive(a)}
            className={`rounded-xl border p-4 text-left shadow-sm transition ${active?.id === a.id ? 'border-primary bg-green-50' : 'border-slate-200 bg-white hover:border-primary'}`}>
            <div className="font-semibold text-slate-800">{a.subject.title}</div>
            <div className="mt-1 text-sm text-slate-500">
              {a.classSection.program.code} Semester {a.classSection.termNo} ({a.classSection.shift}) · {a.classSection._count.students} students
            </div>
          </button>
        ))}
        {allocations.length === 0 && <p className="text-slate-500">No classes allocated to you yet.</p>}
      </div>

      {active && (
        <Card
          title={`${active.subject.title} — ${active.classSection.program.code} Semester ${active.classSection.termNo} (${active.classSection.shift})`}
          actions={
            <Input type="date" value={date} max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)} style={{ width: 170 }} />
          }
        >
          {!sheet && <div className="py-10 text-center text-slate-400">Loading register…</div>}

          {sheet && sheet.locked && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              This register is closed. A register can be corrected for 24 hours after it is first
              marked; after that only the Principal can reopen it.
            </div>
          )}

          {sheet && !sheet.locked && marks.length === 0 && (
            <div className="py-10 text-center text-slate-400">
              No students are enrolled in this class shift yet — the register fills in once admissions enroll students here.
            </div>
          )}

          {/* ── idle: summary, then start or correct ─────────────────── */}
          {sheet && !sheet.locked && marks.length > 0 && stage === 'idle' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-sm text-slate-600">
                  <b>{marks.length}</b> students on the roll
                  {sheet.exists && <> · already marked
                    {sheet.editableUntil && <> · editable until <b>{new Date(sheet.editableUntil).toLocaleString()}</b></>}
                  </>}
                </div>
                <div className="ml-auto flex gap-2">
                  {STATUSES.map((s) => (
                    <span key={s} className="rounded-full bg-slate-100 px-3 py-1 text-xs capitalize text-slate-600">
                      {s}: <b>{counts[s]}</b>
                    </span>
                  ))}
                </div>
              </div>
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                Everyone starts as <b>Present</b> — you only act on the exceptions. Use <b>→</b> for the
                next student, <b>A</b> for absent, <b>L</b> for leave, and <b>←</b> to go back and correct.
                You will see a summary before anything is saved.
              </p>
              <Button onClick={() => { setCursor(0); setStage('marking'); }}>
                {sheet.exists ? 'Correct this register' : 'Start marking'}
              </Button>
            </div>
          )}

          {/* ── marking: one big card per student ────────────────────── */}
          {sheet && !sheet.locked && stage === 'marking' && student && (
            <div ref={surface} tabIndex={0} onKeyDown={onKey} className="outline-none">
              <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
                <span>Student <b>{cursor + 1}</b> of {marks.length}</span>
                <span>Present {counts.present} · Absent {counts.absent} · Leave {counts.leave}</span>
              </div>
              <div className="mb-5 h-1.5 w-full rounded-full bg-slate-100">
                <div className="h-1.5 rounded-full bg-primary transition-all"
                  style={{ width: `${(cursor / marks.length) * 100}%` }} />
              </div>

              <div className={`rounded-2xl border-2 p-10 text-center shadow-sm transition ${STATUS_STYLE[student.status]}`}>
                <div className="font-mono text-sm uppercase tracking-wide opacity-70">{student.rollNumber}</div>
                <div className="mt-2 text-4xl font-bold">{student.name}</div>
                <div className="mt-3 text-lg font-semibold capitalize">{student.status}</div>

                <div className="mt-7 flex flex-wrap justify-center gap-2">
                  {STATUSES.map((s) => (
                    <button key={s} onClick={() => { setStatus(cursor, s); advance(); }}
                      className={`rounded-lg border px-6 py-3 text-sm font-medium capitalize ${
                        student.status === s ? 'border-slate-800 bg-white' : 'border-slate-300 bg-white/70 hover:border-slate-500'}`}>
                      {s} <span className="ml-1 text-xs text-slate-400">({s[0].toUpperCase()})</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <Button variant="outline" onClick={back} disabled={cursor === 0}>← Previous</Button>
                <span className="hidden text-xs text-slate-400 sm:block">
                  → next · A absent · L leave · P present · ↑↓ change without moving
                </span>
                <Button onClick={advance}>{cursor === marks.length - 1 ? 'Review →' : 'Next →'}</Button>
              </div>
            </div>
          )}

          {/* ── review: confirm before anything is written ───────────── */}
          {sheet && !sheet.locked && stage === 'review' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">Review before saving</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {STATUSES.map((s) => (
                  <div key={s} className={`rounded-xl border p-4 ${STATUS_STYLE[s]}`}>
                    <div className="text-2xl font-bold">{counts[s]}</div>
                    <div className="text-sm capitalize">{s}</div>
                  </div>
                ))}
              </div>

              {exceptions.length === 0 ? (
                <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                  Full attendance — every student on the roll is marked present.
                </p>
              ) : (
                <div className="rounded-xl border border-slate-200">
                  <div className="border-b border-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
                    Not present ({exceptions.length})
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {exceptions.map((s) => (
                      <li key={s.id} className="flex items-center justify-between px-4 py-2 text-sm">
                        <span><span className="font-mono text-xs text-slate-400">{s.rollNumber}</span> {s.name}</span>
                        <span className="flex items-center gap-2">
                          <Badge value={s.status} />
                          <button onClick={() => { setCursor(marks.findIndex((m) => m.id === s.id)); setStage('marking'); }}
                            className="text-xs text-slate-400 underline hover:text-primary">change</button>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-between gap-3">
                <Button variant="outline" onClick={() => { setCursor(0); setStage('marking'); }}>← Back to marking</Button>
                <Button onClick={save} disabled={saving}>
                  {saving ? 'Saving…' : `Save attendance for ${marks.length} student(s)`}
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
