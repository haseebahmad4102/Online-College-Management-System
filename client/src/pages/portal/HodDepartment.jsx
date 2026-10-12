import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { Card, Table, Badge, Button, Input, Textarea, Field, Modal, FitImage, useFlash, useConfirm, errText, fmtDate } from '../../components/ui';

// HOD workspace: manage the department's public page (message + gallery) and
// see its students with their attendance.
export default function HodDepartment() {
  const [data, setData] = useState(null); // { department, studentCount }
  const [denied, setDenied] = useState(null);
  const [tab, setTab] = useState('Overview');
  const [form, setForm] = useState({ message: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [students, setStudents] = useState(null);
  const [attDetail, setAttDetail] = useState(null);
  const fileRef = useRef(null);
  const [flash, flashEl] = useFlash();
  const [confirm, confirmEl] = useConfirm();

  const load = () =>
    api.get('/hod/department')
      .then((r) => {
        setData(r.data);
        setForm({ message: r.data.department.message ?? '', description: r.data.department.description ?? '' });
      })
      .catch((e) => setDenied(errText(e)));

  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (tab === 'Students' && students === null) {
      api.get('/hod/students').then((r) => setStudents(r.data.students));
    }
  }, [tab, students]);

  if (denied) {
    return (
      <div className="py-20 text-center text-slate-500">
        <p className="mb-2 text-4xl">🏛️</p>
        <p>{denied}</p>
      </div>
    );
  }
  if (!data) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  const d = data.department;

  async function savePage() {
    try {
      setSaving(true);
      const r = await api.put('/hod/department', form);
      flash({ type: 'ok', text: r.data.message });
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
    finally { setSaving(false); }
  }

  async function uploadPhoto(file) {
    if (!file) return;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('image', file);
      if (caption.trim()) fd.append('caption', caption.trim());
      const r = await api.post('/hod/gallery', fd);
      flash({ type: 'ok', text: r.data.message });
      setCaption('');
      await load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
    finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function removePhoto(img) {
    confirm('Remove this photo from the department gallery?', async () => {
      try {
        const r = await api.delete(`/hod/gallery/${img.id}`);
        flash({ type: 'ok', text: r.data.message });
        await load();
      } catch (e) { flash({ type: 'error', text: errText(e) }); }
    });
  }

  async function openAttendance(s) {
    const r = await api.get(`/hod/students/${s.id}/attendance`);
    setAttDetail(r.data);
  }

  return (
    <div className="space-y-6">
      {flashEl}{confirmEl}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Department — {d.name}</h1>
          <p className="text-sm text-slate-500">You are the Head of Department. What you publish here appears on the public website.</p>
        </div>
        <Link to={`/departments/${d.id}`} target="_blank"
          className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 hover:border-primary hover:text-primary">
          View public page ↗
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          [d.programs.length, 'Programs'],
          [d._count.teachers, 'Faculty'],
          [data.studentCount, 'Active Students'],
          [d.galleryImages.length, 'Gallery Photos'],
        ].map(([v, l]) => (
          <div key={l} className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <div className="text-2xl font-bold text-primary">{v}</div>
            <div className="text-xs text-slate-500">{l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {['Overview', 'Gallery', 'Students'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition ${tab === t ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <Card title="Department page — shown on the public website">
          <div className="space-y-4">
            <Field label="HOD message" hint="Your message to students and visitors — shown beside your photo on the department page.">
              <Textarea rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder={'Welcome to the Department of ' + d.name + '…'} />
            </Field>
            <Field label="About the department" hint="Short introduction — also appears under the department title.">
              <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <Button disabled={saving} onClick={savePage}>{saving ? 'Saving…' : 'Publish changes'}</Button>
          </div>
        </Card>
      )}

      {tab === 'Gallery' && (
        <Card
          title="Department gallery"
          actions={
            <div className="flex items-center gap-2">
              <Input placeholder="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} style={{ width: 200 }} />
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                onChange={(e) => uploadPhoto(e.target.files?.[0] ?? null)} />
              <Button disabled={uploading} onClick={() => fileRef.current?.click()}>
                {uploading ? 'Uploading…' : '+ Add photo'}
              </Button>
            </div>
          }
        >
          {d.galleryImages.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-400">
              No photos yet — add labs, classrooms, events, and student work. They appear on your department's public page.
            </p>
          )}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {d.galleryImages.map((g) => (
              <figure key={g.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <FitImage src={g.imagePath} alt={g.caption || 'Department photo'} className="h-36 w-full" />
                {g.caption && <figcaption className="px-3 py-2 text-xs text-slate-500">{g.caption}</figcaption>}
                <button
                  onClick={() => removePhoto(g)}
                  title="Remove photo"
                  className="absolute right-2 top-2 hidden h-7 w-7 items-center justify-center rounded-full bg-white/90 text-sm text-red-600 shadow group-hover:flex"
                >
                  ✕
                </button>
              </figure>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">JPG, PNG, or WEBP — max 2 MB per photo.</p>
        </Card>
      )}

      {tab === 'Students' && (
        <Card title={`Students — Department of ${d.name}`}>
          <Table
            columns={[
              { header: 'Roll No', cell: (s) => <span className="font-mono text-xs">{s.rollNumber}</span> },
              { header: 'Name', cell: (s) => s.name },
              { header: 'Class', cell: (s) => s.termNo ? `${s.program} — Semester ${s.termNo} (${s.shift})` : s.program },
              {
                header: 'Attendance',
                cell: (s) =>
                  s.attendance.pct === null
                    ? <span className="text-xs text-slate-400">No sheets yet</span>
                    : (
                      <span className={`font-semibold ${s.attendance.pct >= 75 ? 'text-green-700' : 'text-red-600'}`}>
                        {s.attendance.pct}%
                        <span className="ml-1 font-normal text-xs text-slate-400">
                          ({s.attendance.present}P / {s.attendance.absent}A / {s.attendance.leave}L)
                        </span>
                      </span>
                    ),
              },
              { header: '', cell: (s) => <Button variant="outline" onClick={() => openAttendance(s)}>Attendance detail</Button> },
            ]}
            rows={students ?? []}
            empty={students === null ? 'Loading…' : 'No active students enrolled in this department yet.'}
          />
        </Card>
      )}

      {/* Per-student attendance detail */}
      <Modal open={!!attDetail} title={attDetail ? `Attendance — ${attDetail.student.name} (${attDetail.student.rollNumber})` : ''} onClose={() => setAttDetail(null)}>
        {attDetail && (
          <div className="max-h-[60vh] overflow-y-auto">
            {attDetail.records.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No attendance marked yet.</p>}
            <ul className="space-y-1.5">
              {attDetail.records.map((r, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <span className="text-slate-700">{r.subject}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{fmtDate(r.date)}</span>
                    <Badge value={r.status} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </div>
  );
}
