<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Dashboard Report</title>
    <style>
        body { font-family: DejaVu Sans, Arial, sans-serif; color: #111827; font-size: 12px; }
        h1 { font-size: 18px; margin: 0; }
        .muted { color: #6b7280; }
        .section { margin-top: 16px; }
        .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; margin-bottom: 10px; }
        .grid { display: table; width: 100%; }
        .col { display: table-cell; width: 50%; vertical-align: top; padding-right: 8px; }
        .label { color: #6b7280; font-size: 11px; }
        .value { font-size: 16px; font-weight: bold; }
    </style>
</head>
<body>
    <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
        @if (!empty($logo))
            <img src="{{ $logo }}" alt="Logo" style="height:36px;" />
        @endif
        <h1>Dashboard Summary Report</h1>
    </div>
    <div class="muted">Date From: {{ $from }} | Date To: {{ $to }}</div>

    <div class="section">
        <div class="grid">
            <div class="col">
                <div class="card">
                    <div class="label">Revenue in range</div>
                    <div class="value">${{ number_format($revenue['total'], 2) }}</div>
                </div>
                <div class="card">
                    <div class="label">Total Orders</div>
                    <div class="value">{{ $orders['total'] }}</div>
                    <div class="label">{{ $orders['pending'] }} pending</div>
                </div>
            </div>
            <div class="col">
                <div class="card">
                    <div class="label">Products</div>
                    <div class="value">{{ $products['total'] }}</div>
                    <div class="label">{{ $products['active'] }} active, {{ $products['low_stock'] }} low stock</div>
                </div>
                <div class="card">
                    <div class="label">Customers</div>
                    <div class="value">{{ $customers['total'] }}</div>
                    <div class="label">{{ $customers['new_this_month'] }} new this month</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
