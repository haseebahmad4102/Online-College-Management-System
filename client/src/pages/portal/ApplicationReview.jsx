import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Button, Modal, Textarea, Field, useFlash, errText, fmtDate } from '../../components/ui';

// Clerk verification desk: open one application → approve/reject each document (§5.3)
export default function ApplicationReview() {
  // admissions.view opens the application read-only; deciding documents needs admissions.verify.
  const { can } = useAuth();
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [reject, setReject] = useState(null); // doc being rejected
  const [remarks, setRemarks] = useState('');
  const [rejectApp, setRejectApp] = useState(false); // whole-application rejection
  const [appReason, setAppReason] = useState('');
  const [flash, flashEl] = useFlash();
  const [previews, setPreviews] = useState({}); // docId -> object URL, image docs only

  const load = () => api.get(`/admissions/${id}`).then((r) => setApp(r.data.application));
  useEffect(() => { load(); }, [id]);

  // Small preview thumbnails for image documents so the office doesn't have to
  // open a new tab just to eyeball each one.
  useEffect(() => {
    (app?.documents ?? []).forEach((doc) => {
      const ext = (doc.filePath || '').split('.').pop()?.toLowerCase();
      if (!['jpg', 'jpeg', 'png'].includes(ext) || previews[doc.id]) return;
      api.get(`/admissions/documents/${doc.id}/download`, { responseType: 'blob' })
        .then((res) => setPreviews((p) => ({ ...p, [doc.id]: URL.createObjectURL(res.data) })))
        .catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app]);

  if (!app) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  async function decide(doc, action, docRemarks) {
    try {
      await api.put(`/admissions/documents/${doc.id}`, { action, remarks: docRemarks });
      flash({ type: 'ok', text: action === 'approve' ? 'Document approved.' : 'Document rejected — applicant notified.' });
      setReject(null); setRemarks('');
      load();
    } catch (e) {
      flash({ type: 'error', text: errText(e) });
    }
  }

  // Reject the whole application with a written reason — independent of document
  // review (e.g. bogus data, duplicate, disciplinary), calls PUT /admissions/:id/reject.
  async function rejectApplication() {
    try {
      await api.put(`/admissions/${id}/reject`, { reason: appReason });
      flash({ type: 'ok', text: 'Application rejected — applicant notified.' });
      setRejectApp(false); setAppReason('');
      load();
    } catch (e) {
      flash({ type: 'error', text: errText(e) });
    }
  }

  // Final decision — approve the whole application once every required document
  // is individually approved. The server re-checks this and returns a clear
  // error naming the still-pending documents if the office jumps ahead.
  async function approveApplication() {
    try {
      await api.put(`/admissions/${id}/approve`);
      flash({ type: 'ok', text: 'Application approved — applicant notified to wait for the merit list.' });
      load();
    } catch (e) {
      flash({ type: 'error', text: errText(e) });
    }
  }

  const canDecide = can('admissions.approve');
  const canApproveApp = canDecide && ['submitted', 'docs_rejected'].includes(app.status);
  const canRejectApp = canDecide && !['rejected', 'enrolled'].includes(app.status);

  const pct = (o, t) => (o && t ? ((o / t) * 100).toFixed(1) + '%' : '—');

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-section, .print-section * {
            visibility: visible;
          }
          .print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            color: black;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      {flashEl}
      <div className="flex items-center justify-between no-print">
        <div>
          <Link to="/portal/verification" className="text-sm text-slate-500 hover:text-primary">← Queue</Link>
          <h1 className="text-2xl font-bold text-slate-900">{app.applicationNo} — {app.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => downloadApplicationPdf(app)}>Download application (PDF)</Button>
          <Button variant="outline" onClick={() => window.print()}>Print</Button>
          {canApproveApp && <Button onClick={approveApplication}>Approve application</Button>}
          {canRejectApp && <Button variant="danger" onClick={() => setRejectApp(true)}>Reject application</Button>}
          <Badge value={app.status} />
        </div>
      </div>

      {app.status === 'rejected' && app.remarks && (
        <div className="no-print rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <b>Rejected — reason sent to applicant:</b> {app.remarks}
        </div>
      )}

      <div className="print-section grid gap-6 lg:grid-cols-2">
        <Card title="Applicant details">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {[
              ['Name', app.name], ['Father name', app.fatherName],
              ['CNIC/B-Form', app.cnicBform], ['Gender', app.gender],
              ['Date of birth', fmtDate(app.dob)],
              ['Province', app.province ? `${app.province}${app.province !== 'Punjab' ? ' — NOC required' : ''}` : '—'],
              ['Domicile', app.domicile],
              ['Phone', app.phone], ['Guardian phone', app.guardianPhone ?? '—'],
              ['Address', app.address], ['Hafiz-e-Quran', app.isHafiz ? 'Yes (bonus applies)' : 'No'],
              ['Marital status', app.maritalStatus ?? '—'], ['Blood group', app.bloodGroup ?? '—'],
              ['Disability', app.hasDisability ? (app.disabilityDetails || 'Yes') : 'None'],
              ['Medical conditions', app.medicalConditions || 'None declared'],
              ['Program', app.program.name], ['Cycle', app.cycle.title],
            ].map(([k, v]) => (
              <div key={k}><dt className="text-xs uppercase text-slate-400">{k}</dt><dd className="text-slate-700">{v}</dd></div>
            ))}
          </dl>
        </Card>

        <Card title="Academic record">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div><dt className="text-xs uppercase text-slate-400">Matric</dt>
              <dd className="text-slate-700">{app.matricBoard} {app.matricYear} · Roll {app.matricRollNo}<br />{app.matricObtained}/{app.matricTotal} ({pct(app.matricObtained, app.matricTotal)})</dd></div>
            {app.interObtained && (
              <div><dt className="text-xs uppercase text-slate-400">Intermediate ({app.interGroup?.name})</dt>
                <dd className="text-slate-700">{app.interBoard} {app.interYear} · Roll {app.interRollNo}<br />{app.interObtained}/{app.interTotal} ({pct(app.interObtained, app.interTotal)})</dd></div>
            )}
            {app.meritScore && (
              <div><dt className="text-xs uppercase text-slate-400">Merit score</dt><dd className="font-semibold text-primary">{app.meritScore}</dd></div>
            )}
          </dl>
        </Card>
      </div>

      <Card title="Documents — approve or reject each" className="no-print">
        <div className="space-y-3">
          {app.documents.map((doc) => (
            <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
              <div className="flex items-center gap-3">
                {previews[doc.id] ? (
                  <img src={previews[doc.id]} alt="" className="h-12 w-12 rounded border border-slate-200 object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded border border-slate-200 bg-slate-50 text-lg text-slate-400">📄</div>
                )}
                <div>
                  <div className="text-sm font-medium text-slate-800">{doc.documentType.name}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                    <Badge value={doc.status} />
                    {doc.remarks && <span className="text-red-500">{doc.remarks}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => viewDoc(doc)}>View</Button>
                <Button variant="outline" onClick={() => downloadDoc(doc)}>Download</Button>
                {doc.status !== 'approved' && can('admissions.verify') && <Button onClick={() => decide(doc, 'approve')}>Approve</Button>}
                {doc.status !== 'rejected' && can('admissions.verify') && <Button variant="danger" onClick={() => setReject(doc)}>Reject</Button>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={!!reject} title={`Reject: ${reject?.documentType.name}`} onClose={() => setReject(null)}>
        <Field label="Reason (sent to the applicant)">
          <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. Scan is blurred — upload a clear copy" />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setReject(null)}>Cancel</Button>
          <Button variant="danger" disabled={!remarks.trim()} onClick={() => decide(reject, 'reject', remarks)}>Reject document</Button>
        </div>
      </Modal>

      {/* Reject the whole application (not tied to a single document) */}
      <Modal open={rejectApp} title={`Reject application ${app.applicationNo}`} onClose={() => setRejectApp(false)}>
        <p className="mb-3 text-sm text-slate-500">
          This rejects the entire application (e.g. ineligible, duplicate, or incorrect information) — separate from
          document review. The applicant is notified with your reason.
        </p>
        <Field label="Reason for rejection (sent to the applicant)">
          <Textarea value={appReason} onChange={(e) => setAppReason(e.target.value)} placeholder="e.g. Submitted marks do not match the attached result card." />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setRejectApp(false)}>Cancel</Button>
          <Button variant="danger" disabled={!appReason.trim()} onClick={rejectApplication}>Reject application</Button>
        </div>
      </Modal>
    </div>
  );
}

async function viewDoc(doc) {
  // fetch with auth header, open blob (files are on the private disk — §1.8)
  const res = await api.get(`/admissions/documents/${doc.id}/download`, { responseType: 'blob' });
  window.open(URL.createObjectURL(res.data), '_blank');
}

async function downloadDoc(doc) {
  const res = await api.get(`/admissions/documents/${doc.id}/download`, { responseType: 'blob' });
  const ext = (doc.filePath || '').split('.').pop() || 'bin';
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${doc.documentType?.name?.replace(/[^A-Za-z0-9 _-]/g, '') || 'document'}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function downloadApplicationPdf(app) {
  const res = await api.get(`/admissions/${app.id}/pdf`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${app.applicationNo}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
