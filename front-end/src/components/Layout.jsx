import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  FiGrid, FiPlusCircle, FiClock, FiCheckSquare, FiUsers, FiBriefcase, FiTag, FiBarChart2,
  FiLogOut, FiMenu, FiCalendar, FiUser, FiMoon, FiSun,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import Modal from "./Modal";
import NotificationBell from "./NotificationBell";
import { applyTheme, getTheme } from "../utils/theme";
import { getAvatar } from "../utils/avatar";

const profileLink = { to: "/profile", label: "My Profile", icon: <FiUser /> };

const menus = {
  employee: [
    { to: "/dashboard", label: "Dashboard", icon: <FiGrid /> },
    { to: "/apply", label: "Apply Leave", icon: <FiPlusCircle /> },
    { to: "/history", label: "My History", icon: <FiClock /> },
    profileLink,
  ],
  manager: [
    { to: "/dashboard", label: "Dashboard", icon: <FiGrid /> },
    { to: "/apply", label: "Apply Leave", icon: <FiPlusCircle /> },
    { to: "/history", label: "My History", icon: <FiClock /> },
    { to: "/approvals", label: "Team Requests", icon: <FiCheckSquare /> },
    profileLink,
  ],
  admin: [
    { to: "/dashboard", label: "Dashboard", icon: <FiGrid /> },
    { to: "/users", label: "Users", icon: <FiUsers /> },
    { to: "/departments", label: "Departments", icon: <FiBriefcase /> },
    { to: "/leave-types", label: "Leave Types", icon: <FiTag /> },
    { to: "/reports", label: "Reports", icon: <FiBarChart2 /> },
    profileLink,
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [theme, setTheme] = useState(getTheme);
  const [photo, setPhoto] = useState(() => getAvatar(user.email));
  const gPressed = useRef(false);

  // theme
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // profile photo changes
  useEffect(() => {
    const refresh = () => setPhoto(getAvatar(user.email));
    window.addEventListener("avatar-changed", refresh);
    return () => window.removeEventListener("avatar-changed", refresh);
  }, [user.email]);

  // keyboard shortcuts
  useEffect(() => {
    let timer;
    const allowed = (path) => menus[user.role].some((m) => m.to === path);

    const onKey = (e) => {
      if (e.key === "Escape") {
        setShowLogout(false);
        setOpen(false);
        document.querySelector(".rv-overlay")?.click(); // close page popups
        return;
      }
      const tag = e.target.tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag) || e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toLowerCase();
      if (gPressed.current) {
        gPressed.current = false;
        clearTimeout(timer);
        const map = {
          d: "/dashboard",
          a: "/apply",
          h: "/history",
          p: "/profile",
          r: user.role === "manager" ? "/approvals" : "/reports",
          u: "/users",
        };
        const path = map[key];
        if (path && allowed(path)) navigate(path);
        return;
      }
      if (key === "g") {
        gPressed.current = true;
        timer = setTimeout(() => (gPressed.current = false), 1000);
      } else if (key === "t") {
        setTheme((t) => (t === "dark" ? "light" : "dark"));
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(timer);
    };
  }, [user.role, navigate]);

  const confirmLogout = () => {
    setShowLogout(false);
    logout();
    navigate("/login");
  };

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <div className={`overlay ${open ? "show" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Sidebar">
        <div className="brand">
          <span className="brand-logo"><FiCalendar /></span>
          <div className="brand-text">
            <strong>Staff Leave</strong>
            <small>Management System</small>
          </div>
        </div>
        <nav aria-label="Main navigation">
          {menus[user.role].map((m) => (
            <NavLink key={m.to} to={m.to} onClick={() => setOpen(false)}>
              {m.icon} {m.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <button
            className="menu-btn"
            onClick={() => setOpen(!open)}
            aria-label="Open navigation menu"
            aria-expanded={open}
          >
            <FiMenu />
          </button>
          <div className="topbar-spacer" />

          <button
            className="round-btn"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title="Toggle theme (T)"
          >
            {theme === "dark" ? <FiSun /> : <FiMoon />}
          </button>

          <NotificationBell role={user.role} />

          <button className="user-chip clickable" onClick={() => navigate("/profile")} aria-label="Open my profile">
            <div className="avatar">
              {photo ? <img src={photo} alt="" /> : user.name.charAt(0)}
            </div>
            <div className="info">
              <div className="name">{user.name}</div>
              <div className="role">{user.role}</div>
            </div>
          </button>

          <button className="btn btn-outline btn-sm" onClick={() => setShowLogout(true)}>
            <FiLogOut /> Logout
          </button>
        </header>

        <main className="content" id="main-content" tabIndex={-1}>
          <div key={location.pathname} className="page-fade">
            <Outlet />
          </div>
        </main>
      </div>

      {showLogout && (
        <Modal title="Confirm logout" onClose={() => setShowLogout(false)}>
          <p style={{ marginBottom: 18 }}>
            Hi {user.name.split(" ")[0]}, are you sure you want to log out of your account?
          </p>
          <div className="modal-actions">
            <button className="btn btn-danger" onClick={confirmLogout}>
              <FiLogOut /> Yes, log out
            </button>
            <button className="btn btn-outline" onClick={() => setShowLogout(false)}>
              Stay signed in
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}