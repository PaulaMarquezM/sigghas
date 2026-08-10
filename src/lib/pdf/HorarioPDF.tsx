/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles } from "./styles";
import { indiceColorEstable } from "@/lib/horario";
import { HorarioGridPDF } from "./HorarioGridPDF";
import type { PaginaHorarioPDF } from "./groupSesionesBySemestreSede";

interface HorarioPDFProps {
  horario: any;
  periodo: any;
  paginas: PaginaHorarioPDF[];
}

const bgColors = ["#EBF8FF", "#FEFCBF", "#EDF2F7", "#FED7D7", "#C6F6D5", "#CCFBF1", "#FFEDD5", "#E2E8F0", "#ECFCCB", "#FFE4E6"];

function PaginaHorario({
  horario,
  periodo,
  etiqueta,
  sesiones,
  docenteColors,
  paginaActual,
  totalPaginas,
}: {
  horario: any;
  periodo: any;
  etiqueta: string;
  sesiones: any[];
  docenteColors: Record<string, number>;
  paginaActual: number;
  totalPaginas: number;
}) {
  return (
    <Page size="LETTER" orientation="landscape" style={styles.page} wrap={false}>
      <View style={styles.header}>
        <View style={styles.logoSection}>
          <Text style={styles.university}>PUCE Portoviejo</Text>
          <Text style={styles.career}>Carrera de Software</Text>
        </View>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Horario de Clases</Text>
          <Text style={styles.subtitle}>SIGGHAS - Generador Inteligente</Text>
        </View>
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Periodo Académico</Text>
          <Text style={styles.metaValue}>{periodo.nombre}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Curso/Filtro</Text>
          <Text style={styles.metaValue}>{etiqueta}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Estado del Horario</Text>
          <Text style={styles.metaValue}>{horario.estado.toUpperCase()}</Text>
        </View>
        <View style={styles.metaItemLast}>
          <Text style={styles.metaLabel}>Fecha Emisión</Text>
          <Text style={styles.metaValue}>{new Date().toLocaleDateString()}</Text>
        </View>
      </View>

      <HorarioGridPDF sesiones={sesiones} docenteColors={docenteColors} />

      <View style={styles.footer} fixed>
        <Text>Documento oficial emitido por PUCE Portoviejo - Carrera de Software</Text>
        <Text>
          Página {paginaActual} de {totalPaginas}
        </Text>
      </View>
    </Page>
  );
}

export function HorarioPDF({ horario, periodo, paginas }: HorarioPDFProps) {
  const paginasEfectivas =
    paginas.length > 0
      ? paginas
      : [
          {
            etiqueta: "Sin clases programadas",
            semestre: 0,
            sedeId: "",
            sedeNombre: "",
            sesiones: [] as any[],
          },
        ];

  const todasLasSesiones = paginasEfectivas.flatMap((pagina) => pagina.sesiones);
  const uniqueDocenteIds = Array.from(new Set(todasLasSesiones.map((s) => s.docente_id)));
  const docenteColors: Record<string, number> = {};
  uniqueDocenteIds.forEach((id) => {
    docenteColors[id] = indiceColorEstable(id, bgColors.length);
  });

  const totalPaginas = paginasEfectivas.length;

  return (
    <Document>
      {paginasEfectivas.map((pagina, index) => (
        <PaginaHorario
          key={`${pagina.semestre}-${pagina.sedeId}-${index}`}
          horario={horario}
          periodo={periodo}
          etiqueta={pagina.etiqueta}
          sesiones={pagina.sesiones}
          docenteColors={docenteColors}
          paginaActual={index + 1}
          totalPaginas={totalPaginas}
        />
      ))}
    </Document>
  );
}
