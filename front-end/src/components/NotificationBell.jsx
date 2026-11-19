import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBell, FiCheckCircle, FiXCircle, FiInfo } from "react-icons/fi";
import { api } from "../api";

const icons = {
  success: <FiCheckCircle />,
  danger: <FiXCircle />,
  info: <FiInfo />,
};
// notification type from the server -> icon style
const look = { approved: "success", rejected: "danger", leave_request: "info", cancelled: "info" };

const ago = (value) => {
  const t = new Date(String(value).replace(" ", "T")).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const ref = useRef(null);

  const unread = items.filter((n) => !n.read).length;

  const pull = () =>
    api("/notifications").then(({ notifications }) => setItems(notifications)).catch(() => {});

  // first load + refresh every 30 seconds
  useEffect(() => {
    let alive = true;
    const run = () =>
      api("/notifications")
        .then(({ notifications }) => alive && setItems(notifications))
        .catch(() => {});
    run();
    const timer = setInterval(run, 30000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const toggle = () => {
    if (!open) pull();
    setOpen(!open);
  };

  const markAll = async () => {
    setItems((list) => list.map((n) => ({ ...n, read: true })));
    try {
      await api("/notifications/read-all", { method: "POST" });
    } catch {
      pull();
    }
  };

  const openOne = async (n) => {
    setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    setOpen(false);
    if (!n.read) api(`/notifications/${n.id}/read`, { method: "PATCH" }).catch(() => {});
    if (n.link) navigate(n.link);
  };

  return (
    <div className="bell-wrap" ref={ref}>
      <button
        className="round-btn"
        onClick={toggle}
        aria-label={`Notifications, ${unread} unread`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <FiBell />
        {unread > 0 && <span className="bell-badge">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="bell-panel" role="menu">
          <div className="bell-head">
            <b>Notifications</b>
            <button className="bell-mark" onClick={markAll} disabled={unread === 0}>
              Mark all as read
            </button>
          </div>
          {items.length === 0 && <p className="bell-empty">No notifications yet.</p>}
          {items.map((n) => {
            const kind = look[n.type] || "info";
            return (
              <button
                key={n.id}
                className={`bell-item ${n.read ? "" : "unread"}`}
                onClick={() => openOne(n)}
                role="menuitem"
              >
                <span className={`bell-icon ${kind}`}>{icons[kind]}</span>
                <span className="bell-text">
                  <span><b>{n.title}</b></span>
                  <span>{n.message}</span>
                  <small>{ago(n.createdAt)}</small>
                </span>
                {!n.read && <i className="bell-dot" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}