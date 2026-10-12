import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import PageHeader from '../components/site/PageHeader';
import Loading from '../components/site/Loading';

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Admissions() {
  const [cycles, setCycles] = useState(null);

  useEffect(() => {
    api.get('/public/admissions').then((res) => setCycles(res.data.cycles)).catch(() => setCycles([]));
  }, []);

  return (
    <div>
      <PageHeader
        title="Admissions"
        subtitle="Open admission cycles, offered programs, and eligibility requirements"
      />
      <div className="mx-auto max-w-6xl px-4 py-10">
        {!cycles && <Loading />}
        {cycles && cycles.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            No admission cycle is open at the moment. Please check back later or follow the notice board.
          </div>
        )}

        {cycles?.map((cycle) => (
          <section key={cycle.id} className="mb-10 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-primary">{cycle.title}</h2>
                <p className="text-sm text-slate-500">
                  Session {cycle.session} · Apply by <span className="font-medium text-accent">{fmtDate(cycle.endAt)}</span>
                </p>
              </div>
              <Link
                to={`/register?cycle=${cycle.id}`}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                Apply Online
              </Link>
            </div>

            <div className="overflow-x-auto px-6 py-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-4">Program</th>
                    <th className="py-2 pr-4">Duration</th>
                    <th className="py-2 pr-4">Seats</th>
                    <th className="py-2 pr-4">Min. Marks</th>
                    <th className="py-2">Eligibility</th>
                  </tr>
                </thead>
                <tbody>
                  {cycle.programs.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 pr-4 font-medium text-slate-800">{p.name}</td>
                      <td className="py-3 pr-4 text-slate-600">
                        {p.durationYears} years{p.totalSemesters ? ` (${p.totalSemesters} semesters)` : ''}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{p.seats}</td>
                      <td className="py-3 pr-4 text-slate-600">{p.minPercentage}%</td>
                      <td className="py-3 text-slate-600">
                        {p.level === 'bs'
                          ? (p.eligibleGroups.length === 6 ? 'All intermediate groups' : p.eligibleGroups.join(', '))
                          : 'Matriculation'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-primary">How to Apply</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-600">
            <li>Register an applicant account on this website (online application portal — opening soon).</li>
            <li>Fill the application form and upload the required documents (photo, CNIC/B-Form, result cards).</li>
            <li>Track your application status online using your Application No and CNIC.</li>
            <li>If selected on merit, download your fee challan, pay at the designated bank branch, and upload the paid copy before the due date.</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
