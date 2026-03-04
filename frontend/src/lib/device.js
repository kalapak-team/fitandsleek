const DEVICE_KEY = "fs_device_id";

function detectBrowser() {
    const ua = navigator.userAgent;
    if (ua.includes("Edg/")) return "Edge";
    if (ua.includes("Chrome/")) return "Chrome";
    if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "Safari";
    if (ua.includes("Firefox/")) return "Firefox";
    return "Unknown Browser";
}

function detectOs() {
    const ua = navigator.userAgent;
    if (/Windows NT/i.test(ua)) return "Windows";
    if (/Mac OS X/i.test(ua)) return "macOS";
    if (/Android/i.test(ua)) return "Android";
    if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
    if (/Linux/i.test(ua)) return "Linux";
    return "Unknown OS";
}

function simpleHash(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
        hash = (hash << 5) - hash + input.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

export function getDeviceId() {
    if (typeof window === "undefined") return "server";

    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;

    const seed = [
        navigator.userAgent,
        navigator.language,
        navigator.platform,
        `${window.screen?.width || 0}x${window.screen?.height || 0}`,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        Date.now().toString(36),
    ].join("|");

    const id = `dev_${simpleHash(seed)}`;
    localStorage.setItem(DEVICE_KEY, id);
    return id;
}

export function getDeviceMeta() {
    if (typeof window === "undefined") {
        return {
            device_id: "server",
            device_name: "Server",
            browser: "Unknown Browser",
            os: "Unknown OS",
            user_agent: "",
        };
    }

    const browser = detectBrowser();
    const os = detectOs();

    return {
        device_id: getDeviceId(),
        device_name: `${browser} on ${os}`,
        browser,
        os,
        user_agent: navigator.userAgent,
    };
}

export function getDeviceHeaders() {
    const meta = getDeviceMeta();
    return {
        "X-Device-ID": meta.device_id,
        "X-Device-Name": meta.device_name,
        "X-Device-Browser": meta.browser,
        "X-Device-OS": meta.os,
    };
}
