import React, { useState } from "react";
import { Chrome, Facebook, User, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { resolveBackendOrigin } from "../../lib/backendOrigin";
import { useAuth } from "../../state/auth";
import { useHomepageSettings } from "../../state/homepageSettings.jsx";
import Logo from "../Logo.jsx";
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../ui/Dialog";
import { Tabs, TabsList, TabsTrigger, TabsContents, TabsContent } from "../ui/Tabs";

export default function LoginDialog({ isOpen, onClose, onSwitchToRegister }) {
  const { settings } = useHomepageSettings();
  const [form, setForm] = useState({ email: "", password: "" });
  const [otpForm, setOtpForm] = useState({ email: "", code: "", purpose: "login" });
  const [otpMode, setOtpMode] = useState(false);
  const [otpNotice, setOtpNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, verifyOtp, resendOtp } = useAuth();

  const handleSocial = (provider) => {
    const selectedBackendOrigin = resolveBackendOrigin();
    const normalizedBase = `${selectedBackendOrigin}/api`;
    const frontendCallback = `${window.location.origin}/oauth/callback`;
    localStorage.setItem("oauth_provider", provider);
    window.location.href = `${normalizedBase}/auth/${provider}/redirect?frontend_callback=${encodeURIComponent(frontendCallback)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await login(form.email, form.password, { forceOtp: true });
      if (result?.error) {
        setError(result.message || "Invalid email or password");
        return;
      }
      if (result?.otp_required) {
        setOtpMode(true);
        setOtpForm({ email: form.email, code: "", purpose: result.purpose || "login" });
        setOtpNotice(result.message || `We sent a code to ${form.email}`);
        return;
      }
      const user = result?.user || result;
      setForm({ email: "", password: "" });
      if (user?.role === "admin" || user?.role === "superadmin") {
        setTimeout(() => {
          window.location.href = "/admin";
        }, 300);
        return;
      }
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
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
      setOtpForm({ email: "", code: "", purpose: "login" });
      setOtpNotice("");
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
          <DialogTitle className="text-2xl font-black tracking-tight text-white">Sign In</DialogTitle>
          <DialogDescription className="mt-2 text-sm text-white/70">
            Welcome back — please sign in to continue
          </DialogDescription>
        </div>
        <div className="px-6 pt-5 pb-6">
          <Tabs
            value="login"
            onValueChange={(value) => {
              if (value === "register") {
                onClose();
                onSwitchToRegister();
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
              <TabsContent value="login">
                {!otpMode ? (
                  <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-4">
                    <div>
                      <label htmlFor="login-email" className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">Email Address</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                        <input
                          id="login-email"
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
                    <div>
                      <label htmlFor="login-password" className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">Password (Optional)</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                        <input
                          id="login-password"
                          name="password"
                          type="password"
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          placeholder="Optional password"
                          className="w-full h-12 rounded-2xl bg-white/10 text-white placeholder-white/60 border border-white/15 pl-11 pr-4 shadow-sm focus:bg-white/20 focus:border-transparent focus:ring-2 focus:ring-white/30 outline-none transition-all duration-200"
                        />
                      </div>
                      {error && (
                        <div className="mt-2 text-xs text-rose-200 bg-rose-500/10 border border-rose-400/20 rounded-lg px-3 py-2">
                          {error}
                        </div>
                      )}
                      {!otpMode && (
                        <div className="mt-2 text-right">
                          <button
                            type="button"
                            className="text-xs text-white/70 hover:text-white transition-colors bg-transparent border-none p-0 underline"
                            onClick={() => {
                              onClose();
                              window.location.href = "/forgot-password";
                            }}
                          >
                            Forgot password?
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2 flex flex-col gap-2 pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#5C7E64] via-[#6F8F72] to-[#93B895] text-white text-sm font-semibold shadow-lg shadow-[#6F8F72]/35 hover:brightness-105 active:scale-[0.98] transition-all duration-200"
                      >
                        {loading ? "Signing in..." : "Sign In"}
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
                    {otpNotice && (
                      <div className="md:col-span-2 text-xs text-emerald-100 bg-emerald-500/10 border border-emerald-400/30 rounded-lg px-3 py-2">
                        {otpNotice}
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <label htmlFor="login-otp-code" className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">Verification Code</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                        <input
                          id="login-otp-code"
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
