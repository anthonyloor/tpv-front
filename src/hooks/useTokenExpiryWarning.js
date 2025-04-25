import { useEffect } from "react";
import { jwtDecode } from "jwt-decode";

export const useTokenExpiryWarning = (warningCallback, warningMinutes = 5) => {
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    let interval;
    try {
      const decoded = jwtDecode(token);
      const expTime = decoded.exp * 1000; // convertir a milisegundos
      const now = Date.now();
      // Tiempo para iniciar el aviso: queden warningMinutes minutos
      const warningTime = expTime - warningMinutes * 60 * 1000;
      const delay = warningTime - now;
      if (delay > 0) {
        const timeout = setTimeout(() => {
          // Desde el momento del aviso, actualiza cada segundo
          interval = setInterval(() => {
            const remaining = Math.max(0, expTime - Date.now());
            warningCallback(remaining);
            if (remaining <= 0) {
              clearInterval(interval);
            }
          }, 1000);
        }, delay);
        return () => {
          clearTimeout(timeout);
          if (interval) clearInterval(interval);
        };
      } else {
        // Si ya estamos en la ventana de aviso, iniciamos de inmediato
        interval = setInterval(() => {
          const remaining = Math.max(0, expTime - Date.now());
          warningCallback(remaining);
          if (remaining <= 0) {
            clearInterval(interval);
          }
        }, 1000);
        return () => clearInterval(interval);
      }
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  }, [warningCallback, warningMinutes]);
};
