import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { FiGrid, FiPlusCircle, FiClock, FiCheckSquare, FiUsers, FiBriefcase, FiTag, FiBarChart2, FiLogOut, FiMenu, FiCalendar, FiUser } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import Modal from "./Modal";

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
  const [open, setOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  // Esc key amukkina popup close aagum
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setShowLogout(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const confirmLogout = () => {
    setShowLogout(false);
    logout();
    navigate("/login");
  };

  return (
    <div className="app">
      <div className={`overlay ${open ? "show" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-logo"><FiCalendar /></span>
          <div className="brand-text">
            <strong>Staff Leave</strong>
            <small>Management System</small>
          </div>
        </div>
        <nav>
          {menus[user.role].map((m) => (
            <NavLink key={m.to} to={m.to} onClick={() => setOpen(false)}>
              {m.icon} {m.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setOpen(!open)}><FiMenu /></button>
          <div className="topbar-spacer" />
          <div
            className="user-chip clickable"
            title="View profile"
            onClick={() => navigate("/profile")}
          >
            <div className="avatar">{user.name.charAt(0)}</div>
            <div className="info">
              <div className="name">{user.name}</div>
              <div className="role">{user.role}</div>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setShowLogout(true)}>
            <FiLogOut /> Logout
          </button>
        </header>
        <main className="content">
          <Outlet />
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