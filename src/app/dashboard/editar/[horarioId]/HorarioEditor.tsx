"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { HorarioGrid } from "@/components/horario/HorarioGrid";
import { toast } from "sonner";
import { ArrowLeft, Check, FileText, Filter, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Asignacion, Conflicto, ContextoProgramacion, DiaSemana, Slot } from "@/lib/scheduler/types";
import { validarCandidato } from "@/lib/scheduler/greedy";
import { guardarMovimientoAction, publicarHorarioAction } from "./actions";
import { NuevaSesionDialog, type OpcionesManuales } from "./NuevaSesionDialog";
import { EditarSesionDialog } from "./EditarSesionDialog";
import { mensajeLegible } from "@/lib/utils";

type HorarioEditorHorario = { id: string; estado: string };
type HorarioEditorPeriodo = { nombre: string };
type SesionVista = Asignacion & { id: string; espacios?: { nombre: string } | null };
type EspacioDisponible = { id: string; nombre: string };

interface HorarioEditorProps {
  horario: HorarioEditorHorario;
  periodo: HorarioEditorPeriodo;
  initialAsignaciones: Asignacion[];
  initialSesiones: SesionVista[];
  contexto: ContextoProgramacion;
  espaciosDisponibles: EspacioDisponible[];
  opcionesManuales: OpcionesManuales;
}

// Helpers for time formatting
function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function horasEntre(inicio: string, fin: string): number {
  return (parseTime(fin) - parseTime(inicio)) / 60;
}

const selectClass =
  "h-10 rounded-lg border border-[#C7BFA6] bg-white px-3 text-sm outline-none focus:border-[#1D3FD9] focus:ring-2 focus:ring-[#1D3FD9]/15";

export default function HorarioEditor({
  horario,
  periodo,
  initialAsignaciones,
  initialSesiones,
  contexto,
  espaciosDisponibles,
  opcionesManuales,
}: HorarioEditorProps) {
  const router = useRouter();
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>(initialAsignaciones);
  const [sesiones, setSesiones] = useState<SesionVista[]>(initialSesiones);
  const [isPending, startTransition] = useTransition();
  const [sedeFiltroId, setSedeFiltroId] = useState(opcionesManuales.sedes[0]?.id ?? "");
  const [cursoFiltroId, setCursoFiltroId] = useState("");
  const [sesionEnEdicion, setSesionEnEdicion] = useState<SesionVista | null>(null);

  useEffect(() => {
    // Resincroniza el estado editable local con los datos del servidor tras
    // un router.refresh() tras guardar (no es estado derivable en el render:
    // el usuario puede haber estado arrastrando bloques localmente).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAsignaciones(initialAsignaciones);
    setSesiones(initialSesiones);
  }, [initialAsignaciones, initialSesiones]);

  const cursosFiltrados = useMemo(() => {
    const list = sedeFiltroId
      ? opcionesManuales.cursos.filter((curso) => curso.sede_id === sedeFiltroId)
      : opcionesManuales.cursos;
    return [...list].sort((a, b) => a.semestre - b.semestre || a.nombre.localeCompare(b.nombre));
  }, [opcionesManuales.cursos, sedeFiltroId]);

  const cursoIdsVisibles = useMemo(() => {
    if (cursoFiltroId) return new Set([cursoFiltroId]);
    return new Set(cursosFiltrados.map((curso) => curso.id));
  }, [cursoFiltroId, cursosFiltrados]);

  const sesionesVisibles = useMemo(
    () => sesiones.filter((sesion) => cursoIdsVisibles.has(sesion.grupo_id)),
    [cursoIdsVisibles, sesiones],
  );

  const espaciosVisibles = useMemo(
    () =>
      sedeFiltroId
        ? espaciosDisponibles.filter((espacio) => {
            const aula = opcionesManuales.aulas.find((item) => item.id === espacio.id);
            return !aula || aula.sede_id === sedeFiltroId;
          })
        : espaciosDisponibles,
    [espaciosDisponibles, opcionesManuales.aulas, sedeFiltroId],
  );

  const grupoIdParaNueva = cursoFiltroId || cursosFiltrados[0]?.id || "";

  // Sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const conflictos = useMemo(() => {
    const localConflictos: Conflicto[] = [];

    for (let i = 0; i < asignaciones.length; i++) {
      const a = asignaciones[i];
      const candidato: Slot = {
        materia_id: a.materia_id,
        grupo_id: a.grupo_id,
        dia: a.dia_semana as DiaSemana,
        hora_inicio: a.hora_inicio,
        hora_fin: a.hora_fin,
        docente_id: a.docente_id,
        espacio_id: a.espacio_id,
        sede_id: a.sede_id,
        modalidad: a.modalidad,
      };
      const otras = asignaciones.filter((_, idx) => idx !== i);
      const res = validarCandidato(candidato, contexto, otras);
      if (!res.valida && res.conflicto) {
        const yaExiste = localConflictos.some(
          (c) => c.regla === res.conflicto.regla && c.mensaje === res.conflicto.mensaje
        );
        if (!yaExiste) {
          localConflictos.push(res.conflicto);
        }
      }
    }
    return localConflictos;
  }, [asignaciones, contexto]);

  function cambiarSede(siguienteSedeId: string) {
    setSedeFiltroId(siguienteSedeId);
    setCursoFiltroId("");
  }

  // Manejar el arrastre y soltado de bloques
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const sesionId = active.id as string;
    const overId = over.id as string; // Formato: "cell-dia-hora"

    const parts = overId.split("-");
    if (parts.length !== 3) return;

    const nuevoDia = parseInt(parts[1], 10);
    const nuevaHoraInicio = parts[2]; // "07:00"

    const sesionActual = asignaciones.find((a) => a.id === sesionId);
    if (!sesionActual) return;

    // Si no cambió de lugar, no hacer nada
    if (sesionActual.dia_semana === nuevoDia && sesionActual.hora_inicio === nuevaHoraInicio) {
      return;
    }

    // Calcular hora de fin conservando la duración original
    const duracionMinutos = horasEntre(sesionActual.hora_inicio, sesionActual.hora_fin) * 60;
    const minutosInicio = parseTime(nuevaHoraInicio);
    const nuevaHoraFin = formatTime(minutosInicio + duracionMinutos);

    // Validar en tiempo real contra las 43 reglas
    const candidato: Slot = {
      materia_id: sesionActual.materia_id,
      grupo_id: sesionActual.grupo_id,
      dia: nuevoDia as DiaSemana,
      hora_inicio: nuevaHoraInicio,
      hora_fin: nuevaHoraFin,
      docente_id: sesionActual.docente_id,
      espacio_id: sesionActual.espacio_id,
      sede_id: sesionActual.sede_id,
      modalidad: sesionActual.modalidad,
    };
    const otrasAsignaciones = asignaciones.filter((a) => a.id !== sesionId);

    const validacion = validarCandidato(candidato, contexto, otrasAsignaciones);

    if (!validacion.valida && validacion.conflicto) {
      // Mostrar qué regla se viola y revertir
      toast.error(`Conflicto de Regla (${validacion.conflicto.regla}): ${mensajeLegible(validacion.conflicto.mensaje)}`);
      return;
    }

    if (!window.confirm("¿Confirmas mover esta clase? Se registrará el cambio en el historial.")) return;
    // Guardar después de la confirmación y la validación.
    const updates: Pick<Asignacion, "dia_semana" | "hora_inicio" | "hora_fin" | "espacio_id"> = {
      dia_semana: nuevoDia as Asignacion["dia_semana"],
      hora_inicio: nuevaHoraInicio,
      hora_fin: nuevaHoraFin,
      espacio_id: sesionActual.espacio_id,
    };

    // Actualización optimista de la UI
    setAsignaciones((prev) =>
      prev.map((a) => (a.id === sesionId ? { ...a, ...updates } : a))
    );
    setSesiones((prev) =>
      prev.map((s) => {
        if (s.id === sesionId) {
          return {
            ...s,
            dia_semana: nuevoDia as DiaSemana,
            hora_inicio: nuevaHoraInicio,
            hora_fin: nuevaHoraFin,
          };
        }
        return s;
      })
    );

    const res = await guardarMovimientoAction(sesionId, updates, horario.id);
    if (res.exito) {
      toast.success("Horario actualizado correctamente.");
    } else {
      // Revertir en caso de error de red o base de datos
      toast.error(`Error al guardar: ${mensajeLegible(res.error)}`);
      setAsignaciones(initialAsignaciones);
      setSesiones(initialSesiones);
    }
  };

  // Manejar cambio de Aula desde el dropdown
  const handleEspacioChange = async (sesionId: string, nuevoEspacioId: string | null) => {
    const sesionActual = asignaciones.find((a) => a.id === sesionId);
    if (!sesionActual) return;

    // Validar cambio
    const candidato: Slot = {
      materia_id: sesionActual.materia_id,
      grupo_id: sesionActual.grupo_id,
      dia: sesionActual.dia_semana as DiaSemana,
      hora_inicio: sesionActual.hora_inicio,
      hora_fin: sesionActual.hora_fin,
      docente_id: sesionActual.docente_id,
      espacio_id: nuevoEspacioId,
      sede_id: sesionActual.sede_id,
      modalidad: sesionActual.modalidad,
    };
    const otrasAsignaciones = asignaciones.filter((a) => a.id !== sesionId);

    const validacion = validarCandidato(candidato, contexto, otrasAsignaciones);

    if (!validacion.valida && validacion.conflicto) {
      toast.error(`Conflicto de Regla (${validacion.conflicto.regla}): ${mensajeLegible(validacion.conflicto.mensaje)}`);
      return;
    }

    const updates = {
      dia_semana: sesionActual.dia_semana,
      hora_inicio: sesionActual.hora_inicio,
      hora_fin: sesionActual.hora_fin,
      espacio_id: nuevoEspacioId,
    };

    // Actualizar estado local
    setAsignaciones((prev) =>
      prev.map((a) => (a.id === sesionId ? { ...a, espacio_id: nuevoEspacioId } : a))
    );
    const espacioObj = espaciosDisponibles.find((e) => e.id === nuevoEspacioId);
    setSesiones((prev) =>
      prev.map((s) => {
        if (s.id === sesionId) {
          return {
            ...s,
            espacio_id: nuevoEspacioId,
            espacios: espacioObj ? { nombre: espacioObj.nombre } : null,
          };
        }
        return s;
      })
    );

    if (!window.confirm("¿Confirmas cambiar el aula de esta clase? Se registrará el cambio en el historial.")) return;
    const res = await guardarMovimientoAction(sesionId, updates, horario.id);
    if (res.exito) {
      toast.success("Aula asignada correctamente.");
    } else {
      toast.error(`Error al asignar aula: ${mensajeLegible(res.error)}`);
      setAsignaciones(initialAsignaciones);
      setSesiones(initialSesiones);
    }
  };

  const handlePublicar = () => {
    if (conflictos.some((c) => c.tipo === "error")) {
      toast.error("No se puede publicar un horario con errores críticos.");
      return;
    }

    startTransition(async () => {
      const res = await publicarHorarioAction(horario.id);
      if (res.exito) {
        toast.success("¡Horario publicado con éxito!");
        router.refresh();
      } else {
        toast.error(`Error al publicar: ${mensajeLegible(res.error)}`);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Barra de título y acciones */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D8D1BD] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="text-gray-500 hover:text-black transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-[#0E1116]">
              Editor Manual de Horarios
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1 pl-7">
            Periodo Académico: <span className="font-semibold text-gray-800">{periodo.nombre}</span> | Estado:{" "}
            <span
              className={`font-semibold px-2 py-0.5 rounded text-xs uppercase ${
                horario.estado === "publicado"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {horario.estado}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <NuevaSesionDialog horarioId={horario.id} opciones={opcionesManuales} grupoIdInicial={grupoIdParaNueva} />
          {/* Botón Descargar PDF */}
          <a
            href={`/api/pdf/horario/${horario.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="s-btn s-btn-ghost flex items-center gap-2 border-[#C7BFA6] hover:bg-[#EFEAD9] py-2.5 px-4"
          >
            <FileText className="w-4 h-4 text-gray-600" />
            <span>Descargar PDF</span>
          </a>

          {/* Botón Publicar Horario */}
          {horario.estado !== "publicado" && (
            <button
              onClick={handlePublicar}
              disabled={isPending}
              className="s-btn s-btn-primary flex items-center gap-2 bg-[#0E1116] hover:bg-[#1D3FD9] text-white py-2.5 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>Publicar Horario</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-[#D8D1BD] bg-[#FEFCF6] p-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="grid gap-1.5 text-sm font-medium text-[#252B36] sm:w-56">
            <span className="flex items-center gap-2"><Filter className="size-4 text-[#1D3FD9]" />Sede</span>
            <select
              value={sedeFiltroId}
              onChange={(event) => cambiarSede(event.target.value)}
              className={selectClass}
            >
              <option value="">Todas las sedes</option>
              {opcionesManuales.sedes.map((sede) => (
                <option key={sede.id} value={sede.id}>{sede.nombre}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-[#252B36] sm:w-72">
            <span>Curso</span>
            <select
              value={cursoFiltroId}
              onChange={(event) => setCursoFiltroId(event.target.value)}
              className={selectClass}
            >
              <option value="">
                {sedeFiltroId ? "Todos los cursos de esta sede" : "Todos los cursos"}
              </option>
              {cursosFiltrados.map((curso) => (
                <option key={curso.id} value={curso.id}>
                  {curso.nombre} · Semestre {curso.semestre}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-xs text-[#697180]">
          Mostrando {sesionesVisibles.length} de {sesiones.length} clases
          {cursoFiltroId ? "" : " (color por docente)"}.
          {" "}Pasa el cursor sobre una clase para editarla o eliminarla.
        </p>
      </div>

      {/* Grid del editor con DndContext */}
      <DndContext id={`horario-editor-${horario.id}`} sensors={sensors} onDragEnd={handleDragEnd}>
        <HorarioGrid
          sesiones={sesionesVisibles}
          editable
          colorPor="docente"
          onEspacioChange={handleEspacioChange}
          onEditSession={(sesion) => setSesionEnEdicion(sesion as SesionVista)}
          espaciosDisponibles={espaciosVisibles}
        />
      </DndContext>
      {sesionEnEdicion && <EditarSesionDialog horarioId={horario.id} sesion={sesionEnEdicion} opciones={opcionesManuales} onClose={() => setSesionEnEdicion(null)} />}
    </div>
  );
}
