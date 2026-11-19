import { useEffect, useState } from "react";
import { FiSave, FiLock } from "react-icons/fi";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { DxHead, DxCard } from "../components/Dx";

const industries = ["Technology", "Retail", "Manufacturing", "Education", "Healthcare", "Finance", "Hospitality", "Construction", "Other"];
const sizes = ["1-10", "11-50", "51-200", "201-500", "500+"];
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function Company() {
  const { user } = useAuth();
  const canEdit = user.role === "admin";
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    api("/company")
      .then(({ company }) => setForm(company))
      .catch((err) => setLoadError(err.message));
  }, []);

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: "", form: "" }));
    setMessage("");
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Enter the company name.";
    if (!form.phone.trim()) e.phone = "Enter a contact phone number.";
    if (!emailOk(form.email)) e.email = "Enter a valid company email.";
    if (!form.city.trim()) e.city = "Enter the city.";
    return e;
  };

  const save = async (ev) => {
    ev.preventDefault();
    if (saving || !canEdit) return;
    const e = validate();
    if (Object.keys(e).length) return setErrors(e);
    setSaving(true);
    try {
      const { company } = await api("/company", { method: "PUT", body: form });
      setForm(company);
      setMessage("Company details saved.");
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loadError) return <div className="dx"><p className="ap-err" role="alert">{loadError}</p></div>;
  if (!form) return <div className="dx"><p className="dx-muted">Loading...</p></div>;

  const field = (name, label, props = {}) => (
    <div className="ap-field">
      <label className="ap-label" htmlFor={`co-${name}`}>{label}</label>
      <input id={`co-${name}`} value={form[name]} disabled={!canEdit}
             onChange={(e) => set(name, e.target.value)} {...props} />
      {errors[name] && <p className="ap-err">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="dx">
      <DxHead
        eyebrow="Settings"
        title="Company profile"
        subtitle={canEdit
          ? "These details belong to your company. Only the admin can change them."
          : "Only the company admin can change these details."}
      />

      <DxCard>
        <form onSubmit={save} noValidate className="ap-form">
          {form.isDemo && (
            <p className="dx-note"><FiLock /> This is the demo company. Its details cannot be changed.</p>
          )}

          {field("name", "Company name")}
          <div className="ap-row">
            {field("registrationNo", "Registration no. (optional)")}
            <div className="ap-field">
              <label className="ap-label" htmlFor="co-industry">Industry</label>
              <input id="co-industry" list="co-industries" value={form.industry} disabled={!canEdit}
                     onChange={(e) => set("industry", e.target.value)} />
              <datalist id="co-industries">{industries.map((x) => <option key={x} value={x} />)}</datalist>
            </div>
          </div>
          <div className="ap-row">
            <div className="ap-field">
              <label className="ap-label" htmlFor="co-size">Company size</label>
              <input id="co-size" list="co-sizes" value={form.size} disabled={!canEdit}
                     onChange={(e) => set("size", e.target.value)} />
              <datalist id="co-sizes">{sizes.map((x) => <option key={x} value={x} />)}</datalist>
            </div>
            {field("phone", "Phone", { placeholder: "+94 11 234 5678" })}
          </div>
          {field("email", "Company email", { type: "email" })}
          {field("address", "Address")}
          <div className="ap-row">
            {field("city", "City")}
            {field("country", "Country")}
          </div>

          {errors.form && <p className="ap-err" role="alert">{errors.form}</p>}
          {message && <p className="dx-note" role="status">{message}</p>}

          {canEdit && !form.isDemo && (
            <div className="dx-actions">
              <button type="submit" className="dx-btn primary" disabled={saving}>
                <FiSave /> {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          )}
        </form>
      </DxCard>
    </div>
  );
}