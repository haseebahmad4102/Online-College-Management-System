import { useEffect, useState } from 'react';
import api from '../../api/client';
import { Card, Table, Badge, Button, Input, Select, fmtDateTime } from '../../components/ui';

// System-wide audit trail (admin + principal): every mutating operation anyone
// performs — who, what, when, with what data, and how the request ended.
export default function AuditLogs() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [method, setMethod] = useState('');
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    api.get('/admin/audit-logs', { params: { page, q: q || undefined, method: method || undefined } })
      .then((r) => setData(r.data));
  }, [page, q, method]);

  const badge = (m) => ({ POST: 'created', PUT: 'updated', PATCH: 'updated', DELETE: 'deleted' }[m] ?? m);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-sm text-slate-500">Every change anyone makes in the system is recorded here automatically.</p>
      </div>

      <Card
        actions={
          <div className="flex items-center gap-2">
            <Input placeholder="Search user, action, or path…" value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }} style={{ width: 240 }} />
            <Select value={method} onChange={(e) => { setMethod(e.target.value); setPage(1); }} style={{ width: 130 }}>
              <option value="">All actions</option>
              <option value="POST">Created</option>
              <option value="PUT">Updated</option>
              <option value="DELETE">Deleted</option>
            </Select>
          </div>
        }
      >
        <Table
          columns={[
            { header: 'When', cell: (l) => <span className="whitespace-nowrap text-xs">{fmtDateTime(l.createdAt)}</span> },
            {
              header: 'Who',
              cell: (l) => (
                <div>
                  <div className="text-sm font-medium text-slate-800">{l.userName ?? '—'}</div>
                  {l.userRoles && <div className="text-[11px] capitalize text-slate-400">{l.userRoles}</div>}
                </div>
              ),
            },
            { header: 'Action', cell: (l) => <span className="capitalize">{l.action}</span> },
            { header: 'Type', cell: (l) => <Badge value={badge(l.method)} /> },
            {
              header: 'Result',
              cell: (l) => (
                <span className={`text-xs font-semibold ${l.status < 400 ? 'text-green-700' : 'text-red-600'}`}>
                  {l.status < 400 ? 'OK' : `Failed (${l.status})`}
                </span>
              ),
            },
            {
              header: 'Details',
              cell: (l) => (
                <Button variant="outline" onClick={() => setDetail(detail?.id === l.id ? null : l)}>
                  {detail?.id === l.id ? 'Hide' : 'View'}
                </Button>
              ),
            },
          ]}
          rows={data?.logs ?? []}
          empty={data === null ? 'Loading…' : 'No operations recorded yet.'}
          expandedRowRender={(l) => detail?.id === l.id ? (
            <div className="text-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold text-slate-700">Request details</span>
                <span className="font-mono text-xs text-slate-400">{l.method} {l.path}</span>
              </div>
              <dl className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
                <div><dt className="inline text-slate-400">By: </dt><dd className="inline">{l.userName ?? 'Not signed in'}</dd></div>
                <div><dt className="inline text-slate-400">IP: </dt><dd className="inline font-mono text-xs">{l.ip ?? '—'}</dd></div>
              </dl>
              {l.summary && (
                <div className="mt-2 rounded border border-slate-200 bg-white p-3 text-xs text-slate-600">
                  <div className="mb-1 font-semibold text-slate-700">Payload / Changes:</div>
                  <ul className="space-y-1">
                    {Object.entries(l.summary).map(([k, v]) => (
                      <li key={k}>
                        <span className="font-medium text-slate-700 capitalize">
                          {k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toLowerCase()}
                        </span>
                        :{' '}
                        <span className="text-slate-600">
                          {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </span>
                      </li>
                    ))}
                    {Object.keys(l.summary).length === 0 && (
                      <li className="italic text-slate-400">Empty payload</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        />

        {data && data.pages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>{data.total} operations · page {data.page} of {data.pages}</span>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Newer</Button>
              <Button variant="outline" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Older →</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
