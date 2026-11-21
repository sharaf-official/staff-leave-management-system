const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "leavenest-token";

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage blocked */
  }
};

// number of requests running now (the loading bar listens to this)
let pending = 0;
const announce = () => window.dispatchEvent(new CustomEvent("api-loading", { detail: pending }));

export async function api(path, { method = "GET", body } = {}) {
  pending += 1;
  announce();
  try {
    let res;
    try {
      res = await fetch(`${BASE}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new Error("Cannot reach the server. Is the back-end running?");
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.message || "Request failed.");
      err.status = res.status;
      throw err;
    }
    return data;
  } finally {
    pending -= 1;
    announce();
  }
}