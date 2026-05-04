'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useRouter } from '@/i18n/navigation';
import { Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { signIn } from 'next-auth/react';
import AuthLayout from '@/components/auth/AuthLayout';

const loginSchema = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function SignInPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" }
    });

    const onSubmit = async (data: LoginValues) => {
        setIsLoading(true);
        try {
            const result = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
            });

            if (result?.error) {
                toast.error("Login Failed", {
                    description: "Invalid email or password",
                });
            } else {
                toast.success("Welcome back!", {
                    description: "You have successfully logged in."
                });
                router.push('/dashboard');
            }
        } catch (error) {
            toast.error("Login Failed", {
                description: "Something went wrong. Please try again."
            });
        }
        setIsLoading(false);
    };

    return (
        <AuthLayout variant="sign-in">
            <div className="auth-card">
                {/* Logo */}
                <div className="auth-card__logo">
                    <div className="auth-card__logo-icon">
                        <Image src="/logo.svg" alt="PaintAI" width={32} height={32} />
                    </div>
                    <div>
                        <h1 className="auth-card__title">PaintAI</h1>
                        <p className="auth-card__tagline">Your paint, your choice</p>
                    </div>
                </div>

                {/* Google OAuth */}
                <button
                    type="button"
                    onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                    className="auth-social"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign in with Google
                </button>

                {/* Divider */}
                <div className="auth-divider">
                    <hr className="auth-divider__line" />
                    <span className="auth-divider__label">or</span>
                </div>

                {/* Credentials form */}
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="auth-field">
                        <label className="auth-field__label" htmlFor="signin-email">Email address</label>
                        <input
                            id="signin-email"
                            {...form.register("email")}
                            className="auth-field__input"
                            placeholder="Enter your email"
                            autoComplete="email"
                        />
                        {form.formState.errors.email && (
                            <p className="auth-field__error">{form.formState.errors.email.message}</p>
                        )}
                    </div>

                    <div className="auth-field">
                        <div className="auth-field__header">
                            <label className="auth-field__label" htmlFor="signin-password">Password</label>
                            <Link href="#" className="auth-field__link">Forgot?</Link>
                        </div>
                        <input
                            id="signin-password"
                            {...form.register("password")}
                            type="password"
                            className="auth-field__input"
                            placeholder="••••••••"
                            autoComplete="current-password"
                        />
                        {form.formState.errors.password && (
                            <p className="auth-field__error">{form.formState.errors.password.message}</p>
                        )}
                    </div>

                    <button type="submit" disabled={isLoading} className="auth-submit">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
                    </button>
                </form>

                {/* Footer */}
                <div className="auth-footer">
                    <p className="auth-footer__text">
                        Don&apos;t have an account?{' '}
                        <Link href="/sign-up">Sign up</Link>
                    </p>
                    <div className="auth-footer__secured">
                        <Lock size={12} aria-hidden="true" />
                        <span>Secured by NavAuth</span>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}
