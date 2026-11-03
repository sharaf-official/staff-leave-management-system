import { useEffect, useRef, useState } from "react";
import { FiBell, FiCheckCircle, FiXCircle, FiInfo } from "react-icons/fi";
import { notificationsByRole } from "../data/mockData";

const icons = {
  success: <FiCheckCircle />,
  danger: <FiXCircle />,
  info: <FiInfo />,
};

export default function NotificationBell({ role }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(() =>
    (notificationsByRole[role] || []).map((n) => ({ ...n, read: false }))
  );
  const ref = useRef(null);

  const unread = items.filter((n) => !n.read).length;

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

  const markAll = () => setItems(items.map((n) => ({ ...n, read: true })));
  const markOne = (id) => setItems(items.map((n) => (n.id === id ? { ...n, read: true } : n)));

  return (
    <div className="bell-wrap" ref={ref}>
      <button
        className="round-btn"
        onClick={() => setOpen(!open)}
        aria-label={`Notifications, ${unread} unread`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <FiBell />
        {unread > 0 && <span className="bell-badge">{unread}</span>}
      </button>

      {open && (
        <div className="bell-panel" role="menu">
          <div className="bell-head">
            <b>Notifications</b>
            <button className="bell-mark" onClick={markAll} disabled={unread === 0}>
              Mark all as read
            </button>
          </div>
          {items.length === 0 && <p className="bell-empty">No notifications.</p>}
          {items.map((n) => (
            <button
              key={n.id}
              className={`bell-item ${n.read ? "" : "unread"}`}
              onClick={() => markOne(n.id)}
              role="menuitem"
            >
              <span className={`bell-icon ${n.type}`}>{icons[n.type]}</span>
              <span className="bell-text">
                <span>{n.text}</span>
                <small>{n.time}</small>
              </span>
              {!n.read && <i className="bell-dot" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}