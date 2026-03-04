import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getApiErrorDetails, requestPasswordResetLink } from "../lib/auth-api";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [validationErrors, setValidationErrors] = useState({});

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");
        setValidationErrors({});

        try {
            const data = await requestPasswordResetLink(email);
            setSuccess(data?.message || "If the account exists, a password reset link has been sent.");
        } catch (err) {
            const { message, errors } = getApiErrorDetails(err, "Unable to process your request right now.");
            setError(message);
            setValidationErrors(errors);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-12">
            <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-semibold text-slate-900">Forgot password</h1>
                <p className="mt-2 text-sm text-slate-600">Enter your email and we will send a password reset link.</p>

                {success && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>}
                {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                            Email address
                        </label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                            placeholder="name@example.com"
                            required
                        />
                        {validationErrors?.email?.length ? (
                            <p className="mt-1 text-xs text-rose-600">{validationErrors.email[0]}</p>
                        ) : null}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {loading ? "Sending..." : "Send reset link"}
                    </button>
                </form>

                <div className="mt-4 text-sm text-slate-600">
                    Remembered your password?{" "}
                    <Link to="/login" className="font-medium text-slate-900 underline hover:text-slate-700">
                        Back to login
                    </Link>
                </div>
            </div>
        </div>
    );
}
