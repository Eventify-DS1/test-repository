import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

// Ocultar el loader inicial cuando React esté listo
setTimeout(() => {
  const loader = document.getElementById('initial-loader');
  if (loader) {
    loader.classList.add('fade-out');
    // Eliminar del DOM después de la animación
    setTimeout(() => loader.remove(), 500);
  }
}, 800); // Mínimo 800ms para que se vea el loader
