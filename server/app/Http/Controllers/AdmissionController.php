<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use App\Models\AdmissionCycle;
use App\Models\Program;
use App\Models\InterGroup;
use App\Models\DocumentType;
use App\Models\Application;
use App\Models\ApplicationDocument;
use App\Models\User;
use App\Services\EligibilityService;
use App\Services\ChallanService;
use App\Services\NotifyService;
use App\Services\PdfService;

class AdmissionController extends Controller
{
    private const PROVINCES = [
        'Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan',
        'Islamabad Capital Territory', 'Azad Jammu & Kashmir', 'Gilgit-Baltistan'
    ];
    private const MIN_MATRIC_PASS_AGE = 13;
    private const MIN_INTER_PASS_AGE = 15;
    private const NOC_TYPE_NAME = 'NOC';
    private const PHOTO_DOC_NAME = 'Passport Size Photograph';

    private function needsNoc($app)
    {
        return !empty($app->province) && $app->province !== 'Punjab';
    }

    private function documentTypesFor($app, $level)
    {
        $types = DocumentType::where('is_active', true)
            ->whereHas('programLevels', function($q) use ($level) {
                $q->where('program_levels.id', $level->id);
            })->orderBy('id', 'asc')->get();
        return $types->map(function ($t) use ($app) {
            if (str_starts_with($t->name, self::NOC_TYPE_NAME) && $this->needsNoc($app)) {
                $t->is_required = true;
            }
            return $t;
        });
    }

    private function nextAppNo()
    {
        $count = Application::count();
        return "APP-" . date('Y') . "-" . str_pad($count + 1, 6, '0', STR_PAD_LEFT);
    }

    // ── Applicant side ──

    public function getMine(Request $request)
    {
        $stale = \App\Models\Challan::where('purpose', 'admission')
            ->where('status', 'unpaid')
            ->whereHas('application', fn($q) => $q->where('user_id', $request->user()->id))
            ->get();
        
        foreach ($stale as $c) {
            ChallanService::refreshAdmissionChallan($c->id);
        }

        $applications = Application::with(['program', 'cycle', 'interGroup', 'documents.documentType', 'challans.items'])
            ->where('user_id', $request->user()->id)->orderBy('id', 'desc')->get();
        return response()->json(['applications' => $applications]);
    }

    public function getWizardData(Request $request)
    {
        $cycles = AdmissionCycle::with('academicSession')
            ->where('status', 'open')
            ->whereDate('end_at', '>=', \Carbon\Carbon::today())
            ->get();
        $programs = Program::with('programEligibilities')->where('is_active', true)->orderBy('name', 'asc')->get();
        $interGroups = InterGroup::orderBy('name', 'asc')->get();
        $matricGroups = \App\Models\MatricGroup::orderBy('name', 'asc')->get();
        $documentTypes = DocumentType::where('is_active', true)->get();
        $account = User::select('name', 'cnic', 'phone')->find($request->user()->id);
        $lastApplication = Application::where('user_id', $request->user()->id)->where('status', '!=', 'draft')->orderBy('id', 'desc')->first();

        return response()->json([
            'cycles' => $cycles, 'programs' => $programs, 'interGroups' => $interGroups,
            'matricGroups' => $matricGroups,
            'documentTypes' => $documentTypes, 'account' => $account, 'lastApplication' => $lastApplication
        ]);
    }

    public function store(Request $request)
    {
        $b = $request->all();

        $cycle = AdmissionCycle::find($b['cycleId'] ?? 0);
        if (!$cycle || $cycle->status !== 'open') return response()->json(['message' => 'This admission cycle is not open.'], 422);
        $program = Program::with('level')->find($b['programId'] ?? 0);
        if (!$program || $program->program_level_id !== $cycle->program_level_id) return response()->json(['message' => 'Selected program does not belong to this admission cycle. Please click "Start over" to clear your old draft and select the correct cycle.'], 422);

        if (Carbon::now() > $cycle->end_at) return response()->json(['message' => 'The application deadline for this cycle has passed.'], 422);
        if (Carbon::now() < $cycle->start_at) return response()->json(['message' => 'This admission cycle has not started accepting applications yet.'], 422);

        $required = ['name', 'fatherName', 'cnicBform', 'gender', 'dob', 'province', 'domicile', 'religion', 'address', 'phone', 'guardianPhone', 'matricGroupId', 'matricBoard', 'matricYear', 'matricRollNo', 'matricObtained', 'matricTotal'];
        if ($program->level->prerequisite_type === 'inter_groups') {
            array_push($required, 'interGroupId', 'interBoard', 'interYear', 'interRollNo', 'interObtained', 'interTotal');
        }

        foreach ($required as $f) {
            if (!isset($b[$f]) || $b[$f] === '') return response()->json(['message' => "{$f} is required."], 422);
        }

        if (!in_array($b['province'], self::PROVINCES)) return response()->json(['message' => 'Select a valid province / territory of Pakistan.'], 422);
        if (strlen(trim($b['name'])) < 3) return response()->json(['message' => 'Full name must be at least 3 characters.'], 422);
        if (!preg_match('/^[A-Za-z\x{0600}-\x{06FF}][A-Za-z\x{0600}-\x{06FF} .\'-]*$/u', trim($b['name']))) return response()->json(['message' => 'Full name may contain letters only.'], 422);
        if (strlen(trim($b['fatherName'])) < 3) return response()->json(['message' => 'Father name must be at least 3 characters.'], 422);
        if (!preg_match('/^[0-9]{5}-[0-9]{7}-[0-9]$/', $b['cnicBform'])) return response()->json(['message' => 'CNIC/B-Form must be in #####-#######-# format.'], 422);

        $account = $request->user();
        if ($account->cnic && $account->cnic !== $b['cnicBform']) {
            return response()->json(['message' => "Application CNIC/B-Form must match your registered account CNIC ({$account->cnic})."], 422);
        }
        $cnicOwner = User::where('cnic', $b['cnicBform'])->first();
        if ($cnicOwner && $cnicOwner->id !== $request->user()->id) {
            return response()->json(['message' => 'This CNIC/B-Form is already registered to another account.'], 422);
        }
        if (!preg_match('/^03[0-9]{9}$/', str_replace('-', '', $b['phone']))) return response()->json(['message' => 'Phone must be in 03XXXXXXXXX format.'], 422);

        $dob = Carbon::parse($b['dob']);
        $age = $dob->diffInYears(Carbon::now());
        $minAge = $cycle->level->min_age ?? 15;
        if ($age < $minAge || $age > 45) {
            return response()->json(['message' => "Applicant age must be between {$minAge} and 45 years for " . $cycle->level->name . " admission."], 422);
        }

        $thisYear = date('Y');
        $earliestMatricYear = $dob->year + self::MIN_MATRIC_PASS_AGE;
        $matricYear = (int)$b['matricYear'];
        if ($matricYear < $earliestMatricYear || $matricYear > $thisYear) return response()->json(['message' => "Matric passing year must be between {$earliestMatricYear} and {$thisYear}."], 422);
        if (!ctype_digit((string)$b['matricRollNo'])) return response()->json(['message' => 'Matric roll number must be numeric.'], 422);
        
        $marksOk = fn($o, $t) => $t > 0 && $o >= 0 && $o <= $t;
        if (!$marksOk($b['matricObtained'], $b['matricTotal'])) return response()->json(['message' => 'Matric marks are invalid.'], 422);

        if ($program->level->prerequisite_type === 'inter_groups') {
            $interYear = (int)$b['interYear'];
            $earliestInterYear = max($dob->year + self::MIN_INTER_PASS_AGE, $matricYear + 1);
            if ($interYear < $earliestInterYear || $interYear > $thisYear) return response()->json(['message' => "Intermediate passing year must be between {$earliestInterYear} and {$thisYear}."], 422);
            if (!ctype_digit((string)$b['interRollNo'])) return response()->json(['message' => 'Intermediate roll number must be numeric.'], 422);
            if (!$marksOk($b['interObtained'], $b['interTotal'])) return response()->json(['message' => 'Intermediate marks are invalid.'], 422);
            if (!InterGroup::find($b['interGroupId'])) return response()->json(['message' => 'Select a valid intermediate group.'], 422);
        }

        $check = EligibilityService::checkEligibility($b);
        if (!$check['eligible']) return response()->json(['message' => $check['reason'], 'ineligible' => true], 422);

        $data = [
            'user_id' => $request->user()->id, 'admission_cycle_id' => $cycle->id, 'program_id' => $program->id,
            'name' => $b['name'], 'father_name' => $b['fatherName'], 'cnic_bform' => $b['cnicBform'], 'gender' => $b['gender'],
            'dob' => $dob, 'province' => $b['province'], 'domicile_district' => $b['domicile'], 'address' => $b['address'],
            'phone' => $b['phone'], 'guardian_phone' => $b['guardianPhone'], 'religion' => $b['religion'],
            'marital_status' => $b['maritalStatus'] ?? null, 'blood_group' => $b['bloodGroup'] ?? null,
            'has_disability' => !empty($b['hasDisability']), 'disability_details' => !empty($b['hasDisability']) ? ($b['disabilityDetails'] ?? null) : null,
            'medical_conditions' => $b['medicalConditions'] ?? null,
            'is_hafiz' => ($b['religion'] === 'Islam' && !empty($b['isHafiz'])),
            'matric_board' => $b['matricBoard'], 'matric_year' => $matricYear, 'matric_roll_no' => (string)$b['matricRollNo'],
            'matric_obtained' => (int)$b['matricObtained'], 'matric_total' => (int)$b['matricTotal'],
            'matric_group_id' => !empty($b['matricGroupId']) ? (int)$b['matricGroupId'] : null,
            'inter_group_id' => !empty($b['interGroupId']) ? (int)$b['interGroupId'] : null,
            'inter_board' => $b['interBoard'] ?? null, 'inter_year' => !empty($b['interYear']) ? (int)$b['interYear'] : null,
            'inter_roll_no' => $b['interRollNo'] ?? null,
            'inter_obtained' => !empty($b['interObtained']) ? (int)$b['interObtained'] : null,
            'inter_total' => !empty($b['interTotal']) ? (int)$b['interTotal'] : null,
        ];

        $existingDraft = Application::where('user_id', $request->user()->id)->where('admission_cycle_id', $cycle->id)->where('program_id', $program->id)->where('status', 'draft')->first();
        if ($existingDraft) {
            $existingDraft->update($data);
            return response()->json(['application' => $existingDraft]);
        }

        try {
            if (!empty($b['asDraft'])) $data['status'] = 'draft';
            $data['application_no'] = $this->nextAppNo();
            $app = Application::create($data);

            $priorApp = Application::with('documents')->where('user_id', $request->user()->id)->where('id', '!=', $app->id)->where('status', '!=', 'draft')->orderBy('id', 'desc')->first();
            if ($priorApp && $priorApp->documents->count()) {
                $validTypeIds = $this->documentTypesFor((object)$app->toArray(), $program->level)->pluck('id')->toArray();
                foreach ($priorApp->documents as $d) {
                    if (in_array($d->document_type_id, $validTypeIds)) {
                        ApplicationDocument::create([
                            'application_id' => $app->id, 'document_type_id' => $d->document_type_id, 'file_path' => $d->file_path, 'status' => 'pending'
                        ]);
                    }
                }
            }
            if ($priorApp && $priorApp->photo_path) {
                $app->update(['photo_path' => $priorApp->photo_path]);
            }

            if (empty($b['asDraft'])) {
                NotifyService::notify($request->user()->id, 'application', 'Application submitted', "Your application {$app->application_no} for {$program->name} has been received. Upload your documents to complete it.", '/portal/applications');
            }
            return response()->json(['application' => $app], 201);
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() === '23000') return response()->json(['message' => 'You have already applied to this program in this cycle with this CNIC.'], 422);
            throw $e;
        }
    }

    public function submitDraft(Request $request, $id)
    {
        $app = Application::with(['program', 'documents'])->where('id', $id)->where('user_id', $request->user()->id)->firstOrFail();
        if ($app->status !== 'draft') return response()->json(['message' => 'This application has already been submitted.'], 422);

        $requiredTypes = collect($this->documentTypesFor((object)$app->toArray(), $app->program->level))->where('is_required', true);
        $uploadedTypeIds = $app->documents->pluck('document_type_id')->toArray();
        $missing = $requiredTypes->filter(fn($t) => !in_array($t->id, $uploadedTypeIds));
        
        if ($missing->count()) {
            return response()->json(['message' => 'Upload the required document(s) first: ' . $missing->pluck('name')->implode(', ') . '.'], 422);
        }

        $app->update(['status' => 'submitted']);
        NotifyService::notify($request->user()->id, 'application', 'Application submitted', "Your application {$app->application_no} has been received and is under review by the admissions office.", '/portal/applications');
        return response()->json(['application' => $app]);
    }

    public function uploadDocument(Request $request, $id, $typeId)
    {
        if (!$request->hasFile('file')) return response()->json(['message' => 'A file is required.'], 422);
        
        $app = Application::where('id', $id)->where('user_id', $request->user()->id)->firstOrFail();
        if (!in_array($app->status, ['draft', 'submitted', 'docs_rejected'])) {
            return response()->json(['message' => 'Documents can only be changed while the application is under document review.'], 422);
        }

        $file = $request->file('file');
        $path = $file->store('applications', 'private');

        $doc = ApplicationDocument::updateOrCreate(
            ['application_id' => $app->id, 'document_type_id' => $typeId],
            ['file_path' => $path, 'status' => 'pending', 'remarks' => null]
        );

        $docType = DocumentType::find($typeId);
        if ($docType && $docType->name === self::PHOTO_DOC_NAME && $file->getClientOriginalExtension() !== 'pdf') {
            $publicPath = str_replace('private/', 'public/applicants/', $path);
            Storage::disk('public')->put('applicants/' . basename($path), file_get_contents($file->getRealPath()));
            $app->update(['photo_path' => '/storage/applicants/' . basename($path)]);
        }

        $rejectedLeft = ApplicationDocument::where('application_id', $app->id)->where('status', 'rejected')->count();
        if ($app->status === 'docs_rejected' && $rejectedLeft === 0) {
            $app->update(['status' => 'submitted']);
        }

        return response()->json(['document' => $doc], 201);
    }

    // ── Clerk verification desk ──

    public function getQueue(Request $request)
    {
        Gate::authorize('admissions.view');
        $status = $request->get('status', 'submitted');
        
        $q = Application::with(['program', 'cycle', 'documents'])->orderBy('id', 'desc');
        if ($status === 'all') $q->where('status', '!=', 'draft');
        else $q->where('status', $status);
        
        return response()->json(['applications' => $q->get()]);
    }

    public function getPdf(Request $request, $id)
    {
        $app = Application::with(['program', 'cycle', 'interGroup', 'documents.documentType', 'challans.items'])->findOrFail($id);
        $roles = $request->user()->roles->pluck('name')->toArray();
        $isStaff = in_array('admin', $roles) || in_array('principal', $roles) || $request->user()->hasPermission('admissions.view');
        
        if ($app->user_id !== $request->user()->id && !$isStaff) return response()->json(['message' => 'Not allowed.'], 403);

        $pdfBinary = PdfService::buildApplicationPdf($app);
        return response($pdfBinary)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', "attachment; filename=\"{$app->application_no}.pdf\"");
    }

    public function show(Request $request, $id)
    {
        $app = Application::with(['program', 'cycle', 'interGroup', 'documents.documentType', 'challans.items'])->findOrFail($id);
        $roles = $request->user()->roles->pluck('name')->toArray();
        $isStaff = in_array('admin', $roles) || in_array('principal', $roles) || $request->user()->hasPermission('admissions.view');
        
        if ($app->user_id !== $request->user()->id && !$isStaff) return response()->json(['message' => 'Not allowed.'], 403);

        $documentTypes = $this->documentTypesFor((object)$app->toArray(), $app->program->level);
        return response()->json(['application' => $app, 'documentTypes' => $documentTypes]);
    }

    public function reviewDocument(Request $request, $docId)
    {
        Gate::authorize('admissions.verify');
        $action = $request->action;
        if (!in_array($action, ['approve', 'reject'])) return response()->json(['message' => 'Action must be approve or reject.'], 422);
        if ($action === 'reject' && empty($request->remarks)) return response()->json(['message' => 'Remarks are required when rejecting a document.'], 422);

        $doc = ApplicationDocument::with(['application', 'documentType'])->findOrFail($docId);
        $doc->update([
            'status' => $action === 'approve' ? 'approved' : 'rejected',
            'remarks' => $request->remarks ?: null,
            'verified_by' => $request->user()->id,
            'verified_at' => Carbon::now()
        ]);

        $app = $doc->application;
        if ($action === 'reject') {
            $app->update(['status' => 'docs_rejected']);
            NotifyService::notify($app->user_id, 'document', "Document rejected: {$doc->documentType->name}", "Reason: {$request->remarks}. Please re-upload the corrected document.", '/portal/applications');
        }

        return response()->json(['document' => $doc]);
    }

    public function approveApplication(Request $request, $id)
    {
        Gate::authorize('admissions.approve');
        $app = Application::with(['program', 'documents'])->findOrFail($id);
        if (!in_array($app->status, ['submitted', 'docs_rejected'])) {
            $s = str_replace('_', ' ', $app->status);
            return response()->json(['message' => "Only submitted applications can be approved (this one is {$s})."], 422);
        }

        $requiredTypes = collect($this->documentTypesFor((object)$app->toArray(), $app->program->level))->where('is_required', true);
        $approvedTypeIds = $app->documents->where('status', 'approved')->pluck('document_type_id')->toArray();
        $unapproved = $requiredTypes->filter(fn($t) => !in_array($t->id, $approvedTypeIds));

        if ($unapproved->count()) {
            return response()->json(['message' => 'Approve every required document first — still pending: ' . $unapproved->pluck('name')->implode(', ') . '.'], 422);
        }

        $app->update([
            'status' => 'verified', 'verified_by' => $request->user()->id, 'verified_at' => Carbon::now(), 'remarks' => null
        ]);
        NotifyService::notify($app->user_id, 'application', 'Application approved', "Your application {$app->application_no} has been approved. Please wait for the merit list — you will be notified when it is published.", '/portal/applications');
        
        return response()->json(['application' => $app]);
    }

    public function overrideEligibility(Request $request, $id)
    {
        Gate::authorize('admissions.verify');
        if (empty($request->reason)) return response()->json(['message' => 'A written justification is required for an override.'], 422);
        
        $app = Application::findOrFail($id);
        $app->update(['overridden' => true, 'override_reason' => $request->reason]);
        return response()->json(['application' => $app]);
    }

    public function rejectApplication(Request $request, $id)
    {
        Gate::authorize('admissions.approve');
        if (empty($request->reason)) return response()->json(['message' => 'A reason is required.'], 422);
        
        $app = Application::findOrFail($id);
        $app->update(['status' => 'rejected', 'remarks' => $request->reason]);
        NotifyService::notify($app->user_id, 'application', 'Application rejected', "Reason: {$request->reason}", '/portal/applications');
        return response()->json(['application' => $app]);
    }

    public function downloadDocument(Request $request, $docId)
    {
        $doc = ApplicationDocument::with('application')->findOrFail($docId);
        $roles = $request->user()->roles->pluck('name')->toArray();
        $isStaff = in_array('admin', $roles) || in_array('principal', $roles) || $request->user()->hasPermission('admissions.view');
        
        if ($doc->application->user_id !== $request->user()->id && !$isStaff) return response()->json(['message' => 'Not allowed.'], 403);

        $path = storage_path("app/private/" . $doc->file_path);
        if (!file_exists($path)) return response()->json(['message' => 'File missing.'], 404);

        return response()->download($path);
    }
}
