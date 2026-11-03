import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { defineCustomElements } from "@ionic/pwa-elements/loader";
import { setupIonicReact } from "@ionic/react";
import "@ionic/react/css/core.css";
import { App } from "./app/App";

setupIonicReact();
void defineCustomElements(window);

const container = document.getElementById("root");
if (!container) throw new Error("root elementi bulunamadı");

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
