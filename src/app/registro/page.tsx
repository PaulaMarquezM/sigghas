"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { register } from "./actions";

type Role = "coordinador" | "docente" | "estudiante";

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
  {
    id: "estudiante",
    label: "Estudiante",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/>
      </svg>
    ),
  },
];

function RegisterFormContent() {
  const [role, setRole] = useState<Role>("estudiante");
  const [showPw, setShowPw] = useState(false);
  const searchParams = useSearchParams();
  const errorMsg = searchParams.get("error");

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
          <span className="s-eyebrow" style={{ color: "color-mix(in oklab, #F5F1E8 60%, transparent)" }}>
            Únete al sistema
          </span>
          <h2>
            Tu horario,<br />
            siempre<br />
            <em>sin conflictos.</em>
          </h2>
          <p style={{ color: "color-mix(in oklab, #F5F1E8 60%, transparent)", fontSize: 15, lineHeight: 1.6, marginTop: 20, maxWidth: 400 }}>
            Crea tu cuenta con tu correo institucional de la PUCE y accede a tu horario académico actualizado en tiempo real.
          </p>
          <div className="login-foot">
            <span>Pontificia Universidad Católica del Ecuador</span>
            <span>Portoviejo</span>
          </div>
        </div>
      </aside>

      {/* ── Panel derecho: formulario ── */}
      <main className="login-form-wrap">
        <form className="login-form" action={register}>
          <div>
            <span className="s-eyebrow">Acceso institucional</span>
            <h1>Crea tu cuenta<br />en SIGGHAS.</h1>
            <p className="s-body" style={{ marginTop: 14, maxWidth: 380 }}>
              Completa tus datos y selecciona tu rol dentro de la Carrera de Software.
            </p>
          </div>

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
          <div className="s-field" style={{ gap: 10 }}>
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
            <input type="hidden" name="rol" value={role} />
          </div>

          {/* Nombre */}
          <div className="s-field">
            <label htmlFor="nombre">Nombre completo</label>
            <div className="s-input-shell">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}>
                <circle cx="12" cy="8" r="4"/><path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2"/>
              </svg>
              <input id="nombre" name="nombre" type="text" placeholder="Nombre Apellido" autoComplete="name" required />
            </div>
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
              <input id="password" name="password" type={showPw ? "text" : "password"} placeholder="Mínimo 6 caracteres" autoComplete="new-password" minLength={6} required />
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

          {/* Submit */}
          <button type="submit" className="s-btn s-btn-primary s-btn-lg" style={{ width: "100%", justifyContent: "center", height: 48 }}>
            Crear cuenta
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
          </button>

          <p className="s-small" style={{ textAlign: "center", margin: "8px 0 0", lineHeight: 1.5 }}>
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" style={{ color: "#1D3FD9", fontWeight: 500 }}>Iniciar sesión</Link>
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

import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterFormContent />
    </Suspense>
  );
}
