const key = (email) => `avatar:${email}`;

export const getAvatar = (email) => {
  try {
    return localStorage.getItem(key(email));
  } catch {
    return null;
  }
};

export const saveAvatar = (email, data) => {
  try {
    localStorage.setItem(key(email), data);
  } catch {
    return false;
  }
  window.dispatchEvent(new Event("avatar-changed"));
  return true;
};

export const removeAvatar = (email) => {
  try {
    localStorage.removeItem(key(email));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("avatar-changed"));
};