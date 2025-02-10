// src/components/ThemeSwitcher.jsx
import React from "react";
import { Button } from "primereact/button";

const ThemeSwitcher = () => {
  const switchTheme = (newTheme) => {
    const themeLink = document.getElementById("theme-link");
    if (themeLink) {
      themeLink.href = `/themes/${newTheme}/theme.css`;
      console.log(`Tema cambiado a ${newTheme}`);
    }
  };

  const switchToLight = () => {
    switchTheme("lara-light-indigo");
  };

  const switchToDark = () => {
    switchTheme("lara-dark-indigo");
  };

  return (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <Button label="Claro" onClick={switchToLight} className="p-button-text" />
      <Button label="Oscuro" onClick={switchToDark} className="p-button-text" />
    </div>
  );
};

export default ThemeSwitcher;