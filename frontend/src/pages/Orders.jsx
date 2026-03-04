import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { resolveImageUrl } from "../lib/images";
import { useLanguage } from "../lib/i18n.jsx";
import { useCart } from "../state/cart.jsx";
import { ShoppingCart } from "lucide-react";
import Swal, { closeSwal, errorAlert, loadingAlert, toastSuccess } from "../lib/swal";

function Money({ value }) {
  const n = Number(value || 0);
  return <span>${n.toFixed(2)}</span>;
}

export default function Orders() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [reordering, setReordering] = useState(null);
  const { t } = useLanguage();
  const { add: addItem } = useCart();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/orders");
        setRows(data?.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const requestReplacement = async (orderId) => {
    const reasonPrompt = await Swal.fire({
      icon: "question",
      title: "សរសេរមូលហេតុស្នើប្តូរ (Enter replacement reason)",
      input: "text",
      inputPlaceholder: t('replacementReasonPrompt') || "Why do you need a replacement?",
      showCancelButton: true,
      confirmButtonColor: "#497869",
      confirmButtonText: "បញ្ជាក់ (Confirm)",
      cancelButtonText: "បោះបង់ (Cancel)",
    });
    if (!reasonPrompt.isConfirmed || !reasonPrompt.value?.trim()) return;

    const notesPrompt = await Swal.fire({
      icon: "question",
      title: "ព័ត៌មានបន្ថែម (Additional notes)",
      input: "text",
      inputPlaceholder: t('replacementNotesPrompt') || "Any extra details? (optional)",
      showCancelButton: true,
      confirmButtonColor: "#497869",
      confirmButtonText: "បញ្ជាក់ (Confirm)",
      cancelButtonText: "រំលង (Skip)",
    });

    const reason = reasonPrompt.value.trim();
    const notes = notesPrompt.isConfirmed ? notesPrompt.value || "" : "";
    setSubmitting(true);
    loadingAlert({
      khTitle: "កំពុងផ្ញើសំណើ",
      enTitle: "Submitting request",
      khText: "សូមរង់ចាំបន្តិច",
      enText: "Please wait",
    });
    try {
      await api.post("/replacement-cases", {
        order_id: orderId,
        reason,
        notes: notes || null,
      });
      closeSwal();
      await toastSuccess({
        khTitle: "ជោគជ័យ",
        enTitle: "Success",
        khText: "សំណើប្តូរទំនិញត្រូវបានផ្ញើរួចរាល់",
        enText: t('replacementSubmitted') || "Replacement request submitted.",
      });
    } catch (e) {
      closeSwal();
      await errorAlert({
        khTitle: "ការផ្ញើសំណើបរាជ័យ",
        enTitle: "Request failed",
        detail: e?.response?.data?.message || "Failed to submit replacement request",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const orderAgain = async (order) => {
    const items = order.items || [];
    if (items.length === 0) {
      await errorAlert({
        khTitle: "មិនមានទំនិញ",
        enTitle: "No items",
        khText: "ការបញ្ជាទិញនេះមិនមានទំនិញសម្រាប់បញ្ជាទិញម្តងទៀត",
        enText: t('orderHasNoItems') || "This order has no items to reorder",
      });
      return;
    }

    setReordering(order.id);
    loadingAlert({
      khTitle: "កំពុងបន្ថែមទៅកន្ត្រក",
      enTitle: "Adding to cart",
    });
    try {
      let addedCount = 0;
      const failedItems = [];

      for (const item of items) {
        if (item.product?.id) {
          try {
            await addItem(item.product.id, item.quantity || 1);
            addedCount++;
          } catch (e) {
            console.error(`Failed to add ${item.product.name}:`, e);
            failedItems.push(item.product.name || "Unknown item");
          }
        }
      }

      if (addedCount > 0) {
        if (failedItems.length > 0) {
          closeSwal();
          await toastSuccess({
            khText: `បានបន្ថែម ${addedCount} មុខទំនិញ ទំនិញខ្លះអស់ពីស្តុក`,
            enText: t('someItemsAddedToCart') || `${addedCount} item(s) added to cart. ${failedItems.length} item(s) are no longer available.`,
          });
        } else {
          closeSwal();
          await toastSuccess({
            khText: `បានបន្ថែមទំនិញទាំងអស់ ${addedCount} មុខដោយជោគជ័យ`,
            enText: t('allItemsAddedToCart') || `All ${addedCount} item(s) added to cart successfully!`,
          });
        }
      } else {
        closeSwal();
        await errorAlert({
          khTitle: "មិនអាចបន្ថែមទំនិញ",
          enTitle: "Items unavailable",
          khText: "ទំនិញខាងលើមិនអាចរកបានទៀតទេ",
          enText: t('itemsNotAvailable') || "These items are no longer available. Click on items above to see current products.",
        });
      }
    } catch (e) {
      closeSwal();
      await errorAlert({
        khTitle: "បន្ថែមកន្ត្រកបរាជ័យ",
        enTitle: "Add to cart failed",
        detail: t('orderAgainFailed') || "Failed to add items to cart",
      });
    } finally {
      closeSwal();
      setReordering(null);
    }
  };

  return (
    <div className="container-safe py-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{t('myOrders')}</h1>
          <p className="mt-1 text-sm text-zinc-600">{t('ordersLoadedFrom')} <code className="font-mono">GET /api/orders</code>.</p>
        </div>
        <Link to="/search" className="text-sm font-semibold text-zinc-700 hover:underline">
          {t('shopMore')}
        </Link>
      </div>

      <div className="mt-6 grid gap-4">
        {loading ? (
          <div className="fs-card p-8 text-sm text-zinc-600">{t('loading')}</div>
        ) : rows.length === 0 ? (
          <div className="fs-card p-10 text-center text-sm text-zinc-600">{t('noOrders')}</div>
        ) : (
          rows.map((o) => (
            <div key={o.id} className="fs-card p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="text-sm font-black">{t('orderNumber')} {o.id}</div>
                <div className="text-xs text-zinc-600">
                  {t('status')}: <span className="font-semibold text-zinc-900">{o.status}</span>
                </div>
              </div>

              <div className="mt-3 text-sm text-zinc-700">
                {t('total')}: <span className="font-black text-zinc-900"><Money value={o.total} /></span>
              </div>

              <div className="mt-4 grid gap-3">
                {(o.items || []).map((it) => (
                  <Link
                    key={it.id}
                    to={it.product?.slug ? `/p/${it.product.slug}` : '#'}
                    state={{ fromOrder: true, orderItem: it }}
                    className="flex items-center gap-3 rounded-lg hover:bg-zinc-50 transition-colors p-2 -m-2"
                  >
                    <div className="h-12 w-12 rounded-xl border border-zinc-200 overflow-hidden bg-zinc-50 flex-shrink-0">
                      <img
                        src={resolveImageUrl(it.product?.image_url)}
                        onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                        alt={it.product?.name || ""}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold line-clamp-1 text-zinc-900 group-hover:text-emerald-600">{it.product?.name}</div>
                      <div className="text-xs text-zinc-600">
                        {t('qty')} {it.quantity} · <Money value={it.unit_price} />
                        {it.variant_details && (
                          <span className="ml-2 text-zinc-500">({it.variant_details})</span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm font-black flex-shrink-0"><Money value={it.line_total} /></div>
                  </Link>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => orderAgain(o)}
                  disabled={reordering === o.id || !o.items?.length}
                  className="inline-flex items-center gap-2 text-sm font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={!o.items?.length ? "This order has no items" : ""}
                >
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                  {reordering === o.id ? (t('adding') || "Adding...") : (t('orderAgain') || "Order Again")}
                </button>
                <button
                  type="button"
                  onClick={() => requestReplacement(o.id)}
                  disabled={submitting}
                  className="text-sm font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-full border border-zinc-200 hover:bg-zinc-50 disabled:opacity-50"
                >
                  {t('requestReplacement') || "Request Replacement"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
