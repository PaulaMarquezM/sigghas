const DEFAULT_FALLBACK =
  "No se pudo guardar. Revisa los datos e intenta nuevamente.";

/** Errores técnicos de Supabase Auth / PostgREST / Postgres que no deben verse en la UI. */
function isTechnicalBackendError(lower: string) {
  return (
    lower.includes("violates ") ||
    lower.includes("constraint") ||
    lower.includes("pgrst") ||
    lower.includes("permission denied for") ||
    lower.includes("duplicate key") ||
    (lower.includes("relation ") && lower.includes("does not exist")) ||
    (lower.includes("column ") && lower.includes("does not exist")) ||
    lower.includes("failed to fetch") ||
    lower.includes("networkerror")
  );
}

/** Detecta copy en inglés de backend/Auth que aún no está mapeado. */
function looksLikeEnglishCopy(message: string) {
  if (/[áéíóúñü¿¡]/i.test(message)) return false;
  if (/\b(el|la|los|las|no|se|ya|con|por|para|tu|un|una|del|al|es|son|está|están)\b/i.test(message)) {
    return false;
  }
  return /\b(the|is|are|was|were|have|has|been|with|this|that|user|email|password|invalid|error|failed|cannot|could|not|already|registered|please|try|again|database|saving)\b/i.test(
    message,
  );
}

/**
 * Traduce mensajes conocidos de Auth/DB a español.
 * Los mensajes de la app (ya en español) se dejan intactos.
 */
export function localizeErrorMessage(
  message: string | null | undefined,
  fallback = DEFAULT_FALLBACK,
): string {
  const raw = (message ?? "").trim();
  if (!raw) return fallback;

  const lower = raw.toLowerCase();

  // Auth
  if (
    lower.includes("already been registered") ||
    lower.includes("already registered") ||
    lower.includes("user already exists") ||
    lower.includes("email address is already")
  ) {
    return "Este correo ya está registrado.";
  }
  if (lower.includes("not confirmed")) {
    return "Tu correo aún no está confirmado. Revisa tu bandeja de entrada.";
  }
  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid email or password")
  ) {
    return "Correo o contraseña incorrectos.";
  }
  if (lower.includes("rate limit") || lower.includes("email rate limit")) {
    return "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.";
  }
  if (
    lower.includes("password should be at least") ||
    lower.includes("password is known to be weak") ||
    lower.includes("password should contain")
  ) {
    return "La contraseña no cumple los requisitos de seguridad.";
  }
  if (lower.includes("unable to validate email") || lower.includes("invalid email")) {
    return "El correo no es válido.";
  }
  if (lower.includes("email link is invalid") || lower.includes("otp has expired")) {
    return "El enlace de confirmación no es válido o ya expiró.";
  }
  if (lower.includes("jwt expired") || lower.includes("session from session_id claim")) {
    return "Tu sesión expiró. Vuelve a iniciar sesión.";
  }

  // Postgres / PostgREST
  if (lower.includes("duplicate key")) {
    return "Ya existe un registro con esos datos.";
  }
  if (lower.includes("foreign key") || lower.includes("violates foreign key")) {
    return "No se puede completar la operación porque hay datos relacionados.";
  }
  if (lower.includes("not-null constraint") || lower.includes("null value in column")) {
    return "Faltan datos obligatorios.";
  }
  if (lower.includes("check constraint")) {
    return "Algunos datos no son válidos.";
  }
  if (lower.includes("row-level security")) {
    return "No tienes permiso para realizar esta acción.";
  }
  if (lower.includes("permission denied")) {
    return "No tienes permiso para realizar esta acción.";
  }

  // Conexión / edge
  if (lower === "{}" || lower.includes("cloudflare") || lower.includes("521")) {
    return "No se pudo conectar con el servidor. Verifica tu conexión o inténtalo más tarde.";
  }

  if (isTechnicalBackendError(lower) || looksLikeEnglishCopy(raw)) return fallback;

  return raw;
}
