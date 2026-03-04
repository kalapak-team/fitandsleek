import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";
import { resolveImageUrl } from "../../lib/images";
import { getDeviceHeaders, getDeviceMeta } from "../../lib/device";
import { useHomepageSettings } from "../../state/homepageSettings";

const DRIVER_TOKEN_KEY = "fs_driver_scan_token";
const DRIVER_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const QR_READER_ID = "driver-qr-reader";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseQrPayload(raw) {
    const value = String(raw || "").trim();
    if (!value) {
        return { shipment_id: "", tracking_code: "" };
    }

    if ((value.startsWith("{") && value.endsWith("}")) || (value.startsWith("[") && value.endsWith("]"))) {
        try {
            const parsed = JSON.parse(value);
            const shipmentId = String(parsed?.shipment_id ?? parsed?.id ?? "").trim();
            const trackingCode = String(parsed?.tracking_code ?? parsed?.code ?? "").trim();

            if (shipmentId || trackingCode) {
                return { shipment_id: shipmentId, tracking_code: trackingCode };
            }
        } catch {
        }
    }

    if (/^https?:\/\//i.test(value)) {
        try {
            const url = new URL(value);
            const fromQueryShipment = url.searchParams.get("shipment_id") || url.searchParams.get("id") || "";
            const fromQueryTracking = url.searchParams.get("tracking_code") || url.searchParams.get("code") || "";
            if (fromQueryShipment || fromQueryTracking) {
                return {
                    shipment_id: fromQueryShipment,
                    tracking_code: fromQueryTracking,
                };
            }

            const segments = url.pathname.split("/").filter(Boolean);
            const tail = segments.length ? decodeURIComponent(segments[segments.length - 1]) : "";

            return {
                shipment_id: tail || "",
                tracking_code: "",
            };
        } catch {
            return { shipment_id: "", tracking_code: "" };
        }
    }

    if (/^\d+$/.test(value)) {
        return { shipment_id: value, tracking_code: "" };
    }

    return { shipment_id: value, tracking_code: "" };
}

function loadDriverToken() {
    const raw = localStorage.getItem(DRIVER_TOKEN_KEY);
    if (!raw) return "";

    try {
        const parsed = JSON.parse(raw);
        if (!parsed?.token || !parsed?.expires_at) return "";
        if (Date.now() > parsed.expires_at) {
            localStorage.removeItem(DRIVER_TOKEN_KEY);
            return "";
        }
        return parsed.token;
    } catch {
        localStorage.removeItem(DRIVER_TOKEN_KEY);
        return "";
    }
}

function saveDriverToken(token) {
    localStorage.setItem(
        DRIVER_TOKEN_KEY,
        JSON.stringify({
            token,
            expires_at: Date.now() + DRIVER_TOKEN_TTL_MS,
        })
    );
}

function triggerSuccessFeedback() {
    try {
        if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
            navigator.vibrate([80, 40, 120]);
        }

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;

        const context = new AudioCtx();
        const now = context.currentTime;

        const playTone = (frequency, startAt, duration) => {
            const oscillator = context.createOscillator();
            const gain = context.createGain();

            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(frequency, startAt);
            gain.gain.setValueAtTime(0.0001, startAt);
            gain.gain.exponentialRampToValueAtTime(0.15, startAt + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

            oscillator.connect(gain);
            gain.connect(context.destination);
            oscillator.start(startAt);
            oscillator.stop(startAt + duration);
        };

        playTone(880, now, 0.1);
        playTone(1174, now + 0.12, 0.12);
    } catch {
    }
}

export default function DriverScanPage() {
    const [searchParams] = useSearchParams();
    const { settings } = useHomepageSettings();

    const rawBaseURL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
    const baseURL = rawBaseURL.replace(/\/$/, "").endsWith("/api")
        ? rawBaseURL.replace(/\/$/, "")
        : `${rawBaseURL.replace(/\/$/, "")}/api`;
    const api = useMemo(
        () =>
            axios.create({
                baseURL,
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    ...getDeviceHeaders(),
                },
            }),
        [baseURL]
    );

    const [driverEmail, setDriverEmail] = useState("");
    const [driverPassword, setDriverPassword] = useState("");
    const [driverOtp, setDriverOtp] = useState("");
    const [driverOtpPurpose, setDriverOtpPurpose] = useState("login");
    const [driverStep, setDriverStep] = useState("login");
    const [driverToken, setDriverToken] = useState("");
    const [driverName, setDriverName] = useState("");
    const [driverAvatar, setDriverAvatar] = useState("");
    const [authToken, setAuthToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [scanRaw, setScanRaw] = useState("");
    const [shipmentId, setShipmentId] = useState(searchParams.get("shipment_id") || "");
    const [trackingCode, setTrackingCode] = useState(searchParams.get("tracking_code") || searchParams.get("code") || "");
    const [location, setLocation] = useState("");
    const [note, setNote] = useState("");
    const [result, setResult] = useState(null);
    const [scanNotice, setScanNotice] = useState("");
    const [cameraLoading, setCameraLoading] = useState(false);
    const [cameraRunning, setCameraRunning] = useState(false);
    const [cameraError, setCameraError] = useState("");
    const [showScanSuccess, setShowScanSuccess] = useState(false);
    const [autoSubmit, setAutoSubmit] = useState(true);
    const [sessionScanCount, setSessionScanCount] = useState(0);
    const [receiptLoading, setReceiptLoading] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const [showReceipt, setShowReceipt] = useState(false);

    const scannerRef = useRef(null);
    const lastScanRef = useRef({ text: "", time: 0 });
    const scanProcessingRef = useRef(false);

    const stopCameraScan = useCallback(async () => {
        const scanner = scannerRef.current;
        if (!scanner) {
            setCameraRunning(false);
            return;
        }

        try {
            await scanner.stop();
        } catch {
        }

        try {
            await scanner.clear();
        } catch {
        }

        scannerRef.current = null;
        setCameraRunning(false);
    }, []);

    const processScanUpdate = useCallback(async ({ shipment_id, tracking_code }) => {
        if (scanProcessingRef.current) return;

        scanProcessingRef.current = true;
        setLoading(true);
        setError("");
        setResult(null);

        try {
            const shipmentValue = String(shipment_id || "").trim();
            const numericShipmentId = /^\d+$/.test(shipmentValue) ? Number(shipmentValue) : undefined;
            const fallbackTracking = numericShipmentId ? undefined : shipmentValue || undefined;

            const { data } = await api.post(
                "/driver/scan",
                {
                    shipment_id: numericShipmentId,
                    tracking_code: tracking_code || fallbackTracking,
                    location: location || undefined,
                    note: note || undefined,
                },
                { headers: { Authorization: `Bearer ${driverToken}` } }
            );

            setResult(data?.data || null);
            setScanNotice("Scan successful. Status updated.");
            setShowScanSuccess(true);
            setSessionScanCount((count) => count + 1);
            triggerSuccessFeedback();

            await wait(1000);

            setShowScanSuccess(false);
            setScanRaw("");
            setShipmentId("");
            setTrackingCode("");
            setNote("");
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to process scan.");
            setShowScanSuccess(false);
        } finally {
            setLoading(false);
            scanProcessingRef.current = false;
        }
    }, [api, driverToken, location, note]);

    const startCameraScan = useCallback(async () => {
        if (cameraRunning) return;

        setCameraError("");
        setScanNotice("");
        setCameraLoading(true);

        try {
            const qrModule = await import("html5-qrcode");
            const Html5Qrcode = qrModule.Html5Qrcode;

            const scanner = new Html5Qrcode(QR_READER_ID, { formatsToSupport: [0] });
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1,
                },
                (decodedText) => {
                    if (scanProcessingRef.current) {
                        return;
                    }

                    const now = Date.now();
                    if (lastScanRef.current.text === decodedText && now - lastScanRef.current.time < 2000) {
                        return;
                    }
                    lastScanRef.current = { text: decodedText, time: now };

                    setScanRaw(decodedText);
                    const parsed = parseQrPayload(decodedText);
                    setShipmentId(parsed.shipment_id);
                    setTrackingCode(parsed.tracking_code);

                    if (!parsed.shipment_id && !parsed.tracking_code) {
                        setScanNotice("");
                        setCameraError("QR scanned, but shipment data could not be parsed.");
                        return;
                    }

                    setCameraError("");
                    setError("");

                    if (autoSubmit) {
                        setScanNotice("Scan detected. Processing...");
                        void processScanUpdate(parsed);
                        return;
                    }

                    setScanNotice("Scan successful. Review and tap Confirm Scan.");
                },
                () => {
                }
            );

            setCameraRunning(true);
        } catch (err) {
            setCameraError(err?.message || "Unable to start camera scanner.");
            scannerRef.current = null;
            setCameraRunning(false);
        } finally {
            setCameraLoading(false);
        }
    }, [autoSubmit, cameraRunning, processScanUpdate]);

    useEffect(() => {
        const token = loadDriverToken();
        if (token) {
            setDriverToken(token);
            setDriverStep("scan");
        }
    }, []);

    useEffect(() => {
        return () => {
            void stopCameraScan();
        };
    }, [stopCameraScan]);

    useEffect(() => {
        if (driverStep !== "scan") {
            void stopCameraScan();
        }
    }, [driverStep, stopCameraScan]);

    const loadDriverProfile = useCallback(async () => {
        if (!driverToken) return;
        try {
            const { data } = await api.get("/me", {
                headers: { Authorization: `Bearer ${driverToken}` },
            });
            if (data?.name) {
                setDriverName(data.name);
            }
            setDriverAvatar(data?.profile_image_url || data?.profile_image_path || "");
        } catch {
            localStorage.removeItem(DRIVER_TOKEN_KEY);
            setDriverToken("");
            setDriverStep("login");
        }
    }, [api, driverToken]);

    useEffect(() => {
        if (driverStep === "scan" && driverToken && !driverName) {
            void loadDriverProfile();
        }
    }, [driverStep, driverToken, driverName, loadDriverProfile]);

    const handleDriverLogin = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");
        try {
            const { data } = await api.post("/auth/login", {
                email: driverEmail,
                password: driverPassword || undefined,
                ...getDeviceMeta(),
            });

            if (!data?.otp_required) {
                setError("OTP is required for driver login.");
                return;
            }

            setDriverOtpPurpose(data?.purpose || "login");
            setDriverStep("otp");
        } catch (err) {
            const responseData = err?.response?.data;
            if (responseData?.otp_required) {
                setDriverOtpPurpose(responseData?.purpose || "login");
                setDriverStep("otp");
                setError("");
            } else {
                setError(responseData?.message || "Failed to send OTP.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDriverVerify = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");

        try {
            const verifyResp = await api.post("/auth/otp/verify", {
                email: driverEmail,
                code: driverOtp,
                purpose: driverOtpPurpose,
                ...getDeviceMeta(),
            });

            const token = verifyResp?.data?.token;
            if (!token) {
                setError("Authentication token is missing.");
                return;
            }

            setDriverName(verifyResp?.data?.user?.name || "");
            setDriverAvatar(verifyResp?.data?.user?.profile_image_url || verifyResp?.data?.user?.profile_image_path || "");

            setAuthToken(token);

            const driverResp = await api.post(
                "/auth/driver/token",
                {
                    ...getDeviceMeta(),
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const newDriverToken = driverResp?.data?.token;
            if (!newDriverToken) {
                setError("Driver token is missing.");
                return;
            }

            saveDriverToken(newDriverToken);
            setDriverToken(newDriverToken);
            setDriverName(driverResp?.data?.user?.name || verifyResp?.data?.user?.name || "");
            setDriverAvatar(
                driverResp?.data?.user?.profile_image_url
                || driverResp?.data?.user?.profile_image_path
                || verifyResp?.data?.user?.profile_image_url
                || verifyResp?.data?.user?.profile_image_path
                || ""
            );
            setDriverStep("scan");
        } catch (err) {
            setError(err?.response?.data?.message || "OTP verification failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleParseQr = () => {
        const parsed = parseQrPayload(scanRaw);
        setShipmentId(parsed.shipment_id);
        setTrackingCode(parsed.tracking_code);
        setScanNotice("");
        setCameraError("");

        if (!parsed.shipment_id) {
            if (!parsed.tracking_code) {
                setError("Could not parse shipment ID or tracking code from scanned QR content.");
            } else {
                setError("");
                setScanNotice("QR parsed successfully by tracking code.");
            }
        } else {
            setError("");
            setScanNotice("QR parsed successfully.");
        }
    };

    const handleScanSubmit = async (event) => {
        event.preventDefault();
        if (!shipmentId && !trackingCode) {
            setError("Shipment ID or Tracking code is required.");
            return;
        }

        await processScanUpdate({ shipment_id: shipmentId, tracking_code: trackingCode });
    };

    const handleViewReceipt = async () => {
        const code = result?.tracking_code || trackingCode;
        const sid = result?.shipment_id || shipmentId;

        if (!code && !sid) {
            setError("Scan a shipment first to view receipt.");
            return;
        }

        setReceiptLoading(true);
        setError("");
        try {
            const { data } = await api.get("/driver/receipt", {
                params: {
                    code: code || undefined,
                    shipment_id: sid || undefined,
                },
                headers: { Authorization: `Bearer ${driverToken}` },
            });

            setReceiptData(data?.data || null);
            setShowReceipt(true);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to load digital receipt.");
        } finally {
            setReceiptLoading(false);
        }
    };

    const handleLogoutDriver = () => {
        void stopCameraScan();
        localStorage.removeItem(DRIVER_TOKEN_KEY);
        setDriverToken("");
        setDriverName("");
        setDriverAvatar("");
        setAuthToken("");
        setDriverOtp("");
        setDriverOtpPurpose("login");
        setDriverPassword("");
        setDriverStep("login");
        setResult(null);
        setScanNotice("");
        setCameraError("");
        setSessionScanCount(0);
    };

    const logoUrl = settings?.app_logo_url || settings?.header?.logo_url || "/logo.png";
    const fallbackLogoUrl = resolveImageUrl("/logo.png");

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-10">
            <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h1 className="text-2xl font-semibold text-slate-900">Driver Scan</h1>
                <p className="mt-2 text-sm text-slate-600">Login first, then scan shipment QR to update status automatically.</p>

                {error ? <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}

                {driverStep === "login" ? (
                    <form onSubmit={handleDriverLogin} className="mt-6 grid gap-4">
                        <input
                            type="email"
                            value={driverEmail}
                            onChange={(e) => setDriverEmail(e.target.value)}
                            placeholder="Driver email"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                            required
                        />
                        <input
                            type="password"
                            value={driverPassword}
                            onChange={(e) => setDriverPassword(e.target.value)}
                            placeholder="Password (optional)"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                        />
                        <button type="submit" disabled={loading} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-70">
                            {loading ? "Sending OTP..." : "Send OTP"}
                        </button>
                    </form>
                ) : null}

                {driverStep === "otp" ? (
                    <form onSubmit={handleDriverVerify} className="mt-6 grid gap-4">
                        <input
                            type="text"
                            value={driverOtp}
                            onChange={(e) => setDriverOtp(e.target.value)}
                            placeholder="Enter OTP code"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                            required
                        />
                        <button type="submit" disabled={loading} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-70">
                            {loading ? "Verifying..." : "Verify OTP"}
                        </button>
                    </form>
                ) : null}

                {driverStep === "scan" ? (
                    <div className="mt-6 space-y-4">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 break-all">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    {driverAvatar ? (
                                        <img
                                            src={resolveImageUrl(driverAvatar)}
                                            alt={driverName || "Driver"}
                                            className="h-9 w-9 rounded-full border border-slate-200 object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700">
                                            {(driverName || "D").charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <span className="font-semibold">Driver:</span> {driverName || "Unknown"}
                                    </div>
                                </div>
                                <div>
                                    <span className="font-semibold">Session scans:</span> {sessionScanCount}
                                </div>
                            </div>
                            <p className="mt-2 text-xs text-slate-600">Driver token active. {authToken ? "Auth session linked." : ""}</p>
                        </div>

                        <div className="grid gap-2">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setAutoSubmit((prev) => !prev)}
                                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${autoSubmit ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
                                        }`}
                                >
                                    Mode: {autoSubmit ? "Auto-submit" : "Manual Confirm"}
                                </button>
                                <button
                                    type="button"
                                    onClick={startCameraScan}
                                    disabled={cameraLoading || cameraRunning}
                                    className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                                >
                                    {cameraLoading ? "Starting camera..." : cameraRunning ? "Camera running" : "Start Camera Scan"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void stopCameraScan()}
                                    disabled={!cameraRunning}
                                    className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-900 disabled:opacity-60"
                                >
                                    Stop Camera
                                </button>
                            </div>
                            <div id={QR_READER_ID} className="w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50" />
                            {showScanSuccess ? (
                                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white animate-pulse">✓</span>
                                    Scan success
                                </div>
                            ) : null}
                            {cameraError ? (
                                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{cameraError}</div>
                            ) : null}
                            {scanNotice ? (
                                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{scanNotice}</div>
                            ) : null}

                            <label className="text-sm font-medium text-slate-700">Scanned QR content</label>
                            <textarea
                                value={scanRaw}
                                onChange={(e) => setScanRaw(e.target.value)}
                                placeholder="Paste scanned QR text or URL"
                                className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
                            />
                            <button type="button" onClick={handleParseQr} className="w-fit rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-900">
                                Parse QR
                            </button>
                        </div>

                        <form onSubmit={handleScanSubmit} className="grid gap-4">
                            <input
                                type="text"
                                value={shipmentId}
                                onChange={(e) => setShipmentId(e.target.value)}
                                placeholder="Shipment ID (or scanned string)"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                                required
                            />
                            <input
                                type="text"
                                value={trackingCode}
                                onChange={(e) => setTrackingCode(e.target.value)}
                                placeholder="Tracking code (optional)"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                            />
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Location (optional)"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2"
                            />
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Note (optional)"
                                className="min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2"
                            />
                            <button type="submit" disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-70">
                                {loading ? "Processing..." : autoSubmit ? "Submit Scan" : "Confirm Scan"}
                            </button>
                        </form>

                        {result ? (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                                <p>
                                    Status updated: <span className="font-semibold">{result.from_status}</span> → <span className="font-semibold">{result.status}</span>
                                </p>
                                <button
                                    type="button"
                                    onClick={handleViewReceipt}
                                    disabled={receiptLoading}
                                    className="mt-2 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                                >
                                    {receiptLoading ? "Loading receipt..." : "View Digital Receipt"}
                                </button>
                            </div>
                        ) : null}

                        <button type="button" onClick={handleLogoutDriver} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">
                            Logout Driver
                        </button>
                    </div>
                ) : null}

                <div className="mt-6 text-sm text-slate-600">
                    <Link to="/" className="underline">Back to home</Link>
                </div>
            </div>

            {showReceipt && receiptData ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                            <h3 className="text-base font-semibold text-slate-900">Driver Digital Receipt</h3>
                            <button type="button" onClick={() => setShowReceipt(false)} className="rounded p-1 text-slate-600 hover:bg-slate-100">✕</button>
                        </div>
                        <div className="space-y-3 px-4 py-4 text-sm">
                            <div className="rounded-lg border border-slate-200 bg-[#f8fafc] p-5 border-b border-b-[#e2e8f0]">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <img src={resolveImageUrl(logoUrl)} alt="Brand logo" className="mb-3 h-16 max-w-[250px] object-contain" onError={(e) => { e.currentTarget.src = fallbackLogoUrl; }} />
                                        <h4 className="text-lg font-bold text-[#497869]">Admin Invoice</h4>
                                        <p className="text-slate-600">Invoice: <span className="font-semibold text-slate-900">{receiptData.invoice_number}</span></p>
                                        <p className="text-slate-500">Date: {receiptData.invoice_date}</p>
                                    </div>
                                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${receiptData.payment_status === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                                        {receiptData.payment_status}
                                    </span>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-lg border border-slate-200">
                                <table className="w-full text-xs">
                                    <thead className="bg-[#497869] text-white">
                                        <tr>
                                            <th className="px-2 py-2 text-left">Item</th>
                                            <th className="px-2 py-2 text-right">Qty</th>
                                            <th className="px-2 py-2 text-right">Price</th>
                                            <th className="px-2 py-2 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(receiptData.items || []).map((item, idx) => (
                                            <tr key={`${item.product_name}-${idx}`} className="border-t border-slate-100">
                                                <td className="px-2 py-2">{item.product_name}</td>
                                                <td className="px-2 py-2 text-right">{item.quantity}</td>
                                                <td className="px-2 py-2 text-right">${Number(item.price || 0).toFixed(2)}</td>
                                                <td className="px-2 py-2 text-right font-semibold">${Number(item.line_total || 0).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-right text-sm font-bold text-slate-900">Grand Total: ${Number(receiptData.grand_total || 0).toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
