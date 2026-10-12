<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\MeritList;
use App\Models\MeritListEntry;
use App\Models\Application;
use App\Models\Notice;
use App\Services\MeritService;
use App\Services\ChallanService;
use App\Services\NotifyService;

class MeritController extends Controller
{
    public function getPublic(Request $request)
    {
        $lists = MeritList::with(['program', 'cycle', 'entries' => function($q) {
            $q->with('application')->orderBy('position', 'asc');
        }])->where('status', 'published')->orderBy('program_id', 'asc')->orderBy('list_no', 'asc')->get();

        $formatted = $lists->map(function($l) {
            return [
                'id' => $l->id,
                'program' => $l->program->name ?? '',
                'listNo' => $l->list_no,
                'seats' => $l->seats,
                'cutoff' => $l->cutoff_score,
                'publishedAt' => $l->published_at,
                'cycle' => $l->cycle->title ?? '',
                'entries' => $l->entries->map(function($e) {
                    return [
                        'position' => $e->position,
                        'name' => $e->application->name ?? '',
                        'applicationNo' => $e->application->application_no ?? '',
                        'score' => $e->merit_score,
                        'status' => $e->status
                    ];
                })
            ];
        });

        return response()->json(['meritLists' => $formatted]);
    }

    public function index(Request $request)
    {
        Gate::authorize('merit.view');
        $lists = MeritList::with(['program', 'cycle', 'entries' => function($q) {
            $q->with('application')->orderBy('position', 'asc');
        }])->orderBy('id', 'desc')->get();
        return response()->json(['meritLists' => $lists]);
    }

    public function generate(Request $request)
    {
        Gate::authorize('merit.generate');
        $req = $request->validate([
            'cycleId' => 'required|integer',
            'programId' => 'required|integer',
            'seats' => 'required|integer|min:1'
        ]);

        try {
            $list = MeritService::generateMeritList($req['cycleId'], $req['programId'], $req['seats'], $request->user()->id);
            $full = MeritList::with(['program', 'cycle', 'entries' => function($q) {
                $q->with('application')->orderBy('position', 'asc');
            }])->find($list->id);
            return response()->json(['meritList' => $full], 201);
        } catch (\Exception $e) {
            $code = $e->getCode();
            $status = (is_numeric($code) && (int)$code >= 100 && (int)$code <= 599) ? (int)$code : 422;
            return response()->json(['message' => $e->getMessage()], $status);
        }
    }

    public function publish(Request $request, $id)
    {
        Gate::authorize('merit.publish');
        
        $list = MeritList::with(['program', 'cycle', 'entries.application'])->findOrFail($id);
        if ($list->status !== 'draft') return response()->json(['message' => 'Only draft lists can be published.'], 422);

        $list->update(['status' => 'published', 'published_at' => Carbon::now()]);

        foreach ($list->entries as $entry) {
            $app = $entry->application;
            if ($entry->status === 'selected') {
                $app->update(['status' => 'selected']);
                NotifyService::notify($app->user_id, 'merit', "Congratulations — selected in Merit List {$list->list_no}!", "You are selected for {$list->program->name} at position {$entry->position}. A fee challan has been issued; complete your admission before the due date.", '/portal/applications');
                ChallanService::issueChallan($app->id);
            } elseif ($entry->status === 'waiting') {
                $app->update(['status' => 'waitlisted']);
                NotifyService::notify($app->user_id, 'merit', "Merit List {$list->list_no} published", "You are on the waiting list for {$list->program->name} at position {$entry->position}.", '/portal/applications');
            }
        }

        Notice::create([
            'title' => "Merit List {$list->list_no} — {$list->program->name}: Fee Submission Notice",
            'body' => "Merit List {$list->list_no} for {$list->program->name} ({$list->cycle->title}) has been published. Selected candidates must download their fee challan from the applicant portal, deposit the fee at the designated bank branch, and upload the paid copy before the due date. Seats of candidates who fail to pay in time will be offered to the next candidates on the waiting list.",
            'audience' => 'public',
            'program_id' => $list->program_id,
            'merit_list_id' => $list->id,
            'published_at' => Carbon::now(),
            'created_by' => $request->user()->id
        ]);

        $full = MeritList::with(['program', 'cycle', 'entries' => function($q) {
            $q->with('application')->orderBy('position', 'asc');
        }])->find($list->id);
        
        return response()->json(['meritList' => $full]);
    }

    public function expireUnpaid(Request $request, $id)
    {
        Gate::authorize('merit.publish');
        $list = MeritList::with('entries')->findOrFail($id);
        $forfeited = 0;
        
        foreach ($list->entries as $entry) {
            if ($entry->status !== 'selected') continue;
            
            $app = Application::with('challans')->find($entry->application_id);
            if ($app->status === 'enrolled') continue;
            
            $challan = $app->challans->whereIn('status', ['unpaid', 'fee_submitted'])->first();
            if ($challan && Carbon::now() > Carbon::parse($challan->due_date) && $challan->status === 'unpaid') {
                $challan->update(['status' => 'expired']);
                $app->update(['status' => 'forfeited']);
                $entry->update(['status' => 'forfeited']);
                NotifyService::notify($app->user_id, 'merit', 'Selection forfeited', 'The fee due date has passed. Your seat has been released to the waiting list.', '/portal/applications');
                $forfeited++;
            }
        }
        return response()->json(['message' => "{$forfeited} unpaid selection(s) marked forfeited. Their seats can be filled by generating the next list."]);
    }

    public function closeRemaining(Request $request)
    {
        Gate::authorize('merit.publish');
        $req = $request->validate(['cycleId' => 'required', 'programId' => 'required']);
        
        $remaining = Application::with('program')->where('cycle_id', $req['cycleId'])
            ->where('program_id', $req['programId'])
            ->whereIn('status', ['verified', 'waitlisted'])
            ->get();
            
        foreach ($remaining as $app) {
            $app->update(['status' => 'not_selected']);
            NotifyService::notify($app->user_id, 'merit', 'Admission result', "We regret to inform you that your application for {$app->program->name} was not selected in any merit list for this admission cycle. Thank you for applying to GGCM.", '/portal/applications');
        }
        return response()->json(['message' => "{$remaining->count()} application(s) marked as not selected."]);
    }
}
