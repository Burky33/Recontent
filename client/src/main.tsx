import "./sentry";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import posthog from "posthog-js";

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

const PH_KEY = import.meta.env.VITE_POSTHOG_KEY
const PH_HOST = import.meta.env.VITE_POSTHOG_HOST

if (PH_KEY) {
  posthog.init(PH_KEY, {
    api_host: PH_HOST || "https://us.i.posthog.com",
    capture_pageview: true,
    capture_pageleave: true,
    session_recording: { enabled: true },
  })
}

createRoot(document.getElementById("root")!).render(<App />);