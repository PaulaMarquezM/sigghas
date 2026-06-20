"use server";

import { requireRol } from "@/lib/auth";
import { generate } from "@/lib/scheduler";
import type { ResultadoGeneracion } from "@/lib/scheduler/types";

export async function generarHorario(periodoId: string): Promise<ResultadoGeneracion> {
  await requireRol("coordinador");
  return generate(periodoId);
}
