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
import { signIn } from 'next-auth/react';

const registerSchema = z.object({
    firstName: z.string().min(2, "First name is too short"),
    lastName: z.string().min(2, "Last name is too short"),
    email: z.email("Invalid email address"),
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
                    <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center p-1 bg-white/5 border border-white/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                        <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-white tracking-tight leading-none">PaintAI</h1>
                        <p className="text-white/40 text-xs font-medium mt-2 tracking-wide uppercase">Your paint, your choice</p>
                    </div>
                </div>

                {/* Social Logins */}
                <div className="space-y-3 mb-6">
                    <button
                        type="button"
                        onClick={() => signIn('google')}
                        className="w-full h-12 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-xl flex items-center justify-center gap-3 text-sm font-semibold text-zinc-900 shadow-sm transition-all duration-200 active:scale-[0.98]"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Sign up with Google
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
