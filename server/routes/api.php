<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

use App\Http\Controllers\AcademicController;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Academic Routes
    Route::prefix('academic')->group(function () {
        Route::get('/program-levels', [AcademicController::class, 'getLevels']);
        Route::post('/program-levels', [AcademicController::class, 'storeLevel']);
        Route::put('/program-levels/{id}', [AcademicController::class, 'updateLevel']);
        Route::delete('/program-levels/{id}', [AcademicController::class, 'deleteLevel']);

        Route::get('/departments', [AcademicController::class, 'getDepartments']);
        Route::post('/departments', [AcademicController::class, 'storeDepartment']);
        Route::put('/departments/{id}', [AcademicController::class, 'updateDepartment']);
        Route::delete('/departments/{id}', [AcademicController::class, 'deleteDepartment']);

        Route::get('/designations', [AcademicController::class, 'getDesignations']);
        Route::post('/designations', [AcademicController::class, 'storeDesignation']);
        Route::put('/designations/{id}', [AcademicController::class, 'updateDesignation']);
        Route::delete('/designations/{id}', [AcademicController::class, 'deleteDesignation']);

        Route::get('/matric-groups', [AcademicController::class, 'getMatricGroups']);
        Route::post('/matric-groups', [AcademicController::class, 'storeMatricGroup']);
        Route::put('/matric-groups/{id}', [AcademicController::class, 'updateMatricGroup']);
        Route::delete('/matric-groups/{id}', [AcademicController::class, 'deleteMatricGroup']);
        Route::get('/inter-groups', [AcademicController::class, 'getInterGroups']);
        Route::post('/inter-groups', [AcademicController::class, 'storeInterGroup']);
        Route::put('/inter-groups/{id}', [AcademicController::class, 'updateInterGroup']);
        Route::delete('/inter-groups/{id}', [AcademicController::class, 'deleteInterGroup']);

        Route::get('/document-types', [AcademicController::class, 'getDocumentTypes']);
        Route::post('/document-types', [AcademicController::class, 'storeDocumentType']);
        Route::put('/document-types/{id}', [AcademicController::class, 'updateDocumentType']);
        Route::delete('/document-types/{id}', [AcademicController::class, 'deleteDocumentType']);

        Route::get('/sessions', [AcademicController::class, 'getSessions']);
        Route::post('/sessions', [AcademicController::class, 'storeSession']);
        Route::put('/sessions/{id}', [AcademicController::class, 'updateSession']);
        Route::delete('/sessions/{id}', [AcademicController::class, 'deleteSession']);

        Route::get('/cycles', [AcademicController::class, 'getCycles']);
        Route::post('/cycles', [AcademicController::class, 'storeCycle']);
        Route::put('/cycles/{id}', [AcademicController::class, 'updateCycle']);
        Route::delete('/cycles/{id}', [AcademicController::class, 'deleteCycle']);

        Route::get('/programs', [AcademicController::class, 'getPrograms']);
        Route::post('/programs', [AcademicController::class, 'storeProgram']);
        Route::put('/programs/{id}', [AcademicController::class, 'updateProgram']);
        Route::delete('/programs/{id}', [AcademicController::class, 'deleteProgram']);

        Route::get('/subjects', [AcademicController::class, 'getSubjects']);
        Route::post('/subjects', [AcademicController::class, 'storeSubject']);
        Route::put('/subjects/{id}', [AcademicController::class, 'updateSubject']);
        Route::delete('/subjects/{id}', [AcademicController::class, 'deleteSubject']);

        Route::get('/sections', [AcademicController::class, 'getSections']);
        Route::post('/sections', [AcademicController::class, 'storeSection']);
        Route::put('/sections/{id}', [AcademicController::class, 'updateSection']);
        Route::delete('/sections/{id}', [AcademicController::class, 'deleteSection']);

        Route::get('/allocations', [AcademicController::class, 'getAllocations']);
        Route::post('/allocations', [AcademicController::class, 'storeAllocation']);
        Route::put('/allocations/{id}', [AcademicController::class, 'updateAllocation']);
        Route::delete('/allocations/{id}', [AcademicController::class, 'deleteAllocation']);
    });

    // Admin Routes
    Route::prefix('admin')->group(function () {
        Route::get('/audit-logs', [\App\Http\Controllers\AdminController::class, 'getAuditLogs']);
        Route::get('/permissions', [\App\Http\Controllers\AdminController::class, 'getPermissions']);
        
        Route::post('/roles/{role}/permissions', [\App\Http\Controllers\AdminController::class, 'grantRolePermission']);
        Route::delete('/roles/{role}/permissions/{permission}', [\App\Http\Controllers\AdminController::class, 'revokeRolePermission']);
        
        Route::get('/departments', [\App\Http\Controllers\AdminController::class, 'getDepartments']);
        Route::put('/departments/{id}/hod', [\App\Http\Controllers\AdminController::class, 'updateDepartmentHod']);
        
        Route::get('/committees', [\App\Http\Controllers\AdminController::class, 'getCommittees']);
        Route::post('/committees', [\App\Http\Controllers\AdminController::class, 'storeCommittee']);
        Route::put('/committees/{id}', [\App\Http\Controllers\AdminController::class, 'updateCommittee']);
        Route::delete('/committees/{id}', [\App\Http\Controllers\AdminController::class, 'deleteCommittee']);
        
        Route::post('/committees/{id}/members', [\App\Http\Controllers\AdminController::class, 'addCommitteeMember']);
        Route::delete('/committees/{id}/members/{teacherId}', [\App\Http\Controllers\AdminController::class, 'removeCommitteeMember']);
        Route::post('/committees/{id}/student-members', [\App\Http\Controllers\AdminController::class, 'addCommitteeStudentMember']);
        Route::delete('/committees/{id}/student-members/{studentId}', [\App\Http\Controllers\AdminController::class, 'removeCommitteeStudentMember']);
        
        Route::get('/users/{id}/permissions', [\App\Http\Controllers\AdminController::class, 'getUserPermissions']);
        Route::post('/users/{id}/permissions', [\App\Http\Controllers\AdminController::class, 'grantUserPermission']);
        Route::delete('/users/{id}/permissions/{permission}', [\App\Http\Controllers\AdminController::class, 'revokeUserPermission']);
        Route::post('/users/bulk-permissions', [\App\Http\Controllers\AdminController::class, 'bulkUserPermission']);
        
        Route::post('/users/{id}/roles', [\App\Http\Controllers\AdminController::class, 'grantUserRole']);
        Route::delete('/users/{id}/roles/{role}', [\App\Http\Controllers\AdminController::class, 'revokeUserRole']);
        Route::put('/users/{id}/active', [\App\Http\Controllers\AdminController::class, 'toggleUserActive']);
    });

    // Users Routes
    Route::prefix('users')->group(function () {
        Route::get('/', [\App\Http\Controllers\UserController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\UserController::class, 'store']);
        Route::put('/{id}/reset-password', [\App\Http\Controllers\UserController::class, 'resetPassword']);
        Route::put('/{id}/active', [\App\Http\Controllers\UserController::class, 'toggleActive']);
        Route::delete('/{id}', [\App\Http\Controllers\UserController::class, 'destroy']);
    });

    // Staff Routes
    Route::prefix('staff')->group(function () {
        Route::get('/', [\App\Http\Controllers\StaffController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\StaffController::class, 'store']);
        Route::put('/{id}', [\App\Http\Controllers\StaffController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\StaffController::class, 'destroy']);
    });

    // Tasks Routes
    Route::prefix('tasks')->group(function () {
        Route::get('/', [\App\Http\Controllers\TaskController::class, 'getTasks']);
        Route::post('/', [\App\Http\Controllers\TaskController::class, 'storeTask']);
        Route::get('/my-tasks', [\App\Http\Controllers\TaskController::class, 'getMyTasks']);
        Route::patch('/my-tasks/{id}/status', [\App\Http\Controllers\TaskController::class, 'updateMyTaskStatus']);
        Route::put('/{id}', [\App\Http\Controllers\TaskController::class, 'updateTask']);
        Route::delete('/{id}', [\App\Http\Controllers\TaskController::class, 'deleteTask']);
    });

    // Assets Routes
    Route::prefix('assets')->group(function () {
        Route::get('/', [\App\Http\Controllers\AssetController::class, 'getAssets']);
        Route::post('/', [\App\Http\Controllers\AssetController::class, 'storeAsset']);
        Route::put('/{id}', [\App\Http\Controllers\AssetController::class, 'updateAsset']);
        Route::delete('/{id}', [\App\Http\Controllers\AssetController::class, 'deleteAsset']);
        Route::post('/categories', [\App\Http\Controllers\AssetController::class, 'storeCategory']);
        Route::post('/buildings', [\App\Http\Controllers\AssetController::class, 'storeBuilding']);
    });

    // Dashboard Routes
    Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index']);

    // Admissions Routes
    Route::prefix('admissions')->group(function () {
        Route::get('/mine', [\App\Http\Controllers\AdmissionController::class, 'getMine']);
        Route::get('/wizard-data', [\App\Http\Controllers\AdmissionController::class, 'getWizardData']);
        Route::post('/', [\App\Http\Controllers\AdmissionController::class, 'store']);
        Route::put('/{id}/submit', [\App\Http\Controllers\AdmissionController::class, 'submitDraft']);
        Route::post('/{id}/documents/{typeId}', [\App\Http\Controllers\AdmissionController::class, 'uploadDocument']);
        
        Route::get('/queue', [\App\Http\Controllers\AdmissionController::class, 'getQueue']);
        Route::get('/{id}/pdf', [\App\Http\Controllers\AdmissionController::class, 'getPdf']);
        Route::get('/{id}', [\App\Http\Controllers\AdmissionController::class, 'show']);
        Route::put('/documents/{docId}', [\App\Http\Controllers\AdmissionController::class, 'reviewDocument']);
        Route::put('/{id}/approve', [\App\Http\Controllers\AdmissionController::class, 'approveApplication']);
        Route::put('/{id}/override', [\App\Http\Controllers\AdmissionController::class, 'overrideEligibility']);
        Route::put('/{id}/reject', [\App\Http\Controllers\AdmissionController::class, 'rejectApplication']);
        Route::get('/documents/{docId}/download', [\App\Http\Controllers\AdmissionController::class, 'downloadDocument']);
    });

    // Students Routes
    Route::prefix('students')->group(function () {
        Route::get('/me', [\App\Http\Controllers\StudentController::class, 'getMe']);
        Route::post('/me/photo', [\App\Http\Controllers\StudentController::class, 'uploadPhoto']);
        Route::get('/me/card', [\App\Http\Controllers\StudentController::class, 'getCard']);
        
        Route::get('/', [\App\Http\Controllers\StudentController::class, 'index']);
        Route::put('/{id}/section', [\App\Http\Controllers\StudentController::class, 'updateSection']);
        Route::put('/{id}/status', [\App\Http\Controllers\StudentController::class, 'updateStatus']);
    });

    // Merit Routes
    Route::prefix('merit')->group(function () {
        Route::get('/', [\App\Http\Controllers\MeritController::class, 'index']);
        Route::post('/generate', [\App\Http\Controllers\MeritController::class, 'generate']);
        Route::put('/{id}/publish', [\App\Http\Controllers\MeritController::class, 'publish']);
        Route::post('/{id}/expire-unpaid', [\App\Http\Controllers\MeritController::class, 'expireUnpaid']);
        Route::post('/close-remaining', [\App\Http\Controllers\MeritController::class, 'closeRemaining']);
    });

    // Challans Routes
    Route::prefix('challans')->group(function () {
        Route::get('/', [\App\Http\Controllers\ChallanController::class, 'index']);
        Route::get('/{id}/print-data', [\App\Http\Controllers\ChallanController::class, 'getPrintData']);
        Route::post('/{id}/paid-copy', [\App\Http\Controllers\ChallanController::class, 'uploadPaidCopy']);
        Route::put('/{id}/verify', [\App\Http\Controllers\ChallanController::class, 'verify']);
        Route::put('/{id}/reject', [\App\Http\Controllers\ChallanController::class, 'reject']);
        Route::get('/{id}/paid-copy', [\App\Http\Controllers\ChallanController::class, 'downloadPaidCopy']);
    });

    // Department Fees Routes
    Route::prefix('department-fees')->group(function () {
        Route::get('/{departmentId}', [\App\Http\Controllers\DepartmentFeeController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\DepartmentFeeController::class, 'store']);
        Route::post('/custom-challan', [\App\Http\Controllers\DepartmentFeeController::class, 'customChallan']);
        Route::put('/{id}', [\App\Http\Controllers\DepartmentFeeController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\DepartmentFeeController::class, 'destroy']);
        Route::post('/{departmentId}/issue', [\App\Http\Controllers\DepartmentFeeController::class, 'issue']);
    });
    
    // HOD Routes
    Route::get('/hod/department', [\App\Http\Controllers\HodController::class, 'getDepartment']);
    Route::put('/hod/department', [\App\Http\Controllers\HodController::class, 'updateDepartment']);
    Route::post('/hod/gallery', [\App\Http\Controllers\HodController::class, 'addGalleryImage']);
    Route::delete('/hod/gallery/{id}', [\App\Http\Controllers\HodController::class, 'removeGalleryImage']);
    Route::get('/hod/students', [\App\Http\Controllers\HodController::class, 'getStudents']);
    Route::get('/hod/students/{id}/attendance', [\App\Http\Controllers\HodController::class, 'getStudentAttendance']);

    // Attendance Routes
    Route::prefix('attendance')->group(function () {
        Route::get('/my-classes', [\App\Http\Controllers\AttendanceController::class, 'getMyClasses']);
        Route::get('/sheet', [\App\Http\Controllers\AttendanceController::class, 'getSheet']);
        Route::post('/sheet', [\App\Http\Controllers\AttendanceController::class, 'saveSheet']);
        Route::put('/sheet/{id}/unlock', [\App\Http\Controllers\AttendanceController::class, 'unlockSheet']);
        Route::get('/mine', [\App\Http\Controllers\AttendanceController::class, 'getMine']);
        Route::get('/report/register', [\App\Http\Controllers\AttendanceController::class, 'reportRegister']);
        Route::get('/report/short', [\App\Http\Controllers\AttendanceController::class, 'reportShort']);
    });

    // Classwork Routes
    Route::prefix('classwork')->group(function () {
        Route::get('/', [\App\Http\Controllers\ClassworkController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\ClassworkController::class, 'store']);
        Route::delete('/{id}', [\App\Http\Controllers\ClassworkController::class, 'destroy']);
        Route::get('/{id}/submissions', [\App\Http\Controllers\ClassworkController::class, 'getSubmissions']);
        Route::put('/submissions/{id}/grade', [\App\Http\Controllers\ClassworkController::class, 'gradeSubmission']);
        Route::get('/mine', [\App\Http\Controllers\ClassworkController::class, 'getMine']);
        Route::get('/{id}/attempt', [\App\Http\Controllers\ClassworkController::class, 'attemptQuiz']);
        Route::post('/{id}/attempt', [\App\Http\Controllers\ClassworkController::class, 'submitQuiz']);
        Route::post('/{id}/submit', [\App\Http\Controllers\ClassworkController::class, 'submitWork']);
        Route::get('/{id}/attachment', [\App\Http\Controllers\ClassworkController::class, 'downloadAttachment']);
        Route::get('/submissions/{id}/download', [\App\Http\Controllers\ClassworkController::class, 'downloadSubmission']);
    });

    // Assessments Routes
    Route::prefix('assessments')->group(function () {
        Route::get('/', [\App\Http\Controllers\AssessmentController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\AssessmentController::class, 'store']);
        Route::delete('/{id}', [\App\Http\Controllers\AssessmentController::class, 'destroy']);
        Route::get('/{id}/marks', [\App\Http\Controllers\AssessmentController::class, 'getMarks']);
        Route::post('/{id}/marks', [\App\Http\Controllers\AssessmentController::class, 'saveMarks']);
        Route::put('/{id}/publish', [\App\Http\Controllers\AssessmentController::class, 'publish']);
        Route::get('/mine', [\App\Http\Controllers\AssessmentController::class, 'getMine']);
        Route::get('/{id}/award-list', [\App\Http\Controllers\AssessmentController::class, 'getAwardList']);
    });

    // Lectures Routes
    Route::prefix('lectures')->group(function () {
        Route::get('/mine', [\App\Http\Controllers\LectureController::class, 'getMineTeacher']);
        Route::post('/', [\App\Http\Controllers\LectureController::class, 'store']);
        Route::put('/{id}', [\App\Http\Controllers\LectureController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\LectureController::class, 'destroy']);
        Route::get('/', [\App\Http\Controllers\LectureController::class, 'getMineStudent']);
        Route::get('/{id}/play', [\App\Http\Controllers\LectureController::class, 'play']);
        Route::post('/{id}/progress', [\App\Http\Controllers\LectureController::class, 'reportProgress']);
        Route::get('/{id}/progress', [\App\Http\Controllers\LectureController::class, 'getProgress']);
        Route::get('/{id}/report', [\App\Http\Controllers\LectureController::class, 'getReport']);
    });

    // Notices Routes
    Route::prefix('notices')->group(function () {
        Route::get('/feed', [\App\Http\Controllers\NoticeController::class, 'getFeed']);
        Route::get('/', [\App\Http\Controllers\NoticeController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\NoticeController::class, 'store']);
        Route::put('/{id}', [\App\Http\Controllers\NoticeController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\NoticeController::class, 'destroy']);
    });

    // Committees Routes
    Route::prefix('committees')->group(function () {
        Route::get('/', [\App\Http\Controllers\CommitteeController::class, 'index']);
        Route::get('/people', [\App\Http\Controllers\CommitteeController::class, 'people']);
        Route::post('/', [\App\Http\Controllers\CommitteeController::class, 'store']);
        Route::put('/{id}', [\App\Http\Controllers\CommitteeController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\CommitteeController::class, 'destroy']);
        Route::post('/{id}/members', [\App\Http\Controllers\CommitteeController::class, 'addTeacherMember']);
        Route::delete('/{id}/members/{teacherId}', [\App\Http\Controllers\CommitteeController::class, 'removeTeacherMember']);
        Route::post('/{id}/student-members', [\App\Http\Controllers\CommitteeController::class, 'addStudentMember']);
        Route::delete('/{id}/student-members/{studentId}', [\App\Http\Controllers\CommitteeController::class, 'removeStudentMember']);
    });

    // Library Routes
    Route::prefix('library')->group(function () {
        Route::get('/books', [\App\Http\Controllers\LibraryController::class, 'getBooks']);
        Route::get('/stats', [\App\Http\Controllers\LibraryController::class, 'getStats']);
        Route::post('/books', [\App\Http\Controllers\LibraryController::class, 'storeBook']);
        Route::put('/books/{id}', [\App\Http\Controllers\LibraryController::class, 'updateBook']);
        Route::delete('/books/{id}', [\App\Http\Controllers\LibraryController::class, 'destroyBook']);
        Route::post('/categories', [\App\Http\Controllers\LibraryController::class, 'storeCategory']);
        Route::delete('/categories/{id}', [\App\Http\Controllers\LibraryController::class, 'destroyCategory']);
        Route::post('/requests', [\App\Http\Controllers\LibraryController::class, 'requestBook']);
        Route::get('/mine', [\App\Http\Controllers\LibraryController::class, 'getMineStudent']);
        Route::get('/requests', [\App\Http\Controllers\LibraryController::class, 'getRequests']);
        Route::put('/requests/{id}/approve', [\App\Http\Controllers\LibraryController::class, 'approveRequest']);
        Route::put('/requests/{id}/reject', [\App\Http\Controllers\LibraryController::class, 'rejectRequest']);
        Route::get('/issues', [\App\Http\Controllers\LibraryController::class, 'getIssues']);
        Route::put('/issues/{id}/return', [\App\Http\Controllers\LibraryController::class, 'returnIssue']);
        Route::put('/issues/{id}/fine', [\App\Http\Controllers\LibraryController::class, 'fineStatus']);
    });

    // Notifications Routes
    Route::prefix('notifications')->group(function () {
        Route::get('/', [\App\Http\Controllers\NotificationController::class, 'index']);
        Route::put('/read-all', [\App\Http\Controllers\NotificationController::class, 'readAll']);
        Route::delete('/', [\App\Http\Controllers\NotificationController::class, 'destroyAll']);
    });

    // Promotions Routes
    Route::prefix('promotion')->group(function () {
        Route::get('/preview', [\App\Http\Controllers\PromotionController::class, 'preview']);
        Route::post('/run', [\App\Http\Controllers\PromotionController::class, 'run']);
        Route::get('/carries', [\App\Http\Controllers\PromotionController::class, 'getCarries']);
        Route::put('/carries/{id}/clear', [\App\Http\Controllers\PromotionController::class, 'clearCarry']);
        Route::delete('/carries/{id}', [\App\Http\Controllers\PromotionController::class, 'destroyCarry']);
    });

    // Teachers Routes
    Route::prefix('teachers')->group(function () {
        Route::get('/me', [\App\Http\Controllers\TeacherController::class, 'getMe']);
        Route::put('/me', [\App\Http\Controllers\TeacherController::class, 'updateMe']);
        Route::post('/me/photo', [\App\Http\Controllers\TeacherController::class, 'updateMePhoto']);
        Route::get('/', [\App\Http\Controllers\TeacherController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\TeacherController::class, 'store']);
        Route::get('/{id}', [\App\Http\Controllers\TeacherController::class, 'show']);
        Route::put('/{id}', [\App\Http\Controllers\TeacherController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\TeacherController::class, 'destroy']);
    });

    // Timetable Routes
    Route::prefix('timetable')->group(function () {
        Route::get('/blocks', [\App\Http\Controllers\TimetableController::class, 'getBlocks']);
        Route::post('/blocks', [\App\Http\Controllers\TimetableController::class, 'storeBlock']);
        Route::put('/blocks/{id}', [\App\Http\Controllers\TimetableController::class, 'updateBlock']);
        Route::delete('/blocks/{id}', [\App\Http\Controllers\TimetableController::class, 'destroyBlock']);
        Route::get('/rooms', [\App\Http\Controllers\TimetableController::class, 'getRooms']);
        Route::get('/available-rooms', [\App\Http\Controllers\TimetableController::class, 'getAvailableRooms']);
        Route::get('/shift-ranges', [\App\Http\Controllers\TimetableController::class, 'getShiftRangesRoute']);
        Route::put('/shift-ranges', [\App\Http\Controllers\TimetableController::class, 'updateShiftRanges']);
        Route::get('/slots', [\App\Http\Controllers\TimetableController::class, 'getSlots']);
        Route::post('/slots/generate', [\App\Http\Controllers\TimetableController::class, 'generateSlots']);
        Route::post('/slots', [\App\Http\Controllers\TimetableController::class, 'storeSlot']);
        Route::put('/slots/{id}', [\App\Http\Controllers\TimetableController::class, 'updateSlot']);
        Route::delete('/slots/{id}', [\App\Http\Controllers\TimetableController::class, 'destroySlot']);
        Route::delete('/slots', [\App\Http\Controllers\TimetableController::class, 'destroyAllSlots']);
        Route::get('/entries', [\App\Http\Controllers\TimetableController::class, 'getEntries']);
        Route::post('/entries', [\App\Http\Controllers\TimetableController::class, 'storeEntry']);
        Route::delete('/entries/{id}', [\App\Http\Controllers\TimetableController::class, 'destroyEntry']);
        Route::delete('/entries', [\App\Http\Controllers\TimetableController::class, 'destroyEntries']);
        Route::get('/my/teacher', [\App\Http\Controllers\TimetableController::class, 'myTeacher']);
        Route::get('/my/student', [\App\Http\Controllers\TimetableController::class, 'myStudent']);
    });

    // Settings & Website Content Routes
    Route::prefix('settings')->group(function () {
        Route::get('/', [\App\Http\Controllers\SettingController::class, 'index']);
        Route::put('/', [\App\Http\Controllers\SettingController::class, 'update']);
        Route::post('/logo', [\App\Http\Controllers\SettingController::class, 'uploadLogo']);
        Route::get('/principal-message', [\App\Http\Controllers\SettingController::class, 'getPrincipalMessage']);
        Route::put('/principal-message', [\App\Http\Controllers\SettingController::class, 'updatePrincipalMessage']);
        Route::post('/principal-photo', [\App\Http\Controllers\SettingController::class, 'uploadPrincipalPhoto']);
        Route::post('/site-image/{slot}', [\App\Http\Controllers\SettingController::class, 'uploadSiteImage']);
        Route::get('/gallery', [\App\Http\Controllers\SettingController::class, 'getGallery']);
        Route::post('/gallery', [\App\Http\Controllers\SettingController::class, 'storeGallery']);
        Route::put('/gallery/{id}', [\App\Http\Controllers\SettingController::class, 'updateGallery']);
        Route::delete('/gallery/{id}', [\App\Http\Controllers\SettingController::class, 'destroyGallery']);
    });
    // Teacher Examination Routes
    Route::prefix('teacher/exams')->group(function () {
        Route::get('/active', [\App\Http\Controllers\TeacherExamController::class, 'getActiveExams']);
        Route::get('/papers', [\App\Http\Controllers\TeacherExamController::class, 'getMyPapers']);
        Route::post('/papers', [\App\Http\Controllers\TeacherExamController::class, 'createPaper']);
        Route::put('/papers/{id}/submit', [\App\Http\Controllers\TeacherExamController::class, 'submitPaper']);
        Route::delete('/papers/{id}', [\App\Http\Controllers\TeacherExamController::class, 'deletePaper']);
    });
    
    // Teacher subjects route
    Route::get('/teacher/subjects', [\App\Http\Controllers\TeacherExamController::class, 'getMySubjects']);

    // Controller Examiner Routes
    Route::prefix('examiner')->group(function () {
        // Exams
        Route::get('/exams', [\App\Http\Controllers\ControllerExaminerController::class, 'getExams']);
        Route::post('/exams', [\App\Http\Controllers\ControllerExaminerController::class, 'createExam']);
        Route::put('/exams/{id}', [\App\Http\Controllers\ControllerExaminerController::class, 'updateExam']);
        Route::delete('/exams/{id}', [\App\Http\Controllers\ControllerExaminerController::class, 'deleteExam']);
        Route::put('/exams/{id}/toggle', [\App\Http\Controllers\ControllerExaminerController::class, 'toggleExamStatus']);
        
        // Question Papers
        Route::get('/papers/submitted', [\App\Http\Controllers\ControllerExaminerController::class, 'getSubmittedPapers']);
        Route::put('/papers/{id}/printed', [\App\Http\Controllers\ControllerExaminerController::class, 'markPaperPrinted']);

        // Allocations
        Route::get('/exams/{examId}/allocations', [\App\Http\Controllers\ControllerExaminerController::class, 'getAllocations']);
        Route::post('/exams/{examId}/allocations', [\App\Http\Controllers\ControllerExaminerController::class, 'createAllocation']);

        // Slips & Fines
        Route::get('/exams/{examId}/students', [\App\Http\Controllers\ControllerExaminerController::class, 'getStudentsForSlips']);
        Route::post('/exams/{examId}/slips', [\App\Http\Controllers\ControllerExaminerController::class, 'generateSlip']);
        Route::post('/students/notify-unpaid', [\App\Http\Controllers\ControllerExaminerController::class, 'notifyUnpaid']);
    });
});


// Standalone public setting route
Route::get('/settings/public', [\App\Http\Controllers\SettingController::class, 'getPublic']);

// Public Routes (no authentication required)
Route::prefix('public')->group(function () {
    Route::get('/settings', [\App\Http\Controllers\SettingController::class, 'getPublic']);
    Route::get('/home', [\App\Http\Controllers\PublicController::class, 'home']);
    Route::get('/gallery', [\App\Http\Controllers\PublicController::class, 'gallery']);
    Route::get('/departments', [\App\Http\Controllers\PublicController::class, 'departments']);
    Route::get('/departments/{id}', [\App\Http\Controllers\PublicController::class, 'getDepartment']);
    Route::get('/faculty', [\App\Http\Controllers\PublicController::class, 'faculty']);
    Route::get('/faculty/{id}', [\App\Http\Controllers\PublicController::class, 'getFaculty']);
    Route::get('/programs', [\App\Http\Controllers\PublicController::class, 'programs']);
    Route::get('/admissions', [\App\Http\Controllers\PublicController::class, 'admissions']);
    Route::get('/notices', [\App\Http\Controllers\PublicController::class, 'notices']);
    Route::get('/notices/{id}', [\App\Http\Controllers\PublicController::class, 'getNotice']);
    Route::get('/pages/{slug}', [\App\Http\Controllers\PublicController::class, 'getPage']);
});

// Public Merit Route
Route::get('/merit/public', [\App\Http\Controllers\MeritController::class, 'getPublic']);
