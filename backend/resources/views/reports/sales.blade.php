<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Sales Report</title>
    <style>
        body { font-family: DejaVu Sans, Arial, sans-serif; color: #111827; font-size: 12px; }
        h1 { font-size: 18px; margin: 0 0 8px 0; }
        .muted { color: #6b7280; }
        .summary { margin: 12px 0 16px 0; }
        .summary div { margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; }
        th { background: #f3f4f6; }
        tfoot td { font-weight: bold; }
    </style>
</head>
<body>
    <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
        @if (!empty($logo))
            <img src="{{ $logo }}" alt="Logo" style="height:36px;" />
        @endif
        <h1>Sales Report</h1>
    </div>
    <div class="muted">Date From: {{ $from }} | Date To: {{ $to }}</div>

    <div class="summary">
        <div><strong>Total Orders:</strong> {{ $summary['total_orders'] }}</div>
        <div><strong>Total Revenue:</strong> ${{ number_format($summary['total_revenue'], 2) }}</div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Orders</th>
                <th>Revenue</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $row)
                <tr>
                    <td>{{ $row->date }}</td>
                    <td>{{ $row->orders }}</td>
                    <td>${{ number_format((float) $row->revenue, 2) }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="3">No data</td>
                </tr>
            @endforelse
        </tbody>
        <tfoot>
            <tr>
                <td>Total</td>
                <td>{{ $summary['total_orders'] }}</td>
                <td>${{ number_format($summary['total_revenue'], 2) }}</td>
            </tr>
        </tfoot>
    </table>
</body>
</html>
