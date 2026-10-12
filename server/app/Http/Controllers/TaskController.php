<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

class TaskController extends Controller
{
    public function getTasks(Request $request)
    {
        Gate::authorize('tasks.manage');

        $tasks = Task::with(['assignee', 'creator'])->orderBy('created_at', 'desc')->get();
        $users = User::with('teacher.department')->where('is_active', true)->select('id', 'name', 'email')->get();

        return response()->json([
            'tasks' => $tasks,
            'users' => $users
        ]);
    }

    public function getMyTasks(Request $request)
    {
        $tasks = Task::with(['creator'])
            ->where('assigned_to_user_id', $request->user()->id)
            ->orderBy('due_date', 'asc')
            ->get();

        return response()->json(['tasks' => $tasks]);
    }

    public function storeTask(Request $request)
    {
        Gate::authorize('tasks.manage');

        $req = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assigned_to_user_id' => 'nullable|exists:users,id',
            'status' => 'required|string|in:pending,in_progress,completed',
            'due_date' => 'nullable|date'
        ]);

        $req['created_by_user_id'] = $request->user()->id;

        $task = Task::create($req);

        if ($task->assigned_to_user_id) {
            \App\Models\Notification::create([
                'user_id' => $task->assigned_to_user_id,
                'type' => 'task_assigned',
                'title' => 'New Task Assigned',
                'body' => "You have been assigned a task: {$task->title}",
                'link' => '/portal/my-tasks'
            ]);
        }

        return response()->json([
            'message' => 'Task created successfully',
            'task' => Task::with(['assignee', 'creator'])->find($task->id)
        ]);
    }

    public function updateTask(Request $request, $id)
    {
        Gate::authorize('tasks.manage');

        $task = Task::findOrFail($id);

        $req = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assigned_to_user_id' => 'nullable|exists:users,id',
            'status' => 'required|string|in:pending,in_progress,completed',
            'due_date' => 'nullable|date'
        ]);

        $oldAssignee = $task->assigned_to_user_id;
        $task->update($req);

        if ($task->assigned_to_user_id && $task->assigned_to_user_id !== $oldAssignee) {
            \App\Models\Notification::create([
                'user_id' => $task->assigned_to_user_id,
                'type' => 'task_assigned',
                'title' => 'New Task Assigned',
                'body' => "You have been assigned a task: {$task->title}",
                'link' => '/portal/my-tasks'
            ]);
        }

        return response()->json([
            'message' => 'Task updated successfully',
            'task' => Task::with(['assignee', 'creator'])->find($task->id)
        ]);
    }

    public function updateMyTaskStatus(Request $request, $id)
    {
        $task = Task::where('id', $id)
            ->where('assigned_to_user_id', $request->user()->id)
            ->firstOrFail();

        $req = $request->validate([
            'status' => 'required|string|in:pending,in_progress,completed'
        ]);

        $task->update(['status' => $req['status']]);

        return response()->json(['message' => 'Status updated', 'task' => $task]);
    }

    public function deleteTask(Request $request, $id)
    {
        Gate::authorize('tasks.manage');

        $task = Task::findOrFail($id);
        $task->delete();

        return response()->json(['message' => 'Task deleted successfully']);
    }
}
