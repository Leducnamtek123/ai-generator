'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { Link } from '@/i18n/navigation';
import { Loader2, Lock, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import AuthLayout from '@/components/auth/AuthLayout';
import { authApi } from '@/services/authApi';

const passwordChangeSchema = z
    .object({
        password: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string().min(8, 'Confirm your new password'),
    })
    .refine((values) => values.password === values.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;

export default function PasswordChangePage() {
    const searchParams = useSearchParams();
    const hash = searchParams.get('hash') ?? '';
    const [isLoading, setIsLoading] = useState(false);
    const [completed, setCompleted] = useState(false);

    const expires = useMemo(() => searchParams.get('expires'), [searchParams]);
    const hasValidHash = hash.length > 0;

    const form = useForm<PasswordChangeValues>({
        resolver: zodResolver(passwordChangeSchema),
        defaultValues: { password: '', confirmPassword: '' },
    });

    const onSubmit = async (values: PasswordChangeValues) => {
        if (!hasValidHash) {
            toast.error('Invalid reset link', {
                description: 'Request a new password reset email.',
            });
            return;
        }

        setIsLoading(true);
        try {
            await authApi.resetPassword({ hash, password: values.password });
            setCompleted(true);
            toast.success('Password updated', {
                description: 'You can now sign in with your new password.',
            });
        } catch {
            toast.error('Unable to update password', {
                description: 'The reset link may be invalid or expired.',
            });
        } finally {
            setIsLoading(false);
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
                        <p className="auth-card__tagline">Choose a new password</p>
                    </div>
                </div>

                {!hasValidHash ? (
                    <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5">
                        <div className="flex items-start gap-3">
                            <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-300" />
                            <div>
                                <h2 className="text-lg font-semibold text-white">Reset link missing</h2>
                                <p className="mt-2 text-sm text-white/60">
                                    This page needs a valid reset token. Request a new password reset email.
                                </p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <Link href="/forgot-password" className="auth-field__link">
                                Request a new link
                            </Link>
                        </div>
                    </div>
                ) : completed ? (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                        <h2 className="text-lg font-semibold text-white">Password changed</h2>
                        <p className="mt-2 text-sm text-white/60">
                            Your password has been updated successfully. You can sign in now.
                        </p>
                        <div className="mt-4 flex items-center justify-between">
                            <Link href="/sign-in" className="auth-field__link">
                                Go to sign in
                            </Link>
                            <div className="auth-footer__secured">
                                <Lock size={12} aria-hidden="true" />
                                <span>Secured by PaintAI</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white/55">
                            <p>Reset token status</p>
                            <p className="mt-1 break-all font-mono text-[11px] text-white/40">
                                {expires ? `expires=${expires}` : 'No expiry metadata provided'}
                            </p>
                        </div>

                        <div className="auth-field">
                            <label className="auth-field__label" htmlFor="password-change-password">
                                New password
                            </label>
                            <input
                                id="password-change-password"
                                {...form.register('password')}
                                className="auth-field__input"
                                type="password"
                                placeholder="Enter your new password"
                                autoComplete="new-password"
                            />
                            {form.formState.errors.password && (
                                <p className="auth-field__error">{form.formState.errors.password.message}</p>
                            )}
                        </div>

                        <div className="auth-field">
                            <label className="auth-field__label" htmlFor="password-change-confirm">
                                Confirm password
                            </label>
                            <input
                                id="password-change-confirm"
                                {...form.register('confirmPassword')}
                                className="auth-field__input"
                                type="password"
                                placeholder="Confirm your password"
                                autoComplete="new-password"
                            />
                            {form.formState.errors.confirmPassword && (
                                <p className="auth-field__error">{form.formState.errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <button type="submit" disabled={isLoading} className="auth-submit">
                            {isLoading ? <Loader2 className="size-4 animate-spin" /> : 'Update password'}
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    <p className="auth-footer__text">
                        Need another link? <Link href="/forgot-password">Reset password</Link>
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
