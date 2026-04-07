"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    // Sync state with the actual class on the document (handled by layout script)
    const isLight = document.documentElement.classList.contains("light-theme");
    setTheme(isLight ? "light" : "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "light") {
      document.documentElement.classList.add("light-theme");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.remove("light-theme");
      localStorage.setItem("theme", "dark");
    }
  };

  return (
    <button
      className="app-button-ghost"
      onClick={toggleTheme}
      type="button"
      style={{
        width: 40,
        height: 40,
        padding: 0,
        display: "grid",
        placeItems: "center",
        fontSize: "1.1rem",
        borderRadius: "12px",
      }}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  );
}
