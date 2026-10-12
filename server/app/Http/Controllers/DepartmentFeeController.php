<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Carbon\Carbon;
use App\Models\DepartmentFeeItem;
use App\Models\Department;
use App\Models\Student;
use App\Models\Challan;
use App\Models\ChallanItem;
use App\Services\SettingService;
use App\Services\NotifyService;

class DepartmentFeeController extends Controller
{
    public function index(Request $request, $departmentId)
    {
        Gate::authorize('challans.view');
        $items = DepartmentFeeItem::where('department_id', $departmentId)->orderBy('id', 'asc')->get();
        return response()->json(['items' => $items]);
    }

    public function store(Request $request)
    {
        Gate::authorize('challans.manage');
        $req = $request->validate([
            'departmentId' => 'required|integer',
            'label' => 'required|string|min:1',
            'amount' => 'required|numeric|gt:0'
        ]);

        $department = Department::find($req['departmentId']);
        if (!$department) return response()->json(['message' => 'Department not found.'], 404);

        $item = DepartmentFeeItem::create([
            'department_id' => $req['departmentId'],
            'label' => trim($req['label']),
            'amount' => $req['amount']
        ]);

        return response()->json(['item' => $item], 201);
    }

    public function update(Request $request, $id)
    {
        Gate::authorize('challans.manage');
        $item = DepartmentFeeItem::findOrFail($id);

        $data = [];
        if ($request->has('label')) {
            $label = trim($request->label);
            if (empty($label)) return response()->json(['message' => 'Label cannot be empty.'], 422);
            $data['label'] = $label;
        }
        if ($request->has('amount')) {
            $amount = (float) $request->amount;
            if ($amount <= 0) return response()->json(['message' => 'Amount must be positive.'], 422);
            $data['amount'] = $amount;
        }
        if ($request->has('isActive')) {
            $data['is_active'] = (bool) $request->isActive;
        }

        $item->update($data);
        return response()->json(['item' => $item]);
    }

    public function destroy(Request $request, $id)
    {
        Gate::authorize('challans.manage');
        DepartmentFeeItem::where('id', $id)->delete();
        return response()->json(['message' => 'Fee type removed.']);
    }

    public function issue(Request $request, $departmentId)
    {
        Gate::authorize('challans.manage');
        $department = Department::find($departmentId);
        if (!$department) return response()->json(['message' => 'Department not found.'], 404);

        $student = Student::find($request->studentId ?? 0);
        if (!$student) return response()->json(['message' => 'Student not found.'], 404);

        $feeItems = DepartmentFeeItem::where('department_id', $departmentId)->where('is_active', true)->get();
        if ($feeItems->count() === 0) return response()->json(['message' => 'This department has no active fee types configured yet.'], 422);

        $total = $feeItems->sum('amount');
        $dueDays = SettingService::getNumber('challan.due_days', 7);
        $count = Challan::count();
        $challanNo = "CH-" . date('Y') . "-" . str_pad($count + 1, 6, '0', STR_PAD_LEFT);

        $challan = Challan::create([
            'challan_no' => $challanNo,
            'student_id' => $student->id,
            'department_id' => $departmentId,
            'purpose' => 'department_fee',
            'total_amount' => $total,
            'due_date' => Carbon::now()->addDays($dueDays)
        ]);

        foreach ($feeItems as $item) {
            ChallanItem::create([
                'challan_id' => $challan->id,
                'label' => $item->label,
                'amount' => $item->amount
            ]);
        }

        NotifyService::notify($student->user_id, 'challan', 'Fee voucher issued', "{$department->name} voucher {$challanNo} (Rs. {$total}) — pay at the bank and upload the paid copy before the due date.", '/portal/my-challans');
        
        $full = Challan::with(['items', 'student', 'department'])->find($challan->id);
        return response()->json(['challan' => $full], 201);
    }

    public function customChallan(Request $request)
    {
        Gate::authorize('challans.manage');
        $req = $request->validate([
            'title' => 'required|string|min:1',
            'amount' => 'required|numeric|gt:0'
        ]);

        $student = null;
        if (!empty($request->studentId)) {
            $student = Student::find($request->studentId);
            if (!$student) return response()->json(['message' => 'Student not found.'], 404);
        }

        $deptId = null;
        if (!empty($request->departmentId)) {
            $dept = Department::find($request->departmentId);
            if (!$dept) return response()->json(['message' => 'Department not found.'], 404);
            $deptId = $dept->id;
        }

        $label = trim($req['title']);
        $value = (float) $req['amount'];
        $dueDays = SettingService::getNumber('challan.due_days', 7);
        $count = Challan::count();
        $challanNo = "CH-" . date('Y') . "-" . str_pad($count + 1, 6, '0', STR_PAD_LEFT);

        $challan = Challan::create([
            'challan_no' => $challanNo,
            'student_id' => $student ? $student->id : null,
            'department_id' => $deptId,
            'purpose' => 'other',
            'total_amount' => $value,
            'due_date' => Carbon::now()->addDays($dueDays)
        ]);

        ChallanItem::create([
            'challan_id' => $challan->id,
            'label' => $label,
            'amount' => $value
        ]);

        if ($student) {
            NotifyService::notify($student->user_id, 'challan', "{$label} issued", "{$label} challan {$challanNo} (Rs. {$value}) — pay at the bank and upload the paid copy before the due date.", '/portal/my-challans');
        }

        $full = Challan::with(['items', 'student', 'department'])->find($challan->id);
        return response()->json(['challan' => $full], 201);
    }
}
