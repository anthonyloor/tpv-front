// src/MobileDashboard.jsx

import React from "react";
import NavbarCard from "./components/Navbar/NavbarCard";

export default function MobileDashboard() {
  return (
    <div className="flex flex-col h-screen gap-2 p-2">
      {/* Navbar arriba */}
      <div className="bg-white shadow rounded-lg">
        <NavbarCard />
      </div>

      {/* Contenido principal (scrollable) */}
      <div className="bg-white shadow rounded-lg overflow-auto relative flex-auto">
        <h1 className="text-lg text-center font-bold p-4">
          Panel Administración Móvil
        </h1>

        {/* Aquí tu contenido “infinito” que scrollea */}
        <div className="p-2">
          {/* Ejemplo: */}
          <p className="mb-4">
            Este es el contenido principal en móvil, que puede crecer todo lo
            que quiera y hacer scroll.
          </p>
        </div>

        {/* Portal para modales en móvil */}
        <div
          id="mobile-modals-container"
          className="absolute inset-0 pointer-events-none"
        />
      </div>
    </div>
  );
}
