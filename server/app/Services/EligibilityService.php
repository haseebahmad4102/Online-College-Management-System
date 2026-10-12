<?php

namespace App\Services;

use App\Models\Program;
use App\Models\InterGroup;

class EligibilityService
{
    public static function checkEligibility($data)
    {
        $program = Program::with(['level', 'programEligibilities.interGroup', 'programEligibilities.matricGroup'])->find($data['programId']);
        
        if (!$program || !$program->is_active) {
            return ['eligible' => false, 'reason' => 'This program is not open for admission.'];
        }

        $minPct = (float) $program->min_percentage;
        $prereq = $program->level->prerequisite_type;

        if ($prereq === 'matric_groups') {
            if (empty($data['matricGroupId']) || empty($data['matricObtained']) || empty($data['matricTotal'])) {
                return ['eligible' => false, 'reason' => 'Matriculation details (group, marks) are required.'];
            }

            $allowedGroupIds = $program->programEligibilities->pluck('matric_group_id')->filter()->toArray();
            if (!empty($allowedGroupIds) && !in_array($data['matricGroupId'], $allowedGroupIds)) {
                $group = \App\Models\MatricGroup::find($data['matricGroupId']);
                $allowedNames = $program->programEligibilities->pluck('matricGroup.name')->filter()->implode(', ');
                $groupName = $group ? $group->name : 'selected';
                return [
                    'eligible' => false,
                    'reason' => "{$program->name} does not accept applicants from the {$groupName} group. Eligible groups: {$allowedNames}."
                ];
            }

            $pct = ($data['matricObtained'] / $data['matricTotal']) * 100;
            if ($pct < $minPct) {
                return [
                    'eligible' => false,
                    'reason' => "Your percentage (" . number_format($pct, 1) . "%) is below the required minimum of {$minPct}% for {$program->name}."
                ];
            }
            return ['eligible' => true];
        }

        if ($prereq === 'inter_groups') {
            if (empty($data['interGroupId']) || empty($data['interObtained']) || empty($data['interTotal'])) {
                return ['eligible' => false, 'reason' => 'Intermediate details (group, marks) are required.'];
            }

            $allowedGroupIds = $program->programEligibilities->pluck('inter_group_id')->filter()->toArray();
            if (!empty($allowedGroupIds) && !in_array($data['interGroupId'], $allowedGroupIds)) {
                $group = InterGroup::find($data['interGroupId']);
                $allowedNames = $program->programEligibilities->pluck('interGroup.name')->filter()->implode(', ');
                $groupName = $group ? $group->name : 'selected';
                return [
                    'eligible' => false,
                    'reason' => "{$program->name} does not accept applicants from the {$groupName} group. Eligible groups: {$allowedNames}."
                ];
            }

            $pct = ($data['interObtained'] / $data['interTotal']) * 100;
            if ($pct < $minPct) {
                return [
                    'eligible' => false,
                    'reason' => "Your percentage (" . number_format($pct, 1) . "%) is below the required minimum of {$minPct}% for {$program->name}."
                ];
            }
        }

        return ['eligible' => true];
    }
}
