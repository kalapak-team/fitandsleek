import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const HomepageSettingsContext = createContext();

export function HomepageSettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/homepage-settings");
        setSettings(data);
      } catch (err) {
        console.log("Could not load homepage settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <HomepageSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </HomepageSettingsContext.Provider>
  );
}

export function useHomepageSettings() {
  const context = useContext(HomepageSettingsContext);
  if (!context) {
    throw new Error("useHomepageSettings must be used within HomepageSettingsProvider");
  }
  return context;
}
