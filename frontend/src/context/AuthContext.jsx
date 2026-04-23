import React, { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, logout as logoutRequest } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      try {
        const me = await getCurrentUser();
        if (active && me.authenticated) {
          setUser(me);
        }
      } catch (error) {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      active = false;
    };
  }, []);

  const logout = async () => {
    try {
      await logoutRequest();
    } catch (error) {
      // Keep UX stable even when backend is unavailable.
      console.warn("Logout request failed:", error);
    }
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, setUser, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}