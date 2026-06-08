import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        {createHref ? (
          <Link href={createHref} className={buttonVariants()}>
            <Plus className="size-4" />
            Nuevo
          </Link>
        ) : null}
      </div>

      <form className="flex flex-col gap-2 md:flex-row md:items-end">
        <label className="max-w-sm flex-1 space-y-1 text-sm font-medium text-gray-700">
          <span>Buscar</span>
          <div className="relative">
            <Search className="absolute left-2 top-2 size-4 text-gray-400" />
            <Input name={searchName} defaultValue={searchDefault} className="pl-8" placeholder="Nombre o código" />
          </div>
        </label>
        {filters}
        <Button type="submit" variant="outline">Filtrar</Button>
      </form>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key}>{column.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500">
                    {emptyText}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={column.key}>{column.cell(row)}</TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
