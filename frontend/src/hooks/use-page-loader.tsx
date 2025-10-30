import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export function usePageLoader(minDurationMs: number = 400) {
  const location = useLocation();
  const [active, setActive] = useState<boolean>(false);

  useEffect(() => {
    // Activar loader en cambios de ruta
    setActive(true);
    const timeout = setTimeout(() => setActive(false), minDurationMs);
    return () => clearTimeout(timeout);
  }, [location.pathname, minDurationMs]);

  return active;
}


