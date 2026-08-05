/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles } from "./styles";
import { generarSlots30, indiceColorEstable, slotsDe30Min } from "@/lib/horario";

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
  { id: 6, label: "Sábado" },
];

const ROW_HEIGHT = 28;

const bgColors = ["#EBF8FF", "#FEFCBF", "#EDF2F7", "#FED7D7", "#C6F6D5", "#CCFBF1", "#FFEDD5", "#E2E8F0", "#ECFCCB", "#FFE4E6"];
const borderColors = ["#BEE3F8", "#FEEB8C", "#E2E8F0", "#FEB2B2", "#9AE6B4", "#99F6E4", "#FDBA74", "#CBD5E1", "#BEF264", "#FECDD3"];
const textColors = ["#2B6CB0", "#744210", "#2D3748", "#9B2C2C", "#22543D", "#115E59", "#9A3412", "#334155", "#3F6212", "#9F1239"];

function minutoDe(hora: string): number {
  const [h, m] = hora.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

export function HorarioPDF({ horario, periodo, sesiones, grupoNombre = "General" }: HorarioPDFProps) {
  const uniqueDocenteIds = Array.from(new Set(sesiones.map((s) => s.docente_id)));
  const docenteColors: Record<string, number> = {};
  uniqueDocenteIds.forEach((id) => {
    docenteColors[id] = indiceColorEstable(id, bgColors.length);
  });

  const horas = generarSlots30(sesiones);
  // Franjas ocupables: cada etiqueta es el inicio de un tramo de 30 min; la última etiqueta es solo cierre.
  const franjas = horas.slice(0, -1);
  const gridStartMin = minutoDe(horas[0] ?? "07:00");

  return (
    <Document>
      <Page size="LETTER" orientation="landscape" style={styles.page}>
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

        {/* Tabla con capa absoluta de bloques continuos */}
        <View style={{ position: "relative" }}>
          <View style={styles.table}>
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

            {franjas.map((hora) => (
              <View key={hora} style={[styles.tableRow, { minHeight: ROW_HEIGHT, height: ROW_HEIGHT }]}>
                <View style={styles.tableColHour}>
                  <Text style={styles.tableCellHour}>{hora}</Text>
                </View>
                {DIAS.map((dia, idx) => {
                  const isLastCol = idx === DIAS.length - 1;
                  return (
                    <View
                      key={dia.id}
                      style={isLastCol ? styles.tableColDayLast : styles.tableColDay}
                    />
                  );
                })}
              </View>
            ))}
          </View>

          {/* Bloques continuos posicionados por minutos */}
          <View
            style={{
              position: "absolute",
              top: 25, // alto del header de la tabla
              left: 70,
              right: 0,
              bottom: 0,
            }}
          >
            <View style={{ flexDirection: "row", height: franjas.length * ROW_HEIGHT }}>
              {DIAS.map((dia) => (
                <View key={dia.id} style={{ flex: 1, position: "relative" }}>
                  {sesiones
                    .filter((s) => s.dia_semana === dia.id)
                    .map((s) => {
                      const colorIdx = docenteColors[s.docente_id] ?? 0;
                      const slots = slotsDe30Min(s.hora_inicio, s.hora_fin);
                      const top =
                        ((minutoDe(s.hora_inicio) - gridStartMin) / 30) * ROW_HEIGHT;
                      return (
                        <View
                          key={s.id}
                          style={[
                            styles.sessionBlock,
                            {
                              position: "absolute",
                              top: top + 1,
                              left: 2,
                              right: 2,
                              height: slots * ROW_HEIGHT - 2,
                              backgroundColor: bgColors[colorIdx],
                              borderColor: borderColors[colorIdx],
                            },
                          ]}
                        >
                          <Text style={[styles.sessionMateria, { color: textColors[colorIdx] }]}>
                            {s.materias?.nombre}
                          </Text>
                          <Text style={styles.sessionDocente}>
                            Doc: {s.docentes?.perfiles?.nombre || "Docente"}
                          </Text>
                          <Text style={[styles.sessionDocente, { marginTop: 2 }]}>
                            {s.hora_inicio.slice(0, 5)} – {s.hora_fin.slice(0, 5)}
                          </Text>
                          <View style={styles.sessionFooter}>
                            <Text style={[styles.sessionGroup, { color: textColors[colorIdx] }]}>
                              {s.grupos?.nombre}
                            </Text>
                            <Text style={styles.sessionAula}>
                              {s.modalidad === "presencial"
                                ? s.espacios?.nombre || "S/A"
                                : s.modalidad === "hibrida"
                                  ? "Híbrida"
                                  : "Virtual"}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Documento oficial emitido por PUCE Portoviejo - Carrera de Software</Text>
          <Text>Página 1 de 1</Text>
        </View>
      </Page>
    </Document>
  );
}
