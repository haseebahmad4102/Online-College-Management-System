import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Stat, Card, Badge, Table } from '../../components/ui';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (user.roles.length === 1 && user.roles[0] === 'controller_examiner') {
      navigate('/portal/examinations', { replace: true });
      return;
    }
    api.get('/dashboard').then((res) => setStats(res.data.stats)).catch(() => setStats({}));
  }, [user.roles, navigate]);

  if (user.roles.length === 1 && user.roles[0] === 'controller_examiner') return null;

  if (!stats) return <div className="py-20 text-center text-slate-400">Loading…</div>;
  const roles = user.roles;
  const staff = roles.includes('admin') || roles.includes('principal') || roles.includes('clerk');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

      {staff && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Total Applications" value={stats.applications} onClick={() => navigate('/portal/verification')} />
          <Stat label="Awaiting Verification" value={stats.pendingDocs} accent onClick={() => navigate('/portal/verification')} />
          <Stat label="Enrolled (this cycle)" value={stats.enrolled} onClick={() => navigate('/portal/students')} />
          <Stat label="Active Students" value={stats.students} onClick={() => navigate('/portal/students')} />
          <Stat label="Active Teachers" value={stats.teachers} onClick={() => navigate('/portal/teachers')} />
          <Stat label="Fees Verified Today" value={stats.feeVerifiedToday} onClick={() => navigate('/portal/challans')} />
          <Stat label="Today's Attendance" value={stats.todayAttendancePct != null ? `${stats.todayAttendancePct}%` : 'No sheets yet'} onClick={() => navigate('/portal/academic')} />
          <Stat label="Overdue Library Books" value={stats.overdueBooks} accent onClick={() => navigate('/portal/books')} />
        </div>
      )}

      {roles.includes('teacher') && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="My Classes" value={stats.classes} />
          <Stat label="My Assessments" value={stats.assessments} />
          <Stat label="Quizzes / Assignments" value={stats.classworks} />
        </div>
      )}

      {roles.includes('student') && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Roll Number" value={stats.rollNumber} />
            <Stat label="Current Class" value={stats.currentClass ?? 'Not assigned yet'} />
            <Stat label="Overall Attendance" value={stats.attendancePct != null ? `${stats.attendancePct}%` : '—'} />
            <Stat label="Pending Classwork" value={stats.pendingClasswork} accent />
            <Stat label="Library Books Out" value={stats.booksOut} />
          </div>
          {stats.carryPapers?.length > 0 && (
            <Card title="Carry papers — re-sit with the junior batch">
              <Table
                columns={[
                  { header: 'Subject', cell: (c) => `${c.code} — ${c.title}` },
                  { header: 'Failed in', cell: (c) => c.fromLabel },
                  { header: 'Status', cell: () => <Badge value="pending" /> },
                ]}
                rows={stats.carryPapers}
              />
              <p className="mt-3 text-xs text-slate-500">
                You were promoted with these papers pending. Their exams are given later with the junior batch —
                contact your department for the exam schedule.
              </p>
            </Card>
          )}
        </>
      )}

      {roles.includes('librarian') && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Books in Catalog" value={stats.books} />
          <Stat label="Pending Requests" value={stats.pendingRequests} accent />
          <Stat label="Currently Issued" value={stats.issuesOut} />
          <Stat label="Overdue" value={stats.overdue} accent />
        </div>
      )}

      {roles.includes('timetable') && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Rooms & Labs" value={stats.rooms} />
          <Stat label="Time Slots" value={stats.slots} />
          <Stat label="Timetable Entries" value={stats.entries} />
          <Stat label="Class Shifts" value={stats.sections} />
        </div>
      )}

      {roles.includes('applicant') && (
        <Card title="My Applications" actions={<Link to="/portal/apply" className="text-sm font-medium text-accent hover:underline">+ New application</Link>}>
          <Table
            columns={[
              { header: 'Application No', cell: (a) => <Link className="font-medium text-primary hover:underline" to={`/portal/applications/${a.id}`}>{a.no}</Link> },
              { header: 'Program', cell: (a) => a.program },
              { header: 'Status', cell: (a) => <Badge value={a.status} /> },
            ]}
            rows={stats.applications ?? []}
            empty="You have not applied yet. Click 'Apply Now' to begin."
          />
        </Card>
      )}
    </div>
  );
}
