<?php

namespace App\Models\Traits;

use Illuminate\Support\Str;

trait CamelCaseRelations
{
    /**
     * Dynamically map camelCase method calls to snake_case relationship methods.
     * This allows $model->with('academicSession') to call academic_session() seamlessly.
     */
    public function __call($method, $parameters)
    {
        $aliases = [
            'eligibilities' => 'program_eligibilities',
            'documents' => 'application_documents',
            'entries' => 'timetable_entries', 
            'feeItems' => 'program_fee_items', 
            'members' => 'committee_members',
            'studentMembers' => 'students',
            'cycle' => 'admission_cycle',
            'hod' => 'teacher',
            'items' => 'challan_items',
            'gallery' => 'department_gallery_images',
            'carryForwards' => 'student_carry_forwards',
            
            // New additions based on exhaustive schema comparison
            'committees' => 'committee_members',
            'submissions' => 'classwork_submissions',
            'records' => 'attendance_records',
            'requests' => 'book_requests',
            'issues' => 'book_issues',
            'issue' => 'book_issue',
            'request' => 'book_request',
            'meritEntries' => 'merit_list_entries',
            'galleryImages' => 'department_gallery_images',
            'hodOf' => 'hod_department',
            'category' => 'book_category',
            'marks' => 'assessment_marks',
        ];

        if (isset($aliases[$method]) && method_exists($this, $aliases[$method])) {
            return $this->{$aliases[$method]}(...$parameters);
        }

        // Special context fallbacks
        if ($method === 'entries' && method_exists($this, 'merit_list_entries')) {
            return $this->merit_list_entries(...$parameters);
        }
        if ($method === 'feeItems' && method_exists($this, 'department_fee_items')) {
            return $this->department_fee_items(...$parameters);
        }

        $snakeMethod = Str::snake($method);

        if ($snakeMethod !== $method && method_exists($this, $snakeMethod)) {
            return $this->{$snakeMethod}(...$parameters);
        }

        return parent::__call($method, $parameters);
    }
}
