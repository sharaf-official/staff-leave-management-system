import { useRef, useState } from "react";
import { FiEye, FiEyeOff, FiLock, FiCamera, FiTrash2 } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { getAvatar, saveAvatar, removeAvatar } from "../utils/avatar";

const emptyForm = { current: "", next: "", confirm: "" };

function getStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const strengthInfo = [
  { label: "Too weak", color: "#dc2626" },
  { label: "Weak", color: "#ea580c" },
  { label: "Fair", color: "#d97706" },
  { label: "Good", color: "#65a30d" },
  { label: "Strong", color: "#16a34a" },
];

const shortcuts = [
  ["G then D", "Dashboard"],
  ["G then A", "Apply leave"],
  ["G then H", "My history"],
  ["G then P", "Profile"],
  ["T", "Toggle dark mode"],
  ["Esc", "Close popup / menu"],
];

export default function Profile() {
  const { user, changePassword } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [success, setSuccess] = useState("");
  const [photo, setPhoto] = useState(() => getAvatar(user.email));
  const [photoMsg, setPhotoMsg] = useState("");
  const fileRef = useRef(null);

  const strength = getStrength(form.next);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setSuccess("");
  };

  const toggle = (field) => setShow({ ...show, [field]: !show[field] });

  const validate = () => {
    const e = {};

    if (!form.current) e.current = "Enter your current password.";

    if (form.next.length < 8) e.next = "New password must be at least 8 characters.";
    else if (!/[A-Za-z]/.test(form.next) || !/\d/.test(form.next))
      e.next = "Use at least one letter and one number.";
    else if (form.next === form.current) e.next = "New password must be different from the current one.";

    if (!form.confirm) e.confirm = "Confirm your new password.";
    else if (form.confirm !== form.next) e.confirm = "Passwords do not match.";

    return e;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    const result = changePassword(form.current, form.next);
    if (!result.ok) {
      setErrors({ current: result.message });
      return;
    }
    setForm(emptyForm);
    setSuccess("Password changed successfully.");
  };

  // ---- profile photo ----
  const handlePhoto = (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoMsg("Only JPG, PNG or WEBP images are allowed.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setPhotoMsg("Image must be smaller than 3 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const min = Math.min(img.width, img.height);
        canvas
          .getContext("2d")
          .drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
        const data = canvas.toDataURL("image/jpeg", 0.85);
        if (saveAvatar(user.email, data)) {
          setPhoto(data);
          setPhotoMsg("Profile photo updated.");
        } else {
          setPhotoMsg("Could not save the photo in this browser.");
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    removeAvatar(user.email);
    setPhoto(null);
    setPhotoMsg("Profile photo removed.");
  };

  const initials = user.name.split(" ").map((n) => n[0]).slice(0, 2).join("");

  const field = (name, label) => (
    <div className="us-field">
      <label htmlFor={name}>{label}</label>
      <div className="pf-input">
        <input
          id={name}
          name={name}
          type={show[name] ? "text" : "password"}
          value={form[name]}
          onChange={handleChange}
          autoComplete="off"
        />
        <button type="button" className="pf-eye" onClick={() => toggle(name)} aria-label={`Show or hide ${label}`}>
          {show[name] ? <FiEyeOff /> : <FiEye />}
        </button>
      </div>
      {errors[name] && <p className="rv-error">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="pf-grid">
      <div className="pf-left">
        <div className="card pf-profile">
          <div className="pf-photo">
            {photo ? <img src={photo} alt={`${user.name} profile`} /> : <div className="pf-avatar">{initials}</div>}
            <button className="pf-camera" onClick={() => fileRef.current.click()} aria-label="Change profile photo">
              <FiCamera />
            </button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handlePhoto} />
          </div>
          {photo && (
            <button className="pf-remove" onClick={handleRemovePhoto}><FiTrash2 /> Remove photo</button>
          )}
          {photoMsg && <p className="pf-photo-msg" role="status">{photoMsg}</p>}

          <h3>{user.name}</h3>
          <span className={`role-badge role-${user.role}`}>{user.role}</span>
          <div className="pf-details">
            <div><span>Email</span><b>{user.email}</b></div>
            <div><span>Department</span><b>{user.department || "-"}</b></div>
            <div><span>Role</span><b style={{ textTransform: "capitalize" }}>{user.role}</b></div>
          </div>
        </div>

        <div className="card">
          <h3 className="section-title">Keyboard shortcuts</h3>
          <ul className="kb-list">
            {shortcuts.map(([k, d]) => (
              <li key={k}><span>{d}</span><kbd>{k}</kbd></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title"><FiLock style={{ verticalAlign: "-2px" }} /> Change password</h3>
        {success && <div className="rv-toast" role="status">{success}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {field("current", "Current password")}
          {field("next", "New password")}

          {form.next && (
            <div className="pf-strength">
              <div className="pf-bars">
                {[1, 2, 3, 4].map((n) => (
                  <span key={n} style={{ background: n <= strength ? strengthInfo[strength].color : "#e2e8f0" }} />
                ))}
              </div>
              <small style={{ color: strengthInfo[strength].color }}>{strengthInfo[strength].label}</small>
            </div>
          )}

          {field("confirm", "Confirm new password")}

          <ul className="pf-rules">
            <li>At least 8 characters</li>
            <li>At least one letter and one number</li>
            <li>Different from your current password</li>
          </ul>

          <button type="submit" className="btn">Update password</button>
        </form>
      </div>
    </div>
  );
}