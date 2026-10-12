import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import PageHeader from '../components/site/PageHeader';
import Loading from '../components/site/Loading';
import { FitImage } from '../components/ui';

// Public page for one department: story, HOD message, programs, running classes,
// and the department's own gallery (managed by its HOD).
export default function DepartmentDetail() {
  const { id } = useParams();
  const [dept, setDept] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setDept(null);
    api.get(`/public/departments/${id}`)
      .then((res) => setDept(res.data.department))
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className="py-24 text-center">
        <p className="mb-4 text-slate-500">This department does not exist.</p>
        <Link to="/departments" className="font-medium text-primary hover:underline">← All departments</Link>
      </div>
    );
  }
  if (!dept) return <Loading />;

  const shiftLabel = (s) => (s === 'morning' ? 'Morning' : 'Evening');

  return (
    <div>
      <PageHeader title={`Department of ${dept.name}`} subtitle={dept.description || 'Academic department of GGCM'} />
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
        <Link to="/departments" className="text-sm font-medium text-accent hover:underline">← All departments</Link>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            [dept.programs.length, 'Programs'],
            [dept.classes.length, 'Running Classes'],
            [dept.teacherCount, 'Faculty Members'],
            [dept.studentCount, 'Active Students'],
          ].map(([value, label]) => (
            <div key={label} className="group rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-lg">
              <div className="text-2xl font-bold text-primary">{value}</div>
              <div className="mt-0.5 text-xs text-slate-500">{label}</div>
            </div>
          ))}
        </div>

        {/* HOD message */}
        {(dept.hod || dept.message) && (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row">
              {dept.hod && (
                <div className="shrink-0 text-center sm:w-40">
                  {dept.hod.photoPath ? (
                    <img src={dept.hod.photoPath} alt={dept.hod.name}
                      className="mx-auto h-32 w-32 rounded-full border-4 border-green-100 object-cover object-top shadow" />
                  ) : (
                    <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border-4 border-green-100 bg-primary text-4xl font-bold text-white shadow">
                      {dept.hod.name.charAt(0)}
                    </div>
                  )}
                  <div className="mt-3 text-sm font-bold text-slate-800">{dept.hod.name}</div>
                  <div className="text-xs text-slate-500">{dept.hod.designation} · Head of Department</div>
                  {dept.hod.qualification && <div className="mt-0.5 text-xs text-slate-400">{dept.hod.qualification}</div>}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="mb-3 text-xl font-bold text-primary">
                  {dept.hod ? "Head of Department's Message" : `About the Department`}
                </h2>
                {dept.message ? (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{dept.message}</p>
                ) : (
                  <p className="text-sm text-slate-400">
                    {dept.hod ? `${dept.hod.name} leads the Department of ${dept.name}.` : 'No message published yet.'}
                  </p>
                )}
                {dept.hod && dept.message && (
                  <p className="mt-4 text-sm font-semibold text-slate-800">— {dept.hod.name}, HOD {dept.code}</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Programs offered */}
        {dept.programs.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-900">Programs Offered</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dept.programs.map((p) => (
                <Link key={p.id} to="/admissions"
                  className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-slate-800 group-hover:text-primary">{p.name}</div>
                    <span className="shrink-0 rounded bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                      {p.level === 'bs' ? 'BS (4-Year)' : 'Intermediate'}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {p.totalSemesters ? `${p.totalSemesters} semesters` : `${p.durationYears} years`} · {p.seats} seats
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Running classes */}
        {dept.classes.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-900">Classes This Session</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-3">Program</th>
                    <th className="px-5 py-3">Semester</th>
                    <th className="px-5 py-3">Shift</th>
                    <th className="px-5 py-3">Enrolled Students</th>
                  </tr>
                </thead>
                <tbody>
                  {dept.classes.map((c) => (
                    <tr key={c.id} className="border-b border-slate-50 transition-colors last:border-0 hover:bg-green-50/50">
                      <td className="px-5 py-3 font-medium text-slate-700">{c.program}</td>
                      <td className="px-5 py-3">Semester {c.termNo}</td>
                      <td className="px-5 py-3">{shiftLabel(c.shift)}</td>
                      <td className="px-5 py-3">{c.students}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Department gallery */}
        {dept.gallery.length > 0 && (
          <section>
            <h2 className="mb-1 text-xl font-bold text-slate-900">Department Gallery</h2>
            <p className="mb-4 text-sm text-slate-500">Life inside the Department of {dept.name}</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {dept.gallery.map((g) => (
                <figure key={g.id} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div className="overflow-hidden">
                    <FitImage src={g.imagePath} alt={g.caption || `${dept.name} department photo`}
                      className="h-40 w-full" imgClassName="transition duration-500 group-hover:scale-110" loading="lazy" />
                  </div>
                  {g.caption && <figcaption className="px-3 py-2 text-xs text-slate-500">{g.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* Faculty link */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="mb-3 text-sm text-slate-600">Meet the {dept.teacherCount} faculty member{dept.teacherCount === 1 ? '' : 's'} of this department.</p>
          <Link to={`/faculty?department=${dept.id}`}
            className="inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-lg">
            View {dept.code} Faculty
          </Link>
        </div>
      </div>
    </div>
  );
}
