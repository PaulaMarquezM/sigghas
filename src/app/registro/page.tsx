import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="login-wrap">
      <aside className="login-art">
        <div className="login-art-grid" />

        <Link href="/" className="sigghas-brand" style={{ position: "relative", zIndex: 1 }}>
          <div className="sigghas-brand-mark" style={{ background: "#F5F1E8", color: "#0E1116" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="M8 14h2v2H8zM14 14h2v2h-2z" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div className="sigghas-brand-name" style={{ color: "#F5F1E8" }}>SIGGHAS</div>
            <div className="sigghas-brand-sub">PUCE · Software</div>
          </div>
        </Link>

        <div className="login-quote">
          <span className="s-eyebrow" style={{ color: "color-mix(in oklab, #F5F1E8 60%, transparent)" }}>
            Acceso docente
          </span>
          <h2>
            Tu cuenta la<br />
            crea el<br />
            <em>coordinador.</em>
          </h2>
          <p style={{ color: "color-mix(in oklab, #F5F1E8 60%, transparent)", fontSize: 15, lineHeight: 1.6, marginTop: 20, maxWidth: 400 }}>
            Una vez registrado, inicia sesión con tu correo institucional y la contraseña temporal que te compartieron.
          </p>
        </div>
      </aside>

      <main className="login-form-wrap">
        <div className="login-form">
          <div>
            <span className="s-eyebrow">Registro deshabilitado</span>
            <h1>Los docentes no se auto-registran.</h1>
            <p className="s-body" style={{ marginTop: 14, maxWidth: 420 }}>
              El coordinador académico te agrega en el sistema y te entrega una contraseña temporal.
              En el primer acceso deberás elegir tu propia contraseña.
            </p>
          </div>

          <div
            style={{
              background: "color-mix(in oklab, #1D3FD9 10%, transparent)",
              border: "1px solid color-mix(in oklab, #1D3FD9 30%, transparent)",
              borderRadius: 8,
              padding: "14px 16px",
              fontSize: 14,
              color: "#1D3FD9",
              lineHeight: 1.5,
            }}
          >
            Si aún no tienes credenciales, pídeselas al coordinador de la carrera.
          </div>

          <Link
            href="/login"
            className="s-btn s-btn-primary s-btn-lg"
            style={{ width: "100%", justifyContent: "center", height: 48, textDecoration: "none" }}
          >
            Ir a iniciar sesión
          </Link>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, paddingTop: 24, borderTop: "1px solid #D8D1BD", fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, color: "#8A8F99", letterSpacing: "0.05em" }}>
            <span>v0.4.2 · 2026-I</span>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#8A8F99", textDecoration: "none" }}>
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
