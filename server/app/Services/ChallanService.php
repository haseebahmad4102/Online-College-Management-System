<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Models\Challan;
use App\Models\ChallanItem;
use App\Models\Application;
use App\Models\DepartmentFeeItem;
use App\Models\Student;
use App\Models\Role;
use App\Models\UserRole;
use App\Models\MeritListEntry;
use App\Models\AcademicSession;
use App\Services\SettingService;
use App\Services\NotifyService;

class ChallanService
{
    private static function admissionChallanItems($app)
    {
        $departmentId = $app->program->department_id;
        if ($departmentId) {
            $deptItems = DepartmentFeeItem::where('department_id', $departmentId)->where('is_active', true)->orderBy('id', 'asc')->get();
            if ($deptItems->count() > 0) {
                return [
                    'departmentId' => $departmentId,
                    'items' => $deptItems->map(fn($i) => ['label' => $i->label, 'amount' => $i->amount])->toArray()
                ];
            }
        }
        $items = $app->program->feeItems->map(fn($fi) => ['label' => $fi->feeHead->name, 'amount' => $fi->amount])->toArray();
        return ['departmentId' => null, 'items' => $items];
    }

    private static function itemsFingerprint($items)
    {
        $mapped = array_map(function($i) {
            return [$i['label'], number_format((float)$i['amount'], 2, '.', '')];
        }, $items);
        usort($mapped, function($a, $b) { return $a[0] <=> $b[0]; });
        return json_encode($mapped);
    }

    public static function refreshAdmissionChallan($challanId)
    {
        $challan = Challan::with('items')->find($challanId);
        if (!$challan || $challan->purpose !== 'admission' || $challan->status !== 'unpaid' || !$challan->application_id) {
            return $challan;
        }

        $app = Application::with(['program.feeItems.feeHead'])->find($challan->application_id);
        if (!$app) return $challan;

        $res = self::admissionChallanItems($app);
        $items = $res['items'];
        $departmentId = $res['departmentId'];

        if (empty($items)) return $challan;

        $oldItems = $challan->items->map(fn($i) => ['label' => $i->label, 'amount' => $i->amount])->toArray();
        if (self::itemsFingerprint($items) === self::itemsFingerprint($oldItems) && $challan->department_id == $departmentId) {
            return $challan;
        }

        ChallanItem::where('challan_id', $challan->id)->delete();
        
        $totalAmount = array_reduce($items, fn($s, $i) => $s + $i['amount'], 0);
        $challan->update([
            'total_amount' => $totalAmount,
            'department_id' => $departmentId
        ]);

        foreach ($items as $item) {
            ChallanItem::create(['challan_id' => $challan->id, 'label' => $item['label'], 'amount' => $item['amount']]);
        }
        
        return $challan->load('items');
    }

    public static function issueChallan($applicationId)
    {
        $app = Application::with(['program.feeItems.feeHead', 'cycle'])->findOrFail($applicationId);

        $existing = Challan::where('application_id', $applicationId)
            ->whereIn('status', ['unpaid', 'fee_submitted', 'verified'])->first();
        
        if ($existing) {
            return $existing->status === 'unpaid' ? self::refreshAdmissionChallan($existing->id) : $existing;
        }

        $res = self::admissionChallanItems($app);
        $items = $res['items'];
        $total = array_reduce($items, fn($s, $i) => $s + $i['amount'], 0);
        $dueDays = $app->cycle->challan_due_days ?? SettingService::getNumber('challan.due_days', 7);
        $count = Challan::count();
        $challanNo = "CH-" . date('Y') . "-" . str_pad($count + 1, 6, '0', STR_PAD_LEFT);

        $challan = Challan::create([
            'challan_no' => $challanNo,
            'application_id' => $applicationId,
            'department_id' => $res['departmentId'],
            'purpose' => 'admission',
            'total_amount' => $total,
            'due_date' => Carbon::now()->addDays($dueDays)
        ]);

        foreach ($items as $item) {
            ChallanItem::create(['challan_id' => $challan->id, 'label' => $item['label'], 'amount' => $item['amount']]);
        }

        $app->update(['status' => 'challan_issued']);
        NotifyService::notify($app->user_id, 'challan', 'Fee challan issued', "Challan {$challanNo} (Rs. {$total}) for {$app->program->name}. Pay at the bank and upload the paid copy before the due date.", '/portal/applications');
        
        return $challan;
    }

    public static function generateRollNumber($program, $session)
    {
        $pattern = SettingService::getSetting('rollno.pattern', '{YEAR}-{COLLEGE}-{DEPT}-{SEQ3}');
        $collegeCode = SettingService::getSetting('site.college_code', 'GGCM');
        $deptCode = $program->department ? $program->department->code : $program->code;
        $count = Student::where('program_id', $program->id)->where('academic_session_id', $session->id)->count();
        $seq = $count + 1;

        while (true) {
            $roll = str_replace(
                ['{YEAR}', '{PROG}', '{COLLEGE}', '{DEPT}', '{SEQ3}'],
                [$session->start_year, $program->code, $collegeCode, $deptCode, str_pad($seq, 3, '0', STR_PAD_LEFT)],
                $pattern
            );
            if (!Student::where('roll_number', $roll)->exists()) {
                break;
            }
            $seq++;
        }
        return $roll;
    }

    public static function verifyChallan($challanId, $clerkUserId)
    {
        return DB::transaction(function() use ($challanId, $clerkUserId) {
            $challan = Challan::with(['application.program.department', 'application.cycle.academicSession', 'student', 'department'])->findOrFail($challanId);
            
            if ($challan->status !== 'fee_submitted') {
                throw new \Exception('Only challans with an uploaded paid copy can be verified.', 422);
            }

            $challan->update([
                'status' => 'verified',
                'verified_by' => $clerkUserId,
                'verified_at' => Carbon::now()
            ]);

            $app = $challan->application;
            if (!$app) {
                if ($challan->student) {
                    $voucherType = $challan->department ? $challan->department->name . ' voucher' : 'Voucher';
                    NotifyService::notify($challan->student->user_id, 'challan', 'Fee voucher verified', "{$voucherType} {$challan->challan_no} (Rs. {$challan->total_amount}) has been verified.", '/portal/my-challans');
                }
                return ['challan' => $challan];
            }

            $alreadyEnrolled = Student::with('program')->where('user_id', $app->user_id)->where('status', 'active')->first();
            if ($alreadyEnrolled) {
                $pName = $alreadyEnrolled->program->name ?? 'another program';
                throw new \Exception("This applicant is already enrolled in {$pName} (roll {$alreadyEnrolled->roll_number}). A student can only be enrolled in one program at a time.", 422);
            }

            $session = $app->cycle->academicSession;
            $rollNumber = self::generateRollNumber($app->program, $session);

            $student = Student::create([
                'user_id' => $app->user_id,
                'application_id' => $app->id,
                'roll_number' => $rollNumber,
                'program_id' => $app->program_id,
                'academic_session_id' => $session->id,
                'name' => $app->name,
                'father_name' => $app->father_name,
                'cnic_bform' => $app->cnic_bform,
                'gender' => $app->gender,
                'dob' => $app->dob,
                'phone' => $app->phone,
                'guardian_phone' => $app->guardian_phone,
                'address' => $app->address,
                'photo_path' => $app->photo_path,
                'matric_board' => $app->matric_board,
                'matric_year' => $app->matric_year,
                'matric_obtained' => $app->matric_obtained,
                'matric_total' => $app->matric_total,
                'matric_group_id' => $app->matric_group_id,
                'inter_group_id' => $app->inter_group_id,
                'inter_board' => $app->inter_board,
                'inter_year' => $app->inter_year,
                'inter_obtained' => $app->inter_obtained,
                'inter_total' => $app->inter_total,
                'admitted_on' => Carbon::now()
            ]);

            $studentRole = Role::where('name', 'student')->first();
            UserRole::updateOrCreate(['user_id' => $app->user_id, 'role_id' => $studentRole->id]);
            
            $applicantRole = Role::where('name', 'applicant')->first();
            if ($applicantRole) {
                UserRole::where('user_id', $app->user_id)->where('role_id', $applicantRole->id)->delete();
            }

            $app->update(['status' => 'enrolled']);
            MeritListEntry::where('application_id', $app->id)->where('status', 'selected')->update(['status' => 'admitted']);

            NotifyService::notify($app->user_id, 'enrollment', 'Admission confirmed — welcome to GGCM!', "Your fee has been verified. Your roll number is {$rollNumber}. Your student portal is now active.", '/portal');

            return ['challan' => $challan, 'student' => $student];
        });
    }

    public static function regenerateAllRollNumbers()
    {
        $pattern = SettingService::getSetting('rollno.pattern', '{YEAR}-{COLLEGE}-{DEPT}-{SEQ3}');
        $collegeCode = SettingService::getSetting('site.college_code', 'GGCM');
        
        return DB::transaction(function() use ($pattern, $collegeCode) {
            $students = Student::with(['program.department'])->orderBy('program_id')->orderBy('academic_session_id')->orderBy('id')->get();
            $sessions = AcademicSession::all()->keyBy('id');
            
            foreach ($students as $s) {
                $s->update(['roll_number' => "#tmp-{$s->id}"]);
            }
            
            $seqs = [];
            foreach ($students as $s) {
                $year = $sessions[$s->academic_session_id]->start_year ?? '';
                $deptCode = $s->program->department->code ?? $s->program->code;
                
                $prefixKey = "{$year}-{$deptCode}";
                if (!isset($seqs[$prefixKey])) $seqs[$prefixKey] = 0;
                $seqs[$prefixKey]++;
                
                $roll = str_replace(
                    ['{YEAR}', '{PROG}', '{COLLEGE}', '{DEPT}', '{SEQ3}'],
                    [$year, $s->program->code, $collegeCode, $deptCode, str_pad($seqs[$prefixKey], 3, '0', STR_PAD_LEFT)],
                    $pattern
                );
                $s->update(['roll_number' => $roll]);
            }
            return count($students);
        });
    }

    public static function rejectChallan($challanId, $clerkUserId, $remarks)
    {
        $challan = Challan::with('application')->findOrFail($challanId);
        $challan->update([
            'status' => 'unpaid',
            'paid_copy_path' => null,
            'remarks' => $remarks,
            'verified_by' => $clerkUserId,
            'verified_at' => Carbon::now()
        ]);
        if ($challan->application) {
            $challan->application->update(['status' => 'challan_issued']);
            NotifyService::notify($challan->application->user_id, 'challan', 'Paid challan copy rejected', "Reason: {$remarks}. Please upload a clear copy of the paid challan again.", '/portal/applications');
        }
        return $challan;
    }
}
