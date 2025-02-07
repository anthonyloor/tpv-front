// src/MobileDashboard.jsx
import NavbarCard from "./components/Navbar/NavbarCard";
import React from 'react';

export default function MobileDashboard() {
  return (
    <div className="p-4">
      <div className="col-span-3 bg-white shadow row-span-1 rounded-lg">
        <NavbarCard />
      </div>
      <h1 className="text-lg font-bold">Panel Móvil</h1>
      {/* 
        Coloca aquí cualquier layout extra que quieras para la vista móvil.
        Los modales (transferencias, reportes, etc.) se abren ahora desde NavbarCard.
      */}
      <p>Pantalla principal en móvil.</p>
    </div>
  );
}
