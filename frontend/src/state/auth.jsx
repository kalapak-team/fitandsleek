import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../lib/api";
import { getDeviceMeta } from "../lib/device";

const AUTH_CONTEXT_KEY = "__fitandsleek_auth_context__";
const AuthCtx = globalThis[AUTH_CONTEXT_KEY] || createContext(null);
if (!globalThis[AUTH_CONTEXT_KEY]) {
  globalThis[AUTH_CONTEXT_KEY] = AuthCtx;
}
const TOKEN_KEY = "fs_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booted, setBooted] = useState(false);
  const [token, setToken] = useState(null);

  // Initialize token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const loadMe = async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (!currentToken) {
      setBooted(true);
      setToken(null);
      setUser(null);
      return;
    }

    // Ensure token state is synced
    setToken(currentToken);

    try {
      const { data } = await api.get("/me");
      setUser(data);
    } catch (err) {
      // If 404 or 401, token might be invalid - clear it
      if (err.response?.status === 404 || err.response?.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      }
    } finally {
      setBooted(true);
    }
  };

  useEffect(() => {
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password, options = {}) => {
    const { forceOtp = false } = options;
    try {
      const { data } = await api.post("/auth/login", {
        email,
        password,
        ...getDeviceMeta(),
      });
      if (!forceOtp && data?.token) {
        const newToken = data.token;
        localStorage.setItem(TOKEN_KEY, newToken);
        setToken(newToken);
        setUser(data.user);
      }
      // If forcing OTP on every login, trigger a code and defer token/user until verifyOtp
      if (forceOtp) {
        try {
          await api.post("/auth/otp/resend", { email, purpose: "login" });
        } catch {
          // if resend fails, let the caller still show the otp UI; verifyOtp will fail visibly if code missing
        }
        return {
          otp_required: true,
          purpose: "login",
          email,
          message: data?.message || "OTP code sent to your email",
        };
      }

      return data;
    } catch (err) {
      const data = err?.response?.data;
      // If backend demands OTP (e.g., account not verified), bubble it up to show OTP form
      if (data?.otp_required) {
        return {
          ...data,
          email,
          purpose: data.purpose || "login",
        };
      }
      // Normalize error shape so callers can show a friendly message
      if (data) {
        return {
          error: true,
          message: data.message || data.error || "Invalid email or password",
          status: err.response?.status,
        };
      }
      throw err;
    }
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    if (data?.token) {
      const newToken = data.token;
      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
      setUser(data.user);
    }
    return data;
  };

  const verifyOtp = async ({ email, code, purpose }) => {
    const { data } = await api.post("/auth/otp/verify", {
      email,
      code,
      purpose,
      ...getDeviceMeta(),
    });
    const newToken = data.token;
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
      setUser(data.user);
    }
    return data;
  };

  const resendOtp = async ({ email, purpose }) => {
    const { data } = await api.post("/auth/otp/resend", {
      email,
      purpose,
      ...getDeviceMeta(),
    });
    return data;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    }
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, booted, token, login, register, verifyOtp, resendOtp, logout, refresh: loadMe }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, booted, token]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export { TOKEN_KEY };
