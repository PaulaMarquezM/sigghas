import { vi } from "vitest";

export type QueryResult = { data: unknown; error: { message: string } | null };

const CHAIN_METHODS = [
  "select", "insert", "update", "upsert", "delete",
  "eq", "neq", "in", "order", "limit",
  "single", "maybeSingle",
] as const;

/**
 * Objeto encadenable que imita `supabase.from(table)...`: cada método de la
 * cadena (select/insert/update/eq/order/...) devuelve el mismo objeto, y es
 * "thenable" para que `await query` resuelva con el resultado configurado,
 * sin importar qué combinación de métodos se haya encadenado antes.
 */
export function createChainableQuery(result: QueryResult) {
  const query: Record<string, unknown> = {};
  for (const method of CHAIN_METHODS) {
    query[method] = vi.fn(() => query);
  }
  query.then = (resolve: (value: QueryResult) => unknown) => resolve(result);
  return query;
}

/**
 * Arma el `{ from }` que reemplaza al cliente de Supabase. `tableResults`
 * mapea nombre de tabla -> resultado a devolver. Si una acción hace más de
 * un `.from(tabla)` sobre la misma tabla esperando resultados distintos en
 * cada llamada, no uses este helper: arma el mock a mano con
 * `vi.fn().mockReturnValueOnce(...)`.
 */
export function mockSupabaseFrom(tableResults: Record<string, QueryResult>) {
  return {
    from: vi.fn((table: string) => createChainableQuery(tableResults[table] ?? { data: null, error: null })),
  };
}

export const ok = (data: unknown = null): QueryResult => ({ data, error: null });
export const fail = (message: string): QueryResult => ({ data: null, error: { message } });

/**
 * Patrón para mockear next/navigation en cada test file (no se puede
 * compartir como función por el hoisting de vi.mock, pero sí copiar/pegar):
 *
 *   vi.mock("next/navigation", () => ({
 *     redirect: vi.fn((path: string) => { throw new Error(`NEXT_REDIRECT:${path}`); }),
 *     notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }),
 *   }));
 *   vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
 *
 * Luego, en el test: `await expect(createX(...)).rejects.toThrow("NEXT_REDIRECT:/dashboard/x")`.
 */
