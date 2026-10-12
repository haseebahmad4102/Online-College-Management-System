import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute, { PermissionRoute, NotFound } from './components/ProtectedRoute';
import SiteLayout from './layouts/SiteLayout';
import PortalLayout from './layouts/PortalLayout';

// Public website
import Home from './pages/Home';
import About from './pages/About';
import Admissions from './pages/Admissions';
import Departments from './pages/Departments';
import DepartmentDetail from './pages/DepartmentDetail';
import Faculty from './pages/Faculty';
import FacultyProfile from './pages/FacultyProfile';
import Notices from './pages/Notices';
import NoticeDetail from './pages/NoticeDetail';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';

// Portal
import Dashboard from './pages/portal/Dashboard';
import VerificationQueue from './pages/portal/VerificationQueue';
import ApplicationReview from './pages/portal/ApplicationReview';
import MeritLists from './pages/portal/MeritLists';
import Challans from './pages/portal/Challans';
import DepartmentFees from './pages/portal/DepartmentFees';
import Promotion from './pages/portal/Promotion';
import Students from './pages/portal/Students';
import Teachers from './pages/portal/Teachers';
import Academic from './pages/portal/Academic';
import NoticesManage from './pages/portal/NoticesManage';
import Settings from './pages/portal/Settings';

import ExaminerDashboard from './pages/portal/examiner/ExaminerDashboard';
import ExaminerAllocations from './pages/portal/examiner/ExaminerAllocations';
import ExaminerSlips from './pages/portal/examiner/ExaminerSlips';
import ExaminerPapers from './pages/portal/examiner/ExaminerPapers';

import Website from './pages/portal/Website';
import MyClasses from './pages/portal/MyClasses';
import Assessments from './pages/portal/Assessments';
import TeacherClasswork from './pages/portal/TeacherClasswork';
import TeacherQuestionPapers from './pages/portal/TeacherQuestionPapers';
import TeacherLectures from './pages/portal/TeacherLectures';
import StudentLectures from './pages/portal/StudentLectures';
import { useAuth } from './context/AuthContext';
import TeacherProfile from './pages/portal/TeacherProfile';
import MyTimetable from './pages/portal/MyTimetable';
import StudentAttendance from './pages/portal/StudentAttendance';
import StudentMarks from './pages/portal/StudentMarks';
import StudentClasswork from './pages/portal/StudentClasswork';
import StudentChallans from './pages/portal/StudentChallans';
import StudentLibrary from './pages/portal/StudentLibrary';
import StudentCard from './pages/portal/StudentCard';
import BookRequests from './pages/portal/BookRequests';
import Issues from './pages/portal/Issues';
import Books from './pages/portal/Books';
import Library from './pages/portal/Library';
import TimetableBuilder from './pages/portal/TimetableBuilder';
import Blocks from './pages/portal/Blocks';
import Slots from './pages/portal/Slots';
import Account from './pages/portal/Account';
import StaffAccounts from './pages/portal/StaffAccounts';
import AuditLogs from './pages/portal/AuditLogs';
import Permissions from './pages/portal/Permissions';
import DepartmentsTeachers from './pages/portal/DepartmentsTeachers';
import HodDepartment from './pages/portal/HodDepartment';
import { MyApplicationsList, ApplicationDetail } from './pages/portal/MyApplications';
import ApplyWizard from './pages/portal/ApplyWizard';
import Committees from './pages/portal/Committees';

// New Features
import Assets from './pages/portal/Assets';
import Staff from './pages/portal/Staff';
import Tasks from './pages/portal/Tasks';
import MyTasks from './pages/portal/MyTasks';

// Teachers manage lectures, students watch them — the sidebar entry is the same
// path for both, so the role decides which screen renders.
function LecturesRoute() {
  const { user } = useAuth();
  return user?.roles?.includes('teacher') ? <TeacherLectures /> : <StudentLectures />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public college website (§5.14) */}
          <Route element={<SiteLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/admissions" element={<Admissions />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/departments/:id" element={<DepartmentDetail />} />
            <Route path="/faculty" element={<Faculty />} />
            <Route path="/faculty/:id" element={<FacultyProfile />} />
            <Route path="/notices" element={<Notices />} />
            <Route path="/notices/:id" element={<NoticeDetail />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/contact" element={<Contact />} />
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Navigate to="/portal" replace />} />

          {/* Role-based portals (§5.13) */}
          <Route path="/portal" element={<ProtectedRoute><PortalLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="account" element={<Account />} />
            <Route path="staff" element={<PermissionRoute anyOf={['staff.manage']}><StaffAccounts /></PermissionRoute>} />
            <Route path="non-teaching-staff" element={<PermissionRoute anyOf={['staff.manage']}><Staff /></PermissionRoute>} />
            <Route path="assets" element={<PermissionRoute anyOf={['assets.manage']}><Assets /></PermissionRoute>} />
            <Route path="tasks" element={<PermissionRoute anyOf={['tasks.manage']}><Tasks /></PermissionRoute>} />
            <Route path="my-tasks" element={<MyTasks />} />
            {/* Admin / Principal only */}
            <Route path="audit-logs" element={<PermissionRoute roles={['admin']}><AuditLogs /></PermissionRoute>} />
            {/* Access control (roles & permissions) is the Admin's domain — not the Principal. */}
            <Route path="permissions" element={<PermissionRoute roles={['admin']}><Permissions /></PermissionRoute>} />
            <Route path="departments" element={<PermissionRoute roles={['admin', 'principal']}><DepartmentsTeachers /></PermissionRoute>} />
            {/* Committees — defaulted to principal, admin can grant to any role */}
            <Route path="committees" element={<PermissionRoute anyOf={['committee.view', 'committee.manage']}><Committees /></PermissionRoute>} />
            {/* Management pages — unlocked by permissions granted on the Permissions page */}
            <Route path="verification" element={<PermissionRoute anyOf={['admissions.view']}><VerificationQueue /></PermissionRoute>} />
            <Route path="verification/:id" element={<PermissionRoute anyOf={['admissions.view']}><ApplicationReview /></PermissionRoute>} />
            <Route path="merit" element={<PermissionRoute anyOf={['merit.view']}><MeritLists /></PermissionRoute>} />
            <Route path="challans" element={<PermissionRoute anyOf={['challans.view']}><Challans /></PermissionRoute>} />
            <Route path="department-fees" element={<PermissionRoute anyOf={['challans.manage']}><DepartmentFees /></PermissionRoute>} />
            <Route path="students" element={<PermissionRoute anyOf={['students.view']}><Students /></PermissionRoute>} />
            <Route path="promotion" element={<PermissionRoute anyOf={['students.promote']}><Promotion /></PermissionRoute>} />
            <Route path="teachers" element={<PermissionRoute anyOf={['teachers.view']}><Teachers /></PermissionRoute>} />
            <Route path="academic" element={<PermissionRoute anyOf={['academic.view', 'academic.manage', 'departments.manage']}><Academic /></PermissionRoute>} />
            <Route path="notices" element={<PermissionRoute anyOf={['notices.view']}><NoticesManage /></PermissionRoute>} />
            <Route path="website" element={<PermissionRoute anyOf={['website.view', 'website.manage']}><Website /></PermissionRoute>} />
            <Route path="settings" element={<PermissionRoute anyOf={['settings.view']}><Settings /></PermissionRoute>} />
            {/* Examinations (CE) */}
            <Route path="examinations" element={<PermissionRoute anyOf={['examinations.manage']}><ExaminerDashboard /></PermissionRoute>} />
            <Route path="examinations/allocations" element={<PermissionRoute anyOf={['examinations.manage']}><ExaminerAllocations /></PermissionRoute>} />
            <Route path="examinations/slips" element={<PermissionRoute anyOf={['examinations.manage']}><ExaminerSlips /></PermissionRoute>} />
            <Route path="examinations/papers" element={<PermissionRoute anyOf={['examinations.manage']}><ExaminerPapers /></PermissionRoute>} />
            {/* HOD */}
            <Route path="my-department" element={<HodDepartment />} />
            {/* Teacher */}
            <Route path="my-classes" element={<MyClasses />} />
            <Route path="assessments" element={<Assessments />} />
            <Route path="classwork" element={<TeacherClasswork />} />
            <Route path="question-papers" element={<TeacherQuestionPapers />} />
            {/* One path, two screens: teachers post lectures, students watch them. */}
            <Route path="lectures" element={<LecturesRoute />} />
            <Route path="my-timetable" element={<MyTimetable kind="teacher" />} />
            <Route path="my-profile" element={<TeacherProfile />} />
            {/* Student */}
            <Route path="attendance" element={<StudentAttendance />} />
            <Route path="marks" element={<StudentMarks />} />
            <Route path="student-classwork" element={<StudentClasswork />} />
            <Route path="student-timetable" element={<MyTimetable kind="student" />} />
            <Route path="my-challans" element={<StudentChallans />} />
            <Route path="library" element={<StudentLibrary />} />
            <Route path="card" element={<StudentCard />} />
            {/* Librarian — single hub with Requests / Issues / Catalog / Settings tabs */}
            <Route path="library-hub" element={<PermissionRoute anyOf={['library.view', 'library.manage']}><Library /></PermissionRoute>} />
            <Route path="book-requests" element={<PermissionRoute anyOf={['library.view', 'library.manage']}><BookRequests /></PermissionRoute>} />
            <Route path="issues" element={<PermissionRoute anyOf={['library.view', 'library.manage']}><Issues /></PermissionRoute>} />
            <Route path="books" element={<PermissionRoute anyOf={['library.view', 'library.manage']}><Books /></PermissionRoute>} />
            <Route path="library-settings" element={<PermissionRoute anyOf={['settings.view']}><Settings groupFilter="library" /></PermissionRoute>} />
            <Route path="library-desk" element={<PermissionRoute anyOf={['library.view', 'library.manage']}><Issues /></PermissionRoute>} />
            {/* Timetable controller */}
            <Route path="timetable-builder" element={<PermissionRoute anyOf={['timetable.view', 'timetable.manage']}><TimetableBuilder /></PermissionRoute>} />
            <Route path="blocks" element={<PermissionRoute anyOf={['timetable.view', 'timetable.manage']}><Blocks /></PermissionRoute>} />
            <Route path="rooms" element={<Navigate to="/portal/blocks" replace />} />
            <Route path="slots" element={<PermissionRoute anyOf={['timetable.view', 'timetable.manage']}><Slots /></PermissionRoute>} />
            {/* Applicant */}
            <Route path="applications" element={<MyApplicationsList />} />
            <Route path="applications/:id" element={<ApplicationDetail />} />
            <Route path="apply" element={<ApplyWizard />} />
            {/* Anything else inside the portal */}
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
