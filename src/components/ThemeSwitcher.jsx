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

  return (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <Button
        label="Claro"
        onClick={() => switchTheme("lara-light-indigo")}
        className="p-button-text"
      />
      <Button
        label="Oscuro"
        onClick={() => switchTheme("lara-dark-indigo")}
        className="p-button-text"
      />
    </div>
  );
};

export default ThemeSwitcher;
