import "./sentry";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const GA_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID

if (GA_ID) {
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = function(...args: any[]) { window.dataLayer.push(args) }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID)
}

createRoot(document.getElementById("root")!).render(<App />);