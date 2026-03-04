import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../state/auth.jsx";
import { useCart } from "../state/cart.jsx";
import api from "../lib/api.js";
import { resolveImageUrl } from "../lib/images";
import { Edit, MapPin, Phone, Mail, Heart, ShoppingBag, LogOut, Save, X, Upload, Package, Truck, CheckCircle, ShoppingCart } from "lucide-react";
import { useLanguage } from "../lib/i18n.jsx";
import Swal, { errorAlert, loadingAlert, toastSuccess, warningConfirm } from "../lib/swal";

const createEmptyAddress = () => ({
  label: "Home",
  receiver_name: "",
  receiver_phone: "",
  house_no: "",
  street_no: "",
  sangkat: "",
  khan: "",
  province: "",
  landmark: "",
  latitude: "",
  longitude: "",
  is_default: false,
});

export default function CustomerProfile() {
  const { user, logout } = useAuth();
  const { add: addItem } = useCart();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLanguage();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [replacementCases, setReplacementCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reordering, setReordering] = useState(null);
  const validTabs = ["info", "orders", "replacements", "addresses", "track", "settings"];
  const initialTab = validTabs.includes(searchParams.get("tab"))
    ? searchParams.get("tab")
    : "info";
  const [activeTab, setActiveTab] = useState(initialTab); // info, orders, addresses, track, settings
  const [editForm, setEditForm] = useState({});
  const [trackOrderId, setTrackOrderId] = useState("");
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackError, setTrackError] = useState("");
  const [trackLoading, setTrackLoading] = useState(false);
  const [newAddress, setNewAddress] = useState(createEmptyAddress());
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [editAddressForm, setEditAddressForm] = useState(null);
  const [addressSubmitting, setAddressSubmitting] = useState(false);
  const [addressEditSubmitting, setAddressEditSubmitting] = useState(false);
  const [showReplacementForm, setShowReplacementForm] = useState(false);
  const [replacementOrderId, setReplacementOrderId] = useState(null);
  const [replacementReason, setReplacementReason] = useState("");
  const [replacementNotes, setReplacementNotes] = useState("");
  const [replacementSubmitting, setReplacementSubmitting] = useState(false);
  const [showEditReplacementForm, setShowEditReplacementForm] = useState(false);
  const [editingReplacementId, setEditingReplacementId] = useState(null);
  const [editingReplacementReason, setEditingReplacementReason] = useState("");
  const [editingReplacementNotes, setEditingReplacementNotes] = useState("");
  const [editingReplacementSubmitting, setEditingReplacementSubmitting] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const PROFILE_SUCCESS_MESSAGE = "ព័ត៌មានត្រូវបានរក្សាទុកដោយជោគជ័យ! (Profile updated successfully!)";
  const GENERIC_ERROR_MESSAGE = "មានបញ្ហាបច្ចេកទេស! សូមព្យាយាមម្តងទៀត (Update failed! Please try again)";

  const showSuccess = (title, text) =>
    toastSuccess({
      khTitle: title,
      enTitle: "Success",
      khText: text,
      enText: text,
    });

  const showError = (detailText) =>
    errorAlert({
      khTitle: "មានបញ្ហាបច្ចេកទេស",
      enTitle: "Something went wrong",
      khText: GENERIC_ERROR_MESSAGE,
      enText: "Update failed! Please try again",
      detail: detailText,
    });

  const showWarningConfirm = (title, text) =>
    warningConfirm({
      khTitle: title,
      enTitle: title,
      khText: text,
      enText: text,
    });

  // Redirect admin/superadmin to admin dashboard
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
      navigate('/admin');
    }
  }, [user, navigate]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && validTabs.includes(tab) && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab, validTabs]);

  const setTab = (tab) => {
    const nextTab = validTabs.includes(tab) ? tab : "info";
    setActiveTab(nextTab);
    const next = new URLSearchParams(searchParams);
    next.set("tab", nextTab);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [profileRes, ordersRes, addressRes, replacementRes] = await Promise.all([
        api.get("/user/profile"),
        api.get("/user/orders"),
        api.get("/user/addresses"),
        api.get("/replacement-cases"),
      ]);

      setProfile(profileRes.data);
      setOrders(ordersRes.data?.data || []);
      setAddresses(addressRes.data?.data || []);
      setReplacementCases(replacementRes.data?.data?.data || replacementRes.data?.data || []);
      setEditForm(profileRes.data);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const { data } = await api.get("/auth/sessions");
      setSessions(data?.data || []);
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setSessionsLoading(false);
    }
  };

  const revokeSession = async (sessionId) => {
    const confirmation = await showWarningConfirm(
      "Logout Session",
      "Are you sure you want to log out this session?"
    );
    if (!confirmation.isConfirmed) return;

    try {
      const { data } = await api.delete(`/auth/sessions/${sessionId}`);
      if (data?.current_session_revoked) {
        await logout();
        navigate('/login');
        return;
      }
      await loadSessions();
      await showSuccess("Success", "Session logged out successfully.");
    } catch (error) {
      await showError(error?.response?.data?.message || "Failed to revoke session.");
    }
  };

  useEffect(() => {
    if (!replacementCases.length) return;
    const approved = replacementCases.filter((c) => c.status === "approved");
    if (!approved.length) return;
    const lastSeen = Number(localStorage.getItem("replacement-approved-seen") || 0);
    const newestApproved = Math.max(...approved.map((c) => Number(c.id) || 0));
    if (newestApproved > lastSeen) {
      Swal.fire({
        icon: "success",
        title: t('replacementApproved') || "Your replacement request was approved.",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      localStorage.setItem("replacement-approved-seen", String(newestApproved));
    }
  }, [replacementCases, t]);

  useEffect(() => {
    if (activeTab === "settings") {
      loadSessions();
    }
  }, [activeTab]);

  const handleSaveProfile = async () => {
    try {
      await api.put("/user/profile", editForm);
      setProfile(editForm);
      setEditing(false);
      await showSuccess(PROFILE_SUCCESS_MESSAGE, undefined);
    } catch (error) {
      console.error("Error updating profile:", error);
      await showError();
    }
  };

  const handleAddAddress = async () => {
    if (addressSubmitting) return;

    const requiredFields = {
      label: "Label",
      receiver_name: "Receiver Name",
      receiver_phone: "Receiver Phone",
      house_no: "ផ្ទះលេខ / House No.",
      street_no: "ផ្លូវ / Street",
      sangkat: "សង្កាត់/ឃុំ / Sangkat",
      khan: "ខណ្ឌ/ស្រុក / District",
      province: "រាជធានី/ខេត្ត / Province",
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key]) => !String(newAddress[key] ?? "").trim())
      .map(([, label]) => label);

    if (missingFields.length) {
      await errorAlert({
        khTitle: "ទិន្នន័យមិនគ្រប់",
        enTitle: "Incomplete form",
        khText: "សូមបំពេញព័ត៌មានឲ្យគ្រប់",
        enText: "Please complete all required fields",
        detail: missingFields.join(", "),
      });
      return;
    }

    setAddressSubmitting(true);
    loadingAlert({
      khTitle: "កំពុងរក្សាទុកអាសយដ្ឋាន",
      enTitle: "Saving address",
      khText: "សូមរង់ចាំបន្តិច",
      enText: "Please wait",
    });

    try {
      const response = await api.post("/user/addresses", newAddress);
      if (![200, 201].includes(response?.status)) {
        throw new Error("Save failed.");
      }

      Swal.close();
      await loadProfile();
      setNewAddress(createEmptyAddress());
      await toastSuccess({
        khText: "បានរក្សាទុកអាសយដ្ឋានដោយជោគជ័យ",
        enText: "Address saved successfully",
      });
    } catch (error) {
      Swal.close();
      console.error("Error adding address:", error);
      const serverErrors = error.response?.data?.errors;
      const messages = serverErrors
        ? Object.values(serverErrors).flat().join("\n")
        : error.response?.data?.message || error.message;
      await errorAlert({
        khTitle: "មិនអាចរក្សាទុកអាសយដ្ឋាន",
        enTitle: "Failed to save address",
        khText: "សូមពិនិត្យព័ត៌មានបញ្ចូលម្ដងទៀត",
        enText: "Please check your input and try again",
        detail: messages || "Failed to add address",
      });
    } finally {
      Swal.close();
      setAddressSubmitting(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    const confirmation = await showWarningConfirm(
      "Delete Address",
      "Are you sure you want to delete this address?"
    );
    if (!confirmation.isConfirmed) return;

    try {
      await api.delete(`/user/addresses/${addressId}`);
      loadProfile();
      await showSuccess("Success", "Address deleted successfully!");
    } catch (error) {
      console.error("Error deleting address:", error);
      await showError("Failed to delete address");
    }
  };

  const startEditAddress = (address) => {
    setEditingAddressId(address.id);
    setEditAddressForm({
      label: address.label || "Home",
      receiver_name: address.receiver_name || "",
      receiver_phone: address.receiver_phone || "",
      house_no: address.house_no || "",
      street_no: address.street_no || "",
      sangkat: address.sangkat || "",
      khan: address.khan || "",
      province: address.province || "",
      landmark: address.landmark || "",
      latitude: address.latitude ?? "",
      longitude: address.longitude ?? "",
      is_default: !!address.is_default,
    });
  };

  const cancelEditAddress = () => {
    setEditingAddressId(null);
    setEditAddressForm(null);
  };

  const saveEditAddress = async (addressId) => {
    if (!editAddressForm || addressEditSubmitting) return;

    const requiredFields = {
      house_no: "ផ្ទះលេខ / House No.",
      street_no: "ផ្លូវ / Street",
      sangkat: "សង្កាត់/ឃុំ / Sangkat",
      khan: "ខណ្ឌ/ស្រុក / District",
      province: "រាជធានី/ខេត្ត / Province",
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key]) => !String(editAddressForm[key] ?? "").trim())
      .map(([, label]) => label);

    if (missingFields.length) {
      await errorAlert({
        khTitle: "ទិន្នន័យមិនគ្រប់",
        enTitle: "Incomplete form",
        khText: "សូមបំពេញព័ត៌មានឲ្យគ្រប់",
        enText: "Please complete all required fields",
        detail: missingFields.join(", "),
      });
      return;
    }

    setAddressEditSubmitting(true);
    loadingAlert({
      khTitle: "កំពុងកែប្រែអាសយដ្ឋាន",
      enTitle: "Updating address",
      khText: "សូមរង់ចាំបន្តិច",
      enText: "Please wait",
    });

    try {
      const response = await api.put(`/user/addresses/${addressId}`, editAddressForm);
      if (![200, 201].includes(response?.status)) {
        throw new Error("Update failed.");
      }
      Swal.close();
      await loadProfile();
      cancelEditAddress();
      await toastSuccess({
        khText: "បានកែប្រែអាសយដ្ឋានដោយជោគជ័យ",
        enText: "Address updated successfully",
      });
    } catch (error) {
      Swal.close();
      console.error("Error updating address:", error);
      const serverErrors = error.response?.data?.errors;
      const messages = serverErrors
        ? Object.values(serverErrors).flat().join("\n")
        : error?.response?.data?.message || "Failed to update address";
      await errorAlert({
        khTitle: "មិនអាចកែប្រែអាសយដ្ឋាន",
        enTitle: "Failed to update address",
        khText: "សូមពិនិត្យព័ត៌មានបញ្ចូលម្ដងទៀត",
        enText: "Please check your input and try again",
        detail: messages,
      });
    } finally {
      Swal.close();
      setAddressEditSubmitting(false);
    }
  };

  const setAsDefaultAddress = async (addressId) => {
    try {
      await api.put(`/user/addresses/${addressId}`, { is_default: true });
      await loadProfile();
      await showSuccess("Success", "Default address updated successfully!");
    } catch (error) {
      console.error("Error setting default address:", error);
      await showError(error?.response?.data?.message || "Failed to set default address");
    }
  };

  const fillCurrentLocation = (onResolved) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      showError("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onResolved(position.coords.latitude, position.coords.longitude);
      },
      () => {
        showError("Unable to fetch your current location.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      await showError('Please upload a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      await showError('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profile_image', file);
      const response = await api.post('/user/profile/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Update both paths and URL
      setProfile({
        ...profile,
        profile_image_path: response.data.profile_image_path,
        profile_image_url: response.data.profile_image_url
      });
      // Also reload profile to ensure header image is updated
      loadProfile();
      await showSuccess("Success", "Profile image updated successfully!");
    } catch (error) {
      console.error('Error uploading image:', error);
      await showError(error?.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const requestReplacement = (orderId) => {
    setReplacementOrderId(orderId);
    setReplacementReason("");
    setReplacementNotes("");
    setShowReplacementForm(true);
  };

  const orderAgain = async (order) => {
    const items = order.items || [];
    if (items.length === 0) {
      await showError(t('orderHasNoItems') || "This order has no items to reorder");
      return;
    }

    setReordering(order.id);
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
          await showSuccess("Success", t('someItemsAddedToCart') || `${addedCount} item(s) added to cart. ${failedItems.length} item(s) are no longer available.`);
        } else {
          await showSuccess("Success", t('allItemsAddedToCart') || `All ${addedCount} item(s) added to cart successfully!`);
        }
      } else {
        await showError(t('itemsNotAvailable') || "These items are no longer available. Click on product images to see current products.");
      }
    } catch (e) {
      await showError(t('orderAgainFailed') || "Failed to add items to cart");
    } finally {
      setReordering(null);
    }
  };

  const submitReplacement = async () => {
    if (!replacementOrderId) return;
    if (!replacementReason.trim()) {
      await showError(t('replacementReasonPrompt') || "Why do you need a replacement?");
      return;
    }
    setReplacementSubmitting(true);
    try {
      await api.post("/replacement-cases", {
        order_id: replacementOrderId,
        reason: replacementReason.trim(),
        notes: replacementNotes.trim() ? replacementNotes.trim() : null,
      });
      await showSuccess("Success", t('replacementSubmitted') || "Replacement request submitted.");
      setShowReplacementForm(false);
    } catch (error) {
      await showError(error?.response?.data?.message || "Failed to submit replacement request");
    } finally {
      setReplacementSubmitting(false);
    }
  };

  const handleLogoutClick = async () => {
    const confirmation = await showWarningConfirm(
      "Logout",
      "Are you sure you want to log out?"
    );
    if (!confirmation.isConfirmed) return;

    await logout();
  };

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    const trimmedId = trackOrderId.trim();

    if (!trimmedId) {
      setTrackError('Please enter an order ID');
      return;
    }

    setTrackLoading(true);
    setTrackError('');
    setTrackedOrder(null);

    try {
      const { data } = await api.get(`/orders/${trimmedId}/track`);
      setTrackedOrder(data.order);
    } catch (error) {
      setTrackError(error.response?.data?.message || 'Order not found. Please check your order ID.');
    } finally {
      setTrackLoading(false);
    }
  };

  const getStatusStep = (status) => {
    const steps = { pending: 0, confirmed: 1, processing: 2, shipped: 3, delivered: 4 };
    return steps[status?.toLowerCase()] || 0;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      processing: 'bg-indigo-500',
      shipped: 'bg-purple-500',
      delivered: 'bg-emerald-500',
    };
    return colors[status?.toLowerCase()] || 'bg-gray-500';
  };

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'delivered') return <CheckCircle className="w-5 h-5" />;
    if (statusLower === 'shipped') return <Truck className="w-5 h-5" />;
    if (statusLower === 'processing') return <Package className="w-5 h-5" />;
    return <ShoppingBag className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="container-safe py-20">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-safe py-20 text-center">
        <p className="text-lg text-gray-600">Please log in to view your profile</p>
      </div>
    );
  }

  return (
    <>
      <div className="container-safe py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 text-white mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 w-full sm:w-auto">
              <div className="relative group flex-shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                  {profile?.profile_image_url || profile?.profile_image_path ? (
                    <img
                      src={resolveImageUrl(profile.profile_image_url || profile.profile_image_path)}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl sm:text-3xl font-black">{user.name?.charAt(0) || "U"}</span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 p-1.5 sm:p-2 rounded-full transition-all shadow-lg"
                  title="Change profile picture"
                >
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                  className="hidden"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black truncate">{user.name}</h1>
                <p className="text-blue-100 text-sm sm:text-base truncate">{user.email}</p>
                <p className="text-xs sm:text-sm text-blue-200 mt-1 sm:mt-2">Member since {new Date(user.created_at).getFullYear()}</p>
              </div>
            </div>
            <button
              onClick={handleLogoutClick}
              className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-all w-full sm:w-auto text-sm sm:text-base"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Main Container with Responsive Layout */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Sidebar - Tabs (Horizontal on mobile, Vertical on desktop) */}
          <div className="w-full lg:w-64 lg:flex-shrink-0">
            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden">
              {/* Mobile: Horizontal scrollable tabs */}
              <div className="lg:hidden overflow-x-auto">
                <div className="flex gap-2 p-2">
                  {[
                    { id: "info", label: "Info", icon: "user" },
                    { id: "orders", label: "Orders", icon: "bag" },
                    { id: "replacements", label: "Replacements", icon: "swap" },
                    { id: "addresses", label: "Addresses", icon: "map" },
                    { id: "track", label: "Track", icon: "truck" },
                    { id: "settings", label: "Settings", icon: "gear" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setTab(tab.id)}
                      className={`whitespace-nowrap px-4 py-2 rounded-lg font-semibold text-sm transition-all ${activeTab === tab.id
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 bg-gray-100 hover:bg-gray-200"
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop: Vertical tabs */}
              <div className="hidden lg:block">
                {[
                  { id: "info", label: "Personal Info", icon: "user" },
                  { id: "orders", label: "Order History", icon: "bag" },
                  { id: "replacements", label: "Replacement History", icon: "swap" },
                  { id: "addresses", label: "Addresses", icon: "map" },
                  { id: "track", label: "Track Order", icon: "truck" },
                  { id: "settings", label: "Settings", icon: "gear" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setTab(tab.id)}
                    className={`w-full px-6 py-4 font-semibold transition-all text-left border-l-4 ${activeTab === tab.id
                      ? "bg-blue-50 text-blue-600 border-blue-600"
                      : "text-gray-700 hover:bg-gray-50 border-transparent hover:border-gray-300"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {activeTab === "info" && (
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-200">
                {!editing ? (
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <h2 className="text-xl sm:text-2xl font-black">Personal Information</h2>
                      <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-all text-sm sm:text-base w-full sm:w-auto justify-center"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">Full Name</label>
                        <p className="text-lg text-gray-900">{profile?.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">Email</label>
                        <p className="text-lg text-gray-900 flex items-center gap-2">
                          <Mail className="w-4 h-4" /> {profile?.email}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">Phone</label>
                        <p className="text-lg text-gray-900 flex items-center gap-2">
                          <Phone className="w-4 h-4" /> {profile?.phone || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">Status</label>
                        <p className="text-lg text-gray-900 capitalize">
                          <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
                            {profile?.is_active ? "Active" : "Inactive"}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
                      <div className="text-center">
                        <p className="text-2xl sm:text-3xl font-black text-blue-600">{orders.length}</p>
                        <p className="text-xs sm:text-sm text-gray-600">Total Orders</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl sm:text-3xl font-black text-blue-600">{addresses.length}</p>
                        <p className="text-xs sm:text-sm text-gray-600">Saved Addresses</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl sm:text-3xl font-black text-blue-600">🏆</p>
                        <p className="text-xs sm:text-sm text-gray-600">Customer</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-4 sm:mb-6">
                      <h2 className="text-xl sm:text-2xl font-black">Edit Profile</h2>
                      <button
                        onClick={() => setEditing(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                    </div>

                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                        <input
                          type="text"
                          value={editForm.name || ""}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={editForm.email || ""}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={editForm.phone || ""}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
                        <button
                          onClick={handleSaveProfile}
                          className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 sm:py-2 rounded-lg transition-all text-sm sm:text-base"
                        >
                          <Save className="w-4 h-4" />
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditing(false)}
                          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2.5 sm:py-2 rounded-lg transition-all text-sm sm:text-base"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "orders" && (
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-200">
                <h2 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                  Order History
                </h2>

                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No orders yet</p>
                    <p className="text-gray-500">Start shopping to see your order history here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-lg">Order #{order.id}</h3>
                            <p className="text-sm text-gray-600">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-gray-600">{order.items?.length || order.items_count || 0} items</p>
                          </div>
                          <p className="text-lg font-bold text-gray-900">${order.total}</p>
                        </div>
                        {order.items?.length ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {order.items.slice(0, 6).map((item) => (
                              <Link
                                key={item.id}
                                to={item.product?.slug ? `/p/${item.product.slug}` : '#'}
                                state={{ fromOrder: true, orderItem: item }}
                                className="h-12 w-12 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 hover:ring-2 hover:ring-emerald-500 transition-all"
                                title={item.product?.name || item.name || "View product"}
                              >
                                <img
                                  src={resolveImageUrl(item.product?.image_url)}
                                  alt={item.product?.name || item.name || ""}
                                  onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                                  className="w-full h-full object-cover"
                                />
                              </Link>
                            ))}
                          </div>
                        ) : null}
                        <div className="mt-4 flex flex-wrap gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => orderAgain(order)}
                            disabled={reordering === order.id || !order.items?.length}
                            className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title={!order.items?.length ? "This order has no items" : ""}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            {reordering === order.id ? (t('adding') || "Adding...") : (t('orderAgain') || "Order Again")}
                          </button>
                          <button
                            type="button"
                            onClick={() => requestReplacement(order.id)}
                            className="text-xs font-semibold px-4 py-2 rounded-full border border-gray-200 hover:bg-gray-50"
                          >
                            {t('requestReplacement') || "Request Replacement"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "replacements" && (
              <div className="bg-white rounded-2xl p-8 border border-gray-200">
                <h2 className="text-2xl font-black mb-6">{t('replacementHistory') || "Replacement History"}</h2>

                {replacementCases.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-600 text-lg">{t('noReplacementCases') || "No replacement requests yet"}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {replacementCases.map((c) => (
                      <div key={c.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold text-lg">#{c.id}</h3>
                            <p className="text-sm text-gray-600">{t('orderNumber') || "Order #"} {c.order_id}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${c.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                            c.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              c.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                                'bg-yellow-100 text-yellow-700'
                            }`}>
                            {c.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{c.reason}</p>
                        {c.notes && (
                          <p className="text-sm text-gray-500 mt-2">{c.notes}</p>
                        )}
                        {c.order?.items?.length ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {c.order.items.slice(0, 6).map((item) => (
                              <div key={item.id} className="h-12 w-12 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                                <img
                                  src={resolveImageUrl(item.product?.image_url)}
                                  alt={item.product?.name || item.name || ""}
                                  onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "addresses" && (
              <div className="bg-white rounded-2xl p-8 border border-gray-200">
                <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
                  <MapPin className="w-6 h-6" />
                  Saved Addresses
                </h2>

                {/* Existing Addresses */}
                {addresses.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {addresses.map((addr) => (
                      <div key={addr.id} className={`border-2 rounded-lg p-6 ${addr.is_default ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                        {addr.is_default && (
                          <span className="inline-block bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded mb-3">
                            DEFAULT
                          </span>
                        )}
                        {editingAddressId === addr.id && editAddressForm ? (
                          <div className="space-y-3">
                            <select
                              value={editAddressForm.label}
                              onChange={(e) => setEditAddressForm({ ...editAddressForm, label: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            >
                              <option value="Home">Home</option>
                              <option value="Work">Work</option>
                              <option value="Other">Other</option>
                            </select>
                            <input type="text" placeholder="Receiver Name" value={editAddressForm.receiver_name} onChange={(e) => setEditAddressForm({ ...editAddressForm, receiver_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                            <input type="text" placeholder="Receiver Phone" value={editAddressForm.receiver_phone} onChange={(e) => setEditAddressForm({ ...editAddressForm, receiver_phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                            <input type="text" placeholder="ផ្ទះលេខ (House No.) - Ex: 12" value={editAddressForm.house_no} onChange={(e) => setEditAddressForm({ ...editAddressForm, house_no: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                            <input type="text" placeholder="ផ្លូវ (Street) - Ex: 456" value={editAddressForm.street_no} onChange={(e) => setEditAddressForm({ ...editAddressForm, street_no: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                            <div className="grid grid-cols-2 gap-2">
                              <input type="text" placeholder="សង្កាត់/ឃុំ - Ex: ទឹកល្អក់ ៣" value={editAddressForm.sangkat} onChange={(e) => setEditAddressForm({ ...editAddressForm, sangkat: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg" />
                              <input type="text" placeholder="ខណ្ឌ/ស្រុក - Ex: ទួលគោក" value={editAddressForm.khan} onChange={(e) => setEditAddressForm({ ...editAddressForm, khan: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg" />
                              <input type="text" placeholder="រាជធានី/ខេត្ត - Ex: ភ្នំពេញ" value={editAddressForm.province} onChange={(e) => setEditAddressForm({ ...editAddressForm, province: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg col-span-2" />
                            </div>
                            <textarea placeholder="ចំណុចសម្គាល់ - Ex: ទល់មុខពេទ្យលោកសង្ឃ" value={editAddressForm.landmark} onChange={(e) => setEditAddressForm({ ...editAddressForm, landmark: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={2} />
                            <div className="grid grid-cols-2 gap-2">
                              <input type="number" step="0.000001" placeholder="Latitude" value={editAddressForm.latitude} onChange={(e) => setEditAddressForm({ ...editAddressForm, latitude: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg" />
                              <input type="number" step="0.000001" placeholder="Longitude" value={editAddressForm.longitude} onChange={(e) => setEditAddressForm({ ...editAddressForm, longitude: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg" />
                            </div>
                            <button
                              type="button"
                              onClick={() => fillCurrentLocation((latitude, longitude) => setEditAddressForm((s) => ({ ...s, latitude: String(latitude), longitude: String(longitude) })))}
                              className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                            >
                              Use Current Location
                            </button>
                            <div className="flex items-center gap-2">
                              <button onClick={() => saveEditAddress(addr.id)} disabled={addressEditSubmitting} className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed">{addressEditSubmitting ? "Saving..." : "Save"}</button>
                              <button onClick={cancelEditAddress} disabled={addressEditSubmitting} className="px-3 py-1.5 rounded border border-gray-300 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="font-bold text-lg mb-1">{addr.label}</p>
                            <p className="text-gray-700 text-sm mb-1"><span className="font-semibold">Receiver:</span> {addr.receiver_name || "-"}</p>
                            <p className="text-gray-700 text-sm mb-1"><span className="font-semibold">Phone:</span> {addr.receiver_phone || "-"}</p>
                            <p className="text-gray-700 text-sm mb-1">{addr.formatted_address || [addr.street, addr.city, addr.state, addr.zip, addr.country].filter(Boolean).join(", ")}</p>
                            {(addr.latitude && addr.longitude) ? (
                              <a
                                href={`https://www.google.com/maps?q=${addr.latitude},${addr.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                              >
                                View Pin ({Number(addr.latitude).toFixed(4)}, {Number(addr.longitude).toFixed(4)})
                              </a>
                            ) : null}
                            <div className="mt-4 flex flex-wrap gap-3">
                              {!addr.is_default && (
                                <button onClick={() => setAsDefaultAddress(addr.id)} className="text-blue-600 hover:text-blue-700 text-sm font-semibold">Set as Default</button>
                              )}
                              <button onClick={() => startEditAddress(addr)} className="text-slate-700 hover:text-slate-900 text-sm font-semibold">Edit</button>
                              <button onClick={() => handleDeleteAddress(addr.id)} className="text-red-600 hover:text-red-700 text-sm font-semibold">Delete</button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Address */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-4">Add New Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select
                      value={newAddress.label}
                      onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="Home">Home</option>
                      <option value="Work">Work</option>
                      <option value="Other">Other</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Receiver Name"
                      value={newAddress.receiver_name}
                      onChange={(e) => setNewAddress({ ...newAddress, receiver_name: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Receiver Phone"
                      value={newAddress.receiver_phone}
                      onChange={(e) => setNewAddress({ ...newAddress, receiver_phone: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="ផ្ទះលេខ (House No.) - Ex: 12"
                      value={newAddress.house_no}
                      onChange={(e) => setNewAddress({ ...newAddress, house_no: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="ផ្លូវ (Street) - Ex: 456"
                      value={newAddress.street_no}
                      onChange={(e) => setNewAddress({ ...newAddress, street_no: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="សង្កាត់/ឃុំ (Sangkat) - Ex: ទឹកល្អក់ ៣"
                      value={newAddress.sangkat}
                      onChange={(e) => setNewAddress({ ...newAddress, sangkat: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="ខណ្ឌ/ស្រុក (District) - Ex: ទួលគោក"
                      value={newAddress.khan}
                      onChange={(e) => setNewAddress({ ...newAddress, khan: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="រាជធានី/ខេត្ត (Province) - Ex: ភ្នំពេញ"
                      value={newAddress.province}
                      onChange={(e) => setNewAddress({ ...newAddress, province: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <textarea
                      placeholder="ចំណុចសម្គាល់ (Landmark) - Ex: ទល់មុខពេទ្យលោកសង្ឃ"
                      value={newAddress.landmark}
                      onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                      className="md:col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      rows={2}
                    />
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="Latitude (optional)"
                      value={newAddress.latitude}
                      onChange={(e) => setNewAddress({ ...newAddress, latitude: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="Longitude (optional)"
                      value={newAddress.longitude}
                      onChange={(e) => setNewAddress({ ...newAddress, longitude: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => fillCurrentLocation((latitude, longitude) => setNewAddress((s) => ({ ...s, latitude: String(latitude), longitude: String(longitude) })))}
                      className="md:col-span-2 justify-self-start text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Use Current Location (Map Pin)
                    </button>
                    <label className="col-span-1 md:col-span-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newAddress.is_default}
                        onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-700">Set as default address</span>
                    </label>
                  </div>
                  <button
                    onClick={handleAddAddress}
                    disabled={addressSubmitting}
                    className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {addressSubmitting ? "Saving..." : "Add Address"}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="bg-white rounded-2xl p-8 border border-gray-200">
                <h2 className="text-2xl font-black mb-6">Account Settings</h2>

                <div className="space-y-6">
                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="font-bold text-lg mb-2">Email Notifications</h3>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                      <span className="text-gray-700">Order updates and notifications</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer mt-3">
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                      <span className="text-gray-700">Promotional emails and offers</span>
                    </label>
                  </div>

                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="font-bold text-lg mb-2">Privacy</h3>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                      <span className="text-gray-700">Show my profile to other customers</span>
                    </label>
                  </div>

                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="font-bold text-lg mb-2">Active Sessions</h3>
                    <p className="text-gray-600 text-sm mb-4">Trusted devices currently logged in to your account.</p>
                    {sessionsLoading ? (
                      <p className="text-sm text-gray-500">Loading sessions...</p>
                    ) : sessions.length === 0 ? (
                      <p className="text-sm text-gray-500">No active sessions found.</p>
                    ) : (
                      <div className="space-y-3">
                        {sessions.map((session) => (
                          <div key={session.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-gray-800">{session.device_name || "Unknown device"}</p>
                                <p className="text-xs text-gray-600">{session.browser || "Unknown browser"} • {session.os || "Unknown OS"}</p>
                                <p className="text-xs text-gray-500">IP: {session.ip_address || "-"} • Last used: {session.last_used_at || "-"}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {session.is_current ? (
                                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">Current</span>
                                ) : null}
                                <button
                                  onClick={() => revokeSession(session.id)}
                                  className="px-3 py-1.5 rounded-lg border border-red-300 text-xs font-semibold text-red-700 hover:bg-red-50"
                                >
                                  Logout
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-b border-gray-200 pb-6">
                    <h3 className="font-bold text-lg mb-2 text-red-600">Danger Zone</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Deleting your account is permanent and cannot be undone.
                    </p>
                    <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "track" && (
              <div className="bg-white rounded-2xl p-8 border border-gray-200">
                <h2 className="text-2xl font-black mb-6">Track Your Order</h2>

                <form onSubmit={handleTrackOrder} className="mb-8">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Enter your order ID"
                      value={trackOrderId}
                      onChange={(e) => setTrackOrderId(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                      type="submit"
                      disabled={trackLoading}
                      className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-all"
                    >
                      {trackLoading ? "Tracking..." : "Track"}
                    </button>
                  </div>
                </form>

                {trackError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {trackError}
                  </div>
                )}

                {trackedOrder && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="font-bold text-lg mb-4">Order #{trackedOrder.id}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div>
                          <p className="text-sm text-gray-600">Order Date</p>
                          <p className="font-semibold">{new Date(trackedOrder.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total</p>
                          <p className="font-semibold text-lg text-blue-600">${Number(trackedOrder.total || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <p className={`font-semibold capitalize px-3 py-1 rounded-full inline-block text-white ${getStatusColor(trackedOrder.status)}`}>
                            {trackedOrder.status}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Items</p>
                          <p className="font-semibold">{trackedOrder.items?.length || 0} item(s)</p>
                        </div>
                      </div>

                      {/* Progress Timeline */}
                      <div className="mt-8">
                        <h4 className="font-bold mb-4">Tracking Timeline</h4>
                        <div className="relative">
                          <div className="flex flex-col space-y-4">
                            {[
                              { status: 'pending', label: 'Order Placed', icon: <ShoppingBag className="w-5 h-5" /> },
                              { status: 'confirmed', label: 'Confirmed', icon: <CheckCircle className="w-5 h-5" /> },
                              { status: 'processing', label: 'Processing', icon: <Package className="w-5 h-5" /> },
                              { status: 'shipped', label: 'Shipped', icon: <Truck className="w-5 h-5" /> },
                              { status: 'delivered', label: 'Delivered', icon: <CheckCircle className="w-5 h-5" /> },
                            ].map((step, idx) => {
                              const currentStep = getStatusStep(trackedOrder.status);
                              const stepNum = getStatusStep(step.status);
                              const isCompleted = stepNum <= currentStep;
                              const isCurrent = stepNum === currentStep;

                              return (
                                <div key={step.status} className="flex items-center gap-4">
                                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white ${isCompleted ? 'bg-emerald-500' : 'bg-gray-300'
                                    }`}>
                                    {isCompleted ? step.icon : idx + 1}
                                  </div>
                                  <div className="flex-1">
                                    <p className={`font-semibold ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-emerald-600' : 'text-gray-500'}`}>
                                      {step.label}
                                    </p>
                                    {isCurrent && <p className="text-sm text-blue-600">Current status</p>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Items List */}
                    <div>
                      <h4 className="font-bold text-lg mb-4">Items in This Order</h4>
                      <div className="space-y-3">
                        {trackedOrder.items?.map((item) => (
                          <div key={item.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                            <div className="flex-1">
                              <p className="font-semibold">{item.name || item.product_name || "Product"}</p>
                              <p className="text-sm text-gray-600">Qty: {item.quantity ?? item.qty ?? 0}</p>
                            </div>
                            <p className="font-semibold text-lg">${Number(item.subtotal ?? ((item.price ?? 0) * (item.quantity ?? item.qty ?? 0))).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showReplacementForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl w-full max-w-lg p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-bold">
                {t('requestReplacement') || "Request Replacement"}
              </h3>
              <button
                onClick={() => setShowReplacementForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('replacementReasonPrompt') || "Why do you need a replacement?"}
                </label>
                <textarea
                  value={replacementReason}
                  onChange={(e) => setReplacementReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm sm:text-base"
                  placeholder={t('replacementReasonPrompt') || "Why do you need a replacement?"}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('replacementNotesPrompt') || "Any extra details? (optional)"}
                </label>
                <textarea
                  value={replacementNotes}
                  onChange={(e) => setReplacementNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm sm:text-base"
                  placeholder={t('replacementNotesPrompt') || "Any extra details? (optional)"}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowReplacementForm(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm sm:text-base"
              >
                {t('cancel') || "Cancel"}
              </button>
              <button
                type="button"
                onClick={submitReplacement}
                disabled={replacementSubmitting}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-sm sm:text-base"
              >
                {replacementSubmitting ? (t('submitting') || "Submitting...") : (t('submit') || "Submit")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
