import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Placeholder: the real app (router, pages, styles) lands in phase 2.
function App() {
  return <p>Dozokit Ideas</p>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
