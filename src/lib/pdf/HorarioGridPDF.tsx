/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { styles } from "./styles";
import { generarSlots30, slotsDe30Min } from "@/lib/horario";

const DIAS = [
  { id: 1, label: "Lunes" },
  { id: 2, label: "Martes" },
  { id: 3, label: "Miércoles" },
  { id: 4, label: "Jueves" },
  { id: 5, label: "Viernes" },
  { id: 6, label: "Sábado" },
];

/** LETTER landscape page metrics used to keep each horario on a single PDF page. */
const PAGE_HEIGHT = 612;
const PAGE_PADDING = 30;
const FOOTER_RESERVE = 40;
const HEADER_BLOCK = 63;
const META_BLOCK = 59;
const TABLE_HEADER_HEIGHT = 22;
const MAX_ROW_HEIGHT = 28;
const MIN_ROW_HEIGHT = 12;
const HOUR_COL_WIDTH = 70;

const bgColors = ["#EBF8FF", "#FEFCBF", "#EDF2F7", "#FED7D7", "#C6F6D5", "#CCFBF1", "#FFEDD5", "#E2E8F0", "#ECFCCB", "#FFE4E6"];
const borderColors = ["#BEE3F8", "#FEEB8C", "#E2E8F0", "#FEB2B2", "#9AE6B4", "#99F6E4", "#FDBA74", "#CBD5E1", "#BEF264", "#FECDD3"];
const textColors = ["#2B6CB0", "#744210", "#2D3748", "#9B2C2C", "#22543D", "#115E59", "#9A3412", "#334155", "#3F6212", "#9F1239"];

function minutoDe(hora: string): number {
  const [h, m] = hora.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

/** Scales row height so the full grid fits in one landscape LETTER page. */
export function rowHeightForFranjas(franjasCount: number): number {
  if (franjasCount <= 0) return MAX_ROW_HEIGHT;
  const available =
    PAGE_HEIGHT -
    PAGE_PADDING * 2 -
    FOOTER_RESERVE -
    HEADER_BLOCK -
    META_BLOCK -
    TABLE_HEADER_HEIGHT;
  return Math.max(MIN_ROW_HEIGHT, Math.min(MAX_ROW_HEIGHT, available / franjasCount));
}

interface HorarioGridPDFProps {
  sesiones: any[];
  docenteColors: Record<string, number>;
}

export function HorarioGridPDF({ sesiones, docenteColors }: HorarioGridPDFProps) {
  const horas = generarSlots30(sesiones);
  // Cada etiqueta es el inicio de un tramo de 30 min; la última es solo cierre.
  const franjas = horas.slice(0, -1);
  const gridStartMin = minutoDe(horas[0] ?? "07:00");
  const rowHeight = rowHeightForFranjas(franjas.length);
  const compact = rowHeight < 20;
  const bodyHeight = franjas.length * rowHeight;

  return (
    <View style={{ position: "relative" }} wrap={false}>
      <View style={styles.table}>
        <View style={[styles.tableRowHeader, { minHeight: TABLE_HEADER_HEIGHT, height: TABLE_HEADER_HEIGHT }]}>
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
          <View key={hora} style={[styles.tableRow, { minHeight: rowHeight, height: rowHeight }]}>
            <View style={styles.tableColHour}>
              <Text style={compact ? [styles.tableCellHour, { fontSize: 7 }] : styles.tableCellHour}>
                {hora}
              </Text>
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

      {/* Capa absoluta: debe vivir en la misma página que la grilla (wrap=false). */}
      <View
        style={{
          position: "absolute",
          top: TABLE_HEADER_HEIGHT,
          left: HOUR_COL_WIDTH,
          right: 0,
          height: bodyHeight,
        }}
      >
        <View style={{ flexDirection: "row", height: bodyHeight }}>
          {DIAS.map((dia) => (
            <View key={dia.id} style={{ flex: 1, position: "relative" }}>
              {sesiones
                .filter((s) => s.dia_semana === dia.id)
                .map((s) => {
                  const colorIdx = docenteColors[s.docente_id] ?? 0;
                  const slots = slotsDe30Min(s.hora_inicio, s.hora_fin);
                  const top =
                    ((minutoDe(s.hora_inicio) - gridStartMin) / 30) * rowHeight;
                  const blockHeight = Math.max(slots * rowHeight - 2, rowHeight - 2);
                  const showDetails = blockHeight >= 36;
                  const showFooter = blockHeight >= 28;

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
                          height: blockHeight,
                          padding: compact ? 2 : 4,
                          backgroundColor: bgColors[colorIdx],
                          borderColor: borderColors[colorIdx],
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.sessionMateria,
                          { color: textColors[colorIdx], fontSize: compact ? 6 : 7 },
                        ]}
                      >
                        {s.materias?.nombre}
                      </Text>
                      {showDetails && (
                        <>
                          <Text
                            style={
                              compact
                                ? [styles.sessionDocente, { fontSize: 5 }]
                                : styles.sessionDocente
                            }
                          >
                            Doc: {s.docentes?.perfiles?.nombre || "Docente"}
                          </Text>
                          <Text style={[styles.sessionDocente, { marginTop: 1, fontSize: compact ? 5 : 6 }]}>
                            {s.hora_inicio.slice(0, 5)} – {s.hora_fin.slice(0, 5)}
                          </Text>
                        </>
                      )}
                      {showFooter && (
                        <View style={styles.sessionFooter}>
                          <Text style={[styles.sessionGroup, { color: textColors[colorIdx], fontSize: compact ? 5 : 6 }]}>
                            {s.grupos?.nombre}
                          </Text>
                          <Text
                            style={
                              compact
                                ? [styles.sessionAula, { fontSize: 4 }]
                                : styles.sessionAula
                            }
                          >
                            {s.modalidad === "presencial"
                              ? s.espacios?.nombre || "S/A"
                              : s.modalidad === "hibrida"
                                ? "Híbrida"
                                : "Virtual"}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
