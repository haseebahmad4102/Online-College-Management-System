import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Button, useFlash, errText, fmtDate, termLabel } from '../../components/ui';

// Student card with QR (roll number) — print-friendly (§5.6)
export default function StudentCard() {
  const [data, setData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [flash, flashEl] = useFlash();

  const load = () => api.get('/students/me/card').then((r) => setData(r.data));
  useEffect(() => { load(); }, []);

  async function uploadPhoto(file) {
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('photo', file);
      await api.post('/students/me/photo', fd);
      flash({ type: 'ok', text: 'Photo updated — it now appears on your card.' });
      load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
    finally { setUploading(false); }
  }

  if (!data) return <div className="py-20 text-center text-slate-400">Loading…</div>;
  const { student, college, validUntil } = data;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(student.rollNumber)}`;

  return (
    <div className="space-y-6">
      {flashEl}
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold text-slate-900">Student Card</h1>
        <div className="flex gap-2">
          <label className={`cursor-pointer rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 hover:border-primary ${uploading ? 'pointer-events-none opacity-60' : ''}`}>
            {uploading ? 'Uploading…' : student.photoPath ? 'Change photo' : 'Upload photo'}
            <input type="file" accept=".jpg,.jpeg,.png" className="hidden"
              onChange={(e) => e.target.files[0] && uploadPhoto(e.target.files[0])} />
          </label>
          <Button onClick={() => window.print()}>Print card</Button>
        </div>
      </div>

      <div className="print-area print-card mx-auto w-[420px] overflow-hidden rounded-xl border-2 border-primary bg-white shadow-lg">
        <div className="bg-primary px-4 py-2 text-white">
          <div className="text-sm font-bold">{college.nameEn}</div>
          <div className="font-urdu text-xs" dir="rtl">{college.nameUr}</div>
        </div>
        <div className="flex gap-4 p-4">
          {student.photoPath ? (
            <img src={student.photoPath} alt="Student photo" className="h-24 w-20 shrink-0 rounded border border-slate-200 bg-slate-100 object-cover" />
          ) : (
            <div className="flex h-24 w-20 shrink-0 items-center justify-center rounded bg-slate-100 text-3xl font-bold text-slate-300">
              {student.name[0]}
            </div>
          )}
          <dl className="flex-1 space-y-0.5 text-xs">
            <div><dt className="inline font-semibold">Name:</dt> <dd className="inline">{student.name}</dd></div>
            <div><dt className="inline font-semibold">Father:</dt> <dd className="inline">{student.fatherName}</dd></div>
            <div><dt className="inline font-semibold">Roll No:</dt> <dd className="inline font-bold text-primary">{student.rollNumber}</dd></div>
            <div><dt className="inline font-semibold">Program:</dt> <dd className="inline">{student.program.name}</dd></div>
            <div><dt className="inline font-semibold">Shift:</dt> <dd className="inline">{student.classSection ? `${termLabel(student.program?.level, student.classSection.termNo)} (${student.classSection.shift})` : '—'}</dd></div>
            <div><dt className="inline font-semibold">Session:</dt> <dd className="inline">{student.classSection?.academicSession?.name ?? '—'}</dd></div>
            {validUntil && <div><dt className="inline font-semibold">Valid until:</dt> <dd className="inline">{fmtDate(validUntil)}</dd></div>}
          </dl>
          <img src={qr} alt="QR code" className="h-[90px] w-[90px]" />
        </div>
        <div className="flex items-end justify-between border-t border-slate-200 px-4 py-2 text-[10px] text-slate-500">
          <span>If found, please return to the college office.</span>
          <span className="border-t border-slate-400 px-3 pt-0.5">Principal</span>
        </div>
      </div>
    </div>
  );
}
