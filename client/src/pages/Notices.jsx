import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import PageHeader from '../components/site/PageHeader';
import Loading from '../components/site/Loading';

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Notices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    api.get('/public/notices', { params: { page } }).then((res) => setData(res.data)).catch(() => setData({ notices: [] }));
  }, [page]);

  return (
    <div>
      <PageHeader title="Notices and Events" subtitle="Official announcements, circulars, and college events" />
      <div className="mx-auto max-w-4xl px-4 py-10">
        {!data && <Loading />}
        {data && data.notices.length === 0 && (
          <p className="py-16 text-center text-slate-500">No notices published yet.</p>
        )}
        <div className="space-y-4">
          {data?.notices.map((n) => (
            <Link
              key={n.id}
              to={`/notices/${n.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary"
            >
              <div className="mb-1 text-xs text-slate-400">{fmtDate(n.publishedAt)}{n.program ? ` · ${n.program}` : ''}</div>
              <h2 className="font-semibold text-slate-800">{n.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{n.body}</p>
            </Link>
          ))}
        </div>

        {data && data.lastPage > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {Array.from({ length: data.lastPage }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setSearchParams({ page: p })}
                className={`h-9 w-9 rounded-lg text-sm font-medium ${
                  p === page ? 'bg-primary text-white' : 'border border-slate-300 bg-white text-slate-600 hover:border-primary'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
