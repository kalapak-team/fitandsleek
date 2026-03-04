<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoices</title>
    <style>
        @page {
            size: A4;
            margin: 12mm;
        }
        body {
            font-family: DejaVu Sans, sans-serif;
            color: #0f172a;
            font-size: 11px;
        }
        .invoice {
            position: relative;
            border: 1px solid #c7d6c6;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 12px;
            page-break-inside: avoid;
            overflow: hidden;
        }
        .header {
            display: table;
            width: 100%;
            margin-bottom: 10px;
        }
        .header-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            border-bottom: 1px solid #e2e8f0;
        }
        .brand-logo {
            height: 64px;
            width: auto;
            max-width: 250px;
            object-fit: contain;
            margin-bottom: 12px;
        }
        .thermal-logo {
            height: 56px;
            max-width: 220px;
        }
        .header > div {
            display: table-cell;
            vertical-align: top;
        }
        .right {
            text-align: right;
        }
        .muted {
            color: #475569;
            font-size: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
        }
        th, td {
            border: 1px solid #d6e2d5;
            padding: 6px;
            text-align: left;
            font-size: 10px;
        }
        th {
            background: #497869;
            color: #ffffff;
            font-weight: 700;
        }
        .num {
            text-align: right;
        }
        .summary {
            margin-top: 8px;
        }
        .summary p {
            margin: 2px 0;
            text-align: right;
            font-size: 11px;
        }
        .grand {
            font-weight: 700;
            font-size: 13px;
        }
        .watermark {
            position: absolute;
            top: 43%;
            left: 12%;
            transform: rotate(-30deg);
            font-size: 72px;
            font-weight: 700;
            color: rgba(15, 23, 42, 0.08);
            z-index: 0;
            letter-spacing: 4px;
        }
        .content {
            position: relative;
            z-index: 1;
        }
        .footer {
            margin-top: 10px;
            display: table;
            width: 100%;
        }
        .footer > div {
            display: table-cell;
            vertical-align: middle;
        }
        .qr {
            width: 130px;
            height: 130px;
            border: 1px solid #cbd5e1;
            padding: 4px;
            text-align: center;
        }
        .cut {
            margin-top: 10px;
            border-top: 2px dashed #94a3b8;
            text-align: center;
            color: #475569;
            font-size: 10px;
            padding-top: 4px;
        }
        .page-break {
            page-break-after: always;
        }
        .chip {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 9999px;
            font-size: 10px;
            font-weight: 700;
            border: 1px solid #b9cdb8;
            color: #2f4b3a;
            background: #eff6ef;
        }
    </style>
</head>
<body>
@foreach($invoices as $index => $invoice)
    <div class="invoice {{ ($isBulk ?? false) && $index < count($invoices) - 1 ? 'page-break' : '' }}">
        <div class="watermark">{{ $invoice['payment_status'] }}</div>
        <div class="content">
            <div class="header">
                <div class="header-card">
                    <div>
                        <img src="{{ $invoice['logo_url'] ?? asset(config('app.logo_url', '/logo.png')) }}" alt="Brand Logo" class="brand-logo {{ ($isBulk ?? false) ? 'thermal-logo' : '' }}" />
                        <h2 style="margin:0;color:#497869;font-weight:700;">Admin Invoice</h2>
                        <div class="muted">Invoice #: {{ $invoice['invoice_number'] }}</div>
                        <div class="muted">Date: {{ $invoice['invoice_date'] }}</div>
                        <div class="muted">Order #: {{ $invoice['order_number'] ?: $invoice['order_id'] }}</div>
                    </div>
                </div>
                <div class="right" style="vertical-align:middle;">
                    <span class="chip" style="margin-right:4px;">{{ $invoice['payment_status'] }}</span>
                </div>
            </div>

            <div style="margin-bottom:8px;">
                <strong>Customer:</strong> {{ $invoice['customer']['name'] }}<br>
                <strong>Phone:</strong> {{ $invoice['customer']['phone'] }}<br>
                <strong>Address:</strong> {{ $invoice['customer']['full_address'] }}
            </div>

            <table>
                <thead>
                <tr>
                    <th>Product Name</th>
                    <th>SKU</th>
                    <th class="num">Qty</th>
                    <th class="num">Price</th>
                    <th class="num">Discount</th>
                    <th class="num">Shipping Fee</th>
                    <th class="num">Grand Total</th>
                </tr>
                </thead>
                <tbody>
                @foreach($invoice['items'] as $item)
                    <tr>
                        <td>{{ $item['product_name'] }}</td>
                        <td>{{ $item['sku'] }}</td>
                        <td class="num">{{ $item['quantity'] }}</td>
                        <td class="num">${{ number_format($item['price'], 2) }}</td>
                        <td class="num">${{ number_format($item['discount'], 2) }}</td>
                        <td class="num">${{ number_format($item['shipping_fee'], 2) }}</td>
                        <td class="num">${{ number_format($item['grand_total'], 2) }}</td>
                    </tr>
                @endforeach
                </tbody>
            </table>

            <div class="summary">
                <p>Subtotal: ${{ number_format($invoice['subtotal'], 2) }}</p>
                <p>Discount: ${{ number_format($invoice['discount'], 2) }}</p>
                <p>Shipping: ${{ number_format($invoice['shipping_fee'], 2) }}</p>
                <p class="grand">Grand Total: ${{ number_format($invoice['grand_total'], 2) }}</p>
            </div>

            <div class="footer">
                <div>
                    <div class="muted">Driver Smart QR</div>
                    <div class="muted">Scan to open /driver/scan?code={{ $invoice['tracking_code'] ?? '' }}</div>
                </div>
                <div class="right">
                    @if(!empty($invoice['qr_data_uri']))
                        <img class="qr" src="{{ $invoice['qr_data_uri'] }}" alt="Driver QR" />
                    @else
                        <div class="qr">No Tracking QR</div>
                    @endif
                </div>
            </div>

            @if($isBulk ?? false)
                <div class="cut">— CUT HERE —</div>
            @endif
        </div>
    </div>
@endforeach
</body>
</html>
