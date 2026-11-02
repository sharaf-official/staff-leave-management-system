import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const menus = {
  employee: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/apply", label: "Apply Leave" },
    { to: "/history", label: "My History" },
  ],
  manager: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/apply", label: "Apply Leave" },
    { to: "/history", label: "My History" },
    { to: "/approvals", label: "Team Requests" },
  ],
  admin: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/users", label: "Users" },
    { to: "/departments", label: "Departments" },
    { to: "/leave-types", label: "Leave Types" },
    { to: "/reports", label: "Reports" },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <h2 className="brand">Leave Manager</h2>
        <nav>
          {menus[user.role].map((m) => (
            <NavLink key={m.to} to={m.to} onClick={() => setOpen(false)}>
              {m.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <button className="menu-btn" onClick={() => setOpen(!open)}>☰</button>
          <span>{user.name} ({user.role})</span>
          <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}