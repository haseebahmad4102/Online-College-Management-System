import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import PageHeader from '../components/site/PageHeader';
import Loading from '../components/site/Loading';

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

const ENTRY_BADGE = {
  selected: 'bg-green-100 text-green-800',
  admitted: 'bg-green-100 text-green-800',
  waiting: 'bg-amber-100 text-amber-800',
  forfeited: 'bg-red-100 text-red-700',
};

export default function NoticeDetail() {
  const { id } = useParams();
  const [notice, setNotice] = useState(null);
  const [meritList, setMeritList] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/public/notices/${id}`)
      .then((res) => { setNotice(res.data.notice); setMeritList(res.data.meritList ?? null); })
      .catch(() => setNotFound(true));
  }, [id]);

  return (
    <div>
      <PageHeader title="Notice Board" />
      <div className="mx-auto max-w-4xl px-4 py-10">
        {notFound && <p className="py-16 text-center text-slate-500">Notice not found.</p>}
        {!notice && !notFound && <Loading />}
        {notice && (
          <article className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-2 text-sm text-slate-400">
              Published {fmtDate(notice.publishedAt)}{notice.program ? ` · ${notice.program}` : ''}
            </div>
            <h1 className="mb-4 text-2xl font-bold text-slate-900">{notice.title}</h1>
            <p className="whitespace-pre-line leading-relaxed text-slate-700">{notice.body}</p>

            {meritList && (
              <div className="mt-8 border-t border-slate-100 pt-6">
                <h2 className="mb-4 text-lg font-bold text-primary">
                  Merit List {meritList.listNo} — {meritList.program} ({meritList.cycle})
                </h2>

                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ['Seats to be filled', meritList.seats],
                    ['Applicants', meritList.applicants],
                    ['On merit', meritList.onMerit],
                    ['Waiting list', meritList.waiting],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                      <div className="text-2xl font-bold text-primary">{value}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{label}</div>
                    </div>
                  ))}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="py-2 pr-4">Position</th>
                        <th className="py-2 pr-4">Application No</th>
                        <th className="py-2 pr-4">Name</th>
                        <th className="py-2 pr-4">Father Name</th>
                        <th className="py-2 pr-4">Merit Score</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meritList.entries.map((e) => (
                        <tr key={e.applicationNo} className="border-b border-slate-100 last:border-0">
                          <td className="py-2.5 pr-4 font-bold text-primary">{e.position}</td>
                          <td className="py-2.5 pr-4 font-mono text-xs">{e.applicationNo}</td>
                          <td className="py-2.5 pr-4 font-medium text-slate-800">{e.name}</td>
                          <td className="py-2.5 pr-4 text-slate-600">{e.fatherName}</td>
                          <td className="py-2.5 pr-4">{e.score.toFixed(2)}%</td>
                          <td className="py-2.5">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${ENTRY_BADGE[e.status] ?? 'bg-slate-100 text-slate-600'}`}>
                              {e.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {meritList.cutoff != null && (
                  <p className="mt-3 text-xs text-slate-500">Cut-off merit score: <b>{Number(meritList.cutoff).toFixed(2)}%</b></p>
                )}
              </div>
            )}
          </article>
        )}
        <Link to="/notices" className="mt-6 inline-block text-sm font-medium text-accent hover:underline">
          ← All notices
        </Link>
      </div>
    </div>
  );
}
