<?php
use App\Models\Department;
use App\Models\Program;

$inter = Department::create(['name' => 'Intermediate', 'code' => 'INTER']);
$dip = Department::create(['name' => 'Diploma', 'code' => 'DIP']);

Program::whereIn('id', [12, 13, 14, 15])->update(['department_id' => $inter->id]);
Program::where('id', 16)->update(['department_id' => $dip->id]);

echo "Done.\n";
