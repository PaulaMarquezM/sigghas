import type { ReglaFn, Slot, ContextoProgramacion, Asignacion, ReglaResultado } from "../types";
import { rn01HorasMaxDocente } from "./rn01-horas-max-docente";
import { rn02Disponibilidad } from "./rn02-disponibilidad";
import { rn03ConflictoAula } from "./rn03-conflicto-aula";
import { rn04ConflictoDocente } from "./rn04-conflicto-docente";
import { rn05CapacidadAula } from "./rn05-capacidad-aula";
import { rn06TipoEspacio, setMateriasRequiereLab } from "./rn06-tipo-espacio";
import { rn07BloquesContiguos, setMateriasLab } from "./rn07-bloques-contiguos";
import { rn08ConflictoGrupo } from "./rn08-conflicto-grupo";
import { rn09MismaSede } from "./rn09-misma-sede";
import { rn10ClasesVirtuales } from "./rn10-clases-virtuales";
import { rn11DocenteDosSedes } from "./rn11-docente-dos-sedes";
import { rn12RestriccionTipoContrato } from "./rn12-restriccion-tipo-contrato";
import { rn13HorarioInstitucional } from "./rn13-horario-institucional";
import { rn14BloquesTiempoOficina } from "./rn14-bloques-tiempo-oficina";
import { rn15RestriccionAccesibilidad } from "./rn15-restriccion-accesibilidad";
import { rn16SesionesVirtualesCompartidas } from "./rn16-sesiones-virtuales-compartidas";
import { validarCandidato } from "../greedy";

export const REGLAS: ReglaFn[] = [
  rn01HorasMaxDocente,
  rn02Disponibilidad,
  rn03ConflictoAula,
  rn04ConflictoDocente,
  rn05CapacidadAula,
  rn06TipoEspacio,
  rn07BloquesContiguos,
  rn08ConflictoGrupo,
  rn09MismaSede,
  rn10ClasesVirtuales,
  rn11DocenteDosSedes,
  rn12RestriccionTipoContrato,
  rn13HorarioInstitucional,
  rn14BloquesTiempoOficina,
  rn15RestriccionAccesibilidad,
  rn16SesionesVirtualesCompartidas,
];

export function initializeRules(ctx: { materias: { id: string; requiere_laboratorio: boolean }[] }) {
  const labIds = ctx.materias.filter((m) => m.requiere_laboratorio).map((m) => m.id);
  setMateriasLab(labIds);
  setMateriasRequiereLab(ctx.materias);
}

export function validateSlot(
  candidato: Slot,
  ctx: ContextoProgramacion,
  asignadas: Asignacion[]
): ReglaResultado {
  // El planificador moderno centraliza las reglas cruzadas (duraciones,
  // descansos y carga diaria) aquí; las reglas individuales se conservan
  // para validación unitaria y compatibilidad del editor.
  return validarCandidato(candidato, ctx, asignadas);
  /*
  for (const regla of REGLAS) {
    const resultado = regla(candidato, ctx, asignadas);
    if (!resultado.valida) {
      return resultado;
    }
  }
  return { valida: true };
  */
}
