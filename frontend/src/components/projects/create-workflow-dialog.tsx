"use client";

import { useEffect, useState } from "react";
import * as z from "zod";
import { Plus, Loader2 } from "lucide-react";

import { Button } from "@/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
});

const WORKFLOW_DRAFT_PREFIX = "create-workflow-dialog";

interface CreateWorkflowDialogProps {
    onCreate: (name: string) => Promise<void>;
    isLoading?: boolean;
    children?: React.ReactNode;
    projectId: string;
}

export function CreateWorkflowDialog({
    onCreate,
    isLoading,
    children,
    projectId,
}: CreateWorkflowDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const draftKey = `${WORKFLOW_DRAFT_PREFIX}:${projectId}`;

    useEffect(() => {
        if (!open) {
            return;
        }

        const nextDraft = {
            name: name?.trim() ?? "",
        };

        if (!nextDraft.name) {
            window.localStorage.removeItem(draftKey);
            return;
        }

        window.localStorage.setItem(draftKey, JSON.stringify(nextDraft));
    }, [draftKey, name, open]);

    const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen) {
            const rawDraft = window.localStorage.getItem(draftKey);
            if (rawDraft) {
                try {
                    const draft = JSON.parse(rawDraft) as Partial<z.infer<typeof formSchema>>;
                    setName(draft.name ?? "");
                } catch {
                    window.localStorage.removeItem(draftKey);
                    setName("");
                }
            } else {
                setName("");
            }
            setError(null);
        } else {
            setError(null);
        }

        setOpen(nextOpen);
    };

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        const parsed = formSchema.safeParse({ name });
        if (!parsed.success) {
            setError(parsed.error.issues[0]?.message ?? "Name is required");
            return;
        }

        await onCreate(parsed.data.name);
        window.localStorage.removeItem(draftKey);
        setOpen(false);
        setName("");
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {children || (
                    <Button className="gap-2 px-5">
                        <Plus className="size-4" />
                        New Workflow
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Workflow</DialogTitle>
                    <DialogDescription>
                        Start a new automation workflow in this project.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Workflow Name</Label>
                        <Input
                            id="name"
                            size="md"
                            placeholder="Untitled Workflow"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                        {error && <span className="text-xs text-destructive">{error}</span>}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                            Create Workflow
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
