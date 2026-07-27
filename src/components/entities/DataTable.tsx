import Link from "next/link";
import { Plus, Search } from "lucide-react";

export type TableColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
};

export function DataTable<T>({
  title,
  description,
  createHref,
  columns,
  rows,
  searchName = "q",
  searchDefault = "",
  filters,
  emptyText = "No hay registros.",
}: {
  title: string;
  description: string;
  createHref?: string;
  columns: TableColumn<T>[];
  rows: T[];
  searchName?: string;
  searchDefault?: string;
  filters?: React.ReactNode;
  emptyText?: string;
}) {
  return (
    <div style={{ maxWidth: 1100 }}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid #D8D1BD",
      }}>
        <div>
          <span style={{
            fontFamily: "JetBrains Mono, monospace", fontSize: 10.5,
            textTransform: "uppercase", letterSpacing: "0.12em", color: "#4A515E",
          }}>
            Gestión
          </span>
          <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", margin: "6px 0 4px", color: "#0E1116" }}>
            {title}
          </h1>
          <p style={{ fontSize: 14, color: "#4A515E", margin: 0 }}>{description}</p>
        </div>
        {createHref && (
          <Link href={createHref} style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 18px", borderRadius: 8,
            background: "#0E1116", color: "#F5F1E8",
            fontSize: 13.5, fontWeight: 500, textDecoration: "none",
            fontFamily: "Poppins, sans-serif",
            transition: "background .15s",
          }}>
            <Plus style={{ width: 15, height: 15 }} />
            Nuevo
          </Link>
        )}
      </div>

      {/* Filtros */}
      <form style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#8A8F99" }} />
          <input
            name={searchName}
            defaultValue={searchDefault}
            placeholder="Buscar..."
            style={{
              width: "100%", height: 38, paddingLeft: 36, paddingRight: 14,
              border: "1px solid #D8D1BD", borderRadius: 8,
              background: "#F5F1E8", fontSize: 13.5, color: "#0E1116",
              fontFamily: "Poppins, sans-serif", outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        {filters}
        <button type="submit" style={{
          height: 38, padding: "0 16px", border: "1px solid #D8D1BD",
          borderRadius: 8, background: "#EFEAD9", color: "#0E1116",
          fontSize: 13.5, fontWeight: 500, cursor: "pointer",
          fontFamily: "Poppins, sans-serif",
        }}>
          Filtrar
        </button>
      </form>

      {/* Tabla */}
      <div style={{ border: "1px solid #D8D1BD", borderRadius: 12, overflow: "hidden", background: "#EFEAD9" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #D8D1BD" }}>
              {columns.map((col) => (
                <th key={col.key} style={{
                  padding: "11px 16px", textAlign: "left",
                  fontFamily: "JetBrains Mono, monospace", fontSize: 10.5,
                  textTransform: "uppercase", letterSpacing: "0.1em",
                  color: "#4A515E", fontWeight: 500, background: "#EFEAD9",
                }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{
                  padding: "48px 16px", textAlign: "center",
                  color: "#8A8F99", fontSize: 14, background: "#F5F1E8",
                }}>
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} style={{
                  borderTop: "1px solid #D8D1BD",
                  background: "#F5F1E8",
                }}>
                  {columns.map((col) => (
                    <td key={col.key} style={{ padding: "12px 16px", fontSize: 13.5, color: "#1F242D", verticalAlign: "middle" }}>
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Contador */}
      {rows.length > 0 && (
        <div style={{
          marginTop: 12, fontFamily: "JetBrains Mono, monospace",
          fontSize: 11, color: "#8A8F99", letterSpacing: "0.05em",
        }}>
          {rows.length} registro{rows.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
