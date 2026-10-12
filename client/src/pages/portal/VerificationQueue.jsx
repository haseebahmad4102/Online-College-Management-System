import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Card, Table, Badge, fmtDate } from '../../components/ui';

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest first', cmp: (a, b) => Number(b.id) - Number(a.id) },
  { key: 'oldest', label: 'Oldest first', cmp: (a, b) => Number(a.id) - Number(b.id) },
  { key: 'name_asc', label: 'Name (A–Z)', cmp: (a, b) => a.name.localeCompare(b.name) },
  { key: 'name_desc', label: 'Name (Z–A)', cmp: (a, b) => b.name.localeCompare(a.name) },
  { key: 'program', label: 'Program', cmp: (a, b) => a.program.name.localeCompare(b.program.name) },
  { key: 'merit', label: 'Merit score (high–low)', cmp: (a, b) => (Number(b.meritScore) || -1) - (Number(a.meritScore) || -1) },
];

export default function VerificationQueue() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('submitted');
  const [allApps, setAllApps] = useState([]);
  const [loading, setLoading] = useState(true);
  // Newest first by default — matches the server's default order.
  const [sortKey, setSortKey] = useState('newest');

  useEffect(() => {
    setLoading(true);
    api.get('/admissions/queue', { params: { status: 'all' } })
      .then((r) => {
        setAllApps(r.data.applications);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const counts = {
    submitted: allApps.filter((a) => a.status === 'submitted').length,
    verified: allApps.filter((a) => a.status === 'verified').length,
    docs_rejected: allApps.filter((a) => a.status === 'docs_rejected').length,
    enrolled: allApps.filter((a) => a.status === 'enrolled').length,
    all: allApps.length,
  };

  const filteredApps = allApps
    .filter((a) => {
      if (status === 'all') return true;
      return a.status === status;
    })
    .sort(SORT_OPTIONS.find((o) => o.key === sortKey).cmp);

  const tabs = [
    { key: 'submitted', label: 'Submitted', countKey: 'submitted' },
    { key: 'verified', label: 'Verified', countKey: 'verified' },
    { key: 'docs_rejected', label: 'Docs Rejected', countKey: 'docs_rejected' },
    { key: 'enrolled', label: 'Enrolled', countKey: 'enrolled' },
    { key: 'all', label: 'All Applications', countKey: 'all' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Admissions — Verification Desk</h1>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Sort by
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {SORT_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </label>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-px">
        {tabs.map((tab) => {
          const count = counts[tab.countKey] || 0;
          const isActive = status === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatus(tab.key)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  isActive
                    ? 'bg-primary text-white'
                    : count > 0
                    ? 'bg-slate-200 text-slate-700 font-semibold'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {count > 0 ? `${count}+` : '0'}
              </span>
            </button>
          );
        })}
      </div>

      <Card>
        <Table
          onRowClick={(a) => navigate(`/portal/verification/${a.id}`)}
          columns={[
            { header: 'App No', cell: (a) => <span className="font-semibold text-primary">{a.applicationNo}</span> },
            { header: 'Name', cell: (a) => a.name },
            { header: 'Program', cell: (a) => a.program.name },
            { header: 'Cycle', cell: (a) => a.cycle.title },
            { header: 'Docs', cell: (a) => `${a.documents.filter((d) => d.status === 'approved').length}/${a.documents.length} approved` },
            { header: 'Applied', cell: (a) => fmtDate(a.createdAt) },
            { header: 'Status', cell: (a) => <Badge value={a.status} /> },
          ]}
          rows={loading ? [] : filteredApps}
          empty={loading ? 'Loading…' : 'No applications in this state.'}
        />
      </Card>
    </div>
  );
}
