// src/components/ThemeSwitcher.jsx
import React, { useEffect, useState } from "react";

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState("lara-light-indigo");

  // Al montar, leemos localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("preferredTheme");
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // forzamos modo claro por defecto
      applyTheme("lara-light-indigo");
    }
  }, []);

  // Cambiar la etiqueta link
  const applyTheme = (newTheme) => {
    const link = document.getElementById("theme-link");
    if (link) {
      link.href = `/themes/${newTheme}/theme.css`;
    }
  };

  // Handler para cambiar
  const switchToLight = () => {
    setTheme("lara-light-indigo");
    applyTheme("lara-light-indigo");
    localStorage.setItem("preferredTheme", "lara-light-indigo");
  };

  const switchToDark = () => {
    setTheme("lara-dark-indigo");
    applyTheme("lara-dark-indigo");
    localStorage.setItem("preferredTheme", "lara-dark-indigo");
  };

  return (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <button
        onClick={switchToLight}
        style={{
          backgroundColor: theme === "lara-light-indigo" ? "#ccc" : "inherit",
        }}
      >
        Modo Claro
      </button>
      <button
        onClick={switchToDark}
        style={{
          backgroundColor: theme === "lara-dark-indigo" ? "#ccc" : "inherit",
        }}
      >
        Modo Oscuro
      </button>
    </div>
  );
}
