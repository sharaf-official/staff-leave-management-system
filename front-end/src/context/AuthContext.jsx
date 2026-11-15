/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "../api";

const SESSION_KEY = "leavenest-session";
const AuthContext = createContext(null);

const writeSession = (session) => {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage blocked */
  }
};

function readSession() {
  if (!getToken()) return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession);

  const clear = () => {
    setToken(null);
    writeSession(null);
    setUser(null);
  };

  // re-sync with the server on load (token expired / account disabled -> sign out)
  useEffect(() => {
    if (!getToken()) return;
    api("/auth/me")
      .then(({ user: u }) => {
        writeSession(u);
        setUser(u);
      })
      .catch((err) => {
        if (err.status === 401 || err.status === 403 || err.status === 404) clear();
      });
  }, []);

  const login = async (email, password) => {
    try {
      const { token, user: u } = await api("/auth/login", { method: "POST", body: { email, password } });
      setToken(token);
      writeSession(u);
      setUser(u);
      return { ok: true, user: u };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  };

  const logout = () => clear();

  const changePassword = async (current, next) => {
    if (!user) return { ok: false, message: "You are not signed in." };
    try {
      await api("/auth/change-password", { method: "POST", body: { current, next } });
      const { user: u } = await api("/auth/me");
      writeSession(u);
      setUser(u);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  };

  const refreshUser = async () => {
    try {
      const { user: u } = await api("/auth/me");
      writeSession(u);
      setUser(u);
    } catch {
      /* ignore */
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, changePassword, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);