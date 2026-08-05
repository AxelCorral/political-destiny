"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          background: "#f8f5ee",
          color: "#102139",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
          <div
            style={{
              maxWidth: 560,
              border: "1px solid #d8d6d0",
              borderRadius: 20,
              background: "#fffdf8",
              padding: 32,
              textAlign: "center",
            }}
          >
            <h1>Incident de chargement</h1>
            <p>Réessayez pour retrouver votre dernière sauvegarde locale.</p>
            <button
              type="button"
              onClick={reset}
              style={{
                minHeight: 44,
                border: 0,
                borderRadius: 12,
                background: "#1d56a0",
                color: "white",
                padding: "12px 20px",
                fontWeight: 800,
              }}
            >
              Réessayer
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
