<?php
use App\Models\Department;
use App\Models\Program;

// First, get the 'Intermediate' and 'Diploma' departments we just made
$inter = Department::where('code', 'INTER')->first();
$dip = Department::where('code', 'DIP')->first();

if ($inter) {
    // Rename to FSc Pre-Medical and assign only program 12
    $inter->update(['name' => 'FSc Pre-Medical', 'code' => 'FSC-PM']);
    Program::where('id', 12)->update(['department_id' => $inter->id]);
}

if ($dip) {
    // Rename to DIT and assign program 16
    $dip->update(['name' => 'Diploma in Information Technology (DIT)', 'code' => 'DIT']);
    Program::where('id', 16)->update(['department_id' => $dip->id]);
}

// Create new departments for the rest
$fsc_pe = Department::firstOrCreate(['code' => 'FSC-PE'], ['name' => 'FSc Pre-Engineering']);
Program::where('id', 13)->update(['department_id' => $fsc_pe->id]);

$ics = Department::firstOrCreate(['code' => 'ICS'], ['name' => 'ICS']);
Program::where('id', 14)->update(['department_id' => $ics->id]);

$fa = Department::firstOrCreate(['code' => 'FA'], ['name' => 'FA']);
Program::where('id', 15)->update(['department_id' => $fa->id]);

echo "Done.\n";
