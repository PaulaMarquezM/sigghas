import Link from "next/link";

/* ─── Iconos reutilizables ─────────────────────────────────── */
const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h2v2H8zM14 14h2v2h-2z"/>
  </svg>
);
const ArrowRight = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 5l7 7-7 7"/>
  </svg>
);
const XCircle = () => (
  <svg className="x" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
  </svg>
);
const CheckCircle = ({ color = "currentColor", size = 20 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 9"/>
  </svg>
);
const Dash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A8F99" strokeWidth="2.5">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const Check = ({ color = "#2E7D5B" }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

/* ─── Schedule card (hero) ─────────────────────────────────── */
function ScheduleCard() {
  return (
    <div style={{ position: "relative" }}>
      <div className="sc-anno" style={{ top: -26, left: 8 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M12 8v4l3 2"/><circle cx="12" cy="12" r="9"/>
        </svg>
        Horario · Quinto Semestre · SW-5A
      </div>

      <div className="sc-card">
        <div className="sc-head">
          <div className="sc-title">
            <span className="sc-dot" />
            Horario generado · 2026-I
          </div>
          <span className="sc-pill">SW-5A · Portoviejo</span>
        </div>

        <div className="sc-grid">
          <div className="sc-hour" />
          {["Lun","Mar","Mié","Jue","Vie"].map(d => <div key={d} className="sc-day">{d}</div>)}

          <div className="sc-hour">07:00</div>
          <div className="sc-cell"><div className="sc-block blue"><div className="b-title">Calidad SW</div><div className="b-meta">V. Alonso · A-203</div></div></div>
          <div className="sc-cell" />
          <div className="sc-cell"><div className="sc-block blue"><div className="b-title">Calidad SW</div><div className="b-meta">V. Alonso · A-203</div></div></div>
          <div className="sc-cell" />
          <div className="sc-cell"><div className="sc-block outline"><div className="b-title">Tutoría</div><div className="b-meta">Opcional</div></div></div>

          <div className="sc-hour">09:00</div>
          <div className="sc-cell" />
          <div className="sc-cell"><div className="sc-block amber"><div className="b-title">Base de Datos II</div><div className="b-meta">L-LAB-1</div></div></div>
          <div className="sc-cell" />
          <div className="sc-cell"><div className="sc-block amber"><div className="b-title">Base de Datos II</div><div className="b-meta">L-LAB-1</div></div></div>
          <div className="sc-cell" />

          <div className="sc-hour">11:00</div>
          <div className="sc-cell"><div className="sc-block ink"><div className="b-title">IA Aplicada</div><div className="b-meta">Virtual</div></div></div>
          <div className="sc-cell" />
          <div className="sc-cell"><div className="sc-block ink"><div className="b-title">IA Aplicada</div><div className="b-meta">Virtual</div></div></div>
          <div className="sc-cell" />
          <div className="sc-cell"><div className="sc-block green"><div className="b-title">Arquit. SW</div><div className="b-meta">A-105</div></div></div>

          <div className="sc-hour">14:00</div>
          <div className="sc-cell" />
          <div className="sc-cell"><div className="sc-block rose"><div className="b-title">Redes</div><div className="b-meta">L-LAB-2</div></div></div>
          <div className="sc-cell" />
          <div className="sc-cell"><div className="sc-block rose"><div className="b-title">Redes</div><div className="b-meta">L-LAB-2</div></div></div>
          <div className="sc-cell" />
        </div>

        <div className="sc-foot">
          <div className="sc-legend">
            <span><i style={{ background: "#1D3FD9" }} />Presencial</span>
            <span><i style={{ background: "#E0A93B" }} />Laboratorio</span>
            <span><i style={{ background: "#0E1116" }} />Virtual</span>
            <span><i style={{ background: "#2E7D5B" }} />Compartida</span>
          </div>
          <span>0 conflictos · 43/43 reglas OK</span>
        </div>
      </div>

      <div className="sc-anno" style={{ bottom: -26, right: 0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Validado en tiempo real
      </div>
    </div>
  );
}

/* ─── Página principal ─────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      {/* ── NAV ── */}
      <header className="sigghas-nav">
        <div className="wrap sigghas-nav-inner">
          <Link href="/" className="sigghas-brand">
            <div className="sigghas-brand-mark" aria-hidden="true"><CalendarIcon /></div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div className="sigghas-brand-name">SIGGHAS</div>
              <div className="sigghas-brand-sub">PUCE · Software</div>
            </div>
          </Link>

          <nav className="sigghas-nav-links">
            <a href="#producto">Producto</a>
            <a href="#funciones">Funciones</a>
            <a href="#roles">Roles</a>
            <a href="#reglas">Reglas</a>
          </nav>

          <div className="sigghas-nav-actions">
            <Link href="/login" className="s-btn s-btn-ghost">Iniciar sesión</Link>
            <Link href="/registro" className="s-btn s-btn-primary">
              Crear cuenta <ArrowRight />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="sigghas-hero sigghas-section" id="producto" style={{ borderTop: 0, paddingTop: 64 }}>
        <div className="wrap">
          <div className="sigghas-hero-meta-row">
            {[
              { k: "Proyecto académico", v: "Calidad del Software · 2026" },
              { k: "Institución",        v: "PUCE — Sede Portoviejo" },
              { k: "Sedes operativas",   v: "Portoviejo & Manta" },
              { k: "Reglas de negocio",  v: "43 implementadas" },
            ].map(({ k, v }) => (
              <div key={k} className="sigghas-meta-item">
                <span className="k">{k}</span>
                <span className="v">{v}</span>
              </div>
            ))}
          </div>

          <div className="sigghas-hero-grid">
            <div>
              <span className="s-eyebrow">Sistema Inteligente · Generación &amp; Gestión</span>
              <h1>
                Horarios académicos<br />
                <em>sin choques</em>, sin<br />
                hojas de cálculo.
              </h1>
              <p className="s-lead" style={{ maxWidth: 480 }}>
                SIGGHAS automatiza la planificación de horarios de la Carrera de Software:
                considera disponibilidad docente, capacidad de aulas, restricciones entre sedes
                y modalidades virtuales — todo en un motor con cuarenta y tres reglas reales
                de la institución.
              </p>
              <div className="sigghas-hero-actions">
                <Link href="/login" className="s-btn s-btn-primary s-btn-lg">
                  Entrar al sistema
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M10 14L21 3M21 14v7H3V3h7"/></svg>
                </Link>
                <a href="#funciones" className="s-btn s-btn-ghost s-btn-lg">Ver funcionalidades</a>
              </div>
            </div>
            <div style={{ marginTop: 80 }}><ScheduleCard /></div>
          </div>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section style={{ padding: "80px 0", borderTop: "1px solid #D8D1BD" }}>
        <div className="wrap">
          <div className="problem-strip">
            <div>
              <span className="s-eyebrow" style={{ color: "color-mix(in oklab, #F5F1E8 60%, transparent)" }}>El problema</span>
              <h2 style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.1, margin: "14px 0 0", color: "#F5F1E8" }}>
                La planificación manual está rota.
              </h2>
              <p className="s-lead" style={{ color: "color-mix(in oklab, #F5F1E8 72%, transparent)", marginTop: 18, maxWidth: 480 }}>
                Una carrera, dos sedes, decenas de docentes y aulas. Las hojas de cálculo no escalan.
              </p>
            </div>
            <ul className="problem-list">
              {[
                "Choques entre docentes, grupos y aulas que aparecen recién al imprimir",
                "Errores al coordinar simultáneamente las sedes de Manta y Portoviejo",
                "Aulas asignadas sin capacidad suficiente o sin accesibilidad cuando se requiere",
                "Inconsistencias entre clases presenciales y virtuales sin rastro de quién cambió qué",
              ].map((t) => (
                <li key={t}>
                  <XCircle />
                  <span className="t">{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="sigghas-section" id="funciones">
        <div className="wrap">
          <div className="sec-head">
            <div><span className="sec-num">[ 01 / Funciones ]</span></div>
            <div>
              <h2 style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.1, margin: 0 }}>
                Siete módulos que reemplazan<br />semanas de trabajo manual.
              </h2>
              <p className="s-body" style={{ marginTop: 16 }}>
                Desde la gestión de docentes y aulas hasta la generación con un clic y la edición
                con validación en vivo. Cada módulo respeta las reglas reales de la institución.
              </p>
            </div>
          </div>

          <div className="features-grid">
            {/* Feature 1 — hero blue */}
            <article className="s-feature s-feature-hero f6">
              <span className="ftag">[ 03 / Núcleo ]</span>
              <div className="ico">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <div>
                <h3>Generación automática con un clic</h3>
                <p style={{ marginTop: 10 }}>
                  El motor evalúa simultáneamente disponibilidad docente, capacidad, accesibilidad,
                  tipo de espacio, modalidad y restricciones entre sedes — y si no puede cumplir
                  alguna restricción, lo dice con exactitud.
                </p>
              </div>
              <div className="feature-vis">
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
                  {["disponibilidad","capacidad","accesibilidad","tipo de aula","conflicto docente","conflicto curso","multi-sede","virtual"].map(t => (
                    <span key={t} style={{ background: "color-mix(in oklab, white 12%, transparent)", padding: "6px 10px", borderRadius: 6 }}>{t}</span>
                  ))}
                </div>
              </div>
            </article>

            {/* Feature 2 */}
            <article className="s-feature f6">
              <span className="ftag">[ 04 ]</span>
              <div className="ico">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4z"/></svg>
              </div>
              <div>
                <h3>Edición manual con validación en vivo</h3>
                <p style={{ marginTop: 10 }}>
                  Cada arrastre, cada cambio, se valida al instante. Si hay un conflicto crítico
                  el sistema bloquea el guardado; si es una advertencia, te avisa pero te deja decidir.
                </p>
              </div>
              <div className="feature-vis">
                <div style={{ display: "flex", gap: 6, alignItems: "center", fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>
                  {[
                    { text: "39 OK",      bg: "color-mix(in oklab, #2E7D5B 18%, transparent)", color: "#2E7D5B" },
                    { text: "3 alertas",  bg: "color-mix(in oklab, #E0A93B 25%, transparent)", color: "#B6831F" },
                    { text: "1 crítico",  bg: "color-mix(in oklab, #C8523B 18%, transparent)", color: "#C8523B" },
                  ].map(({ text, bg, color }) => (
                    <span key={text} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: bg, color, padding: "6px 10px", borderRadius: 6 }}>
                      {text}
                    </span>
                  ))}
                </div>
              </div>
            </article>

            {/* Feature 3 */}
            <article className="s-feature f4">
              <span className="ftag">[ 05 ]</span>
              <div className="ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h18M3 12h18M3 17h12"/></svg></div>
              <h3>Gestión de entidades académicas</h3>
              <p>Docentes, materias, grupos, aulas, sedes y periodos — registrados con la información que el motor necesita para tomar buenas decisiones.</p>
            </article>

            {/* Feature 4 */}
            <article className="s-feature s-feature-amber f4">
              <span className="ftag">[ 06 ]</span>
              <div className="ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><circle cx="12" cy="16" r="2"/></svg></div>
              <h3>Disponibilidad docente</h3>
              <p>Bloques por día, contratos por horas o tiempo completo, y un sello especial: <span className="s-mono" style={{ color: "#0E1116" }}>tiempo oficina</span> — horas que el sistema nunca toca.</p>
            </article>

            {/* Feature 5 */}
            <article className="s-feature f4">
              <span className="ftag">[ 07 ]</span>
              <div className="ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg></div>
              <h3>Consulta por rol</h3>
              <p>Cada usuario ve solo lo suyo. Coordinador ve todo. Docente ve su horario. Apoyo ve qué aulas están libres.</p>
            </article>

            {/* Feature 6 */}
            <article className="s-feature f6">
              <span className="ftag">[ 08 ]</span>
              <div className="ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/><line x1="9" y1="18" x2="13" y2="18"/></svg></div>
              <h3>Exportación PDF oficial</h3>
              <p style={{ marginTop: 10 }}>Reportes listos para imprimir: horario por docente, ocupación de aulas, horario completo por sede o por periodo. Todo con el formato institucional.</p>
              <div className="feature-vis">
                <div style={{ display: "flex", gap: 10 }}>
                  {["Reporte A","Reporte B","Reporte C"].map(r => (
                    <div key={r} style={{ flex: 1, padding: 14, background: "#F5F1E8", border: "1px solid #D8D1BD", borderRadius: 8 }}>
                      <div style={{ fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8A8F99", marginBottom: 8, fontFamily: "JetBrains Mono, monospace" }}>{r}</div>
                      {[undefined, "70%", "85%"].map((w, i) => <div key={i} style={{ height: 5, background: "#E5DFCC", borderRadius: 2, marginBottom: 4, width: w }} />)}
                    </div>
                  ))}
                </div>
              </div>
            </article>

            {/* Feature 7 */}
            <article className="s-feature f6">
              <span className="ftag">[ 09 ]</span>
              <div className="ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div>
              <h3>Seguridad y auditoría</h3>
              <p style={{ marginTop: 10 }}>Login institucional, permisos por rol, y un historial completo: quién editó qué y cuándo. Las aulas pueden habilitarse o deshabilitarse según el periodo.</p>
              <div className="feature-vis">
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11.5, color: "#4A515E", display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { t: "09:42 · v.alonso movió Calidad SW a Mar 07:00", s: "OK", sc: "#2E7D5B" },
                    { t: "09:35 · v.alonso deshabilitó aula L-LAB-3", s: "CFG", sc: "#4A515E" },
                    { t: "09:30 · v.alonso generó horario 2026-I", s: "OK", sc: "#2E7D5B" },
                  ].map(({ t, s, sc }, i, a) => (
                    <div key={t} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < a.length - 1 ? "1px dashed #D8D1BD" : undefined }}>
                      <span>{t}</span><span style={{ color: sc }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section className="sigghas-section" id="roles">
        <div className="wrap">
          <div className="sec-head">
            <div><span className="sec-num">[ 02 / Roles ]</span></div>
            <div>
              <h2 style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.1, margin: 0 }}>Cuatro tipos de usuario,<br />una sola fuente de verdad.</h2>
              <p className="s-body" style={{ marginTop: 16 }}>Cada rol accede únicamente a la información y acciones que le corresponden. Un coordinador puede todo. Un docente solo lee su horario.</p>
            </div>
          </div>
          <div className="roles-grid">
            <article className="role-card featured">
              <div className="role-mark"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2"/><path d="M19 3l1.5 1.5L23 2"/></svg></div>
              <span className="role-num">01 / Principal</span>
              <h3>Coordinador Académico</h3>
              <p>Generar, editar, aprobar y publicar horarios. Aprueba conflictos y configura el periodo.</p>
              <div style={{ marginTop: "auto", fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, opacity: 0.7 }}>Acceso total</div>
            </article>
            {[
              { num: "02", name: "Docente", desc: "Consulta su propio horario, ve sus aulas asignadas y descarga el PDF oficial.", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>, access: "Solo lectura" },
              { num: "03", name: "Administrador", desc: "Gestiona usuarios, roles y configuración técnica del sistema.", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.4 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.4 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1A1.7 1.7 0 008 19.4a1.7 1.7 0 00-1.8.4l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.4-1.8 1.7 1.7 0 00-1.5-1H2a2 2 0 110-4h.1A1.7 1.7 0 003.6 8a1.7 1.7 0 00-.4-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.4H8a1.7 1.7 0 001-1.5V2a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.4l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.4 1.8V8c.3.6.9 1 1.5 1H22a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>, access: "Técnico" },
              { num: "04", name: "Personal de Apoyo", desc: "Consulta en tiempo real qué aulas están ocupadas o disponibles, por sede y horario.", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, access: "Solo lectura" },
            ].map(({ num, name, desc, icon, access }) => (
              <article key={num} className="role-card">
                <div className="role-mark">{icon}</div>
                <span className="role-num">{num}</span>
                <h3>{name}</h3>
                <p>{desc}</p>
                <div style={{ marginTop: "auto", fontFamily: "JetBrains Mono, monospace", fontSize: 10.5, color: "#8A8F99" }}>{access}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── RULES ── */}
      <section className="sigghas-section" id="reglas">
        <div className="wrap">
          <div className="sec-head">
            <div><span className="sec-num">[ 03 / Reglas ]</span></div>
            <div>
              <h2 style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.1, margin: 0 }}>Cuarenta y tres reglas<br />codificadas como restricciones.</h2>
              <p className="s-body" style={{ marginTop: 16 }}>No son adornos: son lo que el motor evalúa para decidir si una asignación es válida. Aquí las más importantes.</p>
            </div>
          </div>
          <div className="rules-block">
            <div>
              <span className="s-eyebrow">Cómo funciona</span>
              <p className="s-lead" style={{ marginTop: 14 }}>
                Cada regla de negocio (<span className="s-mono" style={{ color: "#1D3FD9" }}>RN01</span>…<span className="s-mono" style={{ color: "#1D3FD9" }}>RN43</span>) es una restricción que el motor evalúa para cada sesión propuesta. Si todas pasan, la asignación es válida. Si alguna falla, el sistema decide si bloquea o avisa según su severidad.
              </p>
              <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                {[
                  { num: "43", label: "reglas totales", color: undefined },
                  { num: "12", label: "críticas", color: "#C8523B" },
                  { num: "31", label: "advertencias", color: "#B6831F" },
                ].map(({ num, label, color }) => (
                  <div key={label} className="stat-box">
                    <div className="stat-num" style={{ color }}>{num}</div>
                    <div className="stat-label">{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rules-list">
              {[
                { code: "RN01", desc: "Un docente no puede estar en dos clases al mismo tiempo", badge: "Crítica" },
                { code: "RN02", desc: "Un docente no puede dar clases presenciales en dos sedes el mismo día", badge: "Crítica" },
                { code: "RN07", desc: "Los bloques de tiempo oficina no se usan para asignar clases", badge: "Crítica" },
                { code: "RN13", desc: "Un aula no puede usarse por dos clases presenciales al mismo tiempo", badge: "Crítica" },
                { code: "RN14", desc: "No se asignan cursos a aulas con capacidad insuficiente", badge: "Crítica" },
                { code: "RN16", desc: "Las materias que requieren laboratorio solo van a laboratorios", badge: "Crítica" },
                { code: "RN21", desc: "Varios cursos pueden compartir sesión virtual si coincide materia, docente y horario", badge: "Permite" },
                { code: "RN37", desc: "Todos los cambios quedan registrados en el historial de auditoría", badge: "Sistema" },
              ].map(({ code, desc, badge }) => (
                <div key={code} className="rule">
                  <span className="rcode">{code}</span>
                  <span className="rdesc">{desc}</span>
                  <span className="rbadge">{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TECH ── */}
      <section className="sigghas-section" id="fases">
        <div className="wrap">
          {/* Tech */}
          <div style={{ marginTop: 80 }}>
            <span className="s-eyebrow">Stack técnico</span>
            <h2 style={{ marginTop: 14, maxWidth: 620, fontSize: 28, fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.2 }}>Las herramientas elegidas para entregar rápido sin sacrificar calidad.</h2>
            <div className="tech-grid" style={{ marginTop: 32 }}>

              {/* Next.js */}
              <div className="tech-card">
                <div className="tech-icon-wrap">
                  <svg viewBox="0 0 128 128" width="38" height="38" fill="none">
                    <circle cx="64" cy="64" r="64" fill="#000"/>
                    <path d="M38 96V32h12l36 48V32h12v64H86L50 48v48z" fill="white"/>
                  </svg>
                </div>
                <span className="tname">Next.js 14</span>
                <span className="tlayer">Framework</span>
              </div>

              {/* TypeScript */}
              <div className="tech-card">
                <div className="tech-icon-wrap">
                  <svg viewBox="0 0 64 64" width="38" height="38" fill="none">
                    <rect width="64" height="64" rx="6" fill="#3178C6"/>
                    <path d="M14 34h10v-4H8v4h10v22h6V34h-10zm18-4v4h8v22h6V34h8v-4z" fill="white"/>
                  </svg>
                </div>
                <span className="tname">TypeScript</span>
                <span className="tlayer">Lenguaje</span>
              </div>

              {/* Supabase */}
              <div className="tech-card">
                <div className="tech-icon-wrap">
                  <svg viewBox="0 0 24 24" width="38" height="38" fill="none">
                    <path d="M11.9 2.1L3.5 13.6h8.4v8.3L20.5 10.4h-8.6z" fill="#3ECF8E"/>
                  </svg>
                </div>
                <span className="tname">Supabase</span>
                <span className="tlayer">Base de datos</span>
              </div>

              {/* Tailwind */}
              <div className="tech-card">
                <div className="tech-icon-wrap">
                  <svg viewBox="0 0 54 33" width="44" height="27" fill="none">
                    <path d="M27 0C19.8 0 15.3 3.6 13.5 10.8c2.7-3.6 5.85-4.95 9.45-4.05 2.05.51 3.52 2 5.15 3.65C30.74 12.72 33.65 15.75 40.5 15.75c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.05-.51-3.52-2-5.15-3.65C37.26 3.03 34.35 0 27 0z" fill="#38BDF8"/>
                    <path d="M13.5 15.75C6.3 15.75 1.8 19.35 0 26.55c2.7-3.6 5.85-4.95 9.45-4.05 2.05.51 3.52 2 5.15 3.65C16.74 28.47 19.65 31.5 26.5 31.5c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.05-.51-3.52-2-5.15-3.65C23.76 18.78 20.85 15.75 13.5 15.75z" fill="#38BDF8"/>
                  </svg>
                </div>
                <span className="tname">Tailwind CSS</span>
                <span className="tlayer">Estilos</span>
              </div>

              {/* shadcn/ui */}
              <div className="tech-card">
                <div className="tech-icon-wrap">
                  <svg viewBox="0 0 24 24" width="38" height="38" fill="none">
                    <rect x="3" y="3" width="8" height="8" rx="1.5" fill="#0E1116"/>
                    <rect x="13" y="3" width="8" height="8" rx="1.5" fill="#0E1116" opacity=".4"/>
                    <rect x="3" y="13" width="8" height="8" rx="1.5" fill="#0E1116" opacity=".4"/>
                    <rect x="13" y="13" width="8" height="8" rx="1.5" fill="#0E1116" opacity=".15"/>
                  </svg>
                </div>
                <span className="tname">shadcn/ui</span>
                <span className="tlayer">Componentes</span>
              </div>

              {/* TanStack Query */}
              <div className="tech-card">
                <div className="tech-icon-wrap">
                  <svg viewBox="0 0 64 64" width="38" height="38" fill="none">
                    <circle cx="32" cy="32" r="30" stroke="#EF4444" strokeWidth="4"/>
                    <path d="M20 32c0-6.6 5.4-12 12-12s12 5.4 12 12-5.4 12-12 12" stroke="#EF4444" strokeWidth="4" strokeLinecap="round"/>
                    <path d="M38 26l6-6M38 26h6M38 26v-6" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="tname">TanStack Query</span>
                <span className="tlayer">Datos cliente</span>
              </div>

              {/* React PDF */}
              <div className="tech-card">
                <div className="tech-icon-wrap">
                  <svg viewBox="0 0 40 48" width="32" height="38" fill="none">
                    <path d="M4 0h22l10 10v34a4 4 0 01-4 4H4a4 4 0 01-4-4V4a4 4 0 014-4z" fill="#C8523B"/>
                    <path d="M26 0l10 10H26z" fill="white" opacity=".4"/>
                    <text x="5" y="36" fill="white" fontSize="10" fontWeight="700" fontFamily="monospace">PDF</text>
                  </svg>
                </div>
                <span className="tname">React PDF</span>
                <span className="tlayer">Exportación</span>
              </div>

              {/* Tests + CI */}
              <div className="tech-card">
                <div className="tech-icon-wrap">
                  <svg viewBox="0 0 24 24" width="38" height="38" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#2E7D5B" strokeWidth="2"/>
                    <path d="M7 12l3.5 3.5L17 9" stroke="#2E7D5B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="tname">Tests + CI</span>
                <span className="tlayer">Calidad</span>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── SCOPE ── */}
      <section className="sigghas-section">
        <div className="wrap">
          <div className="sec-head">
            <div><span className="sec-num">[ 05 / Alcance ]</span></div>
            <div>
              <h2 style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.1, margin: 0 }}>Qué entra. Qué no.</h2>
              <p className="s-body" style={{ marginTop: 16 }}>Definir los límites desde el inicio evita que el proyecto crezca sin control y nos permite entregar lo prometido con calidad.</p>
            </div>
          </div>
          <div className="scope-grid">
            <div className="scope-col">
              <h3><CheckCircle color="#2E7D5B" size={20} /> Incluido en el sistema</h3>
              <ul>
                {["Gestión completa de horarios para la Carrera de Software","Sedes de Manta y Portoviejo","Clases presenciales y virtuales","Generación automática y edición manual con validaciones","Control de disponibilidad docente y tiempo oficina","Exportación PDF e historial de cambios completo"].map(t => (
                  <li key={t}><Check />{t}</li>
                ))}
              </ul>
            </div>
            <div className="scope-col">
              <h3><CheckCircle color="#C8523B" size={20} /> Fuera del alcance</h3>
              <ul>
                {["Otras carreras o facultades de la PUCE","Módulos financieros o contables","Control de matrícula estudiantil","Control biométrico de asistencia","Integración con Moodle, Banner u otras plataformas externas","Gestión de infraestructura universitaria general"].map(t => (
                  <li key={t}><Dash />{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ borderTop: 0, padding: "0 0 96px" }}>
        <div className="wrap">
          <div className="cta-strip">
            <div>
              <span className="s-eyebrow">Listo para usarse</span>
              <h2 style={{ fontSize: 44, fontWeight: 600, letterSpacing: "-0.025em", lineHeight: 1.1, margin: "14px 0 0", maxWidth: 520 }}>Entra al sistema y empieza a generar horarios sin choques.</h2>
              <p className="s-lead" style={{ marginTop: 18, maxWidth: 480 }}>Crea tu cuenta con tu correo institucional y empieza a usar SIGGHAS hoy.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
              <Link href="/registro" className="s-btn s-btn-primary s-btn-lg" style={{ width: "100%", justifyContent: "space-between" }}>
                Crear cuenta <ArrowRight size={16} />
              </Link>
              <Link href="/login" className="s-btn s-btn-ghost s-btn-lg" style={{ width: "100%", justifyContent: "space-between" }}>
                Ya tengo cuenta
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M10 14L21 3M21 14v7H3V3h7"/></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="sigghas-footer">
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <div className="sigghas-brand" style={{ marginBottom: 18, color: "#F5F1E8" }}>
                <div className="sigghas-brand-mark" style={{ background: "#F5F1E8", color: "#0E1116" }}><CalendarIcon /></div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: 600 }}>SIGGHAS</span>
                  <span className="sigghas-brand-sub" style={{ color: "color-mix(in oklab, #F5F1E8 55%, transparent)" }}>PUCE · Software</span>
                </div>
              </div>
              <p style={{ maxWidth: 340, fontSize: 14, color: "color-mix(in oklab, #F5F1E8 70%, transparent)", lineHeight: 1.55 }}>
                Sistema Inteligente de Generación y Gestión de Horarios Académicos para la Carrera de Ingeniería en Software.
              </p>
            </div>
            <div>
              <h4>Producto</h4>
              <ul>
                <li><a href="#funciones">Funciones</a></li>
                <li><a href="#roles">Roles</a></li>
                <li><a href="#reglas">Reglas de negocio</a></li>
              </ul>
            </div>
            <div>
              <h4>Académico</h4>
              <ul>
                <li><a href="#">Materia</a></li>
                <li><a href="#">Docente</a></li>
                <li><a href="#">Equipo</a></li>
                <li><a href="#">Documentación</a></li>
              </ul>
            </div>
            <div>
              <h4>Acceso</h4>
              <ul>
                <li><Link href="/login">Iniciar sesión</Link></li>
                <li><a href="#">Solicitar credenciales</a></li>
                <li><a href="#">Soporte técnico</a></li>
                <li><a href="#">Política de uso</a></li>
              </ul>
            </div>
          </div>
          <div className="foot-bottom">
            <span>© 2026 · PUCE Portoviejo · Calidad del Software</span>
            <span>v0.4.2 — Fase 02 en desarrollo</span>
          </div>
        </div>
      </footer>
    </>
  );
}
