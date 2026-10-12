<?php

use App\Models\User;
use App\Models\Student;
use App\Models\ClassSection;
use Illuminate\Support\Facades\Hash;
use Faker\Factory as Faker;
use Carbon\Carbon;

$faker = Faker::create('en_US'); // fallback to english names
$sections = ClassSection::with(['program', 'academicSession'])->where('is_active', true)->get();

if ($sections->isEmpty()) {
    echo "No class sections found. Run generate_sections.php first.\n";
    exit;
}

$totalToGenerate = 500;
$count = 0;

for ($i = 0; $i < $totalToGenerate; $i++) {
    $section = $sections->random();
    
    // Create User
    $user = User::create([
        'name' => $faker->name(),
        'email' => $faker->unique()->safeEmail(),
        'password' => Hash::make('password'),
        'role' => 'applicant',
        'is_active' => true
    ]);
    
    // Create Student
    Student::create([
        'user_id' => $user->id,
        'program_id' => $section->program_id,
        'academic_session_id' => $section->academic_session_id,
        'class_section_id' => $section->id,
        'roll_number' => $section->academicSession->start_year . '-GGCM-' . strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $section->program->code), 0, 3)) . '-' . str_pad(rand(1, 99999), 5, '0', STR_PAD_LEFT),
        'name' => $user->name,
        'father_name' => $faker->name('male'),
        'cnic_bform' => $faker->numerify('#####-#######-#'),
        'gender' => $faker->randomElement(['male', 'female']),
        'dob' => $faker->dateTimeBetween('-22 years', '-16 years'),
        'phone' => $faker->numerify('03#########'),
        'guardian_phone' => $faker->numerify('03#########'),
        'address' => $faker->address(),
        'status' => 'active',
        'admitted_on' => Carbon::now(),
        'matric_board' => 'BISE Lahore',
        'matric_year' => 2020,
        'matric_obtained' => $faker->numberBetween(700, 1050),
        'matric_total' => 1100,
        'inter_board' => 'BISE Lahore',
        'inter_year' => 2022,
        'inter_obtained' => $faker->numberBetween(700, 1050),
        'inter_total' => 1100,
    ]);
    
    $count++;
    if ($count % 50 === 0) {
        echo "Generated $count students...\n";
    }
}

echo "Successfully generated $count students.\n";
