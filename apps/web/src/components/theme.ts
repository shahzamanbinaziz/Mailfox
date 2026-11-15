"use client";

import { useSyncExternalStore } from "react";

export type ThemeMode = "light" | "dark" | "system";
const KEY = "mf-theme";

function systemDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function getStoredTheme(): ThemeMode {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

/** Apply + persist a theme. "system" follows the OS setting. */
export function setTheme(mode: ThemeMode) {
  try {
    if (mode === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, mode);
  } catch {
    /* storage unavailable — still apply for this page */
  }
  document.documentElement.classList.toggle("dark", mode === "dark" || (mode === "system" && systemDark()));
  window.dispatchEvent(new Event("mf-theme"));
}

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  window.addEventListener("mf-theme", cb);
  return () => {
    obs.disconnect();
    window.removeEventListener("mf-theme", cb);
  };
}

/** Whether dark mode is currently applied. */
export function useIsDark(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
}

export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(subscribe, getStoredTheme, () => "system" as ThemeMode);
}
