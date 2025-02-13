// src/components/ThemeSwitcher.jsx

import { useState, useEffect } from "react";

export const applyTheme = (newTheme) => {
  const link = document.getElementById("theme-link");
  if (link) {
    link.href = `/themes/${newTheme}/theme.css`;
  }
};

export const switchToLight = () => {
  applyTheme("lara-light-indigo");
  localStorage.setItem("preferredTheme", "lara-light-indigo");
};

export const switchToDark = () => {
  applyTheme("lara-dark-indigo");
  localStorage.setItem("preferredTheme", "lara-dark-indigo");
};

export const useTheme = () => {
  const [theme, setTheme] = useState("lara-light-indigo");

  useEffect(() => {
    const savedTheme = localStorage.getItem("preferredTheme");
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      applyTheme("lara-light-indigo");
    }
  }, []);

  const setThemeAndApply = (newTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("preferredTheme", newTheme);
  };

  return { theme, setTheme: setThemeAndApply };
};

// Componente ThemeSwitcher (opcional, para un botón)
export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <button
        onClick={() => setTheme("lara-light-indigo")}
        style={{
          backgroundColor: theme === "lara-light-indigo" ? "#ccc" : "inherit",
        }}
      >
        Modo Claro
      </button>
      <button
        onClick={() => setTheme("lara-dark-indigo")}
        style={{
          backgroundColor: theme === "lara-dark-indigo" ? "#ccc" : "inherit",
        }}
      >
        Modo Oscuro
      </button>
    </div>
  );
}
