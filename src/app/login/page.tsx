"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { login } from "./actions";
import { PendingSubmitButton } from "@/components/ui/PendingSubmitButton";

type Role = "coordinador" | "docente";

const ROLES: { id: Role; label: string; icon: React.ReactNode }[] = [
  {
    id: "coordinador",
    label: "Coordinador",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/><path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2"/>
      </svg>
    ),
  },
  {
    id: "docente",
    label: "Docente",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
  },
];

/* ── Mini schedule preview (panel izquierdo) ─── */
function MiniSchedule() {
  const textMuted = "color-mix(in oklab, #F5F1E8 60%, transparent)";
  const textDim   = "color-mix(in oklab, #F5F1E8 55%, transparent)";
  const cell = (bg: string, text: string, textColor = "white") => (
    <div style={{ background: bg, borderRadius: 5, padding: "8px 6px", fontFamily: "Poppins, sans-serif", fontSize: 10, fontWeight: 600, color: textColor }}>{text}</div>
  );
  const empty = <div />;
  return (
    <div className="login-mini-sched">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: "color-mix(in oklab, #F5F1E8 85%, transparent)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#E0A93B", display: "inline-block" }} />
          Vista previa · 2026-I
        </span>
        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: textDim, letterSpacing: "0.08em" }}>SW-5A · PORTOVIEJO</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "44px repeat(5, 1fr)", fontFamily: "JetBrains Mono, monospace", fontSize: 10, gap: 2 }}>
        <div />
        {["L","M","X","J","V"].map(d => (
          <div key={d} style={{ textAlign: "center", color: textMuted, padding: "4px 0" }}>{d}</div>
        ))}

        <div style={{ color: textDim, padding: "8px 0", fontSize: 10 }}>07:00</div>
        {cell("#1D3FD9","Calidad")}
        {empty}
        {cell("#1D3FD9","Calidad")}
        {empty}
        <div style={{ background: "transparent", border: "1px dashed color-mix(in oklab, #F5F1E8 30%, transparent)", borderRadius: 5, padding: "8px 6px", fontFamily: "Poppins, sans-serif", fontSize: 10, color: textDim }}>Tut.</div>

        <div style={{ color: textDim, padding: "8px 0", fontSize: 10 }}>09:00</div>
        {empty}
        {cell("#E0A93B","BD II","#2a1e00")}
        {empty}
        {cell("#E0A93B","BD II","#2a1e00")}
        {empty}

        <div style={{ color: textDim, padding: "8px 0", fontSize: 10 }}>11:00</div>
        {cell("color-mix(in oklab, #F5F1E8 92%, transparent)","IA","#0E1116")}
        {empty}
        {cell("color-mix(in oklab, #F5F1E8 92%, transparent)","IA","#0E1116")}
        {empty}
        {cell("#2E7D5B","Arq.")}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 10, borderTop: "1px solid color-mix(in oklab, #F5F1E8 14%, transparent)", fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: textMuted }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Sin conflictos
        </span>
        <span>43 / 43 reglas OK</span>
      </div>
    </div>
  );
}

/* ─── Página login ─────────────────────────────────────────── */
function LoginPageContent() {
  const [role, setRole] = useState<Role>("coordinador");
  const [showPw, setShowPw] = useState(false);
  const searchParams = useSearchParams();
  const errorMsg = searchParams.get("error");
  const infoMsg = searchParams.get("msg");

  return (
    <div className="login-wrap">
      {/* ── Panel izquierdo oscuro ── */}
      <aside className="login-art">
        <div className="login-art-grid" />

        <Link href="/" className="sigghas-brand" style={{ position: "relative", zIndex: 1 }}>
          <div className="sigghas-brand-mark" style={{ background: "#F5F1E8", color: "#0E1116" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h2v2H8zM14 14h2v2h-2z"/>
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div className="sigghas-brand-name" style={{ color: "#F5F1E8" }}>SIGGHAS</div>
            <div className="sigghas-brand-sub">PUCE · Software</div>
          </div>
        </Link>

        <div className="login-quote">
          <span className="s-eyebrow" style={{ color: "color-mix(in oklab, #F5F1E8 60%, transparent)" }}>Sistema Inteligente de Horarios</span>
          <h2>
            Acceso seguro<br />
            a la planificación<br />
            <em>de la Carrera de Software.</em>
          </h2>
          <MiniSchedule />
          <div className="login-foot">
            <span>Pontificia Universidad Católica del Ecuador</span>
            <span>Portoviejo</span>
          </div>
        </div>
      </aside>

      {/* ── Panel derecho: formulario ── */}
      <main className="login-form-wrap">
        <form className="login-form" action={login}>
          <div>
            <span className="s-eyebrow">Acceso institucional</span>
            <h1>Inicia sesión<br />en SIGGHAS.</h1>
            <p className="s-body" style={{ marginTop: 14, maxWidth: 380 }}>
              Selecciona tu rol y usa tus credenciales institucionales de la PUCE.
            </p>
          </div>

          {/* Mensaje informativo (p.ej. confirma tu correo) */}
          {infoMsg && (
            <div style={{
              background: "color-mix(in oklab, #1D3FD9 10%, transparent)",
              border: "1px solid color-mix(in oklab, #1D3FD9 30%, transparent)",
              borderRadius: 8,
              padding: "12px 16px",
              fontSize: 14,
              color: "#1D3FD9",
              fontWeight: 500,
            }}>
              {infoMsg}
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <div style={{
              background: "color-mix(in oklab, #C8523B 12%, transparent)",
              border: "1px solid color-mix(in oklab, #C8523B 35%, transparent)",
              borderRadius: 8,
              padding: "12px 16px",
              fontSize: 14,
              color: "#C8523B",
              fontWeight: 500,
            }}>
              {errorMsg}
            </div>
          )}

          {/* Role picker */}
          <div className="s-field role-selector" style={{ gap: 10 }}>
            <label>Soy</label>
            <div className="role-pick">
              {ROLES.map(({ id, label, icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`role-pick-btn${role === id ? " active" : ""}`}
                  onClick={() => setRole(id)}
                  aria-pressed={role === id}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
            <input type="hidden" name="role" value={role} />
          </div>

          {/* Email */}
          <div className="s-field">
            <label htmlFor="email">Correo institucional</label>
            <div className="s-input-shell">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}>
                <path d="M4 4h16c1 0 2 1 2 2v12c0 1-1 2-2 2H4c-1 0-2-1-2-2V6c0-1 1-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input id="email" name="email" type="email" placeholder="nombre.apellido@puce.edu.ec" autoComplete="email" required />
            </div>
          </div>

          {/* Password */}
          <div className="s-field">
            <label htmlFor="password">Contraseña</label>
            <div className="s-input-shell">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}>
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <input id="password" name="password" type={showPw ? "text" : "password"} placeholder="••••••••" autoComplete="current-password" required />
              <button type="button" className="s-toggle-btn" aria-label="Mostrar contraseña" onClick={() => setShowPw(v => !v)}>
                {showPw ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.06 10.06 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Row */}
          <div className="s-field-row">
            <label className="s-checkbox">
              <input type="checkbox" name="remember" />
              Mantener sesión iniciada
            </label>
            <a href="#">¿Olvidaste tu contraseña?</a>
          </div>

          {/* Submit */}
          <PendingSubmitButton pendingLabel="Iniciando sesión…" className="s-btn s-btn-primary s-btn-lg" style={{ width: "100%", justifyContent: "center", height: 48 }}>
            Iniciar sesión
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
          </PendingSubmitButton>

          <p className="s-small" style={{ textAlign: "center", margin: "8px 0 0", lineHeight: 1.5 }}>
            ¿Eres docente y te acaba de registrar el coordinador?{" "}
            <span style={{ color: "#4A515E" }}>Usa el correo y la contraseña temporal que te compartieron.</span>
          </p>

          <p className="s-small" style={{ textAlign: "center", margin: "4px 0 0", lineHeight: 1.5 }}>
            ¿Necesitas ayuda para registrarte?{" "}
            <a href="/registro" style={{ color: "#1D3FD9", fontWeight: 500 }}>Ver instrucciones</a>
          </p>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, paddingTop: 24, borderTop: "1px solid #D8D1BD", fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, color: "#8A8F99", letterSpacing: "0.05em" }}>
            <span>v0.4.2 · 2026-I</span>
            <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#8A8F99", textDecoration: "none" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Volver al inicio
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
}
