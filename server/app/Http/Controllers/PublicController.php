<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Models\Slider;
use App\Models\Notice;
use App\Models\Program;
use App\Models\Page;
use App\Models\Department;
use App\Models\Teacher;
use App\Models\Setting;
use App\Models\GalleryImage;
use App\Models\AdmissionCycle;
use App\Models\MeritList;

class PublicController extends Controller
{
    private function serializeNotice($n)
    {
        return [
            'id' => (string)$n->id,
            'title' => $n->title,
            'body' => $n->body,
            'publishedAt' => $n->published_at,
            'program' => $n->program->name ?? null
        ];
    }

    private function serializeProgram($p)
    {
        return [
            'id' => $p->id,
            'name' => $p->name,
            'code' => $p->code,
            'level' => $p->level->name ?? '',
            'durationYears' => $p->duration_years,
            'totalSemesters' => $p->total_semesters,
            'seats' => $p->seats,
            'minPercentage' => (float)$p->min_percentage,
            'department' => $p->department->name ?? null,
            'interGroup' => $p->interGroup->name ?? null,
            'eligibleGroups' => $p->eligibilities->map(fn($e) => $e->interGroup->name ?? '')->toArray()
        ];
    }

    private function publicNoticeQuery()
    {
        return Notice::where('audience', 'public')
            ->where('published_at', '<=', Carbon::now())
            ->where(function($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>=', Carbon::now());
            });
    }

    public function home()
    {
        $sliders = Slider::where('is_active', true)->orderBy('sort_order', 'asc')->get();
        $notices = $this->publicNoticeQuery()->orderBy('published_at', 'desc')->take(5)->get();
        
        $programs = Program::with(['department', 'interGroup', 'eligibilities.interGroup', 'level'])
            ->where('is_active', true)
            ->orderBy('program_level_id', 'desc')
            ->orderBy('name', 'asc')
            ->get();

        $principalPage = Page::where('slug', 'principal-message')->first();
        $departments = Department::count();
        $teachers = Teacher::where('status', 'active')->count();

        $keys = ['site.principal_name', 'site.principal_photo', 'site.mission', 'site.vision', 'site.mission_image', 'site.vision_image'];
        $siteRows = Setting::whereIn('key', $keys)->get();
        $site = [];
        foreach ($siteRows as $r) {
            $site[$r->key] = $r->value;
        }

        $gallery = GalleryImage::where('is_active', true)
            ->orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc')
            ->take(8)
            ->get();

        $seats = $programs->sum('seats');

        return response()->json([
            'sliders' => $sliders->map(fn($s) => [
                'id' => $s->id,
                'heading' => $s->heading,
                'subheading' => $s->subheading,
                'imagePath' => $s->image_path,
                'sortOrder' => $s->sort_order
            ]),
            'notices' => $notices->map(fn($n) => $this->serializeNotice($n)),
            'programs' => $programs->map(fn($p) => $this->serializeProgram($p)),
            'principalMessage' => $principalPage && $principalPage->is_published ? [
                'title' => $principalPage->title,
                'content' => $principalPage->content,
                'name' => $site['site.principal_name'] ?? null,
                'photoUrl' => $site['site.principal_photo'] ?? null
            ] : null,
            'mission' => $site['site.mission'] ?? null,
            'vision' => $site['site.vision'] ?? null,
            'missionImage' => $site['site.mission_image'] ?? null,
            'visionImage' => $site['site.vision_image'] ?? null,
            'gallery' => $gallery,
            'stats' => [
                'departments' => $departments,
                'teachers' => $teachers,
                'programs' => $programs->count(),
                'seats' => $seats
            ]
        ]);
    }

    public function gallery()
    {
        $images = GalleryImage::where('is_active', true)
            ->orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc')
            ->get();
            
        return response()->json(['images' => $images]);
    }

    public function departments()
    {
        $departments = Department::with([
            'hod.designation',
            'programs' => fn($q) => $q->where('is_active', true)
        ])
        ->withCount(['teachers' => fn($q) => $q->where('status', 'active')])
        ->orderBy('name', 'asc')
        ->get();

        $formatted = $departments->map(function($d) {
            return [
                'id' => $d->id,
                'name' => $d->name,
                'code' => $d->code,
                'description' => $d->description,
                'hod' => $d->hod ? ['name' => $d->hod->name, 'designation' => $d->hod->designation->title ?? ''] : null,
                'teacherCount' => $d->teachers_count,
                'programs' => $d->programs->map(fn($p) => ['id' => $p->id, 'name' => $p->name, 'code' => $p->code, 'level' => $p->level])
            ];
        });

        return response()->json(['departments' => $formatted]);
    }

    public function getDepartment($id)
    {
        $d = Department::with([
            'hod.designation',
            'programs' => fn($q) => $q->where('is_active', true)->orderBy('level', 'desc')->orderBy('name', 'asc'),
            'galleryImages' => fn($q) => $q->orderBy('sort_order', 'asc')->orderBy('id', 'asc')
        ])
        ->withCount(['teachers' => fn($q) => $q->where('status', 'active')])
        ->find($id);

        if (!$d) return response()->json(['message' => 'Department not found.'], 404);

        $classes = \App\Models\ClassSection::with('program')
            ->withCount(['students' => fn($q) => $q->where('status', 'active')])
            ->where('is_active', true)
            ->whereHas('program', fn($q) => $q->where('department_id', $id))
            ->orderBy('program_id', 'asc')
            ->orderBy('term_no', 'asc')
            ->orderBy('shift', 'asc')
            ->get();

        $studentCount = \App\Models\Student::where('status', 'active')
            ->whereHas('program', fn($q) => $q->where('department_id', $id))
            ->count();

        return response()->json([
            'department' => [
                'id' => $d->id,
                'name' => $d->name,
                'code' => $d->code,
                'description' => $d->description,
                'message' => $d->message,
                'hod' => $d->hod ? [
                    'id' => (string)$d->hod->id,
                    'name' => $d->hod->name,
                    'designation' => $d->hod->designation->title ?? '',
                    'qualification' => $d->hod->qualification,
                    'photoPath' => $d->hod->photo_path
                ] : null,
                'teacherCount' => $d->teachers_count,
                'studentCount' => $studentCount,
                'programs' => $d->programs->map(fn($p) => [
                    'id' => $p->id, 'name' => $p->name, 'code' => $p->code, 'level' => $p->level->name ?? '',
                    'seats' => $p->seats, 'durationYears' => $p->duration_years, 'totalSemesters' => $p->total_semesters
                ]),
                'classes' => $classes->map(fn($c) => [
                    'id' => $c->id,
                    'program' => $c->program->code ?? '',
                    'termNo' => $c->term_no,
                    'shift' => $c->shift,
                    'students' => $c->students_count
                ]),
                'gallery' => $d->galleryImages->map(fn($g) => ['id' => $g->id, 'imagePath' => $g->image_path, 'caption' => $g->caption])
            ]
        ]);
    }

    public function faculty(Request $request)
    {
        $departmentId = $request->query('department') ? (int)$request->query('department') : null;
        
        $q = Teacher::with(['department', 'designation', 'hodOf'])->where('status', 'active');
        if ($departmentId) $q->where('department_id', $departmentId);
        $teachers = $q->orderBy('designation_id', 'asc')->orderBy('name', 'asc')->get();

        $departments = Department::orderBy('name', 'asc')->get();
        $departmentMsg = null;
        if ($departmentId) {
            $d = Department::find($departmentId);
            if ($d) $departmentMsg = $d->message;
        }

        return response()->json([
            'departments' => $departments->map(fn($d) => ['id' => $d->id, 'name' => $d->name]),
            'departmentMessage' => $departmentMsg,
            'faculty' => $teachers->map(fn($t) => [
                'id' => (string)$t->id,
                'name' => $t->name,
                'designation' => $t->designation->title ?? '',
                'department' => $t->department->name ?? '',
                'qualification' => $t->qualification,
                'specialization' => $t->specialization,
                'photoPath' => $t->photo_path,
                'gender' => $t->gender,
                'isHod' => $t->hodOf !== null
            ])
        ]);
    }

    public function getFaculty($id)
    {
        $teacher = Teacher::with(['department', 'designation', 'hodOf'])
            ->where('id', $id)
            ->where('status', 'active')
            ->first();
            
        if (!$teacher) return response()->json(['message' => 'Faculty member not found.'], 404);

        return response()->json([
            'teacher' => [
                'id' => (string)$teacher->id,
                'name' => $teacher->name,
                'designation' => $teacher->designation->title ?? '',
                'department' => $teacher->department->name ?? '',
                'isHod' => $teacher->hodOf !== null,
                'teacherType' => $teacher->teacher_type,
                'qualification' => $teacher->qualification,
                'specialization' => $teacher->specialization,
                'education' => $teacher->education,
                'experience' => $teacher->experience,
                'joiningDate' => $teacher->joining_date,
                'photoPath' => $teacher->photo_path,
                'gender' => $teacher->gender
            ]
        ]);
    }

    public function programs()
    {
        $programs = Program::with(['department', 'interGroup', 'eligibilities.interGroup', 'level'])
            ->where('is_active', true)
            ->orderBy('program_level_id', 'desc')
            ->orderBy('name', 'asc')
            ->get();
            
        return response()->json(['programs' => $programs->map(fn($p) => $this->serializeProgram($p))]);
    }

    public function admissions()
    {
        $cycles = AdmissionCycle::with(['academicSession', 'level'])
            ->where('status', 'open')
            ->whereDate('end_at', '>=', \Carbon\Carbon::today())
            ->orderBy('program_level_id', 'desc')
            ->get();
            
        $programs = Program::with(['department', 'interGroup', 'eligibilities.interGroup', 'level'])
            ->where('is_active', true)
            ->orderBy('name', 'asc')
            ->get();

        $formatted = $cycles->map(function($c) use ($programs) {
            $filteredPrograms = $programs->filter(fn($p) => $p->program_level_id === $c->program_level_id);
            return [
                'id' => $c->id,
                'title' => $c->title,
                'level' => $c->level->name ?? '',
                'session' => $c->academicSession->name ?? '',
                'startAt' => $c->start_at,
                'endAt' => $c->end_at,
                'programs' => array_values($filteredPrograms->map(fn($p) => $this->serializeProgram($p))->toArray())
            ];
        });

        return response()->json(['cycles' => $formatted]);
    }

    public function notices(Request $request)
    {
        $page = max(1, (int)$request->query('page', 1));
        $perPage = 15;

        $total = $this->publicNoticeQuery()->count();
        $notices = $this->publicNoticeQuery()
            ->with('program')
            ->orderBy('published_at', 'desc')
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        return response()->json([
            'notices' => $notices->map(fn($n) => $this->serializeNotice($n)),
            'page' => $page,
            'lastPage' => max(1, ceil($total / $perPage)),
            'total' => $total
        ]);
    }

    public function getNotice($id)
    {
        $notice = $this->publicNoticeQuery()->with('program')->where('id', $id)->first();
        if (!$notice) return response()->json(['message' => 'Notice not found.'], 404);

        $meritList = null;
        if ($notice->merit_list_id) {
            $list = MeritList::with([
                'program', 'cycle',
                'entries' => fn($q) => $q->orderBy('position', 'asc')->with('application')
            ])->where('id', $notice->merit_list_id)->where('status', 'published')->first();

            if ($list) {
                $meritList = [
                    'listNo' => $list->list_no,
                    'program' => $list->program->name ?? '',
                    'cycle' => $list->cycle->title ?? '',
                    'seats' => $list->seats,
                    'cutoff' => $list->cutoff_score,
                    'publishedAt' => $list->published_at,
                    'applicants' => $list->entries->count(),
                    'onMerit' => $list->entries->filter(fn($e) => in_array($e->status, ['selected', 'admitted']))->count(),
                    'waiting' => $list->entries->filter(fn($e) => $e->status === 'waiting')->count(),
                    'entries' => $list->entries->map(fn($e) => [
                        'position' => $e->position,
                        'name' => $e->application->name ?? '',
                        'fatherName' => $e->application->father_name ?? '',
                        'applicationNo' => $e->application->application_no ?? '',
                        'score' => (float)$e->merit_score,
                        'status' => $e->status
                    ])->toArray()
                ];
            }
        }

        return response()->json([
            'notice' => $this->serializeNotice($notice),
            'meritList' => $meritList
        ]);
    }

    public function getPage($slug)
    {
        $page = Page::where('slug', $slug)->first();
        if (!$page || !$page->is_published) return response()->json(['message' => 'Page not found.'], 404);

        return response()->json([
            'page' => [
                'title' => $page->title,
                'content' => $page->content,
                'updatedAt' => $page->updated_at
            ]
        ]);
    }
}
