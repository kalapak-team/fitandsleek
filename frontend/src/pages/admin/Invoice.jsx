import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import api from "../../lib/api";
import { useHomepageSettings } from "../../state/homepageSettings";
import { resolveImageUrl } from "../../lib/images";
import { AdminPageLoader } from "@/components/admin/AdminLoading";

function money(value) {
    return `$${Number(value || 0).toFixed(2)}`;
}

export default function AdminInvoicePage() {
    const { orderId } = useParams();
    const { settings } = useHomepageSettings();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [paperSize, setPaperSize] = useState("a4");

    const downloadPdf = async () => {
        try {
            const res = await api.get(`/admin/orders/${orderId}/invoice/pdf`, { responseType: "blob" });
            const blob = new Blob([res.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `invoice-${orderId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            setError("Failed to download invoice PDF.");
        }
    };

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError("");
            try {
                const { data } = await api.get(`/admin/orders/${orderId}/invoice`);
                setInvoice(data?.data || null);
            } catch (err) {
                setError(err?.response?.data?.message || "Failed to load invoice.");
            } finally {
                setLoading(false);
            }
        })();
    }, [orderId]);

    const isPaid = useMemo(() => invoice?.payment_status === "PAID", [invoice]);
    const logoUrl = settings?.app_logo_url || settings?.header?.logo_url || "/logo.png";
    const fallbackLogoUrl = resolveImageUrl("/logo.png");

    if (loading) return <AdminPageLoader />;

    if (error || !invoice) {
        return (
            <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-8">
                <div className="mx-auto max-w-3xl rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/30 p-6 text-rose-700 dark:text-rose-100">{error || "Invoice not found."}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-4 md:p-8 print:bg-white print:p-0">
            <div className="mx-auto mb-4 flex max-w-5xl flex-wrap items-center justify-between gap-3 print:hidden">
                <Link to="/admin/orders" className="text-sm font-semibold text-slate-700 dark:text-slate-200 underline">Back to Orders</Link>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-600 dark:text-slate-300">Paper</label>
                    <select
                        value={paperSize}
                        onChange={(e) => setPaperSize(e.target.value)}
                        className="h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-800 dark:text-slate-100"
                    >
                        <option value="a4">A4</option>
                        <option value="thermal">4x6 Thermal</option>
                    </select>
                    <button onClick={() => window.print()} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Print</button>
                    <button onClick={downloadPdf} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Download PDF</button>
                </div>
            </div>

            <div className={`invoice-sheet mx-auto ${paperSize === "thermal" ? "max-w-[4.1in]" : "max-w-5xl"} rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 md:p-8 print:max-w-none print:rounded-none print:border-0 print:p-4`}>
                <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-28deg] select-none text-[90px] font-black tracking-[0.25em] text-slate-900/5 dark:text-slate-100/5 print:text-slate-900/10">
                    {invoice.payment_status}
                </div>

                <div className="relative z-10">
                    <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-[#f8fafc] dark:bg-slate-800/60 p-5">
                        <div className="min-w-0">
                            {logoUrl ? <img src={resolveImageUrl(logoUrl)} alt="Brand logo" className={`mb-3 object-contain ${paperSize === "thermal" ? "h-16 max-w-[250px]" : "h-20 max-w-[250px]"}`} onError={(e) => { e.currentTarget.src = fallbackLogoUrl; }} /> : null}
                            <h1 className="text-2xl font-black text-[#4fa88a] dark:text-[#7ce0bc]">Admin Invoice</h1>
                            <p className="text-sm text-slate-600 dark:text-slate-300">Invoice #: {invoice.invoice_number}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">Date: {invoice.invoice_date}</p>
                        </div>
                        <span className={`rounded-full border px-4 py-1 text-sm font-bold ${isPaid ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200" : "border-rose-400 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-200"}`}>
                            {invoice.payment_status}
                        </span>
                    </div>

                    <div className="mb-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3 text-sm text-slate-800 dark:text-slate-200">
                        <p><span className="font-semibold">Customer:</span> {invoice.customer?.name}</p>
                        <p><span className="font-semibold">Phone:</span> {invoice.customer?.phone || "-"}</p>
                        <p><span className="font-semibold">Address:</span> {invoice.customer?.full_address || "-"}</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-xs md:text-sm">
                            <thead>
                                <tr className="bg-[#497869] text-white">
                                    <th className="border border-[#497869] px-2 py-2 text-left">Product Name</th>
                                    <th className="border border-[#497869] px-2 py-2 text-left">SKU</th>
                                    <th className="border border-[#497869] px-2 py-2 text-right">Quantity</th>
                                    <th className="border border-[#497869] px-2 py-2 text-right">Price</th>
                                    <th className="border border-[#497869] px-2 py-2 text-right">Discount</th>
                                    <th className="border border-[#497869] px-2 py-2 text-right">Shipping Fee</th>
                                    <th className="border border-[#497869] px-2 py-2 text-right">Grand Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(invoice.items || []).map((item, idx) => (
                                    <tr key={`${item.sku}-${idx}`}>
                                        <td className="border border-emerald-100 px-2 py-2">{item.product_name}</td>
                                        <td className="border border-emerald-100 px-2 py-2">{item.sku}</td>
                                        <td className="border border-emerald-100 px-2 py-2 text-right">{item.quantity}</td>
                                        <td className="border border-emerald-100 px-2 py-2 text-right">{money(item.price)}</td>
                                        <td className="border border-emerald-100 px-2 py-2 text-right">{money(item.discount)}</td>
                                        <td className="border border-emerald-100 px-2 py-2 text-right">{money(item.shipping_fee)}</td>
                                        <td className="border border-emerald-100 px-2 py-2 text-right font-semibold">{money(item.grand_total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-4 space-y-1 text-right text-sm text-slate-800 dark:text-slate-200">
                        <p>Subtotal: <span className="font-semibold">{money(invoice.subtotal)}</span></p>
                        <p>Discount: <span className="font-semibold">{money(invoice.discount)}</span></p>
                        <p>Shipping Fee: <span className="font-semibold">{money(invoice.shipping_fee)}</span></p>
                        <p className="text-lg font-black text-slate-900 dark:text-white">Grand Total: {money(invoice.grand_total)}</p>
                    </div>

                    <div className="mt-6 flex items-end justify-between gap-4 border-t border-slate-300 dark:border-slate-700 pt-4">
                        <div>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Driver Smart QR</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Scan to open driver shipment details</p>
                        </div>
                        <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2">
                            {(invoice.qr_payload || invoice.driver_scan_url) ? (
                                <QRCodeSVG value={invoice.qr_payload || invoice.driver_scan_url} size={paperSize === "thermal" ? 130 : 160} level="H" includeMargin />
                            ) : (
                                <div className="w-[130px] text-center text-xs text-slate-500 dark:text-slate-400">No tracking code</div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 border-t-2 border-dashed border-slate-400 dark:border-slate-600 pt-2 text-center text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                        — CUT HERE —
                    </div>
                </div>
            </div>

            <style>{`
        .invoice-sheet { position: relative; }
        @media print {
          @page { size: A4; margin: 10mm; }
          .invoice-sheet { width: 100%; }
          .invoice-sheet.max-w-\[4\.1in\] { width: 4in !important; margin: 0 auto; }
        }
      `}</style>
        </div>
    );
}
