// src/components/ThemeSwitcher.jsx

import { useState, useEffect, useCallback } from "react";

export const applyTheme = (newTheme) => {
  const link = document.getElementById("theme-link");
  if (link) {
    link.href = `/themes/${newTheme}/theme.css`;
  }
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

  const setThemeAndApply = useCallback((newTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("preferredTheme", newTheme);
  }, []);

  return { theme, setTheme: setThemeAndApply };
};
