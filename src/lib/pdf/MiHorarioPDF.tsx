/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles } from "./styles";
import { generarSlots30, indiceColorEstable } from "@/lib/horario";

interface MiHorarioPDFProps {
  periodo: any;
  sesiones: any[];
  userNombre: string;
  userRolLabel: string;
}

const DIAS = [
  { id: 1, label: "Lunes" },
  { id: 2, label: "Martes" },
  { id: 3, label: "Miércoles" },
  { id: 4, label: "Jueves" },
  { id: 5, label: "Viernes" },
];

// Colors
const bgColors = ["#EBF8FF", "#FEFCBF", "#EDF2F7", "#FED7D7", "#C6F6D5"];
const borderColors = ["#BEE3F8", "#FEEB8C", "#E2E8F0", "#FEB2B2", "#9AE6B4"];
const textColors = ["#2B6CB0", "#744210", "#2D3748", "#9B2C2C", "#22543D"];

export function MiHorarioPDF({ periodo, sesiones, userNombre, userRolLabel }: MiHorarioPDFProps) {
  const uniqueDocenteIds = Array.from(new Set(sesiones.map((s) => s.docente_id)));
  const docenteColors: Record<string, number> = {};
  uniqueDocenteIds.forEach((id) => {
    docenteColors[id] = indiceColorEstable(id, bgColors.length);
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
            <Text style={styles.title}>Horario Personal</Text>
            <Text style={styles.subtitle}>SIGGHAS - Generador Inteligente</Text>
          </View>
        </View>

        {/* Metadata */}
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Usuario</Text>
            <Text style={styles.metaValue}>{userNombre}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Rol</Text>
            <Text style={styles.metaValue}>{userRolLabel}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Periodo Académico</Text>
            <Text style={styles.metaValue}>{periodo.nombre}</Text>
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
          {generarSlots30(sesiones).map((hora) => (
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
                      const colorIdx = docenteColors[s.docente_id] ?? 0;
                      const customBlockStyle = {
                        backgroundColor: bgColors[colorIdx],
                        borderColor: borderColors[colorIdx],
                        color: textColors[colorIdx],
                      };

                      return (
                        <View key={s.id} style={[styles.sessionBlock, customBlockStyle]}>
                          <View>
                            <Text style={[styles.sessionMateria, { color: textColors[colorIdx] }]}>
                              {s.materias?.nombre}
                            </Text>
                            <Text style={styles.sessionDocente}>
                              Doc: {s.docentes?.perfiles?.nombre || "Docente"}
                            </Text>
                          </View>
                          <View style={styles.sessionFooter}>
                            <Text style={[styles.sessionGroup, { color: textColors[colorIdx] }]}>
                              {s.grupos?.nombre}
                            </Text>
                            <Text style={styles.sessionAula}>
                              {s.modalidad === "presencial" ? s.espacios?.nombre || "S/A" : s.modalidad === "hibrida" ? "Híbrida" : "Virtual"}
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
