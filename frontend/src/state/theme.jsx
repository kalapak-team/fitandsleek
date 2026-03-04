import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const THEME_STORAGE_KEY = "fitandsleek_admin_theme";
const DEFAULT_THEME = {
  mode: "dark",
  // ChatGPT-style emerald accent
  primaryColor: "#10A37F",
};

function normalizeHexColor(value) {
  if (!value) return DEFAULT_THEME.primaryColor;
  const hex = value.trim().replace(/^#/, "");
  if (/^[0-9A-Fa-f]{6}$/.test(hex)) return `#${hex.toUpperCase()}`;
  if (/^[0-9A-Fa-f]{3}$/.test(hex)) {
    const expanded = hex
      .split("")
      .map((char) => `${char}${char}`)
      .join("");
    return `#${expanded.toUpperCase()}`;
  }
  return DEFAULT_THEME.primaryColor;
}

function hexToRgbString(hex) {
  const clean = normalizeHexColor(hex).replace("#", "");
  const red = parseInt(clean.slice(0, 2), 16);
  const green = parseInt(clean.slice(2, 4), 16);
  const blue = parseInt(clean.slice(4, 6), 16);
  return `${red}, ${green}, ${blue}`;
}

function applyTheme(mode, primaryColor) {
  const html = document.documentElement;
  const normalizedMode = mode === "dark" ? "dark" : "light";
  const normalizedColor = normalizeHexColor(primaryColor);

  html.classList.toggle("dark", normalizedMode === "dark");
  html.style.setProperty("--admin-primary", normalizedColor);
  html.style.setProperty("--admin-primary-rgb", hexToRgbString(normalizedColor));
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(DEFAULT_THEME.mode);
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_THEME.primaryColor);

  useEffect(() => {
    try {
      const storedRaw = localStorage.getItem(THEME_STORAGE_KEY);
      if (!storedRaw) {
        applyTheme(DEFAULT_THEME.mode, DEFAULT_THEME.primaryColor);
        return;
      }

      const stored = JSON.parse(storedRaw);
      const nextMode = stored?.mode === "dark" ? "dark" : "light";
      const nextColor = normalizeHexColor(stored?.primaryColor);

      setMode(nextMode);
      setPrimaryColor(nextColor);
      applyTheme(nextMode, nextColor);
    } catch {
      applyTheme(DEFAULT_THEME.mode, DEFAULT_THEME.primaryColor);
    }
  }, []);

  useEffect(() => {
    applyTheme(mode, primaryColor);
  }, [mode, primaryColor]);

  const saveTheme = (nextMode, nextColor) => {
    const modeToSave = nextMode === "dark" ? "dark" : "light";
    const colorToSave = normalizeHexColor(nextColor);
    setMode(modeToSave);
    setPrimaryColor(colorToSave);
    localStorage.setItem(
      THEME_STORAGE_KEY,
      JSON.stringify({ mode: modeToSave, primaryColor: colorToSave })
    );
  };

  const value = useMemo(
    () => ({
      mode,
      primaryColor,
      setMode,
      setPrimaryColor,
      saveTheme,
      normalizeHexColor,
    }),
    [mode, primaryColor]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
