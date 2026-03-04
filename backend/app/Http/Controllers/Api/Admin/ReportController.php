<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ShipmentTrackingEvent;
use App\Models\User;
use App\Models\Category;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    private function resolveLogoDataUri(): ?string
    {
        $setting = Setting::where('key', 'header')->where('group', 'homepage')->first();
        $value = $setting?->value;
        $logoUrl = is_array($value) ? ($value['logo_url'] ?? null) : null;

        if (!$logoUrl) return null;

        $content = null;
        $ext = 'png';

        if (str_starts_with($logoUrl, 'http')) {
            $content = @file_get_contents($logoUrl);
            $ext = pathinfo(parse_url($logoUrl, PHP_URL_PATH) ?? '', PATHINFO_EXTENSION) ?: 'png';
        } else {
            $path = $logoUrl;
            if (str_starts_with($path, '/')) {
                $path = public_path($path);
            } else {
                $path = public_path('/' . ltrim($path, '/'));
            }
            if (is_file($path)) {
                $content = @file_get_contents($path);
                $ext = pathinfo($path, PATHINFO_EXTENSION) ?: 'png';
            }
        }

        if (!$content) return null;

        $ext = strtolower($ext);
        if ($ext === 'svg') {
            return null;
        }

        $mime = match ($ext) {
            'jpg', 'jpeg' => 'image/jpeg',
            'webp' => 'image/webp',
            default => 'image/png',
        };

        return 'data:' . $mime . ';base64,' . base64_encode($content);
    }

    private function buildDashboardReport(Carbon $from, Carbon $to): array
    {
        $today = now()->startOfDay();
        $thisMonth = now()->startOfMonth();

        $fromRange = $from->copy()->startOfDay();
        $toRange = $to->copy()->endOfDay();

        $totalRevenue = Order::whereBetween('created_at', [$fromRange, $toRange])
            ->where('status', '!=', 'cancelled')
            ->sum('total');
        $monthRevenue = Order::where('created_at', '>=', $thisMonth)
            ->where('status', '!=', 'cancelled')
            ->sum('total');
        $todayRevenue = Order::where('created_at', '>=', $today)
            ->where('status', '!=', 'cancelled')
            ->sum('total');

        $ordersInRange = Order::whereBetween('created_at', [$fromRange, $toRange]);
        $totalOrders = (clone $ordersInRange)->count();
        $pendingOrders = (clone $ordersInRange)->where('status', 'pending')->count();
        $processingOrders = (clone $ordersInRange)->where('status', 'processing')->count();
        $completedOrders = (clone $ordersInRange)->where('status', 'completed')->count();

        $totalProducts = Product::count();
        $activeProducts = Product::where('is_active', true)->count();
        $lowStockProducts = Product::where('stock', '<', 10)->count();

        $totalCustomers = User::where('role', 'customer')->count();
        $newCustomersThisMonth = User::where('role', 'customer')
            ->whereBetween('created_at', [$fromRange, $toRange])
            ->count();

        return [
            'type' => 'dashboard',
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'revenue' => [
                'total' => round($totalRevenue, 2),
                'month' => round($monthRevenue, 2),
                'today' => round($todayRevenue, 2),
            ],
            'orders' => [
                'total' => $totalOrders,
                'pending' => $pendingOrders,
                'processing' => $processingOrders,
                'completed' => $completedOrders,
            ],
            'products' => [
                'total' => $totalProducts,
                'active' => $activeProducts,
                'low_stock' => $lowStockProducts,
            ],
            'customers' => [
                'total' => $totalCustomers,
                'new_this_month' => $newCustomersThisMonth,
            ],
        ];
    }
    private function buildSalesReport(Carbon $from, Carbon $to): array
    {
        $sales = Order::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as orders'),
            DB::raw('SUM(total) as revenue')
        )
            ->whereBetween('created_at', [$from->copy()->startOfDay(), $to->copy()->endOfDay()])
            ->where('status', '!=', 'cancelled')
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get();

        $totalOrders = (int) $sales->sum('orders');
        $totalRevenue = (float) $sales->sum('revenue');

        return [
            'type' => 'sales',
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'summary' => [
                'total_orders' => $totalOrders,
                'total_revenue' => round($totalRevenue, 2),
            ],
            'rows' => $sales,
        ];
    }

    public function generate(Request $request)
    {
        $validated = $request->validate([
            'type' => ['required', 'in:sales,dashboard'],
            'from' => ['required', 'date'],
            'to' => ['required', 'date'],
        ]);

        $from = Carbon::parse($validated['from']);
        $to = Carbon::parse($validated['to']);

        if ($from->gt($to)) {
            return response()->json(['message' => 'Date From must be before Date To.'], 422);
        }

        if ($validated['type'] === 'sales') {
            return response()->json([
                'data' => $this->buildSalesReport($from, $to),
            ]);
        }

        if ($validated['type'] === 'dashboard') {
            return response()->json([
                'data' => $this->buildDashboardReport($from, $to),
            ]);
        }

        return response()->json(['message' => 'Invalid report type'], 422);
    }

    public function downloadPdf(Request $request)
    {
        $validated = $request->validate([
            'type' => ['required', 'in:sales,dashboard'],
            'from' => ['required', 'date'],
            'to' => ['required', 'date'],
        ]);

        $from = Carbon::parse($validated['from']);
        $to = Carbon::parse($validated['to']);

        if ($from->gt($to)) {
            return response()->json(['message' => 'Date From must be before Date To.'], 422);
        }

        try {
            $logoDataUri = $this->resolveLogoDataUri();

            if ($validated['type'] === 'dashboard') {
                $data = $this->buildDashboardReport($from, $to);
                $data['logo'] = $logoDataUri;
                $pdf = Pdf::loadView('reports.dashboard', $data)->setPaper('A4', 'portrait');
                $filename = 'dashboard-report-' . $from->format('Ymd') . '-to-' . $to->format('Ymd') . '.pdf';
                $content = $pdf->output();
                return response($content, 200, [
                    'Content-Type' => 'application/pdf',
                    'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                ]);
            }

            $data = $this->buildSalesReport($from, $to);
            $data['logo'] = $logoDataUri;

            $pdf = Pdf::loadView('reports.sales', $data)->setPaper('A4', 'portrait');
            $filename = 'sales-report-' . $from->format('Ymd') . '-to-' . $to->format('Ymd') . '.pdf';
            $content = $pdf->output();
            return response($content, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ]);
        } catch (\Throwable $e) {
            Log::error('Report PDF download failed', [
                'type' => $validated['type'],
                'from' => $validated['from'],
                'to' => $validated['to'],
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to generate PDF. Please try again.',
            ], 500);
        }
    }
    // Dashboard overview
    public function dashboard()
    {
        $today = now()->startOfDay();
        $thisMonth = now()->startOfMonth();

        // Revenue stats
        $totalRevenue = Order::where('status', '!=', 'cancelled')->sum('total');
        $monthRevenue = Order::where('created_at', '>=', $thisMonth)
            ->where('status', '!=', 'cancelled')
            ->sum('total');
        $todayRevenue = Order::where('created_at', '>=', $today)
            ->where('status', '!=', 'cancelled')
            ->sum('total');

        // Order stats
        $totalOrders = Order::count();
        $pendingOrders = Order::where('status', 'pending')->count();
        $processingOrders = Order::where('status', 'processing')->count();
        $completedOrders = Order::where('status', 'completed')->count();

        // Product stats
        $totalProducts = Product::count();
        $activeProducts = Product::where('is_active', true)->count();
        $lowStockProducts = Product::where('stock', '<', 10)->count();

        // Customer stats
        $totalCustomers = User::where('role', 'customer')->count();
        $newCustomersThisMonth = User::where('role', 'customer')
            ->where('created_at', '>=', $thisMonth)
            ->count();

        return response()->json([
            'revenue' => [
                'total' => round($totalRevenue, 2),
                'month' => round($monthRevenue, 2),
                'today' => round($todayRevenue, 2),
            ],
            'orders' => [
                'total' => $totalOrders,
                'pending' => $pendingOrders,
                'processing' => $processingOrders,
                'completed' => $completedOrders,
            ],
            'products' => [
                'total' => $totalProducts,
                'active' => $activeProducts,
                'low_stock' => $lowStockProducts,
            ],
            'customers' => [
                'total' => $totalCustomers,
                'new_this_month' => $newCustomersThisMonth,
            ],
        ]);
    }

    // Sales report
    public function sales(Request $request)
    {
        $period = $request->input('period', '30'); // days

        $startDate = now()->subDays((int) $period)->startOfDay();

        $sales = Order::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as orders'),
            DB::raw('SUM(total) as revenue')
        )
            ->where('created_at', '>=', $startDate)
            ->where('status', '!=', 'cancelled')
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get();

        return response()->json([
            'period' => $period,
            'sales' => $sales,
        ]);
    }

    public function monthlyDriverPerformance(Request $request)
    {
        $range = $request->input('range', 'month');
        if (! in_array($range, ['today', 'week', 'month', 'year'], true)) {
            return response()->json(['message' => 'Invalid range. Use today, week, month, or year.'], 422);
        }

        $now = now();

        if ($range === 'today') {
            $start = $now->copy()->startOfDay();
            $end = $now->copy()->endOfDay();
        } elseif ($range === 'week') {
            $start = $now->copy()->startOfWeek();
            $end = $now->copy()->endOfWeek();
        } elseif ($range === 'month') {
            $start = $now->copy()->startOfMonth();
            $end = $now->copy()->endOfMonth();
        } else {
            $start = $now->copy()->startOfYear();
            $end = $now->copy()->endOfYear();
        }

        $events = ShipmentTrackingEvent::query()
            ->with('updatedBy:id,name')
            ->where('status', 'delivered')
            ->whereNotNull('updated_by')
            ->whereBetween('event_time', [$start, $end])
            ->get();

        $buckets = [];

        foreach ($events as $event) {
            if (! $event->event_time) {
                continue;
            }

            if ($range === 'today') {
                $bucketKey = $event->event_time->format('Y-m-d H');
                $bucketLabel = $event->event_time->format('H:00');
            } elseif ($range === 'week') {
                $bucketKey = $event->event_time->toDateString();
                $bucketLabel = $event->event_time->format('D');
            } elseif ($range === 'month') {
                $weekStart = $event->event_time->copy()->startOfWeek();
                $bucketKey = $weekStart->toDateString();
                $bucketLabel = $weekStart->format('M d');
            } else {
                $bucketKey = $event->event_time->format('Y-m');
                $bucketLabel = $event->event_time->format('M');
            }

            $driverId = (int) $event->updated_by;

            if (! isset($buckets[$bucketKey])) {
                $buckets[$bucketKey] = [
                    'label' => $bucketLabel,
                    'counts' => [],
                    'names' => [],
                ];
            }

            $buckets[$bucketKey]['counts'][$driverId] = ($buckets[$bucketKey]['counts'][$driverId] ?? 0) + 1;

            if (! empty($event->updatedBy?->name)) {
                $buckets[$bucketKey]['names'][$driverId] = $event->updatedBy->name;
            }
        }

        $rows = [];
        if ($range === 'today') {
            $cursor = $start->copy();
            while ($cursor->lte($end)) {
                $bucketKey = $cursor->format('Y-m-d H');
                $bucketLabel = $cursor->format('H:00');

                $counts = $buckets[$bucketKey]['counts'] ?? [];
                $names = $buckets[$bucketKey]['names'] ?? [];

                if (! empty($counts)) {
                    arsort($counts);
                    $topDriverId = (int) array_key_first($counts);
                    $topCount = (int) ($counts[$topDriverId] ?? 0);
                    $topDriverName = $names[$topDriverId] ?? 'Unknown Driver';
                } else {
                    $topDriverId = null;
                    $topCount = 0;
                    $topDriverName = null;
                }

                $rows[] = [
                    'bucket' => $bucketKey,
                    'bucket_label' => $bucketLabel,
                    'month' => $bucketKey,
                    'month_label' => $bucketLabel,
                    'top_driver_id' => $topDriverId,
                    'top_driver_name' => $topDriverName,
                    'successful_deliveries' => $topCount,
                ];

                $cursor->addHour();
            }
        } elseif ($range === 'week') {
            $cursor = $start->copy();
            while ($cursor->lte($end)) {
                $bucketKey = $cursor->toDateString();
                $bucketLabel = $cursor->format('D');

                $counts = $buckets[$bucketKey]['counts'] ?? [];
                $names = $buckets[$bucketKey]['names'] ?? [];

                if (! empty($counts)) {
                    arsort($counts);
                    $topDriverId = (int) array_key_first($counts);
                    $topCount = (int) ($counts[$topDriverId] ?? 0);
                    $topDriverName = $names[$topDriverId] ?? 'Unknown Driver';
                } else {
                    $topDriverId = null;
                    $topCount = 0;
                    $topDriverName = null;
                }

                $rows[] = [
                    'bucket' => $bucketKey,
                    'bucket_label' => $bucketLabel,
                    'month' => $bucketKey,
                    'month_label' => $bucketLabel,
                    'top_driver_id' => $topDriverId,
                    'top_driver_name' => $topDriverName,
                    'successful_deliveries' => $topCount,
                ];

                $cursor->addDay();
            }
        } elseif ($range === 'month') {
            $cursor = $start->copy()->startOfWeek();
            $endCursor = $end->copy()->endOfWeek();
            while ($cursor->lte($endCursor)) {
                $bucketKey = $cursor->toDateString();
                $bucketLabel = $cursor->format('M d');

                $counts = $buckets[$bucketKey]['counts'] ?? [];
                $names = $buckets[$bucketKey]['names'] ?? [];

                if (! empty($counts)) {
                    arsort($counts);
                    $topDriverId = (int) array_key_first($counts);
                    $topCount = (int) ($counts[$topDriverId] ?? 0);
                    $topDriverName = $names[$topDriverId] ?? 'Unknown Driver';
                } else {
                    $topDriverId = null;
                    $topCount = 0;
                    $topDriverName = null;
                }

                $rows[] = [
                    'bucket' => $bucketKey,
                    'bucket_label' => $bucketLabel,
                    'month' => $bucketKey,
                    'month_label' => $bucketLabel,
                    'top_driver_id' => $topDriverId,
                    'top_driver_name' => $topDriverName,
                    'successful_deliveries' => $topCount,
                ];

                $cursor->addWeek();
            }
        } else {
            $cursor = $start->copy();
            while ($cursor->lte($end)) {
                $bucketKey = $cursor->format('Y-m');
                $bucketLabel = $cursor->format('M');

                $counts = $buckets[$bucketKey]['counts'] ?? [];
                $names = $buckets[$bucketKey]['names'] ?? [];

                if (! empty($counts)) {
                    arsort($counts);
                    $topDriverId = (int) array_key_first($counts);
                    $topCount = (int) ($counts[$topDriverId] ?? 0);
                    $topDriverName = $names[$topDriverId] ?? 'Unknown Driver';
                } else {
                    $topDriverId = null;
                    $topCount = 0;
                    $topDriverName = null;
                }

                $rows[] = [
                    'bucket' => $bucketKey,
                    'bucket_label' => $bucketLabel,
                    'month' => $bucketKey,
                    'month_label' => $bucketLabel,
                    'top_driver_id' => $topDriverId,
                    'top_driver_name' => $topDriverName,
                    'successful_deliveries' => $topCount,
                ];

                $cursor->addMonth();
            }
        }

        return response()->json([
            'range' => $range,
            'from' => $start->toDateString(),
            'to' => $end->toDateString(),
            'data' => $rows,
        ]);
    }

    // Top products
    public function topProducts(Request $request)
    {
        $limit = $request->input('limit', 10);

        $topProducts = OrderItem::select(
            'product_id',
            DB::raw('SUM(qty) as total_sold'),
            DB::raw('SUM(line_total) as total_revenue')
        )
            ->with('product:id,name,image_url,price')
            ->groupBy('product_id')
            ->orderByDesc('total_sold')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->product_id,
                    'name' => $item->product->name ?? 'Unknown',
                    'image_url' => $item->product->image_url,
                    'price' => $item->product->price ?? 0,
                    'total_sold' => (int)$item->total_sold,
                    'total_revenue' => (float)$item->total_revenue,
                ];
            });

        return response()->json([
            'data' => $topProducts,
        ]);
    }

    // Category performance
    public function categoryPerformance()
    {
        $categories = Category::withCount(['products as products_count' => function ($query) {
                $query->where('is_active', true);
            }])
            ->withSum(['products' => function ($query) {
                $query->where('is_active', true);
            }], 'stock')
            ->get();

        return response()->json($categories);
    }

    // Recent orders
    public function recentOrders(Request $request)
    {
        $limit = $request->input('limit', 20);

        $orders = Order::with('user:id,name,email')
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'user_name' => $order->user->name ?? 'Unknown',
                    'user_email' => $order->user->email ?? '',
                    'total' => (float)$order->total,
                    'status' => $order->status,
                    'created_at' => $order->created_at->format('Y-m-d H:i'),
                ];
            });

        return response()->json([
            'data' => $orders,
        ]);
    }
}

