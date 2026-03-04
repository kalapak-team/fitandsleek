import React, { useEffect, useState } from "react";
import { useAuth } from "../../state/auth";
import api from "../../lib/api";
import { useTheme } from "../../state/theme.jsx";
import { AdminContentSkeleton } from "@/components/admin/AdminLoading";

export default function Profile() {
  const { user, refresh } = useAuth();
  const { primaryColor, mode } = useTheme();
  const accentColor = mode === "dark" ? "#FFFFFF" : primaryColor;
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const [profileImage, setProfileImage] = useState(user?.profile_image_url || null);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
    });
    setProfileImage(user?.profile_image_url || null);
    setLoading(false);
  }, [user]);

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const { data } = await api.get("/auth/sessions");
      setSessions(data?.data || []);
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to load active sessions");
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "sessions") {
      loadSessions();
    }
  }, [activeTab]);

  const revokeSession = async (sessionId) => {
    try {
      const { data } = await api.delete(`/auth/sessions/${sessionId}`);
      if (data?.current_session_revoked) {
        window.location.href = "/login";
        return;
      }
      await loadSessions();
      setSuccess("Session revoked successfully");
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to revoke session");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErr("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErr("Image size must be less than 5MB");
      return;
    }

    setImageLoading(true);
    setErr("");
    const formData = new FormData();
    formData.append('profile_image', file);

    try {
      const { data } = await api.post("/admin/profile/upload-image", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfileImage(data?.profile_image_url || URL.createObjectURL(file));
      await refresh();
      setSuccess("Profile image updated successfully");
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to upload image");
    } finally {
      setImageLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    setSuccess("");

    try {
      const { data } = await api.put("/admin/profile", form);
      await refresh();
      setSuccess("Profile updated successfully");
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErr("");
    setSuccess("");

    if (passwordForm.password !== passwordForm.password_confirmation) {
      setErr("Passwords do not match");
      setLoading(false);
      return;
    }

    if (passwordForm.password.length < 8) {
      setErr("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      await api.put("/admin/profile/password", {
        current_password: passwordForm.current_password,
        password: passwordForm.password,
      });
      setPasswordForm({ current_password: "", password: "", password_confirmation: "" });
      setSuccess("Password updated successfully");
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <AdminContentSkeleton lines={3} imageHeight={200} className="mt-4" />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl md:text-4xl font-semibold mb-2 flex items-center gap-3"
            style={{ color: mode === "dark" ? "#ffffff" : "#0b0b0f" }}
          >
            <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: accentColor }}>
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: mode === "dark" ? "#0b0b0f" : "#ffffff" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            My Profile
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg">Manage your account settings and preferences</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-emerald-700 dark:text-emerald-400">{success}</span>
            <button onClick={() => setSuccess("")} className="ml-auto text-emerald-400 hover:text-emerald-600">&times;</button>
          </div>
        )}
        {err && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3 animate-shake">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
            </svg>
            <span className="text-red-700 dark:text-red-400">{err}</span>
            <button onClick={() => setErr("")} className="ml-auto text-red-400 hover:text-red-600">&times;</button>
          </div>
        )}

        {/* Profile Card */}
        <div
          className="bg-white border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden mb-6"
          style={{ backgroundColor: mode === "dark" ? "#242323" : undefined }}
        >
          {/* Profile Header */}
          <div className="p-8" style={{ backgroundColor: accentColor }}>
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0).toUpperCase() || "A"
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors shadow-lg">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={imageLoading}
                    className="hidden"
                  />
                  {imageLoading ? (
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: mode === "dark" ? "#ffffff" : "#000000" }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: mode === "dark" ? "#ffffff" : "#000000" }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                  )}
                </label>
              </div>
              <div>
                <h2
                  className="text-2xl font-bold"
                  style={{ color: mode === "dark" ? "#0b0b0f" : "#ffffff" }}
                >
                  {user?.name}
                </h2>
                <p style={{ color: mode === "dark" ? "#0b0b0f" : "#ffffff" }}>{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="px-3 py-1 text-sm rounded-full capitalize"
                    style={{
                      backgroundColor: mode === "dark" ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.9)",
                      color: "#0b0b0f",
                    }}
                  >
                    {user?.role || "Administrator"}
                  </span>
                  <span className="text-sm" style={{ color: mode === "dark" ? "#0b0b0f" : "#ffffff" }}>
                    Since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-700">
            <div className="flex">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex-1 px-6 py-4 font-medium transition-colors ${activeTab === "profile"
                    ? "border-b-2"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                style={activeTab === "profile" ? { color: accentColor, borderBottomColor: accentColor } : undefined}
              >
                Profile Info
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`flex-1 px-6 py-4 font-medium transition-colors ${activeTab === "security"
                    ? "border-b-2"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                style={activeTab === "security" ? { color: accentColor, borderBottomColor: accentColor } : undefined}
              >
                Security
              </button>
              <button
                onClick={() => setActiveTab("sessions")}
                className={`flex-1 px-6 py-4 font-medium transition-colors ${activeTab === "sessions"
                    ? "border-b-2"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                style={activeTab === "sessions" ? { color: accentColor, borderBottomColor: accentColor } : undefined}
              >
                Active Sessions
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === "profile" && (
              <form onSubmit={handleProfileUpdate} className="max-w-xl">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 text-slate-800 dark:text-white outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 text-slate-800 dark:text-white outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 text-slate-800 dark:text-white outline-none transition-all"
                      placeholder="+855 12 345 678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Address
                    </label>
                    <textarea
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      rows={3}
                      className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-3 text-slate-800 dark:text-white outline-none transition-all"
                      placeholder="Your address..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: accentColor,
                      color: accentColor === "#FFFFFF" ? "#0b0b0f" : "#ffffff",
                      border: accentColor === "#FFFFFF" ? "1px solid rgba(15,23,42,0.25)" : "none",
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "security" && (
              <form onSubmit={handlePasswordUpdate} className="max-w-xl">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                      required
                      className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 text-slate-800 dark:text-white outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                      required
                      minLength={8}
                      className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 text-slate-800 dark:text-white outline-none transition-all"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Minimum 8 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.password_confirmation}
                      onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                      required
                      className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 text-slate-800 dark:text-white outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: accentColor,
                      color: accentColor === "#FFFFFF" ? "#0b0b0f" : "#ffffff",
                      border: accentColor === "#FFFFFF" ? "1px solid rgba(15,23,42,0.25)" : "none",
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Updating...
                      </span>
                    ) : (
                      "Update Password"
                    )}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "sessions" && (
              <div className="max-w-3xl">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Trusted Devices</h3>
                {sessionsLoading ? (
                  <p className="text-slate-500 dark:text-slate-400">Loading sessions...</p>
                ) : sessions.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400">No active sessions found.</p>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div key={session.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/40">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-white">{session.device_name || "Unknown device"}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{session.browser || "Unknown browser"} • {session.os || "Unknown OS"}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">IP: {session.ip_address || "-"}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Last used: {session.last_used_at || "-"}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {session.is_current ? (
                              <span
                                className="rounded-full px-2 py-1 text-xs font-semibold"
                                style={{
                                  backgroundColor: mode === "dark" ? "rgba(255,255,255,0.15)" : "rgba(var(--admin-primary-rgb),0.14)",
                                  color: accentColor,
                                }}
                              >
                                Current
                              </span>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => revokeSession(session.id)}
                              className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700"
                              style={{ borderColor: accentColor, color: accentColor }}
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
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
}

