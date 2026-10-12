<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\Building;
use App\Models\Department;
use Illuminate\Support\Facades\Gate;

class AssetController extends Controller
{
    public function getAssets(Request $request)
    {
        Gate::authorize('assets.manage');

        $assets = Asset::with(['category', 'department', 'building'])->get();
        $categories = AssetCategory::all();
        $buildings = Building::all();
        $departments = Department::select('id', 'name')->get();

        return response()->json([
            'assets' => $assets,
            'categories' => $categories,
            'buildings' => $buildings,
            'departments' => $departments
        ]);
    }

    public function storeAsset(Request $request)
    {
        Gate::authorize('manage.assets');

        $req = $request->validate([
            'category_id' => 'required|exists:asset_categories,id',
            'department_id' => 'nullable|exists:departments,id',
            'building_id' => 'nullable|exists:buildings,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:assets,code',
            'cost' => 'nullable|numeric',
            'purchase_date' => 'nullable|date',
            'status' => 'required|string|in:active,maintenance,retired'
        ]);

        $asset = Asset::create($req);

        return response()->json([
            'message' => 'Asset created successfully',
            'asset' => Asset::with(['category', 'department', 'building'])->find($asset->id)
        ]);
    }

    public function updateAsset(Request $request, $id)
    {
        Gate::authorize('manage.assets');

        $asset = Asset::findOrFail($id);

        $req = $request->validate([
            'category_id' => 'required|exists:asset_categories,id',
            'department_id' => 'nullable|exists:departments,id',
            'building_id' => 'nullable|exists:buildings,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:assets,code,' . $asset->id,
            'cost' => 'nullable|numeric',
            'purchase_date' => 'nullable|date',
            'status' => 'required|string|in:active,maintenance,retired'
        ]);

        $asset->update($req);

        return response()->json([
            'message' => 'Asset updated successfully',
            'asset' => Asset::with(['category', 'department', 'building'])->find($asset->id)
        ]);
    }

    public function deleteAsset(Request $request, $id)
    {
        Gate::authorize('manage.assets');

        $asset = Asset::findOrFail($id);
        $asset->delete();

        return response()->json(['message' => 'Asset deleted successfully']);
    }

    // Reference data management
    public function storeCategory(Request $request)
    {
        Gate::authorize('manage.assets');
        $req = $request->validate(['name' => 'required|string|max:255']);
        $category = AssetCategory::create($req);
        return response()->json(['category' => $category]);
    }

    public function storeBuilding(Request $request)
    {
        Gate::authorize('manage.assets');
        $req = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string',
            'description' => 'nullable|string'
        ]);
        $building = Building::create($req);
        return response()->json(['building' => $building]);
    }
}
