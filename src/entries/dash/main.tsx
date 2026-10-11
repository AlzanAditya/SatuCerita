import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppDash } from "./AppDash";
import "@/index.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <AppDash />
    </StrictMode>
  );
}
