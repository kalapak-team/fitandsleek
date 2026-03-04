<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Collection;
use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class CollectionAdminController extends BaseAdminController
{
    public function index()
    {
        $items = Collection::orderBy('gender')->orderBy('sort_order')->get()->map(fn($c)=>[
            'id'=>$c->id,'name'=>$c->name,'slug'=>$c->slug,'gender'=>$c->gender,
            'image_url'=>Media::url($c->image_url),
            'text_position'=>$c->text_position,'link'=>$c->link,
            'sort_order'=>$c->sort_order,'is_active'=>$c->is_active,
        ]);
        return response()->json(['data'=>$items]);
    }

    public function store(Request $request)
    {
        $v = $request->validate([
            'name'=>['required','string','max:255'],
            'gender'=>['required','in:men,women,boys,girls'],
            'slug'=>['nullable','string','max:255','unique:collections,slug'],
            'text_position'=>['required','in:top,overlay,bottom'],
            'link'=>['nullable','string','max:255'],
            'sort_order'=>['nullable','integer'],
            'is_active'=>['nullable'],
            'image'=>['nullable','image','mimes:jpg,jpeg,png,webp','max:5120'],
        ]);

        $slug = $v['slug'] ?? Str::slug($v['name']);
        $path = $this->storeImage($request,'image','collections');

        $c = Collection::create([
            'name'=>$v['name'],
            'gender'=>$v['gender'],
            'slug'=>$slug,
            'image_url'=>$path,
            'text_position'=>$v['text_position'],
            'link'=>$v['link'] ?? null,
            'sort_order'=>$v['sort_order'] ?? 0,
            'is_active'=>$this->bool($request->input('is_active', true)),
        ]);

        return response()->json(['data'=>[
            'id'=>$c->id,'name'=>$c->name,'slug'=>$c->slug,'gender'=>$c->gender,
            'image_url'=>Media::url($c->image_url),
            'text_position'=>$c->text_position,'link'=>$c->link,
            'sort_order'=>$c->sort_order,'is_active'=>$c->is_active,
        ]], 201);
    }

    public function update(Request $request, Collection $collection)
    {
        $v = $request->validate([
            'name'=>['sometimes','required','string','max:255'],
            'gender'=>['sometimes','required','in:men,women,boys,girls'],
            'slug'=>['sometimes','nullable','string','max:255','unique:collections,slug,'.$collection->id],
            'text_position'=>['sometimes','required','in:top,overlay,bottom'],
            'link'=>['sometimes','nullable','string','max:255'],
            'sort_order'=>['sometimes','nullable','integer'],
            'is_active'=>['sometimes'],
            'image'=>['sometimes','nullable','image','mimes:jpg,jpeg,png,webp','max:5120'],
            'remove_image'=>['sometimes','nullable'],
        ]);

        foreach (['name','gender','text_position','link'] as $f) {
            if ($request->has($f)) $collection->$f = $request->input($f);
        }
        if ($request->has('slug')) $collection->slug = $request->input('slug') ?: Str::slug($collection->name);
        if ($request->has('sort_order')) $collection->sort_order = $request->input('sort_order') ?? 0;
        if ($request->has('is_active')) $collection->is_active = $this->bool($request->input('is_active'));

        if ($this->bool($request->input('remove_image', false)) && $collection->image_url) {
            Storage::disk('public')->delete($collection->image_url);
            $collection->image_url = null;
        }

        $newPath = $this->storeImage($request,'image','collections');
        if ($newPath) {
            if ($collection->image_url) Storage::disk('public')->delete($collection->image_url);
            $collection->image_url = $newPath;
        }

        $collection->save();

        return response()->json(['data'=>[
            'id'=>$collection->id,'name'=>$collection->name,'slug'=>$collection->slug,'gender'=>$collection->gender,
            'image_url'=>Media::url($collection->image_url),
            'text_position'=>$collection->text_position,'link'=>$collection->link,
            'sort_order'=>$collection->sort_order,'is_active'=>$collection->is_active,
        ]]);
    }

    public function destroy(Collection $collection)
    {
        if ($collection->image_url) Storage::disk('public')->delete($collection->image_url);
        $collection->delete();
        return response()->json(['ok'=>true]);
    }
}
