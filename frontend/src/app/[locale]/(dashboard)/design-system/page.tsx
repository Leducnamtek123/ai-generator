"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table/data-table";

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
        header: "Email",
    },
    {
        accessorKey: "amount",
        header: "Amount",
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
    return (
        <div className="container mx-auto py-10 space-y-10">
            <div>
                <h1 className="text-3xl font-bold mb-4">Design System Verification</h1>
                <p className="text-muted-foreground">
                    Checking strict implementation of Buttons and Data Tables.
                </p>
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
        </div>
    );
}
