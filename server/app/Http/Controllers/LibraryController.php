<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Book;
use App\Models\BookCategory;
use App\Models\BookRequest;
use App\Models\BookIssue;
use App\Models\Student;
use App\Services\SettingService;
use App\Services\NotifyService;

class LibraryController extends Controller
{
    private function computeFine($issue, $returnedOn, $graceDays = 0)
    {
        $due = Carbon::parse($issue->due_date);
        $ret = Carbon::parse($returnedOn);
        
        $lateDays = floor($ret->diffInSeconds($due, false) / 86400);
        $lateDays = $lateDays < 0 ? abs($lateDays) : 0; // if ret > due, it's late. Wait.
        // Let's use diffInDays with absolute false, which returns positive if ret > due if called as $due->diffInDays($ret, false).
        // A safer way:
        if ($ret->lessThanOrEqualTo($due)) return 0;
        
        $lateDays = $due->diffInDays($ret); // complete days late
        $chargeable = max(0, $lateDays - $graceDays);
        return $chargeable * (float)$issue->fine_per_day;
    }

    public function getBooks(Request $request)
    {
        $roles = $request->user()->roles->pluck('name')->toArray();
        $isLibrarian = in_array('admin', $roles) || in_array('principal', $roles) || $request->user()->hasPermission('library.view') || $request->user()->hasPermission('library.manage');

        $q = Book::with('category')->orderBy('title', 'asc');
        
        if (!($isLibrarian && $request->query('all') === '1')) {
            $q->where('is_active', true);
        }

        $search = trim($request->query('q', ''));
        if ($search) {
            $q->where(function($query) use ($search) {
                $query->where('title', 'like', "%{$search}%")
                      ->orWhere('author', 'like', "%{$search}%")
                      ->orWhere('isbn', 'like', "%{$search}%")
                      ->orWhere('publisher', 'like', "%{$search}%");
            });
        }

        if ($request->query('category')) {
            $q->where('category_id', (int)$request->query('category'));
        }

        $books = $q->get();
        $categories = BookCategory::withCount('books')->orderBy('name', 'asc')->get();

        return response()->json([
            'books' => $books,
            'categories' => $categories
        ]);
    }

    public function getStats(Request $request)
    {
        Gate::authorize('library.view');
        
        $titles = Book::where('is_active', true)->count();
        $agg = Book::where('is_active', true)
            ->selectRaw('SUM(total_copies) as total_copies, SUM(available_copies) as available_copies')
            ->first();
            
        $issuedOut = BookIssue::whereNull('returned_on')->count();
        $pendingReq = BookRequest::where('status', 'pending')->count();
        $categories = BookCategory::count();
        
        $allIssues = BookIssue::whereNull('returned_on')->get();
        $today = Carbon::today();
        $overdue = $allIssues->filter(fn($i) => Carbon::parse($i->due_date)->isBefore($today))->count();

        return response()->json([
            'stats' => [
                'titles' => $titles,
                'totalCopies' => (int)($agg->total_copies ?? 0),
                'availableCopies' => (int)($agg->available_copies ?? 0),
                'issuedOut' => $issuedOut,
                'overdue' => $overdue,
                'pendingRequests' => $pendingReq,
                'categories' => $categories
            ]
        ]);
    }

    public function storeBook(Request $request)
    {
        Gate::authorize('library.manage');
        
        $req = $request->validate([
            'title' => 'required|string',
            'author' => 'required|string',
            'categoryId' => 'required|integer',
            'totalCopies' => 'required|integer'
        ]);

        $book = Book::create([
            'title' => $req['title'],
            'author' => $req['author'],
            'isbn' => $request->isbn ?: null,
            'publisher' => $request->publisher ?: null,
            'edition' => $request->edition ?: null,
            'category_id' => $req['categoryId'],
            'shelf_location' => $request->shelfLocation ?: null,
            'total_copies' => $req['totalCopies'],
            'available_copies' => $req['totalCopies'],
            'is_active' => true
        ]);

        return response()->json(['book' => $book], 201);
    }

    public function updateBook(Request $request, $id)
    {
        Gate::authorize('library.manage');
        
        $book = Book::findOrFail($id);
        
        $issuedOut = $book->total_copies - $book->available_copies;
        $newTotal = $request->has('totalCopies') ? (int)$request->totalCopies : $book->total_copies;
        
        if ($newTotal < $issuedOut) {
            return response()->json(['message' => "{$issuedOut} copies are currently issued — total cannot be lower."], 422);
        }

        $data = [];
        if ($request->has('title')) $data['title'] = $request->title;
        if ($request->has('author')) $data['author'] = $request->author;
        if ($request->has('isbn')) $data['isbn'] = $request->isbn;
        if ($request->has('publisher')) $data['publisher'] = $request->publisher;
        if ($request->has('edition')) $data['edition'] = $request->edition;
        if ($request->has('categoryId')) $data['category_id'] = (int)$request->categoryId;
        if ($request->has('shelfLocation')) $data['shelf_location'] = $request->shelfLocation;
        if ($request->has('isActive')) $data['is_active'] = filter_var($request->isActive, FILTER_VALIDATE_BOOLEAN);
        
        $data['total_copies'] = $newTotal;
        $data['available_copies'] = $newTotal - $issuedOut;

        $book->update($data);
        
        return response()->json(['book' => $book]);
    }

    public function destroyBook(Request $request, $id)
    {
        Gate::authorize('library.manage');
        
        $book = Book::findOrFail($id);
        $out = BookIssue::where('book_id', $book->id)->whereNull('returned_on')->count();
        
        if ($out > 0) {
            $p = $out === 1 ? 'copy is' : 'copies are';
            return response()->json(['message' => "{$out} {$p} currently issued. Collect them back first."], 422);
        }

        try {
            $book->delete();
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() === '23000') {
                return response()->json(['message' => 'This book has borrowing history and cannot be deleted. It stays for the record.'], 422);
            }
            throw $e;
        }

        return response()->json(['message' => 'Book deleted.']);
    }

    public function storeCategory(Request $request)
    {
        Gate::authorize('library.manage');
        
        $name = trim($request->name ?: '');
        if (strlen($name) < 2) return response()->json(['message' => 'Category name is required (at least 2 characters).'], 422);
        
        if (BookCategory::where('name', $name)->exists()) {
            return response()->json(['message' => 'That category already exists.'], 422);
        }

        $category = BookCategory::create(['name' => $name]);
        return response()->json(['category' => $category], 201);
    }

    public function destroyCategory(Request $request, $id)
    {
        Gate::authorize('library.manage');
        
        $count = Book::where('category_id', $id)->count();
        if ($count > 0) {
            $s = $count === 1 ? '' : 's';
            return response()->json(['message' => "{$count} book{$s} use this category. Move or remove them first."], 422);
        }

        BookCategory::where('id', $id)->delete();
        return response()->json(['message' => 'Category removed.']);
    }

    public function requestBook(Request $request)
    {
        $student = ($request->user()->student ?? abort(403, "Not a student"));
        if (!$student) $student = Student::where('user_id', $request->user()->id)->firstOrFail();

        $req = $request->validate([
            'bookId' => 'required|integer',
            'days' => 'required|integer'
        ]);

        $maxDays = SettingService::getNumber('library.max_days', 14);
        $maxBooks = SettingService::getNumber('library.max_books', 2);

        if ($req['days'] > $maxDays) return response()->json(['message' => "Maximum issue period is {$maxDays} days."], 422);

        $book = Book::findOrFail($req['bookId']);
        if (!$book->is_active) return response()->json(['message' => 'Book not found.'], 404);
        if ($book->available_copies < 1) return response()->json(['message' => 'No copies of this book are currently available.'], 422);

        $openIssues = BookIssue::where('student_id', $student->id)->whereNull('returned_on')->count();
        if ($openIssues >= $maxBooks) return response()->json(['message' => "You already have {$openIssues} book(s) issued (limit {$maxBooks}). Return one first."], 422);

        $dup = BookRequest::where('book_id', $book->id)->where('student_id', $student->id)->where('status', 'pending')->exists();
        if ($dup) return response()->json(['message' => 'You already have a pending request for this book.'], 422);

        $bookReq = BookRequest::create([
            'book_id' => $book->id,
            'student_id' => $student->id,
            'days_requested' => $req['days']
        ]);

        return response()->json(['request' => $bookReq], 201);
    }

    public function getMineStudent(Request $request)
    {
        $student = ($request->user()->student ?? abort(403, "Not a student"));
        if (!$student) $student = Student::where('user_id', $request->user()->id)->firstOrFail();

        $requests = BookRequest::with('book')->where('student_id', $student->id)->orderBy('id', 'desc')->get();
        $issues = BookIssue::with('book')->where('student_id', $student->id)->orderBy('id', 'desc')->get();

        return response()->json([
            'requests' => $requests,
            'issues' => $issues
        ]);
    }

    public function getRequests(Request $request)
    {
        Gate::authorize('library.view');
        
        $status = $request->query('status', 'pending');
        $q = BookRequest::with(['book', 'student']);
        
        if ($status !== 'all') {
            $q->where('status', $status);
        }

        $requests = $q->orderBy('id', 'asc')->get();
        return response()->json(['requests' => $requests]);
    }

    public function approveRequest(Request $request, $id)
    {
        Gate::authorize('library.manage');
        
        $finePerDay = SettingService::getNumber('library.fine_per_day', 10);
        
        $result = DB::transaction(function() use ($id, $request, $finePerDay) {
            $bookReq = BookRequest::with(['book', 'student'])->findOrFail($id);
            if ($bookReq->status !== 'pending') abort(422, 'Request is not pending.');
            if ($bookReq->book->available_copies < 1) abort(422, 'No copies available.');

            $bookReq->update([
                'status' => 'approved',
                'decided_by' => $request->user()->id,
                'decided_at' => Carbon::now()
            ]);

            $dueDate = Carbon::now()->addDays($bookReq->days_requested);

            $issue = BookIssue::create([
                'book_id' => $bookReq->book_id,
                'student_id' => $bookReq->student_id,
                'book_request_id' => $bookReq->id,
                'issued_by' => $request->user()->id,
                'issued_on' => Carbon::now(),
                'due_date' => $dueDate,
                'fine_per_day' => $finePerDay
            ]);

            $bookReq->book->decrement('available_copies');
            
            return ['request' => $bookReq, 'issue' => $issue];
        });

        $dueDateStr = Carbon::parse($result['issue']->due_date)->format('Y-m-d');
        NotifyService::notify($result['request']->student->user_id, 'library', 'Book request approved', "\"{$result['request']->book->title}\" is issued to you. Due date: {$dueDateStr}.", '/portal/library');

        return response()->json($result);
    }

    public function rejectRequest(Request $request, $id)
    {
        Gate::authorize('library.manage');
        
        if (!$request->remarks) return response()->json(['message' => 'Remarks are required.'], 422);

        $bookReq = BookRequest::with(['book', 'student'])->findOrFail($id);
        $bookReq->update([
            'status' => 'rejected',
            'remarks' => $request->remarks,
            'decided_by' => $request->user()->id,
            'decided_at' => Carbon::now()
        ]);

        NotifyService::notify($bookReq->student->user_id, 'library', 'Book request rejected', "\"{$bookReq->book->title}\" — {$request->remarks}", '/portal/library');

        return response()->json(['request' => $bookReq]);
    }

    public function getIssues(Request $request)
    {
        Gate::authorize('library.view');
        
        $open = $request->query('status') !== 'returned';
        
        $q = BookIssue::with(['book', 'student']);
        if ($open) {
            $q->whereNull('returned_on');
        } else {
            $q->whereNotNull('returned_on');
        }
        
        $issues = $q->orderBy('due_date', 'asc')->get();
        $graceDays = SettingService::getNumber('library.grace_days', 0);

        $now = Carbon::now();
        $formatted = $issues->map(function($i) use ($now, $graceDays) {
            $isOverdue = !$i->returned_on && $now->isAfter(Carbon::parse($i->due_date));
            $projectedFine = !$i->returned_on ? $this->computeFine($i, $now, $graceDays) : (float)$i->fine_amount;
            
            $data = $i->toArray();
            $data['overdue'] = $isOverdue;
            $data['projectedFine'] = $projectedFine;
            return $data;
        });

        return response()->json(['issues' => $formatted]);
    }

    public function returnIssue(Request $request, $id)
    {
        Gate::authorize('library.manage');
        
        $graceDays = SettingService::getNumber('library.grace_days', 0);
        
        $result = DB::transaction(function() use ($id, $request, $graceDays) {
            $issue = BookIssue::with(['book', 'student'])->findOrFail($id);
            if ($issue->returned_on) abort(422, 'Issue not found or already returned.');

            $returnedOn = Carbon::now();
            $fine = $this->computeFine($issue, $returnedOn, $graceDays);

            $issue->update([
                'returned_on' => $returnedOn,
                'received_by' => $request->user()->id,
                'fine_amount' => $fine,
                'fine_status' => $fine > 0 ? 'pending' : 'none'
            ]);

            $issue->book->increment('available_copies');

            return ['issue' => $issue, 'fine' => $fine, 'student' => $issue->student, 'book' => $issue->book];
        });

        if ($result['fine'] > 0) {
            NotifyService::notify($result['student']->user_id, 'library', 'Late return fine', "\"{$result['book']->title}\" was returned late. Fine: Rs. {$result['fine']}. Please clear it at the library desk.", '/portal/library');
        }

        $msg = $result['fine'] > 0 ? "Returned. Fine: Rs. {$result['fine']}" : 'Returned on time — no fine.';
        return response()->json(['message' => $msg, 'issue' => $result['issue']]);
    }

    public function fineStatus(Request $request, $id)
    {
        Gate::authorize('library.manage');
        
        $action = $request->action;
        if (!in_array($action, ['paid', 'waived'])) return response()->json(['message' => 'Action must be paid or waived.'], 422);

        $issue = BookIssue::findOrFail($id);
        $issue->update(['fine_status' => $action]);

        return response()->json(['issue' => $issue]);
    }
}
