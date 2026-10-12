import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Card, Table, Button, Input, Select, Field, Textarea, Badge, Modal, useFlash, useConfirm, errText, fmtDate, fmtDateTime, downloadCsv } from '../../components/ui';
import SecurePlayer from '../../components/SecurePlayer';

// Teacher: post a recorded lecture against one of their allocations, optionally
// link the quiz that follows it, and see who actually watched.
//
// The teacher pastes an ordinary YouTube link; the server keeps only the
// 11-character video id. Uploads are expected to be UNLISTED on the college
// channel — a private video will not play in an embed, and a public one defeats
// the point.
const BLANK = { allocationId: '', title: '', description: '', youtubeUrl: '', durationMins: '', quizId: '', isPublished: true, strictTracking: false };
const hhmmss = (s) => {
  if (!s) return '00h:00m:00s';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const secs = Math.floor(s % 60);
  return `${String(h).padStart(2, '0')}h:${String(m).padStart(2, '0')}m:${String(secs).padStart(2, '0')}s`;
};

export default function TeacherLectures() {
  const [allocations, setAllocations] = useState([]);
  const [classwork, setClasswork] = useState([]);
  const [lectures, setLectures] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [report, setReport] = useState(null);
  const [flash, flashEl] = useFlash();
  const [confirm, confirmEl] = useConfirm();

  const load = () => api.get('/lectures/mine').then((r) => setLectures(r.data.lectures));
  useEffect(() => {
    api.get('/attendance/my-classes').then((r) => setAllocations(r.data.allocations));
    api.get('/classwork').then((r) => setClasswork(r.data.classworks ?? [])).catch(() => setClasswork([]));
    load();
  }, []);

  // Only quizzes set for the class this lecture belongs to may be linked.
  const quizChoices = classwork.filter(
    (c) => c.type === 'quiz' && String(c.allocationId) === String(form.allocationId));

  async function submit() {
    setBusy(true);
    try {
      if (editing) {
        await api.put(`/lectures/${editing.id}`, form);
        flash({ type: 'ok', text: 'Lecture updated.' });
      } else {
        await api.post('/lectures', form);
        flash({ type: 'ok', text: 'Lecture posted to the class.' });
      }
      setForm(BLANK); setEditing(null); load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
    finally { setBusy(false); }
  }

  function remove(l) {
    confirm(`Remove “${l.title}”? Students will no longer see it, and their viewing record for it is deleted.`, async () => {
      try { await api.delete(`/lectures/${l.id}`); load(); }
      catch (e) { flash({ type: 'error', text: errText(e) }); }
    });
  }

  async function openPreview(l) {
    setPreview({ ...l, youtubeId: null });
    try {
      const r = await api.get(`/lectures/${l.id}/play`);
      setPreview(r.data.lecture);
    } catch (e) { setPreview(null); flash({ type: 'error', text: errText(e) }); }
  }

  async function openReport(l) {
    setReport({ lecture: l, loading: true });
    try {
      const r = await api.get(`/lectures/${l.id}/report`);
      setReport({ ...r.data, loading: false });
    } catch (e) { setReport(null); flash({ type: 'error', text: errText(e) }); }
  }

  function exportReport() {
    downloadCsv(`lecture-${report.lecture.id}-viewing.csv`, [
      { header: 'Roll No', value: (r) => r.rollNumber },
      { header: 'Name', value: (r) => r.name },
      { header: 'Started', value: (r) => (r.started ? 'yes' : 'no') },
      { header: 'Watched (min)', value: (r) => Math.round(r.watchedSec / 60) },
      { header: 'Furthest %', value: (r) => r.percent ?? '' },
      { header: 'Sittings', value: (r) => r.sessions },
      { header: 'Completed', value: (r) => (r.completedAt ? new Date(r.completedAt).toISOString() : '') },
      { header: 'Quiz attempted', value: (r) => (r.quizAttempted ? 'yes' : 'no') },
      { header: 'Quiz score', value: (r) => (r.quizScore ?? '') },
    ], report.rows);
  }

  return (
    <div className="space-y-6">
      {flashEl}{confirmEl}
      <h1 className="text-2xl font-bold text-slate-900">Recorded Lectures</h1>

      <Card title={editing ? `Edit — ${editing.title}` : 'Post a recorded lecture'}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Class">
            <Select value={form.allocationId} disabled={!!editing}
              onChange={(e) => setForm({ ...form, allocationId: e.target.value, quizId: '' })}>
              <option value="">Select…</option>
              {allocations.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.subject.title} — {a.classSection.program.code} Sem {a.classSection.termNo} ({a.classSection.shift})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Lecture title">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Week 3 — Normalisation" />
          </Field>
          <Field label="YouTube link (unlisted)" hint="Paste the link from the address bar. Only the video id is stored.">
            <Input value={form.youtubeUrl} onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..." />
          </Field>
          <Field label="Follow-up quiz (optional)" hint="Links the lecture to a quiz so you can see who watched it and then sat the quiz.">
            <Select value={form.quizId} onChange={(e) => setForm({ ...form, quizId: e.target.value })}
              disabled={!form.allocationId}>
              <option value="">No quiz</option>
              {quizChoices.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description (optional)">
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" className="h-4 w-4" checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
            Publish to the class now (students are notified)
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" className="h-4 w-4" checked={form.strictTracking}
              onChange={(e) => setForm({ ...form, strictTracking: e.target.checked })} />
            <strong>Strict Tracking:</strong> Students must watch the full duration to get marked as Completed (skipping is not allowed).
          </label>
        </div>

        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Upload the recording to the college channel as <b>Unlisted</b>. A <b>Private</b> video will not play in
          the portal, and a <b>Public</b> one is visible to anyone. The player shows no YouTube controls, title or
          logo and blocks the usual ways of copying the link — but an unlisted video is not secret, and a
          determined viewer can still recover the id from their own browser.
        </p>

        <div className="mt-4 flex gap-2">
          <Button onClick={submit} disabled={busy || !form.allocationId || !form.title || (!editing && !form.youtubeUrl)}>
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Post lecture'}
          </Button>
          {editing && <Button variant="outline" onClick={() => { setEditing(null); setForm(BLANK); }}>Cancel</Button>}
        </div>
      </Card>

      <Card title="My lectures">
        <Table
          columns={[
            { header: 'Title', cell: (l) => <span className="font-medium">{l.title}</span> },
            { header: 'Class', cell: (l) => `${l.subject?.code} · Sem ${l.section?.termNo} (${l.section?.shift})` },
            { header: 'Length', cell: (l) => (l.durationSec ? hhmmss(l.durationSec) : l.durationMins ? `${l.durationMins}m` : '—') },
            { header: 'Quiz', cell: (l) => (l.quiz ? l.quiz.title : <span className="text-slate-400">—</span>) },
            { header: 'Status', cell: (l) => <Badge value={l.isPublished ? 'published' : 'draft'} /> },
            { header: 'Posted', cell: (l) => fmtDate(l.createdAt) },
            {
              header: 'Actions',
              cell: (l) => (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => openReport(l)}>Who watched</Button>
                  <Button variant="outline" onClick={() => openPreview(l)}>Preview</Button>
                  <Button variant="outline" onClick={() => {
                    setEditing(l);
                    setForm({
                      allocationId: l.allocationId ?? '',
                      title: l.title,
                      description: l.description ?? '',
                      youtubeUrl: l.youtubeId ? `https://youtu.be/${l.youtubeId}` : '',
                      durationMins: l.durationMins ?? '',
                      quizId: l.quizId ?? '',
                      isPublished: l.isPublished,
                      strictTracking: l.strictTracking ?? false
                    });
                  }}>Edit</Button>
                  <Button variant="danger" onClick={() => remove(l)}>Delete</Button>
                </div>
              ),
            },
          ]}
          rows={lectures ?? []}
          empty={lectures === null ? 'Loading…' : 'You have not posted any lectures yet.'}
        />
      </Card>

      {/* ── viewing report ─────────────────────────────────────────── */}
      <Modal open={!!report} title={`Who watched — ${report?.lecture?.title ?? ''}`} onClose={() => setReport(null)} wide>
        {report?.loading && <p className="py-8 text-center text-slate-400">Loading…</p>}
        {report && !report.loading && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                ['Students', report.totals.students],
                ['Started', report.totals.started],
                ['Finished', report.totals.completed],
                [report.lecture.quiz ? 'Finished + quiz' : 'Quiz not linked',
                  report.lecture.quiz ? report.totals.completedAndQuizzed : '—'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-200 p-3">
                  <div className="text-2xl font-bold text-primary">{value}</div>
                  <div className="text-xs text-slate-500">{label}</div>
                </div>
              ))}
            </div>

            <Table
              columns={[
                { header: 'Roll No', cell: (r) => <span className="font-mono text-xs">{r.rollNumber}</span> },
                { header: 'Name', cell: (r) => r.name },
                {
                  header: 'Watched %',
                  cell: (r) => (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 rounded-full bg-slate-100">
                        <div className="h-1.5 rounded-full bg-primary" style={{ width: `${r.watchedPct ?? 0}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{r.watchedPct ?? 0}%</span>
                    </div>
                  ),
                },
                { header: 'Viewing time', cell: (r) => <span className="font-mono text-xs">{hhmmss(r.watchedSec)}</span> },
                { header: 'Sittings', cell: (r) => {
                    if (!r.attempts || r.attempts.length === 0) return r.sessions || '—';
                    return (
                      <div className="flex flex-col gap-1 text-xs whitespace-nowrap">
                        {r.attempts.map(a => (
                          <div key={a.sessionNumber} className="flex gap-2 items-center">
                            <span className="font-medium text-slate-700">#{a.sessionNumber}</span>
                            <span className="text-slate-500 font-mono">{hhmmss(a.watchedSec)}</span>
                            <span className="text-slate-400 text-[10px]">({a.watchedPct}%)</span>
                          </div>
                        ))}
                      </div>
                    );
                  } 
                },
                { 
                  header: 'Status', 
                  cell: (r) => {
                    if (!r.started) return <span className="text-slate-400">—</span>;
                    if (r.forwarded) return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Forwarded</span>;
                    if (r.watchedFull) return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Watched Full Video</span>;
                    return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">Watching...</span>;
                  }
                },
                {
                  header: 'Quiz',
                  cell: (r) => (!report.lecture.quiz
                    ? <span className="text-slate-400">—</span>
                    : r.quizAttempted
                      ? <Badge value={r.quizScore != null ? `scored ${r.quizScore}` : 'attempted'} />
                      : <Badge value="pending" />),
                },
                { header: 'Last seen', cell: (r) => (r.lastSeenAt ? fmtDateTime(r.lastSeenAt) : '—') },
              ]}
              rows={report.rows}
              empty="No students in this class."
            />

            <div className="flex justify-between">
              <p className="max-w-xl text-xs text-slate-400">
                Viewing time counts only while the video is playing with the tab in front, and the server caps each
                report to the time that has actually passed. Treat it as evidence of engagement rather than proof of
                attention.
              </p>
              <Button variant="outline" onClick={exportReport}>Export CSV</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!preview} title={preview?.title ?? ''} onClose={() => setPreview(null)} wide>
        {preview && <SecurePlayer youtubeId={preview.youtubeId} title={preview.title} />}
      </Modal>
    </div>
  );
}
