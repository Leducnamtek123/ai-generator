'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/ui/button';
import { Sparkles, Loader2, Github, Chrome, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { post } from '@/lib/api';

const registerSchema = z.object({
    firstName: z.string().min(2, "First name is too short"),
    lastName: z.string().min(2, "Last name is too short"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Must be at least 8 characters"),
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function SignUpPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<RegisterValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: { firstName: "", lastName: "", email: "", password: "" }
    });

    const onSubmit = async (data: RegisterValues) => {
        setIsLoading(true);
        try {
            await post('/auth/email/register', data);

            toast.success("Account created!", {
                description: "Please check your email to confirm your account."
            });
            router.push('/sign-in');
        } catch (error: any) {
            toast.error("Registration failed", {
                description: error.response?.data?.message || error.message || "Please check your details and try again."
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0C0E] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient Background - Keeping it subtle */}
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] opacity-[0.03] -z-10" />

            {/* Main Card - Clerk Style */}
            <div className="w-full max-w-[440px] bg-[#15161A] border border-white/5 rounded-2xl shadow-2xl p-8 relative z-10 transition-all duration-300">

                {/* Logo Area */}
                <div className="flex flex-col items-center mb-8 space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 p-[1px]">
                        <div className="w-full h-full rounded-[11px] bg-[#15161A] flex items-center justify-center text-white">
                            <Sparkles className="h-6 w-6" />
                        </div>
                    </div>
                    <div className="text-center">
                        <h1 className="text-xl font-bold text-white tracking-tight">Create your account</h1>
                        <p className="text-white/40 text-sm mt-1">Welcome! Please fill in the details to get started.</p>
                    </div>
                </div>

                {/* Social Logins */}
                <div className="space-y-3 mb-6">
                    <button type="button" className="w-full h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center gap-3 text-sm font-medium text-white transition-all duration-200">
                        <Chrome className="w-4 h-4" />
                        Continue with Google
                    </button>
                    <button type="button" className="w-full h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-center gap-3 text-sm font-medium text-white transition-all duration-200">
                        <Github className="w-4 h-4" />
                        Continue with GitHub
                    </button>
                </div>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/5"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase text-white/20">
                        <span className="bg-[#15161A] px-2 font-medium">or</span>
                    </div>
                </div>

                {/* Registration Form */}
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-white/60 ml-0.5">First name</label>
                            <input
                                {...form.register("firstName")}
                                className="w-full bg-[#0B0C0E] border border-white/10 rounded-lg h-10 px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                                placeholder="John"
                            />
                            {form.formState.errors.firstName && (
                                <p className="text-xs text-red-400 ml-0.5">{form.formState.errors.firstName.message}</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-white/60 ml-0.5">Last name</label>
                            <input
                                {...form.register("lastName")}
                                className="w-full bg-[#0B0C0E] border border-white/10 rounded-lg h-10 px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                                placeholder="Doe"
                            />
                            {form.formState.errors.lastName && (
                                <p className="text-xs text-red-400 ml-0.5">{form.formState.errors.lastName.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-white/60 ml-0.5">Email address</label>
                        <input
                            {...form.register("email")}
                            className="w-full bg-[#0B0C0E] border border-white/10 rounded-lg h-10 px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                            placeholder="Enter your email"
                            autoComplete="email"
                        />
                        {form.formState.errors.email && (
                            <p className="text-xs text-red-400 ml-0.5">{form.formState.errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-white/60 ml-0.5">Password</label>
                        <input
                            {...form.register("password")}
                            type="password"
                            className="w-full bg-[#0B0C0E] border border-white/10 rounded-lg h-10 px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                            placeholder="••••••••"
                        />
                        {form.formState.errors.password && (
                            <p className="text-xs text-red-400 ml-0.5">{form.formState.errors.password.message}</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-10 bg-white text-black hover:bg-zinc-200 rounded-lg font-bold text-sm mt-2 transition-all"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
                    </Button>
                </form>
            </div>

            {/* Footer */}
            <div className="absolute bottom-8 text-center space-y-4">
                <p className="text-sm text-white/30">
                    Already have an account? <Link href="/sign-in" className="text-purple-500 hover:text-purple-400 font-medium transition-colors">Sign in</Link>
                </p>
                <div className="flex items-center justify-center gap-2 text-white/10 text-xs font-medium">
                    <Lock className="w-3 h-3" />
                    <span>Secured by NavAuth</span>
                </div>
            </div>
        </div>
    );
}
