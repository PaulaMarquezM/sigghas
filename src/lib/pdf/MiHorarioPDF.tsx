/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles } from "./styles";
import { indiceColorEstable } from "@/lib/horario";
import { HorarioGridPDF } from "./HorarioGridPDF";

interface MiHorarioPDFProps {
  periodo: any;
  sesiones: any[];
  userNombre: string;
  userRolLabel: string;
}

const bgColors = ["#EBF8FF", "#FEFCBF", "#EDF2F7", "#FED7D7", "#C6F6D5", "#CCFBF1", "#FFEDD5", "#E2E8F0", "#ECFCCB", "#FFE4E6"];

export function MiHorarioPDF({ periodo, sesiones, userNombre, userRolLabel }: MiHorarioPDFProps) {
  const esCurso = userRolLabel === "Curso";
  const uniqueDocenteIds = Array.from(new Set(sesiones.map((s) => s.docente_id)));
  const docenteColors: Record<string, number> = {};
  uniqueDocenteIds.forEach((id) => {
    docenteColors[id] = indiceColorEstable(id, bgColors.length);
  });

  return (
    <Document>
      <Page size="LETTER" orientation="landscape" style={styles.page} wrap={false}>
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <Text style={styles.university}>PUCE Portoviejo</Text>
            <Text style={styles.career}>Carrera de Software</Text>
          </View>
          <View style={styles.titleSection}>
            <Text style={styles.title}>{esCurso ? "Horario del Curso" : "Horario Personal"}</Text>
            <Text style={styles.subtitle}>SIGGHAS - Generador Inteligente</Text>
          </View>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{esCurso ? "Curso" : "Usuario"}</Text>
            <Text style={styles.metaValue}>{userNombre}</Text>
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

        <HorarioGridPDF sesiones={sesiones} docenteColors={docenteColors} />

        <View style={styles.footer} fixed>
          <Text>Documento oficial emitido por PUCE Portoviejo - Carrera de Software</Text>
          <Text>Página 1 de 1</Text>
        </View>
      </Page>
    </Document>
  );
}
