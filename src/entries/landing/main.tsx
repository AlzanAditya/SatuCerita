import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppLanding } from "./AppLanding";
import "@/index.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <AppLanding />
    </StrictMode>
  );
}
