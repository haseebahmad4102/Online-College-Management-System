import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import PageHeader from '../components/site/PageHeader';
import Loading from '../components/site/Loading';

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : null;
}

const TYPE_LABELS = { permanent: 'Permanent', cti: 'CTI', adhoc: 'Ad-hoc', visiting: 'Visiting' };

// Full faculty-member profile (§5.14) — photo, designation, education, experience.
export default function FacultyProfile() {
  const { id } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setTeacher(null);
    api.get(`/public/faculty/${id}`).then((r) => setTeacher(r.data.teacher)).catch(() => setError(true));
  }, [id]);

  if (error) {
    return (
      <div className="py-24 text-center text-slate-500">
        Faculty member not found. <Link to="/faculty" className="text-primary underline">Back to faculty</Link>
      </div>
    );
  }
  if (!teacher) return <Loading />;

  const sections = [
    ['Education', teacher.education, '🎓'],
    ['Experience & Previous Jobs', teacher.experience, '💼'],
  ].filter(([, v]) => v);

  return (
    <div>
      <PageHeader title={teacher.name} subtitle={`${teacher.designation} — Department of ${teacher.department}`} />
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link to="/faculty" className="text-sm text-slate-500 hover:text-primary">← All faculty</Link>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Header band: photo + identity */}
          <div className="flex flex-col items-center gap-6 border-b border-slate-100 bg-gradient-to-br from-green-50 to-white p-8 sm:flex-row">
            {teacher.photoPath ? (
              <img
                src={teacher.photoPath}
                alt={teacher.name}
                className="h-36 w-36 shrink-0 rounded-full border-4 border-white object-cover object-top shadow-lg"
              />
            ) : (
              <div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-full bg-primary text-4xl font-bold text-white shadow-lg">
                {teacher.name.split(' ').filter((w) => w.length > 2).slice(0, 2).map((w) => w[0]).join('')}
              </div>
            )}
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold text-slate-900">{teacher.name}</h1>
              <p className="mt-0.5 font-medium text-accent">{teacher.designation}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-primary">{teacher.department}</span>
                {teacher.isHod && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Head of Department</span>}
                {teacher.teacherType && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{TYPE_LABELS[teacher.teacherType] ?? teacher.teacherType} Faculty</span>}
              </div>
            </div>
          </div>

          {/* Facts */}
          <div className="grid gap-x-8 gap-y-3 p-8 sm:grid-cols-2">
            {[
              ['Designation', teacher.designation],
              ['Department', teacher.department],
              ['Highest Qualification', teacher.qualification],
              ['Specialization', teacher.specialization],
              ['Serving Since', fmtDate(teacher.joiningDate)],
            ].filter(([, v]) => v).map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{k}</dt>
                <dd className="mt-0.5 text-sm text-slate-700">{v}</dd>
              </div>
            ))}
          </div>

          {/* Education / experience narrative */}
          {sections.length > 0 && (
            <div className="space-y-6 border-t border-slate-100 p-8 pt-6">
              {sections.map(([title, body, icon]) => (
                <section key={title}>
                  <h2 className="mb-2 flex items-center gap-2 font-bold text-primary">
                    <span>{icon}</span> {title}
                  </h2>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{body}</p>
                </section>
              ))}
            </div>
          )}
          {sections.length === 0 && (
            <p className="border-t border-slate-100 p-8 pt-6 text-sm text-slate-400">
              Detailed education and experience have not been added yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
