// src/components/PortalOrNormal.jsx
import { createPortal } from "react-dom";

export default function PortalOrNormal({
  children,
  isInlineMode,
  portalId = "mobile-modals-container",
}) {
  if (isInlineMode) {
    const portalContainer = document.getElementById(portalId);
    if (!portalContainer) {
      // fallback: si no existe el contenedor, al menos render normal
      return children;
    }
    return createPortal(children, portalContainer);
  }
  // Desktop => render normal
  return children;
}
