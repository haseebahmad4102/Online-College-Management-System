<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\File;
use App\Models\Setting;
use App\Models\Page;
use App\Models\GalleryImage;
use App\Services\ChallanService;

class SettingController extends Controller
{
    private function upsertSetting($key, $value)
    {
        Setting::updateOrCreate(
            ['key' => $key],
            ['value' => (string)$value, 'group' => 'site']
        );
    }

    private function handleUpload($file, $folder)
    {
        $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
        $path = public_path("uploads/{$folder}");
        if (!File::exists($path)) {
            File::makeDirectory($path, 0755, true);
        }
        $file->move($path, $filename);
        return "/uploads/{$folder}/{$filename}";
    }

    public function getPublic(Request $request)
    {
        $rows = Setting::where('group', 'site')->get();
        $settings = [];
        foreach ($rows as $r) {
            $settings[$r->key] = $r->value;
        }
        return response()->json(['settings' => $settings]);
    }

    public function index(Request $request)
    {
        Gate::authorize('settings.view');
        
        $roles = $request->user()->roles->pluck('name')->toArray();
        $isSuper = in_array('principal', $roles) || in_array('admin', $roles);
        
        $q = Setting::query();
        if (!$isSuper) {
            $q->where('group', 'library');
        }
        
        $settings = $q->orderBy('group', 'asc')->orderBy('key', 'asc')->get();
        return response()->json(['settings' => $settings]);
    }

    public function update(Request $request)
    {
        Gate::authorize('settings.update');
        
        $updates = $request->updates;
        if (!is_array($updates)) return response()->json(['message' => 'Updates object is required.'], 422);

        $roles = $request->user()->roles->pluck('name')->toArray();
        $isPrincipal = in_array('principal', $roles) || in_array('admin', $roles);

        $rollKeys = ['rollno.pattern', 'site.college_code'];
        $rollConfigChanged = false;

        foreach ($rollKeys as $key) {
            if (array_key_exists($key, $updates)) {
                $current = Setting::where('key', $key)->first();
                if ($current && $current->value !== (string)$updates[$key]) {
                    $rollConfigChanged = true;
                }
            }
        }

        foreach ($updates as $key => $value) {
            if (!$isPrincipal && !str_starts_with($key, 'library.')) {
                return response()->json(['message' => 'You may only edit library settings.'], 403);
            }
            Setting::where('key', $key)->update(['value' => (string)$value]);
        }

        if ($rollConfigChanged && $isPrincipal) {
            $count = ChallanService::regenerateAllRollNumbers();
            $s = $count === 1 ? '' : 's';
            return response()->json(['message' => "Settings saved. Roll numbers regenerated for {$count} student{$s}."]);
        }

        return response()->json(['message' => 'Settings saved.']);
    }

    public function uploadLogo(Request $request)
    {
        Gate::authorize('website.manage');
        
        if (!$request->hasFile('logo')) return response()->json(['message' => 'Logo file is required.'], 422);
        
        $url = $this->handleUpload($request->file('logo'), 'site');
        $this->upsertSetting('site.logo', $url);
        
        return response()->json(['message' => 'Logo uploaded.', 'url' => $url]);
    }

    public function getPrincipalMessage(Request $request)
    {
        \Illuminate\Support\Facades\Log::info('getPrincipalMessage called by user: ' . $request->user()->id . ' with roles: ' . json_encode($request->user()->roles->pluck('name')));
        // Allowed for website.view or website.manage.
        if (!$request->user()->hasPermission('website.view') && !$request->user()->hasPermission('website.manage')) {
            \Illuminate\Support\Facades\Log::error('getPrincipalMessage 403 for user: ' . $request->user()->id);
            abort(403);
        }

        $page = Page::where('slug', 'principal-message')->first();
        $rows = Setting::whereIn('key', ['site.principal_name', 'site.principal_photo'])->get();
        
        $settings = [];
        foreach ($rows as $r) {
            $settings[$r->key] = $r->value;
        }

        return response()->json([
            'title' => $page->title ?? "Principal's Message",
            'content' => $page->content ?? '',
            'name' => $settings['site.principal_name'] ?? '',
            'photoUrl' => $settings['site.principal_photo'] ?? ''
        ]);
    }

    public function updatePrincipalMessage(Request $request)
    {
        Gate::authorize('website.manage');
        
        if (!$request->content || trim($request->content) === '') {
            return response()->json(['message' => 'Message content is required.'], 422);
        }

        Page::updateOrCreate(
            ['slug' => 'principal-message'],
            [
                'title' => $request->title ?: "Principal's Message",
                'content' => $request->content,
                'updated_by' => $request->user()->id
            ]
        );

        if ($request->has('name')) {
            $this->upsertSetting('site.principal_name', $request->name);
        }

        return response()->json(['message' => "Principal's message saved."]);
    }

    public function uploadPrincipalPhoto(Request $request)
    {
        if (!in_array('principal', $request->user()->roles->pluck('name')->toArray())) {
            return response()->json(['message' => "Only the Principal can change the principal's photo."], 403);
        }
        
        if (!$request->hasFile('photo')) return response()->json(['message' => 'A photo file is required.'], 422);
        
        $url = $this->handleUpload($request->file('photo'), 'site');
        $this->upsertSetting('site.principal_photo', $url);
        
        return response()->json(['message' => 'Principal photo uploaded.', 'url' => $url]);
    }

    public function uploadSiteImage(Request $request, $slot)
    {
        Gate::authorize('website.manage');
        
        if (!in_array($slot, ['mission', 'vision'])) return response()->json(['message' => 'Unknown image slot.'], 404);
        if (!$request->hasFile('image')) return response()->json(['message' => 'An image file is required.'], 422);
        
        $url = $this->handleUpload($request->file('image'), 'site');
        $this->upsertSetting("site.{$slot}_image", $url);
        
        return response()->json(['message' => ucfirst($slot) . ' image uploaded.', 'url' => $url]);
    }

    public function getGallery(Request $request)
    {
        \Illuminate\Support\Facades\Log::info('getGallery called by user: ' . $request->user()->id . ' with roles: ' . json_encode($request->user()->roles->pluck('name')));
        if (!$request->user()->hasPermission('website.view') && !$request->user()->hasPermission('website.manage')) {
            \Illuminate\Support\Facades\Log::error('getGallery 403 for user: ' . $request->user()->id);
            abort(403);
        }

        $images = GalleryImage::orderBy('sort_order', 'asc')->orderBy('id', 'asc')->get();
        return response()->json(['images' => $images]);
    }

    public function storeGallery(Request $request)
    {
        Gate::authorize('website.manage');
        
        if (!$request->hasFile('image')) return response()->json(['message' => 'An image file is required.'], 422);

        $url = $this->handleUpload($request->file('image'), 'gallery');
        $last = GalleryImage::orderBy('sort_order', 'desc')->first();
        
        $image = GalleryImage::create([
            'image_path' => $url,
            'caption' => $request->caption ?: null,
            'sort_order' => ($last->sort_order ?? 0) + 1
        ]);

        return response()->json(['image' => $image], 201);
    }

    public function updateGallery(Request $request, $id)
    {
        Gate::authorize('website.manage');
        
        $image = GalleryImage::findOrFail($id);
        
        $data = [];
        if ($request->has('caption')) $data['caption'] = $request->caption ?: null;
        if ($request->has('isActive')) $data['is_active'] = filter_var($request->isActive, FILTER_VALIDATE_BOOLEAN);
        if ($request->has('sortOrder')) $data['sort_order'] = (int)$request->sortOrder;

        $image->update($data);
        return response()->json(['image' => $image]);
    }

    public function destroyGallery(Request $request, $id)
    {
        Gate::authorize('website.manage');
        
        $image = GalleryImage::findOrFail($id);
        $url = $image->image_path;
        $image->delete();

        if (str_starts_with($url, '/uploads/')) {
            $rel = substr($url, 1);
            $full = public_path($rel);
            if (File::exists($full)) {
                File::delete($full);
            }
        }

        return response()->json(['message' => 'Gallery image deleted.']);
    }
}
