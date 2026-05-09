'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { z } from 'zod';
import { Link } from '@/i18n/navigation';
import { Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import AuthLayout from '@/components/auth/AuthLayout';
import { authApi } from '@/services/authApi';

const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const [submitted, setSubmitted] = useState(false);

    const form = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: '' },
    });

    const onSubmit = async (values: ForgotPasswordValues) => {
        try {
            await authApi.forgotPassword(values.email);
            setSubmitted(true);
            toast.success('Reset link requested', {
                description: 'If the account exists, a password reset email has been sent.',
            });
        } catch (error) {
            if (isAxiosError(error) && error.response?.status === 422) {
                setSubmitted(true);
                toast.success('Reset link requested', {
                    description: 'If the account exists, a password reset email has been sent.',
                });
                return;
            }

            toast.error('Unable to request reset link', {
                description: 'Please try again in a moment.',
            });
        }
    };

    return (
        <AuthLayout variant="sign-in">
            <div className="auth-card">
                <div className="auth-card__logo">
                    <div className="auth-card__logo-icon">
                        <Image src="/logo.svg" alt="PaintAI" width={32} height={32} />
                    </div>
                    <div>
                        <h1 className="auth-card__title">PaintAI</h1>
                        <p className="auth-card__tagline">Reset your password</p>
                    </div>
                </div>

                {submitted ? (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                        <h2 className="text-lg font-semibold text-white">Check your inbox</h2>
                        <p className="mt-2 text-sm text-white/60">
                            If an account exists for that email address, we sent a reset link.
                        </p>
                        <div className="mt-4 flex items-center justify-between">
                            <Link href="/sign-in" className="auth-field__link">
                                Back to sign in
                            </Link>
                            <div className="auth-footer__secured">
                                <Lock size={12} aria-hidden="true" />
                                <span>Secured by PaintAI</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="auth-field">
                            <label className="auth-field__label" htmlFor="forgot-email">
                                Email address
                            </label>
                            <input
                                id="forgot-email"
                                {...form.register('email')}
                                className="auth-field__input"
                                placeholder="Enter your email"
                                autoComplete="email"
                            />
                            {form.formState.errors.email && (
                                <p className="auth-field__error">{form.formState.errors.email.message}</p>
                            )}
                        </div>

                        <button type="submit" disabled={form.formState.isSubmitting} className="auth-submit">
                            {form.formState.isSubmitting ? <Loader2 className="size-4 animate-spin" /> : 'Send reset link'}
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    <p className="auth-footer__text">
                        Remembered your password? <Link href="/sign-in">Sign in</Link>
                    </p>
                    <div className="auth-footer__secured">
                        <Lock size={12} aria-hidden="true" />
                        <span>Secured by PaintAI</span>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}
