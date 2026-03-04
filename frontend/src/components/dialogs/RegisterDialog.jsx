import React, { useState } from "react";
import { Chrome, Facebook, Lock, User } from "lucide-react";
import { Link } from "react-router-dom";
import { resolveBackendOrigin } from "../../lib/backendOrigin";
import { useAuth } from "../../state/auth";
import { useHomepageSettings } from "../../state/homepageSettings.jsx";
import Logo from "../Logo.jsx";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../ui/Dialog";
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from "../ui/Tabs";

export default function RegisterDialog({ isOpen, onClose, onSwitchToLogin }) {
  const { settings } = useHomepageSettings();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  });
  const [otpForm, setOtpForm] = useState({ email: "", code: "", purpose: "register" });
  const [otpMode, setOtpMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register, verifyOtp, resendOtp } = useAuth();

  const handleSocial = (provider) => {
    const selectedBackendOrigin = resolveBackendOrigin();
    const normalizedBase = `${selectedBackendOrigin}/api`;
    const frontendCallback = `${window.location.origin}/oauth/callback`;
    localStorage.setItem("oauth_provider", provider);
    window.location.href = `${normalizedBase}/auth/${provider}/redirect?frontend_callback=${encodeURIComponent(frontendCallback)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.password_confirmation) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        password_confirmation: form.password_confirmation,
      });
      if (result?.otp_required) {
        setOtpMode(true);
        setOtpForm({ email: form.email, code: "", purpose: result.purpose || "register" });
        return;
      }
      setForm({ name: "", email: "", phone: "", password: "", password_confirmation: "" });
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Registration failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await verifyOtp({
        email: otpForm.email,
        code: otpForm.code,
        purpose: otpForm.purpose,
      });
      const user = data?.user;
      setOtpMode(false);
      setOtpForm({ email: "", code: "", purpose: "register" });

      if (user?.role === "admin" || user?.role === "superadmin") {
        setTimeout(() => {
          window.location.href = "/admin";
        }, 300);
        return;
      }

      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      await resendOtp({ email: otpForm.email, purpose: otpForm.purpose });
    } catch (err) {
      setError(err?.response?.data?.message || "Resend failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPopup className="p-0 overflow-hidden rounded-3xl shadow-2xl border border-white/10 bg-white/10 backdrop-blur-xl text-white modal-no-scroll" from="top" position="center" showCloseButton={true}>
        <div className="px-6 pt-5 pb-4 border-b border-white/10">
          <Link to="/" className="flex items-center justify-center">
            <Logo className="h-14 w-auto" src={settings?.header?.logo_url || "/logo.png"} alt="FitandSleek" />
          </Link>
        </div>

        <div className="px-6 pt-5 pb-4 border-b border-white/10">
          <DialogTitle className="text-2xl font-black tracking-tight text-white">Create Account</DialogTitle>
          <DialogDescription className="mt-2 text-sm text-white/70">
            Join FitandSleek and start shopping
          </DialogDescription>
        </div>

        <div className="px-6 pt-5 pb-6">
          <Tabs
            value="register"
            onValueChange={(value) => {
              if (value === "login") {
                onClose();
                onSwitchToLogin();
              }
            }}
          >
            <TabsList className="w-full rounded-full p-1 bg-white/15 border border-white/10 shadow-inner backdrop-blur-md">
              <TabsTrigger value="login" className="flex-1 rounded-full text-sm font-semibold text-white/70 data-[state=active]:bg-white/80 data-[state=active]:text-slate-900 data-[state=active]:shadow transition-all duration-200">
                Login
              </TabsTrigger>
              <TabsTrigger value="register" className="flex-1 rounded-full text-sm font-semibold text-white/70 data-[state=active]:bg-white/80 data-[state=active]:text-slate-900 data-[state=active]:shadow transition-all duration-200">
                Register
              </TabsTrigger>
            </TabsList>
            <TabsContents>
              <TabsContent value="register">
                {!otpMode ? (
                  <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mt-4">
                    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      <div>
                        <label htmlFor="register-name" className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                          <input
                            id="register-name"
                            name="name"
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="John Doe"
                            className="w-full h-12 rounded-2xl bg-white/10 text-white placeholder-white/60 border border-white/15 pl-11 pr-4 shadow-sm focus:bg-white/20 focus:border-transparent focus:ring-2 focus:ring-white/30 outline-none transition-all duration-200"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="register-email" className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">Email Address</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                          <input
                            id="register-email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="your@email.com"
                            className="w-full h-12 rounded-2xl bg-white/10 text-white placeholder-white/60 border border-white/15 pl-11 pr-4 shadow-sm focus:bg-white/20 focus:border-transparent focus:ring-2 focus:ring-white/30 outline-none transition-all duration-200"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="register-phone" className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">Phone Number</label>
                      <div className="relative">
                        <input
                          id="register-phone"
                          name="phone"
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="+855..."
                          className="w-full h-12 rounded-2xl bg-white/10 text-white placeholder-white/60 border border-white/15 px-4 shadow-sm focus:bg-white/20 focus:border-transparent focus:ring-2 focus:ring-white/30 outline-none transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="register-password" className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                        <input
                          id="register-password"
                          name="password"
                          type="password"
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          placeholder="••••••••"
                          className="w-full h-12 rounded-2xl bg-white/10 text-white placeholder-white/60 border border-white/15 pl-11 pr-4 shadow-sm focus:bg-white/20 focus:border-transparent focus:ring-2 focus:ring-white/30 outline-none transition-all duration-200"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="register-password-confirm" className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                        <input
                          id="register-password-confirm"
                          name="password_confirmation"
                          type="password"
                          value={form.password_confirmation}
                          onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                          placeholder="••••••••"
                          className="w-full h-12 rounded-2xl bg-white/10 text-white placeholder-white/60 border border-white/15 pl-11 pr-4 shadow-sm focus:bg-white/20 focus:border-transparent focus:ring-2 focus:ring-white/30 outline-none transition-all duration-200"
                          required
                        />
                      </div>
                      {error && (
                        <div className="mt-2 text-xs text-rose-200 bg-rose-500/10 border border-rose-400/20 rounded-lg px-3 py-2">
                          {error}
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-3 flex flex-col gap-2 pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#5C7E64] via-[#6F8F72] to-[#93B895] text-white text-sm font-semibold shadow-lg shadow-[#6F8F72]/35 hover:brightness-105 active:scale-[0.98] transition-all duration-200"
                      >
                        {loading ? "Creating account..." : "Create Account"}
                      </button>
                      <DialogClose
                        onClick={onClose}
                        className="w-full h-10 rounded-2xl bg-white/5 text-white/80 text-sm font-semibold border border-white/15 hover:bg-white/15 active:scale-[0.98] transition-all duration-200"
                      >
                        Cancel
                      </DialogClose>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-4">
                    <div className="md:col-span-2">
                      <label htmlFor="register-otp-code" className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">Verification Code</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                        <input
                          id="register-otp-code"
                          name="otp_code"
                          type="text"
                          value={otpForm.code}
                          onChange={(e) => setOtpForm({ ...otpForm, code: e.target.value })}
                          placeholder="Enter OTP"
                          className="w-full h-12 rounded-2xl bg-white/10 text-white placeholder-white/60 border border-white/15 pl-11 pr-4 shadow-sm focus:bg-white/20 focus:border-transparent focus:ring-2 focus:ring-white/30 outline-none transition-all duration-200"
                          required
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="md:col-span-2 mt-1 text-xs text-rose-200 bg-rose-500/10 border border-rose-400/20 rounded-lg px-3 py-2">
                        {error}
                      </div>
                    )}

                    <div className="md:col-span-2 flex flex-col gap-2 pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#5C7E64] via-[#6F8F72] to-[#93B895] text-white text-sm font-semibold shadow-lg shadow-[#6F8F72]/35 hover:brightness-105 active:scale-[0.98] transition-all duration-200"
                      >
                        {loading ? "Verifying..." : "Verify"}
                      </button>
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={loading}
                        className="w-full h-10 rounded-2xl bg-white/5 text-white/80 text-sm font-semibold border border-white/15 hover:bg-white/15 active:scale-[0.98] transition-all duration-200"
                      >
                        Resend code
                      </button>
                      <DialogClose
                        onClick={onClose}
                        className="w-full h-10 rounded-2xl bg-white/5 text-white/80 text-sm font-semibold border border-white/15 hover:bg-white/15 active:scale-[0.98] transition-all duration-200"
                      >
                        Cancel
                      </DialogClose>
                    </div>
                  </form>
                )}

                {!otpMode && (
                  <>
                    <div className="mt-4 text-center text-sm text-white/70">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onSwitchToLogin();
                        }}
                        className="font-semibold text-white hover:underline"
                      >
                        Login
                      </button>
                    </div>

                    <div className="my-5 flex items-center gap-3 text-xs text-white/60">
                      <span className="h-px flex-1 bg-white/20" />
                      or
                      <span className="h-px flex-1 bg-white/20" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pb-6">
                      <button
                        type="button"
                        onClick={() => handleSocial("google")}
                        className="w-full h-11 rounded-2xl bg-white/10 text-white text-sm font-semibold border border-white/15 hover:bg-white/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <Chrome className="w-4 h-4" />
                        Continue with Google
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSocial("facebook")}
                        className="w-full h-11 rounded-2xl bg-white/10 text-white text-sm font-semibold border border-white/15 hover:bg-white/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <Facebook className="w-4 h-4" />
                        Continue with Facebook
                      </button>
                    </div>
                  </>
                )}
              </TabsContent>
            </TabsContents>
          </Tabs>
        </div>
      </DialogPopup>
    </Dialog>
  );
}
