const KEY = "theme";

export const getTheme = () => {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    /* storage blocked */
  }
  return "light";
};

export const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* storage blocked */
  }
};