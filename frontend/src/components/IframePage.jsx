import { useEffect, useState } from "react";

/**
 * Full-page loading overlay shown on iframe pages until the embedded
 * HTML finishes loading. Style mirrors the Ticketmaster "Aguarde um momento"
 * loader (white card, blue circular spinner, subtitle).
 */
export default function IframePage({ src, title, testId, subtitle = "Carregando o último endereço utilizado", showLoader = true }) {
  const [loaded, setLoaded] = useState(!showLoader);
  const [v] = useState(() => Date.now());

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.margin = "";
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    // Force a minimum overlay duration so the loader is always visible
    const t = setTimeout(() => setLoaded((v) => v || false), 0);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#f1f3f8" }}>
      <iframe
        src={`${src}?v=${v}`}
        title={title}
        data-testid={testId}
        onLoad={() => {
          // small delay so the loader doesn't blink on cached navigations
          setTimeout(() => setLoaded(true), 350);
        }}
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          border: 0,
          margin: 0,
          padding: 0,
          background: "#fff",
          opacity: loaded ? 1 : 0,
          transition: "opacity .25s ease",
        }}
      />

      {!loaded && showLoader && (
        <div
          data-testid="page-loader"
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.92)",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              textAlign: "center",
              fontFamily:
                'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              color: "#1f2a44",
            }}
          >
            <div
              style={{
                width: 88,
                height: 88,
                border: "6px solid rgba(10,71,225,0.18)",
                borderTopColor: "#0a47e1",
                borderRadius: "50%",
                margin: "0 auto 28px",
                animation: "dr-spin 0.9s linear infinite",
              }}
            />
            <div style={{ fontSize: "1.4rem", fontWeight: 600, marginBottom: 10, color: "#222" }}>
              Aguarde um momento
            </div>
            <div style={{ fontSize: "0.95rem", color: "#5a6480" }}>{subtitle}</div>
          </div>
          <style>{`@keyframes dr-spin { from {transform: rotate(0deg);} to {transform: rotate(360deg);} }`}</style>
        </div>
      )}
    </div>
  );
}
