"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
    const draftKey = `${WORKFLOW_DRAFT_PREFIX}:${projectId}`;

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
        },
    });

    const name = watch("name");

    useEffect(() => {
        if (!open) {
            return;
        }

        const rawDraft = window.localStorage.getItem(draftKey);
        if (!rawDraft) {
            return;
        }

        try {
            const draft = JSON.parse(rawDraft) as Partial<z.infer<typeof formSchema>>;
            reset({
                name: draft.name ?? "",
            });
        } catch {
            window.localStorage.removeItem(draftKey);
        }
    }, [draftKey, open, reset]);

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

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        await onCreate(values.name);
        window.localStorage.removeItem(draftKey);
        setOpen(false);
        reset();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
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
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Workflow Name</Label>
                        <Input
                            id="name"
                            size="md"
                            placeholder="Untitled Workflow"
                            {...register("name")}
                        />
                        {errors.name && (
                            <span className="text-xs text-destructive">{errors.name.message}</span>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Workflow
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
