import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Sede = Database["public"]["Tables"]["sedes"]["Row"];
export type Periodo = Database["public"]["Tables"]["periodos"]["Row"];

export type SelectOption = {
  value: string;
  label: string;
};

export type ActionResult = {
  ok: boolean;
  message?: string;
};

type DbResult = {
  data: unknown;
  error: { message: string } | null;
};

type DbQuery = PromiseLike<DbResult> & {
  select(columns?: string): DbQuery;
  insert(values: unknown): DbQuery;
  upsert(values: unknown, options?: { onConflict?: string; ignoreDuplicates?: boolean }): DbQuery;
  update(values: unknown): DbQuery;
  delete(): DbQuery;
  eq(column: string, value: unknown): DbQuery;
  neq(column: string, value: unknown): DbQuery;
  order(column: string, options?: { ascending?: boolean }): DbQuery;
  single(): DbQuery;
};

type UntypedDb = {
  from(table: string): DbQuery;
};

export function asUntypedDb(client: unknown): UntypedDb {
  return client as UntypedDb;
}

export function errorMessage(error: unknown, fallback = "No se pudo guardar. Revisa los datos e intenta nuevamente.") {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function formNullableString(formData: FormData, key: string) {
  const value = formString(formData, key);
  return value.length > 0 ? value : null;
}

export function formNumber(formData: FormData, key: string, fallback = 0) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

export function formBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

export async function getSedes(): Promise<Sede[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("sedes").select("*").order("nombre");
  return data ?? [];
}

export async function getPeriodos(): Promise<Periodo[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("periodos").select("*").order("fecha_inicio", { ascending: false });
  return data ?? [];
}

export function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function contains(haystack: unknown, needle: string) {
  if (!needle) return true;
  return String(haystack ?? "").toLowerCase().includes(needle.toLowerCase());
}
