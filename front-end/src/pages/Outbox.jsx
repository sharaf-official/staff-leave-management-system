import { useCallback, useEffect, useState } from "react";
import { FiMail, FiTrash2, FiInbox } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

const typeLabel = { invitation: "Invitation", leave_request: "Leave request", decision: "Decision" };

export default function Outbox() {
  const { user } = useAuth();
  const [mails, setMails] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const { mails: list } = await api("/outbox");
      setMails(list);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const selected = mails.find((m) => m.id === selectedId) || mails[0];

  const clear = async () => {
    try {
      await api("/outbox", { method: "DELETE" });
      setSelectedId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="ue-page">
      <div className="ue-head">
        <div>
          <h2>Email Outbox <span className="ue-demo">Demo</span></h2>
          <p>
            Preview of the emails Leave Nest sends. In the live system these go out through Nodemailer;
            {user.role === "admin" ? " you see all company emails." : " you see emails addressed to you."}
          </p>
        </div>
        {user.role === "admin" && mails.length > 0 && (
          <button className="ue-ghost" onClick={clear}><FiTrash2 /> Clear</button>
        )}
      </div>

      {error && <div className="rv-toast" role="alert">{error}</div>}

      {mails.length === 0 ? (
        <div className="card ue-emptybox">
          <FiInbox />
          <h3>No emails yet</h3>
          <p>Add an employee or submit a leave request and the email will appear here.</p>
        </div>
      ) : (
        <div className="ue-mail">
          <div className="card ue-list">
            {mails.map((m) => (
              <button key={m.id} className={`ue-item ${selected?.id === m.id ? "on" : ""}`} onClick={() => setSelectedId(m.id)}>
                <span className={`ue-type t-${m.type}`}>{typeLabel[m.type] || "Email"}</span>
                <b>{m.subject}</b>
                <small>To: {m.to}</small>
                <small>{new Date(m.createdAt).toLocaleString()}</small>
              </button>
            ))}
          </div>

          {selected && (
            <div className="card ue-view">
              <div className="ue-view-head">
                <span className="ue-mail-ico"><FiMail /></span>
                <div>
                  <h3>{selected.subject}</h3>
                  <small>From: Leave Nest &lt;no-reply@leavenest.app&gt;</small>
                  <small>To: {selected.to}</small>
                </div>
              </div>
              <pre className="ue-body">{selected.body}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}