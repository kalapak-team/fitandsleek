import React, { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";
import { resolveImageUrl } from "../../lib/images";
import { AdminSectionLoader, AdminContentSkeleton } from "@/components/admin/AdminLoading";

const emptyForm = {
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    status: "active",
    profile_image: null,
};

function toTelHref(phone) {
    const clean = String(phone || "").trim().replace(/[^\d+]/g, "");
    return clean ? `tel:${clean}` : "";
}

export default function AdminDrivers() {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingDriver, setEditingDriver] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [showScansModal, setShowScansModal] = useState(false);
    const [scansLoading, setScansLoading] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [driverScans, setDriverScans] = useState([]);

    const filteredDrivers = useMemo(() => {
        return drivers.filter((driver) => {
            const matchSearch =
                !search ||
                String(driver.name || "").toLowerCase().includes(search.toLowerCase()) ||
                String(driver.email || "").toLowerCase().includes(search.toLowerCase()) ||
                String(driver.phone || "").toLowerCase().includes(search.toLowerCase());

            const matchStatus = !statusFilter || driver.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [drivers, search, statusFilter]);

    const loadDrivers = async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/admin/drivers?per_page=100");
            const list = data?.data?.data || data?.data || [];
            setDrivers(Array.isArray(list) ? list : []);
        } catch (error) {
            console.error("Failed to load drivers", error);
            setDrivers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDrivers();
    }, []);

    if (loading) return <AdminContentSkeleton title="Drivers" />;

    const openCreateModal = () => {
        setEditingDriver(null);
        setForm(emptyForm);
        setFormError("");
        setShowFormModal(true);
    };

    const openEditModal = (driver) => {
        setEditingDriver(driver);
        setForm({
            name: driver.name || "",
            email: driver.email || "",
            password: "",
            phone: driver.phone || "",
            address: driver.address || "",
            status: driver.status || "active",
            profile_image: null,
        });
        setFormError("");
        setShowFormModal(true);
    };

    const submitDriver = async (event) => {
        event.preventDefault();
        setSaving(true);
        setFormError("");

        try {
            const payload = new FormData();
            payload.append("name", form.name);
            payload.append("email", form.email);
            payload.append("phone", form.phone || "");
            payload.append("address", form.address || "");
            payload.append("status", form.status || "active");

            if (!editingDriver) {
                payload.append("password", form.password);
            } else if (form.password) {
                payload.append("password", form.password);
            }

            if (form.profile_image) {
                payload.append("profile_image", form.profile_image);
            }

            if (editingDriver) {
                payload.append("_method", "PATCH");
                await api.post(`/admin/drivers/${editingDriver.id}`, payload, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            } else {
                await api.post("/admin/drivers", payload, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }

            setShowFormModal(false);
            setEditingDriver(null);
            setForm(emptyForm);
            await loadDrivers();
        } catch (error) {
            setFormError(error?.response?.data?.message || "Failed to save driver.");
        } finally {
            setSaving(false);
        }
    };

    const openScansModal = async (driver) => {
        setSelectedDriver(driver);
        setShowScansModal(true);
        setScansLoading(true);

        try {
            const { data } = await api.get(`/admin/drivers/${driver.id}/scans?per_page=100`);
            const scans = data?.data?.data || data?.data || [];
            setDriverScans(Array.isArray(scans) ? scans : []);
        } catch (error) {
            console.error("Failed to load driver scans", error);
            setDriverScans([]);
        } finally {
            setScansLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 dark:bg-slate-950">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100">Drivers</h1>
                        <p className="text-slate-500 dark:text-slate-400">Manage driver accounts and scan activity</p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800 dark:focus:ring-slate-600"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Driver
                    </button>
                </div>

                <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search drivers..."
                        className="rounded-lg border border-slate-200 px-3 py-2 focus:border-black focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 focus:border-black focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                    </select>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    {filteredDrivers.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No drivers found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-900">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Avatar</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Email</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Phone Number</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Total Scans</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredDrivers.map((driver) => (
                                        <tr key={driver.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                                            <td className="px-4 py-3">
                                                <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                                    {driver.profile_image_url ? (
                                                        <img
                                                            src={resolveImageUrl(driver.profile_image_url)}
                                                            alt={driver.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                                                            {(driver.name || "D").charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                                <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">{driver.name}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{driver.email}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                                                {driver.phone || "-"}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                    {driver.status || "active"}
                                                </span>
                                            </td>
                                                <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{driver.shipment_tracking_events_count || 0}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(driver)}
                                                        title="Edit driver"
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openScansModal(driver)}
                                                        title="View scans"
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75z" /></svg>
                                                    </button>
                                                    {driver.phone && (
                                                        <a
                                                            href={toTelHref(driver.phone)}
                                                            title="Call driver"
                                                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {showFormModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl dark:border dark:border-slate-700 dark:bg-slate-900">
                        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{editingDriver ? "Edit Driver" : "Create Driver"}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Fill in the details to {editingDriver ? "update" : "create"} a driver account.</p>
                            </div>
                            <button type="button" onClick={() => setShowFormModal(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                                ✕
                            </button>
                        </div>
                        <form onSubmit={submitDriver} className="space-y-6 px-6 py-5">
                            {formError ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/40 dark:bg-rose-400/10 dark:text-rose-200">{formError}</div> : null}

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Name</label>
                                    <input value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} placeholder="Full name" className="w-full rounded-lg border border-slate-200 px-3 py-2 placeholder-slate-400 focus:border-black focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
                                    <input type="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} placeholder="driver@example.com" className="w-full rounded-lg border border-slate-200 px-3 py-2 placeholder-slate-400 focus:border-black focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500" required />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{editingDriver ? "New password (optional)" : "Password"}</label>
                                    <input type="password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} placeholder={editingDriver ? "Leave blank to keep current" : "Minimum 8 characters"} className="w-full rounded-lg border border-slate-200 px-3 py-2 placeholder-slate-400 focus:border-black focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500" required={!editingDriver} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Phone Number</label>
                                    <input type="tel" value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} placeholder="e.g., +855 12 345 678" className="w-full rounded-lg border border-slate-200 px-3 py-2 placeholder-slate-400 focus:border-black focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Address</label>
                                    <input value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} placeholder="City, street, house number" className="w-full rounded-lg border border-slate-200 px-3 py-2 placeholder-slate-400 focus:border-black focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500" />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Status</label>
                                    <div className="flex flex-wrap gap-2">
                                        {["active", "inactive", "suspended"].map((status) => (
                                            <button
                                                key={status}
                                                type="button"
                                                onClick={() => setForm((s) => ({ ...s, status }))}
                                                className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors border ${form.status === status ? "border-slate-300 bg-slate-200 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"}`}
                                            >
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Avatar</label>
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                                            {editingDriver?.profile_image_url ? (
                                                <img src={resolveImageUrl(editingDriver.profile_image_url)} alt={editingDriver.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-500 dark:text-slate-300">
                                                    {(form.name || editingDriver?.name || "D").charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setForm((s) => ({ ...s, profile_image: e.target.files?.[0] || null }))}
                                                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-black focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                            />
                                            <p className="text-xs text-slate-500 dark:text-slate-400">PNG/JPG, max 2MB. {form.profile_image?.name ? `Selected: ${form.profile_image.name}` : ""}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowFormModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Cancel</button>
                                <button type="submit" disabled={saving} className="rounded-lg border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800">
                                    {saving ? "Saving..." : editingDriver ? "Update Driver" : "Create Driver"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {showScansModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl dark:border dark:border-slate-700 dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{selectedDriver?.name} - Scan History</h3>
                            <button type="button" onClick={() => setShowScansModal(false)} className="rounded p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">✕</button>
                        </div>
                        <div className="max-h-[70vh] overflow-auto p-6">
                            {scansLoading ? (
                                <AdminSectionLoader rows={3} className="px-0" />
                            ) : driverScans.length === 0 ? (
                                <div className="text-center text-slate-500 dark:text-slate-400">No scans yet.</div>
                            ) : (
                                <div className="space-y-3">
                                    {driverScans.map((event) => (
                                        <div key={event.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{event.status}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{event.event_time ? new Date(event.event_time).toLocaleString() : "-"}</p>
                                            </div>
                                            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">Shipment: {event.shipment?.tracking_code || "-"}</p>
                                            <p className="text-sm text-slate-700 dark:text-slate-300">Order: {event.shipment?.order?.order_number || "-"}</p>
                                            <p className="text-sm text-slate-700 dark:text-slate-300">Location: {event.location || "-"}</p>
                                            <p className="text-sm text-slate-700 dark:text-slate-300">Note: {event.note || "-"}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
