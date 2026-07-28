"use client";

import { useMemo, useState } from "react";
import { guardarAsignacionDocente } from "./actions";

type Opcion = { id: string; nombre: string; semestre?: number };

export function AsignacionDocenteForm({
  periodoId,
  materias,
  cursos,
  docentes,
}: {
  periodoId: string;
  materias: Opcion[];
  cursos: Opcion[];
  docentes: Opcion[];
}) {
  const semestres = useMemo(() => [...new Set([...materias, ...cursos].map((item) => item.semestre).filter(Boolean))].sort((a, b) => Number(a) - Number(b)), [materias, cursos]);
  const [semestre, setSemestre] = useState(String(semestres[0] ?? 1));
  const materiasFiltradas = materias.filter((item) => String(item.semestre) === semestre);
  const cursosFiltrados = cursos.filter((item) => String(item.semestre) === semestre);
  const selectClass = "h-11 w-full min-w-0 rounded-lg border border-[#C7BFA6] bg-white px-3 text-sm text-[#0E1116] outline-none focus:border-[#1D3FD9] focus:ring-2 focus:ring-[#1D3FD9]/15";

  return (
    <form action={guardarAsignacionDocente} className="grid gap-4">
      <input type="hidden" name="periodo_id" value={periodoId} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid min-w-0 gap-1.5 text-sm font-medium">Semestre <span className="sr-only">obligatorio</span>
          <select value={semestre} onChange={(event) => setSemestre(event.target.value)} className={selectClass}>
            {semestres.map((item) => <option key={item} value={item}>{item}.º semestre</option>)}
          </select>
        </label>
        <label className="grid min-w-0 gap-1.5 text-sm font-medium">Materia <span className="text-[#C8523B]">*</span>
          <select key={`materia-${semestre}`} name="materia_id" required className={selectClass}>
            <option value="">Selecciona una materia</option>
            {materiasFiltradas.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
          </select>
        </label>
        <label className="grid min-w-0 gap-1.5 text-sm font-medium">Curso <span className="text-[#C8523B]">*</span>
          <select key={`curso-${semestre}`} name="grupo_id" required className={selectClass}>
            <option value="">Selecciona un curso</option>
            {cursosFiltrados.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
          </select>
        </label>
        <label className="grid min-w-0 gap-1.5 text-sm font-medium">Docente <span className="text-[#C8523B]">*</span>
          <select name="docente_id" required className={selectClass}>
            <option value="">Selecciona un docente</option>
            {docentes.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
          </select>
        </label>
      </div>
      <div className="flex justify-end">
        <button className="rounded-lg bg-[#1D3FD9] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1733B5]">Asignar docente</button>
      </div>
    </form>
  );
}
