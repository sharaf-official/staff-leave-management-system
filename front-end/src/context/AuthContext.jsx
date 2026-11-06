/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";
import { findUserByEmail, getCompany, mockHash, updateUser, verifyPassword } from "../data/db";

const SESSION_KEY = "leavenest-session";
const AuthContext = createContext(null);

const toSession = (u) => ({
  id: u.id,
  companyId: u.companyId,
  name: u.name,
  email: u.email,
  role: u.role,
  department: u.department,
  managerId: u.managerId,
  jobTitle: u.jobTitle,
  status: u.status,
  mustChangePassword: u.mustChangePassword,
});

const writeSession = (session) => {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage blocked */
  }
};

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    const fresh = findUserByEmail(saved.email); // always re-sync with the database
    if (!fresh || fresh.status === "disabled") return null;
    return toSession(fresh);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession);

  const login = (email, password) => {
    const found = findUserByEmail(email);
    if (!found || !verifyPassword(found, password)) {
      return { ok: false, message: "Invalid email or password." };
    }
    if (found.status === "disabled") {
      return { ok: false, message: "This account has been disabled. Please contact your admin." };
    }
    if (found.mustChangePassword && found.tempExpiresAt && Date.now() > found.tempExpiresAt) {
      return { ok: false, message: "Your temporary password has expired. Ask your admin to resend the invitation." };
    }
    const updated = updateUser(found.id, { lastLoginAt: new Date().toISOString() });
    const session = toSession(updated);
    writeSession(session);
    setUser(session);
    return { ok: true, user: session };
  };

  const logout = () => {
    writeSession(null);
    setUser(null);
  };

  const changePassword = (current, next) => {
    if (!user) return { ok: false, message: "You are not signed in." };
    const found = findUserByEmail(user.email);
    if (!found || !verifyPassword(found, current)) {
      return { ok: false, message: "Current password is incorrect." };
    }
    if (getCompany(found.companyId)?.isDemo) {
      return { ok: false, message: "Demo accounts cannot change their password." };
    }
    if (verifyPassword(found, next)) {
      return { ok: false, message: "New password must be different from the current one." };
    }
    const updated = updateUser(found.id, {
      passwordHash: mockHash(next, found.email),
      mustChangePassword: false,
      status: "active",
      tempExpiresAt: null,
    });
    const session = toSession(updated);
    writeSession(session);
    setUser(session);
    return { ok: true };
  };

  // re-read the logged-in user from the database (after profile edits)
  const refreshUser = () => {
    if (!user) return;
    const fresh = findUserByEmail(user.email);
    if (fresh) {
      const session = toSession(fresh);
      writeSession(session);
      setUser(session);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, changePassword, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);