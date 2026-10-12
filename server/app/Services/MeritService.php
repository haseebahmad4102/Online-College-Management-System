<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use App\Models\Application;
use App\Models\AdmissionCycle;
use App\Models\Program;
use App\Models\MeritList;
use App\Models\MeritListEntry;
use App\Services\SettingService;

class MeritService
{
    private static function matricPct($app, $hafizBonus)
    {
        $obtained = min($app->matric_obtained + ($app->is_hafiz ? $hafizBonus : 0), $app->matric_total);
        if ($app->matric_total <= 0) return 0;
        return ($obtained / $app->matric_total) * 100;
    }

    private static function interPct($app)
    {
        if (!$app->inter_obtained || !$app->inter_total || $app->inter_total <= 0) return 0;
        return ($app->inter_obtained / $app->inter_total) * 100;
    }

    public static function computeMeritScore($app, $cycle, $level)
    {
        $hafizBonus = $cycle->hafiz_bonus ?? SettingService::getNumber('merit.hafiz_bonus', 20);
        
        if ($level->merit_rule === 'matric_only') {
            return self::matricPct($app, $hafizBonus);
        }
        
        if ($level->merit_rule === 'inter_only') {
            return self::interPct($app);
        }

        $wMatric = (float) ($cycle->merit_w_matric ?? SettingService::getNumber('merit.w_matric', 0.3));
        $wInter = (float) ($cycle->merit_w_inter ?? SettingService::getNumber('merit.w_inter', 0.7));
        
        return $wMatric * self::matricPct($app, $hafizBonus) + $wInter * self::interPct($app);
    }

    public static function generateMeritList($cycleId, $programId, $seats, $userId)
    {
        $cycle = AdmissionCycle::find($cycleId);
        $program = Program::find($programId);
        if (!$cycle || !$program) throw new \Exception('Cycle or program not found.', 404);

        $lastList = MeritList::where('admission_cycle_id', $cycleId)->where('program_id', $programId)->orderBy('list_no', 'desc')->first();
        $listNo = ($lastList->list_no ?? 0) + 1;

        $pool = Application::where('admission_cycle_id', $cycleId)
            ->where('program_id', $programId)
            ->whereIn('status', ['verified', 'waitlisted'])
            ->get();
            
        if ($pool->count() === 0) throw new \Exception('No verified applications available for this program.', 422);

        $hafizBonus = $cycle->hafiz_bonus ?? SettingService::getNumber('merit.hafiz_bonus', 20);
        $scored = [];
        foreach ($pool as $app) {
            $score = self::computeMeritScore($app, $cycle, $program->level);
            $scored[] = ['app' => $app, 'score' => $score];
        }

        usort($scored, function($a, $b) use ($hafizBonus) {
            if (abs($b['score'] - $a['score']) > 0.0001) return $b['score'] <=> $a['score'];
            
            $bInter = self::interPct($b['app']);
            $aInter = self::interPct($a['app']);
            if (abs($bInter - $aInter) > 0.0001) return $bInter <=> $aInter;

            $bMatric = self::matricPct($b['app'], $hafizBonus);
            $aMatric = self::matricPct($a['app'], $hafizBonus);
            if (abs($bMatric - $aMatric) > 0.0001) return $bMatric <=> $aMatric;

            if ($a['app']->dob != $b['app']->dob) return $a['app']->dob <=> $b['app']->dob;
            return strcmp($a['app']->application_no, $b['app']->application_no);
        });

        return DB::transaction(function() use ($cycleId, $programId, $listNo, $seats, $userId, $scored) {
            $list = MeritList::create([
                'admission_cycle_id' => $cycleId,
                'program_id' => $programId,
                'list_no' => $listNo,
                'seats' => $seats,
                'generated_by' => $userId,
                'status' => 'draft'
            ]);

            foreach ($scored as $i => $item) {
                $app = $item['app'];
                $score = $item['score'];
                $selected = $i < $seats;
                
                MeritListEntry::create([
                    'merit_list_id' => $list->id,
                    'application_id' => $app->id,
                    'position' => $i + 1,
                    'merit_score' => number_format($score, 3, '.', ''),
                    'status' => $selected ? 'selected' : 'waiting'
                ]);

                $app->update(['merit_score' => number_format($score, 3, '.', '')]);
            }

            $cutoff = null;
            if (count($scored) >= $seats) {
                $cutoff = $scored[min($seats, count($scored)) - 1]['score'];
            } elseif (count($scored) > 0) {
                $cutoff = $scored[count($scored) - 1]['score'];
            }
            
            if ($cutoff !== null) {
                $list->update(['cutoff_score' => number_format($cutoff, 3, '.', '')]);
            }

            return clone $list;
        });
    }
}
