<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

abstract class BaseAdminController extends Controller
{
    protected function bool($v): bool
    {
        if (is_bool($v)) return $v;
        return in_array((string)$v, ['1','true','on','yes'], true);
    }

    protected function storeImage(Request $request, string $field, string $dir): ?string
    {
        if (!$request->hasFile($field)) return null;
        return $request->file($field)->store($dir, 'public');
    }
}
