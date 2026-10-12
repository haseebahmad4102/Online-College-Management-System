<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use App\Models\Challan;
use App\Models\Application;
use App\Services\ChallanService;
use App\Services\SettingService;

class ChallanController extends Controller
{
    private const CHALLAN_INCLUDE = ['items', 'application.program', 'student', 'department'];

    public function index(Request $request)
    {
        Gate::authorize('challans.view');
        $status = $request->get('status', 'fee_submitted');
        
        $q = Challan::with(self::CHALLAN_INCLUDE)->orderBy('id', 'desc');
        if ($status !== 'all') {
            $q->where('status', $status);
        }
        
        return response()->json(['challans' => $q->get()]);
    }

    public function getPrintData(Request $request, $id)
    {
        $challan = Challan::with(self::CHALLAN_INCLUDE)->findOrFail($id);
        
        $roles = $request->user()->roles->pluck('name')->toArray();
        $isOwner = false;
        if ($challan->application && $challan->application->user_id === $request->user()->id) $isOwner = true;
        if ($challan->student && $challan->student->user_id === $request->user()->id) $isOwner = true;
        
        $isStaff = in_array('admin', $roles) || in_array('principal', $roles) || $request->user()->hasPermission('challans.view');
        
        if (!$isOwner && !$isStaff) return response()->json(['message' => 'Not allowed.'], 403);

        if ($challan->purpose === 'admission' && $challan->status === 'unpaid') {
            ChallanService::refreshAdmissionChallan($challan->id);
            $challan = Challan::with(self::CHALLAN_INCLUDE)->find($challan->id);
        }

        return response()->json([
            'challan' => $challan,
            'bank' => [
                'name' => SettingService::getSetting('challan.bank_name', ''),
                'branch' => SettingService::getSetting('challan.branch', ''),
                'accountNo' => SettingService::getSetting('challan.account_no', ''),
            ],
            'college' => [
                'nameEn' => SettingService::getSetting('site.college_name_en', ''),
                'nameUr' => SettingService::getSetting('site.college_name_ur', ''),
            ]
        ]);
    }

    public function uploadPaidCopy(Request $request, $id)
    {
        if (!$request->hasFile('file')) return response()->json(['message' => 'The paid challan copy is required.'], 422);

        $challan = Challan::with(['application', 'student'])->findOrFail($id);
        
        $isOwner = false;
        if ($challan->application && $challan->application->user_id === $request->user()->id) $isOwner = true;
        if ($challan->student && $challan->student->user_id === $request->user()->id) $isOwner = true;
        if (!$isOwner) return response()->json(['message' => 'Not allowed.'], 403);

        if (!in_array($challan->status, ['unpaid', 'rejected'])) {
            return response()->json(['message' => 'This challan is not awaiting payment.'], 422);
        }

        $file = $request->file('file');
        $path = $file->store('challans', 'private');

        $challan->update([
            'status' => 'fee_submitted',
            'paid_copy_path' => $path,
            'paid_on' => Carbon::now()
        ]);

        if ($challan->application_id) {
            Application::where('id', $challan->application_id)->update(['status' => 'fee_submitted']);
        }

        return response()->json(['challan' => $challan]);
    }

    public function verify(Request $request, $id)
    {
        Gate::authorize('challans.verify');
        try {
            $result = ChallanService::verifyChallan($id, $request->user()->id);
            $msg = isset($result['student']) ? "Enrolled with roll number {$result['student']->roll_number}." : 'Challan verified.';
            return response()->json(array_merge(['message' => $msg], $result));
        } catch (\Exception $e) {
            $code = $e->getCode();
            $status = (is_numeric($code) && (int)$code >= 100 && (int)$code <= 599) ? (int)$code : 422;
            return response()->json(['message' => $e->getMessage()], $status);
        }
    }

    public function reject(Request $request, $id)
    {
        Gate::authorize('challans.verify');
        if (empty($request->remarks)) return response()->json(['message' => 'Remarks are required when rejecting.'], 422);
        
        try {
            $challan = ChallanService::rejectChallan($id, $request->user()->id, $request->remarks);
            return response()->json(['challan' => $challan]);
        } catch (\Exception $e) {
            $code = $e->getCode();
            $status = (is_numeric($code) && (int)$code >= 100 && (int)$code <= 599) ? (int)$code : 422;
            return response()->json(['message' => $e->getMessage()], $status);
        }
    }

    public function downloadPaidCopy(Request $request, $id)
    {
        $challan = Challan::with(['application', 'student'])->findOrFail($id);
        if (!$challan->paid_copy_path) return response()->json(['message' => 'No paid copy uploaded.'], 404);

        $roles = $request->user()->roles->pluck('name')->toArray();
        $isOwner = false;
        if ($challan->application && $challan->application->user_id === $request->user()->id) $isOwner = true;
        if ($challan->student && $challan->student->user_id === $request->user()->id) $isOwner = true;
        
        $isStaff = in_array('admin', $roles) || in_array('principal', $roles) || $request->user()->hasPermission('challans.view');
        
        if (!$isOwner && !$isStaff) return response()->json(['message' => 'Not allowed.'], 403);

        $path = storage_path("app/private/" . $challan->paid_copy_path);
        if (!file_exists($path)) return response()->json(['message' => 'File missing.'], 404);

        return response()->download($path);
    }
}
