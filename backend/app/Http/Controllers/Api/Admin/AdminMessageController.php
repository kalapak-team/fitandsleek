<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminMessageController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $query = Message::query()->orderByDesc('id');

        $language = request('language');
        if ($language && $language !== 'all') {
            $query->where('language', $language);
        }

        $status = request('status');
        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        }

        return $query->paginate(20);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'link_url' => ['nullable', 'url', 'max:2048'],
            'media_url' => ['nullable', 'string', 'max:2048'],
            'media_type' => ['nullable', 'in:image,video'],
            'language' => ['required', 'in:en,km'],
            'target_audience' => ['required', 'in:all,customers,guests'],
            'is_active' => ['required', 'boolean'],
            'scheduled_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date'],
        ]);

        $data['created_by'] = $request->user()->id;

        return response()->json(Message::create($data), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return Message::findOrFail($id);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $message = Message::findOrFail($id);

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'content' => ['sometimes', 'string'],
            'link_url' => ['nullable', 'url', 'max:2048'],
            'media_url' => ['nullable', 'string', 'max:2048'],
            'media_type' => ['nullable', 'in:image,video'],
            'language' => ['sometimes', 'in:en,km'],
            'target_audience' => ['sometimes', 'in:all,customers,guests'],
            'is_active' => ['sometimes', 'boolean'],
            'scheduled_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date'],
        ]);

        $message->update($data);
        return $message;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $message = Message::findOrFail($id);
        $message->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function toggleActive(Message $message)
    {
        $message->is_active = !$message->is_active;
        $message->save();

        return response()->json(['is_active' => $message->is_active]);
    }

    public function uploadMedia(Request $request)
    {
        $validated = $request->validate([
            'media' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,svg,gif,mp4,webm,ogg', 'max:51200'],
        ]);

        $file = $request->file('media');
        $path = $file->store('messages', 'public');
        $url = Storage::disk('public')->url($path);
        $mime = $file->getMimeType();
        $type = str_starts_with($mime, 'video/') ? 'video' : 'image';

        return response()->json([
            'message' => 'Media uploaded',
            'media_url' => $url,
            'media_type' => $type,
        ], 200);
    }
}
