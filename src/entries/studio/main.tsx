import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppUser } from "./AppUser";
import "@/index.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <AppUser />
    </StrictMode>
  );
}
