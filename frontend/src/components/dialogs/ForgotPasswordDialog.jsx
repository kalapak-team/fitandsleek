



import React, { useState } from "react";
import api from "../../lib/api";

export default function ForgotPasswordDialog({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(0); // 0=email, 1=otp, 2=password
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/forgot-password", { email });
      setStep(1);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/otp/verify", {
        email,
        code: otp,
        purpose: "forgot",
      });
      setStep(2);
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password-otp", {
        email,
        code: otp,
        password,
        password_confirmation: confirm,
      });
      setSuccess("Password reset successful! You can now log in.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return isOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
        <h2 className="text-lg font-bold mb-2">Forgot Password</h2>
        {success ? (
          <div className="text-green-600 mb-4">{success}</div>
        ) : step === 0 ? (
          <form onSubmit={handleSendOtp}>
            <label className="block mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-3"
              required
            />
            {error && <div className="text-red-600 mb-2">{error}</div>}
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded" disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        ) : step === 1 ? (
          <form onSubmit={handleVerifyOtp}>
            <label className="block mb-2">OTP Code</label>
            <input
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-3"
              required
            />
            {error && <div className="text-red-600 mb-2">{error}</div>}
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset}>
            <label className="block mb-2">New Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-3"
              required
            />
            <label className="block mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-3"
              required
            />
            {error && <div className="text-red-600 mb-2">{error}</div>}
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
        <button className="mt-4 text-sm text-gray-500 hover:text-gray-700" onClick={onClose}>Back to Login</button>
      </div>
    </div>
  ) : null;
}
