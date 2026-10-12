<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Carbon\Carbon;
use App\Models\Notice;

class NoticeController extends Controller
{
    public function getFeed(Request $request)
    {
        $audiences = ['portal_all'];
        $roles = $request->user()->roles->pluck('name')->toArray();
        if (in_array('student', $roles)) $audiences[] = 'students';
        if (in_array('teacher', $roles)) $audiences[] = 'teachers';
        if (in_array('applicant', $roles)) $audiences[] = 'applicants';

        $notices = Notice::whereIn('audience', $audiences)
            ->where('published_at', '<=', Carbon::now())
            ->where(function($q) {
                $q->whereNull('expires_at')
                  ->orWhere('expires_at', '>=', Carbon::now());
            })
            ->orderBy('published_at', 'desc')
            ->take(50)
            ->get();

        return response()->json(['notices' => $notices]);
    }

    public function index(Request $request)
    {
        Gate::authorize('notices.view');
        $page = max(1, (int)$request->get('page', 1));
        $perPage = min(100, max(5, (int)$request->get('perPage', 25)));

        $total = Notice::count();
        $notices = Notice::with('program')
            ->orderBy('published_at', 'desc')
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        return response()->json([
            'notices' => $notices,
            'total' => $total,
            'page' => $page,
            'pages' => max(1, ceil($total / $perPage))
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('notices.create');
        $req = $request->validate([
            'title' => 'required|string',
            'body' => 'required|string',
            'audience' => 'required|string'
        ]);

        $notice = Notice::create([
            'title' => $req['title'],
            'body' => $req['body'],
            'audience' => $req['audience'],
            'program_id' => $request->programId ? (int)$request->programId : null,
            'published_at' => $request->publishedAt ? Carbon::parse($request->publishedAt) : Carbon::now(),
            'expires_at' => $request->expiresAt ? Carbon::parse($request->expiresAt) : null,
            'created_by' => $request->user()->id
        ]);

        return response()->json(['notice' => $notice], 201);
    }

    public function update(Request $request, $id)
    {
        Gate::authorize('notices.update');
        $notice = Notice::findOrFail($id);

        $data = [];
        if ($request->has('title')) $data['title'] = $request->title;
        if ($request->has('body')) $data['body'] = $request->body;
        if ($request->has('audience')) $data['audience'] = $request->audience;
        if ($request->has('expiresAt')) {
            $data['expires_at'] = $request->expiresAt ? Carbon::parse($request->expiresAt) : null;
        }

        $notice->update($data);
        return response()->json(['notice' => $notice]);
    }

    public function destroy(Request $request, $id)
    {
        Gate::authorize('notices.delete');
        Notice::where('id', $id)->delete();
        return response()->json(['message' => 'Notice deleted.']);
    }
}
