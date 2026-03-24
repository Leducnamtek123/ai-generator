"use client";

import { useMemo, useEffect } from "react";
import { notFound } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/shared/data-table/data-table";
import { DataTableColumnHeader } from "@/components/shared/data-table/data-table-column-header";

// Dummy Data for Table
type Payment = {
    id: string;
    amount: number;
    status: "pending" | "processing" | "success" | "failed";
    email: string;
};

const data: Payment[] = [
    { id: "728ed52f", amount: 100, status: "pending", email: "m@example.com" },
    { id: "489e1d42", amount: 125, status: "processing", email: "example@gmail.com" },
    { id: "524s1s22", amount: 300, status: "success", email: "success@gmail.com" },
    { id: "123k123j", amount: 50, status: "failed", email: "failed@gmail.com" },
    // Add more rows to test pagination
    ...Array.from({ length: 20 }).map((_, i) => ({
        id: `id-${i}`,
        amount: Math.floor(Math.random() * 500),
        status: ["pending", "processing", "success", "failed"][
            Math.floor(Math.random() * 4)
        ] as Payment["status"],
        email: `user${i}@example.com`,
    })),
];

const columns: ColumnDef<Payment>[] = [
    {
        accessorKey: "status",
        header: "Status",
    },
    {
        accessorKey: "email",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Email" />
        ),
    },
    {
        accessorKey: "amount",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Amount" />
        ),
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("amount"));
            const formatted = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(amount);
            return <div className="font-medium">{formatted}</div>;
        },
    },
];

export default function DesignSystemPage() {
    // Protect route in production
    useEffect(() => {
        if (process.env.NODE_ENV === "production") {
            notFound();
        }
    }, []);

    if (process.env.NODE_ENV === "production") {
        return null;
    }

    return (
        <div className="container mx-auto py-10 space-y-10">
            <div>
                <h1 className="text-3xl font-bold mb-4">Design System Verification</h1>
                <p className="text-muted-foreground">
                    Checking strict implementation of Buttons and Data Tables.
                </p>
                <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 p-4 rounded-md mt-4 text-sm">
                    This page is only visible in development mode.
                </div>
            </div>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">1. Button Scale (xs - xl)</h2>
                <div className="flex flex-wrap items-center gap-4 border p-6 rounded-lg bg-card text-card-foreground shadow-sm">
                    <Button size="xs" variant="default">Button xs</Button>
                    <Button size="sm" variant="default">Button sm</Button>
                    <Button size="md" variant="default">Button md (Default)</Button>
                    <Button size="lg" variant="default">Button lg</Button>
                    <Button size="xl" variant="default">Button xl</Button>
                </div>
                <div className="flex flex-wrap items-center gap-4 border p-6 rounded-lg bg-card text-card-foreground shadow-sm">
                    <Button size="xs" variant="outline">Outline xs</Button>
                    <Button size="sm" variant="ghost">Ghost sm</Button>
                    <Button size="md" variant="destructive">Destructive md</Button>
                    <Button size="lg" variant="secondary">Secondary lg</Button>
                    <Button size="xl" variant="link">Link xl</Button>
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">2. Data Table (Shared Component)</h2>
                <div className="border p-6 rounded-lg bg-card text-card-foreground shadow-sm">
                    <DataTable columns={columns} data={data} />
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold">3. Form Controls (Strict Scale: xs - xl)</h2>
                <div className="border p-6 rounded-lg bg-card text-card-foreground shadow-sm space-y-8">
                    {/* XS */}
                    <div className="flex items-center gap-4">
                        <span className="w-8 text-xs font-mono text-muted-foreground">xs</span>
                        <Button size="xs">Button xs</Button>
                        <div className="w-48">
                            <Input size="xs" placeholder="Input xs" />
                        </div>
                        <div className="w-48">
                            <Select>
                                <SelectTrigger size="xs">
                                    <SelectValue placeholder="Select xs" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Option 1</SelectItem>
                                    <SelectItem value="2">Option 2</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* SM */}
                    <div className="flex items-center gap-4">
                        <span className="w-8 text-xs font-mono text-muted-foreground">sm</span>
                        <Button size="sm">Button sm</Button>
                        <div className="w-48">
                            <Input size="sm" placeholder="Input sm" />
                        </div>
                        <div className="w-48">
                            <Select>
                                <SelectTrigger size="sm">
                                    <SelectValue placeholder="Select sm" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Option 1</SelectItem>
                                    <SelectItem value="2">Option 2</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* MD */}
                    <div className="flex items-center gap-4">
                        <span className="w-8 text-xs font-mono text-muted-foreground">md</span>
                        <Button size="md">Button md</Button>
                        <div className="w-48">
                            <Input size="md" placeholder="Input md (Default)" />
                        </div>
                        <div className="w-48">
                            <Select>
                                <SelectTrigger size="md">
                                    <SelectValue placeholder="Select md" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Option 1</SelectItem>
                                    <SelectItem value="2">Option 2</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* LG */}
                    <div className="flex items-center gap-4">
                        <span className="w-8 text-xs font-mono text-muted-foreground">lg</span>
                        <Button size="lg">Button lg</Button>
                        <div className="w-48">
                            <Input size="lg" placeholder="Input lg" />
                        </div>
                        <div className="w-48">
                            <Select>
                                <SelectTrigger size="lg">
                                    <SelectValue placeholder="Select lg" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Option 1</SelectItem>
                                    <SelectItem value="2">Option 2</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* XL */}
                    <div className="flex items-center gap-4">
                        <span className="w-8 text-xs font-mono text-muted-foreground">xl</span>
                        <Button size="xl">Button xl</Button>
                        <div className="w-48">
                            <Input size="xl" placeholder="Input xl" />
                        </div>
                        <div className="w-48">
                            <Select>
                                <SelectTrigger size="xl">
                                    <SelectValue placeholder="Select xl" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Option 1</SelectItem>
                                    <SelectItem value="2">Option 2</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
