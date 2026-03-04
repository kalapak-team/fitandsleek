<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    /**
     * Get all contacts with pagination and filtering
     */
    public function index(Request $request)
    {
        $query = Contact::query();
        
        // Filter by status
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }
        
        // Search by name, email, or subject
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('subject', 'like', "%{$search}%");
            });
        }
        
        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);
        
        // Paginate
        $perPage = $request->get('per_page', 15);
        $contacts = $query->paginate($perPage);
        
        // Stats
        $stats = [
            'total' => Contact::count(),
            'new' => Contact::where('status', 'new')->count(),
            'read' => Contact::where('status', 'read')->count(),
            'replied' => Contact::where('status', 'replied')->count(),
            'closed' => Contact::where('status', 'closed')->count(),
        ];
        
        return response()->json([
            'contacts' => $contacts->items(),
            'pagination' => [
                'current_page' => $contacts->currentPage(),
                'last_page' => $contacts->lastPage(),
                'per_page' => $contacts->perPage(),
                'total' => $contacts->total(),
            ],
            'stats' => $stats,
        ]);
    }
    
    /**
     * Get a single contact
     */
    public function show(Contact $contact)
    {
        // Mark as read if new
        if ($contact->status === 'new') {
            $contact->update(['status' => 'read']);
        }
        
        return response()->json(['contact' => $contact]);
    }
    
    /**
     * Update contact status
     */
    public function update(Request $request, Contact $contact)
    {
        $validated = $request->validate([
            'status' => 'sometimes|in:new,read,replied,closed',
            'admin_note' => 'nullable|string',
        ]);
        
        $contact->update($validated);
        
        return response()->json([
            'success' => true,
            'contact' => $contact,
            'message' => 'Contact updated successfully',
        ]);
    }
    
    /**
     * Store a newly created contact message (public endpoint)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        $contact = Contact::create([
            ...$validated,
            'status' => 'new',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Your message has been sent successfully!',
            'contact' => $contact,
        ], 201);
    }
    
    /**
     * Delete contact
     */
    public function destroy(Contact $contact)
    {
        $contact->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Contact deleted successfully',
        ]);
    }
    
    /**
     * Bulk update status
     */
    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'status' => 'required|in:new,read,replied,closed',
        ]);
        
        Contact::whereIn('id', $validated['ids'])->update([
            'status' => $validated['status'],
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Contacts updated successfully',
        ]);
    }
    
    /**
     * Delete multiple contacts
     */
    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
        ]);
        
        Contact::whereIn('id', $validated['ids'])->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Contacts deleted successfully',
        ]);
    }
}

