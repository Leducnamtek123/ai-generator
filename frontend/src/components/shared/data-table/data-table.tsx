"use client";

import {
    ColumnDef,
} from "@tanstack/react-table";
import * as React from "react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
}

export function DataTable<TData, TValue>({
    columns,
    data,
}: DataTableProps<TData, TValue>) {
    const [pageIndex, setPageIndex] = React.useState(0);
    const [currentPageSize, setCurrentPageSize] = React.useState(10);

    const pageCount = Math.max(1, Math.ceil(data.length / currentPageSize));
    const safePageIndex = Math.min(pageIndex, pageCount - 1);
    const pageData = data.slice(
        safePageIndex * currentPageSize,
        safePageIndex * currentPageSize + currentPageSize,
    );

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((column, index) => (
                                <TableHead key={column.id ?? index}>{column.header as React.ReactNode}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pageData.length ? (
                            pageData.map((row, rowIndex) => (
                                <TableRow key={rowIndex}>
                                    {columns.map((column, columnIndex) => (
                                        <TableCell key={column.id ?? columnIndex}>
                                            {typeof column.cell === "function"
                                                ? column.cell({
                                                    row: {
                                                        original: row,
                                                        getValue: (key: string) => {
                                                            const value = (row as Record<string, unknown>)[key];
                                                            return value;
                                                        },
                                                    },
                                                    column,
                                                    getValue: () => undefined,
                                                } as never)
                                                : "accessorKey" in column && typeof (column as { accessorKey?: string | number | symbol }).accessorKey === "string"
                                                    ? String((row as Record<string, unknown>)[(column as { accessorKey: string }).accessorKey] ?? "")
                                                    : null}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-between px-2 text-sm text-muted-foreground">
                <div>
                    {data.length} row(s)
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className="rounded border px-2 py-1 disabled:opacity-50"
                        onClick={() => setPageIndex(0)}
                        disabled={safePageIndex === 0}
                    >
                        First
                    </button>
                    <button
                        className="rounded border px-2 py-1 disabled:opacity-50"
                        onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                        disabled={safePageIndex === 0}
                    >
                        Prev
                    </button>
                    <span>
                        Page {safePageIndex + 1} of {pageCount}
                    </span>
                    <button
                        className="rounded border px-2 py-1 disabled:opacity-50"
                        onClick={() => setPageIndex((p) => Math.min(pageCount - 1, p + 1))}
                        disabled={safePageIndex >= pageCount - 1}
                    >
                        Next
                    </button>
                </div>
                <select
                    className="rounded border bg-background px-2 py-1"
                    value={currentPageSize}
                    onChange={(e) => {
                        setCurrentPageSize(Number(e.target.value));
                        setPageIndex(0);
                    }}
                >
                    {[10, 20, 30, 40, 50].map((size) => (
                        <option key={size} value={size}>{size}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
