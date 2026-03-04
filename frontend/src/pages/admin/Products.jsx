import React, { useEffect, useRef, useState } from "react";
import { Columns2Icon, LayoutGridIcon, ListIcon } from "lucide-react";
import api from "../../lib/api";
import { useAuth } from "../../state/auth";
import { useTheme } from "../../state/theme.jsx";
import { resolveImageUrl } from "../../lib/images";
import { closeSwal, errorAlert, loadingAlert, toastSuccess, warningConfirm } from "../../lib/swal";
import { AdminContentSkeleton, AdminSectionLoader } from "@/components/admin/AdminLoading";

export default function AdminProducts() {
  const { refresh: refreshAuth } = useAuth();
  const { primaryColor, mode } = useTheme();
  const isDark = mode === "dark";
  const accentColor = mode === "dark" ? "#FFFFFF" : primaryColor;
  const accentIsWhite = (accentColor || "").toUpperCase() === "#FFFFFF";
  const headerIconColor = accentIsWhite ? "#0b0b0f" : "#FFFFFF";
  const deleteButtonStyle = {
    backgroundColor: isDark ? "rgba(127, 29, 29, 0.22)" : "#fef2f2",
    color: isDark ? "#fecdd3" : "#991b1b",
    border: `1px solid ${isDark ? "rgba(248, 113, 113, 0.45)" : "#fecdd3"}`,
    borderRadius: "0.65rem",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.35rem",
    padding: "0.45rem 0.75rem",
    fontWeight: 600,
    fontSize: "0.875rem",
    transition: "all 150ms ease",
  };

  const deleteIconButtonStyle = {
    ...deleteButtonStyle,
    width: "2.5rem",
    height: "2.5rem",
    padding: "0.5rem",
    fontWeight: 500,
  };
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState({
    name: "", sku: "", description: "", price: "", stock: "", category_id: "", brand_id: "", image_url: "", gender: "", is_active: true,
    model_info: "", colors: "", sizes: [], size_guide: "", delivery_info: "", support_phone: "", payment_methods: "", gallery: ""
  });
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [animate, setAnimate] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createSection, setCreateSection] = useState("basic");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [galleryError, setGalleryError] = useState("");
  const [editGalleryError, setEditGalleryError] = useState("");
  const galleryInputRef = useRef(null);
  const editGalleryInputRef = useRef(null);
  const [productType, setProductType] = useState("Clothes");
  const [customSize, setCustomSize] = useState("");
  const [editProductType, setEditProductType] = useState("Clothes");
  const [editCustomSize, setEditCustomSize] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const getValidationMessage = (error) => {
    const responseMessage = error?.response?.data?.message;
    const errors = error?.response?.data?.errors;
    if (errors && typeof errors === "object") {
      const first = Object.values(errors).flat().find(Boolean);
      return first || responseMessage || "Validation failed.";
    }
    return responseMessage || error?.message || "Create failed.";
  };

  const PRODUCT_TYPES = ["Clothes", "Shoes", "Bags", "Accessories", "Other"];

  const SIZE_PRESETS = {
    clothes: ["XS", "S", "M", "L", "XL", "XXL"],
    shoes: ["38", "39", "40", "41", "42", "43"],
    bag: ["One Size", "Free Size"],
    accessory: ["One Size", "Free Size"],
    other: [],
  };

  const normalizeSizes = (value) => {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === "string") {
      return value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [];
  };

  const normalizeType = (value) => String(value || "").toLowerCase().trim();

  const inferTypeFromCategory = (category) => {
    if (!category) return "";
    if (category.type) return normalizeType(category.type);
    const name = normalizeType(category.name);
    if (name.includes("shoe") || name.includes("sneaker") || name.includes("boot")) return "shoes";
    if (name.includes("shirt") || name.includes("dress") || name.includes("clothe") || name.includes("apparel")) return "clothes";
    if (name.includes("belt")) return "belt";
    if (name.includes("hat") || name.includes("cap")) return "hat";
    if (name.includes("bag")) return "bag";
    return "";
  };

  const getSizePreset = (typeKey) => SIZE_PRESETS[typeKey] || [];

  const selectedCategory = categories.find((c) => String(c.id) === String(form.category_id));
  const selectedEditCategory = categories.find((c) => String(c.id) === String(editing?.category_id));
  const sizeOptions = getSizePreset(normalizeType(productType));
  const editSizeOptions = getSizePreset(normalizeType(editProductType));

  const parseGallery = (value) => {
    if (Array.isArray(value)) {
      return value.map((v) => String(v).trim()).filter(Boolean);
    }
    if (typeof value === "string") {
      return value
        .split(/\r?\n+/)
        .map((v) => v.trim())
        .filter(Boolean);
    }
    return [];
  };

  const stringifyGallery = (value) => {
    if (Array.isArray(value)) return value.filter(Boolean).join("\n");
    return value || "";
  };

  const uploadGalleryFile = async (file) => {
    const fd = new FormData();
    fd.append("image", file);
    const { data } = await api.post("/admin/products/gallery-upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data?.image_url;
  };

  const triggerAuthRefresh = async () => {
    try {
      await refreshAuth();
    } catch (e) {
      console.warn('Auth refresh failed');
    }
  };

  const extractErr = (e) => {
    const status = e?.response?.status;
    if (status === 401) {
      triggerAuthRefresh();
      return "Unauthorized (401). Please login again.";
    }
    return e?.response?.data?.message || "Failed to load/save data.";
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data: productsData } = await api.get("/admin/products");
      const { data: categoriesData } = await api.get("/categories");
      const { data: brandsData } = await api.get("/admin/brands");
      // Handle both array and object responses
      const categories = Array.isArray(categoriesData)
        ? categoriesData
        : (categoriesData?.data || categoriesData || []);
      const brands = brandsData?.data || [];
      setRows(productsData?.data || []);
      setCategories(categories);
      setBrands(brands);
    } catch (e2) {
      setErr(extractErr(e2));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => rows.some((p) => p.id === id)));
  }, [rows]);

  useEffect(() => {
    if (!form.category_id) return;
    if (!selectedCategory) return;
    const inferred = inferTypeFromCategory(selectedCategory);
    if (!inferred) return;
    const nextType = inferred === "shoes" ? "Shoes" : inferred === "clothes" ? "Clothes" : inferred === "bag" ? "Bags" : inferred === "accessory" ? "Accessories" : "Other";
    setProductType(nextType);
  }, [form.category_id, selectedCategory]);

  useEffect(() => {
    if (!editing) return;
    if (!editing.category_id) return;
    if (!selectedEditCategory) return;
    const inferred = inferTypeFromCategory(selectedEditCategory);
    if (!inferred) return;
    const nextType = inferred === "shoes" ? "Shoes" : inferred === "clothes" ? "Clothes" : inferred === "bag" ? "Bags" : inferred === "accessory" ? "Accessories" : "Other";
    setEditProductType(nextType);
  }, [editing, selectedEditCategory]);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setAnimate(true);
    setTimeout(() => {
      setAnimate(false);
      setTimeout(() => setSuccess(""), 300);
    }, 3000);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // For demo, we'll use a simple URL or base64
      // In production, you'd upload to a server/cloud storage
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((s) => ({ ...s, image_url: reader.result }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setErr("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditing((s) => ({ ...s, image_url: reader.result }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setErr("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setGalleryError("");
    try {
      const urls = [];
      for (const file of Array.from(files)) {
        const url = await uploadGalleryFile(file);
        if (url) urls.push(url);
      }
      setForm((s) => {
        const current = parseGallery(s.gallery);
        const merged = [...current, ...urls].filter(Boolean);
        return { ...s, gallery: merged.join("\n") };
      });
    } catch (error) {
      setGalleryError(extractErr(error));
      setErr(extractErr(error));
    } finally {
      if (e.target) e.target.value = "";
      setIsUploading(false);
    }
  };

  const handleEditGalleryUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setEditGalleryError("");
    try {
      const urls = [];
      for (const file of Array.from(files)) {
        const url = await uploadGalleryFile(file);
        if (url) urls.push(url);
      }
      setEditing((s) => {
        const current = parseGallery(s?.gallery);
        const merged = [...current, ...urls].filter(Boolean);
        return { ...s, gallery: merged.join("\n") };
      });
    } catch (error) {
      setEditGalleryError(extractErr(error));
      setErr(extractErr(error));
    } finally {
      if (e.target) e.target.value = "";
      setIsUploading(false);
    }
  };

  const create = async (e) => {
    e.preventDefault();
    if (isCreating) return;
    setErr("");
    setCreateError("");

    if (!form.category_id) {
      const detail = "Please select a category";
      setErr(detail);
      await errorAlert({
        khTitle: "ទិន្នន័យមិនគ្រប់",
        enTitle: "Missing required field",
        detail,
      });
      return;
    }

    if (!form.sku) {
      const detail = "Please enter a SKU";
      setErr(detail);
      await errorAlert({
        khTitle: "ទិន្នន័យមិនគ្រប់",
        enTitle: "Missing required field",
        detail,
      });
      return;
    }

    if (form.price === "" || Number.isNaN(Number(form.price))) {
      const detail = "Please enter a valid price";
      setErr(detail);
      await errorAlert({
        khTitle: "ទិន្នន័យមិនត្រឹមត្រូវ",
        enTitle: "Invalid input",
        detail,
      });
      return;
    }

    setIsCreating(true);
    loadingAlert({
      khTitle: "កំពុងបង្កើតទំនិញ",
      enTitle: "Creating product",
      khText: "សូមរង់ចាំបន្តិច",
      enText: "Please wait",
    });
    try {
      const response = await api.post("/admin/products", {
        ...form,
        brand_id: form.brand_id || null,
        price: parseFloat(form.price),
        stock: parseInt(form.stock || 0),
        colors: form.colors ? form.colors.split(',').map(c => c.trim()).filter(Boolean) : [],
        sizes: Array.isArray(form.sizes) ? form.sizes : (form.sizes ? form.sizes.split(',').map(s => s.trim()).filter(Boolean) : []),
        payment_methods: form.payment_methods ? form.payment_methods.split(',').map(p => p.trim()).filter(Boolean) : [],
        gallery: parseGallery(form.gallery),
      });
      if (![200, 201].includes(response?.status)) {
        throw new Error("Create failed.");
      }
      closeSwal();
      setForm({ name: "", sku: "", description: "", price: "", stock: "", category_id: "", brand_id: "", image_url: "", gender: "", is_active: true, model_info: "", colors: "", sizes: [], size_guide: "", delivery_info: "", support_phone: "", payment_methods: "", gallery: "" });
      setShowCreateForm(false);
      setCreateSection("basic");
      await toastSuccess({
        khText: "បានបង្កើតទំនិញដោយជោគជ័យ",
        enText: "Created successfully!",
      });
      await load();
    } catch (e2) {
      closeSwal();
      const detail = e2?.response?.status === 422 ? getValidationMessage(e2) : extractErr(e2);
      setErr(detail);
      const slugHint = String(detail).toLowerCase().includes("slug")
        ? `សូមបំពេញ Slug - ${detail}`
        : detail;
      setCreateError(slugHint);
      await errorAlert({
        khTitle: "បង្កើតទំនិញបរាជ័យ",
        enTitle: "Create failed",
        detail: slugHint,
      });
    } finally {
      closeSwal();
      setIsCreating(false);
    }
  };

  const startEdit = (p) => setEditing({ ...p, sizes: normalizeSizes(p.sizes), gallery: stringifyGallery(p.gallery) });

  const saveEdit = async () => {
    setErr("");

    if (!editing.category_id) {
      setErr("Please select a category");
      return;
    }

    if (editing.price === "" || Number.isNaN(Number(editing.price))) {
      setErr("Please enter a valid price");
      return;
    }

    try {
      await api.patch(`/admin/products/${editing.id}`, {
        ...editing,
        brand_id: editing.brand_id || null,
        price: parseFloat(editing.price),
        stock: parseInt(editing.stock || 0),
        colors: editing.colors && typeof editing.colors === 'string' ? editing.colors.split(',').map(c => c.trim()).filter(Boolean) : (editing.colors || []),
        sizes: Array.isArray(editing.sizes) ? editing.sizes : (editing.sizes && typeof editing.sizes === 'string' ? editing.sizes.split(',').map(s => s.trim()).filter(Boolean) : (editing.sizes || [])),
        payment_methods: editing.payment_methods && typeof editing.payment_methods === 'string' ? editing.payment_methods.split(',').map(p => p.trim()).filter(Boolean) : (editing.payment_methods || []),
        gallery: parseGallery(editing.gallery),
      });
      setEditing(null);
      showSuccess("Product updated successfully!");
      await load();
    } catch (e2) {
      setErr(extractErr(e2));
    }
  };

  const del = async (id) => {
    const confirmRes = await warningConfirm({
      khTitle: "លុបទំនិញ",
      enTitle: "Delete product",
      khText: "តើអ្នកចង់លុបទំនិញនេះមែនទេ?",
      enText: "Are you sure you want to delete this product?",
    });
    if (!confirmRes.isConfirmed) return;
    try {
      await api.delete(`/admin/products/${id}`);
      showSuccess("Product deleted successfully!");
      await load();
    } catch (e2) {
      setErr(extractErr(e2));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredRows = rows.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      String(p.name || "").toLowerCase().includes(q) ||
      String(p.sku || "").toLowerCase().includes(q) ||
      String(p.category?.name || "").toLowerCase().includes(q) ||
      String(p.brand?.name || "").toLowerCase().includes(q)
    );
  });

  const splitColumns = [
    filteredRows.filter((_, index) => index % 2 === 0),
    filteredRows.filter((_, index) => index % 2 === 1),
  ];

  const allSelected =
    filteredRows.length > 0 && filteredRows.every((p) => selectedIds.includes(p.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      const filteredIds = new Set(filteredRows.map((p) => p.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.has(id)));
      return;
    }
    const next = new Set(selectedIds);
    filteredRows.forEach((p) => next.add(p.id));
    setSelectedIds(Array.from(next));
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const confirmRes = await warningConfirm({
      khTitle: "លុបទំនិញជាច្រើន",
      enTitle: "Delete selected products",
      khText: `តើអ្នកចង់លុបទំនិញ ${selectedIds.length} មែនទេ?`,
      enText: `Delete ${selectedIds.length} selected products?`,
    });
    if (!confirmRes.isConfirmed) return;
    try {
      await Promise.all(selectedIds.map((id) => api.delete(`/admin/products/${id}`)));
      showSuccess("Selected products deleted successfully!");
      setSelectedIds([]);
      await load();
    } catch (e2) {
      setErr(extractErr(e2));
    }
  };

  if (loading) return <AdminContentSkeleton lines={3} imageHeight={240} className="mt-4" />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-8">
      {/* Success Toast */}
      <div className={`fixed top-6 right-6 z-50 transition-all duration-500 ease-out transform ${animate ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
        {success && (
          <div className="bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-pulse">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">{success}</span>
          </div>
        )}
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-slate-800 dark:text-white mb-2 flex items-center gap-3">
              <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: accentColor }}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: headerIconColor }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </span>
              Products
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg">Manage your product catalog with full CRUD operations</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className={`px-6 py-3 font-semibold rounded-xl shadow-sm transition-all duration-200 flex items-center gap-2 ${accentIsWhite ? "border border-slate-300" : "text-white"}`}
            style={{ backgroundColor: accentColor, color: accentIsWhite ? "#0b0b0f" : "#FFFFFF" }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: headerIconColor }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Product
          </button>
        </div>

        {/* Error Alert */}
        {err && (
          <div className="mb-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3 animate-shake">
            <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700 dark:text-red-100 font-medium">{err}</span>
            <button onClick={() => setErr("")} className="ml-auto text-red-400 dark:text-red-300 hover:text-red-600 dark:hover:text-red-200 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => !isCreating && setShowCreateForm(false)}
            />
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add New Product
                </h2>
                <button
                  onClick={() => !isCreating && setShowCreateForm(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  disabled={isCreating}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCreateSection("basic")}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${createSection === "basic"
                    ? "shadow-sm"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  style={createSection === "basic" ? { backgroundColor: accentColor, color: accentIsWhite ? "#0b0b0f" : "#FFFFFF", borderColor: accentIsWhite ? "#cbd5e1" : accentColor } : undefined}
                >
                  Basic Info
                </button>
                <button
                  type="button"
                  onClick={() => setCreateSection("gallery")}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${createSection === "gallery"
                    ? "shadow-sm"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  style={createSection === "gallery" ? { backgroundColor: accentColor, color: accentIsWhite ? "#0b0b0f" : "#FFFFFF", borderColor: accentIsWhite ? "#cbd5e1" : accentColor } : undefined}
                >
                  Gallery Thumbnails
                </button>
                <button
                  type="button"
                  onClick={() => setCreateSection("details")}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${createSection === "details"
                    ? "shadow-sm"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  style={createSection === "details" ? { backgroundColor: accentColor, color: accentIsWhite ? "#0b0b0f" : "#FFFFFF", borderColor: accentIsWhite ? "#cbd5e1" : accentColor } : undefined}
                >
                  Product Detail Settings
                </button>
              </div>

              <form onSubmit={create} className="grid md:grid-cols-12 gap-4 items-end">
                {createSection === "basic" && (
                  <>
                    {/* Product Name */}
                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Product Name *</label>
                      <input
                        value={form.name}
                        onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                        required
                        className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300 placeholder-slate-400"
                        placeholder="Product name"
                      />
                    </div>

                    {/* SKU */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">SKU *</label>
                      <input
                        value={form.sku}
                        onChange={(e) => setForm((s) => ({ ...s, sku: e.target.value }))}
                        required
                        className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300 placeholder-slate-400"
                        placeholder="SKU-001"
                      />
                    </div>

                    {/* Category */}
                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Category *</label>
                      <select
                        value={form.category_id}
                        onChange={(e) => setForm((s) => ({ ...s, category_id: e.target.value }))}
                        required
                        className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300"
                      >
                        <option value="">Select category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Brand */}
                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Brand</label>
                      <select
                        value={form.brand_id}
                        onChange={(e) => setForm((s) => ({ ...s, brand_id: e.target.value }))}
                        className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300"
                      >
                        <option value="">Select brand</option>
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Price */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.price}
                        onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
                        className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300 placeholder-slate-400"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    {/* Stock */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Stock</label>
                      <input
                        type="number"
                        value={form.stock}
                        onChange={(e) => setForm((s) => ({ ...s, stock: e.target.value }))}
                        className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300 placeholder-slate-400"
                        placeholder="0"
                      />
                    </div>

                    {/* Image URL */}
                    <div className="md:col-span-12">
                      <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Product Image</label>
                      <div className="flex gap-4 items-center">
                        <div className="relative w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden">
                          {form.image_url ? (
                            <img src={resolveImageUrl(form.image_url)} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="url"
                            value={form.image_url.startsWith('data:') ? '' : form.image_url}
                            onChange={(e) => setForm((s) => ({ ...s, image_url: e.target.value }))}
                            className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300 placeholder-slate-400"
                            placeholder="Or paste image URL here..."
                            disabled={form.image_url.startsWith('data:')}
                          />
                          <p className="text-xs text-slate-500 mt-1">Click the image box to upload or paste a URL above</p>
                        </div>
                        {isUploading && (
                          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Uploading...
                          </div>
                        )}
                      </div>
                    </div>


                    {/* Description */}
                    <div className="md:col-span-10">
                      <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Description</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                        rows={2}
                        className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300 placeholder-slate-400"
                        placeholder="Product description..."
                      />
                    </div>

                    {/* Active Toggle */}
                    <div className="md:col-span-2 flex items-center justify-center">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <span className="text-sm font-medium text-slate-700">Active</span>
                        <button
                          type="button"
                          onClick={() => setForm((s) => ({ ...s, is_active: !s.is_active }))}
                          className={`w-14 h-8 rounded-full transition-all duration-300 flex items-center cursor-pointer ${form.is_active ? 'bg-[#2563eb]' : 'bg-slate-300 dark:bg-slate-700'}`}
                        >
                          <span className={`w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${form.is_active ? 'translate-x-7' : 'translate-x-1'}`} />
                        </button>
                      </label>
                    </div>

                  </>
                )}

                {createSection === "gallery" && (
                  <div className="md:col-span-12">
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
                      <h3 className="text-sm font-semibold text-slate-800 mb-4">Gallery Thumbnails</h3>
                      {/* Gallery Thumbnails */}
                      <div className="md:col-span-12">
                        <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Gallery Thumbnails (Vertical List)</label>
                        <div className="grid md:grid-cols-12 gap-4">
                          <div className="md:col-span-7">
                            <textarea
                              value={form.gallery}
                              onChange={(e) => setForm((s) => ({ ...s, gallery: e.target.value }))}
                              rows={4}
                              className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300 placeholder-slate-400"
                              placeholder="Paste image URLs (one per line)"
                            />
                            <div className="mt-2 flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => galleryInputRef.current?.click()}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 bg-white cursor-pointer hover:bg-slate-50 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Upload gallery images
                              </button>
                              <input
                                ref={galleryInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleGalleryUpload}
                                className="hidden"
                              />
                              <span className="text-xs text-slate-500">Uploads are stored on the server.</span>
                            </div>
                            {galleryError && (
                              <div className="mt-2 text-xs text-red-600">{galleryError}</div>
                            )}
                          </div>
                          <div className="md:col-span-5">
                            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
                              <p className="text-xs font-semibold text-slate-600 mb-2">Preview (Vertical)</p>
                              <div className="max-h-48 overflow-y-auto overflow-x-hidden space-y-2 scrollbar-hide">
                                {parseGallery(form.gallery).length === 0 ? (
                                  <p className="text-xs text-slate-400">No thumbnails yet</p>
                                ) : (
                                  parseGallery(form.gallery).map((url, idx) => (
                                    <div key={`${url}-${idx}`} className="flex items-center gap-2">
                                      <div className="w-12 h-12 rounded-lg border border-slate-200 bg-white overflow-hidden">
                                        <img src={resolveImageUrl(url)} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                                      </div>
                                      <p className="text-xs text-slate-500 truncate">{url}</p>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {createSection === "details" && (
                  <div className="md:col-span-12">
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
                      <h3 className="text-sm font-semibold text-slate-800 mb-4">Product Detail Settings</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Product Type */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Product Type</label>
                          <select
                            value={productType}
                            onChange={(e) => setProductType(e.target.value)}
                            className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300"
                          >
                            {PRODUCT_TYPES.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        {/* Model Info */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Model Info</label>
                          <input
                            value={form.model_info}
                            onChange={(e) => setForm((s) => ({ ...s, model_info: e.target.value }))}
                            list="model-info-options"
                            className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300"
                            placeholder="Model is 161cm tall / 43kg, wearing size XS"
                          />
                        </div>

                        {/* Colors */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Available Colors</label>
                          <input
                            value={form.colors}
                            onChange={(e) => setForm((s) => ({ ...s, colors: e.target.value }))}
                            list="colors-options"
                            className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300"
                            placeholder="Black, White, Red (comma separated)"
                          />
                        </div>

                        {/* Sizes */}
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Available Sizes</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {sizeOptions.length === 0 && (
                              <span className="text-xs text-slate-400">No presets for this type. Add custom sizes.</span>
                            )}
                            {sizeOptions.map((size) => (
                              <label
                                key={size}
                                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition ${form.sizes.includes(size)
                                  ? "border-slate-300 bg-slate-50 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                  }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={form.sizes.includes(size)}
                                  onChange={() =>
                                    setForm((s) => ({
                                      ...s,
                                      sizes: s.sizes.includes(size)
                                        ? s.sizes.filter((v) => v !== size)
                                        : [...s.sizes, size],
                                    }))
                                  }
                                  className="h-4 w-4"
                                />
                                {size}
                              </label>
                            ))}
                          </div>
                          {Array.isArray(form.sizes) && form.sizes.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {form.sizes.map((size) => (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() =>
                                    setForm((s) => ({
                                      ...s,
                                      sizes: s.sizes.filter((v) => v !== size),
                                    }))
                                  }
                                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border"
                                  style={{ backgroundColor: accentIsWhite ? '#0b0b0f' : accentColor, color: '#FFFFFF', borderColor: 'transparent' }}
                                  title="Remove"
                                >
                                  {size}
                                  <span>×</span>
                                </button>
                              ))}
                            </div>
                          )}
                          <div className="mt-3 flex items-center gap-2">
                            <input
                              value={customSize}
                              onChange={(e) => setCustomSize(e.target.value)}
                              placeholder="Add custom size (e.g., XXXL)"
                              className="h-10 flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const value = customSize.trim();
                                  if (!value) return;
                                  setForm((s) => ({
                                    ...s,
                                    sizes: s.sizes.includes(value) ? s.sizes : [...s.sizes, value],
                                  }));
                                  setCustomSize("");
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const value = customSize.trim();
                                if (!value) return;
                                setForm((s) => ({
                                  ...s,
                                  sizes: s.sizes.includes(value) ? s.sizes : [...s.sizes, value],
                                }));
                                setCustomSize("");
                              }}
                              className={`px-3 py-2 rounded-lg text-sm font-semibold ${accentIsWhite ? "border border-slate-300" : ""}`}
                              style={{ backgroundColor: accentColor, color: accentIsWhite ? "#0b0b0f" : "#FFFFFF" }}
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        {/* Size Guide */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Size Guide</label>
                          <input
                            value={form.size_guide}
                            onChange={(e) => setForm((s) => ({ ...s, size_guide: e.target.value }))}
                            list="size-guide-options"
                            className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300"
                            placeholder="Size guide text or URL"
                          />
                        </div>

                        {/* Delivery Info */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Delivery Info</label>
                          <input
                            value={form.delivery_info}
                            onChange={(e) => setForm((s) => ({ ...s, delivery_info: e.target.value }))}
                            list="delivery-options"
                            className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300"
                            placeholder="From 1 - 3 days"
                          />
                        </div>

                        {/* Support Phone */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Support Hotline</label>
                          <input
                            value={form.support_phone}
                            onChange={(e) => setForm((s) => ({ ...s, support_phone: e.target.value }))}
                            list="support-phone-options"
                            className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300"
                            placeholder="+855 12 345 678"
                          />
                        </div>

                        {/* Payment Methods */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Payment Methods</label>
                          <input
                            value={form.payment_methods}
                            onChange={(e) => setForm((s) => ({ ...s, payment_methods: e.target.value }))}
                            list="payment-options"
                            className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300"
                            placeholder="Cash, ABA, Wing, Credit Card (comma separated)"
                          />
                        </div>
                        <datalist id="model-info-options">
                          <option value="Model is 161cm tall / 43kg, wearing size XS" />
                          <option value="Model is 170cm tall / 55kg, wearing size S" />
                          <option value="Model is 175cm tall / 62kg, wearing size M" />
                        </datalist>
                        <datalist id="colors-options">
                          <option value="Black, White, Red" />
                          <option value="Black, White, Gray" />
                          <option value="Blue, Navy, Sky" />
                          <option value="Green, Olive, Khaki" />
                        </datalist>
                        <datalist id="size-guide-options">
                          <option value="See size guide in description" />
                          <option value="https://example.com/size-guide" />
                        </datalist>
                        <datalist id="delivery-options">
                          <option value="From 1 - 3 days" />
                          <option value="From 3 - 5 days" />
                          <option value="Same day (Phnom Penh)" />
                        </datalist>
                        <datalist id="support-phone-options">
                          <option value="+855 12 345 678" />
                          <option value="+855 10 888 999" />
                        </datalist>
                        <datalist id="payment-options">
                          <option value="Cash, ABA, Wing, Credit Card" />
                          <option value="Cash, ABA" />
                          <option value="Cash on Delivery" />
                        </datalist>
                      </div>
                    </div>
                  </div>
                )}

                <div className="md:col-span-12">
                  {createError ? (
                    <div className="mb-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-700 dark:text-red-100">
                      {createError}
                    </div>
                  ) : null}
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="h-12 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 w-full md:w-auto px-8 disabled:opacity-60 disabled:cursor-not-allowed border"
                    style={{ backgroundColor: accentColor, color: accentIsWhite ? "#0b0b0f" : "#FFFFFF", borderColor: accentIsWhite ? "#cbd5e1" : accentColor }}
                  >
                    <svg className={`w-5 h-5 ${isCreating ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCreating ? "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" : "M12 6v6m0 0v6m0-6h6m-6 0H6"} />
                    </svg>
                    {isCreating ? "Creating..." : "Add Product"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: accentColor }}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: headerIconColor }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-slate-900 dark:text-white font-semibold">All Products</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{filteredRows.length} total products</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="h-9 w-full sm:w-52 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-slate-400 dark:focus:border-slate-500"
                />

                <div
                  role="group"
                  aria-label="View mode"
                  className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1"
                >
                  <button
                    onClick={() => setViewMode("list")}
                    aria-label="List view"
                    aria-pressed={viewMode === "list"}
                    className={`h-9 px-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${viewMode === "list"
                      ? "shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    style={viewMode === "list" ? { backgroundColor: accentColor, color: accentIsWhite ? "#0b0b0f" : "#FFFFFF" } : undefined}
                  >
                    <ListIcon className="w-4 h-4" />
                    List
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    aria-label="Grid view"
                    aria-pressed={viewMode === "grid"}
                    className={`h-9 px-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${viewMode === "grid"
                      ? "shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    style={viewMode === "grid" ? { backgroundColor: accentColor, color: accentIsWhite ? "#0b0b0f" : "#FFFFFF" } : undefined}
                  >
                    <LayoutGridIcon className="w-4 h-4" />
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode("split")}
                    aria-label="Split view"
                    aria-pressed={viewMode === "split"}
                    className={`h-9 px-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${viewMode === "split"
                      ? "shadow-sm"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    style={viewMode === "split" ? { backgroundColor: accentColor, color: accentIsWhite ? "#0b0b0f" : "#FFFFFF" } : undefined}
                  >
                    <Columns2Icon className="w-4 h-4" />
                    Split
                  </button>
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-emerald-500 focus:ring-0"
                  />
                  Select all
                </label>

                {selectedIds.length > 0 && (
                  <button
                    onClick={deleteSelected}
                    className="transition-colors"
                    style={deleteButtonStyle}
                    aria-label="Delete selected products"
                  >
                    Delete Selected ({selectedIds.length})
                  </button>
                )}

                <button
                  onClick={load}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <AdminSectionLoader rows={6} />
          ) : filteredRows.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-slate-500 dark:text-slate-200 text-lg">No products yet</p>
              <p className="text-slate-400 dark:text-slate-400 text-sm mt-1">Create your first product above</p>
            </div>
          ) : viewMode === "list" ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/70 text-left text-xs font-semibold text-slate-600 dark:text-slate-200 uppercase tracking-wider">
                    <th className="px-6 py-4">Select</th>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">SKU</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredRows.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-0"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-sm overflow-hidden">
                            {p.image_url ? (
                              <img src={resolveImageUrl(p.image_url)} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              p.name?.charAt(0)?.toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[220px]">{p.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[220px]">{p.brand?.name || ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{p.sku}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{p.category?.name}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-100">${p.price}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{p.stock}</td>
                      <td className="px-6 py-4">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-semibold border"
                          style={p.is_active
                            ? { backgroundColor: accentIsWhite ? '#0b0b0f' : accentColor, color: '#FFFFFF', borderColor: 'transparent' }
                            : { backgroundColor: mode === 'dark' ? '#e2e8f0' : '#f1f5f9', color: '#0f172a', borderColor: mode === 'dark' ? '#cbd5e1' : '#cbd5e1' }
                          }
                        >
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(p)}
                            className="px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => del(p.id)}
                            className="transition-colors"
                            style={deleteButtonStyle}
                            aria-label="Delete product"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : viewMode === "split" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
              {splitColumns.map((columnRows, columnIndex) => (
                <div key={columnIndex} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Column {columnIndex + 1}
                  </div>
                  <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {columnRows.length === 0 ? (
                      <div className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">No products</div>
                    ) : (
                      columnRows.map((p) => (
                        <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(p.id)}
                            onChange={() => toggleSelect(p.id)}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-0"
                          />
                          <div className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-xs overflow-hidden shrink-0">
                            {p.image_url ? (
                              <img src={resolveImageUrl(p.image_url)} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              p.name?.charAt(0)?.toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{p.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{p.sku} • ${p.price}</p>
                          </div>
                          <span
                            className="px-2 py-1 rounded-full text-[11px] font-semibold border"
                            style={p.is_active
                              ? { backgroundColor: accentIsWhite ? '#0b0b0f' : accentColor, color: '#FFFFFF', borderColor: 'transparent' }
                              : { backgroundColor: mode === 'dark' ? '#e2e8f0' : '#f1f5f9', color: '#0f172a', borderColor: mode === 'dark' ? '#cbd5e1' : '#cbd5e1' }
                            }
                          >
                            {p.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEdit(p)}
                              className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => del(p.id)}
                              className="transition-colors"
                              style={deleteIconButtonStyle}
                              aria-label="Delete product"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
              {filteredRows.map((p, index) => (
                <div
                  key={p.id}
                  className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-lg overflow-hidden">
                      {p.image_url ? (
                        <img src={resolveImageUrl(p.image_url)} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        p.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-0"
                      />
                      <span
                        className="px-2 py-1 rounded-full text-xs font-semibold border"
                        style={p.is_active
                          ? { backgroundColor: accentIsWhite ? '#0b0b0f' : accentColor, color: '#FFFFFF', borderColor: 'transparent' }
                          : { backgroundColor: mode === 'dark' ? '#e2e8f0' : '#f1f5f9', color: '#0f172a', borderColor: mode === 'dark' ? '#cbd5e1' : '#cbd5e1' }
                        }
                      >
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1 truncate">{p.name}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{p.sku}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 truncate">{p.category?.name}</p>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">${p.price}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{p.stock} in stock</p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => startEdit(p)}
                        className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => del(p.id)}
                        className="transition-colors"
                        style={deleteIconButtonStyle}
                        aria-label="Delete product"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setEditing(null)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl p-6 animate-modal-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Product
              </h3>
              <button
                onClick={() => setEditing(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Product Name *</label>
                <input
                  value={editing.name}
                  onChange={(e) => setEditing((s) => ({ ...s, name: e.target.value }))}
                  className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">SKU *</label>
                <input
                  value={editing.sku}
                  onChange={(e) => setEditing((s) => ({ ...s, sku: e.target.value }))}
                  className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-600 mb-2">Description</label>
                <textarea
                  value={editing.description || ''}
                  onChange={(e) => setEditing((s) => ({ ...s, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editing.price}
                  onChange={(e) => setEditing((s) => ({ ...s, price: e.target.value }))}
                  className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Stock</label>
                <input
                  type="number"
                  value={editing.stock}
                  onChange={(e) => setEditing((s) => ({ ...s, stock: e.target.value }))}
                  className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Category *</label>
                <select
                  value={editing.category_id || ""}
                  onChange={(e) => setEditing((s) => ({ ...s, category_id: e.target.value }))}
                  className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Brand</label>
                <select
                  value={editing.brand_id || ""}
                  onChange={(e) => setEditing((s) => ({ ...s, brand_id: e.target.value }))}
                  className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300"
                >
                  <option value="">Select brand</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Product Image</label>
                <div className="flex gap-3 items-center">
                  <div className="relative w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden shrink-0">
                    {editing.image_url ? (
                      <img src={resolveImageUrl(editing.image_url)} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  <input
                    type="url"
                    value={editing.image_url?.startsWith('data:') ? '' : (editing.image_url || '')}
                    onChange={(e) => setEditing((s) => ({ ...s, image_url: e.target.value }))}
                    className="flex-1 h-10 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300"
                    placeholder="Or paste image URL..."
                    disabled={editing.image_url?.startsWith('data:')}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-600 mb-2">Gallery Thumbnails (Vertical List)</label>
                <div className="grid md:grid-cols-12 gap-4">
                  <div className="md:col-span-7">
                    <textarea
                      value={editing.gallery || ''}
                      onChange={(e) => setEditing((s) => ({ ...s, gallery: e.target.value }))}
                      rows={4}
                      className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300"
                      placeholder="Paste image URLs (one per line)"
                    />
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => editGalleryInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 bg-slate-50 cursor-pointer hover:bg-white transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Upload gallery images
                      </button>
                      <input
                        ref={editGalleryInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleEditGalleryUpload}
                        className="hidden"
                      />
                      <span className="text-xs text-slate-500">Uploads are stored on the server.</span>
                    </div>
                    {editGalleryError && (
                      <div className="mt-2 text-xs text-red-600">{editGalleryError}</div>
                    )}
                  </div>
                  <div className="md:col-span-5">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3">
                      <p className="text-xs font-semibold text-slate-600 mb-2">Preview (Vertical)</p>
                      <div className="max-h-40 overflow-y-auto overflow-x-hidden space-y-2 scrollbar-hide">
                        {parseGallery(editing.gallery).length === 0 ? (
                          <p className="text-xs text-slate-400">No thumbnails yet</p>
                        ) : (
                          parseGallery(editing.gallery).map((url, idx) => (
                            <div key={`${url}-${idx}`} className="flex items-center gap-2">
                              <div className="w-12 h-12 rounded-lg border border-slate-200 bg-white overflow-hidden">
                                <img src={resolveImageUrl(url)} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                              </div>
                              <p className="text-xs text-slate-500 truncate">{url}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setEditing((s) => ({ ...s, is_active: !s.is_active }))}
                  className="relative inline-flex h-9 w-16 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-slate-300 dark:focus:ring-slate-600 dark:focus:ring-offset-slate-900"
                  style={{ backgroundColor: editing.is_active ? (mode === 'dark' ? '#3b82f6' : '#2563eb') : (mode === 'dark' ? '#334155' : '#e2e8f0') }}
                >
                  <span
                    className="inline-block h-7 w-7 rounded-full bg-white shadow-md transform transition-transform duration-300"
                    style={{ transform: editing.is_active ? 'translateX(28px)' : 'translateX(4px)' }}
                  />
                  <span className="sr-only">Toggle active status</span>
                </button>
                <span className="ml-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Active Status</span>
              </div>

              <div className="md:col-span-2 flex gap-3 mt-4">
                <button
                  onClick={() => setEditing(null)}
                  className="flex-1 h-12 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 font-semibold bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm hover:border-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className={`flex-1 h-12 rounded-xl font-semibold shadow-sm transition-all duration-300 ${accentIsWhite ? "border border-slate-300" : ""}`}
                  style={{ backgroundColor: accentColor, color: accentIsWhite ? "#0b0b0f" : "#FFFFFF" }}
                >
                  Save Changes
                </button>
              </div>
            </div>

            {/* Product Detail Settings Section */}
            <div className="md:col-span-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Product Detail Settings
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Product Type</label>
                  <select
                    value={editProductType}
                    onChange={(e) => setEditProductType(e.target.value)}
                    className="w-full h-10 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300"
                  >
                    {PRODUCT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                {/* Model Info */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Model Info</label>
                  <input
                    value={editing.model_info || ''}
                    onChange={(e) => setEditing((s) => ({ ...s, model_info: e.target.value }))}
                    className="w-full h-10 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300"
                    placeholder="Model is 161cm tall / 43kg, wearing size XS"
                  />
                </div>

                {/* Colors */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Available Colors</label>
                  <input
                    value={typeof editing.colors === 'string' ? editing.colors : (editing.colors?.join(', ') || '')}
                    onChange={(e) => setEditing((s) => ({ ...s, colors: e.target.value }))}
                    className="w-full h-10 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300"
                    placeholder="Black, White, Red"
                  />
                </div>

                {/* Sizes */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Available Sizes</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {editSizeOptions.length === 0 && (
                      <span className="text-xs text-slate-400">No presets for this type. Add custom sizes.</span>
                    )}
                    {editSizeOptions.map((size) => (
                      <label
                        key={size}
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition ${(editing.sizes || []).includes(size)
                          ? "border-slate-300 bg-slate-50 text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={(editing.sizes || []).includes(size)}
                          onChange={() =>
                            setEditing((s) => ({
                              ...s,
                              sizes: (s.sizes || []).includes(size)
                                ? s.sizes.filter((v) => v !== size)
                                : [...(s.sizes || []), size],
                            }))
                          }
                          className="h-4 w-4"
                        />
                        {size}
                      </label>
                    ))}
                  </div>
                  {Array.isArray(editing.sizes) && editing.sizes.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {editing.sizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() =>
                            setEditing((s) => ({
                              ...s,
                              sizes: s.sizes.filter((v) => v !== size),
                            }))
                          }
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border"
                          style={{ backgroundColor: accentIsWhite ? '#0b0b0f' : accentColor, color: '#FFFFFF', borderColor: 'transparent' }}
                          title="Remove"
                        >
                          {size}
                          <span>×</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      value={editCustomSize}
                      onChange={(e) => setEditCustomSize(e.target.value)}
                      placeholder="Add custom size (e.g., XXXL)"
                      className="h-10 flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const value = editCustomSize.trim();
                          if (!value) return;
                          setEditing((s) => ({
                            ...s,
                            sizes: (s.sizes || []).includes(value) ? s.sizes : [...(s.sizes || []), value],
                          }));
                          setEditCustomSize("");
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const value = editCustomSize.trim();
                        if (!value) return;
                        setEditing((s) => ({
                          ...s,
                          sizes: (s.sizes || []).includes(value) ? s.sizes : [...(s.sizes || []), value],
                        }));
                        setEditCustomSize("");
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold ${accentIsWhite ? "border border-slate-300" : ""}`}
                      style={{ backgroundColor: accentColor, color: accentIsWhite ? "#0b0b0f" : "#FFFFFF" }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Size Guide */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Size Guide</label>
                  <input
                    value={editing.size_guide || ''}
                    onChange={(e) => setEditing((s) => ({ ...s, size_guide: e.target.value }))}
                    className="w-full h-10 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300"
                    placeholder="Size guide text or URL"
                  />
                </div>

                {/* Delivery Info */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Delivery Info</label>
                  <input
                    value={editing.delivery_info || ''}
                    onChange={(e) => setEditing((s) => ({ ...s, delivery_info: e.target.value }))}
                    className="w-full h-10 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300"
                    placeholder="From 1 - 3 days"
                  />
                </div>

                {/* Support Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Support Hotline</label>
                  <input
                    value={editing.support_phone || ''}
                    onChange={(e) => setEditing((s) => ({ ...s, support_phone: e.target.value }))}
                    className="w-full h-10 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300"
                    placeholder="+855 12 345 678"
                  />
                </div>

                {/* Payment Methods */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2">Payment Methods</label>
                  <input
                    value={typeof editing.payment_methods === 'string' ? editing.payment_methods : (editing.payment_methods?.join(', ') || '')}
                    onChange={(e) => setEditing((s) => ({ ...s, payment_methods: e.target.value }))}
                    className="w-full h-10 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500 dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all duration-300"
                    placeholder="Cash, ABA, Wing, Credit Card"
                  />
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes modal-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modal-in {
          animation: modal-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

