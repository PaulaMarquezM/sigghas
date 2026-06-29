import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles } from "./styles";

interface HorarioPDFProps {
  horario: any;
  periodo: any;
  sesiones: any[];
  grupoNombre?: string;
}

const DIAS = [
  { id: 1, label: "Lunes" },
  { id: 2, label: "Martes" },
  { id: 3, label: "Miércoles" },
  { id: 4, label: "Jueves" },
  { id: 5, label: "Viernes" },
];

const HORAS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

// Helper to determine background color dynamically for PDF
const bgColors = ["#EBF8FF", "#FEFCBF", "#EDF2F7", "#FED7D7", "#C6F6D5"];
const borderColors = ["#BEE3F8", "#FEEB8C", "#E2E8F0", "#FEB2B2", "#9AE6B4"];
const textColors = ["#2B6CB0", "#744210", "#2D3748", "#9B2C2C", "#22543D"];

export function HorarioPDF({ horario, periodo, sesiones, grupoNombre = "General" }: HorarioPDFProps) {
  // Map unique materias to color indices
  const uniqueMateriaIds = Array.from(new Set(sesiones.map((s) => s.materia_id)));
  const materiaColors: Record<string, number> = {};
  uniqueMateriaIds.forEach((id, idx) => {
    materiaColors[id] = idx % bgColors.length;
  });

  return (
    <Document>
      <Page size="LETTER" orientation="landscape" style={styles.page}>
        {/* Header */}
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

        {/* Metadata */}
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Periodo Académico</Text>
            <Text style={styles.metaValue}>{periodo.nombre}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Grupo/Filtro</Text>
            <Text style={styles.metaValue}>{grupoNombre}</Text>
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

        {/* Table Grid */}
        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableRowHeader}>
            <View style={styles.tableColHeaderHour}>
              <Text style={styles.tableCellHeader}>Hora</Text>
            </View>
            {DIAS.map((d) => (
              <View key={d.id} style={styles.tableColHeaderDay}>
                <Text style={styles.tableCellHeader}>{d.label}</Text>
              </View>
            ))}
          </View>

          {/* Hour Rows */}
          {HORAS.map((hora) => (
            <View key={hora} style={styles.tableRow}>
              {/* Hour Label */}
              <View style={styles.tableColHour}>
                <Text style={styles.tableCellHour}>{hora}</Text>
              </View>

              {/* Day Cells */}
              {DIAS.map((dia, idx) => {
                const sesionesEnCelda = sesiones.filter((s) => {
                  const sInicio = s.hora_inicio.slice(0, 5);
                  return s.dia_semana === dia.id && sInicio === hora;
                });

                const isLastCol = idx === DIAS.length - 1;
                const colStyle = isLastCol ? styles.tableColDayLast : styles.tableColDay;

                return (
                  <View key={dia.id} style={colStyle}>
                    {sesionesEnCelda.map((s) => {
                      const colorIdx = materiaColors[s.materia_id] ?? 0;
                      const customBlockStyle = {
                        backgroundColor: bgColors[colorIdx],
                        borderColor: borderColors[colorIdx],
                        color: textColors[colorIdx],
                      };

                      return (
                        <View key={s.id} style={[styles.sessionBlock, customBlockStyle]}>
                          <View>
                            <Text style={[styles.sessionMateria, { color: textColors[colorIdx] }]}>
                              {s.materias?.codigo} - {s.materias?.nombre}
                            </Text>
                            <Text style={styles.sessionDocente}>
                              Doc: {s.perfiles?.nombre || "Docente"}
                            </Text>
                          </View>
                          <View style={styles.sessionFooter}>
                            <Text style={[styles.sessionGroup, { color: textColors[colorIdx] }]}>
                              {s.grupos?.nombre}
                            </Text>
                            <Text style={styles.sessionAula}>
                              {s.modalidad === "virtual" ? "Virtual" : s.espacios?.nombre || "S/A"}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Documento oficial emitido por PUCE Portoviejo - Carrera de Software</Text>
          <Text>Página 1 de 1</Text>
        </View>
      </Page>
    </Document>
  );
}
