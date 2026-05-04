"use client";

import * as React from "react";
import { useMemo, useState } from "react";

import {
    ColumnDef,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { useUsers } from "@/hooks";

import { Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui";
import type { UserType } from "@/types";

export function UserList() {
  const { data = [], isPending, isError, error } = useUsers();
  const t = useTranslations("UserList");

  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [sortKey, setSortKey] = useState<"id" | "name" | null>("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const columns = useMemo<ColumnDef<UserType>[]>(
    () => [
      {
        accessorKey: "id",
        header: () => (
          <span
            className="flex cursor-pointer items-center gap-2 [&_svg]:size-4"
            onClick={() => {
              setSortKey("id");
              setSortDir((prev) => (sortKey === "id" && prev === "asc" ? "desc" : "asc"));
            }}
          >
            {t("id")}
            <ArrowUpDown />
          </span>
        )
      },
      {
        accessorKey: "name",
        header: () => (
          <span
            className="flex cursor-pointer items-center gap-2 [&_svg]:size-4"
            onClick={() => {
              setSortKey("name");
              setSortDir((prev) => (sortKey === "name" && prev === "asc" ? "desc" : "asc"));
            }}
          >
            {t("name")}
            <ArrowUpDown />
          </span>
        )
      },
      {
        accessorKey: "email",
        header: () => <span>{t("email")}</span>,
        enableSorting: false,
        cell: ({ row }) => <div className="lowercase">{row.getValue("email") as string}</div>
      }
    ],
    [t, sortKey]
  );

  const filtered = useMemo(() => {
    const next = (data as UserType[]).filter((item) => {
      const haystack = `${item.id} ${item.name ?? ""} ${item.email ?? ""}`.toLowerCase();
      return haystack.includes(globalFilter.toLowerCase());
    });

    if (!sortKey) return next;

    return [...next].sort((a, b) => {
      const left = String(a[sortKey] ?? "");
      const right = String(b[sortKey] ?? "");
      const result = left.localeCompare(right);
      return sortDir === "asc" ? result : -result;
    });
  }, [data, globalFilter, sortDir, sortKey]);

  if (isError) {
    return (
      <section className="mt-10">
        <div>
          {t("error")}: {(error as Error).message}
        </div>
      </section>
    );
  }

  return (
    <section className="col-span-3 lg:col-span-2">
      <div className="flex items-center py-4">
        <Input
          placeholder={t("searchPlaceholder")}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-56"
        />
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={column.id ?? String((column as any).accessorKey ?? index)}>
                  {typeof column.header === "function"
                    ? (column.header as unknown as () => React.ReactNode)()
                    : column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t("loading")}
                </TableCell>
              </TableRow>
            ) : filtered.length ? (
              filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.email}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t("noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
