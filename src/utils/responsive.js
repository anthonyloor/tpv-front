import { useState, useEffect } from "react";


export function useIsCompact() {
  const checkCompact = () =>
    // 960x1600 es el breakpoint para considerar "compacto" donde 960 es el alto y 1600 el ancho
    window.innerHeight <= 900 || window.innerWidth <= 1900;
  const [isCompact, setIsCompact] = useState(checkCompact());

  useEffect(() => {
    const handleResize = () => {
      setIsCompact(checkCompact());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isCompact;
}
