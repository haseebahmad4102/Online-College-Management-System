import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import PageHeader from '../components/site/PageHeader';
import Loading from '../components/site/Loading';

export default function Departments() {
  const [departments, setDepartments] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/public/departments').then((res) => setDepartments(res.data.departments)).catch(() => setDepartments([]));
  }, []);

  return (
    <div>
      <PageHeader title="Departments" subtitle="Academic departments of the college — click a department for its full page" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        {!departments && <Loading />}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {departments?.map((d) => (
            <div
              key={d.id}
              onClick={() => navigate(`/departments/${d.id}`)}
              role="link"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/departments/${d.id}`); }}
              className="group flex cursor-pointer flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary hover:shadow-xl"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-100 font-bold text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                  {d.code}
                </div>
                <h2 className="font-bold text-slate-800 transition-colors duration-300 group-hover:text-primary">Department of {d.name}</h2>
              </div>
              {d.hod && (
                <p className="mb-1 text-sm text-slate-600">
                  <span className="font-medium">HOD:</span> {d.hod.name} ({d.hod.designation})
                </p>
              )}
              <p className="mb-3 text-sm text-slate-600">
                <span className="font-medium">Faculty:</span> {d.teacherCount} member{d.teacherCount === 1 ? '' : 's'}
              </p>
              {d.programs.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {d.programs.map((p) => (
                    <span key={p.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 transition-colors duration-300 group-hover:bg-green-50 group-hover:text-primary">
                      {p.name}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-auto flex items-center justify-between">
                <span className="text-sm font-medium text-primary transition-transform duration-300 group-hover:translate-x-1">
                  View department →
                </span>
                <Link
                  to={`/faculty?department=${d.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  Faculty
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
