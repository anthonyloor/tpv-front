// src/MobileDashboard.jsx
import NavbarCard from "./components/Navbar/NavbarCard";
import React from "react";

export default function MobileDashboard() {
  return (
    <div className="grid grid-cols-1 grid-rows-[auto,1fr,1fr,1fr,1fr] gap-2 p-2 h-screen">
      <div className="bg-white shadow row-span-1 rounded-lg">
        <NavbarCard />
      </div>

      <div className="bg-white shadow row-span-4 rounded-lg overflow-auto relative">
        <h1 className="text-lg text-center font-bold p-4">Panel Administración Móvil</h1>
        <div
          id="mobile-modals-container"
          className="absolute inset-0"
          style={{ pointerEvents: "none" }}
        />
      </div>
    </div>
  );
}