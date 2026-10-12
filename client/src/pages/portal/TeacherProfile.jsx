import { useEffect, useRef, useState } from 'react';
import api from '../../api/client';
import { Card, Button, Input, Field, Textarea, useFlash, errText } from '../../components/ui';

// Teacher self-service profile (§5.2): photo + academic story shown on the public
// Faculty page. Identity fields (name, CNIC, department) are clerk-managed.
export default function TeacherProfile() {
  const [teacher, setTeacher] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [flash, flashEl] = useFlash();
  const fileRef = useRef(null);

  useEffect(() => {
    api.get('/teachers/me').then((r) => {
      setTeacher(r.data.teacher);
      const t = r.data.teacher;
      setForm({
        qualification: t.qualification ?? '', specialization: t.specialization ?? '',
        education: t.education ?? '', experience: t.experience ?? '', phone: t.phone ?? '',
      });
    });
  }, []);

  if (!teacher) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function save() {
    try {
      setSaving(true);
      const r = await api.put('/teachers/me', form);
      flash({ type: 'ok', text: r.data.message });
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
    finally { setSaving(false); }
  }

  // Picker → immediate upload, so there is never a disabled button to puzzle over.
  async function uploadPhoto(file) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      flash({ type: 'error', text: 'Photo is too large — maximum size is 2 MB.' });
      return;
    }
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('photo', file);
      const r = await api.post('/teachers/me/photo', fd);
      setTeacher((t) => ({ ...t, photoPath: r.data.url }));
      flash({ type: 'ok', text: 'Photo updated — it is live on the Faculty page.' });
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
    finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="space-y-6">
      {flashEl}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500">What you write here appears on the college website's Faculty page.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Photo + fixed identity */}
        <Card title="My photo">
          <div className="text-center">
            {teacher.photoPath ? (
              <img src={teacher.photoPath} alt="My photo" className="mx-auto mb-3 h-36 w-36 rounded-full border-4 border-green-100 object-cover object-top" />
            ) : (
              <div className="mx-auto mb-3 flex h-36 w-36 items-center justify-center rounded-full bg-primary text-4xl font-bold text-white">
                {teacher.name.split(' ').filter((w) => w.length > 2).slice(0, 2).map((w) => w[0]).join('')}
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => uploadPhoto(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <Button type="button" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? 'Uploading…' : teacher.photoPath ? 'Change photo' : 'Upload photo'}
            </Button>
            <p className="mt-2 text-xs text-slate-400">JPG, PNG, or WEBP — max 2 MB.</p>
          </div>
          <dl className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm">
            {[
              ['Name', teacher.name],
              ['Designation', teacher.designation?.title],
              ['Department', teacher.department?.name],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <dt className="text-slate-400">{k}</dt><dd className="text-right font-medium text-slate-700">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-slate-400">Name, designation, and department are managed by the college office.</p>
        </Card>

        {/* Editable academic story */}
        <Card title="Academic profile" className="lg:col-span-2">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Highest qualification" hint="e.g. PhD Computer Science (2018)">
                <Input value={form.qualification} onChange={set('qualification')} />
              </Field>
              <Field label="Specialization" hint="e.g. Databases & Web Systems">
                <Input value={form.specialization} onChange={set('specialization')} />
              </Field>
            </div>
            <Field label="Education" hint="Degrees with institutes and years — one per line.">
              <Textarea rows={4} value={form.education} onChange={set('education')}
                placeholder={'PhD Computer Science — Punjab University, Lahore (2018)\nMS Computer Science — BZU Multan (2012)'} />
            </Field>
            <Field label="Experience & previous jobs" hint="Positions held before/at GGCM — one per line.">
              <Textarea rows={4} value={form.experience} onChange={set('experience')}
                placeholder={'Assistant Professor — Govt. College Multan (2015–2020)\nLecturer — Govt. College Layyah (2012–2015)'} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={set('phone')} />
            </Field>
            <Button disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save profile'}</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
