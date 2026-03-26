
  import * as Sentry from "@sentry/react";
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./styles/globals.css";

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN || "",
    environment: import.meta.env.MODE,
    enabled: !!import.meta.env.VITE_SENTRY_DSN,
    tracesSampleRate: 0.2,
  });

  createRoot(document.getElementById("root")!).render(
    <Sentry.ErrorBoundary fallback={<SentryFallback />}>
      <App />
    </Sentry.ErrorBoundary>
  );

  function SentryFallback() {
    return (
      <div style={{ padding: 40, textAlign: "center", fontFamily: "system-ui" }}>
        <h2 style={{ color: "#12332B" }}>Something went wrong</h2>
        <p style={{ color: "#667085" }}>An unexpected error occurred. Please refresh the page.</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 16, padding: "8px 24px", background: "#0F766E",
            color: "#fff", border: "none", borderRadius: 8, cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>
    );
  }
