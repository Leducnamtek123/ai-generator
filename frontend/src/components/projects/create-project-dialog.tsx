'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/ui/dialog';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { useProjectStore } from '@/stores/project-store';

const formSchema = z.object({
    name: z.string().min(1, 'Project name is required'),
    description: z.string().optional(),
});

export function CreateProjectDialog({ children }: { children?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const { createProject, isLoading } = useProjectStore();
    const router = useRouter();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            description: '',
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        const id = await createProject(values.name, values.description || '');
        if (id) {
            setOpen(false);
            reset();
            router.push(`/project/${id}`);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Project
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[#1A1D21] border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Create Project</DialogTitle>
                    <DialogDescription className="text-white/60">
                        Create a new project to organize your creative assets.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name" className="text-white">Name</Label>
                        <Input
                            id="name"
                            className="bg-black/20 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-blue-500/50"
                            placeholder="My Awesome Project"
                            {...register('name')}
                        />
                        {errors.name && (
                            <span className="text-xs text-red-400">{errors.name.message}</span>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description" className="text-white">Description</Label>
                        <Input
                            id="description"
                            className="bg-black/20 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-blue-500/50"
                            placeholder="Optional description"
                            {...register('description')}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Project
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
