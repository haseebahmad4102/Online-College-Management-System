<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Department;
use App\Models\DepartmentGalleryImage;
use App\Models\Student;
use App\Models\AttendanceRecord;

class HodController extends Controller
{
    public function getDepartment(Request $request)
    {
        $teacher = $request->user()->teacher;
        if (!$teacher) abort(403, 'Not a teacher');
        
        $department = $teacher->hod_department()->with(['programs', 'galleryImages'])->withCount('teachers')->first();
        if (!$department) abort(403, 'Not HOD of any department');

        $studentCount = Student::whereIn('program_id', $department->programs->pluck('id'))->where('status', 'active')->count();

        return response()->json([
            'department' => $department,
            'studentCount' => $studentCount
        ]);
    }

    public function updateDepartment(Request $request)
    {
        $teacher = $request->user()->teacher;
        if (!$teacher) abort(403, 'Not a teacher');
        
        $department = $teacher->hod_department()->first();
        if (!$department) abort(403, 'Not HOD of any department');

        $request->validate([
            'message' => 'nullable|string',
            'description' => 'nullable|string'
        ]);

        $department->update($request->only(['message', 'description']));

        return response()->json(['message' => 'Department page updated successfully']);
    }

    public function addGalleryImage(Request $request)
    {
        $teacher = $request->user()->teacher;
        if (!$teacher) abort(403, 'Not a teacher');
        
        $department = $teacher->hod_department()->first();
        if (!$department) abort(403, 'Not HOD of any department');

        $request->validate([
            'image' => 'required|image|max:2048',
            'caption' => 'nullable|string'
        ]);

        $file = $request->file('image');
        $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
        $file->move(public_path('uploads/site'), $filename);

        DepartmentGalleryImage::create([
            'department_id' => $department->id,
            'image_path' => '/uploads/site/' . $filename,
            'caption' => $request->caption
        ]);

        return response()->json(['message' => 'Photo added to gallery']);
    }

    public function removeGalleryImage(Request $request, $id)
    {
        $teacher = $request->user()->teacher;
        if (!$teacher) abort(403, 'Not a teacher');
        
        $department = $teacher->hod_department()->first();
        if (!$department) abort(403, 'Not HOD of any department');

        $img = DepartmentGalleryImage::where('department_id', $department->id)->findOrFail($id);
        
        if (file_exists(public_path($img->image_path))) {
            @unlink(public_path($img->image_path));
        }
        
        $img->delete();

        return response()->json(['message' => 'Photo removed']);
    }

    public function getStudents(Request $request)
    {
        $teacher = $request->user()->teacher;
        if (!$teacher) abort(403, 'Not a teacher');
        
        $department = $teacher->hod_department()->with('programs')->first();
        if (!$department) abort(403, 'Not HOD of any department');

        $programs = $department->programs->pluck('id');
        $students = Student::with(['program', 'classSection'])
            ->whereIn('program_id', $programs)
            ->where('status', 'active')
            ->get();

        // Calculate attendance percentages
        $results = [];
        foreach ($students as $student) {
            $records = AttendanceRecord::where('student_id', $student->id)->get();
            $total = $records->count();
            $present = $records->where('status', 'P')->count();
            $absent = $records->where('status', 'A')->count();
            $leave = $records->where('status', 'L')->count();
            
            $pct = $total > 0 ? round(($present / $total) * 100) : null;
            
            $results[] = [
                'id' => $student->id,
                'rollNumber' => $student->roll_number,
                'name' => $student->name,
                'program' => $student->program->title,
                'termNo' => $student->class_section ? $student->class_section->term_no : null,
                'shift' => $student->class_section ? $student->class_section->shift : null,
                'attendance' => [
                    'pct' => $pct,
                    'present' => $present,
                    'absent' => $absent,
                    'leave' => $leave
                ]
            ];
        }

        return response()->json(['students' => $results]);
    }

    public function getStudentAttendance(Request $request, $id)
    {
        $teacher = $request->user()->teacher;
        if (!$teacher) abort(403, 'Not a teacher');
        
        $department = $teacher->hod_department()->with('programs')->first();
        if (!$department) abort(403, 'Not HOD of any department');

        $student = Student::whereIn('program_id', $department->programs->pluck('id'))->findOrFail($id);

        $records = AttendanceRecord::with('attendance_sheet.allocation.subject')
            ->where('student_id', $student->id)
            ->get()
            ->map(function ($r) {
                return [
                    'subject' => $r->attendance_sheet->allocation->subject->title,
                    'date' => $r->attendance_sheet->date,
                    'status' => $r->status
                ];
            });

        return response()->json([
            'student' => $student,
            'records' => $records
        ]);
    }
}
