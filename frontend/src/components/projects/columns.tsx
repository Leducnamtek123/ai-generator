"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Folder, ExternalLink } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";
import { Project } from "@/stores/project-store";

export const columns: ColumnDef<Project>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Project Name" />
        ),
        cell: ({ row }) => {
            const project = row.original;
            return (
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Folder className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                        <Link
                            href={`/projects/${project.id}`}
                            className="font-medium hover:underline hover:text-primary transition-colors"
                        >
                            {project.name}
                        </Link>
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => {
            return (
                <div className="max-w-[500px] truncate text-muted-foreground">
                    {row.getValue("description") || "No description"}
                </div>
            );
        },
    },
    {
        accessorKey: "updatedAt",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Last Updated" />
        ),
        cell: ({ row }) => {
            const date = new Date(row.getValue("updatedAt"));
            return (
                <div className="text-muted-foreground">
                    {date.toLocaleDateString()}
                </div>
            );
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const project = row.original;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(project.id)}
                        >
                            Copy Project ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href={`/projects/${project.id}`}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Open Project
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
