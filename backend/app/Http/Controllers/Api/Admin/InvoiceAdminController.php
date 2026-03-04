<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\InvoiceService;
use Barryvdh\DomPDF\Facade\Pdf;
use Endroid\QrCode\Color\Color;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class InvoiceAdminController extends Controller
{
    public function show(Order $order, InvoiceService $invoiceService)
    {
        $invoice = $invoiceService->buildOrderInvoiceData($order);

        return response()->json([
            'message' => 'Invoice retrieved successfully',
            'data' => $invoice,
        ]);
    }

    public function downloadPdf(Order $order, InvoiceService $invoiceService)
    {
        $invoice = $invoiceService->buildOrderInvoiceData($order);
        $invoice['qr_data_uri'] = $this->buildQrDataUri($invoice['qr_payload'] ?? $invoice['driver_scan_url']);
        $invoice['logo_url'] = $this->resolveBrandLogoUrl();

        $pdf = Pdf::loadView('invoices.bulk', [
            'invoices' => [$invoice],
            'isBulk' => false,
        ])
            ->setOption('isRemoteEnabled', true)
            ->setHttpContext(stream_context_create([
                'ssl' => [
                    'verify_peer' => true,
                    'verify_peer_name' => true,
                    'allow_self_signed' => false,
                ],
            ]))
            ->setPaper('A4', 'portrait');

        $filename = 'invoice-' . ($invoice['order_number'] ?: $order->id) . '.pdf';
        $content = $pdf->output();

        return response($content, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    public function bulkDownloadPdf(Request $request, InvoiceService $invoiceService)
    {
        $validated = $request->validate([
            'order_ids' => ['required', 'array', 'min:1'],
            'order_ids.*' => ['integer', 'exists:orders,id'],
        ]);

        $orderIds = collect($validated['order_ids'])
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $orders = Order::with(['user', 'items.product', 'shipment'])
            ->whereIn('id', $orderIds)
            ->orderByDesc('id')
            ->get();

        $invoices = $orders->map(function (Order $order) use ($invoiceService) {
            $invoice = $invoiceService->buildOrderInvoiceData($order);
            $invoice['qr_data_uri'] = $this->buildQrDataUri($invoice['qr_payload'] ?? $invoice['driver_scan_url']);
            $invoice['logo_url'] = $this->resolveBrandLogoUrl();
            return $invoice;
        })->values()->all();

        $pdf = Pdf::loadView('invoices.bulk', [
            'invoices' => $invoices,
            'isBulk' => true,
        ])
            ->setOption('isRemoteEnabled', true)
            ->setHttpContext(stream_context_create([
                'ssl' => [
                    'verify_peer' => true,
                    'verify_peer_name' => true,
                    'allow_self_signed' => false,
                ],
            ]))
            ->setPaper('A4', 'portrait');

        $filename = 'invoices-bulk-' . now()->format('Ymd_His') . '.pdf';
        $content = $pdf->output();

        return response($content, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    private function buildQrDataUri(?string $url): ?string
    {
        if (empty($url)) {
            return null;
        }

        $writer = new PngWriter();
        $qrCode = QrCode::create($url)
            ->setEncoding(new Encoding('UTF-8'))
            ->setSize(260)
            ->setMargin(10)
            ->setForegroundColor(new Color(0, 0, 0))
            ->setBackgroundColor(new Color(255, 255, 255));

        $result = $writer->write($qrCode);

        return 'data:' . $result->getMimeType() . ';base64,' . base64_encode($result->getString());
    }

    private function resolveBrandLogoUrl(): string
    {
        $logoUrl = (string) config('app.logo_url', '/logo.png');

        if (!Str::startsWith($logoUrl, ['http://', 'https://'])) {
            return $this->logoDataUriFromPath($logoUrl) ?? asset($logoUrl);
        }

        $appHost = parse_url(config('app.url', ''), PHP_URL_HOST);
        $logoHost = parse_url($logoUrl, PHP_URL_HOST);
        $logoPath = (string) parse_url($logoUrl, PHP_URL_PATH);

        if (!empty($appHost) && !empty($logoHost) && strcasecmp($appHost, $logoHost) === 0) {
            return $this->logoDataUriFromPath($logoPath) ?? $logoUrl;
        }

        return $logoUrl;
    }

    private function logoDataUriFromPath(string $path): ?string
    {
        $relativePath = ltrim($path, '/');

        if ($relativePath === '') {
            return null;
        }

        $fullPath = public_path($relativePath);

        if (!is_file($fullPath) || !is_readable($fullPath)) {
            return null;
        }

        $mimeType = mime_content_type($fullPath) ?: 'image/png';
        $contents = file_get_contents($fullPath);

        if ($contents === false) {
            return null;
        }

        return 'data:' . $mimeType . ';base64,' . base64_encode($contents);
    }
}
