export const THEME_STORAGE_KEY = "jdp-theme";

/** Only explicit `jdp-theme=dark` in localStorage enables dark mode. */
export function resolveStoredTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function applyThemeToDocument(theme: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
}

/** Runs before React hydration to avoid dark flash from stale/OS state. */
export const THEME_INIT_SCRIPT = `(function(){try{var k='${THEME_STORAGE_KEY}';var t=localStorage.getItem(k);var r=document.documentElement;r.classList.remove('dark','light');if(t==='dark'){r.classList.add('dark');}else{r.classList.add('light');if(t!=='light'){localStorage.setItem(k,'light');}}localStorage.removeItem('theme');}catch(e){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');}})();`;
