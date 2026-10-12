import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client';
import { Card, Table, Badge, Button, useFlash, errText, fmtDate } from '../../components/ui';
import ChallanPrint from '../../components/ChallanPrint';

export function MyApplicationsList() {
  const [apps, setApps] = useState(null);
  useEffect(() => {
    api.get('/admissions/mine').then((r) => setApps(r.data.applications));
  }, []);
  // A draft is unfinished work-in-progress — resume the wizard instead of a dead-end detail page.
  const rowLink = (a) => (a.status === 'draft' ? '/portal/apply' : `/portal/applications/${a.id}`);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
        <Link to="/portal/apply"><Button>+ New application</Button></Link>
      </div>
      <Card>
        <Table
          columns={[
            { header: 'App No', cell: (a) => <Link to={rowLink(a)} className="font-medium text-primary hover:underline">{a.applicationNo}</Link> },
            { header: 'Program', cell: (a) => a.program.name },
            { header: 'Cycle', cell: (a) => a.cycle.title },
            { header: 'Submitted', cell: (a) => (a.status === 'draft' ? '—' : fmtDate(a.createdAt)) },
            { header: 'Status', cell: (a) => <Badge value={a.status} /> },
          ]}
          rows={apps ?? []}
          empty={apps === null ? 'Loading…' : 'You have not applied yet.'}
        />
      </Card>
    </div>
  );
}

// One clear message per lifecycle stage — the applicant should never have to
// guess what a status badge means or what to do next.
function StatusMessage({ app }) {
  switch (app.status) {
    case 'submitted':
      return (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          Your application has been submitted and is waiting for the admissions office to review your documents.
        </div>
      );
    case 'docs_rejected':
      return (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
          One or more documents were rejected — see the reason next to each document below and re-upload it.
        </div>
      );
    case 'verified':
      return (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">
          Your application has been approved by the admissions office. Please wait for the merit list —
          you will be notified here as soon as it is published.
        </div>
      );
    case 'rejected':
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <b>Your application was rejected.</b>{app.remarks ? <> Reason: {app.remarks}</> : null}
        </div>
      );
    case 'selected':
    case 'challan_issued':
      return (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          🎉 Congratulations — you have been selected! Download your fee challan below, pay it at the bank,
          then upload the paid copy so the office can verify it and complete your enrollment.
        </div>
      );
    case 'waitlisted':
      return (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          You are on the waiting list. If a selected candidate does not pay in time, their seat may be
          offered to the waiting list in the next merit list.
        </div>
      );
    case 'fee_submitted':
      return (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-800">
          Your paid challan copy has been received and is awaiting verification by the admissions office.
        </div>
      );
    case 'forfeited':
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Your seat was released because the fee was not paid before the due date.
        </div>
      );
    case 'not_selected':
      return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          We are sorry — your name did not appear in any merit list for this program in this admission
          cycle. You are welcome to apply again in a future admission cycle.
        </div>
      );
    case 'enrolled':
      return (
        <div className="space-y-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <p>🎉 Admission complete — you are officially enrolled! Your student portal is now active.</p>
          <p>
            For account security, please <Link to="/portal/account" className="font-semibold underline">change your password</Link> in
            Account Settings — you are currently still using your applicant login. You can also
            {' '}<Link to="/portal/card" className="font-semibold underline">generate your Student Card</Link> from the student portal.
          </p>
        </div>
      );
    default:
      return null;
  }
}

// Application detail: status, documents (upload/re-upload), challan (§14 temporary-portal formalities)
export function ApplicationDetail() {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [docTypes, setDocTypes] = useState([]);
  const [printData, setPrintData] = useState(null);
  const [flash, flashEl] = useFlash();

  const load = () => api.get(`/admissions/${id}`).then((r) => { setApp(r.data.application); setDocTypes(r.data.documentTypes ?? []); });
  useEffect(() => { load(); }, [id]);

  if (!app) return <div className="py-20 text-center text-slate-400">Loading…</div>;

  async function uploadDoc(typeId, file) {
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.post(`/admissions/${app.id}/documents/${typeId}`, fd);
      flash({ type: 'ok', text: 'Document uploaded.' });
      load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  async function uploadPaid(challan, file) {
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.post(`/challans/${challan.id}/paid-copy`, fd);
      flash({ type: 'ok', text: 'Paid copy uploaded — awaiting verification.' });
      load();
    } catch (e) { flash({ type: 'error', text: errText(e) }); }
  }

  async function openPrint(c) {
    const r = await api.get(`/challans/${c.id}/print-data`);
    setPrintData(r.data);
  }

  const editable = ['submitted', 'docs_rejected'].includes(app.status);

  async function downloadPdf() {
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

  return (
    <div className="space-y-6">
      {flashEl}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/portal/applications" className="text-sm text-slate-500 hover:text-primary">← My applications</Link>
          <h1 className="text-2xl font-bold text-slate-900">{app.applicationNo}</h1>
          <p className="text-slate-500">{app.program.name} — {app.cycle.title}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={downloadPdf}>Download application (PDF)</Button>
          <Badge value={app.status} />
        </div>
      </div>

      <StatusMessage app={app} />

      <Card title="Documents">
        {editable && docTypes.some((dt) => dt.isRequired && !app.documents.some((d) => d.documentTypeId === dt.id)) && (
          <p className="mb-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            Upload every <b>required</b> document below — the clerk can only verify your application once all of them are in.
          </p>
        )}
        <div className="space-y-3">
          {docTypes.map((dt) => {
            const doc = app.documents.find((d) => d.documentTypeId === dt.id);
            return (
              <div key={dt.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                <div>
                  <div className="text-sm font-medium text-slate-800">
                    {dt.name}{' '}
                    {dt.isRequired
                      ? <span className="ml-1 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-600">Required</span>
                      : <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500">Optional</span>}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs">
                    {doc ? <Badge value={doc.status} /> : <span className="text-slate-400">Not uploaded yet</span>}
                    {doc?.remarks && <span className="text-red-500">{doc.remarks}</span>}
                  </div>
                </div>
                {editable && (!doc || doc.status !== 'approved') && (
                  <label className={`cursor-pointer rounded-lg px-3.5 py-2 text-sm font-medium ${doc ? 'border border-slate-300 text-slate-700 hover:border-primary' : 'bg-primary text-white hover:opacity-90'}`}>
                    {!doc ? 'Upload' : doc.status === 'rejected' ? 'Re-upload' : 'Replace'}
                    <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden"
                      onChange={(e) => e.target.files[0] && uploadDoc(dt.id, e.target.files[0])} />
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {app.challans.length > 0 && (
        <Card title="Fee challan">
          <Table
            columns={[
              { header: 'Challan No', cell: (c) => c.challanNo },
              { header: 'Amount', cell: (c) => `Rs. ${Number(c.totalAmount).toLocaleString()}` },
              { header: 'Due', cell: (c) => fmtDate(c.dueDate) },
              { header: 'Status', cell: (c) => <Badge value={c.status} /> },
              {
                header: 'Actions',
                cell: (c) => (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => openPrint(c)}>View / print</Button>
                    {['unpaid', 'rejected'].includes(c.status) && (
                      <label className="cursor-pointer rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-white hover:bg-primary-dark">
                        Upload paid copy
                        <input type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden"
                          onChange={(e) => e.target.files[0] && uploadPaid(c, e.target.files[0])} />
                      </label>
                    )}
                  </div>
                ),
              },
            ]}
            rows={app.challans}
          />
          {app.challans.filter((c) => c.status === 'rejected' && c.remarks).map((c) => (
            <p key={c.id} className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
              <b>{c.challanNo} rejected:</b> {c.remarks} — please upload a corrected paid copy.
            </p>
          ))}
        </Card>
      )}
      {printData && <ChallanPrint data={printData} onClose={() => setPrintData(null)} />}
    </div>
  );
}
